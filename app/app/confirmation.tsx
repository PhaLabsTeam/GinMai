import { View, Text, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useMoment } from "../src/hooks/useMoment";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";
import { mealWord, capitalize } from "../src/utils/mealWord";
import { colors } from "../src/theme/colors";
import { Verified } from "../src/components/Icon";
import { ScreenHeader } from "../src/components/ScreenHeader";

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const leaveMoment = useMomentStore((state) => state.leaveMoment);
  const markArrived = useMomentStore((state) => state.markArrived);
  const user = useAuthStore((state) => state.user);

  const { moment, loading: momentLoading } = useMoment(params.momentId);

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [leaving, setLeaving] = useState(false);
  const [arriving, setArriving] = useState(false);

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

  const handleArrival = useCallback(async () => {
    if (!user || !moment || arriving) return;

    setArriving(true);
    await markArrived(moment.id, user.id);
    setArriving(false);
    router.push(`/arrival?momentId=${params.momentId}`);
  }, [user, moment, arriving, markArrived, router, params.momentId]);

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

  if (!moment && momentLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!moment) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-ink-secondary">Moment not found</Text>
        <Pressable onPress={() => router.replace("/map")} className="mt-4">
          <Text className="text-ink">Go back to map</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  // Show area name or generic "nearby" instead of hardcoded distance
  const locationHint = moment.location.area_name || "Nearby";

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* A guest can leave this screen without arriving or cancelling (#51) */}
      <ScreenHeader />
      <View className="flex-1 px-6">
        {/* Header text */}
        <View className="pt-2">
          <Text className="text-center text-[32px] font-normal text-ink">
            You're in.
          </Text>
          <Text className="text-center text-[17px] text-ink-secondary mt-2">
            Say hi when you arrive.
          </Text>
        </View>

        {/* Countdown timer */}
        <View className="mt-8">
          <Text className="text-center text-[56px] font-light text-ink tracking-wider">
            {formatNumber(countdown.hours)}:{formatNumber(countdown.minutes)}:{formatNumber(countdown.seconds)}
          </Text>
          <Text className="text-center text-[16px] text-ink-muted mt-1">
            until {mealWord(moment.starts_at)}
          </Text>
        </View>

        {/* Map placeholder card */}
        <View className="mt-10 bg-subtle rounded-2xl h-44 items-center justify-center">
          {/* Location pin icon */}
          <View className="w-12 h-12 items-center justify-center">
            <View className="w-8 h-10 bg-ink-secondary rounded-full rounded-b-none items-center pt-1.5">
              <View className="w-3 h-3 bg-subtle rounded-full" />
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
                borderTopColor: colors.inkSecondary,
                marginTop: -1,
              }}
            />
          </View>
        </View>

        {/* Place name */}
        <Text className="text-center text-[18px] font-semibold text-ink mt-5">
          {moment.location.place_name || moment.location.area_name || "Your destination"}
        </Text>

        {/* Location hint */}
        <Text className="text-center text-[15px] text-ink-secondary mt-1">
          {locationHint}
        </Text>

        {/* Host info */}
        <View className="flex-row items-center justify-center mt-4">
          <Text className="text-[16px] text-ink">
            with {moment.host_name}
          </Text>
          {moment.host_id && moment.host_id !== "anonymous" && (
            <View className="ml-1"><Verified /></View>
          )}
        </View>

        {/* I'm here button */}
        <View className="mt-10">
          <Pressable
            onPress={handleArrival}
            disabled={arriving}
            className="bg-ink py-4 rounded-2xl items-center active:opacity-80"
          >
            {arriving ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text className="text-white text-[17px] font-medium">
                I'm here
              </Text>
            )}
          </Pressable>
        </View>

        {/* Cancel link */}
        <Pressable onPress={handleCancel} disabled={leaving} className="mt-4">
          {leaving ? (
            <ActivityIndicator size="small" color={colors.inkSecondary} />
          ) : (
            <Text className="text-center text-[16px] text-ink-secondary">
              Can't make it anymore →
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
