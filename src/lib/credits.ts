/**
 * Credits formula: calculates how many credits a backlink is worth
 * based on the publisher site's SEO metrics.
 *
 * Incoming (you publish) → you EARN these credits when marked live
 * Outgoing (you request) → this is the credit cost to send the request
 *
 * Formula (returns 1–15):
 *   traffic_score = (log10(min(traffic, 1_000_000) + 1) / log10(1_000_001)) ^ 1.27
 *   dr_score      = (dr / 100) ^ 0.17 × e ^ (0.01 × (dr - 100))
 *   tf_score      = (tf / 100) ^ 0.1  × e ^ (0.007 × (tf - 100))
 *   Edge case: if any input ≤ 0 its individual score is 0
 *   composite     = traffic_score × 35 + dr_score × 30 + tf_score × 35
 *   credits       = clamp(round(1 + (composite / 100) × 14), 1, 15)
 */
export function calcLinkCredits(
  dr: number,
  _da: number,
  traffic: number,
  tf: number,
  _spamScore: number,
): number {
  const trafficScore =
    traffic <= 0
      ? 0
      : Math.pow(
          Math.log10(Math.min(traffic, 1_000_000) + 1) / Math.log10(1_000_001),
          1.27,
        );

  const drScore =
    dr <= 0
      ? 0
      : Math.pow(dr / 100, 0.17) * Math.exp(0.01 * (dr - 100));

  const tfScore =
    tf <= 0
      ? 0
      : Math.pow(tf / 100, 0.1) * Math.exp(0.007 * (tf - 100));

  const composite = trafficScore * 35 + drScore * 30 + tfScore * 35;
  const normalised = composite / 100;
  return Math.max(1, Math.min(15, Math.round(1 + normalised * 14)));
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
