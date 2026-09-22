import type { BlogPost } from "../types";

/**
 * Stato del progetto Mesh Famiglia, non un annuncio di lancio.
 *
 * Storia: pubblicato 2026-07-04 come "Mesh Famiglia sta per arrivare nei
 * prossimi giorni", con meccaniche inventate (codici invito MESH-XXXX validi
 * 7 giorni, tetto di 8 membri, 4 preset di privacy, prezzo di lancio
 * €3,99/€4,99, abbonamento €1,19/6 mesi). Nessuno di questi dettagli era
 * verificato; il rilascio annunciato "nei prossimi giorni" non è mai
 * avvenuto. Indicizzato, con impression reali (GSC, controllo 22/09/2026):
 * non un draft, un articolo pubblico rimasto falso per oltre due mesi.
 *
 * Riscritto SPRINT P0.24-B FASE A (22/09/2026) sulla decisione di prodotto
 * confermata da Matteo lo stesso giorno: Mesh Famiglia è decisa ed è in
 * sviluppo, non ancora disponibile nella release pubblica, nessuna data di
 * rilascio annunciata. Formula pubblica autorizzata (IT/EN), da non
 * riformulare come "coming soon" o "nei prossimi giorni" (suggeriscono una
 * vicinanza temporale non confermata) né come "progetto in valutazione"
 * (sottostima: la decisione è presa, il lavoro è in corso). Evidenza di
 * prodotto: `CAPABILITY_STATUS.familyMesh` in lib/product-facts.ts (stato
 * "in_development"); evidenza editoriale: questo commit e la stessa
 * decisione applicata a /famiglia (famiglia-coming-soon.ts) e a /llms.txt.
 *
 * Stato del progetto separato dalle funzioni pubbliche (istruzione esplicita
 * di Matteo, 22/09/2026): nessun gruppo, condivisione, preset di privacy,
 * inclusione in Pro, prezzo o meccanica d'invito descritti come attivi o
 * definiti. Nessuno di quei dettagli è verificato oggi.
 */
export const post: BlogPost = {
  slug: "mesh-famiglia-lancio",
  category: "news",
  publishedAt: "2026-07-04",
  updatedAt: "2026-09-22",
  readMinutes: 2,
  hero: {
    kicker: { it: "Novità", en: "What's New" },
    title: {
      it: "Mesh Famiglia: lo stato del progetto",
      en: "Family Mesh: project status",
    },
    subtitle: {
      it: "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
      en: "Family Mesh is in development and is not yet available. We haven't announced a release date.",
    },
  },
  metaDescription: {
    it: "Mesh Famiglia è in sviluppo e non è ancora disponibile su FitMesh. Non abbiamo annunciato una data di rilascio: lo stato aggiornato del progetto.",
    en: "Family Mesh is in development and is not yet available on FitMesh. We haven't announced a release date: the current project status.",
  },
  primaryKeyword: {
    it: "mesh famiglia fitmesh",
    en: "fitmesh family mesh",
  },
  secondaryKeywords: {
    it: [
      "condividere dati fitness in famiglia",
      "app famiglia passi sonno frequenza cardiaca",
      "dashboard famiglia FitMesh",
      "gruppo famiglia wearable",
      "quando esce mesh famiglia",
    ],
    en: [
      "share fitness data with family",
      "family steps sleep heart rate app",
      "FitMesh family dashboard",
      "wearable family group",
      "when does family mesh launch",
    ],
  },
  tldr: {
    it: ["Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio."],
    en: ["Family Mesh is in development and is not yet available. We haven't announced a release date."],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Mesh Famiglia, la funzione FitMesh pensata per chi vuole restare in contatto con la salute della propria famiglia, è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
        en: "Family Mesh, the FitMesh feature built for staying in touch with your family's health, is in development and is not yet available. We haven't announced a release date.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Non descriviamo qui come funzionerà, il suo prezzo o i suoi limiti: nessuno di questi dettagli è confermato oggi. Lo stato più aggiornato del progetto è sempre sulla pagina dedicata a Mesh Famiglia.",
        en: "We aren't describing how it will work, what it will cost, or its limits here: none of that is confirmed today. The current status of the project is always on the dedicated Family Mesh page.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Segui lo stato di Mesh Famiglia",
        en: "Follow Family Mesh's status",
      },
      body: {
        it: "Lo stato del progetto si aggiorna sulla pagina dedicata, senza data di rilascio annunciata.",
        en: "The project status is kept current on the dedicated page, with no release date announced.",
      },
      ctaLabel: { it: "Vai a Mesh Famiglia →", en: "Go to Family Mesh →" },
      ctaHref: { it: "/it/famiglia", en: "/en/famiglia" },
    },
  ],
  faq: [
    {
      q: {
        it: "Mesh Famiglia è disponibile oggi?",
        en: "Is Family Mesh available today?",
      },
      a: {
        it: "No. È in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
        en: "No. It is in development and is not yet available. We haven't announced a release date.",
      },
    },
    {
      q: {
        it: "Quando sarà disponibile Mesh Famiglia?",
        en: "When will Family Mesh be available?",
      },
      a: {
        it: "Non abbiamo annunciato una data di rilascio. Lo stato aggiornato è sempre sulla pagina dedicata a Mesh Famiglia.",
        en: "We haven't announced a release date. The current status is always on the dedicated Family Mesh page.",
      },
    },
  ],
  related: [
    "dove-sono-i-tuoi-dati-server-ue",
    "gdpr-dati-fitness-smartwatch",
    "come-funziona-fitmesh",
    "novita-dashboard-multi-device",
  ],
  ldType: "BlogPosting",
};
