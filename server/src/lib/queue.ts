import { Queue, Worker, type Job } from "bullmq";
import { redis } from "./redis.js";

const connection = { url: process.env.REDIS_URL! };

// ── Queue definitions ─────────────────────────────────────────────────────────

export const metricsQueue       = new Queue("metrics",       { connection });
export const verificationQueue  = new Queue("verification",  { connection });
export const responsivenessQueue = new Queue("responsiveness", { connection });
export const emailQueue         = new Queue("email",         { connection });
export const cleanupQueue       = new Queue("cleanup",       { connection });

// ── Job payload types ─────────────────────────────────────────────────────────

export interface RefreshProjectMetricsJob { projectId: string }
export interface RefreshWebsiteMetricsJob { websiteId: string }
export interface VerifyDomainJob          { projectId: string }
export interface VerifyLinkLiveJob        { requestId: string }
export interface RecomputeResponsivenessJob { userId: string; projectId?: string }
export interface SendEmailJob {
  to: string;
  type:
    | "new_request"
    | "request_accepted"
    | "request_rejected"
    | "link_live"
    | "low_credits"
    | "payment_receipt";
  payload: Record<string, unknown>;
}

// ── Enqueue helpers ───────────────────────────────────────────────────────────

export const jobs = {
  refreshProjectMetrics: (data: RefreshProjectMetricsJob) =>
    metricsQueue.add("refresh-project-metrics", data, { attempts: 3, backoff: { type: "exponential", delay: 5000 } }),

  refreshWebsiteMetrics: (data: RefreshWebsiteMetricsJob) =>
    metricsQueue.add("refresh-website-metrics", data, { attempts: 3, backoff: { type: "exponential", delay: 5000 } }),

  verifyDomain: (data: VerifyDomainJob) =>
    verificationQueue.add("verify-domain", data, { attempts: 3, backoff: { type: "exponential", delay: 3000 } }),

  verifyLinkLive: (data: VerifyLinkLiveJob) =>
    verificationQueue.add("verify-link-live", data, { attempts: 3, backoff: { type: "exponential", delay: 10000 } }),

  recomputeResponsiveness: (data: RecomputeResponsivenessJob) =>
    responsivenessQueue.add("recompute", data),

  sendEmail: (data: SendEmailJob) =>
    emailQueue.add("send-email", data, { attempts: 3, backoff: { type: "exponential", delay: 2000 } }),
};
