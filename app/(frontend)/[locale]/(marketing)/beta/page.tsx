import type { Metadata } from "next";
import { notFound } from "next/navigation";

import StoreButtonsRow from "@/components/StoreButtonsRow";
import TrustBadges from "@/components/TrustBadges";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { MobileApplicationJsonLd } from "@/components/seo/MobileApplicationJsonLd";
import { CTA_PLACEMENTS } from "@/lib/analytics/cta";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { founderEligibilityStatement, founderSiteClosedNote } from "@/lib/founder/historical-note";

type ArchiveCopy = {
  kicker: string;
  bullets: { title: string; desc: string }[];
  faqTitle: string;
  faqs: { q: string; a: string }[];
};

/** Fallback en per le locale non compilate qui sotto (pl/tr/sv/da/no/fi). */
function tliArchive(l: Record<string, ArchiveCopy>, lc: Locale): ArchiveCopy {
  return l[lc] ?? l.en;
}

/**
 * Sprint P0.10H — H1 NEUTRO, riusato tal quale in Sprint P0.10K come H1
 * PERMANENTE della pagina (non piu' solo un fallback pre-hydration): mai
 * "aperto" ne' "concluso" — la regola vera e propria vive in
 * founderEligibilityStatement()/founderSiteClosedNote() sotto.
 */
