/**
 * HeroVisual — two-phone hero mockup, pixel-perfect CSS replica of the
 * redesigned FitMesh Sync app (v3.4+). Pure HTML/SVG, no rasterized assets.
 *
 * Front phone: Dashboard — ReadinessHero (ring + pill + mini-tiles) + GoalsCard
 * Back phone:  History — 24-bar intraday HR chart (zone-colored)
 */

type Strings = {
  dateLabel: string;
  greeting: string;
  statusLabel: string;
  insight: string;
  steps: string;
  activeCal: string;
  sleep: string;
  resting: string;
  history: string;
  hrLabel: string;
  hourly: string;
};

const ITStrings: Strings = {
  dateLabel: "MER, 4 GIU",
  greeting: "Buongiorno",
  statusLabel: "Ottima forma",
  insight: "HRV in salita — recupero ottimo oggi.",
  steps: "Passi",
  activeCal: "Cal. attive",
  sleep: "Sonno",
  resting: "Riposo",
  history: "Storico",
  hrLabel: "Battito",
  hourly: "Orario",
};

const ENStrings: Strings = {
  dateLabel: "WED, 4 JUN",
  greeting: "Good morning",
  statusLabel: "Great shape",
  insight: "HRV trending up — solid recovery today.",
  steps: "Steps",
  activeCal: "Active cal.",
  sleep: "Sleep",
  resting: "Resting",
  history: "History",
  hrLabel: "Heart rate",
  hourly: "Hourly",
};

export default function HeroVisual({ locale = "en" }: { locale?: "it" | "en" }) {
  const t = locale === "it" ? ITStrings : ENStrings;

  return (
    <div className="relative w-full max-w-[460px] mx-auto lg:mx-0 h-[520px] sm:h-[640px] lg:h-[720px]">
      {/* Brand gradient glow */}
      <div
        aria-hidden
        className="absolute -inset-16 -z-10 blur-[80px] opacity-50"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, #21E6C1 0%, transparent 60%), radial-gradient(60% 60% at 30% 80%, #1DA1FF 0%, transparent 65%)",
        }}
      />

      {/* ── Phone B (background, History screen) ── */}
      <div
        className="absolute hidden sm:block top-[60px] -right-[40px] lg:right-[-30px] w-[240px] aspect-[9/19] rotate-[6deg] origin-bottom-left z-0 opacity-90"
        aria-hidden
      >
        <PhoneFrame>
          <HistoryScreen t={t} />
        </PhoneFrame>
      </div>

      {/* ── Phone A (front, Dashboard) ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[240px] sm:w-[310px] aspect-[9/19] z-10">
        <PhoneFrame primary>
          <DashboardScreen t={t} />
        </PhoneFrame>
      </div>

      {/* Soundwave floating decoration */}
      <div
        aria-hidden
        className="absolute -right-2 top-[44%] hidden sm:flex gap-1 items-center opacity-90 z-20"
      >
        {[12, 22, 16, 28, 14].map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{
              height: h,
              background:
                i % 2 === 0
                  ? "linear-gradient(180deg, #7CFF5B, #21E6C1)"
                  : "linear-gradient(180deg, #21E6C1, #1DA1FF)",
              animation: `fm-pulse 1.6s ${i * 0.15}s ease-in-out infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes fm-pulse {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.6); }
          }
          @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
        `}</style>
      </div>
    </div>
  );
}

/* ───────── Phone shell ───────── */

