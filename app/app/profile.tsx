import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/authStore";

// Mock connections - would come from database in real app
const mockConnections = [
  { id: "1", name: "Alex", verified: true },
  { id: "2", name: "James", verified: true },
  { id: "3", name: "Sara", verified: true },
];

export default function ProfileScreen() {
  const router = useRouter();

  // Auth state
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    // Navigate to edit profile (future feature)
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleSignIn = () => {
    router.push("/sign-up?returnTo=/profile");
  };

  // Format joined date
  const formatJoinedDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  };

  // Show loading while auth initializes
  if (!initialized) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <ActivityIndicator size="large" color="#1C1917" />
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9]">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center"
          >
            <Text className="text-[24px] text-[#1C1917]">←</Text>
          </Pressable>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[24px] font-semibold text-[#1C1917] text-center">
            Sign in to see your profile
          </Text>
          <Text className="text-[16px] text-[#6B7280] text-center mt-3">
            Track your meals, connect with people you've eaten with, and build your GinMai story.
          </Text>
          <Pressable
            onPress={handleSignIn}
            className="bg-[#1C1917] px-8 py-4 rounded-xl mt-8 active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-[#1C1917]">←</Text>
        </Pressable>
        <Pressable onPress={handleEdit}>
          <Text className="text-[16px] text-[#1C1917]">Edit</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="items-center pt-4 pb-6">
          <View className="flex-row items-center">
            <Text className="text-[28px] font-semibold text-[#1C1917]">
              {user.first_name}
            </Text>
            {user.phone_verified && (
              <Text className="text-[24px] text-[#22C55E] ml-2">✓</Text>
            )}
          </View>
          <Text className="text-[15px] text-[#6B7280] mt-1">
            Joined {formatJoinedDate(user.created_at)}
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-[#F3F4F6] mx-6" />

        {/* Meals shared stats */}
        <View className="px-6 py-5">
          <Text className="text-[15px] text-[#6B7280] mb-3">Meals shared</Text>
          <View className="flex-row">
            <View className="mr-10">
              <Text className="text-[32px] font-semibold text-[#1C1917]">
                {user.meals_hosted}
              </Text>
              <Text className="text-[14px] text-[#6B7280]">Hosted</Text>
            </View>
            <View>
              <Text className="text-[32px] font-semibold text-[#1C1917]">
                {user.meals_joined}
              </Text>
              <Text className="text-[14px] text-[#6B7280]">Joined</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-[#F3F4F6] mx-6" />

        {/* People I'd eat with again */}
        <View className="px-6 py-5">
          <Text className="text-[15px] text-[#6B7280] mb-4">
            People I'd eat with again
          </Text>
          {mockConnections.length > 0 ? (
            <View className="flex-row">
              {mockConnections.map((connection) => (
                <View key={connection.id} className="items-center mr-6">
                  {/* Avatar placeholder */}
                  <View className="w-14 h-14 rounded-full bg-[#E5E7EB]" />
                  <View className="flex-row items-center mt-2">
                    <Text className="text-[14px] text-[#1C1917]">
                      {connection.name}
                    </Text>
                    {connection.verified && (
                      <Text className="text-[12px] text-[#22C55E] ml-1">✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-[14px] text-[#9CA3AF]">
              Share a meal and connect with someone new.
            </Text>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-[#F3F4F6] mx-6" />

        {/* Settings link */}
        <Pressable
          onPress={handleSettings}
          className="px-6 py-5 active:bg-[#F9FAFB]"
        >
          <Text className="text-[17px] font-medium text-[#1C1917]">
            Settings →
          </Text>
        </Pressable>
      </ScrollView>

      {/* Floating action button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={() => router.push("/map")}
          className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <Text className="text-white text-2xl font-light">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
