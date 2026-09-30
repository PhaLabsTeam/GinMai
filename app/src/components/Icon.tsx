import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { colors } from "../theme/colors";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * The one icon set for the app: Ionicons, outline style, in palette colours.
 * Replaces the mix of emoji, text arrows and hand-drawn icons.
 */
export function Icon({
  name,
  size = 22,
  color = colors.ink,
  accessibilityLabel,
}: {
  name: IconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      // Icons are font glyphs; unless labelled they're decorative and must not
      // leak into the parent's label (VoiceOver read ", Profile")
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? "yes" : "no-hide-descendants"}
    />
  );
}

/** Green check shown after a verified person's name. */
export function Verified({ size = 16 }: { size?: number }) {
  return <Icon name="checkmark-circle" size={size} color={colors.success} accessibilityLabel="Verified" />;
}