function PhoneFrame({
  children,
  primary = false,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <div
      className={`relative w-full h-full rounded-[44px] p-[3px] bg-gradient-to-b from-white/25 to-white/5 ${
        primary
          ? "shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]"
          : "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.75)]"
      }`}
    >
      <div className="absolute inset-[3px] rounded-[42px] bg-[#04070f] overflow-hidden">
        {/* Dynamic island */}
        <div
          aria-hidden
          className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[88px] h-[24px] rounded-full bg-black z-20"
        />
        {/* Status bar */}
        <div className="absolute top-0 inset-x-0 px-5 pt-[10px] flex items-center justify-between z-30 text-[10px] text-text-primary font-medium">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 18 12" className="w-[14px] h-[10px]" fill="currentColor" aria-hidden>
              <rect x="0"  y="8" width="3" height="4" rx="0.5" />
              <rect x="5"  y="5" width="3" height="7" rx="0.5" />
              <rect x="10" y="2" width="3" height="10" rx="0.5" />
              <rect x="15" y="0" width="3" height="12" rx="0.5" opacity=".4" />
            </svg>
            <svg viewBox="0 0 24 12" className="w-[18px] h-[9px]" fill="currentColor" aria-hidden>
              <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" fill="none" stroke="currentColor" opacity=".5" />
              <rect x="2"   y="2"   width="13" height="8"  rx="1.5" />
              <rect x="22"  y="4"   width="2"  height="4"  rx="0.8" opacity=".5" />
            </svg>
          </div>
        </div>
        {children}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-white/30" />
      </div>
    </div>
  );
}

/* ───────── Dashboard screen (front phone) ───────── */

