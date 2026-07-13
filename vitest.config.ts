import path from "node:path";
import { defineConfig } from "vitest/config";

// Scope minimo: unit test puri (schema/validazione, resolver di lingua),
// niente Next.js runtime (no "next/server", "next/headers", React) — solo
// l'alias @/* (usato da lib/locale-negotiation.ts -> lib/i18n) è risolto
// qui. Se in futuro servissero test che toccano route handler/React,
// estendere con environment: "jsdom".
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
