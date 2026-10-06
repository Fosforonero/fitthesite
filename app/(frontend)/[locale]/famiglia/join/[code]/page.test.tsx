// @vitest-environment node
/**
 * Pagina pubblica del link d'invito: stesso contenuto per QUALUNQUE codice, in
 * tutte le 15 lingue, con la copy decisa da Matteo il 29/09/2026.
 *
 * Cosa NON viene esposto: nome del gruppo, nome di chi invita, numero dei
 * membri, frasi sulla condivisione predefinita, il codice (nel testo, nei
 * metadati, nei link), pulsanti o link per accettare o installare, e qualunque
 * differenza fra un codice e un altro.
 *
 * Le due frasi sono scritte QUI per esteso, non importate: cambiare la copy
 * nel sorgente senza una nuova decisione rende rosso il test.
 *
 * Mutazioni che lo rendono rosso (provate a mano il 29/09/2026):
 *   - rimettere `createClient(` o la chiave di servizio  -> "nessun client", "nessuna variabile"
 *   - leggere sessione o cookie                           -> "nessuna lettura di sessione"
 *   - stampare il codice nel testo                        -> "markup identico", "il codice non compare"
 *   - rimettere un pulsante o un link dello store         -> "nessun link, nessun pulsante"
 *   - cambiare una parola della frase italiana o inglese  -> "copy esatta"
 *   - mostrare l'inglese senza lang="en" (o in una lingua che non e' en/altre) -> "l'inglese vive solo in lang=en"
 *   - aggiungere una frase «traduzione» o un'intestazione -> "solo nome e frase"
 *   - togliere noindex o rimettere il codice nei metadati -> "metadati neutri"
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { locales } from "@/lib/i18n";
import { CLASSI_DI_CODICE, spiaAmbiente } from "@/test/invito-pubblico-trappola";

const trappola = vi.hoisted(() => ({
  costruiti: [] as string[],
  sessione: [] as string[],
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => {
    trappola.costruiti.push("supabase-js");
    throw new Error("client Supabase costruito");
  },
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => {
    trappola.costruiti.push("ssr");
    throw new Error("client Supabase SSR costruito");
  },
}));
// Nessuna lettura di sessione: cookie e intestazioni di richiesta sono vietati.
vi.mock("next/headers", () => ({
  cookies: () => {
    trappola.sessione.push("cookies");
    throw new Error("cookie letti");
  },
  headers: () => {
    trappola.sessione.push("headers");
    throw new Error("intestazioni lette");
  },
}));

import JoinFamilyPage, { dynamic, generateMetadata } from "./page";

/** Le due frasi decise da Matteo, per esteso. */
const FRASE_IT =
  "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non è stata annunciata una data di rilascio.";
const FRASE_EN =
  "Family Mesh is in development and is not yet available. No release date has been announced.";

const ALTRE_LINGUE = locales.filter((l) => l !== "it" && l !== "en");

const PAROLE_VIETATE: RegExp[] = [
  // nome di chi invita, gruppo, conteggio dei membri (in tutte le lingue della vecchia copy)
  /creata da|created by|creada por/i,
  /\bmembri\b|\bmembers\b|\bmiembros\b|\bmitglieder\b|\bmembres\b|\bmembros\b|\bczłonk/i,
  // promessa di condivisione predefinita
  /per default|by default|por defecto|par défaut|standardmäßig|por padrão|domyślnie|varsayılan/i,
  // il vecchio taglio della pagina
  /unisciti alla famiglia|sei stato invitato|you're invited|te han invitado|installa fitmesh|install fitmesh/i,
  /codice non trovato|code not found|invito non valido|invalid invite|formato codice/i,
  // pulsanti e link per accettare o installare
  /play\.google|apps\.apple|google play|app store|apri in fitmesh|open in fitmesh|scarica|download/i,
  // campi dell'anteprima, referrer e codice
  /group_name|members_count|group_type|expires_at|referrer|invite=|invite%3D|MESH-/i,
  // una qualunque presentazione come traduzione
  /traduzion|translat|übersetz|traduc|tradução|English|Italiano/i,
];

/** Il markup scrive apostrofi e virgolette come entita': si confronta a parita' di forma. */
function comeInMarkup(testo: string) {
  return testo
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

async function html(locale: string, codice: string) {
  const elemento = await JoinFamilyPage({
    params: Promise.resolve({ locale, code: codice }),
  });
  return renderToStaticMarkup(elemento);
}

/** I blocchi `<section lang="..">`, in ordine, con il loro contenuto. */
function blocchi(pagina: string) {
  return [...pagina.matchAll(/<section lang="([^"]*)">(.*?)<\/section>/g)].map((m) => ({
    lang: m[1],
    interno: m[2],
  }));
}

