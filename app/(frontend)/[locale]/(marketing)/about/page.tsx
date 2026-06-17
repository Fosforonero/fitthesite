import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { PRICE_LIFETIME_ANDROID_RAW, PRICING } from "@/lib/pricing";

const SITE_URL = "https://www.fitmesh.fit";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const title =
    lc === "it"
      ? "Cos'è FitMesh Sync — La dashboard salute privacy-first"
      : lc === "es"
      ? "Qué es FitMesh Sync — El panel de salud con privacidad total"
      : lc === "de"
      ? "Was ist FitMesh Sync — Das datenschutzkonforme Gesundheits-Dashboard"
      : lc === "pt"
      ? "O que é FitMesh Sync — O painel de saúde com privacidade total"
      : lc === "fr"
      ? "Qu'est-ce que FitMesh Sync — Le tableau de bord santé axé sur la confidentialité"
      : "About FitMesh Sync — The privacy-first health dashboard";
  const description =
    lc === "it"
      ? `FitMesh Sync sincronizza i dati del tuo smartwatch su una dashboard premium tutta tua. Privacy-first, acquisto unico ${PRICING.fromLifetime.it}, niente cloud opachi.`
      : lc === "es"
      ? `FitMesh Sync sincroniza los datos de tu smartwatch en un panel premium que es solo tuyo. Privacidad total, pago único desde ${PRICING.fromLifetime.en}, sin nubes opacas.`
      : lc === "de"
      ? `FitMesh Sync überträgt deine Smartwatch-Daten auf ein Premium-Dashboard, das nur dir gehört. Datenschutz zuerst, Einmalkauf ab ${PRICING.fromLifetime.en}, keine intransparente Cloud.`
      : lc === "pt"
      ? `FitMesh Sync sincroniza os dados do seu smartwatch em um painel premium que é só seu. Privacidade total, compra única a partir de ${PRICING.fromLifetime.en}, sem nuvens opacas.`
      : lc === "fr"
      ? `FitMesh Sync synchronise les données de votre montre connectée vers un tableau de bord premium qui vous appartient. Confidentialité totale, achat unique à partir de ${PRICING.fromLifetime.en}, sans nuage opaque.`
      : `FitMesh Sync mirrors your smartwatch data to a premium dashboard that's all yours. Privacy-first, one-time ${PRICING.fromLifetime.en}, no opaque clouds.`;

  const path = `/${lc}/about`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/about`,
        en: `${SITE_URL}/en/about`,
        es: `${SITE_URL}/es/about`,
        de: `${SITE_URL}/de/about`,
        pt: `${SITE_URL}/pt/about`,
        fr: `${SITE_URL}/fr/about`,
        "x-default": `${SITE_URL}/it/about`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = (it: string, en: string, es: string, de: string, pt: string, fr: string) =>
    lc === "it" ? it : lc === "es" ? es : lc === "de" ? de : lc === "pt" ? pt : lc === "fr" ? fr : en;
  const path = `/${lc}/about`;

  // Precio para el locale actual
  const lifetimeBothShort =
    lc === "it"
      ? PRICING.lifetimeBothShort.it
      : lc === "es"
      ? "€3,99 Android · €4,99 iPhone"
      : PRICING.lifetimeBothShort.en;

  // AboutPage JSON-LD per knowledge graph
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: t(
      "Cos'è FitMesh Sync",
      "About FitMesh Sync",
      "Qué es FitMesh Sync",
      "Was ist FitMesh Sync",
      "O que é FitMesh Sync",
      "Qu'est-ce que FitMesh Sync",
    ),
    url: `${SITE_URL}${path}`,
    inLanguage:
      lc === "it"
        ? "it-IT"
        : lc === "es"
        ? "es-ES"
        : lc === "de"
        ? "de-DE"
        : lc === "pt"
        ? "pt-BR"
        : lc === "fr"
        ? "fr-FR"
        : "en-US",
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "FitMesh Sync",
      applicationCategory: "HealthApplication",
      operatingSystem: "ANDROID",
      offers: { "@type": "Offer", price: PRICE_LIFETIME_ANDROID_RAW, priceCurrency: "EUR" },
    },
  };

  return (
    <>
      <JsonLd data={aboutLd} />
      <Breadcrumbs
        items={[
          {
            name: t(
              "Chi siamo",
              "About",
              "Acerca de",
              "Über uns",
              "Sobre nós",
              "À propos",
            ),
            path,
          },
        ]}
        locale={lc}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
        {/* Hero */}
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t(
            "Chi siamo",
            "About",
            "Acerca de",
            "Über uns",
            "Sobre nós",
            "À propos",
          )}
        </p>
        <h1 className="mt-3 font-display text-display-lg font-semibold tracking-tightest text-text-primary">
          {t(
            "I dati del tuo smartwatch ",
            "Your smartwatch data ",
            "Los datos de tu smartwatch ",
            "Deine Smartwatch-Daten ",
            "Os dados do seu smartwatch ",
            "Les données de votre montre connectée ",
          )}
          <span className="text-brand-gradient">
            {t(
              "sotto il tuo controllo.",
              "under your control.",
              "bajo tu control.",
              "unter deiner Kontrolle.",
              "sob o seu controle.",
              "sous votre contrôle.",
            )}
          </span>
        </h1>
        <p className="mt-5 text-text-secondary text-lg leading-relaxed">
          {t(
            "FitMesh Sync è un'app Android che legge i dati salute del tuo smartwatch (Galaxy Watch, Wear OS, Mi Band, e qualunque dispositivo che scriva su Health Connect) e li mostra su una dashboard web premium. Nessun account social. Nessun tracker pubblicitario. Nessun cloud opaco che decide cosa fare dei tuoi dati.",
            "FitMesh Sync is an Android app that reads health data from your smartwatch (Galaxy Watch, Wear OS, Mi Band, and any device that writes to Health Connect) and surfaces it on a premium web dashboard. No social accounts. No ad trackers. No opaque cloud deciding what to do with your data.",
            "FitMesh Sync es una app para Android que lee los datos de salud de tu smartwatch (Galaxy Watch, Wear OS, Mi Band y cualquier dispositivo que escriba en Health Connect) y los muestra en un panel web premium. Sin cuentas sociales. Sin rastreadores publicitarios. Sin nubes opacas que decidan qué hacer con tus datos.",
            "FitMesh Sync ist eine Android-App, die Gesundheitsdaten deiner Smartwatch (Galaxy Watch, Wear OS, Mi Band und alle Geräte, die Daten in Health Connect schreiben) liest und auf einem Premium-Web-Dashboard anzeigt. Keine Social-Konten. Keine Werbe-Tracker. Keine intransparente Cloud, die entscheidet, was mit deinen Daten passiert.",
            "FitMesh Sync é um app para Android que lê os dados de saúde do seu smartwatch (Galaxy Watch, Wear OS, Mi Band e qualquer dispositivo que grave dados no Health Connect) e os exibe em um painel web premium. Sem contas sociais. Sem rastreadores de anúncios. Sem nuvens opacas decidindo o que fazer com seus dados.",
            "FitMesh Sync est une application Android qui lit les données de santé de votre montre connectée (Galaxy Watch, Wear OS, Mi Band et tout appareil écrivant dans Health Connect) et les affiche sur un tableau de bord web premium. Aucun compte social. Aucun traceur publicitaire. Aucun nuage opaque décidant de l'utilisation de vos données.",
          )}
        </p>

        {/* ─── Cosa fa ─── */}
        <h2
          id="features"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t(
            "Cosa fa, in concreto",
            "What it actually does",
            "Qué hace, en concreto",
            "Was es konkret tut",
            "O que ele faz, na prática",
            "Ce qu'il fait concrètement",
          )}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Ogni 15-30 minuti FitMesh legge in background le metriche che il tuo wearable ha sincronizzato con Health Connect:",
            "Every 15-30 minutes FitMesh reads in background the metrics your wearable has synced with Health Connect:",
            "Cada 15-30 minutos FitMesh lee en segundo plano las métricas que tu wearable ha sincronizado con Health Connect:",
            "Alle 15-30 Minuten liest FitMesh im Hintergrund die Metriken, die dein Wearable mit Health Connect synchronisiert hat:",
            "A cada 15-30 minutos, o FitMesh lê em segundo plano as métricas que seu wearable sincronizou com o Health Connect:",
            "Toutes les 15 à 30 minutes, FitMesh lit en arrière-plan les métriques que votre appareil connecté a synchronisées avec Health Connect:",
          )}
        </p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-secondary">
          {[
            t(
              "Passi e distanza giornaliera",
              "Daily steps and distance",
              "Pasos y distancia diaria",
              "Schritte und tägliche Distanz",
              "Passos e distância diária",
              "Pas et distance quotidienne",
            ),
            t(
              "Frequenza cardiaca (media, range, riposo)",
              "Heart rate (avg, range, resting)",
              "Frecuencia cardíaca (media, rango, reposo)",
              "Herzfrequenz (Durchschnitt, Bereich, Ruhewert)",
              "Frequência cardíaca (média, intervalo, repouso)",
              "Fréquence cardiaque (moyenne, plage, repos)",
            ),
            t(
              "Sonno con fasi (REM, profondo, leggero, sveglio)",
              "Sleep with stages (REM, deep, light, awake)",
              "Sueño con fases (REM, profundo, ligero, despierto)",
              "Schlaf mit Phasen (REM, Tiefschlaf, Leichtschlaf, wach)",
              "Sono com fases (REM, profundo, leve, acordado)",
              "Sommeil avec phases (REM, profond, léger, éveillé)",
            ),
            t(
              "Calorie attive e basali",
              "Active and basal calories",
              "Calorías activas y basales",
              "Aktive Kalorien und Grundumsatz-Kalorien",
              "Calorias ativas e basais",
              "Calories actives et de base",
            ),
            t(
              "VO₂ max e SpO₂ (se supportati)",
              "VO₂ max and SpO₂ (when supported)",
              "VO₂ max y SpO₂ (si son compatibles)",
              "VO₂ max und SpO₂ (wenn unterstützt)",
              "VO₂ max e SpO₂ (quando disponíveis)",
              "VO₂ max et SpO₂ (si pris en charge)",
            ),
            t(
              "HRV e dati allenamento dettagliati",
              "HRV and detailed workout data",
              "HRV y datos detallados de entrenamientos",
              "HRV und detaillierte Trainingsdaten",
              "HRV e dados detalhados de treinos",
              "HRV et données détaillées d'entraînement",
            ),
            t(
              "Peso e composizione corporea",
              "Weight and body composition",
              "Peso y composición corporal",
              "Gewicht und Körperzusammensetzung",
              "Peso e composição corporal",
              "Poids et composition corporelle",
            ),
            t(
              "Piani saliti e dislivello",
              "Floors climbed and elevation gain",
              "Pisos subidos y desnivel acumulado",
              "Gekletterte Etagen und Höhenunterschied",
              "Andares subidos e ganho de altitude",
              "Étages montés et dénivelé positif",
            ),
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-success mt-0.5 flex-shrink-0">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-text-secondary leading-relaxed">
          {t(
            "I dati vengono inviati al server che configuri tu: il nostro endpoint condiviso (default), una tua VPS, un NAS di casa o qualsiasi server FitMesh che può girare in self-hosting. Tu decidi dove vivono i tuoi dati di salute.",
            "Data is sent to the server you configure: our shared endpoint (default), your VPS, a home NAS, or any FitMesh-compatible server you self-host. You decide where your health data lives.",
            "Los datos se envían al servidor que tú configures: nuestro endpoint compartido (por defecto), tu VPS, un NAS doméstico o cualquier servidor compatible con FitMesh que puedas alojar tú mismo. Tú decides dónde viven tus datos de salud.",
            "Die Daten werden an den Server gesendet, den du konfigurierst: unseren gemeinsamen Endpunkt (Standard), deine eigene VPS, ein Heim-NAS oder jeden FitMesh-kompatiblen Server, den du selbst betreibst. Du entscheidest, wo deine Gesundheitsdaten gespeichert werden.",
            "Os dados são enviados para o servidor que você configurar: nosso endpoint compartilhado (padrão), sua própria VPS, um NAS doméstico ou qualquer servidor compatível com FitMesh que você mesmo hospede. Você decide onde seus dados de saúde ficam armazenados.",
            "Les données sont envoyées vers le serveur que vous configurez: notre point d'accès partagé (par défaut), votre propre VPS, un NAS domestique ou tout serveur compatible FitMesh que vous hébergez vous-même. Vous décidez où vivent vos données de santé.",
          )}
        </p>

        {/* ─── Dispositivi supportati ─── */}
        <h2
          id="devices"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t(
            "Quali wearable funzionano",
            "Which wearables work",
            "Qué wearables son compatibles",
            "Welche Wearables funktionieren",
            "Quais wearables são compatíveis",
            "Quels appareils connectés fonctionnent",
          )}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Tutto ciò che scrive su Health Connect è supportato nativamente, quindi praticamente ogni smartwatch in commercio dal 2024:",
            "Anything that writes to Health Connect is supported natively, practically every smartwatch on the market since 2024:",
            "Todo dispositivo que escriba en Health Connect es compatible de forma nativa, es decir, prácticamente cualquier smartwatch en el mercado desde 2024:",
            "Alles, was Daten in Health Connect schreibt, wird nativ unterstützt, also praktisch jede Smartwatch auf dem Markt seit 2024:",
            "Tudo que grava dados no Health Connect é compatível de forma nativa, ou seja, praticamente qualquer smartwatch disponível desde 2024:",
            "Tout appareil qui écrit dans Health Connect est pris en charge nativement, soit pratiquement toutes les montres connectées sur le marché depuis 2024:",
          )}
        </p>
        <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
          {[
            {
              h: t(
                "Supportati nativamente",
                "Natively supported",
                "Compatibles de forma nativa",
                "Nativ unterstützt",
                "Compatíveis de forma nativa",
                "Pris en charge nativement",
              ),
              items: [
                "Samsung Galaxy Watch 4 / 5 / 6 / 7 / Ultra",
                "Pixel Watch 1 / 2 / 3 + qualsiasi Wear OS",
                "Xiaomi Mi Band 7+ / Xiaomi Watch S/Active",
                "Fitbit (via app Fitbit → Health Connect)",
                "Garmin Forerunner/Fenix/Venu (via Garmin Connect)",
                "Polar Vantage/Grit X (via Polar Flow)",
                "Withings Body+/ScanWatch (via Health Mate)",
              ],
              color: "#31E981",
            },
            {
              h: t(
                "In arrivo con OAuth dedicata",
                "Coming with dedicated OAuth",
                "Próximamente con OAuth dedicada",
                "Demnächst verfügbar mit dediziertem OAuth",
                "Em breve com OAuth dedicado",
                "Bientôt disponible avec OAuth dédié",
              ),
              items: [
                "Strava (Q3 2026)",
                "Oura Ring Gen 3/4 (Q4 2026)",
                t(
                  "Fitbit dati storici + GPS workout (Q3 2026)",
                  "Fitbit historical + GPS workouts (Q3 2026)",
                  "Fitbit historial + entrenamientos GPS (Q3 2026)",
                  "Fitbit Verlaufsdaten + GPS-Workouts (Q3 2026)",
                  "Fitbit histórico + treinos GPS (Q3 2026)",
                  "Fitbit historique + séances GPS (Q3 2026)",
                ),
                t(
                  "Garmin Body Battery + Training Load (Q3 2026)",
                  "Garmin Body Battery + Training Load (Q3 2026)",
                  "Garmin Body Battery + Training Load (Q3 2026)",
                  "Garmin Body Battery + Training Load (Q3 2026)",
                  "Garmin Body Battery + Training Load (Q3 2026)",
                  "Garmin Body Battery + Training Load (Q3 2026)",
                ),
              ],
              color: "#21E6C1",
            },
          ].map((group) => (
            <div
              key={group.h}
              className="rounded-card border border-divider bg-bg-card p-5"
            >
              <p
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: group.color }}
              >
                {group.h}
              </p>
              <ul className="mt-3 space-y-1.5 text-text-secondary">
                {group.items.map((i) => (
                  <li key={i}>· {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-text-muted">
          {t(
            "Lista aggiornata e dettagli su ",
            "Up-to-date list and details on ",
            "Lista actualizada y detalles en ",
            "Aktuelle Liste und Details auf ",
            "Lista atualizada e detalhes em ",
            "Liste à jour et détails sur ",
          )}
          <Link
            href={`/${lc}/integrations`}
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            /integrations
          </Link>
          .
        </p>

        {/* ─── Privacy ─── */}
        <h2
          id="privacy"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t(
            "Privacy: nessun compromesso",
            "Privacy: no compromise",
            "Privacidad: sin compromisos",
            "Datenschutz: ohne Kompromisse",
            "Privacidade: sem concessões",
            "Confidentialité: sans compromis",
          )}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "I tuoi dati di salute non sono un prodotto. FitMesh non vende, non condivide, non profila. Nessuna integrazione con Google Analytics, Meta SDK, o ad network. L'app stessa è verificata Google Play Data Safety: nessuna raccolta di dati personali identificativi (PII).",
            "Your health data is not a product. FitMesh does not sell, share, or profile. No Google Analytics, no Meta SDK, no ad networks. The app itself is verified via Google Play Data Safety: no personally identifiable information (PII) collected.",
            "Tus datos de salud no son un producto. FitMesh no vende, no comparte ni crea perfiles. Sin Google Analytics, sin Meta SDK, sin redes publicitarias. La app está verificada en Google Play Data Safety: no se recopila ningún dato personal identificable (PII).",
            "Deine Gesundheitsdaten sind kein Produkt. FitMesh verkauft, teilt und profiliert nicht. Kein Google Analytics, kein Meta SDK, keine Werbenetzwerke. Die App ist über Google Play Data Safety verifiziert: Es werden keine personenbezogenen Daten (PII) erfasst.",
            "Seus dados de saúde não são um produto. FitMesh não vende, não compartilha e não cria perfis. Sem Google Analytics, sem Meta SDK, sem redes de publicidade. O app é verificado pelo Google Play Data Safety: nenhuma informação pessoal identificável (PII) é coletada.",
            "Vos données de santé ne sont pas un produit. FitMesh ne vend pas, ne partage pas et ne profile pas. Pas de Google Analytics, pas de Meta SDK, pas de réseaux publicitaires. L'application est vérifiée via Google Play Data Safety: aucune information personnelle identifiable (PII) n'est collectée.",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Account: una sola email per il login (magic link Supabase oppure email/password). Nessun social login forzato.",
            "Account: one email for login (Supabase magic link or email/password). No forced social login.",
            "Cuenta: un solo correo para iniciar sesión (enlace mágico o correo y contraseña). Sin inicio de sesión social obligatorio.",
            "Konto: eine einzige E-Mail für die Anmeldung (Supabase Magic Link oder E-Mail/Passwort). Kein erzwungenes Social-Login.",
            "Conta: um único e-mail para fazer login (magic link do Supabase ou e-mail/senha). Sem login social obrigatório.",
            "Compte: un seul e-mail pour la connexion (lien magique Supabase ou e-mail/mot de passe). Pas de connexion sociale imposée.",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Vuoi cancellare l'account? Una mail a ",
            "Want to delete your account? One email to ",
            "¿Quieres eliminar tu cuenta? Un correo a ",
            "Möchtest du dein Konto löschen? Eine E-Mail an ",
            "Quer excluir sua conta? Um e-mail para ",
            "Vous souhaitez supprimer votre compte? Un e-mail à ",
          )}
          <a
            href="mailto:privacy@fitmesh.fit"
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            privacy@fitmesh.fit
          </a>
          {t(
            " e in 7 giorni tutto è eliminato (anche i backup). Conformità GDPR completa: vedi ",
            " and within 7 days everything is gone (backups included). Full GDPR compliance: see ",
            " y en 7 días todo queda eliminado (incluidas las copias de seguridad). Cumplimiento total del RGPD: consulta la ",
            " und innerhalb von 7 Tagen ist alles gelöscht (einschließlich Backups). Vollständige DSGVO-Konformität: siehe ",
            " e em 7 dias tudo será excluído (incluindo os backups). Conformidade total com o RGPD: consulte a ",
            " et dans les 7 jours tout est supprimé (sauvegardes incluses). Conformité RGPD complète: consultez la ",
          )}
          <Link
            href={`/${lc}/privacy`}
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            {t(
              "Privacy Policy",
              "Privacy Policy",
              "Política de privacidad",
              "Datenschutzrichtlinie",
              "Política de Privacidade",
              "Politique de confidentialité",
            )}
          </Link>
          .
        </p>

        {/* ─── Prezzo ─── */}
        <h2
          id="pricing"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t(
            "Quanto costa",
            "Pricing",
            "Precio",
            "Preise",
            "Preços",
            "Tarifs",
          )}
        </h2>
        <div className="mt-6 rounded-card border border-brand-aqua/30 bg-gradient-to-br from-brand-aqua/5 to-bg-card p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t(
              "Acquisto unico",
              "One-time purchase",
              "Pago único",
              "Einmalkauf",
              "Compra única",
              "Achat unique",
            )}
          </p>
          <p className="mt-2 font-display text-display font-bold text-text-primary">
            {lifetimeBothShort}
          </p>
          <p className="mt-2 text-text-secondary leading-relaxed">
            {t(
              "Pay-once, own-forever. Niente abbonamento. Niente rinnovo automatico. Niente surprise alla prossima fattura.",
              "Pay-once, own-forever. No subscription. No auto-renewal. No surprise on your next bill.",
              "Pago único, tuyo para siempre. Sin suscripción. Sin renovación automática. Sin sorpresas en tu próxima factura.",
              "Einmal zahlen, für immer besitzen. Kein Abonnement. Keine automatische Verlängerung. Keine Überraschungen auf der nächsten Rechnung.",
              "Pague uma vez, tenha para sempre. Sem assinatura. Sem renovação automática. Sem surpresas na próxima fatura.",
              "Payez une fois, gardez pour toujours. Pas d'abonnement. Pas de renouvellement automatique. Pas de mauvaise surprise sur votre prochaine facture.",
            )}
          </p>
          <p className="mt-3 text-sm text-text-muted">
            {t(
              "Versione free: sync 1×/giorno + ultimi 7 giorni in dashboard. Versione pagata: sync continuo + storico illimitato + backfill al primo collegamento + tutte le funzioni Pro future.",
              "Free tier: 1×/day sync + last 7 days in dashboard. Paid: continuous sync + unlimited history + initial backfill + all future Pro features.",
              "Versión gratuita: sincronización 1 vez al día + últimos 7 días en el panel. Versión de pago: sincronización continua + historial ilimitado + relleno inicial al conectar + todas las funciones Pro futuras.",
              "Kostenlose Version: Synchronisierung 1×/Tag + letzte 7 Tage im Dashboard. Bezahlte Version: kontinuierliche Synchronisierung + unbegrenzte Verlaufsanzeige + erster Datenabruf beim Verbinden + alle zukünftigen Pro-Funktionen.",
              "Versão gratuita: sincronização 1×/dia + últimos 7 dias no painel. Versão paga: sincronização contínua + histórico ilimitado + importação inicial ao conectar + todas as futuras funções Pro.",
              "Version gratuite: synchronisation 1×/jour + 7 derniers jours dans le tableau de bord. Version payante: synchronisation continue + historique illimité + importation initiale à la connexion + toutes les futures fonctionnalités Pro.",
            )}
          </p>
        </div>

        {/* ─── Famiglia / caregiver ─── */}
        <h2
          id="family"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t(
            "Modalità famiglia (in arrivo)",
            "Family mode (coming soon)",
            "Mesh Familia (próximamente)",
            "Mesh Familie (demnächst verfügbar)",
            "Mesh Família (em breve)",
            "Mesh Famille (bientôt disponible)",
          )}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Dal Q4 2026 attiveremo il gruppo famiglia: aggiungi parenti (es. un genitore anziano) e ricevi notifica se non sincronizzano al mattino. Pensato per chi vuole tenere d'occhio i propri cari senza diventare invasivo. Compliance GDPR esplicita: ogni utente del gruppo deve dare consenso scritto in-app per condividere i propri dati col caregiver.",
            "From Q4 2026 we'll enable family groups: add relatives (e.g. an elderly parent) and get notified if they don't sync in the morning. Built for people who want to keep an eye on loved ones without being invasive. Explicit GDPR compliance: each group member must give written in-app consent to share their data with the caregiver.",
            "Desde el Q4 de 2026 activaremos el grupo familiar: añade familiares (por ejemplo, un padre o madre mayor) y recibe una notificación si no sincronizan por la mañana. Diseñado para quienes quieren estar pendientes de sus seres queridos sin resultar invasivos. Cumplimiento explícito del RGPD: cada miembro del grupo debe dar su consentimiento escrito dentro de la app para compartir sus datos con los cuidadores.",
            "Ab Q4 2026 aktivieren wir Familiengruppen: Füge Familienmitglieder (z. B. einen älteren Elternteil) hinzu und erhalte eine Benachrichtigung, wenn sie morgens nicht synchronisieren. Gedacht für Menschen, die ihre Liebsten im Blick behalten möchten, ohne aufdringlich zu sein. Explizite DSGVO-Konformität: Jedes Gruppenmitglied muss in der App schriftlich zustimmen, seine Daten mit der Betreuungsperson zu teilen.",
            "A partir do Q4 de 2026, ativaremos os grupos familiares: adicione familiares (por exemplo, um pai ou mãe idoso) e receba uma notificação se eles não sincronizarem pela manhã. Feito para quem quer acompanhar seus entes queridos sem ser invasivo. Conformidade explícita com o RGPD: cada membro do grupo deve dar consentimento por escrito no app para compartilhar seus dados com o cuidador.",
            "À partir du Q4 2026, nous activerons les groupes familiaux: ajoutez des proches (par exemple un parent âgé) et recevez une notification s'ils ne synchronisent pas le matin. Conçu pour ceux qui souhaitent garder un oeil sur leurs proches sans être intrusifs. Conformité RGPD explicite: chaque membre du groupe doit donner son consentement écrit dans l'application pour partager ses données avec l'aidant.",
          )}
        </p>

        {/* ─── Chi sviluppa ─── */}
        <h2
          id="team"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t(
            "Chi c'è dietro",
            "Who's behind it",
            "Quién hay detrás",
            "Wer steckt dahinter",
            "Quem está por trás",
            "Qui est derrière",
          )}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "FitMesh Sync è un progetto indipendente sviluppato da Matteo Pizzi, sviluppatore software italiano. È nato per scrivere il \"layer mancante\" tra smartwatch e dashboard personale: tante app raccolgono dati di salute, pochissime te li restituiscono in modo davvero leggibile e tuo.",
            "FitMesh Sync is an independent project built by Matteo Pizzi, an Italian software developer. It started to fill the \"missing layer\" between smartwatch and personal dashboard: many apps collect health data, very few hand them back to you in a way that's truly readable and yours.",
            "FitMesh Sync es un proyecto independiente desarrollado por Matteo Pizzi, desarrollador de software italiano. Nació para cubrir el \"eslabón perdido\" entre el smartwatch y el panel personal: muchas apps recopilan datos de salud, pero muy pocas te los devuelven de una forma verdaderamente legible y tuya.",
            "FitMesh Sync ist ein unabhängiges Projekt von Matteo Pizzi, einem italienischen Softwareentwickler. Es entstand, um die \"fehlende Schicht\" zwischen Smartwatch und persönlichem Dashboard zu schließen: Viele Apps sammeln Gesundheitsdaten, aber nur sehr wenige geben sie dir in einer wirklich lesbaren und für dich bestimmten Form zurück.",
            "FitMesh Sync é um projeto independente desenvolvido por Matteo Pizzi, desenvolvedor de software italiano. Nasceu para preencher a \"camada que faltava\" entre o smartwatch e o painel pessoal: muitos apps coletam dados de saúde, mas pouquíssimos os devolvem de forma verdadeiramente legível e sua.",
            "FitMesh Sync est un projet indépendant développé par Matteo Pizzi, développeur de logiciels italien. Il est né pour combler le \"chaînon manquant\" entre la montre connectée et le tableau de bord personnel: de nombreuses applications collectent des données de santé, mais très peu vous les restituent de manière vraiment lisible et qui vous appartient.",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Lo sviluppo è open source per le componenti che non toccano dati utente (sito, schema database, API specs). Il codice client app resta privato per ora: diventerà open source nel Q4 2026, una volta validato il modello di business.",
            "Development is open source for components that don't touch user data (site, database schema, API specs). The client app code remains private for now: it will go open source in Q4 2026, once the business model is validated.",
            "El desarrollo es de código abierto en los componentes que no manejan datos de usuario (sitio web, esquema de base de datos, especificaciones de API). El código de la app cliente permanece privado por ahora: pasará a ser de código abierto en el Q4 de 2026, una vez validado el modelo de negocio.",
            "Die Entwicklung ist Open Source für Komponenten, die keine Nutzerdaten berühren (Website, Datenbankschema, API-Spezifikationen). Der Client-App-Code bleibt vorerst privat: Er wird im Q4 2026 Open Source, sobald das Geschäftsmodell validiert ist.",
            "O desenvolvimento é open source para os componentes que não tocam em dados do usuário (site, esquema de banco de dados, especificações de API). O código do app cliente permanece privado por enquanto: tornará-se open source no Q4 de 2026, assim que o modelo de negócio for validado.",
            "Le développement est open source pour les composants qui ne touchent pas aux données utilisateurs (site, schéma de base de données, spécifications API). Le code de l'application cliente reste privé pour l'instant: il passera en open source au Q4 2026, une fois le modèle économique validé.",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Contatti: ",
            "Contact: ",
            "Contacto: ",
            "Kontakt: ",
            "Contato: ",
            "Contact: ",
          )}
          <a
            href="mailto:hello@fitmesh.fit"
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            hello@fitmesh.fit
          </a>
          {t(
            " per feature request, bug report, partnership o semplicemente per dire ciao.",
            " for feature requests, bug reports, partnerships or just to say hi.",
            " para sugerencias, informes de errores, colaboraciones o simplemente para saludar.",
            " für Feature-Anfragen, Fehlerberichte, Partnerschaften oder einfach um Hallo zu sagen.",
            " para sugestões, relatórios de erros, parcerias ou simplesmente para dizer olá.",
            " pour des demandes de fonctionnalités, des rapports de bugs, des partenariats ou simplement pour dire bonjour.",
          )}
        </p>

        {/* ─── CTA finale ─── */}
        <div className="mt-16 rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8 text-center">
          <h3 className="font-display text-2xl font-semibold text-text-primary">
            {t(
              "Pronto a provarlo?",
              "Ready to try it?",
              "¿Listo para probarlo?",
              "Bereit, es auszuprobieren?",
              "Pronto para experimentar?",
              "Prêt à l'essayer?",
            )}
          </h3>
          <p className="mt-3 text-text-secondary max-w-md mx-auto">
            {t(
              "Disponibile ora su Android. iOS in arrivo.",
              "Available now on Android. iOS coming soon.",
              "Disponible ahora en Android. iOS próximamente.",
              "Jetzt für Android verfügbar. iOS demnächst verfügbar.",
              "Disponível agora para Android. iOS em breve.",
              "Disponible maintenant sur Android. iOS bientôt disponible.",
            )}
          </p>
          <div className="mt-6 flex justify-center">
            <StoreButtonsRow locale={lc} className="justify-center" />
          </div>
        </div>
      </article>
    </>
  );
}
