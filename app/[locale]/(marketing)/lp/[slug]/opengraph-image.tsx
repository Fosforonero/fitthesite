import { ImageResponse } from "next/og";
import { LANDING_PAGES, LANDING_PAGES_BY_SLUG } from "@/lib/landing/data";
import { locales } from "@/lib/i18n";

export const alt = "FitMesh Sync";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Pre-render OG image for every (locale, slug) combination at build time. */
export function generateStaticParams() {
  return LANDING_PAGES.flatMap((p) =>
    locales.map((locale) => ({ locale, slug: p.slug })),
  );
}

export default async function OGLandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const lc = locale === "en" ? "en" : "it";
  const lp = LANDING_PAGES_BY_SLUG[slug];

  if (!lp) {
    return new ImageResponse(<div style={{ background: "#050816" }} />, { ...size });
  }

  const title = lp.hero.title[lc];
  const kicker = lp.hero.kicker[lc];
  const subtitle = lp.hero.subtitle[lc];

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
        {/* Green glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(124,255,91,0.20), rgba(124,255,91,0) 70%)",
          }}
        />
        {/* Blue glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -250,
            left: -120,
            width: 700,
            height: 700,
            borderRadius: "9999px",
            background: "radial-gradient(circle, rgba(29,161,255,0.20), rgba(29,161,255,0) 70%)",
          }}
        />

        {/* Wordmark top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            position: "relative",
          }}
        >
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
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            FitMesh Sync
          </span>
        </div>

        {/* Kicker */}
        <div
          style={{
            marginTop: 52,
            display: "flex",
            position: "relative",
          }}
        >
          <span
            style={{
              padding: "6px 18px",
              borderRadius: 999,
              background: "linear-gradient(135deg, rgba(124,255,91,0.15), rgba(33,230,193,0.15))",
              border: "1px solid rgba(33,230,193,0.35)",
              color: "#21E6C1",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            marginTop: 28,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontSize: title.length > 55 ? 46 : title.length > 35 ? 54 : 62,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.08,
              color: "#FFFFFF",
              maxWidth: 880,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {/* Subtitle (truncated) */}
          <p
            style={{
              marginTop: 20,
              fontSize: 22,
              color: "#B7C2D8",
              lineHeight: 1.4,
              maxWidth: 820,
              margin: "20px 0 0 0",
              // Show only first ~100 chars for space
              display: "block",
            }}
          >
            {subtitle.length > 110 ? subtitle.slice(0, 110) + "…" : subtitle}
          </p>
        </div>

        {/* Footer CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <span style={{ fontSize: 18, color: "#7F8AA3" }}>fitmesh.fit</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 24px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
            }}
          >
            <span style={{ fontSize: 16, color: "#03121f", fontWeight: 700 }}>
              {lc === "it" ? "Prova gratis →" : "Try free →"}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
