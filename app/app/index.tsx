import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { colors } from "../src/theme/colors";

export default function WelcomeScreen() {
  const router = useRouter();

  // Auth state
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  // Redirect to map if user is already logged in. Only while this screen is
  // focused: it stays mounted under the stack, and an unfocused replace() would
  // swap out whatever screen is on top (e.g. sign-up's returnTo destination).
  useFocusEffect(
    useCallback(() => {
      if (initialized && user) {
        router.replace("/map");
      }
    }, [initialized, user])
  );

  const handleLetsGo = () => {
    router.push("/location-permission");
  };

  // Show loading while checking auth state
  if (!initialized) {
    return (
      <SafeAreaView testID="welcome-loading" className="flex-1 bg-background items-center justify-center">
        <Text className="text-center text-[56px] font-bold text-ink leading-tight">
          กินไหม
        </Text>
        <Text className="text-center text-[22px] text-ink-muted mt-1">
          Wanna eat?
        </Text>
        <ActivityIndicator size="large" color={colors.ink} style={{ marginTop: 32 }} />
      </SafeAreaView>
    );
  }

  // If user is logged in, show loading while redirecting
  if (user) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="welcome-screen" className="flex-1 bg-background">
      <View className="flex-1 px-8">
        {/* Main content - positioned in upper portion */}
        <View className="flex-1 justify-center pb-24">
          {/* Thai title */}
          <Text testID="welcome-title" className="text-center text-[56px] font-bold text-ink leading-tight">
            กินไหม
          </Text>

          {/* English subtitle */}
          <Text testID="welcome-subtitle" className="text-center text-[22px] text-ink-muted mt-1">
            Wanna eat?
          </Text>

          {/* Let's go button */}
          <View className="items-center mt-12">
            <Pressable
              testID="welcome-lets-go-button"
              onPress={handleLetsGo}
              className="bg-ink px-14 py-4 rounded-full active:opacity-80"
            >
              <Text className="text-white text-[17px] font-medium">
                Let's go
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
