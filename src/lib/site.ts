export const site = {
  name: "Tanyora", intendedDomain: "tanyora.com",
  // Switch only after custom-domain verification; no unverified canonical host.
  publicUrl: "https://tanyora.lovable.app",
  operator: "Abhishek kumar", location: "Vadodara, Gujarat, India",
  supportEmail: "tanyora@support.com", updated: "October 9, 2026",
  appId: "com.tanyora.app", appScheme: "tanyora",
  // Installed Android package (PWABuilder TWA); Play Store links must use this.
  androidPackage: "app.lovable.tanyora.twa",
  // Share links live on the main domain (opens app); the dashboard lives on the web subdomain.
  // While both are the same host the split is inert (hostRedirect returns null) and everything
  // runs on one address. When app.tanyora.com is connected, set webUrl to it — the split turns
  // on by itself. The second Lovable address cannot be used: it serves 403 to visitors.
  shareUrl: "https://tanyora.lovable.app",
  webUrl: "https://tanyora.lovable.app",
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
