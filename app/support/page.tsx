import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supporto",
  description:
    "FAQ, troubleshooting e contatti per FitMesh. Risposte rapide ai problemi più comuni.",
};

const faqs = [
  {
    q: "L'app non mostra dati. Cosa devo fare?",
    a: "Verifica nell'ordine: (1) Health Connect è installato dal Play Store? (2) Hai concesso il permesso «Lettura dati in background» dentro Health Connect? (3) Premi «Sincronizza Ora» nelle impostazioni. Se persiste, scrivici allegando uno screenshot del pannello «Stato».",
  },
  {
    q: "Quanto consuma di batteria?",
    a: "Circa 1-2% al giorno con sync ogni 30 minuti. È sotto la soglia di rilevamento di Android come «app che drena la batteria». Se vedi consumi anomali, probabilmente Health Connect stesso sta indicizzando — non FitMesh.",
  },
  {
    q: "Funziona offline?",
    a: "L'app raccoglie e mette in coda i dati anche senza rete. Appena torni online, sincronizza automaticamente tutto l'arretrato. La dashboard web invece richiede connessione internet attiva.",
  },
  {
    q: "Posso usare il mio server?",
    a: "Sì. Il backend è open e basato su Node.js + SQLite (~500 righe di codice). Cambia l'URL del server nelle impostazioni dell'app e i dati vanno dove vuoi tu. Documentazione tecnica nel repo GitHub.",
  },
  {
    q: "Cosa cambia tra acquisto unico e abbonamento?",
    a: "Nulla, sono solo due modalità di pagamento per la stessa funzionalità Pro. Acquisto unico €3.49 una tantum, o €0.99 ogni 6 mesi se preferisci spalmare il costo. Entrambi sbloccano dashboard nativa, grafici settimanali e analisi sonno.",
  },
  {
    q: "Posso annullare l'abbonamento?",
    a: "Sì, in qualsiasi momento dalle impostazioni Google Play → Pagamenti e abbonamenti. Continuerai a usare le funzioni Pro fino alla fine del periodo pagato.",
  },
  {
    q: "Ho cambiato telefono. Perdo i miei dati?",
    a: "No. I dati sono sul server, non sul telefono. Reinstalla l'app, fai login (o inserisci il tuo device ID precedente nelle impostazioni se hai un account avanzato) e ritrovi tutto.",
  },
  {
    q: "Supporto iOS?",
    a: "In sviluppo. iOS arriverà nel 2026 con la stessa architettura: app nativa SwiftUI che legge da Apple HealthKit. Iscriviti via hello@fitmesh.fit per essere avvisato.",
  },
];

export default function SupportPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-brand-300">Supporto</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Domande frequenti
        </h1>
        <p className="mt-3 text-ink-300">
          Le risposte ai problemi più comuni. Se non trovi quello che cerchi,{" "}
          <a
            href="mailto:support@fitmesh.fit"
            className="text-brand-300 hover:text-brand-200 underline underline-offset-4"
          >
            scrivici a support@fitmesh.fit
          </a>
          .
        </p>
      </header>

      <section className="space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-2xl border hairline bg-ink-900/40 p-5 open:bg-ink-900/70 transition"
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-white font-medium">
              <span>{faq.q}</span>
              <span
                aria-hidden
                className="mt-1 text-ink-400 group-open:rotate-45 transition-transform"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-ink-300 text-sm leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </section>

      <section className="mt-16">
        <div className="rounded-3xl border hairline bg-gradient-to-br from-ink-900/60 to-ink-950 p-8">
          <h2 className="text-2xl font-semibold text-white">Hai un'altra domanda?</h2>
          <p className="mt-3 text-ink-300">
            Scrivici. Rispondiamo personalmente entro 48 ore (di solito molto prima).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="mailto:support@fitmesh.fit?subject=FitMesh%20%E2%80%94%20Supporto"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-ink-950 font-medium hover:bg-ink-100 transition"
            >
              Scrivi a support@fitmesh.fit
            </a>
            <a
              href="mailto:hello@fitmesh.fit?subject=FitMesh%20%E2%80%94%20Hello"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border hairline text-white hover:bg-white/5 transition"
            >
              hello@fitmesh.fit
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
