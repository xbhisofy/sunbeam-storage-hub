export const site = {
  name: "Tanyora", intendedDomain: "tanyora.com",
  // Switch only after custom-domain verification; no unverified canonical host.
  publicUrl: "https://tanyora.lovable.app",
  operator: "Abhishek kumar", location: "Vadodara, Gujarat, India",
  supportEmail: "tanyora@support.com", updated: "October 9, 2026",
  appId: "com.tanyora.app", appScheme: "tanyora",
  // Installed Android package (PWABuilder TWA); Play Store links must use this.
  androidPackage: "app.lovable.sunbeam_storage_hub.twa",
  // Share links live on the main domain (opens app); the dashboard lives on the web subdomain.
  // Testing: second Lovable address stands in for app.tanyora.com until the domain is bought.
  shareUrl: "https://tanyora.lovable.app",
  webUrl: "https://project--27b885ad-6120-4d04-a5e6-077528851761.lovable.app",
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
