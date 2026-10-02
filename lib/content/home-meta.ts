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
  es: "App para iPhone y Android: lee datos de smartwatch y anillos desde Apple Salud, Health Connect o un anillo Colmi compatible por Bluetooth y los une por día.",
  de: "iPhone- und Android-App: liest Smartwatch- und Ringdaten aus Apple Health, Health Connect oder kompatiblen Colmi-Ringen über Bluetooth und bündelt sie tageweise.",
  pt: "App para iPhone e Android: lê dados de smartwatch e anéis do Apple Saúde, Health Connect ou anel Colmi compatível por Bluetooth e reúne-os por dia.",
  fr: "App iPhone et Android : lit les données de montres et bagues depuis Apple Santé, Health Connect ou bague Colmi compatible en Bluetooth et les réunit par jour.",
  pl: "Aplikacja na iPhone'a i Androida: odczytuje dane ze smartwatchy i pierścieni z Apple Health, Health Connect lub zgodnego pierścienia Colmi przez Bluetooth i łączy je według dni.",
  tr: "iPhone ve Android uygulaması: Apple Health, Health Connect veya Bluetooth ile uyumlu Colmi yüzüğünden verileri okur ve gün bazında birleştirir.",
  nl: "iPhone- en Android-app: leest smartwatch- en ringgegevens uit Apple Gezondheid, Health Connect of compatibele Colmi-ring via Bluetooth en brengt ze per dag samen.",
  ja: "iPhoneおよびAndroidアプリ：Appleヘルスケア、Health Connect、またはBluetooth対応Colmiリングからデータを読み取り日ごとに集約。",
  ko: "iPhone 및 Android 앱: Apple 건강, Health Connect 또는 Bluetooth 호환 Colmi 링에서 데이터를 읽어와 날마다 모아줍니다.",
  sv: "iPhone- och Android-app: läser data från smartklockor och ringar från Apple Hälsa, Health Connect eller kompatibel Colmi-ring via Bluetooth och samlar per dag.",
  da: "iPhone- og Android-app: læser data fra smartwatches og ringe fra Apple Sundhed, Health Connect eller kompatibel Colmi-ring via Bluetooth og samler dem pr. dag.",
  no: "iPhone- og Android-app: leser data fra smartklokker og ringer fra Apple Helse, Health Connect eller kompatibel Colmi-ring via Bluetooth og samler per dag.",
  fi: "iPhone- ja Android-sovellus: lukee kellojen ja sormusten tietoja Apple Terveydestä, Health Connectista tai Bluetooth-Colmi-sormuksesta ja kokoaa päivittäin.",
};

/** Title della home nella lingua della pagina (nessun ripiego su altra lingua). */
export function homeMetaTitle(lc: Locale): string {
  return HOME_META_TITLES[lc];
}

/** Description della home nella lingua della pagina (nessun ripiego). */
export function homeMetaDescription(lc: Locale): string {
  return HOME_META_DESCRIPTIONS[lc];
}
