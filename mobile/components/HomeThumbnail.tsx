import { useEffect, useState } from "react";
import { Image } from "react-native";
import { supabase } from "../lib/supabase";
import { FileIcon } from "./FileCard";

export function HomeThumbnail({ path, type }: { path: string | null; type: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUrl(null);
    if (type !== "image" || !path) return;
    // Existing signed storage reads remain subject to the server delivery guard.
    void supabase.storage.from("files").createSignedUrl(path, 300).then(({ data, error }) => {
      if (active && !error && data?.signedUrl) setUrl(data.signedUrl);
    }).catch(() => { if (active) setUrl(null); });
    return () => { active = false; };
  }, [path, type]);
  return url ? <Image source={{ uri: url }} accessible={false} resizeMode="cover" onError={() => setUrl(null)} style={{ width: 36, height: 36, borderRadius: 8 }} /> : <FileIcon type={type} size={36} />;
}