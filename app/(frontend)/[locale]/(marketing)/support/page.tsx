import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale, getDictionary, localeAlternates } from "@/lib/i18n";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SUPPORT_FAQS } from "@/lib/content/faqs";
import { SITE_URL, REDDIT_URL, REDDIT_COMMUNITY_LIVE } from "@/lib/product-facts";
import { COMMUNITY_PLACEMENTS } from "@/lib/analytics/cta";
import { schemaLanguage } from "@/lib/seo/schema-language";
import RedditIcon from "@/components/RedditIcon";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = { it: "Supporto", en: "Support", es: "Soporte", de: "Support", pt: "Suporte", fr: "Assistance", pl: "Wsparcie", tr: "Destek", nl: "Ondersteuning", ja: "サポート", ko: "고객 지원", sv: "Support", da: "Support", no: "Support", fi: "Tuki" };
  const desc: Record<Locale, string> = {
    it: "FAQ, troubleshooting e contatti per FitMesh Sync: dati mancanti, batteria, sync offline, cambio telefono, prezzi. Risposte rapide, contatti inclusi.",
    en: "FAQ and troubleshooting for FitMesh Sync: missing data, battery use, offline syncing, phone switching, pricing, private servers. Contact options included.",
    es: "Preguntas frecuentes, solución de problemas y contacto para FitMesh Sync. Respuestas rápidas a las dudas más habituales.",
    de: "Häufige Fragen, Fehlerbehebung und Kontakt für FitMesh Sync. Schnelle Antworten auf die häufigsten Probleme.",
    pt: "Perguntas frequentes, solução de problemas e contato do FitMesh Sync. Respostas rápidas para as dúvidas mais comuns.",
    fr: "FAQ, dépannage et contact pour FitMesh Sync. Réponses rapides aux questions les plus fréquentes.",
    pl: "FAQ, rozwiazywanie problemow i kontakt z FitMesh Sync. Szybkie odpowiedzi na najczestsze pytania.",
    tr: "FitMesh Sync icin SSS, sorun giderme ve iletisim bilgileri. En sik sorulan sorulara hizli cevaplar.",
    nl: "FAQ, probleemoplossing en contact voor FitMesh Sync. Snelle antwoorden op de meest gestelde vragen.",
    ja: "FitMesh SyncのFAQ、トラブルシューティング、お問い合わせ。よくある質問への迅速な回答。",
    ko: "FitMesh Sync FAQ, 문제 해결 및 연락처. 가장 자주 묻는 질문에 대한 빠른 답변.",
    sv: "Vanliga frågor, felsökning och kontakt för FitMesh Sync. Snabba svar på de vanligaste frågorna.",
    da: "Ofte stillede spørgsmål, fejlfinding og kontakt til FitMesh Sync. Hurtige svar på de mest almindelige spørgsmål.",
    no: "Vanlige spørsmål, feilsøking og kontakt for FitMesh Sync. Raske svar på de vanligste spørsmålene.",
    fi: "Usein kysytyt kysymykset, vianmääritys ja yhteystiedot FitMesh Syncille. Nopeat vastaukset yleisimpiin kysymyksiin.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/support`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/support`),
    },
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const faqs = SUPPORT_FAQS[lc];

  // Structured data — FAQPage for Google rich result
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: schemaLanguage(lc),
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const subtitle = lc === "en"
    ? "The answers to the most common issues. If you can't find what you're looking for,"
    : lc === "es"
    ? "Respuestas a las dudas más habituales. Si no encuentras lo que buscas,"
    : lc === "de"
    ? "Antworten auf die häufigsten Fragen. Wenn du nicht findest, was du suchst,"
    : lc === "pt"
    ? "Respostas para as dúvidas mais comuns. Se você não encontrar o que procura,"
    : lc === "fr"
    ? "Les réponses aux questions les plus fréquentes. Si vous ne trouvez pas ce que vous cherchez,"
    : lc === "nl"
    ? "De antwoorden op de meest voorkomende vragen. Als je niet vindt wat je zoekt,"
    : lc === "ja"
    ? "よくある問題への回答です。お探しの内容が見つからない場合は、"
    : lc === "ko"
    ? "일반적인 문제들에 대한 답변입니다. 찾고 계신 것이 없다면,"
    : "Le risposte ai problemi più comuni. Se non trovi quello che cerchi,";

  const writeUsLabel = lc === "en"
    ? "write to support@fitmesh.fit"
    : lc === "es"
    ? "escríbenos a support@fitmesh.fit"
    : lc === "de"
    ? "schreib uns an support@fitmesh.fit"
    : lc === "pt"
    ? "escreva para support@fitmesh.fit"
    : lc === "fr"
    ? "écrivez-nous à support@fitmesh.fit"
    : lc === "nl"
    ? "schrijf ons op support@fitmesh.fit"
    : lc === "ja"
    ? "support@fitmesh.fitまでご連絡ください"
    : lc === "ko"
    ? "support@fitmesh.fit으로 문의해 주세요"
    : "scrivici a support@fitmesh.fit";

  const moreQuestionsHeading = lc === "en"
    ? "Have another question?"
    : lc === "es"
    ? "¿Tienes alguna otra duda?"
    : lc === "de"
    ? "Noch eine Frage?"
    : lc === "pt"
    ? "Tem outra dúvida?"
    : lc === "fr"
    ? "Vous avez une autre question ?"
    : lc === "nl"
    ? "Heb je nog een andere vraag?"
    : lc === "ja"
    ? "別の質問がありますか？"
    : lc === "ko"
    ? "다른 질문이 있으신가요?"
    : "Hai un'altra domanda?";
  const moreQuestionsDesc = lc === "en"
    ? "Drop us a line. We respond personally within 48 hours (usually much sooner)."
    : lc === "es"
    ? "Escríbenos. Respondemos personalmente en menos de 48 horas (normalmente mucho antes)."
    : lc === "de"
    ? "Schreib uns. Wir antworten persönlich innerhalb von 48 Stunden (meistens viel früher)."
    : lc === "pt"
    ? "Fale com a gente. Respondemos pessoalmente em até 48 horas (geralmente muito antes)."
    : lc === "fr"
    ? "Contactez-nous. Nous répondons personnellement en moins de 48 heures (souvent bien avant)."
    : lc === "nl"
    ? "Schrijf ons. We reageren persoonlijk binnen 48 uur (meestal veel eerder)."
    : lc === "ja"
    ? "ご連絡ください。48時間以内（通常はもっと早く）に個人的にご回答いたします。"
    : lc === "ko"
    ? "문의해 주세요. 48시간 이내(보통 훨씬 빠르게)에 직접 답변 드리겠습니다."
    : "Scrivici. Rispondiamo personalmente entro 48 ore (di solito molto prima).";

  const ctaPrimary = lc === "en"
    ? "Email support@fitmesh.fit"
    : lc === "es"
    ? "Escribe a support@fitmesh.fit"
    : lc === "de"
    ? "Schreib an support@fitmesh.fit"
    : lc === "pt"
    ? "Escreva para support@fitmesh.fit"
    : lc === "fr"
    ? "Écrire à support@fitmesh.fit"
    : lc === "nl"
    ? "Schrijf naar support@fitmesh.fit"
    : lc === "ja"
    ? "support@fitmesh.fitにメールする"
    : lc === "ko"
    ? "support@fitmesh.fit에 이메일 보내기"
    : "Scrivi a support@fitmesh.fit";

  const crumbName = lc === "en" ? "Support" : lc === "es" ? "Soporte" : lc === "de" ? "Support" : lc === "pt" ? "Suporte" : lc === "fr" ? "Assistance" : lc === "nl" ? "Ondersteuning" : lc === "ja" ? "サポート" : lc === "ko" ? "고객 지원" : "Supporto";

  // Solo IT/EN tradotti per ora (P0.4D, fase 5): le altre lingue ricadono
  // sull'inglese invece di lasciare il link assente, come gia' fa altrove
  // questo file (es. moreQuestionsHeading non ha varianti per pl/tr/sv/da/no/fi).
  const deleteAccountLinkText = lc === "it"
    ? "Vuoi eliminare il tuo account? Vai alla pagina dedicata"
    : "Want to delete your account? Go to the dedicated page";
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ name: crumbName, path: `/${lc}/support` }]} locale={lc} />
      <JsonLd data={faqJsonLd} />
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.nav.support}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {t.legal.support_title}
        </h1>
        <p className="mt-3 text-text-secondary">
          {subtitle}{" "}
          <a
            href="mailto:support@fitmesh.fit"
            className="text-brand-aqua hover:text-brand-blue underline underline-offset-4"
          >
            {writeUsLabel}
          </a>
          .
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/delete-account"
            className="text-brand-aqua hover:text-brand-blue underline underline-offset-4"
          >
            {deleteAccountLinkText}
          </Link>
        </p>
        {/* r/FitMesh — stessa etichetta l10n del Footer (t.footer.links.community,
            dizionario condiviso), stesso gate REDDIT_COMMUNITY_LIVE e stesso
            rel. Vedi components/Footer.tsx per la motivazione completa. */}
        {REDDIT_COMMUNITY_LIVE && (
          <p className="mt-2 text-sm">
            {/* P1.9 FASE 7: icona ufficiale come asset locale, sempre
                accanto al testo "r/FitMesh — ..." già presente — mai
                icon-only. Stesso href/target/rel/data-cta-placement. */}
            <a
              href={REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-cta-placement={COMMUNITY_PLACEMENTS.support}
              className="inline-flex items-center gap-1.5 py-0.5 text-brand-aqua hover:text-brand-blue underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua rounded-sm"
            >
              <RedditIcon className="h-4 w-4 flex-shrink-0" />
              r/FitMesh — {t.footer.links.community}
            </a>
          </p>
        )}
      </header>

      <section className="space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-[14px] border border-divider bg-bg-card/50 p-5 open:bg-bg-elevated/80 transition"
          >
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-text-primary font-medium">
              <span>{faq.q}</span>
              <span aria-hidden className="mt-1 text-text-muted group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-text-secondary text-sm leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </section>

      <section className="mt-16">
        <div className="rounded-[14px] border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-8">
          <h2 className="font-display text-2xl font-semibold text-text-primary">
            {moreQuestionsHeading}
          </h2>
          <p className="mt-3 text-text-secondary">{moreQuestionsDesc}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="mailto:support@fitmesh.fit?subject=FitMesh%20Sync"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill btn-cta text-sm"
            >
              {ctaPrimary}
            </a>
            <a
              href="mailto:hello@fitmesh.fit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill border border-divider text-text-primary hover:bg-white/5 transition"
            >
              hello@fitmesh.fit
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
