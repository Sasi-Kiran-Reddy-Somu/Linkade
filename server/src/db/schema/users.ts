import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash"),              // null for OAuth users
  name:         text("name").notNull(),
  username:     text("username").notNull().unique(),
  bio:          text("bio"),
  avatarUrl:    text("avatar_url"),
  website:      text("website"),
  location:     text("location"),
  plan:         text("plan").notNull().default("free"), // 'free' | 'pro' | 'agency'
  role:         text("role").notNull().default("user"), // 'user' | 'admin'
  credits:      integer("credits").notNull().default(3),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
