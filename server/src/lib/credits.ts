/**
 * Credit calculation — identical logic to the frontend lib/credits.ts
 * but lives here as the authoritative server-side version.
 * Result is always 1–10 credits.
 */
export function calcLinkCredits(
  dr: number,
  da: number,
  traffic: number,
  tf: number,
  spamScore: number,
): number {
  const drPart = Math.floor(dr * 0.2);
  const daPart = Math.floor(da * 0.15);
  const tfPart = Math.floor(tf * 0.1);

  let trafficPart: number;
  if (traffic >= 10_000_000)     trafficPart = 18;
  else if (traffic >= 2_000_000) trafficPart = 12;
  else if (traffic >= 500_000)   trafficPart = 8;
  else if (traffic >= 150_000)   trafficPart = 5;
  else if (traffic >= 50_000)    trafficPart = 3;
  else if (traffic >= 7_000)     trafficPart = 2;
  else                           trafficPart = 1;

  let spamPenalty: number;
  if (spamScore >= 15)      spamPenalty = 6;
  else if (spamScore >= 8)  spamPenalty = 3;
  else if (spamScore >= 4)  spamPenalty = 1;
  else                      spamPenalty = 0;

  const raw = Math.max(1, drPart + daPart + tfPart + trafficPart - spamPenalty);
  return Math.max(1, Math.min(10, Math.round(1 + ((raw - 1) / 59) * 9)));
}

export const CREDIT_PACKAGES = [
  { id: "starter", label: "Starter", credits: 5,  priceUsd: 9.99  },
  { id: "growth",  label: "Growth",  credits: 15, priceUsd: 24.99 },
  { id: "pro",     label: "Pro",     credits: 35, priceUsd: 49.99 },
  { id: "agency",  label: "Agency",  credits: 80, priceUsd: 99.99 },
] as const;

export type CreditPackageId = typeof CREDIT_PACKAGES[number]["id"];
