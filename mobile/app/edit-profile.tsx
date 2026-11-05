import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { Screen, Button, Field } from "../components/ui";
import { useSession } from "./_layout";
import { useProfile } from "../lib/useProfile";
import { validateProfile } from "../lib/account-rules";
import { useAvatarUrl } from "../lib/avatar";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";

export default function EditProfile() {
  const session = useSession();
  const { profile, loading, error, reload } = useProfile();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const avatarUrl = useAvatarUrl(session?.user);
  const displayName = name ?? profile?.display_name ?? session?.user.user_metadata?.display_name ?? "";
  const address = email ?? session?.user.email ?? "";
  async function pickPhoto() {
    if (!session || photoBusy) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;
    setPhotoBusy(true);
    try {
      const path = `${session.user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, decode(asset.base64), { contentType: asset.mimeType ?? "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { error: authError } = await supabase.auth.updateUser({ data: { avatar_path: path } });
      if (authError) throw authError;
      Alert.alert("Photo updated", "Your new profile photo is ready.");
    } catch (e) { Alert.alert("Unable to update photo", e instanceof Error ? e.message : "Please try again."); }
    finally { setPhotoBusy(false); }
  }
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
    <View style={{ alignItems: "center", gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={pickPhoto} disabled={photoBusy} style={({ pressed }) => ({ opacity: pressed || photoBusy ? 0.7 : 1 })}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 96, height: 96 }} resizeMode="cover" /> : <Text style={{ fontSize: 38, fontWeight: "700", color: theme.primary }}>{(displayName || "T").charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.card }}>
          <Ionicons name="camera" size={16} color={theme.onPrimary} />
        </View>
      </Pressable>
      <Text style={{ color: theme.muted, fontSize: 13 }}>{photoBusy ? "Uploading photo…" : "Tap to change your photo"}</Text>
    </View>
    <Field label="Full name" accessibilityLabel="Full name" value={displayName} onChangeText={setName} maxLength={80} autoComplete="name" editable={!loading && !busy} />
    <Field label="Email address" accessibilityLabel="Email address" value={address} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!loading && !busy} />
    <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 20 }}>Changing your email may require confirmation. Your current sign-in address stays active until the change is confirmed.</Text>
    {error && <Text style={{ color: theme.danger }}>{error}</Text>}
    <Button label={loading ? "Loading account…" : "Save changes"} busy={busy || loading} icon="checkmark-outline" onPress={save} />
  </ScrollView></KeyboardAvoidingView></Screen>;
}
