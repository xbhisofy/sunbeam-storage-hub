import type { SupabaseClient } from "@supabase/supabase-js";

// Shared permanent account-deletion logic. Used by the authenticated app
// server function AND the public API route the mobile app calls, so both
// flows behave identically (Play Store deletion requirement).
export async function deleteAccountData(
  supabaseAdmin: SupabaseClient,
  uid: string,
): Promise<{ ok: true }> {
  // Enumerate before deleting: converted rows reference other uploaders' objects.
  const ownedPaths = new Set<string>();
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data: files, error: listError } = await supabaseAdmin
      .from("files")
      .select("id,storage_path,source")
      .eq("owner_id", uid)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (listError) throw new Error("Unable to list account files. Please retry.");
    for (const file of files ?? []) {
      const path = file.storage_path;
      if (file.source !== "original" || typeof path !== "string" || !path.startsWith(`${uid}/`)) continue;
      const segments = path.split("/");
      if (segments.some(segment => !segment || segment === "." || segment === "..") || /[\\%\u0000-\u001f]/.test(path)) continue;
      ownedPaths.add(path);
    }
    if ((files?.length ?? 0) < pageSize) break;
  }
  const paths = [...ownedPaths];
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
