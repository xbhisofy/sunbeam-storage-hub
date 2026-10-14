import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ReportRow = {
  id: string; file_slug: string; file_name: string | null; reason: string; details: string | null;
  email: string | null; reporter_id: string | null; status: string; created_at: string;
};
type ReportsDb = {
  public: {
    Tables: { reports: { Row: ReportRow; Insert: Partial<ReportRow> & { file_slug: string; reason: string }; Update: Partial<ReportRow>; Relationships: [] } };
    Views: Record<string, never>; Functions: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  };
};

// Typed access to the content reports table (kept separate until generated types include it).
export const reportsTable = () => (supabase as unknown as SupabaseClient<ReportsDb>).from("reports");
