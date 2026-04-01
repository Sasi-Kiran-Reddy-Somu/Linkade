import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Set it in your environment variables.");
}

const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: process.env.DATABASE_URL.includes("sslmode=require") ? "require" : undefined,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
