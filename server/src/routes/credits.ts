import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "../db/index.js";
import { users, creditTransactions, payments } from "../db/schema/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { CREDIT_PACKAGES, type CreditPackageId } from "../lib/credits.js";
import { jobs } from "../lib/queue.js";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}
const app = new Hono();
app.use("*", authMiddleware);

// GET /credits
app.get("/", async (c) => {
  const userId = c.get("userId");
  const [{ credits }] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
  return c.json({ credits, packages: CREDIT_PACKAGES });
});

// GET /credits/transactions
app.get("/transactions", async (c) => {
  const userId = c.get("userId");
  const page   = Number(c.req.query("page") ?? 1);
  const limit  = Math.min(Number(c.req.query("limit") ?? 50), 100);

  const rows = await db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return c.json({ data: rows, page, limit });
});

// POST /credits/purchase — create Stripe payment intent
const purchaseSchema = z.object({
  packageId: z.enum(["starter", "growth", "pro", "agency"]),
});

app.post("/purchase", zValidator("json", purchaseSchema), async (c) => {
  const userId = c.get("userId");
  const { packageId } = c.req.valid("json");

  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return c.json({ error: "Invalid package" }, 400);

  const intent = await getStripe().paymentIntents.create({
    amount:   Math.round(pkg.priceUsd * 100),
    currency: "usd",
    metadata: { userId, packageId, credits: String(pkg.credits) },
  });

  // Record pending payment
  await db.insert(payments).values({
    userId,
    stripePaymentId: intent.id,
    amountUsd:       String(pkg.priceUsd),
    creditsGranted:  pkg.credits,
    type:            "credit_purchase",
    status:          "pending",
    metadata:        { packageId },
  });

  return c.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
});

export default app;
