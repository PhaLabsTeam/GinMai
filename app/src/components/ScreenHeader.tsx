import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Shared top bar: a back arrow, an optional title, an optional action on the
 * right. With nothing to go back to (e.g. after a replace), it goes to the map.
 */
export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const router = useRouter();
  const goBack =
    onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/map")));

  return (
    <View className="flex-row items-center px-5 py-3 min-h-[64px]">
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        className="w-10 h-10 items-center justify-center -ml-2"
      >
        <Icon name="arrow-back" size={24} />
      </Pressable>
      {title ? (
        <Text className="text-[17px] font-medium text-ink ml-2 flex-1" accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <View className="flex-1" />
      )}
      {right}
    </View>
  );
}
