import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { resendAdapter } from '@payloadcms/email-resend';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';

import { Media } from './cms/collections/Media';
import { Posts } from './cms/collections/Posts';
import { Users } from './cms/collections/Users';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Payload CMS — bacheca contenuti (articoli + landing) per editor non tecnici.
 *
 * i18n: locali it/en/es con `fallback: true` → se una lingua manca, mostra
 * automaticamente l'EN. Lo `slug` dei Posts è `localized: true` → slug
 * per-lingua per la SEO (es. /es/blog/sincronizar-smartwatch).
 *
 * DB: Postgres su Supabase esistente, schema dedicato `payload` (isolato dalle
 * tabelle app). In serverless usare la connection string del POOLER Supabase.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
  },
  // Admin Payload su /cms (NON /admin): evita la collisione con l'admin beta
  // esistente del sito (/[locale]/admin) e con il middleware i18n.
  routes: {
    admin: '/cms',
  },
  collections: [Users, Posts, Media],
  localization: {
    locales: [
      { label: 'Italiano', code: 'it' },
      { label: 'English', code: 'en' },
      { label: 'Español', code: 'es' },
    ],
    defaultLocale: 'it',
    fallback: true,
  },
  editor: lexicalEditor(),
  // Email: Resend in produzione (chiave già usata per le mail beta). Senza
  // RESEND_API_KEY (dev) Payload scrive le email in console.
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        defaultFromAddress: 'no-reply@fitmesh.fit',
        defaultFromName: 'FitMesh Sync',
        apiKey: process.env.RESEND_API_KEY,
      })
    : undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    schemaName: 'payload',
    // `push` crea/sincronizza lo schema da solo (default: solo dev). Lo teniamo
    // attivo anche in prod per il PRIMO deploy, perché la generazione delle
    // migration via CLI è bloccata dalla quirk tsx+Node24. TODO: passare alle
    // migration Payload (payload migrate) quando il runner CLI è sistemato, e
    // mettere `push: process.env.NODE_ENV !== 'production'`.
    push: true,
  }),
  // Storage Media: S3-compatibile (Supabase Storage / R2 / S3) in produzione,
  // perché Vercel non ha disco persistente. Gated da S3_BUCKET: senza (dev) usa
  // il disco locale. Endpoint + credenziali via env (da impostare su Vercel).
  plugins: process.env.S3_BUCKET
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION ?? 'auto',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
            },
          },
        }),
      ]
    : [],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
