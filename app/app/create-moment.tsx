import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Keyboard, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { getBestPosition } from "../src/utils/location";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { resolvePickedTime, defaultPickerTime, MAX_HOURS_AHEAD } from "../src/utils/pickTime";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";
import type { MomentLocal } from "../src/types";
import { mealWord, capitalize } from "../src/utils/mealWord";
import { maybeAskForPushPermission } from "../src/services/pushPermission";
import { colors } from "../src/theme/colors";
import { Icon } from "../src/components/Icon";
import { formatTime } from "../src/utils/formatTime";

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
  // Clock time chosen in the picker; resolved to a real start time on use
  const [pickedTime, setPickedTime] = useState<Date | null>(null);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  // Where: "current location" and "searched place" are kept apart so a failed
  // GPS lookup can never leave a stale place selected (or vice versa)
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [locationStatus, setLocationStatus] = useState<"locating" | "ready" | "unavailable">("locating");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAreaName, setCurrentAreaName] = useState<string | null>(null);
  const [placeCoords, setPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const coordinates = useCurrentLocation ? currentCoords : placeCoords;

  const scrollRef = useRef<ScrollView>(null);

  // Location search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Step 2: Details
  const [seats, setSeats] = useState(2);
  const [duration, setDuration] = useState<Duration>("normal");
  const [note, setNote] = useState("");

  // Find the user; if there's no fix at all, say so instead of guessing a location
  const locateUser = useCallback(async () => {
    setLocationStatus("locating");
    const position = await getBestPosition();
    if (!position) {
      setCurrentCoords(null);
      setLocationStatus("unavailable");
      return;
    }

    setCurrentCoords(position);
    setLocationStatus("ready");

    // The area name is a nicety; the Moment works without it
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude: position.lat, longitude: position.lng });
      setCurrentAreaName(address?.district || address?.subregion || address?.city || null);
    } catch (e) {
      console.log("Reverse geocode failed:", e);
    }
  }, []);

  useEffect(() => {
    locateUser();

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
    setPlaceCoords({ lat: result.lat, lng: result.lng });
    setPlaceName(result.name);
    setUseCurrentLocation(false);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const selectCurrentLocation = () => {
    setUseCurrentLocation(true);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    // Refresh the fix (and retry after a failure)
    locateUser();
  };

  // Keep the search box and its results above the keyboard
  useEffect(() => {
    if (!showSearch) return;
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, [showSearch]);

  // Results arrive after the keyboard is up; bring them into view too
  useEffect(() => {
    if (showSearch && searchResults.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [showSearch, searchResults]);

  const selectCustomTime = () => {
    setTimeOption("custom");
    if (!pickedTime) setPickedTime(defaultPickerTime());
    if (Platform.OS === "android") setShowAndroidPicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowAndroidPicker(false);
    if (event.type === "set" && date) setPickedTime(date);
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
      case "custom":
        return (pickedTime && resolvePickedTime(pickedTime, now)) || now;
      default:
        return now;
    }
  };


  const handleNext = () => {
    if (timeOption === "custom" && (!pickedTime || !resolvePickedTime(pickedTime))) {
      Alert.alert("Pick a closer time", `Choose a time in the next ${MAX_HOURS_AHEAD} hours.`);
      return;
    }
    if (!coordinates) {
      if (useCurrentLocation && locationStatus === "locating") {
        Alert.alert("Still finding you", "One moment, then try again. Or search for a place.");
      } else {
        Alert.alert("Where are you eating?", "We couldn't find your location. Search for a place instead.");
      }
      return;
    }
    Keyboard.dismiss();
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
          place_name: !useCurrentLocation ? placeName ?? undefined : undefined,
          area_name: useCurrentLocation ? currentAreaName ?? undefined : undefined,
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
        maybeAskForPushPermission("hosting");
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
        selected ? "border-ink" : "border-line"
      } mb-3`}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 ${
          selected ? "border-ink" : "border-line-strong"
        } items-center justify-center mr-3`}
      >
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-ink" />}
      </View>
      <Text className="text-[16px] text-ink">{label}</Text>
    </Pressable>
  );

  const SeatButton = ({ value }: { value: number }) => (
    <Pressable
      onPress={() => setSeats(value)}
      className={`w-14 h-14 rounded-xl items-center justify-center ${
        seats === value ? "bg-ink" : "border border-line"
      }`}
    >
      <Text
        className={`text-[18px] font-medium ${
          seats === value ? "text-white" : "text-ink"
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
        duration === value ? "bg-ink" : "border border-line"
      } ${isFirst ? "" : "ml-3"}`}
    >
      <Text
        className={`text-[15px] font-medium ${
          duration === value ? "text-white" : "text-ink"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-[12px] ${
          duration === value ? "text-white/70" : "text-ink-muted"
        }`}
      >
        {sublabel}
      </Text>
    </Pressable>
  );

  // Show loading while checking auth
  if (!authInitialized) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.ink} />
        <Text className="text-ink-secondary mt-4">Redirecting to sign up...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={handleBack} accessibilityLabel="Back" className="w-10 h-10 items-center justify-center">
          <Icon name="arrow-back" size={24} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text className="text-center text-[26px] font-normal text-ink mb-8">
          {step === 1 ? `Share your ${mealWord(getSelectedTime())}` : "A few details"}
        </Text>

        {step === 1 ? (
          <>
            {/* When? */}
            <Text className="text-[15px] text-ink-secondary mb-3">When?</Text>

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
              onPress={selectCustomTime}
              label={
                timeOption === "custom" && pickedTime
                  ? `At ${formatTime(getSelectedTime())}`
                  : "Pick a time..."
              }
            />

            {/* iOS: inline spinner under the option. Android: a dialog. */}
            {timeOption === "custom" && pickedTime && (Platform.OS === "ios" || showAndroidPicker) && (
              <DateTimePicker
                testID="custom-time-picker"
                value={pickedTime}
                mode="time"
                display={Platform.OS === "ios" ? "compact" : "default"}
                minuteInterval={5}
                onChange={handlePickerChange}
              />
            )}

            {/* Where? */}
            <Text className="text-[15px] text-ink-secondary mt-6 mb-3">Where?</Text>

            {/* Current location option */}
            <Pressable
              onPress={selectCurrentLocation}
              className={`flex-row items-center px-4 py-4 rounded-xl border ${
                useCurrentLocation ? "border-ink" : "border-line"
              } mb-3`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 ${
                  useCurrentLocation ? "border-ink" : "border-line-strong"
                } items-center justify-center mr-3`}
              >
                {useCurrentLocation && <View className="w-2.5 h-2.5 rounded-full bg-ink" />}
              </View>
              <View className="w-5 h-5 items-center justify-center mr-2">
                <Icon name="location-outline" size={18} color={colors.inkSecondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] text-ink">Use current location</Text>
                {useCurrentLocation && locationStatus === "locating" && (
                  <Text className="text-[14px] text-ink-muted">Finding you…</Text>
                )}
                {useCurrentLocation && locationStatus === "ready" && (
                  <Text className="text-[14px] text-ink-muted">{currentAreaName ?? "Found you"}</Text>
                )}
                {useCurrentLocation && locationStatus === "unavailable" && (
                  <Text className="text-[14px] text-ink-secondary">
                    Couldn't find you. Tap to retry, or search for a place.
                  </Text>
                )}
              </View>
            </Pressable>

            {/* Search for a place */}
            <Pressable
              onPress={() => setShowSearch(true)}
              className={`flex-row items-center px-4 py-4 rounded-xl border ${
                !useCurrentLocation ? "border-ink" : "border-line"
              } mb-2`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 ${
                  !useCurrentLocation ? "border-ink" : "border-line-strong"
                } items-center justify-center mr-3`}
              >
                {!useCurrentLocation && <View className="w-2.5 h-2.5 rounded-full bg-ink" />}
              </View>
              <View className="w-5 h-5 items-center justify-center mr-2">
                <Icon name="search-outline" size={18} color={colors.inkSecondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] text-ink">
                  {!useCurrentLocation && placeName ? placeName : "Search for a place"}
                </Text>
                {!useCurrentLocation && placeName && (
                  <Text className="text-[14px] text-ink-muted">Tap to change</Text>
                )}
              </View>
            </Pressable>

            {/* Search input and results */}
            {showSearch && (
              <View className="mt-2">
                <View className="flex-row items-center border border-line rounded-xl px-4 py-3">
                  <TextInput
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholder="Search restaurants, cafes..."
                    placeholderTextColor={colors.inkMuted}
                    autoFocus
                    className="flex-1 text-[16px] text-ink"
                  />
                  {searching && <ActivityIndicator size="small" color={colors.inkMuted} />}
                </View>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <View className="mt-2 border border-line rounded-xl overflow-hidden">
                    {searchResults.map((result, index) => (
                      <Pressable
                        key={`${result.lat}-${result.lng}-${index}`}
                        onPress={() => selectSearchResult(result)}
                        className={`px-4 py-3 active:bg-subtle ${
                          index < searchResults.length - 1 ? "border-b border-line" : ""
                        }`}
                      >
                        <Text className="text-[15px] text-ink">{result.name}</Text>
                        <Text className="text-[13px] text-ink-muted">{result.address}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* No results message */}
                {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
                  <Text className="text-[14px] text-ink-muted mt-2 text-center">
                    No places found. Try a different search.
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Seats */}
            <Text className="text-[15px] text-ink-secondary mb-3">How many seats?</Text>
            <View className="flex-row justify-between mb-8">
              <SeatButton value={1} />
              <SeatButton value={2} />
              <SeatButton value={3} />
              <SeatButton value={4} />
            </View>

            {/* Duration */}
            <Text className="text-[15px] text-ink-secondary mb-3">How long?</Text>
            <View className="flex-row mb-8">
              <DurationButton value="quick" label="Quick" sublabel="~30 min" isFirst />
              <DurationButton value="normal" label="Normal" sublabel="~1 hour" />
              <DurationButton value="long" label="Long" sublabel="2+ hours" />
            </View>

            {/* Note */}
            <Text className="text-[15px] text-ink-secondary mb-3">
              Note (optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={(text) => setNote(text.slice(0, 140))}
              placeholder="First week in CM. Nothing fancy."
              placeholderTextColor={colors.inkMuted}
              multiline
              // Return closes the keyboard; a note doesn't need line breaks
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              className="border border-line rounded-xl px-4 py-3 text-[16px] text-ink min-h-[100px]"
              style={{ textAlignVertical: "top" }}
            />
            <Text className="text-[12px] text-ink-muted mt-1 text-right">
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
          className={`bg-ink py-4 rounded-2xl items-center ${loading ? "opacity-60" : "active:opacity-80"}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text className="text-white text-[17px] font-medium">
              {step === 1 ? "Next" : "Make visible"}
            </Text>
          )}
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
