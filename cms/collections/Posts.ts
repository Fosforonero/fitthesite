import type { CollectionConfig } from 'payload';

/**
 * Articoli del blog/novità. Rispecchia il tipo `BlogPost` attuale
 * (`lib/blog/types.ts`) così la migrazione dai moduli TS è 1:1.
 *
 * Campi `localized: true` = tradotti per lingua. Lo `slug` è localizzato →
 * slug per-lingua per la SEO (oggi gli slug sono condivisi, era un limite).
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      localized: true,
      index: true,
      admin: {
        description:
          'Slug per-lingua per la SEO. Es: "fitmesh-su-google-play" (it), "sincronizar-smartwatch" (es).',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'news',
      options: [
        { label: 'Guida', value: 'guides' },
        { label: 'Confronto', value: 'comparisons' },
        { label: 'Privacy', value: 'privacy' },
        { label: 'Ecosistema', value: 'ecosystem' },
        { label: 'Novità', value: 'news' },
      ],
    },
    { name: 'publishedAt', type: 'date', required: true },
    { name: 'updatedAtContent', type: 'date' },
    { name: 'readMinutes', type: 'number' },
    { name: 'pillar', type: 'checkbox', defaultValue: false },
    { name: 'metaDescription', type: 'textarea', localized: true },
    {
      name: 'tldr',
      type: 'array',
      localized: true,
      fields: [{ name: 'point', type: 'text', required: true }],
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'kicker', type: 'text', localized: true },
        { name: 'title', type: 'text', localized: true },
        { name: 'subtitle', type: 'textarea', localized: true },
      ],
    },
    { name: 'body', type: 'richText', localized: true },
    {
      name: 'faq',
      type: 'array',
      localized: true,
      fields: [
        { name: 'q', type: 'text', required: true },
        { name: 'a', type: 'textarea', required: true },
      ],
    },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    {
      name: 'related',
      type: 'text',
      hasMany: true,
      admin: { description: 'Slug degli articoli correlati.' },
    },
  ],
};
