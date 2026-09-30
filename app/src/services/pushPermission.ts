import { Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../hooks/useNotifications";
import { useAuthStore } from "../stores/authStore";

// "Not now" means not again this session; they'll be asked after a later Moment
let askedThisSession = false;

const REASONS = {
  hosting: "We'll let you know when someone joins your table.",
  joined: "We'll remind you before the meal and let you know if plans change.",
} as const;

/**
 * Asks for notification permission at the moment it's obviously useful: right
 * after the user hosts or joins a Moment (#20). A short in-app explanation goes
 * first, so the one-time iOS prompt only appears for people who want it.
 */
export async function maybeAskForPushPermission(reason: keyof typeof REASONS): Promise<void> {
  if (askedThisSession) return;

  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  // Already decided (granted, or declined in the system prompt)
  if (status !== "undetermined" || !canAskAgain) return;

  askedThisSession = true;
  const wantsIt = await new Promise<boolean>((resolve) =>
    Alert.alert("Want a heads-up?", REASONS[reason], [
      { text: "Not now", style: "cancel", onPress: () => resolve(false) },
      { text: "Yes, notify me", onPress: () => resolve(true) },
    ])
  );
  if (!wantsIt) return;

  const token = await registerForPushNotificationsAsync(true);
  if (token) {
    await useAuthStore.getState().updatePushToken(token);
  }
}
