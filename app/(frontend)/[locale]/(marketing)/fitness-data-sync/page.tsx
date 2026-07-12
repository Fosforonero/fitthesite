import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { organizationCompactRef } from "@/components/seo/OrganizationJsonLd";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";
import { FITNESS_DATA_SYNC_COMPLETE_LOCALES } from "@/lib/content/static-page-locales";
import {
  DETAILED_COMPATIBILITY,
  OTHER_PROVIDERS_COMPATIBILITY,
  FITNESS_DATA_SYNC_FAQ,
  type CompatibilityRow,
} from "@/lib/content/fitness-data-sync-copy";

/**
 * Landing commerciale "fitness data sync" (sprint P0.2, Fase 3).
 *
 * Route TOP-LEVEL (non /lp/[slug]): scelta deliberata per tenere questa
 * pagina commerciale fuori dal prefisso landing generico, per il cluster di
 * query "sync fitness data" / "combine fitness data" / "avoid duplicate
 * fitness data". Slug localizzati (IT "sincronizzazione-dati-fitness", DE,
 * ES) arriveranno in Fase 7 via next.config.mjs rewrites quando il
 * contenuto tradotto sarà pronto — per ora la route serve solo /en (le
 * altre 3 locale supportate, it/de/es, esistono come URL ma con contenuto
 * EN e robots noindex finché non tradotte, stesso pattern di about/page.tsx).
 *
 * Le altre 11 locale del sito NON sono in scope per questa pagina (sprint
 * esplicito: "Implementa inizialmente solo: EN; DE; ES; IT") → notFound().
 */

const FDS_LOCALES: readonly Locale[] = ["it", "en", "de", "es"];

const STATUS_LABEL: Record<CompatibilityRow["status"], string> = {
  live: "Live",
  "in-development": "In development",
  roadmap: "Roadmap",
  beta: "Beta",
};

const STATUS_COLOR: Record<CompatibilityRow["status"], string> = {
  live: "#31E981",
  "in-development": "#38BDF8",
  roadmap: "#94A3B8",
  beta: "#F5A623",
};

const DIRECTION_LABEL: Record<CompatibilityRow["direction"], string> = {
  read: "Read",
  write: "Write",
  "read-write": "Read + write-back",
  export: "Export",
};

function isTranslated(lc: Locale): boolean {
  return FITNESS_DATA_SYNC_COMPLETE_LOCALES.includes(lc);
}

export function generateStaticParams() {
  return FDS_LOCALES.map((locale) => ({ locale }));
}

function fdsLanguages(): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of FDS_LOCALES) {
    langs[l] = `${SITE_URL}/${l}/fitness-data-sync`;
  }
  langs["x-default"] = `${SITE_URL}/it/fitness-data-sync`;
  return langs;
}

const META_TITLE = "Sync Fitness Data Across Apps and Wearables | FitMesh";
const META_DESCRIPTION =
  "Combine fitness data from Health Connect, Apple Health and connected wearables into one dashboard. See exactly what's live, what's read-only, and what's still in development before you rely on it.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  if (!FDS_LOCALES.includes(lc)) return {};

  const path = `/${lc}/fitness-data-sync`;

  return {
    title: META_TITLE,
    description: META_DESCRIPTION,
    keywords: [
      "sync fitness data",
      "fitness data sync",
      "sync wearable data",
      "fitness data dashboard",
      "combine fitness data from multiple devices",
      "avoid duplicate fitness data",
    ].join(", "),
    robots: isTranslated(lc) ? undefined : { index: false, follow: true },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: fdsLanguages(),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title: META_TITLE,
      description: META_DESCRIPTION,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: FDS_LOCALES.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  };
}

