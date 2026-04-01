import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;
const connection = redisUrl ? { url: redisUrl } : null;

function makeQueue(name: string) {
  if (!connection) return null;
  return new Queue(name, { connection });
}

const metricsQueue        = makeQueue("metrics");
const verificationQueue   = makeQueue("verification");
const responsivenessQueue = makeQueue("responsiveness");
const emailQueue          = makeQueue("email");

export interface RefreshProjectMetricsJob  { projectId: string }
export interface RefreshWebsiteMetricsJob  { websiteId: string }
export interface VerifyDomainJob           { projectId: string }
export interface VerifyLinkLiveJob         { requestId: string }
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

const noop = () => Promise.resolve(undefined as any);

export const jobs = {
  refreshProjectMetrics: (data: RefreshProjectMetricsJob) =>
    metricsQueue?.add("refresh-project-metrics", data, { attempts: 3, backoff: { type: "exponential", delay: 5000 } }) ?? noop(),

  refreshWebsiteMetrics: (data: RefreshWebsiteMetricsJob) =>
    metricsQueue?.add("refresh-website-metrics", data, { attempts: 3, backoff: { type: "exponential", delay: 5000 } }) ?? noop(),

  verifyDomain: (data: VerifyDomainJob) =>
    verificationQueue?.add("verify-domain", data, { attempts: 3, backoff: { type: "exponential", delay: 3000 } }) ?? noop(),

  verifyLinkLive: (data: VerifyLinkLiveJob) =>
    verificationQueue?.add("verify-link-live", data, { attempts: 3, backoff: { type: "exponential", delay: 10000 } }) ?? noop(),

  recomputeResponsiveness: (data: RecomputeResponsivenessJob) =>
    responsivenessQueue?.add("recompute", data) ?? noop(),

  sendEmail: (data: SendEmailJob) =>
    emailQueue?.add("send-email", data, { attempts: 3, backoff: { type: "exponential", delay: 2000 } }) ?? noop(),
};
