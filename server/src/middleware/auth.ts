import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/jwt.js";

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userRole: string;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    c.set("userId", payload.sub);
    c.set("userRole", payload.role);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  if (c.get("userRole") !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
}
