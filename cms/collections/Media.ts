import type { CollectionConfig } from 'payload';

/** Immagini (hero, OG). `alt` localizzato per accessibilità + SEO per lingua. */
export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  upload: true,
  fields: [{ name: 'alt', type: 'text', localized: true }],
};
