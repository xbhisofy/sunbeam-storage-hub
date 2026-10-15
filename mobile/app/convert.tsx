import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Screen, Field, Button, Empty } from "../components/ui";
import { FileCard } from "../components/FileCard";
import { accountStyles as s } from "../components/AccountUI";
import { convertLink } from "../lib/account-data";
import { useFiles } from "../lib/useFiles";
import { useSession } from "./_layout";
import { shareLink } from "../lib/config";

export default function Convert() {
  const uid = useSession()?.user.id;
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { files, reload, loading, error } = useFiles();
  async function submit() {
    if (!uid || busy) return;
    setBusy(true); setResult(null);
    try { const row = await convertLink(uid, url); setResult(shareLink(row.slug)); setUrl(""); await reload(); }
    catch (e) { Alert.alert("Could not convert link", e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const converted = files.filter(f => f.source === "converted");
  return <Screen title="Convert Link" back><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 48 }}>
    <View style={{ flexDirection: "row", gap: 8 }}><Button label="All Content" variant="outline" onPress={() => router.replace("/content")} style={{ flex: 1 }} /><Button label="Convert Link" onPress={() => {}} style={{ flex: 1 }} /></View>
    <Text style={s.title}>Make it your link.</Text>
    <Field label="Tanyora share link" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://tanyora.com/s/…" editable={!busy} />
    <Button label="Convert link" icon="link-outline" onPress={submit} busy={busy} />
    {result && <><Text style={s.name}>Your share link is ready</Text><Button label="Copy new link" icon="copy-outline" variant="outline" onPress={() => { void Clipboard.setStringAsync(result).then(() => Alert.alert("Copied", "Your new share link was copied.")).catch(() => Alert.alert("Could not copy", "Please try again.")); }} /></>}
    <Text style={s.section}>Recent conversions</Text>
    {error && <><Text style={s.text}>{error}</Text><Button label="Try again" onPress={reload} variant="outline" /></>}
    {converted.map(f => <FileCard key={f.id} file={f} onChange={reload} />)}
    {!converted.length && !error && <Empty icon="link-outline" title={loading ? "Loading conversions…" : "No conversions yet"} />}
  </ScrollView></Screen>;
}