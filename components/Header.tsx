import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-950/70 border-b hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-white"
        >
          <span
            aria-hidden
            className="inline-block w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          />
          <span className="text-lg">FitMesh</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/support"
            className="px-3 py-1.5 rounded-full text-ink-200 hover:text-white hover:bg-white/5 transition"
          >
            Supporto
          </Link>
          <Link
            href="/privacy"
            className="px-3 py-1.5 rounded-full text-ink-200 hover:text-white hover:bg-white/5 transition"
          >
            Privacy
          </Link>
          <a
            href="#download"
            className="ml-1 px-3.5 py-1.5 rounded-full bg-white text-ink-950 font-medium hover:bg-ink-100 transition"
          >
            Scarica
          </a>
        </nav>
      </div>
    </header>
  );
}
