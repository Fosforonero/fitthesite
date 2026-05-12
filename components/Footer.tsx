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
    <footer className="border-t border-divider mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Link href={`/${locale}`} className="inline-block">
            <Logo variant="horizontal" size={42} />
          </Link>
          <p className="mt-4 text-sm text-text-secondary max-w-sm leading-relaxed">
            {dict.footer.tagline}
          </p>
        </div>

        <div className="text-sm">
          <div className="text-text-muted mb-3 tracking-[0.18em] uppercase text-[10px] font-semibold">
            {dict.footer.product}
          </div>
          <ul className="space-y-2.5">
            <li><a href={`/${locale}#features`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.features}</a></li>
            <li><a href={`/${locale}#download`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.download}</a></li>
            <li><Link href={`/${locale}/support`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.support}</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="text-text-muted mb-3 tracking-[0.18em] uppercase text-[10px] font-semibold">
            {dict.footer.legal}
          </div>
          <ul className="space-y-2.5">
            <li><Link href={`/${locale}/privacy`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.privacy}</Link></li>
            <li><Link href={`/${locale}/terms`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.terms}</Link></li>
            <li><Link href={`/${locale}/cookies`} className="text-text-secondary hover:text-text-primary transition">{dict.footer.links.cookies}</Link></li>
            <li>
              <a href="mailto:privacy@fitmesh.fit" className="text-text-secondary hover:text-text-primary transition">
                privacy@fitmesh.fit
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-divider">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} FitMesh Sync. {dict.footer.rights}</span>
          <span>{dict.footer.made_with}</span>
        </div>
      </div>
    </footer>
  );
}