function soloTesto(markup: string) {
  return markup.replace(/<[^>]*>/g, "|").replace(/\|+/g, "|").replace(/^\||\|$/g, "");
}

let spia: ReturnType<typeof spiaAmbiente>;

beforeEach(() => {
  trappola.costruiti.length = 0;
  trappola.sessione.length = 0;
  spia = spiaAmbiente();
});
afterEach(() => {
  spia.ripristina();
});

describe("pagina pubblica dell'invito: nessun database, nessuna sessione", () => {
  it("nessun client Supabase costruito, in nessuna lingua e per nessun codice", async () => {
    for (const lc of locales) {
      for (const codice of Object.values(CLASSI_DI_CODICE)) await html(lc, codice);
      await generateMetadata({ params: Promise.resolve({ locale: lc, code: "MESH-ZZZZ" }) });
    }
    expect(trappola.costruiti).toEqual([]);
  });

  it("nessuna variabile di Supabase o della chiave di servizio viene letta", async () => {
    for (const lc of locales) {
      for (const codice of Object.values(CLASSI_DI_CODICE)) await html(lc, codice);
      await generateMetadata({ params: Promise.resolve({ locale: lc, code: "MESH-ZZZZ" }) });
    }
    expect(spia.lette).toEqual([]);
  });

  it("nessuna richiesta di rete: fetch non viene mai chiamato, in nessuna lingua e per nessun codice", async () => {
    for (const lc of locales) {
      for (const codice of Object.values(CLASSI_DI_CODICE)) await html(lc, codice);
      await generateMetadata({ params: Promise.resolve({ locale: lc, code: "MESH-ZZZZ" }) });
    }
    expect(spia.fetchChiamate).toEqual([]);
  });

  it("nessuna lettura di sessione: ne' cookie ne' intestazioni di richiesta", async () => {
    for (const lc of locales) {
      await html(lc, "MESH-ZZZZ");
      await generateMetadata({ params: Promise.resolve({ locale: lc, code: "MESH-ZZZZ" }) });
    }
    expect(trappola.sessione).toEqual([]);
  });

  it("e' sempre dinamica: mai prerenderizzata ne' messa in cache", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});

describe("pagina pubblica dell'invito: markup identico e senza dati", () => {
  it.each([...locales])(
    "lingua %s: markup identico per valido simulato, scaduto, esaurito, inesistente, malformato e lunghissimo",
    async (lc) => {
      const pagine = await Promise.all(
        Object.entries(CLASSI_DI_CODICE).map(async ([classe, codice]) => [classe, await html(lc, codice)] as const),
      );
      const [, riferimento] = pagine[0];
      for (const [classe, pagina] of pagine) {
        expect(pagina, `classe ${classe}`).toBe(riferimento);
      }
    },
  );

  it.each([...locales])("lingua %s: nessuna parola vietata e nessun codice nel markup", async (lc) => {
    for (const [classe, codice] of Object.entries(CLASSI_DI_CODICE)) {
      const pagina = await html(lc, codice);
      for (const vietata of PAROLE_VIETATE) {
        expect(pagina, `classe ${classe}, ${vietata}`).not.toMatch(vietata);
      }
      // Il codice non compare in nessuna forma: in chiaro, minuscolo, nel percorso.
      for (const forma of [codice, codice.toLowerCase(), encodeURIComponent(codice), codice.replace(/^MESH-/i, "")]) {
        if (forma.length < 4) continue;
        expect(pagina, `classe ${classe}, forma ${forma.slice(0, 12)}`).not.toContain(forma);
      }
    }
  });

  it.each([...locales])("lingua %s: nessun link, nessun pulsante, nessun modulo", async (lc) => {
    for (const codice of Object.values(CLASSI_DI_CODICE)) {
      const pagina = await html(lc, codice);
      expect(pagina).not.toMatch(/<a[\s>]/i);
      expect(pagina).not.toMatch(/<button[\s>]/i);
      expect(pagina).not.toMatch(/<form[\s>]/i);
      expect(pagina).not.toMatch(/<(img|svg|iframe|script)[\s>]/i);
      expect(pagina).not.toMatch(/href=|src=|action=|onclick/i);
    }
  });
});

describe("pagina pubblica dell'invito: copy esatta", () => {
  it("it: la frase italiana esatta, in un elemento lang=it, e nient'altro", async () => {
    const pagina = await html("it", "MESH-ZZZZ");
    expect(blocchi(pagina).map((b) => b.lang)).toEqual(["it"]);
    expect(pagina).toContain(`<p>${comeInMarkup(FRASE_IT)}</p>`);
    expect(soloTesto(pagina)).toBe(comeInMarkup(`Mesh Famiglia|${FRASE_IT}`));
  });

  it("en: la frase inglese esatta, in un elemento lang=en, e nient'altro", async () => {
    const pagina = await html("en", "MESH-ZZZZ");
    expect(blocchi(pagina).map((b) => b.lang)).toEqual(["en"]);
    expect(pagina).toContain(`<p>${comeInMarkup(FRASE_EN)}</p>`);
    expect(soloTesto(pagina)).toBe(comeInMarkup(`Family Mesh|${FRASE_EN}`));
  });

  it.each(ALTRE_LINGUE)(
    "lingua %s: due blocchi, italiano poi inglese, solo nome e frase, senza presentarli come traduzione",
    async (lc) => {
      const pagina = await html(lc, "MESH-ZZZZ");
      const b = blocchi(pagina);
      expect(b.map((x) => x.lang)).toEqual(["it", "en"]);
      expect(b[0].interno).toContain(`<p>${comeInMarkup(FRASE_IT)}</p>`);
      expect(b[1].interno).toContain(`<p>${comeInMarkup(FRASE_EN)}</p>`);
      // Solo nome e frase: nessuna intestazione o frase in piu'.
      expect(soloTesto(pagina)).toBe(
        comeInMarkup(`Mesh Famiglia|${FRASE_IT}|Family Mesh|${FRASE_EN}`),
      );
    },
  );

  it.each([...locales])("lingua %s: l'inglese vive solo in lang=en, l'italiano solo in lang=it", async (lc) => {
    const pagina = await html(lc, "MESH-ZZZZ");
    const senzaInglese = pagina.replace(/<section lang="en">.*?<\/section>/g, "");
    const senzaItaliano = pagina.replace(/<section lang="it">.*?<\/section>/g, "");
    expect(senzaInglese).not.toMatch(/Family Mesh|in development|release date|not yet available/i);
    expect(senzaItaliano).not.toMatch(/Mesh Famiglia|in sviluppo|data di rilascio|non è ancora disponibile/i);
  });

  it("una lingua non supportata risponde 404, come prima", async () => {
    await expect(html("xx", "MESH-ZZZZ")).rejects.toThrow();
  });
});

describe("pagina pubblica dell'invito: metadati neutri", () => {
  it.each([...locales])("lingua %s: titolo e descrizione fissi, noindex, nessun codice", async (lc) => {
    const metadati = await Promise.all(
      Object.values(CLASSI_DI_CODICE).map((codice) =>
        generateMetadata({ params: Promise.resolve({ locale: lc, code: codice }) }),
      ),
    );
    // Uguali fra loro: il codice non entra in nessun campo.
    for (const m of metadati) expect(m).toEqual(metadati[0]);

    const m = metadati[0];
    expect(m.robots).toEqual({ index: false, follow: false });

    const attesoIt = lc === "it" || ALTRE_LINGUE.includes(lc as never);
    const attesoEn = lc === "en" || ALTRE_LINGUE.includes(lc as never);
    const descrizioneAttesa = [attesoIt ? FRASE_IT : null, attesoEn ? FRASE_EN : null].filter(Boolean).join(" ");
    expect(m.description).toBe(descrizioneAttesa);
    expect(String(m.title)).toBe(
      `${[attesoIt ? "Mesh Famiglia" : null, attesoEn ? "Family Mesh" : null].filter(Boolean).join(" / ")} | FitMesh Sync`,
    );

    const serializzato = JSON.stringify(m);
    for (const codice of Object.values(CLASSI_DI_CODICE)) {
      expect(serializzato).not.toContain(codice);
    }
    for (const vietata of PAROLE_VIETATE) {
      // «English» e «Italiano» non compaiono nemmeno qui: i metadati non annunciano traduzioni.
      expect(serializzato).not.toMatch(vietata);
    }
    // Il titolo non presenta la Mesh come disponibile ne' invita a unirsi.
    expect(serializzato).not.toMatch(/unisciti|join the family|join family|invit/i);
    // Nessun canonical verso altre pagine e nessuna URL con il codice.
    expect(m.alternates ?? {}).toEqual({});
  });
});
