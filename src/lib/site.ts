export const site = {
  name: "Tanyora", intendedDomain: "tanyora.com",
  // Switch only after custom-domain verification; no unverified canonical host.
  publicUrl: "https://sunbeam-storage-hub.lovable.app",
  operator: "Abhishek kumar", location: "Vadodara, Gujarat, India",
  supportEmail: "tanyora@support.com", updated: "October 9, 2026",
  appId: "com.tanyora.app", appScheme: "tanyora",
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
