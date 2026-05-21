/**
 * MarketingBackdrop — sfondo atmosferico riusabile per pagine marketing.
 *
 * Pattern: 3-4 layer di gradient mesh + grid SVG sottile + grain pattern.
 * Pure CSS, zero asset esterni. Fixed-position dietro al contenuto, non
 * interferisce con l'interazione (pointer-events-none).
 *
 * Si applica una volta nel layout (marketing); le pagine figlie sono
 * trasparenti e lo eredità via stacking context.
 */
export default function MarketingBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base wash — duplicato in caso .bg-page non sia applicato */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0B1023 0%, #050816 100%)",
        }}
      />

      {/* Top-right aqua orb */}
      <div
        className="absolute -top-40 right-[-12%] w-[640px] h-[640px] rounded-full opacity-50 animate-float"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(33, 230, 193, 0.30) 0%, rgba(33, 230, 193, 0) 60%)",
          filter: "blur(48px)",
        }}
      />

      {/* Top-left neon green orb */}
      <div
        className="absolute -top-20 left-[-10%] w-[520px] h-[520px] rounded-full opacity-40 animate-float"
        style={{
          animationDelay: "-4s",
          background:
            "radial-gradient(circle at 50% 50%, rgba(124, 255, 91, 0.22) 0%, rgba(124, 255, 91, 0) 60%)",
          filter: "blur(56px)",
        }}
      />

      {/* Mid-right blue orb (drifts up) */}
      <div
        className="absolute top-[36%] right-[-18%] w-[720px] h-[720px] rounded-full opacity-40 animate-float"
        style={{
          animationDelay: "-7s",
          background:
            "radial-gradient(circle at 50% 50%, rgba(29, 161, 255, 0.24) 0%, rgba(29, 161, 255, 0) 62%)",
          filter: "blur(64px)",
        }}
      />

      {/* Bottom indigo orb */}
      <div
        className="absolute bottom-[-18%] left-[20%] w-[680px] h-[680px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.18) 0%, rgba(167, 139, 250, 0) 64%)",
          filter: "blur(60px)",
        }}
      />

      {/* Subtle dot grid — SVG inline, masked with radial fade so it
          appears only in the top portion of the viewport. */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12]"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 75%)",
        }}
      >
        <defs>
          <pattern
            id="fm-grid"
            x="0"
            y="0"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#7CFF5B" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fm-grid)" />
      </svg>

      {/* Grain — SVG fractal noise as data-URI, super light */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
