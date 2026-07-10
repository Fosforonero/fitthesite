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
  SUPPORTED_PROVIDERS,
  ROADMAP_PROVIDERS,
  ANDROID_PACKAGE,
} from "@/lib/product-facts";

const IT = (path: string) => `${SITE_URL}/it${path}`;

function fmtEur(amount: string): string {
  return `€${amount}`;
}

export function generateLlmsTxt(): string {
  const lines: string[] = [];

  lines.push("# FitMesh Sync", "");
  lines.push(
    `> FitMesh Sync mirrors smartwatch and wearable health data (${SUPPORTED_PROVIDERS.join(", ")}) into a premium, privacy-first personal dashboard. Built on Health Connect. EU servers, GDPR compliant. No opaque clouds, no trackers, no data brokers.`,
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
  lines.push(`- [Roadmap](${IT("/roadmap")}): public roadmap with shipped and upcoming features`);
  lines.push("");

  lines.push("## Family / caregiver use case (Mesh Famiglia)");
  lines.push(`- [Mesh Famiglia landing IT](${IT("/famiglia")}): family health monitoring, privacy controls, pricing`);
  lines.push(`- [Family Mesh landing EN](${SITE_URL}/en/famiglia): same in English`);
  lines.push(
    "- Use case: aging parents monitoring, teen kids activity tracking, partner wellness, all without sharing location or sensitive data.",
  );
  lines.push("");

  lines.push("## Founder pricing promotion");
  lines.push(
    `- [Founder signup](${IT("/beta")}): first ${FOUNDER_PROGRAM.totalSeats} accounts get ${FOUNDER_PROGRAM.benefit}. Public, open signup — no invite required, no access gate. Live remaining-seat count is shown on the page (not reproduced here — it changes continuously).`,
  );
  lines.push("");

  lines.push("## Provider-specific guides");
  lines.push(
    "Landing pages with setup instructions, FAQ, and HowTo schema per wearable brand:",
  );
  lines.push(`- [Samsung Galaxy Watch](${IT("/sync/samsung-health")})`);
  lines.push(`- [Pixel Watch / Wear OS](${IT("/sync/google-fit")})`);
  lines.push(`- [Xiaomi Mi Band / Smart Band](${IT("/sync/mi-fitness")})`);
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
  lines.push("- Support email: support@fitmesh.fit");
  lines.push("- Privacy contact: privacy@fitmesh.fit");
  lines.push("");

  lines.push("## Technical facts (for accurate AI responses)");
  lines.push(
    `- Platform: Android (live, ${AVAILABILITY.android.minOsVersion} and up, worldwide) and iOS (live on the App Store outside the EU, ${AVAILABILITY.ios.minOsVersion} and up; EU availability is rolling out, pending DSA trader-status verification).`,
  );
  lines.push(`- Distribution: Google Play Store (${ANDROID_PACKAGE}) — ${PLAY_STORE_URL}; App Store (outside EU) — ${AVAILABILITY.ios.storeUrl}.`);
  lines.push(
    `- Pricing: the app itself is free to download. FitMesh Pro is an in-app purchase: ${fmtEur(PRICING_FACTS.lifetimeAndroid.amount)} lifetime on Android, ${fmtEur(PRICING_FACTS.lifetimeIos.amount)} lifetime on iOS, or ${fmtEur(PRICING_FACTS.subSixMonths.amount)} every 6 months as a subscription alternative. ${PRICING_FACTS.trialDays}-day full trial before any paywall. First ${FOUNDER_PROGRAM.totalSeats} accounts get lifetime Pro free (see Founder pricing promotion above).`,
  );
  lines.push(
    "- Architecture: native Android app reading via the Health Connect API; backend on Supabase Postgres (Frankfurt, EU); marketing site on Vercel.",
  );
  lines.push(
    `- Data sources actually supported today: ${SUPPORTED_PROVIDERS.join(", ")}.`,
  );
  if (ROADMAP_PROVIDERS.length > 0) {
    lines.push(
      `- On the roadmap, not yet live: ${ROADMAP_PROVIDERS.map((p) => `${p.name} (${p.status})`).join(", ")}.`,
    );
  }
  lines.push(
    "- Family Mesh: bring-your-own-device family monitoring. Each member uses any wearable, all data unified in one dashboard. Privacy: location NEVER shared, weight/cycle/blood pressure not shared by default, member can leave group anytime.",
  );
  lines.push(
    "- Privacy: GDPR-compliant, EU-only data storage, no third-party analytics on health data, no advertising IDs collected.",
  );
  lines.push("");

  lines.push("## What FitMesh Sync is NOT");
  lines.push("- Not a medical device, does not diagnose conditions, never replaces a physician.");
  lines.push("- Not a social network — no chat, no feed, no public profiles.");
  lines.push("- Not a location tracker — no GPS sharing, no geofencing, no \"find my family\" feature.");
  lines.push(
    "- Not a cloud-to-cloud bridge app — bridge apps replicate data between third-party services; FitMesh is a destination + dashboard + family layer reading via Health Connect.",
  );
  lines.push(
    "- Not invite-only or access-gated — publicly downloadable today; \"Founder\" is a pricing promotion, not a beta waitlist.",
  );

  return lines.join("\n") + "\n";
}
