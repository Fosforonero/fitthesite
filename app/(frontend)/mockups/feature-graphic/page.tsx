import type { Metadata } from "next";

/**
 * Feature graphic Play Store — 1024×500 px obbligatorio.
 *
 * Posizione: top della scheda app sul Play Store (hero banner).
 * Spec: no text vital (Google scala su devices diversi), brand-forward,
 * mostra il monogramma + tagline + 2 mockup phone laterali.
 *
 * Sprint P0.6B: stesso trattamento noindex di app/(frontend)/mockups/[screen] —
 * strumento interno per Playwright, non pensato per essere indicizzato.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Mockup: strumento interno",
  robots: { index: false, follow: false },
};

export default function FeatureGraphic() {
  return (
    <main
      id="mockup-root"
      style={{
        width: "1024px",
        height: "500px",
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(135deg, #050816 0%, #0B1023 60%, #050816 100%)",
        color: "#FFFFFF",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Glow corners */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-50px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(33,230,193,0.25), transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(29,161,255,0.2), transparent 70%)",
        }}
      />

      {/* Left side: logo + tagline */}
      <div
        style={{
          flex: 1,
          padding: "60px 50px 60px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#03121f",
              fontSize: "44px",
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
          >
            FM
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px" }}>
              FitMesh
            </span>
            <span
              style={{
                fontSize: "16px",
                color: "#21E6C1",
                letterSpacing: "0.32em",
                marginTop: "8px",
                fontWeight: 500,
              }}
            >
              SYNC
            </span>
          </div>
        </div>
        <h1
          style={{
            marginTop: "44px",
            fontSize: "44px",
            fontWeight: 700,
            letterSpacing: "-1px",
            lineHeight: 1.1,
          }}
        >
          La dashboard premium
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
        </h1>
        <p
          style={{
            marginTop: "24px",
            fontSize: "20px",
            color: "#B7C2D8",
            lineHeight: 1.4,
          }}
        >
          Galaxy Watch · Wear OS · Privacy-first
        </p>
      </div>

      {/* Right side: 2 phone mockup stilizzati */}
      <div
        style={{
          width: "420px",
          height: "500px",
          position: "relative",
          marginRight: "20px",
        }}
      >
        {/* Phone 2 (back, rotated) */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "20px",
            width: "180px",
            height: "380px",
            borderRadius: "32px",
            background: "linear-gradient(180deg, #1A2238, #0B1023)",
            border: "4px solid #24304A",
            transform: "rotate(8deg)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "70px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(124,255,91,0.2), rgba(33,230,193,0.2))",
              border: "1px solid #24304A",
              padding: "10px",
              fontSize: "10px",
              color: "#B7C2D8",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "28px", color: "#FFFFFF" }}>
              8.547
            </div>
            <div>passi</div>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: "12px",
              background: "#12182B",
              border: "1px solid #24304A",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ height: "8px", background: "#21E6C1", borderRadius: "4px", width: "70%" }} />
            <div style={{ height: "8px", background: "#1DA1FF", borderRadius: "4px", width: "50%" }} />
            <div style={{ height: "8px", background: "#A78BFA", borderRadius: "4px", width: "85%" }} />
            <div style={{ height: "8px", background: "#FFB547", borderRadius: "4px", width: "60%" }} />
          </div>
        </div>

        {/* Phone 1 (front) */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "60px",
            width: "200px",
            height: "420px",
            borderRadius: "36px",
            background: "linear-gradient(180deg, #1A2238, #050816)",
            border: "5px solid #24304A",
            transform: "rotate(-5deg)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)",
          }}
        >
          {/* Notch */}
          <div
            style={{
              alignSelf: "center",
              width: "60px",
              height: "8px",
              borderRadius: "4px",
              background: "#050816",
            }}
          />
          {/* Mock dashboard hero */}
          <div
            style={{
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(124,255,91,0.15), rgba(33,230,193,0.15), rgba(29,161,255,0.15))",
              padding: "16px",
              border: "1px solid #24304A",
            }}
          >
            <div style={{ fontSize: "11px", color: "#21E6C1", letterSpacing: "0.2em", fontWeight: 700 }}>
              OGGI
            </div>
            <div
              style={{
                fontSize: "44px",
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1,
                marginTop: "6px",
                letterSpacing: "-1px",
              }}
            >
              8.547
            </div>
            <div style={{ fontSize: "11px", color: "#B7C2D8", marginTop: "4px" }}>
              passi
            </div>
            {/* Mini chart */}
            <svg viewBox="0 0 100 30" style={{ width: "100%", height: "24px", marginTop: "10px" }}>
              <path
                d="M0,25 L20,22 L40,15 L60,18 L80,8 L100,5"
                fill="none"
                stroke="#21E6C1"
                strokeWidth="2"
              />
            </svg>
          </div>
          {/* 2 mini cards */}
          <div style={{ display: "flex", gap: "8px" }}>
            <MiniCard color="#FF5C7A" label="BPM" value="72" />
            <MiniCard color="#A78BFA" label="Sonno" value="7h34" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <MiniCard color="#FFB547" label="Cal" value="487" />
            <MiniCard color="#38BDF8" label="Km" value="6,2" />
          </div>
        </div>
      </div>
    </main>
  );
}

function MiniCard({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: "10px",
        background: "#12182B",
        border: "1px solid #24304A",
        padding: "10px",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}66`,
        }}
      />
      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#FFFFFF",
          marginTop: "8px",
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "10px", color: "#7F8AA3" }}>{label}</div>
    </div>
  );
}
