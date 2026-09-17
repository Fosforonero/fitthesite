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

export type FamigliaComingSoonLocale =
  | "it"
  | "es"
  | "en"
  | "de"
  | "pt"
  | "fr"
  | "pl"
  | "tr";

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
  de: {
    kicker: "Mesh Familie",
    badge: "Projekt in Prüfung · Derzeit nicht verfügbar",
    h1: "Mesh Familie: Projekt in Prüfung",
    sub: "Mesh Familie ist derzeit nicht verfügbar. Wir evaluieren eine Gruppenansicht für einige Metriken. Im aktuellen Konzept enthält die Ansicht nicht den geografischen Standort der anderen Mitglieder.",
    metaTitle: "Mesh Familie: Projekt in Prüfung | FitMesh Sync",
    metaDescription:
      "Mesh Familie ist derzeit nicht verfügbar. Wir evaluieren eine Gruppenansicht für einige Metriken. Im aktuellen Konzept enthält die Ansicht nicht den geografischen Standort der anderen Mitglieder.",
    ctaCatalog: "Integrationskatalog ansehen",
    ctaCatalogHref: "/de/integrations",
    why_h2: "Projektmerkmale",
    why_items: [
      {
        title: "Gruppenansicht",
        body: "Wir evaluieren eine Gruppenansicht für einige Metriken.",
      },
      {
        title: "Dokumentierte Wege",
        body: "Die derzeit verfügbaren Integrationen sind im Katalog dokumentiert.",
      },
    ],
    availability_h2: "Projektstatus",
    availability_body:
      "Mesh Familie ist derzeit nicht verfügbar. Es wurde kein Veröffentlichungsdatum angekündigt.",
    faq_kicker: "Häufige Fragen",
    faq_h2: "Fragen und Antworten zum Projekt",
    faqs: [
      {
        q: "Wann wird Mesh Familie verfügbar sein?",
        a: "Mesh Familie ist derzeit nicht verfügbar. Es wurde kein Veröffentlichungsdatum angekündigt.",
      },
      {
        q: "Zeigt Mesh Familie den Standort der anderen Mitglieder an?",
        a: "Mesh Familie ist derzeit nicht verfügbar. Im aktuellen Konzept enthält die Gruppenansicht nicht den geografischen Standort der anderen Mitglieder.",
      },
      {
        q: "Welche Geräte werden unterstützt?",
        a: "Die derzeit verfügbaren Integrationen sind im Katalog dokumentiert.",
      },
    ],
  },
  pt: {
    kicker: "Mesh Família",
    badge: "Projeto em avaliação · Não disponível",
    h1: "Mesh Família: projeto em avaliação",
    sub: "O Mesh Família não está disponível no momento. Estamos avaliando uma visualização de grupo para algumas métricas. No projeto atual, a visualização não inclui a localização geográfica dos outros membros.",
    metaTitle: "Mesh Família: projeto em avaliação | FitMesh Sync",
    metaDescription:
      "O Mesh Família não está disponível no momento. Estamos avaliando uma visualização de grupo para algumas métricas. No projeto atual, a visualização não inclui a localização geográfica dos outros membros.",
    ctaCatalog: "Consultar o catálogo de integrações",
    ctaCatalogHref: "/pt/integrations",
    why_h2: "Características do projeto",
    why_items: [
      {
        title: "Visualização de grupo",
        body: "Estamos avaliando uma visualização de grupo para algumas métricas.",
      },
      {
        title: "Caminhos documentados",
        body: "As integrações atualmente disponíveis estão documentadas no catálogo.",
      },
    ],
    availability_h2: "Status do projeto",
    availability_body:
      "O Mesh Família não está disponível no momento. Nenhuma data de lançamento foi anunciada.",
    faq_kicker: "Perguntas frequentes",
    faq_h2: "Perguntas e respostas sobre o projeto",
    faqs: [
      {
        q: "Quando o Mesh Família estará disponível?",
        a: "O Mesh Família não está disponível no momento. Nenhuma data de lançamento foi anunciada.",
      },
      {
        q: "O Mesh Família mostra a localização dos outros membros?",
        a: "O Mesh Família não está disponível no momento. No projeto atual, a visualização do grupo não inclui a localização geográfica dos outros membros.",
      },
      {
        q: "Quais dispositivos são compatíveis?",
        a: "As integrações atualmente disponíveis estão documentadas no catálogo.",
      },
    ],
  },
  fr: {
    kicker: "Mesh Famille",
    badge: "Projet en cours d'évaluation · Non disponible",
    h1: "Mesh Famille : projet en cours d'évaluation",
    sub: "Mesh Famille n'est pas disponible actuellement. Nous évaluons une vue de groupe pour certaines métriques. Dans le projet actuel, la vue n'inclut pas la position géographique des autres membres.",
    metaTitle: "Mesh Famille : projet en cours d'évaluation | FitMesh Sync",
    metaDescription:
      "Mesh Famille n'est pas disponible actuellement. Nous évaluons une vue de groupe pour certaines métriques. Dans le projet actuel, la vue n'inclut pas la position géographique des autres membres.",
    ctaCatalog: "Consulter le catalogue des intégrations",
    ctaCatalogHref: "/fr/integrations",
    why_h2: "Caractéristiques du projet",
    why_items: [
      {
        title: "Vue de groupe",
        body: "Nous évaluons une vue de groupe pour certaines métriques.",
      },
      {
        title: "Parcours documentés",
        body: "Les intégrations actuellement disponibles sont documentées dans le catalogue.",
      },
    ],
    availability_h2: "Statut du projet",
    availability_body:
      "Mesh Famille n'est pas disponible actuellement. Aucune date de sortie n'a été annoncée.",
    faq_kicker: "Questions fréquentes",
    faq_h2: "Questions et réponses sur le projet",
    faqs: [
      {
        q: "Quand Mesh Famille sera-t-il disponible ?",
        a: "Mesh Famille n'est pas disponible actuellement. Aucune date de sortie n'a été annoncée.",
      },
      {
        q: "Mesh Famille affiche-t-il la position des autres membres ?",
        a: "Mesh Famille n'est pas disponible actuellement. Dans le projet actuel, la vue de groupe n'inclut pas la position géographique des autres membres.",
      },
      {
        q: "Quels appareils sont pris en charge ?",
        a: "Les intégrations actuellement disponibles sont documentées dans le catalogue.",
      },
    ],
  },
  pl: {
    kicker: "Mesh Rodzina",
    badge: "Projekt w trakcie oceny · Niedostępny",
    h1: "Mesh Rodzina: projekt w trakcie oceny",
    sub: "Funkcja Mesh Rodzina nie jest obecnie dostępna. Oceniamy widok grupowy dla wybranych metryk. W obecnym projekcie widok nie obejmuje lokalizacji geograficznej pozostałych członków.",
    metaTitle: "Mesh Rodzina: projekt w trakcie oceny | FitMesh Sync",
    metaDescription:
      "Funkcja Mesh Rodzina nie jest obecnie dostępna. Oceniamy widok grupowy dla wybranych metryk. W obecnym projekcie widok nie obejmuje lokalizacji geograficznej pozostałych członków.",
    ctaCatalog: "Sprawdź katalog integracji",
    ctaCatalogHref: "/pl/integrations",
    why_h2: "Założenia projektu",
    why_items: [
      {
        title: "Widok grupowy",
        body: "Oceniamy widok grupowy dla wybranych metryk.",
      },
      {
        title: "Udokumentowane ścieżki",
        body: "Obecnie dostępne integracje są udokumentowane w katalogu.",
      },
    ],
    availability_h2: "Status projektu",
    availability_body:
      "Funkcja Mesh Rodzina nie jest obecnie dostępna. Nie ogłoszono daty wydania.",
    faq_kicker: "Często zadawane pytania",
    faq_h2: "Pytania i odpowiedzi dotyczące projektu",
    faqs: [
      {
        q: "Kiedy funkcja Mesh Rodzina będzie dostępna?",
        a: "Funkcja Mesh Rodzina nie jest obecnie dostępna. Nie ogłoszono daty wydania.",
      },
      {
        q: "Czy Mesh Rodzina pokazuje lokalizację innych członków?",
        a: "Funkcja Mesh Rodzina nie jest obecnie dostępna. W obecnym projekcie widok grupy nie obejmuje lokalizacji geograficznej pozostałych członków.",
      },
      {
        q: "Jakie urządzenia są obsługiwane?",
        a: "Obecnie dostępne integracje są udokumentowane w katalogu.",
      },
    ],
  },
  tr: {
    kicker: "Mesh Aile",
    badge: "Değerlendirme aşamasında proje · Kullanılamıyor",
    h1: "Mesh Aile: değerlendirme aşamasında proje",
    sub: "Mesh Aile özelliği şu anda kullanılamıyor. Belirli metrikler için bir grup görünümünü değerlendiriyoruz. Mevcut projede grup görünümü diğer üyelerin coğrafi konumunu içermemektedir.",
    metaTitle: "Mesh Aile: değerlendirme aşamasında proje | FitMesh Sync",
    metaDescription:
      "Mesh Aile özelliği şu anda kullanılamıyor. Belirli metrikler için bir grup görünümünü değerlendiriyoruz. Mevcut projede grup görünümü diğer üyelerin coğrafi konumunu içermemektedir.",
    ctaCatalog: "Entegrasyon kataloğunu inceleyin",
    ctaCatalogHref: "/tr/integrations",
    why_h2: "Proje özellikleri",
    why_items: [
      {
        title: "Grup görünümü",
        body: "Belirli metrikler için bir grup görünümünü değerlendiriyoruz.",
      },
      {
        title: "Belgelenmiş yollar",
        body: "Şu anda kullanılabilir olan entegrasyonlar katalogda belgelenmiştir.",
      },
    ],
    availability_h2: "Proje durumu",
    availability_body:
      "Mesh Aile şu anda kullanılamıyor. Herhangi bir yayın tarihi açıklanmadı.",
    faq_kicker: "Sık sorulan sorular",
    faq_h2: "Projeyle ilgili sorular ve yanıtlar",
    faqs: [
      {
        q: "Mesh Aile ne zaman kullanıma sunulacak?",
        a: "Mesh Aile şu anda kullanılamıyor. Herhangi bir yayın tarihi açıklanmadı.",
      },
      {
        q: "Mesh Aile diğer üyelerin konumunu gösterir mi?",
        a: "Mesh Aile şu anda kullanılamıyor. Mevcut projede grup görünümü diğer üyelerin coğrafi konumunu içermemektedir.",
      },
      {
        q: "Hangi cihazlar destekleniyor?",
        a: "Şu anda kullanılabilir olan entegrasyonlar katalogda belgelenmiştir.",
      },
    ],
  },
};

export function getFamigliaComingSoon(locale: string): FamigliaComingSoonLocaleCopy {
  if (locale in FAMIGLIA_COMING_SOON) {
    return FAMIGLIA_COMING_SOON[locale as FamigliaComingSoonLocale];
  }
  return FAMIGLIA_COMING_SOON.en;
}
