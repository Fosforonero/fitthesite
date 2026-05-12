import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Quali cookie usa fitmesh.fit e perché. Solo cookie tecnici essenziali, nessun tracker pubblicitario.",
};

const LAST_UPDATED = "12 Maggio 2026";

export default function CookiesPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-brand-500">Legale</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-50">
          Cookie Policy
        </h1>
        <p className="mt-3 text-sm text-ink-300">Ultimo aggiornamento: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-10 text-ink-200 leading-relaxed">
        <Section title="In breve">
          <p>
            <strong className="text-ink-50">fitmesh.fit non traccia gli utenti.</strong> Non
            usiamo Google Analytics, Meta Pixel, o altri tracker di terze parti. Non profiliamo.
            Non vendiamo dati. Non mostriamo pubblicità.
          </p>
          <p>
            Gli unici cookie/tecnologie di storage che potresti vedere sono <strong>strettamente
            tecnici</strong> e <strong>di prima parte</strong>: servono al sito a funzionare
            correttamente e non identificano la tua persona.
          </p>
        </Section>

        <Section title="Cosa sono i cookie">
          <p>
            I cookie sono piccoli file di testo che un sito può salvare sul tuo browser.
            Servono a ricordare informazioni tra una visita e l'altra (es. la tua preferenza
            tema, le tue scelte di consenso).
          </p>
          <p>
            Oltre ai cookie, i siti web possono usare <em>localStorage</em>: un sistema di
            archiviazione del browser simile ai cookie, ma che non viene mai inviato al server.
            È quello che usiamo qui per ricordare che hai chiuso il banner.
          </p>
        </Section>

        <Section title="Cosa usiamo noi">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b hairline">
                  <Th>Nome</Th>
                  <Th>Tipo</Th>
                  <Th>Durata</Th>
                  <Th>Scopo</Th>
                </tr>
              </thead>
              <tbody className="text-ink-200">
                <tr className="border-b hairline align-top">
                  <Td><code className="text-brand-500">fitmesh_cookie_consent</code></Td>
                  <Td>localStorage</Td>
                  <Td>Persistente fino a cancellazione manuale</Td>
                  <Td>
                    Memorizza che hai chiuso il banner cookie, così non te lo mostriamo
                    di nuovo a ogni visita. Non contiene dati personali.
                  </Td>
                </tr>
                <tr className="align-top">
                  <Td>Cookie tecnici Vercel</Td>
                  <Td>Cookie di sessione</Td>
                  <Td>Durata sessione</Td>
                  <Td>
                    Vercel (la piattaforma che ospita il sito) può impostare cookie tecnici
                    per bilanciare il carico tra server, prevenire abusi e servire la versione
                    corretta del sito. Sono essenziali e non profilano.
                    {" "}
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      className="text-brand-500 hover:text-brand-400 underline underline-offset-4"
                      target="_blank"
                      rel="noopener"
                    >
                      Privacy Vercel
                    </a>
                    .
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Cosa NON usiamo">
          <ul className="space-y-2 mt-3">
            {[
              ["Google Analytics, Plausible, Matomo o qualsiasi altro analytics"],
              ["Meta Pixel, TikTok Pixel, LinkedIn Insight, Google Ads"],
              ["Cookie pubblicitari di terze parti"],
              ["Profilazione basata su comportamento"],
              ["Fingerprinting del browser"],
              ["Beacon o pixel di tracking nelle email"],
            ].map(([item]) => (
              <li key={item} className="flex gap-2">
                <span className="text-danger mt-0.5">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Come gestire il consenso">
          <p>
            Visto che non profiliamo, non chiediamo un consenso "opt-in" attivo. Il banner che
            vedi alla prima visita è informativo: ti dice cosa stiamo facendo e ti permette di
            chiuderlo. Puoi sempre:
          </p>
          <ul className="space-y-2 mt-3">
            <li className="flex gap-2">
              <span className="text-brand-500 mt-0.5">•</span>
              <span>
                <strong className="text-ink-50">Bloccare i cookie dal browser:</strong> tutti i browser moderni hanno
                impostazioni per rifiutare cookie. Bloccare i cookie tecnici di Vercel potrebbe
                rendere il sito instabile.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-500 mt-0.5">•</span>
              <span>
                <strong className="text-ink-50">Cancellare il consenso al banner:</strong> apri gli strumenti per sviluppatori
                del browser (F12), vai su "Storage" → "localStorage" → "fitmesh.fit" e
                cancella <code className="text-brand-500">fitmesh_cookie_consent</code>. Alla
                prossima visita rivedrai il banner.
              </span>
            </li>
          </ul>
        </Section>

        <Section title="Modifiche">
          <p>
            Se in futuro decidessimo di introdurre analytics o altri strumenti, aggiorneremo
            questa pagina e mostreremo un nuovo banner con consenso esplicito (opt-in) come
            richiesto dal GDPR. Non lo faremo mai retroattivamente sui dati già raccolti.
          </p>
        </Section>

        <Section title="Contatti">
          <p>
            Per domande su questa Cookie Policy:{" "}
            <a
              href="mailto:privacy@fitmesh.fit"
              className="text-brand-500 hover:text-brand-400 underline underline-offset-4"
            >
              privacy@fitmesh.fit
            </a>
            .
          </p>
        </Section>
      </div>

      <hr className="my-12 border-white/10" />
      <p className="text-center text-xs text-ink-300">
        © {new Date().getFullYear()} FitMesh. Tutti i diritti riservati.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-semibold text-ink-50 border-b hairline pb-3 mb-4">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-3 text-xs uppercase tracking-wider text-ink-300 font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3">{children}</td>;
}
