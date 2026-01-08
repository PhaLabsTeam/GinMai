import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLetsGo = () => {
    router.push("/location-permission");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <View className="flex-1 px-8">
        {/* Main content - positioned in upper portion */}
        <View className="pt-16">
          {/* Thai title */}
          <Text className="text-center text-[56px] font-bold text-[#1C1917] leading-tight">
            กินไหม
          </Text>

          {/* English subtitle */}
          <Text className="text-center text-[22px] text-[#9CA3AF] mt-1">
            Wanna eat?
          </Text>

          {/* Let's go button */}
          <View className="items-center mt-12">
            <Pressable
              onPress={handleLetsGo}
              className="bg-[#1C1917] px-14 py-4 rounded-full active:opacity-80"
            >
              <Text className="text-white text-[17px] font-medium">
                Let's go
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Floating action button */}
        <View className="absolute bottom-8 right-0">
          <Pressable
            onPress={handleLetsGo}
            className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80"
          >
            <Text className="text-white text-xl">›</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
