import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Permanently deletes the signed-in user's files and account (Play Store requirement).
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: files, error: listError } = await supabaseAdmin.from("files").select("storage_path").eq("owner_id", uid);
    if (listError) throw new Error("Unable to list account files. Please retry.");
    const paths = (files ?? []).map((f) => f.storage_path).filter((p): p is string => !!p);
    for (let start = 0; start < paths.length; start += 100) {
      const { error } = await supabaseAdmin.storage.from("files").remove(paths.slice(start, start + 100));
      if (error) throw new Error("Unable to delete uploaded files. Please retry.");
    }
    const { error: fileError } = await supabaseAdmin.from("files").delete().eq("owner_id", uid);
    if (fileError) throw new Error("Unable to delete file records. Please retry.");
    // profiles.id uses ON DELETE CASCADE; deleting auth also removes the profile.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
