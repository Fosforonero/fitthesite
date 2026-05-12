/**
 * HeroVisual — two-phone hero mockup, pixel-perfect CSS replica of the actual
 * FitMesh Sync Android app. Pure HTML/SVG, no rasterized assets.
 *
 * Layout:
 *  - Front phone: Dashboard fragment (KPI grid, sleep card, weekly chart)
 *  - Back phone:  Storico screen (WebView dashboard with hourly BPM bars)
 *                 — partially visible behind the front one, gives depth.
 *
 * Visual quality goal: looks like a real screenshot, not a wireframe.
 */

type Strings = {
  status: string;
  steps: string;
  bpm: string;
  calories: string;
  sleep: string;
  today: string;
  sleepLabel: string;
  good: string;
  weekly: string;
  lastSync: string;
  hourly: string;
  history: string;
};

const ITStrings: Strings = {
  status: "Sincronizzato",
  steps: "Passi",
  bpm: "Battito",
  calories: "Calorie",
  sleep: "Sonno",
  today: "oggi",
  sleepLabel: "questa notte",
  good: "Buono",
  weekly: "Settimanale",
  lastSync: "5m fa",
  hourly: "Orario",
  history: "Storico",
};

const ENStrings: Strings = {
  status: "Synced",
  steps: "Steps",
  bpm: "Heart rate",
  calories: "Calories",
  sleep: "Sleep",
  today: "today",
  sleepLabel: "last night",
  good: "Good",
  weekly: "Weekly",
  lastSync: "5m ago",
  hourly: "Hourly",
  history: "History",
};

export default function HeroVisual({ locale = "it" }: { locale?: "it" | "en" }) {
  const t = locale === "en" ? ENStrings : ITStrings;

  return (
    <div className="relative w-full max-w-[460px] mx-auto lg:mx-0 h-[640px] lg:h-[720px]">
      {/* Brand gradient glow */}
      <div
        aria-hidden
        className="absolute -inset-16 -z-10 blur-[80px] opacity-50"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, #21E6C1 0%, transparent 60%), radial-gradient(60% 60% at 30% 80%, #1DA1FF 0%, transparent 65%)",
        }}
      />

      {/* ── Phone B (background, History screen with hourly BPM chart) ── */}
      <div
        className="absolute hidden sm:block top-[60px] -right-[40px] lg:right-[-30px] w-[240px] aspect-[9/19] rotate-[6deg] origin-bottom-left z-0 opacity-90"
        aria-hidden
      >
        <PhoneFrame>
          <HistoryScreen t={t} />
        </PhoneFrame>
      </div>

      {/* ── Phone A (front, Dashboard) ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[290px] sm:w-[310px] aspect-[9/19] z-10">
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

/* ───────── Subcomponents ───────── */

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
        primary ? "shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]" : "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.75)]"
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
            {/* Signal */}
            <svg viewBox="0 0 18 12" className="w-[14px] h-[10px]" fill="currentColor" aria-hidden>
              <rect x="0"  y="8" width="3" height="4" rx="0.5" />
              <rect x="5"  y="5" width="3" height="7" rx="0.5" />
              <rect x="10" y="2" width="3" height="10" rx="0.5" />
              <rect x="15" y="0" width="3" height="12" rx="0.5" opacity=".4" />
            </svg>
            {/* Battery */}
            <svg viewBox="0 0 24 12" className="w-[18px] h-[9px]" fill="currentColor" aria-hidden>
              <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" fill="none" stroke="currentColor" opacity=".5" />
              <rect x="2"   y="2"   width="13" height="8"  rx="1.5" />
              <rect x="22"  y="4"   width="2"  height="4"  rx="0.8" opacity=".5" />
            </svg>
          </div>
        </div>
        {children}
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-white/30" />
      </div>
    </div>
  );
}

