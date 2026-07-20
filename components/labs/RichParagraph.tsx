/**
 * Rendering minimale di `**grassetto**` nel testo dei content file Labs:
 * limitato a grassetto (unico marcatore usato) per non introdurre una
 * dipendenza dal parser markdown del blog in un modulo Labs indipendente.
 * Condiviso fra tutti i tool (HRV, Sleep Efficiency, futuri).
 */
export function RichParagraph({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
