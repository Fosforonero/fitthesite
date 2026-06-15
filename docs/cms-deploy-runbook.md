# Payload CMS — Runbook di deploy in produzione

> Branch `payload-cms`. Il sito ha **fallback ai post TS**: se manca `DATABASE_URI`
> su Vercel, la produzione continua a funzionare coi post statici. Quindi il
> merge è sicuro anche prima di completare questi step.

## A. Storage Media (Supabase Storage, consigliato — UE, già nel tuo stack)

1. **Supabase Dashboard → Storage → New bucket**
   - Name: `cms-media`
   - **Public bucket: ON** (le immagini vanno servite direttamente)
2. **Project Settings → Storage → S3 Connection → Enable** → **New access key**
   - Copia: Access key ID + Secret access key
   - Endpoint: `https://xcdyhkuyxukaifhhtadr.supabase.co/storage/v1/s3`
   - Region: quella del progetto (es. `eu-central-1`)

> Alternativa: Cloudflare R2 (no costi egress). Stessi 5 env, endpoint R2.

## B. Variabili env su Vercel (Production + Preview)

| Variabile | Valore |
|---|---|
| `PAYLOAD_SECRET` | stringa random: `openssl rand -base64 32` |
| `DATABASE_URI` | **pooler** Supabase, porta 6543, transaction mode: `postgresql://postgres.xcdyhkuyxukaifhhtadr:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres` |
| `S3_BUCKET` | `cms-media` |
| `S3_ENDPOINT` | `https://xcdyhkuyxukaifhhtadr.supabase.co/storage/v1/s3` |
| `S3_REGION` | es. `eu-central-1` |
| `S3_ACCESS_KEY_ID` | dal passo A.2 |
| `S3_SECRET_ACCESS_KEY` | dal passo A.2 |

`RESEND_API_KEY` c'è già (usata per le mail beta) → l'email admin Payload funziona da sola.

> ⚠️ Connection string: usare il **POOLER** (6543), NON la diretta (5432). In
> serverless la diretta esaurisce le connessioni.

## C. Bundle / piano Vercel

L'admin `/cms` è pesante (~566 kB first load + Payload nelle function). Su **Hobby**
il limite function è 50 MB compresso. Dopo il primo deploy, controllare in Vercel
→ Deployment → Functions la dimensione di `/cms` e `/api/[...slug]`. Se sfora:
- **Vercel Pro** ($20/mese), oppure
- hostare l'admin Payload separatamente (Railway/Render) e tenere su Vercel solo
  il sito che legge via API.

## D. Merge + seed produzione

1. `pnpm build` locale verde (già verificato).
2. Merge `payload-cms` → `main` (push → deploy automatico Vercel).
3. Atteso il deploy con `DATABASE_URI` attivo, lo schema `payload` si crea da solo
   (`push: true` in `payload.config`).
4. **Seed produzione**: chiama UNA volta
   `https://www.fitmesh.fit/api/cms-seed?secret=<PAYLOAD_SECRET>` → migra i 32 post
   su Supabase. (Idempotente: ri-eseguibile.)
5. **Rimuovere** `app/api/cms-seed/route.ts` (commit + push) — è una route one-off.
6. Creare il primo utente admin su `https://www.fitmesh.fit/cms`.

## E. Dopo il go-live

- **Migration Payload** al posto di `push: true` (quando il runner CLI tsx è
  sistemato): `payload migrate:create` → commit → `payload migrate` in build.
- **Spagnolo SEO/GEO** nel CMS + slug EN/ES dedicati (oggi slug condivisi it/en).
- **Selettore lingua** dropdown 3 lingue.
- **OG image** (`opengraph-image.tsx`) ancora su post TS: migrare a Payload quando
  si conferma il runtime (evitare edge).
