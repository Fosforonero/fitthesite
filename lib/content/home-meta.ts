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
 * STATO (A2, 02/10/2026, BASE-HOME-v2.1-8961c3f9): title in 15 lingue
 * (U-META-01: it/en dal testo base, 13 lingue da Gemini K15, tutte COPERTA E
 * INVARIATA). Description (U-META-02): solo it/en nuovi; le 13 lingue
 * restano al valore precedente perche' la stringa K16 di Gemini e' SCOSTATA
 * dalla base finale (aggiunto il percorso Bluetooth): finche' Gemini non
 * consegna l'adattamento (RICHIESTA-GEMINI-ADATTAMENTI.md) quelle 13
 * description contengono ancora gli slogan «Privacy-first» / «zero tracker» e
 * lo segnala il gate di A3.
 */
import type { Locale } from "@/lib/i18n";

export const HOME_META_TITLES: Record<Locale, string> = {
  it: "FitMesh Sync: i tuoi dati fitness insieme, su iPhone e Android",
  en: "FitMesh Sync: your fitness data together, on iPhone and Android",
  es: "FitMesh Sync: tus datos de fitness juntos, en iPhone y Android",
  de: "FitMesh Sync: Deine Fitnessdaten zusammen, auf iPhone und Android",
  pt: "FitMesh Sync: os teus dados de fitness juntos, no iPhone e Android",
  fr: "FitMesh Sync : vos données de fitness réunies, sur iPhone et Android",
  pl: "FitMesh Sync: Twoje dane fitness razem, na iPhone i Android",
  tr: "FitMesh Sync: Fitness verileriniz bir arada, iPhone ve Android'de",
  nl: "FitMesh Sync: je fitnessgegevens samen, op iPhone en Android",
  ja: "FitMesh Sync：iPhoneとAndroidでフィットネスデータを一元管理",
  ko: "FitMesh Sync: iPhone과 Android에서 피트니스 데이터를 한곳에",
  sv: "FitMesh Sync: din träningsdata samlad, på iPhone och Android",
  da: "FitMesh Sync: dine træningsdata samlet, på iPhone og Android",
  no: "FitMesh Sync: treningsdataene dine samlet, på iPhone og Android",
  fi: "FitMesh Sync: kuntotietosi yhdessä, iPhonella ja Androidilla",
};

export const HOME_META_DESCRIPTIONS: Record<Locale, string> = {
  it: "App per iPhone e Android: legge dati di smartwatch e anelli da Apple Salute, Health Connect o un anello Colmi compatibile via Bluetooth e li unisce per giorno.",
  en: "iPhone and Android app that reads smartwatch and ring data from Apple Health, Health Connect or a compatible Colmi ring over Bluetooth, and combines it by day.",
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
