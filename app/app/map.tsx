import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import * as Location from "expo-location";
import { useMomentStore } from "../src/stores/momentStore";
import { MapComponent, mapsAvailable } from "../src/components/MapComponent";

// Default to Chiang Mai center
const CHIANG_MAI = {
  latitude: 18.7883,
  longitude: 98.9853,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const router = useRouter();
  const moments = useMomentStore((state) => state.moments);
  const loading = useMomentStore((state) => state.loading);
  const fetchNearbyMoments = useMomentStore((state) => state.fetchNearbyMoments);
  const subscribeToMoments = useMomentStore((state) => state.subscribeToMoments);
  const [region, setRegion] = useState(CHIANG_MAI);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Get user location and fetch moments
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        console.log("Location permission status:", status);

        if (status === "granted") {
          console.log("Getting current position...");
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const lat = location.coords.latitude;
          const lng = location.coords.longitude;
          console.log("Got location:", lat, lng);

          setRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setUserLocation({ lat, lng });

          // Fetch moments near user's location
          fetchNearbyMoments(lat, lng);
        } else {
          console.log("Location not granted, using Chiang Mai default");
          // Use Chiang Mai center as default
          setRegion(CHIANG_MAI);
          fetchNearbyMoments(CHIANG_MAI.latitude, CHIANG_MAI.longitude);
        }
      } catch (e) {
        console.log("Location error:", e);
        // Location not available, use default
        setRegion(CHIANG_MAI);
        fetchNearbyMoments(CHIANG_MAI.latitude, CHIANG_MAI.longitude);
      }
    })();
  }, [fetchNearbyMoments]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToMoments();
    return () => {
      unsubscribe();
    };
  }, [subscribeToMoments]);

  // Refresh moments when screen comes into focus
  const handleRefresh = useCallback(() => {
    const lat = userLocation?.lat || CHIANG_MAI.latitude;
    const lng = userLocation?.lng || CHIANG_MAI.longitude;
    fetchNearbyMoments(lat, lng);
  }, [userLocation, fetchNearbyMoments]);

  const handleShareMeal = () => {
    router.push("/create-moment");
  };

  return (
    <View className="flex-1 bg-[#FAFAF9]">
      {/* Full-screen Map */}
      <MapComponent
        region={region}
        markers={moments.map((moment) => ({
          id: moment.id,
          latitude: moment.location.lat,
          longitude: moment.location.lng,
          onPress: () => router.push(`/moment-detail?momentId=${moment.id}`),
        }))}
        onMapReady={() => setMapReady(true)}
        showsUserLocation
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        fallback={
          <View className="absolute top-0 left-0 right-0 bottom-0 bg-[#F3F4F6]">
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-[#6B7280] text-lg text-center">Chiang Mai</Text>
              <Text className="text-[#9CA3AF] text-sm text-center mt-2">
                Map view unavailable
              </Text>
              {moments.length > 0 && (
                <Text className="text-[#1C1917] text-base font-medium mt-4">
                  {moments.length} meal{moments.length !== 1 ? "s" : ""} happening nearby
                </Text>
              )}
            </View>
          </View>
        }
      />

      {/* Overlay Content */}
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3 bg-[#FAFAF9]">
          {/* Menu button */}
          <Pressable
            onPress={() => router.push("/menu")}
            className="w-10 h-10 items-center justify-center"
          >
            <View>
              <View className="w-5 h-0.5 bg-[#1C1917]" />
              <View className="w-5 h-0.5 bg-[#1C1917] mt-1.5" />
              <View className="w-5 h-0.5 bg-[#1C1917] mt-1.5" />
            </View>
          </Pressable>

          {/* Title */}
          <Text className="text-[17px] font-medium text-[#1C1917]">
            Chiang Mai
          </Text>

          {/* Profile button */}
          <Pressable
            onPress={() => router.push("/profile")}
            className="w-10 h-10 items-center justify-center"
          >
            <View className="w-6 h-6 rounded-full border-2 border-[#1C1917] items-center overflow-hidden">
              <View className="w-2 h-2 bg-[#1C1917] rounded-full mt-1" />
              <View className="w-4 h-2 bg-[#1C1917] rounded-t-full mt-0.5" />
            </View>
          </Pressable>
        </View>

        {/* Content area */}
        <View className="flex-1">
          {loading ? (
            /* Loading State */
            <View className="bg-[#FAFAF9] mx-4 mt-2 rounded-2xl px-5 py-6 items-center">
              <ActivityIndicator size="small" color="#78716C" />
              <Text className="text-center text-[14px] text-[#9CA3AF] mt-3">
                Looking for meals nearby...
              </Text>
            </View>
          ) : moments.length === 0 ? (
            /* Empty State */
            <View className="bg-[#FAFAF9] mx-4 mt-2 rounded-2xl px-5 py-6">
              <Text className="text-center text-[18px] font-medium text-[#1C1917]">
                Nothing here yet.
              </Text>
              <Text className="text-center text-[14px] text-[#9CA3AF] mt-3 leading-5">
                Chiang Mai is full of people eating lunch.{"\n"}Someone just needs to make the first seat visible.
              </Text>
            </View>
          ) : (
            /* Moments List */
            <ScrollView className="bg-[#FAFAF9] mx-4 mt-2 rounded-t-2xl">
              <Text className="text-center text-[15px] text-[#78716C] py-4">
                Eating soon?
              </Text>
              {moments.map((moment) => {
                const seatsOpen = moment.seats_total - moment.seats_taken;
                const isFull = seatsOpen <= 0 || moment.status === "full";

                return (
                  <Pressable
                    key={moment.id}
                    onPress={() => router.push(`/moment-detail?momentId=${moment.id}`)}
                    className="flex-row items-center px-4 py-3 border border-[#E5E7EB] rounded-xl mx-4 mb-3 bg-white active:bg-[#F9FAFB]"
                  >
                    {/* Food emoji placeholder */}
                    <Text className="text-2xl mr-3">🍜</Text>

                    <View className="flex-1">
                      {/* Time and place */}
                      <View className="flex-row items-center">
                        <Text className="text-[15px] font-semibold text-[#1C1917]">
                          {new Date(moment.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text className="text-[15px] text-[#1C1917] ml-2">
                          · {moment.location.place_name || moment.location.area_name || "Somewhere tasty"}
                        </Text>
                      </View>

                      {/* Host and details */}
                      <View className="flex-row items-center mt-1">
                        <Text className="text-[14px] text-[#78716C]">
                          {moment.host_name}
                        </Text>
                        {/* Show verification badge if host is authenticated */}
                        {moment.host_id && moment.host_id !== "anonymous" && (
                          <Text className="text-[13px] text-[#22C55E]"> ✓</Text>
                        )}
                        <Text className="text-[14px] text-[#78716C]">
                          {"  ·  "}{moment.seats_taken}/{moment.seats_total} seats
                        </Text>
                      </View>
                    </View>

                    {/* Full badge */}
                    {isFull && (
                      <View className="bg-[#F3F4F6] px-2 py-1 rounded-md">
                        <Text className="text-[12px] text-[#6B7280] font-medium">Full</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Share button - positioned at bottom of content area */}
          <View className="bg-[#FAFAF9] mx-4 mb-4 rounded-b-2xl px-4 pb-4">
            <Pressable
              onPress={handleShareMeal}
              className="border border-[#1C1917] py-3.5 rounded-xl items-center active:bg-[#F5F5F4]"
            >
              <Text className="text-[16px] text-[#1C1917]">
                Share where you're eating →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Floating action button */}
        <View className="absolute bottom-8 right-6">
          <Pressable
            onPress={handleShareMeal}
            className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
          >
            <Text className="text-white text-2xl font-light">›</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
