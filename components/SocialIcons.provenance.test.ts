import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Blocca la provenienza dichiarata nei commenti di FacebookIcon/LinkedInIcon:
 * l'hash SHA-256 dell'attributo d del path e' quello verificato il 14/10/2026
 * contro icons/facebook.svg e icons/linkedin.svg del pacchetto simple-icons
 * (Facebook 11.0.0-16.35.0, LinkedIn 13.0.0). Se il path cambia di proposito,
 * va rifatto il confronto con la sorgente e aggiornati commento e hash.
 * Non verifica il disegno visivo.
 */
const EXPECTED: Record<string, string> = {
  "FacebookIcon.tsx": "910dcaa575f731d3e2f1cadeb5a4fcbdcfa6d71ba3bd04c6d2734c4104bba816",
  "LinkedInIcon.tsx": "1b39e69f7e22d622f9cbd03aa94d6ec7006e4012069fa33001c5da71f2a224b4",
};

describe("provenienza dei path delle icone social", () => {
  for (const [file, hash] of Object.entries(EXPECTED)) {
    it(`${file}: d identico alla sorgente simple-icons registrata`, () => {
      const src = readFileSync(join(__dirname, file), "utf8");
      const m = src.match(/<path d="([^"]+)"/);
      expect(m).not.toBeNull();
      const got = createHash("sha256").update(m![1]).digest("hex");
      expect(got).toBe(hash);
    });
  }
});