function StatusBadge({ status }: { status: CompatibilityRow["status"] }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}55` }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function CompatibilityCard({ row }: { row: CompatibilityRow }) {
  return (
    <details className="card p-5 group [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary">{row.source}</span>
            <StatusBadge status={row.status} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {row.platform} · {DIRECTION_LABEL[row.direction]}
          </p>
        </div>
        <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform shrink-0">
          +
        </span>
      </summary>
      <div className="mt-4 space-y-2 text-sm text-text-secondary leading-relaxed">
        <p><span className="text-text-muted">Connection: </span>{row.connectionMethod}</p>
        <p><span className="text-text-muted">Data types: </span>{row.dataTypes}</p>
        <p><span className="text-text-muted">Authentication: </span>{row.authMethod}</p>
        <p><span className="text-text-muted">Default: </span>{row.defaultState}</p>
        <p><span className="text-text-muted">Sync frequency: </span>{row.syncFrequency}</p>
        <p><span className="text-text-muted">Limitations: </span>{row.limitations}</p>
        <p className="text-xs text-text-muted">Last verified: {row.lastVerified}</p>
        {row.detailHref && (
          <p className="pt-1">
            <Link href={row.detailHref} className="text-brand-aqua hover:text-brand-green underline underline-offset-4">
              Full setup guide →
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}

export default async function FitnessDataSyncPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  if (!FDS_LOCALES.includes(lc)) notFound();

  const path = `/${lc}/fitness-data-sync`;

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    name: META_TITLE,
    description: META_DESCRIPTION,
    url: `${SITE_URL}${path}`,
    inLanguage: schemaLanguage(lc),
    publisher: organizationCompactRef(),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FITNESS_DATA_SYNC_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const allRows = [...DETAILED_COMPATIBILITY, ...OTHER_PROVIDERS_COMPATIBILITY];

  return (
    <>
      <JsonLd data={webPageLd} />
      <JsonLd data={faqLd} />
      <Breadcrumbs items={[{ name: "Fitness data sync", path }]} locale={lc} />

      {/* HERO */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8">
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 opacity-40 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          Fitness data sync
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl leading-[1.1]">
          Sync all your fitness data into one dashboard
        </h1>

        {/* Risposta diretta, citabile fuori contesto (GEO) */}
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          FitMesh combines supported wearable data in one dashboard and can
          optionally write selected data or workouts to supported
          destinations. It reads from Health Connect (Android), Apple Health
          plus a direct Bluetooth connection to the Colmi ring (iOS), and a
          growing list of connected providers, then deduplicates overlapping
          metrics instead of double-counting them. It is not a universal
          bridge that syncs every fitness app to every other fitness app:
          check the compatibility table below for what's actually live for
          the source or destination you care about.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="#compatibility"
            className="inline-flex items-center px-6 py-3 rounded-pill btn-cta text-sm font-semibold"
          >
            See what's actually supported
          </Link>
          <Link
            href={`/${lc}/integrations`}
            className="inline-flex items-center px-6 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
          >
            Browse all integrations
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-14">
        {/* Il problema */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            Your fitness data is scattered across apps
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            A smartwatch reports steps to one app, a ring reports sleep and
            heart rate to another, a training platform holds your workout
            history, and none of them talk to each other by default. Checking
            five apps to answer "how did I sleep, and how hard did I train
            this week" isn't a data problem, it's a dashboard problem. On top
            of that, the same step count or heart-rate reading often gets
            reported twice, once by your phone and once by your watch, which
            inflates totals if nothing deduplicates them.
          </p>
        </div>

        {/* Definizione "fitness data sync" */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            What is fitness data sync?
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Fitness data sync covers three different things people usually
            mean by it: moving data from one specific app to another (a
            bridge), giving every app a shared place to read and write health
            data on the same device (a platform health hub, like Health
            Connect on Android or Apple Health on iOS), or reading from
            multiple sources and showing them together in one independent
            view (a dashboard). They solve different problems and none of
            them fully replaces the others.
          </p>
        </div>

        {/* Health hub vs bridge vs dashboard */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            Health hub, bridge app, or independent dashboard?
          </h2>
          <div className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
            <div className="card p-5">
              <p className="font-semibold text-text-primary">Health hub</p>
              <p className="mt-2 text-text-secondary leading-relaxed">
                Built into the OS (Health Connect, Apple Health). Apps read
                and write to it directly. No dashboard of its own, and it
                only sees what's on that one device.
              </p>
            </div>
            <div className="card p-5">
              <p className="font-semibold text-text-primary">Bridge app</p>
              <p className="mt-2 text-text-secondary leading-relaxed">
                Moves data from one specific source to one specific
                destination, usually for a narrow, well-defined use case.
                Not built to show you an overview.
              </p>
            </div>
            <div className="card p-5">
              <p className="font-semibold text-text-primary">
                Independent dashboard
              </p>
              <p className="mt-2 text-text-secondary leading-relaxed">
                Reads from multiple connected sources at once, deduplicates
                overlapping data, and shows it together. This is what
                FitMesh is. It doesn't promise to write everywhere a bridge
                app might.
              </p>
            </div>
          </div>
        </div>

        {/* Come funziona FitMesh + diagramma testuale accessibile */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            How FitMesh works
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            The typical flow is: your wearable or its companion app writes
            data to a platform health store (Health Connect on Android) or
            FitMesh reads it directly (Apple Health and the Colmi ring on
            iOS, or an OAuth-connected provider like Strava). FitMesh reads
            from every source you've connected, resolves overlaps between
            them, and shows the result in one dashboard. If you opt in,
            FitMesh can write its deduplicated result back to Health Connect
            or Apple Health, or export individual workouts to a training
            platform, only for the specific destinations listed as
            supporting that in the table below.
          </p>
          <ol className="mt-6 space-y-3">
            {[
              "Wearable or companion app (Samsung Health, Garmin Connect, Strava, ...)",
              "Health Connect (Android) or Apple Health / direct Bluetooth (iOS)",
              "FitMesh reads, deduplicates, and fuses the data",
              "Dashboard, and optionally: write-back or export, only where supported",
            ].map((step, i) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-brand-aqua/15 text-brand-aqua text-sm font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-text-secondary leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Matrice compatibilità */}
        <div id="compatibility" className="scroll-mt-20">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            Compatibility matrix
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Every row below is verified against the app's actual code, not
            just its marketing claims, including whether the feature is
            reachable from a real UI screen, not only implemented in the
            backend. "In development" means the code exists but isn't
            connected to anything a user can tap yet. "Roadmap" means it
            isn't built.
          </p>
          <p className="mt-6 text-xs uppercase tracking-wider text-text-muted font-semibold">
            Core integrations
          </p>
          <div className="mt-3 space-y-3">
            {DETAILED_COMPATIBILITY.map((row) => (
              <CompatibilityCard key={row.source} row={row} />
            ))}
          </div>
          <p className="mt-8 text-xs uppercase tracking-wider text-text-muted font-semibold">
            Other providers (via Health Connect or direct connection)
          </p>
          <div className="mt-3 space-y-3">
            {OTHER_PROVIDERS_COMPATIBILITY.map((row) => (
              <CompatibilityCard key={row.source} row={row} />
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">
            {allRows.length} sources listed, all last verified 2026-07-12. See{" "}
            <Link href={`/${lc}/integrations`} className="text-brand-aqua hover:text-brand-green underline underline-offset-4">
              /integrations
            </Link>{" "}
            for the always-current list.
          </p>
        </div>

        {/* Come FitMesh previene i loop di sync */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            How FitMesh prevents sync loops
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Writing fused data back into a health store creates an obvious
            risk: if FitMesh then reads that same data back on its next sync,
            it could double-count it or loop indefinitely. FitMesh avoids
            this with a few concrete rules:
          </p>
          <ul className="mt-4 space-y-2 text-text-secondary text-sm leading-relaxed list-disc list-inside">
            <li>Write-back is off by default. You turn it on explicitly in Settings for Health Connect and Apple Health separately.</li>
            <li>Every record FitMesh writes is tagged with its own source identifier, and FitMesh's own read pass filters out records carrying that tag, so it never re-ingests its own writes as if they were a new external source.</li>
            <li>When multiple real sources report the same metric for the same period, FitMesh applies per-metric fusion rules (pick the more complete source, fill gaps from others) instead of summing every source together.</li>
            <li>Cross-app export (sending an individual workout to a training platform) is a one-way, user-triggered action, not a background loop: nothing FitMesh exports gets read back in.</li>
          </ul>
        </div>

        {/* Android vs iPhone vs web */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            Android, iPhone, and the web dashboard
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            On Android, FitMesh reads from Health Connect, which is fed by
            whatever companion apps you already have installed. On iPhone,
            FitMesh reads from Apple Health and can also connect directly to
            the Colmi ring over Bluetooth, without needing Apple Health as an
            intermediary for that specific device. The dashboard itself is
            available on the web in addition to the mobile apps, so you can
            check your data without opening your phone.
          </p>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Write-back also behaves differently per platform. On Android,
            turning on Health Connect write-back exports once at that moment;
            it doesn't keep exporting automatically as new data comes in, you
            need to toggle it off and on again to re-export. On iOS, once you
            turn on Apple Health write-back, FitMesh re-exports after every
            successful sync.
          </p>
        </div>

        {/* Privacy, storage, export */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            Privacy, storage, and export
          </h2>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Your data is stored on EU servers. You control every write-back
            toggle individually, and you can export your own workouts as GPX
            or TCX files at any time (a Pro feature) via the native share
            sheet, to keep your own copy outside FitMesh. Saving exports
            directly to Google Drive is in development.
          </p>
        </div>

        {/* Limiti dichiarati */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            What FitMesh doesn't do
          </h2>
          <ul className="mt-4 space-y-2 text-text-secondary text-sm leading-relaxed list-disc list-inside">
            <li>It doesn't sync every fitness app to every other fitness app. Check the compatibility table for the specific source or destination you need.</li>
            <li>Sending workouts to Strava, TrainingPeaks or RideWithGPS is still in development, not available today. Saving exports directly to Google Drive is also in development; use the share sheet instead.</li>
            <li>Write-back to Health Connect and Apple Health doesn't cover every metric (no HRV write on either platform, no weight write on Android).</li>
            <li>Write-back timing differs by platform: Health Connect (Android) exports once per toggle activation, not continuously; Apple Health (iOS) re-exports after every successful sync.</li>
            <li>FIT file export isn't available (licensing); GPX and TCX are.</li>
          </ul>
        </div>

        {/* Setup */}
        <div>
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            Getting started
          </h2>
          <ol className="mt-4 space-y-3">
            {[
              "Download FitMesh and sign in.",
              "Grant Health Connect (Android) or Apple Health (iOS) permission when prompted.",
              "Connect any additional providers you use (Strava, Garmin, and others) from Settings.",
              "Optionally turn on write-back to Health Connect or Apple Health once you're happy with what the dashboard shows.",
            ].map((step, i) => (
              <li key={step} className="flex gap-4 items-start">
                <span className="w-7 h-7 rounded-full bg-brand-aqua/15 text-brand-aqua text-sm font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-text-secondary leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mt-4 pb-12">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          Frequently asked questions
        </h2>
        <div className="mt-6 space-y-4">
          {FITNESS_DATA_SYNC_FAQ.map((f) => (
            <details key={f.q} className="card p-5 group [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer flex items-start justify-between gap-4 text-text-primary font-medium">
                <span>{f.q}</span>
                <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA finale */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-20 text-center">
        <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
          Ready to see your data in one place?
        </h2>
        <p className="mt-4 text-text-secondary max-w-xl mx-auto">
          Download FitMesh, connect the sources you use, and see exactly
          what's live before you rely on it.
        </p>
        <div className="mt-8 flex justify-center">
          <StoreButtonsRow locale={lc} className="justify-center" />
        </div>
      </section>
    </>
  );
}
