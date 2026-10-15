// Central mobile config — mirrors the website's src/lib/site.ts values.
// Backend URL/key come from EXPO_PUBLIC_* env (set in eas.json); the publishable key is safe in client code.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://app.tanyora.com/backend";
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://app.tanyora.com";
export const SHARE_URL = process.env.EXPO_PUBLIC_SHARE_URL ?? "https://tanyora.com";

export const BRAND = { name: "Tanyora", supportEmail: "tanyora@support.com" };

// Google's official test ad units are used until real IDs are supplied for release builds.
export const ADS = {
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL ?? "ca-app-pub-3940256099942544/1033173712",
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER ?? "ca-app-pub-3940256099942544/6300978111",
};

export const shareLink = (slug: string) => `${SHARE_URL}/s/${slug}`;
export const LEGAL = [
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Terms of Service", path: "/terms" },
  { label: "Community Guidelines", path: "/community-guidelines" },
  { label: "Copyright & DMCA", path: "/copyright" },
  { label: "Help & FAQ", path: "/faq" },
];
