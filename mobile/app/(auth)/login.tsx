import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { BRAND } from "../../lib/config";
import { theme } from "../../lib/theme";
import { signInWithNativeGoogle } from "../../lib/native-google";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function google() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await signInWithNativeGoogle();
      if (result === "signed-in") router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Google login", error instanceof Error ? error.message : "Dobara try karo");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert("Email aur password dono daalo");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.replace("/(tabs)");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || undefined,
              ref: ref.trim() || undefined,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/(tabs)");
        } else {
          setNotice(
            "Account ban gaya! Ab apni email kholo aur verification link par click karo, phir sign in karo.",
          );
          setMode("signin");
        }
      }
    } catch (e) {
      Alert.alert("Problem", e instanceof Error ? e.message : "Kuch galat ho gaya");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.logo}>
        <Text style={styles.logoMark}>T</Text>
      </View>
      <Text style={styles.title}>{BRAND.name}</Text>
      <Text style={styles.subtitle}>
        Files share karo, views kamao — {mode === "signin" ? "sign in karo" : "naya account banao"}
      </Text>

      <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" style={[styles.googleButton, busy && styles.buttonDisabled]} onPress={google} disabled={busy}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>

      {mode === "signup" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Aapka naam"
            placeholderTextColor={theme.muted}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            style={styles.input}
            placeholder="Referral code (optional)"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            value={ref}
            onChangeText={setRef}
          />
        </>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{mode === "signin" ? "Sign In" : "Create Account"}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
        <Text style={styles.switchText}>
          {mode === "signin"
            ? "Naya account hai? Sign up karo"
            : "Pehle se account hai? Sign in karo"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: "center" },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  logoMark: { color: "#E2E8F0", fontSize: 40, fontWeight: "800" },
  title: { color: theme.text, fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: theme.muted, textAlign: "center", marginTop: 6, marginBottom: 24 },
  input: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    padding: 14,
    marginBottom: 12,
  },
  notice: { color: theme.success, marginBottom: 12, textAlign: "center" },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  googleButton: { minHeight: 48, borderColor: theme.border, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 20, backgroundColor: theme.card },
  googleText: { color: theme.text, fontWeight: "700", fontSize: 16 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchText: { color: theme.primary, textAlign: "center", marginTop: 18 },
});
