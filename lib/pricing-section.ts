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
    it: "Inizia gratis. Da founder, Pro a vita.",
    en: "Start free. As a founder, lifetime Pro.",
    es: "Empieza gratis. Como founder, Pro de por vida.",
    de: "Kostenlos starten. Als Founder lebenslanges Pro.",
    pt: "Comece grátis. Como founder, Pro vitalício.",
    fr: "Commencez gratuitement. En founder, Pro à vie.",
  } as Localized,
  subhead: {
    it: "Nessun abbonamento obbligatorio. Il piano gratuito copre l'uso quotidiano; Pro sblocca storico illimitato, Mesh Famiglia ed export completo.",
    en: "No mandatory subscription. The free plan covers everyday use; Pro unlocks unlimited history, Family Mesh and full export.",
    es: "Sin suscripción obligatoria. El plan gratuito cubre el uso diario; Pro desbloquea historial ilimitado, Mesh Familia y exportación completa.",
    de: "Kein Pflicht-Abo. Der kostenlose Plan deckt den Alltag ab; Pro schaltet unbegrenzten Verlauf, Family Mesh und vollständigen Export frei.",
    pt: "Sem assinatura obrigatória. O plano gratuito cobre o uso diário; o Pro desbloqueia histórico ilimitado, Mesh Família e exportação completa.",
    fr: "Aucun abonnement obligatoire. Le plan gratuit couvre l'usage quotidien ; Pro débloque l'historique illimité, Mesh Famille et l'export complet.",
  } as Localized,

  // ── Tier: Free ─────────────────────────────────────────────────────
  freeName: { it: "Free", en: "Free" } as Localized,
  freeTagline: {
    it: "Per iniziare, gratis per sempre",
    en: "To get started, free forever",
    es: "Para empezar, gratis para siempre",
    de: "Zum Starten, für immer kostenlos",
    pt: "Para começar, grátis para sempre",
    fr: "Pour commencer, gratuit pour toujours",
  } as Localized,
  freeFeatures: {
    it: ["Dashboard unificata", "Storico 14 giorni", "Tutti i wearable via Health Connect"],
    en: ["Unified dashboard", "14-day history", "All wearables via Health Connect"],
    es: ["Dashboard unificado", "Historial de 14 días", "Todos los wearables vía Health Connect"],
    de: ["Vereinheitlichtes Dashboard", "14-Tage-Verlauf", "Alle Wearables über Health Connect"],
    pt: ["Dashboard unificado", "Histórico de 14 dias", "Todos os wearables via Health Connect"],
    fr: ["Tableau de bord unifié", "Historique de 14 jours", "Tous les wearables via Health Connect"],
  } as LocalizedList,

  // ── Tier: Pro ──────────────────────────────────────────────────────
  proName: { it: "Pro", en: "Pro" } as Localized,
  proTagline: {
    it: "Acquisto unico, niente abbonamenti",
    en: "One-time purchase, no subscriptions",
    es: "Pago único, sin suscripciones",
    de: "Einmalkauf, keine Abos",
    pt: "Compra única, sem assinaturas",
    fr: "Achat unique, sans abonnement",
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
