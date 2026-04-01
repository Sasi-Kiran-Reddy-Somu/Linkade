import { pgTable, uuid, boolean, integer, text, timestamp } from "drizzle-orm/pg-core";
import { backlinkRequests } from "./backlink-requests.js";

export const linkVerifications = pgTable("link_verifications", {
  id:          uuid("id").primaryKey().defaultRandom(),
  requestId:   uuid("request_id").references(() => backlinkRequests.id, { onDelete: "cascade" }),
  verified:    boolean("verified"),
  checkedAt:   timestamp("checked_at", { withTimezone: true }).defaultNow(),
  httpStatus:  integer("http_status"),
  foundAnchor: text("found_anchor"),
  foundUrl:    text("found_url"),
  error:       text("error"),
});

export type LinkVerification    = typeof linkVerifications.$inferSelect;
export type NewLinkVerification = typeof linkVerifications.$inferInsert;
