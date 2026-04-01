import Redis from "ioredis";

function createRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[Redis] REDIS_URL not set — Redis features disabled.");
    return null;
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  client.on("error", (err) => {
    console.error("[Redis] connection error:", err.message);
  });
  return client;
}

export const redis = createRedisClient();

// ── helpers ───────────────────────────────────────────────────────────────────

export async function setex(key: string, ttlSeconds: number, value: string) {
  await redis?.setex(key, ttlSeconds, value);
}

export async function get(key: string): Promise<string | null> {
  return redis?.get(key) ?? null;
}

export async function del(key: string) {
  await redis?.del(key);
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return { allowed: true, remaining: maxRequests };

  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const multi = redis.multi();
  multi.zremrangebyscore(key, "-inf", windowStart);
  multi.zadd(key, now, `${now}`);
  multi.zcard(key);
  multi.expire(key, windowSeconds);
  const results = await multi.exec();

  const count = (results?.[2]?.[1] as number) ?? 0;
  const allowed = count <= maxRequests;
  return { allowed, remaining: Math.max(0, maxRequests - count) };
}
