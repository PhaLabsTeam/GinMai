import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { useNotifications } from "../src/hooks/useNotifications";

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const updatePushToken = useAuthStore((state) => state.updatePushToken);
  const userId = useAuthStore((state) => state.user?.id);

  // Initialize push notifications
  const { expoPushToken } = useNotifications();

  // Initialize auth on app launch to restore persisted session
  useEffect(() => {
    initialize();
  }, []);

  // Store push token when received (only if user is authenticated)
  useEffect(() => {
    if (expoPushToken && userId) {
      console.log('📝 Storing push token for user:', userId);
      updatePushToken(expoPushToken);
    }
  }, [expoPushToken, userId, updatePushToken]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FAFAF9" },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
