import type { Metadata } from "next";

import { getDictionary, locales, ogLocale, type Locale } from "@/lib/i18n";
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
 * 4. Lingue: IT + EN ora, non "solo IT". La versione precedente diceva che
 *    i 12 utenti reali erano "tutti locale it" — falso: quel numero veniva
 *    da `profiles.locale`, colonna NOT NULL con DEFAULT 'it' che il client
 *    non sovrascrive mai (572/573 righe sono il default, non una misura).
 *    Stesso difetto su `profiles.time_zone` (572/573 = 'Europe/Rome' di
 *    default) — l'indagine sui pisolini l'ha scoperto derivando il fuso
 *    orario vero per utente altrove e trovando che solo 104/253 sono
 *    davvero UTC+2. Una colonna sempre uguale al suo default è peggio di
 *    una colonna assente: dà una risposta plausibile a chiunque la
 *    interroghi e nessuno la rimette in discussione.
 *
 *    Quante lingue oltre l'inglese non si decide dal fuso orario: verificato
 *    il 18/08 (vedi memoria `i18n-language-signal-weak-proxy`) che è un
 *    segnale forte solo per il 21% degli utenti (intervallo largo altrove =
 *    assenza di informazione, non stima) e comunque ambiguo sul blocco più
 *    numeroso (UTC+1/+2 copre IT/DE/FR/ES/PL/NL/SV/NO). Conferma che EN dopo
 *    IT è giustificato (~1/3 dei fissabili è fuori Europa), non quale sia la
 *    terza lingua. Quella risposta sta in App Store Connect / Play Console
 *    (lingua e paese per installazione, su tutti gli utenti), non nel
 *    database — lavoro futuro, non blocca questa release. Nel frattempo il
 *    ripiego per ogni locale del sito che non ha ancora `app.trialExpired`
 *    tradotto è l'inglese (vedi sotto), mai l'italiano: è la lingua del
 *    brand, non un fallback universale. Il blocco in fallback porta
 *    `lang="en"` (WCAG 3.1.2, vedi nel componente) — `lang` descrive il
 *    contenuto, non la route.
 *
 * 5. Slug singolo. "prova-scaduta" resta invariato in ogni lingua — è
 *    noindex, non viene mai digitato, e si raggiunge solo da un link
 *    costruito dall'app o da una mail. Slug localizzati moltiplicherebbero
 *    i modi in cui quel link può rompersi, per un beneficio di
 *    indicizzazione che con noindex non esiste.
 *
 * 6. Noindex. Pagina transazionale, non contenuto editoriale.
 */

const PLATFORMS = ["ios", "android"] as const;
type Platform = (typeof PLATFORMS)[number];

function resolvePlatform(p: string | string[] | undefined): Platform | null {
  const value = Array.isArray(p) ? p[0] : p;
  return (PLATFORMS as readonly string[]).includes(value ?? "")
    ? (value as Platform)
    : null;
}

/** Tutte le 15 lingue del sito — come la maggior parte delle pagine
 * marketing (about, integrations, novita, blog…), NON come /self-host,
 * /labs o /fitness-data-sync, che restano deliberatamente it/en perché lì
 * una lingua non coperta non deve produrre alcuna pagina pubblica. Qui il
 * caso è diverso: la pagina è noindex per ogni locale (punto 6 sopra, non
 * solo per le nordiche di `UNTRANSLATED_CONTENT_LOCALES`), quindi mostrare
 * inglese sotto un URL non ancora tradotto non ha il costo SEO che ha
 * altrove — e il ripiego runtime (`resolveTrialExpiredCopy` sotto) lo rende
 * comunque corretto, mai più italiano cablato a chi non lo parla. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Risolve `lc` per una request: locale valido → se stesso, altrimenti
 * inglese. Mai italiano come ripiego per una lingua sconosciuta — l'italiano
 * è la lingua del brand (default del *sito*), non il ripiego universale
 * per contenuto mancante. */
