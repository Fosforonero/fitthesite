# CHANGELOG — fitthesite (fitmesh.fit)

Una riga per release. Le release del sito sono indipendenti da quelle dell'app.

---

## v0.2.1 — 2026-05-16 · Reposition: Fitbit/Garmin/Polar/Withings → "Works via Health Connect"

**Insight strategico:** dal 2024 le app ufficiali di Fitbit, Garmin Connect, Polar Flow e Withings Health Mate scrivono automaticamente su Health Connect. Questo significa che FitMesh già supporta questi brand al livello base (passi, BPM, sonno totale, calorie) — senza aspettare le integrazioni OAuth dedicate. La copy precedente li marcava come "non disponibile / iscriviti waitlist", sottovalutando di fatto il prodotto.

### Cambiato
- **Nuovo status** `live-basic` in `lib/providers/data.ts` (oltre a `live`, `beta`, `roadmap-q3`, `roadmap-q4`) con etichetta "Funziona via Health Connect" / "Works via Health Connect" (colore aqua brand)
- **Fitbit, Garmin, Polar, Withings:** promossi da `roadmap-q*` a `live-basic`. Strava e Oura restano `roadmap` (genuinamente senza path Health Connect)
- **Nuovo campo `viaHC`** per provider live-basic: `{ oauthEta, worksNow[], oauthAdds[] }` con liste IT/EN dettagliate di cosa funziona oggi vs cosa l'OAuth aggiungerà
- **Landing page provider** (`/sync/[provider]`): aggiunta sezione dual-column "Funziona oggi" (verde, lista ✓) + "OAuth ufficiale aggiungerà" (aqua, lista +) per i live-basic
- **CTA hero** per live-basic: bottone primario Play Store + bottone secondario "Avvisami per i dati avanzati" (mailto OAuth waitlist)
- **Long description + tagline + FAQ** riscritte per Fitbit/Garmin/Polar/Withings: spiegano cosa funziona oggi senza configurazione vs cosa serve l'OAuth, con istruzioni concrete (es. "Apri Polar Flow → Impostazioni → Health Connect → attiva sincronizzazione")
- **Tech note** aggiornata con doppia spiegazione: "Oggi via X → Health Connect. Q3/Q4 2026: OAuth Y per metriche Z"

### Impatto SEO
- Il titolo "Sync Garmin to FitMesh — Personal Health Dashboard" ora porta a una landing che dice "funziona OGGI" → CTR atteso più alto + meno bounce
- Le query long-tail tipo "garmin to health connect" o "polar flow android dashboard" sono molto più rilevanti ora
- Riduzione drop-off: utente non si scoraggia leggendo "in arrivo Q4 2026" subito sotto un titolo che gli ha fatto cliccare

### Note tecniche
- Type `ProviderStatus` esteso con `live-basic` — discriminato in `statusLabel()` con colore #21E6C1 (brand-aqua) e label localizzata
- Component logic in `/sync/[provider]/page.tsx`: `isLive = status === "live" || "live-basic"` (entrambi mostrano Play Store CTA), `isLiveBasic` flag separato per render della doppia sezione e CTA secondario waitlist
- Build verde, 18 landing + hub SSG senza regressioni

---

## v0.2.0 — 2026-05-16 · SEO landing pages + Integrations hub

**Obiettivo:** preparare il sito al lancio Play Store con pagine SEO-ottimizzate per ogni servizio supportato o pianificato, in modo da intercettare query di ricerca tipo "sync fitbit to galaxy watch" e costruire authority organica fin dal day-1.

### Nuovo
- **Hub integrazioni** `/[locale]/integrations` IT+EN — lista raggruppata per categoria (smartwatch / wearable / fitness-platform / health-platform) con badge stato (live / Q3 2026 / Q4 2026), CTA "Richiedi integrazione" via mailto, JSON-LD `CollectionPage`.
- **9 landing per provider** `/[locale]/sync/[provider]` IT+EN = 18 pagine SSG totali. Provider: galaxy-watch, wear-os, xiaomi-mi-band (live via Health Connect); fitbit, garmin, strava (roadmap Q3); polar, oura, withings (roadmap Q4). Ogni landing include hero con stato, tabella dati supportati, nota tecnica (modalità OAuth o Health Connect), FAQ con JSON-LD `FAQPage`, related providers, CTA dinamica (Play Store se live / mailto waitlist se roadmap), disclaimer non-affiliazione con i marchi citati.
- **OG image dinamica** `/[locale]/sync/[provider]/opengraph-image` — pre-renderata SSG per ogni combinazione (18 PNG totali) con monogramma + colore brand provider + headline localizzata. Usa `next/og` Satori senza runtime edge (incompatibile con `generateStaticParams`).
- **Strip integrazioni in homepage** — sezione "Funziona con quello che hai già" prima del blocco privacy, con 6×card linkate alle landing.
- **Link Integrations nell'Header** primario (visibile anche su mobile).
- **Data file** `lib/providers/data.ts` come single source of truth: tipo `Provider` (slug, status, brandColor, copy IT/EN, FAQ, dataTypes, seoKeywords), array `PROVIDERS`, helpers `statusLabel`/`categoryLabel`. Aggiungere/promuovere un provider = una modifica qui.

### SEO
- **Sitemap aggiornata** — aggiunte 9 landing provider (priority 0.8) + hub integrazioni (priority 0.9, weekly) con hreflang alternates IT/EN/x-default per ogni URL.
- **JSON-LD** per ogni landing: `SoftwareApplication` (operatingSystem ANDROID, applicationCategory HealthApplication, Offer EUR 3.49) + `FAQPage` (quando il provider ha FAQ) + `BreadcrumbList`.
- **Keywords mirate** per locale: ogni provider espone `seoKeywords.it[]` e `seoKeywords.en[]` (es. "sincronizzare garmin dashboard", "sync fitbit to health connect") usate in `<meta name="keywords">`.

### Note implementazione
- Niente loghi proprietari di terze parti — usato monogramma lettera + colore brand. I marchi sono citati nominativamente per identificazione (uso descrittivo, non confondibile).
- Waitlist = `mailto:waitlist@fitmesh.fit?subject=...&body=...` con prefill localizzato. Form DB-backed rimandato a v0.3 (richiede tabella Supabase + RLS).
- Pagina di confronto con competitor (Health Sync) inizialmente prototipata e poi **scartata** per scelta di posizionamento (no name-and-shame, no menzioni dirette).

### Risultati attesi (3-6 mesi)
- ~20-30 keyword long-tail in top-10 Google (provider × locale × modifier "sincronizzare/sync/dashboard/export").
- Funnel: search → landing provider → /integrations → homepage → Play Store.
- Conversion target waitlist: 3-5% dei visitatori delle 6 landing roadmap.

---

## v0.1.0 — 2026-05-12 · Sito iniziale (sprint 11 HealthSyncMini)

- Setup Next.js 15 App Router con i18n (it, en) + Tailwind dark-first.
- Pagine: landing, support, privacy, terms, cookies.
- Auth Supabase (magic link) + middleware route protection.
- Aree private: `/app` (dashboard, devices, settings), `/admin` (overview metriche aggregate).
- JSON-LD root con Organization + WebSite + MobileApplication.
- OG image dinamica root + sitemap.xml + robots.txt.
- Deploy automatico su Vercel da `main`.
