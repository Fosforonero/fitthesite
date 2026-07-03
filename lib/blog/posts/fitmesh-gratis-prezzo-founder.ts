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
  updatedAt: "2026-07-02",
  readMinutes: 8,
  tldr: {
    it: [
      "FitMesh non ha un piano gratuito permanente: chi cerca 'gratis per sempre' deve saperlo subito.",
      "I primi 1000 iscritti diventano founder e ricevono il Pro a vita, gratis, incluse le funzioni future.",
      "Tutti gli altri hanno 14 giorni di prova completa, con ogni funzione Pro sbloccata.",
      "Dopo i 14 giorni si sceglie: abbonamento Pro oppure eliminazione dell'account, senza versione dimezzata.",
      "Il Pro include dashboard web, tutti i wearable uniti e deduplicati, storico completo e anello Colmi via Bluetooth.",
    ],
    en: [
      "FitMesh has no permanent free plan: if you're searching for 'free forever', you should know that up front.",
      "The first 1,000 sign-ups become founders and get Pro for life, free, including future features.",
      "Everyone else gets a full 14-day trial with every Pro feature unlocked.",
      "After 14 days you choose: a Pro subscription or deleting the account, with no half-crippled free tier.",
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
        it: "Se stai cercando \"FitMesh è gratis\" prima di installare, ecco la risposta diretta e senza giri di parole: non esiste un piano gratuito permanente, ma ci sono due modi concreti per usare FitMesh Sync senza spendere nulla oggi. Il primo sono i 1000 posti founder, che danno il Pro a vita gratis. Il secondo è la prova completa di 14 giorni, aperta a tutti, con ogni funzione sbloccata. Alla fine della prova scegli: abbonamento Pro oppure elimini l'account. In questa guida spieghiamo esattamente come funziona il prezzo, cosa include il Pro e come tenerti un posto founder finché ci sono.",
        en: "If you're searching for \"is FitMesh free\" before installing, here's the direct answer with no spin: there is no permanent free plan, but there are two concrete ways to use FitMesh Sync without paying anything today. The first is the 1,000 founder spots, which grant Pro for life for free. The second is the full 14-day trial, open to everyone, with every feature unlocked. At the end of the trial you choose: a Pro subscription or you delete the account. This guide explains exactly how pricing works, what Pro includes, and how to keep a founder spot while they last.",
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
        it: "FitMesh non ha un piano gratuito per sempre. I primi 1000 iscritti diventano founder e ottengono il Pro a vita, gratis. Tutti gli altri hanno 14 giorni di prova completa, poi scelgono tra abbonamento Pro ed eliminazione dell'account. Il prezzo esatto del Pro è mostrato nell'app al momento dell'iscrizione.",
        en: "FitMesh has no free-forever plan. The first 1,000 sign-ups become founders and get Pro for life, free. Everyone else gets a full 14-day trial, then chooses between a Pro subscription and deleting the account. The exact Pro price is shown in the app when you sign up.",
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
        it: "Alla fine dei 14 giorni la scelta è netta e senza trappole: attivi l'abbonamento Pro e continui esattamente come prima, oppure elimini l'account. Non c'è una versione gratuita ridotta che resta lì a metà: o il Pro ti è utile e paghi, o chiudi e i tuoi dati vengono rimossi. È una scelta scomoda da scrivere, ma onesta da rispettare, ed è proprio il motivo per cui la prova è completa. Vogliamo che tu decida con l'app vera davanti, dopo aver visto [i tuoi smartwatch uniti senza dati doppi](/it/blog/piu-smartwatch-insieme-dati-doppi) nella dashboard, non su promesse.",
        en: "At the end of the 14 days the choice is clean and free of traps: you activate the Pro subscription and carry on exactly as before, or you delete the account. There's no reduced free version sitting there half-working: either Pro is useful to you and you pay, or you close it and your data is removed. It's an uncomfortable thing to write, but an honest one to stand by, and it's exactly why the trial is full. We want you to decide with the real app in front of you, after seeing [your smartwatches merged with no double data](/en/blog/piu-smartwatch-insieme-dati-doppi) in the dashboard, not on promises.",
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
          "Dopo: abbonamento Pro oppure elimini l'account.",
          "Sempre disponibile, anche a posti founder esauriti.",
        ],
        en: [
          "Every Pro feature unlocked for 14 days.",
          "No credit card required to start.",
          "After: a Pro subscription or you delete the account.",
          "Always available, even once founder spots are gone.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché non c'è un piano gratuito per sempre",
        en: "Why there's no free-forever plan",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La domanda è legittima: perché non tenere una versione gratuita per sempre come fanno tante bridge app del settore? Perché quel \"gratis\" quasi sempre si paga altrove, con la pubblicità o con la vendita dei dati. Noi teniamo i tuoi dati sul tuo account nel cloud in UE e non li monetizziamo: puoi leggere come li trattiamo nella guida su [GDPR e dati fitness](/it/blog/gdpr-dati-fitness-smartwatch). Un abbonamento unico e chiaro è ciò che tiene in piedi il servizio senza compromessi sulla privacy. La prova completa e i posti founder sono il modo per farti entrare senza rischio, con l'app intera davanti, prima di decidere.",
        en: "It's a fair question: why not keep a free version forever like so many bridge apps in the industry do? Because that \"free\" is almost always paid for elsewhere, with ads or by selling your data. We keep your data on your account in the EU cloud and don't monetize it: you can read how we handle it in the guide on [GDPR and fitness data](/en/blog/gdpr-dati-fitness-smartwatch). A single, clear subscription is what keeps the service running without compromising on privacy. The full trial and the founder spots are how we let you in risk-free, with the whole app in front of you, before you decide.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Quanto costa? Dove vedere il prezzo",
        en: "How much does it cost? Where to see the price",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il Pro è un unico abbonamento, senza livelli confusi da scegliere. Il prezzo aggiornato lo vedi direttamente nell'app al momento dell'iscrizione, così è sempre quello reale per il tuo Paese e non una cifra vecchia scritta in un articolo. Se prendi un posto founder, il prezzo per te è zero, per sempre. L'app Android e la dashboard web sono disponibili ora; l'app iOS è in arrivo (in revisione sull'App Store) e potrai entrare in lista dalla beta.",
        en: "Pro is a single subscription, with no confusing tiers to pick. You see the current price directly in the app when you sign up, so it's always the real one for your country and not an outdated figure written in an article. If you take a founder spot, the price for you is zero, forever. The Android app and the web dashboard are available now; the iOS app is coming (in App Store review) and you'll be able to join the list from the beta.",
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
          "Dopo i 14 giorni: abbonamento Pro oppure elimini l'account, senza versione dimezzata.",
          "Il Pro include dashboard web, wearable uniti e deduplicati, storico completo e anello Colmi via Bluetooth.",
          "Il prezzo esatto è mostrato nell'app; per i founder è zero, per sempre.",
        ],
        en: [
          "FitMesh has no permanent free plan: that's the thing to know before installing.",
          "First 1,000 sign-ups = founders with lifetime Pro for free, future features included.",
          "Everyone else = a full 14-day trial with every Pro feature unlocked.",
          "After 14 days: a Pro subscription or you delete the account, with no crippled tier.",
          "Pro includes the web dashboard, merged and deduplicated wearables, full history and the Colmi ring over Bluetooth.",
          "The exact price is shown in the app; for founders it's zero, forever.",
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
        it: "Non esiste un piano gratuito permanente. I primi 1000 iscritti diventano founder e ottengono il Pro a vita gratis; tutti gli altri hanno 14 giorni di prova completa, poi scelgono tra abbonamento Pro ed eliminazione dell'account.",
        en: "There is no permanent free plan. The first 1,000 sign-ups become founders and get Pro for life for free; everyone else gets a full 14-day trial, then chooses between a Pro subscription and deleting the account.",
      },
    },
    {
      q: {
        it: "Cosa succede dopo i 14 giorni di prova?",
        en: "What happens after the 14-day trial?",
      },
      a: {
        it: "La scelta è netta: attivi l'abbonamento Pro e continui come prima, oppure elimini l'account. Non c'è una versione gratuita ridotta: o paghi il Pro, o chiudi e i tuoi dati vengono rimossi.",
        en: "The choice is clean: you activate the Pro subscription and carry on as before, or you delete the account. There's no reduced free version: either you pay for Pro, or you close it and your data is removed.",
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
        it: "Il Pro è un unico abbonamento e il prezzo aggiornato è mostrato nell'app al momento dell'iscrizione, così è sempre quello reale per il tuo Paese. Per i founder il prezzo è zero, per sempre.",
        en: "Pro is a single subscription and the current price is shown in the app when you sign up, so it's always the real one for your country. For founders the price is zero, forever.",
      },
    },
    {
      q: {
        it: "Posso disdire l'abbonamento?",
        en: "Can I cancel the subscription?",
      },
      a: {
        it: "Sì. L'abbonamento Pro si gestisce e si disdice dallo store da cui è stato attivato (Google Play, e App Store quando l'app iOS sarà disponibile), come qualsiasi altro abbonamento. I posti founder non hanno alcun abbonamento da disdire.",
        en: "Yes. The Pro subscription is managed and cancelled from the store where it was activated (Google Play, and the App Store once the iOS app is available), like any other subscription. Founder spots have no subscription to cancel.",
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
