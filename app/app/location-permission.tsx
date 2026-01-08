import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

export default function LocationPermissionScreen() {
  const router = useRouter();

  const handleShareLocation = async () => {
    await Location.requestForegroundPermissionsAsync();
    // Navigate to map regardless of permission result
    // Map screen handles the fallback to Chiang Mai default
    router.replace("/map");
  };

  const handleNotNow = () => {
    router.replace("/map");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <View className="flex-1 px-6">
        {/* Main content - positioned in upper portion */}
        <View className="pt-10">
          {/* Title */}
          <Text className="text-center text-[28px] font-normal text-[#1C1917]">
            Where are you?
          </Text>

          {/* Subtitle */}
          <Text className="text-center text-[16px] text-[#6B7280] mt-5 leading-6">
            GinMai shows meals happening nearby.{"\n"}That's all we use it for.
          </Text>

          {/* Share location button */}
          <View className="mt-10">
            <Pressable
              onPress={handleShareLocation}
              className="bg-[#1C1917] py-4 rounded-2xl items-center active:opacity-80"
            >
              <Text className="text-white text-[17px] font-medium">
                Share location
              </Text>
            </Pressable>
          </View>

          {/* Not now link */}
          <Pressable onPress={handleNotNow} className="mt-4">
            <Text className="text-center text-[16px] text-[#78716C]">
              Not now
            </Text>
          </Pressable>
        </View>

        {/* Floating action button */}
        <View className="absolute bottom-8 right-0">
          <Pressable
            onPress={handleShareLocation}
            className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80"
          >
            <Text className="text-white text-2xl font-light">›</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
