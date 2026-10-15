import { Pressable, View } from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, focused }: { color: string; focused: boolean }) => (
  <Ionicons name={`${name}-outline` as keyof typeof Ionicons.glyphMap} size={22} color={color} />
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="content" options={{ title: "Files", tabBarIcon: icon("folder") }} />
      <Tabs.Screen
        name="upload"
        options={{
          title: "",
          tabBarButton: () => (
            <Pressable accessibilityLabel="Upload a file" onPress={() => router.push("/uploader")} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="shared" options={{ title: "Shared", tabBarIcon: icon("share-social") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person") }} />
    </Tabs>
  );
}
