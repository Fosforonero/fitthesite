/**
 * Row di download badge: Play Store + App Store affiancati.
 *
 * Entrambi live di default: Play Store e App Store (incluse tutte le
 * storefront UE, verificato 2026-07-13). Nessun gating geografico, nessuna
 * dipendenza da cookie o hydration — il markup è identico SSR e client.
 */
import type { CSSProperties } from "react";

import type { Locale } from "@/lib/i18n";
import AppleStoreButton from "./AppleStoreButton";
import PlayStoreButton from "./PlayStoreButton";

type Props = {
  /** Locale per i label localizzati. */
  locale: Locale;
  /** Forza il Play Store disabled (default false: app live su Play Store). */
  playDisabled?: boolean;
  /** Forza l'App Store disabled (default false: app live sull'App Store). */
  iosDisabled?: boolean;
  /** Classi extra sul wrapper flex. */
  className?: string;
  style?: CSSProperties;
};

export default function StoreButtonsRow({
  locale,
  playDisabled = false,
  iosDisabled = false,
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
    sv: { small: "Ladda ned på", store: "Google Play", soon: "Kommer snart" },
    da: { small: "Hent på", store: "Google Play", soon: "Kommer snart" },
    no: { small: "Last ned på", store: "Google Play", soon: "Kommer snart" },
    fi: { small: "Lataa palvelusta", store: "Google Play", soon: "Tulossa pian" },
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
    sv: { small: "Ladda ned i", store: "App Store", soon: "Kommer snart" },
    da: { small: "Hent i", store: "App Store", soon: "Kommer snart" },
    no: { small: "Last ned i", store: "App Store", soon: "Kommer snart" },
    fi: { small: "Lataa", store: "App Store", soon: "Tulossa pian" },
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
