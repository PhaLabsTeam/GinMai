import { View, Text, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const moments = useMomentStore((state) => state.moments);
  const leaveMoment = useMomentStore((state) => state.leaveMoment);
  const user = useAuthStore((state) => state.user);

  const moment = moments.find((m) => m.id === params.momentId);

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!moment) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const startTime = new Date(moment.starts_at).getTime();
      const diff = Math.max(0, startTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [moment]);

  const handleCancel = async () => {
    // Use window.confirm on web as Alert.alert doesn't work properly
    const message = `${moment?.host_name} is counting on you. But things happen.\n\nAre you sure you want to leave?`;

    const confirmed = Platform.OS === 'web'
      ? window.confirm(message)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Can't make it?",
            `${moment?.host_name} is counting on you. But things happen.`,
            [
              { text: "Stay", style: "cancel", onPress: () => resolve(false) },
              { text: "Leave", style: "destructive", onPress: () => resolve(true) }
            ]
          );
        });

    if (confirmed) {
      if (!user || !moment) {
        router.replace("/map");
        return;
      }
      setLeaving(true);
      await leaveMoment(moment.id, user.id);
      setLeaving(false);
      router.replace("/map");
    }
  };

  if (!moment) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <Text className="text-[#78716C]">Moment not found</Text>
        <Pressable onPress={() => router.replace("/map")} className="mt-4">
          <Text className="text-[#1C1917]">Go back to map</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  // Simulated walking distance
  const walkingDistance = "8 min walk";

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <View className="flex-1 px-6">
        {/* Header text */}
        <View className="pt-8">
          <Text className="text-center text-[32px] font-normal text-[#1C1917]">
            You're in.
          </Text>
          <Text className="text-center text-[17px] text-[#6B7280] mt-2">
            Say hi when you arrive.
          </Text>
        </View>

        {/* Countdown timer */}
        <View className="mt-8">
          <Text className="text-center text-[56px] font-light text-[#1C1917] tracking-wider">
            {formatNumber(countdown.hours)}:{formatNumber(countdown.minutes)}:{formatNumber(countdown.seconds)}
          </Text>
          <Text className="text-center text-[16px] text-[#9CA3AF] mt-1">
            until lunch
          </Text>
        </View>

        {/* Map placeholder card */}
        <View className="mt-10 bg-[#F3F4F6] rounded-2xl h-44 items-center justify-center">
          {/* Location pin icon */}
          <View className="w-12 h-12 items-center justify-center">
            <View className="w-8 h-10 bg-[#4B5563] rounded-full rounded-b-none items-center pt-1.5">
              <View className="w-3 h-3 bg-[#F3F4F6] rounded-full" />
            </View>
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderTopWidth: 10,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#4B5563",
                marginTop: -1,
              }}
            />
          </View>
        </View>

        {/* Place name */}
        <Text className="text-center text-[18px] font-semibold text-[#1C1917] mt-5">
          {moment.location.place_name || moment.location.area_name || "Your destination"}
        </Text>

        {/* Walking distance */}
        <Text className="text-center text-[15px] text-[#6B7280] mt-1">
          {walkingDistance}
        </Text>

        {/* Host info */}
        <View className="flex-row items-center justify-center mt-4">
          <Text className="text-[16px] text-[#1C1917]">
            with {moment.host_name}
          </Text>
          {moment.host_id && moment.host_id !== "anonymous" && (
            <Text className="text-[15px] text-[#22C55E] ml-1">✓</Text>
          )}
        </View>

        {/* I'm here button */}
        <View className="mt-10">
          <Pressable
            onPress={() => router.push(`/arrival?momentId=${params.momentId}`)}
            className="bg-[#1C1917] py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">
              I'm here
            </Text>
          </Pressable>
        </View>

        {/* Cancel link */}
        <Pressable onPress={handleCancel} disabled={leaving} className="mt-4">
          {leaving ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Text className="text-center text-[16px] text-[#6B7280]">
              Can't make it anymore →
            </Text>
          )}
        </Pressable>
      </View>

      {/* Floating action button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={() => router.push(`/arrival?momentId=${params.momentId}`)}
          className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <Text className="text-white text-2xl font-light">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
