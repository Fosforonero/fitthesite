import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "google-fit-cierra-alternativas-health-connect",
  category: "guides",
  publishedAt: "2026-06-16",
  updatedAt: "2026-06-16",
  readMinutes: 8,
  ldType: "BlogPosting",
  primaryKeyword: {
    it: "Google Fit chiude alternativa",
    en: "Google Fit shutting down alternative",
    es: "Google Fit cierra alternativa",
  },
  secondaryKeywords: {
    it: [
      "Google Fit dismesso 2026",
      "alternativa Google Fit Android",
      "Health Connect migrazione",
      "wearable Android dati salute",
      "come migrare da Google Fit",
    ],
    en: [
      "Google Fit deprecated 2026",
      "Google Fit alternative Android",
      "Health Connect migration",
      "Android wearable health data",
      "how to migrate from Google Fit",
    ],
  },
  metaDescription: {
    it: "Google Fit sta chiudendo le sue API nel 2026: cosa cambia per chi usa wearable Android, perché Health Connect è il successore ufficiale, e come FitMesh Sync aiuta a unire tutti i dispositivi in un unico pannello.",
    en: "Google Fit is shutting down its APIs in 2026: what changes for Android wearable users, why Health Connect is the official successor, and how FitMesh Sync helps unite all devices in one unified dashboard.",
    es: "Google Fit cierra sus API en 2026: qué cambia para los usuarios de wearables Android, por qué Health Connect es el sucesor oficial y cómo FitMesh Sync ayuda a unir todos los dispositivos en un panel único.",
  },
  hero: {
    kicker: {
      it: "Guida",
      en: "Guide",
      es: "Guía",
    },
    title: {
      it: "Google Fit chiude: le alternative e come passare a Health Connect",
      en: "Google Fit shutting down: alternatives and how to switch to Health Connect",
      es: "Google Fit cierra: alternativas y cómo pasarte a Health Connect",
    },
    subtitle: {
      it: "Google sta dismettendo le API di Google Fit nel 2026. Se usi un wearable Android, ecco cosa succede ai tuoi dati, perché Health Connect è il successore ufficiale, e come tenere tutto sotto controllo senza perdere nulla.",
      en: "Google is deprecating the Google Fit APIs in 2026. If you use an Android wearable, here's what happens to your data, why Health Connect is the official successor, and how to keep everything under control without losing anything.",
      es: "Google está retirando las API de Google Fit en 2026. Si usas un wearable Android, aquí explicamos qué pasa con tus datos, por qué Health Connect es el sucesor oficial y cómo mantener todo bajo control sin perder nada.",
    },
  },
  tldr: {
    it: [
      "Google ha annunciato la dismissione delle API di Google Fit: le app che le usano devono migrare su Health Connect entro il 2026.",
      "I dati storici in Google Fit non migrano automaticamente su Health Connect: devi esportarli manualmente tramite Google Takeout.",
      "Health Connect è il nuovo standard Android per i dati salute: è locale, on-device, con permessi granulari per tipo di dato.",
      "Se usi più wearable (Galaxy Watch, anello smart, Fitbit), FitMesh Sync unisce i dati in un unico pannello senza duplicati.",
      "Su iPhone la situazione non cambia: lì vale Apple Health. FitMesh Sync per iOS è in arrivo.",
    ],
    en: [
      "Google has announced the deprecation of Google Fit APIs: apps using them must migrate to Health Connect by 2026.",
      "Historical data in Google Fit doesn't automatically migrate to Health Connect: you need to export it manually via Google Takeout.",
      "Health Connect is the new Android standard for health data: local, on-device, with granular permissions per data type.",
      "If you use multiple wearables (Galaxy Watch, smart ring, Fitbit), FitMesh Sync unifies data in one dashboard without duplicates.",
      "On iPhone nothing changes: Apple Health applies there. FitMesh Sync for iOS is coming soon.",
    ],
    es: [
      "Google ha anunciado el cierre de las API de Google Fit: las aplicaciones que las usan deben migrar a Health Connect antes de finales de 2026.",
      "Los datos históricos en Google Fit no se migran automáticamente a Health Connect: tienes que exportarlos manualmente con Google Takeout.",
      "Health Connect es el nuevo estándar Android para datos de salud: local, en el dispositivo, con permisos detallados por tipo de dato.",
      "Si usas varios wearables (Galaxy Watch, anillo inteligente, Fitbit), FitMesh Sync unifica los datos en un único panel sin duplicados.",
      "En iPhone la situación no cambia: allí aplica Apple Health. FitMesh Sync para iOS llega próximamente.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Google Fit è stato per anni il punto di riferimento per i dati di salute su Android. Molte app di terze parti lo usavano come canale per leggere e scrivere passi, frequenza cardiaca e allenamenti. Ma nel 2026 le sue API vengono dismesse ufficialmente: Google ha chiesto a tutti gli sviluppatori di migrare su Health Connect, il nuovo standard per i dati salute su Android. Se non hai ancora sentito parlare di questo cambiamento, questo articolo spiega cosa significa concretamente per te.",
        en: "Google Fit has been the reference point for health data on Android for years. Many third-party apps used it as a channel to read and write steps, heart rate, and workouts. But in 2026 its APIs are officially deprecated: Google has asked all developers to migrate to Health Connect, the new standard for health data on Android. If you haven't heard about this change yet, this article explains what it means concretely for you.",
        es: "Google Fit ha sido durante años el punto de referencia para los datos de salud en Android. Muchas aplicaciones de terceros lo usaban como canal para leer y escribir pasos, frecuencia cardíaca y entrenamientos. Pero en 2026 sus API se retiran oficialmente: Google ha pedido a todos los desarrolladores que migren a Health Connect, el nuevo estándar para datos de salud en Android. Si todavía no has oído hablar de este cambio, este artículo explica qué significa para ti.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa sta succedendo con Google Fit",
        en: "What is happening with Google Fit",
        es: "Qué está pasando con Google Fit",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Google ha comunicato la dismissione delle REST API di Google Fit per il 2026. Questo significa che le app che usano quelle API per accedere ai tuoi dati di attività smetteranno di funzionare correttamente, a meno che i loro sviluppatori non abbiano già migrato verso Health Connect. L'app Google Fit continua a esistere ma non riceve nuove funzionalità da tempo, e la roadmap ufficiale la posiziona come legacy.",
        en: "Google has announced the deprecation of the Google Fit REST APIs for 2026. This means apps that use those APIs to access your activity data will stop working correctly, unless their developers have already migrated to Health Connect. The Google Fit app continues to exist but hasn't received new features for a while, and the official roadmap positions it as legacy.",
        es: "Google ha comunicado el cierre de las API REST de Google Fit para 2026. Esto significa que las aplicaciones que usan esas API para acceder a tus datos de actividad dejarán de funcionar correctamente, a menos que sus desarrolladores ya hayan migrado a Health Connect. La aplicación Google Fit sigue existiendo pero no recibe nuevas funciones desde hace tiempo, y la hoja de ruta oficial la posiciona como tecnología heredada.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Cosa rimane e cosa sparisce",
        en: "What remains and what disappears",
        es: "Qué permanece y qué desaparece",
      },
      body: {
        it: "Le API REST di Google Fit vengono dismesse: quelle usate da app web e da molte app Android di terze parti. L'app Google Fit sul tuo telefono potrebbe restare installabile per un po', ma non sarà più aggiornata e perderà integrazioni nel tempo. I dati che hai accumulato in Google Fit negli anni sono ancora accessibili via Google Takeout, ma non fluiranno automaticamente su Health Connect.",
        en: "The Google Fit REST APIs are being deprecated: those used by web apps and many Android third-party apps. The Google Fit app on your phone might remain installable for a while, but it won't receive updates and will lose integrations over time. Data you've accumulated in Google Fit over the years is still accessible via Google Takeout, but won't automatically flow to Health Connect.",
        es: "Las API REST de Google Fit se retiran: las que usan aplicaciones web y muchas apps de Android de terceros. La aplicación Google Fit en tu teléfono puede seguir instalable por un tiempo, pero no recibirá actualizaciones y perderá integraciones con el tiempo. Los datos que has acumulado en Google Fit durante años siguen accesibles a través de Google Takeout, pero no fluirán automáticamente a Health Connect.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cos'è Health Connect e perché è diverso da Google Fit",
        en: "What is Health Connect and why it's different from Google Fit",
        es: "Qué es Health Connect y por qué es diferente de Google Fit",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Health Connect non è Google Fit con un nuovo nome. È un'architettura completamente diversa. Google Fit era principalmente un servizio cloud: i tuoi dati venivano inviati ai server Google e le app li leggevano da lì. Health Connect è on-device: i dati restano sul tuo telefono in un database locale, e ogni app deve chiederti esplicitamente il permesso per accedere a ogni singolo tipo di dato.",
        en: "Health Connect is not Google Fit with a new name. It's a completely different architecture. Google Fit was primarily a cloud service: your data was sent to Google's servers and apps read from there. Health Connect is on-device: data stays on your phone in a local database, and every app must explicitly ask your permission to access each individual data type.",
        es: "Health Connect no es Google Fit con un nombre nuevo. Es una arquitectura completamente diferente. Google Fit era principalmente un servicio en la nube: tus datos se enviaban a los servidores de Google y las aplicaciones los leían desde allí. Health Connect es local, en el dispositivo: los datos permanecen en tu teléfono en una base de datos local, y cada aplicación debe pedirte permiso explícito para acceder a cada tipo de dato.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Privacy più forte**: i dati non escono dal dispositivo per via di Health Connect stesso. Il rischio viene dalle singole app che leggono da HC e potrebbero sincronizzarle sul loro cloud.",
          "**Permessi granulari**: puoi autorizzare un'app a leggere i passi senza darle accesso al sonno o alla frequenza cardiaca.",
          "**Più brand supportati**: Samsung Health, Fitbit, Polar e altre app companion scrivono su Health Connect, quindi un'unica app terza può leggere dati da tutti.",
          "**Nessun cloud obbligatorio**: a differenza di Google Fit, non devi avere un account Google attivo per far funzionare Health Connect.",
        ],
        en: [
          "**Stronger privacy**: data doesn't leave the device via Health Connect itself. The risk comes from individual apps that read from HC and might sync to their own cloud.",
          "**Granular permissions**: you can authorize an app to read steps without giving it access to sleep or heart rate.",
          "**More brands supported**: Samsung Health, Fitbit, Polar, and other companion apps write to Health Connect, so a single third-party app can read data from all of them.",
          "**No mandatory cloud**: unlike Google Fit, you don't need an active Google account for Health Connect to work.",
        ],
        es: [
          "**Mayor privacidad**: los datos no salen del dispositivo a través de Health Connect en sí. El riesgo proviene de aplicaciones individuales que leen de HC y pueden sincronizarlos con su propia nube.",
          "**Permisos detallados**: puedes autorizar a una aplicación a leer pasos sin darle acceso al sueño o la frecuencia cardíaca.",
          "**Más marcas compatibles**: Samsung Health, Fitbit, Polar y otras apps complementarias escriben en Health Connect, así que una sola app de terceros puede leer datos de todas ellas.",
          "**Sin nube obligatoria**: a diferencia de Google Fit, no necesitas una cuenta de Google activa para que Health Connect funcione.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come migrare i tuoi dati da Google Fit",
        en: "How to migrate your data from Google Fit",
        es: "Cómo migrar tus datos de Google Fit",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La migrazione non è automatica: i dati storici in Google Fit non fluiscono su Health Connect da soli. Ecco cosa puoi fare concretamente.",
        en: "Migration is not automatic: historical data in Google Fit doesn't flow to Health Connect on its own. Here's what you can do concretely.",
        es: "La migración no es automática: los datos históricos en Google Fit no fluyen solos a Health Connect. Esto es lo que puedes hacer.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Esporta i tuoi dati con Google Takeout**: vai su takeout.google.com, seleziona solo 'Fit', scarica l'archivio. Otterrai file JSON e TCX con tutta la tua cronologia.",
          "**Installa Health Connect**: su Android 14 e successivi è preinstallato come app di sistema. Su Android 12-13 cercalo nel Play Store.",
          "**Configura i permessi**: apri Health Connect → Autorizzazioni app e autorizza le tue app (Samsung Health, Fitbit, etc.) a scrivere sui tipi di dato che ti interessano.",
          "**Verifica che il tuo wearable scriva su Health Connect**: la maggior parte delle app companion principali (Samsung Health, Fitbit, Wear OS) supporta già Health Connect. Controlla nelle impostazioni dell'app companion che la sincronizzazione con Health Connect sia attiva.",
          "**Considera un'app di aggregazione**: se hai più wearable o vuoi vedere tutto in un unico posto, un'app come FitMesh Sync legge da Health Connect e mostra tutti i dati in un pannello unificato.",
        ],
        en: [
          "**Export your data with Google Takeout**: go to takeout.google.com, select only 'Fit', download the archive. You'll get JSON and TCX files with your entire history.",
          "**Install Health Connect**: on Android 14 and later it's preinstalled as a system app. On Android 12-13 search for it on the Play Store.",
          "**Configure permissions**: open Health Connect → App permissions and authorize your apps (Samsung Health, Fitbit, etc.) to write the data types you care about.",
          "**Verify your wearable writes to Health Connect**: most major companion apps (Samsung Health, Fitbit, Wear OS) already support Health Connect. Check in the companion app settings that sync with Health Connect is enabled.",
          "**Consider an aggregation app**: if you have multiple wearables or want to see everything in one place, an app like FitMesh Sync reads from Health Connect and shows all data in a unified panel.",
        ],
        es: [
          "**Exporta tus datos con Google Takeout**: ve a takeout.google.com, selecciona solo 'Fit', descarga el archivo. Obtendrás archivos JSON y TCX con todo tu historial.",
          "**Instala Health Connect**: en Android 14 y versiones posteriores está preinstalado como aplicación del sistema. En Android 12-13 búscalo en Google Play.",
          "**Configura los permisos**: abre Health Connect, ve a Permisos de aplicaciones y autoriza tus aplicaciones (Samsung Health, Fitbit, etc.) a escribir los tipos de datos que te interesan.",
          "**Verifica que tu wearable escriba en Health Connect**: la mayoría de las apps complementarias principales (Samsung Health, Fitbit, Wear OS) ya son compatibles con Health Connect. Comprueba en los ajustes de la app complementaria que la sincronización con Health Connect esté activada.",
          "**Considera una app de agregación**: si tienes varios wearables o quieres ver todo en un solo lugar, una app como FitMesh Sync lee de Health Connect y muestra todos los datos en un panel unificado.",
        ],
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: {
        it: "I dati storici non si recuperano automaticamente",
        en: "Historical data is not automatically recovered",
        es: "Los datos históricos no se recuperan automáticamente",
      },
      body: {
        it: "Health Connect non sincronizza retroattivamente. Anche se esporti i tuoi dati da Google Fit, importarli su Health Connect richiede strumenti dedicati che non sempre esistono per tutti i formati. La cronologia che hai su Google Fit è conservata nel Takeout, ma potrebbe non essere accessibile nelle stesse app che usi oggi. L'importante è capire che da oggi in poi la fonte di verità è Health Connect: assicurati che i tuoi dispositivi ci scrivano correttamente.",
        en: "Health Connect doesn't sync retroactively. Even if you export your data from Google Fit, importing it to Health Connect requires dedicated tools that don't always exist for all formats. The history you have in Google Fit is preserved in Takeout, but may not be accessible in the same apps you use today. The important thing is to understand that from now on the source of truth is Health Connect: make sure your devices write to it correctly.",
        es: "Health Connect no sincroniza de forma retroactiva. Aunque exportes tus datos de Google Fit, importarlos a Health Connect requiere herramientas específicas que no siempre existen para todos los formatos. El historial que tienes en Google Fit está guardado en Takeout, pero puede que no sea accesible en las mismas aplicaciones que usas hoy. Lo importante es entender que a partir de ahora la fuente de verdad es Health Connect: asegúrate de que tus dispositivos escriban en él correctamente.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa cambia per chi usa più wearable",
        en: "What changes for people using multiple wearables",
        es: "Qué cambia para quienes usan varios wearables",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se usi un Galaxy Watch, un anello smart e magari un vecchio Fitbit in parallelo, uno dei problemi classici era avere i dati sparpagliati in app diverse senza un punto di vista unificato. Google Fit cercava di risolvere questo problema aggregando i dati, ma con Health Connect la situazione è diversa: il database è locale e toccherà alle app di terze parti fare l'aggregazione.",
        en: "If you use a Galaxy Watch, a smart ring, and maybe an old Fitbit in parallel, one of the classic problems was having data scattered across different apps without a unified view. Google Fit tried to solve this by aggregating data, but with Health Connect the situation is different: the database is local and it will be up to third-party apps to do the aggregation.",
        es: "Si usas un Galaxy Watch, un anillo inteligente y quizá un Fitbit antiguo a la vez, uno de los problemas clásicos era tener los datos repartidos en distintas aplicaciones sin una vista unificada. Google Fit intentaba resolver esto agregando los datos, pero con Health Connect la situación es diferente: la base de datos es local y serán las aplicaciones de terceros las que tengan que hacer la agregación.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il rischio principale con più wearable è il conteggio doppio: se sia il Galaxy Watch che l'anello inviano i passi su Health Connect per la stessa ora, un'app che li somma entrambi ti darà un totale gonfiato. Un'app di aggregazione ben fatta deve riconoscere questo problema e mostrare i dati deduplicati, indicando per ogni metrica da quale dispositivo proviene il dato.",
        en: "The main risk with multiple wearables is double counting: if both the Galaxy Watch and the ring send steps to Health Connect for the same hour, an app that sums them both will give you an inflated total. A well-made aggregation app must recognize this problem and show deduplicated data, indicating for each metric which device the reading comes from.",
        es: "El principal riesgo con varios wearables es el doble conteo: si tanto el Galaxy Watch como el anillo envían pasos a Health Connect para la misma hora, una app que los sume dará un total inflado. Una app de agregación bien hecha debe reconocer este problema y mostrar datos sin duplicados, indicando para cada métrica de qué dispositivo proviene el dato.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come FitMesh Sync aiuta in questa transizione",
        en: "How FitMesh Sync helps in this transition",
        es: "Cómo ayuda FitMesh Sync en esta transición",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync nasce esattamente per questo scenario: wearable multipli, dati frammentati, nessuna dashboard che li metta insieme in modo pulito. L'app legge da Health Connect e mostra i tuoi dati in un pannello web accessibile da browser, risolvendo i problemi più comuni di chi usa più dispositivi.",
        en: "FitMesh Sync was built exactly for this scenario: multiple wearables, fragmented data, no dashboard that puts it all together cleanly. The app reads from Health Connect and shows your data in a web panel accessible from browser, solving the most common problems for people using multiple devices.",
        es: "FitMesh Sync nació exactamente para este escenario: varios wearables, datos fragmentados, ningún panel que los unifique de forma clara. La app lee de Health Connect y muestra tus datos en un panel web accesible desde el navegador, resolviendo los problemas más comunes de quienes usan varios dispositivos.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Niente doppioni**: quando più dispositivi registrano la stessa metrica nella stessa finestra temporale, FitMesh Sync deduplica i dati e mostra il valore più attendibile, con indicazione della fonte.",
          "**Fonte del dato visibile**: per ogni metrica vedi da quale dispositivo proviene la lettura (Galaxy Watch, anello Colmi, Fitbit, etc.).",
          "**Dati su server europei**: i dati sincronizzati restano in infrastruttura europea, coerente con i requisiti GDPR.",
          "**Android disponibile, iPhone in arrivo**: FitMesh Sync per Android è su Google Play. Il supporto per iPhone (con Apple Health al posto di Health Connect) è in sviluppo.",
        ],
        en: [
          "**No duplicates**: when multiple devices record the same metric in the same time window, FitMesh Sync deduplicates the data and shows the most reliable value, with source indication.",
          "**Data source visible**: for each metric you can see which device the reading came from (Galaxy Watch, Colmi ring, Fitbit, etc.).",
          "**Data on European servers**: synced data stays on European infrastructure, consistent with GDPR requirements.",
          "**Android available, iPhone coming**: FitMesh Sync for Android is on Google Play. iPhone support (with Apple Health instead of Health Connect) is in development.",
        ],
        es: [
          "**Sin duplicados**: cuando varios dispositivos registran la misma métrica en la misma ventana de tiempo, FitMesh Sync deduplica los datos y muestra el valor más fiable, con indicación de la fuente.",
          "**Fuente del dato visible**: para cada métrica puedes ver de qué dispositivo proviene la lectura (Galaxy Watch, anillo Colmi, Fitbit, etc.).",
          "**Datos en servidores europeos**: los datos sincronizados permanecen en infraestructura europea, coherente con los requisitos del RGPD.",
          "**Android disponible, iPhone próximamente**: FitMesh Sync para Android está en Google Play. El soporte para iPhone (con Apple Health en lugar de Health Connect) está en desarrollo.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Prova FitMesh Sync su Android",
        en: "Try FitMesh Sync on Android",
        es: "Prueba FitMesh Sync en Android",
      },
      body: {
        it: "FitMesh Sync legge i tuoi dati da Health Connect e li mostra in un pannello web unificato. Niente doppioni, fonte del dato visibile, server europei. Disponibile su Google Play, accesso beta aperto.",
        en: "FitMesh Sync reads your data from Health Connect and shows it in a unified web panel. No duplicates, data source visible, European servers. Available on Google Play, open beta access.",
        es: "FitMesh Sync lee tus datos de Health Connect y los muestra en un panel web unificado. Sin duplicados, fuente del dato visible, servidores europeos. Disponible en Google Play, acceso beta abierto.",
      },
      ctaLabel: {
        it: "Scarica su Google Play →",
        en: "Download on Google Play →",
        es: "Descarga en Google Play →",
      },
      ctaHref: {
        it: "/it/beta",
        en: "/en/beta",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "E su iPhone? La situazione è diversa",
        en: "What about iPhone? The situation is different",
        es: "Y en iPhone, ¿cómo está la situación?",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La dismissione di Google Fit riguarda solo l'ecosistema Android. Su iPhone il sistema di riferimento per i dati salute è Apple Health (basato su HealthKit), che non è coinvolto in questo cambiamento. Se usi un Apple Watch o altri wearable iOS, i tuoi dati continuano a fluire su Apple Health come sempre.",
        en: "The Google Fit deprecation only affects the Android ecosystem. On iPhone the reference system for health data is Apple Health (based on HealthKit), which is not involved in this change. If you use an Apple Watch or other iOS wearables, your data continues to flow to Apple Health as always.",
        es: "El cierre de Google Fit afecta solo al ecosistema Android. En iPhone el sistema de referencia para los datos de salud es Apple Health (basado en HealthKit), que no está involucrado en este cambio. Si usas un Apple Watch u otros wearables iOS, tus datos siguen fluyendo a Apple Health como siempre.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync è attualmente disponibile per Android e usa Health Connect come fonte dei dati. Il supporto per iPhone, con Apple Health come fonte, è in sviluppo. Se sei su iPhone e vuoi essere avvisato quando arriva, puoi iscriverti alla lista beta dalla pagina dedicata.",
        en: "FitMesh Sync is currently available for Android and uses Health Connect as the data source. iPhone support, with Apple Health as the source, is in development. If you're on iPhone and want to be notified when it arrives, you can sign up for the beta list from the dedicated page.",
        es: "FitMesh Sync está disponible actualmente para Android y usa Health Connect como fuente de datos. El soporte para iPhone, con Apple Health como fuente, está en desarrollo. Si tienes iPhone y quieres que te avisemos cuando llegue, puedes apuntarte a la lista beta desde la página correspondiente.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "In sintesi: cosa fare adesso",
        en: "In summary: what to do now",
        es: "En resumen: qué hacer ahora",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Esporta i dati storici da Google Fit via Google Takeout prima che il servizio diventi meno accessibile.",
          "Verifica che le app che usi abbiano già migrato su Health Connect (la maggior parte delle app attive lo ha fatto).",
          "Controlla in Health Connect → Autorizzazioni app che le tue app companion (Samsung Health, Fitbit, etc.) siano autorizzate a scrivere i tipi di dato che ti interessano.",
          "Se usi più wearable, considera un'app di aggregazione che gestisca i duplicati e mostri la fonte del dato per ogni metrica.",
          "Se sei su Android e vuoi iniziare subito, FitMesh Sync è su Google Play con accesso beta aperto.",
        ],
        en: [
          "Export historical data from Google Fit via Google Takeout before the service becomes less accessible.",
          "Verify that the apps you use have already migrated to Health Connect (most active apps have done so).",
          "Check in Health Connect → App permissions that your companion apps (Samsung Health, Fitbit, etc.) are authorized to write the data types you care about.",
          "If you use multiple wearables, consider an aggregation app that handles duplicates and shows the data source for each metric.",
          "If you're on Android and want to start right away, FitMesh Sync is on Google Play with open beta access.",
        ],
        es: [
          "Exporta los datos históricos de Google Fit con Google Takeout antes de que el servicio sea menos accesible.",
          "Verifica que las aplicaciones que usas ya hayan migrado a Health Connect (la mayoría de las apps activas lo han hecho).",
          "Comprueba en Health Connect, en Permisos de aplicaciones, que tus apps complementarias (Samsung Health, Fitbit, etc.) tengan autorización para escribir los tipos de datos que te interesan.",
          "Si usas varios wearables, considera una app de agregación que gestione los duplicados y muestre la fuente del dato para cada métrica.",
          "Si tienes Android y quieres empezar ya, FitMesh Sync está en Google Play con acceso beta abierto.",
        ],
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Google Fit chiude definitivamente nel 2026?",
        en: "Is Google Fit shutting down completely in 2026?",
        es: "¿Google Fit cierra definitivamente en 2026?",
      },
      a: {
        it: "Le API REST di Google Fit vengono dismesse nel 2026: questo colpisce le app che usavano quelle API per leggere e scrivere dati salute. L'app Google Fit potrebbe restare installabile per un periodo, ma senza aggiornamenti né nuove integrazioni è destinata a diventare inutilizzabile nel tempo. Il successore ufficiale per Android è Health Connect.",
        en: "The Google Fit REST APIs are being deprecated in 2026: this affects apps that used those APIs to read and write health data. The Google Fit app may remain installable for a period, but without updates or new integrations it is destined to become unusable over time. The official successor for Android is Health Connect.",
        es: "Las API REST de Google Fit se retiran en 2026: esto afecta a las aplicaciones que usaban esas API para leer y escribir datos de salud. La app Google Fit puede seguir instalable durante un tiempo, pero sin actualizaciones ni nuevas integraciones terminará siendo inutilizable. El sucesor oficial para Android es Health Connect.",
      },
    },
    {
      q: {
        it: "I miei dati di Google Fit si perdono con la chiusura?",
        en: "Will my Google Fit data be lost when it shuts down?",
        es: "¿Perderé mis datos de Google Fit cuando cierre?",
      },
      a: {
        it: "I dati storici non si perdono se li esporti in tempo. Tramite Google Takeout puoi scaricare tutta la tua cronologia in formato JSON e TCX. Questi file rimarranno sul tuo dispositivo. Importarli su Health Connect o su altre piattaforme richiede però strumenti dedicati che non esistono per tutti i formati. Il consiglio pratico è: esporta ora e conserva il backup, anche se non sai ancora dove usarlo.",
        en: "Historical data won't be lost if you export it in time. Through Google Takeout you can download your entire history in JSON and TCX format. These files will remain on your device. Importing them to Health Connect or other platforms requires dedicated tools that don't exist for all formats. The practical advice: export now and keep the backup, even if you don't know yet where you'll use it.",
        es: "Los datos históricos no se pierden si los exportas a tiempo. A través de Google Takeout puedes descargar todo tu historial en formato JSON y TCX. Estos archivos quedarán en tu dispositivo. Importarlos a Health Connect u otras plataformas requiere herramientas específicas que no existen para todos los formatos. El consejo práctico: exporta ahora y guarda la copia de seguridad, aunque aún no sepas dónde usarla.",
      },
    },
    {
      q: {
        it: "Health Connect funziona con tutti i wearable?",
        en: "Does Health Connect work with all wearables?",
        es: "¿Health Connect funciona con todos los wearables?",
      },
      a: {
        it: "Health Connect funziona con i wearable le cui app companion supportano la scrittura su HC. Samsung Health (Galaxy Watch), Fitbit (Pixel Watch e Fitbit tracker), Polar Beat e diverse altre app companion principali lo supportano. Garmin è un caso a parte: Garmin Connect non scrive su Health Connect in modo nativo, e le app che vogliono dati Garmin devono integrarsi separatamente con la loro API ufficiale. FitMesh Sync supporta entrambi i percorsi.",
        en: "Health Connect works with wearables whose companion apps support writing to HC. Samsung Health (Galaxy Watch), Fitbit (Pixel Watch and Fitbit trackers), Polar Beat, and several other major companion apps support it. Garmin is a special case: Garmin Connect doesn't write to Health Connect natively, and apps that want Garmin data must integrate separately with their official API. FitMesh Sync supports both paths.",
        es: "Health Connect funciona con los wearables cuyas apps complementarias admiten escritura en HC. Samsung Health (Galaxy Watch), Fitbit (Pixel Watch y rastreadores Fitbit), Polar Beat y varias otras apps complementarias principales lo admiten. Garmin es un caso aparte: Garmin Connect no escribe en Health Connect de forma nativa, y las aplicaciones que quieren datos de Garmin deben integrarse por separado con su API oficial. FitMesh Sync admite ambos caminos.",
      },
    },
    {
      q: {
        it: "Cosa faccio se uso più wearable e vedo dati doppi?",
        en: "What do I do if I use multiple wearables and see duplicate data?",
        es: "¿Qué hago si uso varios wearables y veo datos duplicados?",
      },
      a: {
        it: "I dati doppi su Health Connect sono un problema reale quando più dispositivi registrano la stessa metrica nello stesso periodo. La soluzione è usare un'app che gestisca la deduplicazione: FitMesh Sync, ad esempio, riconosce questo scenario e mostra per ogni dato la fonte principale, evitando somme gonfiate. Se invece usi un'app che non gestisce i duplicati, potresti vedere passi o calorie irrealisticamente alti.",
        en: "Duplicate data on Health Connect is a real problem when multiple devices record the same metric in the same period. The solution is to use an app that handles deduplication: FitMesh Sync, for example, recognizes this scenario and shows for each reading the primary source, avoiding inflated totals. If you use an app that doesn't handle duplicates, you might see unrealistically high step or calorie counts.",
        es: "Los datos duplicados en Health Connect son un problema real cuando varios dispositivos registran la misma métrica en el mismo periodo. La solución es usar una app que gestione la deduplicación: FitMesh Sync, por ejemplo, reconoce este escenario y muestra para cada dato la fuente principal, evitando totales inflados. Si usas una app que no gestiona los duplicados, puedes ver conteos de pasos o calorías irrealmente altos.",
      },
    },
    {
      q: {
        it: "FitMesh Sync sostituisce Google Fit?",
        en: "Does FitMesh Sync replace Google Fit?",
        es: "¿FitMesh Sync reemplaza a Google Fit?",
      },
      a: {
        it: "FitMesh Sync non è un sostituto diretto di Google Fit: non registra dati dai sensori né fa da app companion per i wearable. È un aggregatore che legge i dati già presenti in Health Connect (o nelle API Garmin, Polar, etc.) e li mostra in un pannello web unificato, con deduplicazione e visibilità della fonte. Se cerchi qualcosa per unificare i dati di più wearable in un'unica vista, FitMesh Sync serve a quello.",
        en: "FitMesh Sync is not a direct replacement for Google Fit: it doesn't record data from sensors or act as a companion app for wearables. It's an aggregator that reads data already present in Health Connect (or in Garmin, Polar APIs, etc.) and shows it in a unified web panel, with deduplication and source visibility. If you're looking for something to unify data from multiple wearables in a single view, FitMesh Sync serves that purpose.",
        es: "FitMesh Sync no es un sustituto directo de Google Fit: no registra datos de sensores ni actúa como app complementaria para wearables. Es un agregador que lee los datos ya presentes en Health Connect (o en las API de Garmin, Polar, etc.) y los muestra en un panel web unificado, con deduplicación y visibilidad de la fuente. Si buscas algo para unificar los datos de varios wearables en una sola vista, FitMesh Sync sirve para eso.",
      },
    },
  ],
  related: [
    "come-funziona-health-connect",
    "sync-samsung-health-google-fit",
    "alternative-app-sync-wearable-2026",
  ],
  brandsMentioned: ["Google Fit", "Health Connect"],
};
