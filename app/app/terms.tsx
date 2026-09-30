import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { TERMS_SECTIONS, TERMS_VERSION } from "../src/data/terms";

// Terms of Use, readable before signing up (#17)
export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Terms of Use" />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-[13px] text-ink-muted mb-4">Last updated {TERMS_VERSION}</Text>
        {TERMS_SECTIONS.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-[17px] font-semibold text-ink mb-2" accessibilityRole="header">
              {section.title}
            </Text>
            {section.body.map((paragraph, i) => (
              <Text key={i} className="text-[15px] text-ink-secondary leading-6 mb-2">
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
