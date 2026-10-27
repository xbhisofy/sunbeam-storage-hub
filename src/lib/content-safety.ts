import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type SafetyFile = {
  id: string; name: string; storage_path: string | null; file_type: string;
  source: string; moderation_status: string; scan_status: string;
  moderation_note: string | null; created_at: string;
};
type SafetyDatabase = { public: {
  Tables: { files: { Row: SafetyFile; Insert: Partial<SafetyFile>; Update: Partial<SafetyFile>; Relationships: [] } };
  Views: Record<string, never>; Functions: { admin_review_file: { Args: { _id: string; _decision: string; _note: string }; Returns: undefined } };
  Enums: Record<string, never>; CompositeTypes: Record<string, never>;
} };
export const safetyClient = supabase as unknown as SupabaseClient<SafetyDatabase>;
export function sharingAllowed(file: { moderation_status?: string; scan_status?: string }) {
  return file.moderation_status === 'approved' && file.scan_status === 'clean';
}
export function safetyLabel(file: { moderation_status?: string; scan_status?: string }) {
  if (file.moderation_status === 'blocked') return 'Sharing blocked';
  if (sharingAllowed(file)) return 'Ready to share';
  if (file.scan_status === 'unsupported') return 'Sharing unavailable: scan limit or file type';
  if (file.scan_status === 'error') return 'Safety check failed: sharing unavailable';
  if (file.scan_status === 'clean') return 'Sharing on hold';
  return 'Safety check pending';
}
export const UNSUPPORTED_UPLOAD = /\.(exe|dll|com|bat|cmd|ps1|sh|js|mjs|vbs|scr|msi|apk|aab|jar|html|htm|svg|zip|rar|7z|tar|gz|iso)$/i;