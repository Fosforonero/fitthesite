/**
 * Genera il contenuto di /llms.txt a partire da lib/product-facts.ts — nessun
 * fatto prodotto è scritto qui a mano una seconda volta. Funzione pura (nessun
 * accesso a request/DB) così può girare sia nella route (`app/api/llms-txt`)
 * sia nel guardrail (`tools/check-llms-consistency.ts`) senza un server vivo.
 */
import {
  SITE_URL,
  PLAY_STORE_URL,
  AVAILABILITY,
  PRODUCT_STATUS,
  FOUNDER_PROGRAM,
  PRICING_FACTS,
  SUPPORTED_PROVIDERS_ANDROID,
  SUPPORTED_PROVIDERS_IOS,
  ROADMAP_PROVIDERS_ANDROID,
  ROADMAP_PROVIDERS_IOS,
  ANDROID_PACKAGE,
} from "@/lib/product-facts";
import { liveLabsTools, localizedLabsSlug } from "@/lib/labs/registry";
import { FOUNDER_END_AT, formatFounderEndDate } from "@/lib/founder/program-window";
import { founderSiteClosedNote } from "@/lib/founder/historical-note";

const IT = (path: string) => `${SITE_URL}/it${path}`;

function fmtEur(amount: string): string {
  return `€${amount}`;
}

