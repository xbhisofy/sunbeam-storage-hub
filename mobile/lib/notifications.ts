import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Silent notifications: no sound anywhere. Android binds sound to the channel,
// so the channel id was bumped when sound was removed — never reuse an old id.
export const CHANNEL_ID = "tanyora-alerts-v2";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

let granted: boolean | null = null;

export async function setupNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Important updates",
      description: "Uploads and share link updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#2563EB",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  granted = current.granted || (current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
  return granted;
}

export async function notify(title: string, body: string) {
  try {
    if (granted === null) granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null });
  } catch { /* notifications are best-effort */ }
}
