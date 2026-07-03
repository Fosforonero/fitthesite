import type { BlogPost } from "../types";

/**
 * MOFU/BOFU: al momento dell'acquisto di un nuovo wearable. Cambio di
 * marca/modello (NON cambio di sistema operativo, quello è
 * da-android-a-iphone-dati-fitness). Value prop centrale: uno storico
 * unificato nel cloud UE che sopravvive al cambio hardware e unisce marche
 * diverse. it + en; gli altri locali si aggiungono dopo.
 */
export const post: BlogPost = {
  slug: "cambiare-smartwatch-senza-perdere-dati",
  category: "guides",
  publishedAt: "2026-07-02",
  updatedAt: "2026-07-03",
  readMinutes: 8,
  hero: {
    kicker: {
      it: "Guida",
      en: "Guide",
      es: "Guía",
      de: "Anleitung",
    },
    title: {
      it: "Cambiare smartwatch senza perdere lo storico dei dati",
      en: "How to switch smartwatch without losing your data history",
      es: "Cómo cambiar de smartwatch sin perder tu historial de datos",
      de: "Smartwatch wechseln, ohne deinen Datenverlauf zu verlieren",
    },
    subtitle: {
      it: "Compri un orologio nuovo o passi a un anello e temi di lasciare indietro anni di passi, sonno e battito? Il problema è che ogni marca chiude lo storico nella propria app. FitMesh lo tiene fuori dal dispositivo, nel cloud in UE, e unisce marche diverse in un'unica dashboard che sopravvive a ogni cambio.",
      en: "Buying a new watch, or moving to a ring, and worried about leaving years of steps, sleep and heart rate behind? The problem is that every brand locks your history inside its own app. FitMesh keeps it off the device, in the EU cloud, and merges different brands into one dashboard that survives every switch.",
      es: "¿Compras un reloj nuevo o te pasas a un anillo y temes dejar atrás años de pasos, sueño y ritmo cardíaco? El problema es que cada marca encierra tu historial dentro de su propia app. FitMesh lo mantiene fuera del dispositivo, en la nube de la UE, y une marcas distintas en un único panel que sobrevive a cada cambio.",
      de: "Du kaufst eine neue Uhr oder steigst auf einen Ring um und hast Angst, Jahre an Schritten, Schlaf und Herzfrequenz zurückzulassen? Das Problem ist, dass jede Marke deinen Verlauf in ihrer eigenen App einsperrt. FitMesh hält ihn außerhalb des Geräts, in der EU-Cloud, und führt verschiedene Marken in einem Dashboard zusammen, das jeden Wechsel übersteht.",
    },
  },
  metaDescription: {
    it: "Cambiare smartwatch senza perdere lo storico: FitMesh tiene i dati nel cloud UE, indipendenti dal dispositivo, e unisce marche diverse in un'unica dashboard.",
    en: "Switch smartwatch without losing your history: FitMesh keeps data in the EU cloud, independent of the device, and merges different brands into one dashboard.",
    es: "Cambia de smartwatch sin perder tu historial: FitMesh guarda los datos en la nube de la UE, independientes del dispositivo, y une marcas distintas en un único panel.",
    de: "Smartwatch wechseln, ohne deinen Verlauf zu verlieren: FitMesh speichert die Daten in der EU-Cloud, unabhängig vom Gerät, und führt verschiedene Marken in einem Dashboard zusammen.",
  },
  primaryKeyword: {
    it: "cambiare smartwatch senza perdere dati",
    en: "switch smartwatch without losing data",
    es: "cambiar de smartwatch sin perder datos",
    de: "smartwatch wechseln ohne daten zu verlieren",
  },
  secondaryKeywords: {
    it: [
      "cambiare orologio fitness senza perdere storico",
      "trasferire dati smartwatch nuovo",
      "storico dati fitness nel cloud",
      "unire dati smartwatch marche diverse",
      "cambiare marca smartwatch dati",
      "passare da orologio ad anello dati",
      "dashboard unica wearable",
    ],
    en: [
      "change fitness watch keep history",
      "transfer smartwatch data to new device",
      "unified fitness history cloud",
      "merge data from different smartwatch brands",
      "keep health history switching wearable",
      "switch from watch to ring data",
      "single wearable dashboard",
    ],
    es: [
      "cambiar reloj fitness sin perder historial",
      "transferir datos smartwatch a nuevo dispositivo",
      "historial fitness unificado en la nube",
      "unir datos de marcas de smartwatch distintas",
      "conservar historial de salud al cambiar wearable",
      "pasar de reloj a anillo datos",
      "panel único wearable",
    ],
    de: [
      "fitnessuhr wechseln verlauf behalten",
      "smartwatch daten auf neues gerät übertragen",
      "einheitlicher fitnessverlauf cloud",
      "daten verschiedener smartwatch marken zusammenführen",
      "gesundheitsverlauf beim wearable wechsel behalten",
      "von uhr auf ring daten",
      "einheitliches wearable dashboard",
    ],
  },
  tldr: {
    it: [
      "Cambiare marca di wearable di solito spezza lo storico: ogni app del produttore riparte da un grafico vuoto.",
      "FitMesh tiene lo storico sul tuo account nel cloud in UE, indipendente dal dispositivo.",
      "Unisce marche diverse in una dashboard deduplicata: via Health Connect su Android, Apple Salute su iPhone (in arrivo), e l'anello Colmi via Bluetooth.",
      "Collega FitMesh prima del cambio per portare dentro la base storica; tieni i due dispositivi in parallelo qualche giorno per una transizione senza buchi.",
      "Cambi orologio o anello quante volte vuoi: i dati restano tuoi.",
    ],
    en: [
      "Changing wearable brand usually breaks your history: every manufacturer app restarts from an empty chart.",
      "FitMesh keeps your history on your account in the EU cloud, independent of the device.",
      "It merges different brands into one deduplicated dashboard: via Health Connect on Android, Apple Health on iPhone (coming), and the Colmi ring over Bluetooth.",
      "Connect FitMesh before the switch to pull in your recent baseline; run both devices in parallel for a few days for a gap-free transition.",
      "Change watch or ring as many times as you like: the data stays yours.",
    ],
    es: [
      "Cambiar de marca de wearable suele romper tu historial: cada app del fabricante vuelve a empezar desde un gráfico vacío.",
      "FitMesh conserva tu historial en tu cuenta, en la nube de la UE, independiente del dispositivo.",
      "Une marcas distintas en un único panel sin duplicados: vía Health Connect en Android, Apple Health en iPhone (próximamente) y el anillo Colmi por Bluetooth.",
      "Conecta FitMesh antes del cambio para incorporar tu base reciente; mantén ambos dispositivos en paralelo unos días para una transición sin huecos.",
      "Cambia de reloj o de anillo tantas veces como quieras: los datos siguen siendo tuyos.",
    ],
    de: [
      "Ein Markenwechsel beim Wearable zerreißt meist deinen Verlauf: Jede Hersteller-App startet wieder bei einem leeren Diagramm.",
      "FitMesh bewahrt deinen Verlauf in deinem Konto in der EU-Cloud, unabhängig vom Gerät.",
      "Es führt verschiedene Marken in einem Dashboard ohne Dubletten zusammen: über Health Connect unter Android, Apple Health auf dem iPhone (in Kürze) und den Colmi-Ring über Bluetooth.",
      "Verbinde FitMesh vor dem Wechsel, um deine jüngste Basis mitzunehmen; nutze beide Geräte einige Tage parallel für einen lückenlosen Übergang.",
      "Wechsle Uhr oder Ring so oft du willst: Die Daten bleiben deine.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Hai appena ordinato un orologio nuovo, o stai passando dall'orologio a un anello. La domanda che spesso frena l'acquisto è sempre la stessa: e tutto lo storico che ho accumulato in questi anni? Passi, sonno, battito, allenamenti, mesi o anni di dati che vivono dentro l'app del vecchio dispositivo. Cambiare marca di solito significa ricominciare da un grafico vuoto. Attenzione a non confondere i due casi: qui non parliamo del passaggio da Android a iPhone (quello è un cambio di sistema operativo, lo trattiamo in [Da Android a iPhone: come non perdere i dati fitness](/blog/da-android-a-iphone-dati-fitness)). Qui parliamo del cambio di marca o modello del wearable: resti sullo stesso telefono, ma il tuo orologio Garmin diventa un Galaxy Watch, o il tuo Fitbit diventa un anello Colmi. Vediamo perché lo storico si spezza e come tenerlo unito.",
        en: "You just ordered a new watch, or you are moving from a watch to a ring. The question that often stalls the purchase is always the same: what about all the history I have built up over the years? Steps, sleep, heart rate, workouts, months or years of data living inside the old device's app. Changing brand usually means starting over from an empty chart. Be careful not to mix up two different cases: this is not about going from Android to iPhone (that is an operating-system change, covered in [From Android to iPhone: how not to lose your fitness data](/blog/da-android-a-iphone-dati-fitness)). This is about changing the brand or model of the wearable itself: you stay on the same phone, but your Garmin watch becomes a Galaxy Watch, or your Fitbit becomes a Colmi ring. Let's look at why the history breaks and how to keep it whole.",
        es: "Acabas de pedir un reloj nuevo, o estás pasando del reloj a un anillo. La pregunta que a menudo frena la compra es siempre la misma: ¿y todo el historial que he acumulado en estos años? Pasos, sueño, ritmo cardíaco, entrenamientos, meses o años de datos que viven dentro de la app del dispositivo antiguo. Cambiar de marca suele significar empezar de nuevo desde un gráfico vacío. Cuidado con no confundir dos casos distintos: aquí no hablamos del paso de Android a iPhone (eso es un cambio de sistema operativo, lo tratamos en [De Android a iPhone: cómo no perder los datos de fitness](/blog/da-android-a-iphone-dati-fitness)). Aquí hablamos de cambiar de marca o de modelo del wearable: sigues con el mismo teléfono, pero tu reloj Garmin se convierte en un Galaxy Watch, o tu Fitbit se convierte en un anillo Colmi. Veamos por qué el historial se rompe y cómo mantenerlo unido.",
        de: "Du hast gerade eine neue Uhr bestellt oder wechselst von der Uhr zu einem Ring. Die Frage, die den Kauf oft bremst, ist immer dieselbe: Was ist mit dem ganzen Verlauf, den ich über die Jahre gesammelt habe? Schritte, Schlaf, Herzfrequenz, Trainings, Monate oder Jahre an Daten, die in der App des alten Geräts leben. Ein Markenwechsel bedeutet meist, wieder bei einem leeren Diagramm anzufangen. Achte darauf, zwei verschiedene Fälle nicht zu verwechseln: Hier geht es nicht um den Wechsel von Android zu iPhone (das ist ein Wechsel des Betriebssystems, den wir in [Von Android zu iPhone: So verlierst du keine Fitnessdaten](/blog/da-android-a-iphone-dati-fitness) behandeln). Hier geht es um den Wechsel der Marke oder des Modells des Wearables selbst: Du bleibst beim selben Telefon, aber deine Garmin-Uhr wird zu einer Galaxy Watch oder dein Fitbit zu einem Colmi-Ring. Schauen wir, warum der Verlauf zerreißt und wie du ihn zusammenhältst.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché cambiando marca lo storico si spezza",
        en: "Why changing brand breaks your history",
        es: "Por qué cambiar de marca rompe tu historial",
        de: "Warum ein Markenwechsel deinen Verlauf zerreißt",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Ogni produttore tiene i tuoi dati dentro la propria app e i propri server. Garmin nel suo ecosistema, Fitbit nel suo, Samsung nel suo, Xiaomi e Amazfit nelle rispettive app companion. Sono silos: progettati per funzionare bene finché resti nella stessa marca, non per farti uscire con tutto lo storico in mano. Quando compri un dispositivo di un'altra marca, la nuova app parte da zero. Il vecchio storico non si trasferisce: resta congelato nell'app precedente, quella che pian piano smetterai di aprire. Nessuna delle due app ti mostra la linea continua della tua storia, prima e dopo il cambio.",
        en: "Every manufacturer keeps your data inside its own app and its own servers. Garmin in its ecosystem, Fitbit in its own, Samsung in its own, Xiaomi and Amazfit in their respective companion apps. They are silos: designed to work well as long as you stay within the same brand, not to let you walk out with your whole history in hand. When you buy a device from another brand, the new app starts from scratch. The old history does not transfer: it stays frozen in the previous app, the one you will slowly stop opening. Neither app shows you the continuous line of your story, before and after the switch.",
        es: "Cada fabricante guarda tus datos dentro de su propia app y sus propios servidores. Garmin en su ecosistema, Fitbit en el suyo, Samsung en el suyo, Xiaomi y Amazfit en sus respectivas apps complementarias. Son silos: pensados para funcionar bien mientras te quedes dentro de la misma marca, no para dejarte salir con todo el historial en la mano. Cuando compras un dispositivo de otra marca, la nueva app empieza de cero. El historial antiguo no se transfiere: se queda congelado en la app anterior, la que poco a poco dejarás de abrir. Ninguna de las dos apps te muestra la línea continua de tu historia, antes y después del cambio.",
        de: "Jeder Hersteller bewahrt deine Daten in seiner eigenen App und auf seinen eigenen Servern auf. Garmin in seinem Ökosystem, Fitbit in seinem, Samsung in seinem, Xiaomi und Amazfit in ihren jeweiligen Begleit-Apps. Das sind Silos: dafür gemacht, gut zu funktionieren, solange du bei derselben Marke bleibst, nicht dafür, dich mit deinem gesamten Verlauf in der Hand hinauszulassen. Wenn du ein Gerät einer anderen Marke kaufst, startet die neue App bei null. Der alte Verlauf wandert nicht mit: Er bleibt in der vorherigen App eingefroren, die du nach und nach nicht mehr öffnest. Keine der beiden Apps zeigt dir die durchgehende Linie deiner Geschichte, vor und nach dem Wechsel.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "La cronologia dei passi e delle calorie si spezza in due grafici separati, uno per app.",
          "Il sonno con le fasi (leggero, profondo, REM) riparte da zero nella nuova app.",
          "Battito a riposo e andamento dell'HRV perdono la base di confronto con i mesi precedenti.",
          "Gli allenamenti registrati con il vecchio dispositivo restano nell'app vecchia, non nella nuova.",
          "Se in futuro cambi di nuovo marca, il problema si ripete e i pezzi da consultare diventano tre.",
        ],
        en: [
          "Your steps and calories history splits into two separate charts, one per app.",
          "Sleep with its stages (light, deep, REM) restarts from zero in the new app.",
          "Resting heart rate and HRV trends lose their point of comparison with the previous months.",
          "Workouts recorded with the old device stay in the old app, not the new one.",
          "If you switch brands again later, the problem repeats and you now have three places to check.",
        ],
        es: [
          "El historial de pasos y calorías se parte en dos gráficos separados, uno por app.",
          "El sueño con sus fases (ligero, profundo, REM) vuelve a empezar desde cero en la nueva app.",
          "El ritmo cardíaco en reposo y la tendencia de la HRV pierden la base de comparación con los meses anteriores.",
          "Los entrenamientos registrados con el dispositivo antiguo se quedan en la app antigua, no en la nueva.",
          "Si en el futuro vuelves a cambiar de marca, el problema se repite y las piezas por consultar pasan a ser tres.",
        ],
        de: [
          "Der Verlauf von Schritten und Kalorien zerfällt in zwei getrennte Diagramme, eines pro App.",
          "Der Schlaf mit seinen Phasen (leicht, tief, REM) startet in der neuen App wieder bei null.",
          "Ruheherzfrequenz und der HRV-Verlauf verlieren ihre Vergleichsbasis zu den vorherigen Monaten.",
          "Die mit dem alten Gerät aufgezeichneten Trainings bleiben in der alten App, nicht in der neuen.",
          "Wechselst du später erneut die Marke, wiederholt sich das Problem und du hast drei Stellen zum Nachschauen.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "La continuità vive nel cloud, non nel dispositivo",
        en: "Continuity lives in the cloud, not in the device",
        es: "La continuidad vive en la nube, no en el dispositivo",
        de: "Die Kontinuität lebt in der Cloud, nicht im Gerät",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh ribalta la logica: invece di legare lo storico a un dispositivo, lo tiene sul tuo account, nel cloud in UE. L'orologio o l'anello sono soltanto la fonte del dato del momento; se domani cambi hardware, la fonte cambia ma lo storico resta lo stesso, sullo stesso account. FitMesh Sync legge i dati salute dei tuoi wearable e li mostra in un pannello web unificato, deduplicati: lo stesso passo non viene contato due volte, anche se per qualche giorno tieni due dispositivi in parallelo. Puoi consultare tutto da qualsiasi browser, come spieghiamo in [Vedere i dati del wearable dal browser del PC](/blog/vedere-dati-wearable-browser-pc), e se indossi più dispositivi insieme la dashboard li unisce senza [contare i dati doppi](/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "FitMesh flips the logic: instead of tying your history to a device, it keeps it on your account, in the EU cloud. The watch or ring is only the source of the moment's data; if you change hardware tomorrow, the source changes but the history stays the same, on the same account. FitMesh Sync reads the health data from your wearables and shows it in a unified web panel, deduplicated: the same step is not counted twice, even if you run two devices in parallel for a few days. You can view everything from any browser, as we explain in [See your wearable data from a PC browser](/blog/vedere-dati-wearable-browser-pc), and if you wear several devices at once the dashboard merges them without [counting the data twice](/blog/piu-smartwatch-insieme-dati-doppi).",
        es: "FitMesh le da la vuelta a la lógica: en lugar de atar tu historial a un dispositivo, lo conserva en tu cuenta, en la nube de la UE. El reloj o el anillo son solo la fuente del dato del momento; si mañana cambias de hardware, la fuente cambia pero el historial sigue siendo el mismo, en la misma cuenta. FitMesh Sync lee los datos de salud de tus wearables y los muestra en un panel web unificado, sin duplicados: el mismo paso no se cuenta dos veces, aunque durante unos días lleves dos dispositivos en paralelo. Puedes consultarlo todo desde cualquier navegador, como explicamos en [Ver los datos del wearable desde el navegador del PC](/blog/vedere-dati-wearable-browser-pc), y si llevas varios dispositivos a la vez el panel los une sin [contar los datos por duplicado](/blog/piu-smartwatch-insieme-dati-doppi).",
        de: "FitMesh dreht die Logik um: Statt deinen Verlauf an ein Gerät zu binden, bewahrt es ihn in deinem Konto auf, in der EU-Cloud. Die Uhr oder der Ring sind nur die Quelle des aktuellen Werts; wechselst du morgen die Hardware, ändert sich die Quelle, aber der Verlauf bleibt derselbe, im selben Konto. FitMesh Sync liest die Gesundheitsdaten deiner Wearables und zeigt sie in einem einheitlichen Web-Dashboard, ohne Dubletten: Derselbe Schritt wird nicht doppelt gezählt, selbst wenn du einige Tage lang zwei Geräte parallel nutzt. Du kannst alles von jedem Browser aus ansehen, wie wir in [Wearable-Daten im PC-Browser ansehen](/blog/vedere-dati-wearable-browser-pc) erklären, und wenn du mehrere Geräte gleichzeitig trägst, führt das Dashboard sie zusammen, ohne [die Daten doppelt zu zählen](/blog/piu-smartwatch-insieme-dati-doppi).",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Come FitMesh legge i tuoi dispositivi",
        en: "How FitMesh reads your devices",
        es: "Cómo lee FitMesh tus dispositivos",
        de: "Wie FitMesh deine Geräte ausliest",
      },
      body: {
        it: "Su Android, FitMesh Sync è disponibile su Google Play e legge i dati via Health Connect, l'hub salute del telefono a cui la maggior parte delle app dei produttori scrive. Legge anche l'anello Colmi (serie R: R02, R06, R08, R09, R10 e simili) direttamente via Bluetooth, senza bisogno dell'app companion. Su iPhone la versione è in arrivo (in revisione App Store) e scriverà su Apple Salute. Se una marca alimenta Health Connect o Apple Salute, il suo storico entra nel tuo account FitMesh insieme a quello delle altre. Approfondiamo il meccanismo in [Come funziona Health Connect](/blog/come-funziona-health-connect).",
        en: "On Android, FitMesh Sync is available on Google Play and reads data via Health Connect, the phone's health hub that most manufacturer apps write to. It also reads the Colmi ring (R series: R02, R06, R08, R09, R10 and similar) directly over Bluetooth, with no companion app needed. On iPhone the version is coming (in App Store review) and will write to Apple Health. If a brand feeds Health Connect or Apple Health, its history flows into your FitMesh account alongside the others. We go deeper in [How Health Connect works](/blog/come-funziona-health-connect).",
        es: "En Android, FitMesh Sync está disponible en Google Play y lee los datos vía Health Connect, el centro de salud del teléfono al que escribe la mayoría de las apps de los fabricantes. También lee el anillo Colmi (serie R: R02, R06, R08, R09, R10 y similares) directamente por Bluetooth, sin necesidad de la app complementaria. En iPhone la versión está en camino (en revisión en la App Store) y escribirá en Apple Health. Si una marca alimenta Health Connect o Apple Health, su historial entra en tu cuenta de FitMesh junto con el de las demás. Lo explicamos a fondo en [Cómo funciona Health Connect](/blog/come-funziona-health-connect).",
        de: "Unter Android ist FitMesh Sync bei Google Play verfügbar und liest die Daten über Health Connect, den Gesundheits-Hub des Telefons, in den die meisten Hersteller-Apps schreiben. Es liest außerdem den Colmi-Ring (R-Serie: R02, R06, R08, R09, R10 und ähnliche) direkt über Bluetooth, ohne Begleit-App. Auf dem iPhone kommt die Version in Kürze (in der App-Store-Prüfung) und schreibt in Apple Health. Wenn eine Marke Health Connect oder Apple Health speist, fließt ihr Verlauf zusammen mit den anderen in dein FitMesh-Konto. Mehr dazu in [Wie Health Connect funktioniert](/blog/come-funziona-health-connect).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Checklist: prima, durante e dopo il cambio",
        en: "Checklist: before, during and after the switch",
        es: "Checklist: antes, durante y después del cambio",
        de: "Checkliste: vor, während und nach dem Wechsel",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Prima:** installa FitMesh Sync su Android mentre usi ancora il vecchio dispositivo e collegalo, così lo storico recente entra subito nel tuo account.",
          "**Prima:** verifica che il vecchio orologio scriva su Health Connect e lascia sincronizzare qualche giorno, per portare dentro la base storica.",
          "**Durante:** ricevuto il nuovo wearable, collegalo alla sua app companion (o, per l'anello Colmi, direttamente a FitMesh via Bluetooth) e concedi i permessi a Health Connect.",
          "**Durante:** tieni entrambi i dispositivi attivi per qualche giorno se vuoi una transizione morbida; la deduplicazione evita i doppi conteggi.",
          "**Dopo:** apri la dashboard web e controlla che la linea di passi, sonno e battito prosegua senza buchi attraverso la data del cambio.",
          "**Dopo:** quando sei sicuro, puoi smettere di indossare il vecchio dispositivo; lo storico resta comunque nel tuo account, indipendente dall'hardware.",
        ],
        en: [
          "**Before:** install FitMesh Sync on Android while you are still using the old device and connect it, so your recent history enters your account right away.",
          "**Before:** check that the old watch writes to Health Connect and let it sync for a few days, to pull in the historical baseline.",
          "**During:** once the new wearable arrives, connect it to its companion app (or, for the Colmi ring, directly to FitMesh over Bluetooth) and grant the Health Connect permissions.",
          "**During:** keep both devices active for a few days if you want a soft transition; deduplication prevents double counting.",
          "**After:** open the web dashboard and check that the line of steps, sleep and heart rate continues with no gaps across the switch date.",
          "**After:** once you are confident, you can stop wearing the old device; the history stays in your account anyway, independent of the hardware.",
        ],
        es: [
          "**Antes:** instala FitMesh Sync en Android mientras aún usas el dispositivo antiguo y conéctalo, así el historial reciente entra enseguida en tu cuenta.",
          "**Antes:** comprueba que el reloj antiguo escribe en Health Connect y déjalo sincronizar unos días, para incorporar la base histórica.",
          "**Durante:** cuando recibas el nuevo wearable, conéctalo a su app complementaria (o, para el anillo Colmi, directamente a FitMesh por Bluetooth) y concede los permisos de Health Connect.",
          "**Durante:** mantén ambos dispositivos activos unos días si quieres una transición suave; la eliminación de duplicados evita los conteos dobles.",
          "**Después:** abre el panel web y comprueba que la línea de pasos, sueño y ritmo cardíaco continúa sin huecos a través de la fecha del cambio.",
          "**Después:** cuando estés seguro, puedes dejar de llevar el dispositivo antiguo; el historial se queda igualmente en tu cuenta, independiente del hardware.",
        ],
        de: [
          "**Vorher:** Installiere FitMesh Sync unter Android, während du das alte Gerät noch nutzt, und verbinde es, damit dein jüngster Verlauf sofort in dein Konto gelangt.",
          "**Vorher:** Prüfe, dass die alte Uhr in Health Connect schreibt, und lass sie einige Tage synchronisieren, um die historische Basis mitzunehmen.",
          "**Während:** Sobald das neue Wearable ankommt, verbinde es mit seiner Begleit-App (oder, beim Colmi-Ring, direkt mit FitMesh über Bluetooth) und erteile die Health-Connect-Berechtigungen.",
          "**Während:** Halte beide Geräte einige Tage aktiv, wenn du einen sanften Übergang willst; die Entfernung von Dubletten verhindert doppeltes Zählen.",
          "**Danach:** Öffne das Web-Dashboard und prüfe, dass die Linie aus Schritten, Schlaf und Herzfrequenz über das Wechseldatum hinweg ohne Lücken weiterläuft.",
          "**Danach:** Wenn du sicher bist, kannst du das alte Gerät ablegen; der Verlauf bleibt ohnehin in deinem Konto, unabhängig von der Hardware.",
        ],
      },
    },
    {
      type: "comparison",
      aTitle: {
        it: "Con la sola app del produttore",
        en: "With the manufacturer app alone",
        es: "Solo con la app del fabricante",
        de: "Nur mit der Hersteller-App",
      },
      aItems: {
        it: [
          "Lo storico è legato alla marca: cambi dispositivo, riparti da un grafico vuoto.",
          "Ogni cambio aggiunge un'app da tenere solo per consultare il passato.",
          "Confronti prima/dopo impossibili: i dati vivono in silos separati.",
          "Se chiudi il vecchio account, rischi di perdere lo storico.",
        ],
        en: [
          "History is tied to the brand: change device, start from an empty chart.",
          "Every switch adds one more app kept around just to look at the past.",
          "Before/after comparisons are impossible: the data lives in separate silos.",
          "If you close the old account, you risk losing the history.",
        ],
        es: [
          "El historial está atado a la marca: cambias de dispositivo, empiezas desde un gráfico vacío.",
          "Cada cambio añade una app que conservas solo para consultar el pasado.",
          "Las comparaciones antes/después son imposibles: los datos viven en silos separados.",
          "Si cierras la cuenta antigua, corres el riesgo de perder el historial.",
        ],
        de: [
          "Der Verlauf ist an die Marke gebunden: Gerät wechseln heißt, bei einem leeren Diagramm anfangen.",
          "Jeder Wechsel fügt eine weitere App hinzu, die du nur zum Nachschauen der Vergangenheit behältst.",
          "Vorher/nachher-Vergleiche sind unmöglich: Die Daten liegen in getrennten Silos.",
          "Wenn du das alte Konto schließt, riskierst du, den Verlauf zu verlieren.",
        ],
      },
      bTitle: {
        it: "Con FitMesh",
        en: "With FitMesh",
        es: "Con FitMesh",
        de: "Mit FitMesh",
      },
      bItems: {
        it: [
          "Lo storico è sul tuo account nel cloud UE, non sul dispositivo.",
          "Marche diverse confluiscono in un'unica dashboard, deduplicate.",
          "La linea temporale prosegue attraverso il cambio hardware.",
          "Cambi orologio o anello quante volte vuoi, i dati restano tuoi.",
        ],
        en: [
          "History lives on your account in the EU cloud, not on the device.",
          "Different brands flow into one dashboard, deduplicated.",
          "The timeline continues across the hardware change.",
          "Change watch or ring as often as you like, the data stays yours.",
        ],
        es: [
          "El historial vive en tu cuenta, en la nube de la UE, no en el dispositivo.",
          "Marcas distintas confluyen en un único panel, sin duplicados.",
          "La línea temporal continúa a través del cambio de hardware.",
          "Cambia de reloj o de anillo tantas veces como quieras, los datos siguen siendo tuyos.",
        ],
        de: [
          "Der Verlauf lebt in deinem Konto in der EU-Cloud, nicht auf dem Gerät.",
          "Verschiedene Marken fließen in einem Dashboard zusammen, ohne Dubletten.",
          "Die Zeitachse läuft über den Hardware-Wechsel hinweg weiter.",
          "Wechsle Uhr oder Ring so oft du willst, die Daten bleiben deine.",
        ],
      },
    },
    {
      type: "table",
      caption: {
        it: "Cosa succede allo storico in alcuni scenari di cambio",
        en: "What happens to your history in a few switch scenarios",
        es: "Qué le pasa a tu historial en algunos escenarios de cambio",
        de: "Was in einigen Wechselszenarien mit deinem Verlauf passiert",
      },
      headers: {
        it: ["Cambio", "Con la sola app del produttore", "Con FitMesh"],
        en: ["Switch", "With the manufacturer app alone", "With FitMesh"],
        es: ["Cambio", "Solo con la app del fabricante", "Con FitMesh"],
        de: ["Wechsel", "Nur mit der Hersteller-App", "Mit FitMesh"],
      },
      rows: [
        {
          it: ["Da Garmin a Galaxy Watch", "Due storici separati", "Storico unico e continuo"],
          en: ["Garmin to Galaxy Watch", "Two separate histories", "One continuous history"],
          es: ["De Garmin a Galaxy Watch", "Dos historiales separados", "Un historial único y continuo"],
          de: ["Von Garmin zu Galaxy Watch", "Zwei getrennte Verläufe", "Ein durchgehender Verlauf"],
        },
        {
          it: ["Da Fitbit ad anello Colmi", "Riparti da zero sul sonno", "Sonno e passi proseguono"],
          en: ["Fitbit to Colmi ring", "Sleep restarts from zero", "Sleep and steps continue"],
          es: ["De Fitbit a anillo Colmi", "El sueño vuelve a empezar de cero", "El sueño y los pasos continúan"],
          de: ["Von Fitbit zu Colmi-Ring", "Der Schlaf startet wieder bei null", "Schlaf und Schritte laufen weiter"],
        },
        {
          it: ["Da Xiaomi o Amazfit a Pixel Watch", "Grafici spezzati", "Un'unica linea temporale"],
          en: ["Xiaomi or Amazfit to Pixel Watch", "Split charts", "A single timeline"],
          es: ["De Xiaomi o Amazfit a Pixel Watch", "Gráficos partidos", "Una única línea temporal"],
          de: ["Von Xiaomi oder Amazfit zu Pixel Watch", "Zerrissene Diagramme", "Eine einzige Zeitachse"],
        },
        {
          it: ["Da orologio ad anello (o viceversa)", "App diverse, nessun confronto", "Fusione giorno/notte in un pannello"],
          en: ["Watch to ring (or the other way)", "Different apps, no comparison", "Day/night fusion in one panel"],
          es: ["De reloj a anillo (o al revés)", "Apps distintas, sin comparación", "Fusión día/noche en un panel"],
          de: ["Von Uhr zu Ring (oder umgekehrt)", "Verschiedene Apps, kein Vergleich", "Tag/Nacht-Fusion in einem Panel"],
        },
        {
          it: ["Secondo cambio in un anno", "Tre app, tre storici", "Sempre lo stesso account"],
          en: ["Second switch within a year", "Three apps, three histories", "Always the same account"],
          es: ["Segundo cambio en un año", "Tres apps, tres historiales", "Siempre la misma cuenta"],
          de: ["Zweiter Wechsel innerhalb eines Jahres", "Drei Apps, drei Verläufe", "Immer dasselbe Konto"],
        },
      ],
    },
    {
      type: "cta",
      title: {
        it: "Cambi wearable? Porta lo storico con te",
        en: "Switching wearable? Take your history with you",
        es: "¿Cambias de wearable? Llévate tu historial contigo",
        de: "Wearable wechseln? Nimm deinen Verlauf mit",
      },
      body: {
        it: "FitMesh Sync è disponibile ora su Android, con dashboard web inclusa. I primi 1000 iscritti founder ottengono il Pro a vita gratis; dopo, c'è una prova completa di 14 giorni, poi lo tieni con un piccolo abbonamento o con lo sblocco a vita (circa un caffè ogni sei mesi, o meno di una pizza). La versione iPhone è in arrivo: iscriviti alla beta per averla al lancio e iniziare a costruire uno storico che sopravvive al prossimo cambio di orologio.",
        en: "FitMesh Sync is available now on Android, with the web dashboard included. The first 1,000 founder sign-ups get lifetime Pro free; after that there is a full 14-day trial, then you keep it with a small subscription or a one-time lifetime unlock (about a coffee every six months, or less than a pizza). The iPhone version is coming: join the beta to get it at launch and start building a history that survives your next change of watch.",
        es: "FitMesh Sync ya está disponible en Android, con el panel web incluido. Los primeros 1000 registrados founder consiguen el Pro de por vida gratis; después hay una prueba completa de 14 días, y luego lo mantienes con una pequeña suscripción o con el desbloqueo de por vida (como un café cada seis meses, o menos que una pizza). La versión para iPhone está en camino: apúntate a la beta para tenerla en el lanzamiento y empezar a construir un historial que sobreviva a tu próximo cambio de reloj.",
        de: "FitMesh Sync ist ab sofort für Android verfügbar, inklusive Web-Dashboard. Die ersten 1.000 founder-Anmeldungen erhalten Pro lebenslang gratis; danach gibt es eine volle 14-tägige Testphase, und anschließend behältst du es mit einem kleinen Abo oder der einmaligen Freischaltung fürs Leben (weniger als ein Kaffee alle sechs Monate oder weniger als eine Pizza). Die iPhone-Version kommt in Kürze: Melde dich für die Beta an, um sie zum Start zu bekommen, und beginne einen Verlauf aufzubauen, der deinen nächsten Uhrenwechsel übersteht.",
      },
      ctaLabel: {
        it: "Unisciti alla beta →",
        en: "Join the beta →",
        es: "Únete a la beta →",
        de: "Zur Beta anmelden →",
      },
      ctaHref: {
        it: "/it/beta",
        en: "/en/beta",
        es: "/es/beta",
        de: "/de/beta",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Cambiando marca di smartwatch perdo lo storico dei dati?",
        en: "If I change smartwatch brand, do I lose my data history?",
        es: "Si cambio de marca de smartwatch, ¿pierdo el historial de datos?",
        de: "Verliere ich meinen Datenverlauf, wenn ich die Smartwatch-Marke wechsle?",
      },
      a: {
        it: "Con le sole app dei produttori, di fatto sì: ogni app parte da zero e il passato resta nella vecchia. Con FitMesh no: lo storico è legato al tuo account nel cloud in UE, non al dispositivo, quindi resta lì anche quando cambi orologio o anello.",
        en: "With the manufacturer apps alone, effectively yes: each app starts from zero and the past stays in the old one. With FitMesh, no: your history is tied to your account in the EU cloud, not to the device, so it stays there even when you change watch or ring.",
        es: "Solo con las apps de los fabricantes, en la práctica sí: cada app empieza desde cero y el pasado se queda en la antigua. Con FitMesh, no: tu historial está atado a tu cuenta en la nube de la UE, no al dispositivo, así que se queda ahí incluso cuando cambias de reloj o de anillo.",
        de: "Nur mit den Hersteller-Apps praktisch ja: Jede App startet bei null und die Vergangenheit bleibt in der alten. Mit FitMesh nicht: Dein Verlauf ist an dein Konto in der EU-Cloud gebunden, nicht an das Gerät, und bleibt daher erhalten, auch wenn du Uhr oder Ring wechselst.",
      },
    },
    {
      q: {
        it: "Funziona tra marche diverse?",
        en: "Does it work across different brands?",
        es: "¿Funciona entre marcas distintas?",
        de: "Funktioniert es markenübergreifend?",
      },
      a: {
        it: "Sì. Su Android FitMesh legge i dati via Health Connect, a cui scrive la maggior parte delle app dei produttori, e legge l'anello Colmi direttamente via Bluetooth. Marche diverse confluiscono così nella stessa dashboard, deduplicate. Su iPhone la versione in arrivo scriverà su Apple Salute.",
        en: "Yes. On Android FitMesh reads data via Health Connect, which most manufacturer apps write to, and reads the Colmi ring directly over Bluetooth. Different brands thus flow into the same dashboard, deduplicated. On iPhone the upcoming version will write to Apple Health.",
        es: "Sí. En Android FitMesh lee los datos vía Health Connect, al que escribe la mayoría de las apps de los fabricantes, y lee el anillo Colmi directamente por Bluetooth. Así, marcas distintas confluyen en el mismo panel, sin duplicados. En iPhone la versión que está por llegar escribirá en Apple Health.",
        de: "Ja. Unter Android liest FitMesh die Daten über Health Connect, in das die meisten Hersteller-Apps schreiben, und liest den Colmi-Ring direkt über Bluetooth. So fließen verschiedene Marken in dasselbe Dashboard, ohne Dubletten. Auf dem iPhone wird die kommende Version in Apple Health schreiben.",
      },
    },
    {
      q: {
        it: "Cosa succede allo storico del vecchio dispositivo?",
        en: "What happens to the old device's history?",
        es: "¿Qué pasa con el historial del dispositivo antiguo?",
        de: "Was passiert mit dem Verlauf des alten Geräts?",
      },
      a: {
        it: "Lo storico già entrato nel tuo account FitMesh resta lì, che tu smetta di usare il vecchio dispositivo o disinstalli la sua app. Per questo conviene collegare FitMesh prima del cambio, così porti dentro anche la base storica recente.",
        en: "The history already pulled into your FitMesh account stays there, whether you stop using the old device or uninstall its app. That is why it pays to connect FitMesh before the switch, so you also bring in the recent baseline.",
        es: "El historial que ya ha entrado en tu cuenta de FitMesh se queda ahí, tanto si dejas de usar el dispositivo antiguo como si desinstalas su app. Por eso conviene conectar FitMesh antes del cambio, así incorporas también la base histórica reciente.",
        de: "Der Verlauf, der bereits in dein FitMesh-Konto gelangt ist, bleibt dort, ob du das alte Gerät nicht mehr nutzt oder seine App deinstallierst. Deshalb lohnt es sich, FitMesh vor dem Wechsel zu verbinden, damit du auch die jüngste historische Basis mitnimmst.",
      },
    },
    {
      q: {
        it: "Devo tenere due dispositivi insieme durante la transizione?",
        en: "Do I need to keep two devices together during the transition?",
        es: "¿Tengo que llevar dos dispositivos a la vez durante la transición?",
        de: "Muss ich während des Übergangs zwei Geräte gleichzeitig tragen?",
      },
      a: {
        it: "Non è obbligatorio, ma può aiutare. Se tieni vecchio e nuovo attivi per qualche giorno, la deduplicazione evita di contare due volte gli stessi passi e la transizione risulta senza buchi. Quando sei pronto, smetti di indossare il vecchio.",
        en: "It is not required, but it can help. If you keep the old and the new active for a few days, deduplication avoids counting the same steps twice and the transition comes out gap-free. When you are ready, stop wearing the old one.",
        es: "No es obligatorio, pero puede ayudar. Si mantienes activos el antiguo y el nuevo unos días, la eliminación de duplicados evita contar dos veces los mismos pasos y la transición sale sin huecos. Cuando estés listo, deja de llevar el antiguo.",
        de: "Es ist nicht zwingend, kann aber helfen. Wenn du das alte und das neue Gerät einige Tage aktiv hältst, verhindert die Entfernung von Dubletten, dass dieselben Schritte doppelt gezählt werden, und der Übergang verläuft lückenlos. Wenn du bereit bist, legst du das alte ab.",
      },
    },
    {
      q: {
        it: "Serve un abbonamento?",
        en: "Do I need a subscription?",
        es: "¿Hace falta una suscripción?",
        de: "Brauche ich ein Abo?",
      },
      a: {
        it: "L'app Android è disponibile ora con dashboard web inclusa. I primi 1000 iscritti founder ricevono il Pro a vita gratis. Dopo, c'è una prova completa di 14 giorni, poi tieni FitMesh con un piccolo abbonamento (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza). Non c'è un piano gratuito permanente; il prezzo aggiornato per il tuo Paese è mostrato nell'app.",
        en: "The Android app is available now with the web dashboard included. The first 1,000 founder sign-ups get lifetime Pro free. After that there is a full 14-day trial, then you keep FitMesh with a small subscription (about a coffee every six months) or a one-time lifetime unlock (less than a pizza). There is no permanent free plan; the current price for your country is shown in the app.",
        es: "La app de Android ya está disponible con el panel web incluido. Los primeros 1000 registrados founder reciben el Pro de por vida gratis. Después hay una prueba completa de 14 días, y luego mantienes FitMesh con una pequeña suscripción (como un café cada seis meses) o con el desbloqueo de por vida (menos que una pizza). No hay un plan gratuito permanente; el precio actualizado para tu país se muestra en la app.",
        de: "Die Android-App ist ab sofort verfügbar, inklusive Web-Dashboard. Die ersten 1.000 founder-Anmeldungen erhalten Pro lebenslang gratis. Danach gibt es eine volle 14-tägige Testphase, und anschließend behältst du FitMesh mit einem kleinen Abo (weniger als ein Kaffee alle sechs Monate) oder der einmaligen Freischaltung fürs Leben (weniger als eine Pizza). Es gibt keinen dauerhaft kostenlosen Tarif; der aktuelle Preis für dein Land wird in der App angezeigt.",
      },
    },
    {
      q: {
        it: "I dati dell'anello o dell'orologio sono a livello medico?",
        en: "Is the ring or watch data medical grade?",
        es: "¿Los datos del anillo o del reloj son de nivel médico?",
        de: "Sind die Daten des Rings oder der Uhr medizinisch verwertbar?",
      },
      a: {
        it: "No. Passi, battito, SpO2, sonno e stress sono misure di consumo per il benessere, non strumenti diagnostici. Servono a vedere tendenze nel tempo, non a interpretare valori clinici.",
        en: "No. Steps, heart rate, SpO2, sleep and stress are consumer wellness measurements, not diagnostic tools. They are there to show trends over time, not to interpret clinical values.",
        es: "No. Pasos, ritmo cardíaco, SpO2, sueño y estrés son mediciones de consumo para el bienestar, no herramientas de diagnóstico. Sirven para ver tendencias a lo largo del tiempo, no para interpretar valores clínicos.",
        de: "Nein. Schritte, Herzfrequenz, SpO2, Schlaf und Stress sind Consumer-Wohlfühlmesswerte, keine Diagnosewerkzeuge. Sie sind dafür da, Tendenzen im Zeitverlauf zu zeigen, nicht dazu, klinische Werte zu deuten.",
      },
    },
  ],
  related: [
    "scegliere-smartwatch-dati-2026",
    "piu-smartwatch-insieme-dati-doppi",
    "da-android-a-iphone-dati-fitness",
    "guida-sync-wearable-2026",
    "vedere-dati-wearable-browser-pc",
  ],
  brandsMentioned: ["Garmin", "Fitbit", "Samsung", "Xiaomi", "Amazfit", "Colmi", "Apple", "Google"],
  ldType: "BlogPosting",
};
