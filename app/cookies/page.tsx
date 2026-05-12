import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Quali cookie usa fitmesh.fit e perché. Cookie tecnici essenziali + Google Analytics 4 con tuo consenso esplicito.",
};

const LAST_UPDATED = "12 Maggio 2026";

export default function CookiesPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">Legale</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          Cookie Policy
        </h1>
        <p className="mt-3 text-sm text-text-muted">Ultimo aggiornamento: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-10 text-text-secondary leading-relaxed">
        <Section title="In breve">
          <p>
            fitmesh.fit usa <strong className="text-text-primary">cookie tecnici essenziali</strong> per
            funzionare e, <strong className="text-text-primary">solo dopo il tuo consenso esplicito
            tramite il banner</strong>, Google Analytics 4 per capire come gli utenti usano il sito
            in forma aggregata e migliorare il prodotto.
          </p>
          <p>
            <strong className="text-text-primary">Non usiamo cookie pubblicitari</strong>, non
            profiliamo, non vendiamo dati, non mostriamo pubblicità. Puoi rifiutare gli analytics
            in qualsiasi momento e il sito continuerà a funzionare perfettamente.
          </p>
        </Section>

        <Section title="Cosa sono i cookie">
          <p>
            I cookie sono piccoli file di testo che un sito può salvare sul tuo browser per
            ricordare informazioni tra una visita e l'altra. Oltre ai cookie, esiste{" "}
            <em>localStorage</em>: uno storage del browser simile ai cookie ma che non viene mai
            inviato al server (lo usiamo solo per ricordare le tue scelte di consenso).
          </p>
        </Section>

        <Section title="Cookie che usiamo">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-divider">
                  <Th>Nome</Th>
                  <Th>Categoria</Th>
                  <Th>Durata</Th>
                  <Th>Scopo</Th>
                </tr>
              </thead>
              <tbody>
                <Row
                  name="fitmesh_cookie_consent"
                  type="localStorage"
                  category="Tecnico"
                  duration="Persistente"
                  scope="Memorizza la tua scelta sul banner cookie. Non contiene dati personali."
                />
                <Row
                  name="_ga"
                  type="cookie"
                  category="Analytics (opzionale)"
                  duration="2 anni"
                  scope="Google Analytics 4: identifica visitatori in modo anonimo. Caricato SOLO dopo «Accetta tutto»."
                />
                <Row
                  name="_ga_WLBXXFB21G"
                  type="cookie"
                  category="Analytics (opzionale)"
                  duration="2 anni"
                  scope="Google Analytics 4: persistenza dello stato di sessione. Caricato SOLO dopo «Accetta tutto»."
                />
                <Row
                  name="Cookie tecnici Vercel"
                  type="cookie"
                  category="Tecnico"
                  duration="Sessione"
                  scope="La piattaforma di hosting può impostare cookie tecnici per load balancing e prevenzione abusi."
                />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Google Analytics 4 — dettagli">
          <p>
            Usiamo Google Analytics 4 (proprietà <code className="text-brand-aqua font-mono text-[0.85em]">G-WLBXXFB21G</code>)
            con configurazione conforme al GDPR:
          </p>
          <ul className="space-y-2 mt-3">
            {[
              ["Consent Mode v2", "GA4 viene caricato con tutti i consensi negati di default. Solo dopo che premi «Accetta tutto» nel banner, l'analytics inizia a tracciare."],
              ["IP anonymization", "L'IP del visitatore viene anonimizzato prima di essere salvato (anonymize_ip: true)."],
              ["No advertising signals", "Le funzioni pubblicitarie di GA4 sono completamente disabilitate (allow_google_signals: false, allow_ad_personalization_signals: false)."],
              ["No cross-device tracking", "Non collegiamo le tue visite a profili Google esterni."],
            ].map(([term, def]) => (
              <li key={term} className="flex gap-2">
                <span className="text-brand-aqua mt-0.5">•</span>
                <span><strong className="text-text-primary">{term}:</strong> {def}</span>
              </li>
            ))}
          </ul>
          <p>
            Maggiori info sul trattamento di Google:{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
              policies.google.com/privacy
            </a>
            .
          </p>
        </Section>

        <Section title="Cosa NON usiamo">
          <ul className="space-y-2 mt-3">
            {[
              "Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads",
              "Cookie di profilazione comportamentale",
              "Cookie pubblicitari di terze parti",
              "Fingerprinting del browser",
              "Beacon o pixel di tracking nelle email",
              "Sessione registrata (hotjar, fullstory, ecc.)",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-error mt-0.5">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Come gestire il consenso">
          <p>
            Hai pieno controllo sulle tue scelte:
          </p>
          <ul className="space-y-2 mt-3">
            <li className="flex gap-2">
              <span className="text-brand-aqua mt-0.5">•</span>
              <span>
                <strong className="text-text-primary">Modificare la scelta:</strong> apri DevTools del
                browser (F12) → tab "Application/Storage" → localStorage di fitmesh.fit →
                cancella <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh_cookie_consent</code>.
                Alla prossima visita rivedrai il banner.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-aqua mt-0.5">•</span>
              <span>
                <strong className="text-text-primary">Disattivare GA dal browser:</strong> installa il{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
                  Google Analytics Opt-out Browser Add-on
                </a>
                {" "}per disabilitare GA su tutti i siti.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-aqua mt-0.5">•</span>
              <span>
                <strong className="text-text-primary">Bloccare i cookie dal browser:</strong> tutti i
                browser moderni permettono di rifiutare cookie. Bloccare i cookie tecnici
                potrebbe rendere il sito instabile.
              </span>
            </li>
          </ul>
        </Section>

        <Section title="Modifiche">
          <p>
            Se in futuro introdurremo nuovi strumenti che richiedono consenso, aggiorneremo
            questa pagina e mostreremo un nuovo banner. Non attiveremo mai retroattivamente
            tracker su dati già raccolti.
          </p>
        </Section>

        <Section title="Contatti">
          <p>
            Per domande su questa Cookie Policy:{" "}
            <a
              href="mailto:privacy@fitmesh.fit"
              className="text-brand-aqua hover:text-brand-blue underline underline-offset-4"
            >
              privacy@fitmesh.fit
            </a>
            .
          </p>
        </Section>
      </div>

      <hr className="my-12 border-divider" />
      <p className="text-center text-xs text-text-muted">
        © {new Date().getFullYear()} FitMesh Sync. Tutti i diritti riservati.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-text-primary border-b border-divider pb-3 mb-4">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-3 text-[10px] uppercase tracking-[0.16em] text-text-muted font-semibold">
      {children}
    </th>
  );
}

function Row({
  name, type, category, duration, scope,
}: { name: string; type: string; category: string; duration: string; scope: string }) {
  return (
    <tr className="border-b border-divider align-top">
      <td className="px-3 py-3">
        <code className="text-brand-aqua font-mono text-[0.85em]">{name}</code>
        <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">{type}</div>
      </td>
      <td className="px-3 py-3 text-text-secondary">{category}</td>
      <td className="px-3 py-3 text-text-secondary">{duration}</td>
      <td className="px-3 py-3 text-text-secondary">{scope}</td>
    </tr>
  );
}
