import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { theme } from "../../lib/theme";
import { Button, Field } from "../../components/ui";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fade]);

  async function submit() {
    const e = email.trim();
    if (mode === "signup" && !name.trim()) return Alert.alert("Name required", "Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(e)) return Alert.alert("Invalid email", "Please enter a valid email address.");
    if (password.length < 8) return Alert.alert("Password too short", "Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: e, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: e, password, options: { data: { display_name: name.trim() } } });
        if (error) throw error;
        if (!data.session) { Alert.alert("Account created", "You can now sign in."); setMode("signin"); return; }
      }
      router.replace("/(tabs)");
    } catch (err) {
      Alert.alert("Unable to continue", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.card }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ alignItems: "center", opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <Image source={require("../../assets/icon.png")} style={styles.logo} />
          <Text style={styles.brand}>TANYORA</Text>
          <Text style={styles.sub}>{mode === "signin" ? "Welcome back. Sign in to your account." : "Create your account to start sharing."}</Text>
        </Animated.View>

        <View style={{ gap: 14, marginTop: 28 }}>
          {mode === "signup" && <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" />}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoComplete="password" />
          <Button label={mode === "signin" ? "Sign in" : "Create account"} onPress={submit} busy={busy} style={{ marginTop: 6 }} />
        </View>

        <Pressable onPress={() => setMode(mode === "signin" ? "signup" : "signin")} style={{ marginTop: 22, alignSelf: "center", padding: 8 }}>
          <Text style={{ color: theme.muted, fontSize: 15 }}>
            {mode === "signin" ? "New to Tanyora? " : "Already have an account? "}
            <Text style={{ color: theme.primary, fontWeight: "700" }}>{mode === "signin" ? "Create account" : "Sign in"}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { width: 80, height: 80, borderRadius: 22 },
  brand: { marginTop: 16, fontSize: 28, fontWeight: "800", letterSpacing: 6, color: theme.text },
  sub: { marginTop: 8, color: theme.muted, fontSize: 15, textAlign: "center" },
});
