import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const creditTransactions = pgTable("credit_transactions", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount:       integer("amount").notNull(),       // positive = credit, negative = debit
  type:         text("type").notNull(),            // 'purchase' | 'request_sent' | 'link_live' | 'refund' | 'welcome_bonus' | 'adjustment'
  referenceId:  uuid("reference_id"),             // backlink_request.id or payment.id
  description:  text("description"),
  balanceAfter: integer("balance_after").notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type CreditTransaction    = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
