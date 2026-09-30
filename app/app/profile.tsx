import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/authStore";
import { ReliabilityScore } from "../src/components/ReliabilityBadge";
import { colors } from "../src/theme/colors";
import { Icon, Verified } from "../src/components/Icon";

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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <Pressable
            accessibilityLabel="Back"
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center"
          >
            <Icon name="arrow-back" size={24} />
          </Pressable>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[24px] font-semibold text-ink text-center">
            Sign in to see your profile
          </Text>
          <Text className="text-[16px] text-ink-secondary text-center mt-3">
            See the meals you've shared and the people you'd eat with again.
          </Text>
          <Pressable
            onPress={handleSignIn}
            className="bg-ink px-8 py-4 rounded-xl mt-8 active:opacity-80"
          >
            <Text className="text-white text-[17px] font-medium">Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          accessibilityLabel="Back"
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center"
        >
          <Icon name="arrow-back" size={24} />
        </Pressable>
        <Pressable onPress={handleEdit}>
          <Text className="text-[16px] text-ink">Edit</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="items-center pt-4 pb-6">
          <View className="flex-row items-center">
            <Text className="text-[28px] font-semibold text-ink">
              {user.first_name}
            </Text>
            {user.phone_verified && (
              <View className="ml-2"><Verified size={24} /></View>
            )}
          </View>
          <Text className="text-[15px] text-ink-secondary mt-1">
            Joined {formatJoinedDate(user.created_at)}
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-subtle mx-6" />

        {/* Meals shared stats */}
        <View className="px-6 py-5">
          <Text className="text-[15px] text-ink-secondary mb-3">Meals shared</Text>
          <View className="flex-row">
            <View className="mr-10">
              <Text className="text-[32px] font-semibold text-ink">
                {user.meals_hosted}
              </Text>
              <Text className="text-[14px] text-ink-secondary">Hosted</Text>
            </View>
            <View>
              <Text className="text-[32px] font-semibold text-ink">
                {user.meals_joined}
              </Text>
              <Text className="text-[14px] text-ink-secondary">Joined</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-subtle mx-6" />

        {/* Reliability Score */}
        <View className="px-6 py-5">
          <ReliabilityScore
            mealsHosted={user.meals_hosted}
            mealsJoined={user.meals_joined}
            noShows={user.no_shows}
          />
        </View>

        {/* Divider */}
        <View className="h-px bg-subtle mx-6" />

        {/* Connections */}
        <View className="px-6 py-5">
          <Pressable
            onPress={() => router.push("/connections")}
            className="bg-surface rounded-2xl p-4 shadow-sm flex-row items-center justify-between active:opacity-80"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-subtle items-center justify-center mr-3"><Icon name="people-outline" /></View>
              <View>
                <Text className="text-[17px] font-semibold text-ink">
                  Connections
                </Text>
                <Text className="text-[14px] text-ink-secondary mt-0.5">
                  People you'd eat with again
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.inkMuted} />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-subtle mx-6" />

        {/* Safety & Privacy */}
        <View className="px-6 py-5">
          <Pressable
            onPress={() => router.push("/safety")}
            className="bg-surface rounded-2xl p-4 shadow-sm flex-row items-center justify-between active:opacity-80"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-subtle items-center justify-center mr-3"><Icon name="shield-checkmark-outline" /></View>
              <View>
                <Text className="text-[17px] font-semibold text-ink">
                  Safety & Privacy
                </Text>
                <Text className="text-[14px] text-ink-secondary mt-0.5">
                  Emergency contacts & reporting
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.inkMuted} />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="h-px bg-subtle mx-6" />

        {/* Settings link */}
        <Pressable
          onPress={handleSettings}
          className="px-6 py-5 active:bg-subtle"
        >
          <Text className="text-[17px] font-medium text-ink">
            Settings →
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
