import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FitMesh palette — matches the dashboard tokens exactly
        // (--bg, --card, --border, --text, --muted, --accent from dashboard CSS)
        brand: {
          DEFAULT: "#3d8bfd",
          300: "#7eb0fd",
          400: "#5b9efe",
          500: "#3d8bfd",    // --accent (dashboard)
          600: "#2563eb",    // hover / pressed
          700: "#1d4ed8",
        },
        ink: {
          50:  "#e7ecf3",    // --text (primary)
          100: "#d4dde9",
          200: "#b8c4d5",
          300: "#8b9cb3",    // --muted
          400: "#6a7a91",
          500: "#4b5870",
          600: "#3a4659",
          700: "#2d3a4d",    // --border
          800: "#1a2332",    // --card
          900: "#0f1419",    // --bg
          950: "#0a0e14",    // deeper backdrop
        },
        // Semantic accents from dashboard chart series
        success: "#34d399",     // --green
        lavender: "#a78bfa",    // --purple
        danger: "#f87171",
        sky: "#60a5fa",
        warning: "#facc15",
      },
      borderRadius: {
        DEFAULT: "14px",         // --radius from dashboard
      },
      fontFamily: {
        sans: [
          "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont",
          "Segoe UI", "Roboto", "Inter", "Helvetica Neue", "Arial", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
