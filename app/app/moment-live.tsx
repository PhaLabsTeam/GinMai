import { View, Text, Pressable, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useMoment } from "../src/hooks/useMoment";
import { useMomentStore, MomentGuest } from "../src/stores/momentStore";
import { useNotificationStore } from "../src/stores/notificationStore";
import { InAppToast } from "../src/components/InAppToast";
import { mealWord, capitalize } from "../src/utils/mealWord";

export default function MomentLiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();

  const cancelMomentInDb = useMomentStore((state) => state.cancelMomentInDb);
  const fetchMomentGuests = useMomentStore((state) => state.fetchMomentGuests);
  const getMomentGuests = useMomentStore((state) => state.getMomentGuests);
  const subscribeToMomentConnections = useMomentStore((state) => state.subscribeToMomentConnections);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [cancelling, setCancelling] = useState(false);
  const [guests, setGuests] = useState<MomentGuest[]>([]);

  const { moment, loading: momentLoading } = useMoment(params.momentId);

  const [countdown, setCountdown] = useState("");

  // Handle guest events (joins/cancellations/arrivals)
  const handleGuestEvent = useCallback((event: "joined" | "cancelled" | "arrived" | "running_late", guest: MomentGuest) => {
    if (event === "joined") {
      addNotification({
        type: "guest_joined",
        title: "New guest!",
        message: `${guest.firstName} wants to join your table`,
        momentId: params.momentId,
        guestName: guest.firstName,
      });
      // Update local guest list
      setGuests((prev) => {
        if (prev.some((g) => g.id === guest.id)) return prev;
        return [...prev, guest];
      });
    } else if (event === "cancelled") {
      addNotification({
        type: "guest_cancelled",
        title: "Guest cancelled",
        message: `${guest.firstName} can't make it anymore`,
        momentId: params.momentId,
        guestName: guest.firstName,
      });
      // Update local guest list
      setGuests((prev) => prev.filter((g) => g.userId !== guest.userId));
    } else if (event === "arrived") {
      addNotification({
        type: "guest_arrived",
        title: "Guest arrived!",
        message: `${guest.firstName} is here`,
        momentId: params.momentId,
        guestName: guest.firstName,
      });
    } else if (event === "running_late") {
      addNotification({
        type: "guest_running_late",
        title: "Running late",
        message: `${guest.firstName} is running a few minutes late`,
        momentId: params.momentId,
        guestName: guest.firstName,
      });
    }
  }, [params.momentId, addNotification]);

  // Fetch guests and subscribe to real-time updates
  useEffect(() => {
    if (!params.momentId || !moment) return;

    // Fetch initial guests
    fetchMomentGuests(params.momentId)
      .then((fetchedGuests) => {
        setGuests(fetchedGuests);
      })
      .catch((err) => {
        console.error("Error fetching guests:", err);
      });

    // Subscribe to real-time connection updates
    const unsubscribe = subscribeToMomentConnections(params.momentId, handleGuestEvent);

    return () => {
      unsubscribe();
    };
  }, [params.momentId, moment, fetchMomentGuests, subscribeToMomentConnections, handleGuestEvent]);

  // Sync guests from store when they change
  useEffect(() => {
    const storeGuests = getMomentGuests(params.momentId || "");
    if (storeGuests.length > 0) {
      setGuests(storeGuests);
    }
  }, [params.momentId, getMomentGuests]);

  useEffect(() => {
    if (!moment) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const startTime = new Date(moment.starts_at).getTime();
      const diff = startTime - now;

      if (diff <= 0) {
        setCountdown("Now");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else {
        setCountdown(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [moment]);

  const handleBack = () => {
    // Arriving from create-moment replaced the stack entry, so there may be nothing to go back to
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/map");
    }
  };

  const cancelMoment = async () => {
    if (!moment || cancelling) return;

    setCancelling(true);
    const cancelled = await cancelMomentInDb(moment.id);
    if (cancelled) {
      router.replace("/map");
    } else {
      setCancelling(false);
      Alert.alert("Couldn't cancel", "Something went wrong. Please try again.");
    }
  };

  const handleCancel = () => {
    if (!moment || cancelling) return;

    const guestCount = guests.length;
    Alert.alert(
      "Cancel this meal?",
      guestCount > 0
        ? `${guestCount === 1 ? "Your guest" : `Your ${guestCount} guests`} will be told it's off.`
        : "It will disappear from the map.",
      [
        { text: "Keep it", style: "cancel" },
        { text: "Cancel meal", style: "destructive", onPress: cancelMoment },
      ]
    );
  };

  const handleShowTableSign = () => {
    router.push("/table-sign");
  };

  // Show loading while waiting for moment to appear in store
  if (!moment && momentLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <ActivityIndicator size="large" color="#1C1917" />
        <Text className="text-[#78716C] mt-4">Loading your moment...</Text>
      </SafeAreaView>
    );
  }

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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* In-app notification toast */}
      <InAppToast />

      {/* Header with back button */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable
          onPress={handleBack}
          accessibilityLabel="Back"
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-[#1C1917]">←</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header text */}
        <View className="pt-2">
          <Text className="text-center text-[32px] font-normal text-[#1C1917]">
            {capitalize(mealWord(moment.starts_at))} visible.
          </Text>
          <Text className="text-center text-[17px] text-[#6B7280] mt-2">
            You're just eating as planned.
          </Text>
        </View>

        {/* Location display - static to avoid native map crash during navigation */}
        <View className="mt-8 rounded-2xl h-40 overflow-hidden bg-[#F3F4F6]">
          <View className="flex-1 items-center justify-center">
            {/* Location pin icon */}
            <View className="w-16 h-16 rounded-full bg-[#F97316]/20 items-center justify-center mb-2">
              <View className="w-10 h-10 rounded-full bg-[#F97316]/30 items-center justify-center">
                <Text className="text-2xl">📍</Text>
              </View>
            </View>
            <Text className="text-[#6B7280] text-sm">Your location is visible</Text>
          </View>
        </View>

        {/* Place name */}
        <Text className="text-center text-[18px] font-semibold text-[#1C1917] mt-5">
          {moment.location.place_name || moment.location.area_name || "Your location"}
        </Text>

        {/* Time and seats */}
        <Text className="text-center text-[16px] text-[#6B7280] mt-1">
          {formatTime(moment.starts_at)} · {moment.seats_total} {moment.seats_total === 1 ? "seat" : "seats"}
        </Text>

        {/* Countdown (if not started yet) */}
        {countdown && countdown !== "Now" && (
          <Text className="text-center text-[14px] text-[#9CA3AF] mt-2">
            Starts in {countdown}
          </Text>
        )}

        {/* Guest count and list */}
        <View className="mt-6">
          {guests.length > 0 ? (
            <>
              {/* Joining count */}
              <Text className="text-center text-[15px] text-[#22C55E] font-medium mb-3">
                {guests.length} {guests.length === 1 ? "person" : "people"} joining
              </Text>

              {/* Guest list */}
              <View className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                {guests.map((guest, index) => (
                  <View
                    key={guest.id}
                    className={`flex-row items-center py-2 ${
                      index < guests.length - 1 ? "border-b border-[#F3F4F6]" : ""
                    }`}
                  >
                    {/* Avatar circle */}
                    <View className="w-9 h-9 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
                      <Text className="text-[#6B7280] text-[14px] font-medium">
                        {guest.firstName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    {/* Name */}
                    <Text className="text-[15px] text-[#1C1917] flex-1">
                      {guest.firstName}
                    </Text>
                    {/* Confirmed badge */}
                    <View className="bg-[#ECFDF5] px-2 py-1 rounded-full">
                      <Text className="text-[12px] text-[#22C55E] font-medium">
                        Confirmed
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text className="text-center text-[15px] text-[#9CA3AF]">
              Waiting for guests...
            </Text>
          )}
        </View>

        {/* Cancel link */}
        <Pressable onPress={handleCancel} disabled={cancelling} className="mt-4">
          {cancelling ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Text className="text-center text-[16px] text-[#6B7280]">
              Cancel this meal →
            </Text>
          )}
        </Pressable>

        {/* Show table sign button */}
        <View className="mt-8">
          <Pressable
            onPress={handleShowTableSign}
            className="bg-[#1C1917] py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">
              Show table sign
            </Text>
          </Pressable>
        </View>

        {/* Bottom padding for FAB */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
