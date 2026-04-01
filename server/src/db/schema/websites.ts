import { pgTable, uuid, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";

export const websites = pgTable("websites", {
  id:                      uuid("id").primaryKey().defaultRandom(),
  projectId:               uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  domain:                  text("domain").notNull().unique(),
  categories:              text("categories").array(),
  language:                text("language"),
  countries:               text("countries").array(),
  tags:                    text("tags").array(),
  availableLinkInsertion:  boolean("available_link_insertion").notNull().default(true),
  availableGuestPost:      boolean("available_guest_post").notNull().default(false),
  guidelinesLinkInsertion: text("guidelines_link_insertion"),
  guidelinesGuestPost:     text("guidelines_guest_post"),
  isMarketplace:           boolean("is_marketplace").notNull().default(false),
  marketplacePrice:        numeric("marketplace_price", { precision: 10, scale: 2 }),
  isActive:                boolean("is_active").notNull().default(true),
  createdAt:               timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:               timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Website    = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;
