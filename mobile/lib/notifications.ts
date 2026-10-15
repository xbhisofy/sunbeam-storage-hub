import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Android 8+ binds the sound to the channel, so the channel id changes if the sound ever changes.
export const CHANNEL_ID = "tanyora-alerts";
const SOUND = "tanyora_notify.wav";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let granted: boolean | null = null;

export async function setupNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Important updates",
      description: "Uploads and share link updates",
      importance: Notifications.AndroidImportance.HIGH,
      sound: SOUND,
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
    await Notifications.scheduleNotificationAsync({ content: { title, body, sound: SOUND }, trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null });
  } catch { /* notifications are best-effort */ }
}
