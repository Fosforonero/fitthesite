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
      : "About FitMesh Sync — The privacy-first health dashboard";
  const description =
    lc === "it"
      ? `FitMesh Sync sincronizza i dati del tuo smartwatch su una dashboard premium tutta tua. Privacy-first, acquisto unico ${PRICING.fromLifetime.it}, niente cloud opachi.`
      : lc === "es"
      ? `FitMesh Sync sincroniza los datos de tu smartwatch en un panel premium que es solo tuyo. Privacidad total, pago único desde ${PRICING.fromLifetime.en}, sin nubes opacas.`
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
  const t = (it: string, en: string, es: string) =>
    lc === "it" ? it : lc === "es" ? es : en;
  const path = `/${lc}/about`;

  // Precio para el locale actual (PRICING solo tiene it/en, añadimos es manualmente)
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
    name: t("Cos'è FitMesh Sync", "About FitMesh Sync", "Qué es FitMesh Sync"),
    url: `${SITE_URL}${path}`,
    inLanguage: lc === "it" ? "it-IT" : lc === "es" ? "es-ES" : "en-US",
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
      <Breadcrumbs items={[{ name: t("Chi siamo", "About", "Acerca de"), path }]} locale={lc} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
        {/* Hero */}
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t("Chi siamo", "About", "Acerca de")}
        </p>
        <h1 className="mt-3 font-display text-display-lg font-semibold tracking-tightest text-text-primary">
          {t(
            "I dati del tuo smartwatch ",
            "Your smartwatch data ",
            "Los datos de tu smartwatch ",
          )}
          <span className="text-brand-gradient">
            {t("sotto il tuo controllo.", "under your control.", "bajo tu control.")}
          </span>
        </h1>
        <p className="mt-5 text-text-secondary text-lg leading-relaxed">
          {t(
            "FitMesh Sync è un'app Android che legge i dati salute del tuo smartwatch (Galaxy Watch, Wear OS, Mi Band, e qualunque dispositivo che scriva su Health Connect) e li mostra su una dashboard web premium. Nessun account social. Nessun tracker pubblicitario. Nessun cloud opaco che decide cosa fare dei tuoi dati.",
            "FitMesh Sync is an Android app that reads health data from your smartwatch (Galaxy Watch, Wear OS, Mi Band, and any device that writes to Health Connect) and surfaces it on a premium web dashboard. No social accounts. No ad trackers. No opaque cloud deciding what to do with your data.",
            "FitMesh Sync es una app para Android que lee los datos de salud de tu smartwatch (Galaxy Watch, Wear OS, Mi Band y cualquier dispositivo que escriba en Health Connect) y los muestra en un panel web premium. Sin cuentas sociales. Sin rastreadores publicitarios. Sin nubes opacas que decidan qué hacer con tus datos.",
          )}
        </p>

        {/* ─── Cosa fa ─── */}
        <h2
          id="features"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t("Cosa fa, in concreto", "What it actually does", "Qué hace, en concreto")}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Ogni 15-30 minuti FitMesh legge in background le metriche che il tuo wearable ha sincronizzato con Health Connect:",
            "Every 15-30 minutes FitMesh reads in background the metrics your wearable has synced with Health Connect:",
            "Cada 15-30 minutos FitMesh lee en segundo plano las métricas que tu wearable ha sincronizado con Health Connect:",
          )}
        </p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-secondary">
          {[
            t("Passi e distanza giornaliera", "Daily steps and distance", "Pasos y distancia diaria"),
            t("Frequenza cardiaca (media, range, riposo)", "Heart rate (avg, range, resting)", "Frecuencia cardíaca (media, rango, reposo)"),
            t("Sonno con fasi (REM, profondo, leggero, sveglio)", "Sleep with stages (REM, deep, light, awake)", "Sueño con fases (REM, profundo, ligero, despierto)"),
            t("Calorie attive e basali", "Active and basal calories", "Calorías activas y basales"),
            t("VO₂ max e SpO₂ (se supportati)", "VO₂ max and SpO₂ (when supported)", "VO₂ max y SpO₂ (si son compatibles)"),
            t("HRV e dati allenamento dettagliati", "HRV and detailed workout data", "HRV y datos detallados de entrenamientos"),
            t("Peso e composizione corporea", "Weight and body composition", "Peso y composición corporal"),
            t("Piani saliti e dislivello", "Floors climbed and elevation gain", "Pisos subidos y desnivel acumulado"),
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
          )}
        </p>

        {/* ─── Dispositivi supportati ─── */}
        <h2
          id="devices"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t("Quali wearable funzionano", "Which wearables work", "Qué wearables son compatibles")}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Tutto ciò che scrive su Health Connect è supportato nativamente, quindi praticamente ogni smartwatch in commercio dal 2024:",
            "Anything that writes to Health Connect is supported natively, practically every smartwatch on the market since 2024:",
            "Todo dispositivo que escriba en Health Connect es compatible de forma nativa, es decir, prácticamente cualquier smartwatch en el mercado desde 2024:",
          )}
        </p>
        <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
          {[
            {
              h: t("Supportati nativamente", "Natively supported", "Compatibles de forma nativa"),
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
              h: t("In arrivo con OAuth dedicata", "Coming with dedicated OAuth", "Próximamente con OAuth dedicada"),
              items: [
                "Strava (Q3 2026)",
                "Oura Ring Gen 3/4 (Q4 2026)",
                t("Fitbit dati storici + GPS workout (Q3 2026)", "Fitbit historical + GPS workouts (Q3 2026)", "Fitbit historial + entrenamientos GPS (Q3 2026)"),
                t("Garmin Body Battery + Training Load (Q3 2026)", "Garmin Body Battery + Training Load (Q3 2026)", "Garmin Body Battery + Training Load (Q3 2026)"),
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
          {t("Privacy: nessun compromesso", "Privacy: no compromise", "Privacidad: sin compromisos")}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "I tuoi dati di salute non sono un prodotto. FitMesh non vende, non condivide, non profila. Nessuna integrazione con Google Analytics, Meta SDK, o ad network. L'app stessa è verificata Google Play Data Safety: nessuna raccolta di dati personali identificativi (PII).",
            "Your health data is not a product. FitMesh does not sell, share, or profile. No Google Analytics, no Meta SDK, no ad networks. The app itself is verified via Google Play Data Safety: no personally identifiable information (PII) collected.",
            "Tus datos de salud no son un producto. FitMesh no vende, no comparte ni crea perfiles. Sin Google Analytics, sin Meta SDK, sin redes publicitarias. La app está verificada en Google Play Data Safety: no se recopila ningún dato personal identificable (PII).",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Account: una sola email per il login (magic link Supabase oppure email/password). Nessun social login forzato.",
            "Account: one email for login (Supabase magic link or email/password). No forced social login.",
            "Cuenta: un solo correo para iniciar sesión (enlace mágico o correo y contraseña). Sin inicio de sesión social obligatorio.",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Vuoi cancellare l'account? Una mail a ",
            "Want to delete your account? One email to ",
            "¿Quieres eliminar tu cuenta? Un correo a ",
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
          )}
          <Link
            href={`/${lc}/privacy`}
            className="text-brand-aqua hover:text-brand-green underline underline-offset-4"
          >
            {t("Privacy Policy", "Privacy Policy", "Política de privacidad")}
          </Link>
          .
        </p>

        {/* ─── Prezzo ─── */}
        <h2
          id="pricing"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t("Quanto costa", "Pricing", "Precio")}
        </h2>
        <div className="mt-6 rounded-card border border-brand-aqua/30 bg-gradient-to-br from-brand-aqua/5 to-bg-card p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {t("Acquisto unico", "One-time purchase", "Pago único")}
          </p>
          <p className="mt-2 font-display text-display font-bold text-text-primary">
            {lifetimeBothShort}
          </p>
          <p className="mt-2 text-text-secondary leading-relaxed">
            {t(
              "Pay-once, own-forever. Niente abbonamento. Niente rinnovo automatico. Niente surprise alla prossima fattura.",
              "Pay-once, own-forever. No subscription. No auto-renewal. No surprise on your next bill.",
              "Pago único, tuyo para siempre. Sin suscripción. Sin renovación automática. Sin sorpresas en tu próxima factura.",
            )}
          </p>
          <p className="mt-3 text-sm text-text-muted">
            {t(
              "Versione free: sync 1×/giorno + ultimi 7 giorni in dashboard. Versione pagata: sync continuo + storico illimitato + backfill al primo collegamento + tutte le funzioni Pro future.",
              "Free tier: 1×/day sync + last 7 days in dashboard. Paid: continuous sync + unlimited history + initial backfill + all future Pro features.",
              "Versión gratuita: sincronización 1 vez al día + últimos 7 días en el panel. Versión de pago: sincronización continua + historial ilimitado + relleno inicial al conectar + todas las funciones Pro futuras.",
            )}
          </p>
        </div>

        {/* ─── Famiglia / caregiver ─── */}
        <h2
          id="family"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t("Modalità famiglia (in arrivo)", "Family mode (coming soon)", "Mesh Familia (próximamente)")}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Dal Q4 2026 attiveremo il gruppo famiglia: aggiungi parenti (es. un genitore anziano) e ricevi notifica se non sincronizzano al mattino. Pensato per chi vuole tenere d'occhio i propri cari senza diventare invasivo. Compliance GDPR esplicita: ogni utente del gruppo deve dare consenso scritto in-app per condividere i propri dati col caregiver.",
            "From Q4 2026 we'll enable family groups: add relatives (e.g. an elderly parent) and get notified if they don't sync in the morning. Built for people who want to keep an eye on loved ones without being invasive. Explicit GDPR compliance: each group member must give written in-app consent to share their data with the caregiver.",
            "Desde el Q4 de 2026 activaremos el grupo familiar: añade familiares (por ejemplo, un padre o madre mayor) y recibe una notificación si no sincronizan por la mañana. Diseñado para quienes quieren estar pendientes de sus seres queridos sin resultar invasivos. Cumplimiento explícito del RGPD: cada miembro del grupo debe dar su consentimiento escrito dentro de la app para compartir sus datos con los cuidadores.",
          )}
        </p>

        {/* ─── Chi sviluppa ─── */}
        <h2
          id="team"
          className="mt-16 font-display text-display font-semibold tracking-tightest text-text-primary"
        >
          {t("Chi c'è dietro", "Who's behind it", "Quién hay detrás")}
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "FitMesh Sync è un progetto indipendente sviluppato da Matteo Pizzi, sviluppatore software italiano. È nato per scrivere il \"layer mancante\" tra smartwatch e dashboard personale: tante app raccolgono dati di salute, pochissime te li restituiscono in modo davvero leggibile e tuo.",
            "FitMesh Sync is an independent project built by Matteo Pizzi, an Italian software developer. It started to fill the \"missing layer\" between smartwatch and personal dashboard: many apps collect health data, very few hand them back to you in a way that's truly readable and yours.",
            "FitMesh Sync es un proyecto independiente desarrollado por Matteo Pizzi, desarrollador de software italiano. Nació para cubrir el \"eslabón perdido\" entre el smartwatch y el panel personal: muchas apps recopilan datos de salud, pero muy pocas te los devuelven de una forma verdaderamente legible y tuya.",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Lo sviluppo è open source per le componenti che non toccano dati utente (sito, schema database, API specs). Il codice client app resta privato per ora: diventerà open source nel Q4 2026, una volta validato il modello di business.",
            "Development is open source for components that don't touch user data (site, database schema, API specs). The client app code remains private for now: it will go open source in Q4 2026, once the business model is validated.",
            "El desarrollo es de código abierto en los componentes que no manejan datos de usuario (sitio web, esquema de base de datos, especificaciones de API). El código de la app cliente permanece privado por ahora: pasará a ser de código abierto en el Q4 de 2026, una vez validado el modelo de negocio.",
          )}
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          {t(
            "Contatti: ",
            "Contact: ",
            "Contacto: ",
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
          )}
        </p>

        {/* ─── CTA finale ─── */}
        <div className="mt-16 rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8 text-center">
          <h3 className="font-display text-2xl font-semibold text-text-primary">
            {t("Pronto a provarlo?", "Ready to try it?", "¿Listo para probarlo?")}
          </h3>
          <p className="mt-3 text-text-secondary max-w-md mx-auto">
            {t(
              "Disponibile ora su Android. iOS in arrivo.",
              "Available now on Android. iOS coming soon.",
              "Disponible ahora en Android. iOS próximamente.",
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
