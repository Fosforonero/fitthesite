import Link from "next/link";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import type { Dictionary, Locale } from "@/lib/i18n";

export default function Header({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg/60 border-b border-white/[0.06] supports-[backdrop-filter]:bg-bg/40">
      {/* Tiny accent line — a 1px gradient strip under the header for premium feel */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(33,230,193,0.45) 30%, rgba(29,161,255,0.45) 70%, transparent 100%)",
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link
          href={`/${locale}`}
          aria-label="FitMesh Sync, home"
          className="flex items-center group"
        >
          <span className="sm:hidden">
            <Logo variant="mark" size={32} />
          </span>
          <span className="hidden sm:inline-flex transition-transform duration-200 group-hover:-translate-y-px">
            <Logo variant="horizontal" size={36} priority />
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-1.5 text-sm">
          <Link
            href={`/${locale}/integrations`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden md:inline-block"
          >
            {locale === "it" ? "Integrazioni" : "Integrations"}
          </Link>
          <Link
            href={`/${locale}/roadmap`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden md:inline-block"
          >
            {locale === "it" ? "Roadmap" : "Roadmap"}
          </Link>
          <Link
            href={`/${locale}/blog`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden md:inline-block"
          >
            Blog
          </Link>
          <Link
            href={`/${locale}/beta`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden sm:inline-block relative"
          >
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            Beta
          </Link>
          <Link
            href={`/${locale}/support`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden md:inline-block"
          >
            {dict.nav.support}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="px-3 py-1.5 rounded-pill text-text-secondary hover:text-text-primary hover:bg-white/5 transition hidden md:inline-block"
          >
            {dict.nav.privacy}
          </Link>
          {/* CTA primaria desktop */}
          <Link
            href={`/${locale}/beta`}
            className="ml-1 hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-pill btn-cta text-sm"
          >
            Founder
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <LanguageSwitcher current={locale} />
          <MobileMenu dict={dict} locale={locale} />
        </nav>
      </div>
    </header>
  );
}
