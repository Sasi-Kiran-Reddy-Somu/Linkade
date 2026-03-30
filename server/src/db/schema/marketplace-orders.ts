import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { websites } from "./websites";
import { payments } from "./payments";

export const marketplaceOrders = pgTable("marketplace_orders", {
  id:          uuid("id").primaryKey().defaultRandom(),
  buyerId:     uuid("buyer_id").references(() => users.id, { onDelete: "set null" }),
  websiteId:   uuid("website_id").references(() => websites.id, { onDelete: "set null" }),
  paymentId:   uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  requestType: text("request_type"),               // 'Link Insertion' | 'Guest Post'
  sourceUrl:   text("source_url"),
  anchorText:  text("anchor_text"),
  targetUrl:   text("target_url"),
  title:       text("title"),
  description: text("description"),
  status:      text("status").notNull().default("pending"), // 'pending' | 'in_progress' | 'live' | 'refunded'
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type MarketplaceOrder    = typeof marketplaceOrders.$inferSelect;
export type NewMarketplaceOrder = typeof marketplaceOrders.$inferInsert;
