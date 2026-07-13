import { ImageResponse } from "next/og";
import type { Locale } from "@/lib/i18n";

// Stessa scelta di sync/[provider]/opengraph-image.tsx: niente edge runtime
// perché generateStaticParams + edge sono incompatibili in Next 15.
const FDS_LOCALES: readonly Locale[] = ["it", "en", "de", "es"];

export const alt = "FitMesh Sync — Fitness data sync";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Headline riusata testualmente (minus il suffisso brand) da META_TITLE in
// page.tsx: nessuna nuova claim commerciale introdotta da questa immagine,
// solo il titolo già verificato e già live sulla pagina stessa.
const HEADLINE: Record<"it" | "en" | "de" | "es", string> = {
  it: "Sincronizza i dati fitness tra app e wearable",
  en: "Sync fitness data across apps and wearables",
  es: "Sincroniza datos de fitness entre apps y wearables",
  de: "Fitnessdaten zwischen Apps und Wearables synchronisieren",
};

export function generateStaticParams() {
  return FDS_LOCALES.map((locale) => ({ locale }));
}

export default async function OGFitnessDataSync({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: "it" | "en" | "de" | "es" = (
    FDS_LOCALES as readonly string[]
  ).includes(locale)
    ? (locale as "it" | "en" | "de" | "es")
    : "en";
  const headline = HEADLINE[lc];

  const sources = [
    { label: "GW", color: "#7CFF5B" },
    { label: "HC", color: "#38BDF8" },
    { label: "AH", color: "#F5A623" },
    { label: "WR", color: "#B586F7" },
  ];

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
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -120,
            width: 700,
            height: 700,
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(33,230,193,0.25), rgba(33,230,193,0) 70%)",
          }}
        />

        {/* Wordmark top */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#03121f",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            FM
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>FitMesh Sync</span>
        </div>

        {/* Multiple sources -> single aggregation point */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 24,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
            {sources.map((s) => (
              <div
                key={s.label}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "9999px",
                  background: `${s.color}22`,
                  border: `2px solid ${s.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: s.color,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {s.label}
              </div>
            ))}
          </div>

          <span style={{ fontSize: 32, color: "rgba(183,194,216,0.5)" }}>&#8594;</span>

          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#03121f",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            FM
          </div>

          <span style={{ fontSize: 32, color: "rgba(183,194,216,0.5)" }}>&#8594;</span>

          {/* Single unified dashboard view */}
          <div
            style={{
              width: 160,
              height: 100,
              borderRadius: 16,
              border: "3px solid rgba(183,194,216,0.35)",
              display: "flex",
              flexDirection: "column",
              padding: 14,
              gap: 8,
            }}
          >
            <div style={{ width: "60%", height: 8, borderRadius: 4, background: "rgba(183,194,216,0.4)" }} />
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6 }}>
              <div style={{ width: 11, height: "50%", background: "#1DA1FF", borderRadius: 3 }} />
              <div style={{ width: 11, height: "80%", background: "#21E6C1", borderRadius: 3 }} />
              <div style={{ width: 11, height: "65%", background: "#7CFF5B", borderRadius: 3 }} />
              <div style={{ width: 11, height: "40%", background: "#B586F7", borderRadius: 3 }} />
            </div>
          </div>
        </div>

        {/* Localized headline (verbatim from the live page title) */}
        <div
          style={{
            marginTop: 44,
            display: "flex",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontSize: headline.length > 55 ? 42 : 48,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.15,
              maxWidth: 980,
              margin: 0,
            }}
          >
            {headline}
          </h1>
        </div>

        <div style={{ display: "flex", marginTop: 20, position: "relative" }}>
          <span style={{ fontSize: 20, color: "#B7C2D8" }}>fitmesh.fit</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
