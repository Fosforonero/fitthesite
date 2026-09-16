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
  why_items: [FamigliaWhyItem, FamigliaWhyItem, FamigliaWhyItem];
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
    badge: "Progetto sperimentale · Non disponibile",
    h1: "Mesh Famiglia: vista di gruppo in fase di studio",
    sub: "Nel progetto attuale di Mesh Famiglia, la funzione è pensata per offrire una vista condivisa di alcune metriche del gruppo senza condividere la posizione geografica. La funzione non è attualmente disponibile.",
    metaTitle: "Mesh Famiglia: in arrivo | FitMesh Sync",
    metaDescription:
      "Nel progetto attuale di Mesh Famiglia, la funzione è pensata per offrire una vista condivisa di alcune metriche del gruppo senza condividere la posizione geografica. La funzione non è attualmente disponibile.",
    ctaCatalog: "Consulta il catalogo delle integrazioni",
    ctaCatalogHref: "/it/integrations",
    why_h2: "Caratteristiche del progetto",
    why_items: [
      {
        title: "Vista condivisa",
        body: "La funzione è progettata per offrire una vista condivisa di alcune metriche del gruppo.",
      },
      {
        title: "Percorsi documentati",
        body: "Consulta il catalogo delle integrazioni per conoscere i percorsi attualmente documentati in FitMesh.",
      },
      {
        title: "Privacy e trasparenza",
        body: "La connessione al servizio usa HTTPS/TLS. Per informazioni sul trattamento dei dati consulta la Privacy Policy.",
      },
    ],
    availability_h2: "Stato della funzione",
    availability_body:
      "Mesh Famiglia non è attualmente disponibile nell'applicazione (feature flag disattivato). Non vi è alcuna finestra temporale confermata per il rilascio.",
    faq_kicker: "Domande frequenti",
    faq_h2: "Domande e risposte sul progetto",
    faqs: [
      {
        q: "Quando sarà disponibile Mesh Famiglia?",
        a: "Mesh Famiglia è un progetto in fase di valutazione e non è attualmente disponibile nell'applicazione. Non vi è alcuna finestra temporale confermata per il rilascio.",
      },
      {
        q: "Mesh Famiglia mostra la posizione degli altri membri?",
        a: "Mesh Famiglia non è attualmente disponibile. Nel progetto attuale di Mesh Famiglia, la vista del gruppo non include la posizione geografica degli altri membri né condivide coordinate GPS. Per informazioni sul trattamento degli altri dati consulta la Privacy Policy.",
      },
      {
        q: "Quali dispositivi saranno supportati?",
        a: "Il supporto dipenderà dalle integrazioni attive e documentate nella matrice di compatibilità al momento dell'eventuale rilascio.",
      },
    ],
  },
  es: {
    kicker: "Mesh Familia",
    badge: "Diseño experimental · No disponible",
    h1: "Mesh Familia: vista de grupo en fase de estudio",
    sub: "En el diseño actual de Mesh Familia, la función está pensada para ofrecer una vista compartida de algunas métricas del grupo sin compartir la ubicación geográfica. La función no está disponible actualmente.",
    metaTitle: "Mesh Familia: próximamente | FitMesh Sync",
    metaDescription:
      "En el diseño actual de Mesh Familia, la función está pensada para ofrecer una vista compartida de algunas métricas del grupo sin compartir la ubicación geográfica. La función no está disponible actualmente.",
    ctaCatalog: "Consulta el catálogo de integraciones",
    ctaCatalogHref: "/es/integrations",
    why_h2: "Características del proyecto",
    why_items: [
      {
        title: "Vista compartida",
        body: "La función está pensada para ofrecer una vista compartida de algunas métricas del grupo.",
      },
      {
        title: "Rutas documentadas",
        body: "Consulta el catálogo de integraciones para conocer las rutas actualmente documentadas en FitMesh.",
      },
      {
        title: "Privacidad y transparencia",
        body: "La conexión con el servicio utiliza HTTPS/TLS. Para más información sobre el tratamiento de datos, consulta la Política de Privacidad.",
      },
    ],
    availability_h2: "Estado de la función",
    availability_body:
      "Mesh Familia no está disponible actualmente en la aplicación (feature flag desactivado). No existe un plazo de lanzamiento confirmado.",
    faq_kicker: "Preguntas frecuentes",
    faq_h2: "Preguntas y respuestas sobre el proyecto",
    faqs: [
      {
        q: "¿Cuándo estará disponible Mesh Familia?",
        a: "Mesh Familia es un proyecto experimental en evaluación y no está disponible actualmente en la aplicación. No existe un plazo de lanzamiento confirmado.",
      },
      {
        q: "¿Mesh Familia muestra la ubicación de los demás miembros?",
        a: "Mesh Familia no está disponible actualmente. En el diseño actual de Mesh Familia, la vista de grupo no incluye la ubicación geográfica de los demás miembros ni comparte coordenadas GPS. Para más información sobre el tratamiento de los demás datos, consulta la Política de Privacidad.",
      },
      {
        q: "¿Qué dispositivos serán compatibles?",
        a: "La compatibilidad dependerá de las integraciones activas y documentadas en la matriz de compatibilidad en el momento del eventual lanzamiento.",
      },
    ],
  },
  en: {
    kicker: "Family Mesh",
    badge: "Experimental design · Not available",
    h1: "Family Mesh: group view currently under evaluation",
    sub: "In the current design of Family Mesh, the feature is designed to provide a shared view of some group metrics without sharing geographic location. The feature is not currently available.",
    metaTitle: "Family Mesh: coming soon | FitMesh Sync",
    metaDescription:
      "In the current design of Family Mesh, the feature is designed to provide a shared view of some group metrics without sharing geographic location. The feature is not currently available.",
    ctaCatalog: "Explore the integrations catalog",
    ctaCatalogHref: "/en/integrations",
    why_h2: "Project characteristics",
    why_items: [
      {
        title: "Shared view",
        body: "The feature is designed to provide a shared view of some group metrics.",
      },
      {
        title: "Documented paths",
        body: "Check the integrations catalog to learn about the paths currently documented in FitMesh.",
      },
      {
        title: "Privacy and transparency",
        body: "Connections to the service use HTTPS/TLS. For details on data handling, consult our Privacy Policy.",
      },
    ],
    availability_h2: "Feature status",
    availability_body:
      "Family Mesh is not currently available in the application (feature flag disabled). There is no confirmed release timeframe.",
    faq_kicker: "Frequently asked questions",
    faq_h2: "Questions and answers about the project",
    faqs: [
      {
        q: "When will Family Mesh be available?",
        a: "Family Mesh is an experimental project under evaluation and is not currently available in the app. There is no confirmed release timeframe.",
      },
      {
        q: "Does Family Mesh show the location of other members?",
        a: "Family Mesh is not currently available. In the current design of Family Mesh, the group view does not include other members' geographic location or share GPS coordinates. For details on how other data is handled, consult our Privacy Policy.",
      },
      {
        q: "Which devices will be supported?",
        a: "Support will depend on the integrations active and documented in the compatibility matrix at the time of any eventual release.",
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
