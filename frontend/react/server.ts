import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { MongoClient, MongoServerError, ObjectId, type Collection, type WithId } from "mongodb";

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const STEAM_STATE_TTL_SECONDS = 10 * 60;

type UserRecord = {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  steam?: {
    steamId: string;
    linkedAt: Date;
  };
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

type SafeUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  steamConnected: boolean;
};

type AuthedRequest = express.Request & {
  user?: WithId<UserRecord>;
  token?: string;
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://backend:8080";
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.MONGO_URI ?? "mongodb://mongodb:27017";
const MONGO_DB = process.env.MONGO_DB ?? "platone";
const AUTH_USERS_COLLECTION = process.env.AUTH_USERS_COLLECTION ?? "auth_users";
const AUTH_SESSIONS_COLLECTION = process.env.AUTH_SESSIONS_COLLECTION ?? "auth_sessions";
const AUTH_STEAM_STATES_COLLECTION = process.env.AUTH_STEAM_STATES_COLLECTION ?? "auth_steam_states";
const APP_BASE_URL = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;

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
    createdAt: user.createdAt.toISOString(),
    steamConnected: Boolean(user.steam?.steamId),
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

function buildSteamConnectURL(state: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": `${APP_BASE_URL}/api/steam/callback?state=${encodeURIComponent(state)}`,
    "openid.realm": APP_BASE_URL,
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

function buildAppRedirect(status: string): string {
  const encodedStatus = encodeURIComponent(status);
  return `${APP_BASE_URL}/home?steam=${encodedStatus}`;
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

async function startServer() {
  const mongoClient = new MongoClient(DATABASE_URL);
  await mongoClient.connect();

  const db = mongoClient.db(MONGO_DB);
  const usersCollection = db.collection<UserRecord>(AUTH_USERS_COLLECTION);
  const sessionsCollection = db.collection<SessionRecord>(AUTH_SESSIONS_COLLECTION);
  const steamStatesCollection = db.collection<SteamStateRecord>(AUTH_STEAM_STATES_COLLECTION);

  await Promise.all([
    usersCollection.createIndex({ email: 1 }, { unique: true }),
    sessionsCollection.createIndex({ token: 1 }, { unique: true }),
    steamStatesCollection.createIndex({ state: 1 }, { unique: true }),
    steamStatesCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: STEAM_STATE_TTL_SECONDS }),
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

      res.json({ url: buildSteamConnectURL(state) });
    } catch (error) {
      console.error("Steam connect initialization failed:", error);
      res.status(500).json({ error: "Nao foi possivel iniciar conexao com a Steam." });
    }
  });

  app.get("/api/steam/callback", async (req, res) => {
    const state = getQueryParam(req.query.state).trim();
    if (!state) {
      res.redirect(buildAppRedirect("missing_state"));
      return;
    }

    try {
      const stateResult = await steamStatesCollection.findOneAndDelete({ state });
      if (!stateResult || !stateResult.userId) {
        res.redirect(buildAppRedirect("invalid_state"));
        return;
      }

      const validAssertion = await validateSteamOpenID(req);
      if (!validAssertion) {
        res.redirect(buildAppRedirect("invalid_assertion"));
        return;
      }

      const claimedID = getQueryParam(req.query["openid.claimed_id"]);
      const steamID = extractSteamIDFromClaimedID(claimedID);
      if (!steamID) {
        res.redirect(buildAppRedirect("invalid_steam_id"));
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

      res.redirect(buildAppRedirect("connected"));
    } catch (error) {
      console.error("Steam callback failed:", error);
      res.redirect(buildAppRedirect("callback_error"));
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
      let profilePlatinums: unknown[] = [];

      if (steamID) {
        const platinumsResponse = await fetch(`${BACKEND_URL}/api/platinums`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!platinumsResponse.ok) {
          const errorBody = await platinumsResponse.text();
          const contentType = platinumsResponse.headers.get("content-type") ?? "application/json";
          res.status(platinumsResponse.status);
          res.setHeader("Content-Type", contentType);
          res.send(errorBody);
          return;
        }

        const payload = (await platinumsResponse.json()) as unknown;
        if (Array.isArray(payload)) {
          profilePlatinums = payload.filter((entry) => {
            if (!entry || typeof entry !== "object") {
              return false;
            }

            const metadata = (entry as { metadata?: { platform_user_id?: unknown } }).metadata;
            const platformUserID =
              typeof metadata?.platform_user_id === "string" ? metadata.platform_user_id.trim() : "";

            return platformUserID === steamID;
          });
        }
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

  app.get("/api/public/profile/:profileName/games/:gameId/achievements", async (req, res) => {
    const profileName = String(req.params?.profileName ?? "").trim();
    const gameID = String(req.params?.gameId ?? "").trim();

    if (!profileName) {
      res.status(400).json({ error: "Informe um nome de perfil valido." });
      return;
    }

    if (!gameID) {
      res.status(400).json({ error: "Informe um jogo valido." });
      return;
    }

    try {
      const targetUser = await findUserByProfileName(usersCollection, profileName);
      if (!targetUser) {
        res.status(404).json({ error: "Perfil nao encontrado." });
        return;
      }

      const steamID = targetUser.steam?.steamId?.trim();
      if (!steamID) {
        res.status(400).json({ error: "Este perfil ainda nao conectou a Steam." });
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

    if (!steamID) {
      res.json([]);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/platinums`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const body = await response.text();
        res.status(response.status).setHeader("Content-Type", response.headers.get("content-type") ?? "application/json").send(body);
        return;
      }

      const payload = (await response.json()) as unknown;
      if (!Array.isArray(payload)) {
        res.json([]);
        return;
      }

      const userGames = payload.filter((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const platformUserID = (entry as { metadata?: { platform_user_id?: unknown } }).metadata?.platform_user_id;
        return typeof platformUserID === "string" && platformUserID.trim() === steamID;
      });

      res.json(userGames);
    } catch (error) {
      console.error("Error fetching platinums:", error);
      res.status(502).json({ error: "Falha ao consultar dados no backend." });
    }
  });

  app.get("/api/games/:gameId/achievements", authMiddleware, async (req: AuthedRequest, res) => {
    const steamID = req.user?.steam?.steamId?.trim();
    if (!steamID) {
      res.status(400).json({ error: "Conecte sua conta Steam para ver conquistas deste jogo." });
      return;
    }

    const gameID = String(req.params?.gameId ?? "").trim();
    if (!gameID) {
      res.status(400).json({ error: "Informe um jogo valido." });
      return;
    }

    await proxyBackendGameAchievements(steamID, gameID, res);
  });

  app.get("/api/stats", authMiddleware, async (req: AuthedRequest, res) => {
    const steamID = req.user?.steam?.steamId?.trim() ?? "";

    if (!steamID) {
      res.json({ totalPlatinums: 0, totalGames: 0, lastSync: new Date().toISOString() });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/platinums`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        res.json({ totalPlatinums: 0, totalGames: 0, lastSync: new Date().toISOString() });
        return;
      }

      const payload = (await response.json()) as unknown;
      if (!Array.isArray(payload)) {
        res.json({ totalPlatinums: 0, totalGames: 0, lastSync: new Date().toISOString() });
        return;
      }

      const userGames = payload.filter((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const platformUserID = (entry as { metadata?: { platform_user_id?: unknown } }).metadata?.platform_user_id;
        return typeof platformUserID === "string" && platformUserID.trim() === steamID;
      });

      const totalGames = userGames.length;
      const totalPlatinums = userGames.filter((entry) => {
        const v = (entry as { is_platinum?: unknown }).is_platinum;
        return v === true || v === 1 || v === "true";
      }).length;

      let lastSync = new Date().toISOString();
      for (const entry of userGames) {
        const raw = (entry as { validation_date?: unknown; metadata?: { validation_date?: unknown } }).validation_date
          ?? (entry as { metadata?: { validation_date?: unknown } }).metadata?.validation_date;
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
      res.status(502).json({ error: "Falha ao consultar dados no backend." });
    }
  });

  app.get("/api/users/search", authMiddleware, async (req: AuthedRequest, res) => {
    const rawQuery = String(req.query?.query ?? req.query?.q ?? "").trim();
    if (!rawQuery) {
      res.json([]);
      return;
    }

    const escapedQuery = escapeRegex(rawQuery);
    const filter = {
      $or: [
        { name: { $regex: escapedQuery, $options: "i" } },
        { email: { $regex: escapedQuery, $options: "i" } },
      ],
    } as const;

    try {
      const results = await usersCollection
        .find(filter, { projection: { name: 1, email: 1, createdAt: 1 } })
        .limit(10)
        .toArray();

      const currentUserID = req.user?._id.toHexString() ?? "";
      const payload = results
        .filter((entry) => entry._id.toHexString() !== currentUserID)
        .map((entry) => ({
          id: entry._id.toHexString(),
          username: entry.name,
          email: entry.email,
          created_at: entry.createdAt.toISOString(),
        }));

      res.json(payload);
    } catch (error) {
      console.error("User search failed:", error);
      res.status(500).json({ error: "Nao foi possivel buscar usuarios." });
    }
  });

  app.get("/api/friends", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    await proxyBackendGet(`/api/friends/${encodeURIComponent(userID)}`, res);
  });

  app.get("/api/friends/requests", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    await proxyBackendGet(`/api/friends/requests/${encodeURIComponent(userID)}`, res);
  });

  app.post("/api/friends/request", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    const toID = String(req.body?.to_id ?? "").trim();

    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    if (!toID) {
      res.status(400).json({ error: "Informe o usuario de destino." });
      return;
    }

    await proxyBackendWithJSON(
      "/api/friends/request",
      "POST",
      {
        from_id: userID,
        to_id: toID,
      },
      res
    );
  });

  app.post("/api/friends/request/:requestId/accept", authMiddleware, async (req, res) => {
    const requestID = String(req.params?.requestId ?? "").trim();
    if (!requestID) {
      res.status(400).json({ error: "Informe o pedido de amizade." });
      return;
    }

    await proxyBackendWithoutBody(`/api/friends/request/${encodeURIComponent(requestID)}/accept`, "POST", res);
  });

  app.post("/api/friends/request/:requestId/reject", authMiddleware, async (req, res) => {
    const requestID = String(req.params?.requestId ?? "").trim();
    if (!requestID) {
      res.status(400).json({ error: "Informe o pedido de amizade." });
      return;
    }

    await proxyBackendWithoutBody(`/api/friends/request/${encodeURIComponent(requestID)}/reject`, "POST", res);
  });

  app.delete("/api/friends/:friendId", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    const friendID = String(req.params?.friendId ?? "").trim();

    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    if (!friendID) {
      res.status(400).json({ error: "Informe o amigo." });
      return;
    }

    await proxyBackendWithoutBody(
      `/api/friends/${encodeURIComponent(userID)}/${encodeURIComponent(friendID)}`,
      "DELETE",
      res
    );
  });

  app.get("/api/messages/unread", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    await proxyBackendGet(`/api/messages/${encodeURIComponent(userID)}/unread`, res);
  });

  app.get("/api/messages/conversations", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    await proxyBackendGet(`/api/conversations/${encodeURIComponent(userID)}`, res);
  });

  app.get("/api/messages/:friendId", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    const friendID = String(req.params?.friendId ?? "").trim();

    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    if (!friendID) {
      res.status(400).json({ error: "Informe a conversa." });
      return;
    }

    await proxyBackendGet(`/api/messages/${encodeURIComponent(userID)}/${encodeURIComponent(friendID)}`, res);
  });

  app.put("/api/messages/:friendId/read", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    const friendID = String(req.params?.friendId ?? "").trim();

    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    if (!friendID) {
      res.status(400).json({ error: "Informe a conversa." });
      return;
    }

    await proxyBackendWithoutBody(
      `/api/messages/${encodeURIComponent(friendID)}/${encodeURIComponent(userID)}/read`,
      "PUT",
      res
    );
  });

  app.post("/api/messages", authMiddleware, async (req: AuthedRequest, res) => {
    const userID = req.user?._id.toHexString();
    const toID = String(req.body?.to_id ?? "").trim();
    const content = String(req.body?.content ?? "").trim();

    if (!userID) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    if (!toID || !content) {
      res.status(400).json({ error: "Informe destinatario e conteudo da mensagem." });
      return;
    }

    await proxyBackendWithJSON(
      "/api/messages",
      "POST",
      {
        from_id: userID,
        to_id: toID,
        content,
      },
      res
    );
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
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
