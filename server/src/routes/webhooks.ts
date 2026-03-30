import { Hono } from "hono";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, payments, creditTransactions } from "../db/schema/index.js";
import { jobs } from "../lib/queue.js";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}
const app = new Hono();

// POST /webhooks/stripe — raw body required for signature verification
app.post("/stripe", async (c) => {
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "Missing signature" }, 400);

  const rawBody = await c.req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { userId, packageId, credits, type } = intent.metadata;

    // Mark payment succeeded
    await db.update(payments)
      .set({ status: "succeeded" })
      .where(eq(payments.stripePaymentId, intent.id));

    if (type === "marketplace_order") {
      // Marketplace — no credit grant, order status will be updated separately
      return c.json({ received: true });
    }

    // Credit purchase — grant credits
    const creditsToAdd = Number(credits);
    const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
    if (!user) return c.json({ received: true });

    await db.update(users)
      .set({ credits: user.credits + creditsToAdd })
      .where(eq(users.id, userId));

    await db.insert(creditTransactions).values({
      userId, amount: creditsToAdd, type: "purchase",
      description: `Credit purchase — ${packageId} package`,
      balanceAfter: user.credits + creditsToAdd,
    });

    await jobs.sendEmail({
      to: userId, type: "payment_receipt",
      payload: { credits: creditsToAdd, packageId, newBalance: user.credits + creditsToAdd },
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await db.update(payments)
      .set({ status: "failed" })
      .where(eq(payments.stripePaymentId, intent.id));
  }

  return c.json({ received: true });
});

export default app;
