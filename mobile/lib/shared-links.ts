export function linkExpiry(expiresAt: string | null, now: number) {
  if (expiresAt === null) return { kind: "never" as const, label: "Never expires" };
  const time = Date.parse(expiresAt);
  if (!Number.isFinite(time)) return { kind: "unknown" as const, label: "Expiry unavailable" };
  if (time <= now) return { kind: "expired" as const, label: "Link expired" };
  return { kind: "active" as const, label: `Expires ${new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` };
}