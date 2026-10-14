import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Blocca la provenienza dichiarata nei commenti di FacebookIcon/LinkedInIcon
 * sull'INTERO elemento svg: esattamente un <svg>, aperto con viewBox
 * "0 0 24 24" e fill di marca attesi, con come unico figlio esattamente UN
 * <path> il cui attributo d ha l'hash SHA-256 verificato il 14/10/2026 contro
 * icons/facebook.svg e icons/linkedin.svg del pacchetto simple-icons
 * (Facebook 11.0.0-16.35.0, LinkedIn 13.0.0). Nessun altro figlio, nessun
 * secondo path, nessun attributo d diverso. Se il path cambia di proposito,
 * va rifatto il confronto con la sorgente e aggiornati commento e hash.
 * Limite dichiarato: non verifica il DISEGNO visivo della «f» ne' della «in».
 */
const EXPECTED: Record<string, { hash: string; fill: string }> = {
  "FacebookIcon.tsx": {
    hash: "910dcaa575f731d3e2f1cadeb5a4fcbdcfa6d71ba3bd04c6d2734c4104bba816",
    fill: "#0866FF",
  },
  "LinkedInIcon.tsx": {
    hash: "1b39e69f7e22d622f9cbd03aa94d6ec7006e4012069fa33001c5da71f2a224b4",
    fill: "#0A66C2",
  },
};

describe("provenienza dei path delle icone social", () => {
  for (const [file, { hash, fill }] of Object.entries(EXPECTED)) {
    it(`${file}: svg esatto, un solo path con d identico alla sorgente`, () => {
      const src = readFileSync(join(__dirname, file), "utf8");
      expect(src.match(/<svg[\s>]/g)).toHaveLength(1);
      expect(src.match(/<\/svg>/g)).toHaveLength(1);
      expect(src.match(/<path[\s>]/g)).toHaveLength(1);

      const m = src.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/);
      expect(m).not.toBeNull();
      const [, attrs, inner] = m!;
      expect(attrs).toContain('viewBox="0 0 24 24"');
      expect(attrs).toContain(`fill="${fill}"`);
      expect(attrs.match(/\bviewBox=/g)).toHaveLength(1);
      expect(attrs.match(/\bfill=/g)).toHaveLength(1);

      const p = inner.trim().match(/^<path d="([^"]+)"\s*\/>$/);
      expect(p, "l'unico figlio deve essere un <path d=... /> senza altri attributi").not.toBeNull();
      expect(createHash("sha256").update(p![1]).digest("hex")).toBe(hash);
    });
  }
});
