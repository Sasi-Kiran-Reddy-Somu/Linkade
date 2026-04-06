import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, or, inArray, desc, asc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { backlinkRequests, users, projects, websites, websiteMetrics, creditTransactions, linkVerifications, notifications, requestDelayNotes } from "../db/schema/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { calcLinkCredits } from "../lib/credits.js";
import { jobs } from "../lib/queue.js";

const app = new Hono();
app.use("*", authMiddleware);

const sendSchema = z.object({
  publisherDomain: z.string().min(3),
  requesterDomain: z.string().min(3),
  requestType:     z.enum(["Link Insertion", "Guest Post"]),
  sourceUrl:       z.string().url(),
  anchorText:      z.string().optional(),
  targetUrl:       z.string().url().optional(),
  title:           z.string().optional(),
  description:     z.string().min(1),
});

async function getUserDomains(userId: string) {
  const rows = await db.select({ domain: projects.domain }).from(projects).where(eq(projects.userId, userId));
  return rows.map((r) => r.domain);
}

// GET /requests — all requests across all user's projects
app.get("/", async (c) => {
  const userId  = c.get("userId");
  const status  = c.req.query("status");
  const type    = c.req.query("type");
  const search  = c.req.query("domain_search");
  const sortBy  = c.req.query("sort_by") ?? "created_at";
  const sortAsc = c.req.query("sort_order") === "asc";
  const page    = Number(c.req.query("page") ?? 1);
  const limit   = Math.min(Number(c.req.query("limit") ?? 50), 100);

  const domains = await getUserDomains(userId);
  if (!domains.length) return c.json({ data: [], total: 0 });

  let query = db.select().from(backlinkRequests).where(
    or(
      inArray(backlinkRequests.requesterDomain, domains),
      inArray(backlinkRequests.publisherDomain, domains),
    )
  );

  // Apply status + type + search filters via subquery approach
  const rows = await db.select().from(backlinkRequests).where(
    and(
      or(
        inArray(backlinkRequests.requesterDomain, domains),
        inArray(backlinkRequests.publisherDomain, domains),
      ),
      status ? eq(backlinkRequests.status, status) : undefined,
      type   ? eq(backlinkRequests.requestType, type) : undefined,
    )
  ).orderBy(sortAsc ? asc(backlinkRequests.createdAt) : desc(backlinkRequests.createdAt))
   .limit(limit)
   .offset((page - 1) * limit);

  return c.json({ data: rows });
});

// GET /requests/incoming
app.get("/incoming", async (c) => {
  const userId  = c.get("userId");
  const domains = await getUserDomains(userId);
  if (!domains.length) return c.json({ data: [] });

  const rows = await db.select().from(backlinkRequests)
    .where(inArray(backlinkRequests.publisherDomain, domains))
    .orderBy(desc(backlinkRequests.createdAt));

  return c.json({ data: rows });
});

// GET /requests/outgoing
app.get("/outgoing", async (c) => {
  const userId  = c.get("userId");
  const domains = await getUserDomains(userId);
  if (!domains.length) return c.json({ data: [] });

  const rows = await db.select().from(backlinkRequests)
    .where(inArray(backlinkRequests.requesterDomain, domains))
    .orderBy(desc(backlinkRequests.createdAt));

  return c.json({ data: rows });
});

// POST /requests — send a new request
app.post("/", zValidator("json", sendSchema), async (c) => {
  const userId = c.get("userId");
  const body   = c.req.valid("json");

  // Confirm requester domain belongs to user
  const [project] = await db.select().from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.domain, body.requesterDomain)))
    .limit(1);
  if (!project) return c.json({ error: "Requester domain not found or not yours" }, 403);
  if (!project.verified) return c.json({ error: "Project must be verified before sending requests" }, 403);

  // Block duplicate active requests
  const [duplicate] = await db.select().from(backlinkRequests).where(
    and(
      eq(backlinkRequests.requesterDomain, body.requesterDomain),
      eq(backlinkRequests.publisherDomain, body.publisherDomain),
      inArray(backlinkRequests.status, ["Pending", "Accepted", "On Hold"]),
    )
  ).limit(1);
  if (duplicate) return c.json({ error: "An active request to this domain already exists" }, 409);

  // Get publisher metrics to calculate credits
  const [website] = await db.select().from(websites)
    .where(eq(websites.domain, body.publisherDomain)).limit(1);

  const [metrics] = website
    ? await db.select().from(websiteMetrics).where(eq(websiteMetrics.websiteId, website.id)).limit(1)
    : [null];

  const credits = metrics
    ? calcLinkCredits(metrics.dr ?? 0, metrics.da ?? 0, metrics.traffic ?? 0, metrics.tf ?? 0, metrics.spamScore ?? 0)
    : 1;

  // Check user has enough credits
  const [{ balance }] = await db.select({ balance: users.credits }).from(users).where(eq(users.id, userId));
  if (balance < credits) return c.json({ error: "Insufficient credits", required: credits, balance }, 402);

  // Deduct credits + insert request atomically (best effort with sequential writes)
  await db.update(users).set({ credits: balance - credits }).where(eq(users.id, userId));

  const [request] = await db.insert(backlinkRequests).values({
    requesterId:     userId,
    requesterDomain: body.requesterDomain,
    publisherDomain: body.publisherDomain,
    requestType:     body.requestType,
    sourceUrl:       body.sourceUrl,
    anchorText:      body.anchorText,
    targetUrl:       body.targetUrl,
    title:           body.title,
    description:     body.description,
    creditsCost:     credits,
    creditsEarned:   credits,
  }).returning();

  await db.insert(creditTransactions).values({
    userId, amount: -credits, type: "request_sent",
    referenceId: request.id, description: `Request to ${body.publisherDomain}`,
    balanceAfter: balance - credits,
  });

  // Notify publisher
  await jobs.sendEmail({
    to:      body.publisherDomain,
    type:    "new_request",
    payload: { requestId: request.id, requesterDomain: body.requesterDomain },
  });

  return c.json(request, 201);
});

