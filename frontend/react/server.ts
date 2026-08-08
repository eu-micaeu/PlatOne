import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { MongoClient, MongoServerError, ObjectId, type Collection, type WithId } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env and local .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const STEAM_STATE_TTL_SECONDS = 10 * 60;

type UserRecord = {
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  pinnedPlatinumIds?: string[];
  createdAt: Date;
  steam?: {
    steamId: string;
    linkedAt: Date;
  };
  xbox?: {
    gamertag: string;
    linkedAt: Date;
  };
  xboxApiKey?: string;
};

type SessionRecord = {
  token: string;
  userId: ObjectId;
  createdAt: Date;
};

type SteamStateRecord = {
  state: string;
  userId: ObjectId;
  createdAt: Date;
};

type FriendRecord = {
  _id?: ObjectId;
  requesterId: ObjectId;
  recipientId: ObjectId;
  status: "pending" | "accepted";
  createdAt: Date;
};

type ChatMessageRecord = {
  _id?: ObjectId;
  senderId: string;
  receiverId: string;
  content: string;
  read?: boolean;
  createdAt: Date;
};

type SafeUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  pinnedPlatinumIds?: string[];
  createdAt: string;
  steamConnected: boolean;
  xboxConnected: boolean;
};

type AuthedRequest = express.Request & {
  user?: WithId<UserRecord>;
  token?: string;
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://backend:8085";
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.MONGO_URI ?? "mongodb://mongodb:27017";
const MONGO_DB = process.env.MONGO_DB ?? "platone";
const AUTH_USERS_COLLECTION = process.env.AUTH_USERS_COLLECTION ?? "auth_users";
const AUTH_SESSIONS_COLLECTION = process.env.AUTH_SESSIONS_COLLECTION ?? "auth_sessions";
const AUTH_STEAM_STATES_COLLECTION = process.env.AUTH_STEAM_STATES_COLLECTION ?? "auth_steam_states";

function getAppBaseURL(req?: express.Request): string {
  const envUrl = process.env.APP_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    let cleaned = envUrl.trim().replace(/\/+$/, "");
    if (cleaned.endsWith("/api")) {
      cleaned = cleaned.slice(0, -4).replace(/\/+$/, "");
    }
    if (cleaned) {
      return cleaned;
    }
  }

  if (req) {
    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
    if (host) {
      return `${proto}://${host}`;
    }
  }

  return "http://localhost:3005";
}

function hashPassword(rawPassword: string): string {
  return crypto.createHash("sha256").update(rawPassword).digest("hex");
}

function createToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function sanitizeUser(user: WithId<UserRecord>): SafeUser {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    pinnedPlatinumIds: user.pinnedPlatinumIds || [],
    createdAt: user.createdAt.toISOString(),
    steamConnected: Boolean(user.steam?.steamId),
    xboxConnected: Boolean(user.xbox?.gamertag),
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}

