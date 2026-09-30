import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";
import { useAuthStore } from "../src/stores/authStore";

// Held up in a busy restaurant so a guest can spot the host from across the
// room: loud colour, the host's name, big type, and the screen stays on.
export default function TableSignScreen() {
  const router = useRouter();
  const hostName = useAuthStore((state) => state.user?.first_name);
  useKeepAwake();

  return (
    <View className="flex-1 bg-accent">
      <StatusBar style="light" />

      {/* Full screen tap to dismiss */}
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel={`${hostName ? `${hostName}'s table` : "Table sign"}. Tap to close.`}
        className="flex-1 items-center justify-center px-6"
      >
        <Text className="text-[120px] font-bold text-white" accessibilityLabel="GinMai">
          กิน
        </Text>

        {hostName && (
          <Text
            className="text-[48px] font-semibold text-white mt-2 text-center"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {hostName}
          </Text>
        )}

        <Text className="text-[22px] text-white/90 mt-2">GinMai</Text>

        {/* Tap to close hint */}
        <Text className="text-[15px] text-white/70 mt-16">Tap anywhere to close</Text>
      </Pressable>
    </View>
  );
}