function resolveLocale(locale: string): Locale {
  return (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "en";
}

/** Copy della sezione per la lingua richiesta, o l'inglese se quel locale
 * non ha ancora `app.trialExpired` tradotto. Un solo posto dove vive la
 * copia inglese (dictionaries/en.json) — niente stringhe duplicate cablate
 * nel JSX che possono scollarsi dal dizionario vero nel tempo.
 *
 * `isFallback` dice se quella copia è davvero nella lingua di `lc` o è
 * inglese travestito — serve a marcare correttamente `lang` sul blocco di
 * contenuto (vedi WCAG 3.1.2 Language of Parts più sotto nel componente):
 * `lang` descrive la lingua del testo, non il locale della route. */
async function resolveTrialExpiredCopy(lc: Locale) {
  const t = await getDictionary(lc);
  if (t.app?.trialExpired) return { copy: t.app.trialExpired, isFallback: false };
  const en = await getDictionary("en");
  return { copy: en.app.trialExpired, isFallback: true };
}

/** Title/description del `<head>` erano rimasti fuori dal ripiego (trovato
 * da Matteo il 18/08: `<title>` italiano su /en/, dove il corpo aveva già
 * la traduzione vera — la matrice di verifica copriva corpo/lang/robots/`?p=`
 * ma non title/description, perché non si vedono guardando la pagina).
 * Stessa fonte e stesso ripiego del corpo: `resolveTrialExpiredCopy`. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lc = resolveLocale(locale);
  const path = `/${lc}/prova-scaduta`;
  const { copy: te } = await resolveTrialExpiredCopy(lc);
  const title = te.metaTitle;
  const description = te.metaDescription;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}${path}` },
    // openGraph/twitter esplicitati (non ereditati dal layout marketing,
    // che altrimenti mette il pitch generico del sito nella lingua della
    // route — es. svedese generico sotto un <title> italiano su un corpo
    // inglese, tre lingue sulla stessa pagina). Stesso pattern di
    // /self-host: title/description ripetuti, non un secondo testo OG.
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
  const lc = resolveLocale(locale);
  const { copy: te, isFallback } = await resolveTrialExpiredCopy(lc);
  const platform = resolvePlatform(p);

  const showIos = platform === "ios" || platform === null;
  const showAndroid = platform === "android" || platform === null;
  const neutral = platform === null;

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
      // WCAG 3.1.2 Language of Parts: `lang` sul documento (impostato dal
      // layout da `lc`) resta quello della route perché nav/footer sono
      // davvero tradotti. Ma quando questo blocco è in fallback il TESTO
      // dentro è inglese, non `lc` — un lettore di schermo o un traduttore
      // che leggesse `lang="sv"` qui pronuncerebbe/tradurrebbe inglese come
      // se fosse svedese. `lang` descrive la lingua del contenuto, non la
      // cartella in cui vive il file: regola generale, non specifica di
      // questa pagina — ogni futuro fallback va marcato allo stesso modo.
      lang={isFallback ? "en" : undefined}
    >
      <h1 className="font-display text-display-md font-semibold tracking-tightest text-text-primary">
        {te?.title ?? "Your free trial has ended"}
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
                "Your access keeps working: we're fixing purchases on the App Store, and in the meantime you don't lose anything. You don't need to do anything — the app works exactly as before."}
            </p>
            <p className="mt-3 text-sm text-text-muted">
              {te?.iosNote ??
                "If in the future you'd like a subscription paid directly through the App Store, we'll let you know here as soon as it's ready."}
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
              {te?.androidBody ?? "You can continue right away here."}
            </p>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex px-5 py-2.5 rounded-pill bg-brand-gradient text-bg-dark text-sm font-semibold hover:opacity-90 transition"
            >
              {te?.androidCta ?? "Open Play Store"}
            </a>
            <p className="mt-3 text-sm text-text-muted">
              {te?.androidHint ??
                "If you already have FitMesh installed, open it directly on your phone and complete the purchase from there."}
            </p>
          </section>
        )}
      </div>

      <p className="mt-10 text-sm text-text-muted">
        {te?.supportPrompt ?? "Questions?"}{" "}
        <a href={`/${lc}/support`} className="underline hover:text-text-secondary">
          {te?.supportCta ?? "Contact support"}
        </a>
      </p>
    </div>
  );
}
