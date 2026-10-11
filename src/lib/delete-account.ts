import type { SupabaseClient } from "@supabase/supabase-js";

// Shared permanent account-deletion logic. Used by the authenticated app
// server function AND the public API route the mobile app calls, so both
// flows behave identically (Play Store deletion requirement).
export async function deleteAccountData(
  supabaseAdmin: SupabaseClient,
  uid: string,
): Promise<{ ok: true }> {
  const { data: files, error: listError } = await supabaseAdmin
    .from("files")
    .select("storage_path")
    .eq("owner_id", uid);
  if (listError) throw new Error("Unable to list account files. Please retry.");
  const paths = (files ?? [])
    .map((f: { storage_path: string | null }) => f.storage_path)
    .filter((p: string | null): p is string => !!p);
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
}
