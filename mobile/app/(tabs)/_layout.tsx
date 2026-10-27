import { Pressable, View } from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../lib/theme";
import { homeTheme } from "../../lib/home-theme";
import { HomeTabBar } from "../../components/HomeTabBar";

const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, focused }: { color: string; focused: boolean }) => (
  <Ionicons name={`${name}-outline` as keyof typeof Ionicons.glyphMap} size={22} color={color} />
);

export default function TabsLayout() {
  const pathname = usePathname();
  const home = pathname === "/" || pathname === "/(tabs)";
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      tabBar={home ? ({ state, navigation }) => <HomeTabBar onUpload={() => router.push("/uploader")} onNavigate={name => {
        const route = state.routes.find(r => r.name === name);
        if (!route) return;
        const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
        if (!event.defaultPrevented) navigation.navigate(route.name, route.params);
      }} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: home ? homeTheme.primary : theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: home ? { backgroundColor: homeTheme.surface, borderTopWidth: 0, height: 68 + insets.bottom, paddingBottom: Math.max(8, insets.bottom), paddingTop: 8, marginHorizontal: 20, borderRadius: 32, marginBottom: insets.bottom ? 0 : 12 } : { backgroundColor: theme.card, borderTopColor: theme.border, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: home ? homeTheme.background : theme.bg },
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
              <View style={{ width: 48, height: 48, borderRadius: home ? 18 : 16, backgroundColor: home ? homeTheme.primary : theme.primary, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="add" size={28} color={theme.onPrimary} />
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
