import Link from "next/link";

const features = [
  {
    title: "Passi & distanza",
    desc: "Sincronizzazione automatica con Health Connect e Samsung Health. Anche in background, anche quando il telefono è bloccato.",
    color: "#1DA1FF",
  },
  {
    title: "Battito e VO₂ max",
    desc: "Media giornaliera, range min/max, frequenza a riposo. Vedi i pattern del tuo cuore nel tempo.",
    color: "#FF5C7A",
  },
  {
    title: "Sonno con fasi",
    desc: "Durata totale, profondo, REM, leggero, sveglio. Barra colorata e badge qualità immediato.",
    color: "#21E6C1",
  },
  {
    title: "Calorie e attività",
    desc: "Calorie attive e basali, percorso, dislivello, scale. Camminate in verde, allenamenti in rosso.",
    color: "#FFB547",
  },
  {
    title: "Dashboard tua",
    desc: "I dati vivono sul tuo server, non su un cloud di terzi. Accedi da browser ovunque, senza account social.",
    color: "#7CFF5B",
  },
  {
    title: "Pensato per i caregiver",
    desc: "Modalità avanzata in arrivo: gruppo famiglia con notifiche se un anziano non sincronizza al mattino.",
    color: "#38BDF8",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill border border-divider bg-bg-secondary/40 text-xs text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Disponibile su Android · iOS in arrivo
        </div>

        <h1 className="mt-6 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl">
          I dati del tuo smartwatch,
          <br className="hidden sm:inline" />{" "}
          <span className="text-brand-gradient">una dashboard premium.</span>
        </h1>

        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          FitMesh Sync legge passi, battito, sonno e calorie dal tuo Galaxy Watch o Wear OS
          e li mette su una dashboard web personale. Senza cloud opachi, senza tracker pubblicitari,
          senza account social.
        </p>

        <div id="download" className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=com.fitmeshsync.app"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-pill btn-cta"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
              <path
                fill="currentColor"
                d="M3.6 1.6a1 1 0 0 0-.6 1v18.8a1 1 0 0 0 .6 1l10-10.4-10-10.4Zm11.4 11l3.8 2.2c1 .6 1 2 0 2.6l-3.6 2.1-3.3-3.4 3.1-3.5Zm-1.5-1.5 3.3-3.5-3.8-2.2L9.3 7.6l3.2 3.5Zm-3.2 3.6L4.9 21l8.4-4.9-3.0-3Zm0-3.4L4.9 4.4l5.4 5.5-1.0 1.0Z"
              />
            </svg>
            Scarica su Google Play
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-pill border border-divider text-text-primary font-medium hover:bg-white/5 transition"
          >
            Scopri di più
          </a>
        </div>

        <p className="mt-5 text-xs text-text-muted">
          Acquisto unico €3,49 · oppure €0,99 ogni 6 mesi · pagamento sicuro Google Play
        </p>
      </section>

      {/* KPI Mockup */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-card border border-divider bg-bg-card/60 overflow-hidden shadow-card">
          <div className="aspect-[16/9] grid place-items-center">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 p-5 sm:p-10 w-full max-w-3xl">
              {[
                { label: "Passi",   value: "8.524",    color: "#1DA1FF" },
                { label: "Battito", value: "72 bpm",   color: "#FF5C7A" },
                { label: "Calorie", value: "480 kcal", color: "#FFB547" },
                { label: "Sonno",   value: "7h 13m",   color: "#21E6C1" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-card border border-divider bg-bg-elevated/80 backdrop-blur p-4 sm:p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-text-muted font-semibold">
                      {kpi.label}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: kpi.color, boxShadow: `0 0 14px ${kpi.color}55` }}
                    />
                  </div>
                  <div className="mt-3 font-display text-metric font-semibold tracking-tightest text-text-primary">
                    {kpi.value}
                  </div>
                  <div className="text-xs text-text-muted mt-1">oggi</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            Funzionalità
          </p>
          <h2 className="mt-3 font-display text-display font-semibold tracking-tightest text-text-primary">
            Tutto quello che il tuo smartwatch raccoglie,
            <br className="hidden sm:inline" /> ordinato e visualizzato.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="card p-6 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: f.color, boxShadow: `0 0 14px ${f.color}55` }}
              />
              <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">{f.title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Privacy first */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-24">
        <div className="rounded-card border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-8 sm:p-12 shadow-card overflow-hidden relative">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--fm-gradient-brand)" }}
          />
          <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            Privacy-first
          </p>
          <h2 className="mt-3 font-display text-display font-semibold tracking-tightest text-text-primary max-w-2xl">
            I tuoi dati di salute non sono un prodotto.
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl leading-relaxed">
            FitMesh Sync non vende, non condivide, non profila. I dati restano sul server che scegli tu —
            che sia il tuo NAS di casa, una VPS o il nostro endpoint condiviso, decidi tu nelle
            impostazioni dell'app.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 relative">
            <Link
              href="/privacy"
              className="inline-flex px-5 py-2.5 rounded-pill border border-divider text-sm text-text-primary hover:bg-white/5 transition"
            >
              Leggi la Privacy Policy
            </Link>
            <a
              href="mailto:privacy@fitmesh.fit"
              className="inline-flex px-5 py-2.5 rounded-pill text-sm text-text-secondary hover:text-text-primary transition"
            >
              privacy@fitmesh.fit
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-24 mb-16">
        <div className="text-center">
          <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
            Pronto a iniziare?
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            Scarica l'app, autorizza Health Connect, e in 30 secondi i tuoi dati sono live.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href="https://play.google.com/store/apps/details?id=com.fitmeshsync.app"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-pill btn-cta"
            >
              Scarica su Google Play
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
