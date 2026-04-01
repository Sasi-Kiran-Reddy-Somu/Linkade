import { pgTable, uuid, smallint, integer, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";

export const projectMetrics = pgTable("project_metrics", {
  id:        uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  dr:        smallint("dr"),
  da:        smallint("da"),
  tf:        smallint("tf"),
  traffic:   integer("traffic"),
  rd:        integer("rd"),
  spamScore: smallint("spam_score"),
  asScore:   smallint("as_score"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
});

export type ProjectMetric    = typeof projectMetrics.$inferSelect;
export type NewProjectMetric = typeof projectMetrics.$inferInsert;
