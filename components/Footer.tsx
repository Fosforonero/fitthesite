import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-divider mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display font-semibold tracking-tight text-text-primary text-base">
              FitMesh
              <span className="font-normal text-text-muted text-[10px] tracking-[0.3em] ml-1.5 uppercase">
                Sync
              </span>
            </span>
          </div>
          <p className="mt-4 text-sm text-text-secondary max-w-sm leading-relaxed">
            Sincronizza i dati del tuo smartwatch su una dashboard premium tua.
            Privacy-first. Niente cloud opachi, niente tracker pubblicitari.
          </p>
        </div>

        <div className="text-sm">
          <div className="text-text-muted mb-3 tracking-[0.18em] uppercase text-[10px] font-semibold">
            Prodotto
          </div>
          <ul className="space-y-2.5">
            <li><a href="/#features" className="text-text-secondary hover:text-text-primary transition">Funzionalità</a></li>
            <li><a href="/#download" className="text-text-secondary hover:text-text-primary transition">Scarica</a></li>
            <li><Link href="/support" className="text-text-secondary hover:text-text-primary transition">Supporto</Link></li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="text-text-muted mb-3 tracking-[0.18em] uppercase text-[10px] font-semibold">
            Legale
          </div>
          <ul className="space-y-2.5">
            <li><Link href="/privacy" className="text-text-secondary hover:text-text-primary transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-text-secondary hover:text-text-primary transition">Termini di servizio</Link></li>
            <li><Link href="/cookies" className="text-text-secondary hover:text-text-primary transition">Cookie Policy</Link></li>
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
          <span>© {new Date().getFullYear()} FitMesh Sync. Tutti i diritti riservati.</span>
          <span>Made with care in Italy</span>
        </div>
      </div>
    </footer>
  );
}
