import { Hono } from "hono";
import { eq, and, isNotNull, isNull, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { backlinkRequests, notifications } from "../db/schema/index.js";

const app = new Hono();

// Internal auth — callers must pass the CRON_SECRET header
app.use("*", async (c, next) => {
  const secret = process.env.CRON_SECRET;
  if (secret && c.req.header("x-cron-secret") !== secret) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
});

// POST /cron/check-tat-overdue
// Finds accepted requests where acceptedAt + tatDays + 1 < now, and hasn't been
// notified yet (no tat_overdue notification exists for that request).
// Safe to run repeatedly — deduplicates by checking existing notifications.
app.post("/check-tat-overdue", async (c) => {
  const now = new Date();

  // Fetch all Accepted requests that have a TAT and an acceptedAt set
  const accepted = await db.select().from(backlinkRequests).where(
    and(
      eq(backlinkRequests.status, "Accepted"),
      isNotNull(backlinkRequests.tatDays),
      isNotNull(backlinkRequests.acceptedAt),
    )
  );

  const overdue = accepted.filter((r) => {
    if (!r.acceptedAt || !r.tatDays) return false;
    const deadline = new Date(r.acceptedAt);
    deadline.setDate(deadline.getDate() + r.tatDays + 1);
    return now > deadline;
  });

  if (!overdue.length) return c.json({ notified: 0 });

  // For each overdue request, check if we've already sent a tat_overdue notification
  // We use metadata.requestId to deduplicate
  let notified = 0;

  for (const r of overdue) {
    const parties: { userId: string | null; domain: string }[] = [
      { userId: r.requesterId,  domain: r.requesterDomain },
      { userId: r.publisherId,  domain: r.publisherDomain },
    ];

    for (const party of parties) {
      if (!party.userId) continue;

      // Check if notification already sent for this request + user
      const existing = await db.select({ id: notifications.id }).from(notifications).where(
        and(
          eq(notifications.userId, party.userId),
          eq(notifications.type, "tat_overdue"),
        )
      ).limit(100);

      const alreadySent = existing.some((n) => {
        try {
          const meta = n as unknown as { metadata?: { requestId?: string } };
          return (meta as any).metadata?.requestId === r.id;
        } catch { return false; }
      });

      if (alreadySent) continue;

      const isPublisher = party.domain === r.publisherDomain;
      const otherDomain = isPublisher ? r.requesterDomain : r.publisherDomain;

      await db.insert(notifications).values({
        userId: party.userId,
        type:   "tat_overdue",
        title:  "TAT deadline passed on a backlink request",
        body:   isPublisher
          ? `The link for ${otherDomain}'s request on ${r.publisherDomain} is overdue. You can send them a note explaining the delay.`
          : `The link on ${r.publisherDomain} is past the agreed turnaround time. You can send a note to the publisher.`,
        metadata: {
          requestId:      r.id,
          requesterDomain: r.requesterDomain,
          publisherDomain: r.publisherDomain,
        },
      });

      notified++;
    }
  }

  return c.json({ notified, overdueCount: overdue.length });
});

export default app;
