// Only Tanyora-generated share destinations may enter the native file route.
export function shareDestinationFromUrl(value: string): `/s/${string}` | null {
  if (/[\\\u0000-\u0020]/.test(value) || /%(?:2f|5c|2e)/i.test(value) || /\/(?:\.|\.\.)(?:\/|$)/.test(value)) return null;
  if (value.startsWith("/")) {
    const match = value.match(/^\/s\/([A-Za-z0-9_-]+)\/?$/);
    return match ? `/s/${match[1]}` : null;
  }
  try {
    const url = new URL(value);
    if (url.username || url.password || url.port || url.search || url.hash) return null;
    if (url.protocol === "tanyora:" && url.hostname === "s") {
      const match = url.pathname.match(/^\/([A-Za-z0-9_-]+)\/?$/);
      return match ? `/s/${match[1]}` : null;
    }
    if (url.protocol !== "https:" || !["tanyora.com", "app.tanyora.com", "www.tanyora.com"].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/s\/([A-Za-z0-9_-]+)\/?$/);
    return match ? `/s/${match[1]}` : null;
  } catch { return null; }
}