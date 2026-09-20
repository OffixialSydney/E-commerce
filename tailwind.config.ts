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
          DEFAULT: "#0B1B33",
          light: "#132A4D",
          dark: "#050D1A",
        },
        gold: {
          DEFAULT: "#C9A24B",
          light: "#E0C77A",
          dark: "#A9853A",
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
        card: "0 4px 24px -4px rgba(11, 27, 51, 0.08)",
        "card-hover": "0 8px 32px -4px rgba(11, 27, 51, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
