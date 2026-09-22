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
    badge: "In sviluppo · Non disponibile",
    h1: "Mesh Famiglia: in sviluppo, non disponibile",
    sub: "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
    metaTitle: "Mesh Famiglia: in sviluppo | FitMesh Sync",
    metaDescription:
      "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
    ctaCatalog: "Consulta il catalogo delle integrazioni",
    ctaCatalogHref: "/it/integrations",
    why_h2: "Caratteristiche del progetto",
    why_items: [
      {
        title: "Stato",
        body: "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
      },
      {
        title: "Percorsi documentati",
        body: "Le integrazioni attualmente disponibili sono documentate nel catalogo.",
      },
    ],
    availability_h2: "Stato del progetto",
    availability_body:
      "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio.",
    faq_kicker: "Domande frequenti",
    faq_h2: "Domande e risposte sul progetto",
    faqs: [
      {
        q: "Quando sarà disponibile Mesh Famiglia?",
        a: "Non abbiamo annunciato una data di rilascio. Lo stato aggiornato è sempre su questa pagina.",
      },
      {
        q: "Dove trovo lo stato più aggiornato di Mesh Famiglia?",
        a: "Su questa pagina, sempre aggiornata.",
      },
      {
        q: "Quali dispositivi sono supportati?",
        a: "Le integrazioni attualmente disponibili sono documentate nel catalogo.",
      },
    ],
  },
  es: {
    kicker: "Mesh Familia",
    badge: "En desarrollo · No disponible",
    h1: "Mesh Familia: en desarrollo, no disponible",
    sub: "Mesh Familia está en desarrollo y todavía no está disponible. No hemos anunciado una fecha de lanzamiento.",
    metaTitle: "Mesh Familia: en desarrollo | FitMesh Sync",
    metaDescription:
      "Mesh Familia está en desarrollo y todavía no está disponible. No hemos anunciado una fecha de lanzamiento.",
    ctaCatalog: "Consulta el catálogo de integraciones",
    ctaCatalogHref: "/es/integrations",
    why_h2: "Características del proyecto",
    why_items: [
      {
        title: "Estado",
        body: "Mesh Familia está en desarrollo y todavía no está disponible. No hemos anunciado una fecha de lanzamiento.",
      },
      {
        title: "Rutas documentadas",
        body: "Las integraciones actualmente disponibles están documentadas en el catálogo.",
      },
    ],
    availability_h2: "Estado del proyecto",
    availability_body:
      "Mesh Familia está en desarrollo y todavía no está disponible. No hemos anunciado una fecha de lanzamiento.",
    faq_kicker: "Preguntas frecuentes",
    faq_h2: "Preguntas y respuestas sobre el proyecto",
    faqs: [
      {
        q: "¿Cuándo estará disponible Mesh Familia?",
        a: "No hemos anunciado una fecha de lanzamiento. El estado actualizado está siempre en esta página.",
      },
      {
        q: "¿Dónde encuentro el estado más reciente de Mesh Familia?",
        a: "En esta página, siempre actualizada.",
      },
      {
        q: "¿Qué dispositivos son compatibles?",
        a: "Las integraciones actualmente disponibles están documentadas en el catálogo.",
      },
    ],
  },
  en: {
    kicker: "Family Mesh",
    badge: "In development · Not available",
    h1: "Family Mesh: in development, not available",
    sub: "Family Mesh is in development and is not yet available. We haven't announced a release date.",
    metaTitle: "Family Mesh: In Development | FitMesh Sync",
    metaDescription:
      "Family Mesh is in development and is not yet available. We haven't announced a release date.",
    ctaCatalog: "Explore the integrations catalog",
    ctaCatalogHref: "/en/integrations",
    why_h2: "Project characteristics",
    why_items: [
      {
        title: "Status",
        body: "Family Mesh is in development and is not yet available. We haven't announced a release date.",
      },
      {
        title: "Documented paths",
        body: "Currently available integrations are documented in the catalog.",
      },
    ],
    availability_h2: "Project status",
    availability_body:
      "Family Mesh is in development and is not yet available. We haven't announced a release date.",
    faq_kicker: "Frequently asked questions",
    faq_h2: "Questions and answers about the project",
    faqs: [
      {
        q: "When will Family Mesh be available?",
        a: "We haven't announced a release date. The current status is always on this page.",
      },
      {
        q: "Where can I find the latest status of Family Mesh?",
        a: "On this page, always kept up to date.",
      },
      {
        q: "Which devices are supported?",
        a: "Currently available integrations are documented in the catalog.",
      },
    ],
  },
  de: {
    kicker: "Mesh Familie",
    badge: "In Entwicklung · Nicht verfügbar",
    h1: "Mesh Familie: in Entwicklung, nicht verfügbar",
    sub: "Mesh Familie befindet sich in Entwicklung und ist noch nicht verfügbar. Wir haben kein Veröffentlichungsdatum angekündigt.",
    metaTitle: "Mesh Familie: in Entwicklung | FitMesh Sync",
    metaDescription:
      "Mesh Familie befindet sich in Entwicklung und ist noch nicht verfügbar. Wir haben kein Veröffentlichungsdatum angekündigt.",
    ctaCatalog: "Integrationskatalog ansehen",
    ctaCatalogHref: "/de/integrations",
    why_h2: "Projektmerkmale",
    why_items: [
      {
        title: "Status",
        body: "Mesh Familie befindet sich in Entwicklung und ist noch nicht verfügbar. Wir haben kein Veröffentlichungsdatum angekündigt.",
      },
      {
        title: "Dokumentierte Wege",
        body: "Die derzeit verfügbaren Integrationen sind im Katalog dokumentiert.",
      },
    ],
    availability_h2: "Projektstatus",
    availability_body:
      "Mesh Familie befindet sich in Entwicklung und ist noch nicht verfügbar. Wir haben kein Veröffentlichungsdatum angekündigt.",
    faq_kicker: "Häufige Fragen",
    faq_h2: "Fragen und Antworten zum Projekt",
    faqs: [
      {
        q: "Wann wird Mesh Familie verfügbar sein?",
        a: "Wir haben kein Veröffentlichungsdatum angekündigt. Der aktuelle Status steht immer auf dieser Seite.",
      },
      {
        q: "Wo finde ich den aktuellen Status von Mesh Familie?",
        a: "Auf dieser Seite, immer aktuell.",
      },
      {
        q: "Welche Geräte werden unterstützt?",
        a: "Die derzeit verfügbaren Integrationen sind im Katalog dokumentiert.",
      },
    ],
  },
  pt: {
    kicker: "Mesh Família",
    badge: "Em desenvolvimento · Não disponível",
    h1: "Mesh Família: em desenvolvimento, não disponível",
    sub: "O Mesh Família está em desenvolvimento e ainda não está disponível. Não anunciamos uma data de lançamento.",
    metaTitle: "Mesh Família: em desenvolvimento | FitMesh Sync",
    metaDescription:
      "O Mesh Família está em desenvolvimento e ainda não está disponível. Não anunciamos uma data de lançamento.",
    ctaCatalog: "Consultar o catálogo de integrações",
    ctaCatalogHref: "/pt/integrations",
    why_h2: "Características do projeto",
    why_items: [
      {
        title: "Status",
        body: "O Mesh Família está em desenvolvimento e ainda não está disponível. Não anunciamos uma data de lançamento.",
      },
      {
        title: "Caminhos documentados",
        body: "As integrações atualmente disponíveis estão documentadas no catálogo.",
      },
    ],
    availability_h2: "Status do projeto",
    availability_body:
      "O Mesh Família está em desenvolvimento e ainda não está disponível. Não anunciamos uma data de lançamento.",
    faq_kicker: "Perguntas frequentes",
    faq_h2: "Perguntas e respostas sobre o projeto",
    faqs: [
      {
        q: "Quando o Mesh Família estará disponível?",
        a: "Não anunciamos uma data de lançamento. O status atualizado está sempre nesta página.",
      },
      {
        q: "Onde encontro o status mais recente do Mesh Família?",
        a: "Nesta página, sempre atualizada.",
      },
      {
        q: "Quais dispositivos são compatíveis?",
        a: "As integrações atualmente disponíveis estão documentadas no catálogo.",
      },
    ],
  },
  fr: {
    kicker: "Mesh Famille",
    badge: "En développement · Non disponible",
    h1: "Mesh Famille : en développement, non disponible",
    sub: "Mesh Famille est en développement et n'est pas encore disponible. Nous n'avons pas annoncé de date de sortie.",
    metaTitle: "Mesh Famille : en développement | FitMesh Sync",
    metaDescription:
      "Mesh Famille est en développement et n'est pas encore disponible. Nous n'avons pas annoncé de date de sortie.",
    ctaCatalog: "Consulter le catalogue des intégrations",
    ctaCatalogHref: "/fr/integrations",
    why_h2: "Caractéristiques du projet",
    why_items: [
      {
        title: "Statut",
        body: "Mesh Famille est en développement et n'est pas encore disponible. Nous n'avons pas annoncé de date de sortie.",
      },
      {
        title: "Parcours documentés",
        body: "Les intégrations actuellement disponibles sont documentées dans le catalogue.",
      },
    ],
    availability_h2: "Statut du projet",
    availability_body:
      "Mesh Famille est en développement et n'est pas encore disponible. Nous n'avons pas annoncé de date de sortie.",
    faq_kicker: "Questions fréquentes",
    faq_h2: "Questions et réponses sur le projet",
    faqs: [
      {
        q: "Quand Mesh Famille sera-t-il disponible ?",
        a: "Nous n'avons pas annoncé de date de sortie. Le statut actualisé est toujours disponible sur cette page.",
      },
      {
        q: "Où puis-je trouver le statut le plus récent de Mesh Famille ?",
        a: "Sur cette page, toujours à jour.",
      },
      {
        q: "Quels appareils sont pris en charge ?",
        a: "Les intégrations actuellement disponibles sont documentées dans le catalogue.",
      },
    ],
  },
  pl: {
    kicker: "Mesh Rodzina",
    badge: "W trakcie tworzenia · Niedostępny",
    h1: "Mesh Rodzina: w trakcie tworzenia, niedostępny",
    sub: "Funkcja Mesh Rodzina jest w trakcie tworzenia i nie jest jeszcze dostępna. Nie ogłosiliśmy daty premiery.",
    metaTitle: "Mesh Rodzina: w trakcie tworzenia | FitMesh Sync",
    metaDescription:
      "Funkcja Mesh Rodzina jest w trakcie tworzenia i nie jest jeszcze dostępna. Nie ogłosiliśmy daty premiery.",
    ctaCatalog: "Sprawdź katalog integracji",
    ctaCatalogHref: "/pl/integrations",
    why_h2: "Założenia projektu",
    why_items: [
      {
        title: "Status",
        body: "Funkcja Mesh Rodzina jest w trakcie tworzenia i nie jest jeszcze dostępna. Nie ogłosiliśmy daty premiery.",
      },
      {
        title: "Udokumentowane ścieżki",
        body: "Obecnie dostępne integracje są udokumentowane w katalogu.",
      },
    ],
    availability_h2: "Status projektu",
    availability_body:
      "Funkcja Mesh Rodzina jest w trakcie tworzenia i nie jest jeszcze dostępna. Nie ogłosiliśmy daty premiery.",
    faq_kicker: "Często zadawane pytania",
    faq_h2: "Pytania i odpowiedzi dotyczące projektu",
    faqs: [
      {
        q: "Kiedy funkcja Mesh Rodzina będzie dostępna?",
        a: "Nie ogłosiliśmy daty premiery. Aktualny status znajdziesz zawsze na tej stronie.",
      },
      {
        q: "Gdzie znajdę najnowszy status funkcji Mesh Rodzina?",
        a: "Na tej stronie, zawsze aktualnej.",
      },
      {
        q: "Jakie urządzenia są obsługiwane?",
        a: "Obecnie dostępne integracje są udokumentowane w katalogu.",
      },
    ],
  },
  tr: {
    kicker: "Mesh Aile",
    badge: "Geliştiriliyor · Kullanılamıyor",
    h1: "Mesh Aile: geliştiriliyor, kullanılamıyor",
    sub: "Mesh Aile özelliği geliştirilme aşamasındadır ve henüz kullanılamamaktadır. Bir yayın tarihi açıklamadık.",
    metaTitle: "Mesh Aile: geliştiriliyor | FitMesh Sync",
    metaDescription:
      "Mesh Aile özelliği geliştirilme aşamasındadır ve henüz kullanılamamaktadır. Bir yayın tarihi açıklamadık.",
    ctaCatalog: "Entegrasyon kataloğunu inceleyin",
    ctaCatalogHref: "/tr/integrations",
    why_h2: "Proje özellikleri",
    why_items: [
      {
        title: "Durum",
        body: "Mesh Aile özelliği geliştirilme aşamasındadır ve henüz kullanılamamaktadır. Bir yayın tarihi açıklamadık.",
      },
      {
        title: "Belgelenmiş yollar",
        body: "Şu anda kullanılabilir olan entegrasyonlar katalogda belgelenmiştir.",
      },
    ],
    availability_h2: "Proje durumu",
    availability_body:
      "Mesh Aile özelliği geliştirilme aşamasındadır ve henüz kullanılamamaktadır. Bir yayın tarihi açıklamadık.",
    faq_kicker: "Sık sorulan sorular",
    faq_h2: "Projeyle ilgili sorular ve yanıtlar",
    faqs: [
      {
        q: "Mesh Aile ne zaman kullanıma sunulacak?",
        a: "Bir yayın tarihi açıklamadık. Güncel durum her zaman bu sayfada.",
      },
      {
        q: "Mesh Aile'nin en güncel durumunu nerede bulabilirim?",
        a: "Bu sayfada, her zaman güncel.",
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
