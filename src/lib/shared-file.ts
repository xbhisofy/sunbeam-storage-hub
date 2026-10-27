import { supabase } from "@/integrations/supabase/client";

// Owner previews use the same delivery guard and expiry as other app viewers.
export async function loadSharedFile(slug: string) {
  const { data: file } = await supabase.from("files").select("owner_id,name,file_type,mime,size,storage_path,views,source,external_url,header_text,footer_text,expires_at").eq("slug", slug).maybeSingle();
  if (!file) return null;
  if (file.expires_at && new Date(file.expires_at).getTime() < Date.now()) return { expired: true as const };
  if (!file.storage_path) return { ...file, url: file.external_url ?? "" };
  const { data } = await supabase.storage.from("files").createSignedUrl(file.storage_path, 3 * 3600);
  return { ...file, url: data?.signedUrl ?? "" };
}