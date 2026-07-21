import { ImageResponse } from "next/og";
import { lt } from "@/lib/labs/registry";
import { LABS_INDEX_CONTENT } from "@/lib/labs/index-content";

export const alt = "FitMesh Labs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Niente `generateImageMetadata`: non serve una variante per locale, questa
// route e' gia' annidata sotto `[locale]` (static params ereditati dalla
// pagina). Un `generateImageMetadata` che enumera OGNI locale (bug P1.3
// trovato in produzione locale) fa comparire piu' tag `og:image` sulla
// stessa pagina invece di uno solo, e l'URL costruito a mano altrove nel
// codice per il meta tag non puo' comunque replicare l'hash/id che questa
// API richiede - la sola pagina con parametro `locale` reale gia' basta.
export default async function LabsIndexOgImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = locale === "it" ? "it" : "en";
  const title = lt(LABS_INDEX_CONTENT.heroTitle, lc);

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
            background: "radial-gradient(circle, rgba(33,230,193,0.30), rgba(33,230,193,0) 70%)",
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
            background: "radial-gradient(circle, rgba(29,161,255,0.25), rgba(29,161,255,0) 70%)",
          }}
        />

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
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            FM
          </div>
          <span style={{ fontSize: 15, color: "#21E6C1", letterSpacing: 5, fontWeight: 700 }}>
            FITMESH LABS
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative" }}>
          <span
            style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.15, maxWidth: 920 }}
          >
            {title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
          <span style={{ fontSize: 20, color: "#B7C2D8", letterSpacing: 1 }}>
            fitmesh.fit/labs
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
