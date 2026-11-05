import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const PAGE_SIZE = 200;
type FileRow = Database["public"]["Tables"]["files"]["Row"] & { moderation_status?: string; scan_status?: string };

// Keep complete totals while respecting backend response caps. One shared
// account-scoped query prevents duplicate loads between Home, Content and Shared.
export async function loadOwnedFiles(userId: string, signal?: AbortSignal): Promise<FileRow[]> {
  const files: FileRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const query = supabase.from("files").select("*").eq("owner_id", userId)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    const { data, error } = await (signal ? query.abortSignal(signal) : query);
    if (error) throw error;
    const page = data ?? [];
    files.push(...page);
    if (page.length < PAGE_SIZE) return files;
  }
}

export const ownedFilesOptions = (userId: string) => queryOptions({
  queryKey: ["files", userId],
  queryFn: ({ signal }) => loadOwnedFiles(userId, signal),
  staleTime: 60_000,
});