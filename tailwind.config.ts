import type { Config } from "tailwindcss";

/**
 * هوية كوكب كراكيب البصرية:
 * أخضر بيئي + تركوازي + أبيض + أخضر داكن + لمسات ذهبية/برتقالية
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        planet: {
          50: "#effbf5",
          100: "#d7f5e6",
          200: "#b0e9d1",
          300: "#7dd7b5",
          400: "#43bd95",
          500: "#1fa27c", // الأخضر البيئي الأساسي
          600: "#128266",
          700: "#106854",
          800: "#115344",
          900: "#0f4439", // الأخضر الداكن
          950: "#04241d", // أعمق أخضر (خلفيات داكنة)
        },
        tealx: {
          400: "#2dd4bf",
          500: "#14b8a6", // تركوازي
          600: "#0d9488",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b", // لمسة ذهبية/برتقالية
          600: "#d97706",
        },
      },
      fontFamily: {
        cairo: ['"Cairo"', "system-ui", "-apple-system", "Segoe UI", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(15, 68, 57, 0.08)",
        lift: "0 14px 40px rgba(15, 68, 57, 0.14)",
        glow: "0 0 0 1px rgba(31,162,124,.25), 0 10px 32px rgba(31,162,124,.35)",
        glowLg: "0 0 24px rgba(31,162,124,.55), 0 14px 44px rgba(20,184,166,.35)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(31,162,124,.45), 0 10px 32px rgba(31,162,124,.30)" },
          "50%": { boxShadow: "0 0 34px rgba(31,162,124,.75), 0 14px 44px rgba(20,184,166,.45)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s ease both",
        "fade-in": "fade-in .4s ease both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        floaty: "floaty 4s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
