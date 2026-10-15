import AsyncStorage from "@react-native-async-storage/async-storage";

// Bump when the photo/file access notice text changes so users see it again.
export const MEDIA_NOTICE_VERSION = "2026-10-15";
const KEY = "tanyora.media-notice";

export type NoticeRecord = { version: string; acceptedAt: string };

export const needsNotice = (record: NoticeRecord | null) => !record || record.version !== MEDIA_NOTICE_VERSION;

export async function readNotice(): Promise<NoticeRecord | null> {
  try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) as NoticeRecord : null; } catch { return null; }
}

export async function acceptNotice(now = new Date()) {
  const record: NoticeRecord = { version: MEDIA_NOTICE_VERSION, acceptedAt: now.toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(record));
  return record;
}
