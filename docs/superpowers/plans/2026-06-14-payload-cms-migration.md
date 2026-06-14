# Payload CMS Migration Plan — fitthesite

> **Stato:** pianificato (14/06/2026). Decisione tool: Payload CMS 3 (confermata da Matteo).
> Da eseguire SU BRANCH `payload-cms`, MAI direttamente su `main` (auto-deploy produzione).

**Goal:** dare a un editor non tecnico una bacheca tipo WordPress per articoli + landing,
con contenuti localizzati it/en/es (incluso slug per-lingua) e fallback EN automatico.

**Architettura:** Payload 3 dentro la stessa app Next.js 15 (`withPayload`), admin su
`/admin`, DB Postgres. I loader frontend (`lib/blog/data.ts`, `lib/landing/data.ts`)
passano da moduli TS a query Payload. Migrazione incrementale: i TS restano come
fallback finché il CMS non è verificato.

---

## Decisioni che servono a Matteo (gating, prima di buildare)

1. **Database** (consiglio: Supabase esistente, schema dedicato `payload`)
   - Opzione A (consigliata): progetto Supabase attuale (`xcdyhkuyxukaifhhtadr`), adapter
     `@payloadcms/db-postgres` con `schemaName: 'payload'` → un solo DB, UE, free tier.
   - Opzione B: nuovo progetto Supabase solo CMS (isolamento massimo).
   - ⚠️ Serverless: usare la **connection string del POOLER** Supabase (porta 6543,
     transaction mode), NON la diretta, altrimenti si esauriscono le connessioni.

2. **Hosting / piano Vercel** (rischio Hobby)
   - Payload admin+API girano come function serverless. Vincoli Hobby noti: bundle 50MB,
     function 60s, 2 cron max (gia' usati: beta-welcome + indexnow). Payload non richiede
     cron, ma il bundle admin puo' essere pesante.
   - Consiglio: provare same-app sul Vercel attuale; se i limiti mordono → Vercel Pro
     ($20/mese) o host Payload separato (Railway/Render) con il sito che legge via API.

3. **Env vars da impostare su Vercel** (Matteo, io non ho accesso)
   - `PAYLOAD_SECRET` = stringa random lunga
   - `DATABASE_URI` = connection string pooler Supabase

---

## Task (su branch `payload-cms`)

### Task 1: Scaffold Payload
- `pnpm i payload @payloadcms/ui @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical`
- `next.config.mjs`: avvolgere l'export con `withPayload(...)` (mantenere redirects/rewrites/headers attuali).
- `payload.config.ts` in root: `localization: { locales: ['it','en','es'], defaultLocale: 'it', fallback: true }`,
  `db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI }, schemaName: 'payload' })`,
  `secret: process.env.PAYLOAD_SECRET`.
- Route admin: `app/(payload)/admin/[[...segments]]` dal template ufficiale.
- Verifica: `pnpm dev` → `/admin` carica e crea il primo utente.

### Task 2: Collections
- `Posts`: campi localizzati `title`, `slug` (localized → slug PER-LINGUA), `metaDescription`,
  `tldr`, `body` (rich text/blocks), `faq`, + `category`, `publishedAt`, `related`, `author`.
- `LandingPages`: struttura simile alle landing high-intent.
- `Authors`: Matteo Pizzi (per JSON-LD Person).
- `Media`: immagini OG/hero.
- Access control: ruolo `editor` (non tecnico) con permessi CRUD su Posts/LandingPages.

### Task 3: Migrazione contenuti
- Script seed: leggere i 32 post `lib/blog/posts/*.ts` + landing → `payload.create` per ogni locale.
- Slug: mantenere gli slug IT attuali per IT; assegnare slug EN inglesi (oggi mancano) e
  slug ES spagnoli quando si traduce.

### Task 4: Frontend legge da Payload
- `lib/blog/data.ts` / `lib/landing/data.ts`: sostituire i moduli TS con query `payload.find`
  (con `locale`), mantenendo le stesse interfacce verso i componenti (BlogRenderer ecc.).
- hreflang: generare it/en/es + x-default dagli slug localizzati. Sitemap: includere `/es/...`.

### Task 5: Verifica + merge
- Build `pnpm build` verde, `/admin` funzionante, pagine pubbliche identiche.
- Solo allora merge `payload-cms` → `main` (deploy produzione).

---

## Dopo il CMS (sblocca queste)
- **Spagnolo SEO/GEO**: traduzione native nel CMS con slug ES + meta ES + hreflang.
- **Slug inglesi**: dare all'EN i suoi slug (bonus SEO, oggi riusa gli IT).
- **Selettore lingua** dropdown 3 lingue.
