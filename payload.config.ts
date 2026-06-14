import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
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
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    schemaName: 'payload',
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
