import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { Screen, Button, Field } from "../components/ui";
import { useSession } from "./_layout";
import { useProfile } from "../lib/useProfile";
import { validateProfile } from "../lib/account-rules";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";

export default function EditProfile() {
  const session = useSession();
  const { profile, loading, error, reload } = useProfile();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const displayName = name ?? profile?.display_name ?? session?.user.user_metadata?.display_name ?? "";
  const address = email ?? session?.user.email ?? "";
  async function save() {
    if (!session) return;
    const problem = validateProfile(displayName, address);
    if (problem) return Alert.alert("Check your details", problem);
    setBusy(true);
    try {
      const { error: updateError, data } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", session.user.id).select("id").single();
      if (updateError || !data) throw updateError ?? new Error("Could not save your name.");
      const emailChanged = address.trim() !== session.user.email;
      const { error: authError } = await supabase.auth.updateUser({ data: { display_name: displayName.trim() }, ...(emailChanged ? { email: address.trim() } : {}) });
      if (authError) { await reload(); throw new Error(`Your name was saved, but account details could not be updated: ${authError.message}`); }
      await reload();
      Alert.alert("Profile updated", emailChanged ? "Your name was saved. Check your email for confirmation instructions before using your new address." : "Your changes have been saved.");
    } catch (e) { Alert.alert("Unable to finish", e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <Screen title="Edit profile" back><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 20 }}>
    <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 21 }}>Keep your account details up to date.</Text>
    <Field label="Full name" accessibilityLabel="Full name" value={displayName} onChangeText={setName} maxLength={80} autoComplete="name" editable={!loading && !busy} />
    <Field label="Email address" accessibilityLabel="Email address" value={address} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!loading && !busy} />
    <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 20 }}>Changing your email may require confirmation. Your current sign-in address stays active until the change is confirmed.</Text>
    {error && <Text style={{ color: theme.danger }}>{error}</Text>}
    <Button label={loading ? "Loading account…" : "Save changes"} busy={busy || loading} icon="checkmark-outline" onPress={save} />
  </ScrollView></KeyboardAvoidingView></Screen>;
}
