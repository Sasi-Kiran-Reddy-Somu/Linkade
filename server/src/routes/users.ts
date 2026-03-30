import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, count, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, projects, backlinkRequests } from "../db/schema/index.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono();
app.use("*", authMiddleware);

const updateSchema = z.object({
  name:     z.string().min(1).optional(),
  username: z.string().min(3).max(30).optional(),
  bio:      z.string().max(500).optional(),
  website:  z.string().url().optional().or(z.literal("")),
  location: z.string().max(100).optional(),
});

// GET /users/me
app.get("/me", async (c) => {
  const userId = c.get("userId");
  const [user] = await db.select({
    id: users.id, email: users.email, name: users.name,
    username: users.username, bio: users.bio, avatarUrl: users.avatarUrl,
    website: users.website, location: users.location,
    plan: users.plan, credits: users.credits, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

// PATCH /users/me
app.patch("/me", zValidator("json", updateSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  const [updated] = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return c.json(updated);
});

// GET /users/me/stats
app.get("/me/stats", async (c) => {
  const userId = c.get("userId");

  const userProjects = await db.select({ id: projects.id, domain: projects.domain })
    .from(projects).where(eq(projects.userId, userId));

  const projectCount = userProjects.length;
  const domains = userProjects.map((p) => p.domain);

  const allRequests = await db.select({
    id: backlinkRequests.id,
    requesterDomain: backlinkRequests.requesterDomain,
    publisherDomain: backlinkRequests.publisherDomain,
    status: backlinkRequests.status,
  }).from(backlinkRequests).where(
    inArray(backlinkRequests.requesterDomain, domains.length ? domains : ["__none__"])
  );

  const incoming = allRequests.filter((r) => domains.includes(r.publisherDomain));
  const outgoing = allRequests.filter((r) => domains.includes(r.requesterDomain));
  const liveCount = [...incoming, ...outgoing].filter((r) => r.status === "Live").length;
  const responded = incoming.filter((r) => r.status !== "Pending").length;
  const responsiveness = incoming.length > 0 ? (responded / incoming.length) * 100 : 0;

  const [{ credits }] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));

  return c.json({
    projectCount,
    requestsSent:     outgoing.length,
    requestsReceived: incoming.length,
    linksLive:        liveCount,
    responsiveness:   Math.round(responsiveness),
    credits,
  });
});

// DELETE /users/me
app.delete("/me", async (c) => {
  const userId = c.get("userId");
  await db.delete(users).where(eq(users.id, userId));
  return c.json({ ok: true });
});

export default app;
