import { Hono } from "hono";
import { eq, and, ilike, desc, asc, SQL, arrayOverlaps } from "drizzle-orm";
import { db } from "../db/index.js";
import { websites, websiteMetrics, projects } from "../db/schema/index.js";
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

// GET /exchange/suggested — websites whose categories/tags match the user's projects
app.get("/suggested", async (c) => {
  const userId = c.get("userId");
  const limit  = Math.min(Number(c.req.query("limit") ?? 30), 100);

  // Collect all unique categories and tags from the user's projects
  const userProjects = await db.select({ category: projects.category, tags: projects.tags })
    .from(projects)
    .where(eq(projects.userId, userId));

  const userCategories = [...new Set(
    userProjects.map((p) => p.category).filter(Boolean) as string[]
  )];
  const userTags = [...new Set(
    userProjects.flatMap((p) => p.tags ?? [])
  )];

  if (!userCategories.length && !userTags.length) {
    return c.json({ data: [], page: 1, limit });
  }

  const rows = await db
    .select({ website: websites, metrics: websiteMetrics })
    .from(websites)
    .leftJoin(websiteMetrics, eq(websiteMetrics.websiteId, websites.id))
    .where(and(
      eq(websites.isActive, true),
      eq(websites.isMarketplace, false),
      userCategories.length > 0
        ? arrayOverlaps(websites.categories, userCategories)
        : undefined,
    ))
    .orderBy(desc(websiteMetrics.dr))
    .limit(limit);

  return c.json({ data: rows, page: 1, limit });
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
