import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-900/70 border-b hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-ink-50"
        >
          <span
            aria-hidden
            className="inline-block w-7 h-7 rounded-[10px] bg-gradient-to-br from-brand-400 to-brand-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          />
          <span className="text-lg">FitMesh</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/support"
            className="px-3 py-1.5 rounded-full text-ink-300 hover:text-ink-50 hover:bg-white/5 transition"
          >
            Supporto
          </Link>
          <Link
            href="/privacy"
            className="px-3 py-1.5 rounded-full text-ink-300 hover:text-ink-50 hover:bg-white/5 transition"
          >
            Privacy
          </Link>
          <a
            href="#download"
            className="ml-1 px-3.5 py-1.5 rounded-full bg-brand-500 text-ink-50 font-medium hover:bg-brand-600 transition"
          >
            Scarica
          </a>
        </nav>
      </div>
    </header>
  );
}
