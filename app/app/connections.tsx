import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { useMatchStore } from "../src/stores/matchStore";
import { ReliabilityBadge } from "../src/components/ReliabilityBadge";

export default function ConnectionsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const fetchUserMatches = useMatchStore((state) => state.fetchUserMatches);
  const matchedUsers = useMatchStore((state) => state.matchedUsers);
  const loading = useMatchStore((state) => state.loading);

  // Fetch matches when screen loads
  useEffect(() => {
    if (user?.id) {
      fetchUserMatches(user.id);
    }
  }, [user?.id, fetchUserMatches]);

  const handleBack = () => {
    router.back();
  };

  const formatLastMeal = (dateStr: string) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Show loading while fetching
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <ActivityIndicator size="large" color="#1C1917" />
        <Text className="text-[#78716C] mt-4">Loading your connections...</Text>
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
        <Text className="text-[18px] font-semibold text-[#1C1917]">
          Connections
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header text */}
        <View className="py-4">
          <Text className="text-[24px] font-semibold text-[#1C1917]">
            People you'd eat with again
          </Text>
          <Text className="text-[15px] text-[#6B7280] mt-2">
            {matchedUsers.length === 0
              ? "When you and someone both say you'd eat together again, they'll appear here."
              : `You've connected with ${matchedUsers.length} ${matchedUsers.length === 1 ? 'person' : 'people'}.`}
          </Text>
        </View>

        {/* Matched users list */}
        {matchedUsers.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-[48px] mb-4">🤝</Text>
            <Text className="text-[17px] text-[#9CA3AF] text-center">
              No connections yet
            </Text>
            <Text className="text-[15px] text-[#9CA3AF] text-center mt-2 px-8">
              Share meals and tap "I'd eat with them again" to build your network.
            </Text>
          </View>
        ) : (
          <View className="space-y-3 pb-6">
            {matchedUsers.map((matchedUser) => (
              <View
                key={matchedUser.userId}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                {/* User info */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    {/* Name and verification */}
                    <View className="flex-row items-center">
                      <Text className="text-[18px] font-semibold text-[#1C1917]">
                        {matchedUser.firstName}
                      </Text>
                      {matchedUser.phoneVerified && (
                        <Text className="text-[16px] text-[#22C55E] ml-1">✓</Text>
                      )}
                    </View>

                    {/* Last meal together */}
                    <Text className="text-[14px] text-[#6B7280] mt-0.5">
                      Last meal: {formatLastMeal(matchedUser.lastMealTogether)}
                    </Text>
                  </View>

                  {/* Reliability badge */}
                  <ReliabilityBadge
                    mealsHosted={matchedUser.mealsHosted}
                    mealsJoined={matchedUser.mealsJoined}
                    noShows={0}
                    size="small"
                  />
                </View>

                {/* Stats */}
                <View className="flex-row items-center">
                  <Text className="text-[14px] text-[#6B7280]">
                    {matchedUser.totalMealsTogether} {matchedUser.totalMealsTogether === 1 ? 'meal' : 'meals'} together
                  </Text>
                </View>

                {/* Action button - future: invite to meal */}
                {/* Commented out for now, can be implemented later
                <Pressable
                  className="bg-[#F97316] py-3 rounded-xl items-center mt-3 active:opacity-80"
                >
                  <Text className="text-white text-[15px] font-medium">
                    Invite to your next meal
                  </Text>
                </Pressable>
                */}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
