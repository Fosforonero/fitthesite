import type { BlogPost } from "../types";
// Sprint P0.10G: frase Founder INVARIANTE (mai un ramo aperto/chiuso
// risolto al build) — vedi lib/founder/historical-note.ts.
import {
  founderHistoricalClause,
  founderEligibilityStatement,
  founderSiteClosedNote,
} from "@/lib/founder/historical-note";

/**
 * Sprint P0.10K (2026-07-31) — l'articolo NON è più una pagina BOFU di
 * acquisizione ("perché conviene diventare founder adesso"): il sito ha
 * chiuso le nuove adesioni Founder, quindi ogni frase che invitava a
 * iscriverti per prendere un posto era un funnel rotto. Riscritto al tempo
 * storico: racconta come funzionava il programma (tetto fisso 1000, cutoff
 * 31/07/2026, prima sync reale entro 14 giorni), cosa protegge lo status di
 * chi lo ha già ottenuto (Termini di servizio) e qual è il percorso di chi
 * arriva oggi (prova Pro di 14 giorni, poi abbonamento o sblocco a vita).
 * Slug invariato di proposito: cambiarlo richiederebbe redirect 301 su 10
 * locale, debito accettato esplicitamente.
 *
 * Niente numero di posti rimasti hardcoded: il sito non ha mai pubblicato un
 * conteggio affidabile dei posti occupati (contatore rimosso, Hotfix P0.6C,
 * perché non riconciliato con i grant realmente assegnati). it/en; le altre
 * 13 locale ereditano da 'en' via tl().
 *
 * CORREZIONE BLOCCANTE Sprint P0.10G: la versione precedente descriveva un
 * meccanismo "grant automatico alla registrazione" che non corrisponde più
 * alla logica reale (Sprint P0.10A, private.grant_founder_launch_core): il
 * grant richiede una prima sincronizzazione reale entro 14 giorni dalla
 * registrazione, non è automatico alla sola iscrizione — e non menzionava
 * affatto la data di cutoff (31 luglio 2026), un secondo requisito
 * indipendente dal tetto di 1000 account. Corretto ovunque nel file: ogni
 * occorrenza di "automatico alla registrazione" ora menziona la prima sync
 * entro 14 giorni, e il cutoff del 31/07/2026 è esplicito nei punti chiave.
 */
