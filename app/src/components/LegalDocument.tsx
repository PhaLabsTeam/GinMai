import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "./ScreenHeader";
import type { LegalSection } from "../data/terms";

/** Shared layout for the Terms of Use and Privacy Policy screens. */
export function LegalDocument({ title, version, sections }: { title: string; version: string; sections: LegalSection[] }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title={title} />
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-[13px] text-ink-muted mb-4">Last updated {version}</Text>
        {sections.map((section) => (
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
