import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import authRoutes        from "./routes/auth.js";
import usersRoutes       from "./routes/users.js";
import projectsRoutes    from "./routes/projects.js";
import requestsRoutes    from "./routes/requests.js";
import exchangeRoutes    from "./routes/exchange.js";
import creditsRoutes     from "./routes/credits.js";
import marketplaceRoutes from "./routes/marketplace.js";
import webhooksRoutes    from "./routes/webhooks.js";
import adminRoutes       from "./routes/admin.js";
import aiRoutes          from "./routes/ai.js";

const app = new Hono();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use("*", logger());
app.use("*", prettyJSON());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  "http://localhost:5173",
  "http://localhost:8080",
].filter(Boolean) as string[];

app.use("*", cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  credentials: true,
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.route("/auth",        authRoutes);
app.route("/users",       usersRoutes);
app.route("/projects",    projectsRoutes);
app.route("/requests",    requestsRoutes);
app.route("/exchange",    exchangeRoutes);
app.route("/credits",     creditsRoutes);
app.route("/marketplace", marketplaceRoutes);
app.route("/webhooks",    webhooksRoutes);
app.route("/admin",       adminRoutes);
app.route("/ai",          aiRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
