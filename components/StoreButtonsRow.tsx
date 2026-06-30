"use client";

/**
 * Row di download badge: Play Store + App Store affiancati.
 *
 * Play Store sempre attivo. App Store: geo-aware. L'app iOS è live nel mondo ma
 * non nei 27 paesi UE (verifica DSA in corso), quindi mostriamo "scarica" fuori
 * UE e "in arrivo" nei 27 UE, leggendo il cookie geo lato client (vedi lib/flags).
 * Default SSR = "in arrivo" (caso sicuro). Override esplicito via prop iosDisabled.
 * Go-live globale UE: NEXT_PUBLIC_IOS_ENABLED=true su Vercel.
 */
import { useState, useEffect, type CSSProperties } from "react";

import type { Locale } from "@/lib/i18n";
import { IOS_ENABLED, EU27, countryFromCookie } from "@/lib/flags";
import AppleStoreButton from "./AppleStoreButton";
import PlayStoreButton from "./PlayStoreButton";

type Props = {
  /** Locale per i label localizzati ("In arrivo" vs "Coming Soon"). */
  locale: Locale;
  /** Forza il Play Store disabled (default false: app live su Play Store). */
  playDisabled?: boolean;
  /** Override esplicito dell'App Store disabled. Se assente: deciso dalla geo. */
  iosDisabled?: boolean;
  /** Classi extra sul wrapper flex. */
  className?: string;
  style?: CSSProperties;
};

export default function StoreButtonsRow({
  locale,
  playDisabled = false,
  iosDisabled: iosDisabledProp,
  className = "",
  style,
}: Props) {
  // Default sicuro: App Store "in arrivo". Dopo il mount, se il visitatore è
  // fuori dai 27 UE (o il flag globale è on), abilita il click.
  const [iosDisabled, setIosDisabled] = useState(iosDisabledProp ?? !IOS_ENABLED);
  useEffect(() => {
    if (iosDisabledProp !== undefined) return; // override esplicito vince
    if (IOS_ENABLED) {
      setIosDisabled(false);
      return;
    }
    const c = countryFromCookie();
    if (c && !EU27.has(c)) setIosDisabled(false);
  }, [iosDisabledProp]);

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
