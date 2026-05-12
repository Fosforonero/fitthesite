import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini di Servizio",
  description:
    "Termini e condizioni d'uso di FitMesh: licenza, acquisti, disclaimer salute, diritto di recesso, limitazioni di responsabilità.",
};

const LAST_UPDATED = "12 Maggio 2026";

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-brand-blue">Legale</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          Termini di Servizio
        </h1>
        <p className="mt-3 text-sm text-text-muted">Ultimo aggiornamento: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-10 text-text-secondary leading-relaxed">
        <Section title="1. Accettazione dei termini">
          <p>
            I presenti Termini di Servizio ("Termini") regolano l'uso dell'applicazione mobile
            FitMesh (<em>com.fitmeshsync.app</em>), del sito{" "}
            <code className="text-brand-blue">fitmesh.fit</code> e dei servizi correlati
            (collettivamente, il "Servizio"), forniti da Matteo Pizzi ("noi", "nostro").
          </p>
          <p>
            Utilizzando il Servizio, accetti integralmente questi Termini. Se non sei d'accordo,
            non utilizzare il Servizio.
          </p>
        </Section>

        <Section title="2. Cos'è FitMesh">
          <p>
            FitMesh è un'applicazione che legge dati di salute dal tuo dispositivo Android (tramite
            Health Connect, Samsung Health Data SDK) e li sincronizza su un server di tua scelta
            (il nostro server pubblico, un tuo server personale, o un altro endpoint compatibile),
            permettendoti di visualizzarli in una dashboard web.
          </p>
        </Section>

        <Section title="3. Disclaimer salute — IMPORTANTE">
          <Callout variant="warning">
            <p>
              <strong className="text-text-primary">FitMesh NON è un dispositivo medico.</strong> Non
              fornisce diagnosi, terapie, raccomandazioni mediche o sostituisce in alcun modo
              il parere di un medico qualificato.
            </p>
            <p className="mt-3">
              I dati visualizzati sono valori grezzi forniti dal tuo smartwatch e da Health Connect:
              possono contenere errori, ritardi, valori mancanti o anomali dovuti a problemi di
              sensore, posizionamento del dispositivo, condizioni ambientali. <strong className="text-text-primary">
              Non utilizzare FitMesh per decisioni sanitarie critiche.</strong>
            </p>
            <p className="mt-3">
              Per problemi di salute consulta sempre un medico. In caso di emergenza chiama il 112
              (Italia) o il numero di emergenza locale.
            </p>
          </Callout>
        </Section>

        <Section title="4. Licenza d'uso">
          <p>
            Ti concediamo una licenza personale, non esclusiva, non trasferibile e revocabile per
            installare e utilizzare l'app FitMesh sui dispositivi Android di tua proprietà o sotto
            il tuo controllo, esclusivamente per uso personale.
          </p>
          <p>Non puoi:</p>
          <ul className="space-y-2 mt-3">
            {[
              "Decompilare, disassemblare o fare reverse engineering dell'app, salvo nei limiti consentiti dalla legge",
              "Rivendere, sublicenziare o redistribuire l'app",
              "Utilizzare il Servizio per attività illegali o per violare diritti di terzi",
              "Tentare di accedere a dati di altri utenti sul nostro server pubblico",
              "Sovraccaricare deliberatamente i nostri server con richieste eccessive",
            ].map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="text-error mt-0.5">✗</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="5. Account e dati">
          <p>
            FitMesh non richiede registrazione di un account tradizionale. Ogni installazione
            genera un identificativo univoco del dispositivo (UUID o Android ID) che viene
            utilizzato per associare i dati al tuo dispositivo sul server scelto.
          </p>
          <p>
            <strong className="text-text-primary">Sei tu il responsabile dei tuoi dati.</strong> Conserva
            il tuo Device ID se intendi spostare l'app su un nuovo telefono. Il nostro server
            pubblico è fornito come servizio gratuito ma <em>best-effort</em>: non garantiamo
            backup, non garantiamo retention permanente, e potremmo cancellare dati inattivi da
            oltre 12 mesi previa notifica.
          </p>
        </Section>

        <Section title="6. Acquisti in-app">
          <p>
            FitMesh offre funzionalità avanzate ("Pro") tramite acquisto in-app gestito da Google
            Play Billing:
          </p>
          <ul className="space-y-2 mt-3">
            <li className="flex gap-2">
              <span className="text-brand-blue mt-0.5">•</span>
              <span>
                <strong className="text-text-primary">Acquisto unico — €3,49 una tantum:</strong> sblocca
                permanentemente tutte le funzionalità Pro sull'account Google associato.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-blue mt-0.5">•</span>
              <span>
                <strong className="text-text-primary">Abbonamento — €0,99 ogni 6 mesi:</strong> rinnovo
                automatico fino a cancellazione. Puoi annullare in qualsiasi momento dalle
                impostazioni Google Play.
              </span>
            </li>
          </ul>
          <p>
            Tutti i pagamenti sono gestiti da Google e soggetti ai{" "}
            <a
              href="https://play.google.com/intl/it/about/play-terms/"
              target="_blank"
              rel="noopener"
              className="text-brand-blue hover:text-brand-aqua underline underline-offset-4"
            >
              Termini Google Play
            </a>
            . Non vediamo i tuoi dati di pagamento.
          </p>
        </Section>

        <Section title="7. Diritto di recesso (UE)">
          <p>
            Se sei un consumatore residente nell'Unione Europea, hai diritto di recedere dall'acquisto
            entro <strong className="text-text-primary">14 giorni</strong> dalla data dell'acquisto senza
            dover fornire motivazione (Direttiva 2011/83/UE).
          </p>
          <p>
            Per esercitare il diritto di recesso sui pagamenti gestiti da Google Play, utilizza la
            procedura ufficiale di rimborso:{" "}
            <a
              href="https://support.google.com/googleplay/answer/2479637"
              target="_blank"
              rel="noopener"
              className="text-brand-blue hover:text-brand-aqua underline underline-offset-4"
            >
              support.google.com/googleplay/answer/2479637
            </a>
            .
          </p>
          <p>
            <strong className="text-text-primary">Nota:</strong> il diritto di recesso si perde se hai
            iniziato a utilizzare attivamente le funzionalità Pro durante i 14 giorni e ne accetti
            espressamente l'esecuzione immediata al momento dell'acquisto (clausola standard Google Play).
          </p>
        </Section>

        <Section title="8. Disponibilità del Servizio">
          <p>
            Facciamo del nostro meglio per garantire che il Servizio sia disponibile 24/7, ma non
            possiamo garantirne il funzionamento ininterrotto. Manutenzioni programmate, guasti
            hardware, problemi di rete, blackout dei provider (Google, Samsung, Vercel, OVH)
            possono causare interruzioni temporanee.
          </p>
          <p>
            Non siamo responsabili per perdite causate da interruzioni del Servizio. Consigliamo
            di non utilizzare FitMesh come unico backup dei tuoi dati di salute.
          </p>
        </Section>

        <Section title="9. Modifiche al Servizio">
          <p>
            Potremmo modificare, sospendere o interrompere parti del Servizio in qualsiasi momento.
            Per modifiche significative che impattano funzionalità acquistate, ti avviseremo via
            email (se disponibile) o tramite notifica nell'app con almeno 30 giorni di preavviso.
          </p>
          <p>
            Se decidiamo di interrompere completamente il Servizio, ti daremo almeno 60 giorni
            per esportare i tuoi dati e ti rimborseremo eventuali abbonamenti attivi su base
            pro-rata.
          </p>
        </Section>

        <Section title="10. Limitazione di responsabilità">
          <p>
            Nei limiti consentiti dalla legge applicabile, FitMesh è fornita "così com'è"
            ("<em>as-is</em>"), senza garanzie di alcun tipo, esplicite o implicite, incluse
            garanzie di commerciabilità, idoneità a uno scopo specifico, accuratezza dei dati o
            assenza di difetti.
          </p>
          <p>
            In nessun caso saremo responsabili per danni indiretti, incidentali, speciali,
            consequenziali o punitivi (inclusi perdita di profitti, dati, uso, avviamento)
            derivanti dall'uso o dall'impossibilità di utilizzare il Servizio. La nostra
            responsabilità totale verso di te non potrà mai eccedere l'importo pagato negli
            ultimi 12 mesi.
          </p>
          <p>
            Queste limitazioni non si applicano a danni causati da nostra negligenza grave,
            dolo o nei casi in cui la legge applicabile non lo consenta.
          </p>
        </Section>

        <Section title="11. Proprietà intellettuale">
          <p>
            Il marchio "FitMesh", il logo, il design dell'app e del sito sono di nostra proprietà.
            Il codice del backend è di nostra proprietà ma open per ispezione/audit. I dati di
            salute che sincronizzi rimangono di tua proprietà: non rivendichiamo alcun diritto su
            di essi.
          </p>
        </Section>

        <Section title="12. Risoluzione delle controversie">
          <p>
            Cerchiamo sempre di risolvere le controversie in modo informale. Prima di iniziare
            qualsiasi procedura legale, contattaci a{" "}
            <a
              href="mailto:hello@fitmesh.fit"
              className="text-brand-blue hover:text-brand-aqua underline underline-offset-4"
            >
              hello@fitmesh.fit
            </a>
            {" "}— rispondiamo entro 30 giorni.
          </p>
          <p>
            Se sei un consumatore UE, puoi inoltre utilizzare la piattaforma ODR (Online Dispute
            Resolution) della Commissione Europea:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener"
              className="text-brand-blue hover:text-brand-aqua underline underline-offset-4"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </Section>

        <Section title="13. Legge applicabile e foro competente">
          <p>
            I presenti Termini sono regolati dalla legge italiana. Per i consumatori UE, restano
            applicabili le tutele inderogabili previste dalla legge del paese di residenza del
            consumatore.
          </p>
          <p>
            Per controversie non risolte amichevolmente, il foro competente è quello del consumatore
            (per i consumatori UE) o di Milano (per le altre ipotesi).
          </p>
        </Section>

        <Section title="14. Modifiche ai Termini">
          <p>
            Possiamo aggiornare questi Termini di tanto in tanto. Per modifiche significative
            ti avviseremo via email o nell'app con almeno 30 giorni di preavviso. L'uso continuato
            del Servizio dopo l'entrata in vigore delle modifiche costituisce accettazione dei
            nuovi Termini.
          </p>
        </Section>

        <Section title="15. Contatti">
          <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
            <p>
              <strong className="text-text-primary">Titolare del Servizio:</strong> Matteo Pizzi
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <span className="text-text-muted">Email generale:</span>{" "}
                <a
                  className="text-brand-blue hover:text-brand-aqua"
                  href="mailto:hello@fitmesh.fit"
                >
                  hello@fitmesh.fit
                </a>
              </li>
              <li>
                <span className="text-text-muted">Supporto:</span>{" "}
                <a
                  className="text-brand-blue hover:text-brand-aqua"
                  href="mailto:support@fitmesh.fit"
                >
                  support@fitmesh.fit
                </a>
              </li>
              <li>
                <span className="text-text-muted">Privacy/Legale:</span>{" "}
                <a
                  className="text-brand-blue hover:text-brand-aqua"
                  href="mailto:privacy@fitmesh.fit"
                >
                  privacy@fitmesh.fit
                </a>
              </li>
            </ul>
          </div>
        </Section>
      </div>

      <hr className="my-12 border-divider" />
      <p className="text-center text-xs text-text-muted">
        © {new Date().getFullYear()} FitMesh. Tutti i diritti riservati.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-text-primary border-b border-divider pb-3 mb-4">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Callout({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning";
}) {
  const tone =
    variant === "warning"
      ? "border-warning bg-warning/10"
      : "border-brand-blue bg-brand-aqua/10";
  return (
    <div className={`mt-4 rounded-[14px] border-l-4 ${tone} px-5 py-4 text-sm text-text-secondary`}>
      {children}
    </div>
  );
}
