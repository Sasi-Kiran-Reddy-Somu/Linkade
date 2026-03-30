import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc, ilike } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "../db/index.js";
import { websites, websiteMetrics, marketplaceOrders, payments } from "../db/schema/index.js";
import { authMiddleware } from "../middleware/auth.js";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}
const app = new Hono();
app.use("*", authMiddleware);

// GET /marketplace/websites
app.get("/websites", async (c) => {
  const page   = Number(c.req.query("page") ?? 1);
  const limit  = Math.min(Number(c.req.query("limit") ?? 30), 100);
  const search = c.req.query("search");

  const rows = await db
    .select({ website: websites, metrics: websiteMetrics })
    .from(websites)
    .leftJoin(websiteMetrics, eq(websiteMetrics.websiteId, websites.id))
    .where(and(
      eq(websites.isMarketplace, true),
      eq(websites.isActive, true),
      search ? ilike(websites.domain, `%${search}%`) : undefined,
    ))
    .orderBy(desc(websiteMetrics.dr))
    .limit(limit)
    .offset((page - 1) * limit);

  return c.json({ data: rows, page, limit });
});

// GET /marketplace/websites/:id
app.get("/websites/:id", async (c) => {
  const [row] = await db
    .select({ website: websites, metrics: websiteMetrics })
    .from(websites)
    .leftJoin(websiteMetrics, eq(websiteMetrics.websiteId, websites.id))
    .where(and(eq(websites.id, c.req.param("id")), eq(websites.isMarketplace, true), eq(websites.isActive, true)))
    .limit(1);

  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// POST /marketplace/orders
const orderSchema = z.object({
  websiteId:   z.string().uuid(),
  requestType: z.enum(["Link Insertion", "Guest Post"]),
  sourceUrl:   z.string().url(),
  anchorText:  z.string().optional(),
  targetUrl:   z.string().url().optional(),
  title:       z.string().optional(),
  description: z.string().min(1),
});

app.post("/orders", zValidator("json", orderSchema), async (c) => {
  const userId = c.get("userId");
  const body   = c.req.valid("json");

  const [website] = await db.select().from(websites)
    .where(and(eq(websites.id, body.websiteId), eq(websites.isMarketplace, true)))
    .limit(1);

  if (!website || !website.marketplacePrice) return c.json({ error: "Listing not found" }, 404);

  const amountUsd = Number(website.marketplacePrice);
  const intent = await getStripe().paymentIntents.create({
    amount:   Math.round(amountUsd * 100),
    currency: "usd",
    metadata: { userId, websiteId: body.websiteId, type: "marketplace_order" },
  });

  const [payment] = await db.insert(payments).values({
    userId, stripePaymentId: intent.id,
    amountUsd: String(amountUsd),
    type: "marketplace_order", status: "pending",
    metadata: { websiteId: body.websiteId },
  }).returning();

  const [order] = await db.insert(marketplaceOrders).values({
    buyerId:     userId,
    websiteId:   body.websiteId,
    paymentId:   payment.id,
    requestType: body.requestType,
    sourceUrl:   body.sourceUrl,
    anchorText:  body.anchorText,
    targetUrl:   body.targetUrl,
    title:       body.title,
    description: body.description,
  }).returning();

  return c.json({ order, clientSecret: intent.client_secret }, 201);
});

// GET /marketplace/orders
app.get("/orders", async (c) => {
  const userId = c.get("userId");
  const rows = await db.select().from(marketplaceOrders)
    .where(eq(marketplaceOrders.buyerId, userId))
    .orderBy(desc(marketplaceOrders.createdAt));

  return c.json({ data: rows });
});

// GET /marketplace/orders/:id
app.get("/orders/:id", async (c) => {
  const userId = c.get("userId");
  const [order] = await db.select().from(marketplaceOrders)
    .where(and(eq(marketplaceOrders.id, c.req.param("id")), eq(marketplaceOrders.buyerId, userId)))
    .limit(1);

  if (!order) return c.json({ error: "Not found" }, 404);
  return c.json(order);
});

export default app;
