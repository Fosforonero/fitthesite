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

  /**
   * «Congelato» dev'essere vero, non un modo di dire.
   *
   * `.nvmrc` diceva «22»: e' la major, non una versione. Due esecuzioni a un
   * mese di distanza potevano girare su due Node diversi e chiamarsi entrambe
   * toolchain congelata. E `engines.node` diceva `>=20`, mentre pnpm 11.15.0
   * dichiara `engines.node: >=22.13`: il repository permetteva
   * un'installazione che non puo' funzionare, ed e' esattamente il modo in cui
   * la prima esecuzione della CI e' morta con «No such built-in module:
   * node:sqlite», che di quella causa non dice niente.
   */
  it("le dichiarazioni di Node sono una sola, ed esatta", () => {
    const nvmrc = readFileSync(".nvmrc", "utf8").trim();
    expect(
      nvmrc,
      "«22» congela la major, non la versione: serve x.y.z, altrimenti non e' congelata",
    ).toMatch(/^\d+\.\d+\.\d+$/);

    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      engines?: { node?: string };
      packageManager?: string;
    };
    const pavimento = pkg.engines?.node ?? "";
    const m = /^>=\s*(\d+)\.(\d+)\.(\d+)$/.exec(pavimento);
    expect(m, `engines.node deve essere un pavimento «>=x.y.z», e' «${pavimento}»`).not.toBeNull();

    const versione = nvmrc.split(".").map(Number);
    const minimo = m!.slice(1).map(Number);
    const soddisfa =
      versione[0] > minimo[0] ||
      (versione[0] === minimo[0] &&
        (versione[1] > minimo[1] || (versione[1] === minimo[1] && versione[2] >= minimo[2])));
    expect(soddisfa, `.nvmrc ${nvmrc} non soddisfa engines.node ${pavimento}`).toBe(true);

    // Il pavimento non e' un'opinione: e' il requisito di pnpm 11.15.0.
    expect(pkg.packageManager).toBe("pnpm@11.15.0");
    expect(minimo[0] > 22 || (minimo[0] === 22 && minimo[1] >= 13)).toBe(true);

    // E il workflow deve verificarlo a sua volta, sul Node che gira davvero.
    expect(wfAttivo).toContain("Le tre dichiarazioni di Node devono combaciare");
  });

  /**
   * Il difetto che ha reso rossa la terza esecuzione non era la copia: era il
   * TESTIMONE. Un branch si muove, e `main` locale era rimasto indietro di 194
   * commit. Il workflow non deve piu' avere niente a che fare con `main`.
   */
  it("non recupera ne' consulta un ref mobile", () => {
    expect(wfAttivo, "il workflow recupera ancora «main»").not.toContain("origin main:main");
    expect(wfAttivo, "il workflow usa ancora «git show main:»").not.toContain("git show main:");
    expect(
      wfAttivo,
      "senza fetch-depth: 0 i commit congelati non ci sono e la provenienza non si puo' verificare",
    ).toContain("fetch-depth: 0");
    expect(wfAttivo).toContain("I commit congelati delle fixture devono esserci");
  });

  it("non usa ancore YAML, e le due liste di percorsi restano identiche", () => {
    // GitHub Actions non supporta ufficialmente le ancore YAML. Il 26/08/2026
    // un push che toccava SOLO il workflow non ha prodotto nessun run, mentre
    // push precedenti l'avevano fatto: il filtro `paths` scritto con un alias
    // non veniva risolto. Le due liste sono ripetute per esteso, e questo test
    // impedisce che divergano in silenzio — che e' il prezzo della ripetizione.
    expect(wfAttivo, "ancora YAML nel workflow").not.toMatch(/^\s*\w+:\s*&\w/m);
    expect(wfAttivo, "alias YAML nel workflow").not.toMatch(/:\s*\*\w+\s*$/m);
    const liste = [...wfAttivo.matchAll(/paths:\n((?:\s+- ".*"\n)+)/g)].map((m) => m[1]);
    expect(liste, "attese due liste di percorsi (pull_request e push)").toHaveLength(2);
    expect(liste[0]).toBe(liste[1]);
  });

  it("controllo positivo: queste asserzioni sanno guardare il file giusto", () => {
    // Se il file fosse vuoto o fosse un altro, i `toContain` qui sopra
    // fallirebbero tutti; se cercassi una stringa mai esistita, passerebbero
    // per caso. Questa e' la verifica dell'ago nel pagliaio giusto.
    expect(wf).not.toContain("questa-stringa-non-esiste-nel-workflow");
    expect(wf.length).toBeGreaterThan(1000);
  });
});
