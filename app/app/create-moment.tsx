import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Keyboard, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";
import type { MomentLocal } from "../src/types";

type TimeOption = "now" | "30min" | "1hr" | "custom";
type Duration = "quick" | "normal" | "long";

interface SearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function CreateMomentScreen() {
  const router = useRouter();
  const createMomentInDb = useMomentStore((state) => state.createMomentInDb);
  const loading = useMomentStore((state) => state.loading);

  // Auth state - require login to create moments
  const user = useAuthStore((state) => state.user);
  const authInitialized = useAuthStore((state) => state.initialized);

  // Redirect to sign-up if not authenticated
  useEffect(() => {
    if (authInitialized && !user) {
      // Redirect to sign-up with return path
      router.replace("/sign-up?returnTo=/create-moment");
    }
  }, [authInitialized, user, router]);

  // Step management
  const [step, setStep] = useState(1);

  // Step 1: When & Where
  const [timeOption, setTimeOption] = useState<TimeOption>("now");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationName, setLocationName] = useState("Loading...");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  // Location search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Step 2: Details
  const [seats, setSeats] = useState(2);
  const [duration, setDuration] = useState<Duration>("normal");
  const [note, setNote] = useState("");

  // Get current location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setCoordinates({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });

        // Reverse geocode to get area name
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          setLocationName(address.district || address.subregion || address.city || "Current location");
        }
      } else {
        setLocationName("Chiang Mai");
        setCoordinates({ lat: 18.7883, lng: 98.9853 });
      }
    })();

    // Update current time every minute
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Search for places using geocoding
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Add "Chiang Mai" to improve local results
      const searchText = query.includes("Chiang Mai") ? query : `${query}, Chiang Mai, Thailand`;
      const results = await Location.geocodeAsync(searchText);

      const formattedResults: SearchResult[] = [];

      for (const result of results.slice(0, 5)) {
        // Reverse geocode to get address details
        const [address] = await Location.reverseGeocodeAsync({
          latitude: result.latitude,
          longitude: result.longitude,
        });

        if (address) {
          formattedResults.push({
            name: address.name || address.street || query,
            address: [address.district, address.city, address.region].filter(Boolean).join(", "),
            lat: result.latitude,
            lng: result.longitude,
          });
        }
      }

      setSearchResults(formattedResults);
    } catch (e) {
      console.log("Search error:", e);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    setCoordinates({ lat: result.lat, lng: result.lng });
    setLocationName(result.name);
    setUseCurrentLocation(false);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const selectCurrentLocation = async () => {
    setUseCurrentLocation(true);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === "granted") {
      const location = await Location.getCurrentPositionAsync({});
      setCoordinates({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (address) {
        setLocationName(address.district || address.subregion || address.city || "Current location");
      }
    }
  };

  const getSelectedTime = (): Date => {
    const now = new Date();
    switch (timeOption) {
      case "now":
        return now;
      case "30min":
        return new Date(now.getTime() + 30 * 60000);
      case "1hr":
        return new Date(now.getTime() + 60 * 60000);
      default:
        return now;
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      router.back();
    }
  };

  const handleMakeVisible = async () => {
    if (!coordinates || loading) return;

    // Require authentication
    if (!user) {
      router.replace("/sign-up?returnTo=/create-moment");
      return;
    }

    try {
      const startsAt = getSelectedTime();
      const durationHours = duration === "quick" ? 0.5 : duration === "normal" ? 1 : 2;
      const expiresAt = new Date(startsAt.getTime() + (durationHours + 1) * 60 * 60000);

      // M2: Link moment to authenticated user
      const momentData: Omit<MomentLocal, "id" | "created_at"> = {
        host_id: user.id,
        host_name: user.first_name,
        starts_at: startsAt.toISOString(),
        duration,
        location: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          place_name: !useCurrentLocation ? locationName : undefined,
          area_name: useCurrentLocation ? locationName : undefined,
        },
        seats_total: seats,
        seats_taken: 0,
        note: note || undefined,
        status: "active",
        expires_at: expiresAt.toISOString(),
      };

      const createdMoment = await createMomentInDb(momentData);

      if (createdMoment) {
        router.replace(`/moment-live?momentId=${createdMoment.id}`);
      } else {
        Alert.alert(
          "Couldn't create moment",
          "Something went wrong. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error creating moment:", error);
      Alert.alert(
        "Error",
        "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const RadioOption = ({
    selected,
    onPress,
    label,
  }: {
    selected: boolean;
    onPress: () => void;
    label: string;
  }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 rounded-xl border ${
        selected ? "border-[#1C1917]" : "border-[#E5E7EB]"
      } mb-3`}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 ${
          selected ? "border-[#1C1917]" : "border-[#D1D5DB]"
        } items-center justify-center mr-3`}
      >
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-[#1C1917]" />}
      </View>
      <Text className="text-[16px] text-[#1C1917]">{label}</Text>
    </Pressable>
  );

  const SeatButton = ({ value }: { value: number }) => (
    <Pressable
      onPress={() => setSeats(value)}
      className={`w-14 h-14 rounded-xl items-center justify-center ${
        seats === value ? "bg-[#1C1917]" : "border border-[#E5E7EB]"
      }`}
    >
      <Text
        className={`text-[18px] font-medium ${
          seats === value ? "text-white" : "text-[#1C1917]"
        }`}
      >
        {value}
      </Text>
    </Pressable>
  );

  const DurationButton = ({
    value,
    label,
    sublabel,
    isFirst,
  }: {
    value: Duration;
    label: string;
    sublabel: string;
    isFirst?: boolean;
  }) => (
    <Pressable
      onPress={() => setDuration(value)}
      className={`flex-1 py-3 rounded-xl items-center ${
        duration === value ? "bg-[#1C1917]" : "border border-[#E5E7EB]"
      } ${isFirst ? "" : "ml-3"}`}
    >
      <Text
        className={`text-[15px] font-medium ${
          duration === value ? "text-white" : "text-[#1C1917]"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-[12px] ${
          duration === value ? "text-white/70" : "text-[#9CA3AF]"
        }`}
      >
        {sublabel}
      </Text>
    </Pressable>
  );

  // Show loading while checking auth
  if (!authInitialized) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <ActivityIndicator size="large" color="#1C1917" />
      </SafeAreaView>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <ActivityIndicator size="large" color="#1C1917" />
        <Text className="text-[#78716C] mt-4">Redirecting to sign up...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={handleBack} className="w-10 h-10 items-center justify-center">
          <Text className="text-[24px] text-[#1C1917]">←</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text className="text-center text-[26px] font-normal text-[#1C1917] mb-8">
          {step === 1 ? "Share your lunch" : "Almost there"}
        </Text>

        {step === 1 ? (
          <>
            {/* When? */}
            <Text className="text-[15px] text-[#6B7280] mb-3">When?</Text>

            <RadioOption
              selected={timeOption === "now"}
              onPress={() => setTimeOption("now")}
              label={`Now (${formatTime(currentTime)})`}
            />
            <RadioOption
              selected={timeOption === "30min"}
              onPress={() => setTimeOption("30min")}
              label="In 30 minutes"
            />
            <RadioOption
              selected={timeOption === "1hr"}
              onPress={() => setTimeOption("1hr")}
              label="In 1 hour"
            />
            <RadioOption
              selected={timeOption === "custom"}
              onPress={() => setTimeOption("custom")}
              label="Pick a time..."
            />

            {/* Where? */}
            <Text className="text-[15px] text-[#6B7280] mt-6 mb-3">Where?</Text>

            {/* Current location option */}
            <Pressable
              onPress={selectCurrentLocation}
              className={`flex-row items-center px-4 py-4 rounded-xl border ${
                useCurrentLocation ? "border-[#1C1917]" : "border-[#E5E7EB]"
              } mb-3`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 ${
                  useCurrentLocation ? "border-[#1C1917]" : "border-[#D1D5DB]"
                } items-center justify-center mr-3`}
              >
                {useCurrentLocation && <View className="w-2.5 h-2.5 rounded-full bg-[#1C1917]" />}
              </View>
              <View className="w-5 h-5 items-center justify-center mr-2">
                <Text className="text-[14px]">📍</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[16px] text-[#1C1917]">Use current location</Text>
                {useCurrentLocation && (
                  <Text className="text-[14px] text-[#9CA3AF]">{locationName}</Text>
                )}
              </View>
            </Pressable>

            {/* Search for a place */}
            <Pressable
              onPress={() => setShowSearch(true)}
              className={`flex-row items-center px-4 py-4 rounded-xl border ${
                !useCurrentLocation ? "border-[#1C1917]" : "border-[#E5E7EB]"
              } mb-2`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 ${
                  !useCurrentLocation ? "border-[#1C1917]" : "border-[#D1D5DB]"
                } items-center justify-center mr-3`}
              >
                {!useCurrentLocation && <View className="w-2.5 h-2.5 rounded-full bg-[#1C1917]" />}
              </View>
              <View className="w-5 h-5 items-center justify-center mr-2">
                <Text className="text-[14px]">🔍</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[16px] text-[#1C1917]">
                  {!useCurrentLocation ? locationName : "Search for a place"}
                </Text>
                {!useCurrentLocation && (
                  <Text className="text-[14px] text-[#9CA3AF]">Tap to change</Text>
                )}
              </View>
            </Pressable>

            {/* Search input and results */}
            {showSearch && (
              <View className="mt-2">
                <View className="flex-row items-center border border-[#E5E7EB] rounded-xl px-4 py-3">
                  <TextInput
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholder="Search restaurants, cafes..."
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                    className="flex-1 text-[16px] text-[#1C1917]"
                  />
                  {searching && <ActivityIndicator size="small" color="#9CA3AF" />}
                </View>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <View className="mt-2 border border-[#E5E7EB] rounded-xl overflow-hidden">
                    {searchResults.map((result, index) => (
                      <Pressable
                        key={`${result.lat}-${result.lng}-${index}`}
                        onPress={() => selectSearchResult(result)}
                        className={`px-4 py-3 active:bg-[#F9FAFB] ${
                          index < searchResults.length - 1 ? "border-b border-[#E5E7EB]" : ""
                        }`}
                      >
                        <Text className="text-[15px] text-[#1C1917]">{result.name}</Text>
                        <Text className="text-[13px] text-[#9CA3AF]">{result.address}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* No results message */}
                {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
                  <Text className="text-[14px] text-[#9CA3AF] mt-2 text-center">
                    No places found. Try a different search.
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Seats */}
            <Text className="text-[15px] text-[#6B7280] mb-3">How many seats?</Text>
            <View className="flex-row justify-between mb-8">
              <SeatButton value={1} />
              <SeatButton value={2} />
              <SeatButton value={3} />
              <SeatButton value={4} />
            </View>

            {/* Duration */}
            <Text className="text-[15px] text-[#6B7280] mb-3">How long?</Text>
            <View className="flex-row mb-8">
              <DurationButton value="quick" label="Quick" sublabel="~30 min" isFirst />
              <DurationButton value="normal" label="Normal" sublabel="~1 hour" />
              <DurationButton value="long" label="Long" sublabel="2+ hours" />
            </View>

            {/* Note */}
            <Text className="text-[15px] text-[#6B7280] mb-3">
              Note (optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={(text) => setNote(text.slice(0, 140))}
              placeholder="First week in CM. Nothing fancy."
              placeholderTextColor="#9CA3AF"
              multiline
              className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-[16px] text-[#1C1917] min-h-[100px]"
              style={{ textAlignVertical: "top" }}
            />
            <Text className="text-[12px] text-[#9CA3AF] mt-1 text-right">
              {note.length}/140
            </Text>
          </>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View className="px-6 pb-6">
        <Pressable
          onPress={step === 1 ? handleNext : handleMakeVisible}
          disabled={loading}
          className={`bg-[#1C1917] py-4 rounded-2xl items-center ${loading ? "opacity-60" : "active:opacity-80"}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-[17px] font-medium">
              {step === 1 ? "Next" : "Make visible"}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Floating action button */}
      <View className="absolute bottom-24 right-6">
        <Pressable
          onPress={step === 1 ? handleNext : handleMakeVisible}
          className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <Text className="text-white text-2xl font-light">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
