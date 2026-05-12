import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t hairline mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 font-semibold tracking-tight text-white">
            <span
              aria-hidden
              className="inline-block w-6 h-6 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700"
            />
            FitMesh
          </div>
          <p className="mt-3 text-sm text-ink-300 max-w-sm">
            Sincronizza i dati del tuo smartwatch su una dashboard web tua.
            Nessun cloud di terze parti, nessun tracker pubblicitario.
          </p>
        </div>

        <div className="text-sm">
          <div className="text-ink-400 mb-3 tracking-wider uppercase text-xs">
            Prodotto
          </div>
          <ul className="space-y-2">
            <li>
              <a href="#features" className="text-ink-200 hover:text-white">
                Funzionalità
              </a>
            </li>
            <li>
              <a href="#download" className="text-ink-200 hover:text-white">
                Scarica
              </a>
            </li>
            <li>
              <Link href="/support" className="text-ink-200 hover:text-white">
                Supporto
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="text-ink-400 mb-3 tracking-wider uppercase text-xs">
            Legale
          </div>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="text-ink-200 hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <a
                href="mailto:privacy@fitmesh.fit"
                className="text-ink-200 hover:text-white"
              >
                privacy@fitmesh.fit
              </a>
            </li>
            <li>
              <a
                href="mailto:support@fitmesh.fit"
                className="text-ink-200 hover:text-white"
              >
                support@fitmesh.fit
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-400">
          <span>© {new Date().getFullYear()} FitMesh. Tutti i diritti riservati.</span>
          <span>Made with ❤ in Italy</span>
        </div>
      </div>
    </footer>
  );
}
