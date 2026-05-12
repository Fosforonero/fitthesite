import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Come FitMesh raccoglie, utilizza e protegge i dati di salute. Conforme GDPR.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "12 Maggio 2026";

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-brand-blue">Legale</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Ultimo aggiornamento: {LAST_UPDATED}
        </p>
      </header>

      <div className="prose-fitmesh space-y-10 text-text-secondary leading-relaxed">
        <Section title="1. Introduzione">
          <p>
            FitMesh ("noi", "nostro", "l'app") rispetta la tua privacy e si impegna a proteggere
            i tuoi dati personali. Questa Privacy Policy spiega come raccogliamo, utilizziamo e
            proteggiamo le informazioni relative alla salute quando utilizzi la nostra applicazione mobile
            FitMesh (disponibile come <em>com.fitmeshsync.app</em> su Google Play).
          </p>
        </Section>

        <Section title="2. Informazioni che raccogliamo">
          <p>
            FitMesh raccoglie i seguenti dati relativi alla salute dal tuo dispositivo Android
            tramite servizi autorizzati (Health Connect, Samsung Health Data SDK):
          </p>
          <List
            items={[
              ["Attività fisica", "passi, distanza percorsa, calorie bruciate (attive e totali), piani saliti"],
              ["Frequenza cardiaca", "media, range minimo/massimo, frequenza a riposo, HRV"],
              ["Sonno", "durata totale, fasi (profondo, REM, leggero, sveglio), orari inizio/fine"],
              ["Composizione corporea", "peso, altezza, BMI (se forniti dall'utente)"],
              ["Altri parametri", "saturazione ossigeno (SpO₂), VO₂ max, temperatura cutanea, dislivello"],
              ["Sessioni di esercizio", "tipo di attività, durata, distanza, calorie"],
            ]}
          />
          <Callout>
            Importante: questi dati vengono letti solo dai servizi di salute già presenti sul tuo
            dispositivo e solo dopo che hai concesso esplicitamente i permessi necessari.
          </Callout>
        </Section>

        <Section title="3. Come utilizziamo i dati">
          <p>I dati raccolti vengono utilizzati esclusivamente per:</p>
          <List
            items={[
              ["Sincronizzazione", "inviare le informazioni di salute al server che configuri tu"],
              ["Visualizzazione", "permettere la visualizzazione dei dati sulla dashboard web e nell'app"],
              ["Migliorare l'esperienza", "diagnosticare problemi tecnici quando ce li segnali via email"],
            ]}
          />
          <p className="text-text-primary font-medium">
            Non vendiamo, non condividiamo e non utilizziamo i tuoi dati per pubblicità o marketing.
          </p>
        </Section>

        <Section title="4. Dove vengono salvati i dati">
          <p>
            I dati vengono inviati esclusivamente al server che configuri tu nell'app. Puoi scegliere
            tra: il nostro server pubblico, una tua VPS personale, un NAS di casa, o qualsiasi altro
            endpoint compatibile con la nostra API. FitMesh non invia dati a server di terze parti o
            a servizi esterni non da te specificati.
          </p>
          <p>
            I dati rimangono sul tuo dispositivo in una cache locale fino al momento della
            sincronizzazione. Dopo la sincronizzazione, i dati vengono memorizzati sul server scelto
            secondo le tue policy.
          </p>
        </Section>

        <Section title="5. Permessi richiesti">
          <p>FitMesh richiede i seguenti permessi:</p>
          <List
            items={[
              ["Health Connect", "per leggere i dati di salute dal sistema operativo Android"],
              ["Samsung Health (opzionale)", "se hai un Galaxy Watch, per dati aggiuntivi non esposti da Health Connect"],
              ["Accesso Internet", "per sincronizzare i dati con il server scelto"],
              ["Sync in background", "per inviare dati periodicamente anche quando l'app è chiusa"],
              ["Esclusione ottimizzazione batteria", "per garantire la sync regolare (richiesto su Android 14+)"],
            ]}
          />
          <p>
            Tutti i permessi sono richiesti esplicitamente e puoi revocarli in qualsiasi momento dalle
            impostazioni del dispositivo o dell'applicazione.
          </p>
        </Section>

        <Section title="6. Sicurezza dei dati">
          <List
            items={[
              ["Trasporto", "i dati vengono trasmessi tramite HTTPS quando il server di destinazione lo supporta"],
              ["Persistenza locale", "la cache locale viene svuotata dopo invio confermato"],
              ["Nessun tracker", "non includiamo SDK di analytics, advertising o profilazione"],
              ["Codice sorgente", "il codice del backend è ispezionabile pubblicamente per audit"],
            ]}
          />
        </Section>

        <Section title="7. I tuoi diritti">
          <p>Hai il diritto di:</p>
          <List
            items={[
              ["Accedere", "richiedere una copia dei tuoi dati salvati sul nostro server pubblico"],
              ["Cancellare", "richiedere la cancellazione completa dei tuoi dati"],
              ["Revocare permessi", "disabilitare i permessi di accesso ai dati di salute in qualsiasi momento"],
              ["Portabilità", "ricevere i tuoi dati in formato JSON strutturato"],
              ["Disinstallare", "rimuovere l'applicazione e tutti i dati associati"],
            ]}
          />
          <p>
            Per esercitare questi diritti, scrivici a{" "}
            <a className="text-brand-blue hover:text-brand-aqua underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
              privacy@fitmesh.fit
            </a>
            . Rispondiamo entro 30 giorni.
          </p>
        </Section>

        <Section title="8. Dati di terze parti">
          <p>FitMesh si integra con i seguenti servizi di terze parti:</p>
          <List
            items={[
              ["Health Connect (Google)", "servizio ufficiale Android per dati di salute, soggetto alla policy di Google"],
              ["Samsung Health Data SDK", "API ufficiale Samsung per Galaxy Watch, soggetto alla policy di Samsung"],
              ["Google Play Billing", "per gestione acquisti in-app, soggetto alla policy di Google"],
              ["Google Analytics 4 (solo sito web, opt-in)", "analytics anonimi del sito fitmesh.fit, attivati solo dopo consenso esplicito tramite banner cookie. Vedi la Cookie Policy per i dettagli tecnici"],
              ["Vercel", "hosting del sito web fitmesh.fit, soggetto alla policy di Vercel"],
            ]}
          />
          <p>
            L'utilizzo di questi servizi è soggetto alle rispettive Privacy Policy. Ti consigliamo di
            consultarle per comprendere come gestiscono i tuoi dati. Maggiori dettagli sull'utilizzo
            di Google Analytics nella nostra{" "}
            <a href="/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
              Cookie Policy
            </a>
            .
          </p>
        </Section>

        <Section title="9. Modifiche a questa Privacy Policy">
          <p>
            Possiamo aggiornare questa Privacy Policy di tanto in tanto. Per modifiche significative
            ti notificheremo via email (se sei iscritto al servizio) oppure mostrando un avviso
            nell'app prima della prossima sincronizzazione. La data di "Ultimo aggiornamento" in
            alto è sempre indicativa della versione corrente.
          </p>
        </Section>

        <Section title="10. Minori">
          <p>
            FitMesh non è destinata a utenti di età inferiore ai 13 anni. Non raccogliamo
            consapevolmente dati personali da minori di 13 anni. Se scopriamo di aver raccolto dati
            da un minore di 13 anni, elimineremo immediatamente tali informazioni.
          </p>
        </Section>

        <Section title="11. Conformità GDPR">
          <p>
            Se sei residente nell'Unione Europea, questa Privacy Policy è conforme al Regolamento
            Generale sulla Protezione dei Dati (GDPR, Reg. UE 2016/679). Hai diritto di accesso,
            rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e
            opposizione al trattamento dei tuoi dati personali. Puoi inoltre presentare reclamo
            all'Autorità Garante per la Protezione dei Dati Personali ({" "}
            <a className="text-brand-blue hover:text-brand-aqua underline underline-offset-4" href="https://www.garanteprivacy.it/">
              garanteprivacy.it
            </a>
            ).
          </p>
        </Section>

        <Section title="12. Contatti">
          <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
            <p className="text-text-secondary">
              Per domande, richieste o preoccupazioni:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <span className="text-text-muted">Privacy:</span>{" "}
                <a className="text-brand-blue hover:text-brand-aqua" href="mailto:privacy@fitmesh.fit">
                  privacy@fitmesh.fit
                </a>
              </li>
              <li>
                <span className="text-text-muted">Supporto:</span>{" "}
                <a className="text-brand-blue hover:text-brand-aqua" href="mailto:support@fitmesh.fit">
                  support@fitmesh.fit
                </a>
              </li>
              <li>
                <span className="text-text-muted">Generale:</span>{" "}
                <a className="text-brand-blue hover:text-brand-aqua" href="mailto:hello@fitmesh.fit">
                  hello@fitmesh.fit
                </a>
              </li>
              <li>
                <span className="text-text-muted">Sito web:</span>{" "}
                <a className="text-brand-blue hover:text-brand-aqua" href="https://www.fitmesh.fit">
                  www.fitmesh.fit
                </a>
              </li>
            </ul>
          </div>
        </Section>

        <Section title="13. Consenso">
          <p>
            Utilizzando FitMesh, accetti questa Privacy Policy e acconsenti alla raccolta e
            all'utilizzo delle informazioni come descritto in questo documento. Se non sei d'accordo,
            ti preghiamo di non utilizzare l'applicazione.
          </p>
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

function List({ items }: { items: Array<[string, string]> }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map(([term, def]) => (
        <li key={term} className="flex gap-2">
          <span className="text-brand-blue mt-0.5">•</span>
          <span>
            <strong className="text-text-primary">{term}:</strong> <span className="text-text-secondary">{def}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border-l-4 border-brand-aqua bg-brand-aqua/10 px-4 py-3 text-sm text-text-secondary">
      {children}
    </div>
  );
}
