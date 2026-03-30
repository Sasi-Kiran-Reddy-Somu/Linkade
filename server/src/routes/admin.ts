import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, websites, websiteMetrics, creditTransactions } from "../db/schema/index.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { jobs } from "../lib/queue.js";

const app = new Hono();
app.use("*", authMiddleware, adminMiddleware);

// GET /admin/users
app.get("/users", async (c) => {
  const page  = Number(c.req.query("page") ?? 1);
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);

  const rows = await db.select({
    id: users.id, email: users.email, name: users.name,
    plan: users.plan, credits: users.credits, createdAt: users.createdAt,
  }).from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return c.json({ data: rows, page, limit });
});

// GET /admin/websites
app.get("/websites", async (c) => {
  const rows = await db.select().from(websites).orderBy(desc(websites.createdAt));
  return c.json({ data: rows });
});

// POST /admin/websites
const websiteSchema = z.object({
  domain:                  z.string().min(3),
  categories:              z.array(z.string()).optional(),
  language:                z.string().optional(),
  countries:               z.array(z.string()).optional(),
  tags:                    z.array(z.string()).optional(),
  availableLinkInsertion:  z.boolean().optional(),
  availableGuestPost:      z.boolean().optional(),
  guidelinesLinkInsertion: z.string().optional(),
  guidelinesGuestPost:     z.string().optional(),
  isMarketplace:           z.boolean().optional(),
  marketplacePrice:        z.number().optional(),
  dr: z.number().optional(), da: z.number().optional(),
  tf: z.number().optional(), traffic: z.number().optional(),
  rd: z.number().optional(), spamScore: z.number().optional(),
});

app.post("/websites", zValidator("json", websiteSchema), async (c) => {
  const { dr, da, tf, traffic, rd, spamScore, marketplacePrice, ...rest } = c.req.valid("json");

  const [website] = await db.insert(websites).values({
    ...rest,
    marketplacePrice: marketplacePrice ? String(marketplacePrice) : undefined,
  }).returning();

  if (dr !== undefined) {
    await db.insert(websiteMetrics).values({
      websiteId: website.id,
      dr, da, tf, traffic, rd, spamScore,
    });
  }

  return c.json(website, 201);
});

// PATCH /admin/websites/:id
app.patch("/websites/:id", zValidator("json", websiteSchema.partial()), async (c) => {
  const { marketplacePrice, dr, da, tf, traffic, rd, spamScore, ...rest } = c.req.valid("json");

  const [updated] = await db.update(websites)
    .set({ ...rest, marketplacePrice: marketplacePrice ? String(marketplacePrice) : undefined, updatedAt: new Date() })
    .where(eq(websites.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// POST /admin/credits/adjust
const adjustSchema = z.object({
  userId:      z.string().uuid(),
  amount:      z.number().int(),
  description: z.string(),
});

app.post("/credits/adjust", zValidator("json", adjustSchema), async (c) => {
  const { userId, amount, description } = c.req.valid("json");

  const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
  if (!user) return c.json({ error: "User not found" }, 404);

  const newBalance = user.credits + amount;
  await db.update(users).set({ credits: newBalance }).where(eq(users.id, userId));
  await db.insert(creditTransactions).values({
    userId, amount, type: "adjustment", description, balanceAfter: newBalance,
  });

  return c.json({ userId, newBalance });
});

// POST /admin/metrics/refresh
app.post("/metrics/refresh", async (c) => {
  const allWebsites = await db.select({ id: websites.id }).from(websites);
  for (const w of allWebsites) {
    await jobs.refreshWebsiteMetrics({ websiteId: w.id });
  }
  return c.json({ queued: allWebsites.length });
});

export default app;
