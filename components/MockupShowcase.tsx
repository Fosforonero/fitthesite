/**
 * MockupShowcase — sezione home "Guarda FitMesh in azione".
 *
 * Screenshot REALI dell'app Android (stessi asset della scheda Play Store),
 * dentro cornici phone. Vedi public/screens/*.jpg (720×1440).
 */

import { PhoneFrame } from "@/components/HeroVisual";

type Captions = {
  sleep: string;
  trends: string;
  vitals: string;
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
    { caption: captions.sleep, src: "/screens/sleep.jpg" },
    { caption: captions.trends, src: "/screens/trends.jpg" },
    { caption: captions.vitals, src: "/screens/vitals.jpg" },
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
        {screens.map(({ caption, src }, i) => (
          <figure
            key={src}
            data-reveal
            style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
            className="flex flex-col items-center w-full max-w-[270px]"
          >
            <PhoneFrame src={src} alt={caption} />
            <figcaption className="mt-5 text-sm font-medium text-text-secondary">
              {caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
