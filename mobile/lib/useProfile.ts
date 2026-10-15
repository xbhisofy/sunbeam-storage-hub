import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "./supabase";
import { useSession } from "../app/_layout";
import type { AccountProfile } from "./account-rules";

export function useProfile() {
  const session = useSession();
  const uid = session?.user.id;
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const reload = useCallback(async () => {
    if (!uid) return;
    const id = ++request.current;
    try {
      const { data, error: problem } = await supabase.from("profiles").select("display_name,email,premium_tier,premium_until").eq("id", uid).single();
      if (problem) throw problem;
      if (id === request.current) { setProfile(data); setError(null); }
    } catch { if (id === request.current) setError("Could not refresh your account. Please try again."); }
    finally { if (id === request.current) setLoading(false); }
  }, [uid]);
  useFocusEffect(useCallback(() => {
    void reload();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void reload(); });
    return () => { subscription.remove(); request.current++; };
  }, [reload]));
  return { profile, loading, error, reload };
}