import { LANDING_PAGES } from "@/lib/landing/data";
import { walkLanding } from "@/lib/landing/es-overlay";
import { locales } from "@/lib/i18n";

const NON_GATED = locales.filter(l => l !== "it" && l !== "en");
let totalDupes = 0;
const byLocale: Record<string, number> = {};
for (const lp of LANDING_PAGES) {
  const entries = walkLanding(lp);
  for (const lc of NON_GATED) {
    let complete = true;
    for (const e of entries) {
      const v = (e.node as Record<string, unknown>)[lc];
      if (v == null) { complete = false; break; }
      if (e.kind === "list") {
        const src = (e.node.en ?? e.node.it) as unknown[];
        if (!Array.isArray(v) || v.length !== src.length) { complete = false; break; }
      }
    }
    if (!complete) {
      totalDupes++;
      byLocale[lc] = (byLocale[lc] ?? 0) + 1;
    }
  }
}
console.log("LP totali:", LANDING_PAGES.length, "| Locali controllati:", NON_GATED.join(","));
console.log("TOTALE pagine LP duplicate (fallback auto-canonicalizzato):", totalDupes);
console.log("Per lingua:", byLocale);
