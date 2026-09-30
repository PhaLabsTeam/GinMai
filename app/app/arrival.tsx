import { View, Text, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMoment } from "../src/hooks/useMoment";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";
import { colors } from "../src/theme/colors";

export default function ArrivalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string }>();
  const user = useAuthStore((state) => state.user);


  const { moment, loading: momentLoading } = useMoment(params.momentId);
  const hostName = moment?.host_name || "them";

  const handleFoundThem = () => {
    // Navigate to feedback with host name
    router.replace(`/feedback?momentId=${params.momentId}&hostName=${encodeURIComponent(hostName)}`);
  };

  const handleCantFind = () => {
    // In a real app, this would show help options or contact host
    // For now, just go back
    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6">
        {/* Header text */}
        <View className="pt-8">
          <Text className="text-center text-[32px] font-normal text-ink">
            You're here.
          </Text>
          <Text className="text-center text-[17px] text-ink-secondary mt-2">
            Look for the GinMai sign on the table.
          </Text>
        </View>

        {/* กิน sign card */}
        <View className="items-center mt-10">
          <View className="w-36 h-36 border-2 border-ink rounded-2xl items-center justify-center">
            <Text className="text-[56px] font-medium text-ink">
              กิน
            </Text>
          </View>
        </View>

        {/* Found them button */}
        <View className="mt-10">
          <Pressable
            onPress={handleFoundThem}
            className="bg-ink py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">
              Found them!
            </Text>
          </Pressable>
        </View>

        {/* Action buttons */}
        <View className="mt-6">
          {/* Running late button */}

          {/* Can't find them button */}
          <Pressable
            onPress={handleCantFind}
            className="border border-line py-4 rounded-xl items-center active:bg-subtle"
          >
            <Text className="text-[16px] text-ink">
              Can't find them →
            </Text>
          </Pressable>
        </View>

        {/* Back link */}
        <Pressable onPress={handleBack} className="mt-6">
          <Text className="text-center text-[16px] text-ink-muted">
            Back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
