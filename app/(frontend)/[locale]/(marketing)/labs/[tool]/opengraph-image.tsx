import { ImageResponse } from "next/og";
import { labsToolByLocalizedSlug, lt } from "@/lib/labs/registry";
import { HRV_TOOL_CONTENT } from "@/lib/labs/hrv/content";
import { SLEEP_EFFICIENCY_TOOL_CONTENT } from "@/lib/labs/sleep-efficiency/content";
import { HEART_RATE_ZONES_TOOL_CONTENT } from "@/lib/labs/heart-rate-zones/content";

export const alt = "FitMesh Labs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Niente `generateImageMetadata`: questa route e' gia' annidata sotto
// `[locale]/[tool]` (static params ereditati dalla pagina). Il precedente
// `generateImageMetadata` enumerava OGNI combinazione locale x tool (bug
// P1.3 trovato in produzione locale: una singola pagina mostrava 4 tag
// `og:image` invece di uno, coprendo anche le pagine di ALTRI tool/locale)
// invece di limitarsi ai parametri della pagina corrente.
/**
 * OG image dedicata per tool Labs (non il fallback generico brand-only):
 * titolo localizzato reale, così il preview su social/chat mostra di cosa
 * si tratta lo strumento invece del solo logo.
 */
export default async function LabsToolOgImage({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}) {
  const { locale, tool } = await params;
  const lc = locale === "it" ? "it" : "en";
  const found = labsToolByLocalizedSlug(tool, lc);
  // P1.1 Fase 10: era hardcoded su HRV_TOOL_CONTENT indipendentemente dal
  // tool richiesto: con un secondo tool live (Sleep Efficiency) mostrava
  // il titolo HRV anche nell'anteprima social dell'altro strumento.
  const title = !found
    ? "FitMesh Labs"
    : found.key === "hrv-rmssd"
      ? lt(HRV_TOOL_CONTENT.heroTitle, lc)
      : found.key === "heart-rate-zones"
        ? lt(HEART_RATE_ZONES_TOOL_CONTENT.heroTitle, lc)
        : lt(SLEEP_EFFICIENCY_TOOL_CONTENT.heroTitle, lc);
  const kicker = "FITMESH LABS";

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
            {kicker}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.15,
              maxWidth: 920,
            }}
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