export const post: BlogPost = {
  slug: "perche-diventare-founder-fitmesh",
  category: "guides",
  publishedAt: "2026-07-04",
  updatedAt: "2026-07-31",
  readMinutes: 7,
  hero: {
    kicker: { it: "Programma founder", en: "Founder program" },
    title: {
      it: "Il programma Founder FitMesh: come funzionava e cosa resta",
      en: "The FitMesh Founder program: how it worked and what remains",
    },
    subtitle: {
      it: `Non è mai stata una promozione a tempo con la solita fretta finta. Founder: ${founderHistoricalClause("it")}. ${founderSiteClosedNote("it")} Ecco come funzionava il meccanismo, cosa protegge lo status di chi lo ha ottenuto e qual è il percorso di chi arriva oggi.`,
      en: `It was never a limited-time promo running on fake urgency. Founder: ${founderHistoricalClause("en")}. ${founderSiteClosedNote("en")} Here's how the mechanism worked, what protects the status of those who got it, and what the path looks like for anyone arriving today.`,
    },
  },
  metaDescription: {
    it: "Come funzionava il programma Founder FitMesh: il Pro a vita per i primi 1000 account entro il 31/07/2026, cosa lo protegge e cosa trova chi arriva oggi.",
    en: "How the FitMesh Founder program worked: lifetime Pro for the first 1,000 accounts by July 31, 2026, what protects it, and what anyone arriving today finds.",
  },
  primaryKeyword: {
    it: "perché diventare founder fitmesh",
    en: "why become a fitmesh founder",
  },
  secondaryKeywords: {
    it: [
      "fitmesh founder conviene",
      "posti founder fitmesh",
      "fitmesh pro a vita gratis",
      "come funziona founder fitmesh",
      "fitmesh primi 1000 account",
      "fitmesh founder revocabile",
      "fitmesh beta founder",
    ],
    en: [
      "is fitmesh founder worth it",
      "fitmesh founder spots",
      "fitmesh free lifetime pro",
      "how does fitmesh founder work",
      "fitmesh first 1000 accounts",
      "can fitmesh founder be revoked",
      "fitmesh beta founder program",
    ],
  },
  tldr: {
    it: [
      `${founderHistoricalClause("it")}, senza recensioni né acquisti — solo una prima sincronizzazione reale entro 14 giorni dalla registrazione.`,
      "Il tetto di 1000 era fisso e applicato dal server, non da un contatore di marketing: una volta raggiunto, l'assegnazione si è fermata da sola e non riparte.",
      "Lo status founder è scritto nei Termini di servizio: non dipende da recensioni, non è revocabile se non per violazione dei Termini, e resta valido per tutta la durata del servizio.",
      "Chi non rientrava nei requisiti, e chiunque arrivi oggi, ha comunque 14 giorni di prova completa, e alla fine sceglie tra un abbonamento leggero o uno sblocco a vita a pagamento.",
      "Il numero di posti rimasti non è mai stato pubblicato in modo affidabile: se il tuo account era già registrato prima della chiusura, controlla la schermata Pro nell'app per vedere se lo status Founder è attivo.",
    ],
    en: [
      `${founderHistoricalClause("en")}, no review needed and nothing to buy — just a real first sync within 14 days of registering.`,
      "The 1,000 cap was fixed and enforced by the server, not a marketing counter: once reached, the grant stopped itself and doesn't resume.",
      "Founder status is written into the Terms of Service: it doesn't depend on reviews, it can't be revoked except for a Terms violation, and it stays valid for the entire life of the service.",
      "Anyone who didn't meet the requirements, and anyone arriving today, still gets a full 14-day trial, then chooses between a light subscription or a paid lifetime unlock.",
      "The number of remaining spots was never published reliably: if your account was already registered before the close, check the Pro screen in the app to see whether Founder status is active.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: `Il programma founder di FitMesh non è mai stato uno sconto lampo pensato per farti scaricare l'app in fretta. Era una regola semplice, scritta nel backend e non in un banner: ${founderHistoricalClause("it")}, senza dover comprare nulla né lasciare una recensione. Il tetto di 1000 account e la data del 31 luglio 2026 erano entrambi fissi, e nessuno dei due è mai tornato indietro. ${founderSiteClosedNote("it")} Questa pagina spiega come funzionava esattamente il grant, perché non era solo una promessa di marketing, e che cosa trova chi arriva oggi.`,
        en: `FitMesh's founder program was never a flash discount designed to rush you into downloading the app. It was a simple rule, written into the backend rather than a banner: ${founderHistoricalClause("en")}, with nothing to buy and no review to leave. Both the 1,000-account cap and the July 31, 2026 date were fixed, and neither ever reset. ${founderSiteClosedNote("en")} This page explains exactly how the grant worked, why it was more than a marketing promise, and what anyone arriving today finds instead.`,
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Risposta rapida", en: "Quick answer" },
      body: {
        it: `${founderHistoricalClause("it")}, senza revisione né acquisto. ${founderSiteClosedNote("it")} Chi non rientrava nei requisiti, e chiunque arrivi oggi, ha 14 giorni di prova completa e poi sceglie tra abbonamento o sblocco a vita a pagamento. Lo status founder è protetto dai Termini di servizio e non è revocabile salvo violazioni: il sito non ha mai pubblicato un conteggio affidabile dei posti, quindi l'unico posto dove verificarlo è la schermata Pro nell'app.`,
        en: `${founderHistoricalClause("en")}, with no review and nothing to buy. ${founderSiteClosedNote("en")} Anyone who didn't meet the requirements, and anyone arriving today, gets a full 14-day trial and then chooses between a subscription or a paid lifetime unlock. Founder status is protected by the Terms of Service and can't be revoked except for violations: the website never published a reliable spot count, so the only place to check is the Pro screen in the app.`,
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come funzionava davvero il grant Founder",
        en: "How the Founder grant actually worked",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il meccanismo era interamente lato server. Quando un account veniva creato entro il 31 luglio 2026 e completava una prima sincronizzazione reale entro 14 giorni dalla registrazione, una regola controllava quanti account founder erano già stati assegnati. Se l'account rientrava nei primi 1000, riceveva il Pro senza scadenza: non era un piano che qualcuno attivava manualmente, non richiedeva l'invio di uno screenshot né l'approvazione di un moderatore. Il tetto di 1000 era scritto nella regola stessa, e un blocco tecnico impediva che due sincronizzazioni simultanee superassero la soglia per errore: anche con centinaia di sincronizzazioni nello stesso secondo, il conteggio restava esatto. Raggiunta la soglia, o passata la data di cutoff, la regola smette semplicemente di assegnare nuovi posti: nessun errore visibile, solo silenzio. Gli account che avevano già ottenuto il grant non sono toccati da questo: il Pro a vita resta assegnato.",
        en: "The mechanism lived entirely on the server. When an account was created by July 31, 2026 and completed a real first sync within 14 days of registering, a rule checked how many founder accounts had already been granted. If the account fell within the first 1,000, it received Pro with no expiry: it wasn't a plan someone flipped on manually, it didn't require sending a screenshot or waiting for a moderator's approval. The 1,000 cap was written into the rule itself, and a technical lock stopped two simultaneous syncs from pushing the count past the threshold by accident: even with hundreds of syncs in the same second, the count stayed exact. Once the threshold was reached, or the cutoff date passed, the rule simply stops granting new spots: no visible error, just silence. Accounts that had already been granted are untouched by this: their lifetime Pro stays in place.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché non è solo una promessa di marketing",
        en: "Why it's more than a marketing promise",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La domanda onesta da farsi prima di fidarsi di un \"gratis a vita\" è: cosa impedisce che venga tolto più avanti? Nel caso di FitMesh la risposta è nei Termini di servizio, non solo in questa pagina. Il beneficio founder, una volta ottenuto, non è condizionato a lasciare recensioni o valutazioni, e non può essere revocato unilateralmente se non in caso di violazione dei Termini stessi. Resta valido per tutta la durata del servizio: l'unico scenario che lo chiuderebbe è la cessazione completa del servizio, con un preavviso minimo di 60 giorni, e trattandosi di un beneficio gratuito non ci sarebbe comunque nulla da rimborsare. In altre parole, lo status founder non dipende dalla nostra buona volontà futura: è una clausola scritta, non una gentilezza revocabile a piacere.",
        en: "The honest question to ask before trusting any \"free for life\" claim is: what stops it from being taken away later? For FitMesh, the answer lives in the Terms of Service, not just on this page. The founder benefit, once granted, isn't conditional on leaving reviews or ratings, and it can't be unilaterally revoked except for a violation of the Terms themselves. It stays valid for the entire duration of the service: the only scenario that would end it is a full shutdown of the service, with a minimum of 60 days' notice, and since it's a free benefit there would be nothing to refund anyway. In other words, founder status doesn't depend on our future goodwill: it's a written clause, not a courtesy that can be revoked on a whim.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Founder e prova di 14 giorni: cosa cambia davvero",
        en: "Founder and the 14-day trial: what actually differs",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Chi rientrava nei requisiti Founder (account registrato entro il 31 luglio 2026, prima sincronizzazione reale entro 14 giorni) non paga mai nulla per il Pro: né oggi, né tra un anno, né per le funzioni che arriveranno. Chi non rientrava — perché il tetto di 1000 era già stato raggiunto, o perché l'account è nato dal 1° agosto 2026 in poi — non resta escluso da FitMesh, ma il percorso è diverso: 14 giorni di prova completa con ogni funzione Pro sbloccata, e alla fine della prova si sceglie se continuare con un abbonamento leggero o con uno sblocco a vita a pagamento, oppure si chiude l'account. Ai prezzi attuali di lancio l'abbonamento costa 1,19 € ogni sei mesi, mentre lo sblocco a vita costa 3,99 € su Android e 4,99 € su iPhone: cifre piccole, ma comunque cifre, ripetute o uniche, che un founder non paga mai. Questi sono prezzi di lancio e potrebbero aumentare per chi acquista in futuro; il prezzo pagato al momento dell'acquisto resta però bloccato per quell'acquisto specifico. La differenza reale tra founder e prova, quindi, non è \"gratis contro a pagamento in generale\": è \"gratis per sempre, garantito nei Termini\" contro \"gratis per 14 giorni, poi una cifra piccola ma reale\".",
        en: "Anyone who met the Founder requirements (account registered by July 31, 2026, real first sync within 14 days) never pays anything for Pro: not today, not a year from now, not for the features still to come. Anyone who didn't — because the 1,000 cap had already been reached, or because the account was created on or after August 1, 2026 — isn't shut out of FitMesh, but the path is different: a full 14-day trial with every Pro feature unlocked, and at the end of it you choose whether to continue with a light subscription or a paid lifetime unlock, or close the account. At current launch prices, the subscription costs €1.19 every six months, while the lifetime unlock costs €3.99 on Android and €4.99 on iPhone: small amounts, but still amounts, recurring or one-time, that a founder never pays. These are launch prices and may rise for future purchases; the price paid at the time of purchase, however, stays locked in for that specific purchase. So the real difference between founder and trial isn't \"free versus paid in general\": it's \"free forever, guaranteed in the Terms\" versus \"free for 14 days, then a small but real amount\".",
      },
    },
    {
      type: "table",
      caption: {
        it: "Posto founder (storico) contro prova di 14 giorni",
        en: "Founder spot (historical) vs. the 14-day trial",
      },
      headers: {
        it: ["Aspetto", "Founder (primi 1000)", "Chi arriva oggi"],
        en: ["Aspect", "Founder (first 1,000)", "Anyone arriving today"],
      },
      rows: [
        {
          it: ["Costo del Pro", "Zero, per sempre", "Gratis per 14 giorni, poi a pagamento"],
          en: ["Cost of Pro", "Zero, forever", "Free for 14 days, then paid"],
        },
        {
          it: ["Quando veniva assegnato", "Dopo la prima sync reale, entro 14gg dalla registrazione (entro il 31/07/2026)", "Non si applica: si passa a prova e poi abbonamento"],
          en: ["When it was granted", "After a real first sync, within 14 days of registering (by July 31, 2026)", "Not applicable: you move to trial then subscription"],
        },
        {
          it: ["Serviva una recensione o un'azione extra", "No", "No, ma serve comunque scegliere un piano a fine prova"],
          en: ["Did it need a review or extra action", "No", "No, but you still choose a plan at the end of the trial"],
        },
        {
          it: ["Revocabile", "No, salvo violazione dei Termini", "L'abbonamento si può disdire quando vuoi"],
          en: ["Can it be revoked", "No, except for a Terms violation", "The subscription can be cancelled anytime"],
        },
        {
          it: ["Funzioni future incluse", "Sì, tutte, senza costi aggiuntivi", "Sì, incluse nel piano scelto"],
          en: ["Future features included", "Yes, all of them, at no extra cost", "Yes, included in the plan chosen"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché non è mai esistito un conteggio pubblico dei posti",
        en: "Why there was never a public spot counter",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Ci si potrebbe aspettare un numero preciso, tipo \"restavano X posti founder\". Non l'abbiamo mai pubblicato in modo affidabile: il contatore che avevamo mostrato in home e nella pagina beta è stato rimosso perché il conteggio non era riconciliato con i grant realmente assegnati in produzione. L'unico modo attendibile per sapere se un account rientra nei primi 1000 resta la schermata Pro nell'app: se il grant è attivo, compare \"Founder · Pro · Lifetime\".",
        en: "You might expect an exact number here, something like \"X founder spots were left\". We never published one reliably: the counter we used to show on the homepage and the beta page was removed because the count wasn't reconciled against the grants actually issued in production. The only dependable way to know whether an account is among the first 1,000 is still the Pro screen in the app: if the grant is active, it reads \"Founder · Pro · Lifetime\".",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Se vuoi il quadro completo sul modello di prezzo, inclusi i dettagli sulla prova di 14 giorni e su cosa include il Pro, c'è la guida [FitMesh è gratis? Prezzo e prova di 14 giorni](/it/blog/fitmesh-gratis-prezzo-founder). E se vuoi sapere cosa succede ai tuoi dati una volta collegato un wearable, la risposta diretta è nella guida [Dove sono i tuoi dati e perché un server in UE conta](/it/blog/dove-sono-i-tuoi-dati-server-ue).",
        en: "For the full picture on the pricing model, including the details of the 14-day trial and what Pro includes, there's the guide [Is FitMesh free? Pricing and the 14-day trial](/en/blog/fitmesh-gratis-prezzo-founder). And if you want to know what happens to your data once you connect a wearable, the direct answer is in the guide [Where your data actually lives, and why an EU server matters](/en/blog/dove-sono-i-tuoi-dati-server-ue).",
      },
    },
    {
      // Sprint P0.10K (2026-07-31): chiusura commerciale del sito. Questo
      // blocco puntava a /beta con un invito ad "iscriverti in un minuto" —
      // azionabile e presente, falso da oggi che il sito non propone piu'
      // l'adesione Founder. Riscritto sul funnel ordinario (stesso pattern
      // gia' corretto in fitmesh-gratis-prezzo-founder.ts): scarica l'app,
      // prova 14gg, controlla nell'app se il tuo account (registrato PRIMA
      // della chiusura) ha già ottenuto lo status Founder.
      type: "cta",
      title: {
        it: "Vuoi provare FitMesh?",
        en: "Want to try FitMesh?",
      },
      body: {
        it: "Le nuove adesioni al programma Founder tramite il sito sono chiuse. Se avevi già un account registrato entro il cutoff con una prima sincronizzazione reale entro 14 giorni, controlla la schermata Pro nell'app: se hai ottenuto lo status Founder, il Pro a vita è già tuo. In tutti gli altri casi, la prova Pro gratuita di 14 giorni è comunque inclusa.",
        en: "New sign-ups for the Founder program through the site are closed. If you already had an account registered by the cutoff with a first verified sync within 14 days, check the Pro screen in the app: if you got Founder status, lifetime Pro is already yours. Otherwise, the free 14-day Pro trial is still included.",
      },
      ctaLabel: { it: "Scarica FitMesh e prova gratis →", en: "Download FitMesh and try it free →" },
      ctaHref: { it: "/it#download", en: "/en#download" },
    },
  ],
  faq: [
    {
      q: { it: "Serviva lasciare una recensione per ottenere lo status founder?", en: "Did the founder benefit require leaving a review?" },
      a: {
        it: "No. Il beneficio founder richiedeva solo una prima sincronizzazione reale entro 14 giorni dalla registrazione (per account creati entro il 31 luglio 2026) e non è mai stato condizionato a recensioni, valutazioni o altre azioni.",
        en: "No. The founder benefit only required a real first sync within 14 days of registration (for accounts created by July 31, 2026) and was never conditional on reviews, ratings or any other action.",
      },
    },
    {
      q: { it: "FitMesh può togliermi lo status founder in futuro?", en: "Can FitMesh remove my founder status in the future?" },
      a: {
        it: "No, salvo violazione dei Termini di servizio. Lo status founder è scritto nei Termini, resta valido per tutta la durata del servizio e non è revocabile unilateralmente.",
        en: "No, except for a violation of the Terms of Service. Founder status is written into the Terms, stays valid for the entire duration of the service, and can't be unilaterally revoked.",
      },
    },
    {
      q: { it: "Cosa succede se FitMesh chiude il servizio?", en: "What happens if FitMesh shuts down the service?" },
      a: {
        it: "È l'unico scenario che chiuderebbe il beneficio founder, con un preavviso minimo di 60 giorni. Trattandosi di un beneficio gratuito, non ci sarebbe comunque nulla da rimborsare.",
        en: "It's the only scenario that would end the founder benefit, with at least 60 days' notice. Since it's a free benefit, there would be nothing to refund anyway.",
      },
    },
    {
      q: { it: "Il programma founder è ancora aperto?", en: "Is the founder program still open?" },
      a: {
        it: `No. ${founderSiteClosedNote("it")} Se il tuo account era già registrato prima della chiusura, la schermata Pro nell'app dice se lo status è attivo; per tutti gli altri il percorso è la prova Pro di 14 giorni.`,
        en: `No. ${founderSiteClosedNote("en")} If your account was already registered before the close, the Pro screen in the app tells you whether the status is active; for everyone else the path is the 14-day Pro trial.`,
      },
    },
    {
      q: { it: "Se non ho lo status founder, cosa ottengo?", en: "If I don't have founder status, what do I get?" },
      a: {
        it: "Una prova completa di 14 giorni con ogni funzione Pro sbloccata. Dopo, scegli tra un abbonamento leggero, uno sblocco a vita a pagamento, oppure chiudi l'account.",
        en: "A full 14-day trial with every Pro feature unlocked. After that, you choose between a light subscription, a paid lifetime unlock, or closing the account.",
      },
    },
    {
      q: { it: "Serviva la carta di credito per ottenere lo status founder?", en: "Was a credit card needed to get founder status?" },
      a: {
        it: `No. La registrazione non ha mai richiesto un metodo di pagamento, e nemmeno la prova Pro di 14 giorni lo richiede oggi. ${founderEligibilityStatement("it")}`,
        en: `No. Registration never required a payment method, and the 14-day Pro trial doesn't require one today either. ${founderEligibilityStatement("en")}`,
      },
    },
  ],
  related: [
    "fitmesh-gratis-prezzo-founder",
    "dove-sono-i-tuoi-dati-server-ue",
    "come-funziona-fitmesh",
    "colmi-ring-fitmesh",
  ],
  ldType: "BlogPosting",
};
