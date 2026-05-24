/**
 * /[locale]/famiglia — Marketing landing dedicata a Mesh Famiglia.
 *
 * Obiettivo SEO: cluster keyword "monitorare salute famiglia genitori
 * anziani" (zero competitor diretti in Italia; Apple Family Sharing,
 * Samsung Family Health solo brand-specific e closed). Target: caregiver
 * 35-55, adulti con genitori 65+ che vogliono sicurezza senza essere
 * invadenti.
 *
 * Differenziazione vs sync-feature pages (/sync/[provider]):
 *   - quelle: utente fitness-tech che cerca "come connettere X"
 *   - questa: utente emotivo che cerca "controllare mio padre" /
 *     "sapere se mia mamma cammina abbastanza"
 *
 * JSON-LD: WebPage + SoftwareApplication.featureList (family-specific)
 * + FAQPage. Hreflang IT/EN; EN parla di "Family Mesh".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import StoreButtonsRow from "@/components/StoreButtonsRow";
import { locales, type Locale, ogLocale } from "@/lib/i18n";

const SITE_URL = "https://www.fitmesh.fit";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app";

const COPY = {
  it: {
    hero_kicker: "Mesh Famiglia",
    hero_h1: "Vedi se i tuoi cari stanno bene, senza chiederlo ogni giorno",
    hero_sub:
      "Crei un gruppo, inviti chi vuoi (genitori, partner, figli), e vedi in un'unica dashboard chi ha camminato oggi, chi ha dormito poco, chi ha avuto un battito anomalo. Privacy first: ognuno sceglie cosa condividere.",
    cta_primary: "Scarica l'app",
    cta_secondary: "Come funziona",
    why_kicker: "Perchè serve",
    why_h2: "Tre modi di stare vicini a chi conta",
    why_items: [
      {
        title: "Genitori anziani autonomi",
        body:
          "Tua madre vive da sola e indossa il Galaxy Watch che le hai regalato. Non vuoi essere invadente, ma vorresti sapere se ha smesso di camminare o se la frequenza cardiaca a riposo cambia. Mesh Famiglia te lo dice senza che lei debba aprire app o mandarti messaggi.",
      },
      {
        title: "Famiglia con figli adolescenti",
        body:
          "Tuo figlio ha la Mi Band. Tu vuoi che si muova, dorma abbastanza, non strapazzi il cuore allenandosi senza sapere. Vedi i suoi dati salute nella tua app — niente social, niente chat, solo numeri.",
      },
      {
        title: "Partner / coniugi",
        body:
          "Lavorate in posti diversi, vi vedete la sera. Sapere che lei ha fatto i suoi 8000 passi o che lui ha dormito bene la notte e' un piccolo modo di curarsi a distanza.",
      },
    ],
    how_kicker: "Come funziona",
    how_h2: "Tre passaggi, due minuti",
    how_steps: [
      {
        title: "Crei il gruppo famiglia",
        body:
          "Dall'app FitMesh tap su 'Mesh Famiglia' → 'Crea gruppo'. Dai un nome (es. 'Famiglia Rossi'). Sei tu l'admin.",
      },
      {
        title: "Inviti chi vuoi via link",
        body:
          "L'app genera un codice MESH-XXXX e un link condivisibile (WhatsApp, SMS, email). Chi clicca scarica l'app gratis e si unisce. Massimo 3 membri gratis, 8 con FitMesh Pro.",
      },
      {
        title: "Ognuno sceglie cosa condividere",
        body:
          "Default condiviso: passi, sonno, frequenza cardiaca a riposo, livello attivita'. NON condivisi di default: peso, pressione, ciclo, glicemia, posizione. Modificabile in ogni momento dall'app.",
      },
    ],
    privacy_kicker: "Privacy e controllo",
    privacy_h2: "Quello che vedi, e quello che NON vedi",
    privacy_columns: [
      {
        title: "Cosa vede l'admin del gruppo",
        items: [
          "Nome che il membro ha scelto (es. 'Mamma', 'Luca')",
          "Conteggio passi giornaliero",
          "Ore di sonno totali",
          "Frequenza cardiaca media e a riposo",
          "Livello attivita' generico (basso/medio/alto)",
        ],
        color: "brand-aqua",
      },
      {
        title: "Cosa NON vede mai",
        items: [
          "Posizione geografica del membro",
          "Peso e composizione corporea",
          "Ciclo mestruale",
          "Pressione, glicemia, dati medici sensibili",
          "Notifiche, messaggi, contatti del telefono",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Funziona con tutti i wearable che gia' avete",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. Se uno di voi ha un wearable diverso, basta che scriva i dati su Health Connect (lo fanno tutti dal 2024). Niente acquisto vincolato a un marchio.",
    pricing_kicker: "Quanto costa",
    pricing_h2: "Gratis fino a 3 membri",
    pricing_body:
      "Il piano gratuito copre te + 2 familiari (3 totali). Con FitMesh Pro (€3.99 una tantum) sblocchi fino a 8 membri, storico esteso, e priorita' sync. Niente subscription, niente trial scaduti, niente carte di credito richieste.",
    faq_kicker: "Domande comuni",
    faq_h2: "Dubbi e risposte",
    faqs: [
      {
        q: "Mia madre/mio padre e' tecnologicamente impreparato. Riesce a usarla?",
        a:
          "Sì. Una volta installata l'app e cliccato il link di invito che gli mandi, non deve fare nient'altro. L'app sincronizza da sola in background. Tu vedi i suoi dati dalla tua app. Lui/lei non deve aprire mai piu' nulla.",
      },
      {
        q: "Posso vedere la posizione dei membri famiglia?",
        a:
          "No, mai. FitMesh Sync non raccoglie ne' condivide dati di posizione. Se cerchi quello, serve un'app dedicata tipo Google Family Link.",
      },
      {
        q: "Cosa succede se un membro vuole uscire dal gruppo?",
        a:
          "Dal suo telefono: Mesh Famiglia → Impostazioni gruppo → Lascia gruppo. I suoi dati storici vengono rimossi dalla vista degli altri immediatamente. Nessuna autorizzazione admin richiesta.",
      },
      {
        q: "I dati salute dei miei familiari sono al sicuro?",
        a:
          "Sì. Tutto cifrato HTTPS/TLS. Storage su Supabase EU (Francoforte). Accesso vincolato al gruppo specifico via Row-Level Security Postgres. Niente broker dati, niente pubblicita' profilata. Conformita' GDPR full.",
      },
      {
        q: "E' un dispositivo medico?",
        a:
          "No. FitMesh Sync e' un'app fitness/wellness. NON sostituisce un medico ne' diagnostica patologie. Per dubbi clinici, consulta sempre il tuo medico di base.",
      },
      {
        q: "Quante persone posso invitare?",
        a:
          "Piano gratuito: 3 totali (incluso te). Piano Pro €3.99 una tantum: fino a 8 membri.",
      },
    ],
    final_cta_h2: "Inizia oggi — 3 minuti per creare il primo gruppo",
    final_cta_body:
      "Scarica FitMesh dal Play Store, crea il gruppo famiglia, condividi il link con chi vuoi. Funziona subito, anche se i tuoi familiari non aprono l'app per giorni.",
  },
  en: {
    hero_kicker: "Family Mesh",
    hero_h1: "See if your loved ones are doing well, without asking every day",
    hero_sub:
      "Create a group, invite anyone (parents, partner, kids), and see in one dashboard who walked today, who slept poorly, whose heart rate spiked. Privacy-first: everyone chooses what to share.",
    cta_primary: "Get the app",
    cta_secondary: "How it works",
    why_kicker: "Why it matters",
    why_h2: "Three ways to stay close to those who count",
    why_items: [
      {
        title: "Independent aging parents",
        body:
          "Your mother lives alone and wears the Galaxy Watch you gave her. You don't want to be intrusive, but you'd like to know if she stopped walking or if her resting heart rate changes. Family Mesh tells you without her having to open apps or text you.",
      },
      {
        title: "Families with teenagers",
        body:
          "Your kid has the Mi Band. You want them to move, sleep enough, not overdo workouts blindly. See their health data in your app — no social, no chats, just numbers.",
      },
      {
        title: "Partners / spouses",
        body:
          "You work in different places, see each other in the evening. Knowing she hit her 8000 steps or he slept well last night is a small way to care from a distance.",
      },
    ],
    how_kicker: "How it works",
    how_h2: "Three steps, two minutes",
    how_steps: [
      {
        title: "Create the family group",
        body:
          "In the FitMesh app tap 'Family Mesh' → 'Create group'. Give it a name (e.g. 'Smith Family'). You're the admin.",
      },
      {
        title: "Invite anyone via link",
        body:
          "The app generates a MESH-XXXX code and a shareable link (WhatsApp, SMS, email). Whoever clicks downloads the app for free and joins. Up to 3 members free, 8 with FitMesh Pro.",
      },
      {
        title: "Each chooses what to share",
        body:
          "Default shared: steps, sleep, resting heart rate, activity level. NOT shared by default: weight, blood pressure, cycle, glucose, location. Editable anytime.",
      },
    ],
    privacy_kicker: "Privacy & control",
    privacy_h2: "What you see, and what you NEVER see",
    privacy_columns: [
      {
        title: "What the group admin sees",
        items: [
          "Name the member chose (e.g. 'Mom', 'Luca')",
          "Daily step count",
          "Total hours of sleep",
          "Average and resting heart rate",
          "Generic activity level (low/medium/high)",
        ],
        color: "brand-aqua",
      },
      {
        title: "What is NEVER visible",
        items: [
          "Geographic location of any member",
          "Weight and body composition",
          "Menstrual cycle",
          "Blood pressure, glucose, sensitive medical data",
          "Notifications, messages, phone contacts",
        ],
        color: "brand-green",
      },
    ],
    techstack_h2: "Works with all wearables you already own",
    techstack_body:
      "Galaxy Watch, Mi Band, Pixel Watch, Garmin, Fitbit, Polar, Withings, Honor, Huawei. If one of you has a different wearable, it just needs to write data to Health Connect (all major brands do since 2024). No brand lock-in.",
    pricing_kicker: "What it costs",
    pricing_h2: "Free up to 3 members",
    pricing_body:
      "Free plan covers you + 2 family members (3 total). With FitMesh Pro (€3.99 one-time) you unlock up to 8 members, extended history, and sync priority. No subscription, no expired trials, no credit card required.",
    faq_kicker: "Common questions",
    faq_h2: "FAQs",
    faqs: [
      {
        q: "My mother/father is not tech-savvy. Can they use it?",
        a:
          "Yes. Once the app is installed and they tap the invite link you send, they don't need to do anything else. The app syncs in background automatically. You see their data in your app. They never need to open it again.",
      },
      {
        q: "Can I see family members' location?",
        a:
          "No, never. FitMesh Sync does not collect or share location data. If you need that, use a dedicated app like Google Family Link.",
      },
      {
        q: "What if a member wants to leave the group?",
        a:
          "From their phone: Family Mesh → Group settings → Leave group. Their historical data is removed from other members' view immediately. No admin approval required.",
      },
      {
        q: "Are my family's health data safe?",
        a:
          "Yes. Everything is encrypted via HTTPS/TLS. Storage on Supabase EU (Frankfurt). Access bound to the specific group via Row-Level Security in Postgres. No data brokers, no profiling ads. Full GDPR compliance.",
      },
      {
        q: "Is this a medical device?",
        a:
          "No. FitMesh Sync is a fitness/wellness app. It does NOT replace a doctor or diagnose conditions. For any clinical concern, consult your family physician.",
      },
      {
        q: "How many people can I invite?",
        a:
          "Free plan: 3 total (including you). Pro €3.99 one-time: up to 8 members.",
      },
    ],
    final_cta_h2: "Start today — 3 minutes to create your first group",
    final_cta_body:
      "Download FitMesh from Play Store, create the family group, share the link with anyone. It works immediately, even if your family members don't open the app for days.",
  },
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const title = lc === "it"
    ? "Mesh Famiglia — Monitora la salute dei tuoi cari | FitMesh Sync"
    : "Family Mesh — Monitor your loved ones' health | FitMesh Sync";
  const description = lc === "it"
    ? "Mesh Famiglia ti permette di vedere passi, sonno e battito di genitori, partner o figli in un'unica dashboard. Privacy-first, gratis fino a 3 membri, niente posizione condivisa."
    : "Family Mesh lets you see steps, sleep, and heart rate of parents, partners or kids in one dashboard. Privacy-first, free up to 3 members, no location sharing.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/famiglia`,
      languages: {
        it: `${SITE_URL}/it/famiglia`,
        en: `${SITE_URL}/en/famiglia`,
        "x-default": `${SITE_URL}/it/famiglia`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lc}/famiglia`,
      siteName: "FitMesh Sync",
      title,
      description,
      locale: ogLocale[lc],
    },
  };
}

export default async function FamigliaLanding({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = COPY[lc];
  const path = `/${lc}/famiglia`;

  // JSON-LD WebPage + Family-specific SoftwareApplication + FAQ
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: lc === "it"
      ? "Mesh Famiglia — Monitora la salute dei tuoi cari"
      : "Family Mesh — Monitor your loved ones' health",
    description: lc === "it"
      ? "Crea un gruppo famiglia, invita genitori/partner/figli, vedi passi/sonno/battito di ognuno in una dashboard. Privacy-first."
      : "Create a family group, invite parents/partner/kids, see steps/sleep/heart rate of each in one dashboard. Privacy-first.",
    inLanguage: lc === "it" ? "it-IT" : "en-US",
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: { "@id": `${SITE_URL}#mobile-app` },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const crumbName = lc === "it" ? "Mesh Famiglia" : "Family Mesh";

  return (
    <article className="relative">
      <JsonLd data={webPageLd} />
      <JsonLd data={faqLd} />
      <Breadcrumbs items={[{ name: crumbName, path }]} locale={lc} />

      {/* HERO */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.24em] text-brand-aqua font-semibold">
          {t.hero_kicker}
        </p>
        <h1 className="mt-4 font-display text-display-lg sm:text-display-xl font-semibold tracking-tightest text-text-primary text-balance">
          {t.hero_h1}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t.hero_sub}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <StoreButtonsRow locale={lc} />
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-pill btn-ghost text-sm"
          >
            {t.cta_secondary} <span aria-hidden>↓</span>
          </a>
        </div>
      </section>

      {/* WHY (3 personas) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.why_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.why_h2}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.why_items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
            >
              <h3 className="font-display text-xl font-semibold text-text-primary">
                {it.title}
              </h3>
              <p className="mt-4 text-text-secondary leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW (3 steps) */}
      <section id="how" className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.how_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.how_h2}
        </h2>
        <ol className="mt-12 space-y-6">
          {t.how_steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-5 items-start rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7"
            >
              <span className="shrink-0 w-10 h-10 rounded-full bg-brand-aqua/15 border border-brand-aqua/30 flex items-center justify-center font-display font-bold text-brand-aqua">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary">
                  {s.title}
                </h3>
                <p className="mt-2 text-text-secondary leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* PRIVACY 2-column */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.privacy_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.privacy_h2}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {t.privacy_columns.map((col) => (
            <div
              key={col.title}
              className={`rounded-2xl border bg-white/[0.02] p-7 ${
                col.color === "brand-aqua"
                  ? "border-brand-aqua/30"
                  : "border-brand-green/30"
              }`}
            >
              <h3
                className={`font-display text-lg font-bold ${
                  col.color === "brand-aqua" ? "text-brand-aqua" : "text-brand-green"
                }`}
              >
                {col.title}
              </h3>
              <ul className="mt-5 space-y-2.5 text-text-secondary">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                        col.color === "brand-aqua"
                          ? "bg-brand-aqua"
                          : "bg-brand-green"
                      }`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          {t.techstack_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{t.techstack_body}</p>
        <Link
          href={`/${lc}/integrations`}
          className="mt-6 inline-flex items-center gap-1.5 text-brand-aqua hover:text-brand-green transition text-sm font-medium"
        >
          {lc === "it" ? "Vedi tutti i wearable supportati" : "See all supported wearables"}
          <span aria-hidden>→</span>
        </Link>
      </section>

      {/* PRICING */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.pricing_kicker}
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.pricing_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{t.pricing_body}</p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        <p className="text-center text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.faq_kicker}
        </p>
        <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.faq_h2}
        </h2>
        <dl className="mt-10 space-y-4">
          {t.faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-colors hover:border-brand-aqua/30"
            >
              <summary className="cursor-pointer list-none font-display font-semibold text-text-primary flex items-start gap-3">
                <span className="flex-1">{f.q}</span>
                <span
                  aria-hidden
                  className="shrink-0 mt-1 text-brand-aqua transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-text-secondary leading-relaxed">{f.a}</p>
            </details>
          ))}
        </dl>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.final_cta_h2}
        </h2>
        <p className="mt-5 text-text-secondary leading-relaxed">{t.final_cta_body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <StoreButtonsRow locale={lc} />
        </div>
        <p className="mt-5 text-xs text-text-muted">
          {lc === "it"
            ? "Niente carta di credito · 3 membri gratis a vita"
            : "No credit card · 3 members free forever"}
        </p>
        <p className="mt-3 text-xs text-text-muted">
          <a href={PLAY_URL} target="_blank" rel="noopener" className="underline hover:text-text-secondary">
            {lc === "it" ? "Anteprima su Play Store" : "Preview on Play Store"}
          </a>
        </p>
      </section>
    </article>
  );
}
