/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF9",
        surface: "#FFFFFF",
        "text-primary": "#1C1917",
        "text-secondary": "#78716C",
        accent: "#F97316",
        success: "#22C55E",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
};
