// Central mobile config — mirrors the website's src/lib/site.ts values.
// Backend URL/key come from EXPO_PUBLIC_* env (set in eas.json); the publishable key is safe in client code.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://app.tanyora.com/backend";
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxOTIzODk1LCJleHAiOjE5NDk2MDM4OTV9.IqEOYBgtsoTGPBmAAjlc2ajhNoHLwnrhXHY7H1sT_6s";
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://app.tanyora.com";
export const SHARE_URL = process.env.EXPO_PUBLIC_SHARE_URL ?? "https://tanyora.com";

export const BRAND = { name: "Tanyora", supportEmail: "tanyora@support.com" };

// Owner's real AdMob ad units (app ID lives in app.json).
export const ADS = {
  interstitial: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL ?? "ca-app-pub-2600116803972478/4484980349",
  banner: process.env.EXPO_PUBLIC_ADMOB_BANNER ?? "ca-app-pub-2600116803972478/3271136873",
};

export const shareLink = (slug: string) => `${SHARE_URL}/s/${slug}`;
export const LEGAL = [
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Terms of Service", path: "/terms" },
  { label: "Community Guidelines", path: "/community-guidelines" },
  { label: "Copyright & DMCA", path: "/copyright" },
  { label: "Help & FAQ", path: "/faq" },
];
