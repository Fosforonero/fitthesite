/**
 * Guardrail sul WORKFLOW della CI backend, non sul prodotto.
 *
 * Fino al 26/08/2026 nessuna CI eseguiva questa suite. Adesso c'e', e questo
 * file esiste perche' un workflow e' un file come gli altri: si puo' svuotare
 * con una riga. I due modi di svuotarlo sono opposti e vanno chiusi entrambi:
 *
 *  - togliere il gate, e allora la CI resta verde senza aver misurato niente;
 *  - aggiungere un deploy o un upload, e allora una CI che doveva solo
 *    guardare comincia a distribuire.
 *
 * Il controllo positivo che dimostra che queste asserzioni sanno fallire sta
 * in `tools/gate-release-suite.sh --controllo-positivo`, che toglie davvero la
 * riga del gate dal workflow e pretende il rosso.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const PERCORSO = ".github/workflows/backend-suite.yml";

describe("CI backend", () => {
  const wf = readFileSync(PERCORSO, "utf8");
  /**
   * Le righe di commento vanno tolte prima di cercare le parole vietate: il
   * commento in testa al workflow SPIEGA che non c'e' nessun deploy Vercel e
   * nessun `next build`, e cercare quelle parole nel testo intero rendeva
   * rosso il guardrail per la frase che dice la cosa giusta. Un controllo
   * deve guardare cio' che il workflow FA, non cio' che dice.
   */
  const wfAttivo = wf
    .split("\n")
    .filter((r) => !r.trimStart().startsWith("#"))
    .join("\n");

  it("esegue il gate di release", () => {
    expect(
      wf,
      "il workflow non invoca piu' tools/gate-release-suite.sh: sarebbe una CI che non misura",
    ).toContain("tools/gate-release-suite.sh");
    // `--costruisci`: in CI il database va COSTRUITO qui dentro. Senza il
    // flag, il gate assumerebbe un bersaglio gia' pronto e non ne creerebbe
    // nessuno, e i sei test contro il database si salterebbero.
    expect(wf).toContain("gate-release-suite.sh --costruisci");
  });

  it("non distribuisce e non carica niente", () => {
    for (const vietato of [
      "vercel",
      "upload-artifact",
      "download-artifact",
      "next build",
      "--prod",
      "softprops/action-gh-release",
      "peaceiris/actions-gh-pages",
    ]) {
      expect(wfAttivo.toLowerCase(), `il workflow ESEGUE «${vietato}»`).not.toContain(vietato.toLowerCase());
    }
  });

  it("ha permessi di sola lettura", () => {
    expect(wf).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });

  it("non punta mai al Supabase condiviso o alla produzione", () => {
    for (const vietato of ["supabase_db_fitmesh", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE"]) {
      expect(wfAttivo, `il workflow nomina «${vietato}»`).not.toContain(vietato);
    }
    expect(wf).toContain("SUPABASE_DB_CONTAINER: pg17-ci-effimero");
  });

  it("ripulisce sempre, anche dopo un fallimento", () => {
    expect(wf).toContain("if: always()");
    expect(wf).toContain("docker rm -f");
  });

  it("congela node e pnpm", () => {
    expect(wf).toContain('node-version-file: ".nvmrc"');
    expect(wf).toContain("--frozen-lockfile");
    expect(wf).toContain("corepack prepare");
  });

  it("controllo positivo: queste asserzioni sanno guardare il file giusto", () => {
    // Se il file fosse vuoto o fosse un altro, i `toContain` qui sopra
    // fallirebbero tutti; se cercassi una stringa mai esistita, passerebbero
    // per caso. Questa e' la verifica dell'ago nel pagliaio giusto.
    expect(wf).not.toContain("questa-stringa-non-esiste-nel-workflow");
    expect(wf.length).toBeGreaterThan(1000);
  });
});
