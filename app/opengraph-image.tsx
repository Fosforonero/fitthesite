import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "FitMesh Sync — Una dashboard premium per i dati del tuo smartwatch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
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
        {/* Brand gradient glow corner */}
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

        {/* Logo + wordmark */}
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1,
            }}
          >
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
            }}
          >
            Una dashboard premium
            <br />
            per il tuo{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              smartwatch.
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
            <span>Galaxy Watch · Wear OS</span>
            <span style={{ color: "#24304A" }}>·</span>
            <span>Privacy-first</span>
            <span style={{ color: "#24304A" }}>·</span>
            <span>fitmesh.fit</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
