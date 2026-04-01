import { Hono } from "hono";
import { eq, and, ilike, gte, lte, inArray, desc, asc, sql, SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { websites, websiteMetrics } from "../db/schema/index.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono();
app.use("*", authMiddleware);

// GET /exchange/websites
app.get("/websites", async (c) => {
  const q = c.req.query;
  const page   = Number(q("page") ?? 1);
  const limit  = Math.min(Number(q("limit") ?? 30), 100);
  const search = q("search");
  const sortBy = q("sort_by") ?? "dr";
  const sortAscending = q("sort_order") === "asc";

  // Build filters
  const conditions: SQL[] = [
    eq(websites.isActive, true),
    eq(websites.isMarketplace, false),
    ...(search ? [ilike(websites.domain, `%${search}%`)] : []),
    ...(q("language") ? [eq(websites.language, q("language")!)] : []),
    ...(q("available_link_insertion") === "true" ? [eq(websites.availableLinkInsertion, true)] : []),
    ...(q("available_guest_post")     === "true" ? [eq(websites.availableGuestPost, true)] : []),
  ];

  const rows = await db
    .select({
      website: websites,
      metrics: websiteMetrics,
    })
    .from(websites)
    .leftJoin(websiteMetrics, eq(websiteMetrics.websiteId, websites.id))
    .where(and(...conditions))
    .orderBy(sortAscending ? asc(websiteMetrics.dr) : desc(websiteMetrics.dr))
    .limit(limit)
    .offset((page - 1) * limit);

  return c.json({ data: rows, page, limit });
});

// GET /exchange/websites/:id
app.get("/websites/:id", async (c) => {
  const [row] = await db
    .select({ website: websites, metrics: websiteMetrics })
    .from(websites)
    .leftJoin(websiteMetrics, eq(websiteMetrics.websiteId, websites.id))
    .where(and(eq(websites.id, c.req.param("id")), eq(websites.isActive, true)))
    .limit(1);

  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

export default app;
