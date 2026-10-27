import { supabase } from "./supabase";

// Owners do not need a subscription; protected storage delivery still applies.
export async function loadSharedFile(slug: string) {
  try {
    const { data: file, error } = await supabase.from("files").select("owner_id,name,file_type,mime,storage_path,source,external_url,expires_at").eq("slug", slug).maybeSingle();
    if (error || !file) return { kind: "missing" as const };
    if (file.expires_at !== null) {
      const expiry = Date.parse(file.expires_at);
      if (!Number.isFinite(expiry)) return { kind: "missing" as const };
      if (expiry <= Date.now()) return { kind: "expired" as const };
    }
    if (!file.storage_path) return { kind: "missing" as const };
    const { data, error: signingError } = await supabase.storage.from("files").createSignedUrl(file.storage_path, 3 * 3600);
    if (signingError || !data?.signedUrl || new URL(data.signedUrl).protocol !== "https:") return { kind: "missing" as const };
    return { kind: "ok" as const, name: file.name, file_type: file.file_type, mime: file.mime, source: file.source, url: data.signedUrl };
  } catch {
    return { kind: "missing" as const };
  }
}