import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { MongoClient, MongoServerError, ObjectId, type Collection, type WithId } from "mongodb";

type UserRecord = {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type SessionRecord = {
  token: string;
  userId: ObjectId;
  createdAt: Date;
};

type SafeUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type AuthedRequest = express.Request & {
  user?: WithId<UserRecord>;
  token?: string;
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://backend:8080";
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://mongodb:27017";
const MONGO_DB = process.env.MONGO_DB ?? "platone";
const AUTH_USERS_COLLECTION = process.env.AUTH_USERS_COLLECTION ?? "auth_users";
const AUTH_SESSIONS_COLLECTION = process.env.AUTH_SESSIONS_COLLECTION ?? "auth_sessions";

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

async function startServer() {
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();

  const db = mongoClient.db(MONGO_DB);
  const usersCollection = db.collection<UserRecord>(AUTH_USERS_COLLECTION);
  const sessionsCollection = db.collection<SessionRecord>(AUTH_SESSIONS_COLLECTION);

  await Promise.all([
    usersCollection.createIndex({ email: 1 }, { unique: true }),
    sessionsCollection.createIndex({ token: 1 }, { unique: true }),
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
  const PORT = 3000;
  const httpServer = createHttpServer(app);
  const authMiddleware = buildAuthMiddleware(usersCollection, sessionsCollection);

  app.use(express.json());

  app.post("/api/auth/register", async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!name || !email || !password) {
      res.status(400).json({ error: "Preencha nome, email e senha." });
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
        name,
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

  // Dashboard data now comes from the Go backend (MongoDB), no local mocks.
  app.get("/api/platinums", authMiddleware, async (_req, res) => {
    await proxyBackendGet("/api/platinums", res);
  });

  app.get("/api/stats", authMiddleware, async (_req, res) => {
    await proxyBackendGet("/api/stats", res);
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