function DashboardScreen({ t }: { t: Strings }) {
  return (
    <div className="absolute inset-0 pt-[44px] pb-3 px-3.5 flex flex-col gap-2.5">
      {/* Header: device + sync + history button */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-[15px] font-semibold tracking-tight text-text-primary leading-tight">
            Galaxy Watch
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            {t.status} · {t.lastSync}
          </div>
        </div>
        <span className="text-[9px] font-medium px-2 py-1 rounded-pill border border-divider text-text-secondary">
          {t.history}
        </span>
      </div>

      {/* OGGI label + live pill */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.today}
        </span>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-pill text-[8px] font-bold uppercase tracking-wider"
          style={{ background: "rgba(49, 233, 129, 0.15)", color: "#31E981" }}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: "#31E981", boxShadow: "0 0 6px #31E981" }} />
          Live
        </span>
      </div>

      {/* KPI grid 2x2 */}
      <div className="grid grid-cols-2 gap-1.5">
        <KpiTile label={t.steps}    value="8.524"    color="#1DA1FF" hint={t.today} />
        <KpiTile label={t.bpm}      value="72"        unit="bpm"    color="#FF5C7A" hint="60-105" />
        <KpiTile label={t.calories} value="480"       unit="kcal"   color="#FFB547" hint={t.today} />
        <KpiTile label={t.sleep}    value="7h13"      color="#21E6C1" hint={t.good} hintColor="#21E6C1" />
      </div>

      {/* Sleep mini-card with stages bar */}
      <div className="rounded-[12px] bg-[#12182B] border border-[#24304A] p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.16em] text-text-muted font-semibold">
            {t.sleep}
          </span>
          <span
            className="text-[8px] font-bold px-1.5 py-[1px] rounded-pill"
            style={{ background: "rgba(167,139,250,0.18)", color: "#A78BFA" }}
          >
            {t.good}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-[16px] font-semibold text-text-primary tracking-tightest leading-none">
            7h 13m
          </span>
          <span className="text-[9px] text-text-muted">·</span>
          <span className="text-[9px] text-text-muted">{t.sleepLabel}</span>
        </div>
        <div className="mt-1.5 flex h-[5px] rounded-full overflow-hidden">
          <span className="flex-[18]" style={{ background: "#1DA1FF" }} />
          <span className="flex-[22]" style={{ background: "#A78BFA" }} />
          <span className="flex-[55]" style={{ background: "#60A5FA" }} />
          <span className="flex-[5]"  style={{ background: "#FF5C7A" }} />
        </div>
      </div>

      {/* Weekly mini chart */}
      <div className="rounded-[12px] bg-[#12182B] border border-[#24304A] p-2.5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.16em] text-text-muted font-semibold">
            {t.weekly}
          </span>
          <span className="text-[9px] text-success font-bold">+12%</span>
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-[3px] flex-1">
          {[40, 70, 55, 80, 65, 90, 78].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-[2px]"
              style={{
                height: `${h}%`,
                background:
                  i === 6
                    ? "linear-gradient(180deg, #21E6C1, #1DA1FF)"
                    : "rgba(120, 160, 220, 0.16)",
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[8px] text-text-muted">
          <span>L</span><span>M</span><span>M</span><span>G</span><span>V</span><span>S</span><span>D</span>
        </div>
      </div>
    </div>
  );
}

function HistoryScreen({ t }: { t: Strings }) {
  // Activity-context colored hourly bars (mimics the new dashboard chart)
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
            {t.bpm} · {t.hourly}
          </span>
          <span className="text-[8px] text-text-secondary font-medium">72 bpm</span>
        </div>

        {/* Hourly bars */}
        <div className="mt-2 flex items-end justify-between gap-[1px] flex-1 relative">
          {/* Resting baseline */}
          <div
            aria-hidden
            className="absolute left-0 right-0 border-t border-dashed"
            style={{ borderColor: "rgba(29,161,255,0.5)", bottom: "35%" }}
          />
          {colors.map((c, i) => (
            <span
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                height: `${heights[i]}%`,
                background: c,
                minWidth: "2px",
              }}
            />
          ))}
        </div>

        {/* X-axis */}
        <div className="mt-1 flex justify-between text-[7px] text-text-muted">
          <span>0</span><span>6</span><span>12</span><span>18</span><span>24</span>
        </div>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap gap-1 text-[7px] text-text-muted">
          {[
            { l: "Sleep",    c: "#A78BFA" },
            { l: "Rest",     c: "#1DA1FF" },
            { l: "Active",   c: "#21E6C1" },
            { l: "Workout",  c: "#7CFF5B" },
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

function KpiTile({
  label, value, unit, color, hint, hintColor,
}: {
  label: string; value: string; unit?: string; color: string;
  hint?: string; hintColor?: string;
}) {
  return (
    <div className="rounded-[11px] bg-[#12182B] border border-[#24304A] p-2">
      <div className="flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-[0.14em] text-text-muted font-semibold">
          {label}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}99` }}
        />
      </div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="font-display text-[15px] font-semibold text-text-primary tracking-tightest leading-none">
          {value}
        </span>
        {unit && <span className="text-[8px] text-text-muted">{unit}</span>}
      </div>
      {hint && (
        <div
          className="text-[8px] mt-0.5 font-medium"
          style={{ color: hintColor ?? "var(--fm-text-muted)" }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
