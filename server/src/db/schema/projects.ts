import { pgTable, uuid, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const projects = pgTable("projects", {
  id:                      uuid("id").primaryKey().defaultRandom(),
  userId:                  uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:                    text("name").notNull(),
  domain:                  text("domain").notNull(),
  verified:                boolean("verified").notNull().default(false),
  verificationMethod:      text("verification_method"), // 'meta_tag' | 'dns'
  verificationToken:       text("verification_token"),
  exchangeEnabled:         boolean("exchange_enabled").notNull().default(false),
  exchangeStatus:          text("exchange_status").notNull().default("pending"), // 'pending' | 'active' | 'paused' | 'rejected'
  guidelinesLinkInsertion: text("guidelines_link_insertion"),
  guidelinesGuestPost:     text("guidelines_guest_post"),
  notes:                   text("notes"),
  createdAt:               timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:               timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [unique("uq_user_domain").on(t.userId, t.domain)]);

export type Project    = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
