import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function TableSignScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FAFAF9]">
      <StatusBar style="dark" />

      {/* Full screen tap to dismiss */}
      <Pressable
        onPress={() => router.back()}
        className="flex-1 items-center justify-center"
      >
        {/* Large Thai logo */}
        <Text className="text-[120px] font-bold text-[#1C1917]">
          กิน
        </Text>

        {/* Subtitle */}
        <Text className="text-[24px] text-[#9CA3AF] mt-4">
          GinMai
        </Text>

        {/* Instruction */}
        <Text className="text-[16px] text-[#9CA3AF] mt-12">
          Show this to your guest
        </Text>

        {/* Tap to close hint */}
        <Text className="text-[14px] text-[#D1D5DB] mt-4">
          Tap anywhere to close
        </Text>
      </Pressable>
    </View>
  );
}
