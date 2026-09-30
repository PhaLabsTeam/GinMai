import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useMoment } from "../src/hooks/useMoment";
import { useMomentStore } from "../src/stores/momentStore";
import { useAuthStore } from "../src/stores/authStore";
import { mealWord, capitalize } from "../src/utils/mealWord";
import { colors } from "../src/theme/colors";

type FeedbackOption = "great" | "okay" | "nope" | null;

export default function FeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ momentId: string; hostName: string }>();
  const hostName = params.hostName || "them";

  const submitFeedback = useMomentStore((state) => state.submitFeedback);
  const markConnectionCompleted = useMomentStore((state) => state.markConnectionCompleted);
  const user = useAuthStore((state) => state.user);

  const { moment, loading: momentLoading } = useMoment(params.momentId);
  const hostId = moment?.host_id || "";

  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackOption>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (option: FeedbackOption) => {
    setFeedback(option);
    if (option === "great" || option === "okay") {
      setStep(2);
    } else if (option === "nope") {
      // For "nope", save feedback and finish
      await saveFeedback(option, false);
    }
  };

  const saveFeedback = async (rating: "great" | "okay" | "nope", eatAgain?: boolean) => {
    if (!user || !params.momentId) {
      router.replace("/map");
      return;
    }

    setSubmitting(true);

    try {
      // Submit feedback
      const feedbackResult = await submitFeedback({
        momentId: params.momentId,
        fromUserId: user.id,
        aboutUserId: hostId,
        rating,
        eatAgain,
      });

      if (!feedbackResult.success) {
        throw new Error(feedbackResult.error || "Failed to submit feedback");
      }

      // Mark connection as completed
      await markConnectionCompleted(params.momentId, user.id);

      setSubmitting(false);
      router.replace("/map");
    } catch (err) {
      setSubmitting(false);
      const message = err instanceof Error ? err.message : "Something went wrong";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    }
  };

  const handleEatAgain = async (wantsToEatAgain: boolean) => {
    if (feedback) {
      await saveFeedback(feedback as "great" | "okay", wantsToEatAgain);
    } else {
      router.replace("/map");
    }
  };

  const handleSkip = async () => {
    if (user && params.momentId) {
      // Still mark connection as completed even if skipping feedback
      await markConnectionCompleted(params.momentId, user.id);
    }
    router.replace("/map");
  };

  // Simple face icon components
  const HappyFace = () => (
    <View className="w-12 h-12 items-center justify-center">
      <View className="w-12 h-12 rounded-full border-2 border-ink items-center justify-center">
        {/* Eyes */}
        <View className="flex-row justify-center" style={{ marginTop: -4 }}>
          <View className="w-1.5 h-1.5 bg-ink rounded-full mx-1.5" />
          <View className="w-1.5 h-1.5 bg-ink rounded-full mx-1.5" />
        </View>
        {/* Smile */}
        <View
          className="w-5 h-2.5 border-b-2 border-ink rounded-b-full"
          style={{ marginTop: 2 }}
        />
      </View>
    </View>
  );

  const NeutralFace = () => (
    <View className="w-12 h-12 items-center justify-center">
      <View className="w-12 h-12 rounded-full border-2 border-ink items-center justify-center">
        {/* Eyes */}
        <View className="flex-row justify-center" style={{ marginTop: -4 }}>
          <View className="w-1.5 h-1.5 bg-ink rounded-full mx-1.5" />
          <View className="w-1.5 h-1.5 bg-ink rounded-full mx-1.5" />
        </View>
        {/* Straight mouth */}
        <View
          className="w-5 h-0.5 bg-ink"
          style={{ marginTop: 4 }}
        />
      </View>
    </View>
  );

  const SadFace = () => (
    <View className="w-12 h-12 items-center justify-center">
      <View className="w-12 h-12 rounded-full border-2 border-ink items-center justify-center">
        {/* Eyes */}
        <View className="flex-row justify-center" style={{ marginTop: -2 }}>
          <View className="w-1.5 h-1.5 bg-ink rounded-full mx-1.5" />
          <View className="w-1.5 h-1.5 bg-ink rounded-full mx-1.5" />
        </View>
        {/* Frown */}
        <View
          className="w-5 h-2.5 border-t-2 border-ink rounded-t-full"
          style={{ marginTop: 6 }}
        />
      </View>
    </View>
  );

  const FeedbackButton = ({
    option,
    label,
    Face,
  }: {
    option: FeedbackOption;
    label: string;
    Face: React.FC;
  }) => (
    <Pressable
      onPress={() => handleFeedback(option)}
      disabled={submitting}
      className={`flex-1 items-center py-5 rounded-xl border ${
        feedback === option ? "border-ink bg-subtle" : "border-line"
      } mx-1.5 active:bg-subtle`}
    >
      {submitting && feedback === option ? (
        <ActivityIndicator size="small" color={colors.ink} />
      ) : (
        <>
          <Face />
          <Text className="text-[15px] text-ink mt-2">{label}</Text>
        </>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6">
        {step === 1 ? (
          <>
            {/* Step 1: How was the meal? */}
            <View className="pt-8">
              <Text className="text-center text-[32px] font-normal text-ink">
                How was {mealWord(moment?.starts_at ?? new Date())}?
              </Text>
            </View>

            {/* Feedback options */}
            <View className="flex-row mt-8 -mx-1.5">
              <FeedbackButton option="great" label="Great" Face={HappyFace} />
              <FeedbackButton option="okay" label="Okay" Face={NeutralFace} />
              <FeedbackButton option="nope" label="Nope" Face={SadFace} />
            </View>

            {/* Skip link */}
            <Pressable onPress={handleSkip} className="mt-6">
              <Text className="text-center text-[16px] text-ink-muted">
                Skip
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Step 2: Eat with them again? */}
            <View className="pt-8">
              <Text className="text-center text-[32px] font-normal text-ink">
                Eat with {hostName} again?
              </Text>
              <Text className="text-center text-[17px] text-ink-secondary mt-2">
                If you both say yes, you'll be connected.
              </Text>
            </View>

            {/* Yes/No options */}
            <View className="mt-10">
              <Pressable
                onPress={() => handleEatAgain(true)}
                disabled={submitting}
                className="bg-ink py-4 rounded-xl items-center active:opacity-80 mb-3"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text className="text-white text-[17px] font-medium">
                    Yes, I'd eat with them again
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => handleEatAgain(false)}
                disabled={submitting}
                className="border border-line py-4 rounded-xl items-center active:bg-subtle"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.ink} />
                ) : (
                  <Text className="text-[17px] text-ink">
                    No thanks
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Skip link */}
            <Pressable onPress={handleSkip} className="mt-6">
              <Text className="text-center text-[16px] text-ink-muted">
                Skip
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
