import Link from "next/link";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Dictionary, Locale } from "@/lib/i18n";

export default function Header({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/75 border-b border-divider">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link
          href={`/${locale}`}
          aria-label="FitMesh Sync — home"
          className="flex items-center"
        >
          {/* On mobile shows just the mark, on sm+ swaps to full horizontal logo */}
          <span className="sm:hidden">
            <Logo variant="mark" size={32} />
          </span>
          <span className="hidden sm:inline-flex">
            <Logo variant="horizontal" size={36} priority />
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href={`/${locale}/integrations`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition"
          >
            {locale === "it" ? "Integrazioni" : "Integrations"}
          </Link>
          <Link
            href={`/${locale}/support`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden sm:inline-block"
          >
            {dict.nav.support}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden sm:inline-block"
          >
            {dict.nav.privacy}
          </Link>
          {/* Mobile: CTA primaria → /beta (Play Store non live, #download
              porta a sezione con bottoni disabilitati). Desktop: #download. */}
          <Link
            href={`/${locale}/beta`}
            className="ml-1 sm:hidden inline-flex items-center px-4 py-2 rounded-pill btn-cta text-sm min-h-[40px]"
          >
            Beta
          </Link>
          <a
            href="#download"
            className="ml-1 hidden sm:inline-flex items-center px-4 py-1.5 rounded-pill btn-cta text-sm"
          >
            {dict.nav.download}
          </a>
          <LanguageSwitcher current={locale} />
        </nav>
      </div>
    </header>
  );
}
