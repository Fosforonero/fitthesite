import type { CollectionConfig } from 'payload';

/**
 * Utenti della bacheca. `auth: true` abilita login/sessione.
 * Ruolo `editor` = persona non tecnica che gestisce articoli e landing.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['editor'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
};
