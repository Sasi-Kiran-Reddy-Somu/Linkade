import { pgTable, uuid, smallint, integer, timestamp } from "drizzle-orm/pg-core";
import { websites } from "./websites";

export const websiteMetrics = pgTable("website_metrics", {
  id:        uuid("id").primaryKey().defaultRandom(),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  dr:        smallint("dr"),
  da:        smallint("da"),
  tf:        smallint("tf"),
  traffic:   integer("traffic"),
  rd:        integer("rd"),
  spamScore: smallint("spam_score"),
  asScore:   smallint("as_score"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
});

export type WebsiteMetric    = typeof websiteMetrics.$inferSelect;
export type NewWebsiteMetric = typeof websiteMetrics.$inferInsert;
