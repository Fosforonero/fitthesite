/**
 * Icona Facebook come asset locale (inline SVG, nessuna risorsa remota).
 * Origine del tracciato: progetto simple-icons, pacchetto npm "simple-icons",
 * file icons/facebook.svg. L'attributo d e' identico byte per byte a quello delle
 * versioni 11.0.0, 13.0.0 e 16.35.0 (confronto del 14/10/2026; la 9.0.0 differisce).
 * Licenza del pacchetto: CC0-1.0.
 * Il logo e' un marchio del rispettivo titolare e qui indica il collegamento al
 * profilo FitMesh indicato dal sito; nessuna dichiarazione di autorizzazione,
 * verifica o titolarita'.
 * viewBox 0 0 24 24, proporzioni non distorte, colore di marca #0866FF.
 * Sempre `aria-hidden="true"` e `focusable="false"`: il nome accessibile del link
 * proviene esclusivamente dal testo visibile adiacente (mai icon-only).
 */
export default function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="#0866FF"
    >
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}
