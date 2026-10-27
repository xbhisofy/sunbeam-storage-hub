import { supabase } from "./supabase";

// Owners do not need a subscription; protected storage delivery still applies.
export async function loadSharedFile(slug: string) {
  const { data: file } = await supabase.from("files").select("owner_id,name,file_type,mime,storage_path,source,external_url,expires_at").eq("slug", slug).maybeSingle();
  if (!file) return { kind: "missing" as const };
  if (file.expires_at && new Date(file.expires_at).getTime() < Date.now()) return { kind: "expired" as const };
  let url = file.external_url ?? "";
  if (file.storage_path) url = (await supabase.storage.from("files").createSignedUrl(file.storage_path, 3 * 3600)).data?.signedUrl ?? "";
  return { kind: "ok" as const, name: file.name, file_type: file.file_type, mime: file.mime, source: file.source, url };
}