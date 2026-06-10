/**
 * HeroVisual — two-phone hero con i mockup REALI dell'app (gli stessi
 * componenti React di /mockups/<screen>, scalati via CSS transform).
 *
 * Front phone: DashboardMockup (passi, metriche, sync footer)
 * Back phone:  MultiDeviceMockup (vista globale multi-device)
 *
 * Niente asset raster: i mockup sono 1080×1920 px fissi, qui resi a
 * scala fissa per breakpoint (mobile/desktop) dentro cornici phone.
 */

import {
  DashboardMockup,
  MultiDeviceMockup,
} from "@/app/mockups/[screen]/screens";

export default function HeroVisual({ locale = "en" }: { locale?: "it" | "en" }) {
  // I mockup sono in italiano (lingua primaria dell'app); il badge "Dati
  // dimostrativi" è interno al mockup. `locale` resta per compat call-site.
  void locale;

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

      {/* ── Phone B (retro, vista multi-device) ── */}
      <div
        className="absolute hidden sm:block top-[70px] -right-[36px] lg:right-[-26px] rotate-[6deg] origin-bottom-left z-0 opacity-90"
        aria-hidden
      >
        <HeroPhone scale={0.21}>
          <MultiDeviceMockup />
        </HeroPhone>
      </div>

      {/* ── Phone A (fronte, dashboard) ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 z-10">
        <div className="block sm:hidden">
          <HeroPhone scale={0.235}>
            <DashboardMockup />
          </HeroPhone>
        </div>
        <div className="hidden sm:block">
          <HeroPhone scale={0.29}>
            <DashboardMockup />
          </HeroPhone>
        </div>
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

/* ───────── Phone shell con mockup 1080×1920 scalato ───────── */

function HeroPhone({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  const W = Math.round(1080 * scale);
  const H = Math.round(1920 * scale);

  return (
    <div
      className="relative rounded-[40px] p-[3px] bg-gradient-to-b from-white/25 to-white/5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]"
      style={{ width: W + 6, height: H + 6 }}
    >
      <div className="absolute inset-[3px] rounded-[37px] overflow-hidden bg-[#04070f]">
        <div
          style={{
            width: 1080,
            height: 1920,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90px] h-[4px] rounded-full bg-white/30" />
      </div>
    </div>
  );
}
