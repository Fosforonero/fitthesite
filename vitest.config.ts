import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Scope minimo: unit test puri (schema/validazione, resolver di lingua),
// niente Next.js runtime (no "next/server", "next/headers") di default — solo
// l'alias @/* (usato da lib/locale-negotiation.ts -> lib/i18n) è risolto
// qui. Password recovery hotfix (2026-07-24): estensione anticipata da questo
// stesso commento in precedenza — i .test.tsx (component React, es.
// ResetPasswordForm) girano in jsdom via environmentMatchGlobs, i .test.ts
// esistenti restano in "node" (nessun overhead jsdom per loro).
export default defineConfig({
  plugins: [react()],
  // tsconfig.json ha jsx:"preserve" (Next.js usa SWC per il transform reale,
  // non tsc) — senza forzare qui esbuild interpreta il JSX col runtime
  // "classic" e i .test.tsx falliscono con "React is not defined".
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
