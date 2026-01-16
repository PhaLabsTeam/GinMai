import { View, Text, Pressable, ActivityIndicator, Platform, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";

export default function ArrivalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const moments = useMomentStore((state) => state.moments);
  const notifyHostRunningLate = useMomentStore((state) => state.notifyHostRunningLate);
  const user = useAuthStore((state) => state.user);

  const [notifying, setNotifying] = useState(false);

  const moment = moments.find((m) => m.id === params.momentId);
  const hostName = moment?.host_name || "them";

  const handleFoundThem = () => {
    // Navigate to feedback with host name
    router.replace(`/feedback?momentId=${params.momentId}&hostName=${encodeURIComponent(hostName)}`);
  };

  const handleRunningLate = async () => {
    if (!user || !moment || notifying) return;

    setNotifying(true);
    const guestName = user.first_name || "Guest";
    await notifyHostRunningLate(moment.id, user.id, guestName);
    setNotifying(false);

    // Show confirmation
    const message = `${hostName} has been notified that you're running a few minutes late.`;
    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert("Host notified", message);
    }
  };

  const handleCantFind = () => {
    // In a real app, this would show help options or contact host
    // For now, just go back
    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <View className="flex-1 px-6">
        {/* Header text */}
        <View className="pt-8">
          <Text className="text-center text-[32px] font-normal text-[#1C1917]">
            You're here.
          </Text>
          <Text className="text-center text-[17px] text-[#6B7280] mt-2">
            Look for the GinMai sign on the table.
          </Text>
        </View>

        {/* กิน sign card */}
        <View className="items-center mt-10">
          <View className="w-36 h-36 border-2 border-[#1C1917] rounded-2xl items-center justify-center">
            <Text className="text-[56px] font-medium text-[#1C1917]">
              กิน
            </Text>
          </View>
        </View>

        {/* Found them button */}
        <View className="mt-10">
          <Pressable
            onPress={handleFoundThem}
            className="bg-[#1C1917] py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">
              Found them!
            </Text>
          </Pressable>
        </View>

        {/* Action buttons */}
        <View className="mt-6">
          {/* Running late button */}
          <Pressable
            onPress={handleRunningLate}
            disabled={notifying}
            className="border border-[#E5E7EB] py-4 rounded-xl items-center active:bg-[#F9FAFB] mb-3"
          >
            {notifying ? (
              <ActivityIndicator size="small" color="#1C1917" />
            ) : (
              <Text className="text-[16px] text-[#1C1917]">
                Running a few minutes late →
              </Text>
            )}
          </Pressable>

          {/* Can't find them button */}
          <Pressable
            onPress={handleCantFind}
            className="border border-[#E5E7EB] py-4 rounded-xl items-center active:bg-[#F9FAFB]"
          >
            <Text className="text-[16px] text-[#1C1917]">
              Can't find them →
            </Text>
          </Pressable>
        </View>

        {/* Back link */}
        <Pressable onPress={handleBack} className="mt-6">
          <Text className="text-center text-[16px] text-[#9CA3AF]">
            ← Back
          </Text>
        </Pressable>
      </View>

      {/* Floating action button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={handleFoundThem}
          className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <Text className="text-white text-2xl font-light">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
