/**
 * Testo semplice per i dati strutturati (JSON-LD): i testi del blog usano un
 * markdown leggero (`**grassetto**` e `[etichetta](href)`) che nel corpo della
 * pagina diventa elemento HTML ma nel JSON-LD resterebbe sintassi grezza.
 * Qui si tiene l'etichetta e si scartano href e marcatori, senza toccare altro.
 */
export function markdownToPlainText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1");
}
