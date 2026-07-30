/**
 * Guardrail KaTeX fail-closed (P1.1B Fase 5) — enumera OGNI formula LaTeX
 * realmente usata dai due calcolatori (importata dalle stesse costanti
 * sorgente della UI, mai una copia scritta a mano qui) e la renderizza con
 * `renderMath` (throwOnError: true dopo il fix). Se anche una sola formula è
 * malformata, questo script fallisce con la stessa eccezione che farebbe
 * fallire la build/i test — nessuna formula rotta può arrivare in
 * produzione silenziosamente come <span class="katex-error">.
 *
 * Copre entrambe le lingue dove le formule differiscono per locale (Sleep
 * Efficiency: le etichette delle variabili sono parole, tradotte) e le
 * formule condivise fra le lingue dove non ci sono parole da tradurre (HRV:
 * RMSSD, SD, HR, ln(RMSSD) sono già simboli/abbreviazioni internazionali).
 */
import { renderMath } from "../lib/labs/katex/render";
import { HRV_TOOL_CONTENT } from "../lib/labs/hrv/content";
import {
  SLEEP_EFFICIENCY_LATEX,
  SLEEP_EFFICIENCY_LATEX_IT,
  SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_EN,
  SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_IT,
  SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_EN,
  SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_IT,
} from "../components/labs/pages/SleepEfficiencyToolPageBody";
import {
  HR_MAX_ZONE_LATEX,
  HR_MAX_ZONE_LATEX_IT,
  KARVONEN_ZONE_LATEX,
  KARVONEN_ZONE_LATEX_IT,
  TANAKA_LATEX,
  TANAKA_LATEX_IT,
} from "../components/labs/pages/HeartRateZonesToolPageBody";

interface FormulaEntry {
  label: string;
  tex: string;
  displayMode: boolean;
}

const formulas: FormulaEntry[] = [
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
  { label: "Heart Rate Zones: stima FC max Tanaka (EN)", tex: TANAKA_LATEX, displayMode: true },
  { label: "Heart Rate Zones: stima FC max Tanaka (IT)", tex: TANAKA_LATEX_IT, displayMode: true },
  { label: "Heart Rate Zones: zona % FC max (EN)", tex: HR_MAX_ZONE_LATEX, displayMode: true },
  { label: "Heart Rate Zones: zona % FC max (IT)", tex: HR_MAX_ZONE_LATEX_IT, displayMode: true },
  { label: "Heart Rate Zones: zona Karvonen (EN)", tex: KARVONEN_ZONE_LATEX, displayMode: true },
  { label: "Heart Rate Zones: zona Karvonen (IT)", tex: KARVONEN_ZONE_LATEX_IT, displayMode: true },
];

function main() {
  const problems: string[] = [];

  for (const { label, tex, displayMode } of formulas) {
    try {
      const { html } = renderMath(tex, displayMode);
      if (!html.includes("katex-html")) {
        problems.push(`${label}: manca il ramo HTML (katex-html) nell'output.`);
      }
      if (!html.includes("<math")) {
        problems.push(`${label}: manca il ramo MathML (<math>) nell'output.`);
      }
      if (html.includes("katex-error")) {
        // Con throwOnError:true questo non dovrebbe mai accadere (l'errore
        // lancerebbe prima), ma se KaTeX cambiasse comportamento in futuro
        // non ci fidiamo silenziosamente: è comunque un problema bloccante.
        problems.push(`${label}: presente un .katex-error nell'output nonostante throwOnError:true.`);
      }
    } catch (err) {
      problems.push(`${label}: renderMath ha lanciato un'eccezione — formula malformata: ${String(err)}`);
    }
  }

  if (problems.length > 0) {
    console.error(`\n❌ Labs formulas render guardrail: ${problems.length} problema/i su ${formulas.length} formule\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Labs formulas render guardrail: ${formulas.length} formule (HRV: ${HRV_TOOL_CONTENT.formulaRows.length}, Sleep Efficiency: 6, Heart Rate Zones: 6) renderizzate senza errori, HTML+MathML presenti su tutte.`,
  );
}

main();
