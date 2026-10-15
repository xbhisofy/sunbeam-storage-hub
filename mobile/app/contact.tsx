import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { Screen, Field, Button } from "../components/ui";
import { useSession } from "./_layout";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";

// Messages go to the same admin inbox as the website contact form.
export default function Contact() {
  const session = useSession();
  const [name, setName] = useState((session?.user.user_metadata?.display_name as string) ?? "");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || message.trim().length < 5)
      return Alert.alert("Check the form", "Enter your name, a valid email and a message of at least 5 characters.");
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(), email: email.trim(), topic: "general", message: message.trim().slice(0, 2000), sender_id: session?.user.id ?? null,
    });
    setBusy(false);
    if (error) return Alert.alert("Not sent", error.message);
    Alert.alert("Message sent", "Our support team will reply by email.");
    router.back();
  }

  return (
    <Screen title="Contact support" back>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Text style={{ color: theme.muted }}>Questions, problems or reports — we usually reply within 48 hours.</Text>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Message" value={message} onChangeText={setMessage} multiline style={{ minHeight: 140, textAlignVertical: "top", borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, padding: 14, fontSize: 16, color: theme.text }} />
        <Button label="Send message" onPress={send} busy={busy} />
      </ScrollView>
    </Screen>
  );
}
