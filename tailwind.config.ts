import type { Config } from "tailwindcss";

/**
 * FitMesh Sync — Tailwind theme
 * Tutti i token sono derivati da BRAND.md.
 * Modificare prima il file di documentazione, poi sincronizzare qui.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand palette (logo: green → aqua → blue) ─────────────────────
        brand: {
          green:  "#7CFF5B",   // neon green   — energy, success
          aqua:   "#21E6C1",   // aqua         — primary CTA midpoint
          blue:   "#1DA1FF",   // bright blue  — primary link/icon
          deep:   "#006BFF",   // electric blue — pressed, depth
        },

        // ── Surfaces (dark-first; sito sempre dark) ───────────────────────
        bg: {
          DEFAULT:    "#050816",   // page background
          secondary:  "#0B1023",   // section subtle
          card:       "#12182B",   // card surface
          elevated:   "#1A2238",   // hover / elevated card
        },

        // ── Hairline / dividers ───────────────────────────────────────────
        divider: "#24304A",

        // ── Text scale ────────────────────────────────────────────────────
        text: {
          primary:   "#FFFFFF",
          secondary: "#B7C2D8",
          muted:     "#7F8AA3",
          disabled:  "#556078",
        },

        // ── Semantic states ───────────────────────────────────────────────
        success: "#31E981",
        warning: "#FFB547",
        error:   "#FF5C7A",
        info:    "#38BDF8",
      },

      backgroundImage: {
        // ── Brand gradients (the only sanctioned gradients) ───────────────
        "brand-gradient": "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
        "cta-gradient":   "linear-gradient(90deg, #21E6C1 0%, #1DA1FF 100%)",
        "page-gradient":  "linear-gradient(180deg, #0B1023 0%, #050816 100%)",
      },

      boxShadow: {
        // Soft elevation only — no gaming neon
        card:        "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        "card-hi":   "0 1px 0 rgba(255,255,255,0.06) inset, 0 16px 40px -16px rgba(0,0,0,0.7)",
        cta:         "0 6px 24px -8px rgba(33,230,193,0.35), 0 2px 0 rgba(255,255,255,0.06) inset",
      },

      borderRadius: {
        DEFAULT: "14px",
        card:    "20px",
        pill:    "999px",
      },

      fontFamily: {
        // Inter for body/UI, Space Grotesk for display headings
        sans:    ["var(--font-inter)",   "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["var(--font-grotesk)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },

      fontSize: {
        // Modular scale — type system from BRAND.md
        "display-xl": ["clamp(2rem, 6vw, 4.25rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display":    ["clamp(1.875rem, 4vw, 2.5rem)",  { lineHeight: "1.1",  letterSpacing: "-0.015em" }],
        "metric":     ["clamp(1.75rem, 3.5vw, 2.25rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },

      letterSpacing: {
        tightest: "-0.025em",
      },

      transitionTimingFunction: {
        // iOS-feel default for motion
        "ios": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
