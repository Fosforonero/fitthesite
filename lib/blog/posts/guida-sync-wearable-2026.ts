import type { BlogPost } from "../types";

/**
 * Pillar cornerstone: hub generale sul sync wearable.
 * Linka a tutti i supporting articles + 11 landing /sync/[provider].
 * Lunghezza target: 2500+ parole.
 */
export const post: BlogPost = {
  slug: "guida-sync-wearable-2026",
  category: "guides",
  publishedAt: "2026-05-21",
  updatedAt: "2026-05-21",
  pillar: true,
  readMinutes: 14,
  tldr: {
    it: [
      "Regola pratica del 2026: scegli la pipeline dati prima del gadget. Risolve il 90% dei problemi prima di aprire un'app.",
      "Tre modi reali per portare via i dati: Health Connect (on-device, Android), OAuth API ufficiali (dati proprietari completi, richiede approvazione), export manuale (lento ma garantito dal GDPR art. 20).",
      "Health Connect non è Google Fit: Google Fit è deprecato da giugno 2025, Health Connect è lo standard Android unificato e strettamente on-device.",
      "Samsung, Fitbit, Garmin, Polar e Withings scrivono su Health Connect; Oura e Huawei richiedono OAuth o sono ecosistemi chiusi.",
      "Per dati salute, l'unico modello con incentivi allineati è 'a pagamento, no ads, no tracker': le app gratis monetizzano spesso vendendo dati aggregati.",
    ],
    en: [
      "The 2026 practical rule: pick the data pipe before the gadget. It resolves 90% of problems before you open an app.",
      "Three real ways to get data out: Health Connect (on-device, Android), official OAuth APIs (full proprietary data, requires approval), manual export (slow but guaranteed by GDPR art. 20).",
      "Health Connect is not Google Fit: Google Fit was deprecated in June 2025, Health Connect is the unified Android standard and strictly on-device.",
      "Samsung, Fitbit, Garmin, Polar and Withings write to Health Connect; Oura and Huawei require OAuth or are closed ecosystems.",
      "For health data, the only business model with aligned incentives is 'paid, no ads, no trackers': free apps often monetize by selling aggregated data.",
    ],
    es: [
      "La regla práctica de 2026: elige la ruta de datos antes que el dispositivo. Resuelve el 90% de los problemas antes de abrir ninguna app.",
      "Tres formas reales de exportar tus datos: Health Connect (en el dispositivo, Android), OAuth APIs oficiales (datos propietarios completos, requiere aprobación), exportación manual (lenta pero garantizada por el RGPD art. 20).",
      "Health Connect no es Google Fit: Google Fit quedó obsoleto en junio de 2025, Health Connect es el estándar unificado de Android y funciona estrictamente en el dispositivo.",
      "Samsung, Fitbit, Garmin, Polar y Withings escriben en Health Connect; Oura y Huawei requieren OAuth o son ecosistemas cerrados.",
      "Para datos de salud, el único modelo con incentivos alineados es 'pago único, sin anuncios, sin rastreadores': las apps gratuitas suelen monetizar vendiendo datos agregados.",
    ],
  },
  primaryKeyword: {
    it: "sincronizzare smartwatch dashboard",
    en: "sync smartwatch dashboard",
    es: "sincronizar smartwatch panel",
  },
  secondaryKeywords: {
    it: [
      "health connect 2026",
      "samsung health export",
      "oauth wearable",
      "gdpr dati fitness",
      "dashboard salute personale",
    ],
    en: [
      "health connect 2026",
      "samsung health export",
      "wearable oauth",
      "gdpr fitness data",
      "personal health dashboard",
    ],
  },
  metaDescription: {
    it: "Tutto quello che ti serve per sincronizzare il tuo wearable nel 2026: Health Connect, Samsung Health, OAuth ufficiali, GDPR, e come confrontare le opzioni senza farsi fregare.",
    en: "Everything you need to sync your wearable in 2026: Health Connect, Samsung Health, official OAuths, GDPR, and how to compare the options without getting fooled.",
    es: "Todo lo que necesitas para sincronizar tu wearable en 2026: Health Connect, Samsung Health, OAuth oficiales, RGPD y cómo comparar las opciones sin dejarte engañar.",
  },
  hero: {
    kicker: { it: "Guida pilastro", en: "Pillar guide", es: "Guía pilar" },
    title: {
      it: "Guida completa al sync wearable nel 2026",
      en: "The complete guide to wearable sync in 2026",
      es: "Guía completa para sincronizar tu wearable en 2026",
    },
    subtitle: {
      it: "Tre standard convivono, dieci brand spingono ognuno il proprio cloud, una sola regola pratica per non perdere tempo: scegli la pipa dati prima del gadget.",
      en: "Three standards coexist, ten brands each push their own cloud, one practical rule to save time: pick the data pipe before the gadget.",
      es: "Tres estándares conviven, diez marcas impulsan cada una su propio servicio en la nube, y hay una sola regla práctica para no perder tiempo: elige la ruta de datos antes que el dispositivo.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Nel 2026 la regola pratica per non perdere tempo con il sync wearable è una sola: scegli la pipeline dati prima del gadget. Tre standard convivono (Health Connect, OAuth ufficiali, export manuale), dieci brand spingono ognuno il proprio cloud, e capire quale percorso usare risolve il 90% dei problemi prima ancora di aprire un'app.",
        en: "In 2026 the one practical rule to avoid wasting time on wearable sync is simple: pick the data pipe before the gadget. Three standards coexist (Health Connect, official OAuths, manual export), ten brands each push their own cloud, and understanding which path to use resolves 90% of problems before you even open an app.",
        es: "En 2026, la única regla práctica para no perder tiempo con la sincronización de wearables es sencilla: elige la ruta de datos antes que el dispositivo. Tres estándares conviven (Health Connect, OAuth oficiales, exportación manual), diez marcas impulsan cada una su propio servicio en la nube, y entender qué camino tomar resuelve el 90% de los problemas antes de abrir ninguna app.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questa guida è il punto di partenza onesto: ti spiega gli standard tecnici reali (Health Connect, OAuth API ufficiali, esportazioni manuali), come si comportano oggi i principali produttori, cosa fa la differenza per chi vuole davvero i propri dati, e come confrontare le soluzioni di sync senza cadere nelle promesse di marketing.",
        en: "This guide is the honest starting point: it explains the real technical standards (Health Connect, official OAuth APIs, manual exports), how the main manufacturers behave today, what makes the difference for people who actually want their own data, and how to compare sync solutions without falling for marketing fluff.",
        es: "Esta guía es el punto de partida honesto: explica los estándares reales (Health Connect, OAuth APIs oficiales, exportaciones manuales), cómo actúan hoy los principales fabricantes, qué marca la diferencia para quien quiere de verdad sus propios datos, y cómo comparar soluciones de sincronización sin caer en las promesas de marketing.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "I tre modi reali per portare via i dati dal tuo wearable",
        en: "The three real ways to get data out of your wearable",
        es: "Las tres formas reales de exportar datos de tu wearable",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Smetti di leggere recensioni e domandati: come escono i dati di questo dispositivo? Le risposte tecniche sono tre, in ordine di affidabilità decrescente.",
        en: "Stop reading reviews and ask yourself: how does data leave this device? There are three technical answers, in decreasing order of reliability.",
        es: "Deja de leer reseñas y pregúntate: ¿cómo salen los datos de este dispositivo? Hay tres respuestas técnicas, en orden decreciente de fiabilidad.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "1. Health Connect (Android, dal 2024)", en: "1. Health Connect (Android, since 2024)", es: "1. Health Connect (Android, desde 2024)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect è il livello di scambio dati salute ufficiale di Android. Le app dei produttori (Samsung Health, Fitbit, Garmin Connect, Polar Flow, Mi Fitness, Health Mate di Withings, Zepp per Amazfit) scrivono su Health Connect; le app terze leggono. Niente OAuth, niente chiavi API, niente cloud intermedio: i dati vivono sul telefono, l'app terza chiede permesso al sistema operativo per ogni tipo di dato.",
        en: "Health Connect is Android's official health data exchange layer. Manufacturer apps (Samsung Health, Fitbit, Garmin Connect, Polar Flow, Mi Fitness, Withings Health Mate, Zepp for Amazfit) write to Health Connect; third-party apps read. No OAuth, no API keys, no intermediary cloud: data lives on the phone, the third-party app asks the OS for permission per data type.",
        es: "Health Connect es la capa oficial de intercambio de datos de salud de Android. Las apps de los fabricantes (Samsung Health, Fitbit, Garmin Connect, Polar Flow, Mi Fitness, Health Mate de Withings, Zepp para Amazfit) escriben en Health Connect; las apps de terceros leen desde ahí. Sin OAuth, sin claves de API, sin servicios intermedios: los datos viven en el teléfono y la app de terceros solicita permiso al sistema operativo por cada tipo de dato.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Pro**: privacy strutturale (i dati non passano da nessun server esterno), zero attriti di setup, latenza tipica 5–30 minuti.",
          "**Contro**: granularità ridotta (alcune metriche proprietarie come Body Battery di Garmin o Recovery Pro di Polar non sono esposte), nessun backfill storico oltre il telefono.",
          "**Quando**: per la stragrande maggioranza degli utenti che vogliono passi/BPM/sonno/calorie/allenamenti, è la scelta giusta nel 2026.",
        ],
        en: [
          "**Pros**: structural privacy (data doesn't pass through any external server), zero setup friction, typical latency 5–30 minutes.",
          "**Cons**: reduced granularity (some proprietary metrics like Garmin Body Battery or Polar Recovery Pro aren't exposed), no historical backfill beyond what's on the phone.",
          "**When**: for the vast majority of users who want steps/HR/sleep/calories/workouts, this is the right choice in 2026.",
        ],
        es: [
          "**Ventajas**: privacidad estructural (los datos no pasan por ningún servidor externo), configuración sin fricciones, latencia típica de 5 a 30 minutos.",
          "**Inconvenientes**: granularidad reducida (algunas métricas propietarias como Body Battery de Garmin o Recovery Pro de Polar no se exponen), sin recuperación de historial más allá del teléfono.",
          "**Cuándo usarlo**: para la gran mayoría de usuarios que quieren pasos/frecuencia cardíaca/sueño/calorías/entrenamientos, es la opción correcta en 2026.",
        ],
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "2. OAuth API ufficiali", en: "2. Official OAuth APIs", es: "2. OAuth APIs oficiales" },
    },
    {
      type: "paragraph",
      text: {
        it: "Quando vuoi le metriche proprietarie complete (sleep stages REM/Deep/Light di Fitbit, Body Battery e Training Load di Garmin, Nightly Recharge di Polar, Readiness Score di Oura, ECG Withings), serve l'API ufficiale del produttore via OAuth 2.0. È un'integrazione cloud-to-cloud: tu autorizzi una vez, l'app terza scarica i dati dal cloud del produttore, di solito con backfill storico 6–12 mesi al primo connect.",
        en: "When you want the full proprietary metrics (Fitbit REM/Deep/Light sleep stages, Garmin Body Battery and Training Load, Polar Nightly Recharge, Oura Readiness Score, Withings ECG), you need the manufacturer's official API via OAuth 2.0. It's a cloud-to-cloud integration: you authorize once, the third-party app downloads data from the manufacturer's cloud, usually with a 6–12 month historical backfill at first connect.",
        es: "Cuando quieres las métricas propietarias completas (fases del sueño REM/profundo/ligero de Fitbit, Body Battery y Training Load de Garmin, Nightly Recharge de Polar, Readiness Score de Oura, ECG de Withings), necesitas la API oficial del fabricante mediante OAuth 2.0. Es una integración de servicio a servicio: autorizas una vez, la app de terceros descarga los datos desde el servicio del fabricante, normalmente con un historial de 6 a 12 meses al conectar por primera vez.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Pro**: dati più granulari e completi, accesso a metriche brand-specific, backfill storico.",
          "**Contro**: i dati passano da un cloud terzo prima di arrivarti, la maggior parte dei produttori richiede approvazione (Garmin Developer Program può richiedere 4–8 settimane), latenza polling 15–30 minuti.",
          "**Quando**: se sei un atleta serio o un nerd dei dati e ti servono metriche specifiche del tuo device.",
        ],
        en: [
          "**Pros**: more granular and complete data, access to brand-specific metrics, historical backfill.",
          "**Cons**: data passes through a third cloud first, most manufacturers require approval (Garmin Developer Program can take 4–8 weeks), 15–30 minute polling latency.",
          "**When**: if you're a serious athlete or data nerd who needs specific metrics from your device.",
        ],
        es: [
          "**Ventajas**: datos más granulares y completos, acceso a métricas específicas de cada marca, recuperación de historial.",
          "**Inconvenientes**: los datos pasan primero por un servicio externo, la mayoría de los fabricantes requieren aprobación (el Garmin Developer Program puede tardar entre 4 y 8 semanas), latencia de consulta de 15 a 30 minutos.",
          "**Cuándo usarlo**: si eres un atleta serio o un apasionado de los datos que necesita métricas específicas de tu dispositivo.",
        ],
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "3. Esportazione manuale (CSV, GPX, FIT)", en: "3. Manual export (CSV, GPX, FIT)", es: "3. Exportación manual (CSV, GPX, FIT)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Il fallback universale. Samsung, Garmin, Polar, Fitbit (via Google Takeout dal 2023), Withings, Apple Health: tutti permettono l'esportazione dei dati grezzi in qualche formato. Lento, manuale, ma garantito per legge (GDPR articolo 20, diritto alla portabilità) e quindi destinato a sopravvivere a qualsiasi cambio di policy.",
        en: "The universal fallback. Samsung, Garmin, Polar, Fitbit (via Google Takeout since 2023), Withings, Apple Health: all allow raw data export in some format. Slow, manual, but legally guaranteed (GDPR article 20, right to portability) and therefore destined to survive any policy change.",
        es: "El respaldo universal. Samsung, Garmin, Polar, Fitbit (mediante Google Takeout desde 2023), Withings, Apple Health: todos permiten exportar los datos en bruto en algún formato. Es lento y manual, pero está garantizado por ley (RGPD artículo 20, derecho de portabilidad) y, por tanto, sobrevivirá a cualquier cambio de política.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Regola pratica", en: "Practical rule", es: "Regla práctica" },
      body: {
        it: "Se compri un device nel 2026, fai questo test prima: cerca su Google '[nome device] Health Connect'. Se trovi una guida ufficiale del produttore, vai sereno. Se trovi solo discussioni Reddit del 2023 con workaround, ti stai legando a un ecosistema chiuso.",
        en: "If you're buying a device in 2026, run this test first: Google '[device name] Health Connect'. If you find an official manufacturer guide, you're good. If you only find Reddit threads from 2023 with workarounds, you're locking into a closed ecosystem.",
        es: "Si vas a comprar un dispositivo en 2026, haz antes esta prueba: busca en Google '[nombre del dispositivo] Health Connect'. Si encuentras una guía oficial del fabricante, puedes estar tranquilo. Si solo aparecen hilos de Reddit de 2023 con soluciones alternativas, te estás atando a un ecosistema cerrado.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Health Connect non è Google Fit (e perché è importante)",
        en: "Health Connect is not Google Fit (and why that matters)",
        es: "Health Connect no es Google Fit (y por qué eso importa)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Google Fit, come app standalone e come piattaforma, è stato deprecato. Dal 30 giugno 2025 l'app Google Fit ha smesso di funzionare; le API Google Fit Web sono state spente a luglio 2024 e completamente rimosse a giugno 2025. Tutto è migrato su Health Connect. Se leggi guide vecchie che parlano di 'Google Fit API', sono obsolete e nessuno le aggiornerà.",
        en: "Google Fit, as a standalone app and as a platform, has been deprecated. From June 30, 2025 the Google Fit app stopped working; Google Fit Web APIs were turned off in July 2024 and fully removed by June 2025. Everything migrated to Health Connect. If you read old guides talking about 'Google Fit API', they're obsolete and nobody will update them.",
        es: "Google Fit, tanto como app independiente como plataforma, ha quedado obsoleto. Desde el 30 de junio de 2025, la app Google Fit dejó de funcionar; las API web de Google Fit se desactivaron en julio de 2024 y se eliminaron por completo en junio de 2025. Todo migró a Health Connect. Si lees guías antiguas que hablan de la 'Google Fit API', están desfasadas y nadie las actualizará.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect ha tre caratteristiche che lo rendono strutturalmente diverso da Google Fit:",
        en: "Health Connect has three features that make it structurally different from Google Fit:",
        es: "Health Connect tiene tres características que lo hacen estructuralmente diferente de Google Fit:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**On-device, non cloud**: i dati restano sul telefono. Google non li vede. L'app terza nemmeno, finché non ne richiedi esplicitamente la trasmissione.",
          "**Granular permissions**: puoi dare permesso solo per 'passi' senza dare anche 'sonno'. Ogni tipo di dato è un permesso separato.",
          "**Standard Android ufficiale**: preinstallato su Android 14+, distribuito da Google, controllato da Google Play Protect.",
        ],
        en: [
          "**On-device, not cloud**: data stays on the phone. Google doesn't see it. The third-party app doesn't either, until you explicitly request transmission.",
          "**Granular permissions**: you can grant 'steps' without also granting 'sleep'. Each data type is a separate permission.",
          "**Official Android standard**: preinstalled on Android 14+, distributed by Google, governed by Google Play Protect.",
        ],
        es: [
          "**En el dispositivo, no en la nube**: los datos permanecen en el teléfono. Google no los ve. La app de terceros tampoco, hasta que tú solicitas explícitamente la transmisión.",
          "**Permisos granulares**: puedes conceder acceso solo a 'pasos' sin conceder también 'sueño'. Cada tipo de dato es un permiso independiente.",
          "**Estándar oficial de Android**: preinstalado en Android 14+, distribuido por Google y gestionado por Google Play Protect.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Stato dei principali brand a maggio 2026",
        en: "State of the main brands as of May 2026",
        es: "Estado de las principales marcas a mayo de 2026",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Quello che segue è lo stato verificato delle pipeline dati pubbliche dei principali produttori. Le situazioni cambiano nel tempo: usa questa tabella come baseline, poi verifica al momento dell'acquisto.",
        en: "What follows is the verified state of the public data pipelines for major manufacturers. Things change over time: use this table as a baseline, then verify at purchase time.",
        es: "Lo que sigue es el estado verificado de las rutas de datos públicas de los principales fabricantes. La situación cambia con el tiempo: usa esta tabla como referencia y verifica en el momento de la compra.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Pipeline dati ufficiali dei principali wearable, maggio 2026.",
        en: "Official data pipelines for major wearables, May 2026.",
        es: "Rutas de datos oficiales de los principales wearables, mayo de 2026.",
      },
      headers: {
        it: ["Brand", "Health Connect (oggi)", "OAuth ufficiale", "Esportazione"],
        en: ["Brand", "Health Connect (today)", "Official OAuth", "Export"],
        es: ["Marca", "Health Connect (hoy)", "OAuth oficial", "Exportación"],
      },
      rows: [
        {
          it: ["Samsung Galaxy Watch", "Sì, nativo via Samsung Health", "Samsung Health API (limitata)", "Sì, da Samsung Health"],
          en: ["Samsung Galaxy Watch", "Yes, native via Samsung Health", "Samsung Health API (limited)", "Yes, from Samsung Health"],
          es: ["Samsung Galaxy Watch", "Sí, nativo mediante Samsung Health", "Samsung Health API (limitada)", "Sí, desde Samsung Health"],
        },
        {
          it: ["Pixel Watch", "Sì, via app Fitbit", "Fitbit Web API (richiede approvazione)", "Sì, via Google Takeout"],
          en: ["Pixel Watch", "Yes, via Fitbit app", "Fitbit Web API (requires approval)", "Yes, via Google Takeout"],
          es: ["Pixel Watch", "Sí, mediante app Fitbit", "Fitbit Web API (requiere aprobación)", "Sí, mediante Google Takeout"],
        },
        {
          it: ["Fitbit (Charge/Sense/Versa)", "Sì, dal 2024", "Fitbit Web API", "Sì, via Google Takeout"],
          en: ["Fitbit (Charge/Sense/Versa)", "Yes, since 2024", "Fitbit Web API", "Yes, via Google Takeout"],
          es: ["Fitbit (Charge/Sense/Versa)", "Sí, desde 2024", "Fitbit Web API", "Sí, mediante Google Takeout"],
        },
        {
          it: ["Garmin (tutti)", "Sì, base (passi, BPM, sonno totale)", "Garmin Health API (developer program)", "Sì, da Garmin Connect"],
          en: ["Garmin (all)", "Yes, basic (steps, HR, total sleep)", "Garmin Health API (developer program)", "Yes, from Garmin Connect"],
          es: ["Garmin (todos)", "Sí, básico (pasos, frecuencia cardíaca, sueño total)", "Garmin Health API (developer program)", "Sí, desde Garmin Connect"],
        },
        {
          it: ["Polar (Vantage, Grit X)", "Sì, base", "Polar Accesslink", "Sì, da Polar Flow"],
          en: ["Polar (Vantage, Grit X)", "Yes, basic", "Polar Accesslink", "Yes, from Polar Flow"],
          es: ["Polar (Vantage, Grit X)", "Sí, básico", "Polar Accesslink", "Sí, desde Polar Flow"],
        },
        {
          it: ["Oura Ring", "No (no app Android nativa HC)", "Oura Cloud API v2", "Sì, da app/web"],
          en: ["Oura Ring", "No (no native Android HC app)", "Oura Cloud API v2", "Yes, from app/web"],
          es: ["Oura Ring", "No (sin app Android nativa para HC)", "Oura Cloud API v2", "Sí, desde app/web"],
        },
        {
          it: ["Withings", "Sì, dal 2024", "Withings API v2", "Sì, da Health Mate"],
          en: ["Withings", "Yes, since 2024", "Withings API v2", "Yes, from Health Mate"],
          es: ["Withings", "Sí, desde 2024", "Withings API v2", "Sí, desde Health Mate"],
        },
        {
          it: ["Xiaomi Mi Band 7+", "Sì, via Mi Fitness", "No API pubblica per terzi", "Limitato"],
          en: ["Xiaomi Mi Band 7+", "Yes, via Mi Fitness", "No public third-party API", "Limited"],
          es: ["Xiaomi Mi Band 7+", "Sí, mediante Mi Fitness", "Sin API pública para terceros", "Limitado"],
        },
        {
          it: ["Huawei Watch (con HMS)", "No (ecosistema separato)", "Huawei Health Kit", "Limitato"],
          en: ["Huawei Watch (with HMS)", "No (separate ecosystem)", "Huawei Health Kit", "Limited"],
          es: ["Huawei Watch (con HMS)", "No (ecosistema separado)", "Huawei Health Kit", "Limitado"],
        },
        {
          it: ["Apple Watch", "No (ecosistema iOS chiuso)", "HealthKit (iOS only)", "Sì, da app Salute"],
          en: ["Apple Watch", "No (closed iOS ecosystem)", "HealthKit (iOS only)", "Yes, from Health app"],
          es: ["Apple Watch", "No (ecosistema iOS cerrado)", "HealthKit (solo iOS)", "Sí, desde la app Salud"],
        },
        {
          it: ["Strava (piattaforma)", "No (importa da watch, non sync HC)", "Strava API v3", "Sì, da web"],
          en: ["Strava (platform)", "No (imports from watch, no HC sync)", "Strava API v3", "Yes, from web"],
          es: ["Strava (plataforma)", "No (importa desde el reloj, sin sincronización HC)", "Strava API v3", "Sí, desde web"],
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Apple Watch è un mondo a parte", en: "Apple Watch is its own world", es: "Apple Watch es un mundo aparte" },
      body: {
        it: "Tutto quello che leggi qui vale per Android. Apple Watch funziona solo con iPhone e i suoi dati vivono in Apple Health (iOS). Non esiste un equivalente Health Connect per iOS: Apple ha HealthKit ma è on-device per definizione, e nessun produttore terzo può scrivere a iCloud per conto tuo. Se vuoi una dashboard cross-platform partendo da Apple Watch, devi esportare manualmente o usare app iOS dedicate.",
        en: "Everything you read here applies to Android. Apple Watch only works with iPhone and its data lives in Apple Health (iOS). There's no Health Connect equivalent on iOS: Apple has HealthKit but it's on-device by definition, and no third-party manufacturer can write to iCloud for you. If you want a cross-platform dashboard starting from Apple Watch, you must export manually or use dedicated iOS apps.",
        es: "Todo lo que lees aquí aplica a Android. Apple Watch solo funciona con iPhone y sus datos viven en Apple Health (iOS). No existe un equivalente de Health Connect para iOS: Apple tiene HealthKit, pero por definición funciona en el dispositivo, y ningún fabricante externo puede escribir en iCloud en tu nombre. Si quieres un panel multiplataforma a partir de Apple Watch, debes exportar manualmente o usar apps iOS dedicadas.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "GDPR, dati salute, e dove finiscono i tuoi BPM",
        en: "GDPR, health data, and where your heart rate ends up",
        es: "RGPD, datos de salud y adónde va tu frecuencia cardíaca",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Frequenza cardiaca, sonno, peso, ciclo mestruale, glicemia: in Europa sono dati sanitari (GDPR articolo 9). La loro raccolta richiede un consenso esplicito (non implicito) e il loro trattamento è soggetto a regole più severe rispetto ad altri dati personali. Il produttore del tuo wearable ha sede legale in Europa? Probabilmente no. Polar è finlandese, Withings è francese, ma Samsung, Google, Fitbit, Garmin, Xiaomi, Huawei hanno headquarters fuori UE.",
        en: "Heart rate, sleep, weight, menstrual cycle, blood glucose: in Europe these are health data (GDPR article 9). Collection requires explicit (not implicit) consent and processing is subject to stricter rules than other personal data. Does your wearable's manufacturer have a legal entity in Europe? Probably not. Polar is Finnish, Withings is French, but Samsung, Google, Fitbit, Garmin, Xiaomi, Huawei are headquartered outside the EU.",
        es: "Frecuencia cardíaca, sueño, peso, ciclo menstrual, glucosa en sangre: en Europa son datos de salud (RGPD artículo 9). Su recogida requiere consentimiento explícito (no implícito) y su tratamiento está sujeto a normas más estrictas que otros datos personales. ¿El fabricante de tu wearable tiene sede legal en Europa? Probablemente no. Polar es finlandesa, Withings es francesa, pero Samsung, Google, Fitbit, Garmin, Xiaomi y Huawei tienen su sede fuera de la UE.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Cosa significa in pratica per te:",
        en: "What this means in practice:",
        es: "Lo que esto significa en la práctica:",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Diritto di accesso (art. 15)**: puoi chiedere a qualsiasi produttore una copia dei tuoi dati. Hanno 30 giorni per fornirla, in formato leggibile. Fitbit e Google Fit lo fanno via Google Takeout; Garmin via account settings; Samsung Health via export interno.",
          "**Diritto alla portabilità (art. 20)**: hai diritto a ricevere i tuoi dati in formato strutturato e comune (CSV, JSON), e a trasmetterli a un altro titolare. Questo è il fondamento legale che rende impossibile bloccarti completamente in un ecosistema.",
          "**Diritto alla cancellazione (art. 17)**: cancellando l'account, devono cancellare i dati. Nella pratica, alcuni mantengono backup per 30–90 giorni per ragioni operative, è ammesso, ma documentato nelle privacy policy.",
        ],
        en: [
          "**Right of access (art. 15)**: you can ask any manufacturer for a copy of your data. They have 30 days to provide it in a readable format. Fitbit and Google Fit do this via Google Takeout; Garmin via account settings; Samsung Health via internal export.",
          "**Right to portability (art. 20)**: you have the right to receive your data in a structured, common format (CSV, JSON), and to transmit it to another controller. This is the legal basis that makes total ecosystem lock-in impossible.",
          "**Right to erasure (art. 17)**: deleting your account means they must delete the data. In practice some keep backups for 30–90 days for operational reasons, allowed but documented in privacy policies.",
        ],
        es: [
          "**Derecho de acceso (art. 15)**: puedes pedir a cualquier fabricante una copia de tus datos. Tienen 30 días para proporcionarla en formato legible. Fitbit y Google Fit lo hacen mediante Google Takeout; Garmin desde los ajustes de cuenta; Samsung Health mediante exportación interna.",
          "**Derecho de portabilidad (art. 20)**: tienes derecho a recibir tus datos en un formato estructurado y común (CSV, JSON) y a transmitirlos a otro responsable. Esta es la base legal que hace imposible el bloqueo total dentro de un ecosistema.",
          "**Derecho de supresión (art. 17)**: al eliminar la cuenta, deben borrar los datos. En la práctica, algunos conservan copias de seguridad entre 30 y 90 días por razones operativas, lo cual está permitido pero debe estar documentado en las políticas de privacidad.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi capire dove vanno i dati senza leggere 50 pagine di privacy policy?",
        en: "Want to understand where your data goes without reading 50 pages of privacy policy?",
        es: "¿Quieres saber adónde van tus datos sin leer 50 páginas de política de privacidad?",
      },
      body: {
        it: "Abbiamo scritto un approfondimento dedicato sui dati fitness e GDPR, con esempi pratici di come ogni grande brand gestisce i tuoi BPM.",
        en: "We wrote a dedicated deep-dive on fitness data and GDPR, with practical examples of how each major brand handles your heart rate.",
        es: "Escribimos un análisis en profundidad sobre datos fitness y RGPD, con ejemplos prácticos de cómo cada gran marca gestiona tu frecuencia cardíaca.",
      },
      ctaLabel: {
        it: "Leggi l'approfondimento GDPR →",
        en: "Read the GDPR deep-dive →",
        es: "Leer el análisis RGPD →",
      },
      ctaHref: {
        it: "/it/blog/gdpr-dati-fitness-smartwatch",
        en: "/en/blog/gdpr-dati-fitness-smartwatch",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Comparison framework: come scegliere una soluzione di sync",
        en: "Comparison framework: how to choose a sync solution",
        es: "Marco de comparación: cómo elegir una solución de sincronización",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Quando valuti un'app o un servizio per portare i dati del tuo wearable in un posto unico, fai queste cinque domande. Sono le stesse che ci poniamo internamente per ogni integrazione che aggiungiamo a FitMesh Sync.",
        en: "When evaluating an app or service to centralize your wearable data, ask these five questions. They're the same we ask ourselves internally for every integration we add to FitMesh Sync.",
        es: "Cuando evalúes una app o servicio para centralizar los datos de tu wearable, hazte estas cinco preguntas. Son las mismas que nos hacemos internamente para cada integración que añadimos a FitMesh Sync.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Dove vivono i dati?** On-device (preferito), cloud del produttore (accettabile), cloud terzo opaco (rosso).",
          "**Che permessi serve?** Health Connect → granulare per tipo dato. OAuth → granulare per scope. Se l'app chiede 'tutto o niente', è un campanello d'allarme.",
          "**Si può esportare?** Anche dall'app di sync, non solo dal produttore. Un servizio che ti permette di entrare ma non di uscire è una trappola.",
          "**Chi è dietro l'app?** Cerca chi paga le bollette: se è gratis e non vede pubblicità, probabilmente vende i dati. La via 'a pagamento, no ads, no tracker' è l'unica sostenibile per dati salute.",
          "**Cosa succede se chiudono?** Hai un piano di esportazione automatica? I tuoi dati saranno scaricabili anche se domani il fondatore vende l'azienda?",
        ],
        en: [
          "**Where does data live?** On-device (preferred), manufacturer cloud (acceptable), opaque third cloud (red flag).",
          "**What permissions does it need?** Health Connect → granular per data type. OAuth → granular per scope. If the app asks for 'all or nothing', that's a warning sign.",
          "**Can you export?** From the sync app too, not just from the manufacturer. A service that lets you in but not out is a trap.",
          "**Who's behind the app?** Find who pays the bills: if it's free and shows no ads, it's probably selling data. The 'paid, no ads, no trackers' path is the only sustainable one for health data.",
          "**What happens if they shut down?** Do you have an automatic export plan? Will your data be downloadable even if the founder sells the company tomorrow?",
        ],
        es: [
          "**¿Dónde viven los datos?** En el dispositivo (preferido), en el servicio del fabricante (aceptable), en un servicio externo opaco (señal de alerta).",
          "**¿Qué permisos necesita?** Health Connect: granular por tipo de dato. OAuth: granular por alcance. Si la app pide 'todo o nada', es una señal de alerta.",
          "**¿Se pueden exportar?** También desde la app de sincronización, no solo desde el fabricante. Un servicio que te deja entrar pero no salir es una trampa.",
          "**¿Quién hay detrás de la app?** Averigua quién paga las facturas: si es gratis y no muestra publicidad, probablemente vende los datos. El modelo 'de pago, sin anuncios, sin rastreadores' es el único sostenible para datos de salud.",
          "**¿Qué pasa si cierran?** ¿Tienes un plan de exportación automática? ¿Podrás descargar tus datos incluso si mañana el fundador vende la empresa?",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Approfondimenti specifici per brand", en: "Brand-specific deep-dives", es: "Análisis en profundidad por marca" },
    },
    {
      type: "paragraph",
      text: {
        it: "Ogni ecosistema ha le sue stranezze. Qui sotto trovi gli approfondimenti dedicati ai casi più frequenti: leggili se sei nel campo specifico, salta se non riguarda il tuo setup.",
        en: "Each ecosystem has its quirks. Below are dedicated deep-dives for the most frequent cases: read them if relevant to your setup, skip otherwise.",
        es: "Cada ecosistema tiene sus particularidades. A continuación encontrarás análisis en profundidad para los casos más frecuentes: léelos si son relevantes para tu configuración, omítelos si no.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Galaxy Watch**: la pipeline è Samsung Health → Health Connect, ma serve sapere quali permessi sono di default off. Vedi la guida [Backup Galaxy Watch senza Samsung Cloud](/it/blog/backup-galaxy-watch-pc).",
          "**Fitbit dopo Google**: dopo l'acquisizione di Fitbit da parte di Google nel 2021 e la migrazione account 2022–2023, ci sono cambiamenti significativi nel modo di esportare. Vedi [Esportare dati Fitbit dopo l'acquisizione Google](/it/blog/esportare-dati-fitbit-google).",
          "**Health Connect vs Samsung Health**: due livelli che lavorano insieme. Quando usare cosa lo spieghiamo in [Health Connect vs Samsung Health 2026](/it/blog/health-connect-vs-samsung-health).",
          "**Dashboard browser**: se vuoi vedere passi/sonno/BPM su PC senza app mobile, la strada non è ovvia ma esiste. Guida in [Vedere dati wearable da browser](/it/blog/vedere-dati-wearable-browser-pc).",
          "**Bridge app cloud-to-cloud**: la categoria 'app ponte tra ecosistemi' è in pieno cambiamento. Panorama completo in [Alternative app sync wearable 2026](/it/blog/alternative-app-sync-wearable-2026).",
          "**GDPR pratica**: dove finiscono BPM e sonno secondo le privacy policy effettive. Vedi [GDPR dati fitness](/it/blog/gdpr-dati-fitness-smartwatch).",
        ],
        en: [
          "**Galaxy Watch**: the pipeline is Samsung Health → Health Connect, but you need to know which permissions are off by default. See [Galaxy Watch backup without Samsung Cloud](/en/blog/backup-galaxy-watch-pc).",
          "**Fitbit after Google**: after Google's 2021 acquisition of Fitbit and the 2022–2023 account migration, there are significant changes in how to export. See [Exporting Fitbit data after Google acquisition](/en/blog/esportare-dati-fitbit-google).",
          "**Health Connect vs Samsung Health**: two layers that work together. When to use what we explain in [Health Connect vs Samsung Health 2026](/en/blog/health-connect-vs-samsung-health).",
          "**Browser dashboard**: if you want to see steps/sleep/HR on a PC without a mobile app, the path isn't obvious but it exists. Guide in [Viewing wearable data from a browser](/en/blog/vedere-dati-wearable-browser-pc).",
          "**Cloud-to-cloud bridge apps**: the 'bridge between ecosystems' category is changing rapidly. Full landscape in [Wearable sync alternatives 2026](/en/blog/alternative-app-sync-wearable-2026).",
          "**GDPR in practice**: where heart rate and sleep actually end up according to real privacy policies. See [GDPR and fitness data](/en/blog/gdpr-dati-fitness-smartwatch).",
        ],
        es: [
          "**Galaxy Watch**: la ruta es Samsung Health → Health Connect, pero necesitas saber qué permisos están desactivados por defecto. Consulta la guía [Copia de seguridad de Galaxy Watch sin Samsung Cloud](/es/blog/backup-galaxy-watch-pc).",
          "**Fitbit tras Google**: tras la adquisición de Fitbit por Google en 2021 y la migración de cuentas en 2022-2023, hay cambios significativos en la forma de exportar. Consulta [Exportar datos de Fitbit tras la adquisición de Google](/es/blog/esportare-dati-fitbit-google).",
          "**Health Connect vs Samsung Health**: dos capas que trabajan juntas. Explicamos cuándo usar cada una en [Health Connect vs Samsung Health 2026](/es/blog/health-connect-vs-samsung-health).",
          "**Panel en el navegador**: si quieres ver pasos/sueño/frecuencia cardíaca en el PC sin app móvil, el camino no es obvio pero existe. Guía en [Ver datos del wearable desde el navegador](/es/blog/vedere-dati-wearable-browser-pc).",
          "**Apps puente entre ecosistemas**: esta categoría está cambiando rápidamente. Panorama completo en [Alternativas de sincronización de wearables 2026](/es/blog/alternative-app-sync-wearable-2026).",
          "**RGPD en la práctica**: adónde van realmente la frecuencia cardíaca y el sueño según las políticas de privacidad reales. Consulta [RGPD y datos fitness](/es/blog/gdpr-dati-fitness-smartwatch).",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Provider supportati oggi su FitMesh Sync",
        en: "Providers supported today on FitMesh Sync",
        es: "Proveedores compatibles hoy con FitMesh Sync",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Per trasparenza: FitMesh Sync è il prodotto che costruiamo e il motivo per cui esiste questa guida. Funziona oggi nativamente con tutti i wearable Android che scrivono su Health Connect, e abbiamo in roadmap le integrazioni OAuth ufficiali per i dati avanzati. Niente promesse vaghe: ecco lo stato esplicito di ogni integrazione.",
        en: "For transparency: FitMesh Sync is the product we build and the reason this guide exists. It works today natively with every Android wearable writing to Health Connect, and we have planned OAuth integrations for advanced data. No vague promises: here's the explicit status of each integration.",
        es: "Para ser transparentes: FitMesh Sync es el producto que desarrollamos y la razón por la que existe esta guía. Hoy funciona de forma nativa con todos los wearables Android que escriben en Health Connect, y tenemos en la hoja de ruta las integraciones OAuth oficiales para datos avanzados. Sin promesas vagas: este es el estado exacto de cada integración.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "[Galaxy Watch](/it/sync/galaxy-watch): nativo via Samsung Health + HC.",
          "[Wear OS / Pixel Watch](/it/sync/wear-os): nativo via Fitbit app + HC.",
          "[Pixel Watch dedicato](/it/sync/pixel-watch): guida specifica catena Fitbit app.",
          "[Xiaomi Mi Band / Watch](/it/sync/xiaomi-mi-band): nativo via Mi Fitness + HC (Mi Band 7+).",
          "[Fitbit](/it/sync/fitbit): funziona oggi via HC, OAuth Web API in roadmap Q3 2026.",
          "[Garmin](/it/sync/garmin): base oggi via HC, Body Battery/Training Load in arrivo Q3 2026.",
          "[Polar](/it/sync/polar): base oggi via HC, Accesslink OAuth in arrivo Q4 2026.",
          "[Withings](/it/sync/withings): base oggi via HC, OAuth API v2 in roadmap Q4 2026.",
          "[Strava](/it/sync/strava): OAuth-only, in arrivo Q3 2026.",
          "[Oura Ring](/it/sync/oura): OAuth-only, in arrivo Q4 2026.",
          "[Huawei](/it/sync/huawei): Health Kit OAuth, valutazione in corso.",
        ],
        en: [
          "[Galaxy Watch](/en/sync/galaxy-watch): native via Samsung Health + HC.",
          "[Wear OS / Pixel Watch](/en/sync/wear-os): native via Fitbit app + HC.",
          "[Pixel Watch dedicated](/en/sync/pixel-watch): specific Fitbit-app chain guide.",
          "[Xiaomi Mi Band / Watch](/en/sync/xiaomi-mi-band): native via Mi Fitness + HC (Mi Band 7+).",
          "[Fitbit](/en/sync/fitbit): works today via HC, Web API OAuth on Q3 2026 roadmap.",
          "[Garmin](/en/sync/garmin): basic today via HC, Body Battery/Training Load coming Q3 2026.",
          "[Polar](/en/sync/polar): basic today via HC, Accesslink OAuth coming Q4 2026.",
          "[Withings](/en/sync/withings): basic today via HC, API v2 OAuth on Q4 2026 roadmap.",
          "[Strava](/en/sync/strava): OAuth-only, coming Q3 2026.",
          "[Oura Ring](/en/sync/oura): OAuth-only, coming Q4 2026.",
          "[Huawei](/en/sync/huawei): Health Kit OAuth, under evaluation.",
        ],
        es: [
          "[Galaxy Watch](/es/sync/galaxy-watch): nativo mediante Samsung Health + HC.",
          "[Wear OS / Pixel Watch](/es/sync/wear-os): nativo mediante app Fitbit + HC.",
          "[Pixel Watch dedicado](/es/sync/pixel-watch): guía específica de la cadena con app Fitbit.",
          "[Xiaomi Mi Band / Watch](/es/sync/xiaomi-mi-band): nativo mediante Mi Fitness + HC (Mi Band 7+).",
          "[Fitbit](/es/sync/fitbit): funciona hoy mediante HC, OAuth Web API en hoja de ruta Q3 2026.",
          "[Garmin](/es/sync/garmin): básico hoy mediante HC, Body Battery/Training Load próximamente Q3 2026.",
          "[Polar](/es/sync/polar): básico hoy mediante HC, Accesslink OAuth próximamente Q4 2026.",
          "[Withings](/es/sync/withings): básico hoy mediante HC, OAuth API v2 en hoja de ruta Q4 2026.",
          "[Strava](/es/sync/strava): solo OAuth, próximamente Q3 2026.",
          "[Oura Ring](/es/sync/oura): solo OAuth, próximamente Q4 2026.",
          "[Huawei](/es/sync/huawei): Health Kit OAuth, en evaluación.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Pronto a centralizzare i dati del tuo wearable?",
        en: "Ready to centralize your wearable data?",
        es: "¿Listo para centralizar los datos de tu wearable?",
      },
      body: {
        it: "FitMesh Sync è gratis durante la beta per i primi 100 founder. App Android via Play Store, dashboard web inclusa.",
        en: "FitMesh Sync is free during beta for the first 100 founders. Android app via Play Store, web dashboard included.",
        es: "FitMesh Sync es gratis durante la beta para los primeros 100 fundadores. App Android disponible en Google Play, panel web incluido.",
      },
      ctaLabel: { it: "Entra in beta", en: "Join the beta", es: "Únete a la beta" },
      ctaHref: { it: "/it/beta", en: "/en/beta" },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa cambierà nei prossimi 18 mesi", en: "What will change in the next 18 months", es: "Qué cambiará en los próximos 18 meses" },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect è destinato a estendersi: Google sta lavorando con i produttori per aggiungere tipi di dato proprietari (HRV intraday, sleep coaching, training readiness) come scope opzionali. La Commissione Europea sta valutando l'inclusione dei dati salute personali generati da wearable nello scope dell'European Health Data Space (EHDS), il che potrebbe forzare gli ecosistemi più chiusi (Apple in primis) ad aprire interoperabilità minime entro il 2027–2028.",
        en: "Health Connect is set to expand: Google is working with manufacturers to add proprietary data types (intraday HRV, sleep coaching, training readiness) as optional scopes. The European Commission is evaluating including wearable-generated personal health data in the European Health Data Space (EHDS) scope, which could force more closed ecosystems (Apple first) to open minimum interoperability by 2027–2028.",
        es: "Health Connect está destinado a expandirse: Google trabaja con los fabricantes para añadir tipos de datos propietarios (HRV intradía, sleep coaching, training readiness) como alcances opcionales. La Comisión Europea está evaluando incluir los datos de salud personales generados por wearables en el ámbito del European Health Data Space (EHDS), lo que podría obligar a los ecosistemas más cerrados (Apple en primer lugar) a abrir una interoperabilidad mínima antes de 2027-2028.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Sul fronte commerciale: ci aspettiamo che almeno uno tra Garmin e Polar lanci un'API completamente pubblica self-serve (oggi entrambi richiedono approvazione developer); che Huawei provi a spingere maggiormente Health Kit fuori dalla Cina; che Oura introduca un piano enterprise per accesso API a costo zero a fronte di volumi. Tutto questo è speculazione informata, prendila con un grano di sale.",
        en: "On the commercial front: we expect at least one of Garmin or Polar to launch a fully public self-serve API (today both require developer approval); Huawei to push Health Kit more outside China; Oura to introduce an enterprise plan with free API access in exchange for volume. All of this is informed speculation. Take it with a grain of salt.",
        es: "En el frente comercial: esperamos que al menos una de las dos marcas, Garmin o Polar, lance una API pública completamente autoservicio (hoy ambas requieren aprobación de desarrollador); que Huawei intente impulsar Health Kit fuera de China; que Oura introduzca un plan enterprise con acceso a la API sin coste a cambio de volumen. Todo esto es especulación informada. Tómalo con precaución.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Punto di partenza pratico", en: "Practical starting point", es: "Punto de partida práctico" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se hai letto fin qui e vuoi azione concreta: vai sul telefono Android, installa Health Connect (se non c'è già), apri l'app del tuo produttore principale, vai in impostazioni e abilita la sincronizzazione con Health Connect. Da quel momento i tuoi dati sono accessibili a qualsiasi app che chieda il permesso giusto. È letteralmente la base.",
        en: "If you read this far and want concrete action: open your Android phone, install Health Connect (if it's not already there), open your main manufacturer's app, go to settings and enable Health Connect sync. From that point your data is accessible to any app that asks for the right permission. It's literally the foundation.",
        es: "Si has llegado hasta aquí y quieres actuar de forma concreta: abre tu teléfono Android, instala Health Connect (si no lo tienes ya), abre la app de tu fabricante principal, ve a los ajustes y activa la sincronización con Health Connect. A partir de ese momento, tus datos serán accesibles para cualquier app que solicite el permiso adecuado. Es literalmente la base.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Poi, se vuoi vederli su una dashboard ordinata invece che frammentati in cinque app diverse, prova FitMesh Sync. Se preferisci continuare con le app dei produttori, ora hai gli strumenti per capire i loro limiti e quando saltare ad altro.",
        en: "Then, if you want to see them in a clean dashboard instead of fragmented across five apps, try FitMesh Sync. If you prefer to stick with the manufacturer apps, you now have the tools to understand their limits and when to jump to something else.",
        es: "Después, si quieres verlos en un panel ordenado en lugar de fragmentados en cinco apps distintas, prueba FitMesh Sync. Si prefieres seguir con las apps de los fabricantes, ahora tienes las herramientas para entender sus límites y saber cuándo cambiar a otra opción.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "In sintesi", en: "In summary", es: "En resumen" },
    },
    {
      type: "list",
      items: {
        it: [
          "Ci sono tre modi reali per portare via dati da un wearable: Health Connect (on-device, zero setup, Android), OAuth API ufficiali (dati proprietari completi, richiede approvazione), export manuale (lento ma garantito per legge dal GDPR art. 20).",
          "Health Connect non è Google Fit: Google Fit è deprecato dal giugno 2025, Health Connect è lo standard Android unificato e strettamente on-device.",
          "Samsung, Fitbit, Garmin, Polar, Withings scrivono su Health Connect. Oura e Huawei no: richiedono OAuth o sono ecosistemi chiusi.",
          "Prima di acquistare un wearable, fai il test: cerca '[nome device] Health Connect' su Google. Se non c'è una guida ufficiale del produttore, ti stai legando a un ecosistema chiuso.",
          "Per dati salute, l'unico modello economico con incentivi allineati è 'a pagamento, no ads, no tracker': le app gratis monetizzano quasi sempre vendendo i dati aggregati.",
        ],
        en: [
          "There are three real ways to get data out of a wearable: Health Connect (on-device, zero setup, Android), official OAuth APIs (full proprietary data, requires approval), manual export (slow but legally guaranteed by GDPR art. 20).",
          "Health Connect is not Google Fit: Google Fit was deprecated in June 2025, Health Connect is the unified Android standard and strictly on-device.",
          "Samsung, Fitbit, Garmin, Polar, Withings write to Health Connect. Oura and Huawei don't: they require OAuth or are closed ecosystems.",
          "Before buying a wearable, run the test: search '[device name] Health Connect' on Google. If there's no official manufacturer guide, you're locking into a closed ecosystem.",
          "For health data, the only business model with aligned incentives is 'paid, no ads, no trackers': free apps almost always monetize by selling aggregated data.",
        ],
        es: [
          "Hay tres formas reales de exportar datos de un wearable: Health Connect (en el dispositivo, sin configuración, Android), OAuth APIs oficiales (datos propietarios completos, requiere aprobación), exportación manual (lenta pero garantizada por ley por el RGPD art. 20).",
          "Health Connect no es Google Fit: Google Fit quedó obsoleto en junio de 2025, Health Connect es el estándar unificado de Android y funciona estrictamente en el dispositivo.",
          "Samsung, Fitbit, Garmin, Polar y Withings escriben en Health Connect. Oura y Huawei no: requieren OAuth o son ecosistemas cerrados.",
          "Antes de comprar un wearable, haz la prueba: busca '[nombre del dispositivo] Health Connect' en Google. Si no hay una guía oficial del fabricante, te estás atando a un ecosistema cerrado.",
          "Para datos de salud, el único modelo de negocio con incentivos alineados es 'de pago, sin anuncios, sin rastreadores': las apps gratuitas casi siempre monetizan vendiendo datos agregados.",
        ],
      },
    },
  ],
  faq: [
    {
      q: { it: "Devo per forza usare Health Connect?", en: "Do I have to use Health Connect?", es: "¿Es obligatorio usar Health Connect?" },
      a: {
        it: "Sui telefoni Android moderni è di fatto lo standard per qualsiasi sync wearable terzo. Esistono ancora app che leggono direttamente dal cloud del produttore via OAuth (Strava, Oura, Garmin Connect IQ), ma per la maggior parte dei dati 'di base' Health Connect è la via più veloce e privacy-friendly. Su iOS Health Connect non esiste: lì il riferimento è HealthKit.",
        en: "On modern Android phones it's effectively the standard for any third-party wearable sync. There are still apps reading directly from the manufacturer cloud via OAuth (Strava, Oura, Garmin Connect IQ), but for most 'basic' data Health Connect is the fastest and most privacy-friendly route. On iOS Health Connect doesn't exist: there the reference is HealthKit.",
        es: "En los teléfonos Android modernos es de facto el estándar para cualquier sincronización de wearables con apps de terceros. Todavía existen apps que leen directamente desde el servicio del fabricante mediante OAuth (Strava, Oura, Garmin Connect IQ), pero para la mayoría de los datos 'básicos' Health Connect es la vía más rápida y respetuosa con la privacidad. En iOS Health Connect no existe: allí la referencia es HealthKit.",
      },
    },
    {
      q: {
        it: "Health Connect mi spia? Google vede i miei dati?",
        en: "Does Health Connect spy on me? Does Google see my data?",
        es: "¿Health Connect me espía? ¿Google ve mis datos?",
      },
      a: {
        it: "No, Health Connect è strettamente on-device. Google fornisce il software e l'API ma i dati non lasciano il telefono finché tu non concedi esplicitamente il permesso a un'app terza. È diverso quando installi l'app Fitbit (di Google) e quella sincronizza con il cloud Fitbit: lì la responsabilità del dato è di Fitbit/Google, non di Health Connect.",
        en: "No, Health Connect is strictly on-device. Google provides the software and the API but data doesn't leave the phone until you explicitly grant permission to a third-party app. It's different when you install the Fitbit app (Google's) which syncs with the Fitbit cloud: there the data controller is Fitbit/Google, not Health Connect.",
        es: "No, Health Connect funciona estrictamente en el dispositivo. Google proporciona el software y la API, pero los datos no salen del teléfono hasta que tú concedes explícitamente el permiso a una app de terceros. Es diferente cuando instalas la app Fitbit (de Google) que sincroniza con el servicio de Fitbit: en ese caso el responsable del dato es Fitbit/Google, no Health Connect.",
      },
    },
    {
      q: {
        it: "Posso vedere i dati Garmin Body Battery in un'app terza?",
        en: "Can I see Garmin Body Battery in a third-party app?",
        es: "¿Puedo ver los datos de Garmin Body Battery en una app de terceros?",
      },
      a: {
        it: "Non oggi via Health Connect: HC non espone metriche proprietarie come Body Battery, Training Load, Recovery Time. Per averle in un'app terza serve che il produttore abbia un'API ufficiale (Garmin Health API) e che l'app terza sia approvata per usarla. Garmin richiede approvazione developer; alcune app come Athlytic la ottengono, altre no.",
        en: "Not today via Health Connect: HC doesn't expose proprietary metrics like Body Battery, Training Load, Recovery Time. To get them in a third-party app you need the manufacturer's official API (Garmin Health API) and the third-party app to be approved to use it. Garmin requires developer approval; some apps like Athlytic get it, others don't.",
        es: "Hoy no, mediante Health Connect: HC no expone métricas propietarias como Body Battery, Training Load o Recovery Time. Para acceder a ellas desde una app de terceros se necesita que el fabricante tenga una API oficial (Garmin Health API) y que la app de terceros esté aprobada para usarla. Garmin requiere aprobación de desarrollador; algunas apps como Athlytic la obtienen, otras no.",
      },
    },
    {
      q: {
        it: "Cosa succede se cambio smartwatch a metà anno?",
        en: "What if I switch smartwatch mid-year?",
        es: "¿Qué pasa si cambio de smartwatch a mitad de año?",
      },
      a: {
        it: "Se entrambi (vecchio e nuovo) scrivono su Health Connect, lo storico passi/BPM/sonno si trova affiancato senza buchi: HC è agnostica rispetto alla fonte. Se passi tra ecosistemi chiusi (es. Apple Watch → Galaxy Watch), devi esportare manualmente i dati di Apple Health e re-importarli (non c'è un automatismo). Una buona pratica è esportare i dati ogni 6 mesi per sicurezza.",
        en: "If both (old and new) write to Health Connect, the steps/HR/sleep history sits side-by-side with no gaps: HC is source-agnostic. If you switch between closed ecosystems (e.g. Apple Watch → Galaxy Watch), you must export Apple Health data manually and re-import (there's no automation). A good practice is to export your data every 6 months for safety.",
        es: "Si ambos (el antiguo y el nuevo) escriben en Health Connect, el historial de pasos/frecuencia cardíaca/sueño aparece junto sin interrupciones: HC es independiente de la fuente. Si cambias entre ecosistemas cerrados (por ejemplo, Apple Watch → Galaxy Watch), debes exportar manualmente los datos de Apple Health e importarlos de nuevo (no hay automatización). Una buena práctica es exportar tus datos cada 6 meses por seguridad.",
      },
    },
    {
      q: {
        it: "Ci sono app gratuite che fanno la stessa cosa?",
        en: "Are there free apps that do the same?",
        es: "¿Hay apps gratuitas que hagan lo mismo?",
      },
      a: {
        it: "Sì, alcune con caveat. Le app gratuite tipicamente monetizzano in tre modi: pubblicità (raccolta dati per ad-tech), upselling premium (gratis per le funzioni base, paghi per quelle che cerchi), o vendita di dati aggregati (i dati salute sono molto valutati). Per dati salute il pricing 'a pagamento, no ads, no tracker' è l'unico modello con allineamento di incentivi pulito. Onestamente: scegli ciò che si allinea al tuo livello di paranoia, ma sii consapevole.",
        en: "Yes, some with caveats. Free apps typically monetize in three ways: ads (data collection for ad-tech), premium upselling (free for basic features, paid for the ones you actually want), or sale of aggregated data (health data is highly valued). For health data, 'paid, no ads, no trackers' is the only pricing model with clean incentive alignment. Honestly: pick what matches your paranoia level, but be aware.",
        es: "Sí, algunas con matices. Las apps gratuitas suelen monetizar de tres formas: publicidad (recogida de datos para publicidad digital), upselling premium (gratis para las funciones básicas, de pago para las que realmente buscas) o venta de datos agregados (los datos de salud tienen mucho valor). Para datos de salud, el modelo 'de pago, sin anuncios, sin rastreadores' es el único con una alineación de incentivos limpia. Para ser honestos: elige lo que encaje con tu nivel de preocupación por la privacidad, pero sé consciente de ello.",
      },
    },
  ],
  related: [
    "scegliere-smartwatch-dati-2026",
    "health-connect-vs-samsung-health",
    "gdpr-dati-fitness-smartwatch",
    "alternative-health-sync-2026",
  ],
  brandsMentioned: [
    "Samsung",
    "Google",
    "Fitbit",
    "Garmin",
    "Polar",
    "Oura",
    "Withings",
    "Xiaomi",
    "Huawei",
    "Apple",
    "Strava",
  ],
  ldType: "Article",
};
