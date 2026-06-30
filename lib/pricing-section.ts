/**
 * lib/pricing-section.ts — copy localizzata della sezione Pricing in homepage.
 *
 * I PREZZI vivono in lib/pricing.ts (unica fonte di verità): qui solo etichette
 * e feature. Strategia di lancio: enfasi sul tier Founder (Pro a vita gratis),
 * con il prezzo post-promo come riferimento. en come fallback per le lingue
 * non compilate (vedi tl()).
 */
import type { Localized, LocalizedList } from "@/lib/blog/types";

export const PRICING_SECTION = {
  kicker: {
    it: "Prezzi",
    en: "Pricing",
    es: "Precios",
    de: "Preise",
    pt: "Preços",
    fr: "Tarifs",
  } as Localized,
  heading: {
    it: "Prova 14 giorni. Da founder, Pro a vita.",
    en: "14-day trial. As a founder, lifetime Pro.",
    es: "Prueba de 14 días. Como founder, Pro de por vida.",
    de: "14 Tage testen. Als Founder lebenslanges Pro.",
    pt: "14 dias de teste. Como founder, Pro vitalício.",
    fr: "Essai de 14 jours. En founder, Pro à vie.",
  } as Localized,
  subhead: {
    it: "Provi tutto per 14 giorni, senza carta. Poi attivi il Pro a prezzo di lancio: abbonamento o sblocco a vita. I primi 1000 founder hanno il Pro a vita gratis.",
    en: "Try everything for 14 days, no card. Then go Pro at launch price: subscription or lifetime unlock. The first 1,000 founders get lifetime Pro free.",
    es: "Pruebas todo durante 14 días, sin tarjeta. Luego activas el Pro a precio de lanzamiento: suscripción o desbloqueo de por vida. Los primeros 1000 founders tienen Pro de por vida gratis.",
    de: "Du testest 14 Tage alles, ohne Karte. Dann holst du Pro zum Startpreis: Abo oder lebenslange Freischaltung. Die ersten 1000 Founder erhalten lebenslanges Pro gratis.",
    pt: "Experimentas tudo durante 14 dias, sem cartão. Depois ativas o Pro a preço de lançamento: assinatura ou desbloqueio vitalício. Os primeiros 1000 founders têm Pro vitalício grátis.",
    fr: "Vous essayez tout pendant 14 jours, sans carte. Ensuite vous passez à Pro au prix de lancement : abonnement ou achat à vie. Les 1000 premiers founders ont le Pro à vie gratuit.",
  } as Localized,

  // ── Tier: Prova (14 giorni) ────────────────────────────────────────
  freeName: { it: "Prova", en: "Trial" } as Localized,
  freeTagline: {
    it: "14 giorni, tutto incluso. Nessuna carta.",
    en: "14 days, everything included. No card.",
    es: "14 días, todo incluido. Sin tarjeta.",
    de: "14 Tage, alles inklusive. Keine Karte.",
    pt: "14 dias, tudo incluído. Sem cartão.",
    fr: "14 jours, tout inclus. Sans carte.",
  } as Localized,
  freeFeatures: {
    it: ["Tutte le funzioni Pro", "Dashboard e storico completi", "Poi scegli un piano"],
    en: ["All Pro features", "Full dashboard and history", "Then pick a plan"],
    es: ["Todas las funciones Pro", "Dashboard e historial completos", "Luego eliges un plan"],
    de: ["Alle Pro-Funktionen", "Volles Dashboard und Verlauf", "Dann wählst du einen Plan"],
    pt: ["Todas as funções Pro", "Dashboard e histórico completos", "Depois escolhes um plano"],
    fr: ["Toutes les fonctions Pro", "Tableau de bord et historique complets", "Ensuite choisissez un plan"],
  } as LocalizedList,

  // ── Tier: Pro ──────────────────────────────────────────────────────
  proName: { it: "Pro", en: "Pro" } as Localized,
  proTagline: {
    it: "Abbonamento o sblocco a vita",
    en: "Subscription or lifetime unlock",
    es: "Suscripción o desbloqueo de por vida",
    de: "Abo oder lebenslange Freischaltung",
    pt: "Assinatura ou desbloqueio vitalício",
    fr: "Abonnement ou achat à vie",
  } as Localized,
  proFeatures: {
    it: ["Storico illimitato", "Mesh Famiglia (caregiving)", "Export completo dei dati"],
    en: ["Unlimited history", "Family Mesh (caregiving)", "Full data export"],
    es: ["Historial ilimitado", "Mesh Familia (cuidado)", "Exportación completa de datos"],
    de: ["Unbegrenzter Verlauf", "Family Mesh (Pflege)", "Vollständiger Datenexport"],
    pt: ["Histórico ilimitado", "Mesh Família (cuidado)", "Exportação completa de dados"],
    fr: ["Historique illimité", "Mesh Famille (aidant)", "Export complet des données"],
  } as LocalizedList,

  // ── Tier: Founder (evidenziato) ────────────────────────────────────
  founderName: { it: "Founder", en: "Founder" } as Localized,
  founderBadge: {
    it: "Consigliato",
    en: "Recommended",
    es: "Recomendado",
    de: "Empfohlen",
    pt: "Recomendado",
    fr: "Recommandé",
  } as Localized,
  founderTagline: {
    it: "Primi 1000 account, attivazione automatica",
    en: "First 1,000 accounts, auto-activated",
    es: "Primeras 1000 cuentas, activación automática",
    de: "Erste 1000 Konten, automatisch aktiviert",
    pt: "Primeiras 1000 contas, ativação automática",
    fr: "1000 premiers comptes, activation automatique",
  } as Localized,
  founderFeatures: {
    it: ["Tutto Pro, a vita", "Zero costi, nessuna carta", "Accesso prioritario alla versione iOS"],
    en: ["Everything in Pro, for life", "Zero cost, no card", "Priority access to the iOS version"],
    es: ["Todo Pro, de por vida", "Coste cero, sin tarjeta", "Acceso prioritario a la versión iOS"],
    de: ["Alles aus Pro, lebenslang", "Keine Kosten, keine Karte", "Vorrangiger Zugang zur iOS-Version"],
    pt: ["Tudo do Pro, vitalício", "Custo zero, sem cartão", "Acesso prioritário à versão iOS"],
    fr: ["Tout Pro, à vie", "Coût zéro, sans carte", "Accès prioritaire à la version iOS"],
  } as LocalizedList,
  founderCta: {
    it: "Diventa founder",
    en: "Become a founder",
    es: "Hazte founder",
    de: "Founder werden",
    pt: "Torne-se founder",
    fr: "Devenir founder",
  } as Localized,
  freeLabel: {
    it: "Gratis",
    en: "Free",
    es: "Gratis",
    de: "Gratis",
    pt: "Grátis",
    fr: "Gratuit",
  } as Localized,
};
