import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useMomentStore, MomentGuest } from "../src/stores/momentStore";
import { useNotificationStore } from "../src/stores/notificationStore";
import { MapComponent } from "../src/components/MapComponent";
import { InAppToast } from "../src/components/InAppToast";

export default function MomentLiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const moments = useMomentStore((state) => state.moments);
  const cancelMomentInDb = useMomentStore((state) => state.cancelMomentInDb);
  const fetchMomentGuests = useMomentStore((state) => state.fetchMomentGuests);
  const getMomentGuests = useMomentStore((state) => state.getMomentGuests);
  const subscribeToMomentConnections = useMomentStore((state) => state.subscribeToMomentConnections);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [cancelling, setCancelling] = useState(false);
  const [guests, setGuests] = useState<MomentGuest[]>([]);

  const moment = moments.find((m) => m.id === params.momentId);

  const [countdown, setCountdown] = useState("");

  // Handle guest events (joins/cancellations)
  const handleGuestEvent = useCallback((event: "joined" | "cancelled", guest: MomentGuest) => {
    if (event === "joined") {
      addNotification({
        type: "guest_joined",
        title: "New guest!",
        message: `${guest.firstName} wants to join your lunch`,
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
    }
  }, [params.momentId, addNotification]);

  // Fetch guests and subscribe to real-time updates
  useEffect(() => {
    if (!params.momentId) return;

    // Fetch initial guests
    fetchMomentGuests(params.momentId).then((fetchedGuests) => {
      setGuests(fetchedGuests);
    });

    // Subscribe to real-time connection updates
    const unsubscribe = subscribeToMomentConnections(params.momentId, handleGuestEvent);

    return () => {
      unsubscribe();
    };
  }, [params.momentId, fetchMomentGuests, subscribeToMomentConnections, handleGuestEvent]);

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

  const handleCancel = async () => {
    if (!moment || cancelling) return;

    setCancelling(true);
    await cancelMomentInDb(moment.id);
    router.replace("/map");
  };

  const handleShowTableSign = () => {
    router.push("/table-sign");
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

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header text */}
        <View className="pt-8">
          <Text className="text-center text-[32px] font-normal text-[#1C1917]">
            Lunch visible.
          </Text>
          <Text className="text-center text-[17px] text-[#6B7280] mt-2">
            You're just eating as planned.
          </Text>
        </View>

        {/* Map showing moment location */}
        <View className="mt-8 rounded-2xl h-52 overflow-hidden">
          <MapComponent
            region={{
              latitude: moment.location.lat,
              longitude: moment.location.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            markers={[{
              id: moment.id,
              latitude: moment.location.lat,
              longitude: moment.location.lng,
            }]}
            scrollEnabled={false}
            zoomEnabled={false}
            style={{ flex: 1 }}
            fallback={
              <View className="flex-1 bg-[#F3F4F6] items-center justify-center">
                <View className="w-12 h-12 items-center justify-center">
                  <View className="w-8 h-10 bg-[#4B5563] rounded-full rounded-b-none items-center pt-1.5">
                    <View className="w-3 h-3 bg-[#F3F4F6] rounded-full" />
                  </View>
                  <View
                    style={{
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
            }
          />
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

      {/* Floating action button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={handleShowTableSign}
          className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <Text className="text-white text-2xl font-light">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
