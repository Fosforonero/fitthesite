import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Configurazione SOLO della prova applicativa dell'export. Non fa parte del perimetro della suite
// (vitest.config.ts alla radice non raccoglie *.prova.tsx e tools/ e' escluso da tsc).
const RADICE = path.resolve(__dirname, '../../..');

export default defineConfig({
  plugins: [react()],
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { '@': RADICE } },
  test: {
    root: RADICE,
    dir: RADICE,
    environment: 'jsdom',
    setupFiles: [path.join(RADICE, 'vitest.setup.ts')],
    include: ['tools/prove-locali/export-applicativo/*.prova.tsx'],
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
