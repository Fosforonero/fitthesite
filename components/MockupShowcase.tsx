/**
 * MockupShowcase — sezione home "Guarda FitMesh in azione".
 *
 * Embedda i mockup screen (1080×1920 px fissi, vedi app/mockups) scalati
 * via CSS transform dentro cornici phone. Server component puro: nessun
 * asset raster, gli stessi componenti React usati per /mockups/<screen>.
 */

import {
  FamilyMockup,
  InsightsMockup,
  MultiDeviceMockup,
} from "@/app/mockups/[screen]/screens";

type Captions = {
  multiDevice: string;
  family: string;
  insights: string;
};

export default function MockupShowcase({
  kicker,
  heading,
  sub,
  captions,
}: {
  kicker: string;
  heading: string;
  sub: string;
  captions: Captions;
}) {
  const screens = [
    { caption: captions.multiDevice, Screen: MultiDeviceMockup, href: "/mockups/multi-device" },
    { caption: captions.family, Screen: FamilyMockup, href: "/mockups/family" },
    { caption: captions.insights, Screen: InsightsMockup, href: "/mockups/insights" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-28 sm:mt-36" data-reveal>
      <div className="max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">
          {kicker}
        </p>
        <h2 className="mt-4 font-display text-display font-semibold tracking-tightest text-text-primary text-balance">
          {heading}
        </h2>
        <p className="mt-3 text-sm text-text-muted">{sub}</p>
      </div>

      <div className="mt-14 grid gap-10 sm:gap-6 sm:grid-cols-3 justify-items-center">
        {screens.map(({ caption, Screen }, i) => (
          <figure
            key={caption}
            data-reveal
            style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
            className="flex flex-col items-center"
          >
            <PhoneShell>
              <Screen />
            </PhoneShell>
            <figcaption className="mt-5 text-sm font-medium text-text-secondary">
              {caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/**
 * Cornice phone con contenuto 1080×1920 scalato.
 * Scale 0.24 → 259×461 px circa: leggibile su desktop, 1 colonna su mobile.
 */
function PhoneShell({ children }: { children: React.ReactNode }) {
  const SCALE = 0.24;
  const W = 1080 * SCALE;
  const H = 1920 * SCALE;

  return (
    <div
      className="relative rounded-[36px] p-[3px] bg-gradient-to-b from-white/25 to-white/5 shadow-[0_30px_90px_-25px_rgba(0,0,0,0.85)]"
      style={{ width: W + 6, height: H + 6 }}
    >
      <div className="absolute inset-[3px] rounded-[33px] overflow-hidden bg-[#04070f]">
        <div
          style={{
            width: 1080,
            height: 1920,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
