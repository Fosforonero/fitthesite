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
import { organizationCompactRef } from "@/components/seo/OrganizationJsonLd";
import TrustBadges from "@/components/TrustBadges";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { PRICING } from "@/lib/pricing";
import { PROVIDERS } from "@/lib/providers/data";
import { isLocaleInCopy } from "@/lib/content/page-copy-gate";

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
        "FitMesh Sync è un'app Android e iOS che unifica i dati di salute di Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e altri wearable in una dashboard premium. Privacy-first, server in UE, sviluppata in Italia. Funziona via Health Connect (Android) e Apple Salute (iOS) senza tracker o broker dati. Disponibile su Google Play e App Store da giugno 2026; l'app iOS è disponibile, incluse tutte le storefront dell'Unione Europea.",
    },
    blurb100: {
      title: "100 parole",
      body:
        "FitMesh Sync è un'app Android e iOS sviluppata in Italia da Matteo Pizzi (Fosforonero) per unificare in una sola dashboard premium i dati di salute provenienti da tutti gli smartwatch e fitness band sul mercato. Su Android lavora come destinazione di Health Connect, quindi è compatibile out-of-the-box con Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei e Oura, senza bisogno di OAuth per ognuno; su iOS legge direttamente da Apple Salute e si connette via Bluetooth all'anello Colmi. Privacy-first: server EU, GDPR, zero broker dati. Disponibile su Google Play e App Store da giugno 2026 (l'app iOS è disponibile, incluse tutte le storefront UE); in arrivo Mesh Famiglia, la funzione per condividere i dati di salute con la propria famiglia.",
    },
    blurb200: {
      title: "200 parole (profilo completo)",
      body:
        "FitMesh Sync nasce in Italia nel 2026 dalla frustrazione di uno sviluppatore (Matteo Pizzi, studio Fosforonero) che possiede un Galaxy Watch, la moglie usa una Mi Band, la madre un Withings. Ogni brand chiude i propri dati nella propria app. Nessuno offre una vista unificata premium. FitMesh risolve esattamente questo: leggendo da Health Connect (lo standard Android che dal 2024 raccoglie i dati di praticamente tutti i wearable), aggrega passi, frequenza cardiaca, sonno, calorie, workout e altre metriche in una dashboard nativa Flutter pensata per la lettura quotidiana, non per il sysadmin. Privacy-first dal primo commit: server europei (Supabase Francoforte), GDPR-compliance reale, zero broker dati, zero tracker. La differenziazione strategica rispetto alle bridge app cloud-to-cloud del settore è che FitMesh non è un router silenzioso di dati: è una destinazione. I dati sono archiviati, visualizzati con grafici curati, e condivisibili tra i membri della stessa famiglia (Mesh Famiglia): ognuno condivide i propri dati con gli altri, in un'unica dashboard. L'app è disponibile su Google Play e App Store: i primi 1000 founder (programma chiuso dal 31 luglio 2026) hanno ricevuto il Pro a vita gratis, attivato automaticamente alla registrazione. L'app iOS è disponibile, incluse tutte le storefront dei 27 paesi UE.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Lancio", value: "Pubblica su Google Play e App Store da giugno 2026 · iOS live in tutta l'UE" },
      { label: "Piattaforme", value: "Android + iOS (live, incluse tutte le storefront UE)" },
      { label: "Country", value: "Italia · server UE (Francoforte)" },
      { label: "Tecnologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearable supportati", value: `${PROVIDERS.length}+ brand via Health Connect, espandibili` },
      { label: "Pricing", value: `Prova 14 giorni, poi Pro ${PRICING.fromLifetime.it} una tantum (Android ${PRICING.lifetimeAndroid.it} · iPhone ${PRICING.lifetimeIos.it}) o ${PRICING.subSixMonthsLabel.it}` },
      { label: "Posti founder", value: "Primi 1000 account (fino al 31 luglio 2026): Pro a vita gratis per chi si è registrato in tempo" },
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
      "Condivisione familiare: vedere i dati di salute di chi ami in un'unica dashboard, senza GPS né app invasive (Mesh Famiglia)",
      "Beta program founder a vita gratis: alternativa all'hype subscription anche su app fitness",
      "Sviluppare un'app salute in Italia: GDPR, server EU, sovranità dati come differenziatore",
    ],

    trademarkNote:
      "FitMesh Sync è marchio di Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e altri brand citati sono marchi dei rispettivi proprietari; il loro uso in questa pagina e nel materiale FitMesh non implica affiliazione o sponsorizzazione.",

    sitemapNote:
      "Hai bisogno di link specifici? Trovi tutto a fitmesh.fit (home, /it/famiglia per la condivisione dati in famiglia, /it/blog per gli articoli tecnici, /it/about per la storia del progetto).",
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
        "FitMesh Sync is an Android and iOS app that unifies health data from Galaxy Watch, Mi Band, Polar, Garmin, Fitbit and other wearables into one premium dashboard. Privacy-first, EU servers, built in Italy. Runs on Health Connect (Android) and Apple Health (iOS) with no trackers or data brokers. Available on Google Play and the App Store since June 2026; the iOS app is available, including all European Union storefronts.",
    },
    blurb100: {
      title: "100 words",
      body:
        "FitMesh Sync is an Android and iOS app developed in Italy by Matteo Pizzi (Fosforonero) to unify in a single premium dashboard the health data coming from every smartwatch and fitness band on the market. On Android it works as a Health Connect destination, compatible out-of-the-box with Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei and Oura, without requiring per-brand OAuth; on iOS it reads directly from Apple Health and connects over Bluetooth to the Colmi ring. Privacy-first: EU servers, GDPR, no data brokers. Available on Google Play and the App Store since June 2026 (the iOS app is available, including all EU storefronts); Family Mesh, the feature to share health data with your own family, is coming next.",
    },
    blurb200: {
      title: "200 words (full profile)",
      body:
        "FitMesh Sync was born in Italy in 2026 from the frustration of one developer (Matteo Pizzi, studio Fosforonero) who owns a Galaxy Watch, his wife uses a Mi Band, his mother a Withings. Every brand locks its own data inside its own app. Nobody offers a unified premium view. FitMesh solves exactly this: by reading from Health Connect (the Android standard that since 2024 collects data from virtually all wearables), it aggregates steps, heart rate, sleep, calories, workouts and other metrics into a native Flutter dashboard designed for daily reading, not for sysadmins. Privacy-first from the first commit: European servers (Supabase Frankfurt), real GDPR compliance, no data brokers, no trackers. The strategic differentiation versus cloud-to-cloud bridge apps in the category is that FitMesh is not a silent data router: it is a destination. Data is stored, visualized with curated charts, and shared between members of the same family (Family Mesh): everyone shares their own data with the others, in one dashboard. The app is available on Google Play and the App Store: the first 1,000 founders (program closed as of July 31, 2026) got lifetime Pro free, granted automatically on signup. The iOS app is live in all supported storefronts, including the EU.",
    },

    keyFactsTitle: "Key facts",
    keyFacts: [
      { label: "Launch", value: "Public on Google Play and the App Store since June 2026 · iOS live across the EU" },
      { label: "Platforms", value: "Android + iOS (live, including all EU storefronts)" },
      { label: "Country", value: "Italy · EU servers (Frankfurt)" },
      { label: "Tech stack", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables supported", value: `${PROVIDERS.length}+ brands via Health Connect, expandable` },
      { label: "Pricing", value: `14-day trial, then Pro ${PRICING.fromLifetime.en} one-time (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) or ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder seats", value: "First 1,000 accounts (through July 31, 2026): lifetime Pro free for those who signed up in time" },
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
      "Family sharing: see the health data of people you care about in one dashboard, without GPS or invasive apps (Family Mesh)",
      "Lifetime-free founder beta program: an alternative to subscription hype, even in fitness apps",
      "Building a health app in Italy: GDPR, EU servers, data sovereignty as a differentiator",
    ],

    trademarkNote:
      "FitMesh Sync is a trademark of Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit and other brands mentioned are trademarks of their respective owners; their use on this page and in FitMesh materials does not imply affiliation or sponsorship.",

    sitemapNote:
      "Need specific links? You can find everything at fitmesh.fit (home, /en/famiglia for the family-sharing use case, /en/blog for technical articles, /en/about for the project story).",
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
        "FitMesh Sync es una app Android e iOS que unifica los datos de salud de Galaxy Watch, Mi Band, Polar, Garmin, Fitbit y otros wearables en un único panel premium. Privacidad por diseño, servidores en la UE, desarrollada en Italia. Funciona con Health Connect (Android) y Apple Salud (iOS) sin rastreadores ni intermediarios de datos. Disponible en Google Play y App Store desde junio de 2026; la app iOS está disponible, incluidas todas las tiendas de la Unión Europea.",
    },
    blurb100: {
      title: "100 palabras",
      body:
        "FitMesh Sync es una app Android e iOS desarrollada en Italia por Matteo Pizzi (Fosforonero) para unificar en un solo panel premium los datos de salud de todos los smartwatches y pulseras de actividad del mercado. En Android funciona como destino de Health Connect, por lo que es compatible de entrada con Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei y Oura, sin necesidad de autenticación individual por marca; en iOS lee directamente de Apple Salud y se conecta por Bluetooth al anillo Colmi. Privacidad por diseño: servidores en la UE, cumplimiento del RGPD, sin intermediarios de datos. Disponible en Google Play y App Store desde junio de 2026 (la app iOS está disponible, incluidas todas las tiendas de la UE); Mesh Familia, la función para compartir datos de salud con tu propia familia, llega próximamente.",
    },
    blurb200: {
      title: "200 palabras (perfil completo)",
      body:
        "FitMesh Sync nació en Italia en 2026 de la frustración de un desarrollador (Matteo Pizzi, estudio Fosforonero) que tiene un Galaxy Watch, cuya esposa usa una Mi Band y cuya madre tiene un Withings. Cada marca encierra sus datos en su propia app. Nadie ofrece una vista unificada premium. FitMesh resuelve exactamente eso: leyendo desde Health Connect (el estándar Android que desde 2024 recoge datos de prácticamente todos los wearables), agrega pasos, frecuencia cardíaca, sueño, calorías, entrenamientos y otras métricas en un panel nativo Flutter pensado para la lectura diaria, no para administradores de sistemas. Privacidad por diseño desde el primer commit: servidores europeos (Supabase Fráncfort), cumplimiento real del RGPD, sin intermediarios de datos, sin rastreadores. La diferenciación estratégica frente a las apps puente entre ecosistemas de salud del sector es que FitMesh no es un enrutador silencioso de datos: es un destino. Los datos se almacenan, se visualizan con gráficas cuidadas y, a medio plazo, se comparten entre los miembros de la misma familia (Mesh Familia): cada uno comparte sus propios datos con los demás, en un único panel. La app está disponible en Google Play y App Store: los primeros 1.000 fundadores (programa cerrado desde el 31 de julio de 2026) obtuvieron Pro de por vida gratis, activado automáticamente al registrarse. La app iOS está disponible, incluidas todas las tiendas de los 27 países de la UE.",
    },

    keyFactsTitle: "Datos clave",
    keyFacts: [
      { label: "Lanzamiento", value: "Disponible en Google Play y App Store desde junio de 2026 · iOS disponible en toda la UE" },
      { label: "Plataformas", value: "Android + iOS (disponible, incluidas todas las tiendas de la UE)" },
      { label: "País", value: "Italia · servidores en la UE (Fráncfort)" },
      { label: "Tecnologías", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables compatibles", value: `Más de ${PROVIDERS.length} marcas vía Health Connect, ampliable` },
      { label: "Precio", value: `Prueba de 14 días, luego Pro ${PRICING.fromLifetime.es} pago único (Android ${PRICING.lifetimeAndroid.es} · iPhone ${PRICING.lifetimeIos.es}) o ${PRICING.subSixMonthsLabel.es}` },
      { label: "Plazas fundador", value: "Primeros 1.000 cuentas (hasta el 31 de julio de 2026): Pro de por vida gratis para quienes se registraron a tiempo" },
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
      "Compartir en familia: ver los datos de salud de las personas que te importan en un único panel, sin GPS ni apps invasivas (Mesh Familia)",
      "Programa beta con Plaza Fundador de por vida gratis: una alternativa al modelo de suscripción, también en apps de salud",
      "Desarrollar una app de salud en Italia: RGPD, servidores en la UE y soberanía de datos como diferenciador",
    ],

    trademarkNote:
      "FitMesh Sync es marca registrada de Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit y otras marcas citadas son marcas registradas de sus respectivos propietarios; su uso en esta página y en los materiales de FitMesh no implica ninguna afiliación ni patrocinio.",

    sitemapNote:
      "¿Necesitas enlaces concretos? Encuentra todo en fitmesh.fit (inicio, /es/famiglia para el caso de uso de compartir en familia, /es/blog para artículos técnicos, /es/about para la historia del proyecto).",
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
        "FitMesh Sync ist eine Android- und iOS-App, die Gesundheitsdaten von Galaxy Watch, Mi Band, Polar, Garmin, Fitbit und anderen Wearables in einem einzigen Premium-Dashboard vereint. Datenschutz zuerst, Server in der EU, entwickelt in Italien. Läuft über Health Connect (Android) und Apple Health (iOS) ohne Tracker oder Datenvermittler. Seit Juni 2026 auf Google Play und im App Store verfügbar; die iOS-App ist verfügbar, einschließlich aller Storefronts der Europäischen Union.",
    },
    blurb100: {
      title: "100 Wörter",
      body:
        "FitMesh Sync ist eine Android- und iOS-App, entwickelt in Italien von Matteo Pizzi (Fosforonero), um die Gesundheitsdaten aller Smartwatches und Fitness-Tracker auf dem Markt in einem einzigen Premium-Dashboard zu vereinen. Auf Android fungiert die App als Health-Connect-Ziel und ist damit direkt kompatibel mit Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei und Oura, ohne dass für jede Marke eine separate Anmeldung nötig ist; auf iOS liest sie direkt aus Apple Health und verbindet sich per Bluetooth mit dem Colmi-Ring. Datenschutz zuerst: EU-Server, DSGVO, keine Datenvermittler. Seit Juni 2026 auf Google Play und im App Store verfügbar (die iOS-App ist verfügbar, einschließlich aller EU-Storefronts); Mesh Familie, die Funktion zum Teilen von Gesundheitsdaten mit der eigenen Familie, folgt demnächst.",
    },
    blurb200: {
      title: "200 Wörter (vollständiges Profil)",
      body:
        "FitMesh Sync entstand 2026 in Italien aus der Frustration eines Entwicklers (Matteo Pizzi, Studio Fosforonero), der selbst eine Galaxy Watch trägt, dessen Frau eine Mi Band nutzt und dessen Mutter ein Withings-Gerät verwendet. Jede Marke schließt ihre Daten in der eigenen App ein. Niemand bietet eine vereinte Premium-Ansicht. FitMesh löst genau dieses Problem: Die App liest aus Health Connect (dem Android-Standard, der seit 2024 Daten von nahezu allen Wearables sammelt) und aggregiert Schritte, Herzfrequenz, Schlaf, Kalorien, Trainings und weitere Metriken in einem nativen Flutter-Dashboard, das für die tägliche Nutzung konzipiert ist, nicht für Systemadministratoren. Datenschutz von Anfang an: europäische Server (Supabase Frankfurt), echte DSGVO-Compliance, keine Datenvermittler, keine Tracker. Der strategische Unterschied zu Cloud-zu-Cloud-Brückenapps der Branche: FitMesh ist kein stiller Datenrouter, sondern ein Ziel. Daten werden gespeichert, mit sorgfältig gestalteten Diagrammen visualisiert und zwischen Mitgliedern derselben Familie geteilt (Mesh Familie): Jeder teilt seine eigenen Daten mit den anderen, in einem gemeinsamen Dashboard. Die App ist auf Google Play und im App Store verfügbar: Die ersten 1.000 Gründer (Programm seit dem 31. Juli 2026 geschlossen) haben Pro dauerhaft kostenlos erhalten, automatisch aktiviert bei der Registrierung. Die iOS-App ist verfügbar, einschließlich aller Storefronts der 27 EU-Länder.",
    },

    keyFactsTitle: "Key Facts",
    keyFacts: [
      { label: "Start", value: "Seit Juni 2026 auf Google Play und im App Store verfügbar · iOS live in der gesamten EU" },
      { label: "Plattformen", value: "Android + iOS (live, einschließlich aller EU-Storefronts)" },
      { label: "Land", value: "Italien · EU-Server (Frankfurt)" },
      { label: "Technologien", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Unterstützte Wearables", value: `${PROVIDERS.length}+ Marken über Health Connect, erweiterbar` },
      { label: "Preis", value: `14 Tage testen, dann Pro ${PRICING.fromLifetime.de} einmalig (Android ${PRICING.lifetimeAndroid.de} · iPhone ${PRICING.lifetimeIos.de}) oder ${PRICING.subSixMonthsLabel.de}` },
      { label: "Gründerplätze", value: "Erste 1.000 Konten (bis zum 31. Juli 2026): Pro dauerhaft kostenlos für alle, die sich rechtzeitig registriert haben" },
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
      "Familien-Sharing: die Gesundheitsdaten der Menschen, die dir wichtig sind, in einem Dashboard sehen, ohne GPS oder invasive Apps (Mesh Familie)",
      "Lebenslanges Gründer-Beta-Programm kostenlos: eine Alternative zum Abo-Modell, auch bei Fitness-Apps",
      "Eine Gesundheits-App in Italien entwickeln: DSGVO, EU-Server und Datensouveränität als Alleinstellungsmerkmal",
    ],

    trademarkNote:
      "FitMesh Sync ist eine Marke von Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit und andere genannte Marken sind Marken ihrer jeweiligen Eigentümer; ihre Verwendung auf dieser Seite und in FitMesh-Materialien impliziert keine Zugehörigkeit oder Förderung.",

    sitemapNote:
      "Benötigst du bestimmte Links? Alles findest du auf fitmesh.fit (Startseite, /de/famiglia für den Anwendungsfall Familien-Sharing, /de/blog für technische Artikel, /de/about für die Projektgeschichte).",
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
        "FitMesh Sync é um app Android e iOS que unifica dados de saúde do Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e outros wearables em um único painel premium. Privacidade em primeiro lugar, servidores na UE, desenvolvido na Itália. Funciona via Health Connect (Android) e Apple Health (iOS) sem rastreadores ou intermediários de dados. Disponível no Google Play e na App Store desde junho de 2026; o app iOS está disponível, incluindo todas as lojas da União Europeia.",
    },
    blurb100: {
      title: "100 palavras",
      body:
        "FitMesh Sync é um app Android e iOS desenvolvido na Itália por Matteo Pizzi (Fosforonero) para unificar em um único painel premium os dados de saúde de todos os smartwatches e pulseiras fitness do mercado. No Android funciona como destino do Health Connect, sendo compatível de forma nativa com Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei e Oura, sem autenticação individual por marca; no iOS lê diretamente do Apple Health e conecta via Bluetooth ao anel Colmi. Privacidade em primeiro lugar: servidores na UE, LGPD/GDPR, sem intermediários de dados. Disponível no Google Play e na App Store desde junho de 2026 (o app iOS está disponível, incluindo todas as lojas da UE); o Mesh Família, a função para compartilhar dados de saúde com a própria família, chega em breve.",
    },
    blurb200: {
      title: "200 palavras (perfil completo)",
      body:
        "FitMesh Sync nasceu na Itália em 2026 da frustração de um desenvolvedor (Matteo Pizzi, estúdio Fosforonero) que tem um Galaxy Watch, cuja esposa usa uma Mi Band e cuja mãe usa um Withings. Cada marca guarda seus dados dentro do próprio app. Ninguém oferece uma visão unificada premium. FitMesh resolve exatamente isso: lendo do Health Connect (o padrão Android que desde 2024 coleta dados de praticamente todos os wearables), ele agrega passos, frequência cardíaca, sono, calorias, treinos e outras métricas em um painel Flutter nativo pensado para a leitura diária, não para administradores de sistemas. Privacidade desde o primeiro commit: servidores europeus (Supabase Frankfurt), conformidade real com o GDPR, sem intermediários de dados, sem rastreadores. A diferenciação estratégica em relação aos apps de ponte entre ecossistemas do setor é que o FitMesh não é um roteador silencioso de dados: é um destino. Os dados são armazenados, visualizados com gráficos cuidadosamente elaborados e, a médio prazo, compartilhados entre os membros da mesma família (Mesh Família): cada um compartilha seus próprios dados com os demais, em um único painel. O app está disponível no Google Play e na App Store: os primeiros 1.000 fundadores (programa encerrado desde 31 de julho de 2026) receberam o Pro vitalício grátis, ativado automaticamente no cadastro. O app iOS está disponível, incluindo todas as lojas dos 27 países da UE.",
    },

    keyFactsTitle: "Dados principais",
    keyFacts: [
      { label: "Lançamento", value: "Disponível no Google Play e na App Store desde junho de 2026 · iOS disponível em toda a UE" },
      { label: "Plataformas", value: "Android + iOS (disponível, incluindo todas as lojas da UE)" },
      { label: "País", value: "Itália · servidores na UE (Frankfurt)" },
      { label: "Tecnologias", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables compatíveis", value: `Mais de ${PROVIDERS.length} marcas via Health Connect, expansível` },
      { label: "Preço", value: `Teste de 14 dias, depois Pro ${PRICING.fromLifetime.pt} pagamento único (Android ${PRICING.lifetimeAndroid.pt} · iPhone ${PRICING.lifetimeIos.pt}) ou ${PRICING.subSixMonthsLabel.pt}` },
      { label: "Vagas de fundador", value: "Primeiras 1.000 contas (até 31 de julho de 2026): Pro vitalício grátis para quem se cadastrou a tempo" },
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
      "Compartilhamento familiar: ver os dados de saúde de quem você ama em um único painel, sem GPS nem apps invasivos (Mesh Família)",
      "Programa beta com vagas de fundador vitalícias grátis: uma alternativa ao modelo de assinatura, mesmo em apps de saúde",
      "Desenvolver um app de saúde na Itália: GDPR, servidores na UE e soberania dos dados como diferencial",
    ],

    trademarkNote:
      "FitMesh Sync é marca de Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit e outras marcas citadas são marcas registradas de seus respectivos proprietários; o uso delas nesta página e nos materiais do FitMesh não implica afiliação ou patrocínio.",

    sitemapNote:
      "Precisa de links específicos? Encontre tudo em fitmesh.fit (início, /pt/famiglia para o caso de uso de compartilhamento familiar, /pt/blog para artigos técnicos, /pt/about para a história do projeto).",
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
        "FitMesh Sync est une application Android et iOS qui unifie les données de santé du Galaxy Watch, Mi Band, Polar, Garmin, Fitbit et d'autres appareils connectés dans un seul tableau de bord premium. Confidentialité par conception, serveurs en UE, développé en Italie. Fonctionne via Health Connect (Android) et Apple Santé (iOS) sans traceurs ni courtiers de données. Disponible sur Google Play et l'App Store depuis juin 2026 ; l'app iOS est disponible, y compris dans toutes les boutiques de l'Union européenne.",
    },
    blurb100: {
      title: "100 mots",
      body:
        "FitMesh Sync est une application Android et iOS développée en Italie par Matteo Pizzi (Fosforonero) pour unifier dans un seul tableau de bord premium les données de santé de toutes les montres connectées et bracelets fitness du marché. Sur Android, elle fonctionne comme destination Health Connect, compatible d'emblée avec Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei et Oura, sans authentification individuelle par marque ; sur iOS, elle lit directement Apple Santé et se connecte en Bluetooth à l'anneau Colmi. Confidentialité par conception : serveurs UE, RGPD, aucun courtier de données. Disponible sur Google Play et l'App Store depuis juin 2026 (l'app iOS est disponible, y compris dans toutes les boutiques de l'UE) ; Mesh Famille, la fonction pour partager les données de santé avec sa propre famille, arrive prochainement.",
    },
    blurb200: {
      title: "200 mots (profil complet)",
      body:
        "FitMesh Sync est né en Italie en 2026 de la frustration d'un développeur (Matteo Pizzi, studio Fosforonero) qui possède une Galaxy Watch, dont la femme utilise une Mi Band et dont la mère utilise un Withings. Chaque marque enferme ses données dans sa propre application. Personne ne propose une vue unifiée premium. FitMesh résout exactement ce problème : en lisant depuis Health Connect (la norme Android qui, depuis 2024, collecte les données de pratiquement tous les appareils connectés), il agrège pas, fréquence cardiaque, sommeil, calories, séances d'entraînement et d'autres métriques dans un tableau de bord Flutter natif conçu pour une lecture quotidienne, pas pour des administrateurs systèmes. Confidentialité dès le premier commit : serveurs européens (Supabase Francfort), conformité réelle au RGPD, aucun courtier de données, aucun traceur. La différenciation stratégique par rapport aux applications pont entre écosystèmes de santé du secteur est que FitMesh n'est pas un routeur de données silencieux : c'est une destination. Les données sont stockées, visualisées avec des graphiques soignés et, à moyen terme, partagées entre membres d'une même famille (Mesh Famille) : chacun partage ses propres données avec les autres, dans un tableau de bord unique. L'application est disponible sur Google Play et l'App Store : les 1 000 premiers fondateurs (programme clos depuis le 31 juillet 2026) ont bénéficié du Pro à vie gratuitement, activé automatiquement à l'inscription. L'app iOS est disponible, y compris dans toutes les boutiques des 27 pays de l'UE.",
    },

    keyFactsTitle: "Informations clés",
    keyFacts: [
      { label: "Lancement", value: "Disponible sur Google Play et l'App Store depuis juin 2026 · iOS disponible dans toute l'UE" },
      { label: "Plateformes", value: "Android + iOS (disponible, y compris dans toutes les boutiques de l'UE)" },
      { label: "Pays", value: "Italie · serveurs UE (Francfort)" },
      { label: "Technologies", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Appareils compatibles", value: `Plus de ${PROVIDERS.length} marques via Health Connect, extensible` },
      { label: "Tarif", value: `Essai de 14 jours, puis Pro ${PRICING.fromLifetime.fr} paiement unique (Android ${PRICING.lifetimeAndroid.fr} · iPhone ${PRICING.lifetimeIos.fr}) ou ${PRICING.subSixMonthsLabel.fr}` },
      { label: "Places fondateur", value: "1 000 premiers comptes (jusqu'au 31 juillet 2026) : Pro à vie gratuit pour ceux qui se sont inscrits à temps" },
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
      "Partage familial : voir les données de santé des personnes qui comptent pour vous dans un seul tableau de bord, sans GPS ni applications intrusives (Mesh Famille)",
      "Programme bêta avec place fondateur à vie gratuite : une alternative au modèle par abonnement, y compris dans les applications de santé",
      "Développer une application de santé en Italie : RGPD, serveurs UE et souveraineté des données comme facteur de différenciation",
    ],

    trademarkNote:
      "FitMesh Sync est une marque de Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit et les autres marques citées sont des marques déposées de leurs propriétaires respectifs ; leur utilisation sur cette page et dans les supports FitMesh n'implique aucune affiliation ni parrainage.",

    sitemapNote:
      "Vous avez besoin de liens spécifiques ? Retrouvez tout sur fitmesh.fit (accueil, /fr/famiglia pour le cas d'usage de partage familial, /fr/blog pour les articles techniques, /fr/about pour l'histoire du projet).",
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
        "FitMesh Sync to aplikacja Android i iOS, która laczy dane zdrowotne z Galaxy Watch, Mi Band, Polar, Garmin, Fitbit i innych urzadzen w jednym panelu premium. Prywatnosc na pierwszym miejscu, serwery w UE, stworzona we Wloszech. Dziala przez Health Connect (Android) i Apple Zdrowie (iOS) bez trackerów ani brokerów danych. Dostepna w Google Play i App Store od czerwca 2026; aplikacja iOS jest dostepna, we wszystkich sklepach Unii Europejskiej.",
    },
    blurb100: {
      title: "100 slow",
      body:
        "FitMesh Sync to aplikacja Android i iOS stworzona we Wloszech przez Matteo Pizzi (Fosforonero), aby w jednym panelu premium zlaczyc dane zdrowotne ze wszystkich smartwatchy i opasek fitness dostepnych na rynku. Na Androidzie dziala jako miejsce docelowe Health Connect, wiec jest od razu zgodna z Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei i Oura, bez koniecznosci indywidualnego OAuth dla kazdej marki; na iOS odczytuje dane bezposrednio z Apple Zdrowie i laczy sie przez Bluetooth z pierscieniem Colmi. Prywatnosc na pierwszym miejscu: serwery UE, RODO, zero brokerów danych. Dostepna w Google Play i App Store od czerwca 2026 (aplikacja iOS jest dostepna, we wszystkich sklepach UE); Mesh Rodzina, funkcja do dzielenia sie danymi zdrowotnymi z wlasna rodzina, jest w drodze.",
    },
    blurb200: {
      title: "200 slow (pelny profil)",
      body:
        "FitMesh Sync powstal we Wloszech w 2026 roku z frustracji jednego programisty (Matteo Pizzi, studio Fosforonero), który posiada Galaxy Watch, jego zona uzywa Mi Band, a jego matka Withings. Kazda marka zamyka swoje dane we wlasnej aplikacji. Nikt nie oferuje zunifikowanego widoku premium. FitMesh rozwiazuje dokladnie ten problem: czytajac z Health Connect (standard Androida, który od 2024 gromadzi dane praktycznie ze wszystkich urzadzen), agreguje kroki, tetno, sen, kalorie, treningi i inne metryki w natywnym panelu Flutter zaprojektowanym do codziennego czytania, a nie dla administratorów systemów. Prywatnosc od pierwszego commita: europejskie serwery (Supabase Frankfurt), prawdziwa zgodnosc z RODO, zero brokerów danych, zero trackerów. Strategiczna róznica w stosunku do aplikacji mostów cloud-to-cloud w tej kategorii polega na tym, ze FitMesh nie jest cichym routerem danych: jest miejscem docelowym. Dane sa przechowywane, wizualizowane w starannie opracowanych wykresach i udostepniane miedzy czlonkami tej samej rodziny (Mesh Rodzina): kazdy dzieli sie swoimi danymi z pozostalymi, w jednym wspólnym panelu. Aplikacja jest dostepna w Google Play i App Store: pierwsze 1000 kont zalozycielskich (program zamkniety od 31 lipca 2026) otrzymalo Pro dozywotnio za darmo, automatycznie aktywowane przy rejestracji. Aplikacja iOS jest dostepna, we wszystkich sklepach 27 krajów UE.",
    },

    keyFactsTitle: "Kluczowe fakty",
    keyFacts: [
      { label: "Premiera", value: "Dostepna w Google Play i App Store od czerwca 2026 · iOS dostepny w calej UE" },
      { label: "Platformy", value: "Android + iOS (dostepny, we wszystkich sklepach UE)" },
      { label: "Kraj", value: "Wlochy · serwery UE (Frankfurt)" },
      { label: "Technologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Obslugiwane urzadzenia", value: `Ponad ${PROVIDERS.length} marek przez Health Connect, rozszerzalne` },
      { label: "Cena", value: `14 dni próbny, potem Pro ${PRICING.fromLifetime.pl} jednorazowo (Android ${PRICING.lifetimeAndroid.pl} · iPhone ${PRICING.lifetimeIos.pl}) lub ${PRICING.subSixMonthsLabel.pl}` },
      { label: "Miejsca zalozycielskie", value: "Pierwsze 1000 kont (do 31 lipca 2026): Pro dozywotnio za darmo dla tych, ktorzy zarejestrowali sie na czas" },
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
      "Dzielenie sie danymi w rodzinie: zobacz dane zdrowotne bliskich w jednym panelu, bez GPS ani inwazyjnych aplikacji (Mesh Rodzina)",
      "Dozywotni bezplatny program beta dla zalozycie: alternatywa dla hype subskrypcyjnego, nawet w aplikacjach fitness",
      "Tworzenie aplikacji zdrowotnej we Wloszech: RODO, serwery UE i suwerennosc danych jako wyróznnik",
    ],

    trademarkNote:
      "FitMesh Sync jest znakiem towarowym Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit i inne wymienione marki sa znakami towarowymi swoich wlascicieli; ich uzycie na tej stronie i w materialach FitMesh nie oznacza afiliacji ani sponsorowania.",

    sitemapNote:
      "Potrzebujesz konkretnych linków? Znajdziesz wszystko na fitmesh.fit (strona glówna, /pl/famiglia dla przypadku uzycia dzielenia sie danymi w rodzinie, /pl/blog dla artykulów technicznych, /pl/about dla historii projektu).",
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
        "FitMesh Sync, Galaxy Watch, Mi Band, Polar, Garmin, Fitbit ve diger giyilebilir cihazlardaki saglik verilerini tek bir premium panelde birlestiren bir Android ve iOS uygulamasidir. Gizlilik öncelikli, AB sunuculari, Italya'da gelistirildi. Izleyici veya veri brokeri olmaksizin Health Connect (Android) ve Apple Saglik (iOS) üzerinden calisir. Haziran 2026'dan itibaren Google Play ve App Store'da mevcut; iOS uygulamasi Avrupa Birligi'ndeki tüm magazalar dahil olmak üzere kullanilabilir.",
    },
    blurb100: {
      title: "100 kelime",
      body:
        "FitMesh Sync, Matteo Pizzi (Fosforonero) tarafindan Italya'da gelistirilmis, piyasadaki tüm akilli saatler ve fitness bantlarindan gelen saglik verilerini tek bir premium panelde birlestirmek icin tasarlanmis bir Android ve iOS uygulamasidir. Android'de Health Connect hedefi olarak calistiginden Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei ve Oura ile her marka icin ayri OAuth gerekmeksizin kullanim disinda uyumludur; iOS'ta ise dogrudan Apple Saglik'ten okur ve Colmi yüzügüne Bluetooth üzerinden baglanir. Gizlilik öncelikli: AB sunuculari, GDPR, veri brokeri yok. Haziran 2026'dan itibaren Google Play ve App Store'da mevcut (iOS uygulamasi AB'deki tüm magazalar dahil olmak üzere kullanilabilir); kendi ailenizle saglik verilerini paylasma özelligi Mesh Aile en kisa sürede geliyor.",
    },
    blurb200: {
      title: "200 kelime (tam profil)",
      body:
        "FitMesh Sync, Galaxy Watch sahibi olan, esinin Mi Band kullandigi ve annesinin Withings kullandigi bir gelistiricinin (Matteo Pizzi, Fosforonero stüdyosu) hayal kirikligi sonucu 2026 yilinda Italya'da dogdu. Her marka verilerini kendi uygulamasinda kilitledi. Kimse birlesik premium görünüm sunmuyor. FitMesh tam olarak bunu cözüyor: Health Connect'ten (2024'ten itibaren neredeyse tüm giyilebilirlerden veri toplayan Android standardi) okuyarak adimlari, kalp hizini, uykuyu, kalorileri, antrenmanlarini ve diger metrikleri sistem yöneticileri icin degil günlük okuma icin tasarlanmis yerel Flutter panelinde topluyor. Ilk commit'ten itibaren gizlilik öncelikli: Avrupa sunuculari (Supabase Frankfurt), gercek GDPR uyumlulugu, veri brokeri yok, izleyici yok. Sektördeki cloud-to-cloud köprü uygulamalarından stratejik farki su: FitMesh sessiz bir veri yönlendiricisi degil, bir varış noktasidir. Veriler depolanir, özenle hazirlanmis grafiklerle görsellestirilir ve ayni ailenin üyeleri arasinda paylasilir (Mesh Aile): herkes kendi verilerini digerleriyle tek bir panelde paylasir. Uygulama Google Play ve App Store'da mevcut: ilk 1000 kurucu hesap (program 31 Temmuz 2026 itibariyla kapandi), kayit sirasinda otomatik olarak ömür boyu ücretsiz Pro kazandi. iOS uygulamasi AB'deki 27 ülkenin tüm magazalari dahil olmak üzere kullanilabilir.",
    },

    keyFactsTitle: "Temel bilgiler",
    keyFacts: [
      { label: "Lansman", value: "Haziran 2026'dan itibaren Google Play ve App Store'da · iOS tüm AB'de yayinda" },
      { label: "Platformlar", value: "Android + iOS (yayinda; AB'deki tüm magazalar dahil)" },
      { label: "Ülke", value: "Italya · AB sunuculari (Frankfurt)" },
      { label: "Teknoloji yigini", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Desteklenen giyilebilirler", value: `Health Connect üzerinden ${PROVIDERS.length}'dan fazla marka, genisletilebilir` },
      { label: "Fiyatlandirma", value: `14 günlük deneme, sonra Pro ${PRICING.fromLifetime.tr} tek seferlik (Android ${PRICING.lifetimeAndroid.tr} · iPhone ${PRICING.lifetimeIos.tr}) veya ${PRICING.subSixMonthsLabel.tr}` },
      { label: "Kurucu koltuklari", value: "Ilk 1000 hesap (31 Temmuz 2026'ya kadar): zamaninda kayit olanlar icin ömür boyu ücretsiz Pro" },
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
      "Aile ici paylasim: önemsedigin kisilerin saglik verilerini tek bir panelde görmek, GPS veya invasif uygulamalar olmadan (Mesh Aile)",
      "Ömür boyu ücretsiz kurucu beta programi: abonelik yaygaro yerine alternatif, fitness uygulamalarinda bile",
      "Italya'da saglik uygulamasi gelistirmek: GDPR, AB sunuculari ve farklilik olarak veri egemenligi",
    ],

    trademarkNote:
      "FitMesh Sync, Fosforonero'nun (Matteo Pizzi) ticari markasıdır. Galaxy Watch, Mi Band, Polar, Garmin, Fitbit ve adı geçen diger markalar ilgili sahiplerinin ticari markalarıdır; bu sayfada ve FitMesh materyallerinde kullanimi herhangi bir baglanti veya sponsorluk anlamina gelmez.",

    sitemapNote:
      "Belirli linklere mi ihtiyaciniz var? Her seyi fitmesh.fit'te bulabilirsiniz (ana sayfa, aile ici paylasim kullanim senaryosu icin /tr/famiglia, teknik makaleler icin /tr/blog, proje hikayesi icin /tr/about).",
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
        "FitMesh Sync is een Android- en iOS-app die de gezondheidsdata van Galaxy Watch, Mi Band, Polar, Garmin, Fitbit en andere wearables samenbrengt in één premium dashboard. Privacy-first, EU-servers, gebouwd in Italië. Werkt via Health Connect (Android) en Apple Gezondheid (iOS) zonder trackers of databrokers. Beschikbaar op Google Play en de App Store sinds juni 2026; de iOS-app is beschikbaar, inclusief alle winkels van de Europese Unie.",
    },
    blurb100: {
      title: "100 woorden",
      body:
        "FitMesh Sync is een Android- en iOS-app, ontwikkeld in Italië door Matteo Pizzi (Fosforonero), om de gezondheidsdata van elke smartwatch en fitnessband op de markt samen te brengen in één premium dashboard. Op Android werkt de app als Health Connect-bestemming en is daardoor meteen compatibel met Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei en Oura, zonder aparte OAuth per merk; op iOS leest de app rechtstreeks uit Apple Gezondheid en verbindt via Bluetooth met de Colmi-ring. Privacy-first: EU-servers, GDPR, geen databrokers. Beschikbaar op Google Play en de App Store sinds juni 2026 (de iOS-app is beschikbaar, inclusief alle winkels van de EU); Familie Mesh, de functie om gezondheidsdata met je eigen gezin te delen, komt binnenkort.",
    },
    blurb200: {
      title: "200 woorden (volledig profiel)",
      body:
        "FitMesh Sync ontstond in 2026 in Italië uit de frustratie van één ontwikkelaar (Matteo Pizzi, studio Fosforonero) die een Galaxy Watch draagt, wiens vrouw een Mi Band gebruikt en wiens moeder een Withings heeft. Elk merk sluit zijn data op in de eigen app. Niemand biedt een verenigd premium overzicht. FitMesh lost precies dat op: door uit te lezen van Health Connect (de Android-standaard die sinds 2024 data van vrijwel alle wearables verzamelt) bundelt de app stappen, hartslag, slaap, calorieën, trainingen en andere metrieken in een native Flutter-dashboard, ontworpen voor dagelijks gebruik, niet voor systeembeheerders. Privacy-first vanaf de eerste commit: Europese servers (Supabase Frankfurt), echte GDPR-naleving, geen databrokers, geen trackers. Het strategische verschil met cloud-naar-cloud bridge-apps in de categorie is dat FitMesh geen stille datarouter is: het is een bestemming. Data wordt opgeslagen, gevisualiseerd met zorgvuldige grafieken en gedeeld tussen leden van hetzelfde gezin (Familie Mesh): iedereen deelt zijn eigen data met de anderen, in één dashboard. De app is beschikbaar op Google Play en de App Store: de eerste 1.000 founders (programma gesloten sinds 31 juli 2026) hebben Pro levenslang gratis gekregen, automatisch toegekend bij registratie. De iOS-app is beschikbaar, inclusief alle winkels van de 27 EU-landen.",
    },

    keyFactsTitle: "Kerngegevens",
    keyFacts: [
      { label: "Lancering", value: "Publiek op Google Play en de App Store sinds juni 2026 · iOS live in de hele EU" },
      { label: "Platforms", value: "Android + iOS (live, inclusief alle winkels van de EU)" },
      { label: "Land", value: "Italië · EU-servers (Frankfurt)" },
      { label: "Technologie", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Ondersteunde wearables", value: `${PROVIDERS.length}+ merken via Health Connect, uitbreidbaar` },
      { label: "Prijs", value: `14 dagen proberen, daarna Pro ${PRICING.fromLifetime.en} eenmalig (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) of ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder-plekken", value: "Eerste 1.000 accounts (tot 31 juli 2026): Pro levenslang gratis voor wie zich op tijd heeft aangemeld" },
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
      "Gezinsdeling: de gezondheidsdata van wie je dierbaar is in één dashboard zien, zonder GPS of opdringerige apps (Familie Mesh)",
      "Levenslang gratis founder-betaprogramma: een alternatief voor de abonnementshype, ook in fitness-apps",
      "Een gezondheidsapp bouwen in Italië: GDPR, EU-servers en datasoevereiniteit als onderscheidend kenmerk",
    ],

    trademarkNote:
      "FitMesh Sync is een handelsmerk van Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit en andere genoemde merken zijn handelsmerken van hun respectieve eigenaren; het gebruik ervan op deze pagina en in FitMesh-materiaal impliceert geen affiliatie of sponsoring.",

    sitemapNote:
      "Specifieke links nodig? Je vindt alles op fitmesh.fit (home, /nl/famiglia voor de gezinsdeling-use-case, /nl/blog voor technische artikelen, /nl/about voor het projectverhaal).",
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
        "FitMesh Syncは、Galaxy Watch、Mi Band、Polar、Garmin、Fitbitなどのウェアラブルの健康データを1つのプレミアムダッシュボードに統合するAndroid・iOSアプリです。プライバシーファースト、EUサーバー、イタリア開発。トラッカーやデータブローカーなしでHealth Connect(Android)とApple ヘルスケア(iOS)を介して動作します。2026年6月よりGoogle PlayとApp Storeで提供中。iOS版はEU域内を含め利用可能です。",
    },
    blurb100: {
      title: "100語",
      body:
        "FitMesh Syncは、市場のあらゆるスマートウォッチやフィットネスバンドからの健康データを1つのプレミアムダッシュボードに統合するため、Matteo Pizzi（Fosforonero）がイタリアで開発したAndroid・iOSアプリです。Androidでは、Health Connectの保存先として動作するため、Galaxy Watch、Mi Band、Polar、Garmin、Fitbit、Withings、Honor、Huawei、OuraとブランドごとのOAuthなしで標準対応します。iOSでは、Apple ヘルスケアから直接読み取り、BluetoothでColmiリングに接続します。プライバシーファースト：EUサーバー、GDPR、データブローカーなし。2026年6月よりGoogle PlayとApp Storeで提供中(iOS版はEU域内を含め利用可能です)。家族と健康データを共有するMesh Family機能も近日登場。",
    },
    blurb200: {
      title: "200語（フルプロフィール）",
      body:
        "FitMesh Syncは2026年、Galaxy Watchを使い、妻はMi Band、母はWithingsを使う開発者（Matteo Pizzi、Fosforoneroスタジオ）の不満からイタリアで生まれました。各ブランドはデータを自社アプリ内に閉じ込めます。誰も統合されたプレミアムなビューを提供していません。FitMeshはまさにこれを解決します。Health Connect（2024年以降、ほぼすべてのウェアラブルのデータを集めるAndroidの標準）から読み取り、歩数・心拍数・睡眠・カロリー・ワークアウトなどの指標を、システム管理者向けではなく日々の閲覧のために設計されたネイティブFlutterダッシュボードに集約します。最初のコミットからプライバシーファースト：欧州サーバー（Supabaseフランクフルト）、真のGDPR準拠、データブローカーなし、トラッカーなし。同カテゴリのクラウド間ブリッジアプリとの戦略的な違いは、FitMeshが静かなデータルーターではなく「保存先」である点です。データは保存され、丁寧なグラフで可視化され、同じ家族のメンバー間で共有できます（Mesh Family）：それぞれが自分のデータを他のメンバーと共有し、ひとつのダッシュボードにまとまります。アプリはGoogle PlayとApp Storeで提供中：最初の1,000人のファウンダー（2026年7月31日に終了したプログラム）は、登録時に自動で生涯Proを無料で取得しました。iOS版はEU加盟27か国を含め利用可能です。",
    },

    keyFactsTitle: "主要データ",
    keyFacts: [
      { label: "ローンチ", value: "2026年6月よりGoogle PlayとApp Storeで公開 · iOSはEU全域で提供中" },
      { label: "プラットフォーム", value: "Android + iOS（配信中、EU域内を含む）" },
      { label: "国", value: "イタリア · EUサーバー（フランクフルト）" },
      { label: "技術スタック", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "対応ウェアラブル", value: `Health Connect経由で${PROVIDERS.length}ブランド以上、拡張可能` },
      { label: "価格", value: `14日間トライアル、その後Pro ${PRICING.fromLifetime.en} 買い切り（Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}）または ${PRICING.subSixMonthsLabel.en}` },
      { label: "ファウンダー枠", value: "最初の1,000アカウント（2026年7月31日まで）：期限内に登録した方には生涯Pro無料（登録時に自動付与）" },
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
      "家族間シェア：大切な人の健康データをひとつのダッシュボードで見る、GPSや侵襲的なアプリなしで（Mesh Family）",
      "生涯無料のファウンダーベータプログラム：フィットネスアプリでもサブスク偏重への代替",
      "イタリアで健康アプリを開発する：差別化要因としてのGDPR・EUサーバー・データ主権",
    ],

    trademarkNote:
      "FitMesh SyncはFosforonero（Matteo Pizzi）の商標です。Galaxy Watch、Mi Band、Polar、Garmin、Fitbitおよびその他の言及されたブランドは各所有者の商標であり、本ページおよびFitMesh素材での使用は提携やスポンサーシップを意味するものではありません。",

    sitemapNote:
      "特定のリンクが必要ですか？すべて fitmesh.fit でご覧いただけます（ホーム、家族間シェアのユースケースは /ja/famiglia、技術記事は /ja/blog、プロジェクトの歴史は /ja/about）。",
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
        "FitMesh Sync는 Galaxy Watch, Mi Band, Polar, Garmin, Fitbit 등 웨어러블의 건강 데이터를 하나의 프리미엄 대시보드로 통합하는 Android 및 iOS 앱입니다. 프라이버시 우선, EU 서버, 이탈리아에서 개발. 트래커나 데이터 브로커 없이 Health Connect(Android)와 Apple 건강(iOS)을 통해 작동합니다. 2026년 6월부터 Google Play와 App Store에서 이용 가능; iOS 앱은 EU 지역을 포함하여 이용 가능합니다.",
    },
    blurb100: {
      title: "100단어",
      body:
        "FitMesh Sync는 시장의 모든 스마트워치와 피트니스 밴드의 건강 데이터를 하나의 프리미엄 대시보드로 통합하기 위해 Matteo Pizzi(Fosforonero)가 이탈리아에서 개발한 Android 및 iOS 앱입니다. Android에서는 Health Connect 대상으로 작동하므로 Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei, Oura와 브랜드별 OAuth 없이 기본 호환되며, iOS에서는 Apple 건강에서 직접 읽고 블루투스로 Colmi 링에 연결됩니다. 프라이버시 우선: EU 서버, GDPR, 데이터 브로커 없음. 2026년 6월부터 Google Play와 App Store에서 이용 가능(iOS 앱은 EU 지역을 포함하여 이용 가능); 가족과 건강 데이터를 공유하는 Mesh Family 기능이 곧 출시됩니다.",
    },
    blurb200: {
      title: "200단어 (전체 프로필)",
      body:
        "FitMesh Sync는 Galaxy Watch를 쓰고, 아내는 Mi Band, 어머니는 Withings를 사용하는 한 개발자(Matteo Pizzi, Fosforonero 스튜디오)의 불만에서 2026년 이탈리아에서 탄생했습니다. 각 브랜드는 자사 앱 안에 데이터를 가둡니다. 통합된 프리미엄 뷰를 제공하는 곳은 없습니다. FitMesh는 바로 이 문제를 해결합니다. Health Connect(2024년부터 사실상 모든 웨어러블의 데이터를 모으는 Android 표준)에서 읽어, 걸음 수·심박수·수면·칼로리·운동 등의 지표를 시스템 관리자가 아닌 일상적인 열람을 위해 설계된 네이티브 Flutter 대시보드로 집계합니다. 첫 커밋부터 프라이버시 우선: 유럽 서버(Supabase 프랑크푸르트), 실질적인 GDPR 준수, 데이터 브로커 없음, 트래커 없음. 동종 클라우드 간 브리지 앱과의 전략적 차이는 FitMesh가 조용한 데이터 라우터가 아니라 목적지라는 점입니다. 데이터는 저장되고, 정성스러운 차트로 시각화되며, 같은 가족 구성원 간에 공유할 수 있습니다(Mesh Family): 각자 자신의 데이터를 다른 구성원과 공유하며, 하나의 대시보드에 모입니다. 앱은 Google Play와 App Store에서 이용 가능합니다: 처음 1,000명의 파운더(2026년 7월 31일에 종료된 프로그램)는 가입 시 자동으로 평생 Pro를 무료로 받았습니다. iOS 앱은 EU 27개국 전역을 포함하여 이용 가능합니다.",
    },

    keyFactsTitle: "핵심 정보",
    keyFacts: [
      { label: "출시", value: "2026년 6월부터 Google Play와 App Store에 공개 · iOS EU 전역에서 출시" },
      { label: "플랫폼", value: "Android + iOS (출시됨; EU 지역 포함)" },
      { label: "국가", value: "이탈리아 · EU 서버 (프랑크푸르트)" },
      { label: "기술 스택", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "지원 웨어러블", value: `Health Connect를 통해 ${PROVIDERS.length}개 이상 브랜드, 확장 가능` },
      { label: "가격", value: `14일 체험판, 이후 Pro ${PRICING.fromLifetime.en} 일회성 (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) 또는 ${PRICING.subSixMonthsLabel.en}` },
      { label: "파운더 좌석", value: "처음 1,000개 계정(2026년 7월 31일까지): 제때 가입한 분에게는 평생 Pro 무료 (가입 시 자동 부여)" },
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
      "가족 공유: 소중한 사람의 건강 데이터를 하나의 대시보드에서 확인하기, GPS나 침해적인 앱 없이 (Mesh Family)",
      "평생 무료 파운더 베타 프로그램: 피트니스 앱에서도 구독 과열에 대한 대안",
      "이탈리아에서 건강 앱을 개발하기: 차별화 요소로서의 GDPR, EU 서버, 데이터 주권",
    ],

    trademarkNote:
      "FitMesh Sync는 Fosforonero(Matteo Pizzi)의 상표입니다. Galaxy Watch, Mi Band, Polar, Garmin, Fitbit 및 기타 언급된 브랜드는 각 소유자의 상표이며, 본 페이지와 FitMesh 자료에서의 사용은 제휴나 후원을 의미하지 않습니다.",

    sitemapNote:
      "특정 링크가 필요하신가요? 모든 내용은 fitmesh.fit에서 확인할 수 있습니다 (홈, 가족 공유 사용 사례는 /ko/famiglia, 기술 기사는 /ko/blog, 프로젝트 이야기는 /ko/about).",
  },
  sv: {
    kicker: "Press- och mediekit",
    h1: "FitMesh Sync: resurser för journalister, bloggare och skapare",
    sub:
      "Allt du behöver för att skriva eller prata om FitMesh Sync. Klart att klistra in, nedladdningsbart material, inget e-postkrav.",

    contactTitle: "Direktkontakt för press",
    contactBody:
      "För intervjuer, guidade demonstrationer, material i hög upplösning eller tekniska frågor:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, grundare, ensam utvecklare",

    taglineTitle: "Tagline (en rad)",
    tagline:
      "FitMesh Sync är den integritetsfokuserade premiuminstrumentpanelen för hela familjens smartwatch-data, byggd i Italien av en oberoende utvecklare.",

    blurbsTitle: "Kort beskrivning (50, 100, 200 ord)",
    blurb50: {
      title: "50 ord",
      body:
        "FitMesh Sync är en Android- och iOS-app som samlar hälsodata från Galaxy Watch, Mi Band, Polar, Garmin, Fitbit och andra wearables i en enda premiuminstrumentpanel. Integritetsfokuserad, EU-servrar, byggd i Italien. Bygger på Health Connect (Android) och Apple Hälsa (iOS), utan spårare eller datamäklare. Tillgänglig på Google Play och App Store sedan juni 2026; iOS-appen är tillgänglig, inklusive samtliga butiker inom EU.",
    },
    blurb100: {
      title: "100 ord",
      body:
        "FitMesh Sync är en Android- och iOS-app utvecklad i Italien av Matteo Pizzi (Fosforonero) för att samla hälsodata från i princip alla smartwatchar och träningsband på marknaden i en enda premiuminstrumentpanel. På Android fungerar appen som en Health Connect-destination och är kompatibel direkt ur lådan med Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei och Oura, utan att kräva OAuth för varje enskilt märke; på iOS läser den direkt från Apple Hälsa och ansluter via Bluetooth till Colmi-ringen. Integritetsfokuserad: EU-servrar, GDPR, inga datamäklare. Tillgänglig på Google Play och App Store sedan juni 2026 (iOS-appen är tillgänglig, inklusive samtliga butiker inom EU); Family Mesh, funktionen för att dela hälsodata med den egna familjen, är på väg härnäst.",
    },
    blurb200: {
      title: "200 ord (fullständig profil)",
      body:
        "FitMesh Sync föddes i Italien 2026 ur en enda utvecklares frustration (Matteo Pizzi, studio Fosforonero), som själv äger en Galaxy Watch, vars fru använder en Mi Band och vars mamma har en Withings. Varje märke låser in sin egen data i sin egen app. Ingen erbjuder en samlad premiumvy. Det är precis det FitMesh löser: genom att läsa från Health Connect (Androids standard som sedan 2024 samlar in data från i princip alla wearables) samlar appen steg, puls, sömn, kalorier, träningspass och andra mätvärden i en nativ Flutter-instrumentpanel designad för daglig avläsning, inte för systemadministratörer. Integritetsfokuserad från första commit: europeiska servrar (Supabase Frankfurt), verklig GDPR-efterlevnad, inga datamäklare, inga spårare. Den strategiska skillnaden mot moln-till-moln-brygg-appar i kategorin är att FitMesh inte bara är en tyst datarouter: det är en destination. Data lagras, visualiseras med genomarbetade diagram och delas mellan medlemmar i samma familj (Family Mesh): alla delar sin egen data med de andra, i en gemensam instrumentpanel. Appen finns tillgänglig på Google Play och App Store: de första 1 000 grundarna (programmet stängt sedan den 31 juli 2026) fick livstids-Pro gratis, som ges automatiskt vid registrering. iOS-appen är tillgänglig, inklusive samtliga butiker i alla 27 EU-länder.",
    },

    keyFactsTitle: "Nyckelfakta",
    keyFacts: [
      { label: "Lansering", value: "Publik på Google Play och App Store sedan juni 2026 · iOS lanserad i hela EU" },
      { label: "Plattformar", value: "Android + iOS (lanserad, inklusive samtliga butiker inom EU)" },
      { label: "Land", value: "Italien · EU-servrar (Frankfurt)" },
      { label: "Teknikstack", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Wearables som stöds", value: `${PROVIDERS.length}+ märken via Health Connect, utbyggbart` },
      { label: "Prissättning", value: `14 dagars provperiod, sedan Pro ${PRICING.fromLifetime.en} som engångsköp (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) eller ${PRICING.subSixMonthsLabel.en}` },
      { label: "Grundarplatser", value: "Första 1 000 kontona (till den 31 juli 2026): livstids-Pro gratis för dem som registrerade sig i tid" },
      { label: "Team", value: "Indie / ensam utvecklare (Fosforonero, Matteo Pizzi)" },
      { label: "Kategori på Play Store", value: "Hälsa och fitness" },
    ],

    founderTitle: "Grundare",
    founderName: "Matteo Pizzi",
    founderRole: "Grundare & Solo Dev · Fosforonero",
    founderBio:
      "Italiensk mjukvaruutvecklare som byggde FitMesh Sync för att fylla gapet mellan wearables och en personlig instrumentpanel. Han utvecklar och underhåller själv hela appen, backend och webbplats. Integritet och oberoende utveckling i första rummet.",

    assetsTitle: "Nedladdningsbart material",
    assets: [
      {
        label: "Logotyp / kvadratisk ikon (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph-bild (1200×630, dynamisk)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch-ikon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "För skärmdumpar från appen, mockuper, video eller anpassat varumärkesmaterial, skriv till press@fitmesh.fit, vi svarar inom 24 timmar.",

    storyAnglesTitle: "Intressanta redaktionella vinklar",
    storyAngles: [
      "Italiensk indieutvecklare bygger ett integritetsfokuserat europeiskt alternativ till Samsungs/Apples/Google Fits inhägnade ekosystem",
      "Hur Health Connect har förändrat Androids wearable-ekosystem sedan 2024, och vad det betyder för konsumenter och utvecklare",
      "Familjedelning: se hälsodata för dem du bryr dig om i en och samma instrumentpanel, utan GPS eller integritetskränkande appar (Family Mesh)",
      "Livstidsgratis grundarprogram: ett alternativ till prenumerationshypen, även i träningsappar",
      "Att bygga en hälsoapp i Italien: GDPR, EU-servrar och datasuveränitet som konkurrensfördel",
    ],

    trademarkNote:
      "FitMesh Sync är ett varumärke som tillhör Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit och andra nämnda varumärken tillhör respektive ägare; deras användning på denna sida och i FitMesh material innebär inte något samarbete eller sponsring.",

    sitemapNote:
      "Behöver du specifika länkar? Du hittar allt på fitmesh.fit (startsida, /sv/famiglia för användningsfallet familjedelning, /sv/blog för tekniska artiklar, /sv/about för historien bakom projektet).",
  },
  da: {
    kicker: "Presse & mediekit",
    h1: "FitMesh Sync: ressourcer til journalister, bloggere og indholdsskabere",
    sub:
      "Alt hvad du behøver for at skrive eller tale om FitMesh Sync. Klar til copy-paste, downloadbare filer, ingen e-mail påkrævet.",

    contactTitle: "Direkte pressekontakt",
    contactBody:
      "Til interviews, guidede demoer, billeder i høj opløsning eller tekniske spørgsmål:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, grundlægger, soloudvikler",

    taglineTitle: "Tagline (1 linje)",
    tagline:
      "FitMesh Sync er det privatlivsorienterede premium-dashboard til hele familiens smartwatch-data, bygget i Italien af en uafhængig udvikler.",

    blurbsTitle: "Kort beskrivelse (50, 100, 200 ord)",
    blurb50: {
      title: "50 ord",
      body:
        "FitMesh Sync er en Android- og iOS-app, der samler sundhedsdata fra Galaxy Watch, Mi Band, Polar, Garmin, Fitbit og andre wearables i ét premium-dashboard. Privatlivsorienteret, EU-servere, udviklet i Italien. Kører via Health Connect (Android) og Apple Sundhed (iOS) uden trackere eller datamæglere. Tilgængelig på Google Play og App Store siden juni 2026; iOS-appen er tilgængelig, herunder i alle butikker i Den Europæiske Union.",
    },
    blurb100: {
      title: "100 ord",
      body:
        "FitMesh Sync er en Android- og iOS-app udviklet i Italien af Matteo Pizzi (Fosforonero) for at samle sundhedsdata fra alle smartwatches og fitnessbånd på markedet i ét premium-dashboard. På Android fungerer appen som en Health Connect-destination og er kompatibel ud af boksen med Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei og Oura, uden behov for OAuth pr. mærke; på iOS læser den direkte fra Apple Sundhed og forbinder via Bluetooth til Colmi-ringen. Privatlivsorienteret: EU-servere, GDPR, ingen datamæglere. Tilgængelig på Google Play og App Store siden juni 2026 (iOS-appen er tilgængelig, herunder i alle EU-butikker); Family Mesh, funktionen til at dele sundhedsdata med din egen familie, er på vej.",
    },
    blurb200: {
      title: "200 ord (fuld profil)",
      body:
        "FitMesh Sync opstod i Italien i 2026 ud af én udviklers (Matteo Pizzi, studiet Fosforonero) frustration: han selv har et Galaxy Watch, hans kone bruger et Mi Band, hans mor et Withings-ur. Hvert mærke låser sine egne data inde i sin egen app. Ingen tilbyder et samlet premium-overblik. Det er præcis det, FitMesh løser: ved at læse fra Health Connect (Androids standard, der siden 2024 samler data fra stort set alle wearables) samler appen skridt, puls, søvn, kalorier, træningspas og andre målinger i et nativt Flutter-dashboard designet til daglig brug, ikke til systemadministratorer. Privatlivsorienteret fra første commit: europæiske servere (Supabase Frankfurt), reel GDPR-overholdelse, ingen datamæglere, ingen trackere. Den strategiske forskel i forhold til cloud-til-cloud bridge-apps i kategorien er, at FitMesh ikke er en stille datarouter: det er en destination. Data gemmes, visualiseres med udvalgte grafer og deles mellem medlemmer af samme familie (Family Mesh): alle deler deres egne data med de andre, i ét dashboard. Appen findes på Google Play og App Store: de første 1.000 grundlæggere (programmet lukket siden den 31. juli 2026) fik livstids-Pro gratis, tildelt automatisk ved tilmelding. iOS-appen er tilgængelig, herunder i alle butikker i de 27 EU-lande.",
    },

    keyFactsTitle: "Nøglefakta",
    keyFacts: [
      { label: "Lancering", value: "Offentlig på Google Play og App Store siden juni 2026 · iOS live i hele EU" },
      { label: "Platforme", value: "Android + iOS (live, herunder i alle EU-butikker)" },
      { label: "Land", value: "Italien · EU-servere (Frankfurt)" },
      { label: "Teknologi", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Understøttede wearables", value: `${PROVIDERS.length}+ mærker via Health Connect, kan udvides` },
      { label: "Priser", value: `14 dages prøveperiode, derefter Pro ${PRICING.fromLifetime.en} som engangskøb (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) eller ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder-pladser", value: "De første 1.000 konti (indtil den 31. juli 2026): livstids-Pro gratis for dem, der tilmeldte sig i tide" },
      { label: "Team", value: "Indie/soloudvikler (Fosforonero, Matteo Pizzi)" },
      { label: "Play Store-kategori", value: "Sundhed og fitness" },
    ],

    founderTitle: "Grundlægger",
    founderName: "Matteo Pizzi",
    founderRole: "Grundlægger & Solo Dev · Fosforonero",
    founderBio:
      "Italiensk softwareudvikler, der byggede FitMesh Sync for at udfylde hullet mellem wearables og et personligt dashboard. Hele appen, backend og websitet er udviklet og vedligeholdes af ham selv. En privatlivsorienteret og indie-først tilgang.",

    assetsTitle: "Downloadbare filer",
    assets: [
      {
        label: "Logo / firkantet ikon (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph-billede (1200×630, dynamisk)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch-ikon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Til in-app-screenshots, mockups, video eller specialtilpasset brandmateriale, skriv til press@fitmesh.fit — vi svarer inden for 24 timer.",

    storyAnglesTitle: "Interessante redaktionelle vinkler",
    storyAngles: [
      "Italiensk indie-udvikler bygger et privatlivsorienteret europæisk alternativ til Samsungs/Apples/Googles lukkede Fit-økosystemer",
      "Hvordan Health Connect ændrede Androids wearable-økosystem siden 2024, og hvad det betyder for forbrugere og udviklere",
      "Familiedeling: se sundhedsdata for dem, du holder af, i ét dashboard, uden GPS eller invasive apps (Family Mesh)",
      "Livstids-gratis founder-betaprogram: et alternativ til abonnementshypen, også i fitness-apps",
      "At bygge en sundhedsapp i Italien: GDPR, EU-servere og datasuverænitet som differentiator",
    ],

    trademarkNote:
      "FitMesh Sync er et varemærke tilhørende Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit og andre nævnte mærker er varemærker tilhørende deres respektive ejere; brugen af dem på denne side og i FitMesh-materialer indebærer ikke tilknytning eller sponsorering.",

    sitemapNote:
      "Har du brug for specifikke links? Du finder alt på fitmesh.fit (forside, /da/famiglia til use casen om familiedeling, /da/blog til tekniske artikler, /da/about til projektets historie).",
  },
  no: {
    kicker: "Presse og mediekit",
    h1: "FitMesh Sync: ressurser for journalister, bloggere og innholdsskapere",
    sub:
      "Alt du trenger for å skrive eller snakke om FitMesh Sync. Klar til å kopiere, nedlastbare ressurser, ingen e-post kreves.",

    contactTitle: "Direkte pressekontakt",
    contactBody:
      "For intervjuer, veiledede demoer, ressurser i høy oppløsning eller tekniske spørsmål:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, grunnlegger, soloutvikler",

    taglineTitle: "Tagline (1 linje)",
    tagline:
      "FitMesh Sync er det personvernfokuserte premium-dashbordet for alle smartklokkedataene til familien din, bygget i Italia av en uavhengig utvikler.",

    blurbsTitle: "Kort beskrivelse (50, 100, 200 ord)",
    blurb50: {
      title: "50 ord",
      body:
        "FitMesh Sync er en Android- og iOS-app som samler helsedata fra Galaxy Watch, Mi Band, Polar, Garmin, Fitbit og andre wearables i ett premium-dashbord. Personvernfokusert, EU-servere, bygget i Italia. Kjører på Health Connect (Android) og Apple Helse (iOS), uten sporere eller datameglere. Tilgjengelig på Google Play og App Store siden juni 2026; iOS-appen er tilgjengelig, inkludert i alle butikker i EU.",
    },
    blurb100: {
      title: "100 ord",
      body:
        "FitMesh Sync er en Android- og iOS-app utviklet i Italia av Matteo Pizzi (Fosforonero) for å samle helsedataene fra alle smartklokker og treningsarmbånd på markedet i ett eneste premium-dashbord. På Android er appen en Health Connect-mottaker, kompatibel rett ut av boksen med Galaxy Watch, Mi Band, Polar, Garmin, Fitbit, Withings, Honor, Huawei og Oura, uten behov for OAuth per merke; på iOS leser den direkte fra Apple Helse og kobler til Colmi-ringen via Bluetooth. Personvernfokusert: EU-servere, GDPR, ingen datameglere. Tilgjengelig på Google Play og App Store siden juni 2026 (iOS-appen er tilgjengelig, inkludert i alle EU-butikker); Family Mesh, funksjonen for å dele helsedata med egen familie, kommer snart.",
    },
    blurb200: {
      title: "200 ord (fullstendig profil)",
      body:
        "FitMesh Sync ble født i Italia i 2026 ut av frustrasjonen til én utvikler (Matteo Pizzi, studio Fosforonero) som selv har en Galaxy Watch, mens kona bruker en Mi Band og moren en Withings. Hvert merke låser sine egne data inne i sin egen app. Ingen tilbyr en samlet premium-visning. Det er akkurat dette FitMesh løser: ved å lese fra Health Connect (Android-standarden som siden 2024 samler data fra så godt som alle wearables), samler appen skritt, puls, søvn, kalorier, treningsøkter og andre målinger i ett nativt Flutter-dashbord designet for daglig bruk, ikke for systemadministratorer. Personvernfokusert fra første kodelinje: europeiske servere (Supabase Frankfurt), reell GDPR-etterlevelse, ingen datameglere, ingen sporere. Den strategiske forskjellen sammenlignet med andre bro-apper i kategorien, som kun kobler sky til sky, er at FitMesh ikke er en stille dataruter, men et mål i seg selv. Dataene lagres, visualiseres med gjennomarbeidede grafer, og deles mellom medlemmer av samme familie (Family Mesh): alle deler sine egne data med de andre, i ett dashbord. Appen er tilgjengelig på Google Play og App Store: de første 1000 founder-brukerne (programmet stengt siden 31. juli 2026) fikk livstids Pro gratis, tildelt automatisk ved registrering. iOS-appen er tilgjengelig, inkludert i alle butikker i de 27 EU-landene.",
    },

    keyFactsTitle: "Nøkkelfakta",
    keyFacts: [
      { label: "Lansering", value: "Offentlig på Google Play og App Store siden juni 2026 · iOS live i hele EU" },
      { label: "Plattformer", value: "Android + iOS (live, inkludert i alle EU-butikker)" },
      { label: "Land", value: "Italia · EU-servere (Frankfurt)" },
      { label: "Teknologi", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Støttede wearables", value: `${PROVIDERS.length}+ merker via Health Connect, med rom for flere` },
      { label: "Priser", value: `14 dagers prøveperiode, deretter Pro ${PRICING.fromLifetime.en} engangsbeløp (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) eller ${PRICING.subSixMonthsLabel.en}` },
      { label: "Founder-plasser", value: "De første 1000 kontoene (innen 31. juli 2026): livstids Pro gratis for dem som registrerte seg i tide" },
      { label: "Team", value: "Indie / soloutvikler (Fosforonero, Matteo Pizzi)" },
      { label: "Play Store-kategori", value: "Helse og trening" },
    ],

    founderTitle: "Grunnlegger",
    founderName: "Matteo Pizzi",
    founderRole: "Grunnlegger og soloutvikler · Fosforonero",
    founderBio:
      "Italiensk programvareutvikler som bygde FitMesh Sync for å fylle gapet mellom wearables og et personlig dashbord. Hele appen, backend og nettstedet er utviklet og vedlikeholdt av ham selv. Personvern og indie-tankegang står i sentrum.",

    assetsTitle: "Nedlastbare ressurser",
    assets: [
      {
        label: "Logo / kvadratisk ikon (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph-bilde (1200×630, dynamisk)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch-ikon (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "For skjermbilder fra appen, mockuper, video eller skreddersydd merkevaremateriell, skriv til press@fitmesh.fit – vi svarer innen 24 timer.",

    storyAnglesTitle: "Interessante redaksjonelle vinklinger",
    storyAngles: [
      "Italiensk indie-utvikler bygger et personvernfokusert europeisk alternativ til de lukkede økosystemene til Samsung/Apple/Google Fit",
      "Hvordan Health Connect har endret Androids wearable-økosystem siden 2024, og hva det betyr for forbrukere og utviklere",
      "Familiedeling: se helsedataene til folk du bryr deg om i ett dashbord, uten GPS eller inntrengende apper (Family Mesh)",
      "Livstidsgratis founder-betaprogram: et alternativ til abonnementshypen, også i treningsapper",
      "Å bygge en helseapp i Italia: GDPR, EU-servere og datasuverenitet som differensiator",
    ],

    trademarkNote:
      "FitMesh Sync er et varemerke tilhørende Fosforonero (Matteo Pizzi). Galaxy Watch, Mi Band, Polar, Garmin, Fitbit og andre nevnte merker er varemerker tilhørende sine respektive eiere; bruken av dem på denne siden og i FitMesh-materiell innebærer ingen tilknytning til eller sponsing fra disse merkene.",

    sitemapNote:
      "Trenger du spesifikke lenker? Du finner alt på fitmesh.fit (hjem, /no/famiglia for bruksområdet familiedeling, /no/blog for tekniske artikler, /no/about for historien bak prosjektet).",
  },
  fi: {
    kicker: "Lehdistö- ja mediamateriaalit",
    h1: "FitMesh Sync: materiaalia toimittajille, bloggaajille ja sisällöntuottajille",
    sub:
      "Kaikki mitä tarvitset kirjoittaaksesi tai puhuaksesi FitMesh Syncistä. Valmiit tekstit kopioitavaksi, ladattavat materiaalit – ei sähköpostia tarvita.",

    contactTitle: "Suora yhteys lehdistölle",
    contactBody:
      "Haastatteluja, ohjattuja esittelyjä, korkearesoluutioisia kuvia tai teknisiä kysymyksiä varten:",
    contactEmail: "press@fitmesh.fit",
    contactAltEmail: "hello@fitmesh.fit",
    contactPersonLine: "Matteo Pizzi, perustaja ja soolokehittäjä",

    taglineTitle: "Iskulause (yksi rivi)",
    tagline:
      "FitMesh Sync on yksityisyyttä kunnioittava premium-koontinäyttö koko perheen älykellodatalle – italialaisen itsenäisen kehittäjän rakentama.",

    blurbsTitle: "Lyhyt kuvaus (50, 100, 200 sanaa)",
    blurb50: {
      title: "50 sanaa",
      body:
        "FitMesh Sync on Android- ja iOS-sovellus, joka yhdistää Galaxy Watchin, Mi Bandin, Polarin, Garminin, Fitbitin ja muiden puettavien laitteiden terveystiedot yhteen premium-koontinäyttöön. Yksityisyys edellä, EU-palvelimet, rakennettu Italiassa. Toimii Health Connectin (Android) ja Apple Terveyden (iOS) päällä – ei seurantaevästeitä eikä datanvälittäjiä. Saatavilla Google Playssa ja App Storessa kesäkuusta 2026 alkaen; iOS-sovellus on saatavilla, mukaan lukien kaikki EU:n kaupat.",
    },
    blurb100: {
      title: "100 sanaa",
      body:
        "FitMesh Sync on Matteo Pizzin (Fosforonero) Italiassa kehittämä Android- ja iOS-sovellus, joka kokoaa markkinoiden kaikkien älykellojen ja aktiivisuusrannekkeiden terveystiedot yhteen premium-koontinäyttöön. Androidilla se toimii Health Connect -kohteena ja on suoraan yhteensopiva Galaxy Watchin, Mi Bandin, Polarin, Garminin, Fitbitin, Withingsin, Honorin, Huawein ja Ouran kanssa ilman erillistä OAuth-kirjautumista jokaiselle merkille; iOS:ssä se lukee suoraan Apple Terveydestä ja muodostaa Bluetooth-yhteyden Colmi-sormukseen. Yksityisyys edellä: EU-palvelimet, GDPR, ei datanvälittäjiä. Saatavilla Google Playssa ja App Storessa kesäkuusta 2026 alkaen (iOS-sovellus on saatavilla, mukaan lukien kaikki EU:n kaupat); seuraavaksi tulossa Family Mesh, ominaisuus terveystietojen jakamiseen oman perheen kesken.",
    },
    blurb200: {
      title: "200 sanaa (täysi esittely)",
      body:
        "FitMesh Sync syntyi Italiassa vuonna 2026 yhden kehittäjän (Matteo Pizzi, studio Fosforonero) turhautumisesta: hänellä itsellään on Galaxy Watch, vaimolla Mi Band ja äidillä Withings. Jokainen merkki lukitsee omat tietonsa omaan sovellukseensa, eikä kukaan tarjoa yhtenäistä premium-näkymää. Juuri tämän FitMesh ratkaisee: lukemalla tiedot Health Connectista (Android-standardi, joka on vuodesta 2024 kerännyt dataa käytännössä kaikista puettavista laitteista), se kokoaa askeleet, sykkeen, unen, kalorit, treenit ja muut mittarit natiiviin Flutter-koontinäyttöön, joka on suunniteltu päivittäiseen lukemiseen – ei ylläpitäjille. Yksityisyys on ollut lähtökohtana ensimmäisestä commitista lähtien: eurooppalaiset palvelimet (Supabase Frankfurt), aito GDPR-vaatimustenmukaisuus, ei datanvälittäjiä eikä seurantaevästeitä. Strateginen ero verrattuna kategorian pilvestä-pilveen-siltasovelluksiin on se, ettei FitMesh ole hiljainen datareititin – se on määränpää. Tiedot tallennetaan, visualisoidaan huolella suunnitelluilla kaavioilla ja jaetaan saman perheen jäsenten kesken (Family Mesh): jokainen jakaa omat tietonsa muille yhdessä koontinäytössä. Sovellus on saatavilla Google Playssa ja App Storessa: ensimmäiset 1 000 perustajakäyttäjää (ohjelma suljettu 31. heinäkuuta 2026 alkaen) saivat elinikäisen Pro-version ilmaiseksi, automaattisesti rekisteröitymisen yhteydessä. iOS-sovellus on saatavilla, mukaan lukien kaikkien 27 EU-maan kaupat.",
    },

    keyFactsTitle: "Keskeiset faktat",
    keyFacts: [
      { label: "Julkaisu", value: "Julkinen Google Playssa ja App Storessa kesäkuusta 2026 · iOS julkaistu koko EU:ssa" },
      { label: "Alustat", value: "Android + iOS (julkaistu, mukaan lukien kaikki EU:n kaupat)" },
      { label: "Maa", value: "Italia · EU-palvelimet (Frankfurt)" },
      { label: "Teknologiat", value: "Flutter · Health Connect · Supabase · Next.js" },
      { label: "Tuetut laitteet", value: `${PROVIDERS.length}+ merkkiä Health Connectin kautta, laajennettavissa` },
      { label: "Hinnoittelu", value: `14 päivän kokeilu, sen jälkeen Pro ${PRICING.fromLifetime.en} kertamaksuna (Android ${PRICING.lifetimeAndroid.en} · iPhone ${PRICING.lifetimeIos.en}) tai ${PRICING.subSixMonthsLabel.en}` },
      { label: "Perustajapaikat", value: "Ensimmäiset 1 000 tiliä (31. heinäkuuta 2026 asti): elinikäinen Pro ilmaiseksi ajoissa rekisteröityneille" },
      { label: "Tiimi", value: "Indie / yksinkehittäjä (Fosforonero, Matteo Pizzi)" },
      { label: "Play Store -kategoria", value: "Terveys ja kuntoilu" },
    ],

    founderTitle: "Perustaja",
    founderName: "Matteo Pizzi",
    founderRole: "Perustaja ja soolokehittäjä · Fosforonero",
    founderBio:
      "Italialainen ohjelmistokehittäjä, joka rakensi FitMesh Syncin täyttämään aukon puettavien laitteiden ja henkilökohtaisen koontinäytön välillä. Hän kehittää ja ylläpitää koko sovelluksen, taustajärjestelmän ja verkkosivuston yksin. Lähestymistapa: yksityisyys ja indie-henki edellä.",

    assetsTitle: "Ladattavat materiaalit",
    assets: [
      {
        label: "Logo / neliönmuotoinen kuvake (PNG 1254×1254)",
        href: "/icon-square.png",
      },
      {
        label: "Open Graph -kuva (1200×630, dynaaminen)",
        href: "/opengraph-image",
      },
      {
        label: "Apple touch -kuvake (PNG)",
        href: "/apple-icon.png",
      },
    ],
    assetsNote:
      "Sovelluksen kuvakaappauksia, mallinnoksia, videoita tai räätälöityjä brändimateriaaleja varten kirjoita osoitteeseen press@fitmesh.fit – vastaamme 24 tunnin kuluessa.",

    storyAnglesTitle: "Kiinnostavia juttunäkökulmia",
    storyAngles: [
      "Italialainen indie-kehittäjä rakentaa yksityisyyttä kunnioittavan eurooppalaisen vaihtoehdon Samsungin, Applen ja Google Fitin suljetuille ekosysteemeille",
      "Miten Health Connect muutti Androidin puettavien laitteiden ekosysteemin vuodesta 2024 lähtien – ja mitä se merkitsee kuluttajille ja kehittäjille",
      "Perheen kesken jakaminen: näe läheistesi terveystiedot yhdessä koontinäytössä ilman GPS-seurantaa tai tunkeilevia sovelluksia (Family Mesh)",
      "Elinikäisen ilmaiskäytön perustajaohjelma: vaihtoehto tilausbuumille myös kuntoilusovelluksissa",
      "Terveyssovelluksen rakentaminen Italiassa: GDPR, EU-palvelimet ja datan suvereniteetti kilpailuetuna",
    ],

    trademarkNote:
      "FitMesh Sync on Fosforoneron (Matteo Pizzi) tavaramerkki. Galaxy Watch, Mi Band, Polar, Garmin, Fitbit ja muut mainitut tuotemerkit ovat omistajiensa tavaramerkkejä; niiden käyttö tällä sivulla ja FitMeshin materiaaleissa ei tarkoita yhteistyötä tai sponsorointia.",

    sitemapNote:
      "Tarvitsetko tiettyjä linkkejä? Löydät kaiken osoitteesta fitmesh.fit (etusivu, /fi/famiglia perheen jakamisen käyttötapaukselle, /fi/blog teknisille artikkeleille, /fi/about projektin tarinalle).",
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
    robots: isLocaleInCopy(COPY, lc) ? undefined : { index: false, follow: false },
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
    inLanguage: schemaLanguage(lc),
    about: organizationCompactRef(),
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
