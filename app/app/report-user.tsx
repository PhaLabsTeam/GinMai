import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useReportStore } from "../src/stores/reportStore";
import { useAuthStore } from "../src/stores/authStore";

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
            text: "Block User",
            onPress: () => {
              // Navigate to block confirmation
              router.back();
              // TODO: Trigger block flow
            },
          },
          {
            text: "Done",
            onPress: () => router.back(),
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Pressable onPress={() => router.back()} className="mb-4" disabled={submitting}>
            <Text className="text-[#F97316] text-base">← Cancel</Text>
          </Pressable>

          <Text className="text-[#1C1917] text-2xl font-semibold mb-2">
            Report User
          </Text>
          <Text className="text-[#78716C] text-base">
            {params.userName ? `Report ${params.userName}` : "Help us keep GinMai safe"}
          </Text>
        </View>

        {/* Privacy Notice */}
        <View className="mx-6 mb-6 bg-[#DBEAFE] border border-[#3B82F6] rounded-xl p-4">
          <Text className="text-[#1E40AF] text-sm">
            Reports are confidential. The user won't know who reported them.
            We'll review within 24 hours.
          </Text>
        </View>

        {/* Category Selection */}
        <View className="px-6 mb-6">
          <Text className="text-[#1C1917] font-semibold mb-3">
            What happened?
          </Text>

          {REPORT_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              disabled={submitting}
              className={`bg-white rounded-xl p-4 mb-3 border-2 ${
                selectedCategory === category.id
                  ? "border-[#F97316]"
                  : "border-[#E7E5E4]"
              }`}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{category.icon}</Text>
                <View className="flex-1">
                  <Text className="text-[#1C1917] font-semibold mb-1">
                    {category.label}
                  </Text>
                  <Text className="text-[#78716C] text-sm">
                    {category.description}
                  </Text>
                </View>
                {selectedCategory === category.id && (
                  <Text className="text-[#F97316] text-xl">✓</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Description (Optional) */}
        <View className="px-6 mb-6">
          <Text className="text-[#1C1917] font-semibold mb-2">
            Additional details (optional)
          </Text>
          <TextInput
            className="bg-white border border-[#E7E5E4] rounded-xl p-4 text-[#1C1917] min-h-[120px]"
            placeholder="Tell us more about what happened..."
            placeholderTextColor="#A8A29E"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            editable={!submitting}
            maxLength={500}
          />
          <Text className="text-[#78716C] text-xs mt-1 text-right">
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
                ? "bg-[#E7E5E4]"
                : "bg-[#F97316] active:opacity-80"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`text-center font-semibold text-base ${
                  !selectedCategory ? "text-[#A8A29E]" : "text-white"
                }`}
              >
                Submit Report
              </Text>
            )}
          </Pressable>

          <Text className="text-[#78716C] text-xs text-center mt-4">
            False reports may result in account suspension
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
