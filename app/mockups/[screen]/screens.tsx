/**
 * Mockup screens "lite" — replicano la UI Flutter v37.6 a 1080×1920px.
 *
 * Non sono pixel-perfect dell'app reale: simulano l'estetica per essere
 * presentabili su Play Store + sito senza dover catturare screenshot da
 * device fisico. Dati 100% moccati.
 *
 * Convenzioni:
 * - StatusBar fake top (h=80px): ora + batteria + 5G — uguale per tutti
 * - AppBar FitMesh (h=160px): logo + nome + menu ⋮ (dove applica)
 * - Padding 48px (≈Tailwind p-12) per content
 */

// ── shared: status bar phone ────────────────────────────────────────────

function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-12 text-text-primary"
      style={{ height: "80px", fontSize: "26px", fontWeight: 600 }}
    >
      <span>9:41</span>
      <div className="flex items-center gap-3">
        <span style={{ fontSize: "22px" }}>5G</span>
        <span style={{ fontSize: "22px" }}>•••</span>
        <div
          style={{
            width: "44px",
            height: "22px",
            border: "2px solid currentColor",
            borderRadius: "4px",
            position: "relative",
            padding: "2px",
          }}
        >
          <div
            style={{
              width: "70%",
              height: "100%",
              background: "#31E981",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AppBar({ title = "FitMesh Sync" }: { title?: string }) {
  return (
    <div
      className="flex items-center justify-between px-12 border-b border-divider"
      style={{ height: "160px" }}
    >
      <div className="flex items-center gap-4">
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#03121f",
            fontSize: "36px",
            fontWeight: 800,
          }}
        >
          FM
        </div>
        <span
          className="font-display text-text-primary"
          style={{ fontSize: "44px", fontWeight: 600, letterSpacing: "-0.5px" }}
        >
          {title}
        </span>
      </div>
      <div
        style={{
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "44px",
          color: "#B7C2D8",
        }}
      >
        ⋮
      </div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────

export function DashboardMockup() {
  return (
    <div className="w-full h-full flex flex-col bg-bg text-text-primary">
      <StatusBar />
      <AppBar />
      <div className="flex-1 overflow-hidden px-10 pt-10">
        {/* Hero metric: passi oggi */}
        <div
          className="rounded-card p-10 mb-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,255,91,0.12) 0%, rgba(33,230,193,0.12) 50%, rgba(29,161,255,0.12) 100%)",
            border: "1px solid #24304A",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <span
              className="uppercase font-semibold"
              style={{
                fontSize: "20px",
                letterSpacing: "0.2em",
                color: "#21E6C1",
              }}
            >
              Oggi
            </span>
            <span style={{ fontSize: "22px", color: "#7F8AA3" }}>
              Galaxy Watch 7
            </span>
          </div>
          <div className="flex items-baseline gap-5">
            <span
              className="font-display font-bold"
              style={{ fontSize: "140px", letterSpacing: "-3px", lineHeight: 1 }}
            >
              8.547
            </span>
            <span style={{ fontSize: "36px", color: "#B7C2D8" }}>passi</span>
          </div>
          {/* Sparkline finta */}
          <svg
            viewBox="0 0 600 100"
            preserveAspectRatio="none"
            className="mt-6"
            style={{ width: "100%", height: "100px" }}
          >
            <defs>
              <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#21E6C1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#21E6C1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 L60,75 L120,70 L180,55 L240,60 L300,40 L360,50 L420,35 L480,30 L540,25 L600,20 L600,100 L0,100 Z"
              fill="url(#dash-area)"
            />
            <path
              d="M0,80 L60,75 L120,70 L180,55 L240,60 L300,40 L360,50 L420,35 L480,30 L540,25 L600,20"
              fill="none"
              stroke="#21E6C1"
              strokeWidth="3"
            />
          </svg>
          <div
            className="flex justify-between mt-2"
            style={{ fontSize: "20px", color: "#7F8AA3" }}
          >
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
        </div>

        {/* Grid 2×2 cards */}
        <div className="grid grid-cols-2 gap-6">
          <Card
            label="Battito medio"
            value="72"
            unit="bpm"
            color="#FF5C7A"
            sub="Riposo 58 · Max 142"
          />
          <Card
            label="Sonno"
            value="7h 34m"
            unit=""
            color="#A78BFA"
            sub="23% deep · 78 quality"
          />
          <Card
            label="Calorie attive"
            value="487"
            unit="kcal"
            color="#FFB547"
            sub="Basali 1.360"
          />
          <Card
            label="Distanza"
            value="6,2"
            unit="km"
            color="#38BDF8"
            sub="Passo 12:45 min/km"
          />
        </div>

        {/* Footer info */}
        <div
          className="mt-8 flex items-center gap-3"
          style={{ fontSize: "22px", color: "#7F8AA3" }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#31E981",
              boxShadow: "0 0 8px #31E981",
            }}
          />
          <span>Ultimo sync: 2 min fa · Galaxy Watch 7</span>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  unit,
  color,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-card p-7"
      style={{
        background: "#12182B",
        border: "1px solid #24304A",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 12px ${color}88`,
          }}
        />
        <span
          style={{ fontSize: "22px", color: "#B7C2D8", fontWeight: 500 }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="font-display font-bold text-text-primary"
          style={{ fontSize: "68px", letterSpacing: "-1.5px", lineHeight: 1 }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: "26px", color: "#7F8AA3" }}>{unit}</span>
        )}
      </div>
      <p
        className="mt-3"
        style={{ fontSize: "20px", color: "#7F8AA3" }}
      >
        {sub}
      </p>
    </div>
  );
}

// ── SYNC ─────────────────────────────────────────────────────────────────

export function SyncMockup() {
  return (
    <div className="w-full h-full flex flex-col bg-bg text-text-primary">
      <StatusBar />
      <AppBar />
      <div className="flex-1 overflow-hidden px-10 pt-10">
        {/* Big sync status */}
        <div
          className="rounded-card p-10 mb-8 text-center"
          style={{
            background: "#12182B",
            border: "1px solid #21E6C155",
          }}
        >
          <div
            className="mx-auto mb-6"
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              border: "8px solid #21E6C1",
              borderTopColor: "transparent",
              transform: "rotate(45deg)",
            }}
          />
          <p
            style={{
              fontSize: "32px",
              color: "#21E6C1",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            Sincronizzazione in corso…
          </p>
          <p
            className="mt-3"
            style={{ fontSize: "22px", color: "#7F8AA3" }}
          >
            Lettura Health Connect · Galaxy Watch 7
          </p>
        </div>

        {/* Progress bullet list */}
        <div className="space-y-5">
          {[
            { label: "Passi e distanza", done: true },
            { label: "Frequenza cardiaca", done: true },
            { label: "Sonno con fasi", done: true },
            { label: "Allenamenti", done: false, current: true },
            { label: "Composizione corporea", done: false },
          ].map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-5 rounded-card p-5"
              style={{
                background: step.current ? "#1A2238" : "#12182B",
                border: `1px solid ${step.current ? "#21E6C188" : "#24304A"}`,
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: step.done ? "#31E98122" : "transparent",
                  border: step.done ? "none" : "2px solid #556078",
                  color: step.done ? "#31E981" : "#7F8AA3",
                  fontSize: "26px",
                  fontWeight: 700,
                }}
              >
                {step.done ? "✓" : step.current ? "•" : ""}
              </div>
              <span style={{ fontSize: "26px", color: "#FFFFFF" }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Button area */}
        <div
          className="mt-10 rounded-pill p-6 text-center"
          style={{
            background: "linear-gradient(90deg, #21E6C1 0%, #1DA1FF 100%)",
            color: "#03121f",
            fontSize: "28px",
            fontWeight: 700,
            boxShadow: "0 6px 24px -8px rgba(33,230,193,0.5)",
          }}
        >
          Sincronizza ora
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────────────────────────

export function SettingsMockup() {
  return (
    <div className="w-full h-full flex flex-col bg-bg text-text-primary">
      <StatusBar />
      <AppBar title="Impostazioni" />
      <div className="flex-1 overflow-hidden px-10 pt-10 space-y-8">
        {/* Profilo */}
        <SectionHeading>Profilo</SectionHeading>
        <div
          className="rounded-card p-6 flex items-center gap-5"
          style={{ background: "#12182B", border: "1px solid #24304A" }}
        >
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #21E6C1, #1DA1FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: 700,
              color: "#03121f",
            }}
          >
            M
          </div>
          <div>
            <p style={{ fontSize: "28px", fontWeight: 600 }}>
              matteo@fitmesh.fit
            </p>
            <p style={{ fontSize: "20px", color: "#7F8AA3", marginTop: "4px" }}>
              Account FitMesh Sync
            </p>
          </div>
        </div>

        {/* Sync */}
        <SectionHeading>Sincronizzazione</SectionHeading>
        <Row icon="🔄" title="Sincronizza ora" subtitle="Ultimo: 2 min fa" />
        <Row icon="❤️" title="Apri Health Connect" subtitle="" />
        <RowToggle
          title="Sync automatico in background"
          subtitle="Ogni 30 min, anche con app chiusa"
          on
        />

        {/* Privacy */}
        <SectionHeading>Privacy & dati</SectionHeading>
        <Row icon="📥" title="Esporta i miei dati" subtitle="CSV completo" />
        <Row
          icon="🗑️"
          title="Cancella account"
          subtitle="Elimina tutto"
          danger
        />
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="uppercase font-semibold"
      style={{
        fontSize: "20px",
        letterSpacing: "0.18em",
        color: "#21E6C1",
        marginTop: "16px",
      }}
    >
      {children}
    </p>
  );
}

function Row({
  icon,
  title,
  subtitle,
  danger,
}: {
  icon: string;
  title: string;
  subtitle: string;
  danger?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-5 rounded-card p-5"
      style={{ background: "#12182B", border: "1px solid #24304A" }}
    >
      <span style={{ fontSize: "32px" }}>{icon}</span>
      <div className="flex-1">
        <p
          style={{
            fontSize: "26px",
            fontWeight: 500,
            color: danger ? "#FF5C7A" : "#FFFFFF",
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{ fontSize: "20px", color: "#7F8AA3", marginTop: "2px" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <span style={{ fontSize: "28px", color: "#556078" }}>›</span>
    </div>
  );
}

function RowToggle({
  title,
  subtitle,
  on,
}: {
  title: string;
  subtitle: string;
  on: boolean;
}) {
  return (
    <div
      className="flex items-center gap-5 rounded-card p-5"
      style={{ background: "#12182B", border: "1px solid #24304A" }}
    >
      <div className="flex-1">
        <p style={{ fontSize: "26px", fontWeight: 500 }}>{title}</p>
        <p style={{ fontSize: "20px", color: "#7F8AA3", marginTop: "2px" }}>
          {subtitle}
        </p>
      </div>
      <div
        style={{
          width: "72px",
          height: "40px",
          borderRadius: "20px",
          background: on ? "#21E6C1" : "#24304A",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#FFFFFF",
            position: "absolute",
            top: "4px",
            left: on ? "36px" : "4px",
            transition: "left 0.2s",
          }}
        />
      </div>
    </div>
  );
}

// ── ONBOARDING ───────────────────────────────────────────────────────────

export function OnboardingMockup() {
  return (
    <div className="w-full h-full flex flex-col bg-bg text-text-primary">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-12 text-center">
        <div
          style={{
            width: "240px",
            height: "240px",
            borderRadius: "48px",
            background:
              "linear-gradient(135deg, #7CFF5B 0%, #21E6C1 45%, #1DA1FF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#03121f",
            fontSize: "120px",
            fontWeight: 800,
            letterSpacing: "-4px",
            boxShadow: "0 24px 80px -20px rgba(33,230,193,0.5)",
          }}
        >
          FM
        </div>
        <h1
          className="font-display mt-12"
          style={{
            fontSize: "72px",
            fontWeight: 600,
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}
        >
          FitMesh Sync
        </h1>
        <p
          className="mt-6 max-w-md"
          style={{ fontSize: "30px", color: "#B7C2D8", lineHeight: 1.4 }}
        >
          La dashboard premium per i dati del tuo smartwatch.
        </p>

        <div className="w-full mt-16 space-y-5">
          <div
            className="rounded-pill p-7 text-center"
            style={{
              background: "linear-gradient(90deg, #21E6C1 0%, #1DA1FF 100%)",
              color: "#03121f",
              fontSize: "30px",
              fontWeight: 700,
              boxShadow: "0 8px 28px -10px rgba(33,230,193,0.5)",
            }}
          >
            Crea account
          </div>
          <div
            className="rounded-pill p-7 text-center"
            style={{
              border: "2px solid #24304A",
              fontSize: "30px",
              fontWeight: 500,
              color: "#FFFFFF",
            }}
          >
            Ho già un account
          </div>
        </div>

        <p
          className="mt-10"
          style={{ fontSize: "20px", color: "#7F8AA3" }}
        >
          €3,99 acquisto unico · No abbonamento
        </p>
      </div>
    </div>
  );
}

// ── PAIRING ──────────────────────────────────────────────────────────────

export function PairingMockup() {
  return (
    <div className="w-full h-full flex flex-col bg-bg text-text-primary">
      <StatusBar />
      <div
        className="flex items-center px-12 border-b border-divider"
        style={{ height: "120px" }}
      >
        <span style={{ fontSize: "36px" }}>‹</span>
        <span
          className="ml-6 font-display"
          style={{ fontSize: "36px", fontWeight: 600 }}
        >
          Collega dispositivo
        </span>
      </div>
      <div className="flex-1 px-12 pt-12 flex flex-col items-center">
        <div
          style={{
            fontSize: "120px",
            color: "#21E6C1",
            marginBottom: "32px",
          }}
        >
          ⊞
        </div>
        <h2
          className="font-display text-center"
          style={{ fontSize: "44px", fontWeight: 600, lineHeight: 1.2 }}
        >
          Inserisci il codice 6 cifre
        </h2>
        <p
          className="text-center mt-6 max-w-md"
          style={{ fontSize: "24px", color: "#B7C2D8", lineHeight: 1.4 }}
        >
          Apri fitmesh.fit dal browser, fai login e premi
          <br />
          "Genera codice"
        </p>

        {/* Code input cells */}
        <div
          className="mt-16 flex gap-4"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {["4", "2", "7", "1", "8", "5"].map((digit, i) => (
            <div
              key={i}
              className="rounded-card flex items-center justify-center font-bold"
              style={{
                width: "110px",
                height: "140px",
                background: "#12182B",
                border: i === 5 ? "3px solid #21E6C1" : "2px solid #24304A",
                fontSize: "72px",
                color: "#FFFFFF",
              }}
            >
              {digit}
            </div>
          ))}
        </div>

        <div
          className="mt-16 rounded-pill p-6 text-center w-full max-w-md"
          style={{
            background: "linear-gradient(90deg, #21E6C1 0%, #1DA1FF 100%)",
            color: "#03121f",
            fontSize: "30px",
            fontWeight: 700,
          }}
        >
          Collega
        </div>

        <div
          className="mt-16 rounded-card p-6 w-full max-w-md"
          style={{
            background: "#1A2238",
            border: "1px solid #24304A",
          }}
        >
          <p
            style={{
              fontSize: "20px",
              color: "#21E6C1",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: "8px",
            }}
          >
            ℹ Perché serve un codice?
          </p>
          <p
            style={{ fontSize: "22px", color: "#B7C2D8", lineHeight: 1.4 }}
          >
            Per associare in sicurezza questo telefono al tuo account.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── INTEGRATIONS ─────────────────────────────────────────────────────────

export function IntegrationsMockup() {
  const providers = [
    { name: "Galaxy Watch", brand: "Samsung", color: "#1428A0", initial: "G", status: "Live" },
    { name: "Wear OS", brand: "Google", color: "#4285F4", initial: "W", status: "Live" },
    { name: "Mi Band", brand: "Xiaomi", color: "#FF6900", initial: "X", status: "Live" },
    { name: "Fitbit", brand: "Google", color: "#00B0B9", initial: "F", status: "via HC" },
    { name: "Garmin", brand: "Garmin", color: "#000000", initial: "G", status: "via HC" },
    { name: "Strava", brand: "Strava", color: "#FC4C02", initial: "S", status: "Q3 26" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-bg text-text-primary">
      <StatusBar />
      <div
        className="flex items-center px-12 border-b border-divider"
        style={{ height: "120px" }}
      >
        <span style={{ fontSize: "36px" }}>‹</span>
        <span
          className="ml-6 font-display"
          style={{ fontSize: "36px", fontWeight: 600 }}
        >
          Dispositivi compatibili
        </span>
      </div>
      <div className="flex-1 overflow-hidden px-10 pt-10">
        <p
          className="mb-8"
          style={{ fontSize: "26px", color: "#B7C2D8", lineHeight: 1.4 }}
        >
          Tutti i wearable che scrivono su Health Connect funzionano nativamente.
        </p>

        <div className="grid grid-cols-2 gap-5">
          {providers.map((p) => (
            <div
              key={p.name}
              className="rounded-card p-6"
              style={{ background: "#12182B", border: "1px solid #24304A" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: "32px",
                    fontWeight: 700,
                  }}
                >
                  {p.initial}
                </div>
                <span
                  className="uppercase font-semibold rounded-pill px-3 py-1"
                  style={{
                    fontSize: "16px",
                    letterSpacing: "0.1em",
                    background:
                      p.status === "Live"
                        ? "#31E98122"
                        : p.status === "via HC"
                        ? "#21E6C122"
                        : "#38BDF822",
                    color:
                      p.status === "Live"
                        ? "#31E981"
                        : p.status === "via HC"
                        ? "#21E6C1"
                        : "#38BDF8",
                  }}
                >
                  {p.status}
                </span>
              </div>
              <p
                className="font-display"
                style={{ fontSize: "28px", fontWeight: 600 }}
              >
                {p.name}
              </p>
              <p
                className="mt-1"
                style={{ fontSize: "20px", color: "#7F8AA3" }}
              >
                {p.brand}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
