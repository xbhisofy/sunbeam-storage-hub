import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "./supabase";
import { useSession } from "../app/_layout";
import type { AccountProfile } from "./account-rules";
import { dedupeReads } from "./request-cache";

const readProfile = dedupeReads(async (uid: string) => {
  const { data, error } = await supabase.from("profiles").select("display_name,email,premium_tier,premium_until").eq("id", uid).single();
  if (error) throw error;
  return data as AccountProfile | null;
});

export function useProfile() {
  const session = useSession();
  const uid = session?.user.id;
  const identity = useRef(uid);
  identity.current = uid;
  const [state, setState] = useState<{ uid: string | undefined; profile: AccountProfile | null; loading: boolean; error: string | null }>({ uid, profile: null, loading: !!uid, error: null });
  const request = useRef(0);
  const reload = useCallback(async () => {
    if (!uid) return;
    const id = ++request.current;
    const valid = () => id === request.current && identity.current === uid;
    try {
      const profile = await readProfile(uid);
      if (valid()) setState({ uid, profile, loading: false, error: null });
    } catch { if (valid()) setState(previous => ({ uid, profile: previous.uid === uid ? previous.profile : null, loading: false, error: "Could not refresh your account. Please try again." })); }
  }, [uid]);
  useFocusEffect(useCallback(() => {
    void reload();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void reload(); });
    return () => { subscription.remove(); request.current++; };
  }, [reload]));
  const visible = state.uid === uid && uid ? state : { profile: null, loading: !!uid, error: null };
  return { ...visible, reload };
}