import type { Locale } from "@/lib/i18n";
import type { Localized } from "@/lib/blog/types";

/**
 * Copy della homepage estratto dagli ex-ternari inline `lc === "it" ? ... :
 * lc === "es" ? ... : "<english>"` (solo it/es/en) in un unico posto
 * tipizzato, riusando `Localized`/`tl()` già usato per `PRICING_SECTION` sulla
 * stessa pagina. Da questa versione tutti e 15 i locali sono tradotti
 * (`HOME_COMPLETE_LOCALES` in `lib/content/static-page-locales.ts` riflette lo
 * stesso set) — NON lasciare stringhe placeholder o copiate dall'inglese per
 * eventuali nuovi locali futuri, meglio ometterle (`tl()` fa fallback a `en`).
 */

type StepItem = { t: string; d: string };
type PrivacyPoint = { t: string; d: string };

type LocalizedItems<T> = { it: T; en: T } & Partial<Record<Locale, T>>;

export function tli<T>(l: LocalizedItems<T>, lc: Locale): T {
  return (l as Record<string, T | undefined>)[lc] ?? l.en;
}

export const HOMEPAGE_COPY = {
  leadSentence: {
    it: "FitMesh Sync è l'app che unisce i dati di Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit e altri wearable Android in un'unica dashboard privacy-first.",
    en: "FitMesh Sync is the app that brings Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit and other Android wearables into one privacy-first dashboard.",
    es: "FitMesh Sync es la app que unifica los datos de Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit y otros wearables Android en un solo panel privacy-first.",
    de: "FitMesh Sync ist die App, die Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit und andere Android-Wearables in einem datenschutzfreundlichen Dashboard vereint.",
    pt: "O FitMesh Sync é a app que reúne o Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit e outros wearables Android num único dashboard com privacidade em primeiro lugar.",
    fr: "FitMesh Sync est l'application qui réunit Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit et d'autres objets connectés Android dans un seul tableau de bord centré sur la confidentialité.",
    pl: "FitMesh Sync to aplikacja, która zbiera dane z Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit i innych opasek na Androida w jednym panelu – z dbałością o prywatność.",
    tr: "FitMesh Sync; Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit ve diğer Android giyilebilir cihazlarınızı, gizliliği önceleyen tek bir panelde bir araya getiren uygulamadır.",
    nl: "FitMesh Sync is de app die Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit en andere Android-wearables samenbrengt in één privacyvriendelijk dashboard.",
    ja: "FitMesh Syncは、Galaxy Watch、Wear OS、Mi Band、Garmin、Fitbitなど各種Androidウェアラブルのデータをひとつにまとめ、プライバシーを守りながらダッシュボードに表示するアプリです。",
    ko: "FitMesh Sync는 Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit 등 안드로이드 웨어러블 데이터를 하나의 대시보드에 모아, 프라이버시를 최우선으로 안전하게 보여주는 앱입니다.",
    sv: "FitMesh Sync är appen som samlar Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit och andra Android-wearables i en enda integritetsfokuserad instrumentpanel.",
    da: "FitMesh Sync er appen, der samler Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit og andre Android-wearables i ét privatlivsvenligt dashboard.",
    no: "FitMesh Sync er appen som samler Galaxy Watch, Wear OS, Mi Band, Garmin, Fitbit og andre wearables for Android i ett personvernvennlig dashbord.",
    fi: "FitMesh Sync on sovellus, joka kokoaa Galaxy Watchin, Wear OS:n, Mi Bandin, Garminin, Fitbitin ja muiden Android-puettavien tiedot yhteen hallintapaneeliin, joka asettaa yksityisyyden etusijalle.",
  } satisfies Localized,

  /**
   * Sprint P0.10 / P0.10K — copy permanente post-Founder (chiusura
   * commerciale del sito), usata per la card prova nella sezione pricing e
   * per la riga finale della banda CTA. Prima del 31/07/2026 questi due
   * campi erano il ramo `evergreen` di FounderClientGate; ora sono l'unico
   * contenuto renderizzato, senza gate ne' richiesta di rete.
   */
  trialName: {
    it: "14 giorni gratis",
    en: "14-day trial",
    es: "14 días gratis",
    de: "14 Tage gratis",
    pt: "14 dias grátis",
    fr: "14 jours gratuits",
    pl: "14 dni za darmo",
    tr: "14 gün ücretsiz",
    nl: "14 dagen gratis",
    ja: "14日間無料",
    ko: "14일 무료",
    sv: "14 dagar gratis",
    da: "14 dage gratis",
    no: "14 dager gratis",
    fi: "14 päivää ilmaiseksi",
  } satisfies Localized,
  trialTagline: {
    it: "Prova Pro gratis, poi scegli il piano più adatto",
    en: "Try Pro free, then choose the plan that fits you",
    es: "Prueba Pro gratis y luego elige el plan que más te convenga",
    de: "Teste Pro kostenlos und wähle danach den passenden Plan",
    pt: "Experimenta o Pro grátis e depois escolhe o plano ideal",
    fr: "Essaie Pro gratuitement, puis choisis la formule qui te convient",
    pl: "Wypróbuj Pro za darmo, a potem wybierz odpowiedni plan",
    tr: "Pro'yu ücretsiz dene, ardından sana uygun planı seç",
    nl: "Probeer Pro gratis en kies daarna het plan dat bij je past",
    ja: "Proを無料体験後、最適なプランをお選びください",
    ko: "Pro를 무료로 체험한 후 나에게 맞는 요금제를 선택하세요",
    sv: "Testa Pro gratis och välj sedan den plan som passar dig",
    da: "Prøv Pro gratis, og vælg derefter den plan, der passer dig",
    no: "Prøv Pro gratis, og velg deretter planen som passer deg",
    fi: "Kokeile Pro-versiota ilmaiseksi ja valitse sitten sinulle sopiva paketti",
  } satisfies Localized,

  platformsAvailableLabel: {
    it: "Disponibile ora",
    en: "Available now",
    es: "Disponible ahora",
    de: "Jetzt verfügbar",
    pt: "Disponível agora",
    fr: "Disponible maintenant",
    pl: "Dostępne już teraz",
    tr: "Şimdi kullanılabilir",
    nl: "Nu beschikbaar",
    ja: "今すぐ利用可能",
    ko: "지금 이용 가능",
    sv: "Tillgänglig nu",
    da: "Tilgængelig nu",
    no: "Tilgjengelig nå",
    fi: "Saatavilla nyt",
  } satisfies Localized,

  wearablesSupportedLabel: {
    it: "Wearable supportati",
    en: "Wearables supported",
    es: "Wearables compatibles",
    de: "Unterstützte Wearables",
    pt: "Wearables suportados",
    fr: "Appareils compatibles",
    pl: "Obsługiwane urządzenia",
    tr: "Desteklenen giyilebilir cihaz",
    nl: "Ondersteunde wearables",
    ja: "対応ウェアラブル",
    ko: "지원 웨어러블",
    sv: "Wearables som stöds",
    da: "Understøttede wearables",
    no: "Støttede wearables",
    fi: "Tuettua puettavaa laitetta",
  } satisfies Localized,

  worksWithKicker: {
    it: "Compatibile con",
    en: "Works with",
    es: "Compatible con",
    de: "Funktioniert mit",
    pt: "Compatível com",
    fr: "Compatible avec",
    pl: "Współpracuje z",
    tr: "Şunlarla Çalışır",
    nl: "Werkt met",
    ja: "対応",
    ko: "지원 기기",
    sv: "Fungerar med",
    da: "Fungerer med",
    no: "Fungerer med",
    fi: "Toimii näiden kanssa",
  } satisfies Localized,

  howItWorksKicker: {
    it: "Come funziona",
    en: "How it works",
    es: "Cómo funciona",
    de: "So funktioniert's",
    pt: "Como funciona",
    fr: "Comment ça marche",
    pl: "Jak to działa",
    tr: "Nasıl Çalışır",
    nl: "Hoe het werkt",
    ja: "使い方",
    ko: "이용 방법",
    sv: "Så funkar det",
    da: "Sådan fungerer det",
    no: "Slik fungerer det",
    fi: "Näin se toimii",
  } satisfies Localized,

  howItWorksHeading: {
    it: "Trenta secondi. Niente di più.",
    en: "Thirty seconds. Nothing more.",
    es: "Treinta segundos. Nada más.",
    de: "Dreißig Sekunden. Mehr nicht.",
    pt: "Trinta segundos. Nada mais.",
    fr: "Trente secondes. Pas une de plus.",
    pl: "Trzydzieści sekund. Nic więcej.",
    tr: "Otuz saniye. Hepsi bu kadar.",
    nl: "Dertig seconden. Meer niet.",
    ja: "30秒。それだけ。",
    ko: "30초. 그게 다예요.",
    sv: "Trettio sekunder. Inget mer.",
    da: "Tredive sekunder. Ikke mere.",
    no: "Tretti sekunder. Ikke mer.",
    fi: "30 sekuntia. Siinä kaikki.",
  } satisfies Localized,

  stepLabel: {
    it: "Step",
    en: "Step",
    es: "Paso",
    de: "Schritt",
    pt: "Passo",
    fr: "Étape",
    pl: "Krok",
    tr: "Adım",
    nl: "Stap",
    ja: "ステップ",
    ko: "단계",
    sv: "Steg",
    da: "Trin",
    no: "Steg",
    fi: "Vaihe",
  } satisfies Localized,

  steps: {
    it: [
      { t: "Scarica & autorizza", d: "Installa l'app dal Play Store, dai accesso a Health Connect." },
      { t: "FitMesh legge tutto", d: "Passi, battito, sonno, calorie. Anche in background, anche notte." },
      { t: "I tuoi dati sono nell'app", d: "Apri FitMesh quando vuoi controllarli. Niente account social, nessuna vendita dei tuoi dati a terzi." },
    ],
    en: [
      { t: "Download & grant", d: "Install the app from Play Store, allow Health Connect access." },
      { t: "FitMesh reads it all", d: "Steps, heart rate, sleep, calories. In background, even overnight." },
      { t: "Your data is in the app", d: "Open FitMesh whenever you want to check it. No social accounts, no selling your data to third parties." },
    ],
    es: [
      { t: "Descarga y autoriza", d: "Instala la app desde Play Store y permite el acceso a Health Connect." },
      { t: "FitMesh lo lee todo", d: "Pasos, frecuencia cardíaca, sueño, calorías. En segundo plano, incluso de noche." },
      { t: "Tus datos están en la app", d: "Abre FitMesh cuando quieras consultarlos. Sin cuentas sociales, sin venta de tus datos a terceros." },
    ],
    de: [
      { t: "Herunterladen & erlauben", d: "App im Play Store installieren und Zugriff auf Health Connect erlauben." },
      { t: "FitMesh liest alles aus", d: "Schritte, Herzfrequenz, Schlaf, Kalorien – im Hintergrund, auch über Nacht." },
      { t: "Deine Daten sind in der App", d: "Öffne FitMesh, wenn du sie einsehen möchtest. Keine Social-Media-Konten, kein Verkauf deiner Daten an Dritte." },
    ],
    pt: [
      { t: "Transferir e autorizar", d: "Instala a app na Play Store e permite o acesso ao Health Connect." },
      { t: "O FitMesh lê tudo", d: "Passos, frequência cardíaca, sono, calorias. Em segundo plano, mesmo durante a noite." },
      { t: "Os teus dados estão na app", d: "Abre a FitMesh sempre que quiseres consultá-los. Sem contas sociais, sem venda dos teus dados a terceiros." },
    ],
    fr: [
      { t: "Téléchargez et autorisez", d: "Installez l'application depuis le Play Store, autorisez l'accès à Health Connect." },
      { t: "FitMesh récupère tout", d: "Pas, fréquence cardiaque, sommeil, calories. En arrière-plan, même la nuit." },
      { t: "Vos données sont dans l'application", d: "Ouvrez FitMesh quand vous voulez les consulter. Pas de compte social, aucune vente de vos données à des tiers." },
    ],
    pl: [
      { t: "Pobierz i zezwól", d: "Zainstaluj aplikację z Google Play i zezwól na dostęp do Health Connect." },
      { t: "FitMesh odczytuje wszystko", d: "Kroki, tętno, sen, kalorie. W tle, nawet w nocy." },
      { t: "Twoje dane są w aplikacji", d: "Otwórz FitMesh, kiedy chcesz je sprawdzić. Bez kont społecznościowych, bez sprzedaży Twoich danych stronom trzecim." },
    ],
    tr: [
      { t: "İndir ve izin ver", d: "Uygulamayı Play Store'dan yükleyin, Health Connect erişimine izin verin." },
      { t: "FitMesh hepsini okur", d: "Adım sayısı, nabız, uyku, kalori. Arka planda, gece boyunca bile." },
      { t: "Verileriniz uygulamada", d: "Kontrol etmek istediğinizde FitMesh'i açın. Sosyal hesap yok, verilerinizin üçüncü taraflara satışı yok." },
    ],
    nl: [
      { t: "Downloaden & toestaan", d: "Installeer de app via Play Store en geef toegang tot Health Connect." },
      { t: "FitMesh leest alles uit", d: "Stappen, hartslag, slaap, calorieën. Op de achtergrond, zelfs 's nachts." },
      { t: "Je gegevens staan in de app", d: "Open FitMesh wanneer je ze wilt bekijken. Geen social accounts, we verkopen je gegevens nooit aan derden." },
    ],
    ja: [
      { t: "ダウンロードして許可", d: "Playストアからアプリをインストールし、Health Connectへのアクセスを許可します。" },
      { t: "FitMeshがすべてを読み取る", d: "歩数、心拍数、睡眠、カロリー。バックグラウンドで、就寝中も。" },
      { t: "データはアプリの中に", d: "確認したいときにFitMeshアプリを開いてください。SNSアカウントは不要。データを第三者に販売することは一切ありません。" },
    ],
    ko: [
      { t: "다운로드 및 권한 허용", d: "Google Play 스토어에서 앱을 설치하고, Health Connect 접근을 허용하세요." },
      { t: "FitMesh가 전부 읽어옵니다", d: "걸음 수, 심박수, 수면, 칼로리까지. 백그라운드에서, 심지어 자는 동안에도." },
      { t: "데이터는 앱 안에 있습니다", d: "확인하고 싶을 때 FitMesh 앱을 여세요. 소셜 계정도 필요 없고, 당신의 데이터를 제3자에게 판매하지도 않습니다." },
    ],
    sv: [
      { t: "Ladda ner & godkänn", d: "Installera appen från Play Store, godkänn åtkomst till Health Connect." },
      { t: "FitMesh läser allt", d: "Steg, puls, sömn, kalorier. I bakgrunden, även över natten." },
      { t: "Din data finns i appen", d: "Öppna FitMesh när du vill kolla den. Inga sociala konton, vi säljer aldrig din data till tredje part." },
    ],
    da: [
      { t: "Download & giv adgang", d: "Installer appen fra Play Store, giv adgang til Health Connect." },
      { t: "FitMesh læser det hele", d: "Skridt, puls, søvn, kalorier. I baggrunden, også om natten." },
      { t: "Dine data er i appen", d: "Åbn FitMesh, når du vil tjekke dem. Ingen sociale konti, vi sælger aldrig dine data til tredjepart." },
    ],
    no: [
      { t: "Last ned og godkjenn", d: "Installer appen fra Play Store, og gi tilgang til Health Connect." },
      { t: "FitMesh leser alt", d: "Skritt, puls, søvn, kalorier. I bakgrunnen, også om natten." },
      { t: "Dataene dine er i appen", d: "Åpne FitMesh når du vil sjekke dem. Ingen sosiale kontoer, vi selger aldri dataene dine til tredjeparter." },
    ],
    fi: [
      { t: "Lataa ja hyväksy", d: "Asenna sovellus Google Play -kaupasta ja salli Health Connect -käyttöoikeus." },
      { t: "FitMesh lukee kaiken", d: "Askeleet, syke, uni, kalorit. Taustalla, myös yön yli." },
      { t: "Tietosi ovat sovelluksessa", d: "Avaa FitMesh, kun haluat tarkistaa ne. Ei sosiaalisen median tilejä, emme koskaan myy tietojasi kolmansille osapuolille." },
    ],
  } as LocalizedItems<StepItem[]>,

  integrationsKicker: {
    it: "Integrazioni",
    en: "Integrations",
    es: "Integraciones",
    de: "Integrationen",
    pt: "Integrações",
    fr: "Intégrations",
    pl: "Integracje",
    tr: "Entegrasyonlar",
    nl: "Integraties",
    ja: "連携",
    ko: "연동",
    sv: "Integrationer",
    da: "Integrationer",
    no: "Integrasjoner",
    fi: "Integraatiot",
  } satisfies Localized,

  integrationsHeading: {
    it: "Funziona con quello che hai già.",
    en: "Works with what you already have.",
    es: "Funciona con lo que ya tienes.",
    de: "Funktioniert mit dem, was du schon hast.",
    pt: "Funciona com o que já tens.",
    fr: "Compatible avec ce que vous avez déjà.",
    pl: "Działa z tym, co już masz.",
    tr: "Elindekiyle çalışır.",
    nl: "Werkt met wat je al hebt.",
    ja: "今使っているものと、そのままつながる。",
    ko: "지금 쓰는 기기와 바로 연동됩니다.",
    sv: "Fungerar med det du redan har.",
    da: "Fungerer med det, du allerede har.",
    no: "Fungerer med det du allerede har.",
    fi: "Toimii sen kanssa, mikä sinulla jo on.",
  } satisfies Localized,

  seeAll: {
    it: "Vedi tutte",
    en: "See all",
    es: "Ver todas",
    de: "Alle anzeigen",
    pt: "Ver tudo",
    fr: "Tout voir",
    pl: "Zobacz wszystkie",
    tr: "Tümünü gör",
    nl: "Bekijk alles",
    ja: "すべて見る",
    ko: "전체 보기",
    sv: "Se alla",
    da: "Se alle",
    no: "Se alle",
    fi: "Katso kaikki",
  } satisfies Localized,

  /**
   * Sprint P0.2 Fase 6 (2026-07-12): teaser sotto integrationsHeading, link a
   * /fitness-data-sync. Tradotto solo it/en/de/es (stesso scope della
   * landing, vedi FITNESS_DATA_SYNC_COMPLETE_LOCALES) — le altre locale
   * cadono su en via tl().
   */
  integrationsDashboardTeaser: {
    it: "Vuoi sapere cosa è live e cosa è ancora in sviluppo?",
    en: "Want to know what's live and what's still in development?",
    es: "¿Quieres saber qué está en vivo y qué sigue en desarrollo?",
    de: "Möchtest du wissen, was live ist und was sich noch in Entwicklung befindet?",
  } satisfies Localized,

  privacyPoints: {
    it: [
      { t: "Zero tracker pubblicitari", d: "I tuoi dati salute non alimentano nessun algoritmo pubblicitario. Niente profilazione." },
    ],
    en: [
      { t: "Zero ad trackers", d: "Your health data feeds no advertising algorithm. No cross-site tracking." },
    ],
    es: [
      { t: "Cero rastreadores publicitarios", d: "Tus datos de salud no alimentan ningún algoritmo publicitario. Sin perfilado." },
    ],
    de: [
      { t: "Keine Werbetracker", d: "Deine Gesundheitsdaten fließen in keinen Werbealgorithmus. Kein seitenübergreifendes Tracking." },
    ],
    pt: [
      { t: "Zero rastreadores publicitários", d: "Os teus dados de saúde não alimentam nenhum algoritmo publicitário. Sem rastreamento entre sites." },
    ],
    fr: [
      { t: "Zéro traceur publicitaire", d: "Vos données de santé n'alimentent aucun algorithme publicitaire. Pas de suivi entre sites." },
    ],
    pl: [
      { t: "Zero trackerów reklamowych", d: "Twoje dane zdrowotne nie zasilają żadnego algorytmu reklamowego. Bez śledzenia między witrynami." },
    ],
    tr: [
      { t: "Sıfır reklam izleyicisi", d: "Sağlık verileriniz hiçbir reklam algoritmasını beslemez. Siteler arası takip yok." },
    ],
    nl: [
      { t: "Geen advertentietrackers", d: "Je gezondheidsgegevens voeden geen advertentiealgoritme. Geen cross-site tracking." },
    ],
    ja: [
      { t: "広告トラッカーゼロ", d: "健康データが広告アルゴリズムに使われることはありません。クロスサイトトラッキングもありません。" },
    ],
    ko: [
      { t: "광고 트래커 없음", d: "건강 데이터가 광고 알고리즘에 쓰이지 않습니다. 교차 사이트 추적도 없습니다." },
    ],
    sv: [
      { t: "Inga annonsspårare", d: "Din hälsodata matar ingen annonsalgoritm. Ingen spårning mellan webbplatser." },
    ],
    da: [
      { t: "Ingen annoncetrackere", d: "Dine sundhedsdata fodrer ingen reklamealgoritme. Ingen tracking på tværs af sider." },
    ],
    no: [
      { t: "Ingen annonsesporing", d: "Helsedataene dine mater ingen annonsealgoritme. Ingen sporing på tvers av nettsteder." },
    ],
    fi: [
      { t: "Nolla mainosseurantaa", d: "Terveystietosi eivät ruoki yhtään mainosalgoritmia. Ei sivustojen välistä seurantaa." },
    ],
  } as LocalizedItems<PrivacyPoint[]>,

  orLabel: {
    it: "oppure",
    en: "or",
    es: "o",
    de: "oder",
    pt: "ou",
    fr: "ou",
    pl: "lub",
    tr: "veya",
    nl: "of",
    ja: "または",
    ko: "또는",
    sv: "eller",
    da: "eller",
    no: "eller",
    fi: "tai",
  } satisfies Localized,

  readMoreKicker: {
    it: "Approfondisci",
    en: "Read more",
    es: "Más información",
    de: "Weiterlesen",
    pt: "Ler mais",
    fr: "En savoir plus",
    pl: "Czytaj więcej",
    tr: "Daha Fazla Oku",
    nl: "Meer lezen",
    ja: "もっと読む",
    ko: "더 알아보기",
    sv: "Läs mer",
    da: "Læs mere",
    no: "Les mer",
    fi: "Lue lisää",
  } satisfies Localized,

  readMoreHeading: {
    it: "Guide e confronti per scegliere bene.",
    en: "Guides and comparisons to choose well.",
    es: "Guías y comparativas para elegir bien.",
    de: "Ratgeber und Vergleiche für die richtige Wahl.",
    pt: "Guias e comparações para escolheres bem.",
    fr: "Des guides et comparatifs pour bien choisir.",
    pl: "Poradniki i porównania, dzięki którym dobrze wybierzesz.",
    tr: "Doğru seçim için rehberler ve karşılaştırmalar.",
    nl: "Gidsen en vergelijkingen om de juiste keuze te maken.",
    ja: "賢く選ぶための、ガイドと比較記事。",
    ko: "현명하게 고르도록 돕는 가이드와 비교.",
    sv: "Guider och jämförelser för att välja rätt.",
    da: "Guider og sammenligninger, så du vælger rigtigt.",
    no: "Guider og sammenligninger som hjelper deg å velge riktig.",
    fi: "Oppaat ja vertailut oikean valinnan tueksi.",
  } satisfies Localized,

  allArticles: {
    it: "Tutti gli articoli",
    en: "All articles",
    es: "Todos los artículos",
    de: "Alle Artikel",
    pt: "Todos os artigos",
    fr: "Tous les articles",
    pl: "Wszystkie artykuły",
    tr: "Tüm yazılar",
    nl: "Alle artikelen",
    ja: "すべての記事",
    ko: "전체 글 보기",
    sv: "Alla artiklar",
    da: "Alle artikler",
    no: "Alle artikler",
    fi: "Kaikki artikkelit",
  } satisfies Localized,

  mainGuideLabel: {
    it: "Guida principale",
    en: "Main guide",
    es: "Guía principal",
    de: "Hauptratgeber",
    pt: "Guia principal",
    fr: "Guide principal",
    pl: "Główny poradnik",
    tr: "Ana rehber",
    nl: "Hoofdgids",
    ja: "メインガイド",
    ko: "대표 가이드",
    sv: "Huvudguide",
    da: "Hovedguide",
    no: "Hovedguide",
    fi: "Pääopas",
  } satisfies Localized,

  guideLabel: {
    it: "Guida",
    en: "Guide",
    es: "Guía",
    de: "Ratgeber",
    pt: "Guia",
    fr: "Guide",
    pl: "Poradnik",
    tr: "Rehber",
    nl: "Gids",
    ja: "ガイド",
    ko: "가이드",
    sv: "Guide",
    da: "Guide",
    no: "Guide",
    fi: "Opas",
  } satisfies Localized,

  readLabel: {
    it: "Leggi",
    en: "Read",
    es: "Leer",
    de: "Lesen",
    pt: "Ler",
    fr: "Lire",
    pl: "Czytaj",
    tr: "Oku",
    nl: "Lezen",
    ja: "読む",
    ko: "읽기",
    sv: "Läs",
    da: "Læs",
    no: "Les",
    fi: "Lue",
  } satisfies Localized,

} as const;