// GET /requests/:id
app.get("/:id", async (c) => {
  const userId  = c.get("userId");
  const domains = await getUserDomains(userId);

  const [request] = await db.select().from(backlinkRequests)
    .where(eq(backlinkRequests.id, c.req.param("id")))
    .limit(1);

  if (!request) return c.json({ error: "Not found" }, 404);
  if (!domains.includes(request.requesterDomain) && !domains.includes(request.publisherDomain)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json(request);
});

// PATCH /requests/:id/status
const statusSchema = z.object({
  status:  z.enum(["Accepted", "Rejected", "On Hold"]),
  tatDays: z.number().int().min(1).max(365).optional(),
});

app.patch("/:id/status", zValidator("json", statusSchema), async (c) => {
  const userId = c.get("userId");
  const { status, tatDays } = c.req.valid("json");
  const domains = await getUserDomains(userId);

  const [request] = await db.select().from(backlinkRequests)
    .where(eq(backlinkRequests.id, c.req.param("id"))).limit(1);

  if (!request) return c.json({ error: "Not found" }, 404);
  if (!domains.includes(request.publisherDomain)) return c.json({ error: "Forbidden — publishers only" }, 403);

  const now = new Date();
  const [updated] = await db.update(backlinkRequests)
    .set({
      status,
      tatDays: status === "Accepted" ? tatDays : request.tatDays,
      acceptedAt: status === "Accepted" ? now : request.acceptedAt,
      updatedAt: now,
    })
    .where(eq(backlinkRequests.id, request.id))
    .returning();

  // Refund on reject
  if (status === "Rejected" && request.requesterId) {
    const [{ credits }] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, request.requesterId));
    await db.update(users).set({ credits: credits + request.creditsCost }).where(eq(users.id, request.requesterId));
    await db.insert(creditTransactions).values({
      userId: request.requesterId, amount: request.creditsCost, type: "refund",
      referenceId: request.id, description: `Refund — request to ${request.publisherDomain} rejected`,
      balanceAfter: credits + request.creditsCost,
    });
  }

  // Notify requester
  await jobs.sendEmail({
    to: request.requesterDomain, type: status === "Accepted" ? "request_accepted" : "request_rejected",
    payload: { requestId: request.id, publisherDomain: request.publisherDomain, tatDays },
  });

  // Recompute responsiveness for publisher
  await jobs.recomputeResponsiveness({ userId });

  return c.json(updated);
});

// POST /requests/:id/delay-note — send a delay note to the other party
app.post("/:id/delay-note", zValidator("json", z.object({ note: z.string().min(1).max(1000) })), async (c) => {
  const userId  = c.get("userId");
  const { note } = c.req.valid("json");
  const domains = await getUserDomains(userId);

  const [request] = await db.select().from(backlinkRequests)
    .where(eq(backlinkRequests.id, c.req.param("id"))).limit(1);

  if (!request) return c.json({ error: "Not found" }, 404);
  if (!domains.includes(request.requesterDomain) && !domains.includes(request.publisherDomain)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (request.status !== "Accepted") {
    return c.json({ error: "Delay notes can only be sent on accepted requests" }, 400);
  }

  const isPublisher = domains.includes(request.publisherDomain);
  const fromSide   = isPublisher ? "publisher" : "requester";
  const toUserId   = isPublisher ? request.requesterId : request.publisherId;

  const [delayNote] = await db.insert(requestDelayNotes).values({
    requestId: request.id,
    fromUserId: userId,
    toUserId:   toUserId ?? undefined,
    fromSide,
    note,
  }).returning();

  // Notify the other party
  if (toUserId) {
    await db.insert(notifications).values({
      userId:    toUserId,
      type:      "delay_note",
      title:     "Delay update on a backlink request",
      body:      `${isPublisher ? request.publisherDomain : request.requesterDomain} sent a note about the delay: "${note.slice(0, 120)}${note.length > 120 ? "..." : ""}"`,
      metadata:  { requestId: request.id, fromSide, from: isPublisher ? request.publisherDomain : request.requesterDomain },
    });
  }

  return c.json(delayNote, 201);
});

// GET /requests/:id/delay-notes — fetch all delay notes for a request
app.get("/:id/delay-notes", async (c) => {
  const userId  = c.get("userId");
  const domains = await getUserDomains(userId);

  const [request] = await db.select().from(backlinkRequests)
    .where(eq(backlinkRequests.id, c.req.param("id"))).limit(1);

  if (!request) return c.json({ error: "Not found" }, 404);
  if (!domains.includes(request.requesterDomain) && !domains.includes(request.publisherDomain)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const notes = await db.select().from(requestDelayNotes)
    .where(eq(requestDelayNotes.requestId, request.id))
    .orderBy(requestDelayNotes.createdAt);

  return c.json({ data: notes });
});

// POST /requests/:id/verify-live
app.post("/:id/verify-live", async (c) => {
  const userId  = c.get("userId");
  const domains = await getUserDomains(userId);

  const [request] = await db.select().from(backlinkRequests)
    .where(eq(backlinkRequests.id, c.req.param("id"))).limit(1);

  if (!request) return c.json({ error: "Not found" }, 404);
  if (!domains.includes(request.requesterDomain) && !domains.includes(request.publisherDomain)) {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (request.status !== "Accepted") {
    return c.json({ error: "Request must be Accepted before marking live" }, 400);
  }

  await jobs.verifyLinkLive({ requestId: request.id });
  return c.json({ ok: true, message: "Verification job queued" });
});

export default app;
