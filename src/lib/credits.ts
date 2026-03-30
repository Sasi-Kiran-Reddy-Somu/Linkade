/**
 * Credits formula: calculates how many credits a backlink is worth
 * based on the publisher site's SEO metrics.
 *
 * Incoming (you publish) → you EARN these credits when marked live
 * Outgoing (you request) → this is the credit cost to send the request
 */
export function calcLinkCredits(
  dr: number,
  da: number,
  traffic: number,
  tf: number,
  spamScore: number,
): number {
  const drPart = Math.floor(dr * 0.2);        // DR 50 → 10, DR 80 → 16
  const daPart = Math.floor(da * 0.15);       // DA 50 → 7,  DA 85 → 12

  const trafficPart =
    traffic >= 10_000_000 ? 18 :
    traffic >= 2_000_000  ? 12 :
    traffic >= 500_000    ? 8  :
    traffic >= 150_000    ? 5  :
    traffic >= 50_000     ? 3  :
    traffic >= 7_000      ? 2  : 1;

  const tfPart = Math.floor(tf * 0.1);        // TF 30 → 3, TF 65 → 6

  const spamPenalty =
    spamScore >= 15 ? 6 :
    spamScore >= 8  ? 3 :
    spamScore >= 4  ? 1 : 0;

  // Raw score range across the dataset: ~1 (worst) to ~60 (best)
  const raw = Math.max(1, drPart + daPart + trafficPart + tfPart - spamPenalty);
  // Normalize to 1–10 scale: worst site = 1 credit, best site = 10 credits
  return Math.max(1, Math.min(10, Math.round(1 + (raw - 1) / 59 * 9)));
}

// ── Account credits (localStorage) ────────────────────────────────────────────

const CREDITS_KEY = "account-credits";
const DEFAULT_CREDITS = 3;

export function getAccountCredits(): number {
  const v = localStorage.getItem(CREDITS_KEY);
  return v !== null ? Number(v) : DEFAULT_CREDITS;
}

export function addAccountCredits(amount: number): number {
  const next = getAccountCredits() + amount;
  localStorage.setItem(CREDITS_KEY, String(next));
  // Notify all listeners (AppLayout, AppSidebar, etc.)
  window.dispatchEvent(new CustomEvent("creditsChanged"));
  return next;
}

export function spendAccountCredits(amount: number): number {
  const next = Math.max(0, getAccountCredits() - amount);
  localStorage.setItem(CREDITS_KEY, String(next));
  window.dispatchEvent(new CustomEvent("creditsChanged"));
  return next;
}
