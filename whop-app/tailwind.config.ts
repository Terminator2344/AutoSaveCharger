import { frostedThemePlugin } from "@whop/react/tailwind";

export default {
  theme: {
    extend: {
      colors: {
        bgDark: "#050505",
        bgDarker: "#0a0a0a",
        accentFire: "#ff5500",
        accentOrange: "#f97316",
        accentAmber: "#fbbf24",
        accentGold: "#ffb347",
        success: "#22c55e",
        danger: "#ef4444",
        textPrimary: "#e5e5e5",
        textSecondary: "#a3a3a3",
        textMuted: "#737373",
      },
    },
  },
  plugins: [frostedThemePlugin()],
};