const NEUTRAL_H1: Record<string, string> = {
  it: "Programma Founder FitMesh",
  es: "Programa Founder de FitMesh",
  de: "FitMesh Founder-Programm",
  pt: "Programa Founder FitMesh",
  fr: "Programme Founder FitMesh",
  nl: "FitMesh Founder-programma",
  ja: "FitMesh ファウンダープログラム",
  ko: "FitMesh 파운더 프로그램",
  en: "FitMesh Founder Program",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Sprint P0.10J — hotfix metadata: titolo neutro condiviso fra
 * `generateMetadata()` e il JSON-LD `WebPage` sotto (unica fonte, invece di
 * due ternari paralleli). Riusa lo stesso vocabolario di `NEUTRAL_H1` sopra
 * (mai "aperto" ne' "concluso"), con suffisso brand per il <title> SEO.
 */
function betaMetaTitle(lc: Locale): string {
  // NEUTRAL_H1 include gia' il brand ("Programma Founder FitMesh" ecc.) —
  // nessun suffisso aggiuntivo, altrimenti "FitMesh" comparirebbe due volte.
  return NEUTRAL_H1[lc] ?? NEUTRAL_H1.en;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;

  const title = betaMetaTitle(lc);
  const description = founderEligibilityStatement(lc);

  const path = `/${lc}/beta`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/beta`),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // Sprint P0.10: /beta e' l'archivio informativo del programma Founder —
    // noindex (non e' piu' un target di acquisizione), follow (i link
    // interni/esterni restano validi da seguire).
    robots: { index: false, follow: true },
  };
}

/**
 * Sprint P0.10K (2026-07-31) — GO IMMEDIATE SITE FOUNDER SUNSET: chiusura
 * commerciale/visuale del sito ANTICIPATA rispetto al cutoff tecnico
 * backend (FOUNDER_END_AT, unica fonte di verita' in
 * lib/founder/program-window.ts — il valore NON va ricopiato qui),
 * decisione di prodotto di Matteo. Prima di questo sprint /beta usava
 * BetaFounderGate (P0.10H, 3 stati pending/open/closed) per mostrare il
 * modulo di iscrizione live finche' l'orologio del browser non superava
 * il cutoff reale. Da oggi il
 * sito smette di proporre nuove adesioni ORE PRIMA di quell'istante — un
 * gate che decide in base all'orologio del browser mostrerebbe ancora il
 * form per le prossime ore, l'opposto di quanto richiesto.
 *
 * Fix: /beta torna ad essere una pagina COMPLETAMENTE STATICA, zero
 * decisione temporale (server O client), che renderizza SEMPRE lo stesso
 * corpo — nessun BetaFounderGate, nessun Date.now(), nessun useEffect.
 * Il corpo e' costruito solo con testo INVARIANTE (vero oggi E dopo il
 * vero cutoff di stasera, quindi non richiede alcun deploy futuro):
 *  - founderSiteClosedNote() dice che le adesioni VIA SITO sono chiuse
 *    (claim vero da subito, mai legata all'istante esatto del cutoff
 *    backend);
 *  - founderEligibilityStatement() ripete la regola di idoneita' invariante
 *    gia' usata da press/blog/landing/llms.txt (Sprint P0.10G).
 * Il modulo di iscrizione (BetaSignupForm) e tutta la copy di adesione,
 * CTA di acquisizione incluse (le ex IT/ES/EN/DE/PT/FR/NL/JA/KO di
 * FounderOpenBody), sono stati rimossi da questa pagina: non c'e' piu'
 * alcuno stato in cui vengono mostrati.
 * BetaSignupForm.tsx e app/api/v1/beta/signup/route.ts restano nel repo
 * (non e' backend da toccare) ma non hanno piu' alcun punto di rendering
 * pubblico.
 */
export default async function BetaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const copy = tliArchive(ARCHIVE_COPY, lc);
  const h1 = NEUTRAL_H1[lc] ?? NEUTRAL_H1.en;

  return (
    // <div> e non <main>: il layout (marketing)/layout.tsx wrappa gia' i
    // children in un <main>. Nesting di landmark rompe WCAG e da'
    // comportamenti incerti agli screen reader iOS/Android.
    <div className="relative overflow-hidden pb-32 pt-20 text-text-primary md:pt-28">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: betaMetaTitle(lc),
          description: founderEligibilityStatement(lc),
          url: `${SITE_URL}/${lc}/beta`,
        }}
      />
      <MobileApplicationJsonLd locale={lc} />

      {/* Page-local atmospheric layers (sopra al MarketingBackdrop globale) */}
      <div
        aria-hidden
        className="halo-conic pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[720px] -translate-x-1/2 opacity-70 animate-float"
      />

      <div className="mx-auto max-w-3xl px-6">
        <Breadcrumbs
          locale={lc}
          items={[{ name: "Founder", path: `/${lc}/beta` }]}
        />

        <header className="mb-16 mt-8 text-center" data-reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted backdrop-blur-sm">
            {copy.kicker}
          </div>
          <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tightest md:text-5xl lg:text-display-xl">
            {h1}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
            {founderSiteClosedNote(lc)}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-text-muted">
            {founderEligibilityStatement(lc)}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <StoreButtonsRow locale={lc} ctaLocation={CTA_PLACEMENTS.betaArchive} />
          </div>
        </header>

        <section className="mb-16 grid gap-4 sm:grid-cols-3" data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties}>
          {copy.bullets.map((bullet, i) => {
            const colors = ["#7CFF5B", "#21E6C1", "#1DA1FF"];
            return (
              <div
                key={bullet.title}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  aria-hidden
                  className="absolute -top-16 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: colors[i] }}
                />
                <h3 className="relative font-display text-lg font-semibold text-text-primary">{bullet.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{bullet.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-6">
          <TrustBadges locale={lc} variant="compact" />
        </section>

        <section className="mt-20" data-reveal>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand-aqua font-semibold">FAQ</p>
          <h2 className="mt-3 mb-8 font-display text-display font-semibold tracking-tightest text-text-primary">{copy.faqTitle}</h2>
          <div className="space-y-3">
            {copy.faqs.map((faq) => (
              <details key={faq.q} className="group card p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-text-primary">
                  {faq.q}
                  <span className="text-brand-aqua text-xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Sprint P0.10K — copy PERMANENTE dell'archivio (sostituisce sia il vecchio
 * fallback "pending" pre-hydration sia il vecchio corpo "closed"
 * post-cutoff di P0.10/P0.10H, ora un unico stato sempre renderizzato).
 * Stesse 8 locale dirette di prima (it/es/de/pt/fr/nl/ja/ko) + fallback en
 * per le altre, via tliArchive(). Deliberatamente corta: niente step di
 * iscrizione, niente form — solo bullet + FAQ sullo stato del programma
 * (le FAQ generiche su wearable/privacy/cancellazione restano coperte
 * altrove sul sito, non duplicate qui). `sub`/regola di idoneita' vengono
 * da founderSiteClosedNote()/founderEligibilityStatement() (invarianti,
 * 15 locale, lib/founder/historical-note.ts) — non duplicati qui per
 * locale.
 *
 * FAQ, framing NEUTRO: la prima domanda chiede lo STATO del programma
 * ("Le adesioni Founder sono ancora aperte?"), mai se il lettore possa
 * ancora aderire in prima persona. Stesso contenuto informativo, zero
 * framing "puoi ancora" — che su una pagina d'archivio si legge come
 * invito residuo. La risposta apre con il "No" esplicito e
 * poi ricorda che i Founder gia' concessi restano validi e che la finestra
 * individuale di 14 giorni degli account registrati entro il cutoff non e'
 * toccata.
 */
const ARCHIVE_COPY: Record<string, ArchiveCopy> = {
  it: {
    kicker: "Programma Founder",
    bullets: [
      { title: "Founder esistenti", desc: "Pro a vita, invariato: la chiusura delle nuove adesioni non lo revoca." },
      { title: "Nuovi account", desc: "Prova Pro gratuita di 14 giorni." },
      { title: "Dopo la prova", desc: "Abbonamento o sblocco a vita per continuare con Pro." },
    ],
    faqTitle: "Domande frequenti",
    faqs: [
      {
        q: "Le adesioni Founder sono ancora aperte?",
        a: "No, le nuove adesioni tramite il sito sono chiuse. Lo status Founder resta valido solo per gli account già registrati entro il cutoff con una prima sincronizzazione reale entro 14 giorni. I nuovi account hanno la prova gratuita di 14 giorni, poi un abbonamento o lo sblocco a vita.",
      },
      {
        q: "Ero già Founder: il mio Pro a vita è ancora valido?",
        a: "Sì. Se hai ricevuto il Pro a vita da Founder, resta valido per sempre: non serve fare nulla.",
      },
    ],
  },
  es: {
    kicker: "Programa Founder",
    bullets: [
      { title: "Founders existentes", desc: "Pro de por vida, sin cambios: el cierre de nuevas adhesiones no lo revoca." },
      { title: "Cuentas nuevas", desc: "Prueba gratuita de Pro de 14 días." },
      { title: "Después de la prueba", desc: "Suscripción o desbloqueo de por vida para seguir con Pro." },
    ],
    faqTitle: "Preguntas frecuentes",
    faqs: [
      {
        q: "¿Las adhesiones Founder siguen abiertas?",
        a: "No, las nuevas adhesiones a través del sitio están cerradas. El estado Founder sigue siendo válido solo para las cuentas ya registradas antes del cierre con una primera sincronización real en 14 días. Las cuentas nuevas tienen la prueba gratuita de 14 días y luego una suscripción o el desbloqueo de por vida.",
      },
      {
        q: "Ya era Founder: ¿mi Pro de por vida sigue siendo válido?",
        a: "Sí. Si recibiste el Pro de por vida como Founder, sigue siendo válido para siempre: no necesitas hacer nada.",
      },
    ],
  },
  de: {
    kicker: "Founder-Programm",
    bullets: [
      { title: "Bestehende Founder", desc: "Lebenslanges Pro, unverändert: Die Schließung neuer Anmeldungen widerruft es nicht." },
      { title: "Neue Konten", desc: "Kostenlose 14-tägige Pro-Testphase." },
      { title: "Nach der Testphase", desc: "Abo oder lebenslange Freischaltung, um Pro zu behalten." },
    ],
    faqTitle: "Häufige Fragen",
    faqs: [
      {
        q: "Sind die Founder-Anmeldungen noch offen?",
        a: "Nein, neue Anmeldungen über die Website sind geschlossen. Der Founder-Status bleibt nur für Konten gültig, die bereits vor dem Stichtag mit einer echten ersten Synchronisierung innerhalb von 14 Tagen registriert wurden. Neue Konten erhalten die 14-tägige kostenlose Testphase, danach ein Abo oder die lebenslange Freischaltung.",
      },
      {
        q: "Ich war bereits Founder: ist mein lebenslanges Pro noch gültig?",
        a: "Ja. Wenn du das lebenslange Pro als Founder erhalten hast, bleibt es für immer gültig: du musst nichts tun.",
      },
    ],
  },
  pt: {
    kicker: "Programa Founder",
    bullets: [
      { title: "Founders existentes", desc: "Pro vitalício, inalterado: o encerramento de novas adesões não o revoga." },
      { title: "Novas contas", desc: "Teste gratuito de Pro de 14 dias." },
      { title: "Depois do teste", desc: "Assinatura ou desbloqueio vitalício para continuar com o Pro." },
    ],
    faqTitle: "Perguntas frequentes",
    faqs: [
      {
        q: "As adesões Founder ainda estão abertas?",
        a: "Não, as novas adesões através do site estão encerradas. O estado Founder continua válido apenas para contas já registadas até ao corte com uma primeira sincronização real em até 14 dias. As contas novas têm o teste gratuito de 14 dias, depois uma assinatura ou o desbloqueio vitalício.",
      },
      {
        q: "Já era Founder: o meu Pro vitalício continua válido?",
        a: "Sim. Se recebeste o Pro vitalício como Founder, continua válido para sempre: não precisas de fazer nada.",
      },
    ],
  },
  fr: {
    kicker: "Programme Founder",
    bullets: [
      { title: "Founders existants", desc: "Pro à vie, inchangé : la clôture des nouvelles inscriptions ne le révoque pas." },
      { title: "Nouveaux comptes", desc: "Essai gratuit de Pro de 14 jours." },
      { title: "Après l'essai", desc: "Abonnement ou déblocage à vie pour continuer avec Pro." },
    ],
    faqTitle: "Questions fréquentes",
    faqs: [
      {
        q: "Les inscriptions Founder sont-elles encore ouvertes ?",
        a: "Non, les nouvelles inscriptions via le site sont closes. Le statut Founder reste valable uniquement pour les comptes déjà enregistrés avant la clôture avec une première synchronisation réelle sous 14 jours. Les nouveaux comptes bénéficient de l'essai gratuit de 14 jours, puis d'un abonnement ou du déblocage à vie.",
      },
      {
        q: "J'étais déjà Founder : mon Pro à vie est-il toujours valable ?",
        a: "Oui. Si vous avez reçu le Pro à vie en tant que Founder, il reste valable pour toujours : aucune action n'est nécessaire.",
      },
    ],
  },
  nl: {
    kicker: "Founder-programma",
    bullets: [
      { title: "Bestaande founders", desc: "Pro voor altijd, ongewijzigd: het sluiten van nieuwe aanmeldingen trekt het niet in." },
      { title: "Nieuwe accounts", desc: "Gratis proefperiode van 14 dagen voor Pro." },
      { title: "Na de proefperiode", desc: "Abonnement of levenslange ontgrendeling om Pro te behouden." },
    ],
    faqTitle: "Veelgestelde vragen",
    faqs: [
      {
        q: "Zijn de founder-aanmeldingen nog open?",
        a: "Nee, nieuwe aanmeldingen via de site zijn gesloten. De Founder-status blijft alleen geldig voor accounts die al vóór de sluiting zijn geregistreerd met een echte eerste synchronisatie binnen 14 dagen. Nieuwe accounts krijgen de gratis proefperiode van 14 dagen, daarna een abonnement of de levenslange ontgrendeling.",
      },
      {
        q: "Ik was al founder: is mijn Pro voor altijd nog geldig?",
        a: "Ja. Als je als founder Pro voor altijd hebt gekregen, blijft dit voor altijd geldig: je hoeft niets te doen.",
      },
    ],
  },
  ja: {
    kicker: "ファウンダープログラム",
    bullets: [
      { title: "既存のファウンダー", desc: "Pro永久ライセンスは変更なし：新規登録の終了によって取り消されることはありません。" },
      { title: "新規アカウント", desc: "14日間の無料Proトライアル。" },
      { title: "トライアル終了後", desc: "サブスクリプションまたは買い切りでProを継続。" },
    ],
    faqTitle: "よくある質問",
    faqs: [
      {
        q: "ファウンダーの新規登録は受付中ですか？",
        a: "いいえ、サイト経由の新規登録は終了しました。ファウンダー資格は、締め切りまでに登録し、14日以内に実際の初回同期を行ったアカウントにのみ有効です。新規アカウントは14日間の無料トライアルの後、サブスクリプションまたは買い切りが必要です。",
      },
      {
        q: "すでにファウンダーでした。永久Proライセンスは有効ですか？",
        a: "はい。ファウンダーとして永久Proライセンスを受け取った場合、そのライセンスは永久に有効です。特別な操作は必要ありません。",
      },
    ],
  },
  ko: {
    kicker: "파운더 프로그램",
    bullets: [
      { title: "기존 파운더", desc: "평생 Pro는 그대로 유지됩니다: 신규 가입 마감으로 취소되지 않습니다." },
      { title: "신규 계정", desc: "14일 무료 Pro 체험." },
      { title: "체험 종료 후", desc: "구독 또는 평생 잠금 해제로 Pro를 계속 이용." },
    ],
    faqTitle: "자주 묻는 질문",
    faqs: [
      {
        q: "파운더 신규 가입이 아직 열려 있나요?",
        a: "아니요, 사이트를 통한 신규 가입은 마감되었습니다. 파운더 자격은 마감 전에 가입하고 14일 이내에 실제 첫 동기화를 완료한 계정에만 유효합니다. 신규 계정은 14일 무료 체험 후 구독 또는 평생 잠금 해제가 필요합니다.",
      },
      {
        q: "이미 파운더였는데, 평생 Pro가 계속 유효한가요?",
        a: "네. 파운더로 평생 Pro를 받았다면 영구히 유효합니다. 별도 조치가 필요하지 않습니다.",
      },
    ],
  },
  en: {
    kicker: "Founder program",
    bullets: [
      { title: "Existing founders", desc: "Lifetime Pro, unchanged: closing new sign-ups doesn't revoke it." },
      { title: "New accounts", desc: "A free 14-day Pro trial." },
      { title: "After the trial", desc: "Subscribe or unlock lifetime to keep Pro." },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        q: "Are Founder sign-ups still open?",
        a: "No, new sign-ups through the site are closed. Founder status remains valid only for accounts already registered by the cutoff with a first verified sync within 14 days. New accounts get the 14-day free trial, then a subscription or the lifetime unlock.",
      },
      {
        q: "I was already a Founder: is my lifetime Pro still valid?",
        a: "Yes. If you received lifetime Pro as a Founder, it remains valid forever: no action needed.",
      },
    ],
  },
};
