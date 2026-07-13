import { ImageResponse } from "next/og";

/**
 * Componente OG fallback condiviso. Re-esportato (non copiato) da un
 * opengraph-image.tsx in ogni cartella marketing la cui pagina definisce un
 * proprio oggetto `openGraph` in generateMetadata: Next.js sostituisce
 * `target.openGraph` in modo stateless ad ogni segmento che dichiara un
 * proprio `openGraph` (anche senza `images`), quindi un file colocato solo
 * in `[locale]/opengraph-image.tsx` non sopravvive fino a quelle pagine —
 * verificato empiricamente e in next/dist/lib/metadata/resolve-metadata.js.
 * Il file deve vivere ESATTAMENTE nella cartella della pagina per essere
 * re-iniettato da Next dopo il reset. Vedi docs/seo/seo-results-log.md.
 *
 * Nessun testo in una lingua specifica: la composizione comunica solo
 * tramite icone/brand, valida per tutte le locale senza traduzione.
 */
export const alt = "FitMesh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function renderFallbackOgImage() {
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
              "radial-gradient(circle, rgba(33,230,193,0.30), rgba(33,230,193,0) 70%)",
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
              "radial-gradient(circle, rgba(29,161,255,0.25), rgba(29,161,255,0) 70%)",
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

        {/* Icon-only composition: wearable -> FitMesh -> dashboard. */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 56,
            position: "relative",
          }}
        >
          {/* Watch glyph */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 40,
              border: "3px solid rgba(183,194,216,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "9999px",
                border: "3px solid #B7C2D8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 3, height: 22, background: "#7CFF5B", borderRadius: 2, marginBottom: 20 }} />
            </div>
          </div>

          <span style={{ fontSize: 48, color: "rgba(183,194,216,0.5)" }}>&#8594;</span>

          {/* Center brand node */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#03121f",
              fontSize: 56,
              fontWeight: 800,
            }}
          >
            FM
          </div>

          <span style={{ fontSize: 48, color: "rgba(183,194,216,0.5)" }}>&#8594;</span>

          {/* Dashboard glyph */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 28,
              border: "3px solid rgba(183,194,216,0.35)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 10,
              padding: "0 0 24px 0",
            }}
          >
            <div style={{ width: 16, height: 36, background: "#1DA1FF", borderRadius: 4 }} />
            <div style={{ width: 16, height: 60, background: "#21E6C1", borderRadius: 4 }} />
            <div style={{ width: 16, height: 44, background: "#7CFF5B", borderRadius: 4 }} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <span style={{ fontSize: 22, color: "#B7C2D8", letterSpacing: 1 }}>fitmesh.fit</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