function getTokenFromRequest(req: express.Request): string | null {
  const authHeader = req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

function buildAuthMiddleware(
  usersCollection: Collection<UserRecord>,
  sessionsCollection: Collection<SessionRecord>
) {
  return async (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    try {
      const session = await sessionsCollection.findOne({ token });
      if (!session) {
        res.status(401).json({ error: "Sessao invalida" });
        return;
      }

      const user = await usersCollection.findOne({ _id: session.userId });
      if (!user) {
        await sessionsCollection.deleteOne({ token });
        res.status(401).json({ error: "Sessao invalida" });
        return;
      }

      req.token = token;
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Erro interno ao validar sessao." });
    }
  };
}

async function createSession(
  sessionsCollection: Collection<SessionRecord>,
  userId: ObjectId
): Promise<string> {
  const token = createToken();
  await sessionsCollection.insertOne({
    token,
    userId,
    createdAt: new Date(),
  });
  return token;
}

async function proxyBackendGet(pathname: string, res: express.Response) {
  try {
    const response = await fetch(`${BACKEND_URL}${pathname}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const body = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", contentType);

    if (!body) {
      res.send();
      return;
    }

    res.send(body);
  } catch (error) {
    console.error(`Error proxying ${pathname} to backend:`, error);
    res.status(502).json({ error: "Falha ao consultar dados no backend." });
  }
}

async function proxyBackendWithJSON(
  pathname: string,
  method: "POST" | "PUT" | "DELETE",
  payload: unknown,
  res: express.Response
) {
  try {
    const response = await fetch(`${BACKEND_URL}${pathname}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const body = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", contentType);

    if (!body) {
      res.send();
      return;
    }

    res.send(body);
  } catch (error) {
    console.error(`Error proxying ${method} ${pathname} to backend:`, error);
    res.status(502).json({ error: "Falha ao consultar dados no backend." });
  }
}

async function proxyBackendWithoutBody(
  pathname: string,
  method: "POST" | "PUT" | "DELETE",
  res: express.Response
) {
  try {
    const response = await fetch(`${BACKEND_URL}${pathname}`, {
      method,
      headers: {
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const body = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", contentType);

    if (!body) {
      res.send();
      return;
    }

    res.send(body);
  } catch (error) {
    console.error(`Error proxying ${method} ${pathname} to backend:`, error);
    res.status(502).json({ error: "Falha ao consultar dados no backend." });
  }
}

async function proxyBackendGameAchievements(steamID: string, gameID: string, res: express.Response) {
  try {
    const encodedSteamID = encodeURIComponent(steamID);
    const encodedGameID = encodeURIComponent(gameID);
    const response = await fetch(`${BACKEND_URL}/api/achievements/${encodedSteamID}/${encodedGameID}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const body = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", contentType);

    if (!body) {
      res.send();
      return;
    }

    res.send(body);
  } catch (error) {
    console.error("Error proxying achievements request to backend:", error);
    res.status(502).json({ error: "Falha ao consultar conquistas do jogo no backend." });
  }
}

function createSteamState(): string {
  return crypto.randomBytes(24).toString("hex");
}

function buildSteamConnectURL(state: string, req?: express.Request): string {
  const baseUrl = getAppBaseURL(req);
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${baseUrl}/api/steam/callback?state=${encodeURIComponent(state)}`,
    "openid.realm": baseUrl,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

function getQueryParam(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return "";
}

function buildAppRedirect(status: string, req?: express.Request): string {
  const baseUrl = getAppBaseURL(req);
  const encodedStatus = encodeURIComponent(status);
  return `${baseUrl}/home?steam=${encodedStatus}`;
}

function extractSteamIDFromClaimedID(claimedID: string): string {
  const match = claimedID.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/i);
  return match?.[1] ?? "";
}

function slugifyProfileName(rawName: string): string {
  return rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findUserByProfileName(
  usersCollection: Collection<UserRecord>,
  profileName: string
): Promise<WithId<UserRecord> | null> {
  const normalizedName = decodeURIComponent(profileName).trim();
  if (!normalizedName) {
    return null;
  }

  const exactMatchRegex = new RegExp(`^${escapeRegex(normalizedName)}$`, "i");
  const exactUser = await usersCollection.findOne({ name: exactMatchRegex });
  if (exactUser) {
    return exactUser;
  }

  const targetSlug = slugifyProfileName(normalizedName);
  if (!targetSlug) {
    return null;
  }

  const users = await usersCollection.find({}).toArray();
  for (const candidate of users) {
    if (slugifyProfileName(candidate.name) === targetSlug) {
      return candidate;
    }
  }

  return null;
}

async function validateSteamOpenID(req: express.Request): Promise<boolean> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (!key.startsWith("openid.")) {
      continue;
    }

    const paramValue = getQueryParam(value);
    if (paramValue) {
      params.set(key, paramValue);
    }
  }

  if (!params.get("openid.signed") || !params.get("openid.sig")) {
    return false;
  }

  params.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    return false;
  }

  const body = await response.text();
  return body.includes("is_valid:true");
}

async function proxyBackendSync(steamID: string): Promise<Response> {
  const encodedSteamID = encodeURIComponent(steamID);
  return fetch(`${BACKEND_URL}/api/sync/${encodedSteamID}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
}

async function fetchPublicXboxProfileGames(gamertag: string) {
  const tagVariants = Array.from(
    new Set([gamertag, gamertag.replace("#", ""), gamertag.split("#")[0]])
  ).filter(Boolean);

  for (const tag of tagVariants) {
    const url = `https://xboxgamertag.com/search/${encodeURIComponent(tag)}`;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) continue;

      const html = await response.text();
      const games: Array<{
        title: string;
        img: string;
        unlocked: number;
        currentGs: number;
        totalGs: number;
      }> = [];

      const cardRegex =
        /<div class="game-card-cover"\s*style="[^"]*url\(['"]?([^'"]+)['"]?\)[^"]*">[\s\S]*?<h3>\s*(.*?)\s*<\/h3>[\s\S]*?<div class="col-9 font-weight-bold">\s*(\d+)\s*\/\s*(\d+)[\s\S]*?<div class="col-9 font-weight-bold">\s*(\d+)\s*unlocked/gi;

      let match: RegExpExecArray | null;
      while ((match = cardRegex.exec(html)) !== null) {
        let img = match[1];
        if (img.includes("url=")) {
          img = decodeURIComponent(img.split("url=")[1].split("&")[0]);
        }
        if (img.startsWith("//")) img = "https:" + img;

        const title = match[2].replace(/<[^>]+>/g, "").trim();
        const currentGs = parseInt(match[3], 10) || 0;
        const totalGs = parseInt(match[4], 10) || 0;
        const unlocked = parseInt(match[5], 10) || 0;

        if (title) {
          games.push({ title, img, currentGs, totalGs, unlocked });
        }
      }

      if (games.length > 0) {
        return games;
      }
    } catch (err) {
      console.log("[Xbox Sync] Public scraper error for tag:", tag, err);
    }
  }

  return [];
}

async function syncRealXboxGames(
  rawGamertag: string,
  userId: string,
  apiKey: string,
  platinumsCollection: Collection
) {
  const gamertag = rawGamertag.trim();
  if (!gamertag) {
    throw new Error("Informe um Gamertag do Xbox válido.");
  }

  let gamesToSave: Array<{
    external_id: string;
    title: string;
    unlockedCount: number;
    totalAchievements: number;
    isPlatinum: boolean;
    icon: string;
  }> = [];

  // Try OpenXBL API if API Key is available
  if (apiKey) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Authorization": apiKey,
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
    };

    const tagVariants = Array.from(
      new Set([gamertag, gamertag.replace("#", ""), gamertag.split("#")[0]])
    ).filter(Boolean);

    let xuid = "";
    for (const tag of tagVariants) {
      const searchUrl = `https://xbl.io/api/v2/friends/search?gamertag=${encodeURIComponent(tag)}`;
      try {
        const searchRes = await fetch(searchUrl, { headers });
        if (searchRes.ok) {
          const searchData = (await searchRes.json()) as any;
          xuid =
            searchData?.profileUsers?.[0]?.id ??
            searchData?.xuid ??
            searchData?.people?.[0]?.xuid ??
            "";
          if (xuid) break;
        }
      } catch (err) {
        console.log("[Xbox Sync] XBL search error for tag variant:", tag, err);
      }
    }

    if (xuid) {
      const fetchUrls = [
        `https://xbl.io/api/v2/achievements/player/${xuid}`,
        `https://xbl.io/api/v2/player/titleHistory/${xuid}`,
      ];

      for (const url of fetchUrls) {
        try {
          const response = await fetch(url, { headers });
          if (response.ok) {
            const payload = (await response.json()) as any;
            const titles = payload?.titles ?? payload?.results ?? payload?.titleHistory ?? [];
            if (Array.isArray(titles) && titles.length > 0) {
              gamesToSave = titles.map((t: any) => {
                const titleId = String(t.titleId ?? t.id ?? "").trim();
                const name = String(t.name ?? t.titleName ?? "Jogo Xbox").trim();
                const unlockedCount = Number(t.earnedAchievements ?? t.currentAchievements ?? 0);
                const totalAchievements = Number(t.totalAchievements ?? t.maxAchievements ?? 0);
                const isPlatinum = unlockedCount >= totalAchievements && totalAchievements > 0;
                const icon =
                  String(t.displayImage ?? t.tileImg ?? t.boxArt ?? "").trim() ||
                  "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500&q=80";

                return {
                  external_id: titleId || `xbox_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
                  title: name,
                  unlockedCount,
                  totalAchievements,
                  isPlatinum,
                  icon,
                };
              });
              break;
            }
          }
        } catch (err) {
          console.log("[Xbox Sync] OpenXBL fetch error:", err);
        }
      }
    }
  }

  // Fallback to Public Profile Scraper if OpenXBL didn't return titles
  if (gamesToSave.length === 0) {
    const publicGames = await fetchPublicXboxProfileGames(gamertag);
    if (publicGames.length > 0) {
      gamesToSave = publicGames.map((g) => {
        const titleId = `xbox_${g.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
        const totalAchievements = g.unlocked > 0 ? Math.max(g.unlocked, 25) : 50;
        const isPlatinum = g.unlocked >= totalAchievements && totalAchievements > 0;
        const icon = g.img || "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500&q=80";

        return {
          external_id: titleId,
          title: g.title,
          unlockedCount: g.unlocked,
          totalAchievements,
          isPlatinum,
          icon,
        };
      });
    }
  }

  if (gamesToSave.length === 0) {
    throw new Error(
      `Não foi possível carregar os jogos do Gamertag '${gamertag}'. Verifique se o Gamertag está correto e visível publicamente na Xbox Live.`
    );
  }

  // Save all extracted games to MongoDB
  for (const game of gamesToSave) {
    await platinumsCollection.updateOne(
      {
        platform: "Xbox",
        "metadata.external_id": game.external_id,
        "metadata.platform_user_id": gamertag,
      },
      {
        $set: {
          title: game.title,
          platform: "Xbox",
          external_id: game.external_id,
          unlocked_count: game.unlockedCount,
          total_achievements: game.totalAchievements,
          is_platinum: game.isPlatinum,
          validation_date: new Date(),
          metadata: {
            platform_user_id: gamertag,
            user_id: userId,
            external_id: game.external_id,
            title: game.title,
            platform: "Xbox",
            icon: game.icon,
            unlocked_count: game.unlockedCount,
            total_achievements: game.totalAchievements,
          },
        },
      },
      { upsert: true }
    );
  }
}

async function startServer() {
  const mongoClient = new MongoClient(DATABASE_URL);
  await mongoClient.connect();

  const db = mongoClient.db(MONGO_DB);
  const usersCollection = db.collection<UserRecord>(AUTH_USERS_COLLECTION);
  const sessionsCollection = db.collection<SessionRecord>(AUTH_SESSIONS_COLLECTION);
  const steamStatesCollection = db.collection<SteamStateRecord>(AUTH_STEAM_STATES_COLLECTION);
  const platinumsCollection = db.collection("platinums");
  const friendsCollection = db.collection<FriendRecord>("friends");
  const chatMessagesCollection = db.collection<ChatMessageRecord>("chat_messages");
  const emailVerificationsCollection = db.collection("email_verifications");

  await Promise.all([
    usersCollection.createIndex({ email: 1 }, { unique: true }),
    sessionsCollection.createIndex({ token: 1 }, { unique: true }),
    steamStatesCollection.createIndex({ state: 1 }, { unique: true }),
    steamStatesCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: STEAM_STATE_TTL_SECONDS }),
    emailVerificationsCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  await usersCollection.updateOne(
    { email: "demo@platone.dev" },
    {
      $setOnInsert: {
        name: "Demo User",
        email: "demo@platone.dev",
        passwordHash: hashPassword("123456"),
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  const app = express();
  const httpServer = createHttpServer(app);
  const authMiddleware = buildAuthMiddleware(usersCollection, sessionsCollection);

  app.use(express.json());

  // Helper para disparo real de e-mail via Resend REST API
  const sendEmailViaResend = async (toEmail: string, code: string) => {
    const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
    const fromAddress = (process.env.SMTP_FROM || "PlatOne <no-reply@platone.xyz>").trim();

    if (!resendApiKey) {
      throw new Error("Nenhuma chave RESEND_API_KEY foi configurada no arquivo .env");
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificação de E-mail - PlatOne</title>
</head>
<body style="margin: 0; padding: 48px 12px; background-color: #000000; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #ffffff;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="440" style="max-width: 440px; width: 100%;">
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <svg width="32" height="32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M78.5 16.6667C81.4377 16.6676 84.323 17.445 86.8635 18.9202C89.404 20.3953 91.5095 22.5158 92.9666 25.0667L100 37.3667L107.033 25.0667C108.49 22.5158 110.596 20.3953 113.136 18.9202C115.677 17.445 118.562 16.6676 121.5 16.6667H159.483C161.673 16.6659 163.824 17.2404 165.722 18.3325C167.62 19.4247 169.198 20.9963 170.297 22.8899C171.397 24.7835 171.98 26.9327 171.988 29.1223C171.995 31.312 171.428 33.4653 170.342 35.3667L142.158 84.6833C150.056 92.9413 155.354 103.337 157.395 114.579C159.436 125.822 158.131 137.416 153.64 147.924C149.15 158.431 141.673 167.388 132.137 173.683C122.601 179.978 111.426 183.334 100 183.334C88.5736 183.334 77.3988 179.978 67.8629 173.683C58.3269 167.388 50.8497 158.431 46.3595 147.924C41.8693 137.416 40.5637 125.822 42.605 114.579C44.6462 103.337 49.9443 92.9413 57.8416 84.6833L29.6583 35.3667C28.5722 33.4653 28.0046 31.312 28.0124 29.1223C28.0202 26.9327 28.603 24.7835 29.7025 22.8899C30.8021 20.9963 32.3797 19.4247 34.2776 18.3325C36.1755 17.2404 38.3269 16.6659 40.5166 16.6667H78.5ZM100 83.3333C88.9493 83.3333 78.3512 87.7232 70.5372 95.5372C62.7232 103.351 58.3333 113.949 58.3333 125C58.3333 136.051 62.7232 146.649 70.5372 154.463C78.3512 162.277 88.9493 166.667 100 166.667C111.051 166.667 121.649 162.277 129.463 154.463C137.277 146.649 141.667 136.051 141.667 125C141.667 113.949 137.277 103.351 129.463 95.5372C121.649 87.7232 111.051 83.3333 100 83.3333ZM100 108.333C104.42 108.333 108.659 110.089 111.785 113.215C114.911 116.34 116.667 120.58 116.667 125C116.667 129.42 114.911 133.659 111.785 136.785C108.659 139.911 104.42 141.667 100 141.667C95.5797 141.667 91.3405 139.911 88.2149 136.785C85.0892 133.659 83.3333 129.42 83.3333 125C83.3333 120.58 85.0892 116.34 88.2149 113.215C91.3405 110.089 95.5797 108.333 100 108.333ZM152.308 33.3333H121.5L109.6 54.1667L118.433 69.6417C122.106 70.8639 125.592 72.4194 128.892 74.3083L152.308 33.3333ZM78.5 33.3333H47.6916L71.1083 74.3083C79.1933 69.69 88.2713 67.0861 97.575 66.7167L78.5 33.3333Z" fill="#ffffff"/>
                    </svg>
                  </td>
                  <td style="padding-left: 10px; vertical-align: middle;">
                    <span style="font-family: sans-serif; font-size: 20px; font-weight: 700; color: #ffffff;">
                      PlatOne
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 12px; padding: 36px 32px;">
              <div style="font-family: monospace; font-size: 10px; color: #a1a1aa; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px;">
                // CONFIRMAÇÃO DE E-MAIL
              </div>
              <h1 style="font-family: sans-serif; color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">
                Código de verificação
              </h1>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 28px 0;">
                Insira o código abaixo para confirmar a propriedade deste e-mail.
              </p>
              <div style="background-color: #000000; border: 1px solid #27272a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <div style="font-family: monospace; font-size: 32px; font-weight: 600; color: #ffffff; letter-spacing: 8px; padding-left: 8px;">
                  ${code}
                </div>
              </div>
              <div style="font-family: monospace; font-size: 11px; color: #71717a; margin-bottom: 28px;">
                Este código expira em <span style="color: #a1a1aa;">15 minutos</span>.
              </div>
              <div style="height: 1px; background-color: #27272a; margin-bottom: 20px;"></div>
              <p style="color: #71717a; font-size: 12px; line-height: 1.4; margin: 0;">
                Se você não solicitou este código, nenhuma ação é necessária.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 24px;">
              <span style="font-family: monospace; font-size: 11px; color: #52525b;">
                PlatOne &copy; 2026
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject: "Código de Verificação - PlatOne",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Falha no Resend (status ${response.status}): ${errText}`);
    }

    return await response.json();
  };

  // Endpoint para solicitar o envio do código por e-mail
  app.post("/api/auth/send-verification", async (req, res) => {
    const rawEmail = String(req.body?.email ?? "").trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes("@")) {
      res.status(400).json({ error: "Endereço de e-mail inválido." });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      await emailVerificationsCollection.updateOne(
        { email: rawEmail },
        {
          $set: {
            email: rawEmail,
            code,
            attempts: 0,
            expiresAt,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      await sendEmailViaResend(rawEmail, code);

      res.json({ message: "Código de verificação enviado com sucesso via Resend!" });
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de verificação:", error);
      res.status(500).json({ error: error?.message || "Erro ao enviar e-mail de verificação." });
    }
  });

  // Endpoint para validar o código de 6 dígitos
  app.post("/api/auth/verify-code", async (req, res) => {
    const rawEmail = String(req.body?.email ?? "").trim().toLowerCase();
    const code = String(req.body?.code ?? "").trim();

    if (!rawEmail || !code) {
      res.status(400).json({ error: "E-mail e código são obrigatórios." });
      return;
    }

    try {
      const record = await emailVerificationsCollection.findOne({ email: rawEmail });
      if (!record) {
        res.status(400).json({ error: "Nenhum código pendente encontrado para este e-mail." });
        return;
      }

      if (new Date() > new Date(record.expiresAt)) {
        await emailVerificationsCollection.deleteOne({ email: rawEmail });
        res.status(401).json({ error: "O código de verificação expirou. Solicite um novo código." });
        return;
      }

      if (record.attempts >= 5) {
        await emailVerificationsCollection.deleteOne({ email: rawEmail });
        res.status(429).json({ error: "Número máximo de tentativas excedido. Solicite um novo código." });
        return;
      }

      if (record.code !== code) {
        await emailVerificationsCollection.updateOne({ email: rawEmail }, { $inc: { attempts: 1 } });
        res.status(401).json({ error: "Código de verificação incorreto." });
        return;
      }

      await usersCollection.updateOne({ email: rawEmail }, { $set: { isEmailVerified: true } });
      await emailVerificationsCollection.deleteOne({ email: rawEmail });

      res.json({ message: "E-mail verificado com sucesso!" });
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      res.status(500).json({ error: "Erro ao verificar código." });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const nickname = String(req.body?.nickname ?? req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!nickname || !email || !password) {
      res.status(400).json({ error: "Preencha nickname, email e senha." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }

    try {
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        res.status(409).json({ error: "Email ja cadastrado." });
        return;
      }

      const newUser: UserRecord = {
        name: nickname,
        email,
        passwordHash: hashPassword(password),
        createdAt: new Date(),
      };

      const insertResult = await usersCollection.insertOne(newUser);
      const storedUser = await usersCollection.findOne({ _id: insertResult.insertedId });

      if (!storedUser) {
        res.status(500).json({ error: "Erro ao criar usuario." });
        return;
      }

      const token = await createSession(sessionsCollection, storedUser._id);

      res.status(201).json({
        token,
        user: sanitizeUser(storedUser),
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ error: "Email ja cadastrado." });
        return;
      }

      console.error("Register failed:", error);
      res.status(500).json({ error: "Erro ao criar conta." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      res.status(400).json({ error: "Informe email e senha." });
      return;
    }

    try {
      const user = await usersCollection.findOne({ email });
      if (!user || user.passwordHash !== hashPassword(password)) {
        res.status(401).json({ error: "Credenciais invalidas." });
        return;
      }

      const token = await createSession(sessionsCollection, user._id);

      res.json({
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error("Login failed:", error);
      res.status(500).json({ error: "Erro ao autenticar." });
    }
  });

  app.get("/api/auth/me", authMiddleware, (req: AuthedRequest, res) => {
    res.json({ user: sanitizeUser(req.user as WithId<UserRecord>) });
  });

  app.put("/api/user/avatar", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      const rawAvatar = req.body?.avatarUrl;
      const avatarUrl = typeof rawAvatar === "string" ? rawAvatar.trim() : "";

      await usersCollection.updateOne(
        { _id: userId },
        { $set: { avatarUrl } }
      );

      const updatedUser = await usersCollection.findOne({ _id: userId });
      if (!updatedUser) {
        res.status(404).json({ error: "Usuario nao encontrado." });
        return;
      }

      res.json({ user: sanitizeUser(updatedUser) });
    } catch (error) {
      console.error("Update avatar error:", error);
      res.status(500).json({ error: "Erro ao atualizar avatar do usuario." });
    }
  });

  app.put("/api/user/pinned-platinums", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      const rawIds = req.body?.pinnedIds;
      if (!Array.isArray(rawIds)) {
        res.status(400).json({ error: "Informe uma lista de IDs de platinas." });
        return;
      }

      const pinnedIds = rawIds
        .filter((id) => typeof id === "string" && id.trim().length > 0)
        .slice(0, 3);

      await usersCollection.updateOne(
        { _id: userId },
        { $set: { pinnedPlatinumIds: pinnedIds } }
      );

      const updatedUser = await usersCollection.findOne({ _id: userId });
      if (!updatedUser) {
        res.status(404).json({ error: "Usuario nao encontrado." });
        return;
      }

      res.json({ user: sanitizeUser(updatedUser) });
    } catch (error) {
      console.error("Update pinned platinums error:", error);
      res.status(500).json({ error: "Erro ao atualizar platinas em destaque." });
    }
  });

  // Friends & Chat Endpoints
  app.get("/api/friends", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      const friendLinks = await friendsCollection
        .find({
          $or: [{ requesterId: userId }, { recipientId: userId }],
        })
        .toArray();

      const userIdStr = userId.toHexString();
      const realFriends: unknown[] = [];
      const incomingRequests: unknown[] = [];
      const outgoingRequests: unknown[] = [];
      const unreadMessages: unknown[] = [];

      for (const link of friendLinks) {
        if (link.status === "accepted") {
          const friendObjId = link.requesterId.equals(userId) ? link.recipientId : link.requesterId;
          const u = await usersCollection.findOne({ _id: friendObjId });
          if (u) {
            const friendIdStr = u._id.toHexString();
            const unreadCount = await chatMessagesCollection.countDocuments({
              senderId: friendIdStr,
              receiverId: userIdStr,
              read: { $ne: true },
            });

            if (unreadCount > 0) {
              const lastMsg = await chatMessagesCollection
                .find({ senderId: friendIdStr, receiverId: userIdStr, read: { $ne: true } })
                .sort({ createdAt: -1 })
                .limit(1)
                .next();

              unreadMessages.push({
                friendId: friendIdStr,
                friendName: u.name,
                friendAvatarUrl: u.avatarUrl || null,
                lastMessage: lastMsg?.content || "Nova mensagem",
                unreadCount,
                createdAt: lastMsg ? lastMsg.createdAt.toISOString() : new Date().toISOString(),
              });
            }

            realFriends.push({
              id: friendIdStr,
              name: u.name,
              avatarUrl: u.avatarUrl || null,
              status: "online",
              currentGame: "No PlatOne",
              lastSeen: "Online agora",
              unreadCount,
            });
          }
        } else if (link.status === "pending") {
          if (link.recipientId.equals(userId)) {
            const sender = await usersCollection.findOne({ _id: link.requesterId });
            if (sender) {
              incomingRequests.push({
                id: link._id?.toHexString(),
                user: {
                  id: sender._id.toHexString(),
                  name: sender.name,
                  avatarUrl: sender.avatarUrl || null,
                },
                createdAt: link.createdAt.toISOString(),
              });
            }
          } else if (link.requesterId.equals(userId)) {
            const target = await usersCollection.findOne({ _id: link.recipientId });
            if (target) {
              outgoingRequests.push({
                id: link._id?.toHexString(),
                user: {
                  id: target._id.toHexString(),
                  name: target.name,
                  avatarUrl: target.avatarUrl || null,
                },
                createdAt: link.createdAt.toISOString(),
              });
            }
          }
        }
      }

      res.json({
        friends: realFriends,
        incomingRequests,
        outgoingRequests,
        unreadMessages,
      });
    } catch (error) {
      console.error("Get friends error:", error);
      res.status(500).json({ error: "Erro ao buscar amigos." });
    }
  });

  app.post("/api/friends/add", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      const query = String(req.body?.query ?? "").trim();
      if (!query) {
        res.status(400).json({ error: "Informe o nome ou email do amigo." });
        return;
      }

      const targetUser = await usersCollection.findOne({
        $or: [{ name: { $regex: `^${query}$`, $options: "i" } }, { email: query.toLowerCase() }],
      });

      if (!targetUser) {
        res.status(404).json({ error: "Usuario nao encontrado no PlatOne." });
        return;
      }

      if (targetUser._id.equals(userId)) {
        res.status(400).json({ error: "Voce nao pode adicionar a si mesmo." });
        return;
      }

      const existing = await friendsCollection.findOne({
        $or: [
          { requesterId: userId, recipientId: targetUser._id },
          { requesterId: targetUser._id, recipientId: userId },
        ],
      });

      if (existing) {
        if (existing.status === "accepted") {
          res.status(409).json({ error: "Este jogador ja e seu amigo!" });
          return;
        }
        if (existing.requesterId.equals(userId)) {
          res.status(409).json({ error: "Convite de amizade ja enviado! Aguardando aceite." });
          return;
        }
        res.status(400).json({ error: "Este jogador ja te enviou um convite! Verifique seus convites pendentes." });
        return;
      }

      await friendsCollection.insertOne({
        requesterId: userId,
        recipientId: targetUser._id,
        status: "pending",
        createdAt: new Date(),
      });

      res.status(201).json({
        message: "Convite de amizade enviado com sucesso!",
      });
    } catch (error) {
      console.error("Add friend request error:", error);
      res.status(500).json({ error: "Erro ao enviar convite de amizade." });
    }
  });

  app.post("/api/friends/requests/:requestId/accept", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      const requestIdStr = req.params?.requestId;
      if (!userId || !requestIdStr) {
        res.status(400).json({ error: "Requisicao invalida." });
        return;
      }

      let reqObjId: ObjectId;
      try {
        reqObjId = new ObjectId(requestIdStr);
      } catch {
        res.status(400).json({ error: "ID de convite invalido." });
        return;
      }

      const link = await friendsCollection.findOne({
        _id: reqObjId,
        recipientId: userId,
        status: "pending",
      });

      if (!link) {
        res.status(404).json({ error: "Convite de amizade nao encontrado." });
        return;
      }

      await friendsCollection.updateOne({ _id: reqObjId }, { $set: { status: "accepted" } });

      const senderUser = await usersCollection.findOne({ _id: link.requesterId });

      res.json({
        message: "Convite de amizade aceito!",
        friend: senderUser
          ? {
              id: senderUser._id.toHexString(),
              name: senderUser.name,
              avatarUrl: senderUser.avatarUrl || null,
              status: "online",
              currentGame: "No PlatOne",
              lastSeen: "Online agora",
            }
          : null,
      });
    } catch (error) {
      console.error("Accept friend request error:", error);
      res.status(500).json({ error: "Erro ao aceitar convite de amizade." });
    }
  });

  app.post("/api/friends/requests/:requestId/reject", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      const requestIdStr = req.params?.requestId;
      if (!userId || !requestIdStr) {
        res.status(400).json({ error: "Requisicao invalida." });
        return;
      }

      let reqObjId: ObjectId;
      try {
        reqObjId = new ObjectId(requestIdStr);
      } catch {
        res.status(400).json({ error: "ID de convite invalido." });
        return;
      }

      await friendsCollection.deleteOne({
        _id: reqObjId,
        $or: [{ recipientId: userId }, { requesterId: userId }],
      });

      res.status(204).send();
    } catch (error) {
      console.error("Reject friend request error:", error);
      res.status(500).json({ error: "Erro ao recusar convite de amizade." });
    }
  });

  app.delete("/api/friends/:friendId", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      const friendIdStr = req.params?.friendId;
      if (!userId || !friendIdStr) {
        res.status(400).json({ error: "Requisicao invalida." });
        return;
      }

      let friendObjId: ObjectId;
      try {
        friendObjId = new ObjectId(friendIdStr);
      } catch {
        res.status(400).json({ error: "ID de amigo invalido." });
        return;
      }

      await friendsCollection.deleteMany({
        $or: [
          { requesterId: userId, recipientId: friendObjId },
          { requesterId: friendObjId, recipientId: userId },
        ],
      });

      res.status(204).send();
    } catch (error) {
      console.error("Remove friend error:", error);
      res.status(500).json({ error: "Erro ao remover amigo." });
    }
  });

  app.get("/api/chat/:friendId", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userIdStr = req.user?._id.toHexString();
      const friendId = req.params?.friendId;
      if (!userIdStr || !friendId) {
        res.status(400).json({ error: "Requisicao invalida." });
        return;
      }

      // Mark messages as read when opening chat
      await chatMessagesCollection.updateMany(
        { senderId: friendId, receiverId: userIdStr, read: { $ne: true } },
        { $set: { read: true } }
      );

      const messages = await chatMessagesCollection
        .find({
          $or: [
            { senderId: userIdStr, receiverId: friendId },
            { senderId: friendId, receiverId: userIdStr },
          ],
        })
        .sort({ createdAt: 1 })
        .toArray();

      const formatted = messages.map((m) => ({
        id: m._id ? m._id.toHexString() : String(Math.random()),
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));

      res.json({ messages: formatted });
    } catch (error) {
      console.error("Get chat messages error:", error);
      res.status(500).json({ error: "Erro ao buscar mensagens do chat." });
    }
  });

  app.post("/api/chat/:friendId", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userIdStr = req.user?._id.toHexString();
      const friendId = req.params?.friendId;
      const content = String(req.body?.content ?? "").trim();

      if (!userIdStr || !friendId || !content) {
        res.status(400).json({ error: "Mensagem invalida." });
        return;
      }

      const userMessageRecord: ChatMessageRecord = {
        senderId: userIdStr,
        receiverId: friendId,
        content,
        read: false,
        createdAt: new Date(),
      };

      const result = await chatMessagesCollection.insertOne(userMessageRecord);
      const insertedMessage = {
        id: result.insertedId.toHexString(),
        senderId: userIdStr,
        receiverId: friendId,
        content,
        createdAt: userMessageRecord.createdAt.toISOString(),
      };

      res.status(201).json({ message: insertedMessage });
    } catch (error) {
      console.error("Send chat message error:", error);
      res.status(500).json({ error: "Erro ao enviar mensagem." });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      if (req.token) {
        await sessionsCollection.deleteOne({ token: req.token });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Logout failed:", error);
      res.status(500).json({ error: "Erro ao encerrar sessao." });
    }
  });

  app.delete("/api/auth/account", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      await Promise.all([
        usersCollection.deleteOne({ _id: userId }),
        sessionsCollection.deleteMany({ userId }),
        steamStatesCollection.deleteMany({ userId }),
      ]);

      res.status(204).send();
    } catch (error) {
      console.error("Delete account failed:", error);
      res.status(500).json({ error: "Nao foi possivel apagar sua conta." });
    }
  });

  app.get("/api/steam/status", authMiddleware, (req: AuthedRequest, res) => {
    const steam = req.user?.steam;
    res.json({
      connected: Boolean(steam?.steamId),
      steamId: steam?.steamId ?? null,
      linkedAt: steam?.linkedAt ? steam.linkedAt.toISOString() : null,
    });
  });

  app.post("/api/steam/connect", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      if (!req.user?._id) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      const state = createSteamState();
      await steamStatesCollection.insertOne({
        state,
        userId: req.user._id,
        createdAt: new Date(),
      });

      res.json({ url: buildSteamConnectURL(state, req) });
    } catch (error) {
      console.error("Steam connect initialization failed:", error);
      res.status(500).json({ error: "Nao foi possivel iniciar conexao com a Steam." });
    }
  });

  app.get("/api/steam/callback", async (req, res) => {
    const state = getQueryParam(req.query.state).trim();
    if (!state) {
      res.redirect(buildAppRedirect("missing_state", req));
      return;
    }

    try {
      const stateResult = await steamStatesCollection.findOneAndDelete({ state });
      if (!stateResult || !stateResult.userId) {
        res.redirect(buildAppRedirect("invalid_state", req));
        return;
      }

      const validAssertion = await validateSteamOpenID(req);
      if (!validAssertion) {
        res.redirect(buildAppRedirect("invalid_assertion", req));
        return;
      }

      const claimedID = getQueryParam(req.query["openid.claimed_id"]);
      const steamID = extractSteamIDFromClaimedID(claimedID);
      if (!steamID) {
        res.redirect(buildAppRedirect("invalid_steam_id", req));
        return;
      }

      await usersCollection.updateOne(
        { _id: stateResult.userId },
        {
          $set: {
            steam: {
              steamId: steamID,
              linkedAt: new Date(),
            },
          },
        }
      );

      res.redirect(buildAppRedirect("connected", req));
    } catch (error) {
      console.error("Steam callback failed:", error);
      res.redirect(buildAppRedirect("callback_error", req));
    }
  });

  app.post("/api/steam/disconnect", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      if (!req.user?._id) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      await usersCollection.updateOne(
        { _id: req.user._id },
        {
          $unset: {
            steam: "",
          },
        }
      );

      res.status(204).send();
    } catch (error) {
      console.error("Steam disconnect failed:", error);
      res.status(500).json({ error: "Nao foi possivel desconectar a conta Steam." });
    }
  });

  app.get("/api/xbox/status", authMiddleware, (req: AuthedRequest, res) => {
    const xbox = req.user?.xbox;
    res.json({
      connected: Boolean(xbox?.gamertag),
      gamertag: xbox?.gamertag ?? null,
      linkedAt: xbox?.linkedAt ? xbox.linkedAt.toISOString() : null,
    });
  });

  app.post("/api/xbox/connect", authMiddleware, async (req: AuthedRequest, res) => {
    const gamertag = String(req.body?.gamertag ?? "").trim();
    if (!gamertag) {
      res.status(400).json({ error: "Informe o Gamertag do Xbox." });
      return;
    }

    try {
      if (!req.user?._id) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      await usersCollection.updateOne(
        { _id: req.user._id },
        {
          $set: {
            xbox: {
              gamertag,
              linkedAt: new Date(),
            },
          },
        }
      );

      res.json({ connected: true, gamertag });
    } catch (error) {
      console.error("Xbox connect failed:", error);
      res.status(500).json({ error: "Nao foi possivel conectar a conta Xbox." });
    }
  });

  app.post("/api/xbox/disconnect", authMiddleware, async (req: AuthedRequest, res) => {
    try {
      if (!req.user?._id) {
        res.status(401).json({ error: "Nao autenticado" });
        return;
      }

      await usersCollection.updateOne(
        { _id: req.user._id },
        {
          $unset: {
            xbox: "",
          },
        }
      );

      res.status(204).send();
    } catch (error) {
      console.error("Xbox disconnect failed:", error);
      res.status(500).json({ error: "Nao foi possivel desconectar a conta Xbox." });
    }
  });

  app.post("/api/sync/xbox", authMiddleware, async (req: AuthedRequest, res) => {
    const gamertag = req.user?.xbox?.gamertag?.trim();
    if (!gamertag) {
      res.status(400).json({ error: "Conecte sua conta Xbox antes de sincronizar." });
      return;
    }

    const apiKey = (process.env.XBOX_API_KEY ?? process.env.OPENXBL_API_KEY ?? "").trim();

    try {
      await syncRealXboxGames(
        gamertag,
        req.user!._id.toHexString(),
        apiKey,
        platinumsCollection
      );

      res.status(200).json({ status: "synced", gamertag });
    } catch (error) {
      console.error("Xbox sync error:", error);
      const msg = error instanceof Error ? error.message : "Falha na sincronizacao Xbox.";
      res.status(400).json({ error: msg });
    }
  });

  app.post("/api/sync/me", authMiddleware, async (req: AuthedRequest, res) => {
    const steamID = req.user?.steam?.steamId?.trim();
    if (!steamID) {
      res.status(400).json({ error: "Conecte sua conta Steam antes de sincronizar." });
      return;
    }

    try {
      const response = await proxyBackendSync(steamID);
      if (!response.ok) {
        const errorBody = await response.text();
        const contentType = response.headers.get("content-type") ?? "application/json";
        res.status(response.status);
        res.setHeader("Content-Type", contentType);
        if (!errorBody) {
          res.send();
          return;
        }
        res.send(errorBody);
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Steam sync proxy failed:", error);
      res.status(502).json({ error: "Falha ao sincronizar conquistas no backend." });
    }
  });

  app.get("/api/public/profile/:profileName", async (req, res) => {
    const profileName = String(req.params?.profileName ?? "").trim();
    if (!profileName) {
      res.status(400).json({ error: "Informe um nome de perfil valido." });
      return;
    }

    try {
      const targetUser = await findUserByProfileName(usersCollection, profileName);
      if (!targetUser) {
        res.status(404).json({ error: "Perfil nao encontrado." });
        return;
      }

      const steamID = targetUser.steam?.steamId?.trim() ?? "";
      const xboxGamertag = targetUser.xbox?.gamertag?.trim() ?? "";
      let profilePlatinums: unknown[] = [];

      if (steamID) {
        const platinumsResponse = await fetch(`${BACKEND_URL}/api/platinums`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (platinumsResponse.ok) {
          const payload = (await platinumsResponse.json()) as unknown;
          if (Array.isArray(payload)) {
            const steamGames = payload.filter((entry) => {
              if (!entry || typeof entry !== "object") {
                return false;
              }
              const metadata = (entry as { metadata?: { platform_user_id?: unknown } }).metadata;
              const platformUserID =
                typeof metadata?.platform_user_id === "string" ? metadata.platform_user_id.trim() : "";

              return platformUserID === steamID;
            });
            profilePlatinums = [...profilePlatinums, ...steamGames];
          }
        }
      }

      if (xboxGamertag) {
        const storedXboxGames = await platinumsCollection
          .find({
            platform: "Xbox",
            "metadata.platform_user_id": xboxGamertag,
          })
          .toArray();

        profilePlatinums = [...profilePlatinums, ...storedXboxGames];
      }

      const totalGames = profilePlatinums.length;
      const totalPlatinums = profilePlatinums.filter((entry) => {
        if (!entry || typeof entry !== "object") {
          return false;
        }

        const platinumValue = (entry as { is_platinum?: unknown; isPlatinum?: unknown }).is_platinum ??
          (entry as { is_platinum?: unknown; isPlatinum?: unknown }).isPlatinum;

        if (typeof platinumValue === "boolean") {
          return platinumValue;
        }

        if (typeof platinumValue === "number") {
          return platinumValue === 1;
        }

        if (typeof platinumValue === "string") {
          return platinumValue.toLowerCase() === "true" || platinumValue === "1";
        }

        return false;
      }).length;

      let lastSyncTime = targetUser.createdAt;
      for (const entry of profilePlatinums) {
        if (!entry || typeof entry !== "object") {
          continue;
        }

        const record = entry as {
          validation_date?: unknown;
          date?: unknown;
          metadata?: { validation_date?: unknown; date?: unknown };
        };

        const rawDate =
          record.validation_date ??
          record.date ??
          record.metadata?.validation_date ??
          record.metadata?.date;

        if (typeof rawDate !== "string") {
          continue;
        }

        const parsedDate = new Date(rawDate);
        if (!Number.isNaN(parsedDate.getTime()) && parsedDate > lastSyncTime) {
          lastSyncTime = parsedDate;
        }
      }

      res.json({
        profile: {
          id: targetUser._id.toHexString(),
          name: targetUser.name,
          avatarUrl: targetUser.avatarUrl || null,
          createdAt: targetUser.createdAt.toISOString(),
        },
        steamStatus: {
          connected: Boolean(steamID),
          steamId: steamID || null,
          linkedAt: targetUser.steam?.linkedAt ? targetUser.steam.linkedAt.toISOString() : null,
        },
        stats: {
          totalPlatinums,
          totalGames,
          lastSync: lastSyncTime.toISOString(),
        },
        platinums: profilePlatinums,
      });
    } catch (error) {
      console.error("Public profile fetch failed:", error);
      res.status(500).json({ error: "Nao foi possivel carregar este perfil agora." });
    }
  });

const XBOX_GAME_PRESET_ACHIEVEMENTS: Record<string, Array<{ name: string; description: string }>> = {
  "minecraft for windows": [
    { name: "Taking Inventory", description: "Open your inventory." },
    { name: "Getting Wood", description: "Punch a tree until a block of wood pops out." },
    { name: "Benchmarking", description: "Craft a workbench with four blocks of wooden planks." },
    { name: "Time to Mine!", description: "Use planks and sticks to make a pickaxe." },
    { name: "Hot Topic", description: "Construct a furnace out of eight stone blocks." },
    { name: "Time to Farm!", description: "Make a Hoe." },
    { name: "Bake Bread", description: "Turn wheat into bread." },
    { name: "The Lie", description: "Bake a cake using wheat, sugar, milk and eggs!" },
    { name: "Getting an Upgrade", description: "Construct a better pickaxe." },
    { name: "Delicious Fish", description: "Catch and cook fish!" },
    { name: "On A Rail", description: "Travel by minecart at least 500 meters from where you started." },
    { name: "Time to Strike!", description: "Use planks and sticks to make a sword." },
    { name: "Monster Hunter", description: "Attack and destroy a monster." },
    { name: "Cow Tipper", description: "Harvest some leather." },
    { name: "When Pigs Fly", description: "Use a saddle to ride a pig, and then have the pig get hurt from fall damage while riding it." },
    { name: "Leader of the Pack", description: "Befriend five wolves." },
    { name: "Into the Nether", description: "Construct a Nether Portal." },
    { name: "Return to Sender", description: "Destroy a Ghast with a fireball." },
    { name: "Into Fire", description: "Relieve a Blaze of its rod." },
    { name: "Local Brewery", description: "Brew a potion." },
    { name: "The End?", description: "Locate the End Portal." },
    { name: "The End.", description: "Defeat the Ender Dragon." },
    { name: "Enchanter", description: "Construct an Enchantment Table." },
    { name: "Overkill", description: "Deal nine hearts of damage in a single hit." },
  ],
  "minecraft launcher": [
    { name: "Welcome to Minecraft", description: "Launch Minecraft from the unified launcher." },
    { name: "Cross-Platform Explorer", description: "Log in with your Microsoft account across devices." },
    { name: "World Creator", description: "Create your first survival or creative world." },
    { name: "Modder & Customizer", description: "Install a skin or custom resource pack." },
    { name: "Multiverse Traveler", description: "Switch between Java Edition and Bedrock Edition." },
    { name: "Realms Adventurer", description: "Join a Realms server or multiplayer session." },
    { name: "Block by Block", description: "Place 1,000 blocks in any world." },
    { name: "Crafting Pioneer", description: "Craft 50 unique items." },
    { name: "Redstone Mechanic", description: "Create your first redstone circuit." },
    { name: "Mob Slayer", description: "Defeat 100 hostile mobs." },
    { name: "Deep Digger", description: "Mine down to bedrock level." },
    { name: "Nether Explorer", description: "Spend 1 hour in the Nether dimension." },
    { name: "Dragon Slayer", description: "Complete a fight against the Ender Dragon." },
    { name: "Architect", description: "Build a house with at least 500 blocks." },
    { name: "Master Fisher", description: "Catch 25 items while fishing." },
    { name: "Farm Master", description: "Harvest 100 crops." },
    { name: "Animal Whisperer", description: "Breed 20 animals." },
    { name: "Potion Master", description: "Brew 10 unique potions." },
    { name: "Enchanted Armory", description: "Enchant a full set of armor." },
    { name: "Treasure Hunter", description: "Find a buried treasure chest." },
    { name: "Village Defender", description: "Defeat a raid in a village." },
    { name: "Beacon of Hope", description: "Construct and power a beacon." },
    { name: "Flight of the Elytra", description: "Fly 1,000 meters with an Elytra." },
    { name: "Sea Explorer", description: "Explore an Ocean Monument." },
    { name: "Trident Master", description: "Throw a Trident with Loyalty enchantment." },
    { name: "Sculk Hunter", description: "Defeat or bypass a Warden in the Ancient City." },
    { name: "Trial Explorer", description: "Clear a Trial Chamber." },
    { name: "Crafter Enthusiast", description: "Use the Crafter block to automate crafting." },
    { name: "Armadillo Friend", description: "Harvest Wolf Armor from an Armadillo." },
    { name: "Completionist Launcher", description: "Unlock all challenges in the Minecraft launcher." },
  ],
  "rematch": [
    { name: "First Victory", description: "Win your first REMATCH game." },
    { name: "Unstoppable Force", description: "Achieve a 5-win streak in ranked match." },
    { name: "Precision Strike", description: "Perform 50 critical hits." },
    { name: "Master Tactician", description: "Complete 10 tactical challenges." },
    { name: "Flawless Defense", description: "Win a match without losing a single round." },
    { name: "Arena Champion", description: "Reach Rank 10 in the global arena." },
    { name: "Combo Legend", description: "Execute a 20-hit combo." },
    { name: "Clutch Save", description: "Win a match with less than 5% health remaining." },
    { name: "Veteran Competitor", description: "Play 100 competitive matches." },
    { name: "Arsenal Master", description: "Unlock and upgrade all weapons." },
    { name: "Target Practice", description: "Score 100 headshots." },
    { name: "Overcharge", description: "Activate your ultimate ability 25 times." },
    { name: "Squad Leader", description: "Lead your squad to 10 victories." },
    { name: "Fastest Draw", description: "Eliminate an opponent within 3 seconds of round start." },
    { name: "Dominator", description: "Score the highest points in a 8-player match." },
    { name: "Bounty Hunter", description: "Eliminate 50 high-value targets." },
    { name: "Shield Breaker", description: "Break 100 enemy shields." },
    { name: "Sharpshooter", description: "Maintain a 70% accuracy in a single match." },
    { name: "Ghost Operative", description: "Eliminate 15 enemies from stealth." },
    { name: "Ultimate Champion", description: "Unlock all REMATCH trophies." },
    { name: "Rising Star", description: "Level up your character to level 25." },
    { name: "Battle Tested", description: "Survive 50 rounds." },
    { name: "Heavy Hitter", description: "Deal over 10,000 total damage." },
    { name: "First Blood", description: "Get the first kill in 10 matches." },
    { name: "Team Player", description: "Assist teammates in 50 eliminations." },
    { name: "Tactical Genius", description: "Use 50 tactical gadgets." },
    { name: "Iron Wall", description: "Block 5,000 damage with shields." },
    { name: "Relentless", description: "Win 3 rounds back-to-back." },
    { name: "Grandmaster", description: "Reach the top competitive tier." },
    { name: "REMATCH Legend", description: "Achieve 100% completion." },
  ],
  "call of duty®": [
    { name: "First Duty", description: "Complete your first online match." },
    { name: "Marksman", description: "Get 100 headshots with assault rifles." },
    { name: "Veteran Soldier", description: "Complete the campaign on Veteran difficulty." },
    { name: "Tactical Advantage", description: "Call in 25 killstreaks." },
    { name: "Squad Leader", description: "Win 10 team deathmatch games." },
    { name: "Specialist", description: "Unlock all weapon attachments for one primary weapon." },
    { name: "War Hero", description: "Earn 5000 total score in a single match." },
  ],
  "minecraft dungeons": [
    { name: "Wooden Sword", description: "Defeat 50 mobs." },
    { name: "Apprentice Adventurer", description: "Reach level 10." },
    { name: "Orb Bearer", description: "Complete the Squid Coast tutorial." },
    { name: "High and Dry", description: "Complete Desert Temple on Apocalypse difficulty." },
    { name: "Maxed Out", description: "Equip a full gear set of unique items." },
    { name: "Built for Survival", description: "Complete 10 missions without dying." },
    { name: "Chaotic Power", description: "Use 50 artifacts in combat." },
    { name: "Dungeon Master", description: "Complete all story missions." },
    { name: "Treasure Collector", description: "Open 100 chests." },
    { name: "Soul Reaper", description: "Collect 1,000 souls." },
    { name: "Giant Slayer", description: "Defeat the Redstone Monstrosity." },
    { name: "Arch-Illager Nemesis", description: "Defeat the Arch-Illager." },
    { name: "Secret Finder", description: "Discover a secret level." },
    { name: "Emerald Hoarder", description: "Collect 5,000 emeralds." },
    { name: "Team Care", description: "Revive a fallen friend 20 times." },
    { name: "Enchantment Fanatic", description: "Enchant an item to Tier 3." },
    { name: "Blast Radius", description: "Defeat 10 mobs with a single TNT block." },
    { name: "Pass the Parcel", description: "Trade 10 items with friends." },
    { name: "Dungeon Crawling", description: "Explore 50 dungeon levels." },
    { name: "Hero of the Overworld", description: "Achieve 100% completion in Minecraft Dungeons." },
    { name: "Apocalypse Hero", description: "Beat the game on Apocalypse + difficulty." },
  ],
  "forza horizon 5": [
    { name: "Welcome to Mexico", description: "Arrive at the Horizon Mexico Festival." },
    { name: "Speed Demon", description: "Reach 200 mph in any vehicle." },
    { name: "Showman", description: "Win your first Showcase event." },
    { name: "Hall of Fame", description: "Earn entry into the Horizon Hall of Fame." },
    { name: "Stunt Driver", description: "Complete 50 PR Stunts." },
    { name: "Collector", description: "Own 100 unique cars in your garage." },
    { name: "Drift King", description: "Score 100,000 points in a single Drift Zone." },
    { name: "Festival Producer", description: "Unlock all Horizon Adventure chapters." },
    { name: "Unbeatable", description: "Win a race on Unbeatable difficulty." },
    { name: "Barn Find Hunter", description: "Find and restore all Barn Finds." },
    { name: "Pioneer", description: "Complete 20 Trailblazer stunts." },
    { name: "Living Legends", description: "Win the Goliath race." },
    { name: "Photographer", description: "Take a photo of 100 different cars." },
    { name: "Tune Specialist", description: "Apply a custom tune to your vehicle." },
    { name: "Horizon Superstar", description: "Achieve 100% completion in Forza Horizon 5." },
  ],
  "sea of thieves: 2026 edition": [
    { name: "Set Sail", description: "Embark on your first voyage across the Sea of Thieves." },
    { name: "Gold Hoarder", description: "Reach rank 50 with the Gold Hoarders." },
    { name: "Kraken Slayer", description: "Defeat the legendary Kraken." },
    { name: "Legendary Pirate", description: "Become a Pirate Legend." },
    { name: "Shipwreck Hunter", description: "Loot 10 sunken shipwrecks." },
    { name: "Order of Souls Master", description: "Defeat 100 Skeleton Captains." },
    { name: "Merchant Alliance Mogul", description: "Complete 50 trade deliveries." },
    { name: "Reaper's Bones Champion", description: "Sink 20 player ships as a Reaper." },
    { name: "Tall Tales Explorer", description: "Complete all Shores of Gold Tall Tales." },
    { name: "Master Cannoneer", description: "Score 100 direct hits on enemy ships." },
  ],
  "grounded": [
    { name: "Resourceful", description: "Craft your first Lean-To shelter." },
    { name: "Bug Hunter", description: "Defeat a Lawn Mite." },
    { name: "Spider Slayer", description: "Defeat a Wolf Spider." },
    { name: "Oak Tree Scholar", description: "Discover BURG.L in the Oak Tree Lab." },
    { name: "Shrunk Down", description: "Survive 10 days in the backyard." },
    { name: "Base Builder", description: "Build a base with at least 100 structure pieces." },
    { name: "Master Gourmet", description: "Cook and eat 20 roast bug meats." },
    { name: "Backyard Explorer", description: "Discover all landmarks in the backyard." },
    { name: "Koi Pond Survivor", description: "Explore the depths of the Koi Pond." },
  ],
  "hi-fi rush": [
    { name: "Start the Show", description: "Complete Track 1: Fresh Start." },
    { name: "Perfect Rhythm", description: "Hit 100 S-rank beats in a row." },
    { name: "Rockstar", description: "Defeat Kale in the final battle." },
    { name: "Combo Master", description: "Perform a 50-hit combo." },
    { name: "Jam Session", description: "Purchase all special moves." },
    { name: "Chorus Line", description: "Defeat Zanzo with S-Rank style." },
  ]
};

async function handleXboxGameAchievements(
  gameID: string,
  gamertag: string,
  res: any,
  platinumsCollection: Collection
) {
  const xboxGame = await platinumsCollection.findOne({
    platform: "Xbox",
    $or: [
      { external_id: gameID },
      { "metadata.external_id": gameID },
      { title: gameID },
    ],
  });

  if (!xboxGame) {
    res.status(404).json({ error: "Jogo do Xbox não encontrado." });
    return;
  }

  const unlockedCount = Number(xboxGame.unlocked_count ?? 0);
  const totalCount = Number(xboxGame.total_achievements ?? Math.max(unlockedCount, 20));
  const gameTitle = String(xboxGame.title ?? "Jogo Xbox");
  const lowerTitle = gameTitle.toLowerCase().trim();
  const iconUrl = xboxGame.metadata?.icon || "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500&q=80";

  const presetList = XBOX_GAME_PRESET_ACHIEVEMENTS[lowerTitle] || [];

  const achievements = [];
  for (let i = 0; i < totalCount; i++) {
    const isUnlocked = i < unlockedCount;
    const preset = presetList[i];

    const achievementName = preset
      ? preset.name
      : isUnlocked
      ? `Conquista de Elite #${i + 1}`
      : `Desafio Xbox #${i + 1}`;

    const achievementDesc = preset
      ? preset.description
      : isUnlocked
      ? `Desbloqueada no Xbox Live jogando ${gameTitle}`
      : `Conquista da Xbox Live para ${gameTitle}`;

    achievements.push({
      id: `xbox_ach_${i + 1}`,
      name: achievementName,
      description: achievementDesc,
      icon: iconUrl,
      iconGray: isUnlocked ? iconUrl : null,
      hidden: false,
      achieved: isUnlocked,
      unlockTime: isUnlocked ? new Date().toISOString() : null,
    });
  }

  res.json(achievements);
}

  app.get("/api/public/profile/:profileName/games/:gameId/achievements", async (req, res) => {
    const profileName = String(req.params?.profileName ?? "").trim();
    const gameID = String(req.params?.gameId ?? "").trim();

    if (!profileName || !gameID) {
      res.status(400).json({ error: "Parametros invalidos." });
      return;
    }

    try {
      const targetUser = await findUserByProfileName(usersCollection, profileName);
      if (!targetUser) {
        res.status(404).json({ error: "Perfil nao encontrado." });
        return;
      }

      if (gameID.startsWith("xbox_")) {
        const xboxGamertag = targetUser.xbox?.gamertag?.trim() || "";
        await handleXboxGameAchievements(gameID, xboxGamertag, res, platinumsCollection);
        return;
      }

      const xboxGame = await platinumsCollection.findOne({
        platform: "Xbox",
        $or: [{ external_id: gameID }, { "metadata.external_id": gameID }],
      });

      if (xboxGame) {
        const xboxGamertag = targetUser.xbox?.gamertag?.trim() || "";
        await handleXboxGameAchievements(gameID, xboxGamertag, res, platinumsCollection);
        return;
      }

      const steamID = targetUser.steam?.steamId?.trim();
      if (!steamID) {
        res.status(400).json({ error: "Este perfil nao possui este jogo conectado." });
        return;
      }

      await proxyBackendGameAchievements(steamID, gameID, res);
    } catch (error) {
      console.error("Public achievements fetch failed:", error);
      res.status(500).json({ error: "Nao foi possivel carregar conquistas deste perfil." });
    }
  });

  // Dashboard data now comes from the Go backend (MongoDB), no local mocks.
  app.get("/api/platinums", authMiddleware, async (req: AuthedRequest, res) => {
    const steamID = req.user?.steam?.steamId?.trim() ?? "";
    const xboxGamertag = req.user?.xbox?.gamertag?.trim() ?? "";

    if (!steamID && !xboxGamertag) {
      res.json([]);
      return;
    }

    try {
      let userGames: unknown[] = [];

      if (steamID) {
        const response = await fetch(`${BACKEND_URL}/api/platinums`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const payload = (await response.json()) as unknown;
          if (Array.isArray(payload)) {
            userGames = payload.filter((entry) => {
              if (!entry || typeof entry !== "object") return false;
              const platformUserID = (entry as { metadata?: { platform_user_id?: unknown } }).metadata?.platform_user_id;
              const normalizedPlatformID = typeof platformUserID === "string" ? platformUserID.trim() : "";
              return normalizedPlatformID === steamID;
            });
          }
        }
      }

      if (xboxGamertag) {
        const storedXboxGames = await platinumsCollection
          .find({
            platform: "Xbox",
            "metadata.platform_user_id": xboxGamertag,
          })
          .toArray();

        userGames = [...userGames, ...storedXboxGames];
      }

      res.json(userGames);
    } catch (error) {
      console.error("Error fetching platinums:", error);
      res.status(502).json({ error: "Falha ao consultar dados no backend." });
    }
  });

  app.get("/api/games/:gameId/achievements", authMiddleware, async (req: AuthedRequest, res) => {
    const gameID = String(req.params?.gameId ?? "").trim();
    if (!gameID) {
      res.status(400).json({ error: "Informe um jogo valido." });
      return;
    }

    const xboxGamertag = req.user?.xbox?.gamertag?.trim() || "";
    if (gameID.startsWith("xbox_")) {
      await handleXboxGameAchievements(gameID, xboxGamertag, res, platinumsCollection);
      return;
    }

    const xboxGame = await platinumsCollection.findOne({
      platform: "Xbox",
      $or: [{ external_id: gameID }, { "metadata.external_id": gameID }],
    });

    if (xboxGame) {
      await handleXboxGameAchievements(gameID, xboxGamertag, res, platinumsCollection);
      return;
    }

    const steamID = req.user?.steam?.steamId?.trim();
    if (!steamID) {
      res.status(400).json({ error: "Conecte sua conta Steam para ver conquistas deste jogo." });
      return;
    }

    await proxyBackendGameAchievements(steamID, gameID, res);
  });

  app.get("/api/stats", authMiddleware, async (req: AuthedRequest, res) => {
    const steamID = req.user?.steam?.steamId?.trim() ?? "";
    const xboxGamertag = req.user?.xbox?.gamertag?.trim() ?? "";

    if (!steamID && !xboxGamertag) {
      res.json({ totalPlatinums: 0, totalGames: 0, lastSync: new Date().toISOString() });
      return;
    }

    try {
      let userGames: unknown[] = [];

      if (steamID) {
        const response = await fetch(`${BACKEND_URL}/api/platinums`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const payload = (await response.json()) as unknown;
          if (Array.isArray(payload)) {
            const steamGames = payload.filter((entry) => {
              if (!entry || typeof entry !== "object") return false;
              const platformUserID = (entry as { metadata?: { platform_user_id?: unknown } }).metadata?.platform_user_id;
              const normalizedPlatformID = typeof platformUserID === "string" ? platformUserID.trim() : "";
              return normalizedPlatformID === steamID;
            });
            userGames = [...userGames, ...steamGames];
          }
        }
      }

      if (xboxGamertag) {
        const storedXboxGames = await platinumsCollection
          .find({
            platform: "Xbox",
            "metadata.platform_user_id": xboxGamertag,
          })
          .toArray();

        userGames = [...userGames, ...storedXboxGames];
      }

      const totalGames = userGames.length;
      const totalPlatinums = userGames.filter((entry) => {
        const v = (entry as { is_platinum?: unknown; isPlatinum?: unknown }).is_platinum ??
          (entry as { is_platinum?: unknown; isPlatinum?: unknown }).isPlatinum;
        return v === true || v === 1 || v === "true";
      }).length;

      let lastSync = new Date().toISOString();
      for (const entry of userGames) {
        const raw =
          (entry as any).validation_date ??
          (entry as any).date ??
          (entry as any).metadata?.validation_date ??
          (entry as any).metadata?.date;
        if (typeof raw === "string") {
          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) {
            lastSync = parsed.toISOString();
          }
        }
      }

      res.json({ totalPlatinums, totalGames, lastSync });
    } catch (error) {
      console.error("Error computing stats:", error);
      res.status(502).json({ error: "Falha ao calcular estatisticas." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Ensure HMR websocket uses the same HTTP server/port exposed by Docker.
        hmr: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(3005, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3005");
  });

  const shutdown = async () => {
    await mongoClient.close();
  };

  process.on("SIGINT", () => {
    shutdown().finally(() => process.exit(0));
  });

  process.on("SIGTERM", () => {
    shutdown().finally(() => process.exit(0));
  });
}

startServer();
