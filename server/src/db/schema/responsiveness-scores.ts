import { pgTable, uuid, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { projects } from "./projects.js";

export const responsivenessScores = pgTable("responsiveness_scores", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId:      uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  totalIncoming:  integer("total_incoming").notNull().default(0),
  respondedCount: integer("responded_count").notNull().default(0),
  score:          numeric("score", { precision: 5, scale: 2 }),
  computedAt:     timestamp("computed_at", { withTimezone: true }).defaultNow(),
});

export type ResponsivenessScore    = typeof responsivenessScores.$inferSelect;
export type NewResponsivenessScore = typeof responsivenessScores.$inferInsert;
