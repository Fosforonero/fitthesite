import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/75 border-b border-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-semibold tracking-tight text-text-primary"
        >
          <Logo size={30} />
          <span className="text-lg">
            FitMesh
            <span className="font-normal text-text-muted text-xs tracking-[0.25em] ml-1.5 uppercase">
              Sync
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/support"
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition"
          >
            Supporto
          </Link>
          <Link
            href="/privacy"
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden sm:inline-block"
          >
            Privacy
          </Link>
          <a
            href="#download"
            className="ml-1 inline-flex items-center px-4 py-1.5 rounded-pill btn-cta text-sm"
          >
            Scarica
          </a>
        </nav>
      </div>
    </header>
  );
}
