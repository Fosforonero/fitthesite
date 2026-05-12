/**
 * HeroVisual — phone mockup containing a stylized FitMesh Sync dashboard.
 * Pure CSS / SVG; no images, fully scalable, brand-coherent.
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
};

export default function HeroVisual({ locale = "it" }: { locale?: "it" | "en" }) {
  const t = locale === "en" ? ENStrings : ITStrings;

  return (
    <div className="relative w-full max-w-[380px] mx-auto lg:mx-0">
      {/* Brand gradient glow behind the phone */}
      <div
        aria-hidden
        className="absolute -inset-12 -z-10 blur-[64px] opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, #21E6C1 0%, transparent 60%), radial-gradient(60% 60% at 30% 80%, #1DA1FF 0%, transparent 65%)",
        }}
      />

      {/* Phone frame */}
      <div className="relative aspect-[9/19] rounded-[44px] p-[3px] bg-gradient-to-b from-white/20 to-white/5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-[3px] rounded-[42px] bg-[#04070f] overflow-hidden">
          {/* Notch / dynamic island */}
          <div
            aria-hidden
            className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[26px] rounded-full bg-black z-10"
          />

          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 px-6 pt-3 flex items-center justify-between text-[10px] text-text-secondary font-medium z-20">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-text-primary" />
              <span className="w-1 h-1 rounded-full bg-text-primary" />
              <span className="w-1 h-1 rounded-full bg-text-primary" />
              <span className="w-1 h-1 rounded-full bg-text-muted" />
            </span>
          </div>

          {/* Dashboard content */}
          <div className="absolute inset-0 pt-12 pb-3 px-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-[15px] font-semibold tracking-tight text-text-primary">
                  Galaxy Watch
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  {t.status} · {t.lastSync}
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[9px] font-semibold uppercase tracking-wider"
                style={{
                  background: "rgba(49, 233, 129, 0.15)",
                  color: "#31E981",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#31E981", boxShadow: "0 0 8px #31E981" }}
                />
                Live
              </span>
            </div>

            {/* Today section label */}
            <div className="text-[9px] uppercase tracking-[0.2em] text-brand-aqua font-semibold mt-1">
              {t.today}
            </div>

            {/* KPI 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <KpiTile label={t.steps}    value="8.524"    color="#1DA1FF" />
              <KpiTile label={t.bpm}      value="72"        unit="bpm"    color="#FF5C7A" />
              <KpiTile label={t.calories} value="480"       unit="kcal"   color="#FFB547" />
              <KpiTile label={t.sleep}    value="7h 13m"                  color="#21E6C1" />
            </div>

            {/* Sleep mini-card */}
            <div className="rounded-[14px] bg-[#12182B] border border-[#24304A] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.16em] text-text-muted font-semibold">
                  {t.sleep}
                </span>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-pill"
                  style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}
                >
                  {t.good}
                </span>
              </div>
              <div className="mt-1.5 font-display text-base font-semibold text-text-primary tracking-tightest">
                7h 13m
              </div>
              <div className="text-[9px] text-text-muted">{t.sleepLabel}</div>

              {/* Sleep stages bar */}
              <div className="mt-2 flex h-1.5 rounded-full overflow-hidden">
                <span className="flex-[18]" style={{ background: "#1DA1FF" }} />
                <span className="flex-[22]" style={{ background: "#A78BFA" }} />
                <span className="flex-[55]" style={{ background: "#60A5FA" }} />
                <span className="flex-[5]"  style={{ background: "#FF5C7A" }} />
              </div>
            </div>

            {/* Weekly mini chart */}
            <div className="rounded-[14px] bg-[#12182B] border border-[#24304A] p-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.16em] text-text-muted font-semibold">
                  {t.weekly}
                </span>
                <span className="text-[9px] text-text-secondary font-medium">
                  +12%
                </span>
              </div>

              {/* Mini bars */}
              <div className="mt-2 flex items-end justify-between gap-1 flex-1 h-12">
                {[40, 70, 55, 80, 65, 90, 78].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 6
                          ? "linear-gradient(180deg, #21E6C1, #1DA1FF)"
                          : "rgba(120, 160, 220, 0.18)",
                    }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[8px] text-text-muted">
                <span>L</span><span>M</span><span>M</span><span>G</span><span>V</span><span>S</span><span>D</span>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Soundwave decoration floating around */}
      <div
        aria-hidden
        className="absolute -right-6 top-1/3 hidden lg:flex gap-1 items-center opacity-80"
      >
        {[12, 22, 16, 28, 14].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full"
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
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

function KpiTile({
  label, value, unit, color,
}: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div className="rounded-[14px] bg-[#12182B] border border-[#24304A] p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.14em] text-text-muted font-semibold">
          {label}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-base font-semibold text-text-primary tracking-tightest leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-[9px] text-text-muted">{unit}</span>
        )}
      </div>
    </div>
  );
}
