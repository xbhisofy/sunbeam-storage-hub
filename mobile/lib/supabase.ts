import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config";

// Same backend as app.tanyora.com — one database, one login.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    // Opaque sb_ keys are not JWTs: send as apikey, never as a bearer.
    fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (SUPABASE_PUBLISHABLE_KEY.startsWith("sb_") && h.get("Authorization") === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`) h.delete("Authorization");
      h.set("apikey", SUPABASE_PUBLISHABLE_KEY);
      return fetch(input, { ...init, headers: h });
    },
  },
  auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

AppState.addEventListener("change", (s) => (s === "active" ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh()));
