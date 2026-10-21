import { describe, it, expect } from "vitest";
import { markdownToPlainText } from "./plain-text";

describe("markdownToPlainText", () => {
  it("tiene l'etichetta dei link e scarta l'href", () => {
    expect(markdownToPlainText("Vedi la [guida Garmin](/it/blog/esportare-dati-garmin) ora.")).toBe("Vedi la guida Garmin ora.");
  });
  it("toglie il grassetto e lascia invariato il testo senza markdown", () => {
    expect(markdownToPlainText("**Importante**: nessun link qui.")).toBe("Importante: nessun link qui.");
    expect(markdownToPlainText("Solo testo (tra parentesi).")).toBe("Solo testo (tra parentesi).");
  });
  it("gestisce piu' link nello stesso testo", () => {
    expect(markdownToPlainText("[A](/a) e [B](https://example.com/b?x=1)")).toBe("A e B");
  });
});
