import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useMoment } from "../src/hooks/useMoment";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";
import { openSafetyActions } from "../src/utils/safetyActions";
import * as Location from "expo-location";
import { distanceMeters, formatWalk } from "../src/utils/distance";
import { maybeAskForPushPermission } from "../src/services/pushPermission";
import { colors } from "../src/theme/colors";

export default function MomentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const joinMoment = useMomentStore((state) => state.joinMoment);
  const hasJoinedMoment = useMomentStore((state) => state.hasJoinedMoment);
  const fetchUserConnections = useMomentStore((state) => state.fetchUserConnections);
  const user = useAuthStore((state) => state.user);
  const [joining, setJoining] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Last known position is enough for a walking estimate and doesn't wait on GPS
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return;
        const position = await Location.getLastKnownPositionAsync();
        if (position && !cancelled) {
          setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
        }
      } catch (e) {
        console.log("Location unavailable for walking estimate:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { moment, loading: momentLoading } = useMoment(params.momentId);
  const hasJoined = params.momentId ? hasJoinedMoment(params.momentId) : false;

  // Fetch user's connections when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserConnections(user.id);
    }
  }, [user?.id, fetchUserConnections]);

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
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-ink">Go back</Text>
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
      maybeAskForPushPermission("joined");
    } else {
      Alert.alert("Couldn't join", result.error || "Something went wrong. Please try again.");
    }
  };

  // Hidden when we don't know where the user is
  const walkingDistance = userPosition
    ? formatWalk(distanceMeters(userPosition, moment.location))
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with back button */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-ink">←</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Map placeholder card */}
        <View className="bg-subtle rounded-2xl h-44 items-center justify-center">
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

        {/* Walking distance */}
        {walkingDistance && (
          <Text className="text-center text-[15px] text-ink-secondary mt-3">
            {walkingDistance}
          </Text>
        )}

        {/* Place info */}
        <View className="flex-row items-center mt-6">
          <Text className="text-2xl mr-2">🍜</Text>
          <Text className="text-[20px] font-semibold text-ink">
            {moment.location.place_name || "Somewhere tasty"}
          </Text>
        </View>

        {/* Area */}
        <Text className="text-[16px] text-ink-secondary mt-1">
          {moment.location.area_name || "Chiang Mai"}
        </Text>

        {/* Time range */}
        <Text className="text-[16px] text-ink mt-4">
          {formatTime(moment.starts_at)} – ~{getEndTime()}
        </Text>

        {/* Host name with verification badge */}
        <View className="flex-row items-center mt-1">
          <Text className="text-[16px] text-ink">
            {moment.host_name}
          </Text>
          {/* Show verification badge if host is authenticated (has host_id) */}
          {moment.host_id && moment.host_id !== "anonymous" && (
            <Text className="text-[15px] text-success ml-1">✓</Text>
          )}
        </View>
        {user && !isHost && moment.host_id !== "anonymous" && (
          <Pressable
            onPress={() =>
              openSafetyActions(router, { userId: moment.host_id, name: moment.host_name, momentId: moment.id })
            }
            hitSlop={8}
            className="self-start mt-2"
          >
            <Text className="text-[13px] text-ink-secondary">Report or block</Text>
          </Pressable>
        )}

        {/* Note */}
        {moment.note && (
          <View className="bg-subtle rounded-xl px-4 py-4 mt-5">
            <Text className="text-[15px] text-ink-secondary leading-6">
              "{moment.note}"
            </Text>
          </View>
        )}

        {/* Seats */}
        <Text className="text-[15px] text-ink-secondary mt-5">
          {seatsOpen} {seatsOpen === 1 ? "seat" : "seats"} open
        </Text>
      </ScrollView>

      {/* Join button */}
      <View className="px-6 pb-6 pt-3 border-t border-subtle">
        {isHost ? (
          <Pressable
            onPress={() => router.push(`/moment-live?momentId=${moment.id}`)}
            className="bg-ink py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">Manage your moment →</Text>
          </Pressable>
        ) : hasJoined ? (
          <Pressable
            onPress={handleJoin}
            className="bg-success py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">You're in →</Text>
          </Pressable>
        ) : isFull ? (
          <View className="bg-line py-4 rounded-2xl items-center">
            <Text className="text-ink-muted text-[17px] font-medium">Full</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleJoin}
            disabled={joining}
            className={`bg-ink py-4 rounded-2xl items-center ${joining ? "opacity-60" : "active:opacity-80"}`}
          >
            {joining ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text className="text-white text-[17px] font-medium">Join</Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