function DashboardScreen({ t }: { t: Strings }) {
  // Ring: circumference = 2π×30 ≈ 188.5. readiness=78 → offset = 188.5×0.22 ≈ 41
  const circumference = 188.5;
  const readiness = 78;
  const dashOffset = circumference * (1 - readiness / 100);

  return (
    <div className="absolute inset-0 pt-[44px] pb-3 px-3.5 flex flex-col gap-2 overflow-hidden">
      {/* Header: date + greeting + bell + avatar */}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1">
          <div
            className="text-[8px] font-medium tracking-[0.5px] uppercase"
            style={{ color: "#8E97A8" }}
          >
            {t.dateLabel}
          </div>
          <div className="font-display text-[13px] font-semibold tracking-tight text-text-primary leading-tight mt-[1px]">
            {t.greeting}
          </div>
        </div>
        {/* Bell + badge */}
        <div className="relative mr-1">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8E97A8"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            className="absolute -top-[2px] -right-[2px] w-[6px] h-[6px] rounded-full"
            style={{ background: "#FF5C7A", border: "1.5px solid #04070f" }}
          />
        </div>
        {/* Avatar */}
        <div
          className="w-[24px] h-[24px] rounded-full flex items-center justify-center"
          style={{
            background: "rgba(33,230,193,0.15)",
            border: "1.5px solid rgba(33,230,193,0.4)",
          }}
        >
          <span className="text-[10px] font-bold" style={{ color: "#21E6C1" }}>
            M
          </span>
        </div>
      </div>

      {/* ── Readiness Hero ── */}
      <div
        className="rounded-[14px] p-2.5"
        style={{
          background: "linear-gradient(160deg, #16203a, #0f1730)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Animated ring */}
          <div className="relative w-[68px] h-[68px] flex-shrink-0">
            <svg
              viewBox="0 0 72 72"
              className="w-full h-full"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Track */}
              <circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              {/* Progress — aqua glow */}
              <circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke="#21E6C1"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ filter: "drop-shadow(0 0 4px rgba(33,230,193,0.6))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-display font-bold leading-none"
                style={{ fontSize: 20, color: "#fff", letterSpacing: -1 }}
              >
                {readiness}
              </span>
              <span
                className="font-semibold tracking-wider"
                style={{ fontSize: 6, color: "#8E97A8", marginTop: 1 }}
              >
                READINESS
              </span>
            </div>
          </div>

          {/* Status + insight */}
          <div className="flex-1 min-w-0">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[8px] font-bold"
              style={{ background: "rgba(124,255,91,0.13)", color: "#7CFF5B" }}
            >
              <span
                className="w-[5px] h-[5px] rounded-full"
                style={{ background: "#7CFF5B" }}
              />
              {t.statusLabel}
            </span>
            <p
              className="mt-1 leading-[1.4]"
              style={{ fontSize: 8, color: "#B8C0D4" }}
            >
              {t.insight}
            </p>
          </div>
        </div>

        {/* 3 mini-tiles */}
        <div className="flex gap-1.5 mt-2">
          {[
            { label: "HRV", value: "64 ms" },
            { label: t.sleep, value: "7h 12m" },
            { label: t.resting, value: "58 bpm" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex-1 rounded-[8px] px-1.5 py-1.5"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div
                className="font-semibold"
                style={{ fontSize: 7, color: "#8E97A8" }}
              >
                {label}
              </div>
              <div
                className="font-bold text-white mt-[2px]"
                style={{ fontSize: 9 }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Goals card ── */}
      <div
        className="rounded-[12px] px-2.5 py-2 flex flex-col gap-2.5"
        style={{ background: "rgba(26,34,56,0.90)" }}
      >
        {[
          { label: t.steps,     value: "8,524",  goal: "10k",  pct: 85,  color: "#21E6C1" },
          { label: t.activeCal, value: "480",     goal: "520 kcal", pct: 92, color: "#FF5C7A" },
        ].map(({ label, value, goal, pct, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 8, color: "#8E97A8" }}>{label}</span>
              <span style={{ fontSize: 8, color: "#fff", fontWeight: 600 }}>
                {value}
                <span style={{ color: "#8E97A8", fontWeight: 400 }}> / {goal}</span>
              </span>
            </div>
            <div
              className="rounded-full overflow-hidden"
              style={{ height: 6, background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: color,
                  boxShadow: `0 0 8px ${color}66`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── History screen (back phone) ───────── */

function HistoryScreen({ t }: { t: Strings }) {
  const colors = [
    "#A78BFA", "#A78BFA", "#A78BFA", "#A78BFA", "#A78BFA", "#A78BFA",
    "#1DA1FF", "#1DA1FF", "#21E6C1", "#7CFF5B", "#7CFF5B", "#21E6C1",
    "#1DA1FF", "#21E6C1", "#FF5C7A", "#21E6C1", "#1DA1FF", "#21E6C1",
    "#21E6C1", "#1DA1FF", "#1DA1FF", "#1DA1FF", "#A78BFA", "#A78BFA",
  ];
  const heights = [
    18, 16, 17, 15, 18, 20,
    35, 38, 55, 80, 75, 60,
    45, 58, 92, 55, 42, 50,
    52, 38, 32, 28, 22, 20,
  ];

  return (
    <div className="absolute inset-0 pt-[44px] pb-3 px-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">
          {t.history}
        </span>
        <span className="text-[9px] text-text-muted">7d</span>
      </div>

      <div className="rounded-[10px] bg-[#12182B] border border-[#24304A] p-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-wider text-text-muted font-semibold">
            {t.hrLabel} · {t.hourly}
          </span>
          <span className="text-[8px] text-text-secondary font-medium">72 bpm</span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-[1px] flex-1 relative">
          <div
            aria-hidden
            className="absolute left-0 right-0 border-t border-dashed"
            style={{ borderColor: "rgba(29,161,255,0.5)", bottom: "35%" }}
          />
          {colors.map((c, i) => (
            <span
              key={i}
              className="flex-1 rounded-[1px]"
              style={{ height: `${heights[i]}%`, background: c, minWidth: "2px" }}
            />
          ))}
        </div>

        <div className="mt-1 flex justify-between text-[7px] text-text-muted">
          <span>0</span><span>6</span><span>12</span><span>18</span><span>24</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1 text-[7px] text-text-muted">
          {[
            { l: "Sleep",   c: "#A78BFA" },
            { l: "Rest",    c: "#1DA1FF" },
            { l: "Active",  c: "#21E6C1" },
            { l: "Workout", c: "#7CFF5B" },
          ].map((it) => (
            <span key={it.l} className="inline-flex items-center gap-[3px]">
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: it.c }} />
              {it.l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
