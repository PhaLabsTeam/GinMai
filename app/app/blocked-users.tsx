import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { useBlockStore } from "../src/stores/blockStore";
import { colors } from "../src/theme/colors";

export default function BlockedUsersScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const fetchBlocks = useBlockStore((state) => state.fetchBlocks);
  const unblockUser = useBlockStore((state) => state.unblockUser);
  const blockedUsers = useBlockStore((state) => state.blockedUsers);
  const loading = useBlockStore((state) => state.loading);

  // Fetch blocks when screen loads
  useEffect(() => {
    if (user?.id) {
      fetchBlocks(user.id);
    }
  }, [user?.id]);

  const handleUnblock = (userId: string, firstName: string) => {
    Alert.alert(
      `Unblock ${firstName}?`,
      "They'll be able to see your moments and join them again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: async () => {
            const success = await unblockUser(userId);
            if (success) {
              Alert.alert("Unblocked", `${firstName} has been unblocked`);
            }
          },
        },
      ]
    );
  };

  const formatBlockedDate = (dateStr: string) => {
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-accent text-base">← Back</Text>
          </Pressable>

          <Text className="text-ink text-2xl font-semibold mb-2">
            Blocked Users
          </Text>
          <Text className="text-ink-secondary text-base">
            People you've blocked can't see your moments or interact with you
          </Text>
        </View>

        {/* Loading State */}
        {loading && blockedUsers.length === 0 && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={colors.ink} />
            <Text className="text-ink-secondary mt-4">Loading blocked users...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && blockedUsers.length === 0 && (
          <View className="items-center justify-center py-12 px-8">
            <Text className="text-6xl mb-4">🔓</Text>
            <Text className="text-ink text-xl font-semibold text-center mb-2">
              No blocked users
            </Text>
            <Text className="text-ink-secondary text-center">
              When you block someone, they'll appear here
            </Text>
          </View>
        )}

        {/* Blocked Users List */}
        {blockedUsers.length > 0 && (
          <View className="px-6">
            {blockedUsers.map((blockedUser) => (
              <View
                key={blockedUser.id}
                className="bg-surface rounded-xl p-4 mb-3 border border-line"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-subtle items-center justify-center mr-3">
                      <Text className="text-xl">👤</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-ink text-lg font-semibold">
                          {blockedUser.first_name}
                        </Text>
                        {blockedUser.phone_verified && (
                          <Text className="text-success text-lg ml-1">✓</Text>
                        )}
                      </View>
                      <Text className="text-ink-secondary text-sm">
                        Blocked {formatBlockedDate(blockedUser.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleUnblock(blockedUser.blocked_id, blockedUser.first_name)}
                  className="bg-line rounded-lg py-3 active:opacity-70"
                  disabled={loading}
                >
                  <Text className="text-ink text-center font-semibold">
                    Unblock
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Info Box */}
        <View className="mx-6 mt-6 mb-8 bg-subtle border border-line rounded-xl p-4">
          <Text className="text-ink-secondary font-medium mb-2">
            About blocking
          </Text>
          <Text className="text-ink-secondary text-sm leading-5">
            • Blocked users can't see your moments{"\n"}
            • You won't see their moments{"\n"}
            • They won't be notified that you blocked them{"\n"}
            • You can unblock them anytime
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
