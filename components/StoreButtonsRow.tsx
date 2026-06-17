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

import type { Locale } from "@/lib/i18n";
import AppleStoreButton from "./AppleStoreButton";
import PlayStoreButton from "./PlayStoreButton";

type Props = {
  /** Locale per i label localizzati ("In arrivo" vs "Coming Soon"). */
  locale: Locale;
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
  const playLabels = {
    it: { small: "Disponibile su", store: "Google Play", soon: "In arrivo" },
    en: { small: "GET IT ON", store: "Google Play", soon: "Coming Soon" },
    es: { small: "Disponible en", store: "Google Play", soon: "Próximamente" },
    de: { small: "Jetzt bei", store: "Google Play", soon: "Demnächst" },
    pt: { small: "Disponível no", store: "Google Play", soon: "Em breve" },
    fr: { small: "Disponible sur", store: "Google Play", soon: "Bientôt disponible" },
  }[locale];
  const appleLabels = {
    it: { small: "Scarica su", store: "App Store", soon: "In arrivo" },
    en: { small: "Download on the", store: "App Store", soon: "Coming Soon" },
    es: { small: "Descarga en", store: "App Store", soon: "Próximamente" },
    de: { small: "Laden im", store: "App Store", soon: "Demnächst" },
    pt: { small: "Baixar na", store: "App Store", soon: "Em breve" },
    fr: { small: "Télécharger dans l'", store: "App Store", soon: "Bientôt disponible" },
  }[locale];

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
