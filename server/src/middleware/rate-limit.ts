import type { Context, Next } from "hono";
import { rateLimit } from "../lib/redis.js";

export function rateLimiter(maxRequests: number, windowSeconds: number, keyFn?: (c: Context) => string) {
  return async (c: Context, next: Next) => {
    const key = keyFn
      ? keyFn(c)
      : `rl:${c.req.header("x-forwarded-for") ?? "unknown"}:${c.req.path}`;

    const { allowed, remaining } = await rateLimit(key, maxRequests, windowSeconds);

    c.header("X-RateLimit-Limit",     String(maxRequests));
    c.header("X-RateLimit-Remaining", String(remaining));

    if (!allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }
    await next();
  };
}
