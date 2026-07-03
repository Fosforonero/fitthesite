import type { BlogPost } from "../types";

/**
 * BOFU pricing page: risponde a "FitMesh è gratis / quanto costa" prima
 * dell'installazione. Articolo chiave per i ricavi: onestà sul modello
 * (niente free tier permanente), gancio founder (primi 1000 = Pro a vita),
 * prova 14 giorni, cosa include il Pro. CTA a /beta.
 * Locali: it/en/es/de.
 */
export const post: BlogPost = {
  slug: "fitmesh-gratis-prezzo-founder",
  category: "guides",
  publishedAt: "2026-07-02",
  updatedAt: "2026-07-03",
  readMinutes: 8,
  tldr: {
    it: [
      "FitMesh non ha un piano gratuito permanente: chi cerca 'gratis per sempre' deve saperlo subito.",
      "I primi 1000 iscritti diventano founder e ricevono il Pro a vita, gratis, incluse le funzioni future.",
      "Tutti gli altri hanno 14 giorni di prova completa, con ogni funzione Pro sbloccata.",
      "Dopo i 14 giorni tieni FitMesh con un abbonamento leggero (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza), oppure chiudi l'account.",
      "Il Pro include dashboard web, tutti i wearable uniti e deduplicati, storico completo e anello Colmi via Bluetooth.",
    ],
    en: [
      "FitMesh has no permanent free plan: if you're searching for 'free forever', you should know that up front.",
      "The first 1,000 sign-ups become founders and get Pro for life, free, including future features.",
      "Everyone else gets a full 14-day trial with every Pro feature unlocked.",
      "After 14 days you keep FitMesh with a light subscription (about a coffee every six months) or a one-time lifetime unlock (less than a pizza), or you close the account.",
      "Pro includes the web dashboard, all your wearables merged and deduplicated, full history and the Colmi ring over Bluetooth.",
    ],
    es: [
      "FitMesh no tiene un plan gratuito permanente: quien busca 'gratis para siempre' debe saberlo desde el principio.",
      "Los primeros 1000 registrados se convierten en founder y reciben el Pro de por vida, gratis, con las funciones futuras incluidas.",
      "Todos los demás tienen 14 días de prueba completa, con todas las funciones Pro desbloqueadas.",
      "Después de los 14 días conservas FitMesh con una suscripción ligera (como un café cada seis meses) o con el desbloqueo de por vida (menos que una pizza), o bien cierras la cuenta.",
      "El Pro incluye el dashboard web, todos los wearables unidos y sin duplicados, el historial completo y el anillo Colmi por Bluetooth.",
    ],
    de: [
      "FitMesh hat keinen dauerhaft kostenlosen Plan: Wer nach 'für immer gratis' sucht, sollte das gleich wissen.",
      "Die ersten 1000 Anmeldungen werden founder und erhalten Pro auf Lebenszeit, gratis, inklusive künftiger Funktionen.",
      "Alle anderen erhalten eine vollständige 14-tägige Testphase mit allen freigeschalteten Pro-Funktionen.",
      "Nach den 14 Tagen behältst du FitMesh mit einem leichten Abo (weniger als ein Kaffee alle sechs Monate) oder mit der Freischaltung auf Lebenszeit (weniger als eine Pizza), oder du schließt das Konto.",
      "Pro umfasst das Web-Dashboard, alle Wearables zusammengeführt und ohne Duplikate, den vollständigen Verlauf und den Colmi-Ring über Bluetooth.",
    ],
  },
  primaryKeyword: {
    it: "fitmesh è gratis",
    en: "is fitmesh free",
    es: "fitmesh es gratis",
    de: "ist fitmesh kostenlos",
  },
  secondaryKeywords: {
    it: [
      "fitmesh quanto costa",
      "fitmesh prezzo",
      "fitmesh prova gratuita",
      "fitmesh pro a vita",
      "fitmesh posti founder",
      "fitmesh abbonamento",
      "fitmesh gratis per sempre",
    ],
    en: [
      "fitmesh price",
      "fitmesh cost",
      "fitmesh free trial",
      "fitmesh pro lifetime",
      "fitmesh founder spots",
      "fitmesh subscription",
      "fitmesh free forever",
    ],
    es: [
      "fitmesh precio",
      "fitmesh cuánto cuesta",
      "fitmesh prueba gratis",
      "fitmesh pro de por vida",
      "fitmesh plazas founder",
      "fitmesh suscripción",
      "fitmesh gratis para siempre",
    ],
    de: [
      "fitmesh preis",
      "fitmesh kosten",
      "fitmesh kostenlos testen",
      "fitmesh pro lebenslang",
      "fitmesh founder plätze",
      "fitmesh abo",
      "fitmesh für immer kostenlos",
    ],
  },
  metaDescription: {
    it: "FitMesh è gratis? Niente piano gratuito permanente: primi 1000 founder col Pro a vita gratis, per gli altri prova completa di 14 giorni poi abbonamento. Ecco come funziona.",
    en: "Is FitMesh free? No permanent free plan: the first 1,000 founders get lifetime Pro free, everyone else gets a full 14-day trial then a Pro subscription. Here's how it works.",
    es: "¿FitMesh es gratis? Sin plan gratuito permanente: los primeros 1000 founder con Pro de por vida gratis, para el resto prueba completa de 14 días y luego suscripción. Así funciona.",
    de: "Ist FitMesh kostenlos? Kein dauerhaft kostenloser Plan: die ersten 1000 founder mit Pro auf Lebenszeit gratis, für alle anderen eine vollständige 14-Tage-Testphase und danach ein Abo. So funktioniert es.",
  },
  hero: {
    kicker: {
      it: "Guida prezzi",
      en: "Pricing guide",
      es: "Guía de precios",
      de: "Preisübersicht",
    },
    title: {
      it: "FitMesh è gratis? Prezzo, prova di 14 giorni e posti founder",
      en: "Is FitMesh free? Pricing, the 14-day trial and founder spots",
      es: "¿FitMesh es gratis? Precio, prueba de 14 días y plazas founder",
      de: "Ist FitMesh kostenlos? Preis, 14-Tage-Testphase und founder-Plätze",
    },
    subtitle: {
      it: "La risposta onesta prima di installare: non esiste un piano gratuito per sempre, ma i primi 1000 iscritti ottengono il Pro a vita gratis e tutti gli altri hanno 14 giorni di prova completa. Ecco esattamente come funziona il prezzo e cosa include il Pro.",
      en: "The honest answer before you install: there's no free-forever plan, but the first 1,000 sign-ups get lifetime Pro for free and everyone else gets a full 14-day trial. Here's exactly how pricing works and what Pro includes.",
      es: "La respuesta honesta antes de instalar: no existe un plan gratuito para siempre, pero los primeros 1000 registrados consiguen el Pro de por vida gratis y todos los demás tienen 14 días de prueba completa. Aquí tienes exactamente cómo funciona el precio y qué incluye el Pro.",
      de: "Die ehrliche Antwort vor der Installation: Es gibt keinen für immer kostenlosen Plan, aber die ersten 1000 Anmeldungen bekommen Pro auf Lebenszeit gratis und alle anderen erhalten eine vollständige 14-tägige Testphase. Hier erfährst du genau, wie der Preis funktioniert und was Pro umfasst.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se stai cercando \"FitMesh è gratis\" prima di installare, ecco la risposta diretta e senza giri di parole: non esiste un piano gratuito permanente, ma ci sono due modi concreti per usare FitMesh Sync senza spendere nulla oggi. Il primo sono i 1000 posti founder, che danno il Pro a vita gratis. Il secondo è la prova completa di 14 giorni, aperta a tutti, con ogni funzione sbloccata. Alla fine della prova scegli come tenerlo: un piccolo abbonamento o lo sblocco a vita, oppure chiudi l'account. In questa guida spieghiamo esattamente quanto costa (poco), il lavoro che c'è dietro, cosa include il Pro e come tenerti un posto founder finché ci sono.",
        en: "If you're searching for \"is FitMesh free\" before installing, here's the direct answer with no spin: there is no permanent free plan, but there are two concrete ways to use FitMesh Sync without paying anything today. The first is the 1,000 founder spots, which grant Pro for life for free. The second is the full 14-day trial, open to everyone, with every feature unlocked. At the end of the trial you choose how to keep it: a small subscription or a lifetime unlock, or you close the account. This guide explains exactly how little it costs, the work behind it, what Pro includes, and how to keep a founder spot while they last.",
        es: "Si estás buscando \"FitMesh es gratis\" antes de instalar, esta es la respuesta directa y sin rodeos: no existe un plan gratuito permanente, pero hay dos formas concretas de usar FitMesh Sync sin gastar nada hoy. La primera son las 1000 plazas founder, que dan el Pro de por vida gratis. La segunda es la prueba completa de 14 días, abierta a todos, con todas las funciones desbloqueadas. Al terminar la prueba eliges cómo conservarlo: una pequeña suscripción o el desbloqueo de por vida, o bien cierras la cuenta. En esta guía explicamos exactamente lo poco que cuesta, el trabajo que hay detrás, qué incluye el Pro y cómo reservar una plaza founder mientras queden.",
        de: "Wenn du vor der Installation nach \"FitMesh ist kostenlos\" suchst, hier die direkte Antwort ohne Umschweife: Es gibt keinen dauerhaft kostenlosen Plan, aber es gibt zwei konkrete Wege, FitMesh Sync heute ohne Ausgaben zu nutzen. Der erste sind die 1000 founder-Plätze, die Pro auf Lebenszeit gratis geben. Der zweite ist die vollständige 14-tägige Testphase, offen für alle, mit sämtlichen freigeschalteten Funktionen. Am Ende der Testphase entscheidest du, wie du es behältst: ein kleines Abo oder die Freischaltung auf Lebenszeit, oder du schließt das Konto. In diesem Guide erklären wir genau, wie wenig es kostet, welche Arbeit dahintersteckt, was Pro umfasst und wie du dir einen founder-Platz sicherst, solange es welche gibt.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Risposta rapida",
        en: "Quick answer",
        es: "Respuesta rápida",
        de: "Schnelle Antwort",
      },
      body: {
        it: "FitMesh non ha un piano gratuito per sempre, ma costa pochissimo. I primi 1000 iscritti diventano founder e ottengono il Pro a vita, gratis. Tutti gli altri hanno 14 giorni di prova completa, poi tengono FitMesh con un abbonamento leggero (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza). Il prezzo aggiornato per il tuo Paese è mostrato nell'app.",
        en: "FitMesh has no free-forever plan, but it costs very little. The first 1,000 sign-ups become founders and get Pro for life, free. Everyone else gets a full 14-day trial, then keeps FitMesh with a light subscription (about a coffee every six months) or a one-time lifetime unlock (less than a pizza). The current price for your country is shown in the app.",
        es: "FitMesh no tiene un plan gratuito para siempre, pero cuesta muy poco. Los primeros 1000 registrados se convierten en founder y obtienen el Pro de por vida, gratis. Todos los demás tienen 14 días de prueba completa y luego conservan FitMesh con una suscripción ligera (como un café cada seis meses) o con el desbloqueo de por vida (menos que una pizza). El precio actualizado para tu país se muestra en la app.",
        de: "FitMesh hat keinen für immer kostenlosen Plan, kostet aber sehr wenig. Die ersten 1000 Anmeldungen werden founder und erhalten Pro auf Lebenszeit, gratis. Alle anderen bekommen eine vollständige 14-tägige Testphase und behalten FitMesh dann mit einem leichten Abo (weniger als ein Kaffee alle sechs Monate) oder mit der Freischaltung auf Lebenszeit (weniger als eine Pizza). Der aktuelle Preis für dein Land wird in der App angezeigt.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "FitMesh è gratis? La risposta onesta",
        en: "Is FitMesh free? The honest answer",
        es: "¿FitMesh es gratis? La respuesta honesta",
        de: "Ist FitMesh kostenlos? Die ehrliche Antwort",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Molte app di questo tipo promettono \"gratis per sempre\" e poi si finanziano vendendo i dati o riempiendo lo schermo di pubblicità. FitMesh fa il contrario: i tuoi dati salute restano sul tuo account nel cloud in UE, non li vendiamo e non mostriamo pubblicità. Leggere i dati dai tuoi wearable, deduplicarli (lo stesso passo non contato due volte) e mostrarli in un pannello web unico ha un costo reale di gestione. Per questo il modello è semplice e trasparente: chi arriva presto viene premiato con il Pro a vita gratis (i posti founder), tutti gli altri provano l'app completa per 14 giorni e poi decidono se il Pro vale il prezzo di un abbonamento. Nessuna versione dimezzata che ti tiene in ostaggio, nessun costo nascosto.",
        en: "Plenty of apps in this space promise \"free forever\" and then fund themselves by selling your data or filling the screen with ads. FitMesh does the opposite: your health data stays on your account in the EU cloud, we don't sell it and we don't show ads. Reading data from your wearables, deduplicating it (the same step never counted twice) and showing it in one unified web panel has a real running cost. That's why the model is simple and transparent: early adopters are rewarded with lifetime Pro for free (the founder spots), everyone else tries the full app for 14 days and then decides whether Pro is worth the price of a subscription. No crippled tier holding you hostage, no hidden fees.",
        es: "Muchas apps de este tipo prometen \"gratis para siempre\" y luego se financian vendiendo tus datos o llenando la pantalla de publicidad. FitMesh hace lo contrario: tus datos de salud se quedan en tu cuenta en la nube en la UE, no los vendemos y no mostramos publicidad. Leer los datos de tus wearables, quitar los duplicados (el mismo paso nunca contado dos veces) y mostrarlos en un único panel web tiene un coste real de gestión. Por eso el modelo es sencillo y transparente: quien llega pronto recibe como premio el Pro de por vida gratis (las plazas founder), y todos los demás prueban la app completa durante 14 días y luego deciden si el Pro vale el precio de una suscripción. Sin ninguna versión recortada que te tenga como rehén, sin costes ocultos.",
        de: "Viele Apps dieser Art versprechen \"für immer gratis\" und finanzieren sich dann, indem sie deine Daten verkaufen oder den Bildschirm mit Werbung füllen. FitMesh macht das Gegenteil: Deine Gesundheitsdaten bleiben in deinem Konto in der EU-Cloud, wir verkaufen sie nicht und zeigen keine Werbung. Die Daten deiner Wearables zu lesen, Duplikate zu entfernen (derselbe Schritt wird nie doppelt gezählt) und sie in einem einzigen Web-Panel anzuzeigen, verursacht echte laufende Kosten. Deshalb ist das Modell einfach und transparent: Wer früh dabei ist, wird mit Pro auf Lebenszeit gratis belohnt (die founder-Plätze), alle anderen testen die komplette App 14 Tage lang und entscheiden dann, ob Pro den Preis eines Abos wert ist. Keine halbierte Version, die dich als Geisel hält, keine versteckten Kosten.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "1000 posti founder: Pro a vita, gratis",
        en: "1,000 founder spots: Pro for life, free",
        es: "1000 plazas founder: Pro de por vida, gratis",
        de: "1000 founder-Plätze: Pro auf Lebenszeit, gratis",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'offerta più forte è anche la più semplice: i primi 1000 iscritti diventano founder e ricevono il Pro a vita, gratis. Non una prova lunga, non uno sconto: accesso completo senza scadenza. È il modo con cui ringraziamo chi crede nel progetto quando è ancora all'inizio. I posti sono 1000 e non uno di più: quando finiscono, l'offerta founder si chiude e restano solo la prova e l'abbonamento. Diventare founder oggi significa non pagare mai l'abbonamento in futuro, incluse le funzioni che arriveranno.",
        en: "The strongest offer is also the simplest: the first 1,000 sign-ups become founders and get Pro for life, free. Not a long trial, not a discount: full access with no expiry. It's how we thank the people who back the project while it's still early. There are 1,000 spots and not one more: once they're gone, the founder offer closes and only the trial and the subscription remain. Becoming a founder today means never paying for the subscription in the future, including the features still to come.",
        es: "La oferta más fuerte es también la más sencilla: los primeros 1000 registrados se convierten en founder y reciben el Pro de por vida, gratis. No una prueba larga, no un descuento: acceso completo sin caducidad. Es la forma en que damos las gracias a quien cree en el proyecto cuando aún está empezando. Las plazas son 1000 y ni una más: cuando se acaban, la oferta founder se cierra y solo quedan la prueba y la suscripción. Convertirte en founder hoy significa no pagar nunca la suscripción en el futuro, con las funciones que llegarán incluidas.",
        de: "Das stärkste Angebot ist zugleich das einfachste: Die ersten 1000 Anmeldungen werden founder und erhalten Pro auf Lebenszeit, gratis. Keine lange Testphase, kein Rabatt: voller Zugang ohne Ablaufdatum. So bedanken wir uns bei denen, die an das Projekt glauben, während es noch am Anfang steht. Es gibt 1000 Plätze und keinen mehr: Sind sie weg, schließt das founder-Angebot und es bleiben nur die Testphase und das Abo. Heute founder zu werden bedeutet, das Abo in Zukunft nie zu bezahlen, inklusive der Funktionen, die noch kommen.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Pro a vita, senza scadenza e senza rinnovi da pagare.",
          "Tutte le funzioni Pro attuali e future incluse.",
          "La dashboard web completa, accessibile da qualsiasi browser.",
          "Le nuove integrazioni man mano che escono, come l'anello Colmi e l'app iOS.",
          "Un posto assicurato, legato al tuo account, prima che i 1000 finiscano.",
        ],
        en: [
          "Pro for life, with no expiry and no renewals to pay.",
          "Every current and future Pro feature included.",
          "The full web dashboard, reachable from any browser.",
          "New integrations as they ship, like the Colmi ring and the iOS app.",
          "A secured spot tied to your account, before the 1,000 run out.",
        ],
        es: [
          "Pro de por vida, sin caducidad y sin renovaciones que pagar.",
          "Todas las funciones Pro actuales y futuras incluidas.",
          "El dashboard web completo, accesible desde cualquier navegador.",
          "Las nuevas integraciones a medida que salen, como el anillo Colmi y la app iOS.",
          "Una plaza asegurada, ligada a tu cuenta, antes de que se acaben las 1000.",
        ],
        de: [
          "Pro auf Lebenszeit, ohne Ablaufdatum und ohne zu zahlende Verlängerungen.",
          "Alle aktuellen und künftigen Pro-Funktionen inklusive.",
          "Das komplette Web-Dashboard, von jedem Browser aus erreichbar.",
          "Neue Integrationen, sobald sie erscheinen, wie der Colmi-Ring und die iOS-App.",
          "Ein gesicherter Platz, an dein Konto gebunden, bevor die 1000 aufgebraucht sind.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Come diventare founder",
        en: "How to become a founder",
        es: "Cómo convertirte en founder",
        de: "So wirst du founder",
      },
      body: {
        it: "Per prendere un posto founder ti iscrivi alla beta da /it/beta: scarichi l'app Android (già sul Play Store) o entri in lista per iOS (in arrivo). Il posto è legato al tuo account: una volta founder, resti founder. Non serve la carta di credito per registrarti.",
        en: "To claim a founder spot you sign up for the beta at /en/beta: install the Android app (already on the Play Store) or join the list for iOS (coming soon). The spot is tied to your account: once a founder, always a founder. No credit card needed to register.",
        es: "Para conseguir una plaza founder te apuntas a la beta en /es/beta: descargas la app Android (ya en el Play Store) o entras en la lista para iOS (próximamente). La plaza está ligada a tu cuenta: una vez founder, sigues siendo founder. No hace falta tarjeta de crédito para registrarte.",
        de: "Um einen founder-Platz zu bekommen, meldest du dich unter /de/beta für die Beta an: Du lädst die Android-App herunter (schon im Play Store) oder trägst dich in die Liste für iOS ein (kommt bald). Der Platz ist an dein Konto gebunden: Einmal founder, immer founder. Für die Registrierung ist keine Kreditkarte nötig.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Niente più posti founder? Prova completa di 14 giorni",
        en: "Founder spots gone? A full 14-day trial",
        es: "¿Se acabaron las plazas founder? Prueba completa de 14 días",
        de: "Keine founder-Plätze mehr? Eine vollständige 14-Tage-Testphase",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se i 1000 posti founder sono esauriti quando arrivi, non resti fuori: hai 14 giorni di prova completa. \"Completa\" significa che durante la prova ogni funzione Pro è sbloccata, esattamente come per un founder. Colleghi i tuoi wearable, apri la dashboard web, guardi lo storico, provi l'anello Colmi via Bluetooth: tutto attivo, senza limiti artificiali. I 14 giorni servono a farti valutare l'app sui tuoi dati veri, non su una demo preconfezionata. È il modo più giusto per capire se FitMesh fa quello che ti serve prima di decidere.",
        en: "If the 1,000 founder spots are gone by the time you arrive, you're not left out: you get a full 14-day trial. \"Full\" means every Pro feature is unlocked during the trial, exactly like it is for a founder. You connect your wearables, open the web dashboard, look at your history, try the Colmi ring over Bluetooth: everything on, no artificial limits. The 14 days let you evaluate the app on your real data, not on a canned demo. It's the fairest way to see whether FitMesh does what you need before you decide.",
        es: "Si las 1000 plazas founder están agotadas cuando llegas, no te quedas fuera: tienes 14 días de prueba completa. \"Completa\" significa que durante la prueba todas las funciones Pro están desbloqueadas, exactamente igual que para un founder. Conectas tus wearables, abres el dashboard web, miras el historial, pruebas el anillo Colmi por Bluetooth: todo activo, sin límites artificiales. Los 14 días sirven para que valores la app con tus datos reales, no con una demo prefabricada. Es la forma más justa de saber si FitMesh hace lo que necesitas antes de decidir.",
        de: "Wenn die 1000 founder-Plätze bei deiner Ankunft vergeben sind, bleibst du nicht außen vor: Du erhältst eine vollständige 14-tägige Testphase. \"Vollständig\" heißt, dass während der Testphase jede Pro-Funktion freigeschaltet ist, genau wie bei einem founder. Du verbindest deine Wearables, öffnest das Web-Dashboard, siehst dir den Verlauf an, testest den Colmi-Ring über Bluetooth: alles aktiv, ohne künstliche Grenzen. Die 14 Tage sind dazu da, die App mit deinen echten Daten zu bewerten, nicht mit einer vorgefertigten Demo. So findest du am fairsten heraus, ob FitMesh das tut, was du brauchst, bevor du dich entscheidest.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa succede dopo i 14 giorni",
        en: "What happens after the 14 days",
        es: "Qué pasa después de los 14 días",
        de: "Was nach den 14 Tagen passiert",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Alla fine dei 14 giorni scegli come continuare, senza trappole: tieni FitMesh con un piccolo abbonamento o con lo sblocco a vita (i founder non pagano nulla), oppure, se decidi che non fa per te, chiudi l'account. Non c'è una versione gratuita dimezzata che resta lì a metà: o FitMesh ti è utile e lo tieni a un prezzo piccolo, o lo lasci e i tuoi dati vengono rimossi. È una scelta onesta, ed è proprio il motivo per cui la prova è completa: vogliamo che tu decida con l'app vera davanti, dopo aver visto [i tuoi smartwatch uniti senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi) nella dashboard, non su promesse.",
        en: "At the end of the 14 days you choose how to carry on, with no traps: keep FitMesh with a small subscription or a one-time lifetime unlock (founders pay nothing), or, if you decide it's not for you, close the account. There's no reduced free version sitting there half-working: either FitMesh is useful to you and you keep it for a small price, or you let it go and your data is removed. It's an honest choice, and it's exactly why the trial is full: we want you to decide with the real app in front of you, after seeing [your smartwatches merged with no double data](/en/blog/piu-smartwatch-insieme-dati-doppi) in the dashboard, not on promises.",
        es: "Al terminar los 14 días eliges cómo continuar, sin trampas: conservas FitMesh con una pequeña suscripción o con el desbloqueo de por vida (los founder no pagan nada), o bien, si decides que no es para ti, cierras la cuenta. No hay una versión gratuita recortada que se queda ahí a medias: o FitMesh te resulta útil y lo conservas por un precio pequeño, o lo dejas y tus datos se eliminan. Es una elección honesta, y es justo el motivo por el que la prueba es completa: queremos que decidas con la app de verdad delante, después de ver [tus smartwatches unidos sin datos duplicados](/es/blog/piu-smartwatch-insieme-dati-doppi) en el dashboard, no con promesas.",
        de: "Am Ende der 14 Tage entscheidest du, wie es weitergeht, ohne Fallen: Du behältst FitMesh mit einem kleinen Abo oder mit der Freischaltung auf Lebenszeit (founder zahlen nichts), oder, falls du entscheidest, dass es nichts für dich ist, schließt du das Konto. Es gibt keine halbierte Gratisversion, die halb funktionierend herumsteht: Entweder ist FitMesh für dich nützlich und du behältst es zu einem kleinen Preis, oder du lässt es los und deine Daten werden entfernt. Das ist eine ehrliche Entscheidung, und genau darum ist die Testphase vollständig: Wir möchten, dass du mit der echten App vor dir entscheidest, nachdem du [deine Smartwatches ohne doppelte Daten zusammengeführt](/de/blog/piu-smartwatch-insieme-dati-doppi) im Dashboard gesehen hast, nicht aufgrund von Versprechen.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa include il Pro",
        en: "What Pro includes",
        es: "Qué incluye el Pro",
        de: "Was Pro umfasst",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il Pro è tutto FitMesh, senza livelli confusi. In pratica sblocca la dashboard web unificata, l'unione di tutti i wearable con la deduplica, lo storico completo e la lettura diretta dell'anello Colmi via Bluetooth. Su Android l'app legge i dati tramite Health Connect e in più legge l'anello Colmi via Bluetooth; l'app iOS è in arrivo e scriverà su Apple Salute. Se vuoi il quadro completo sull'anello, c'è la [guida completa all'anello Colmi](/it/blog/colmi-ring-fitmesh), e per capire come funziona il pannello dal computer trovi la guida a [vedere i dati dei wearable nel browser](/it/blog/vedere-dati-wearable-browser-pc).",
        en: "Pro is all of FitMesh, with no confusing tiers. In practice it unlocks the unified web dashboard, the merging of all your wearables with deduplication, the full history and the direct reading of the Colmi ring over Bluetooth. On Android the app reads data through Health Connect and also reads the Colmi ring over Bluetooth; the iOS app is coming and will write to Apple Health. If you want the full picture on the ring, there's the [complete Colmi ring guide](/en/blog/colmi-ring-fitmesh), and to see how the panel works from a computer there's the guide to [viewing your wearable data in the browser](/en/blog/vedere-dati-wearable-browser-pc).",
        es: "El Pro es todo FitMesh, sin niveles confusos. En la práctica desbloquea el dashboard web unificado, la unión de todos los wearables con la eliminación de duplicados, el historial completo y la lectura directa del anillo Colmi por Bluetooth. En Android la app lee los datos a través de Health Connect y además lee el anillo Colmi por Bluetooth; la app iOS está en camino y escribirá en Apple Health. Si quieres el panorama completo sobre el anillo, tienes la [guía completa del anillo Colmi](/es/blog/colmi-ring-fitmesh), y para entender cómo funciona el panel desde el ordenador encontrarás la guía para [ver los datos de los wearables en el navegador](/es/blog/vedere-dati-wearable-browser-pc).",
        de: "Pro ist ganz FitMesh, ohne verwirrende Stufen. In der Praxis schaltet es das einheitliche Web-Dashboard frei, das Zusammenführen aller Wearables mit Duplikatentfernung, den vollständigen Verlauf und das direkte Auslesen des Colmi-Rings über Bluetooth. Unter Android liest die App die Daten über Health Connect und liest zusätzlich den Colmi-Ring über Bluetooth; die iOS-App kommt bald und wird in Apple Health schreiben. Wenn du den kompletten Überblick über den Ring willst, gibt es den [vollständigen Guide zum Colmi-Ring](/de/blog/colmi-ring-fitmesh), und um zu verstehen, wie das Panel vom Computer aus funktioniert, findest du den Guide zum [Anzeigen der Wearable-Daten im Browser](/de/blog/vedere-dati-wearable-browser-pc).",
      },
    },
    {
      type: "table",
      caption: {
        it: "Cosa sblocca il Pro (e il posto founder) in FitMesh Sync",
        en: "What Pro (and the founder spot) unlocks in FitMesh Sync",
        es: "Qué desbloquea el Pro (y la plaza founder) en FitMesh Sync",
        de: "Was Pro (und der founder-Platz) in FitMesh Sync freischaltet",
      },
      headers: {
        it: ["Funzione", "Cosa fa"],
        en: ["Feature", "What it does"],
        es: ["Función", "Qué hace"],
        de: ["Funktion", "Was sie macht"],
      },
      rows: [
        {
          it: ["Dashboard web", "Apri i tuoi dati da qualsiasi browser con lo stesso account"],
          en: ["Web dashboard", "Open your data from any browser with the same account"],
          es: ["Dashboard web", "Abre tus datos desde cualquier navegador con la misma cuenta"],
          de: ["Web-Dashboard", "Öffne deine Daten von jedem Browser aus mit demselben Konto"],
        },
        {
          it: ["Tutti i wearable uniti", "Health Connect e anello Colmi in un unico pannello, deduplicati"],
          en: ["All wearables merged", "Health Connect and the Colmi ring in one panel, deduplicated"],
          es: ["Todos los wearables unidos", "Health Connect y el anillo Colmi en un único panel, sin duplicados"],
          de: ["Alle Wearables zusammengeführt", "Health Connect und Colmi-Ring in einem einzigen Panel, ohne Duplikate"],
        },
        {
          it: ["Storico completo", "La cronologia dei tuoi dati resta salvata sul tuo account"],
          en: ["Full history", "Your data history stays saved on your account"],
          es: ["Historial completo", "El historial de tus datos permanece guardado en tu cuenta"],
          de: ["Vollständiger Verlauf", "Der Verlauf deiner Daten bleibt in deinem Konto gespeichert"],
        },
        {
          it: ["Anello Colmi via Bluetooth", "Passi, battito, SpO2, sonno con fasi, stress, batteria"],
          en: ["Colmi ring over Bluetooth", "Steps, heart rate, SpO2, sleep with stages, stress, battery"],
          es: ["Anillo Colmi por Bluetooth", "Pasos, ritmo cardíaco, SpO2, sueño con fases, estrés, batería"],
          de: ["Colmi-Ring über Bluetooth", "Schritte, Herzfrequenz, SpO2, Schlaf mit Phasen, Stress, Akku"],
        },
        {
          it: ["Dati nel cloud in UE", "Sul tuo account, non sui server del produttore del dispositivo"],
          en: ["Data in the EU cloud", "On your account, not on the device maker's servers"],
          es: ["Datos en la nube en la UE", "En tu cuenta, no en los servidores del fabricante del dispositivo"],
          de: ["Daten in der EU-Cloud", "In deinem Konto, nicht auf den Servern des Geräteherstellers"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Founder o prova: le differenze",
        en: "Founder vs trial: the differences",
        es: "Founder o prueba: las diferencias",
        de: "Founder oder Testphase: die Unterschiede",
      },
    },
    {
      type: "comparison",
      aTitle: {
        it: "Posto founder (primi 1000)",
        en: "Founder spot (first 1,000)",
        es: "Plaza founder (primeros 1000)",
        de: "Founder-Platz (erste 1000)",
      },
      aItems: {
        it: [
          "Pro a vita, gratis, senza scadenza.",
          "Tutte le funzioni attuali e future incluse.",
          "Nessun abbonamento da pagare, mai.",
          "Posti limitati: finiscono e non tornano.",
        ],
        en: [
          "Pro for life, free, with no expiry.",
          "Every current and future feature included.",
          "No subscription to pay, ever.",
          "Limited spots: once gone, they don't return.",
        ],
        es: [
          "Pro de por vida, gratis, sin caducidad.",
          "Todas las funciones actuales y futuras incluidas.",
          "Ninguna suscripción que pagar, nunca.",
          "Plazas limitadas: se acaban y no vuelven.",
        ],
        de: [
          "Pro auf Lebenszeit, gratis, ohne Ablaufdatum.",
          "Alle aktuellen und künftigen Funktionen inklusive.",
          "Kein Abo zu bezahlen, niemals.",
          "Begrenzte Plätze: Sind sie weg, kommen sie nicht zurück.",
        ],
      },
      bTitle: {
        it: "Prova di 14 giorni (tutti gli altri)",
        en: "14-day trial (everyone else)",
        es: "Prueba de 14 días (todos los demás)",
        de: "14-Tage-Testphase (alle anderen)",
      },
      bItems: {
        it: [
          "Ogni funzione Pro sbloccata per 14 giorni.",
          "Nessuna carta di credito richiesta per iniziare.",
          "Dopo: un piccolo abbonamento o lo sblocco a vita (o chiudi l'account).",
          "Sempre disponibile, anche a posti founder esauriti.",
        ],
        en: [
          "Every Pro feature unlocked for 14 days.",
          "No credit card required to start.",
          "After: a small subscription or a lifetime unlock (or you close the account).",
          "Always available, even once founder spots are gone.",
        ],
        es: [
          "Todas las funciones Pro desbloqueadas durante 14 días.",
          "Sin tarjeta de crédito para empezar.",
          "Después: una pequeña suscripción o el desbloqueo de por vida (o cierras la cuenta).",
          "Siempre disponible, incluso con las plazas founder agotadas.",
        ],
        de: [
          "Alle Pro-Funktionen 14 Tage lang freigeschaltet.",
          "Keine Kreditkarte nötig, um zu starten.",
          "Danach: ein kleines Abo oder die Freischaltung auf Lebenszeit (oder du schließt das Konto).",
          "Immer verfügbar, auch wenn die founder-Plätze vergeben sind.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il lavoro dietro un prezzo così piccolo",
        en: "The work behind such a small price",
        es: "El trabajo detrás de un precio tan pequeño",
        de: "Die Arbeit hinter einem so kleinen Preis",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Dietro quel caffè ogni sei mesi c'è parecchio lavoro. FitMesh nasce da un lavoro artigianale di ricerca e integrazione: leggere decine di wearable diversi e l'anello Colmi via Bluetooth, capire i formati di ogni produttore, e far combaciare i dati con un sistema di deduplica perché lo stesso passo non venga contato due volte. A questo si aggiungono i server in UE (che hanno un costo), lo sviluppo continuo di nuove integrazioni e dell'app iOS, e la scelta di non mostrare pubblicità e di non vendere i tuoi dati: puoi leggere come li trattiamo nella guida su [GDPR e dati fitness](/it/blog/gdpr-dati-fitness-smartwatch). Ecco perché non esiste un \"gratis per sempre\": quel gratis, nelle app che lo offrono, quasi sempre lo paghi altrove, con la pubblicità o con i tuoi dati. Un prezzo piccolo, chiaro e onesto è ciò che tiene il progetto vivo e indipendente. E resta piccolo davvero: un caffè ogni sei mesi, o una pizza saltata una volta sola.",
        en: "Behind that coffee every six months there's a lot of work. FitMesh is the result of hands-on research and integration: reading dozens of different wearables and the Colmi ring over Bluetooth, making sense of each maker's data formats, and lining the data up with a deduplication system so the same step is never counted twice. On top of that come the EU servers (which cost money), the ongoing development of new integrations and the iOS app, and the choice to show no ads and never sell your data: you can read how we handle it in the guide on [GDPR and fitness data](/en/blog/gdpr-dati-fitness-smartwatch). That's why there's no \"free forever\": in the apps that offer it, that free is almost always paid for elsewhere, with ads or with your data. A small, clear, honest price is what keeps the project alive and independent. And it really does stay small: a coffee every six months, or one pizza skipped just once.",
        es: "Detrás de ese café cada seis meses hay bastante trabajo. FitMesh nace de una labor artesanal de investigación e integración: leer decenas de wearables distintos y el anillo Colmi por Bluetooth, entender los formatos de cada fabricante y hacer que los datos encajen con un sistema de eliminación de duplicados para que el mismo paso no se cuente dos veces. A esto se suman los servidores en la UE (que tienen un coste), el desarrollo continuo de nuevas integraciones y de la app iOS, y la decisión de no mostrar publicidad ni vender tus datos: puedes leer cómo los tratamos en la guía sobre [GDPR y datos fitness](/es/blog/gdpr-dati-fitness-smartwatch). Por eso no existe un \"gratis para siempre\": ese gratis, en las apps que lo ofrecen, casi siempre lo pagas en otro sitio, con la publicidad o con tus datos. Un precio pequeño, claro y honesto es lo que mantiene el proyecto vivo e independiente. Y de verdad sigue siendo pequeño: un café cada seis meses, o una pizza que te saltas una sola vez.",
        de: "Hinter diesem Kaffee alle sechs Monate steckt eine Menge Arbeit. FitMesh entsteht aus sorgfältiger Recherche- und Integrationsarbeit: Dutzende verschiedener Wearables und den Colmi-Ring über Bluetooth auslesen, die Datenformate jedes Herstellers verstehen und die Daten mit einem System zur Duplikatentfernung in Einklang bringen, damit derselbe Schritt nicht zweimal gezählt wird. Dazu kommen die EU-Server (die Geld kosten), die laufende Entwicklung neuer Integrationen und der iOS-App sowie die Entscheidung, keine Werbung zu zeigen und deine Daten nicht zu verkaufen: Wie wir damit umgehen, kannst du im Guide zu [DSGVO und Fitnessdaten](/de/blog/gdpr-dati-fitness-smartwatch) nachlesen. Deshalb gibt es kein \"für immer gratis\": Dieses Gratis bezahlst du bei den Apps, die es anbieten, fast immer woanders, mit Werbung oder mit deinen Daten. Ein kleiner, klarer und ehrlicher Preis ist es, was das Projekt lebendig und unabhängig hält. Und es bleibt wirklich klein: ein Kaffee alle sechs Monate oder eine Pizza, die man sich ein einziges Mal spart.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Quanto costa il Pro? Meno di quanto pensi",
        en: "How much is Pro? Less than you'd think",
        es: "¿Cuánto cuesta el Pro? Menos de lo que crees",
        de: "Was kostet Pro? Weniger, als du denkst",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Qui sta la sorpresa: il Pro costa pochissimo, e scegli tu come pagarlo. Puoi prendere un abbonamento leggero, circa un caffè ogni sei mesi (al lancio €1,19 ogni sei mesi), oppure lo sblocco a vita una tantum, che non arriva al prezzo di una pizza (al lancio €3,99 su Android, €4,99 su iPhone). Non sei costretto al ricorrente: se preferisci, paghi una volta e resti Pro per sempre. Il prezzo aggiornato per il tuo Paese è sempre mostrato nell'app al momento dell'iscrizione. E se prendi un posto founder, per te è zero, per sempre. L'app Android e la dashboard web sono disponibili ora; l'app iOS è in arrivo (in revisione sull'App Store).",
        en: "Here's the surprise: Pro costs very little, and you choose how to pay for it. You can take a light subscription, less than a coffee every six months (at launch €1.19 every six months), or a one-time lifetime unlock that doesn't even reach the price of a pizza (at launch €3.99 on Android, €4.99 on iPhone). You're not forced into a recurring plan: if you prefer, you pay once and stay Pro forever. The current price for your country is always shown in the app when you sign up. And if you grab a founder spot, it's zero for you, forever. The Android app and the web dashboard are available now; the iOS app is coming (in App Store review).",
        es: "Aquí está la sorpresa: el Pro cuesta muy poco, y eliges tú cómo pagarlo. Puedes coger una suscripción ligera, como un café cada seis meses (en el lanzamiento 1,19 € cada seis meses), o el desbloqueo de por vida de una sola vez, que no llega al precio de una pizza (en el lanzamiento 3,99 € en Android, 4,99 € en iPhone). No estás obligado a lo recurrente: si lo prefieres, pagas una vez y sigues siendo Pro para siempre. El precio actualizado para tu país siempre se muestra en la app en el momento de registrarte. Y si consigues una plaza founder, para ti es cero, para siempre. La app Android y el dashboard web están disponibles ahora; la app iOS está en camino (en revisión en el App Store).",
        de: "Hier kommt die Überraschung: Pro kostet sehr wenig, und du entscheidest, wie du es bezahlst. Du kannst ein leichtes Abo nehmen, weniger als ein Kaffee alle sechs Monate (zum Start 1,19 € alle sechs Monate), oder die einmalige Freischaltung auf Lebenszeit, die nicht einmal den Preis einer Pizza erreicht (zum Start 3,99 € unter Android, 4,99 € auf dem iPhone). Du bist nicht zum Abo gezwungen: Wenn du möchtest, zahlst du einmal und bleibst für immer Pro. Der aktuelle Preis für dein Land wird in der App immer bei der Anmeldung angezeigt. Und wenn du dir einen founder-Platz sicherst, ist es für dich null, für immer. Die Android-App und das Web-Dashboard sind jetzt verfügbar; die iOS-App kommt bald (in Prüfung im App Store).",
      },
    },
    {
      type: "cta",
      title: {
        it: "Prenditi un posto founder finché ci sono",
        en: "Grab a founder spot while they last",
        es: "Consigue una plaza founder mientras queden",
        de: "Sichere dir einen founder-Platz, solange es welche gibt",
      },
      body: {
        it: "I 1000 posti founder danno il Pro a vita, gratis: dashboard web, tutti i wearable uniti, storico completo e anello Colmi. L'app Android è già sul Play Store, l'iOS è in arrivo. Iscriviti alla beta e assicurati il posto prima che finiscano.",
        en: "The 1,000 founder spots grant Pro for life, free: web dashboard, all wearables merged, full history and the Colmi ring. The Android app is already on the Play Store, iOS is coming. Sign up for the beta and secure your spot before they're gone.",
        es: "Las 1000 plazas founder dan el Pro de por vida, gratis: dashboard web, todos los wearables unidos, historial completo y anillo Colmi. La app Android ya está en el Play Store, la de iOS está en camino. Apúntate a la beta y asegúrate la plaza antes de que se acaben.",
        de: "Die 1000 founder-Plätze geben Pro auf Lebenszeit, gratis: Web-Dashboard, alle Wearables zusammengeführt, vollständiger Verlauf und Colmi-Ring. Die Android-App ist schon im Play Store, die iOS-App kommt bald. Melde dich für die Beta an und sichere dir den Platz, bevor sie weg sind.",
      },
      ctaLabel: {
        it: "Diventa founder →",
        en: "Become a founder →",
        es: "Hazte founder →",
        de: "Werde founder →",
      },
      ctaHref: {
        it: "/it/beta",
        en: "/en/beta",
        es: "/es/beta",
        de: "/de/beta",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "In sintesi",
        en: "In summary",
        es: "En resumen",
        de: "Zusammengefasst",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "FitMesh non ha un piano gratuito permanente: è la cosa da sapere prima di installare.",
          "Primi 1000 iscritti = founder con Pro a vita gratis, incluse le funzioni future.",
          "Tutti gli altri = prova completa di 14 giorni, ogni funzione Pro sbloccata.",
          "Dopo i 14 giorni: un piccolo abbonamento (circa un caffè ogni sei mesi) o lo sblocco a vita (meno di una pizza), oppure chiudi l'account.",
          "Il Pro include dashboard web, wearable uniti e deduplicati, storico completo e anello Colmi via Bluetooth.",
          "Costa pochissimo: un caffè ogni sei mesi o meno di una pizza a vita, e il prezzo del tuo Paese è nell'app; per i founder è zero, per sempre.",
        ],
        en: [
          "FitMesh has no permanent free plan: that's the thing to know before installing.",
          "First 1,000 sign-ups = founders with lifetime Pro for free, future features included.",
          "Everyone else = a full 14-day trial with every Pro feature unlocked.",
          "After 14 days: a small subscription (about a coffee every six months) or a lifetime unlock (less than a pizza), or you close the account.",
          "Pro includes the web dashboard, merged and deduplicated wearables, full history and the Colmi ring over Bluetooth.",
          "It costs very little: a coffee every six months or less than a pizza for lifetime, with your country's price in the app; for founders it's zero, forever.",
        ],
        es: [
          "FitMesh no tiene un plan gratuito permanente: es lo que hay que saber antes de instalar.",
          "Primeros 1000 registrados = founder con Pro de por vida gratis, funciones futuras incluidas.",
          "Todos los demás = prueba completa de 14 días, todas las funciones Pro desbloqueadas.",
          "Después de los 14 días: una pequeña suscripción (como un café cada seis meses) o el desbloqueo de por vida (menos que una pizza), o bien cierras la cuenta.",
          "El Pro incluye el dashboard web, wearables unidos y sin duplicados, historial completo y anillo Colmi por Bluetooth.",
          "Cuesta muy poco: un café cada seis meses o menos que una pizza de por vida, y el precio de tu país está en la app; para los founder es cero, para siempre.",
        ],
        de: [
          "FitMesh hat keinen dauerhaft kostenlosen Plan: Das sollte man vor der Installation wissen.",
          "Erste 1000 Anmeldungen = founder mit Pro auf Lebenszeit gratis, künftige Funktionen inklusive.",
          "Alle anderen = vollständige 14-tägige Testphase, alle Pro-Funktionen freigeschaltet.",
          "Nach den 14 Tagen: ein kleines Abo (weniger als ein Kaffee alle sechs Monate) oder die Freischaltung auf Lebenszeit (weniger als eine Pizza), oder du schließt das Konto.",
          "Pro umfasst das Web-Dashboard, zusammengeführte und duplikatfreie Wearables, den vollständigen Verlauf und den Colmi-Ring über Bluetooth.",
          "Es kostet sehr wenig: ein Kaffee alle sechs Monate oder weniger als eine Pizza auf Lebenszeit, und der Preis für dein Land steht in der App; für founder ist es null, für immer.",
        ],
      },
    },
  ],
  faq: [
    {
      q: {
        it: "FitMesh è gratis?",
        en: "Is FitMesh free?",
        es: "¿FitMesh es gratis?",
        de: "Ist FitMesh kostenlos?",
      },
      a: {
        it: "Non esiste un piano gratuito permanente, ma costa pochissimo. I primi 1000 iscritti diventano founder e ottengono il Pro a vita gratis; tutti gli altri hanno 14 giorni di prova completa, poi tengono FitMesh con un abbonamento leggero (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza), oppure chiudono l'account.",
        en: "There is no permanent free plan, but it costs very little. The first 1,000 sign-ups become founders and get Pro for life for free; everyone else gets a full 14-day trial, then keeps FitMesh with a light subscription (about a coffee every six months) or a lifetime unlock (less than a pizza), or closes the account.",
        es: "No existe un plan gratuito permanente, pero cuesta muy poco. Los primeros 1000 registrados se convierten en founder y obtienen el Pro de por vida gratis; todos los demás tienen 14 días de prueba completa y luego conservan FitMesh con una suscripción ligera (como un café cada seis meses) o con el desbloqueo de por vida (menos que una pizza), o bien cierran la cuenta.",
        de: "Es gibt keinen dauerhaft kostenlosen Plan, aber es kostet sehr wenig. Die ersten 1000 Anmeldungen werden founder und erhalten Pro auf Lebenszeit gratis; alle anderen bekommen eine vollständige 14-tägige Testphase und behalten FitMesh dann mit einem leichten Abo (weniger als ein Kaffee alle sechs Monate) oder mit der Freischaltung auf Lebenszeit (weniger als eine Pizza), oder sie schließen das Konto.",
      },
    },
    {
      q: {
        it: "Cosa succede dopo i 14 giorni di prova?",
        en: "What happens after the 14-day trial?",
        es: "¿Qué pasa después de los 14 días de prueba?",
        de: "Was passiert nach den 14 Tagen Testphase?",
      },
      a: {
        it: "Scegli come continuare: tieni FitMesh con un piccolo abbonamento (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza), e i founder non pagano nulla. Se invece decidi che non fa per te, chiudi l'account e i tuoi dati vengono rimossi. Non c'è una versione gratuita dimezzata.",
        en: "You choose how to carry on: keep FitMesh with a small subscription (about a coffee every six months) or a lifetime unlock (less than a pizza), and founders pay nothing. If instead you decide it's not for you, you close the account and your data is removed. There's no reduced free version.",
        es: "Eliges cómo continuar: conservas FitMesh con una pequeña suscripción (como un café cada seis meses) o con el desbloqueo de por vida (menos que una pizza), y los founder no pagan nada. Si en cambio decides que no es para ti, cierras la cuenta y tus datos se eliminan. No hay una versión gratuita recortada.",
        de: "Du entscheidest, wie es weitergeht: Du behältst FitMesh mit einem kleinen Abo (weniger als ein Kaffee alle sechs Monate) oder mit der Freischaltung auf Lebenszeit (weniger als eine Pizza), und founder zahlen nichts. Falls du stattdessen entscheidest, dass es nichts für dich ist, schließt du das Konto und deine Daten werden entfernt. Es gibt keine halbierte Gratisversion.",
      },
    },
    {
      q: {
        it: "Come divento founder?",
        en: "How do I become a founder?",
        es: "¿Cómo me hago founder?",
        de: "Wie werde ich founder?",
      },
      a: {
        it: "Ti iscrivi alla beta da /it/beta con l'app Android (già sul Play Store) o entri in lista per iOS. I posti sono 1000 e legati al tuo account: una volta founder, resti founder. Non serve la carta di credito per registrarti.",
        en: "You sign up for the beta at /en/beta with the Android app (already on the Play Store) or join the iOS list. There are 1,000 spots, tied to your account: once a founder, always a founder. No credit card is needed to register.",
        es: "Te apuntas a la beta en /es/beta con la app Android (ya en el Play Store) o entras en la lista para iOS. Las plazas son 1000 y están ligadas a tu cuenta: una vez founder, sigues siendo founder. No hace falta tarjeta de crédito para registrarte.",
        de: "Du meldest dich unter /de/beta für die Beta an, mit der Android-App (schon im Play Store), oder du trägst dich in die Liste für iOS ein. Es gibt 1000 Plätze, an dein Konto gebunden: Einmal founder, immer founder. Für die Registrierung ist keine Kreditkarte nötig.",
      },
    },
    {
      q: {
        it: "Quanto costa il Pro?",
        en: "How much does Pro cost?",
        es: "¿Cuánto cuesta el Pro?",
        de: "Was kostet Pro?",
      },
      a: {
        it: "Pochissimo, e scegli tu come pagarlo: al lancio un abbonamento leggero di €1,19 ogni sei mesi (circa un caffè) oppure lo sblocco a vita a €3,99 su Android e €4,99 su iPhone (meno di una pizza, una volta sola). Il prezzo aggiornato per il tuo Paese è sempre mostrato nell'app. Per i founder è zero, per sempre.",
        en: "Very little, and you choose how to pay: at launch a light subscription of €1.19 every six months (about a coffee) or a one-time lifetime unlock at €3.99 on Android and €4.99 on iPhone (less than a pizza, once). The current price for your country is always shown in the app. For founders it's zero, forever.",
        es: "Muy poco, y eliges tú cómo pagarlo: en el lanzamiento una suscripción ligera de 1,19 € cada seis meses (como un café) o el desbloqueo de por vida a 3,99 € en Android y 4,99 € en iPhone (menos que una pizza, una sola vez). El precio actualizado para tu país siempre se muestra en la app. Para los founder es cero, para siempre.",
        de: "Sehr wenig, und du entscheidest, wie du zahlst: zum Start ein leichtes Abo von 1,19 € alle sechs Monate (weniger als ein Kaffee) oder die Freischaltung auf Lebenszeit für 3,99 € unter Android und 4,99 € auf dem iPhone (weniger als eine Pizza, ein einziges Mal). Der aktuelle Preis für dein Land wird immer in der App angezeigt. Für founder ist es null, für immer.",
      },
    },
    {
      q: {
        it: "Posso disdire l'abbonamento?",
        en: "Can I cancel the subscription?",
        es: "¿Puedo cancelar la suscripción?",
        de: "Kann ich das Abo kündigen?",
      },
      a: {
        it: "Sì. Se scegli l'abbonamento, lo gestisci e lo disdici dallo store da cui l'hai attivato (Google Play, e App Store quando l'app iOS sarà disponibile), come qualsiasi altro abbonamento. Se invece scegli lo sblocco a vita, paghi una volta sola e non c'è nulla da rinnovare o disdire. I founder non hanno alcun abbonamento.",
        en: "Yes. If you pick the subscription, you manage and cancel it from the store where you activated it (Google Play, and the App Store once the iOS app is available), like any other subscription. If you pick the lifetime unlock, you pay once and there's nothing to renew or cancel. Founders have no subscription at all.",
        es: "Sí. Si eliges la suscripción, la gestionas y la cancelas desde la tienda en la que la activaste (Google Play, y App Store cuando la app iOS esté disponible), como cualquier otra suscripción. Si en cambio eliges el desbloqueo de por vida, pagas una sola vez y no hay nada que renovar ni cancelar. Los founder no tienen ninguna suscripción.",
        de: "Ja. Wenn du das Abo wählst, verwaltest und kündigst du es in dem Store, in dem du es aktiviert hast (Google Play und App Store, sobald die iOS-App verfügbar ist), wie jedes andere Abo. Wenn du stattdessen die Freischaltung auf Lebenszeit wählst, zahlst du einmalig und es gibt nichts zu verlängern oder zu kündigen. Founder haben gar kein Abo.",
      },
    },
  ],
  related: [
    "colmi-ring-fitmesh",
    "fitmesh-arriva-su-iphone",
    "piu-smartwatch-insieme-dati-doppi",
    "vedere-dati-wearable-browser-pc",
    "guida-sync-wearable-2026",
  ],
  brandsMentioned: ["Colmi"],
  ldType: "BlogPosting",
};
