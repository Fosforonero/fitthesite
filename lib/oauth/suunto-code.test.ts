import { describe, expect, it } from "vitest";

import { suuntoCodeFromQuery, suuntoCodeShape } from "./suunto-backend";

describe("suuntoCodeFromQuery", () => {
  it("un + letterale resta un +", () => {
    expect(suuntoCodeFromQuery("?code=a+b&state=s")).toBe("a+b");
  });
  it("decodifica le sequenze percentuali (%2B -> +, %20 -> spazio)", () => {
    expect(suuntoCodeFromQuery("?code=a%2Bb%20c")).toBe("a+b c");
  });
  it("prende il primo code e ignora un parametro che finisce per code", () => {
    expect(suuntoCodeFromQuery("?xcode=no&code=si&code=no")).toBe("si");
  });
  it("assente -> null; code vuoto -> stringa vuota; malformato -> null", () => {
    expect(suuntoCodeFromQuery("?state=s")).toBeNull();
    expect(suuntoCodeFromQuery("?code=")).toBe("");
    expect(suuntoCodeFromQuery("?code=%zz")).toBeNull();
  });
  it("accetta la query senza il punto interrogativo iniziale", () => {
    expect(suuntoCodeFromQuery("code=z&state=s")).toBe("z");
  });
});

describe("suuntoCodeShape", () => {
  it("conta solo la forma", () => {
    expect(suuntoCodeShape("Abc-1_2.~")).toEqual({ len: 9, plus: false, space: false, pct: false, other: 0 });
    expect(suuntoCodeShape("a+b c%4Dd/e=")).toEqual({ len: 12, plus: true, space: true, pct: true, other: 2 });
  });
  it("non restituisce mai il valore", () => {
    expect(JSON.stringify(suuntoCodeShape("VALORE-SEGRETO"))).not.toContain("VALORE");
  });
});
