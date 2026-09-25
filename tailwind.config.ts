import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A0A0A",
          light: "#1C1C1C",
          dark: "#000000",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8CD7A",
          dark: "#A6821E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(0, 0, 0, 0.10)",
        "card-hover": "0 8px 32px -4px rgba(0, 0, 0, 0.20)",
      },
    },
  },
  plugins: [],
};

export default config;
