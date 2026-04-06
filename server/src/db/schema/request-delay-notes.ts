import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { backlinkRequests } from "./backlink-requests.js";

export const requestDelayNotes = pgTable("request_delay_notes", {
  id:          uuid("id").primaryKey().defaultRandom(),
  requestId:   uuid("request_id").notNull().references(() => backlinkRequests.id, { onDelete: "cascade" }),
  fromUserId:  uuid("from_user_id").references(() => users.id, { onDelete: "set null" }),
  toUserId:    uuid("to_user_id").references(() => users.id, { onDelete: "set null" }),
  fromSide:    text("from_side").notNull(), // 'requester' | 'publisher'
  note:        text("note").notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type RequestDelayNote    = typeof requestDelayNotes.$inferSelect;
export type NewRequestDelayNote = typeof requestDelayNotes.$inferInsert;
