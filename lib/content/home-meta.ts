/**
 * lib/content/home-meta.ts: fonte unica di title e description della home.
 *
 * Letta da tre punti che prima avevano tre copie diverse e divergenti:
 *   - app/(frontend)/[locale]/layout.tsx          (generateMetadata, radice)
 *   - app/(frontend)/[locale]/(marketing)/layout.tsx (generateMetadata, quello
 *     che prevale sulla home perche' e' il layout piu' interno)
 *   - app/(frontend)/[locale]/(marketing)/page.tsx (JSON-LD WebPage: name,
 *     description)
 * SITE-WRITING 5: il JSON-LD deriva dalla stessa fonte dei metadata.
 *
 * Copertura: tutte e 15 le lingue, nessun ripiego. Prima il JSON-LD della home
 * dava l'inglese a 12 lingue (K001, K015): ora ogni lingua legge il proprio
 * valore.
 *
 * STATO (A1a, 02/10/2026): i valori sono quelli correnti del layout
 * (marketing), copiati identici; l'unica modifica e' il trattino lungo dei
 * title (core rule 8), sostituito da ":" come gia' nei title sv/da/no/fi. I
 * testi it/en di U-META-01/02 (e le 13 lingue coperte) li scrive A2: qui NON
 * sono ancora cambiati. Le description contengono ancora gli slogan
 * «Privacy-first» / «zero tracker» che U-META-02 toglie.
 */
import type { Locale } from "@/lib/i18n";

export const HOME_META_TITLES: Record<Locale, string> = {
  it: "FitMesh Sync: Una dashboard globale per tutti i tuoi dispositivi",
  en: "FitMesh Sync: One global dashboard for all your devices",
  es: "FitMesh Sync: Un panel global para todos tus dispositivos",
  de: "FitMesh Sync: Ein globales Dashboard für alle deine Geräte",
  pt: "FitMesh Sync: Um painel global para todos os seus dispositivos",
  fr: "FitMesh Sync: Un tableau de bord global pour tous vos appareils",
  pl: "FitMesh Sync: jeden globalny panel dla wszystkich Twoich urzadzen",
  tr: "FitMesh Sync: Tum cihazlariniz icin tek bir global panel",
  nl: "FitMesh Sync: Één global dashboard voor al je apparaten",
  ja: "FitMesh Sync: すべてのデバイスをひとつのグローバルダッシュボードへ",
  ko: "FitMesh Sync: 모든 기기를 위한 하나의 글로벌 대시보드",
  sv: "FitMesh Sync: En global dashboard för alla dina enheter",
  da: "FitMesh Sync: Ét globalt dashboard til alle dine enheder",
  no: "FitMesh Sync: Ett globalt dashbord for alle enhetene dine",
  fi: "FitMesh Sync: Yksi maailmanlaajuinen koontinäyttö kaikille laitteillesi",
};

export const HOME_META_DESCRIPTIONS: Record<Locale, string> = {
  it: "FitMesh Sync unisce Galaxy Watch, Wear OS, Health Connect e provider cloud in una dashboard globale: passi, battito, sonno, recupero e trend. Privacy-first, zero tracker pubblicitari.",
  en: "FitMesh Sync brings Galaxy Watch, Wear OS, Health Connect and cloud providers into one global dashboard: steps, heart rate, sleep, recovery, trends. Privacy-first. No ad trackers.",
  es: "FitMesh Sync reúne Galaxy Watch, Wear OS, Health Connect y proveedores en la nube en un panel global: pasos, frecuencia cardíaca, sueño, recuperación y tendencias. Centrado en tu privacidad, sin rastreadores publicitarios.",
  de: "FitMesh Sync verbindet Galaxy Watch, Wear OS, Health Connect und Cloud-Dienste in einem globalen Dashboard: Schritte, Herzfrequenz, Schlaf, Erholung und Trends. Datenschutz-first. Keine Werbetracker.",
  pt: "FitMesh Sync reúne Galaxy Watch, Wear OS, Health Connect e provedores em nuvem em um painel global: passos, frequência cardíaca, sono, recuperação e tendências. Privacidade em primeiro lugar. Sem rastreadores publicitários.",
  fr: "FitMesh Sync regroupe Galaxy Watch, Wear OS, Health Connect et les services cloud dans un tableau de bord global: pas, fréquence cardiaque, sommeil, récupération et tendances. Confidentialité avant tout. Sans traceur publicitaire.",
  pl: "FitMesh Sync łączy Galaxy Watch, Wear OS, Health Connect i dostawców chmury w jednym panelu: kroki, tętno, sen, regeneracja i trendy. Prywatność na pierwszym miejscu. Bez trackerów reklamowych.",
  tr: "FitMesh Sync, Galaxy Watch, Wear OS, Health Connect ve bulut sağlayıcılarını tek bir global panelde bir araya getirir: adımlar, kalp atışı, uyku, toparlanma ve trendler. Gizlilik öncelikli. Reklam izleyicisi yok.",
  nl: "FitMesh Sync brengt Galaxy Watch, Wear OS, Health Connect en cloudproviders samen in één global dashboard: stappen, hartslag, slaap, herstel en trends. Privacy-first. Geen advertentietrackers.",
  ja: "FitMesh Syncは、Galaxy Watch、Wear OS、Health Connect、およびクラウドプロバイダーを1つのグローバルダッシュボードに統合：ステップ数、心拍数、睡眠、回復、傾向。プライバシーを最優先に。広告トラッカーなし。",
  ko: "FitMesh Sync은 Galaxy Watch, Wear OS, Health Connect 및 클라우드 제공업체를 한 글로벌 대시보드로 통합합니다: 걸음 수, 심박수, 수면, 회복, 추세. 개인정보 보호를 최우선으로. 광고 트래커 없음.",
  sv: "FitMesh Sync samlar Galaxy Watch, Wear OS, Health Connect och molntjänster i en global dashboard: steg, puls, sömn, återhämtning och trender. Integritet först. Inga annonsspårare.",
  da: "FitMesh Sync samler Galaxy Watch, Wear OS, Health Connect og cloud-udbydere i ét globalt dashboard: skridt, puls, søvn, restitution og tendenser. Privatliv først. Ingen annoncetrackere.",
  no: "FitMesh Sync samler Galaxy Watch, Wear OS, Health Connect og skytjenester i ett globalt dashbord: skritt, puls, søvn, restitusjon og trender. Personvern først. Ingen annonsesporere.",
  fi: "FitMesh Sync kokoaa Galaxy Watchin, Wear OS:n, Health Connectin ja pilvipalvelut yhteen maailmanlaajuiseen koontinäyttöön: askeleet, syke, uni, palautuminen ja trendit. Yksityisyys edellä. Ei mainosseurantaa.",
};

/** Title della home nella lingua della pagina (nessun ripiego su altra lingua). */
export function homeMetaTitle(lc: Locale): string {
  return HOME_META_TITLES[lc];
}

/** Description della home nella lingua della pagina (nessun ripiego). */
export function homeMetaDescription(lc: Locale): string {
  return HOME_META_DESCRIPTIONS[lc];
}
