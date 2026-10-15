import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSession } from "../app/_layout";
import { myFiles, type FileRow } from "./files";

// Loads the signed-in user's files and refreshes whenever the screen regains focus.
export function useFiles() {
  const session = useSession();
  const uid = session?.user.id;
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (pull = false) => {
    if (!uid) return;
    if (pull) setRefreshing(true);
    try { setFiles(await myFiles(uid)); } catch { /* keep last list */ } finally { setLoading(false); setRefreshing(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return { files, setFiles, loading, refreshing, reload: () => load(true) };
}
