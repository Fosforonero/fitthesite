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
//
// ─── PERIMETRO DELLA SUITE (INFRA-5, 26/08/2026) ──────────────────────────
// Il 25/08/2026 `pnpm test` raccoglieva 6.478 file, di cui 6.444 provenienti
// da `.claude/worktrees/`: trentaquattro checkout completi di ALTRI rami,
// dentro il repository e ignorati da git. Il 99,5% di quel verde non
// riguardava questo ramo.
//
// La prima correzione fu un'esclusione. Un'esclusione e' una lista di cose a
// cui pensare in anticipo: basta una directory nuova a cui nessuno ha pensato
// e il perimetro si riapre in silenzio. Qui il perimetro e' POSITIVO — si
// dichiara cosa entra, non cosa esce — e l'esclusione resta solo come
// seconda linea. Un perimetro positivo ha il rischio opposto (un test vero
// scritto fuori dalle directory dichiarate non verrebbe mai eseguito), e per
// quello c'e' `tools/check-perimetro-suite.ts`: confronta cio' che vitest
// raccoglie con TUTTI i file di test tracciati da git, e diventa rosso in
// entrambe le direzioni.
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
    // Radice ESPLICITA di questo repository. Senza, la radice e' quella da cui
    // si lancia il comando: `pnpm test` eseguito da una directory sopra
    // porterebbe dentro i trentasei checkout `fitthesite-*` che vivono accanto
    // a questo, piu' i worktree dell'app.
    root: __dirname,
    dir: __dirname,
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    setupFiles: ["./vitest.setup.ts"],
    // Perimetro positivo: SOLO queste directory e SOLO questi due suffissi.
    // I pattern sono ancorati alla radice, quindi
    // `.claude/worktrees/x/lib/y.test.ts` non combacia con `lib/**` — che e'
    // esattamente la proprieta' che un'esclusione non puo' garantire.
    include: [
      "app/**/*.test.ts",
      "app/**/*.test.tsx",
      "components/**/*.test.ts",
      "components/**/*.test.tsx",
      "lib/**/*.test.ts",
      "lib/**/*.test.tsx",
      "test/**/*.test.ts",
      "test/**/*.test.tsx",
      "tools/**/*.test.ts",
      "*.test.ts",
      "*.test.tsx",
    ],
    // Seconda linea. Se un giorno il perimetro positivo venisse allargato per
    // distrazione, queste voci reggono ancora.
    exclude: [
      "node_modules/**",
      "**/node_modules/**",
      ".next/**",
      "**/.next/**",
      ".claude/**",
      "**/.claude/**",
      "**/.git/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "**/fitthesite-*/**",
    ],
  },
});
