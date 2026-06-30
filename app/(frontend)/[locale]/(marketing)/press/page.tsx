/**
 * /[locale]/press — Press / media kit page.
 *
 * Pagina pubblica, indicizzata. Contiene:
 *   - Tagline + descrizione breve copia-incolla-ready
 *   - 3 paragrafi (mini / standard / long) per uso giornalistico
 *   - Key facts (founding, tech, market)
 *   - Founder bio
 *   - Asset download (logo, screenshot, icon)
 *   - Contact press
 *   - Quote/testimonial gateway (vuoto ora, popolato con il tempo)
 *
 * Per il giornalista: tutto in 1 page, copy/paste senza email.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import TrustBadges from "@/components/TrustBadges";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { PRICING } from "@/lib/pricing";

const SITE_URL = "https://www.fitmesh.fit";

const COPY = {
  it: {
    kicker: "Press & Media kit",
    h1: "FitMesh Sync: risorse per giornalisti, blogger, creator",
    sub:
      "Tutto quello che ti serve per scrivere o parlare di FitMesh Sync. Copia-incolla, scarica gli asset, niente email obbligatoria.",

    contactTitle: "Contatto stampa diretto",
    contactBody:
      "Per interviste, demo guidate, asset alta risoluzione o domande tecniche:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, founder, sviluppatore unico",

    taglineTitle: "Tagline (1 riga)",
    tagline:
      "FitMesh Sync è la dashboard premium privacy-first per i dati di tutti gli smartwatch della famiglia, costruita in Italia da uno sviluppatore indipendente.",

    blurbsTitle: "Descrizione breve (50, 100, 200 parole)",
    blurb50: {
      title: "50 parole",
      body:
        "FitMesh Sync è un'app Android che unifica i dati di salute di Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e altri wearable in una dashboard premium. Privacy-first, server in UE, sviluppata in Italia. Funziona via Health Connect senza tracker o broker dati. Disponibile su Google Play da giugno 2026; versione iOS in arrivo.",
    },
    blurb100: {
      title: "100 parole",
      body:
        "FitMesh Sync è un'app Android sviluppata in Italia da Matteo Pizzi (Fosforonero) per unificare in una sola dashboard premium i dati di salute provenienti da tutti gli smartwatch e fitness band sul mercato. Lavora come destinazione di Health Connect, quindi è compatibile out-of-the-box con Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei e Oura, senza bisogno di OAuth per ognuno. Privacy-first: server EU, GDPR, zero broker dati. Disponibile su Google Play da giugno 2026; in arrivo la versione iOS e la funzione Mesh Famiglia per il caregiving familiare.",
    },
    blurb200: {
      title: "200 parole (profilo completo)",
      body:
        "FitMesh Sync nasce in Italia nel 2026 dalla frustrazione di uno sviluppatore (Matteo Pizzi, studio Fosforonero) che possiede un Galaxy Watch, la moglie usa una Mi Band, la madre un Withings. Ogni brand chiude i propri dati nella propria app. Nessuno offre una vista unificata premium. FitMesh risolve esattamente questo: leggendo da Health Connect (lo standard Android che dal 2024 raccoglie i dati di praticamente tutti i wearable), aggrega passi, frequenza cardiaca, sonno, calorie, workout e altre metriche in una dashboard nativa Flutter pensata per la lettura quotidiana, non per il sysadmin. Privacy-first dal primo commit: server europei (Supabase Francoforte), GDPR-compliance reale, zero broker dati, zero tracker. La differenziazione strategica rispetto alle bridge app cloud-to-cloud del settore è che FitMesh non è un router silenzioso di dati: è una destinazione. I dati sono archiviati, visualizzati con grafici curati, e nel medio termine condivisibili tra membri famiglia (Mesh Famiglia, in roadmap) per scenari caregiver. L'app è disponibile su Google Play: i primi 1000 founder ricevono il Pro a vita gratis, attivato automaticamente alla registrazione. La versione iOS è in arrivo.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Lancio", value: "Pubblica su Google Play da giugno 2026 · iOS in arrivo" },
      { label: "Piattaforme", value: "Android (iOS in arrivo)" },
      { label: "Country", value: "Italia · server UE (Francoforte)" },
      { label: "Tecnologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearable supportati", value: "9+ brand via Health Connect, espandibili" },
      { label: "Pricing", value: `Prova 14 giorni, poi Pro ${PRICING.fromLifetime.it} una tantum (Android ${PRICING.lifetimeAndroid.it} · iPhone ${PRICING.lifetimeIos.it}) o ${PRICING.subSixMonthsLabel.it}` },
      { label: "Posti founder", value: "Primi 1000 account: Pro a vita gratis (auto-attivato alla registrazione)" },
      { label: "Team", value: "Indie / solo dev (Fosforonero, Matteo Pizzi)" },
      { label: "Categoria Play Store", value: "Health & Fitness" },
    ],

    founderTitle: "Founder",
    founderName: "Matteo Pizzi",
    founderRole: "Founder & Solo Dev · Fosforonero",
    founderBio:
      "Sviluppatore software italiano, ha costruito FitMesh Sync per riempire il vuoto fra wearable e dashboard personale. Tutta l'app, il backend e il sito sono sviluppati e mantenuti da lui. Approccio privacy-first e indie-first.",

    assetsTitle: "Asset scaricabili",
    assets: [
      {
        label: "Logo / icona quadrata (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph image (1200×630, dinamica)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Per screenshot in-app, mockup, video o materiali brand custom scrivi a press@fitmesh.fit, rispondiamo entro 24h.",

    storyAnglesTitle: "Angoli editoriali interessanti",
    storyAngles: [
      "Indie dev italiano costruisce un'alternativa europea privacy-first ai walled garden di Samsung/Apple/Google Fit",
      "Come Health Connect ha cambiato l'ecosistema wearable Android dal 2024, e cosa significa per consumer e dev",
      "Caregiver tech: monitorare la salute di genitori anziani senza GPS né app invasive (la roadmap Mesh Famiglia)",
      "Beta program founder a vita gratis: alternativa all'hype subscription anche su app fitness",
      "Sviluppare un'app salute in Italia: GDPR, server EU, sovranità dati come differenziatore",
    ],

    trademarkNote:
      "FitMesh Sync è marchio di Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e altri brand citati sono marchi dei rispettivi proprietari; il loro uso in questa pagina e nel materiale FitMesh non implica affiliazione o sponsorizzazione.",

    sitemapNote:
      "Hai bisogno di link specifici? Trovi tutto a fitmesh.fit (home, /it/famiglia per il caso d'uso caregiver, /it/blog per gli articoli tecnici, /it/about per la storia del progetto).",
  },
  en: {
    kicker: "Press & Media kit",
    h1: "FitMesh Sync: resources for journalists, bloggers, creators",
    sub:
      "Everything you need to write or talk about FitMesh Sync. Copy-paste ready, asset downloads, no email required.",

    contactTitle: "Direct press contact",
    contactBody:
      "For interviews, guided demos, high-res assets or technical questions:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, founder, solo developer",

    taglineTitle: "Tagline (1 line)",
    tagline:
      "FitMesh Sync is the privacy-first premium dashboard for all your family's smartwatch data, built in Italy by an independent developer.",

    blurbsTitle: "Short description (50, 100, 200 words)",
    blurb50: {
      title: "50 words",
      body:
        "FitMesh Sync is an Android app that unifies health data from Galaxy Watch, Mi Band, Polar, Garmin, Fitbit and other wearables into one premium dashboard. Privacy-first, EU servers, built in Italy. Runs on Health Connect with no trackers or data brokers. Available on Google Play since June 2026; iOS version coming soon.",
    },
    blurb100: {
      title: "100 words",
      body:
        "FitMesh Sync is an Android app developed in Italy by Matteo Pizzi (Fosforonero) to unify in a single premium dashboard the health data coming from every smartwatch and fitness band on the market. It works as a Health Connect destination, compatible out-of-the-box with Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei and Oura, without requiring per-brand OAuth. Privacy-first: EU servers, GDPR, no data brokers. Available on Google Play since June 2026; the iOS version and Family Mesh feature for family caregiving are coming next.",
    },
    blurb200: {
      title: "200 words (full profile)",
      body:
        "FitMesh Sync was born in Italy in 2026 from the frustration of one developer (Matteo Pizzi, studio Fosforonero) who owns a Galaxy Watch, his wife uses a Mi Band, his mother a Withings. Every brand locks its own data inside its own app. Nobody offers a unified premium view. FitMesh solves exactly this: by reading from Health Connect (the Android standard that since 2024 collects data from virtually all wearables), it aggregates steps, heart rate, sleep, calories, workouts and other metrics into a native Flutter dashboard designed for daily reading, not for sysadmins. Privacy-first from the first commit: European servers (Supabase Frankfurt), real GDPR compliance, no data brokers, no trackers. The strategic differentiation versus cloud-to-cloud bridge apps in the category is that FitMesh is not a silent data router: it is a destination. Data is stored, visualized with curated charts, and in the medium term shared between family members (Family Mesh, roadmap) for caregiver scenarios. The app is available on Google Play: the first 1,000 founders get lifetime Pro free, granted automatically on signup. The iOS version is coming soon.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Launch", value: "Public on Google Play since June 2026 · iOS coming soon" },
      { label: "Platforms", value: "Android (iOS coming soon)" },
      { label: "Country", value: "Italy · EU servers (Frankfurt)" },
      { label: "Tech stack", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables supported", value: "9+ brands via Health Connect, expandable" },
      { label: "Pricing", value: `14-day trial, then Pro ${PRICING.fromLifetime.en} one-time (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) or ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder seats", value: "First 1,000 accounts: lifetime Pro free (auto-granted on signup)" },
      { label: "Team", value: "Indie / solo dev (Fosforonero, Matteo Pizzi)" },
      { label: "Play Store category", value: "Health & Fitness" },
    ],

    founderTitle: "Founder",
    founderName: "Matteo Pizzi",
    founderRole: "Founder & Solo Dev · Fosforonero",
    founderBio:
      "Italian software developer, built FitMesh Sync to fill the gap between wearables and personal dashboard. The whole app, backend and site are developed and maintained by him. Privacy-first and indie-first approach.",

    assetsTitle: "Downloadable assets",
    assets: [
      {
        label: "Logo / square icon (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph image (1200×630, dynamic)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "For in-app screenshots, mockups, video or custom brand materials write to press@fitmesh.fit, we reply within 24h.",

    storyAnglesTitle: "Interesting editorial angles",
    storyAngles: [
      "Italian indie dev builds a privacy-first European alternative to Samsung/Apple/Google Fit walled gardens",
      "How Health Connect changed the Android wearable ecosystem since 2024, and what it means for consumers and devs",
      "Caregiver tech: monitoring aging parents' health without GPS or invasive apps (the Family Mesh roadmap)",
      "Lifetime-free founder beta program: an alternative to subscription hype, even in fitness apps",
      "Building a health app in Italy: GDPR, EU servers, data sovereignty as a differentiator",
    ],

    trademarkNote:
      "FitMesh Sync is a trademark of Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit and other brands mentioned are trademarks of their respective owners; their use on this page and in FitMesh materials does not imply affiliation or sponsorship.",

    sitemapNote:
      "Need specific links? You can find everything at fitmesh.fit (home, /en/famiglia for the caregiver use case, /en/blog for technical articles, /en/about for the project story).",
  },
  es: {
    kicker: "Press & Media kit",
    h1: "FitMesh Sync: recursos para periodistas, bloggers y creadores",
    sub:
      "Todo lo que necesitas para escribir o hablar sobre FitMesh Sync. Listo para copiar y pegar, descarga de recursos, sin correo obligatorio.",

    contactTitle: "Contacto de prensa directo",
    contactBody:
      "Para entrevistas, demostraciones guiadas, recursos en alta resolución o preguntas técnicas:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, fundador, desarrollador en solitario",

    taglineTitle: "Tagline (1 línea)",
    tagline:
      "FitMesh Sync es el panel premium con privacidad por diseño para los datos de salud de todos los smartwatches de tu familia, creado en Italia por un desarrollador independiente.",

    blurbsTitle: "Descripción breve (50, 100, 200 palabras)",
    blurb50: {
      title: "50 palabras",
      body:
        "FitMesh Sync es una app Android que unifica los datos de salud de Galaxy Watch, Mi Band, Polar, Garmin, Fitbit y otros wearables en un único panel premium. Privacidad por diseño, servidores en la UE, desarrollada en Italia. Funciona con Health Connect sin rastreadores ni intermediarios de datos. Disponible en Google Play desde junio de 2026; versión iOS próximamente.",
    },
    blurb100: {
      title: "100 palabras",
      body:
        "FitMesh Sync es una app Android desarrollada en Italia por Matteo Pizzi (Fosforonero) para unificar en un solo panel premium los datos de salud de todos los smartwatches y pulseras de actividad del mercado. Funciona como destino de Health Connect, por lo que es compatible de entrada con Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei y Oura, sin necesidad de autenticación individual por marca. Privacidad por diseño: servidores en la UE, cumplimiento del RGPD, sin intermediarios de datos. Disponible en Google Play desde junio de 2026; la versión iOS y la función Mesh Familia para el cuidado familiar llegan próximamente.",
    },
    blurb200: {
      title: "200 palabras (perfil completo)",
      body:
        "FitMesh Sync nació en Italia en 2026 de la frustración de un desarrollador (Matteo Pizzi, estudio Fosforonero) que tiene un Galaxy Watch, cuya esposa usa una Mi Band y cuya madre tiene un Withings. Cada marca encierra sus datos en su propia app. Nadie ofrece una vista unificada premium. FitMesh resuelve exactamente eso: leyendo desde Health Connect (el estándar Android que desde 2024 recoge datos de prácticamente todos los wearables), agrega pasos, frecuencia cardíaca, sueño, calorías, entrenamientos y otras métricas en un panel nativo Flutter pensado para la lectura diaria, no para administradores de sistemas. Privacidad por diseño desde el primer commit: servidores europeos (Supabase Fráncfort), cumplimiento real del RGPD, sin intermediarios de datos, sin rastreadores. La diferenciación estratégica frente a las apps puente entre ecosistemas de salud del sector es que FitMesh no es un enrutador silencioso de datos: es un destino. Los datos se almacenan, se visualizan con gráficas cuidadas y, a medio plazo, se podrán compartir entre los miembros de la familia (Mesh Familia, en la hoja de ruta) para escenarios de cuidadores. La app está disponible en Google Play: los primeros 100 fundadores obtienen Pro de por vida gratis, los 1.000 siguientes un año de Pro. La versión iOS llegará próximamente.",
    },

    keyFactsTitle: "Datos clave",
    keyFacts: [
      { label: "Lanzamiento", value: "Disponible en Google Play desde junio de 2026 · iOS próximamente" },
      { label: "Plataformas", value: "Android (iOS próximamente)" },
      { label: "País", value: "Italia · servidores en la UE (Fráncfort)" },
      { label: "Tecnologías", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables compatibles", value: "Más de 9 marcas vía Health Connect, ampliable" },
      { label: "Precio", value: `Prueba de 14 días, luego Pro desde €3,99 pago único (Android €3,99 · iPhone €4,99) o €1,19/6 meses` },
      { label: "Plazas fundador", value: "Primeros 100 con Pro de por vida gratis · 1.000 con 1 año de Pro" },
      { label: "Equipo", value: "Indie / desarrollador en solitario (Fosforonero, Matteo Pizzi)" },
      { label: "Categoría en Google Play", value: "Salud y bienestar" },
    ],

    founderTitle: "Fundador",
    founderName: "Matteo Pizzi",
    founderRole: "Fundador y desarrollador en solitario · Fosforonero",
    founderBio:
      "Desarrollador de software italiano, creó FitMesh Sync para cubrir el vacío entre los wearables y un panel personal. Toda la app, el backend y el sitio son desarrollados y mantenidos por él. Enfoque de privacidad por diseño e independencia total.",

    assetsTitle: "Recursos descargables",
    assets: [
      {
        label: "Logo / icono cuadrado (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Imagen Open Graph (1200×630, dinámica)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Para capturas de pantalla de la app, mockups, vídeo o materiales de marca personalizados, escribe a press@fitmesh.fit; respondemos en 24 h.",

    storyAnglesTitle: "Ángulos editoriales interesantes",
    storyAngles: [
      "Un desarrollador indie italiano crea una alternativa europea con privacidad por diseño a los jardines cerrados de Samsung, Apple y Google Fit",
      "Cómo Health Connect transformó el ecosistema de wearables Android desde 2024, y qué significa para usuarios y desarrolladores",
      "Tecnología para cuidadores: monitoriza la salud de tus familiares mayores sin GPS ni apps invasivas (la hoja de ruta de Mesh Familia)",
      "Programa beta con Plaza Fundador de por vida gratis: una alternativa al modelo de suscripción, también en apps de salud",
      "Desarrollar una app de salud en Italia: RGPD, servidores en la UE y soberanía de datos como diferenciador",
    ],

    trademarkNote:
      "FitMesh Sync es marca registrada de Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit y otras marcas citadas son marcas registradas de sus respectivos propietarios; su uso en esta página y en los materiales de FitMesh no implica ninguna afiliación ni patrocinio.",

    sitemapNote:
      "¿Necesitas enlaces concretos? Encuentra todo en fitmesh.fit (inicio, /es/famiglia para el caso de uso de cuidadores, /es/blog para artículos técnicos, /es/about para la historia del proyecto).",
  },
  de: {
    kicker: "Presse & Media-Kit",
    h1: "FitMesh Sync: Ressourcen für Journalisten, Blogger und Creator",
    sub:
      "Alles, was du brauchst, um über FitMesh Sync zu schreiben oder zu berichten. Fertig zum Kopieren, Assets zum Herunterladen, keine E-Mail erforderlich.",

    contactTitle: "Direkter Pressekontakt",
    contactBody:
      "Für Interviews, geführte Demos, hochauflösende Assets oder technische Fragen:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, Gründer, Solo-Entwickler",

    taglineTitle: "Tagline (1 Zeile)",
    tagline:
      "FitMesh Sync ist das datenschutzorientierte Premium-Dashboard für die Gesundheitsdaten aller Smartwatches deiner Familie, entwickelt in Italien von einem unabhängigen Entwickler.",

    blurbsTitle: "Kurzbeschreibung (50, 100, 200 Wörter)",
    blurb50: {
      title: "50 Wörter",
      body:
        "FitMesh Sync ist eine Android-App, die Gesundheitsdaten von Galaxy Watch, Mi Band, Polar, Garmin, Fitbit und anderen Wearables in einem einzigen Premium-Dashboard vereint. Datenschutz zuerst, Server in der EU, entwickelt in Italien. Läuft über Health Connect ohne Tracker oder Datenvermittler. Seit Juni 2026 auf Google Play verfügbar; iOS-Version folgt in Kürze.",
    },
    blurb100: {
      title: "100 Wörter",
      body:
        "FitMesh Sync ist eine Android-App, entwickelt in Italien von Matteo Pizzi (Fosforonero), um die Gesundheitsdaten aller Smartwatches und Fitness-Tracker auf dem Markt in einem einzigen Premium-Dashboard zu vereinen. Die App fungiert als Health-Connect-Ziel und ist damit direkt kompatibel mit Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei und Oura, ohne dass für jede Marke eine separate Anmeldung nötig ist. Datenschutz zuerst: EU-Server, DSGVO, keine Datenvermittler. Seit Juni 2026 auf Google Play verfügbar; die iOS-Version und die Funktion Mesh Familie für die familiäre Betreuung folgen demnächst.",
    },
    blurb200: {
      title: "200 Wörter (vollständiges Profil)",
      body:
        "FitMesh Sync entstand 2026 in Italien aus der Frustration eines Entwicklers (Matteo Pizzi, Studio Fosforonero), der selbst eine Galaxy Watch trägt, dessen Frau eine Mi Band nutzt und dessen Mutter ein Withings-Gerät verwendet. Jede Marke schließt ihre Daten in der eigenen App ein. Niemand bietet eine vereinte Premium-Ansicht. FitMesh löst genau dieses Problem: Die App liest aus Health Connect (dem Android-Standard, der seit 2024 Daten von nahezu allen Wearables sammelt) und aggregiert Schritte, Herzfrequenz, Schlaf, Kalorien, Trainings und weitere Metriken in einem nativen Flutter-Dashboard, das für die tägliche Nutzung konzipiert ist, nicht für Systemadministratoren. Datenschutz von Anfang an: europäische Server (Supabase Frankfurt), echte DSGVO-Compliance, keine Datenvermittler, keine Tracker. Der strategische Unterschied zu Cloud-zu-Cloud-Brückenapps der Branche: FitMesh ist kein stiller Datenrouter, sondern ein Ziel. Daten werden gespeichert, mit sorgfältig gestalteten Diagrammen visualisiert und mittelfristig zwischen Familienmitgliedern geteilt (Mesh Familie, Roadmap) für Betreuungsszenarien. Die App ist auf Google Play verfügbar: Die ersten 100 Gründer erhalten Pro dauerhaft kostenlos, die nächsten 1.000 ein Jahr Pro. Die iOS-Version folgt in Kürze.",
    },

    keyFactsTitle: "Key Facts",
    keyFacts: [
      { label: "Start", value: "Seit Juni 2026 auf Google Play verfügbar · iOS demnächst" },
      { label: "Plattformen", value: "Android (iOS demnächst)" },
      { label: "Land", value: "Italien · EU-Server (Frankfurt)" },
      { label: "Technologien", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Unterstützte Wearables", value: "9+ Marken über Health Connect, erweiterbar" },
      { label: "Preis", value: `14 Tage testen, dann Pro ${PRICING.fromLifetime.de} einmalig (Android ${PRICING.lifetimeAndroid.de} · iPhone ${PRICING.lifetimeIos.de}) oder ${PRICING.subSixMonthsLabel.de}` },
      { label: "Gründerplätze", value: "Erste 100 dauerhaft kostenlos · 1.000 mit 1 Jahr Pro" },
      { label: "Team", value: "Indie / Solo-Entwickler (Fosforonero, Matteo Pizzi)" },
      { label: "Play-Store-Kategorie", value: "Gesundheit & Fitness" },
    ],

    founderTitle: "Gründer",
    founderName: "Matteo Pizzi",
    founderRole: "Gründer & Solo-Entwickler · Fosforonero",
    founderBio:
      "Italienischer Softwareentwickler, der FitMesh Sync gebaut hat, um die Lücke zwischen Wearables und persönlichem Dashboard zu schließen. Die gesamte App, das Backend und die Website werden von ihm entwickelt und gepflegt. Datenschutzorientierter und unabhängiger Ansatz.",

    assetsTitle: "Downloadbare Assets",
    assets: [
      {
        label: "Logo / quadratisches Icon (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open-Graph-Bild (1200×630, dynamisch)",
        href: "/opengraph-image",
      },
      {
        label: "Apple Touch Icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Für In-App-Screenshots, Mockups, Videos oder individuelle Markenmaterialien schreib an press@fitmesh.fit; wir antworten innerhalb von 24 Stunden.",

    storyAnglesTitle: "Interessante redaktionelle Blickwinkel",
    storyAngles: [
      "Italienischer Indie-Entwickler baut datenschutzorientierte europäische Alternative zu den geschlossenen Ökosystemen von Samsung, Apple und Google Fit",
      "Wie Health Connect das Android-Wearable-Ökosystem seit 2024 verändert hat und was das für Verbraucher und Entwickler bedeutet",
      "Betreuungstechnologie: Gesundheit älterer Familienmitglieder ohne GPS oder invasive Apps überwachen (die Mesh-Familie-Roadmap)",
      "Lebenslanges Gründer-Beta-Programm kostenlos: eine Alternative zum Abo-Modell, auch bei Fitness-Apps",
      "Eine Gesundheits-App in Italien entwickeln: DSGVO, EU-Server und Datensouveränität als Alleinstellungsmerkmal",
    ],

    trademarkNote:
      "FitMesh Sync ist eine Marke von Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit und andere genannte Marken sind Marken ihrer jeweiligen Eigentümer; ihre Verwendung auf dieser Seite und in FitMesh-Materialien impliziert keine Zugehörigkeit oder Förderung.",

    sitemapNote:
      "Benötigst du bestimmte Links? Alles findest du auf fitmesh.fit (Startseite, /de/famiglia für den Betreuungs-Anwendungsfall, /de/blog für technische Artikel, /de/about für die Projektgeschichte).",
  },
  pt: {
    kicker: "Press & Media Kit",
    h1: "FitMesh Sync: recursos para jornalistas, bloggers e criadores",
    sub:
      "Tudo o que você precisa para escrever ou falar sobre o FitMesh Sync. Pronto para copiar e colar, download de assets, sem necessidade de e-mail.",

    contactTitle: "Contato de imprensa direto",
    contactBody:
      "Para entrevistas, demonstrações guiadas, assets em alta resolução ou dúvidas técnicas:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, fundador, desenvolvedor solo",

    taglineTitle: "Tagline (1 linha)",
    tagline:
      "FitMesh Sync é o painel premium com foco em privacidade para os dados de saúde de todos os smartwatches da sua família, desenvolvido na Itália por um desenvolvedor independente.",

    blurbsTitle: "Descrição curta (50, 100, 200 palavras)",
    blurb50: {
      title: "50 palavras",
      body:
        "FitMesh Sync é um app Android que unifica dados de saúde do Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e outros wearables em um único painel premium. Privacidade em primeiro lugar, servidores na UE, desenvolvido na Itália. Funciona via Health Connect sem rastreadores ou intermediários de dados. Disponível no Google Play desde junho de 2026; versão iOS em breve.",
    },
    blurb100: {
      title: "100 palavras",
      body:
        "FitMesh Sync é um app Android desenvolvido na Itália por Matteo Pizzi (Fosforonero) para unificar em um único painel premium os dados de saúde de todos os smartwatches e pulseiras fitness do mercado. Funciona como destino do Health Connect, sendo compatível de forma nativa com Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei e Oura, sem autenticação individual por marca. Privacidade em primeiro lugar: servidores na UE, LGPD/GDPR, sem intermediários de dados. Disponível no Google Play desde junho de 2026; a versão iOS e a função Mesh Família para cuidados familiares chegam em breve.",
    },
    blurb200: {
      title: "200 palavras (perfil completo)",
      body:
        "FitMesh Sync nasceu na Itália em 2026 da frustração de um desenvolvedor (Matteo Pizzi, estúdio Fosforonero) que tem um Galaxy Watch, cuja esposa usa uma Mi Band e cuja mãe usa um Withings. Cada marca guarda seus dados dentro do próprio app. Ninguém oferece uma visão unificada premium. FitMesh resolve exatamente isso: lendo do Health Connect (o padrão Android que desde 2024 coleta dados de praticamente todos os wearables), ele agrega passos, frequência cardíaca, sono, calorias, treinos e outras métricas em um painel Flutter nativo pensado para a leitura diária, não para administradores de sistemas. Privacidade desde o primeiro commit: servidores europeus (Supabase Frankfurt), conformidade real com o GDPR, sem intermediários de dados, sem rastreadores. A diferenciação estratégica em relação aos apps de ponte entre ecossistemas do setor é que o FitMesh não é um roteador silencioso de dados: é um destino. Os dados são armazenados, visualizados com gráficos cuidadosamente elaborados e, a médio prazo, compartilhados entre membros da família (Mesh Família, roadmap) para cenários de cuidadores. O app está disponível no Google Play: os primeiros 100 fundadores recebem o Pro vitalício grátis, os próximos 1.000 recebem um ano de Pro. A versão iOS chega em breve.",
    },

    keyFactsTitle: "Dados principais",
    keyFacts: [
      { label: "Lançamento", value: "Disponível no Google Play desde junho de 2026 · iOS em breve" },
      { label: "Plataformas", value: "Android (iOS em breve)" },
      { label: "País", value: "Itália · servidores na UE (Frankfurt)" },
      { label: "Tecnologias", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables compatíveis", value: "Mais de 9 marcas via Health Connect, expansível" },
      { label: "Preço", value: `Teste de 14 dias, depois Pro ${PRICING.fromLifetime.pt} pagamento único (Android ${PRICING.lifetimeAndroid.pt} · iPhone ${PRICING.lifetimeIos.pt}) ou ${PRICING.subSixMonthsLabel.pt}` },
      { label: "Vagas de fundador", value: "Primeiros 100 com Pro vitalício grátis · 1.000 com 1 ano de Pro" },
      { label: "Equipe", value: "Indie / desenvolvedor solo (Fosforonero, Matteo Pizzi)" },
      { label: "Categoria no Google Play", value: "Saúde e fitness" },
    ],

    founderTitle: "Fundador",
    founderName: "Matteo Pizzi",
    founderRole: "Fundador & Desenvolvedor Solo · Fosforonero",
    founderBio:
      "Desenvolvedor de software italiano, construiu o FitMesh Sync para preencher a lacuna entre wearables e painel pessoal. Todo o app, o backend e o site são desenvolvidos e mantidos por ele. Abordagem com foco em privacidade e independência total.",

    assetsTitle: "Assets para download",
    assets: [
      {
        label: "Logo / ícone quadrado (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Imagem Open Graph (1200×630, dinâmica)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Para capturas de tela do app, mockups, vídeos ou materiais de marca personalizados, escreva para press@fitmesh.fit; respondemos em até 24h.",

    storyAnglesTitle: "Ângulos editoriais interessantes",
    storyAngles: [
      "Desenvolvedor indie italiano cria alternativa europeia com foco em privacidade aos ecossistemas fechados de Samsung, Apple e Google Fit",
      "Como o Health Connect transformou o ecossistema de wearables Android desde 2024 e o que isso significa para consumidores e desenvolvedores",
      "Tecnologia para cuidadores: monitorar a saúde de familiares idosos sem GPS nem apps invasivos (o roadmap do Mesh Família)",
      "Programa beta com vagas de fundador vitalícias grátis: uma alternativa ao modelo de assinatura, mesmo em apps de saúde",
      "Desenvolver um app de saúde na Itália: GDPR, servidores na UE e soberania dos dados como diferencial",
    ],

    trademarkNote:
      "FitMesh Sync é marca de Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e outras marcas citadas são marcas registradas de seus respectivos proprietários; o uso delas nesta página e nos materiais do FitMesh não implica afiliação ou patrocínio.",

    sitemapNote:
      "Precisa de links específicos? Encontre tudo em fitmesh.fit (início, /pt/famiglia para o caso de uso de cuidadores, /pt/blog para artigos técnicos, /pt/about para a história do projeto).",
  },
  fr: {
    kicker: "Presse & Kit média",
    h1: "FitMesh Sync : ressources pour journalistes, blogueurs et créateurs",
    sub:
      "Tout ce dont vous avez besoin pour écrire ou parler de FitMesh Sync. Prêt à copier-coller, téléchargement d'assets, aucun e-mail obligatoire.",

    contactTitle: "Contact presse direct",
    contactBody:
      "Pour des interviews, des démonstrations guidées, des assets haute résolution ou des questions techniques :",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, fondateur, développeur solo",

    taglineTitle: "Tagline (1 ligne)",
    tagline:
      "FitMesh Sync est le tableau de bord premium axé sur la confidentialité pour les données de santé de toutes les montres connectées de votre famille, développé en Italie par un développeur indépendant.",

    blurbsTitle: "Description courte (50, 100, 200 mots)",
    blurb50: {
      title: "50 mots",
      body:
        "FitMesh Sync est une application Android qui unifie les données de santé du Galaxy Watch, Mi Band, Polar, Garmin, Fitbit et d'autres appareils connectés dans un seul tableau de bord premium. Confidentialité par conception, serveurs en UE, développé en Italie. Fonctionne via Health Connect sans traceurs ni courtiers de données. Disponible sur Google Play depuis juin 2026 ; version iOS bientôt disponible.",
    },
    blurb100: {
      title: "100 mots",
      body:
        "FitMesh Sync est une application Android développée en Italie par Matteo Pizzi (Fosforonero) pour unifier dans un seul tableau de bord premium les données de santé de toutes les montres connectées et bracelets fitness du marché. Elle fonctionne comme destination Health Connect, compatible d'emblée avec Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei et Oura, sans authentification individuelle par marque. Confidentialité par conception : serveurs UE, RGPD, aucun courtier de données. Disponible sur Google Play depuis juin 2026 ; la version iOS et la fonction Mesh Famille pour les aidants familiaux arrivent prochainement.",
    },
    blurb200: {
      title: "200 mots (profil complet)",
      body:
        "FitMesh Sync est né en Italie en 2026 de la frustration d'un développeur (Matteo Pizzi, studio Fosforonero) qui possède une Galaxy Watch, dont la femme utilise une Mi Band et dont la mère utilise un Withings. Chaque marque enferme ses données dans sa propre application. Personne ne propose une vue unifiée premium. FitMesh résout exactement ce problème : en lisant depuis Health Connect (la norme Android qui, depuis 2024, collecte les données de pratiquement tous les appareils connectés), il agrège pas, fréquence cardiaque, sommeil, calories, séances d'entraînement et d'autres métriques dans un tableau de bord Flutter natif conçu pour une lecture quotidienne, pas pour des administrateurs systèmes. Confidentialité dès le premier commit : serveurs européens (Supabase Francfort), conformité réelle au RGPD, aucun courtier de données, aucun traceur. La différenciation stratégique par rapport aux applications pont entre écosystèmes de santé du secteur est que FitMesh n'est pas un routeur de données silencieux : c'est une destination. Les données sont stockées, visualisées avec des graphiques soignés et, à moyen terme, partagées entre membres de la famille (Mesh Famille, feuille de route) pour des scénarios d'aidants. L'application est disponible sur Google Play : les 100 premiers fondateurs bénéficient du Pro à vie gratuitement, les 1 000 suivants d'un an de Pro. La version iOS arrive prochainement.",
    },

    keyFactsTitle: "Informations clés",
    keyFacts: [
      { label: "Lancement", value: "Disponible sur Google Play depuis juin 2026 · iOS bientôt" },
      { label: "Plateformes", value: "Android (iOS bientôt)" },
      { label: "Pays", value: "Italie · serveurs UE (Francfort)" },
      { label: "Technologies", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Appareils compatibles", value: "Plus de 9 marques via Health Connect, extensible" },
      { label: "Tarif", value: `Essai de 14 jours, puis Pro ${PRICING.fromLifetime.fr} paiement unique (Android ${PRICING.lifetimeAndroid.fr} · iPhone ${PRICING.lifetimeIos.fr}) ou ${PRICING.subSixMonthsLabel.fr}` },
      { label: "Places fondateur", value: "100 premiers avec Pro à vie gratuit · 1 000 avec 1 an de Pro" },
      { label: "Équipe", value: "Indie / développeur solo (Fosforonero, Matteo Pizzi)" },
      { label: "Catégorie Play Store", value: "Santé et forme physique" },
    ],

    founderTitle: "Fondateur",
    founderName: "Matteo Pizzi",
    founderRole: "Fondateur & Développeur Solo · Fosforonero",
    founderBio:
      "Développeur de logiciels italien, il a créé FitMesh Sync pour combler le vide entre les appareils connectés et un tableau de bord personnel. L'application, le backend et le site sont entièrement développés et maintenus par lui. Approche axée sur la confidentialité et l'indépendance.",

    assetsTitle: "Assets téléchargeables",
    assets: [
      {
        label: "Logo / icône carrée (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Image Open Graph (1200×630, dynamique)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Pour des captures d'écran de l'application, des maquettes, des vidéos ou des supports de marque personnalisés, écrivez à press@fitmesh.fit ; nous répondons sous 24h.",

    storyAnglesTitle: "Angles éditoriaux intéressants",
    storyAngles: [
      "Un développeur indie italien crée une alternative européenne axée sur la confidentialité aux jardins fermés de Samsung, Apple et Google Fit",
      "Comment Health Connect a transformé l'écosystème des appareils connectés Android depuis 2024, et ce que cela signifie pour les consommateurs et les développeurs",
      "Technologie pour les aidants : surveiller la santé de proches âgés sans GPS ni applications intrusives (la feuille de route Mesh Famille)",
      "Programme bêta avec place fondateur à vie gratuite : une alternative au modèle par abonnement, y compris dans les applications de santé",
      "Développer une application de santé en Italie : RGPD, serveurs UE et souveraineté des données comme facteur de différenciation",
    ],

    trademarkNote:
      "FitMesh Sync est une marque de Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit et les autres marques citées sont des marques déposées de leurs propriétaires respectifs ; leur utilisation sur cette page et dans les supports FitMesh n'implique aucune affiliation ni parrainage.",

    sitemapNote:
      "Vous avez besoin de liens spécifiques ? Retrouvez tout sur fitmesh.fit (accueil, /fr/famiglia pour le cas d'usage aidant, /fr/blog pour les articles techniques, /fr/about pour l'histoire du projet).",
  },
  pl: {
    kicker: "Prasa i zestaw mediów",
    h1: "FitMesh Sync: materialy dla dziennikarzy, blogerów i twórców",
    sub:
      "Wszystko, czego potrzebujesz, aby pisac lub mówic o FitMesh Sync. Gotowe do skopiowania, pobieranie zasobów, bez obowiazkowego e-maila.",

    contactTitle: "Bezposredni kontakt prasowy",
    contactBody:
      "W sprawie wywiadów, demonstracji, zasobów w wysokiej rozdzielczosci lub pytán technicznych:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, zalozyciel, jedyny programista",

    taglineTitle: "Tagline (1 wiersz)",
    tagline:
      "FitMesh Sync to premium panel z prywatnoscią na pierwszym miejscu dla danych zdrowotnych wszystkich smartwatchy Twojej rodziny, stworzony we Wloszech przez niezaleznego programiste.",

    blurbsTitle: "Krótki opis (50, 100, 200 slow)",
    blurb50: {
      title: "50 slow",
      body:
        "FitMesh Sync to aplikacja Android, która laczy dane zdrowotne z Galaxy Watch, Mi Band, Polar, Garmin, Fitbit i innych urzadzen w jednym panelu premium. Prywatnosc na pierwszym miejscu, serwery w UE, stworzona we Wloszech. Dziala przez Health Connect bez trackerów ani brokerów danych. Dostepna w Google Play od czerwca 2026; wersja iOS wkrótce.",
    },
    blurb100: {
      title: "100 slow",
      body:
        "FitMesh Sync to aplikacja Android stworzona we Wloszech przez Matteo Pizzi (Fosforonero), aby w jednym panelu premium zlaczyc dane zdrowotne ze wszystkich smartwatchy i opasek fitness dostepnych na rynku. Dziala jako miejsce docelowe Health Connect, wiec jest od razu zgodna z Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei i Oura, bez koniecznosci indywidualnego OAuth dla kazdej marki. Prywatnosc na pierwszym miejscu: serwery UE, RODO, zero brokerów danych. Dostepna w Google Play od czerwca 2026; wersja iOS i funkcja Mesh Rodzina do opieki nad rodzina sa w drodze.",
    },
    blurb200: {
      title: "200 slow (pelny profil)",
      body:
        "FitMesh Sync powstal we Wloszech w 2026 roku z frustracji jednego programisty (Matteo Pizzi, studio Fosforonero), który posiada Galaxy Watch, jego zona uzywa Mi Band, a jego matka Withings. Kazda marka zamyka swoje dane we wlasnej aplikacji. Nikt nie oferuje zunifikowanego widoku premium. FitMesh rozwiazuje dokladnie ten problem: czytajac z Health Connect (standard Androida, który od 2024 gromadzi dane praktycznie ze wszystkich urzadzen), agreguje kroki, tetno, sen, kalorie, treningi i inne metryki w natywnym panelu Flutter zaprojektowanym do codziennego czytania, a nie dla administratorów systemów. Prywatnosc od pierwszego commita: europejskie serwery (Supabase Frankfurt), prawdziwa zgodnosc z RODO, zero brokerów danych, zero trackerów. Strategiczna róznica w stosunku do aplikacji mostów cloud-to-cloud w tej kategorii polega na tym, ze FitMesh nie jest cichym routerem danych: jest miejscem docelowym. Dane sa przechowywane, wizualizowane w starannie opracowanych wykresach i docelowo udostepniane czlonkom rodziny (Mesh Rodzina, w planie rozwoju) w scenariuszach opieki. Aplikacja jest dostepna w Google Play: pierwsi 100 zalozycie otrzymuje Pro dozywotnie za darmo, nastepni 1000 otrzymuje rok Pro. Wersja iOS juz wkrótce.",
    },

    keyFactsTitle: "Kluczowe fakty",
    keyFacts: [
      { label: "Premiera", value: "Dostepna w Google Play od czerwca 2026 · iOS wkrótce" },
      { label: "Platformy", value: "Android (iOS wkrótce)" },
      { label: "Kraj", value: "Wlochy · serwery UE (Frankfurt)" },
      { label: "Technologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Obslugiwane urzadzenia", value: "Ponad 9 marek przez Health Connect, rozszerzalne" },
      { label: "Cena", value: `14 dni próbny, potem Pro ${PRICING.fromLifetime.en} jednorazowo (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) lub ${PRICING.subSixMonthsLabel.en}` },
      { label: "Miejsca zalozycielskie", value: "Pierwsi 100 z Pro dozywotnim gratis · 1000 z 1 rokiem Pro" },
      { label: "Zespól", value: "Indie / jedyny programista (Fosforonero, Matteo Pizzi)" },
      { label: "Kategoria w Google Play", value: "Zdrowie i fitness" },
    ],

    founderTitle: "Zalozyciel",
    founderName: "Matteo Pizzi",
    founderRole: "Zalozyciel i jedyny programista · Fosforonero",
    founderBio:
      "Wloski programista, który stworzyl FitMesh Sync, aby wypelnic luke miedzy urzadzeniami noszonymi a osobistym panelem. Cala aplikacja, backend i strona sa tworzone i utrzymywane przez niego. Podejscie oparte na prywatnosci i niezaleznosci.",

    assetsTitle: "Zasoby do pobrania",
    assets: [
      {
        label: "Logo / ikona kwadratowa (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Obraz Open Graph (1200×630, dynamiczny)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "W sprawie zrzutów ekranu z aplikacji, makiet, wideo lub niestandardowych materialów marki pisz na press@fitmesh.fit; odpowiadamy w ciagu 24 godzin.",

    storyAnglesTitle: "Interesujace katý redakcyjne",
    storyAngles: [
      "Wloski indie developer buduje europejska, prywatna alternatywe dla zamknietych ekosystemów Samsung/Apple/Google Fit",
      "Jak Health Connect zmienil ekosystem urzadzen Android od 2024 roku i co oznacza to dla uzytkowników i programistów",
      "Technologia opiekuncza: monitorowanie zdrowia starszych rodziców bez GPS ani inwazyjnych aplikacji (plan rozwoju Mesh Rodzina)",
      "Dozywotni bezplatny program beta dla zalozycie: alternatywa dla hype subskrypcyjnego, nawet w aplikacjach fitness",
      "Tworzenie aplikacji zdrowotnej we Wloszech: RODO, serwery UE i suwerennosc danych jako wyróznnik",
    ],

    trademarkNote:
      "FitMesh Sync jest znakiem towarowym Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit i inne wymienione marki sa znakami towarowymi swoich wlascicieli; ich uzycie na tej stronie i w materialach FitMesh nie oznacza afiliacji ani sponsorowania.",

    sitemapNote:
      "Potrzebujesz konkretnych linków? Znajdziesz wszystko na fitmesh.fit (strona glówna, /pl/famiglia dla przypadku uzycia opieki, /pl/blog dla artykulów technicznych, /pl/about dla historii projektu).",
  },
  tr: {
    kicker: "Basín ve Medya Kiti",
    h1: "FitMesh Sync: gazeteciler, bloggerlar ve icerik üreticileri icin kaynaklar",
    sub:
      "FitMesh Sync hakkinda yazmak veya konusmak icin ihtiyaciniz olan her sey. Kopyalayip yapistirmaya hazir, kaynak indirme, zorunlu e-posta yok.",

    contactTitle: "Dogrudan basin iletisimi",
    contactBody:
      "Röportajlar, rehberli demolar, yüksek cözünürlüklü kaynaklar veya teknik sorular icin:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, kurucu, tek gelistirici",

    taglineTitle: "Tagline (1 satir)",
    tagline:
      "FitMesh Sync, bagimsiz bir gelistirici tarafindan Italya'da insa edilmis, ailenizin tüm akilli saatlerinin saglik verileri icin gizlilik öncelikli premium bir paneldir.",

    blurbsTitle: "Kisa aciklama (50, 100, 200 kelime)",
    blurb50: {
      title: "50 kelime",
      body:
        "FitMesh Sync, Galaxy Watch, Mi Band, Polar, Garmin, Fitbit ve diger giyilebilir cihazlardaki saglik verilerini tek bir premium panelde birlestiren bir Android uygulamasidir. Gizlilik öncelikli, AB sunuculari, Italya'da gelistirildi. Izleyici veya veri brokeri olmaksizin Health Connect üzerinden calisir. Haziran 2026'dan itibaren Google Play'de mevcut; iOS sürümü cok yakinda.",
    },
    blurb100: {
      title: "100 kelime",
      body:
        "FitMesh Sync, Matteo Pizzi (Fosforonero) tarafindan Italya'da gelistirilmis, piyasadaki tüm akilli saatler ve fitness bantlarindan gelen saglik verilerini tek bir premium panelde birlestirmek icin tasarlanmis bir Android uygulamasidir. Health Connect hedefi olarak calistiginden Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei ve Oura ile her marka icin ayri OAuth gerekmeksizin kullanim disinda uyumludur. Gizlilik öncelikli: AB sunuculari, GDPR, veri brokeri yok. Haziran 2026'dan itibaren Google Play'de mevcut; iOS sürümü ve aile bakimi icin Mesh Aile özelligi en kisa sürede geliyor.",
    },
    blurb200: {
      title: "200 kelime (tam profil)",
      body:
        "FitMesh Sync, Galaxy Watch sahibi olan, esinin Mi Band kullandigi ve annesinin Withings kullandigi bir gelistiricinin (Matteo Pizzi, Fosforonero stüdyosu) hayal kirikligi sonucu 2026 yilinda Italya'da dogdu. Her marka verilerini kendi uygulamasinda kilitledi. Kimse birlesik premium görünüm sunmuyor. FitMesh tam olarak bunu cözüyor: Health Connect'ten (2024'ten itibaren neredeyse tüm giyilebilirlerden veri toplayan Android standardi) okuyarak adimlari, kalp hizini, uykuyu, kalorileri, antrenmanlarini ve diger metrikleri sistem yöneticileri icin degil günlük okuma icin tasarlanmis yerel Flutter panelinde topluyor. Ilk commit'ten itibaren gizlilik öncelikli: Avrupa sunuculari (Supabase Frankfurt), gercek GDPR uyumlulugu, veri brokeri yok, izleyici yok. Sektördeki cloud-to-cloud köprü uygulamalarından stratejik farki su: FitMesh sessiz bir veri yönlendiricisi degil, bir varış noktasidir. Veriler depolanir, özenle hazirlanmis grafiklerle görsellestirilir ve orta vadede bakim senaryolari icin aile üyeleriyle paylasilir (Mesh Aile, yol haritasinda). Uygulama Google Play'de mevcut: ilk 100 kurucu Pro'yu ömür boyu ücretsiz aliyor, sonraki 1000 kisi bir yillik Pro aliyor. iOS sürümü cok yakinda.",
    },

    keyFactsTitle: "Temel bilgiler",
    keyFacts: [
      { label: "Lansman", value: "Haziran 2026'dan itibaren Google Play'de · iOS cok yakinda" },
      { label: "Platformlar", value: "Android (iOS cok yakinda)" },
      { label: "Ülke", value: "Italya · AB sunuculari (Frankfurt)" },
      { label: "Teknoloji yigini", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Desteklenen giyilebilirler", value: "Health Connect üzerinden 9'dan fazla marka, genisletilebilir" },
      { label: "Fiyatlandirma", value: `14 günlük deneme, sonra Pro ${PRICING.fromLifetime.en} tek seferlik (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) veya ${PRICING.subSixMonthsLabel.en}` },
      { label: "Kurucu koltuklari", value: "Ilk 100 ömür boyu ücretsiz · 1000 kisi 1 yillik Pro" },
      { label: "Ekip", value: "Indie / tek gelistirici (Fosforonero, Matteo Pizzi)" },
      { label: "Google Play kategorisi", value: "Saglik ve fitness" },
    ],

    founderTitle: "Kurucu",
    founderName: "Matteo Pizzi",
    founderRole: "Kurucu ve Tek Gelistirici · Fosforonero",
    founderBio:
      "Italyan yazilim gelistiricisi, giyilebilirler ile kisisel panel arasindaki boslugu doldurmak icin FitMesh Sync'i insa etti. Uygulamanin tamamini, backend'i ve siteyi o gelistiriyor ve bakim yapiyor. Gizlilik öncelikli ve bagimsiz yaklasim.",

    assetsTitle: "Indirilebilir kaynaklar",
    assets: [
      {
        label: "Logo / kare simge (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph görseli (1200×630, dinamik)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Uygulama ekran görüntüleri, maketler, video veya özel marka materyalleri icin press@fitmesh.fit adresine yazin; 24 saat icinde yanit veririz.",

    storyAnglesTitle: "Ilginc editoryal acilar",
    storyAngles: [
      "Italyan indie gelistirici, Samsung/Apple/Google Fit'in kapali ekosistemlerine gizlilik öncelikli Avrupa alternatifi insa ediyor",
      "Health Connect, 2024'ten bu yana Android giyilebilir ekosistemini nasil degistirdi ve bu tüketiciler ile gelistiriciler icin ne anlama geliyor",
      "Bakim teknolojisi: GPS veya invasif uygulamalar olmadan yasli ebeveynlerin sagligini takip etmek (Mesh Aile yol haritasi)",
      "Ömür boyu ücretsiz kurucu beta programi: abonelik yaygaro yerine alternatif, fitness uygulamalarinda bile",
      "Italya'da saglik uygulamasi gelistirmek: GDPR, AB sunuculari ve farklilik olarak veri egemenligi",
    ],

    trademarkNote:
      "FitMesh Sync, Fosforonero'nun (Matteo Pizzi) ticari markasıdır. Galaxy Watch, Mi Band, Polar, Garmin, Fitbit ve adı geçen diger markalar ilgili sahiplerinin ticari markalarıdır; bu sayfada ve FitMesh materyallerinde kullanimi herhangi bir baglanti veya sponsorluk anlamina gelmez.",

    sitemapNote:
      "Belirli linklere mi ihtiyaciniz var? Her seyi fitmesh.fit'te bulabilirsiniz (ana sayfa, bakim kullanim senaryosu icin /tr/famiglia, teknik makaleler icin /tr/blog, proje hikayesi icin /tr/about).",
  },
  nl: {
    kicker: "Pers & Mediakit",
    h1: "FitMesh Sync: materiaal voor journalisten, bloggers en creators",
    sub:
      "Alles wat je nodig hebt om over FitMesh Sync te schrijven of te praten. Kant-en-klaar om te kopiëren, assets om te downloaden, geen e-mail verplicht.",

    contactTitle: "Direct perscontact",
    contactBody:
      "Voor interviews, begeleide demo's, assets in hoge resolutie of technische vragen:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, oprichter, solo-ontwikkelaar",

    taglineTitle: "Tagline (1 regel)",
    tagline:
      "FitMesh Sync is het privacy-first premium dashboard voor de gezondheidsdata van alle smartwatches in je gezin, gebouwd in Italië door een onafhankelijke ontwikkelaar.",

    blurbsTitle: "Korte beschrijving (50, 100, 200 woorden)",
    blurb50: {
      title: "50 woorden",
      body:
        "FitMesh Sync is een Android-app die de gezondheidsdata van Galaxy Watch, Mi Band, Polar, Garmin, Fitbit en andere wearables samenbrengt in één premium dashboard. Privacy-first, EU-servers, gebouwd in Italië. Werkt via Health Connect zonder trackers of databrokers. Beschikbaar op Google Play sinds juni 2026; iOS-versie binnenkort.",
    },
    blurb100: {
      title: "100 woorden",
      body:
        "FitMesh Sync is een Android-app, ontwikkeld in Italië door Matteo Pizzi (Fosforonero), om de gezondheidsdata van elke smartwatch en fitnessband op de markt samen te brengen in één premium dashboard. De app werkt als Health Connect-bestemming en is daardoor meteen compatibel met Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei en Oura, zonder aparte OAuth per merk. Privacy-first: EU-servers, GDPR, geen databrokers. Beschikbaar op Google Play sinds juni 2026; de iOS-versie en de functie Familie Mesh voor familiezorg komen binnenkort.",
    },
    blurb200: {
      title: "200 woorden (volledig profiel)",
      body:
        "FitMesh Sync ontstond in 2026 in Italië uit de frustratie van één ontwikkelaar (Matteo Pizzi, studio Fosforonero) die een Galaxy Watch draagt, wiens vrouw een Mi Band gebruikt en wiens moeder een Withings heeft. Elk merk sluit zijn data op in de eigen app. Niemand biedt een verenigd premium overzicht. FitMesh lost precies dat op: door uit te lezen van Health Connect (de Android-standaard die sinds 2024 data van vrijwel alle wearables verzamelt) bundelt de app stappen, hartslag, slaap, calorieën, trainingen en andere metrieken in een native Flutter-dashboard, ontworpen voor dagelijks gebruik, niet voor systeembeheerders. Privacy-first vanaf de eerste commit: Europese servers (Supabase Frankfurt), echte GDPR-naleving, geen databrokers, geen trackers. Het strategische verschil met cloud-naar-cloud bridge-apps in de categorie is dat FitMesh geen stille datarouter is: het is een bestemming. Data wordt opgeslagen, gevisualiseerd met zorgvuldige grafieken en op middellange termijn gedeeld tussen gezinsleden (Familie Mesh, op de roadmap) voor zorgscenario's. De app is beschikbaar op Google Play: de eerste 1.000 founders krijgen Pro levenslang gratis, automatisch toegekend bij registratie. De iOS-versie komt binnenkort.",
    },

    keyFactsTitle: "Kerngegevens",
    keyFacts: [
      { label: "Lancering", value: "Publiek op Google Play sinds juni 2026 · iOS binnenkort" },
      { label: "Platforms", value: "Android (iOS binnenkort)" },
      { label: "Land", value: "Italië · EU-servers (Frankfurt)" },
      { label: "Technologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Ondersteunde wearables", value: "9+ merken via Health Connect, uitbreidbaar" },
      { label: "Prijs", value: `14 dagen proberen, daarna Pro ${PRICING.fromLifetime.en} eenmalig (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) of ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder-plekken", value: "Eerste 1.000 accounts: Pro levenslang gratis (automatisch bij registratie)" },
      { label: "Team", value: "Indie / solo-ontwikkelaar (Fosforonero, Matteo Pizzi)" },
      { label: "Play Store-categorie", value: "Gezondheid en fitness" },
    ],

    founderTitle: "Oprichter",
    founderName: "Matteo Pizzi",
    founderRole: "Oprichter & Solo-ontwikkelaar · Fosforonero",
    founderBio:
      "Italiaanse softwareontwikkelaar die FitMesh Sync bouwde om het gat tussen wearables en een persoonlijk dashboard te dichten. De hele app, de backend en de site worden door hem ontwikkeld en onderhouden. Privacy-first en indie-first aanpak.",

    assetsTitle: "Downloadbare assets",
    assets: [
      {
        label: "Logo / vierkant icoon (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph-afbeelding (1200×630, dynamisch)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Voor in-app screenshots, mockups, video of aangepast merkmateriaal mail naar press@fitmesh.fit; we reageren binnen 24 uur.",

    storyAnglesTitle: "Interessante redactionele invalshoeken",
    storyAngles: [
      "Italiaanse indie-ontwikkelaar bouwt een privacy-first Europees alternatief voor de gesloten ecosystemen van Samsung, Apple en Google Fit",
      "Hoe Health Connect het Android-wearable-ecosysteem sinds 2024 veranderde, en wat dat betekent voor consumenten en ontwikkelaars",
      "Zorgtechnologie: de gezondheid van oudere ouders volgen zonder GPS of opdringerige apps (de Familie Mesh-roadmap)",
      "Levenslang gratis founder-betaprogramma: een alternatief voor de abonnementshype, ook in fitness-apps",
      "Een gezondheidsapp bouwen in Italië: GDPR, EU-servers en datasoevereiniteit als onderscheidend kenmerk",
    ],

    trademarkNote:
      "FitMesh Sync is een handelsmerk van Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit en andere genoemde merken zijn handelsmerken van hun respectieve eigenaren; het gebruik ervan op deze pagina en in FitMesh-materiaal impliceert geen affiliatie of sponsoring.",

    sitemapNote:
      "Specifieke links nodig? Je vindt alles op fitmesh.fit (home, /nl/famiglia voor de zorg-use-case, /nl/blog voor technische artikelen, /nl/about voor het projectverhaal).",
  },
  ja: {
    kicker: "プレス＆メディアキット",
    h1: "FitMesh Sync：ジャーナリスト・ブロガー・クリエイター向け資料",
    sub:
      "FitMesh Syncについて書いたり話したりするために必要なすべて。コピペ対応、アセットのダウンロード、メール不要。",

    contactTitle: "プレス直通の連絡先",
    contactBody:
      "インタビュー、ガイド付きデモ、高解像度アセット、技術的なご質問について：",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi、創業者、ソロ開発者",

    taglineTitle: "タグライン（1行）",
    tagline:
      "FitMesh Syncは、家族全員のスマートウォッチの健康データのためのプライバシーファーストなプレミアムダッシュボードで、独立系開発者によってイタリアで開発されました。",

    blurbsTitle: "短い説明（50・100・200語）",
    blurb50: {
      title: "50語",
      body:
        "FitMesh Syncは、Galaxy Watch、Mi Band、Polar、Garmin、Fitbitなどのウェアラブルの健康データを1つのプレミアムダッシュボードに統合するAndroidアプリです。プライバシーファースト、EUサーバー、イタリア開発。トラッカーやデータブローカーなしでHealth Connectを介して動作します。2026年6月よりGoogle Playで提供中。iOS版は近日公開。",
    },
    blurb100: {
      title: "100語",
      body:
        "FitMesh Syncは、市場のあらゆるスマートウォッチやフィットネスバンドからの健康データを1つのプレミアムダッシュボードに統合するため、Matteo Pizzi（Fosforonero）がイタリアで開発したAndroidアプリです。Health Connectの保存先として動作するため、Galaxy Watch、Mi Band、Polar、Garmin、Fitbit、Withings、Honor、Huawei、OuraとブランドごとのOAuthなしで標準対応します。プライバシーファースト：EUサーバー、GDPR、データブローカーなし。2026年6月よりGoogle Playで提供中。iOS版と家族介護向けのMesh Family機能も近日登場。",
    },
    blurb200: {
      title: "200語（フルプロフィール）",
      body:
        "FitMesh Syncは2026年、Galaxy Watchを使い、妻はMi Band、母はWithingsを使う開発者（Matteo Pizzi、Fosforoneroスタジオ）の不満からイタリアで生まれました。各ブランドはデータを自社アプリ内に閉じ込めます。誰も統合されたプレミアムなビューを提供していません。FitMeshはまさにこれを解決します。Health Connect（2024年以降、ほぼすべてのウェアラブルのデータを集めるAndroidの標準）から読み取り、歩数・心拍数・睡眠・カロリー・ワークアウトなどの指標を、システム管理者向けではなく日々の閲覧のために設計されたネイティブFlutterダッシュボードに集約します。最初のコミットからプライバシーファースト：欧州サーバー（Supabaseフランクフルト）、真のGDPR準拠、データブローカーなし、トラッカーなし。同カテゴリのクラウド間ブリッジアプリとの戦略的な違いは、FitMeshが静かなデータルーターではなく「保存先」である点です。データは保存され、丁寧なグラフで可視化され、中期的には介護シナリオ向けに家族間で共有されます（Mesh Family、ロードマップ）。アプリはGoogle Playで提供中：最初の1,000人のファウンダーは登録時に自動で生涯Proが無料になります。iOS版は近日公開予定です。",
    },

    keyFactsTitle: "主要データ",
    keyFacts: [
      { label: "ローンチ", value: "2026年6月よりGoogle Playで公開 · iOSは近日" },
      { label: "プラットフォーム", value: "Android（iOSは近日）" },
      { label: "国", value: "イタリア · EUサーバー（フランクフルト）" },
      { label: "技術スタック", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "対応ウェアラブル", value: "Health Connect経由で9ブランド以上、拡張可能" },
      { label: "価格", value: `14日間トライアル、その後Pro ${PRICING.fromLifetime.en} 買い切り（Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}）または ${PRICING.subSixMonthsLabel.en}` },
      { label: "ファウンダー枠", value: "最初の1,000アカウント：生涯Pro無料（登録時に自動付与）" },
      { label: "チーム", value: "インディー / ソロ開発者（Fosforonero、Matteo Pizzi）" },
      { label: "Play Storeカテゴリ", value: "健康＆フィットネス" },
    ],

    founderTitle: "創業者",
    founderName: "Matteo Pizzi",
    founderRole: "創業者 & ソロ開発者 · Fosforonero",
    founderBio:
      "イタリアのソフトウェア開発者。ウェアラブルと個人ダッシュボードの間のギャップを埋めるためにFitMesh Syncを開発しました。アプリ、バックエンド、サイトのすべてを彼自身が開発・保守しています。プライバシーファースト、インディーファーストのアプローチ。",

    assetsTitle: "ダウンロード可能なアセット",
    assets: [
      {
        label: "ロゴ / 正方形アイコン（PNG 1254×1254）",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph画像（1200×630、動的）",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon（PNG）",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "アプリ内スクリーンショット、モックアップ、動画、カスタムブランド素材については press@fitmesh.fit までご連絡ください。24時間以内に返信します。",

    storyAnglesTitle: "興味深い編集アングル",
    storyAngles: [
      "イタリアのインディー開発者が、Samsung・Apple・Google Fitの囲い込みに対するプライバシーファーストな欧州の代替を構築",
      "Health Connectが2024年以降にAndroidウェアラブルのエコシステムをどう変えたか、そして消費者と開発者にとっての意味",
      "介護テック：GPSや侵襲的なアプリなしで高齢の親の健康を見守る（Mesh Familyのロードマップ）",
      "生涯無料のファウンダーベータプログラム：フィットネスアプリでもサブスク偏重への代替",
      "イタリアで健康アプリを開発する：差別化要因としてのGDPR・EUサーバー・データ主権",
    ],

    trademarkNote:
      "FitMesh SyncはFosforonero（Matteo Pizzi）の商標です。Galaxy Watch、Mi Band、Polar、Garmin、Fitbitおよびその他の言及されたブランドは各所有者の商標であり、本ページおよびFitMesh素材での使用は提携やスポンサーシップを意味するものではありません。",

    sitemapNote:
      "特定のリンクが必要ですか？すべて fitmesh.fit でご覧いただけます（ホーム、介護のユースケースは /ja/famiglia、技術記事は /ja/blog、プロジェクトの歴史は /ja/about）。",
  },
  ko: {
    kicker: "프레스 & 미디어 키트",
    h1: "FitMesh Sync: 기자, 블로거, 크리에이터를 위한 자료",
    sub:
      "FitMesh Sync에 대해 쓰거나 이야기하는 데 필요한 모든 것. 복사해 붙여넣기 가능, 에셋 다운로드, 이메일 불필요.",

    contactTitle: "프레스 직통 연락처",
    contactBody:
      "인터뷰, 가이드 데모, 고해상도 에셋 또는 기술 문의는:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, 창업자, 1인 개발자",

    taglineTitle: "태그라인 (1줄)",
    tagline:
      "FitMesh Sync는 가족 모두의 스마트워치 건강 데이터를 위한 프라이버시 우선 프리미엄 대시보드로, 이탈리아의 독립 개발자가 만들었습니다.",

    blurbsTitle: "간단한 설명 (50, 100, 200단어)",
    blurb50: {
      title: "50단어",
      body:
        "FitMesh Sync는 Galaxy Watch, Mi Band, Polar, Garmin, Fitbit 등 웨어러블의 건강 데이터를 하나의 프리미엄 대시보드로 통합하는 Android 앱입니다. 프라이버시 우선, EU 서버, 이탈리아에서 개발. 트래커나 데이터 브로커 없이 Health Connect를 통해 작동합니다. 2026년 6월부터 Google Play에서 이용 가능; iOS 버전 곧 출시.",
    },
    blurb100: {
      title: "100단어",
      body:
        "FitMesh Sync는 시장의 모든 스마트워치와 피트니스 밴드의 건강 데이터를 하나의 프리미엄 대시보드로 통합하기 위해 Matteo Pizzi(Fosforonero)가 이탈리아에서 개발한 Android 앱입니다. Health Connect 대상으로 작동하므로 Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei, Oura와 브랜드별 OAuth 없이 기본 호환됩니다. 프라이버시 우선: EU 서버, GDPR, 데이터 브로커 없음. 2026년 6월부터 Google Play에서 이용 가능; iOS 버전과 가족 돌봄을 위한 Mesh Family 기능이 곧 출시됩니다.",
    },
    blurb200: {
      title: "200단어 (전체 프로필)",
      body:
        "FitMesh Sync는 Galaxy Watch를 쓰고, 아내는 Mi Band, 어머니는 Withings를 사용하는 한 개발자(Matteo Pizzi, Fosforonero 스튜디오)의 불만에서 2026년 이탈리아에서 탄생했습니다. 각 브랜드는 자사 앱 안에 데이터를 가둡니다. 통합된 프리미엄 뷰를 제공하는 곳은 없습니다. FitMesh는 바로 이 문제를 해결합니다. Health Connect(2024년부터 사실상 모든 웨어러블의 데이터를 모으는 Android 표준)에서 읽어, 걸음 수·심박수·수면·칼로리·운동 등의 지표를 시스템 관리자가 아닌 일상적인 열람을 위해 설계된 네이티브 Flutter 대시보드로 집계합니다. 첫 커밋부터 프라이버시 우선: 유럽 서버(Supabase 프랑크푸르트), 실질적인 GDPR 준수, 데이터 브로커 없음, 트래커 없음. 동종 클라우드 간 브리지 앱과의 전략적 차이는 FitMesh가 조용한 데이터 라우터가 아니라 목적지라는 점입니다. 데이터는 저장되고, 정성스러운 차트로 시각화되며, 중기적으로는 돌봄 시나리오를 위해 가족 구성원 간에 공유됩니다(Mesh Family, 로드맵). 앱은 Google Play에서 이용 가능합니다: 처음 1,000명의 파운더는 가입 시 자동으로 평생 Pro를 무료로 받습니다. iOS 버전은 곧 출시됩니다.",
    },

    keyFactsTitle: "핵심 정보",
    keyFacts: [
      { label: "출시", value: "2026년 6월부터 Google Play에 공개 · iOS 곧 출시" },
      { label: "플랫폼", value: "Android (iOS 곧 출시)" },
      { label: "국가", value: "이탈리아 · EU 서버 (프랑크푸르트)" },
      { label: "기술 스택", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "지원 웨어러블", value: "Health Connect를 통해 9개 이상 브랜드, 확장 가능" },
      { label: "가격", value: `14일 체험판, 이후 Pro ${PRICING.fromLifetime.en} 일회성 (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) 또는 ${PRICING.subSixMonthsLabel.en}` },
      { label: "파운더 좌석", value: "처음 1,000개 계정: 평생 Pro 무료 (가입 시 자동 부여)" },
      { label: "팀", value: "인디 / 1인 개발자 (Fosforonero, Matteo Pizzi)" },
      { label: "Play 스토어 카테고리", value: "건강 및 피트니스" },
    ],

    founderTitle: "창업자",
    founderName: "Matteo Pizzi",
    founderRole: "창업자 & 1인 개발자 · Fosforonero",
    founderBio:
      "이탈리아의 소프트웨어 개발자로, 웨어러블과 개인 대시보드 사이의 간극을 메우기 위해 FitMesh Sync를 만들었습니다. 앱, 백엔드, 사이트 전체를 그가 직접 개발하고 유지합니다. 프라이버시 우선, 인디 우선 접근.",

    assetsTitle: "다운로드 가능한 에셋",
    assets: [
      {
        label: "로고 / 정사각형 아이콘 (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph 이미지 (1200×630, 동적)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch icon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "앱 내 스크린샷, 목업, 동영상 또는 맞춤 브랜드 자료는 press@fitmesh.fit으로 문의해 주세요. 24시간 이내에 답변드립니다.",

    storyAnglesTitle: "흥미로운 편집 관점",
    storyAngles: [
      "이탈리아 인디 개발자가 Samsung·Apple·Google Fit의 폐쇄형 생태계에 대한 프라이버시 우선 유럽 대안을 만들다",
      "Health Connect가 2024년 이후 Android 웨어러블 생태계를 어떻게 바꿨고, 소비자와 개발자에게 무엇을 의미하는가",
      "돌봄 기술: GPS나 침해적인 앱 없이 고령 부모의 건강을 모니터링하기 (Mesh Family 로드맵)",
      "평생 무료 파운더 베타 프로그램: 피트니스 앱에서도 구독 과열에 대한 대안",
      "이탈리아에서 건강 앱을 개발하기: 차별화 요소로서의 GDPR, EU 서버, 데이터 주권",
    ],

    trademarkNote:
      "FitMesh Sync는 Fosforonero(Matteo Pizzi)의 상표입니다. Galaxy Watch, Mi Band, Polar, Garmin, Fitbit 및 기타 언급된 브랜드는 각 소유자의 상표이며, 본 페이지와 FitMesh 자료에서의 사용은 제휴나 후원을 의미하지 않습니다.",

    sitemapNote:
      "특정 링크가 필요하신가요? 모든 내용은 fitmesh.fit에서 확인할 수 있습니다 (홈, 돌봄 사용 사례는 /ko/famiglia, 기술 기사는 /ko/blog, 프로젝트 이야기는 /ko/about).",
  },
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const titles: Record<Locale, string> = {
    it: "Rassegna stampa e media kit — FitMesh Sync",
    en: "Press & Media kit — FitMesh Sync",
    es: "Prensa y kit de medios — FitMesh Sync",
    de: "Presse & Media-Kit — FitMesh Sync",
    pt: "Imprensa e media kit — FitMesh Sync",
    fr: "Presse & Kit média — FitMesh Sync",
    pl: "Prasa i zestaw mediów — FitMesh Sync",
    tr: "Basın ve Medya Kiti — FitMesh Sync",
    nl: "Pers & Mediakit — FitMesh Sync",
    ja: "プレス＆メディアキット — FitMesh Sync",
    ko: "프레스 & 미디어 키트 — FitMesh Sync",
    sv: "Press och mediakit: FitMesh Sync",
    da: "Presse og mediekit: FitMesh Sync",
    no: "Presse og mediekit: FitMesh Sync",
    fi: "Lehdistö ja mediapaketti: FitMesh Sync",
  };
  const descriptions: Record<Locale, string> = {
    it: "Risorse per giornalisti, blogger e creator che scrivono di FitMesh Sync: tagline, descrizioni copia-incolla, asset, founder bio, contatto stampa diretto.",
    en: "Resources for journalists, bloggers and creators writing about FitMesh Sync: tagline, copy-paste descriptions, assets, founder bio, direct press contact.",
    es: "Recursos para periodistas, bloggers y creadores que escriben sobre FitMesh Sync: tagline, descripciones para copiar y pegar, recursos, bio del fundador y contacto de prensa directo.",
    de: "Ressourcen für Journalisten, Blogger und Creator, die über FitMesh Sync schreiben: Tagline, Beschreibungen zum Kopieren, Assets, Gründer-Bio und direkter Pressekontakt.",
    pt: "Recursos para jornalistas, bloggers e criadores que escrevem sobre o FitMesh Sync: tagline, descrições para copiar e colar, assets, bio do fundador e contato de imprensa direto.",
    fr: "Ressources pour journalistes, blogueurs et créateurs qui parlent de FitMesh Sync : tagline, descriptions prêtes à copier, assets, bio du fondateur et contact presse direct.",
    pl: "Materiały dla dziennikarzy, blogerów i twórców piszących o FitMesh Sync: tagline, gotowe do skopiowania opisy, zasoby, bio założyciela i bezpośredni kontakt prasowy.",
    tr: "FitMesh Sync hakkında yazan gazeteciler, bloggerlar ve içerik üreticileri için kaynaklar: tagline, kopyala-yapıştır açıklamalar, görseller, kurucu bilgisi ve doğrudan basın iletişimi.",
    nl: "Materiaal voor journalisten, bloggers en creators die over FitMesh Sync schrijven: tagline, kant-en-klare beschrijvingen, assets, oprichtersbio en direct perscontact.",
    ja: "FitMesh Syncについて書くジャーナリスト・ブロガー・クリエイター向けの資料：タグライン、コピペ用の説明文、アセット、創業者プロフィール、プレス直通連絡先。",
    ko: "FitMesh Sync에 관해 글을 쓰는 기자, 블로거, 크리에이터를 위한 자료: 태그라인, 복사해 붙여넣는 설명, 에셋, 창업자 소개, 프레스 직통 연락처.",
    sv: "Resurser för journalister, bloggare och kreatörer som skriver om FitMesh Sync: tagline, färdiga beskrivningar att kopiera, assets, grundarbio och direkt presskontakt.",
    da: "Ressourcer til journalister, bloggere og kreatorer, der skriver om FitMesh Sync: tagline, klar-til-kopiering-beskrivelser, assets, stifterbio og direkte pressekontakt.",
    no: "Ressurser for journalister, bloggere og skapere som skriver om FitMesh Sync: tagline, ferdige beskrivelser til kopiering, assets, gründerbio og direkte pressekontakt.",
    fi: "Resursseja toimittajille, bloggaajille ja sisällöntekijöille, jotka kirjoittavat FitMesh Syncistä: tagline, valmiit kopioitavat kuvaukset, materiaalit, perustajan esittely ja suora lehdistöyhteys.",
  };
  const title = titles[lc];
  const description = descriptions[lc];

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/press`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/press`),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lc}/press`,
      siteName: "FitMesh Sync",
      title,
      description,
      locale: ogLocale[lc],
    },
  };
}

export default async function PressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const copyKey = (lc in COPY ? lc : "en") as keyof typeof COPY;
  const t = COPY[copyKey];
  const path = `/${lc}/press`;
  const crumbName = lc === "it" ? "Press" : "Press";

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: "Press & Media Kit — FitMesh Sync",
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US",
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: { "@id": `${SITE_URL}#organization` },
  };

  return (
    <article className="relative">
      <JsonLd data={webPageLd} />
      <Breadcrumbs items={[{ name: crumbName, path }]} locale={lc} />

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-12 sm:pt-16 sm:pb-16">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-aqua font-semibold">
          {t.kicker}
        </p>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
          {t.h1}
        </h1>
        <p className="mt-6 text-lg text-text-secondary leading-relaxed">
          {t.sub}
        </p>
      </section>

      {/* CONTACT */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-brand-aqua/30 bg-brand-aqua/[0.04] p-6 sm:p-7">
          <h2 className="font-display text-xl font-bold text-text-primary">
            {t.contactTitle}
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">{t.contactBody}</p>
          <p className="mt-4">
            <a
              href={`mailto:${t.contactEmail}`}
              className="text-brand-aqua font-mono text-lg font-semibold hover:text-brand-green transition"
            >
              {t.contactEmail}
            </a>
            <span className="ml-2 text-text-muted text-sm">
              ({lc === "it" ? "oppure" : lc === "es" ? "o" : "or"}{" "}
              <a
                href={`mailto:${t.contactAltEmail}`}
                className="text-text-secondary underline hover:text-text-primary"
              >
                {t.contactAltEmail}
              </a>
              )
            </span>
          </p>
          <p className="mt-2 text-sm text-text-muted">{t.contactPersonLine}</p>
        </div>
      </section>

      {/* TAGLINE */}
      <Block title={t.taglineTitle}>
        <CopyBox text={t.tagline} />
      </Block>

      {/* BLURBS */}
      <Block title={t.blurbsTitle}>
        <div className="space-y-5">
          <NamedCopyBox title={t.blurb50.title} text={t.blurb50.body} />
          <NamedCopyBox title={t.blurb100.title} text={t.blurb100.body} />
          <NamedCopyBox title={t.blurb200.title} text={t.blurb200.body} />
        </div>
      </Block>

      {/* KEY FACTS */}
      <Block title={t.keyFactsTitle}>
        <dl className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {t.keyFacts.map((kf) => (
            <div
              key={kf.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <dt className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold">
                {kf.label}
              </dt>
              <dd className="mt-1 text-sm text-text-primary font-medium">
                {kf.value}
              </dd>
            </div>
          ))}
        </dl>
      </Block>

      {/* FOUNDER */}
      <Block title={t.founderTitle}>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex gap-5 items-start">
          <div className="shrink-0 w-14 h-14 rounded-full bg-brand-aqua/15 border border-brand-aqua/30 flex items-center justify-center text-brand-aqua font-display font-bold text-2xl">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-text-primary text-lg">
              {t.founderName}
            </p>
            <p className="text-xs text-text-muted">{t.founderRole}</p>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {t.founderBio}
            </p>
            <p className="mt-3 text-xs">
              <a
                href="https://www.fosforonero.com"
                target="_blank"
                rel="noopener"
                className="text-brand-aqua hover:text-brand-green underline"
              >
                fosforonero.com
              </a>
            </p>
          </div>
        </div>
      </Block>

      {/* ASSETS */}
      <Block title={t.assetsTitle}>
        <ul className="space-y-2">
          {t.assets.map((a) => (
            <li key={a.label}>
              <a
                href={a.href}
                download
                className="inline-flex items-center gap-2 text-sm text-brand-aqua hover:text-brand-green transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {a.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-text-muted">{t.assetsNote}</p>
      </Block>

      {/* STORY ANGLES */}
      <Block title={t.storyAnglesTitle}>
        <ul className="space-y-2.5">
          {t.storyAngles.map((angle) => (
            <li
              key={angle}
              className="flex gap-2.5 text-sm text-text-secondary leading-relaxed"
            >
              <span className="text-brand-aqua mt-0.5 shrink-0">→</span>
              <span>{angle}</span>
            </li>
          ))}
        </ul>
      </Block>

      {/* TRUST */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        <TrustBadges locale={lc === "it" ? "it" : "en"} />
      </section>

      {/* TRADEMARK + SITEMAP NOTE */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-card border border-divider bg-bg-card/40 p-5 space-y-3">
          <p className="text-xs text-text-muted leading-relaxed">
            {t.trademarkNote}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            {t.sitemapNote}
          </p>
          <p className="text-xs text-text-muted">
            <Link href={`/${lc}/about`} className="text-text-secondary underline hover:text-text-primary">
              {lc === "it" ? "Più sul progetto →" : lc === "es" ? "Más sobre el proyecto →" : "More about the project →"}
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
      <h2 className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CopyBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-sm text-text-primary leading-relaxed selection:bg-brand-aqua/30">
        {text}
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-text-muted">
        {/* Hint: l'utente seleziona testo, copia con Cmd/Ctrl+C. */}
        ↑ {/* selectable */}
      </p>
    </div>
  );
}

function NamedCopyBox({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted font-semibold mb-2">
        {title}
      </p>
      <p className="text-sm text-text-primary leading-relaxed selection:bg-brand-aqua/30">
        {text}
      </p>
    </div>
  );
}
