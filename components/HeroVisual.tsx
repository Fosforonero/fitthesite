/**
 * HeroVisual — two-phone hero con SCREENSHOT REALI dell'app Android
 * (catturati da device, stessi asset della scheda Play Store).
 *
 * Front phone: dashboard (saluto, tile metriche, Recovery Index)
 * Back phone:  confronto settimanale + allenamenti + battito
 *
 * Asset: public/screens/*.jpg, 720×1440 (ratio 1:2).
 */

import Image from "next/image";

export default function HeroVisual({ locale = "en" }: { locale?: "it" | "en" }) {
  // Screenshot per-locale: catturati dall'app con la lingua corrispondente.
  const base = `/screens/${locale === "it" ? "it" : "en"}`;
  const dashAlt =
    locale === "it"
      ? "Dashboard dell'app FitMesh Sync con passi, battito, calorie, sonno e Recovery Index"
      : "FitMesh Sync app dashboard with steps, heart rate, calories, sleep and Recovery Index";

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

      {/* ── Phone B (retro, settimana + battito) ── */}
      <div
        className="absolute hidden sm:block top-[70px] -right-[36px] lg:right-[-26px] w-[226px] rotate-[6deg] origin-bottom-left z-0 opacity-90"
        aria-hidden
      >
        <PhoneFrame src={`${base}/week.jpg`} alt="" priority={false} />
      </div>

      {/* ── Phone A (fronte, dashboard) ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[254px] sm:w-[312px] z-10">
        <PhoneFrame
          src={`${base}/dashboard.jpg`}
          alt={dashAlt}
          priority
        />
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

/* ───────── Phone shell: cornice + screenshot 1:2 ───────── */

export function PhoneFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative rounded-[38px] p-[3px] bg-gradient-to-b from-white/25 to-white/5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]">
      <div className="relative rounded-[35px] overflow-hidden bg-[#04070f]">
        <Image
          src={src}
          alt={alt}
          width={720}
          height={1440}
          priority={priority}
          className="w-full h-auto block"
          sizes="(max-width: 640px) 254px, 312px"
        />
        {/* Fade bottom: lo screenshot è tagliato a metà card — la sfumatura
            verso il nero del frame nasconde il taglio in modo naturale. */}
        <div
          aria-hidden
          className="absolute bottom-0 inset-x-0 h-[56px]"
          style={{
            background: "linear-gradient(180deg, transparent 0%, #04070f 85%)",
          }}
        />
        {/* Home indicator */}
        <div
          aria-hidden
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[80px] h-[4px] rounded-full bg-white/30"
        />
      </div>
    </div>
  );
}
