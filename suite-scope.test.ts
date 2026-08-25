/**
 * Guardrail sulla SUITE, non sul prodotto.
 *
 * Il 25/08/2026 `pnpm test` raccoglieva 6.478 file di test, di cui 6.444
 * provenienti da `.claude/worktrees/`: trentatre checkout completi di altri
 * rami, dentro il repository e ignorati da git. Il 99,5% di quel verde non
 * riguardava questo ramo.
 *
 * Non e' un difetto estetico. «Suite completa verde» e' un cancello della 190:
 * un rosso vero di questo ramo poteva restare sepolto sotto migliaia di verdi
 * altrui, e un rosso ereditato da un ramo vecchio poteva bloccare la release
 * senza che si capisse da dove venisse.
 *
 * Questo test non puo' accorgersi dei file esclusi — per definizione non
 * vengono raccolti. Verifica invece che l'esclusione sia ancora scritta nella
 * configurazione, che e' la cosa che qualcuno potrebbe togliere.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("ambito della suite", () => {
  const config = readFileSync("vitest.config.ts", "utf8");

  it("esclude i worktree degli agenti", () => {
    expect(config).toContain('".claude/**"');
    expect(config).toContain('"**/.claude/**"');
  });

  it("esclude ancora node_modules e .next", () => {
    // Controllo positivo dell'asserzione qui sopra: se cercassi una stringa
    // che nel file non c'e' mai stata, il test passerebbe per caso. Queste
    // due c'erano gia' prima, e devono esserci ancora.
    expect(config).toContain('"node_modules/**"');
    expect(config).toContain('".next/**"');
  });

  it("l'esclusione non e' commentata", () => {
    const riga = config
      .split("\n")
      .find((l) => l.includes("exclude:") && !l.trimStart().startsWith("//"));
    expect(riga, "nessuna riga `exclude:` attiva in vitest.config.ts").toBeDefined();
    expect(riga).toContain(".claude/**");
  });
});
