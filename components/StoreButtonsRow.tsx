/**
 * Row di download badge — Play Store + App Store affiancati.
 *
 * Pattern: app cross-platform che vuole mostrare entrambe le piattaforme
 * anche quando una è in Coming Soon. La consistency visiva aiuta a
 * comunicare "presto anche su iOS" senza dover scrivere copy esplicita.
 *
 * Default: Play Store attivo, App Store disabled finché iOS non è live in UE.
 * Il go-live iOS è un singolo interruttore: NEXT_PUBLIC_IOS_ENABLED=true su
 * Vercel (vedi lib/flags.ts) attiva il click dell'App Store in tutto il sito.
 */
import type { CSSProperties } from "react";

import type { Locale } from "@/lib/i18n";
import { IOS_ENABLED } from "@/lib/flags";
import AppleStoreButton from "./AppleStoreButton";
import PlayStoreButton from "./PlayStoreButton";

type Props = {
  /** Locale per i label localizzati ("In arrivo" vs "Coming Soon"). */
  locale: Locale;
  /** Forza il Play Store disabled (default false — app live su Play Store). */
  playDisabled?: boolean;
  /** Forza l'App Store disabled. Default: !IOS_ENABLED (flag centrale). */
  iosDisabled?: boolean;
  /** Classi extra sul wrapper flex. */
  className?: string;
  style?: CSSProperties;
};

export default function StoreButtonsRow({
  locale,
  playDisabled = false,
  iosDisabled = !IOS_ENABLED,
  className = "",
  style,
}: Props) {
  const PLAY = {
    it: { small: "Disponibile su", store: "Google Play", soon: "In arrivo" },
    en: { small: "GET IT ON", store: "Google Play", soon: "Coming Soon" },
    es: { small: "Disponible en", store: "Google Play", soon: "Próximamente" },
    de: { small: "Jetzt bei", store: "Google Play", soon: "Demnächst" },
    pt: { small: "Disponível no", store: "Google Play", soon: "Em breve" },
    fr: { small: "Disponible sur", store: "Google Play", soon: "Bientôt disponible" },
    pl: { small: "Pobierz w", store: "Google Play", soon: "Wkrótce" },
    tr: { small: "Şuradan edinin", store: "Google Play", soon: "Çok yakında" },
    nl: { small: "Beschikbaar op", store: "Google Play", soon: "Binnenkort" },
    ja: { small: "手に入れよう", store: "Google Play", soon: "近日公開" },
    ko: { small: "지금 다운로드", store: "Google Play", soon: "출시 예정" },
  };
  const APPLE = {
    it: { small: "Scarica su", store: "App Store", soon: "In arrivo" },
    en: { small: "Download on the", store: "App Store", soon: "Coming Soon" },
    es: { small: "Descarga en", store: "App Store", soon: "Próximamente" },
    de: { small: "Laden im", store: "App Store", soon: "Demnächst" },
    pt: { small: "Baixar na", store: "App Store", soon: "Em breve" },
    fr: { small: "Télécharger dans l'", store: "App Store", soon: "Bientôt disponible" },
    pl: { small: "Pobierz z", store: "App Store", soon: "Wkrótce" },
    tr: { small: "Şuradan indirin", store: "App Store", soon: "Çok yakında" },
    nl: { small: "Downloaden in de", store: "App Store", soon: "Binnenkort" },
    ja: { small: "ダウンロード", store: "App Store", soon: "近日公開" },
    ko: { small: "다운로드", store: "App Store", soon: "출시 예정" },
  };
  const playLabels = PLAY[locale] ?? PLAY.en;
  const appleLabels = APPLE[locale] ?? APPLE.en;

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
        disabled={iosDisabled}
        comingSoonLabel={appleLabels.soon}
        smallLabel={appleLabels.small}
        storeLabel={appleLabels.store}
      />
    </div>
  );
}
