# CHANGELOG — fitthesite (fitmesh.fit)

Una riga per release. Le release del sito sono indipendenti da quelle dell'app.

---

## v0.4.0 — 2026-05-24 · Fascia founder home + sync v2 API + landing Mesh Famiglia + SEO hardening

### Aggiunto
- **Fascia founder dinamica in home** (`components/FounderBanner.tsx`): Server Component che fetcha `get_beta_spots_taken()` RPC con cache ISR 60s, mostra "Restano X/100 posti founder gratis per sempre" cliccabile → `/[locale]/beta`. Gradient brand verde→aqua, soft glow, dot ping animato. Riposiziona come "Beta esaurita — lista d'attesa" quando counter raggiunge 100.
- **Landing `/[locale]/famiglia`** (Mesh Famiglia marketing): cluster keyword "monitorare salute genitori anziani / famiglia" — zero competitor diretti in IT. Struttura hero + 3 personas (genitori anziani / figli teen / partner) + 3-step how + 2-col privacy + tech stack + pricing + 6 FAQ + final CTA. Hreflang IT/EN completo. JSON-LD WebPage + FAQPage. Linkata da Footer e sitemap (priority 0.95).
- **`public/llms.txt`** (standard 2025 AI crawler): description product + use cases + URL chiave + technical facts per AI overviews accurate + sezione "what FitMesh is NOT" per disambiguazione (vs Health Sync clone, vs medical device, vs location tracker).
- **JSON-LD audit completo + 5 upgrade**:
  - WebSite ora ha `SearchAction` (sitelinks search box eligibility)
  - MobileApplication ora ha `screenshot` + `featureList` (5 voci IT/EN) + `softwareVersion: "3.2.2"` + `operatingSystem: "Android 8.0 and up"`
  - Organization estesa con `sameAs` Play Store + Fosforonero brand + `founder: Person Matteo Pizzi` + `foundingDate: 2026-04` + `areaServed: [IT, EU]`
  - Home page WebPage + BreadcrumbList specifici linkati al @graph layout via @id
  - Support page uniformata a `<JsonLd>` component (era inline raw `<script>`)
- **Sync route `/api/v1/sync`** accetta `hrSourceName` + `hrSourceQuality` (app v101 multi-source HR picker). Insert in fitness_metrics + Zod schema esteso (backward-compatible).

### Risolto
- **Link Mesh Famiglia 404**: app generava `fitmesh.fit/famiglia/join/CODE` (senza prefix locale) ma route è `/[locale]/famiglia/join/[code]`. Middleware Next.js esteso con `needsLocalePrefix()` + `bestLocaleFromAcceptLanguage()`: ogni path non localizzato (escluso /api, /oauth, /mockups, /_next, /.well-known, asset) viene redirected a `/{best-locale}{path}`. Risolve anche futuri share URL di blog/articoli senza dover toccare app code.
- **Fascia founder gradient invisibile** (prima release): era 4-6% opacity, ora 20-30% + bordo aqua/30 + soft glow + font sm:text-lg per counter. Da fascia sussurrata a fascia che cattura l'occhio.

### Note operative
- Deploy `9f593e0` live (commit feat SEO drop)
- Counter founder mostra "Restano 83/100" — 17 founder seeded da migration v100
- Welcome email cron DEPLOYATA (route 401 = auth richiesta) ma NON operativa finché manca env `RESEND_API_KEY` + verify dominio `fitmesh.fit` su Resend
- Strava OAuth proxy DEPLOYATO ma NON operativo finché manca env `STRAVA_CLIENT_SECRET`

---

## v0.3.0 — 2026-05-23 sera · Welcome email cron + Vercel deploy crisis risolta + Fosforonero footer

### Aggiunto
- **Welcome email cron** (`/api/cron/beta-welcome-emails`): cron daily 10:00 UTC che pesca da Supabase `beta_signups` i pending senza `welcome_sent_at`, manda welcome email via Resend (template `beta-welcome.ts`), aggiorna `welcome_sent_at` sui successi. Rate-limit 50/tick per non saturare Resend free tier. Auth via `CRON_SECRET` bearer header.
- **IndexNow daily cron** (`/api/cron/indexnow-daily`): pinging Bing/Yandex/Naver/Seznam di blog posts modificati ultimi 7gg + pagine core IT/EN. Schedule `30 6 * * *`.
- **Fosforonero brand umbrella link** nel footer (`components/Footer.tsx`): `Un progetto di Fosforonero` → `https://www.fosforonero.com`. Reciprocità SEO con sito brand (quando esisterà).
- **12 articoli goldmine** SEO (Lane A): batch 1 + batch 2, IT+EN, ~289K vol/mese aggregato.

### Risolto (DOPO ORE di debug)
- **Vercel deploy stuck PENDING infinito** (root cause finalmente identificato): Vercel Hobby plan permette solo cron **daily**. Il cron `0 * * * *` (hourly) faceva fallire SILENZIOSAMENTE tutti i deploy successivi al suo merge — nessun error visibile né nel dashboard né nei build logs, deployment resta in PENDING per sempre. Scoperto lanciando `vercel deploy --prod --yes` da CLI locale (Node 24 via nvm) che ha sputato l'error chiaro. Fix: schedule `0 * * * *` → `0 10 * * *`.
- **`ERR_PNPM_OUTDATED_LOCKFILE`** che bloccava i deploy: aggiunto `installCommand: pnpm install --no-frozen-lockfile` in `vercel.json` (safety net permanente — `pnpm` non disponibile sul mac dev con Node 14).
- **Beta signup form 500 error**: due bug cascade — `signup_ip` era `inet` ma il client mandava hash hex (migration `beta_signups_ip_hash_text`) + `.select("id")` post-insert falliva RLS (anon non ha SELECT policy, rimosso).
- **Welcome cron TS error** `Property 'founder_number' does not exist on type 'never'`: cast `createAdminClient() as unknown as Sb` (pattern noto del progetto per database.types stale).

### Note operative
- Welcome email cron è DEPLOYED ma non operativo finché non si setta `RESEND_API_KEY` env su Vercel + verify domain `fitmesh.fit` su Resend.
- Strava OAuth proxy (`/api/v1/oauth/strava/`) DEPLOYED ma non operativo finché non si setta `STRAVA_CLIENT_SECRET` env.
- Deploy production live: `dpl_GZpTTu9TGTjVE3ecKe4rqhEPa3qJ` (commit `a810a29`).

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
