import { supabase } from "@/integrations/supabase/client";

// Reads the locally stored session (no network round trip). The database still
// verifies the token on every request, so this is only used for UI decisions.
export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
