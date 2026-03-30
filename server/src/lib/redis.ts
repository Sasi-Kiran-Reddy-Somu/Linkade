import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("[Redis] connection error:", err);
});

// ── helpers ───────────────────────────────────────────────────────────────────

export async function setex(key: string, ttlSeconds: number, value: string) {
  await redis.setex(key, ttlSeconds, value);
}

export async function get(key: string) {
  return redis.get(key);
}

export async function del(key: string) {
  await redis.del(key);
}

// Rate-limit sliding window — returns { allowed, remaining, reset }
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
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
