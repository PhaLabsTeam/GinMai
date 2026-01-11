import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  // Initialize auth on app launch to restore persisted session
  useEffect(() => {
    initialize();
  }, []);

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
