import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const backlinkRequests = pgTable("backlink_requests", {
  id:              uuid("id").primaryKey().defaultRandom(),
  requesterId:     uuid("requester_id").references(() => users.id, { onDelete: "set null" }),
  requesterDomain: text("requester_domain").notNull(),
  publisherId:     uuid("publisher_id").references(() => users.id, { onDelete: "set null" }),
  publisherDomain: text("publisher_domain").notNull(),
  requestType:     text("request_type").notNull(),    // 'Link Insertion' | 'Guest Post'
  status:          text("status").notNull().default("Pending"), // 'Pending' | 'Accepted' | 'Rejected' | 'On Hold' | 'Live'
  sourceUrl:       text("source_url"),
  anchorText:      text("anchor_text"),               // Link Insertion only
  targetUrl:       text("target_url"),                // Link Insertion only
  title:           text("title"),                     // Guest Post only
  description:     text("description").notNull(),
  tatDays:         integer("tat_days"),
  creditsCost:     integer("credits_cost").notNull(),
  creditsEarned:   integer("credits_earned").notNull(),
  liveVerifiedAt:  timestamp("live_verified_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type BacklinkRequest    = typeof backlinkRequests.$inferSelect;
export type NewBacklinkRequest = typeof backlinkRequests.$inferInsert;
