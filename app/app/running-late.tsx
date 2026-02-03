import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";

export default function RunningLateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const [marking, setMarking] = useState(false);

  const moments = useMomentStore((state) => state.moments);
  const user = useAuthStore((state) => state.user);

  const moment = moments.find((m) => m.id === params.momentId);

  const markRunningLate = useMomentStore((state) => state.markRunningLate);

  const handleYesLate = async () => {
    if (!moment || !user) return;

    setMarking(true);

    try {
      // Mark user as running late in database
      const result = await markRunningLate(params.momentId, user.id);

      if (!result.success) {
        console.error('Failed to mark as running late:', result.error);
        setMarking(false);
        return;
      }

      console.log('✅ User marked as running late for moment:', params.momentId);

      // Close the screen after brief delay
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error marking as late:', error);
      setMarking(false);
    }
  };

  const handleNoOnTime = () => {
    // User is on time, just close
    router.back();
  };

  if (!moment) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <Text className="text-[#78716C]">Moment not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-[#1C1917]">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <View className="flex-1 px-6 justify-center">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-[48px] mb-4">⏰</Text>
          <Text className="text-center text-[28px] font-semibold text-[#1C1917] mb-2">
            Your lunch starts soon
          </Text>
          <Text className="text-center text-[17px] text-[#6B7280]">
            at {moment.location.place_name || moment.location.area_name || 'your location'}
          </Text>
          <Text className="text-center text-[17px] text-[#6B7280] mt-1">
            {formatTime(moment.starts_at)}
          </Text>
        </View>

        {/* Question */}
        <Text className="text-center text-[22px] font-medium text-[#1C1917] mb-8">
          Running late?
        </Text>

        {/* Buttons */}
        <View className="space-y-3">
          {/* Yes, I'm late */}
          <Pressable
            onPress={handleYesLate}
            disabled={marking}
            className="bg-[#F97316] py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-semibold">
              {marking ? 'Notifying...' : "Yes, I'm running late"}
            </Text>
          </Pressable>

          {/* No, on time */}
          <Pressable
            onPress={handleNoOnTime}
            disabled={marking}
            className="bg-white border-2 border-[#E5E7EB] py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-[#1C1917] text-[17px] font-semibold">
              No, I'm on time
            </Text>
          </Pressable>
        </View>

        {/* Explanation */}
        <Text className="text-center text-[14px] text-[#9CA3AF] mt-6">
          If you're running late, we'll let the other person know so they don't worry.
        </Text>
      </View>
    </SafeAreaView>
  );
}
