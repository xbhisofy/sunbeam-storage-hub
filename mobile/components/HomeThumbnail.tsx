import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";
import { iconFor } from "../lib/files";

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
  const color = theme.cat[type] ?? theme.cat.other;
  return url ? <Image source={{ uri: url }} accessible={false} resizeMode="cover" onError={() => setUrl(null)} style={{ width: 36, height: 36, borderRadius: 8 }} /> : <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }}><Ionicons name={iconFor(type)} size={20} color={color.fg} /></View>;
}