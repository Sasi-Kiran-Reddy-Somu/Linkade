import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { projects, projectMetrics } from "../db/schema/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { jobs } from "../lib/queue.js";

const app = new Hono();
app.use("*", authMiddleware);

const createSchema = z.object({
  name:            z.string().min(1),
  domain:          z.string().min(3),
  exchangeEnabled: z.boolean().optional().default(false),
  category:        z.string().optional(),
  tags:            z.array(z.string()).optional(),
});

const updateSchema = z.object({
  name:                    z.string().min(1).optional(),
  notes:                   z.string().optional(),
  exchangeEnabled:         z.boolean().optional(),
  exchangeStatus:          z.enum(["pending", "active", "paused"]).optional(),
  guidelinesLinkInsertion: z.string().optional(),
  guidelinesGuestPost:     z.string().optional(),
});

// GET /projects
app.get("/", async (c) => {
  const userId = c.get("userId");
  const rows = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  return c.json(rows);
});

// POST /projects
app.post("/", zValidator("json", createSchema), async (c) => {
  const userId = c.get("userId");
  const { name, domain, exchangeEnabled, category, tags } = c.req.valid("json");

  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();

  const [project] = await db.insert(projects).values({
    userId, name, domain: clean,
    exchangeEnabled,
    category,
    tags,
    verificationToken: randomUUID(),
  }).returning();

  // Kick off metric refresh in background
  await jobs.refreshProjectMetrics({ projectId: project.id });

  return c.json(project, 201);
});

// GET /projects/:id
app.get("/:id", async (c) => {
  const userId = c.get("userId");
  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, c.req.param("id")), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return c.json({ error: "Not found" }, 404);

  const metrics = await db.select().from(projectMetrics)
    .where(eq(projectMetrics.projectId, project.id))
    .orderBy(desc(projectMetrics.fetchedAt))
    .limit(1);

  return c.json({ ...project, metrics: metrics[0] ?? null });
});

// PATCH /projects/:id
app.patch("/:id", zValidator("json", updateSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  const [updated] = await db.update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, c.req.param("id")), eq(projects.userId, userId)))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /projects/:id
app.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const [deleted] = await db.delete(projects)
    .where(and(eq(projects.id, c.req.param("id")), eq(projects.userId, userId)))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// POST /projects/:id/verify
app.post("/:id/verify", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ method: "meta_tag" | "dns" }>();

  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, c.req.param("id")), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return c.json({ error: "Not found" }, 404);

  await db.update(projects)
    .set({ verificationMethod: body.method, updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  await jobs.verifyDomain({ projectId: project.id });

  return c.json({
    token:  project.verificationToken,
    method: body.method,
    status: "pending",
  });
});

// GET /projects/:id/metrics
app.get("/:id/metrics", async (c) => {
  const userId = c.get("userId");
  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, c.req.param("id")), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return c.json({ error: "Not found" }, 404);

  const metrics = await db.select().from(projectMetrics)
    .where(eq(projectMetrics.projectId, project.id))
    .orderBy(desc(projectMetrics.fetchedAt))
    .limit(90);

  return c.json(metrics);
});

// GET /projects/:id/metrics/delta
app.get("/:id/metrics/delta", async (c) => {
  const userId = c.get("userId");
  const days = Number(c.req.query("days") ?? 30);

  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, c.req.param("id")), eq(projects.userId, userId)))
    .limit(1);

  if (!project) return c.json({ error: "Not found" }, 404);

  const snapshots = await db.select().from(projectMetrics)
    .where(eq(projectMetrics.projectId, project.id))
    .orderBy(desc(projectMetrics.fetchedAt))
    .limit(days + 1);

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  if (!latest || !oldest) return c.json({ delta: null });

  return c.json({
    delta: {
      dr:        (latest.dr ?? 0) - (oldest.dr ?? 0),
      da:        (latest.da ?? 0) - (oldest.da ?? 0),
      tf:        (latest.tf ?? 0) - (oldest.tf ?? 0),
      traffic:   (latest.traffic ?? 0) - (oldest.traffic ?? 0),
      rd:        (latest.rd ?? 0) - (oldest.rd ?? 0),
      spamScore: (latest.spamScore ?? 0) - (oldest.spamScore ?? 0),
    },
  });
});

export default app;
