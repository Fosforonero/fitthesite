import Link from "next/link";
import Logo from "./Logo";
import type { Dictionary, Locale } from "@/lib/i18n";

export default function Footer({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <footer className="relative mt-32 border-t border-white/[0.06]">
      {/* Top accent strip — same gradient as header for symmetry */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(124,255,91,0.45) 30%, rgba(33,230,193,0.55) 50%, rgba(29,161,255,0.45) 70%, transparent 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href={`/${locale}`} className="inline-block">
            <Logo variant="horizontal" size={42} />
          </Link>
          <p className="mt-5 text-sm text-text-secondary max-w-sm leading-relaxed">
            {dict.footer.tagline}
          </p>

          {/* Status pill */}
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-white/[0.06] bg-white/[0.02] text-xs text-text-muted">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green" />
            </span>
            {locale === "it" ? "Tutti i sistemi operativi" : "All systems operational"}
          </div>
        </div>

        <div className="text-sm lg:col-span-3">
          <div className="text-text-muted mb-4 tracking-[0.22em] uppercase text-[10px] font-semibold">
            {dict.footer.product}
          </div>
          <ul className="space-y-2.5">
            <li><a href={`/${locale}#features`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.features}</a></li>
            <li><Link href={`/${locale}/famiglia`} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Mesh Famiglia" : "Family Mesh"}</Link></li>
            <li><Link href={`/${locale}/integrations`} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Integrazioni" : "Integrations"}</Link></li>
            <li><Link href={`/${locale}/roadmap`} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Roadmap" : "Roadmap"}</Link></li>
            <li><Link href={`/${locale}/blog`} className="text-text-secondary hover:text-text-primary transition">Blog</Link></li>
            <li><Link href={`/${locale}/about`} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Chi siamo" : "About"}</Link></li>
            <li><Link href={`/${locale}/press`} className="text-text-secondary hover:text-text-primary transition">{locale === "it" ? "Press" : "Press"}</Link></li>
            <li>
              <Link href={`/${locale}/beta`} className="inline-flex items-center gap-1.5 text-brand-aqua hover:text-brand-green transition font-medium">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green" />
                </span>
                {locale === "it" ? "Founder · 1 anno Pro gratis" : "Founder · 1 year Pro free"}
              </Link>
            </li>
            <li><a href={`/${locale}#download`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.download}</a></li>
            <li><Link href={`/${locale}/support`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.support}</Link></li>
          </ul>
        </div>

        <div className="text-sm lg:col-span-4">
          <div className="text-text-muted mb-4 tracking-[0.22em] uppercase text-[10px] font-semibold">
            {dict.footer.legal}
          </div>
          <ul className="space-y-2.5">
            <li><Link href={`/${locale}/privacy`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.privacy}</Link></li>
            <li><Link href={`/${locale}/terms`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.terms}</Link></li>
            <li><Link href={`/${locale}/cookies`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.cookies}</Link></li>
            <li>
              <a href="mailto:privacy@fitmesh.fit" className="text-text-secondary hover:text-text-primary transition font-mono text-xs">
                privacy@fitmesh.fit
              </a>
            </li>
            <li>
              <a href="mailto:hello@fitmesh.fit" className="text-text-secondary hover:text-text-primary transition font-mono text-xs">
                hello@fitmesh.fit
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} FitMesh Sync. {dict.footer.rights}</span>
          <span className="inline-flex items-center gap-2 text-center">
            <span className="w-1 h-1 rounded-full bg-brand-green animate-pulse" />
            {dict.footer.made_with}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span>{dict.footer.fosforonero_label}</span>
            <a
              href="https://www.fosforonero.com"
              target="_blank"
              rel="noopener"
              className="font-medium text-text-secondary hover:text-text-primary transition underline decoration-text-muted/40 underline-offset-2"
            >
              Fosforonero
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
