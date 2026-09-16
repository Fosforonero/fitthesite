export interface FamigliaWhyItem {
  title: string;
  body: string;
}

export interface FamigliaFaqItem {
  q: string;
  a: string;
}

export interface FamigliaComingSoonLocaleCopy {
  kicker: string;
  badge: string;
  h1: string;
  sub: string;
  metaTitle: string;
  metaDescription: string;
  ctaCatalog: string;
  ctaCatalogHref: string;
  why_h2: string;
  why_items: [FamigliaWhyItem, FamigliaWhyItem];
  availability_h2: string;
  availability_body: string;
  faq_kicker: string;
  faq_h2: string;
  faqs: [FamigliaFaqItem, FamigliaFaqItem, FamigliaFaqItem];
}

export type FamigliaComingSoonLocale = "it" | "es" | "en";

export const FAMIGLIA_COMING_SOON: Record<FamigliaComingSoonLocale, FamigliaComingSoonLocaleCopy> = {
  it: {
    kicker: "Mesh Famiglia",
    badge: "Progetto in valutazione · Non disponibile",
    h1: "Mesh Famiglia: progetto in valutazione",
    sub: "Mesh Famiglia non è attualmente disponibile. Stiamo valutando una vista di gruppo per alcune metriche. Nel progetto attuale, la vista non include la posizione geografica degli altri membri.",
    metaTitle: "Mesh Famiglia: progetto in valutazione | FitMesh Sync",
    metaDescription:
      "Mesh Famiglia non è attualmente disponibile. Stiamo valutando una vista di gruppo per alcune metriche. Nel progetto attuale, la vista non include la posizione geografica degli altri membri.",
    ctaCatalog: "Consulta il catalogo delle integrazioni",
    ctaCatalogHref: "/it/integrations",
    why_h2: "Caratteristiche del progetto",
    why_items: [
      {
        title: "Vista di gruppo",
        body: "Stiamo valutando una vista di gruppo per alcune metriche.",
      },
      {
        title: "Percorsi documentati",
        body: "Le integrazioni attualmente disponibili sono documentate nel catalogo.",
      },
    ],
    availability_h2: "Stato del progetto",
    availability_body:
      "Mesh Famiglia non è attualmente disponibile. Non è stata annunciata una data di rilascio.",
    faq_kicker: "Domande frequenti",
    faq_h2: "Domande e risposte sul progetto",
    faqs: [
      {
        q: "Quando sarà disponibile Mesh Famiglia?",
        a: "Mesh Famiglia non è attualmente disponibile. Non è stata annunciata una data di rilascio.",
      },
      {
        q: "Mesh Famiglia mostra la posizione degli altri membri?",
        a: "Mesh Famiglia non è attualmente disponibile. Nel progetto attuale, la vista del gruppo non include la posizione geografica degli altri membri.",
      },
      {
        q: "Quali dispositivi sono supportati?",
        a: "Le integrazioni attualmente disponibili sono documentate nel catalogo.",
      },
    ],
  },
  es: {
    kicker: "Mesh Familia",
    badge: "Proyecto en evaluación · No disponible",
    h1: "Mesh Familia: proyecto en evaluación",
    sub: "Mesh Familia no está disponible actualmente. Estamos evaluando una vista de grupo para algunas métricas. En el diseño actual, la vista no incluye la ubicación geográfica de los demás miembros.",
    metaTitle: "Mesh Familia: proyecto en evaluación | FitMesh Sync",
    metaDescription:
      "Mesh Familia no está disponible actualmente. Estamos evaluando una vista de grupo para algunas métricas. En el diseño actual, la vista no incluye la ubicación geográfica de los demás miembros.",
    ctaCatalog: "Consulta el catálogo de integraciones",
    ctaCatalogHref: "/es/integrations",
    why_h2: "Características del proyecto",
    why_items: [
      {
        title: "Vista de grupo",
        body: "Estamos evaluando una vista de grupo para algunas métricas.",
      },
      {
        title: "Rutas documentadas",
        body: "Las integraciones actualmente disponibles están documentadas en el catálogo.",
      },
    ],
    availability_h2: "Estado del proyecto",
    availability_body:
      "Mesh Familia no está disponible actualmente. No se ha anunciado una fecha de lanzamiento.",
    faq_kicker: "Preguntas frecuentes",
    faq_h2: "Preguntas y respuestas sobre el proyecto",
    faqs: [
      {
        q: "¿Cuándo estará disponible Mesh Familia?",
        a: "Mesh Familia no está disponible actualmente. No se ha anunciado una fecha de lanzamiento.",
      },
      {
        q: "¿Mesh Familia muestra la ubicación de los demás miembros?",
        a: "Mesh Familia no está disponible actualmente. En el diseño actual, la vista del grupo no incluye la ubicación geográfica de los demás miembros.",
      },
      {
        q: "¿Qué dispositivos son compatibles?",
        a: "Las integraciones actualmente disponibles están documentadas en el catálogo.",
      },
    ],
  },
  en: {
    kicker: "Family Mesh",
    badge: "Project under evaluation · Not available",
    h1: "Family Mesh: project under evaluation",
    sub: "Family Mesh is not currently available. We are evaluating a group view for some metrics. In the current design, the view does not include other members' geographic location.",
    metaTitle: "Family Mesh: Project Under Evaluation | FitMesh Sync",
    metaDescription:
      "Family Mesh is not currently available. We are evaluating a group view for some metrics. In the current design, the view does not include other members' geographic location.",
    ctaCatalog: "Explore the integrations catalog",
    ctaCatalogHref: "/en/integrations",
    why_h2: "Project characteristics",
    why_items: [
      {
        title: "Group view",
        body: "We are evaluating a group view for some metrics.",
      },
      {
        title: "Documented paths",
        body: "Currently available integrations are documented in the catalog.",
      },
    ],
    availability_h2: "Project status",
    availability_body:
      "Family Mesh is not currently available. No release date has been announced.",
    faq_kicker: "Frequently asked questions",
    faq_h2: "Questions and answers about the project",
    faqs: [
      {
        q: "When will Family Mesh be available?",
        a: "Family Mesh is not currently available. No release date has been announced.",
      },
      {
        q: "Does Family Mesh show the location of other members?",
        a: "Family Mesh is not currently available. In the current design, the group view does not include other members' geographic location.",
      },
      {
        q: "Which devices are supported?",
        a: "Currently available integrations are documented in the catalog.",
      },
    ],
  },
};

export function getFamigliaComingSoon(locale: string): FamigliaComingSoonLocaleCopy {
  if (locale === "it" || locale === "es") {
    return FAMIGLIA_COMING_SOON[locale];
  }
  return FAMIGLIA_COMING_SOON.en;
}
