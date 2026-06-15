import { ImageResponse } from "next/og";
import { PROVIDERS, PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { locales } from "@/lib/i18n";

// Static pre-render: una OG image per ogni (locale, provider). Niente edge
// runtime perché generateStaticParams + edge sono incompatibili in Next 15.
export const alt = "FitMesh Sync — Provider integration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Pre-render OG static al build per ogni combinazione (locale, provider).
 * Necessario per next/og: senza generateStaticParams Next genera on-demand.
 */
export function generateStaticParams() {
  return PROVIDERS.flatMap((p) =>
    locales.map((locale) => ({ locale, provider: p.slug })),
  );
}

export default async function OGProvider({
  params,
}: {
  params: Promise<{ locale: string; provider: string }>;
}) {
  const { locale, provider } = await params;
  const p = PROVIDERS_BY_SLUG[provider];
  const lc = locale === "en" ? "en" : "it";

  // Fallback se slug invalido (next può comunque chiamarci)
  if (!p) {
    return new ImageResponse(<div style={{ background: "#050816" }} />, { ...size });
  }

  const headline =
    lc === "it" ? `Sincronizza ${p.name}` : `Sync ${p.name}`;
  const sub =
    lc === "it"
      ? "alla tua dashboard salute personale"
      : "to your personal health dashboard";

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
        {/* Provider glow corner */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -120,
            width: 700,
            height: 700,
            borderRadius: "9999px",
            background: `radial-gradient(circle, ${p.brandColor}55, ${p.brandColor}00 70%)`,
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
              background:
                "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
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

        {/* Provider monogram center-left */}
        <div
          style={{
            marginTop: 60,
            display: "flex",
            alignItems: "center",
            gap: 40,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: "9999px",
              background: `linear-gradient(135deg, ${p.brandColor}, ${p.brandColor}cc)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 96,
              fontWeight: 800,
            }}
          >
            {p.initial}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5 }}>
              {p.name}
            </span>
            <span style={{ fontSize: 22, color: "#7F8AA3" }}>{p.vendor}</span>
          </div>
        </div>

        {/* Headline bottom */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              gap: 14,
            }}
          >
            <span>{headline}</span>
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {sub}
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#B7C2D8" }}>
            fitmesh.fit
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
