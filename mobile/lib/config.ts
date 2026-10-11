// Central mobile config — mirrors the website's src/lib/site.ts values.
// Publishable key is safe to ship in client code (same as the website).
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://yzeaobckelzhrcchwpna.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_nXz4VBI5cCYvjQB1Kg21_w_Um-IsXwr";
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://sunbeam-storage-hub.lovable.app";

export const BRAND = {
  name: "Tanyora",
  supportEmail: "tanyora@support.com",
};

export const RATES = {
  viewPer1000: 3, // $3 per 1000 views (view-based plan)
  referralSignup: 0.1, // $0.10 per successful signup (referral plan)
  commission: 0.1, // 10% of a referred user's view earnings
  minWithdrawal: 5, // $5 minimum withdrawal
  maxPlanSwitches: 3,
};
