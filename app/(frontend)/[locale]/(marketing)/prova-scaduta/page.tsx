import type { Metadata } from "next";

import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { PLAY_STORE_URL, SITE_URL } from "@/lib/product-facts";

/**
 * Sprint "prova scaduta" — pagina di destinazione per chi ha perso il
 * diritto (trial finito, nessun acquisto attivo). Infrastruttura
 * PERMANENTE (blocco 5): destinazione unica verso cui punteranno il
 * paywall nativo, il supporto e ogni mail futura — non un salvataggio dei
 * 12 utenti reali di oggi (mediana 1 sync in tutta la vita dell'account).
 *
 * Decisioni prese esplicitamente con Matteo (non riaprire senza motivo):
 *
 * 1. NESSUN pulsante di pagamento web. Blocco 0: nessun percorso Stripe
 *    esiste nel codice (`billing_source` è `"google_play" | "apple_iap"`,
 *    Stripe non è nemmeno rappresentabile), zero righe mai scritte per
 *    apple_iap o stripe in `b2c_subscriptions`. Solo google_play funziona.
 *
 * 2. iOS resta informativo, MAI un invito all'acquisto. `concedi_ponte_ios`
 *    (appena in produzione) concede già 6 mesi Pro gratis alla prima sync
 *    dopo il muro — far pagare qui sarebbe vendere una cosa che stiamo
 *    regalando, e se paga via App Store il pagamento non verrebbe nemmeno
 *    registrato. Anti-steering: i nostri utenti iOS sono tutti sullo store
 *    IT (0 voti US/DE/UK/FR/ES), quindi nessun link cliccabile a un
 *    acquisto esterno.
 *
 * 3. La piattaforma NON si indovina a runtime. `devices.first_sync_platform`
 *    è sporco su tutta la tabella devices, ma la scoperta che ha chiuso la
 *    domanda è un'altra: il canale con portata reale è la mail, e la
 *    piattaforma di ogni destinatario la conosciamo già dal mittente
 *    (fitness_metrics.source: healthkit=iOS, health_connect=Android — 100%
 *    di copertura sui 12 utenti reali, zero contraddizioni con
 *    first_sync_platform dove entrambi esistono). Si passa quindi come
 *    query param (?p=ios / ?p=android) nel link della mail. Per gli arrivi
 *    organici (nessun param) si mostrano ENTRAMBE le strade in modo
 *    neutro — mai indovinare, nemmeno via User-Agent.
 *
 * 4. Solo IT per ora. I 12 utenti reali (senza diritto + almeno una riga
 *    fitness_metrics a source non nullo) sono TUTTI locale 'it' — 0 su 12
 *    in altre lingue. Tradurre in 13 lingue una pagina con una decina di
 *    lettori possibili è lavoro speso male; il routing [locale] esiste già
 *    e permette di aggiungere lingue quando servirà davvero, senza
 *    rifare nulla. Vedi generateStaticParams sotto.
 *
 * 5. Noindex. Pagina transazionale, non contenuto editoriale — stesso
 *    trattamento di /self-host.
 */

const PLATFORMS = ["ios", "android"] as const;
type Platform = (typeof PLATFORMS)[number];

function resolvePlatform(p: string | string[] | undefined): Platform | null {
  const value = Array.isArray(p) ? p[0] : p;
  return (PLATFORMS as readonly string[]).includes(value ?? "")
    ? (value as Platform)
    : null;
}

/** Solo IT: nessun utente reale in altre lingue oggi. Aggiungere qui quando
 * arriva una traduzione reale in dictionaries/<locale>.json. */
export function generateStaticParams() {
  return [{ locale: "it" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "it";
  return {
    title: "La tua prova è finita — FitMesh Sync",
    description:
      "Cosa succede al tuo accesso FitMesh Sync ora che la prova gratuita è finita.",
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/${lc}/prova-scaduta` },
  };
}

export default async function TrialExpiredPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string | string[] }>;
}) {
  const { locale } = await params;
  const { p } = await searchParams;
  const lc: Locale = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "it";
  const t = await getDictionary(lc);
  const te = t.app?.trialExpired;
  const platform = resolvePlatform(p);

  const showIos = platform === "ios" || platform === null;
  const showAndroid = platform === "android" || platform === null;
  const neutral = platform === null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
        {te?.title ?? "La tua prova gratuita è finita"}
      </h1>

      <div className="mt-10 space-y-6">
        {showIos && (
          <section className="rounded-card border border-divider bg-bg-card p-6 sm:p-8">
            {neutral && (
              <p className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
                {te?.chooseIos ?? "iPhone"}
              </p>
            )}
            <p className="text-text-secondary">
              {te?.iosBody ??
                "Il tuo accesso continua comunque: stiamo sistemando gli acquisti sull'App Store, e nel frattempo non perdi nulla. Non devi fare niente, l'app funziona già come prima."}
            </p>
            <p className="mt-3 text-sm text-text-muted">
              {te?.iosNote ??
                "Se in futuro vorrai un abbonamento pagato direttamente su App Store, ti avviseremo qui appena sarà pronto."}
            </p>
          </section>
        )}

        {showAndroid && (
          <section className="rounded-card border border-divider bg-bg-card p-6 sm:p-8">
            {neutral && (
              <p className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
                {te?.chooseAndroid ?? "Android"}
              </p>
            )}
            <p className="text-text-secondary">
              {te?.androidBody ?? "Qui puoi continuare subito."}
            </p>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex px-5 py-2.5 rounded-pill bg-brand-gradient text-bg-dark text-sm font-semibold hover:opacity-90 transition"
            >
              {te?.androidCta ?? "Apri il Play Store"}
            </a>
            <p className="mt-3 text-sm text-text-muted">
              {te?.androidHint ??
                "Se hai già FitMesh installata, aprila direttamente dal telefono e completa l'acquisto da lì."}
            </p>
          </section>
        )}
      </div>

      <p className="mt-10 text-sm text-text-muted">
        {te?.supportPrompt ?? "Domande?"}{" "}
        <a href={`/${lc}/support`} className="underline hover:text-text-secondary">
          {te?.supportCta ?? "Scrivi al supporto"}
        </a>
      </p>
    </div>
  );
}
