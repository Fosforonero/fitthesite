import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff8ff",
          100: "#dbedfe",
          200: "#bedffe",
          300: "#92ccfd",
          400: "#5db0fa",
          500: "#3892f6",
          600: "#2273eb",
          700: "#1a5dd8",
          800: "#1c4daf",
          900: "#1d428a",
        },
        ink: {
          50:  "#f5f7fa",
          100: "#e4e7ec",
          200: "#cbd2dc",
          300: "#a3aebd",
          400: "#73829a",
          500: "#52617c",
          600: "#404d65",
          700: "#374254",
          800: "#1f2733",
          900: "#11161f",
          950: "#080b12",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
