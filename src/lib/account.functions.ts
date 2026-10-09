import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Permanently deletes the signed-in user's files and account (Play Store requirement).
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: files } = await supabaseAdmin.from("files").select("storage_path").eq("owner_id", uid);
    const paths = (files ?? []).map((f) => f.storage_path).filter((p): p is string => !!p);
    if (paths.length) await supabaseAdmin.storage.from("files").remove(paths);
    await supabaseAdmin.from("files").delete().eq("owner_id", uid);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
