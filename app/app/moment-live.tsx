import { View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useMomentStore } from "../src/stores/momentStore";

// Conditionally import MapView and Marker only on native
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function MomentLiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const moments = useMomentStore((state) => state.moments);
  const cancelMomentInDb = useMomentStore((state) => state.cancelMomentInDb);
  const [cancelling, setCancelling] = useState(false);

  const moment = moments.find((m) => m.id === params.momentId);

  const [countdown, setCountdown] = useState("");
  const [viewers] = useState(0); // Would come from real-time subscriptions

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
      <View className="flex-1 px-6">
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
          {Platform.OS !== "web" && MapView ? (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: moment.location.lat,
                longitude: moment.location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {Marker && (
                <Marker
                  coordinate={{
                    latitude: moment.location.lat,
                    longitude: moment.location.lng,
                  }}
                >
                  {/* Pulse marker */}
                  <View style={{ alignItems: "center", justifyContent: "center" }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: "rgba(249, 115, 22, 0.25)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: "#F97316",
                        }}
                      />
                    </View>
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
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
          )}
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

        {/* Viewers count */}
        <Text className="text-center text-[15px] text-[#9CA3AF] mt-6">
          {viewers} {viewers === 1 ? "person" : "people"} looking
        </Text>

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
      </View>

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
