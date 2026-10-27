import { activePremium, PREMIUM_PLANS } from '@/lib/premium';

// Browser-only display adapter: mirrors native storage presentation without
// making the website compiler traverse the separate Expo project.
export function reviewPlan(profile: { premium_tier: string | null; premium_until: string | null } | null) {
  const tier = activePremium(profile);
  return tier
    ? { name: PREMIUM_PLANS[tier].name, storage: (tier === 'plus' ? 100 : 1024) * 1024 ** 3 }
    : { name: 'Free', storage: 1024 ** 3 };
}