export function generateLlmsTxt(): string {
  const lines: string[] = [];

  lines.push("# FitMesh Sync", "");
  lines.push(
    `> FitMesh Sync mirrors smartwatch and wearable health data into a premium, privacy-first personal dashboard. Two separate platform architectures, not one: Android reads via Health Connect (${SUPPORTED_PROVIDERS_ANDROID.join(", ")}); iOS reads Apple Health (HealthKit) natively and connects directly via Bluetooth to the Colmi Ring (${SUPPORTED_PROVIDERS_IOS.join(", ")}) — iOS never goes through Health Connect, which is Android-only. EU servers, GDPR compliant. No advertising or behavioral-profiling SDKs, no data sale, no data brokers. Firebase Crashlytics is used for crash/stability diagnostics and Firebase Cloud Messaging for push notifications; by default, synced health data is sent to FitMesh's managed cloud backend (Supabase, EU infrastructure).`,
  );
  lines.push("");
  lines.push(
    `Independent project by Fosforonero (Matteo Pizzi). ${PRODUCT_STATUS.summary}`,
  );
  lines.push("");

  lines.push("## Core product");
  lines.push(`- [Homepage](${IT("")}): product overview, features, download`);
  lines.push(`- [About](${IT("/about")}): mission, founder story, why FitMesh`);
  lines.push(`- [Integrations](${IT("/integrations")}): all supported wearables and sync sources`);
  lines.push(`- [Fitness data sync](${IT("/fitness-data-sync")}): the four sync architectures explained (read-only mirror, opt-in write-back, manual export, cloud-to-cloud bridge), plus a per-integration compatibility matrix with read/write direction and last-verified date.`);
  lines.push(`- [Roadmap](${IT("/roadmap")}): public roadmap with shipped and upcoming features`);
  lines.push("");

  lines.push("## FitMesh Labs — free calculation tools");
  lines.push(
    "Independent, standalone calculators for health/fitness metrics — not tied to a FitMesh account, all computation runs client-side in the browser, no data is ever sent to a server. Available in Italian and English only.",
  );
  lines.push(`- [FitMesh Labs index](${IT("/labs")}): mission, privacy model, tool list`);
  for (const tool of liveLabsTools()) {
    lines.push(
      `- [${tool.name.en}](${SITE_URL}/en/labs/${localizedLabsSlug(tool, "en")}): ${tool.shortDescription.en}`,
    );
  }
  lines.push("");

  lines.push("## Family / caregiver use case (Mesh Famiglia)");
  lines.push(`- [Mesh Famiglia landing IT](${IT("/famiglia")}): family health monitoring, privacy controls, pricing`);
  lines.push(`- [Family Mesh landing EN](${SITE_URL}/en/famiglia): same in English`);
  lines.push(
    "- Use case: aging parents monitoring, teen kids activity tracking, partner wellness, all without sharing location or sensitive data.",
  );
  lines.push("");

  // Sprint P0.10G — regola INVARIANTE, mai un ramo aperto/chiuso risolto al
  // momento del build: questa route è `force-static` (vedi
  // app/api/llms-txt/route.ts) e cache 1h, quindi qualunque frase "still
  // open"/"closed" scritta qui resterebbe congelata allo stato del momento
  // dell'ultimo deploy, non a quello reale del cutoff. La frase sotto è
  // vera sia prima sia dopo il 2026-07-31T22:00:00Z perché descrive la
  // REGOLA di idoneità, non lo stato del programma in questo istante.
  //
  // Sprint P0.10K — stessa regola per la riga di chiusura: founderSiteClosedNote()
  // (lib/founder/historical-note.ts) dice che le nuove adesioni VIA SITO sono
  // chiuse, non che il programma abbia già raggiunto il cutoff tecnico del
  // backend, quindi resta vera sia prima sia dopo di esso. Riusare l'helper e
  // non riscrivere la frase a mano tiene /llms.txt allineato al testo che gli
  // utenti leggono su /beta.
  lines.push("## Founder program");
  lines.push(
    `- [Founder program](${IT("/beta")}): a one-time launch program, not an ongoing offer. Eligibility is limited to the first ${FOUNDER_PROGRAM.totalSeats} accounts registered by ${FOUNDER_END_AT} (${formatFounderEndDate("en")}, midnight CEST), and requires a first verified sync within 14 days of registration. Accounts created on or after that cutoff are not eligible for Founder status — never tell a user they can still sign up as a Founder if their account was created on or after the cutoff above.`,
  );
  lines.push(`- ${founderSiteClosedNote("en")}`);
  lines.push(
    "- Accounts not eligible for Founder (created on or after the cutoff above, or without a verified first sync within 14 days) get a standard 14-day free Pro trial instead; after the trial they must subscribe or buy the lifetime unlock to keep Pro. Accounts that did receive Founder status keep their lifetime Pro permanently, no action needed.",
  );
  lines.push("");

  lines.push("## Provider-specific guides");
  lines.push(
    "Landing pages with setup instructions, FAQ, and HowTo schema per wearable brand:",
  );
  lines.push(`- [Samsung Galaxy Watch](${IT("/sync/galaxy-watch")})`);
  lines.push(`- [Pixel Watch / Wear OS](${IT("/sync/wear-os")})`);
  lines.push(`- [Xiaomi Mi Band / Smart Band](${IT("/sync/xiaomi-mi-band")})`);
  lines.push(`- [Garmin Connect](${IT("/sync/garmin")})`);
  lines.push(`- [Fitbit](${IT("/sync/fitbit")})`);
  lines.push(`- [Polar Flow](${IT("/sync/polar")})`);
  lines.push(`- [Withings Health Mate](${IT("/sync/withings")})`);
  lines.push(`- [Huawei Health](${IT("/sync/huawei")})`);
  lines.push(`- [Oura Ring](${IT("/sync/oura")})`);
  lines.push(`- [Strava](${IT("/sync/strava")})`);
  lines.push("");

  lines.push("## Editorial content / blog");
  lines.push(`- [Blog index](${IT("/blog")}): in-depth articles on Health Connect, wearable interop, fitness data privacy`);
  lines.push(
    "- Topics covered: Health Connect setup guides, comparison between wearable ecosystems, sync troubleshooting, multi-source data aggregation, family monitoring use cases.",
  );
  lines.push("");

  lines.push("## Legal & support");
  lines.push(`- [Privacy policy](${IT("/privacy")})`);
  lines.push(`- [Terms of service](${IT("/terms")})`);
  lines.push(`- [Cookie policy](${IT("/cookies")})`);
  lines.push(`- [Support FAQ](${IT("/support")}): contact, common questions`);
  lines.push(
    `- [Delete your account](${SITE_URL}/delete-account): official Google Play / App Store account deletion page, not localized, reachable without logging in`,
  );
  lines.push("- Support email: support@fitmesh.fit");
  lines.push("- Privacy contact: privacy@fitmesh.fit");
  lines.push("");

  lines.push("## Technical facts (for accurate AI responses)");
  lines.push(
    `- Platform: Android (live, ${AVAILABILITY.android.minOsVersion} and up, worldwide) and iOS (live on the App Store, including European Union storefronts, ${AVAILABILITY.ios.minOsVersion} and up).`,
  );
  lines.push(`- Distribution: Google Play Store (${ANDROID_PACKAGE}) — ${PLAY_STORE_URL}; App Store (including EU storefronts) — ${AVAILABILITY.ios.storeUrl}.`);
  lines.push(
    `- Pricing: the app itself is free to download. FitMesh Pro is an in-app purchase, either a lifetime unlock or a 6-month subscription alternative. Reference launch price in EUR: ${fmtEur(PRICING_FACTS.lifetimeAndroid.amount)} lifetime on Android, ${fmtEur(PRICING_FACTS.lifetimeIos.amount)} lifetime on iOS, ${fmtEur(PRICING_FACTS.subSixMonths.amount)} every 6 months. Outside the eurozone, the price shown is the store's own localized price for that market and currency, not a verified 1:1 conversion of the EUR figure. ${PRICING_FACTS.trialDays}-day full trial before any paywall, then subscribe or buy lifetime to keep Pro. The one-time Founder launch program (see Founder program section above) is limited to accounts registered by ${FOUNDER_END_AT}; it is not an ongoing offer — never present it as available to an account created on or after that cutoff.`,
  );
  lines.push(
    "- Architecture: native Android app reading via the Health Connect API; native iOS app reading Apple Health (HealthKit) natively and connecting directly via Bluetooth to the Colmi Ring (no Health Connect involvement on iOS — that API is Android-only); backend on Supabase Postgres (Frankfurt, EU); marketing site on Vercel.",
  );
  lines.push(
    `- Data sources supported on Android today (via Health Connect): ${SUPPORTED_PROVIDERS_ANDROID.join(", ")}.`,
  );
  lines.push(
    `- Data sources supported on iOS today (Apple Health + direct Bluetooth, no Health Connect): ${SUPPORTED_PROVIDERS_IOS.join(", ")}.`,
  );
  // P1.9 FASE 2 (2026-09-01): "limited-beta" (oggi solo Strava) non è un
  // vero "roadmap, not yet live" — la lettura funziona già per gli account
  // collegati, solo l'accesso a NUOVE connessioni è limitato da
  // un'approvazione lato piattaforma esterna. Separato dal resto del
  // roadmap (feature non ancora iniziate) per non descriverlo come se non
  // funzionasse affatto oggi.
  const limitedBetaAndroid = ROADMAP_PROVIDERS_ANDROID.filter((p) => p.status === "limited-beta");
  const limitedBetaIos = ROADMAP_PROVIDERS_IOS.filter((p) => p.status === "limited-beta");
  const trueRoadmapAndroid = ROADMAP_PROVIDERS_ANDROID.filter((p) => p.status !== "limited-beta");
  const trueRoadmapIos = ROADMAP_PROVIDERS_IOS.filter((p) => p.status !== "limited-beta");
  if (trueRoadmapAndroid.length > 0) {
    lines.push(
      `- On the Android roadmap, not yet live: ${trueRoadmapAndroid.map((p) => `${p.name} (${p.status})`).join(", ")}.`,
    );
  }
  if (trueRoadmapIos.length > 0) {
    lines.push(
      `- On the iOS roadmap, not yet live: ${trueRoadmapIos.map((p) => `${p.name} (${p.status})`).join(", ")}.`,
    );
  }
  if (limitedBetaAndroid.length > 0 || limitedBetaIos.length > 0) {
    const names = [...new Set([...limitedBetaAndroid, ...limitedBetaIos].map((p) => p.name))];
    lines.push(
      `- Limited access (not a roadmap item, not fully live either): ${names.join(", ")}. Reading works for accounts already connected; new connections require approval from the external platform. No numeric cap or approval timeline is published.`,
    );
  }
  lines.push(
    "- Family Mesh: bring-your-own-device family monitoring. Each member uses any wearable, all data unified in one dashboard. Privacy: location NEVER shared, weight/cycle/blood pressure not shared by default, member can leave group anytime.",
  );
  lines.push(
    "- Privacy: GDPR-compliant, EU-only data storage, no third-party analytics on health data, no advertising IDs collected.",
  );
  lines.push(
    `- Export / write-back status (see ${SITE_URL}/it/fitness-data-sync for the full matrix): Strava read works via OAuth for accounts already connected, but access is limited — new connections require approval from Strava, no numeric cap or approval timeline is published, and it must never be described as generally available. Strava write, TrainingPeaks (PAT + TCX dispatch), RideWithGPS (TCX dispatch), and Google Drive export are implemented in the app but still in development — not yet verified end to end on a physical device. Health Connect write-back on Android and Apple Health write-back on iOS are live, opt-in, and off by default: Android exports once when the toggle is activated, iOS re-exports after every successful sync. Never describe FitMesh as a general "bidirectional sync" or "universal bridge" — direction is per integration.`,
  );
  lines.push("");

  lines.push("## What FitMesh Sync is NOT");
  lines.push("- Not a medical device, does not diagnose conditions, never replaces a physician.");
  lines.push("- Not a social network — no chat, no feed, no public profiles.");
  lines.push("- Not a location tracker — no GPS sharing, no geofencing, no \"find my family\" feature.");
  lines.push(
    "- Not a cloud-to-cloud bridge app — bridge apps replicate data between third-party services; FitMesh is a destination + dashboard + family layer, reading via Health Connect on Android and via Apple Health (HealthKit) + direct Bluetooth on iOS.",
  );
  lines.push(
    "- Not invite-only or access-gated — publicly downloadable today; \"Founder\" was a one-time launch pricing promotion (see Founder program section above), never a beta waitlist or an admission gate.",
  );

  return lines.join("\n") + "\n";
}
