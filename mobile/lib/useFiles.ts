import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSession } from "../app/_layout";
import { myFiles, type FileRow } from "./files";

// Loads the signed-in user's files and refreshes whenever the screen regains focus.
export function useFiles() {
  const session = useSession();
  const uid = session?.user.id;
  const identity = useRef(uid);
  identity.current = uid;
  const generation = useRef(0);
  const [state, setState] = useState<{ uid: string | undefined; files: FileRow[]; loading: boolean; refreshing: boolean; error: string | null }>({ uid, files: [], loading: !!uid, refreshing: false, error: null });

  const load = useCallback(async (pull = false) => {
    if (!uid) return;
    const version = ++generation.current;
    const valid = () => identity.current === uid && generation.current === version;
    setState(previous => ({ uid, files: previous.uid === uid ? previous.files : [], loading: previous.uid !== uid || previous.loading, refreshing: pull, error: null }));
    try {
      const files = await myFiles(uid);
      if (valid()) setState({ uid, files, loading: false, refreshing: false, error: null });
    } catch {
      if (valid()) setState(previous => ({ ...previous, loading: false, refreshing: false, error: "Could not load your files. Please try again." }));
    }
  }, [uid]);

  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  const visible = state.uid === uid && uid ? state : { files: [], loading: !!uid, refreshing: false, error: null };
  const setFiles = useCallback((files: FileRow[]) => { setState(previous => identity.current === uid ? { ...previous, uid, files } : previous); }, [uid]);
  return { ...visible, setFiles, reload: () => load(true) };
}
