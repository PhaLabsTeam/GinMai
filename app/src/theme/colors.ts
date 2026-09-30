/**
 * GinMai palette: warm stone neutrals and one warm accent (see CLAUDE.md).
 * tailwind.config.js holds the same values for className use; this file is for
 * props Tailwind can't reach (placeholderTextColor, ActivityIndicator, icons,
 * Switch tracks). A test keeps the two in sync.
 */
export const colors = {
  background: "#FAFAF9",
  surface: "#FFFFFF",
  subtle: "#F5F5F4",
  line: "#E7E5E4",
  lineStrong: "#D6D3D1",

  ink: "#1C1917",
  inkSecondary: "#78716C",
  inkMuted: "#A8A29E",

  accent: "#F97316",
  accentSoft: "#FFF7ED",
  accentInk: "#C2410C",

  success: "#22C55E",
  successSoft: "#F0FDF4",
  successInk: "#15803D",

  warning: "#F59E0B",

  error: "#EF4444",
  errorSoft: "#FEF2F2",
} as const;
