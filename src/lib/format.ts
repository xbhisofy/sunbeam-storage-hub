export function fileKind(mime: string): "video" | "audio" | "image" | "pdf" | "other" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (!mime) return "other";
  return "other";
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function money(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

export function formatFileDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function fileMetadata(file: { size: number; created_at: string; views: number }, app: boolean) {
  const metadata = `${formatSize(file.size)} · ${formatFileDate(file.created_at)}`;
  return app ? metadata : `${metadata} · ${file.views} views`;
}
