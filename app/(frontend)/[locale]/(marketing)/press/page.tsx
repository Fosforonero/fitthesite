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
import { locales, type Locale, ogLocale } from "@/lib/i18n";
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
        "FitMesh Sync nasce in Italia nel 2026 dalla frustrazione di uno sviluppatore (Matteo Pizzi, studio Fosforonero) che possiede un Galaxy Watch, la moglie usa una Mi Band, la madre un Withings. Ogni brand chiude i propri dati nella propria app. Nessuno offre una vista unificata premium. FitMesh risolve esattamente questo: leggendo da Health Connect (lo standard Android che dal 2024 raccoglie i dati di praticamente tutti i wearable), aggrega passi, frequenza cardiaca, sonno, calorie, workout e altre metriche in una dashboard nativa Flutter pensata per la lettura quotidiana, non per il sysadmin. Privacy-first dal primo commit: server europei (Supabase Francoforte), GDPR-compliance reale, zero broker dati, zero tracker. La differenziazione strategica rispetto alle bridge app cloud-to-cloud del settore è che FitMesh non è un router silenzioso di dati: è una destinazione. I dati sono archiviati, visualizzati con grafici curati, e nel medio termine condivisibili tra membri famiglia (Mesh Famiglia, in roadmap) per scenari caregiver. L'app è disponibile su Google Play: i primi 100 founder hanno il Pro a vita gratis, i 1000 successivi un anno di Pro. La versione iOS è in arrivo.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Lancio", value: "Pubblica su Google Play da giugno 2026 · iOS in arrivo" },
      { label: "Piattaforme", value: "Android (iOS in arrivo)" },
      { label: "Country", value: "Italia · server UE (Francoforte)" },
      { label: "Tecnologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearable supportati", value: "9+ brand via Health Connect, espandibili" },
      { label: "Pricing", value: `Free tier + Pro ${PRICING.fromLifetime.it} una tantum (Android ${PRICING.lifetimeAndroid.it} · iPhone ${PRICING.lifetimeIos.it}) o ${PRICING.subSixMonthsLabel.it}` },
      { label: "Posti founder", value: "Primi 100 a vita gratis · 1000 con 1 anno di Pro" },
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
        "FitMesh Sync was born in Italy in 2026 from the frustration of one developer (Matteo Pizzi, studio Fosforonero) who owns a Galaxy Watch, his wife uses a Mi Band, his mother a Withings. Every brand locks its own data inside its own app. Nobody offers a unified premium view. FitMesh solves exactly this: by reading from Health Connect (the Android standard that since 2024 collects data from virtually all wearables), it aggregates steps, heart rate, sleep, calories, workouts and other metrics into a native Flutter dashboard designed for daily reading, not for sysadmins. Privacy-first from the first commit: European servers (Supabase Frankfurt), real GDPR compliance, no data brokers, no trackers. The strategic differentiation versus cloud-to-cloud bridge apps in the category is that FitMesh is not a silent data router: it is a destination. Data is stored, visualized with curated charts, and in the medium term shared between family members (Family Mesh, roadmap) for caregiver scenarios. The app is available on Google Play: the first 100 founders get Pro free for life, the next 1000 get a year of Pro. The iOS version is coming soon.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Launch", value: "Public on Google Play since June 2026 · iOS coming soon" },
      { label: "Platforms", value: "Android (iOS coming soon)" },
      { label: "Country", value: "Italy · EU servers (Frankfurt)" },
      { label: "Tech stack", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables supported", value: "9+ brands via Health Connect, expandable" },
      { label: "Pricing", value: `Free tier + Pro ${PRICING.fromLifetime.en} one-time (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) or ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder seats", value: "First 100 lifetime-free · 1000 with 1 year of Pro" },
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
      { label: "Precio", value: `Nivel gratuito + Pro desde €3,99 pago único (Android €3,99 · iPhone €4,99) o €1,19/6 meses` },
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
      { label: "Preis", value: `Kostenlose Version + Pro ${PRICING.fromLifetime.de} einmalig (Android ${PRICING.lifetimeAndroid.de} · iPhone ${PRICING.lifetimeIos.de}) oder ${PRICING.subSixMonthsLabel.de}` },
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
      { label: "Preço", value: `Plano gratuito + Pro ${PRICING.fromLifetime.pt} pagamento único (Android ${PRICING.lifetimeAndroid.pt} · iPhone ${PRICING.lifetimeIos.pt}) ou ${PRICING.subSixMonthsLabel.pt}` },
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
      { label: "Tarif", value: `Version gratuite + Pro ${PRICING.fromLifetime.fr} paiement unique (Android ${PRICING.lifetimeAndroid.fr} · iPhone ${PRICING.lifetimeIos.fr}) ou ${PRICING.subSixMonthsLabel.fr}` },
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

  const title = "Press & Media Kit — FitMesh Sync";
  const description = lc === "it"
    ? "Risorse per giornalisti, blogger e creator che scrivono di FitMesh Sync: tagline, descrizioni copia-incolla, asset, founder bio, contatto stampa diretto."
    : lc === "es"
    ? "Recursos para periodistas, bloggers y creadores que escriben sobre FitMesh Sync: tagline, descripciones para copiar y pegar, recursos, bio del fundador y contacto de prensa directo."
    : "Resources for journalists, bloggers and creators writing about FitMesh Sync: tagline, copy-paste descriptions, assets, founder bio, direct press contact.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/press`,
      languages: {
        it: `${SITE_URL}/it/press`,
        en: `${SITE_URL}/en/press`,
        es: `${SITE_URL}/es/press`,
        "x-default": `${SITE_URL}/it/press`,
      },
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
  const t = COPY[lc];
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
