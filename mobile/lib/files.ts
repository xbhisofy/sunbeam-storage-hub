import * as FS from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";
import { dedupeReads } from "./request-cache";

export type FileRow = {
  id: string; name: string; file_type: string; mime: string | null; size: number;
  storage_path: string | null; slug: string; created_at: string; expires_at: string | null; source: string;
};

export const CATEGORIES = [
  { kind: "pdf", label: "Documents", icon: "document-text" },
  { kind: "image", label: "Images", icon: "image" },
  { kind: "video", label: "Videos", icon: "film" },
  { kind: "audio", label: "Music", icon: "musical-notes" },
] as const;

export const iconFor = (t: string) =>
  t === "video" ? "film" : t === "image" ? "image" : t === "audio" ? "musical-notes" : "document-text";

export function fileKind(mime: string) {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  return "pdf";
}

export function formatSize(b: number) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i ? 1 : 0)} ${u[i]}`;
}
export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const FILE_COLUMNS = "id,name,file_type,mime,size,storage_path,slug,created_at,expires_at,source";
const FILE_PAGE_SIZE = 200;
export const myFiles = dedupeReads(async (uid: string): Promise<FileRow[]> => {
  const files: FileRow[] = [];
  for (let offset = 0; ; offset += FILE_PAGE_SIZE) {
    const { data, error } = await supabase.from("files").select(FILE_COLUMNS).eq("owner_id", uid)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + FILE_PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as FileRow[];
    files.push(...page);
    if (page.length < FILE_PAGE_SIZE) return files;
  }
});

export async function uploadFile(uid: string, f: { uri: string; name: string; mimeType?: string | null; size?: number | null }) {
  const mime = f.mimeType || "application/octet-stream";
  const base64 = await FS.readAsStringAsync(f.uri, { encoding: FS.EncodingType.Base64 });
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("files").upload(path, decode(base64), { contentType: mime });
  if (error) throw error;
  const { error: e2 } = await supabase.from("files").insert({
    owner_id: uid, name: f.name, file_type: fileKind(mime), mime, size: f.size ?? 0, storage_path: path, source: "original",
  });
  if (e2) throw e2;
}

export async function renameFile(id: string, name: string) {
  const clean = name.trim();
  if (!clean || clean.length > 255) throw new Error("Enter a file name between 1 and 255 characters.");
  const { data, error } = await supabase.from("files").update({ name: clean }).eq("id", id).select("id").single();
  if (error) throw error;
  if (!data) throw new Error("This file could not be renamed. Please refresh and try again.");
}
export async function deleteFile(f: FileRow) {
  if (f.storage_path && f.source !== "converted") {
    const { error } = await supabase.storage.from("files").remove([f.storage_path]);
    if (error) throw error;
  }
  const { error } = await supabase.from("files").delete().eq("id", f.id);
  if (error) throw error;
}
export async function setExpiry(id: string, hours: number | null) {
  const expires_at = hours === null ? null : new Date(Date.now() + hours * 3600_000).toISOString();
  const { error } = await supabase.from("files").update({ expires_at }).eq("id", id);
  if (error) throw error;
}
export const EXPIRY = [
  { label: "1 hour", hours: 1 }, { label: "24 hours", hours: 24 }, { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 }, { label: "Never", hours: null },
] as const;
