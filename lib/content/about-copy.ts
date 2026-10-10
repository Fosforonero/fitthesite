import type { Localized } from "@/lib/blog/types";
import { PRICING_SECTION } from "@/lib/pricing-section";

/**
 * Copy di `/about` estratto dall'ex-helper `t(it, en, es, de, pt, fr)` (6
 * argomenti posizionali) in oggetti `Localized` tipizzati, con lo stesso
 * accessor `tl()` già usato altrove nel sito. Tutti i 15 locali sono
 * compilati (`ABOUT_TRANSLATED_LOCALES` in
 * `lib/content/static-page-locales.ts` riflette lo stesso set).
 */
export const ABOUT_COPY = {
  kicker: {
    it: "Chi siamo", en: "About", es: "Acerca de",
    de: "Über uns", pt: "Sobre nós", fr: "À propos",
    pl: "O nas", tr: "Hakkımızda", nl: "Over ons",
    ja: "概要", ko: "소개", sv: "Om", da: "Om", no: "Om", fi: "Tietoa",
  } satisfies Localized,

  jsonLdName: {
    it: "Cos'è FitMesh Sync", en: "About FitMesh Sync", es: "Qué es FitMesh Sync",
    de: "Was ist FitMesh Sync", pt: "O que é FitMesh Sync", fr: "Qu'est-ce que FitMesh Sync",
    pl: "O FitMesh Sync", tr: "FitMesh Sync Hakkında", nl: "Over FitMesh Sync",
    ja: "FitMesh Syncについて", ko: "FitMesh Sync 소개", sv: "Om FitMesh Sync",
    da: "Om FitMesh Sync", no: "Om FitMesh Sync", fi: "Tietoa FitMesh Syncistä",
  } satisfies Localized,

  /** <title> di /about — usato solo in generateMetadata, non renderizzato in pagina. */
  metaTitle: {
    it: "Cos'è FitMesh Sync e chi lo sviluppa",
    en: "About FitMesh Sync: what it is and who builds it",
    es: "Acerca de FitMesh Sync: datos de fitness juntos en iPhone y Android",
    de: "Über FitMesh Sync: Fitnessdaten vereint auf iPhone und Android",
    pt: "Sobre o FitMesh Sync: dados de fitness juntos no iPhone e Android",
    fr: "À propos de FitMesh Sync : vos données de fitness réunies sur iPhone et Android",
    pl: "O FitMesh Sync: Twoje dane fitness razem na iPhonie i Androidzie",
    tr: "FitMesh Sync Hakkında: Fitness verileriniz iPhone ve Android'de bir arada",
    nl: "Over FitMesh Sync: fitnessgegevens samen op iPhone en Android",
    ja: "FitMesh Syncについて：iPhoneとAndroidでフィットネスデータを一元化",
    ko: "FitMesh Sync 소개: iPhone과 Android에서 피트니스 데이터를 한곳에",
    sv: "Om FitMesh Sync: träningsdata samlad på iPhone och Android",
    da: "Om FitMesh Sync: træningsdata samlet på iPhone og Android",
    no: "Om FitMesh Sync: treningsdata samlet på iPhone og Android",
    fi: "Tietoja FitMesh Syncistä: kuntotiedot yhdessä iPhonella ja Androidilla",
  } satisfies Localized,

  /** meta description di /about — usato solo in generateMetadata, non renderizzato in pagina. */
  metaDescription: {
    it: "Chi sviluppa FitMesh Sync e cosa fa: un'app per iPhone e Android che riunisce per giorno i dati di Apple Salute, Health Connect o un anello Colmi compatibile.",
    en: "Who builds FitMesh Sync and what it does: an iPhone and Android app that combines, by day, data from Apple Health, Health Connect or a compatible Colmi ring.",
    es: "FitMesh Sync es una app para iPhone y Android que lee datos de Apple Salud, Health Connect o anillos Colmi compatibles y los reúne por día.",
    de: "FitMesh Sync ist eine iPhone- und Android-App, die Daten aus Apple Health, Health Connect oder kompatiblen Colmi-Ringen liest und tageweise zusammenführt.",
    pt: "O FitMesh Sync é uma app para iPhone e Android que lê dados do Apple Saúde, Health Connect ou anéis Colmi compatíveis e os reúne por dia.",
    fr: "FitMesh Sync est une app iPhone et Android qui lit les données d'Apple Santé, Health Connect ou de bagues Colmi compatibles et les regroupe par jour.",
    pl: "FitMesh Sync to aplikacja na iPhone'a i Androida, która odczytuje dane z Apple Health, Health Connect lub zgodnych pierścieni Colmi i łączy je dzień po dniu.",
    tr: "FitMesh Sync, Apple Health, Health Connect veya uyumlu Colmi yüzüklerinden verileri okuyan ve gün bazında birleştiren bir iPhone ve Android uygulamasıdır.",
    nl: "FitMesh Sync is een iPhone- en Android-app die gegevens leest uit Apple Gezondheid, Health Connect of compatibele Colmi-ringen en deze per dag samenbrengt.",
    ja: "FitMesh Syncは、Appleヘルスケア、Health Connect、または対応するColmiリングからデータを読み取り、日ごとにまとめるiPhoneおよびAndroidアプリです。",
    ko: "FitMesh Sync는 Apple 건강, Health Connect 또는 호환 Colmi 링에서 데이터를 읽어와 날마다 모아주는 iPhone 및 Android 앱입니다.",
    sv: "FitMesh Sync är en iPhone- och Android-app som läser data från Apple Hälsa, Health Connect eller kompatibla Colmi-ringar och samlar den per dag.",
    da: "FitMesh Sync er en iPhone- og Android-app, der læser data fra Apple Sundhed, Health Connect eller kompatible Colmi-ringe og samler dem pr. dag.",
    no: "FitMesh Sync er en iPhone- og Android-app som leser data fra Apple Helse, Health Connect eller kompatible Colmi-ringer og samler dem per dag.",
    fi: "FitMesh Sync on iPhone- ja Android-sovellus, joka lukee tietoja Apple Terveydestä, Health Connectista tai yhteensopivista Colmi-sormuksista ja kokoaa ne päiväkohtaisesti.",
  } satisfies Localized,

  heroTitlePrefix: {
    it: "Un'app per i tuoi dati fitness, ", en: "An app for your fitness data, ",
    es: "Tus datos de fitness juntos, ",
    de: "Deine Fitnessdaten zusammen, ",
    fr: "Vos données de fitness réunies, ",
    pt: "Os teus dados de fitness juntos, ",
    pl: "Twoje dane fitness razem, ",
    tr: "Fitness verileriniz bir arada, ",
    nl: "Je fitnessgegevens samen, ",
    ja: "フィットネスデータを一元管理、",
    ko: "피트니스 데이터를 한곳에, ",
    sv: "Din träningsdata samlad, ",
    da: "Dine træningsdata samlet, ",
    no: "Treningsdataene dine samlet, ",
    fi: "Kuntotietosi yhdessä, ",
  } satisfies Localized,

  heroTitleAccent: {
    it: "su iPhone e Android.", en: "on iPhone and Android.",
    es: "incluso cuando cambias de dispositivo.",
    de: "auch wenn du das Gerät wechselst.",
    fr: "même lorsque vous changez d'appareil.",
    pt: "mesmo quando mudas de dispositivo.",
    pl: "nawet gdy zmieniasz urządzenie.",
    tr: "cihazınızı değiştirdiğinizde bile.",
    nl: "ook als je van apparaat wisselt.",
    ja: "デバイスを変更したときでも。",
    ko: "기기를 변경하더라도 함께.",
    sv: "även när du byter enhet.",
    da: "selv når du skifter enhed.",
    no: "selv når du bytter enhet.",
    fi: "myös laitetta vaihtaessasi.",
  } satisfies Localized,

  heroDescription: {
    it: "FitMesh Sync legge i dati che orologi, anelli e app fitness salvano in Apple Salute o in Health Connect, con il tuo permesso, e su iPhone e Android si collega via Bluetooth a un anello Colmi compatibile. Riunisce i dati per giorno, con un solo dispositivo o con più di uno. Se usi più telefoni con lo stesso account, ognuno mostra anche i dati già sincronizzati dagli altri.",
    en: "FitMesh Sync reads the data that watches, rings and fitness apps save to Apple Health or Health Connect, with your permission, and on both iPhone and Android it connects over Bluetooth to a compatible Colmi ring. It brings the data together by day, with one device or several. If you use more than one phone with the same account, each one also shows the data the others have already synced.",
    es: "FitMesh Sync es una app independiente para iPhone y Android creada para reunir en un único lugar las métricas que tus dispositivos ya registran.",
    de: "FitMesh Sync ist eine unabhängige App für iPhone und Android, die entwickelt wurde, um die von deinen Geräten erfassten Metriken an einem Ort zu bündeln.",
    pt: "O FitMesh Sync é uma app independente para iPhone e Android concebida para reunir num só lugar as métricas registadas pelos teus dispositivos.",
    fr: "FitMesh Sync est une application indépendante pour iPhone et Android créée pour regrouper en un seul endroit les données enregistrées par vos appareils.",
    pl: "FitMesh Sync to niezależna aplikacja na iPhone'a i Androida, stworzona w celu gromadzenia w jednym miejscu wskaźników rejestrowanych przez Twoje urządzenia.",
    tr: "FitMesh Sync, cihazlarınızın kaydettiği ölçümleri tek bir yerde toplamak amacıyla geliştirilmiş bağımsız bir iPhone ve Android uygulamasıdır.",
    nl: "FitMesh Sync is een onafhankelijke app voor iPhone en Android, ontworpen om meetwaarden van je apparaten op één plek samen te brengen.",
    ja: "FitMesh Syncは、お使いのデバイスが記録した指標を1か所に集約するために作成された、iPhoneおよびAndroid向けの独立系アプリです。",
    ko: "FitMesh Sync는 다양한 기기에서 기록한 측정값을 한곳에 모으기 위해 개발된 독립적인 iPhone 및 Android 앱입니다.",
    sv: "FitMesh Sync är en oberoende app för iPhone och Android skapad för att samla de mätvärden dina enheter registrerar på ett ställe.",
    da: "FitMesh Sync er en uafhængig app til iPhone og Android, skabt til at samle de målinger, dine enheder registrerer, på ét sted.",
    no: "FitMesh Sync er en uavhengig app for iPhone og Android laget for å samle målingene enhetene dine registrerer på ett sted.",
    fi: "FitMesh Sync on itsenäinen sovellus iPhonelle ja Androidille, joka on luotu kokoamaan laitteidesi tallentamat tiedot yhteen paikkaan.",
  } satisfies Localized,

  featuresHeading: {
    it: "Cosa fa, in concreto", en: "What it actually does", es: "Qué hace, en concreto",
    de: "Was es konkret tut", pt: "O que ele faz, na prática", fr: "Ce qu'il fait concrètement",
    pl: "Co właściwie robi", tr: "Aslında ne yapıyor", nl: "Wat het écht doet",
    ja: "実際にできること", ko: "실제로 하는 일", sv: "Vad den faktiskt gör",
    da: "Hvad appen faktisk gør", no: "Hva den faktisk gjør", fi: "Mitä se oikeasti tekee",
  } satisfies Localized,

  featuresIntro: {
    it: "FitMesh legge le metriche che autorizzi: su iPhone da Apple Salute, su Android da Health Connect e, su entrambi, via Bluetooth da un anello Colmi compatibile. Tra queste:",
    en: "FitMesh reads the metrics you allow: on iPhone from Apple Health, on Android from Health Connect and, on both, over Bluetooth from a compatible Colmi ring. These include:",
    es: "Funciones disponibles en la app móvil:",
    de: "In der mobilen App verfügbare Funktionen:",
    pt: "Funcionalidades disponíveis na app móvel:",
    fr: "Fonctionnalités disponibles dans l'application mobile :",
    pl: "Funkcje dostępne w aplikacji mobilnej:",
    tr: "Mobil uygulamada bulunan özellikler:",
    nl: "Beschikbare functies in de mobiele app:",
    ja: "モバイルアプリで利用可能な機能：",
    ko: "모바일 앱에서 제공되는 주요 기능:",
    sv: "Funktioner tillgängliga i mobilappen:",
    da: "Funktioner tilgængelige i mobilappen:",
    no: "Funksjoner tilgjengelige i mobilappen:",
    fi: "Mobiilisovelluksessa saatavilla olevat ominaisuudet:",
  } satisfies Localized,

  featureItems: [
    {
      it: "Passi e distanza giornaliera", en: "Daily steps and distance", es: "Pasos y distancia diaria",
      de: "Schritte und tägliche Distanz", pt: "Passos e distância diária", fr: "Pas et distance quotidienne",
      pl: "Dzienne kroki i dystans", tr: "Günlük adım sayısı ve mesafe", nl: "Dagelijkse stappen en afstand",
      ja: "1日の歩数と距離", ko: "하루 걸음 수와 이동 거리", sv: "Dagliga steg och distans",
      da: "Daglige skridt og distance", no: "Skritt og distanse per dag", fi: "Päivittäiset askeleet ja matka",
    } satisfies Localized,
    {
      it: "Frequenza cardiaca (media, range, riposo)", en: "Heart rate (avg, range, resting)", es: "Frecuencia cardíaca (media, rango, reposo)",
      de: "Herzfrequenz (Durchschnitt, Bereich, Ruhewert)", pt: "Frequência cardíaca (média, intervalo, repouso)", fr: "Fréquence cardiaque (moyenne, plage, repos)",
      pl: "Tętno (średnie, zakres, spoczynkowe)", tr: "Kalp atış hızı (ortalama, aralık, dinlenme)", nl: "Hartslag (gemiddeld, bereik, in rust)",
      ja: "心拍数(平均・範囲・安静時)", ko: "심박수(평균, 범위, 안정 시)", sv: "Puls (medel, intervall, vilopuls)",
      da: "Puls (gennemsnit, interval, hvilepuls)", no: "Puls (snitt, spenn, hvilepuls)", fi: "Syke (keskiarvo, vaihteluväli, leposyke)",
    } satisfies Localized,
    {
      it: "Sonno con fasi (REM, profondo, leggero, sveglio)", en: "Sleep with stages (REM, deep, light, awake)", es: "Sueño con fases (REM, profundo, ligero, despierto)",
      de: "Schlaf mit Phasen (REM, Tiefschlaf, Leichtschlaf, wach)", pt: "Sono com fases (REM, profundo, leve, acordado)", fr: "Sommeil avec phases (REM, profond, léger, éveillé)",
      pl: "Sen z fazami (REM, głęboki, lekki, czuwanie)", tr: "Evrelere ayrılmış uyku (REM, derin, hafif, uyanık)", nl: "Slaap met fases (REM, diep, licht, wakker)",
      ja: "睡眠ステージ(レム睡眠・深い眠り・浅い眠り・覚醒)", ko: "수면 단계별 기록(REM, 깊은 수면, 얕은 수면, 각성)", sv: "Sömn med stadier (REM, djupsömn, lätt sömn, vaken)",
      da: "Søvn med faser (REM, dyb, let, vågen)", no: "Søvn med stadier (REM, dyp, lett, våken)", fi: "Uni vaiheineen (REM, syvä, kevyt, valveilla)",
    } satisfies Localized,
    {
      it: "Calorie attive e basali", en: "Active and basal calories", es: "Calorías activas y basales",
      de: "Aktive Kalorien und Grundumsatz-Kalorien", pt: "Calorias ativas e basais", fr: "Calories actives et de base",
      pl: "Kalorie aktywne i podstawowe", tr: "Aktif ve bazal kalori", nl: "Actieve en basale calorieën",
      ja: "アクティブカロリーと基礎代謝カロリー", ko: "활동 칼로리와 기초대사량", sv: "Aktiva och basala kalorier",
      da: "Aktive og basale kalorier", no: "Aktive og basale kalorier", fi: "Aktiiviset ja perusaineenvaihdunnan kalorit",
    } satisfies Localized,
    {
      it: "SpO₂ (se supportato)", en: "SpO₂ (when supported)", es: "SpO₂ (si es compatible)",
      de: "SpO₂ (wenn unterstützt)", pt: "SpO₂ (quando disponível)", fr: "SpO₂ (si pris en charge)",
      pl: "SpO₂ (jeśli obsługiwane)", tr: "SpO₂ (destekleniyorsa)", nl: "SpO₂ (indien ondersteund)",
      ja: "SpO₂(対応時)", ko: "SpO₂(지원되는 경우)", sv: "SpO₂ (när det stöds)",
      da: "SpO₂ (når understøttet)", no: "SpO₂ (der det støttes)", fi: "SpO₂ (jos tuettu)",
    } satisfies Localized,
    {
      it: "HRV e dati allenamento dettagliati", en: "HRV and detailed workout data", es: "HRV y datos detallados de entrenamientos",
      de: "HRV und detaillierte Trainingsdaten", pt: "HRV e dados detalhados de treinos", fr: "HRV et données détaillées d'entraînement",
      pl: "HRV i szczegółowe dane treningowe", tr: "HRV ve ayrıntılı antrenman verileri", nl: "HRV en gedetailleerde trainingsgegevens",
      ja: "HRVと詳細なワークアウトデータ", ko: "HRV와 상세 운동 데이터", sv: "HRV och detaljerad träningsdata",
      da: "HRV og detaljerede træningsdata", no: "HRV og detaljerte treningsdata", fi: "HRV ja yksityiskohtaiset harjoitustiedot",
    } satisfies Localized,
    {
      it: "Peso e composizione corporea", en: "Weight and body composition", es: "Peso y composición corporal",
      de: "Gewicht und Körperzusammensetzung", pt: "Peso e composição corporal", fr: "Poids et composition corporelle",
      pl: "Waga i skład ciała", tr: "Kilo ve vücut kompozisyonu", nl: "Gewicht en lichaamssamenstelling",
      ja: "体重と体組成", ko: "체중과 체성분", sv: "Vikt och kroppssammansättning",
      da: "Vægt og kropssammensætning", no: "Vekt og kroppssammensetning", fi: "Paino ja kehonkoostumus",
    } satisfies Localized,
    {
      it: "Piani saliti e dislivello", en: "Floors climbed and elevation gain", es: "Pisos subidos y desnivel acumulado",
      de: "Gekletterte Etagen und Höhenunterschied", pt: "Andares subidos e ganho de altitude", fr: "Étages montés et dénivelé positif",
      pl: "Pokonane piętra i przewyższenie", tr: "Çıkılan kat sayısı ve yükselti kazancı", nl: "Beklommen verdiepingen en hoogtemeters",
      ja: "上った階数と獲得標高", ko: "오른 층수와 고도 상승", sv: "Klättrade våningar och höjdökning",
      da: "Etager besteget og højdestigning", no: "Etasjer klatret og høydemeter", fi: "Nousukerrokset ja korkeusnousu",
    } satisfies Localized,
  ] as Localized[],

  serverChoice: {
    it: "I tuoi dati di salute sono sincronizzati sul backend cloud gestito da FitMesh (Supabase, infrastruttura UE). Un'opzione di self-hosting esiste a livello tecnico nell'app, ma oggi non è un percorso self-service per gli utenti — nessuna configurazione manuale di server/VPS/NAS è oggi supportata.",
    en: "Your health data syncs to FitMesh's managed cloud backend (Supabase, EU infrastructure). A self-hosting option exists at a technical level in the app, but today it isn't a self-service path for users — manual server/VPS/NAS configuration isn't supported yet.",
    es: "Tus datos de salud se sincronizan con el backend en la nube gestionado por FitMesh (Supabase, infraestructura en la UE). Existe una opción de self-hosting a nivel técnico en la app, pero hoy no es un camino de autoservicio para los usuarios: la configuración manual de servidor/VPS/NAS aún no es compatible.",
    de: "Deine Gesundheitsdaten werden mit dem von FitMesh verwalteten Cloud-Backend synchronisiert (Supabase, EU-Infrastruktur). Eine Self-Hosting-Option existiert technisch in der App, ist aber heute kein Self-Service-Weg für Nutzer — eine manuelle Server-/VPS-/NAS-Konfiguration wird noch nicht unterstützt.",
    pt: "Seus dados de saúde são sincronizados com o backend em nuvem gerenciado pela FitMesh (Supabase, infraestrutura na UE). Existe uma opção de self-hosting a nível técnico no app, mas hoje não é um caminho self-service para os usuários — a configuração manual de servidor/VPS/NAS ainda não é suportada.",
    fr: "Vos données de santé sont synchronisées avec le backend cloud géré par FitMesh (Supabase, infrastructure UE). Une option de self-hosting existe techniquement dans l'app, mais ce n'est pas aujourd'hui un parcours en libre-service pour les utilisateurs — la configuration manuelle de serveur/VPS/NAS n'est pas encore prise en charge.",
    pl: "Twoje dane zdrowotne są synchronizowane z zarządzanym przez FitMesh backendem w chmurze (Supabase, infrastruktura UE). Opcja self-hostingu istnieje na poziomie technicznym w aplikacji, ale dziś nie jest ścieżką samoobsługową dla użytkowników — ręczna konfiguracja serwera/VPS/NAS nie jest jeszcze wspierana.",
    tr: "Sağlık verileriniz FitMesh tarafından yönetilen bulut arka ucuna (Supabase, AB altyapısı) senkronize edilir. Uygulamada teknik düzeyde bir self-hosting seçeneği bulunur, ancak bugün kullanıcılar için bir self-servis yolu değildir — manuel sunucu/VPS/NAS yapılandırması henüz desteklenmemektedir.",
    nl: "Je gezondheidsgegevens worden gesynchroniseerd met de door FitMesh beheerde cloud-backend (Supabase, EU-infrastructuur). Er bestaat een self-hosting-optie op technisch niveau in de app, maar dat is vandaag geen self-service-pad voor gebruikers — handmatige server-/VPS-/NAS-configuratie wordt nog niet ondersteund.",
    ja: "あなたの健康データはFitMeshが管理するクラウドバックエンド(Supabase、EUインフラ)に同期されます。アプリには技術的なレベルでセルフホスティングのオプションが存在しますが、現時点ではユーザー向けのセルフサービス機能ではありません — サーバー/VPS/NASの手動設定は現在サポートされていません。",
    ko: "당신의 건강 데이터는 FitMesh가 관리하는 클라우드 백엔드(Supabase, EU 인프라)에 동기화됩니다. 앱에는 기술적 수준의 셀프 호스팅 옵션이 존재하지만, 현재는 사용자를 위한 셀프 서비스 경로가 아닙니다 — 수동 서버/VPS/NAS 구성은 아직 지원되지 않습니다.",
    sv: "Din hälsodata synkroniseras till FitMeshs hanterade molnbackend (Supabase, EU-infrastruktur). Ett self-hosting-alternativ finns på teknisk nivå i appen, men är idag inte en self-service-väg för användare — manuell server-/VPS-/NAS-konfiguration stöds inte än.",
    da: "Dine sundhedsdata synkroniseres til FitMeshs administrerede cloud-backend (Supabase, EU-infrastruktur). Der findes en self-hosting-mulighed på teknisk niveau i appen, men det er i dag ikke en selvbetjeningsvej for brugere — manuel server-/VPS-/NAS-konfiguration understøttes endnu ikke.",
    no: "Helsedataene dine synkroniseres til FitMeshs administrerte skybackend (Supabase, EU-infrastruktur). Et alternativ for self-hosting finnes på teknisk nivå i appen, men er i dag ikke en selvbetjeningsvei for brukere — manuell server-/VPS-/NAS-konfigurasjon støttes ikke ennå.",
    fi: "Terveystietosi synkronoidaan FitMeshin hallinnoimaan pilvipalvelimeen (Supabase, EU-infrastruktuuri). Sovelluksessa on teknisellä tasolla self-hosting-vaihtoehto, mutta se ei tänään ole itsepalvelupolku käyttäjille — manuaalista palvelin-/VPS-/NAS-määritystä ei vielä tueta.",
  } satisfies Localized,

  devicesHeading: {
    it: "Quali wearable funzionano", en: "Which wearables work", es: "Qué wearables son compatibles",
    de: "Welche Wearables funktionieren", pt: "Quais wearables são compatíveis", fr: "Quels appareils connectés fonctionnent",
    pl: "Które urządzenia są obsługiwane", tr: "Hangi cihazlar destekleniyor", nl: "Welke wearables werken",
    ja: "対応ウェアラブル", ko: "지원되는 웨어러블 기기", sv: "Vilka wearables fungerar",
    da: "Hvilke wearables virker", no: "Hvilke smartklokker fungerer", fi: "Mitkä puettavat laitteet toimivat",
  } satisfies Localized,

  devicesIntro: {
    it: "Funzionano i dispositivi che scrivono i propri dati in Health Connect (Android) o in Apple Salute (iOS), per i tipi di dato che FitMesh legge. Alcuni esempi:",
    en: "Devices work when they write their data to Health Connect (Android) or Apple Health (iOS), for the data types FitMesh reads. Some examples:",
    es: "Dispositivos y plataformas compatibles a través de Apple Salud, Health Connect o Bluetooth:",
    de: "Kompatible Geräte und Plattformen über Apple Health, Health Connect oder Bluetooth:",
    pt: "Dispositivos e plataformas compatíveis através do Apple Saúde, Health Connect ou Bluetooth:",
    fr: "Appareils et plateformes compatibles via Apple Santé, Health Connect ou Bluetooth :",
    pl: "Zgodne urządzenia i platformy za pośrednictwem Apple Health, Health Connect lub Bluetooth:",
    tr: "Apple Health, Health Connect veya Bluetooth aracılığıyla uyumlu cihazlar ve platformlar:",
    nl: "Compatibele apparaten en platforms via Apple Gezondheid, Health Connect of Bluetooth:",
    ja: "Appleヘルスケア、Health Connect、またはBluetooth経由の対応デバイスとプラットフォーム：",
    ko: "Apple 건강, Health Connect 또는 Bluetooth를 통한 호환 기기 및 플랫폼:",
    sv: "Kompatibla enheter och plattformar via Apple Hälsa, Health Connect eller Bluetooth:",
    da: "Kompatible enheder og platforme via Apple Sundhed, Health Connect eller Bluetooth:",
    no: "Kompatible enheter og plattformer via Apple Helse, Health Connect eller Bluetooth:",
    fi: "Yhteensopivat laitteet ja alustat Apple Terveyden, Health Connectin tai Bluetoothin kautta:",
  } satisfies Localized,

  nativelySupported: {
    it: "Supportati nativamente", en: "Natively supported", es: "Compatibles de forma nativa",
    de: "Nativ unterstützt", pt: "Compatíveis de forma nativa", fr: "Pris en charge nativement",
    pl: "Obsługiwane natywnie", tr: "Doğrudan destekleniyor", nl: "Native ondersteund",
    ja: "ネイティブ対応", ko: "네이티브 지원", sv: "Stöds nativt",
    da: "Understøttes nativt", no: "Native støtte", fi: "Natiivisti tuettu",
  } satisfies Localized,

  ouraDirectApi: {
    it: "Oura (integrazione indiretta via piattaforma salute del telefono)", en: "Oura (indirect integration via phone health platform)", es: "Oura (integración indirecta vía plataforma de salud del teléfono)",
    de: "Oura (indirekte Integration über die Gesundheitsplattform des Telefons)", pt: "Oura (integração indireta via plataforma de saúde do telemóvel)", fr: "Oura (intégration indirecte via la plateforme santé du téléphone)",
    pl: "Oura (pośrednia integracja za pośrednictwem platformy zdrowotnej telefonu)", tr: "Oura (telefon sağlık platformu üzerinden dolaylı entegrasyon)", nl: "Oura (indirecte integratie via gezondheidsplatform van de telefoon)",
    ja: "Oura (スマートフォンのヘルスケアプラットフォーム経由の間接連携)", ko: "Oura (스마트폰 건강 플랫폼을 통한 간접 연동)", sv: "Oura (indirekt integration via telefonens hälsoplattform)",
    da: "Oura (indirekte integration via telefonens sundhedsplatform)", no: "Oura (indirekte integrasjon via telefonens helseplattform)", fi: "Oura (epäsuora integraatio puhelimen terveysalustan kautta)",
  } satisfies Localized,

  garminDirectApi: {
    it: "Garmin API diretta per Body Battery e metriche avanzate", en: "Garmin direct API for Body Battery and advanced metrics", es: "API directa de Garmin para Body Battery y métricas avanzadas",
    de: "Garmin direkte API für Body Battery und erweiterte Metriken", pt: "API direta Garmin para Body Battery e métricas avanzadas", fr: "API directe Garmin pour Body Battery et métriques avancées",
    pl: "Bezpośrednie API Garmin dla Body Battery i zaawansowanych metryk", tr: "Body Battery ve gelişmiş metrikler için doğrudan Garmin API", nl: "Directe Garmin API voor Body Battery en geavanceerde metrieken",
    ja: "Body Battery および高度な指標向けの Garmin 直接 API", ko: "Body Battery 및 고급 지표를 위한 Garmin 직접 API", sv: "Garmin direkt-API för Body Battery och avancerade mätvärden",
    da: "Garmin direkte API til Body Battery og avancerede målinger", no: "Garmin direkte API for Body Battery og avanserte målinger", fi: "Garmin suora API Body Batterylle ja edistyneille mittauksille",
  } satisfies Localized,

  fitbitHistoricalGps: {
    it: "Fitbit (integrazione via Health Connect o Apple Salute)", en: "Fitbit (integration via Health Connect or Apple Health)", es: "Fitbit (integración vía Health Connect o Apple Health)",
    de: "Fitbit (Integration über Health Connect oder Apple Health)", pt: "Fitbit (integração via Health Connect ou Apple Health)", fr: "Fitbit (intégration via Health Connect ou Apple Health)",
    pl: "Fitbit (integracja przez Health Connect lub Apple Health)", tr: "Fitbit (Health Connect veya Apple Health üzerinden entegrasyon)", nl: "Fitbit (integratie via Health Connect of Apple Health)",
    ja: "Fitbit (Health Connect または Apple Health 経由の連携)", ko: "Fitbit (Health Connect 또는 Apple Health 연동)", sv: "Fitbit (integration via Health Connect eller Apple Health)",
    da: "Fitbit (integration via Health Connect eller Apple Health)", no: "Fitbit (integrasjon via Health Connect eller Apple Health)", fi: "Fitbit (integraatio Health Connectin tai Apple Healthin kautta)",
  } satisfies Localized,

  otherConnections: {
    it: "Altre connessioni e anelli supportati", en: "Other connections and supported rings", es: "Otras conexiones y anillos compatibles",
    de: "Weitere Verbindungen und unterstützte Ringe", pt: "Outras conexões e anéis compatíveis", fr: "Autres connexions et bagues prises en charge",
    pl: "Inne połączenia i obsługiwane pierścienie", tr: "Diğer bağlantılar ve desteklenen yüzükler", nl: "Andere verbindingen en ondersteunde ringen",
    ja: "その他の接続および対応リング", ko: "기타 연결 및 지원되는 링", sv: "Andra anslutningar och stödda ringar",
    da: "Andre forbindelser og understøttede ringe", no: "Andre tilkoblinger og støttede ringer", fi: "Muut yhteydet ja tuetut sormukset",
  } satisfies Localized,

  colmiRingBluetooth: {
    it: "Anelli Colmi (R02, R06) via Bluetooth diretto", en: "Colmi rings (R02, R06) via direct Bluetooth", es: "Anillos Colmi (R02, R06) vía Bluetooth directo",
    de: "Colmi-Ringe (R02, R06) über direktes Bluetooth", pt: "Anéis Colmi (R02, R06) via Bluetooth direto", fr: "Bagues Colmi (R02, R06) via Bluetooth direct",
    pl: "Pierścienie Colmi (R02, R06) przez bezpośredni Bluetooth", tr: "Doğrudan Bluetooth ile Colmi yüzükleri (R02, R06)", nl: "Colmi-ringen (R02, R06) via directe Bluetooth",
    ja: "直接Bluetooth接続のColmiリング（R02、R06）", ko: "블루투스 직접 연결 Colmi 링 (R02, R06)", sv: "Colmi-ringar (R02, R06) via direkt Bluetooth",
    da: "Colmi-ringe (R02, R06) via direkte Bluetooth", no: "Colmi-ringer (R02, R06) via direkte Bluetooth", fi: "Colmi-sormukset (R02, R06) suoralla Bluetooth-yhteydellä",
  } satisfies Localized,

  stravaLimitedAccess: {
    it: "Strava via OAuth (accesso limitato)", en: "Strava via OAuth (limited access)", es: "Strava vía OAuth (acceso limitado)",
    de: "Strava über OAuth (eingeschränkter Zugriff)", pt: "Strava via OAuth (acesso limitado)", fr: "Strava via OAuth (accès limité)",
    pl: "Strava przez OAuth (ograniczony dostęp)", tr: "OAuth ile Strava (kısıtlı erişim)", nl: "Strava via OAuth (beperkte toegang)",
    ja: "OAuth経由のStrava（限定アクセス）", ko: "OAuth 연동 Strava (제한된 접근)", sv: "Strava via OAuth (begränsad åtkomst)",
    da: "Strava via OAuth (begrænset adgang)", no: "Strava via OAuth (begrenset tilgang)", fi: "Strava OAuthin kautta (rajoitettu pääsy)",
  } satisfies Localized,

  seeAllIntegrations: {
    it: "Elenco completo e dettagli su /integrations", en: "Full list and details on /integrations", es: "Listado completo y detalles en /integrations",
    de: "Vollständige Liste und Details auf /integrations", pt: "Lista completa e detalhes em /integrations", fr: "Liste complète et détails sur /integrations",
    pl: "Pełna lista i szczegóły na /integrations", tr: "Tüm liste ve ayrıntılar /integrations sayfasında", nl: "Volledige lijst en details op /integrations",
    ja: "完全なリストと詳細は /integrations を参照", ko: "전체 목록 및 세부 정보는 /integrations 참조", sv: "Fullständig lista och detaljer på /integrations",
    da: "Fuld liste og detaljer på /integrations", no: "Fullstendig liste og detaljer på /integrations", fi: "Koko lista ja tiedot sivulla /integrations",
  } satisfies Localized,

  upToDateListPrefix: {
    it: "Lista aggiornata e dettagli su ", en: "Up-to-date list and details on ", es: "Lista actualizada y detalles en ",
    de: "Aktuelle Liste und Details auf ", pt: "Lista atualizada e detalhes em ", fr: "Liste à jour et détails sur ",
    pl: "Aktualna lista i szczegóły na stronie ", tr: "Güncel liste ve ayrıntılar için ", nl: "Actuele lijst en details op ",
    ja: "最新のリストと詳細は", ko: "최신 목록과 자세한 내용은 ", sv: "Aktuell lista och detaljer på ",
    da: "Opdateret liste og detaljer på ", no: "Oppdatert liste og detaljer på ", fi: "Ajantasainen lista ja lisätiedot osoitteessa ",
  } satisfies Localized,

  privacyHeading: {
    it: "Privacy e controllo dei dati", en: "Privacy and data control", es: "Privacidad y control de datos",
    de: "Datenschutz und Datenkontrolle", pt: "Privacidade e controlo dos dados", fr: "Confidentialité et contrôle des données",
    pl: "Prywatność i kontrola danych", tr: "Gizlilik ve veri kontrolü", nl: "Privacy en controle over data",
    ja: "プライバシーとデータ管理", ko: "개인정보와 데이터 관리", sv: "Integritet och datakontroll",
    da: "Privatliv og datakontrol", no: "Personvern og datakontroll", fi: "Yksityisyys ja tiedonhallinta",
  } satisfies Localized,

  privacyBody1: {
    it: "Il sito usa Google Analytics 4 solo dopo che lo accetti nel banner dei cookie, e puoi cambiare la scelta da «Preferenze cookie» in fondo alla pagina.",
    en: "The website uses Google Analytics 4 only after you accept it in the cookie banner, and you can change your choice from “Cookie preferences” at the bottom of the page.",
    es: "El sitio web usa Google Analytics 4 solo después de que lo aceptes en el banner de cookies, y puedes cambiar tu elección desde «Preferencias de cookies» al pie de la página.",
    de: "Die Website nutzt Google Analytics 4 erst, nachdem du es im Cookie-Banner akzeptiert hast. Deine Wahl kannst du unter „Cookie-Einstellungen“ am Seitenende ändern.",
    pt: "O site usa o Google Analytics 4 somente depois que você o aceita no banner de cookies, e você pode mudar sua escolha em “Preferências de cookies” no rodapé da página.",
    fr: "Le site n'utilise Google Analytics 4 qu'après votre accord dans le bandeau des cookies, et vous pouvez modifier votre choix via « Paramètres des cookies » en bas de page.",
    pl: "Strona korzysta z Google Analytics 4 dopiero po Twojej zgodzie w banerze cookie, a wybór możesz zmienić przyciskiem „Ustawienia plików cookie” na dole strony.",
    tr: "Web sitesi Google Analytics 4'ü yalnızca siz çerez bildiriminde onay verdikten sonra kullanır; seçiminizi sayfanın altındaki “Çerez tercihleri” bağlantısından değiştirebilirsiniz.",
    nl: "De website gebruikt Google Analytics 4 pas nadat je dat in de cookiebanner hebt geaccepteerd, en je kunt je keuze wijzigen via ‘Cookievoorkeuren’ onderaan de pagina.",
    ja: "ウェブサイトでは、Cookieバナーで同意した場合にのみGoogle Analytics 4を使用します。選択はページ下部の「Cookieの設定」から変更できます。",
    ko: "웹사이트는 쿠키 배너에서 동의한 경우에만 Google Analytics 4를 사용하며, 선택은 페이지 하단의 '쿠키 설정'에서 변경할 수 있습니다.",
    sv: "Webbplatsen använder Google Analytics 4 först när du har godkänt det i cookiebannern, och du kan ändra ditt val via ”Cookieinställningar” längst ned på sidan.",
    da: "Hjemmesiden bruger først Google Analytics 4, når du har accepteret det i cookiebanneret, og du kan ændre dit valg via »Cookieindstillinger« nederst på siden.",
    no: "Nettstedet bruker Google Analytics 4 først når du har godtatt det i cookiebanneret, og du kan endre valget ditt under «Cookie-innstillinger» nederst på siden.",
    fi: "Sivusto käyttää Google Analytics 4:ää vasta, kun hyväksyt sen evästebannerissa, ja voit muuttaa valintaasi sivun alalaidan kohdasta ”Evästeasetukset”.",
  } satisfies Localized,

  privacyBody2: {
    it: "Account: una sola email per il login (magic link Supabase oppure email/password). Nessun social login forzato.",
    en: "Account: one email for login (Supabase magic link or email/password). No forced social login.",
    es: "Cuenta: un solo correo para iniciar sesión (enlace mágico o correo y contraseña). Sin inicio de sesión social obligatorio.",
    de: "Konto: eine einzige E-Mail für die Anmeldung (Supabase Magic Link oder E-Mail/Passwort). Kein erzwungenes Social-Login.",
    pt: "Conta: um único e-mail para fazer login (magic link do Supabase ou e-mail/senha). Sem login social obrigatório.",
    fr: "Compte: un seul e-mail pour la connexion (lien magique Supabase ou e-mail/mot de passe). Pas de connexion sociale imposée.",
    pl: "Konto: jeden e-mail do logowania (magic link Supabase albo e-mail/hasło). Bez wymuszonego logowania przez konta społecznościowe.",
    tr: "Hesap: giriş için tek bir e-posta (Supabase sihirli bağlantı ya da e-posta/şifre). Zorunlu sosyal medya girişi yok.",
    nl: "Account: één e-mailadres om in te loggen (Supabase magic link of e-mail/wachtwoord). Geen verplichte social login.",
    ja: "アカウント:ログインに必要なのはメールアドレスひとつだけ(Supabaseのマジックリンク、またはメール+パスワード)。ソーシャルログインの強制はありません。",
    ko: "계정: 로그인은 이메일 하나면 충분합니다(Supabase 매직 링크 또는 이메일/비밀번호). 소셜 로그인을 강제하지 않습니다.",
    sv: "Konto: en e-postadress för inloggning (Supabase magic link eller e-post/lösenord). Ingen inloggning med sociala medier krävs.",
    da: "Konto: én e-mail til login (Supabase magic link eller e-mail/adgangskode). Intet tvunget social login.",
    no: "Konto: én e-postadresse for innlogging (Supabase magisk lenke eller e-post/passord). Ingen tvungen sosial pålogging.",
    fi: "Tili: yksi sähköposti kirjautumiseen (Supabase-taikalinkki tai sähköposti/salasana). Ei pakollista some-kirjautumista.",
  } satisfies Localized,

  deleteAccountPrefix: {
    it: "Vuoi cancellare l'account? Lo fai in autonomia dall'app (Impostazioni → Elimina account)",
    en: "Want to delete your account? Do it yourself from the app (Settings → Delete account)",
    es: "¿Quieres eliminar tu cuenta? Hazlo tú mismo desde la app (Ajustes → Eliminar cuenta)",
    de: "Möchtest du dein Konto löschen? Erledige es selbst in der App (Einstellungen → Konto löschen)",
    pt: "Quer excluir sua conta? Faça isso sozinho pelo app (Configurações → Excluir conta)",
    fr: "Vous souhaitez supprimer votre compte? Faites-le vous-même depuis l'application (Paramètres → Supprimer le compte)",
    pl: "Chcesz usunąć konto? Zrób to samodzielnie w aplikacji (Ustawienia → Usuń konto)",
    tr: "Hesabınızı silmek mi istiyorsunuz? Bunu uygulamadan kendiniz yapabilirsiniz (Ayarlar → Hesabı sil)",
    nl: "Wil je je account verwijderen? Doe dat zelf via de app (Instellingen → Account verwijderen)",
    ja: "アカウントを削除したい場合は、アプリ内(設定 → アカウントを削除)からご自身で削除できます",
    ko: "계정을 삭제하고 싶으신가요? 앱에서 직접 삭제할 수 있습니다(설정 → 계정 삭제)",
    sv: "Vill du ta bort ditt konto? Gör det själv i appen (Inställningar → Ta bort konto)",
    da: "Vil du slette din konto? Gør det selv i appen (Indstillinger → Slet konto)",
    no: "Vil du slette kontoen din? Gjør det selv i appen (Innstillinger → Slett konto)",
    fi: "Haluatko poistaa tilisi? Tee se itse sovelluksessa (Asetukset → Poista tili)",
  } satisfies Localized,

  deleteAccountSuffix: {
    it: ": per i dettagli su tempistiche ed eccezioni vedi ",
    en: ": for details on timing and exceptions see ",
    es: ": para más detalles sobre plazos y excepciones consulta la ",
    de: ": Details zu Fristen und Ausnahmen findest du in ",
    pt: ": para mais detalhes sobre prazos e exceções consulte a ",
    fr: " : pour plus de détails sur les délais et les exceptions, consultez la ",
    pl: ": szczegóły dotyczące terminów i wyjątków znajdziesz w ",
    tr: ": süreler ve istisnalarla ilgili ayrıntılar için bkz. ",
    nl: ": voor details over tijdlijnen en uitzonderingen zie ",
    ja: "。タイミングや例外の詳細は",
    ko: ". 처리 시점과 예외에 대한 자세한 내용은 ",
    sv: ": för detaljer om tidsramar och undantag, se ",
    da: ": for detaljer om tidsfrister og undtagelser, se ",
    no: ": for detaljer om tidsfrister og unntak, se ",
    fi: ": lisätietoja aikatauluista ja poikkeuksista ",
  } satisfies Localized,

  privacyPolicyLink: {
    it: "Privacy Policy", en: "Privacy Policy", es: "Política de privacidad",
    de: "Datenschutzrichtlinie", pt: "Política de Privacidade", fr: "Politique de confidentialité",
    pl: "Politykę prywatności", tr: "Gizlilik Politikası", nl: "Privacybeleid",
    ja: "プライバシーポリシー", ko: "개인정보처리방침", sv: "Integritetspolicy",
    da: "Privatlivspolitik", no: "Personvernerklæring", fi: "Tietosuojakäytäntö",
  } satisfies Localized,

  pricingHeading: {
    it: "Quanto costa", en: "Pricing", es: "Precio",
    de: "Preise", pt: "Preços", fr: "Tarifs",
    pl: "Cennik", tr: "Fiyatlandırma", nl: "Prijzen",
    ja: "料金", ko: "가격", sv: "Priser",
    da: "Priser", no: "Priser", fi: "Hinnoittelu",
  } satisfies Localized,

  oneTimePurchase: {
    it: "Acquisto unico", en: "One-time purchase", es: "Pago único",
    de: "Einmalkauf", pt: "Compra única", fr: "Achat unique",
    pl: "Zakup jednorazowy", tr: "Tek seferlik satın alma", nl: "Eenmalige aankoop",
    ja: "買い切り", ko: "일회성 결제", sv: "Engångsköp",
    da: "Engangskøb", no: "Engangskjøp", fi: "Kertaostos",
  } satisfies Localized,

  lifetimeUnlockDesc: {
    it: "Sblocco a vita: lo paghi una volta, è tuo per sempre. Niente rinnovo automatico, niente sorprese in fattura.",
    en: "Lifetime unlock: pay once, yours forever. No auto-renewal, no surprises on your bill.",
    es: "Desbloqueo de por vida: pagas una vez, es tuyo para siempre. Sin renovación automática, sin sorpresas en tu factura.",
    de: "Lebenslange Freischaltung: einmal zahlen, für immer deins. Keine automatische Verlängerung, keine Überraschungen auf der Rechnung.",
    pt: "Desbloqueio vitalício: pagas uma vez, é teu para sempre. Sem renovação automática, sem surpresas na fatura.",
    fr: "Achat à vie : payez une fois, c'est à vous pour toujours. Pas de renouvellement automatique, pas de mauvaise surprise sur la facture.",
    pl: "Odblokowanie na zawsze: płacisz raz, masz na zawsze. Bez automatycznego odnawiania, bez niespodzianek na rachunku.",
    tr: "Ömür boyu kilit açma: bir kez ödeyin, sonsuza dek sizin olsun. Otomatik yenileme yok, faturada sürpriz yok.",
    nl: "Lifetime-toegang: eenmalig betalen, voor altijd van jou. Geen automatische verlenging, geen verrassingen op je rekening.",
    ja: "永久アンロック:一度支払えば、ずっとあなたのもの。自動更新はなく、請求に驚かされることもありません。",
    ko: "평생 이용권: 한 번 결제하면 평생 사용할 수 있습니다. 자동 갱신 없음, 청구서에 놀랄 일도 없습니다.",
    sv: "Livstidsupplåsning: betala en gång, och den är din för alltid. Ingen automatisk förnyelse, inga överraskningar på fakturan.",
    da: "Lifetime-oplåsning: betal én gang, og det er dit for altid. Ingen automatisk fornyelse, ingen overraskelser på regningen.",
    no: "Livstidslisens: betal én gang, den er din for alltid. Ingen automatisk fornyelse, ingen overraskelser på fakturaen.",
    fi: "Elinikäinen käyttöoikeus: maksat kerran, käytät ikuisesti. Ei automaattista uusiutumista, ei yllätyksiä laskulla.",
  } satisfies Localized,

  /**
   * U-ABOUT-08 (S02): non piu' resa su /about; resta interpolata nelle landing
   * (lib/landing/data.ts, es-overlay). Stessa frase della sezione prezzi della
   * home, importata e non ricopiata: una sola fonte (PRICING_SECTION.subhead).
   */
  trialDesc: PRICING_SECTION.subhead,

  familyHeading: {
    it: "Mesh Famiglia", en: "Family Mesh", es: "Mesh Familia",
    de: "Mesh Familie", pt: "Mesh Família", fr: "Mesh Famille",
    pl: "Mesh Rodzina", tr: "Mesh Aile", nl: "Family Mesh",
    ja: "Family Mesh", ko: "Family Mesh", sv: "Family Mesh",
    da: "Family Mesh", no: "Family Mesh", fi: "Family Mesh",
  } satisfies Localized,

  familyBody: {
    it: "Mesh Famiglia (attualmente in sviluppo e non ancora disponibile) ti permetterà di creare un gruppo con chi vuoi (genitori, partner, figli): ogni membro condividerà passi, sonno e frequenza cardiaca con gli altri, in un'unica dashboard. Ogni utente del gruppo sceglierà autonomamente cosa condividere e darà consenso scritto in-app prima di farlo.",
    en: "Family Mesh (currently in development and not yet available) will let you create a group with anyone you want (parents, partner, kids): every member will share steps, sleep and heart rate with the others, in one dashboard. Each group member will independently choose what to share and give written in-app consent before doing so.",
    es: "Mesh Familia (actualmente en desarrollo y no disponible todavía) te permitirá crear un grupo con quien quieras (padres, pareja, hijos): cada miembro compartirá pasos, sueño y frecuencia cardíaca con los demás, en un solo panel. Cada miembro del grupo elegirá de forma independiente qué compartir y dará su consentimiento por escrito en la app antes de hacerlo.",
    de: "Mit Mesh Familie (derzeit in Entwicklung und noch nicht verfügbar) wirst du eine Gruppe mit wem du möchtest (Eltern, Partner, Kinder) erstellen können: Jedes Mitglied teilt Schritte, Schlaf und Herzfrequenz mit den anderen, in einem Dashboard. Jedes Gruppenmitglied entscheidet selbstständig, was es teilt, und gibt vorher eine schriftliche Zustimmung in der App.",
    pt: "O Mesh Família (atualmente em desenvolvimento e ainda não disponível) permitirá criar um grupo com quem você quiser (pais, parceiro, filhos): cada membro compartilhará passos, sono e frequência cardíaca com os demais, em um único painel. Cada membro do grupo escolherá de forma independente o que compartilhar e dará consentimento por escrito no app antes de fazê-lo.",
    fr: "Mesh Famille (actuellement en développement et pas encore disponible) vous permettra de créer un groupe avec qui vous voulez (parents, partenaire, enfants) : chaque membre partagera ses pas, son sommeil et sa fréquence cardiaque avec les autres, dans un seul tableau de bord. Chaque membre du groupe choisira indépendamment ce qu'il partage et donnera son consentement écrit dans l'application avant de le faire.",
    pl: "Family Mesh (obecnie w fazie rozwoju i jeszcze niedostępny) pozwoli stworzyć grupę z dowolnie wybranymi osobami (rodzicami, partnerem, dziećmi): każdy członek grupy podzieli się z pozostałymi krokami, snem i tętnem w jednym panelu. Każdy członek grupy samodzielnie zdecyduje, czym się dzieli, i wyraża pisemną zgodę w aplikacji, zanim to zrobi.",
    tr: "Aile Mesh (şu anda geliştirme aşamasında olup henüz kullanıma sunulmamıştır), istediğiniz kişilerle (ebeveynler, eş, çocuklar) bir grup oluşturmanızı sağlayacaktır: her üye adım sayısını, uykusunu ve kalp atış hızını diğerleriyle tek bir panelde paylaşacaktır. Her grup üyesi neyi paylaşacağına bağımsız olarak karar verecek ve bunu yapmadan önce uygulama içinde yazılı onay verecektir.",
    nl: "Family Mesh (momenteel in ontwikkeling en nog niet beschikbaar) laat je een groep maken met wie je maar wilt (ouders, partner, kinderen): elk lid deelt stappen, slaap en hartslag met de anderen, in één dashboard. Elk groepslid kiest zelf wat het deelt en geeft daarvoor vooraf schriftelijk toestemming in de app.",
    ja: "Family Mesh(現在開発中であり、まだご利用いただけません)では、好きな相手(親、パートナー、子どもなど)とグループを作成できます。メンバー全員が、歩数・睡眠・心拍数を互いに共有し、ひとつのダッシュボードで確認できるようになります。各メンバーは何を共有するかを個別に選択し、共有する前にアプリ内で書面による同意を行います。",
    ko: "Family Mesh(현재 개발 중이며 아직 이용할 수 없음)를 이용하면 원하는 사람과 자유롭게 그룹을 만들 수 있습니다(부모님, 배우자, 자녀 등). 그룹의 모든 구성원은 걸음 수, 수면, 심박수를 하나의 대시보드에서 서로 공유하게 됩니다. 각 구성원은 무엇을 공유할지 개별적으로 선택하고, 공유하기 전에 앱 내에서 서면 동의를 제공합니다.",
    sv: "Med Family Mesh (för närvarande under utveckling och ännu inte tillgängligt) kan du skapa en grupp med vem du vill (föräldrar, partner, barn): varje medlem delar steg, sömn och puls med de andra, i en gemensam dashboard. Varje gruppmedlem väljer själv vad som ska delas och ger ett skriftligt samtycke i appen innan det sker.",
    da: "Med Family Mesh (i øjeblikket under udvikling og endnu ikke tilgængeligt) kan du oprette en gruppe med dem, du vil (forældre, partner, børn): alle medlemmer deler skridt, søvn og puls med hinanden i ét fælles dashboard. Hvert gruppemedlem vælger selv, hvad der skal deles, og giver skriftligt samtykke i appen, før det sker.",
    no: "Med Family Mesh (for tiden under utvikling og ennå ikke tilgjengelig) kan du opprette en gruppe med hvem du vil (foreldre, partner, barn): alle medlemmer deler skritt, søvn og puls med de andre, i ett felles dashbord. Hvert gruppemedlem velger selv og uavhengig hva de vil dele, og gir skriftlig samtykke i appen før de gjør det.",
    fi: "Family Mesh (kehitteillä eikä vielä saatavilla) antaa sinun perustaa ryhmän kenen tahansa kanssa haluat (vanhemmat, puoliso, lapset): jokainen jäsen jakaa askeleensa, unensa ja sykkeensä muiden kanssa, samassa näkymässä. Jokainen ryhmän jäsen päättää itsenäisesti, mitä jakaa, ja antaa siihen kirjallisen suostumuksen sovelluksessa ennen jakamisen aloittamista.",
  } satisfies Localized,

  teamHeading: {
    it: "Chi c'è dietro", en: "Who's behind it", es: "Quién hay detrás",
    de: "Wer steckt dahinter", pt: "Quem está por trás", fr: "Qui est derrière",
    pl: "Kto stoi za projektem", tr: "Arkasında kim var", nl: "Wie zit erachter",
    ja: "開発者について", ko: "만든 사람", sv: "Vem står bakom",
    da: "Hvem står bag", no: "Hvem står bak", fi: "Kuka on tämän takana",
  } satisfies Localized,

  teamBody1: {
    it: "FitMesh Sync è sviluppato da Matteo Pizzi, sviluppatore software italiano. È nato per riunire in un'app i dati che orologi, anelli e app fitness raccolgono in posti diversi.",
    en: "FitMesh Sync is built by Matteo Pizzi, an Italian software developer. It started as a way to bring together, in one app, the data that watches, rings and fitness apps collect in different places.",
    es: "FitMesh Sync está desarrollado por Matteo Pizzi, desarrollador de software italiano. Nació para reunir en una sola app los datos que relojes, anillos y apps de fitness recopilan en diferentes lugares.",
    de: "FitMesh Sync wird von Matteo Pizzi entwickelt, einem italienischen Softwareentwickler. Es entstand, um die Daten, die Uhren, Ringe und Fitness-Apps an verschiedenen Orten erfassen, in einer App zusammenzuführen.",
    pt: "O FitMesh Sync é desenvolvido por Matteo Pizzi, desenvolvedor de software italiano. Nasceu para reunir num único app os dados que relógios, anéis e apps de fitness recolhem em diferentes locais.",
    fr: "FitMesh Sync est développé par Matteo Pizzi, développeur de logiciels italien. Il est né pour rassembler dans une seule application les données que les montres, bagues et apps de fitness collectent à différents endroits.",
    pl: "FitMesh Sync jest rozwijany przez Matteo Pizziego, włoskiego programistę. Powstał, aby połączyć w jednej aplikacji dane, które zegarki, pierścienie i aplikacje fitness zbierają w różnych miejscach.",
    tr: "FitMesh Sync, İtalyan yazılım geliştiricisi Matteo Pizzi tarafından geliştirilmektedir. Saatlerin, yüzüklerin ve fitness uygulamalarının farklı yerlerde topladığı verileri tek bir uygulamada bir araya getirmek için doğdu.",
    nl: "FitMesh Sync is ontwikkeld door Matteo Pizzi, een Italiaanse softwareontwikkelaar. Het is ontstaan om de gegevens die horloges, ringen en fitness-apps op verschillende plekken verzamelen in één app samen te brengen.",
    ja: "FitMesh Syncはイタリア人ソフトウェア開発者のMatteo Pizziによって開発されています。時計、スマートリング、フィットネスアプリが別々の場所に集めるデータを、ひとつのアプリにまとめるために誕生しました。",
    ko: "FitMesh Sync는 이탈리아 소프트웨어 개발자 Matteo Pizzi가 개발합니다. 시계, 스마트링, 피트니스 앱이 서로 다른 곳에 수집하는 데이터를 하나의 앱으로 모으기 위해 시작되었습니다.",
    sv: "FitMesh Sync är utvecklat av Matteo Pizzi, en italiensk mjukvaruutvecklare. Den skapades för att samla in data som klockor, ringar och träningsappar samlar på olika ställen i en enda app.",
    da: "FitMesh Sync er udviklet af Matteo Pizzi, en italiensk softwareudvikler. Den blev skabt for at samle data, som ure, ringe og fitness-apps indsamler forskellige steder, i én app.",
    no: "FitMesh Sync er utviklet av Matteo Pizzi, en italiensk programvareutvikler. Den ble skapt for å samle data som klokker, ringer og treningsapper samler inn på ulike steder, i én app.",
    fi: "FitMesh Syncin on kehittänyt Matteo Pizzi, italialainen ohjelmistokehittäjä. Se syntyi kokoamaan yhteen sovellukseen tiedot, joita kellot, sormukset ja kuntosovellukset keräävät eri paikkoihin.",
  } satisfies Localized,

  teamBody2: {
    it: "Il codice dell'app è privato.",
    en: "The app's code is private.",
    es: "El código de la app cliente permanece privado.",
    de: "Der Client-App-Code bleibt privat.",
    pt: "O código do app cliente permanece privado.",
    fr: "Le code de l'application cliente reste privé.",
    pl: "Kod aplikacji klienckiej pozostaje prywatny.",
    tr: "İstemci uygulama kodu özel kalıyor.",
    nl: "De code van de clientapp blijft privé.",
    ja: "クライアントアプリのコードは非公開です。",
    ko: "클라이언트 앱 코드는 비공개입니다.",
    sv: "Klientappens kod förblir privat.",
    da: "Selve app-koden er privat.",
    no: "Selve app-koden er privat.",
    fi: "Sovellusasiakkaan koodi pysyy yksityisenä.",
  } satisfies Localized,

  contactPrefix: {
    it: "Contatti: ", en: "Contact: ", es: "Contacto: ",
    de: "Kontakt: ", pt: "Contato: ", fr: "Contact: ",
    pl: "Kontakt: ", tr: "İletişim: ", nl: "Contact: ",
    ja: "ご連絡は", ko: "문의: ", sv: "Kontakt: ",
    da: "Kontakt: ", no: "Kontakt: ", fi: "Yhteydenotot: ",
  } satisfies Localized,

  contactSuffix: {
    it: " per feature request, bug report, partnership o semplicemente per dire ciao.",
    en: " for feature requests, bug reports, partnerships or just to say hi.",
    es: " para sugerencias, informes de errores, colaboraciones o simplemente para saludar.",
    de: " für Feature-Anfragen, Fehlerberichte, Partnerschaften oder einfach um Hallo zu sagen.",
    pt: " para sugestões, relatórios de erros, parcerias ou simplesmente para dizer olá.",
    fr: " pour des demandes de fonctionnalités, des rapports de bugs, des partenariats ou simplement pour dire bonjour.",
    pl: " w sprawie propozycji nowych funkcji, zgłoszeń błędów, współpracy lub żeby po prostu się przywitać.",
    tr: " özellik istekleri, hata bildirimleri, iş birlikleri için ya da sadece merhaba demek için.",
    nl: " voor functiewensen, bugmeldingen, samenwerkingen of gewoon om hallo te zeggen.",
    ja: "までどうぞ。機能のご要望、不具合報告、提携のご相談、あるいはちょっとした挨拶でも構いません。",
    ko: ". 기능 제안, 버그 신고, 파트너십 문의, 또는 가벼운 인사까지 모두 환영합니다.",
    sv: " för funktionsförslag, buggrapporter, samarbeten eller bara för att säga hej.",
    da: " for ønsker til nye funktioner, fejlrapporter, samarbejder eller bare for at sige hej.",
    no: " for funksjonsønsker, feilrapporter, samarbeid eller bare for å si hei.",
    fi: " ominaisuustoiveisiin, vikailmoituksiin, yhteistyöehdotuksiin tai vaikka vain tervehdykseen.",
  } satisfies Localized,

  readyToTry: {
    it: "Pronto a provarlo?", en: "Ready to try it?", es: "¿Listo para probarlo?",
    de: "Bereit, es auszuprobieren?", pt: "Pronto para experimentar?", fr: "Prêt à l'essayer?",
    pl: "Chcesz spróbować?", tr: "Denemeye hazır mısınız?", nl: "Klaar om het te proberen?",
    ja: "試してみませんか?", ko: "지금 사용해 보시겠어요?", sv: "Redo att testa?",
    da: "Klar til at prøve det?", no: "Klar til å prøve?", fi: "Valmis kokeilemaan?",
  } satisfies Localized,

  availableLive: {
    it: "Disponibile ora su Android e iOS.", en: "Available now on Android and iOS.", es: "Disponible ahora en Android e iOS.",
    de: "Jetzt für Android und iOS verfügbar.", pt: "Disponível agora para Android e iOS.", fr: "Disponible maintenant sur Android et iOS.",
    pl: "Dostępna już na Androida i iOS.", tr: "Şu anda Android ve iOS'ta kullanılabilir.", nl: "Nu beschikbaar voor Android en iOS.",
    ja: "AndroidとiOSで今すぐご利用いただけます。", ko: "지금 Android와 iOS에서 이용 가능합니다.", sv: "Tillgänglig nu på Android och iOS.",
    da: "Tilgængelig nu på Android og iOS.", no: "Tilgjengelig nå på Android og iOS.", fi: "Saatavilla nyt Androidille ja iOS:lle.",
  } satisfies Localized,

  /**
   * U-ABOUT-12 (S02): voce della lista dispositivi, prima scritta a mano in
   * italiano dentro page.tsx per tutte le lingue. Solo it/en approvati: nelle
   * altre lingue il valore e' assente e la voce non si rende (tlOwn, nessun
   * ripiego) finche' non arriva la consegna linguistica.
   */
  pixelWatchDevice: {
    it: "Pixel Watch 1 / 2 / 3 e altri Wear OS che scrivono in Health Connect",
    en: "Pixel Watch 1 / 2 / 3 and other Wear OS watches that write to Health Connect",
    es: "Google Pixel Watch (a través de Health Connect)",
    de: "Google Pixel Watch (über Health Connect)",
    fr: "Google Pixel Watch (via Health Connect)",
    pt: "Google Pixel Watch (através do Health Connect)",
    pl: "Google Pixel Watch (przez Health Connect)",
    tr: "Google Pixel Watch (Health Connect üzerinden)",
    nl: "Google Pixel Watch (via Health Connect)",
    ja: "Google Pixel Watch（Health Connect経由）",
    ko: "Google Pixel Watch (Health Connect 지원)",
    sv: "Google Pixel Watch (via Health Connect)",
    da: "Google Pixel Watch (via Health Connect)",
    no: "Google Pixel Watch (via Health Connect)",
    fi: "Google Pixel Watch (Health Connectin kautta)",
  } as Localized,

} as const;
