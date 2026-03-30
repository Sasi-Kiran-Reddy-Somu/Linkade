import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, creditTransactions } from "../db/schema/index.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { setex, get, del } from "../lib/redis.js";
import { rateLimiter } from "../middleware/rate-limit.js";

const app = new Hono();

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name:     z.string().min(1),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

// POST /auth/register
app.post("/register",
  rateLimiter(5, 60, (c) => `rl:register:${c.req.header("x-forwarded-for")}`),
  zValidator("json", registerSchema),
  async (c) => {
    const { email, password, name, username } = c.req.valid("json");

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return c.json({ error: "Email already in use" }, 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash, name, username }).returning();

    // Welcome bonus — 3 credits already set by default in schema
    await db.insert(creditTransactions).values({
      userId:       user.id,
      amount:       3,
      type:         "welcome_bonus",
      description:  "Welcome bonus credits",
      balanceAfter: 3,
    });

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      signRefreshToken(user.id),
    ]);

    await setex(`refresh:${user.id}:${refreshToken}`, 60 * 60 * 24 * 30, "1");

    return c.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } }, 201);
  },
);

// POST /auth/login
app.post("/login",
  rateLimiter(10, 60, (c) => `rl:login:${c.req.header("x-forwarded-for")}`),
  zValidator("json", loginSchema),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.passwordHash) return c.json({ error: "Invalid credentials" }, 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return c.json({ error: "Invalid credentials" }, 401);

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      signRefreshToken(user.id),
    ]);

    await setex(`refresh:${user.id}:${refreshToken}`, 60 * 60 * 24 * 30, "1");

    return c.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
  },
);

// POST /auth/refresh
app.post("/refresh", async (c) => {
  const body = await c.req.json<{ refreshToken: string }>();
  if (!body.refreshToken) return c.json({ error: "Missing refresh token" }, 400);

  try {
    const { sub: userId } = await verifyRefreshToken(body.refreshToken);
    const exists = await get(`refresh:${userId}:${body.refreshToken}`);
    if (!exists) return c.json({ error: "Invalid refresh token" }, 401);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return c.json({ error: "User not found" }, 404);

    const accessToken = await signAccessToken({ sub: user.id, role: user.role });
    return c.json({ accessToken });
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
});

// POST /auth/logout
app.post("/logout", async (c) => {
  const body = await c.req.json<{ refreshToken: string }>();
  if (body.refreshToken) {
    try {
      const { sub: userId } = await verifyRefreshToken(body.refreshToken);
      await del(`refresh:${userId}:${body.refreshToken}`);
    } catch { /* already invalid */ }
  }
  return c.json({ ok: true });
});

export default app;
