import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";

export default function MomentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const moments = useMomentStore((state) => state.moments);
  const joinMoment = useMomentStore((state) => state.joinMoment);
  const hasJoinedMoment = useMomentStore((state) => state.hasJoinedMoment);
  const fetchUserConnections = useMomentStore((state) => state.fetchUserConnections);
  const user = useAuthStore((state) => state.user);
  const [joining, setJoining] = useState(false);

  const moment = moments.find((m) => m.id === params.momentId);
  const hasJoined = params.momentId ? hasJoinedMoment(params.momentId) : false;

  // Fetch user's connections when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserConnections(user.id);
    }
  }, [user?.id, fetchUserConnections]);

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
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getEndTime = () => {
    const start = new Date(moment.starts_at);
    const durationHours = moment.duration === "quick" ? 0.5 : moment.duration === "normal" ? 1 : 2;
    const end = new Date(start.getTime() + durationHours * 60 * 60000);
    return formatTime(end.toISOString());
  };

  const seatsOpen = moment.seats_total - moment.seats_taken;
  const isFull = seatsOpen <= 0;
  const isHost = user?.id === moment.host_id;

  const handleJoin = async () => {
    // Check if user is logged in
    if (!user) {
      router.push(`/sign-up?returnTo=/moment-detail?momentId=${moment.id}`);
      return;
    }

    // If already joined, go directly to confirmation
    if (hasJoined) {
      router.push(`/confirmation?momentId=${moment.id}`);
      return;
    }

    // Check if user is the host
    if (isHost) {
      Alert.alert("Can't join", "You can't join your own moment.");
      return;
    }

    // Check if moment is full
    if (isFull) {
      Alert.alert("Moment full", "This moment has no more seats available.");
      return;
    }

    setJoining(true);
    const result = await joinMoment(moment.id, user.id);
    setJoining(false);

    if (result.success) {
      router.push(`/confirmation?momentId=${moment.id}`);
    } else {
      Alert.alert("Couldn't join", result.error || "Something went wrong. Please try again.");
    }
  };

  // Simulated walking distance (would be calculated from actual location)
  const walkingDistance = "8 min walk";

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header with back button */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-[#1C1917]">←</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Map placeholder card */}
        <View className="bg-[#F3F4F6] rounded-2xl h-44 items-center justify-center">
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

        {/* Walking distance */}
        <Text className="text-center text-[15px] text-[#6B7280] mt-3">
          {walkingDistance}
        </Text>

        {/* Place info */}
        <View className="flex-row items-center mt-6">
          <Text className="text-2xl mr-2">🍜</Text>
          <Text className="text-[20px] font-semibold text-[#1C1917]">
            {moment.location.place_name || "Somewhere tasty"}
          </Text>
        </View>

        {/* Area */}
        <Text className="text-[16px] text-[#6B7280] mt-1">
          {moment.location.area_name || "Chiang Mai"}
        </Text>

        {/* Time range */}
        <Text className="text-[16px] text-[#1C1917] mt-4">
          {formatTime(moment.starts_at)} – ~{getEndTime()}
        </Text>

        {/* Host name with verification badge */}
        <View className="flex-row items-center mt-1">
          <Text className="text-[16px] text-[#1C1917]">
            {moment.host_name}
          </Text>
          {/* Show verification badge if host is authenticated (has host_id) */}
          {moment.host_id && moment.host_id !== "anonymous" && (
            <Text className="text-[15px] text-[#22C55E] ml-1">✓</Text>
          )}
        </View>

        {/* Note */}
        {moment.note && (
          <View className="bg-[#F9FAFB] rounded-xl px-4 py-4 mt-5">
            <Text className="text-[15px] text-[#4B5563] leading-6">
              "{moment.note}"
            </Text>
          </View>
        )}

        {/* Seats and price */}
        <Text className="text-[15px] text-[#6B7280] mt-5">
          {seatsOpen} {seatsOpen === 1 ? "seat" : "seats"} open{"  "}·{"  "}~฿150
        </Text>
      </ScrollView>

      {/* Join button */}
      <View className="px-6 pb-6 pt-3 border-t border-[#F3F4F6]">
        {isHost ? (
          <View className="bg-[#E5E7EB] py-4 rounded-2xl items-center">
            <Text className="text-[#9CA3AF] text-[17px] font-medium">Your moment</Text>
          </View>
        ) : hasJoined ? (
          <Pressable
            onPress={handleJoin}
            className="bg-[#22C55E] py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">You're in →</Text>
          </Pressable>
        ) : isFull ? (
          <View className="bg-[#E5E7EB] py-4 rounded-2xl items-center">
            <Text className="text-[#9CA3AF] text-[17px] font-medium">Full</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleJoin}
            disabled={joining}
            className={`bg-[#1C1917] py-4 rounded-2xl items-center ${joining ? "opacity-60" : "active:opacity-80"}`}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-[17px] font-medium">Join</Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Floating action button - hide if host or full (but show if already joined) */}
      {!isHost && (!isFull || hasJoined) && (
        <View className="absolute bottom-24 right-6">
          <Pressable
            onPress={handleJoin}
            disabled={joining}
            className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
              hasJoined ? "bg-[#22C55E]" : "bg-[#1F2937]"
            } ${joining ? "opacity-60" : "active:opacity-80"}`}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-2xl font-light">›</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
