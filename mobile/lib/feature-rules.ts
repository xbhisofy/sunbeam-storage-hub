export const ACCOUNT_MENU = [
  { title: "Home", path: "/", icon: "home-outline", group: "Workspace" },
  { title: "My Content", path: "/content", icon: "folder-open-outline", group: "Workspace" },
  { title: "All Content", path: "/content", icon: "documents-outline", group: "Workspace" },
  { title: "Convert Link", path: "/convert", icon: "link-outline", group: "Workspace" },
  { title: "Earnings", path: "/earnings", icon: "trending-up-outline", group: "Account" },
  { title: "Wallet", path: "/wallet", icon: "wallet-outline", group: "Account" },
  { title: "OC Bonus", path: "/oc-bonus", icon: "gift-outline", group: "Account" },
  { title: "Referrals", path: "/referrals", icon: "people-outline", group: "Account" },
  { title: "Profile", path: "/profile", icon: "person-outline", group: "Account" },
  { title: "Premium", path: "/plans", icon: "diamond-outline", group: "Account" },
] as const;

export function parseShareSlug(input: string, shareHost: string, webHost: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || ![new URL(shareHost).host, new URL(webHost).host].includes(url.host) || url.username || url.password) return null;
    return url.pathname.match(/^\/s\/([A-Za-z0-9_-]+)\/?$/)?.[1] ?? null;
  } catch { return null; }
}

export function conversionProblem(source: { owner_id: string; expires_at: string | null }, uid: string, now = Date.now()) {
  if (source.owner_id === uid) return "This is your own file. Its share link is already available in All Content.";
  if (source.expires_at && new Date(source.expires_at).getTime() <= now) return "This share link has expired.";
  return null;
}

export const canOpenPayment = (action: "wallet" | "plans" | "earnings", distribution: string) => action === "earnings" || distribution === "direct";
export const usd = (value: number | string) => `$${Number(value).toFixed(2)}`;
export const inr = (value: number | string) => `₹${Number(value).toLocaleString("en-IN")}`;
export const pendingTotal = (rows: { status: string; amount: number | string }[]) => rows.filter(r => r.status === "pending" || r.status === "approved").reduce((sum, r) => sum + Number(r.amount), 0);