import { pgTable, uuid, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable("notifications", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:      text("type").notNull(),   // 'new_request' | 'request_accepted' | 'request_rejected' | 'link_live' | 'low_credits'
  title:     text("title").notNull(),
  body:      text("body"),
  read:      boolean("read").notNull().default(false),
  metadata:  jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Notification    = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
