import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSession } from "../app/_layout";
import { supabase } from "./supabase";
import { conversionProblem, parseShareSlug } from "./feature-rules";
import { SHARE_URL, WEB_URL } from "./config";

export function useAccountData<T>(fetcher: (uid: string) => Promise<T>) {
  const uid = useSession()?.user.id;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const reload = useCallback(async () => {
    const id = ++request.current;
    if (!uid) { setData(null); setLoading(false); return; }
    try {
      const result = await fetcher(uid);
      if (id === request.current) { setData(result); setError(null); }
    } catch { if (id === request.current) setError("Could not refresh your account. Please try again."); }
    finally { if (id === request.current) setLoading(false); }
  }, [uid, fetcher]);
  useFocusEffect(useCallback(() => {
    void reload();
    const listener = AppState.addEventListener("change", state => { if (state === "active") void reload(); });
    return () => { listener.remove(); request.current++; };
  }, [reload]));
  return { data, loading, error, reload };
}

function checked<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function loadEarnings(uid: string) {
  const [profile, withdrawals, views] = await Promise.all([
    supabase.from("profiles").select("balance,paid_total,referral_earnings").eq("id", uid).single(),
    supabase.from("withdrawals").select("id,amount,method,status,admin_note,created_at").eq("user_id", uid).order("created_at", { ascending: false }),
    supabase.from("view_daily").select("day,views").eq("owner_id", uid).gte("day", new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10)),
  ]);
  return { profile: checked(profile), withdrawals: checked(withdrawals) ?? [], views: checked(views) ?? [] };
}

export async function loadWallet(uid: string) {
  const [profile, deposits] = await Promise.all([
    supabase.from("profiles").select("balance").eq("id", uid).single(),
    supabase.from("zapupi_deposits").select("id,order_id,amount_inr,status,purpose,created_at").eq("user_id", uid).order("created_at", { ascending: false }),
  ]);
  return { profile: checked(profile), deposits: checked(deposits) ?? [] };
}

export async function loadBonus(uid: string) {
  return checked(await supabase.from("oc_bonus_daily").select("day,views,amount").eq("owner_id", uid).order("day", { ascending: false })) ?? [];
}

export async function loadReferrals(uid: string) {
  const [profile, people, daily, withdrawals] = await Promise.all([
    supabase.from("profiles").select("referral_code,referral_earnings,balance,paid_total").eq("id", uid).single(),
    supabase.rpc("my_referrals"),
    supabase.from("referral_daily").select("day,signup_bonus,commission").eq("referrer_id", uid).gte("day", new Date(Date.now() - 864e5).toISOString().slice(0, 10)),
    supabase.from("withdrawals").select("status,amount").eq("user_id", uid),
  ]);
  return { profile: checked(profile), people: (checked(people) ?? []) as { name: string; joined: string; earned: number }[], daily: checked(daily) ?? [], withdrawals: checked(withdrawals) ?? [] };
}

export async function convertLink(uid: string, input: string) {
  const slug = parseShareSlug(input, SHARE_URL, WEB_URL);
  if (!slug) throw new Error("Enter a valid Tanyora share link.");
  const source = checked(await supabase.from("files").select("*").eq("slug", slug).maybeSingle());
  if (!source) throw new Error("This shared file was not found.");
  const problem = conversionProblem(source, uid);
  if (problem) throw new Error(problem);
  let duplicateQuery = supabase.from("files").select("id").eq("owner_id", uid).eq("source", "converted");
  duplicateQuery = source.storage_path ? duplicateQuery.eq("storage_path", source.storage_path) : duplicateQuery.eq("parent_file_id", source.id);
  const existing = checked(await duplicateQuery.limit(1));
  if (existing?.length) throw new Error("You have already converted this link.");
  const row = checked(await supabase.from("files").insert({ owner_id: uid, name: source.name, file_type: source.file_type, mime: source.mime, size: source.size, storage_path: source.storage_path, external_url: source.external_url, source: "converted", parent_file_id: source.id, expires_at: source.expires_at }).select("id,slug").single());
  if (!row) throw new Error("Could not create your share link.");
  return row;
}