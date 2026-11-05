import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type AvatarUser = { user_metadata?: Record<string, unknown> } | null | undefined;

// Resolves the profile photo: a private avatars-bucket path stored in
// user_metadata.avatar_path (signed on demand), or a direct https URL such
// as a Google sign-in photo.
export function useAvatarUrl(user: AvatarUser) {
  const meta = (user?.user_metadata ?? {}) as { avatar_path?: unknown; avatar_url?: unknown };
  const path = typeof meta.avatar_path === "string" && meta.avatar_path ? meta.avatar_path : null;
  const direct = typeof meta.avatar_url === "string" && meta.avatar_url.startsWith("https://") ? meta.avatar_url : null;
  const [signed, setSigned] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) { setSigned(null); return; }
    void supabase.storage.from("avatars").createSignedUrl(path, 3600).then(({ data, error }) => {
      if (alive) setSigned(error ? null : data?.signedUrl ?? null);
    });
    return () => { alive = false; };
  }, [path]);
  return path ? signed : direct;
}
