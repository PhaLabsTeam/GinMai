import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useReportStore } from "../src/stores/reportStore";
import { useAuthStore } from "../src/stores/authStore";
import { confirmBlock } from "../src/utils/safetyActions";
import { colors } from "../src/theme/colors";

interface ReportCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: "no_show",
    label: "No-show",
    icon: "🚫",
    description: "Didn't arrive for the meal",
  },
  {
    id: "inappropriate_behavior",
    label: "Inappropriate Behavior",
    icon: "😠",
    description: "Rude, offensive, or inappropriate conduct",
  },
  {
    id: "harassment",
    label: "Harassment",
    icon: "💬",
    description: "Unwanted contact or intimidation",
  },
  {
    id: "fake_profile",
    label: "Fake Profile",
    icon: "🤥",
    description: "Suspicious or fraudulent account",
  },
  {
    id: "safety_concern",
    label: "Safety Concern",
    icon: "⚠️",
    description: "Felt unsafe or threatened",
  },
  {
    id: "other",
    label: "Other",
    icon: "📝",
    description: "Something else",
  },
];

export default function ReportUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string; momentId?: string; userName?: string }>();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitReport = useReportStore((state) => state.submitReport);
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert("Select a reason", "Please select why you're reporting this user");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to report");
      return;
    }

    setSubmitting(true);

    try {
      await submitReport({
        reporter_id: user.id,
        reported_user_id: params.userId,
        moment_id: params.momentId || null,
        category: selectedCategory as any,
        description: description.trim() || null,
      });

      Alert.alert(
        "Report Submitted",
        "Thank you. We'll review this report within 24 hours.",
        [
          {
            text: params.userName ? `Block ${params.userName}` : "Block",
            onPress: () =>
              confirmBlock(
                { userId: params.userId, name: params.userName || "this person" },
                () => router.back()
              ),
          },
          {
            text: "Done",
            onPress: () => router.back(),
            style: "cancel",
          },
        ]
      );
    } catch (error: any) {
      console.error("Error submitting report:", error);

      // Handle specific errors
      let errorMessage = "Could not submit report. Please try again.";
      if (error?.code === "23503") {
        errorMessage = "Test user doesn't exist. This works in production with real users.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Pressable onPress={() => router.back()} className="mb-4" disabled={submitting}>
            <Text className="text-accent text-base">← Cancel</Text>
          </Pressable>

          <Text className="text-ink text-2xl font-semibold mb-2">
            Report User
          </Text>
          <Text className="text-ink-secondary text-base">
            {params.userName ? `Report ${params.userName}` : "Help us keep GinMai safe"}
          </Text>
        </View>

        {/* Privacy Notice */}
        <View className="mx-6 mb-6 bg-subtle border border-line rounded-xl p-4">
          <Text className="text-ink-secondary text-sm">
            Reports are confidential. The user won't know who reported them.
            We'll review within 24 hours.
          </Text>
        </View>

        {/* Category Selection */}
        <View className="px-6 mb-6">
          <Text className="text-ink font-semibold mb-3">
            What happened?
          </Text>

          {REPORT_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              disabled={submitting}
              className={`bg-surface rounded-xl p-4 mb-3 border-2 ${
                selectedCategory === category.id
                  ? "border-accent"
                  : "border-line"
              }`}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{category.icon}</Text>
                <View className="flex-1">
                  <Text className="text-ink font-semibold mb-1">
                    {category.label}
                  </Text>
                  <Text className="text-ink-secondary text-sm">
                    {category.description}
                  </Text>
                </View>
                {selectedCategory === category.id && (
                  <Text className="text-accent text-xl">✓</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Description (Optional) */}
        <View className="px-6 mb-6">
          <Text className="text-ink font-semibold mb-2">
            Additional details (optional)
          </Text>
          <TextInput
            className="bg-surface border border-line rounded-xl p-4 text-ink min-h-[120px]"
            placeholder="Tell us more about what happened..."
            placeholderTextColor={colors.inkMuted}
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            editable={!submitting}
            maxLength={500}
          />
          <Text className="text-ink-secondary text-xs mt-1 text-right">
            {description.length}/500
          </Text>
        </View>

        {/* Submit Button */}
        <View className="px-6 pb-6">
          <Pressable
            onPress={handleSubmit}
            disabled={!selectedCategory || submitting}
            className={`rounded-xl py-4 ${
              !selectedCategory || submitting
                ? "bg-line"
                : "bg-accent active:opacity-80"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`text-center font-semibold text-base ${
                  !selectedCategory ? "text-ink-muted" : "text-white"
                }`}
              >
                Submit Report
              </Text>
            )}
          </Pressable>

          <Text className="text-ink-secondary text-xs text-center mt-4">
            False reports may result in account suspension
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
