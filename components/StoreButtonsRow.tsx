/**
 * Row di download badge: Play Store + App Store affiancati.
 *
 * Entrambi live di default: Play Store e App Store (incluse tutte le
 * storefront UE, verificato 2026-07-13). Nessun gating geografico, nessuna
 * dipendenza da cookie o hydration — il markup è identico SSR e client.
 */
import type { CSSProperties } from "react";

import { storeButtonsCtaId, type CtaPlacement } from "@/lib/analytics/cta";
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
  /**
   * Sprint P0.10 — identifica dove vive questa CTA nel funnel (es.
   * "homepage_hero", "homepage_pricing_trial", "beta_archive"). Letto da
   * OutboundTracker via `closest("[data-cta-location]")` e propagato come
   * `cta_location`/`placement` nell'evento GA4 `store_click`. Opzionale: se
   * assente, gli attributi non vengono emessi e il click resta comunque
   * tracciato (nessuna regressione per le chiamate esistenti non ancora
   * annotate).
   *
   * Sprint P0.10K — Fase 7: tipizzata sul vocabolario chiuso
   * `CtaPlacement` (lib/analytics/cta.ts). Un refuso ora rompe
   * `tsc --noEmit` invece di produrre in silenzio un segmento orfano in
   * GA4. Sempre in Fase 7 la row dichiara anche
   * `data-cta-id`/`data-cta-placement`: cosi' i badge store emettono
   * l'intero funnel `cta_view` -> `cta_click` -> `store_click` e non solo
   * l'ultimo step.
   */
  ctaLocation?: CtaPlacement;
};

export default function StoreButtonsRow({
  locale,
  playDisabled = false,
  iosDisabled = false,
  className = "",
  style,
  ctaLocation,
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
      data-cta-location={ctaLocation}
      data-cta-placement={ctaLocation}
      data-cta-id={ctaLocation ? storeButtonsCtaId(ctaLocation) : undefined}
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
