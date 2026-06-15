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
    // Branding FitMesh: logo + icona custom al posto di quelli Payload.
    components: {
      graphics: {
        Logo: '/cms/components/Logo#Logo',
        Icon: '/cms/components/Icon#Icon',
      },
    },
    meta: {
      titleSuffix: ' · FitMesh Sync',
      icons: [{ rel: 'icon', type: 'image/png', url: '/icon-square-128.png' }],
    },
    // baseDir per risolvere i path dei componenti custom nell'importMap.
    importMap: { baseDir: dirname },
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
    // `push` (sync schema Drizzle automatico) DISABILITATO: non funziona sul
    // pooler transaction Supabase in serverless e, peggio, in dev contro il DB
    // di produzione tenta DROP distruttivi (es. body blocks→richText voleva
    // droppare le tabelle posts_blocks_* con i dati). Lo schema si gestisce a
    // mano via `apply_migration` (Supabase MCP). TODO: migration Payload vere
    // quando il runner CLI tsx è sistemato.
    push: false,
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
