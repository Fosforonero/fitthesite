import { describe, expect, it } from "vitest";
import { renderMath } from "./render";
import { HRV_TOOL_CONTENT } from "@/lib/labs/hrv/content";
import {
  SLEEP_EFFICIENCY_LATEX,
  SLEEP_EFFICIENCY_LATEX_IT,
  SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_EN,
  SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_IT,
  SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_EN,
  SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_IT,
} from "@/components/labs/pages/SleepEfficiencyToolPageBody";

describe("renderMath", () => {
  it("produces both an HTML and a MathML branch (htmlAndMathml)", () => {
    const { html } = renderMath("x^2", false);
    expect(html).toContain("katex-mathml");
    expect(html).toContain("katex-html");
    expect(html).toContain("<math");
  });

  it("renders display mode formulas with the katex-display wrapper", () => {
    const { html } = renderMath("\\sqrt{x}", true);
    expect(html).toContain("katex-display");
  });

  it("renders inline mode without the katex-display wrapper", () => {
    const { html } = renderMath("x", false);
    expect(html).not.toContain("katex-display");
  });

  it("does not throw on the RMSSD formula used by the HRV tool", () => {
    const tex = String.raw`\mathrm{RMSSD} = \sqrt{ \frac{ \sum_{i=1}^{n-1} \left(RR_{i+1}-RR_i\right)^2 }{n-1} }`;
    const { html } = renderMath(tex, true);
    expect(html).toContain("katex-mathml");
    expect(html).not.toContain("katex-error");
  });

  it("does not throw on the Sleep Efficiency formula", () => {
    const tex = String.raw`\mathrm{Sleep\ Efficiency}\,(\%) = \frac{\mathrm{Total\ Sleep\ Time}}{\mathrm{Time\ in\ Bed}} \times 100`;
    const { html } = renderMath(tex, true);
    expect(html).toContain("katex-mathml");
    expect(html).not.toContain("katex-error");
  });

  it("throws (throwOnError: true, P1.1B) on malformed LaTeX instead of silently rendering a .katex-error span", () => {
    expect(() => renderMath("\\frac{1", false)).toThrow();
  });
});

describe("renderMath - ogni formula realmente usata dai calcolatori (P1.1B Fase 5)", () => {
  // Importate dalle stesse costanti sorgente della UI (non copiate a mano):
  // una formula malformata qui rompe QUESTO test, non solo lo script
  // standalone tools/check-labs-formulas-render.ts.
  const formulas: { label: string; tex: string; displayMode: boolean }[] = [
    ...HRV_TOOL_CONTENT.formulaRows.map((row) => ({
      label: `HRV: ${row.label.en}`,
      tex: row.formula,
      displayMode: true,
    })),
    { label: "Sleep Efficiency: formula principale (EN)", tex: SLEEP_EFFICIENCY_LATEX, displayMode: true },
    { label: "Sleep Efficiency: formula principale (IT)", tex: SLEEP_EFFICIENCY_LATEX_IT, displayMode: true },
    { label: "Sleep Efficiency: simbolo Total Sleep Time (EN)", tex: SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_EN, displayMode: false },
    { label: "Sleep Efficiency: simbolo Tempo totale di sonno (IT)", tex: SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_IT, displayMode: false },
    { label: "Sleep Efficiency: simbolo Time in Bed (EN)", tex: SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_EN, displayMode: false },
    { label: "Sleep Efficiency: simbolo Tempo trascorso a letto (IT)", tex: SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_IT, displayMode: false },
  ];

  it("copre almeno una formula per tool live (rileva se qualcuno smette di enumerarle)", () => {
    expect(formulas.length).toBeGreaterThanOrEqual(HRV_TOOL_CONTENT.formulaRows.length + 6);
  });

  it.each(formulas)("$label non lancia e produce HTML+MathML", ({ tex, displayMode }) => {
    const { html } = renderMath(tex, displayMode);
    expect(html).toContain("katex-html");
    expect(html).toContain("<math");
    expect(html).not.toContain("katex-error");
  });
});
