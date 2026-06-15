/**
 * Row di download badge — Play Store + App Store affiancati.
 *
 * Pattern: app cross-platform che vuole mostrare entrambe le piattaforme
 * anche quando una è in Coming Soon. La consistency visiva aiuta a
 * comunicare "presto anche su iOS" senza dover scrivere copy esplicita.
 *
 * Default: entrambi disabled (pre-launch beta). Quando v37.6 sarà su
 * Play Store production, basterà togliere `playDisabled` qui per attivare
 * il click in tutto il sito (homepage, about, landing provider).
 */
import type { CSSProperties } from "react";

import AppleStoreButton from "./AppleStoreButton";
import PlayStoreButton from "./PlayStoreButton";

type Props = {
  /** Locale per i label localizzati ("In arrivo" vs "Coming Soon"). */
  locale: "it" | "en" | "es";
  /** Forza il Play Store disabled (default false — app live su Play Store). */
  playDisabled?: boolean;
  /** Classi extra sul wrapper flex. */
  className?: string;
  style?: CSSProperties;
};

export default function StoreButtonsRow({
  locale,
  playDisabled = false,
  className = "",
  style,
}: Props) {
  const playLabels =
    locale === "en"
      ? { small: "GET IT ON", store: "Google Play", soon: "Coming Soon" }
      : locale === "es"
      ? { small: "Disponible en", store: "Google Play", soon: "Próximamente" }
      : { small: "Disponibile su", store: "Google Play", soon: "In arrivo" };
  const appleLabels =
    locale === "en"
      ? { small: "Download on the", store: "App Store", soon: "Coming Soon" }
      : locale === "es"
      ? { small: "Descarga en", store: "App Store", soon: "Próximamente" }
      : { small: "Scarica su", store: "App Store", soon: "In arrivo" };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 ${className}`}
      style={style}
    >
      <PlayStoreButton
        disabled={playDisabled}
        comingSoonLabel={playLabels.soon}
        smallLabel={playLabels.small}
        storeLabel={playLabels.store}
      />
      <AppleStoreButton
        disabled
        comingSoonLabel={appleLabels.soon}
        smallLabel={appleLabels.small}
        storeLabel={appleLabels.store}
      />
    </div>
  );
}
