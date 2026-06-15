import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Block, CollectionConfig } from 'payload';

/// Blocchi SEO embeddabili nel richText lexical del corpo articolo: rispecchiano
/// 1:1 i variant non-nativi di `BlogSection` (`lib/blog/types.ts`). Heading,
/// paragraph e list ora sono feature native del lexical editor; questi 4 blocchi
/// (callout/table/comparison/cta) restano blocchi inseribili. Il campo `body` è
/// `localized: true` → ogni lingua ha il suo richText (la migrazione popola
/// it/en; le altre lingue ereditano EN via fallback finché non tradotte).

const CalloutBlock: Block = {
  slug: 'callout',
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Tip', value: 'tip' },
      ],
    },
    { name: 'title', type: 'text' },
    { name: 'body', type: 'textarea', required: true },
  ],
};

const TableBlock: Block = {
  slug: 'table',
  fields: [
    { name: 'caption', type: 'text' },
    {
      name: 'headers',
      type: 'array',
      fields: [{ name: 'header', type: 'text', required: true }],
    },
    {
      name: 'rows',
      type: 'array',
      fields: [
        {
          name: 'cells',
          type: 'array',
          fields: [{ name: 'value', type: 'text' }],
        },
      ],
    },
  ],
};

const ComparisonBlock: Block = {
  slug: 'comparison',
  fields: [
    { name: 'aTitle', type: 'text', required: true },
    {
      name: 'aItems',
      type: 'array',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    { name: 'bTitle', type: 'text', required: true },
    {
      name: 'bItems',
      type: 'array',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
  ],
};

const CtaBlock: Block = {
  slug: 'cta',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'ctaLabel', type: 'text', required: true },
    { name: 'ctaHref', type: 'text', required: true },
  ],
};

/**
 * Articoli del blog/novità. Rispecchia il tipo `BlogPost`
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
    { name: 'ldType', type: 'text', defaultValue: 'BlogPosting' },
    { name: 'metaDescription', type: 'textarea', localized: true },
    { name: 'primaryKeyword', type: 'text', localized: true },
    {
      name: 'secondaryKeywords',
      type: 'array',
      localized: true,
      fields: [{ name: 'kw', type: 'text', required: true }],
    },
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
    {
      name: 'body',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [CalloutBlock, TableBlock, ComparisonBlock, CtaBlock] }),
        ],
      }),
    },
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
    {
      name: 'brandsMentioned',
      type: 'array',
      fields: [{ name: 'brand', type: 'text', required: true }],
    },
  ],
};
