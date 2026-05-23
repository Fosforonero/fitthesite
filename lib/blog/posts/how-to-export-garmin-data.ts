import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "how-to-export-garmin-data",
  category: "guides",
  publishedAt: "2026-05-23",
  updatedAt: "2026-05-23",
  readMinutes: 9,
  primaryKeyword: {
    it: "esportare dati garmin connect",
    en: "how to export garmin data",
  },
  secondaryKeywords: {
    it: [
      "scaricare allenamenti garmin",
      "garmin export gpx tcx fit",
    ],
    en: [
      "export garmin data to strava",
      "download garmin connect activities",
      "garmin gpx export",
      "garmin tcx fit export",
      "garmin bulk data export",
    ],
  },
  metaDescription: {
    it: "Come esportare dati Garmin in inglese: GPX, TCX, FIT, bulk export, e API. Guida pratica con step-by-step per ogni metodo.",
    en: "How to export Garmin data: step-by-step guide for GPX, TCX, FIT, bulk export, and API integration. What works, what doesn't, and the honest limits of each method.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Come esportare dati Garmin: GPX, FIT, bulk e API",
      en: "How to export Garmin data: GPX, FIT, bulk and API — complete guide",
    },
    subtitle: {
      it: "I tuoi dati Garmin sono tuoi. Ecco ogni modo per portarli fuori dal cloud Garmin — con i limiti onesti di ciascun metodo.",
      en: "Your Garmin data is yours. Here's every way to get it out of Garmin's cloud — with the honest limitations of each method.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "You've logged thousands of miles on your Garmin. Maybe you're switching to Strava, maybe you want a backup before changing devices, maybe you just believe your data shouldn't be locked into one company's cloud. Whatever the reason, getting your data out of Garmin Connect is more doable than most people realize — with some important caveats about what you can and can't do from the mobile app.",
        en: "You've logged thousands of miles on your Garmin. Maybe you're switching to Strava, maybe you want a backup before changing devices, maybe you just believe your data shouldn't be locked into one company's cloud. Whatever the reason, getting your data out of Garmin Connect is more doable than most people realize — with some important caveats about what you can and can't do from the mobile app.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "The mobile app limitation: know this first",
        en: "The mobile app limitation: know this first",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "The Garmin Connect mobile app — both Android and iOS — does not have an export function. You can view your activities, share screenshots, and connect third-party apps, but you cannot export a GPX, TCX, or FIT file from the app. This is an intentional product decision by Garmin, not a bug.",
        en: "The Garmin Connect mobile app — both Android and iOS — does not have an export function. You can view your activities, share screenshots, and connect third-party apps, but you cannot export a GPX, TCX, or FIT file from the app. This is an intentional product decision by Garmin, not a bug.",
      },
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "Website required for file exports", en: "Website required for file exports" },
      body: {
        it: "To export individual activities or bulk data, you need connect.garmin.com in a browser — desktop or mobile browser both work. Bookmark it if you do this regularly.",
        en: "To export individual activities or bulk data, you need connect.garmin.com in a browser — desktop or mobile browser both work. Bookmark it if you do this regularly.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Method 1: Export a single activity",
        en: "Method 1: Export a single activity",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "This is the fastest way to get one specific workout out of Garmin Connect. The process takes about 30 seconds once you know where to click.",
        en: "This is the fastest way to get one specific workout out of Garmin Connect. The process takes about 30 seconds once you know where to click.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Go to connect.garmin.com and sign in.",
          "Click 'Activities' in the left sidebar.",
          "Click the specific activity you want to export.",
          "In the top-right area of the activity detail page, click the gear icon (⚙) or the three-dot menu.",
          "Choose your format: 'Export Original' (FIT file), 'Export as GPX', or 'Export as TCX'.",
          "The file downloads to your default downloads folder.",
        ],
        en: [
          "Go to connect.garmin.com and sign in.",
          "Click 'Activities' in the left sidebar.",
          "Click the specific activity you want to export.",
          "In the top-right area of the activity detail page, click the gear icon (⚙) or the three-dot menu.",
          "Choose your format: 'Export Original' (FIT file), 'Export as GPX', or 'Export as TCX'.",
          "The file downloads to your default downloads folder.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Understanding the file formats: which one do you need?",
        en: "Understanding the file formats: which one do you need?",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Garmin offers three formats from the web interface. Each has different trade-offs for data completeness and compatibility.",
        en: "Garmin offers three formats from the web interface. Each has different trade-offs for data completeness and compatibility.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Garmin export format comparison",
        en: "Garmin export format comparison",
      },
      headers: {
        it: ["Format", "Data included", "Best for", "Downside"],
        en: ["Format", "Data included", "Best for", "Downside"],
      },
      rows: [
        {
          it: ["FIT (original)", "Everything: GPS, HR, cadence, power, Garmin-proprietary metrics", "Full backup, re-importing to Garmin later, GoldenCheetah, Intervals.icu", "Binary format — you need tools to read it"],
          en: ["FIT (original)", "Everything: GPS, HR, cadence, power, Garmin-proprietary metrics", "Full backup, re-importing to Garmin later, GoldenCheetah, Intervals.icu", "Binary format — you need tools to read it"],
        },
        {
          it: ["GPX", "GPS track, timestamps, basic HR", "Strava import, route sharing, mapping tools, Komoot", "Loses power data, running cadence, proprietary metrics"],
          en: ["GPX", "GPS track, timestamps, basic HR", "Strava import, route sharing, mapping tools, Komoot", "Loses power data, running cadence, proprietary metrics"],
        },
        {
          it: ["TCX", "GPS, HR, calories, laps, distance", "Older platforms, Training Peaks import", "Less widely supported than GPX for mapping tools"],
          en: ["TCX", "GPS, HR, calories, laps, distance", "Older platforms, Training Peaks import", "Less widely supported than GPX for mapping tools"],
        },
      ],
    },
    {
      type: "paragraph",
      text: {
        it: "Rule of thumb: if you're importing into Strava, use GPX. If you're making a backup you might re-import to Garmin someday, use FIT. If you're sending to a coach using Training Peaks, check what format they prefer — TCX and FIT are both common there.",
        en: "Rule of thumb: if you're importing into Strava, use GPX. If you're making a backup you might re-import to Garmin someday, use FIT. If you're sending to a coach using Training Peaks, check what format they prefer — TCX and FIT are both common there.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Method 2: Export all your data at once (bulk export)",
        en: "Method 2: Export all your data at once (bulk export)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Garmin has a GDPR-compliant data export tool that lets you download your complete history — activities, health metrics, device settings, and personal data — in one archive. Think of it as Garmin's equivalent of Google Takeout.",
        en: "Garmin has a GDPR-compliant data export tool that lets you download your complete history — activities, health metrics, device settings, and personal data — in one archive. Think of it as Garmin's equivalent of Google Takeout.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Sign in at connect.garmin.com.",
          "Click your profile name in the top right → 'Account Settings'.",
          "Scroll to 'Account Management' → click 'Export Your Data'.",
          "Click 'Request Data Export'.",
          "Wait for an email from Garmin with the download link — usually 24-48 hours, sometimes longer for large accounts.",
          "Download the ZIP archive. It contains folders for each data category.",
        ],
        en: [
          "Sign in at connect.garmin.com.",
          "Click your profile name in the top right → 'Account Settings'.",
          "Scroll to 'Account Management' → click 'Export Your Data'.",
          "Click 'Request Data Export'.",
          "Wait for an email from Garmin with the download link — usually 24-48 hours, sometimes longer for large accounts.",
          "Download the ZIP archive. It contains folders for each data category.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "The archive structure: each activity gets its own FIT file, organized by year and month. Health data (steps, heart rate samples, sleep) comes in separate files. If you've been running Garmin for years with daily tracking, the archive can easily exceed several GB — the per-minute HR data alone adds up fast.",
        en: "The archive structure: each activity gets its own FIT file, organized by year and month. Health data (steps, heart rate samples, sleep) comes in separate files. If you've been running Garmin for years with daily tracking, the archive can easily exceed several GB — the per-minute HR data alone adds up fast.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Method 3: Syncing Garmin Connect with other platforms automatically",
        en: "Method 3: Syncing Garmin Connect with other platforms automatically",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "If you want activities to automatically appear in another platform every time you finish a workout — without manual exports — Garmin's Connected Apps feature is the right tool.",
        en: "If you want activities to automatically appear in another platform every time you finish a workout — without manual exports — Garmin's Connected Apps feature is the right tool.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "In Garmin Connect (web or app): go to the menu → 'Connected Apps' (or 'Garmin Connect IQ Store' → 'Connect Apps').",
          "Search for the app you want to connect: Strava, Training Peaks, MyFitnessPal, and others are listed.",
          "Click 'Connect' and authorize via the third-party app's OAuth flow.",
          "Future activities automatically sync from Garmin to that platform.",
        ],
        en: [
          "In Garmin Connect (web or app): go to the menu → 'Connected Apps' (or 'Garmin Connect IQ Store' → 'Connect Apps').",
          "Search for the app you want to connect: Strava, Training Peaks, MyFitnessPal, and others are listed.",
          "Click 'Connect' and authorize via the third-party app's OAuth flow.",
          "Future activities automatically sync from Garmin to that platform.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Historical activities don't auto-sync", en: "Historical activities don't auto-sync" },
      body: {
        it: "Connecting Strava to Garmin only syncs future activities — it doesn't automatically backfill your history. For historical import, you'll need to use the file export method or contact Strava support about their bulk import option.",
        en: "Connecting Strava to Garmin only syncs future activities — it doesn't automatically backfill your history. For historical import, you'll need to use the file export method or contact Strava support about their bulk import option.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Method 4: Garmin Connect API (for developers and power users)",
        en: "Method 4: Garmin Connect API (for developers and power users)",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "The Garmin Health API and Garmin Connect API allow programmatic access to data — but this isn't self-service. Garmin requires app approval before granting API access. You can't simply generate a personal access token and start pulling your own data. The process requires submitting an application, describing your use case, and waiting for approval.",
        en: "The Garmin Health API and Garmin Connect API allow programmatic access to data — but this isn't self-service. Garmin requires app approval before granting API access. You can't simply generate a personal access token and start pulling your own data. The process requires submitting an application, describing your use case, and waiting for approval.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "What this means in practice: if you want a third-party app to continuously pull your Garmin data, that app needs to have gone through Garmin's approval process. Approved integrations include Strava, Training Peaks, Final Surge, and some health and coaching platforms. Among services with official Garmin Connect API integration, FitMesh Sync is designed specifically to centralize wearable data in a single accessible dashboard.",
        en: "What this means in practice: if you want a third-party app to continuously pull your Garmin data, that app needs to have gone through Garmin's approval process. Approved integrations include Strava, Training Peaks, Final Surge, and some health and coaching platforms. Among services with official Garmin Connect API integration, FitMesh Sync is designed specifically to centralize wearable data in a single accessible dashboard.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Garmin and Health Connect: the current state",
        en: "Garmin and Health Connect: the current state",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "A common question: does Garmin write to Android Health Connect? As of mid-2026, the answer is partial. The Garmin Connect Android app has begun writing some basic metrics to Health Connect: daily steps, resting heart rate, aggregated sleep data. However, full workout sessions with GPS tracks are not exposed via Health Connect — for those, third-party apps still need direct Garmin Connect API integration.",
        en: "A common question: does Garmin write to Android Health Connect? As of mid-2026, the answer is partial. The Garmin Connect Android app has begun writing some basic metrics to Health Connect: daily steps, resting heart rate, aggregated sleep data. However, full workout sessions with GPS tracks are not exposed via Health Connect — for those, third-party apps still need direct Garmin Connect API integration.",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "This matters for platform choice: an app reading only from Health Connect will see your step count and daily HR average from Garmin, but not the details of your Saturday long run or Tuesday track session.",
        en: "This matters for platform choice: an app reading only from Health Connect will see your step count and daily HR average from Garmin, but not the details of your Saturday long run or Tuesday track session.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Importing Garmin data into Strava: the complete picture",
        en: "Importing Garmin data into Strava: the complete picture",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Recommended: use the Garmin-Strava integration** (via Connected Apps). Future activities sync automatically within minutes of syncing to Garmin Connect. No file management needed.",
          "**Manual import on Strava**: strava.com → '+' → 'Upload activity'. Accepts GPX, FIT, TCX. Free accounts are limited to 25 uploads/week. Power data is preserved if you upload FIT files.",
          "**Historical backfill**: Strava has a 'Bulk Upload' option accessible via their support team. If you have years of activities in Garmin that predate your Strava account, ask Strava support about uploading your Garmin export archive.",
          "**What doesn't transfer**: Garmin-specific metrics like Body Battery, Training Status, VO2 max estimates, and recovery advisor don't have equivalents in Strava and aren't included in GPX/TCX exports.",
        ],
        en: [
          "**Recommended: use the Garmin-Strava integration** (via Connected Apps). Future activities sync automatically within minutes of syncing to Garmin Connect. No file management needed.",
          "**Manual import on Strava**: strava.com → '+' → 'Upload activity'. Accepts GPX, FIT, TCX. Free accounts are limited to 25 uploads/week. Power data is preserved if you upload FIT files.",
          "**Historical backfill**: Strava has a 'Bulk Upload' option accessible via their support team. If you have years of activities in Garmin that predate your Strava account, ask Strava support about uploading your Garmin export archive.",
          "**What doesn't transfer**: Garmin-specific metrics like Body Battery, Training Status, VO2 max estimates, and recovery advisor don't have equivalents in Strava and aren't included in GPX/TCX exports.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi centralizzare i dati Garmin con altri wearable in un'unica dashboard?",
        en: "Want to centralize Garmin data with other wearables in one dashboard?",
      },
      body: {
        it: "Tra le opzioni che semplificano questo c'è FitMesh Sync: si integra con Garmin Connect via API ufficiale e aggrega i dati in una dashboard web, utile per chi usa Garmin ma ha anche altri wearable in casa o vuole un'analisi centralizzata senza aprire più app.",
        en: "Among the options that simplify this is FitMesh Sync: it integrates with Garmin Connect via the official API and aggregates data in a web dashboard — useful for those who use Garmin but also have other wearables or want centralized analysis without opening multiple apps.",
      },
      ctaLabel: {
        it: "Vedi integrazione Garmin →",
        en: "See Garmin integration →",
      },
      ctaHref: {
        it: "/it/sync/garmin",
        en: "/en/sync/garmin",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "Can I export Garmin data from my phone without a computer?",
        en: "Can I export Garmin data from my phone without a computer?",
      },
      a: {
        it: "Yes — you can use connect.garmin.com in your phone's mobile browser (Chrome, Safari) to export individual activities. The bulk export also works from a mobile browser. What doesn't work is the Garmin Connect app itself, which has no export functionality. Mobile browser → website is fine; native app → no export.",
        en: "Yes — you can use connect.garmin.com in your phone's mobile browser (Chrome, Safari) to export individual activities. The bulk export also works from a mobile browser. What doesn't work is the Garmin Connect app itself, which has no export functionality. Mobile browser → website is fine; native app → no export.",
      },
    },
    {
      q: {
        it: "Does Garmin delete data if I cancel my subscription?",
        en: "Does Garmin delete data if I cancel my subscription?",
      },
      a: {
        it: "Garmin Connect is free — there's no required subscription for cloud storage. Garmin Connect+ (formerly Garmin Premium) is optional and adds advanced analytics, but your activity data is stored free indefinitely. If you delete your Garmin account, data is permanently deleted. Export your data before deleting the account.",
        en: "Garmin Connect is free — there's no required subscription for cloud storage. Garmin Connect+ (formerly Garmin Premium) is optional and adds advanced analytics, but your activity data is stored free indefinitely. If you delete your Garmin account, data is permanently deleted. Export your data before deleting the account.",
      },
    },
    {
      q: {
        it: "How do I export Garmin data to Apple Health?",
        en: "How do I export Garmin data to Apple Health?",
      },
      a: {
        it: "Garmin doesn't have a direct Apple Health integration. The most reliable path is through third-party apps: apps like Health Sync or HealthFit can connect to Garmin Connect (via file import or the API) and write data to Apple Health. You can also manually import GPX files into apps that write to Apple Health. Note that Garmin's proprietary metrics (Body Battery, etc.) won't map to Apple Health data types.",
        en: "Garmin doesn't have a direct Apple Health integration. The most reliable path is through third-party apps: apps like Health Sync or HealthFit can connect to Garmin Connect (via file import or the API) and write data to Apple Health. You can also manually import GPX files into apps that write to Apple Health. Note that Garmin's proprietary metrics (Body Battery, etc.) won't map to Apple Health data types.",
      },
    },
    {
      q: {
        it: "Can I re-import FIT files back into Garmin Connect?",
        en: "Can I re-import FIT files back into Garmin Connect?",
      },
      a: {
        it: "Yes — Garmin Connect web accepts FIT file uploads. Go to the '+' button in Garmin Connect → 'Import Data' → select your FIT files. This is useful when setting up a new Garmin account or recovering from a data issue. One caveat: if you're importing activities that already exist in your account, Garmin will flag duplicates but typically asks before overwriting.",
        en: "Yes — Garmin Connect web accepts FIT file uploads. Go to the '+' button in Garmin Connect → 'Import Data' → select your FIT files. This is useful when setting up a new Garmin account or recovering from a data issue. One caveat: if you're importing activities that already exist in your account, Garmin will flag duplicates but typically asks before overwriting.",
      },
    },
    {
      q: {
        it: "Why is my Garmin bulk export taking longer than 48 hours?",
        en: "Why is my Garmin bulk export taking longer than 48 hours?",
      },
      a: {
        it: "Bulk export time depends on how much data is in your account. Users with 5+ years of continuous daily tracking, frequent workouts, and granular HR data can have accounts with tens of millions of data points. Garmin's export system processes these asynchronously and can take 3-5 days for very large accounts. If you haven't received the download email after 5 days, contact Garmin Connect support.",
        en: "Bulk export time depends on how much data is in your account. Users with 5+ years of continuous daily tracking, frequent workouts, and granular HR data can have accounts with tens of millions of data points. Garmin's export system processes these asynchronously and can take 3-5 days for very large accounts. If you haven't received the download email after 5 days, contact Garmin Connect support.",
      },
    },
  ],
  related: [
    "esportare-dati-garmin",
    "guida-sync-wearable-2026",
    "come-funziona-health-connect",
  ],
  brandsMentioned: ["Garmin", "Strava", "Training Peaks", "Apple", "Google"],
  ldType: "BlogPosting",
};
