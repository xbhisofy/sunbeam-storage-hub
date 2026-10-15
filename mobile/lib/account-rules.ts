export type AccountProfile = { display_name: string | null; email: string | null; premium_tier: string | null; premium_until: string | null };

export function currentPlan(profile: AccountProfile | null, now = Date.now()) {
  const tier = profile?.premium_tier;
  const active = !!profile?.premium_until && new Date(profile.premium_until).getTime() > now;
  if (active && (tier === "plus" || tier === "pro")) return { tier, name: tier === "plus" ? "Plus" : "Pro", storage: (tier === "plus" ? 100 : 1024) * 1024 ** 3 };
  return { tier: "free", name: "Free", storage: 1024 ** 3 };
}

export function validateProfile(name: string, email: string) {
  if (!name.trim() || name.trim().length > 80) return "Enter a name between 1 and 80 characters.";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
  return null;
}

// Never accept arbitrary redirect destinations from incoming links.
export function sharedDestination(path: string): `/s/${string}` | null {
  const match = path.match(/^\/s\/([A-Za-z0-9_-]+)\/?$/);
  return match ? `/s/${match[1]}` : null;
}