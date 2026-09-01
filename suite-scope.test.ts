/**
 * Guardrail sulla SUITE, non sul prodotto.
 *
 * Il 25/08/2026 `pnpm test` raccoglieva 6.478 file di test, di cui 6.444
 * provenienti da `.claude/worktrees/`: trentaquattro checkout completi di altri
 * rami, dentro il repository e ignorati da git. Il 99,5% di quel verde non
 * riguardava questo ramo.
 *
 * Non e' un difetto estetico. «Suite completa verde» e' un cancello della 190:
 * un rosso vero di questo ramo poteva restare sepolto sotto migliaia di verdi
 * altrui, e un rosso ereditato da un ramo vecchio poteva bloccare la release
 * senza che si capisse da dove venisse.
 *
 * QUESTO FILE NON E' IL CANCELLO. Il cancello e'
 * `tools/check-perimetro-suite.ts`, che guarda cosa vitest raccoglie DAVVERO e
 * lo confronta con i file di test tracciati da git. Un test che gira dentro la
 * suite non puo' accorgersi dei file esclusi — per definizione non vengono
 * raccolti — quindi qui si verifica soltanto che il perimetro sia ancora
 * SCRITTO come deve, e che il cancello vero esista e sia collegato. E' la
 * seconda linea, non la prima.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("ambito della suite", () => {
  const config = readFileSync("vitest.config.ts", "utf8");
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts?: Record<string, string>;
  };

  it("dichiara una radice esplicita", () => {
    // Senza `root`, la radice e' quella da cui si lancia il comando: da una
    // directory sopra, la suite pescherebbe nei trentasei checkout
    // `fitthesite-*` che vivono accanto a questo.
    expect(config).toContain("root: __dirname");
  });

  it("il perimetro e' positivo: elenca cosa entra, non solo cosa esce", () => {
    for (const pattern of [
      '"app/**/*.test.ts"',
      '"components/**/*.test.ts"',
      '"lib/**/*.test.ts"',
      '"test/**/*.test.ts"',
    ]) {
      expect(config, `manca il pattern ${pattern} nell'include`).toContain(pattern);
    }
    // La forma che il perimetro positivo esiste per NON avere: un include
    // globale lascia rientrare qualunque directory nuova a cui nessuno ha
    // pensato.
    expect(config).not.toContain('include: ["**/*.test.ts"');
  });

  it("esclude ancora i worktree degli agenti, node_modules e .next", () => {
    for (const voce of ['".claude/**"', '"**/.claude/**"', '"node_modules/**"', '".next/**"']) {
      expect(config, `manca l'esclusione ${voce}`).toContain(voce);
    }
  });

  it("controllo positivo: queste asserzioni sanno anche fallire", () => {
    // Se cercassi una stringa che nel file non c'e' mai stata, i test qui
    // sopra passerebbero per caso senza dimostrare niente. Questa e' la
    // verifica che `toContain` stia davvero guardando il file giusto.
    expect(config).not.toContain('"questa-stringa-non-esiste-nel-file/**"');
    expect(config.length).toBeGreaterThan(500);
  });

  it("il cancello vero esiste ed e' collegato", () => {
    const gate = readFileSync("tools/check-perimetro-suite.ts", "utf8");
    expect(gate).toContain("--controllo-positivo");
    const conf = readFileSync("tools/perimetro-suite.conf", "utf8");
    expect(conf).toMatch(/^file=\d+$/m);
    expect(conf).toMatch(/^test=\d+$/m);
    expect(pkg.scripts?.["suite:perimetro-check"]).toBe("tsx tools/check-perimetro-suite.ts");
  });

  it("la suite non gira mai in watch", () => {
    const comando = pkg.scripts?.test ?? "";
    expect(comando).toMatch(/(^|\s)(run|--run)(\s|$)/);
    expect(comando).not.toMatch(/--watch|(^|\s)watch(\s|$)/);
  });
});
