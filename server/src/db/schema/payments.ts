import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const payments = pgTable("payments", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  stripePaymentId: text("stripe_payment_id").unique(),
  amountUsd:       numeric("amount_usd", { precision: 10, scale: 2 }).notNull(),
  creditsGranted:  integer("credits_granted"),     // null for marketplace purchases
  type:            text("type").notNull(),          // 'credit_purchase' | 'marketplace_order'
  status:          text("status").notNull().default("pending"), // 'pending' | 'succeeded' | 'failed' | 'refunded'
  metadata:        jsonb("metadata"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Payment    = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
