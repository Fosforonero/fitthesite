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
    // `.claude/**` contiene i worktree degli agenti: checkout completi di
    // altri rami, dentro il repository e ignorati da git. Senza questa riga
    // vitest li scandiva, e la suite eseguiva 6.478 file di cui 6.444
    // provenienti da rami che non sono questo — misurato il 25/08/2026.
    //
    // Un gate di release che dice «suite verde» mentre esegue in maggioranza
    // test di altri rami non misura questo ramo. Poteva nascondere un rosso
    // vero sotto migliaia di verdi altrui, e produrre un rosso da un ramo
    // vecchio senza che nessuno capisse da dove venisse.
    exclude: ["node_modules/**", ".next/**", ".claude/**", "**/.claude/**"],
  },
});
