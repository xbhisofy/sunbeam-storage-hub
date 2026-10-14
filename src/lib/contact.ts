import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const CONTACT_TOPICS = [
  { value: "general", label: "General question" },
  { value: "account", label: "Account & login" },
  { value: "payout", label: "Earnings & payouts" },
  { value: "technical", label: "Technical problem" },
  { value: "privacy", label: "Privacy & data" },
  { value: "business", label: "Business & partnerships" },
] as const;
export const topicLabel = (v: string) => CONTACT_TOPICS.find((t) => t.value === v)?.label ?? v;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  topic: z.enum(["general", "account", "payout", "technical", "privacy", "business"]),
  message: z.string().trim().min(5, "Message is too short").max(2000, "Message is too long"),
});

export type ContactRow = { id: string; name: string; email: string; topic: string; message: string; sender_id: string | null; status: string; created_at: string };
type Db = { public: { Tables: { contact_messages: { Row: ContactRow; Insert: Partial<ContactRow> & { name: string; email: string; message: string }; Update: Partial<ContactRow>; Relationships: [] } }; Views: Record<string, never>; Functions: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never> } };

export const contactTable = () => (supabase as unknown as SupabaseClient<Db>).from("contact_messages");
