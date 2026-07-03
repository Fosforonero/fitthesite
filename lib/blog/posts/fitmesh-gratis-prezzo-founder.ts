import type { BlogPost } from "../types";

/**
 * BOFU pricing page: risponde a "FitMesh è gratis / quanto costa" prima
 * dell'installazione. Articolo chiave per i ricavi: onestà sul modello
 * (niente free tier permanente), gancio founder (primi 1000 = Pro a vita),
 * prova 14 giorni, cosa include il Pro. CTA a /beta.
 * Solo it/en: gli altri locali si aggiungono dopo.
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
  },
  primaryKeyword: {
    it: "fitmesh è gratis",
    en: "is fitmesh free",
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
  },
  metaDescription: {
    it: "FitMesh è gratis? Niente piano gratuito permanente: primi 1000 founder col Pro a vita gratis, per gli altri prova completa di 14 giorni poi abbonamento. Ecco come funziona.",
    en: "Is FitMesh free? No permanent free plan: the first 1,000 founders get lifetime Pro free, everyone else gets a full 14-day trial then a Pro subscription. Here's how it works.",
  },
  hero: {
    kicker: {
      it: "Guida prezzi",
      en: "Pricing guide",
    },
    title: {
      it: "FitMesh è gratis? Prezzo, prova di 14 giorni e posti founder",
      en: "Is FitMesh free? Pricing, the 14-day trial and founder spots",
    },
    subtitle: {
      it: "La risposta onesta prima di installare: non esiste un piano gratuito per sempre, ma i primi 1000 iscritti ottengono il Pro a vita gratis e tutti gli altri hanno 14 giorni di prova completa. Ecco esattamente come funziona il prezzo e cosa include il Pro.",
      en: "The honest answer before you install: there's no free-forever plan, but the first 1,000 sign-ups get lifetime Pro for free and everyone else gets a full 14-day trial. Here's exactly how pricing works and what Pro includes.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Se stai cercando \"FitMesh è gratis\" prima di installare, ecco la risposta diretta e senza giri di parole: non esiste un piano gratuito permanente, ma ci sono due modi concreti per usare FitMesh Sync senza spendere nulla oggi. Il primo sono i 1000 posti founder, che danno il Pro a vita gratis. Il secondo è la prova completa di 14 giorni, aperta a tutti, con ogni funzione sbloccata. Alla fine della prova scegli come tenerlo: un piccolo abbonamento o lo sblocco a vita, oppure chiudi l'account. In questa guida spieghiamo esattamente quanto costa (poco), il lavoro che c'è dietro, cosa include il Pro e come tenerti un posto founder finché ci sono.",
        en: "If you're searching for \"is FitMesh free\" before installing, here's the direct answer with no spin: there is no permanent free plan, but there are two concrete ways to use FitMesh Sync without paying anything today. The first is the 1,000 founder spots, which grant Pro for life for free. The second is the full 14-day trial, open to everyone, with every feature unlocked. At the end of the trial you choose how to keep it: a small subscription or a lifetime unlock, or you close the account. This guide explains exactly how little it costs, the work behind it, what Pro includes, and how to keep a founder spot while they last.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Risposta rapida",
        en: "Quick answer",
      },
      body: {
        it: "FitMesh non ha un piano gratuito per sempre, ma costa pochissimo. I primi 1000 iscritti diventano founder e ottengono il Pro a vita, gratis. Tutti gli altri hanno 14 giorni di prova completa, poi tengono FitMesh con un abbonamento leggero (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza). Il prezzo aggiornato per il tuo Paese è mostrato nell'app.",
        en: "FitMesh has no free-forever plan, but it costs very little. The first 1,000 sign-ups become founders and get Pro for life, free. Everyone else gets a full 14-day trial, then keeps FitMesh with a light subscription (about a coffee every six months) or a one-time lifetime unlock (less than a pizza). The current price for your country is shown in the app.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "FitMesh è gratis? La risposta onesta",
        en: "Is FitMesh free? The honest answer",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Molte app di questo tipo promettono \"gratis per sempre\" e poi si finanziano vendendo i dati o riempiendo lo schermo di pubblicità. FitMesh fa il contrario: i tuoi dati salute restano sul tuo account nel cloud in UE, non li vendiamo e non mostriamo pubblicità. Leggere i dati dai tuoi wearable, deduplicarli (lo stesso passo non contato due volte) e mostrarli in un pannello web unico ha un costo reale di gestione. Per questo il modello è semplice e trasparente: chi arriva presto viene premiato con il Pro a vita gratis (i posti founder), tutti gli altri provano l'app completa per 14 giorni e poi decidono se il Pro vale il prezzo di un abbonamento. Nessuna versione dimezzata che ti tiene in ostaggio, nessun costo nascosto.",
        en: "Plenty of apps in this space promise \"free forever\" and then fund themselves by selling your data or filling the screen with ads. FitMesh does the opposite: your health data stays on your account in the EU cloud, we don't sell it and we don't show ads. Reading data from your wearables, deduplicating it (the same step never counted twice) and showing it in one unified web panel has a real running cost. That's why the model is simple and transparent: early adopters are rewarded with lifetime Pro for free (the founder spots), everyone else tries the full app for 14 days and then decides whether Pro is worth the price of a subscription. No crippled tier holding you hostage, no hidden fees.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "1000 posti founder: Pro a vita, gratis",
        en: "1,000 founder spots: Pro for life, free",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "L'offerta più forte è anche la più semplice: i primi 1000 iscritti diventano founder e ricevono il Pro a vita, gratis. Non una prova lunga, non uno sconto: accesso completo senza scadenza. È il modo con cui ringraziamo chi crede nel progetto quando è ancora all'inizio. I posti sono 1000 e non uno di più: quando finiscono, l'offerta founder si chiude e restano solo la prova e l'abbonamento. Diventare founder oggi significa non pagare mai l'abbonamento in futuro, incluse le funzioni che arriveranno.",
        en: "The strongest offer is also the simplest: the first 1,000 sign-ups become founders and get Pro for life, free. Not a long trial, not a discount: full access with no expiry. It's how we thank the people who back the project while it's still early. There are 1,000 spots and not one more: once they're gone, the founder offer closes and only the trial and the subscription remain. Becoming a founder today means never paying for the subscription in the future, including the features still to come.",
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
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Come diventare founder",
        en: "How to become a founder",
      },
      body: {
        it: "Per prendere un posto founder ti iscrivi alla beta da /it/beta: scarichi l'app Android (già sul Play Store) o entri in lista per iOS (in arrivo). Il posto è legato al tuo account: una volta founder, resti founder. Non serve la carta di credito per registrarti.",
        en: "To claim a founder spot you sign up for the beta at /en/beta: install the Android app (already on the Play Store) or join the list for iOS (coming soon). The spot is tied to your account: once a founder, always a founder. No credit card needed to register.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Niente più posti founder? Prova completa di 14 giorni",
        en: "Founder spots gone? A full 14-day trial",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se i 1000 posti founder sono esauriti quando arrivi, non resti fuori: hai 14 giorni di prova completa. \"Completa\" significa che durante la prova ogni funzione Pro è sbloccata, esattamente come per un founder. Colleghi i tuoi wearable, apri la dashboard web, guardi lo storico, provi l'anello Colmi via Bluetooth: tutto attivo, senza limiti artificiali. I 14 giorni servono a farti valutare l'app sui tuoi dati veri, non su una demo preconfezionata. È il modo più giusto per capire se FitMesh fa quello che ti serve prima di decidere.",
        en: "If the 1,000 founder spots are gone by the time you arrive, you're not left out: you get a full 14-day trial. \"Full\" means every Pro feature is unlocked during the trial, exactly like it is for a founder. You connect your wearables, open the web dashboard, look at your history, try the Colmi ring over Bluetooth: everything on, no artificial limits. The 14 days let you evaluate the app on your real data, not on a canned demo. It's the fairest way to see whether FitMesh does what you need before you decide.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa succede dopo i 14 giorni",
        en: "What happens after the 14 days",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Alla fine dei 14 giorni scegli come continuare, senza trappole: tieni FitMesh con un piccolo abbonamento o con lo sblocco a vita (i founder non pagano nulla), oppure, se decidi che non fa per te, chiudi l'account. Non c'è una versione gratuita dimezzata che resta lì a metà: o FitMesh ti è utile e lo tieni a un prezzo piccolo, o lo lasci e i tuoi dati vengono rimossi. È una scelta onesta, ed è proprio il motivo per cui la prova è completa: vogliamo che tu decida con l'app vera davanti, dopo aver visto [i tuoi smartwatch uniti senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi) nella dashboard, non su promesse.",
        en: "At the end of the 14 days you choose how to carry on, with no traps: keep FitMesh with a small subscription or a one-time lifetime unlock (founders pay nothing), or, if you decide it's not for you, close the account. There's no reduced free version sitting there half-working: either FitMesh is useful to you and you keep it for a small price, or you let it go and your data is removed. It's an honest choice, and it's exactly why the trial is full: we want you to decide with the real app in front of you, after seeing [your smartwatches merged with no double data](/en/blog/piu-smartwatch-insieme-dati-doppi) in the dashboard, not on promises.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa include il Pro",
        en: "What Pro includes",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il Pro è tutto FitMesh, senza livelli confusi. In pratica sblocca la dashboard web unificata, l'unione di tutti i wearable con la deduplica, lo storico completo e la lettura diretta dell'anello Colmi via Bluetooth. Su Android l'app legge i dati tramite Health Connect e in più legge l'anello Colmi via Bluetooth; l'app iOS è in arrivo e scriverà su Apple Salute. Se vuoi il quadro completo sull'anello, c'è la [guida completa all'anello Colmi](/it/blog/colmi-ring-fitmesh), e per capire come funziona il pannello dal computer trovi la guida a [vedere i dati dei wearable nel browser](/it/blog/vedere-dati-wearable-browser-pc).",
        en: "Pro is all of FitMesh, with no confusing tiers. In practice it unlocks the unified web dashboard, the merging of all your wearables with deduplication, the full history and the direct reading of the Colmi ring over Bluetooth. On Android the app reads data through Health Connect and also reads the Colmi ring over Bluetooth; the iOS app is coming and will write to Apple Health. If you want the full picture on the ring, there's the [complete Colmi ring guide](/en/blog/colmi-ring-fitmesh), and to see how the panel works from a computer there's the guide to [viewing your wearable data in the browser](/en/blog/vedere-dati-wearable-browser-pc).",
      },
    },
    {
      type: "table",
      caption: {
        it: "Cosa sblocca il Pro (e il posto founder) in FitMesh Sync",
        en: "What Pro (and the founder spot) unlocks in FitMesh Sync",
      },
      headers: {
        it: ["Funzione", "Cosa fa"],
        en: ["Feature", "What it does"],
      },
      rows: [
        {
          it: ["Dashboard web", "Apri i tuoi dati da qualsiasi browser con lo stesso account"],
          en: ["Web dashboard", "Open your data from any browser with the same account"],
        },
        {
          it: ["Tutti i wearable uniti", "Health Connect e anello Colmi in un unico pannello, deduplicati"],
          en: ["All wearables merged", "Health Connect and the Colmi ring in one panel, deduplicated"],
        },
        {
          it: ["Storico completo", "La cronologia dei tuoi dati resta salvata sul tuo account"],
          en: ["Full history", "Your data history stays saved on your account"],
        },
        {
          it: ["Anello Colmi via Bluetooth", "Passi, battito, SpO2, sonno con fasi, stress, batteria"],
          en: ["Colmi ring over Bluetooth", "Steps, heart rate, SpO2, sleep with stages, stress, battery"],
        },
        {
          it: ["Dati nel cloud in UE", "Sul tuo account, non sui server del produttore del dispositivo"],
          en: ["Data in the EU cloud", "On your account, not on the device maker's servers"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Founder o prova: le differenze",
        en: "Founder vs trial: the differences",
      },
    },
    {
      type: "comparison",
      aTitle: {
        it: "Posto founder (primi 1000)",
        en: "Founder spot (first 1,000)",
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
      },
      bTitle: {
        it: "Prova di 14 giorni (tutti gli altri)",
        en: "14-day trial (everyone else)",
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
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il lavoro dietro un prezzo così piccolo",
        en: "The work behind such a small price",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Dietro quel caffè ogni sei mesi c'è parecchio lavoro. FitMesh nasce da un lavoro artigianale di ricerca e integrazione: leggere decine di wearable diversi e l'anello Colmi via Bluetooth, capire i formati di ogni produttore, e far combaciare i dati con un sistema di deduplica perché lo stesso passo non venga contato due volte. A questo si aggiungono i server in UE (che hanno un costo), lo sviluppo continuo di nuove integrazioni e dell'app iOS, e la scelta di non mostrare pubblicità e di non vendere i tuoi dati: puoi leggere come li trattiamo nella guida su [GDPR e dati fitness](/it/blog/gdpr-dati-fitness-smartwatch). Ecco perché non esiste un \"gratis per sempre\": quel gratis, nelle app che lo offrono, quasi sempre lo paghi altrove, con la pubblicità o con i tuoi dati. Un prezzo piccolo, chiaro e onesto è ciò che tiene il progetto vivo e indipendente. E resta piccolo davvero: un caffè ogni sei mesi, o una pizza saltata una volta sola.",
        en: "Behind that coffee every six months there's a lot of work. FitMesh is the result of hands-on research and integration: reading dozens of different wearables and the Colmi ring over Bluetooth, making sense of each maker's data formats, and lining the data up with a deduplication system so the same step is never counted twice. On top of that come the EU servers (which cost money), the ongoing development of new integrations and the iOS app, and the choice to show no ads and never sell your data: you can read how we handle it in the guide on [GDPR and fitness data](/en/blog/gdpr-dati-fitness-smartwatch). That's why there's no \"free forever\": in the apps that offer it, that free is almost always paid for elsewhere, with ads or with your data. A small, clear, honest price is what keeps the project alive and independent. And it really does stay small: a coffee every six months, or one pizza skipped just once.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Quanto costa il Pro? Meno di quanto pensi",
        en: "How much is Pro? Less than you'd think",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Qui sta la sorpresa: il Pro costa pochissimo, e scegli tu come pagarlo. Puoi prendere un abbonamento leggero, circa un caffè ogni sei mesi (al lancio €1,19 ogni sei mesi), oppure lo sblocco a vita una tantum, che non arriva al prezzo di una pizza (al lancio €3,99 su Android, €4,99 su iPhone). Non sei costretto al ricorrente: se preferisci, paghi una volta e resti Pro per sempre. Il prezzo aggiornato per il tuo Paese è sempre mostrato nell'app al momento dell'iscrizione. E se prendi un posto founder, per te è zero, per sempre. L'app Android e la dashboard web sono disponibili ora; l'app iOS è in arrivo (in revisione sull'App Store).",
        en: "Here's the surprise: Pro costs very little, and you choose how to pay for it. You can take a light subscription, less than a coffee every six months (at launch €1.19 every six months), or a one-time lifetime unlock that doesn't even reach the price of a pizza (at launch €3.99 on Android, €4.99 on iPhone). You're not forced into a recurring plan: if you prefer, you pay once and stay Pro forever. The current price for your country is always shown in the app when you sign up. And if you grab a founder spot, it's zero for you, forever. The Android app and the web dashboard are available now; the iOS app is coming (in App Store review).",
      },
    },
    {
      type: "cta",
      title: {
        it: "Prenditi un posto founder finché ci sono",
        en: "Grab a founder spot while they last",
      },
      body: {
        it: "I 1000 posti founder danno il Pro a vita, gratis: dashboard web, tutti i wearable uniti, storico completo e anello Colmi. L'app Android è già sul Play Store, l'iOS è in arrivo. Iscriviti alla beta e assicurati il posto prima che finiscano.",
        en: "The 1,000 founder spots grant Pro for life, free: web dashboard, all wearables merged, full history and the Colmi ring. The Android app is already on the Play Store, iOS is coming. Sign up for the beta and secure your spot before they're gone.",
      },
      ctaLabel: {
        it: "Diventa founder →",
        en: "Become a founder →",
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
        it: "In sintesi",
        en: "In summary",
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
      },
    },
  ],
  faq: [
    {
      q: {
        it: "FitMesh è gratis?",
        en: "Is FitMesh free?",
      },
      a: {
        it: "Non esiste un piano gratuito permanente, ma costa pochissimo. I primi 1000 iscritti diventano founder e ottengono il Pro a vita gratis; tutti gli altri hanno 14 giorni di prova completa, poi tengono FitMesh con un abbonamento leggero (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza), oppure chiudono l'account.",
        en: "There is no permanent free plan, but it costs very little. The first 1,000 sign-ups become founders and get Pro for life for free; everyone else gets a full 14-day trial, then keeps FitMesh with a light subscription (about a coffee every six months) or a lifetime unlock (less than a pizza), or closes the account.",
      },
    },
    {
      q: {
        it: "Cosa succede dopo i 14 giorni di prova?",
        en: "What happens after the 14-day trial?",
      },
      a: {
        it: "Scegli come continuare: tieni FitMesh con un piccolo abbonamento (circa un caffè ogni sei mesi) o con lo sblocco a vita (meno di una pizza), e i founder non pagano nulla. Se invece decidi che non fa per te, chiudi l'account e i tuoi dati vengono rimossi. Non c'è una versione gratuita dimezzata.",
        en: "You choose how to carry on: keep FitMesh with a small subscription (about a coffee every six months) or a lifetime unlock (less than a pizza), and founders pay nothing. If instead you decide it's not for you, you close the account and your data is removed. There's no reduced free version.",
      },
    },
    {
      q: {
        it: "Come divento founder?",
        en: "How do I become a founder?",
      },
      a: {
        it: "Ti iscrivi alla beta da /it/beta con l'app Android (già sul Play Store) o entri in lista per iOS. I posti sono 1000 e legati al tuo account: una volta founder, resti founder. Non serve la carta di credito per registrarti.",
        en: "You sign up for the beta at /en/beta with the Android app (already on the Play Store) or join the iOS list. There are 1,000 spots, tied to your account: once a founder, always a founder. No credit card is needed to register.",
      },
    },
    {
      q: {
        it: "Quanto costa il Pro?",
        en: "How much does Pro cost?",
      },
      a: {
        it: "Pochissimo, e scegli tu come pagarlo: al lancio un abbonamento leggero di €1,19 ogni sei mesi (circa un caffè) oppure lo sblocco a vita a €3,99 su Android e €4,99 su iPhone (meno di una pizza, una volta sola). Il prezzo aggiornato per il tuo Paese è sempre mostrato nell'app. Per i founder è zero, per sempre.",
        en: "Very little, and you choose how to pay: at launch a light subscription of €1.19 every six months (about a coffee) or a one-time lifetime unlock at €3.99 on Android and €4.99 on iPhone (less than a pizza, once). The current price for your country is always shown in the app. For founders it's zero, forever.",
      },
    },
    {
      q: {
        it: "Posso disdire l'abbonamento?",
        en: "Can I cancel the subscription?",
      },
      a: {
        it: "Sì. Se scegli l'abbonamento, lo gestisci e lo disdici dallo store da cui l'hai attivato (Google Play, e App Store quando l'app iOS sarà disponibile), come qualsiasi altro abbonamento. Se invece scegli lo sblocco a vita, paghi una volta sola e non c'è nulla da rinnovare o disdire. I founder non hanno alcun abbonamento.",
        en: "Yes. If you pick the subscription, you manage and cancel it from the store where you activated it (Google Play, and the App Store once the iOS app is available), like any other subscription. If you pick the lifetime unlock, you pay once and there's nothing to renew or cancel. Founders have no subscription at all.",
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
