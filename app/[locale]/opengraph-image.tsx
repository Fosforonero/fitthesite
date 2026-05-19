import { ImageResponse } from "next/og";

import { locales } from "@/lib/i18n";

export const runtime = "edge";

export const alt = "FitMesh Sync — Dashboard premium per smartwatch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pre-render entrambe le locale a build time.
export function generateImageMetadata() {
  return locales.map((locale) => ({
    id: locale,
    alt: locale === "it"
      ? "FitMesh Sync — Una dashboard premium per i dati del tuo smartwatch"
      : "FitMesh Sync — A premium dashboard for your smartwatch data",
  }));
}

type Copy = {
  headlineA: string;
  headlineB: string;
  tagline: string[];
};

const COPY: Record<"it" | "en", Copy> = {
  it: {
    headlineA: "Una dashboard premium",
    headlineB: "per il tuo smartwatch.",
    tagline: ["Galaxy Watch · Wear OS", "Privacy-first", "fitmesh.fit"],
  },
  en: {
    headlineA: "A premium dashboard",
    headlineB: "for your smartwatch.",
    tagline: ["Galaxy Watch · Wear OS", "Privacy-first", "fitmesh.fit"],
  },
};

export default async function OG({
  params,
}: {
  params: { locale: string };
}) {
  const lc: "it" | "en" = params.locale === "en" ? "en" : "it";
  const c = COPY[lc];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #0B1023 0%, #050816 100%)",
          padding: "72px 80px",
          color: "#FFFFFF",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Brand gradient glow corners */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -120,
            width: 700,
            height: 700,
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(33,230,193,0.35), rgba(33,230,193,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -250,
            left: -120,
            width: 700,
            height: 700,
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(29,161,255,0.30), rgba(29,161,255,0) 70%)",
          }}
        />

        {/* Logo + wordmark + locale chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#03121f",
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              FM
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
                FitMesh
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#7F8AA3",
                  letterSpacing: 6,
                  marginTop: 6,
                }}
              >
                SYNC
              </span>
            </div>
          </div>
          {/* Locale chip — discreet tag-right per riconoscere l'OG */}
          <div
            style={{
              display: "flex",
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #24304A",
              background: "rgba(11, 16, 35, 0.6)",
              fontSize: 14,
              color: "#7F8AA3",
              letterSpacing: 2,
            }}
          >
            {lc.toUpperCase()}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 980,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>{c.headlineA}</span>
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {c.headlineB}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              color: "#B7C2D8",
              fontSize: 22,
            }}
          >
            {c.tagline.map((part, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <span>{part}</span>
                {i < c.tagline.length - 1 && (
                  <span style={{ color: "#24304A" }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
