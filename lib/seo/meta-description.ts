/**
 * Converte una descrizione editoriale lunga in uno snippet SEO leggibile.
 *
 * - normalizza whitespace e newline;
 * - conserva il testo intero quando è già entro il limite;
 * - preferisce chiudere su una frase completa dopo 150 caratteri;
 * - altrimenti tronca sull'ultima parola e aggiunge un'ellissi.
 *
 * Il limite di 160 caratteri segue lo spazio indicativo mostrato nelle SERP
 * Bing; non viene usato come fattore di ranking, ma evita descrizioni troppo
 * corte o troncamenti casuali a metà parola.
 */
export function toMetaDescription(text: string, maxLength = 160): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;

  // Lascia spazio all'ellissi nel fallback.
  const candidate = compact.slice(0, maxLength - 1);
  const sentenceEnds = [
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf("! "),
    candidate.lastIndexOf("? "),
  ];
  const sentenceEnd = Math.max(...sentenceEnds);
  if (sentenceEnd >= 149) return candidate.slice(0, sentenceEnd + 1);

  const wordEnd = candidate.lastIndexOf(" ");
  // Giapponese e altre scritture senza separatori possono contenere qualche
  // spazio solo nei nomi prodotto. In quel caso arretrare fino all'ultimo
  // spazio accorcerebbe lo snippet di decine di caratteri.
  const usesCjkWithoutWordSpaces = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(candidate);
  const hasUsefulWordBoundary = !usesCjkWithoutWordSpaces
    && wordEnd >= Math.floor(candidate.length * 0.85);
  const trimmed = (hasUsefulWordBoundary ? candidate.slice(0, wordEnd) : candidate)
    .replace(/[,:;\-–—]+$/u, "")
    .trimEnd();
  return `${trimmed}…`;
}
