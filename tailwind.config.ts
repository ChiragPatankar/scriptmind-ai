import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Theme-adaptive colours — powered by CSS variables (RGB channels)
           so that opacity modifiers like bg-background/50 work correctly */
        background: "rgb(var(--bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        "surface-2": "rgb(var(--surface2-rgb) / <alpha-value>)",
        "surface-3": "rgb(var(--surface3-rgb) / <alpha-value>)",
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        text: {
          primary: "rgb(var(--text-p-rgb) / <alpha-value>)",
          secondary: "rgb(var(--text-s-rgb) / <alpha-value>)",
          muted: "rgb(var(--text-m-rgb) / <alpha-value>)",
        },
        /* Brand colours — fixed across themes */
        accent: {
          DEFAULT: "#1D77C5",
          hover: "#155FA0",
          light: "#5BA8E5",
          muted: "#1D77C533",
        },
        secondary: {
          DEFAULT: "#00C2E0",
          hover: "#009BB5",
          muted: "#00C2E033",
        },
        gold: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-hero":
          "linear-gradient(135deg, #0B0B0F 0%, #060D1C 50%, #080F1A 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(29,119,197,0.1) 0%, rgba(0,194,224,0.05) 100%)",
        "gradient-accent":
          "linear-gradient(135deg, #1D77C5 0%, #155FA0 100%)",
        "gradient-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(29,119,197,0.3) 0%, transparent 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(29,119,197,0.35)",
        "glow-sm": "0 0 20px rgba(29,119,197,0.25)",
        "glow-cyan": "0 0 40px rgba(0,194,224,0.3)",
        glass: "0 8px 32px rgba(0,0,0,0.4)",
        card: "0 4px 24px rgba(0,0,0,0.3)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
