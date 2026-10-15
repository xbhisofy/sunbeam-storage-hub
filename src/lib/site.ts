export const site = {
  name: "Tanyora", intendedDomain: "tanyora.com",
  // Verified custom domains — split is live.
  publicUrl: "https://tanyora.com",
  supportEmail: "tanyora@support.com", updated: "October 14, 2026",
  appId: "com.tanyora.app", appScheme: "tanyora",
  // Installed Android package (PWABuilder TWA); Play Store links must use this.
  androidPackage: "com.tanyora.twa",
  // Share links live on the main domain (opens app); the dashboard lives on the web subdomain.
  shareUrl: "https://tanyora.com",
  webUrl: "https://app.tanyora.com",
  // Owner supplied this package in Android App Links; replace with the final listing URL when supplied.
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.tanyora.twa",
} as const;
export function pageHead(title: string, description: string, path?: string, privatePage = false) {
  const fullTitle = `${title} — ${site.name}`;
  return {
    meta: [
      { title: fullTitle }, { name: "description", content: description },
      { property: "og:title", content: fullTitle }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ...(privatePage ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      ...(path ? [{ property: "og:url", content: `${site.publicUrl}${path}` }] : []),
    ],
    links: path ? [{ rel: "canonical", href: `${site.publicUrl}${path}` }] : [],
  };
}
