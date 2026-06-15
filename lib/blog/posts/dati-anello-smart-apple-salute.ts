import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "dati-anello-smart-apple-salute",
  category: "guides",
  publishedAt: "2026-06-12",
  updatedAt: "2026-06-12",
  readMinutes: 8,
  tldr: {
    it: [
      "FitMesh Sync legge i dati del tuo anello smart o smartwatch Android, li sincronizza sul cloud EU, e li scrive in Apple Salute via HealthKit: così chi ha due telefoni vede tutto in un posto solo.",
      "Il ponte è opt-in: se Apple Salute ha già quei dati (per esempio da Apple Watch), FitMesh non li riscrive. Niente doppioni.",
      "Sonno con fasi complete (profondo, leggero, REM): l'anello è specialista notturno e le fasi vengono scritte in Apple Salute esattamente come le registra il sensore.",
      "Privacy EU/GDPR: tutti i dati transitano su cloud in datacenter EU. FitMesh non vende dati e non li usa per addestrare modelli.",
      "Il bridge funziona in background: nessun export manuale, nessuna app companion del produttore richiesta su iPhone.",
    ],
    en: [
      "FitMesh Sync reads data from your smart ring or Android smartwatch, syncs it to EU cloud, and writes it into Apple Health via HealthKit: so users with two phones see everything in one place.",
      "The bridge is opt-in: if Apple Health already has that data (for example from Apple Watch), FitMesh won't rewrite it. No duplicates.",
      "Sleep with full stages (deep, light, REM): the ring is a nighttime specialist and stages are written to Apple Health exactly as recorded by the sensor.",
      "EU/GDPR privacy: all data transits through EU datacenter cloud. FitMesh doesn't sell data or use it to train models.",
      "The bridge runs in the background: no manual exports, no manufacturer companion app required on iPhone.",
    ],
    es: [
      "FitMesh Sync lee los datos de tu anillo inteligente o smartwatch Android, los sincroniza en la nube EU y los escribe en Apple Salud a través de HealthKit: así, quienes tienen dos teléfonos ven todo en un solo lugar.",
      "El puente es opt-in: si Apple Salud ya tiene esos datos (por ejemplo, de Apple Watch), FitMesh no los vuelve a escribir. Sin duplicados.",
      "Sueño con fases completas (profundo, ligero, REM): el anillo es especialista nocturno y las fases se escriben en Apple Salud exactamente como las registra el sensor.",
      "Privacidad EU/GDPR: todos los datos pasan por la nube en centros de datos de la UE. FitMesh no vende datos ni los usa para entrenar modelos.",
      "El bridge funciona en segundo plano: sin exportaciones manuales, sin necesidad de una app companion del fabricante en iPhone.",
    ],
  },
  primaryKeyword: {
    it: "anello smart dati apple salute",
    en: "smart ring data apple health",
    es: "anillo inteligente datos apple salud",
  },
  secondaryKeywords: {
    it: [
      "scrivere dati wearable android in apple salute",
      "ponte apple salute smartwatch android",
      "anello smart iphone apple health",
      "come portare sonno android su apple salute",
      "fitmesh apple health bridge",
    ],
    en: [
      "write android wearable data to apple health",
      "apple health bridge android smartwatch",
      "smart ring iphone apple health",
      "how to get android sleep data into apple health",
      "fitmesh apple health write bridge",
    ],
  },
  metaDescription: {
    it: "Come FitMesh Sync porta i dati del tuo anello smart o smartwatch Android dentro Apple Salute: bridge opt-in, zero duplicati, sonno con fasi. Privacy EU, GDPR. Guida completa.",
    en: "How FitMesh Sync brings your smart ring or Android smartwatch data into Apple Health: opt-in bridge, zero duplicates, sleep with stages. EU privacy, GDPR. Complete guide.",
    es: "Cómo FitMesh Sync lleva los datos de tu anillo inteligente o smartwatch Android a Apple Salud: puente opt-in, cero duplicados, sueño con fases. Privacidad EU, GDPR. Guía completa.",
  },
  hero: {
    kicker: { it: "Guida d'uso", en: "User guide", es: "Guía de uso" },
    title: {
      it: "I dati del tuo anello smart dentro Apple Salute: come funziona il ponte",
      en: "Your smart ring data inside Apple Health: how the bridge works",
      es: "Los datos de tu anillo inteligente dentro de Apple Salud: cómo funciona el puente",
    },
    subtitle: {
      it: "Se hai un anello smart o un Galaxy Watch accoppiati con Android, i loro dati non arrivano automaticamente in Apple Salute sul tuo iPhone. FitMesh Sync risolve questo con un ponte cloud opt-in: ecco cosa attivare, cosa compare su iPhone, e qualche risposta alle domande più comuni.",
      en: "If you have a smart ring or Galaxy Watch paired with Android, their data doesn't automatically reach Apple Health on your iPhone. FitMesh Sync fixes this with an opt-in cloud bridge: here's what to activate, what shows up on iPhone, and answers to the most common questions.",
      es: "Si tienes un anillo inteligente o un Galaxy Watch vinculados a Android, sus datos no llegan automáticamente a Apple Salud en tu iPhone. FitMesh Sync resuelve esto con un puente en la nube opt-in: aquí tienes qué activar, qué aparece en iPhone y respuestas a las preguntas más frecuentes.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Ho trovato personalmente questo problema fastidioso: Galaxy Watch sul polso, iPhone in tasca, e l'app Salute che mostra solo i dati dell'iPhone. L'anello che porto di notte registra fasi del sonno dettagliate, ma Apple Salute non le vede. Il ponte di scrittura Apple Salute di FitMesh nasce da questa esigenza concreta, non da una feature list.",
        en: "I found this personally annoying: Galaxy Watch on the wrist, iPhone in the pocket, and the Health app only showing iPhone data. The ring I wear at night records detailed sleep stages, but Apple Health doesn't see them. FitMesh's Apple Health write bridge was born from this concrete need, not from a feature checklist.",
        es: "Encontré este problema personalmente frustrante: Galaxy Watch en la muñeca, iPhone en el bolsillo y la app Salud mostrando solo los datos del iPhone. El anillo que llevo de noche registra fases del sueño detalladas, pero Apple Salud no las ve. El puente de escritura de Apple Salud de FitMesh nació de esta necesidad concreta, no de una lista de funciones.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il problema: due ecosistemi che non si parlano",
        en: "The problem: two ecosystems that don't talk to each other",
        es: "El problema: dos ecosistemas que no se comunican",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Android e iOS usano repository di dati salute separati e non interoperabili: Health Connect su Android, HealthKit su iOS. Un Galaxy Watch accoppiato con un telefono Android scrive i dati in Health Connect, non in Apple Health. Un anello Colmi letto via Bluetooth da FitMesh su Android fa lo stesso. Il risultato: se apri l'app Salute sul tuo iPhone, quei dati non ci sono.",
        en: "Android and iOS use separate, non-interoperable health data repositories: Health Connect on Android, HealthKit on iOS. A Galaxy Watch paired with an Android phone writes data to Health Connect, not Apple Health. A Colmi ring read via Bluetooth by FitMesh on Android does the same. Result: if you open the Health app on your iPhone, that data isn't there.",
        es: "Android e iOS utilizan repositorios de datos de salud separados y no interoperables: Health Connect en Android, HealthKit en iOS. Un Galaxy Watch vinculado a un teléfono Android escribe los datos en Health Connect, no en Apple Salud. Un anillo Colmi leído por Bluetooth con FitMesh en Android hace lo mismo. El resultado: si abres la app Salud en tu iPhone, esos datos no están ahí.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Perché non esiste una soluzione nativa",
        en: "Why there's no native solution",
        es: "Por qué no existe una solución nativa",
      },
      body: {
        it: "Apple e Google non hanno costruito un modo diretto per scambiare dati salute tra i due sistemi. FitMesh usa il proprio cloud EU come tramite: legge i dati dal telefono Android e li rende disponibili sull'iPhone. Nessun export manuale, nessuna configurazione complicata.",
        en: "Apple and Google haven't built a direct way to exchange health data between the two systems. FitMesh uses its own EU cloud as a bridge: it reads data from your Android phone and makes it available on iPhone. No manual exports, no complicated setup.",
        es: "Apple y Google no han creado una forma directa de intercambiar datos de salud entre los dos sistemas. FitMesh usa su propia nube EU como intermediario: lee los datos de tu teléfono Android y los pone a disposición en iPhone. Sin exportaciones manuales, sin configuraciones complicadas.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come funziona il ponte: passo dopo passo",
        en: "How the bridge works: step by step",
        es: "Cómo funciona el puente: paso a paso",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Raccolta su Android**: FitMesh Sync legge i dati dal tuo wearable Android (via Health Connect per Galaxy Watch, via Bluetooth per l'anello Colmi) e li carica sul cloud EU.",
          "**Cloud FitMesh EU**: i dati vengono archiviati con timestamp, sorgente, tipo di dato e account utente. Il cloud normalizza i formati tra le diverse sorgenti.",
          "**App iOS attiva**: quando apri FitMesh su iPhone (o l'app è attiva in background), controlla quali dati sono disponibili sul cloud per il tuo account.",
          "**Controllo doppioni**: per ogni dato disponibile, l'app controlla se Apple Salute ha già qualcosa per quella fascia oraria. Se sì, salta. Se no, scrive.",
          "**Scrittura mirata**: scrive su Apple Salute solo i dati mancanti. Se Apple Watch ha già registrato il sonno dalle 23:00 alle 07:00, FitMesh non tocca quelle ore.",
          "**Visibilità immediata**: dopo la scrittura, i dati compaiono nell'app Salute di iPhone come qualsiasi altra voce HealthKit, con la sorgente chiaramente indicata come FitMesh Sync.",
        ],
        en: [
          "**Collection on Android**: FitMesh Sync reads data from your Android wearable (via Health Connect for Galaxy Watch, via Bluetooth for the Colmi ring) and uploads it to EU cloud.",
          "**FitMesh EU cloud**: data is archived with timestamp, source, data type and user account. The cloud normalizes formats across different sources.",
          "**iOS app active**: when you open FitMesh on iPhone (or the app is active in background), it checks what data is available in the cloud for your account.",
          "**Duplicate check**: for each available piece of data, the app checks whether Apple Health already has something for that time slot. If yes, it skips. If no, it writes.",
          "**Targeted writing**: writes to Apple Health only the missing data. If Apple Watch has already recorded sleep from 11pm to 7am, FitMesh doesn't touch those hours.",
          "**Immediate visibility**: after writing, data appears in the iPhone Health app like any other HealthKit entry, with the source clearly shown as FitMesh Sync.",
        ],
        es: [
          "**Recopilación en Android**: FitMesh Sync lee los datos de tu wearable Android (vía Health Connect para Galaxy Watch, vía Bluetooth para el anillo Colmi) y los sube a la nube EU.",
          "**Nube FitMesh EU**: los datos se archivan con marca de tiempo, fuente, tipo de dato y cuenta de usuario. La nube normaliza los formatos entre las distintas fuentes.",
          "**App iOS activa**: cuando abres FitMesh en iPhone (o la app está activa en segundo plano), comprueba qué datos están disponibles en la nube para tu cuenta.",
          "**Verificación de duplicados**: por cada dato disponible, la app comprueba si Apple Salud ya tiene algo para esa franja horaria. Si es así, lo omite. Si no, lo escribe.",
          "**Escritura selectiva**: escribe en Apple Salud solo los datos que faltan. Si Apple Watch ya registró el sueño de las 23:00 a las 07:00, FitMesh no toca esas horas.",
          "**Visibilidad inmediata**: tras la escritura, los datos aparecen en la app Salud del iPhone como cualquier otra entrada de HealthKit, con la fuente claramente indicada como FitMesh Sync.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Zero doppioni: come funziona",
        en: "No duplicates: how it works",
        es: "Cero duplicados: cómo funciona",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Prima di scrivere qualsiasi dato, FitMesh controlla se Apple Salute ha già qualcosa per quella fascia oraria. Se sì, passa oltre. Se no, scrive. In pratica: non ci sono mai due voci per la stessa ora.",
        en: "Before writing any data, FitMesh checks whether Apple Health already has something for that time slot. If yes, it moves on. If no, it writes. In practice: there are never two entries for the same hour.",
        es: "Antes de escribir cualquier dato, FitMesh comprueba si Apple Salud ya tiene algo para esa franja horaria. Si es así, continúa. Si no, escribe. En la práctica: nunca hay dos entradas para la misma hora.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Esempi pratici",
        en: "Practical examples",
        es: "Ejemplos prácticos",
      },
      body: {
        it: "Hai dormito con l'anello Colmi ma non hai indossato Apple Watch? FitMesh scrive le fasi del sonno in Apple Salute. Hai sia Apple Watch che l'anello, e il Watch ha già registrato la notte? FitMesh non tocca nulla. Hai solo l'anello? FitMesh scrive, e se riapri l'app più tardi non duplica.",
        en: "Wore the Colmi ring but not Apple Watch during sleep? FitMesh writes sleep stages into Apple Health. Have both Apple Watch and the ring, and the Watch already recorded the night? FitMesh doesn't touch anything. Ring only? FitMesh writes, and if you reopen the app later it doesn't duplicate.",
        es: "¿Dormiste con el anillo Colmi pero sin Apple Watch? FitMesh escribe las fases del sueño en Apple Salud. ¿Tienes tanto Apple Watch como el anillo, y el Watch ya registró la noche? FitMesh no toca nada. ¿Solo el anillo? FitMesh escribe, y si vuelves a abrir la app más tarde no duplica.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Sonno con fasi: il punto di forza dell'anello",
        en: "Sleep with stages: the ring's strong point",
        es: "Sueño con fases: el punto fuerte del anillo",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Gli anelli smart come il Colmi R02/R03 sono pensati per la notte: misurano sonno, SpO₂, frequenza cardiaca e variabilità mentre dormi, senza il peso di un orologio al polso. Le fasi registrate dall'anello (sonno profondo, leggero, REM, veglia) compaiono in Apple Salute nel grafico Sonno, esattamente come se li avesse registrati Apple Watch.",
        en: "Smart rings like the Colmi R02/R03 are built for nighttime: they measure sleep, SpO₂, heart rate and variability while you sleep, without the bulk of a watch on your wrist. The stages recorded by the ring (deep, light, REM, awake) show up in Apple Health in the Sleep chart, just as if Apple Watch had recorded them.",
        es: "Los anillos inteligentes como el Colmi R02/R03 están diseñados para la noche: miden el sueño, SpO₂, frecuencia cardíaca y variabilidad mientras duermes, sin el volumen de un reloj en la muñeca. Las fases registradas por el anillo (sueño profundo, ligero, REM, vigilia) aparecen en Apple Salud en el gráfico de Sueño, exactamente igual que si las hubiera registrado Apple Watch.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Privacy: dove vanno i dati e chi li vede",
        en: "Privacy: where data goes and who sees it",
        es: "Privacidad: adónde van los datos y quién los ve",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "I dati percorrono solo due passi: dall'app FitMesh su Android al cloud FitMesh (datacenter EU, cifrati), poi dall'app FitMesh su iPhone dentro Apple Salute sul tuo device. FitMesh non vende dati a terzi, non li usa per addestrare modelli, non li condivide con inserzionisti. Il cloud EU garantisce conformità GDPR.",
        en: "Data takes just two steps: from the FitMesh app on Android to the FitMesh cloud (EU datacenter, encrypted), then from the FitMesh app on iPhone into Apple Health on your device. FitMesh doesn't sell data to third parties, doesn't use it to train models, doesn't share it with advertisers. The EU cloud guarantees GDPR compliance.",
        es: "Los datos recorren solo dos pasos: desde la app FitMesh en Android hasta la nube FitMesh (centro de datos EU, cifrados) y luego desde la app FitMesh en iPhone hasta Apple Salud en tu dispositivo. FitMesh no vende datos a terceros, no los usa para entrenar modelos ni los comparte con anunciantes. La nube EU garantiza el cumplimiento del GDPR.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Controllo granulare dei permessi",
        en: "Granular permission control",
        es: "Control granular de permisos",
      },
      body: {
        it: "Apple HealthKit richiede permessi espliciti per ogni tipo di dato: FitMesh chiede solo i permessi necessari per le sorgenti che hai configurato. Puoi vedere e revocare i permessi in qualsiasi momento da iPhone → Impostazioni → Privacy e sicurezza → Salute → FitMesh Sync.",
        en: "Apple HealthKit requires explicit permissions for each data type: FitMesh requests only the permissions needed for the sources you've configured. You can view and revoke permissions at any time from iPhone → Settings → Privacy & Security → Health → FitMesh Sync.",
        es: "Apple HealthKit requiere permisos explícitos para cada tipo de dato: FitMesh solicita solo los permisos necesarios para las fuentes que has configurado. Puedes ver y revocar los permisos en cualquier momento desde iPhone → Ajustes → Privacidad y seguridad → Salud → FitMesh Sync.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come attivare il ponte",
        en: "How to activate the bridge",
        es: "Cómo activar el puente",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Installa FitMesh Sync su iPhone (beta TestFlight ora, App Store imminente).",
          "Accedi con lo stesso account che usi su Android.",
          "Vai in **Impostazioni → Apple Salute → Ponte di scrittura**.",
          "Attiva il toggle e concedi i permessi HealthKit richiesti.",
          "Scegli quali tipi di dato vuoi che il ponte scriva (sonno, passi, frequenza cardiaca, ecc.).",
          "FitMesh sincronizza i dati disponibili e li scrive in Apple Salute nei minuti successivi.",
        ],
        en: [
          "Install FitMesh Sync on iPhone (TestFlight beta now, App Store coming soon).",
          "Sign in with the same account you use on Android.",
          "Go to **Settings → Apple Health → Write Bridge**.",
          "Toggle it on and grant the requested HealthKit permissions.",
          "Choose which data types you want the bridge to write (sleep, steps, heart rate, etc.).",
          "FitMesh syncs available data and writes it to Apple Health within minutes.",
        ],
        es: [
          "Instala FitMesh Sync en iPhone (beta TestFlight ahora, App Store próximamente).",
          "Inicia sesión con la misma cuenta que usas en Android.",
          "Ve a **Ajustes → Apple Salud → Puente de escritura**.",
          "Activa el interruptor y concede los permisos de HealthKit solicitados.",
          "Elige qué tipos de datos quieres que el puente escriba (sueño, pasos, frecuencia cardíaca, etc.).",
          "FitMesh sincroniza los datos disponibles y los escribe en Apple Salud en los minutos siguientes.",
        ],
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
          "Il ponte di scrittura Apple Salute porta i dati dei device Android (smartwatch, anelli smart) dentro HealthKit su iPhone via cloud FitMesh EU.",
          "Controlla prima se Apple Salute ha già quei dati. Scrive solo dove manca qualcosa. Niente doppioni.",
          "Sonno con fasi complete (profondo, leggero, REM): le fasi dell'anello appaiono in Apple Salute nello stesso formato di Apple Watch.",
          "Opt-in, granulare, revocabile: si attiva dalle impostazioni FitMesh iOS e si disattiva in qualsiasi momento. I permessi HealthKit sono gestiti da iPhone Impostazioni.",
          "Privacy EU/GDPR: cloud in datacenter EU, cifrato, nessuna vendita o condivisione di dati con terzi.",
        ],
        en: [
          "The Apple Health write bridge brings Android device data (smartwatches, smart rings) into HealthKit on iPhone via FitMesh EU cloud.",
          "Checks first whether Apple Health already has that data. Writes only where something is missing. No duplicates.",
          "Sleep with full stages (deep, light, REM): ring stages appear in Apple Health in the same format as Apple Watch.",
          "Opt-in, granular, revocable: activated from FitMesh iOS settings and turned off at any time. HealthKit permissions are managed from iPhone Settings.",
          "EU/GDPR privacy: EU datacenter cloud, encrypted, no data sales or third-party sharing.",
        ],
        es: [
          "El puente de escritura de Apple Salud lleva los datos de dispositivos Android (smartwatches, anillos inteligentes) a HealthKit en iPhone a través de la nube FitMesh EU.",
          "Comprueba primero si Apple Salud ya tiene esos datos. Escribe solo donde falta algo. Sin duplicados.",
          "Sueño con fases completas (profundo, ligero, REM): las fases del anillo aparecen en Apple Salud en el mismo formato que Apple Watch.",
          "Opt-in, granular, revocable: se activa desde los ajustes de FitMesh iOS y se desactiva en cualquier momento. Los permisos de HealthKit se gestionan desde Ajustes de iPhone.",
          "Privacidad EU/GDPR: nube en centro de datos EU, cifrada, sin venta ni cesión de datos a terceros.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Prova il ponte Apple Salute in beta",
        en: "Try the Apple Health bridge in beta",
        es: "Prueba el puente de Apple Salud en beta",
      },
      body: {
        it: "FitMesh iOS è in beta TestFlight ora. Iscriviti per provare il ponte di scrittura Apple Salute e portare i dati del tuo wearable Android dentro l'app Salute di iPhone.",
        en: "FitMesh iOS is in TestFlight beta now. Sign up to try the Apple Health write bridge and bring your Android wearable data into the iPhone Health app.",
        es: "FitMesh iOS está en beta TestFlight ahora. Regístrate para probar el puente de escritura de Apple Salud y llevar los datos de tu wearable Android a la app Salud de iPhone.",
      },
      ctaLabel: {
        it: "Entra in beta iOS →",
        en: "Join iOS beta →",
        es: "Únete a la beta iOS →",
      },
      ctaHref: {
        it: "/it/beta",
        en: "/en/beta",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Il ponte sovrascrive i dati già in Apple Salute?",
        en: "Does the bridge overwrite data already in Apple Health?",
        es: "¿El puente sobreescribe los datos que ya están en Apple Salud?",
      },
      a: {
        it: "No. FitMesh controlla prima se Apple Salute ha già qualcosa per quella fascia oraria. Se c'è già un dato (di Apple Watch o di qualsiasi altra app), FitMesh non lo tocca. Non sovrascrive mai i dati esistenti.",
        en: "No. FitMesh checks first whether Apple Health already has something for that time slot. If there's already data there (from Apple Watch or any other app), FitMesh doesn't touch it. It never overwrites existing data.",
        es: "No. FitMesh comprueba primero si Apple Salud ya tiene algo para esa franja horaria. Si ya hay un dato (de Apple Watch o de cualquier otra app), FitMesh no lo toca. Nunca sobreescribe los datos existentes.",
      },
    },
    {
      q: {
        it: "Quali tipi di dato vengono scritti in Apple Salute?",
        en: "Which data types get written to Apple Health?",
        es: "¿Qué tipos de datos se escriben en Apple Salud?",
      },
      a: {
        it: "Dipende dalle sorgenti che hai collegato su Android e dai permessi che hai concesso. I tipi supportati oggi includono: sonno con fasi (profondo, leggero, REM, veglia), passi, frequenza cardiaca (campioni), calorie attive, distanza. Puoi scegliere granularmente quali tipi attivare per il bridge nelle impostazioni FitMesh iOS.",
        en: "Depends on the sources you've connected on Android and the permissions you've granted. Supported types today include: sleep with stages (deep, light, REM, awake), steps, heart rate (samples), active calories, distance. You can choose granularly which types to enable for the bridge in FitMesh iOS settings.",
        es: "Depende de las fuentes que hayas conectado en Android y de los permisos que hayas concedido. Los tipos compatibles actualmente incluyen: sueño con fases (profundo, ligero, REM, vigilia), pasos, frecuencia cardíaca (muestras), calorías activas, distancia. Puedes elegir de forma granular qué tipos activar para el puente en los ajustes de FitMesh iOS.",
      },
    },
    {
      q: {
        it: "Funziona anche se non ho un anello smart Colmi?",
        en: "Does it work even if I don't have a Colmi smart ring?",
        es: "¿Funciona aunque no tenga un anillo inteligente Colmi?",
      },
      a: {
        it: "Sì. Il ponte funziona con qualsiasi device collegato al tuo account FitMesh su Android: Galaxy Watch, Wear OS, qualsiasi wearable che scrive su Health Connect. L'anello Colmi è un esempio di device particolarmente utile per il ponte perché è specializzato nel sonno notturno, ma non è l'unico compatibile.",
        en: "Yes. The bridge works with any device connected to your FitMesh account on Android: Galaxy Watch, Wear OS, any wearable writing to Health Connect. The Colmi ring is an example of a device particularly useful for the bridge because it specializes in nighttime sleep, but it's not the only compatible one.",
        es: "Sí. El puente funciona con cualquier dispositivo conectado a tu cuenta FitMesh en Android: Galaxy Watch, Wear OS, cualquier wearable que escriba en Health Connect. El anillo Colmi es un ejemplo de dispositivo especialmente útil para el puente porque está especializado en el sueño nocturno, pero no es el único compatible.",
      },
    },
    {
      q: {
        it: "I dati vengono aggiornati in tempo reale?",
        en: "Is data updated in real time?",
        es: "¿Los datos se actualizan en tiempo real?",
      },
      a: {
        it: "Il percorso è: il telefono Android sincronizza i dati sul cloud FitMesh (ogni pochi minuti), poi l'app iPhone li scrive in Apple Salute alla prossima apertura o in background. Non è real-time istantaneo, ma è automatico: senza alcun export manuale, i dati della notte precedente sono in Apple Salute entro pochi minuti dall'apertura dell'app al mattino.",
        en: "The path is: the Android phone syncs data to the FitMesh cloud (every few minutes), then the iPhone app writes it to Apple Health the next time it opens or runs in background. It's not instant real-time, but it's automatic: with no manual export, the previous night's data is in Apple Health within minutes of opening the app in the morning.",
        es: "El recorrido es: el teléfono Android sincroniza los datos en la nube FitMesh (cada pocos minutos) y luego la app de iPhone los escribe en Apple Salud la próxima vez que se abre o en segundo plano. No es tiempo real instantáneo, pero es automático: sin ninguna exportación manual, los datos de la noche anterior están en Apple Salud pocos minutos después de abrir la app por la mañana.",
      },
    },
    {
      q: {
        it: "Come vengono mostrati i dati in Apple Salute?",
        en: "How is the data shown in Apple Health?",
        es: "¿Cómo se muestran los datos en Apple Salud?",
      },
      a: {
        it: "I dati scritti dal ponte appaiono nell'app Salute esattamente come qualsiasi altra voce HealthKit: con timestamp, tipo di dato, e sorgente. La sorgente indicata è 'FitMesh Sync'. Puoi vederli nel grafico Sonno, nel Riepilogo, e nelle singole categorie (Passi, Frequenza cardiaca, ecc.). Puoi anche rimuoverli da Apple Salute in qualsiasi momento se decidi di disattivare il bridge.",
        en: "Data written by the bridge appears in the Health app exactly like any other HealthKit entry: with timestamp, data type, and source. The source listed is 'FitMesh Sync'. You can see them in the Sleep chart, in Summary, and in individual categories (Steps, Heart Rate, etc.). You can also remove them from Apple Health at any time if you decide to turn off the bridge.",
        es: "Los datos escritos por el puente aparecen en la app Salud exactamente como cualquier otra entrada de HealthKit: con marca de tiempo, tipo de dato y fuente. La fuente indicada es 'FitMesh Sync'. Puedes verlos en el gráfico de Sueño, en el Resumen y en las categorías individuales (Pasos, Frecuencia cardíaca, etc.). También puedes eliminarlos de Apple Salud en cualquier momento si decides desactivar el puente.",
      },
    },
  ],
  related: [
    "fitmesh-arriva-su-iphone",
    "colmi-ring-fitmesh",
    "come-funziona-health-connect",
    "gdpr-dati-fitness-smartwatch",
  ],
  brandsMentioned: ["Apple", "Samsung"],
  ldType: "BlogPosting",
};
