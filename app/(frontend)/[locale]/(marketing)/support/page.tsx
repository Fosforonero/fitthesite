import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale, ogLocale, getDictionary, localeAlternates } from "@/lib/i18n";
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
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lc}/support`,
      title: titles[lc],
      description: desc[lc],
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: {
      card: "summary",
      title: titles[lc],
      description: desc[lc],
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

  const subtitles: Record<Locale, string> = {
    it: "Le risposte ai problemi più comuni. Se non trovi quello che cerchi,",
    en: "The answers to the most common issues. If you can't find what you're looking for,",
    es: "Respuestas a las dudas más habituales. Si no encuentras lo que buscas,",
    de: "Antworten auf die häufigsten Fragen. Wenn du nicht findest, was du suchst,",
    pt: "Respostas para as dúvidas mais comuns. Se você não encontrar o que procura,",
    fr: "Les réponses aux questions les plus fréquentes. Si vous ne trouvez pas ce que vous cherchez,",
    nl: "De antwoorden op de meest voorkomende vragen. Als je niet vindt wat je zoekt,",
    ja: "よくある問題への回答です。お探しの内容が見つからない場合は、",
    ko: "일반적인 문제들에 대한 답변입니다. 찾고 계신 것이 없다면,",
    pl: "Odpowiedzi na najczęstsze pytania. Jeśli nie znajdujesz tego, czego szukasz,",
    tr: "En sık karşılaşılan sorunların yanıtları. Aradığınızı bulamadıysanız,",
    sv: "Svaren på de vanligaste frågorna. Om du inte hittar det du söker,",
    da: "Svarene på de mest almindelige spørgsmål. Hvis du ikke finder det, du leder efter,",
    no: "Svarene på de vanligste spørsmålene. Hvis du ikke finner det du leter etter,",
    fi: "Vastaukset yleisimpiin kysymyksiin. Jos et löydä etsimääsi,",
  };

  const writeUsLabels: Record<Locale, string> = {
    it: "scrivici a support@fitmesh.fit",
    en: "write to support@fitmesh.fit",
    es: "escríbenos a support@fitmesh.fit",
    de: "schreib uns an support@fitmesh.fit",
    pt: "escreva para support@fitmesh.fit",
    fr: "écrivez-nous à support@fitmesh.fit",
    nl: "schrijf ons op support@fitmesh.fit",
    ja: "support@fitmesh.fitまでご連絡ください",
    ko: "support@fitmesh.fit으로 문의해 주세요",
    pl: "napisz na support@fitmesh.fit",
    tr: "support@fitmesh.fit adresine yazın",
    sv: "skriv till support@fitmesh.fit",
    da: "skriv til support@fitmesh.fit",
    no: "skriv til support@fitmesh.fit",
    fi: "kirjoita osoitteeseen support@fitmesh.fit",
  };

  const moreQuestionsHeadings: Record<Locale, string> = {
    it: "Hai un'altra domanda?",
    en: "Have another question?",
    es: "¿Tienes alguna otra duda?",
    de: "Noch eine Frage?",
    pt: "Tem outra dúvida?",
    fr: "Vous avez une autre question ?",
    nl: "Heb je nog een andere vraag?",
    ja: "別の質問がありますか？",
    ko: "다른 질문이 있으신가요?",
    pl: "Masz inne pytanie?",
    tr: "Başka bir sorunuz mu var?",
    sv: "Har du en annan fråga?",
    da: "Har du et andet spørgsmål?",
    no: "Har du et annet spørsmål?",
    fi: "Onko sinulla toinen kysymys?",
  };

  const moreQuestionsDescs: Record<Locale, string> = {
    it: "Scrivici. Rispondiamo personalmente entro 48 ore (di solito molto prima).",
    en: "Drop us a line. We respond personally within 48 hours (usually much sooner).",
    es: "Escríbenos. Respondemos personalmente en menos de 48 horas (normalmente mucho antes).",
    de: "Schreib uns. Wir antworten persönlich innerhalb von 48 Stunden (meistens viel früher).",
    pt: "Fale com a gente. Respondemos pessoalmente em até 48 horas (geralmente muito antes).",
    fr: "Contactez-nous. Nous répondons personnellement en moins de 48 heures (souvent bien avant).",
    nl: "Schrijf ons. We reageren persoonlijk binnen 48 uur (meestal veel eerder).",
    ja: "ご連絡ください。48時間以内（通常はもっと早く）に個人的にご回答いたします。",
    ko: "문의해 주세요. 48시간 이내(보통 훨씬 빠르게)에 직접 답변 드리겠습니다.",
    pl: "Napisz do nas. Odpowiadamy osobiście w ciągu 48 godzin (zazwyczaj znacznie szybciej).",
    tr: "Bize yazın. 48 saat içinde (genellikle çok daha erken) bizzat yanıt veriyoruz.",
    sv: "Skriv till oss. Vi svarar personligen inom 48 timmar (oftast mycket tidigare).",
    da: "Skriv til os. Vi svarer personligt inden for 48 timer (normalt meget hurtigere).",
    no: "Skriv til oss. Vi svarer personlig innen 48 timer (vanligvis mye raskere).",
    fi: "Kirjoita meille. Vastaamme henkilökohtaisesti 48 tunnin sisällä (yleensä paljon nopeammin).",
  };

  const ctaPrimaries: Record<Locale, string> = {
    it: "Scrivi a support@fitmesh.fit",
    en: "Email support@fitmesh.fit",
    es: "Escribe a support@fitmesh.fit",
    de: "Schreib an support@fitmesh.fit",
    pt: "Escreva para support@fitmesh.fit",
    fr: "Écrire à support@fitmesh.fit",
    nl: "Schrijf naar support@fitmesh.fit",
    ja: "support@fitmesh.fitにメールする",
    ko: "support@fitmesh.fit에 이메일 보내기",
    pl: "Napisz na support@fitmesh.fit",
    tr: "support@fitmesh.fit adresine e-posta gönderin",
    sv: "Mejla support@fitmesh.fit",
    da: "Send e-mail til support@fitmesh.fit",
    no: "Send e-post til support@fitmesh.fit",
    fi: "Lähetä sähköpostia osoitteeseen support@fitmesh.fit",
  };

  const deleteAccountLinkTexts: Record<Locale, string> = {
    it: "Vuoi eliminare il tuo account? Vai alla pagina dedicata",
    en: "Want to delete your account? Go to the dedicated page",
    es: "¿Quieres eliminar tu cuenta? Ve a la página dedicada",
    de: "Möchtest du dein Konto löschen? Zur entsprechenden Seite",
    pt: "Deseja excluir sua conta? Vá para a página dedicada",
    fr: "Vous souhaitez supprimer votre compte ? Accédez à la page dédiée",
    nl: "Wil je je account verwijderen? Ga naar de speciale pagina",
    ja: "アカウントを削除しますか？専用ページへ移動",
    ko: "계정을 삭제하시겠습니까? 전용 페이지로 이동",
    pl: "Chcesz usunąć swoje konto? Przejdź do dedykowanej strony",
    tr: "Hesabınızı silmek mi istiyorsunuz? Özel sayfaya gidin",
    sv: "Vill du radera ditt konto? Gå till den särskilda sidan",
    da: "Vil du slette din konto? Gå til den dedikerede side",
    no: "Vil du slette kontoen din? Gå til den dedikerte siden",
    fi: "Haluatko poistaa tilisi? Siirry erilliselle sivulle",
  };

  const subtitle = subtitles[lc];
  const writeUsLabel = writeUsLabels[lc];
  const moreQuestionsHeading = moreQuestionsHeadings[lc];
  const moreQuestionsDesc = moreQuestionsDescs[lc];
  const ctaPrimary = ctaPrimaries[lc];
  const crumbName = t.nav.support || "Support";
  const deleteAccountLinkText = deleteAccountLinkTexts[lc];
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
        {/* Nelle altre 13 lingue preserviamo la posizione originale di Reddit nell'header per non introdurre testo inglese nel footer */}
        {REDDIT_COMMUNITY_LIVE && lc !== "it" && lc !== "en" && (
          <p className="mt-2 text-sm">
            <a
              href={REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-cta-placement={COMMUNITY_PLACEMENTS.support}
              className="inline-flex items-center gap-1.5 py-3 -my-3 text-brand-aqua hover:text-brand-blue underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua rounded-sm"
            >
              <RedditIcon className="h-4 w-4 flex-shrink-0" />
              r/FitMesh — {t.footer.links.community}
            </a>
          </p>
        )}
      </header>

      {/* Ingresso evidente guida Android Health Connect (disponibile in it ed en) */}
      {(lc === "it" || lc === "en") && (
        <section className="mb-8 rounded-[16px] border border-brand-aqua/40 bg-gradient-to-r from-brand-aqua/10 via-bg-card to-bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-aqua font-semibold">
              {lc === "it" ? "Guida in primo piano" : "Featured Guide"}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-text-primary">
              {lc === "it"
                ? "Configurazione Android: Connessione Salute e prima sincronizzazione"
                : "Android Setup: Health Connect and first sync"}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {lc === "it"
                ? "Istruzioni passo-passo con schermate reali per verificare l'app del tuo orologio, concedere i permessi di lettura ed eseguire la prima sincronizzazione."
                : "Step-by-step instructions with verified screenshots to check your wearable app, grant read permissions, and complete your first sync."}
            </p>
          </div>
          <Link
            href={`/${lc}/support/health-connect`}
            className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-pill btn-cta text-xs sm:text-sm whitespace-nowrap"
          >
            {lc === "it" ? "Apri la guida passo-passo" : "Open step-by-step guide"}
          </Link>
        </section>
      )}

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

      {/* Zona secondaria Community: attiva esclusivamente per IT ed EN */}
      {REDDIT_COMMUNITY_LIVE && (lc === "it" || lc === "en") && (
        <section className="mt-12 pt-8 border-t border-divider text-left">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-semibold">
            Community
          </p>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {lc === "it"
              ? "Vuoi discutere di configurazioni, modelli di orologi e suggerimenti con altri utenti? Unisciti alla community su Reddit:"
              : "Looking to discuss device setups, wearable models, and feedback with fellow users? Join our Reddit community:"}
          </p>
          <div className="mt-3">
            <a
              href={REDDIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-cta-placement={COMMUNITY_PLACEMENTS.support}
              className="inline-flex items-center gap-2 py-3 px-3 rounded-lg border border-divider bg-bg-card hover:bg-bg-elevated text-brand-aqua hover:text-brand-blue text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-aqua min-h-[44px]"
            >
              <RedditIcon className="h-4 w-4 flex-shrink-0" />
              <span>r/FitMesh - {t.footer.links.community}</span>
            </a>
          </div>
        </section>
      )}
    </article>
  );
}
