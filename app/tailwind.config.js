/** @type {import('tailwindcss').Config} */
// Same values as src/theme/colors.ts (kept in sync by a test)
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF9",
        surface: "#FFFFFF",
        subtle: "#F5F5F4",
        line: { DEFAULT: "#E7E5E4", strong: "#D6D3D1" },
        ink: { DEFAULT: "#1C1917", secondary: "#78716C", muted: "#A8A29E" },
        accent: { DEFAULT: "#F97316", soft: "#FFF7ED", ink: "#C2410C" },
        success: { DEFAULT: "#22C55E", soft: "#F0FDF4", ink: "#15803D" },
        warning: "#F59E0B",
        error: { DEFAULT: "#EF4444", soft: "#FEF2F2" },
      },
    },
  },
  plugins: [],
};
