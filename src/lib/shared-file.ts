import { supabase } from "@/integrations/supabase/client";

// Owner previews use the same delivery guard and expiry as other app viewers.
export async function loadSharedFile(slug: string) {
  try {
    const { data: file, error } = await supabase.from("files").select("owner_id,name,file_type,mime,size,storage_path,views,source,external_url,header_text,footer_text,expires_at").eq("slug", slug).maybeSingle();
    if (error || !file) return null;
    if (file.expires_at !== null) {
      const expiry = Date.parse(file.expires_at);
      if (!Number.isFinite(expiry)) return null;
      if (expiry <= Date.now()) return { expired: true as const };
    }
    if (!file.storage_path) return null;
    const { data, error: signingError } = await supabase.storage.from("files").createSignedUrl(file.storage_path, 3 * 3600);
    if (signingError || !data?.signedUrl || new URL(data.signedUrl).protocol !== "https:") return null;
    return { ...file, url: data.signedUrl };
  } catch {
    return null;
  }
}