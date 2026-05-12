import Link from "next/link";

const features = [
  {
    title: "Passi & distanza",
    desc: "Sincronizzazione automatica con Health Connect e Samsung Health. Anche in background, anche quando il telefono è bloccato.",
    dot: "from-brand-300 to-brand-500",
  },
  {
    title: "Battito e VO₂ max",
    desc: "Media giornaliera, range min/max, frequenza a riposo. Vedi i pattern del tuo cuore nel tempo.",
    dot: "from-rose-300 to-rose-500",
  },
  {
    title: "Sonno con fasi",
    desc: "Durata totale, profondo, REM, leggero, sveglio. Barra colorata e badge qualità immediato.",
    dot: "from-violet-300 to-violet-500",
  },
  {
    title: "Calorie e attività",
    desc: "Calorie attive e basali, percorso, dislivello, scale. Camminate in verde, allenamenti in rosso.",
    dot: "from-amber-300 to-amber-500",
  },
  {
    title: "Dashboard tua",
    desc: "I dati vivono sul tuo server, non su un cloud di terzi. Accedi da browser ovunque, senza account social.",
    dot: "from-emerald-300 to-emerald-500",
  },
  {
    title: "Pensato per i caregiver",
    desc: "Modalità avanzata in arrivo: gruppo famiglia con notifiche se un anziano non sincronizza al mattino.",
    dot: "from-sky-300 to-sky-500",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border hairline text-xs text-ink-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Disponibile su Android · iOS in arrivo
        </div>

        <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] text-white max-w-3xl">
          I dati del tuo smartwatch,{" "}
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-violet-400 bg-clip-text text-transparent">
            una dashboard tua.
          </span>
        </h1>

        <p className="mt-6 text-lg text-ink-200 max-w-2xl leading-relaxed">
          FitMesh legge passi, battito, sonno e calorie dal tuo Galaxy Watch o Wear OS
          e li mette su una dashboard web personale. Senza cloud opachi, senza tracker pubblicitari,
          senza account social.
        </p>

        <div id="download" className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=com.fitmeshsync.app"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white text-ink-950 font-medium shadow-lg shadow-brand-500/10 hover:bg-ink-100 transition"
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
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border hairline text-white font-medium hover:bg-white/5 transition"
          >
            Scopri di più
          </a>
        </div>

        <p className="mt-4 text-xs text-ink-400">
          Acquisto unico €3.49 · oppure €0.99 ogni 6 mesi · pagamento sicuro Google Play
        </p>
      </section>

      {/* Mockup placeholder */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl border hairline bg-ink-900/40 overflow-hidden">
          <div className="aspect-[16/9] bg-gradient-to-br from-ink-900 via-ink-800/80 to-ink-900 grid place-items-center">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-8 w-full max-w-3xl">
              {[
                ["Passi", "8.524", "from-brand-400 to-brand-600"],
                ["Battito", "72 bpm", "from-rose-400 to-rose-600"],
                ["Calorie", "480 kcal", "from-amber-400 to-amber-600"],
                ["Sonno", "7h 13m", "from-violet-400 to-violet-600"],
              ].map(([label, value, grad]) => (
                <div
                  key={label}
                  className="rounded-2xl border hairline bg-ink-950/60 backdrop-blur p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-ink-400">
                      {label}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${grad}`}
                    />
                  </div>
                  <div className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                    {value}
                  </div>
                  <div className="text-xs text-ink-400 mt-1">oggi</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 pt-20">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-brand-300">
            Funzionalità
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Tutto quello che il tuo smartwatch raccoglie,
            <br className="hidden sm:inline" /> ordinato e visualizzato.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border hairline bg-ink-900/40 p-6 hover:bg-ink-900/70 transition"
            >
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-br ${f.dot}`}
              />
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-300 leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Privacy first */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-24">
        <div className="rounded-3xl border hairline bg-gradient-to-br from-ink-900/60 to-ink-950 p-8 sm:p-12">
          <p className="text-xs uppercase tracking-widest text-brand-300">
            Privacy-first
          </p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-white max-w-2xl">
            I tuoi dati di salute non sono un prodotto.
          </h2>
          <p className="mt-4 text-ink-300 max-w-2xl leading-relaxed">
            FitMesh non vende, non condivide, non profila. I dati restano sul server che scegli tu —
            che sia il tuo NAS di casa, una VPS o il nostro endpoint condiviso, decidi tu nelle
            impostazioni dell'app.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/privacy"
              className="inline-flex px-4 py-2 rounded-full border hairline text-sm text-white hover:bg-white/5 transition"
            >
              Leggi la Privacy Policy
            </Link>
            <a
              href="mailto:privacy@fitmesh.fit"
              className="inline-flex px-4 py-2 rounded-full text-sm text-ink-200 hover:text-white transition"
            >
              privacy@fitmesh.fit
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-20 mb-10">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Pronto a iniziare?
          </h2>
          <p className="mt-3 text-ink-300 max-w-xl mx-auto">
            Scarica l'app, autorizza Health Connect, e in 30 secondi i tuoi dati sono live.
          </p>
          <div className="mt-7 flex justify-center">
            <a
              href="https://play.google.com/store/apps/details?id=com.fitmeshsync.app"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-ink-950 font-medium hover:bg-ink-100 transition"
            >
              Scarica su Google Play
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
