/**
 * Codifica application/x-www-form-urlencoded (WHATWG URL, "urlencoded
 * serializer"), quella che RFC 6749 §2.3.1 e Appendice B prescrivono per id e
 * segreto del client prima dell'header Basic.
 *
 * Oracolo indipendente: URLSearchParams del runtime (implementazione WHATWG di
 * Node, non il nostro codice). Le stringhe attese scritte a mano qui sotto sono
 * una seconda verifica, indipendente da entrambi.
 *
 * Valori tutti sintetici.
 */
import { describe, expect, it } from "vitest";

import { formUrlEncode } from "./form-urlencoded";

/** Il serializzatore WHATWG del runtime, applicato a un solo valore. */
function oracolo(valore: string): string {
  return new URLSearchParams({ v: valore }).toString().slice(2);
}

const CAMPIONI: string[] = [
  "",
  "abcXYZ019",
  "*-._",
  " ",
  "a b  c",
  "~",
  "!'()",
  ":/?#[]@!$&'()*+,;=",
  "%",
  "%zz",
  "%41",
  "%%25",
  "\t\r\n\0",
  "\"<>\\^`{|}",
  "àèéìòù",
  "ÄÖÜß",
  "日本語のテスト",
  "中文测试",
  "😀",
  "🏃‍♂️",
  "\u{10FFFF}",
  "\u0080߿ࠀ￿",
  "id:con:due-punti",
  "Sg+a/b==",
  "\uD800",
  "x\uDC00y",
  "􏿿",
];

describe("formUrlEncode = application/x-www-form-urlencoded (WHATWG), confrontato con URLSearchParams", () => {
  it.each(CAMPIONI.map((c) => [JSON.stringify(c), c]))("%s coincide con l'oracolo", (_n, campione) => {
    expect(formUrlEncode(campione)).toBe(oracolo(campione));
  });

  it("ogni singolo carattere da U+0000 a U+00FF coincide con l'oracolo", () => {
    for (let cp = 0; cp <= 0xff; cp++) {
      const c = String.fromCodePoint(cp);
      expect(formUrlEncode(c), `U+${cp.toString(16).padStart(4, "0")}`).toBe(oracolo(c));
    }
  });

  it("stringa lunga (50 000 caratteri misti): coincide con l'oracolo", () => {
    const lunga = "a é/日😀 *~%".repeat(5000);
    expect(formUrlEncode(lunga)).toBe(oracolo(lunga));
  });

  it("lascia non codificati SOLO A-Za-z0-9 e * - . _", () => {
    const lasciati: string[] = [];
    for (let cp = 0x21; cp <= 0x7e; cp++) {
      const c = String.fromCharCode(cp);
      if (formUrlEncode(c) === c) lasciati.push(c);
    }
    expect(lasciati.join("")).toBe("*-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz");
  });

  it("valori attesi scritti a mano (riservati, spazio, tilde, percento, Unicode)", () => {
    expect(formUrlEncode(":/?#[]@!$&'()*+,;=")).toBe("%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29*%2B%2C%3B%3D");
    expect(formUrlEncode("a b")).toBe("a+b");
    expect(formUrlEncode("~")).toBe("%7E");
    expect(formUrlEncode("%zz")).toBe("%25zz");
    expect(formUrlEncode("-._*")).toBe("-._*");
    expect(formUrlEncode("é")).toBe("%C3%A9");
    expect(formUrlEncode("日")).toBe("%E6%97%A5");
    expect(formUrlEncode("😀")).toBe("%F0%9F%98%80");
    expect(formUrlEncode("")).toBe("");
  });

  it("surrogato spaiato: diventa U+FFFD (%EF%BF%BD), come URLSearchParams e TextEncoder; nessuna eccezione", () => {
    expect(formUrlEncode("\uD800")).toBe("%EF%BF%BD");
    expect(formUrlEncode("a\uDC00b")).toBe("a%EF%BF%BDb");
  });

  it("la versione precedente (encodeURIComponent) NON era form-urlencoded: spazio, ~, ! ' ( ) divergono; '*' no (entrambi lo lasciano)", () => {
    const divergenti = [" ", "~", "!", "'", "(", ")"];
    for (const c of divergenti) {
      expect(encodeURIComponent(c), JSON.stringify(c)).not.toBe(oracolo(c));
      expect(formUrlEncode(c), JSON.stringify(c)).toBe(oracolo(c));
    }
    expect(encodeURIComponent(" ")).toBe("%20");
    expect(oracolo(" ")).toBe("+");
    expect(encodeURIComponent("~!'()")).toBe("~!'()");
    expect(oracolo("~!'()")).toBe("%7E%21%27%28%29");
    expect(encodeURIComponent("*")).toBe("*");
    expect(oracolo("*")).toBe("*");
  });
});
