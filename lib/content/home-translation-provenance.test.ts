import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";
import { cellStatus, dumpValues, type Manifest } from "../../tools/s02-home-cells";
import {
  HOME_TRANSLATION_CONTROL,
  HOME_TRANSLATION_LOCALES,
  HOME_TRANSLATION_PROVENANCE,
  HOME_TRANSLATION_VERSION,
  homeTranslationStatus,
} from "./home-translation-provenance";

const root = path.resolve(__dirname, "../..");
const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(root, "tools/data/s02-home-units.json"), "utf8"));

describe("provenienza delle 13 lingue della home (TRANSLATIONS «Declaring the source»)", () => {
  it("dichiara le 13 lingue, tutte e sole, mai it ed en", () => {
    const attese = locales.filter((l) => l !== "it" && l !== "en");
    expect([...HOME_TRANSLATION_LOCALES].sort()).toEqual([...attese].sort());
    expect(Object.keys(HOME_TRANSLATION_PROVENANCE.byLocale).sort()).toEqual([...attese].sort());
  });

  it("quattro punti: lingua d'origine it, ruolo derivata, origine con versione e hash, controllo di agente", () => {
    const p = HOME_TRANSLATION_PROVENANCE;
    expect(p.authoredLanguage).toBe("it");
    expect(p.role.source).toEqual(["it"]);
    expect(p.role.derivative).toEqual(HOME_TRANSLATION_LOCALES);
    expect(p.origin.fromLanguage).toBe("it");
    expect(p.origin.revision).toBe("BASE-HOME-v2.1-8961c3f9");
    expect(p.origin.revision).toBe(HOME_TRANSLATION_VERSION);
    expect(p.origin.revisionSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(p.origin.revisionSha256.startsWith("8961c3f9")).toBe(true);
    expect(p.control).toBe("AGENT_EDITORIALLY_REVIEWED");
    expect(HOME_TRANSLATION_CONTROL).toBe("AGENT_EDITORIALLY_REVIEWED");
    expect(p.controlNote).toBe("revisione di agente, non madrelingua");
    expect(p.controlRecordedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("per ogni lingua consegnate e pendenti sono disgiunte e coprono tutte le unita' del manifest di quella lingua", () => {
    for (const lc of HOME_TRANSLATION_LOCALES) {
      const { delivered, pending } = homeTranslationStatus(lc);
      expect(delivered.filter((x) => pending.includes(x)), lc).toEqual([]);
      const attese = manifest.unita.filter((u) => lc in u.celle).map((u) => u.id);
      expect([...delivered, ...pending].sort(), lc).toEqual([...attese].sort());
    }
  });

  it("la dichiarazione coincide con lo stato reale del sito (celle assenti o ancora a f142eac = pendenti)", async () => {
    const { values } = await dumpValues(root);
    const reale = cellStatus(manifest, values);
    for (const lc of HOME_TRANSLATION_LOCALES) {
      const { delivered, pending } = homeTranslationStatus(lc);
      expect([...delivered].sort(), `consegnate ${lc}`).toEqual([...reale[lc].consegnate].sort());
      expect([...pending].sort(), `pendenti ${lc}`).toEqual(reale[lc].pendenti.map((p) => p.id).sort());
    }
  });
});
