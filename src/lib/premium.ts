// Premium plans sold on the website via UPI. Prices are monthly, in INR.
export const PREMIUM_PLANS = {
  plus: { name: "Plus", priceInr: 149, days: 30 },
  pro: { name: "Pro", priceInr: 399, days: 30 },
} as const;
export type PremiumTier = keyof typeof PREMIUM_PLANS;

export function activePremium(p?: { premium_tier?: string | null; premium_until?: string | null } | null): PremiumTier | null {
  if (!p?.premium_tier || !p.premium_until) return null;
  if (new Date(p.premium_until).getTime() <= Date.now()) return null;
  return p.premium_tier in PREMIUM_PLANS ? (p.premium_tier as PremiumTier) : null;
}
