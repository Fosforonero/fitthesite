import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import {
  localizedBlogSlug,
  canonicalFromBlogUrl,
} from "@/lib/blog/slug-i18n";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { BlogRenderer, renderMarkdownInline } from "@/components/blog/BlogRenderer";
import { ArticleMeta } from "@/components/blog/ArticleMeta";
import { coverSrc, COVER_W, COVER_H } from "@/lib/blog/covers";
import { locales, type Locale, ogLocale } from "@/lib/i18n";
import { categoryLabel, tl, tll } from "@/lib/blog/types";
import {
  getBlogPostBySlug,
  getBlogSlugs,
  getBlogPosts,
  getRelatedPosts,
} from "@/lib/blog/payload-source";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import type { BlogPost } from "@/lib/blog/types";

const SITE_URL = "https://www.fitmesh.fit";

/**
 * Author info — Person Matteo Pizzi.
 *
 * E-E-A-T (Experience-Expertise-Authoritativeness-Trustworthiness) e' un
 * fattore SEO critico per i topic YMYL ("Your Money or Your Life") come
 * salute/fitness. Google penalizza articoli salute con `author: Organization`
 * generico; preferisce `author: Person` con bio reale + social profili
 * verificati (sameAs).
 *
 * Per cambiare autore (es. ospiti): override `post.authorOverride` nel
 * blog data model (TODO se serve).
 */
const AUTHOR = {
  name: "Matteo Pizzi",
  jobTitle: "Founder & Solo Dev, FitMesh Sync · Fosforonero",
  bioIt:
    "Sviluppatore software italiano. Ho costruito FitMesh Sync per riempire il vuoto tra il mio smartwatch e una vera dashboard personale. Privacy-first, indie, server EU.",
  bioEn:
    "Italian software developer. I built FitMesh Sync to fill the gap between my smartwatch and a real personal dashboard. Privacy-first, indie, EU servers.",
  bioEs:
    "Desarrollador de software italiano. Construí FitMesh Sync para cubrir el espacio entre mi smartwatch y un panel personal real. Privacidad ante todo, indie, servidores en la UE.",
  bioDe:
    "Italienischer Softwareentwickler. Ich habe FitMesh Sync entwickelt, um die Lücke zwischen meinem Smartwatch und einem echten persönlichen Dashboard zu schließen. Datenschutz zuerst, indie, EU-Server.",
  bioPt:
    "Desenvolvedor de software italiano. Criei o FitMesh Sync para preencher a lacuna entre o meu smartwatch e um painel pessoal de verdade. Privacidade em primeiro lugar, indie, servidores na UE.",
  bioFr:
    "Développeur de logiciels italien. J'ai créé FitMesh Sync pour combler le fossé entre ma montre connectée et un vrai tableau de bord personnel. Confidentialité avant tout, indie, serveurs UE.",
  bioPl:
    "Włoski programista. Stworzyłem FitMesh Sync, aby wypełnić lukę między moim smartwatchem a prawdziwym osobistym dashboardem. Prywatność na pierwszym miejscu, indie, serwery w UE.",
  bioTr:
    "İtalyan yazılım geliştirici. FitMesh Sync'i akıllı saatim ile gerçek bir kişisel kontrol paneli arasındaki boşluğu doldurmak için kurdum. Gizlilik odaklı, bağımsız, AB sunucuları.",
  bioNl:
    "Italiaanse softwareontwikkelaar. Ik bouwde FitMesh Sync om de kloof tussen mijn smartwatch en een echt persoonlijk dashboard te overbruggen. Privacy-first, indie, EU-servers.",
  bioJa:
    "イタリア人ソフトウェア開発者。スマートウォッチと本物のパーソナルダッシュボードのギャップを埋めるためにFitMesh Syncを構築しました。プライバシーファースト、インディー、EUサーバー。",
  bioko:
    "이탈리아 소프트웨어 개발자. 스마트워치와 진정한 개인 대시보드 사이의 격차를 메우기 위해 FitMesh Sync를 구축했습니다. 개인정보 보호 우선, 독립적, EU 서버.",
  url: `${SITE_URL}/it/about`,
  // sameAs: profili pubblici per verifica autorevolezza. Vuoto = aggiungi
  // LinkedIn/Twitter quando disponibili (Matteo ha LinkedIn personale?).
  sameAs: [
    "https://www.fosforonero.com",
  ],
};
// Publisher Organization name (per JSON-LD Article.publisher).
const PUBLISHER_NAME = "FitMesh Sync";

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.flatMap((slug) =>
    locales.map((locale) => ({ locale, slug: localizedBlogSlug(slug, locale) })),
  );
}

/** hreflang alternates: ogni lingua → il suo slug localizzato; x-default = IT. */
function blogLanguages(post: BlogPost): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of locales) {
    // Salta le varianti nordiche non tradotte (sono `noindex`): l'hreflang non
    // deve puntare a pagine escluse dall'indice. Stessa fonte di verità di
    // robots e sitemap.
    if (!isBlogVariantIndexable(post, l)) continue;
    langs[l] = `${SITE_URL}/${l}/blog/${localizedBlogSlug(post.slug, l)}`;
  }
  langs["x-default"] = `${SITE_URL}/it/blog/${post.slug}`;
  return langs;
}

/**
 * Risolve lo slug d'URL (localizzato) → post. Se l'URL usa il vecchio slug IT su
 * un locale non-IT (link/indice storici), ritorna `redirectTo` con lo slug
 * localizzato corretto (308 permanente, SEO-safe).
 */
async function resolveBlogPost(urlSlug: string, lc: Locale) {
  const canonical = canonicalFromBlogUrl(urlSlug, lc);
  if (canonical) {
    const post = await getBlogPostBySlug(canonical);
    if (post) return { post, redirectTo: null as string | null };
  }
  const post = await getBlogPostBySlug(urlSlug);
  if (!post) return { post: null, redirectTo: null as string | null };
  const correct = localizedBlogSlug(urlSlug, lc);
  return {
    post,
    redirectTo: correct !== urlSlug ? `/${lc}/blog/${correct}` : null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const lc = locale as Locale;
  const { post } = await resolveBlogPost(slug, lc);
  if (!post) return {};

  const path = `/${lc}/blog/${localizedBlogSlug(post.slug, lc)}`;
  const title = tl(post.hero.title, lc);
  const description = tl(post.metaDescription, lc);
  const secondaryKw = tll(
    { it: post.secondaryKeywords.it, en: post.secondaryKeywords.en },
    lc,
  );
  const keywords = [tl(post.primaryKeyword, lc), ...secondaryKw].join(", ");

  // Brand suffix corto (10c) per stare entro 65c totali raccomandati Bing/Google.
  // Vedi fitmesh-growth SKILL → publishing pipeline step 1 (title length guardrail).
  return {
    title: `${title} · FitMesh`,
    description,
    keywords,
    robots: isBlogVariantIndexable(post, lc)
      ? undefined
      : { index: false, follow: true },
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: blogLanguages(post),
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [AUTHOR.name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const I18N = {
  it: {
    backToBlog: "← Tutti gli articoli",
    pillarLabel: "Guida principale",
    readMin: (m: number) => `${m} min di lettura`,
    publishedOn: "Pubblicato",
    updated: "Aggiornato",
    metaCategory: "Categoria",
    metaReadTime: "Lettura",
    metaDate: "Data",
    metaShare: "Condividi",
    metaCopied: "Copiato!",
    metaCopy: "Copia link",
    metaViews: "Visualizzazioni",
    metaShares: "Condivisioni",
    tldrLabel: "In breve",
    faqHeading: "Domande frequenti",
    relatedHeading: "Continua a leggere",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync è un prodotto indipendente. ${brands.join(", ")}${brands.length > 1 ? " sono marchi" : " è un marchio"} dei rispettivi proprietari. Questo articolo non implica affiliazione né sponsorizzazione.`,
    medicalDisclaimerHeading: "Avviso medico",
    medicalDisclaimer:
      "Le informazioni in questo articolo hanno scopo informativo e non sostituiscono il parere del tuo medico, farmacista o professionista sanitario. FitMesh Sync è un'app fitness/wellness, non un dispositivo medico, e non diagnostica né cura patologie. In caso di sintomi, dubbi clinici o decisioni terapeutiche consulta sempre il tuo medico di base.",
  },
  en: {
    backToBlog: "← All articles",
    pillarLabel: "Main guide",
    readMin: (m: number) => `${m} min read`,
    publishedOn: "Published",
    updated: "Updated",
    metaCategory: "Category",
    metaReadTime: "Reading time",
    metaDate: "Date",
    metaShare: "Share",
    metaCopied: "Copied!",
    metaCopy: "Copy link",
    metaViews: "Views",
    metaShares: "Shares",
    tldrLabel: "TL;DR",
    faqHeading: "Frequently asked questions",
    relatedHeading: "Keep reading",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync is an independent product. ${brands.join(", ")} ${brands.length > 1 ? "are trademarks" : "is a trademark"} of their respective owners. This article implies no affiliation or sponsorship.`,
    medicalDisclaimerHeading: "Medical disclaimer",
    medicalDisclaimer:
      "The information in this article is for informational purposes only and does not replace advice from your physician, pharmacist or healthcare professional. FitMesh Sync is a fitness/wellness app, not a medical device, and does not diagnose or treat any conditions. For symptoms, clinical questions or treatment decisions always consult your primary care physician.",
  },
  es: {
    backToBlog: "← Todos los artículos",
    pillarLabel: "Guía principal",
    readMin: (m: number) => `${m} min de lectura`,
    publishedOn: "Publicado",
    updated: "Actualizado",
    metaCategory: "Categoría",
    metaReadTime: "Tiempo de lectura",
    metaDate: "Fecha",
    metaShare: "Compartir",
    metaCopied: "¡Copiado!",
    metaCopy: "Copiar enlace",
    metaViews: "Visitas",
    metaShares: "Compartidos",
    tldrLabel: "En resumen",
    faqHeading: "Preguntas frecuentes",
    relatedHeading: "Sigue leyendo",
    disclaimerHeading: "Aviso legal",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync es un producto independiente. ${brands.join(", ")} ${brands.length > 1 ? "son marcas comerciales" : "es una marca comercial"} de sus respectivos propietarios. Este artículo no implica ninguna afiliación ni patrocinio.`,
    medicalDisclaimerHeading: "Aviso de salud",
    medicalDisclaimer:
      "La información de este artículo tiene fines informativos y no reemplaza el consejo de tu médico, farmacéutico u otro profesional de la salud. FitMesh Sync es una app de fitness y bienestar, no un dispositivo médico, y no diagnostica ni trata enfermedades. Ante síntomas, dudas clínicas o decisiones de tratamiento, consulta siempre a tu médico.",
  },
  de: {
    backToBlog: "← Alle Artikel",
    pillarLabel: "Hauptartikel",
    readMin: (m: number) => `${m} Min. Lesezeit`,
    publishedOn: "Veröffentlicht",
    updated: "Aktualisiert",
    metaCategory: "Kategorie",
    metaReadTime: "Lesezeit",
    metaDate: "Datum",
    metaShare: "Teilen",
    metaCopied: "Kopiert!",
    metaCopy: "Link kopieren",
    metaViews: "Aufrufe",
    metaShares: "Geteilt",
    tldrLabel: "Kurzfassung",
    faqHeading: "Häufig gestellte Fragen",
    relatedHeading: "Weiterlesen",
    disclaimerHeading: "Haftungsausschluss",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync ist ein unabhängiges Produkt. ${brands.join(", ")} ${brands.length > 1 ? "sind Marken" : "ist eine Marke"} der jeweiligen Eigentümer. Dieser Artikel impliziert keine Zugehörigkeit oder Sponsoring.`,
    medicalDisclaimerHeading: "Gesundheitshinweis",
    medicalDisclaimer:
      "Die Informationen in diesem Artikel dienen ausschließlich zu Informationszwecken und ersetzen nicht den Rat Ihres Arztes, Apothekers oder eines anderen Gesundheitsfachmanns. FitMesh Sync ist eine Fitness- und Wellness-App, kein Medizinprodukt, und stellt keine Diagnosen und behandelt keine Erkrankungen. Bei Symptomen, gesundheitlichen Fragen oder Therapieentscheidungen wenden Sie sich bitte immer an Ihren Arzt.",
  },
  pt: {
    backToBlog: "← Todos os artigos",
    pillarLabel: "Artigo principal",
    readMin: (m: number) => `${m} min de leitura`,
    publishedOn: "Publicado",
    updated: "Atualizado",
    metaCategory: "Categoria",
    metaReadTime: "Tempo de leitura",
    metaDate: "Data",
    metaShare: "Compartilhar",
    metaCopied: "Copiado!",
    metaCopy: "Copiar link",
    metaViews: "Visualizações",
    metaShares: "Compartilhamentos",
    tldrLabel: "Resumo",
    faqHeading: "Perguntas frequentes",
    relatedHeading: "Continue lendo",
    disclaimerHeading: "Aviso legal",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync é um produto independente. ${brands.join(", ")} ${brands.length > 1 ? "são marcas registradas" : "é uma marca registrada"} de seus respectivos proprietários. Este artigo não implica nenhuma afiliação ou patrocínio.`,
    medicalDisclaimerHeading: "Aviso de saúde",
    medicalDisclaimer:
      "As informações deste artigo têm fins informativos e não substituem o aconselhamento do seu médico, farmacêutico ou profissional de saúde. FitMesh Sync é um app de fitness e bem-estar, não um dispositivo médico, e não diagnostica nem trata condições de saúde. Diante de sintomas, dúvidas ou decisões de tratamento, consulte sempre o seu médico.",
  },
  fr: {
    backToBlog: "← Tous les articles",
    pillarLabel: "Guide principal",
    readMin: (m: number) => `${m} min de lecture`,
    publishedOn: "Publié le",
    updated: "Mis à jour",
    metaCategory: "Catégorie",
    metaReadTime: "Temps de lecture",
    metaDate: "Date",
    metaShare: "Partager",
    metaCopied: "Copié !",
    metaCopy: "Copier le lien",
    metaViews: "Vues",
    metaShares: "Partages",
    tldrLabel: "En bref",
    faqHeading: "Questions fréquentes",
    relatedHeading: "Continuer la lecture",
    disclaimerHeading: "Avis légal",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync est un produit indépendant. ${brands.join(", ")} ${brands.length > 1 ? "sont des marques" : "est une marque"} de leurs propriétaires respectifs. Cet article n'implique aucune affiliation ni parrainage.`,
    medicalDisclaimerHeading: "Avis de santé",
    medicalDisclaimer:
      "Les informations contenues dans cet article sont fournies à titre informatif uniquement et ne remplacent pas l'avis de votre médecin, pharmacien ou professionnel de santé. FitMesh Sync est une application fitness et bien-être, pas un dispositif médical, et ne pose pas de diagnostic ni ne traite de pathologie. En cas de symptômes, de questions ou de décisions thérapeutiques, consultez toujours votre médecin.",
  },
  pl: {
    backToBlog: "← Wszystkie artykuły",
    pillarLabel: "Przewodnik główny",
    readMin: (m: number) => `${m} min czytania`,
    publishedOn: "Opublikowano",
    updated: "Zaktualizowano",
    metaCategory: "Kategoria",
    metaReadTime: "Czas czytania",
    metaDate: "Data",
    metaShare: "Udostępnij",
    metaCopied: "Skopiowano!",
    metaCopy: "Kopiuj link",
    metaViews: "Wyświetlenia",
    metaShares: "Udostępnienia",
    tldrLabel: "W skrócie",
    faqHeading: "Często zadawane pytania",
    relatedHeading: "Czytaj dalej",
    disclaimerHeading: "Zastrzeżenie",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync jest niezależnym produktem. ${brands.join(", ")} ${brands.length > 1 ? "są znakami towarowymi" : "jest znakiem towarowym"} swoich właścicieli. Niniejszy artykuł nie sugeruje żadnej afiliacji ani sponsorowania.`,
    medicalDisclaimerHeading: "Informacja zdrowotna",
    medicalDisclaimer:
      "Informacje zawarte w tym artykule mają charakter wyłącznie informacyjny i nie zastępują porady lekarza, farmaceuty ani innego specjalisty ds. zdrowia. FitMesh Sync to aplikacja fitness i wellness, a nie wyrób medyczny. Nie diagnozuje ani nie leczy żadnych schorzeń. W razie objawów, wątpliwości lub decyzji dotyczących leczenia zawsze konsultuj się ze swoim lekarzem.",
  },
  tr: {
    backToBlog: "← Tüm makaleler",
    pillarLabel: "Ana rehber",
    readMin: (m: number) => `${m} dk okuma`,
    publishedOn: "Yayınlandı",
    updated: "Güncellendi",
    metaCategory: "Kategori",
    metaReadTime: "Okuma süresi",
    metaDate: "Tarih",
    metaShare: "Paylaş",
    metaCopied: "Kopyalandı!",
    metaCopy: "Bağlantıyı kopyala",
    metaViews: "Görüntülenme",
    metaShares: "Paylaşım",
    tldrLabel: "Kısaca",
    faqHeading: "Sık sorulan sorular",
    relatedHeading: "Okumaya devam et",
    disclaimerHeading: "Sorumluluk reddi",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync bağımsız bir üründür. ${brands.join(", ")} ${brands.length > 1 ? "ilgili sahiplerinin ticari markalarıdır" : "ilgili sahibinin ticari markasıdır"}. Bu makale herhangi bir ortaklık veya sponsorluk içermez.`,
    medicalDisclaimerHeading: "Sağlık bildirimi",
    medicalDisclaimer:
      "Bu makaledeki bilgiler yalnızca genel bilgilendirme amaçlıdır ve doktorunuzun, eczacınızın veya sağlık profesyonelinizin tavsiyesinin yerini tutmaz. FitMesh Sync bir fitness ve wellness uygulamasıdır; tıbbi cihaz değildir ve herhangi bir hastalığı teşhis etmez ya da tedavi etmez. Belirtiler, klinik sorular veya tedavi kararları için her zaman doktorunuza danışın.",
  },
  nl: {
    backToBlog: "← Alle artikelen",
    pillarLabel: "Hoofdgids",
    readMin: (m: number) => `${m} min lezen`,
    publishedOn: "Gepubliceerd",
    updated: "Bijgewerkt",
    metaCategory: "Categorie",
    metaReadTime: "Leestijd",
    metaDate: "Datum",
    metaShare: "Delen",
    metaCopied: "Gekopieerd!",
    metaCopy: "Link kopiëren",
    metaViews: "Weergaven",
    metaShares: "Keer gedeeld",
    tldrLabel: "Samenvatting",
    faqHeading: "Veelgestelde vragen",
    relatedHeading: "Verder lezen",
    disclaimerHeading: "Disclaimer",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync is een onafhankelijk product. ${brands.join(", ")} ${brands.length > 1 ? "zijn handelsmerken" : "is een handelsmerk"} van hun respectieve eigenaren. Dit artikel impliceert geen affiliatie of sponsoring.`,
    medicalDisclaimerHeading: "Medische disclaimer",
    medicalDisclaimer:
      "De informatie in dit artikel is uitsluitend voor informatieve doeleinden en vervangt niet het advies van uw arts, apotheker of andere zorgverlener. FitMesh Sync is een fitness- en welzijnsapp, geen medisch hulpmiddel, en stelt geen diagnoses en behandelt geen aandoeningen. Raadpleeg bij symptomen, klinische vragen of behandelingsbeslissingen altijd uw huisarts.",
  },
  ja: {
    backToBlog: "← すべての記事",
    pillarLabel: "ピラーガイド",
    readMin: (m: number) => `${m}分で読める`,
    publishedOn: "公開",
    updated: "更新",
    metaCategory: "カテゴリー",
    metaReadTime: "読了時間",
    metaDate: "日付",
    metaShare: "シェア",
    metaCopied: "コピーしました！",
    metaCopy: "リンクをコピー",
    metaViews: "閲覧数",
    metaShares: "シェア数",
    tldrLabel: "まとめ",
    faqHeading: "よくある質問",
    relatedHeading: "続けて読む",
    disclaimerHeading: "免責事項",
    disclaimer: (brands: string[]) =>
      `FitMesh Syncは独立した製品です。${brands.join("、")}は各所有者の商標です。本記事はいかなる提携またはスポンサーも示唆しません。`,
    medicalDisclaimerHeading: "医療免責事項",
    medicalDisclaimer:
      "本記事の情報は情報提供のみを目的としており、医師、薬剤師、その他の医療専門家のアドバイスに代わるものではありません。FitMesh Syncはフィットネス・ウェルネスアプリであり、医療機器ではなく、疾患の診断や治療は行いません。症状、臨床上の疑問、治療上の決定については、必ずかかりつけ医にご相談ください。",
  },
  ko: {
    backToBlog: "← 모든 기사",
    pillarLabel: "핵심 가이드",
    readMin: (m: number) => `${m}분 읽기`,
    publishedOn: "게시됨",
    updated: "업데이트됨",
    metaCategory: "카테고리",
    metaReadTime: "읽기 시간",
    metaDate: "날짜",
    metaShare: "공유",
    metaCopied: "복사됨!",
    metaCopy: "링크 복사",
    metaViews: "조회수",
    metaShares: "공유수",
    tldrLabel: "요약",
    faqHeading: "자주 묻는 질문",
    relatedHeading: "계속 읽기",
    disclaimerHeading: "면책 조항",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync는 독립 제품입니다. ${brands.join(", ")}은(는) 각 소유자의 상표입니다. 이 기사는 어떠한 제휴나 후원도 암시하지 않습니다.`,
    medicalDisclaimerHeading: "의료 면책 조항",
    medicalDisclaimer:
      "이 기사의 정보는 정보 제공 목적으로만 제공되며 의사, 약사 또는 기타 의료 전문가의 조언을 대체하지 않습니다. FitMesh Sync는 피트니스/웰니스 앱이며 의료 기기가 아니며 어떠한 질환도 진단하거나 치료하지 않습니다. 증상, 임상 질문 또는 치료 결정에 대해서는 항상 주치의와 상담하세요.",
  },
  sv: {
    backToBlog: "← Alla artiklar",
    pillarLabel: "Huvudguide",
    readMin: (m: number) => `${m} min läsning`,
    publishedOn: "Publicerad",
    updated: "Uppdaterad",
    metaCategory: "Kategori",
    metaReadTime: "Lästid",
    metaDate: "Datum",
    metaShare: "Dela",
    metaCopied: "Kopierad!",
    metaCopy: "Kopiera länk",
    metaViews: "Visningar",
    metaShares: "Delningar",
    tldrLabel: "Sammanfattning",
    faqHeading: "Vanliga frågor",
    relatedHeading: "Fortsätt läsa",
    disclaimerHeading: "Friskrivning",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync är en oberoende produkt. ${brands.join(", ")} ${brands.length > 1 ? "är varumärken" : "är ett varumärke"} som tillhör respektive ägare. Den här artikeln innebär ingen anknytning eller sponsring.`,
    medicalDisclaimerHeading: "Hälsovarning",
    medicalDisclaimer:
      "Informationen i den här artikeln är endast i informationssyfte och ersätter inte råd från din läkare, farmaceut eller annan vårdpersonal. FitMesh Sync är en tränings- och välmåendeapp, inte en medicinteknisk produkt, och varken diagnostiserar eller behandlar några tillstånd. Vid symtom, kliniska frågor eller behandlingsbeslut, kontakta alltid din läkare.",
  },
  da: {
    backToBlog: "← Alle artikler",
    pillarLabel: "Hovedguide",
    readMin: (m: number) => `${m} min læsning`,
    publishedOn: "Udgivet",
    updated: "Opdateret",
    metaCategory: "Kategori",
    metaReadTime: "Læsetid",
    metaDate: "Dato",
    metaShare: "Del",
    metaCopied: "Kopieret!",
    metaCopy: "Kopiér link",
    metaViews: "Visninger",
    metaShares: "Delinger",
    tldrLabel: "Kort fortalt",
    faqHeading: "Ofte stillede spørgsmål",
    relatedHeading: "Læs videre",
    disclaimerHeading: "Ansvarsfraskrivelse",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync er et uafhængigt produkt. ${brands.join(", ")} ${brands.length > 1 ? "er varemærker" : "er et varemærke"} tilhørende deres respektive ejere. Denne artikel indebærer ingen tilknytning eller sponsorering.`,
    medicalDisclaimerHeading: "Sundhedsbemærkning",
    medicalDisclaimer:
      "Oplysningerne i denne artikel er kun til informationsformål og erstatter ikke rådgivning fra din læge, apoteker eller anden sundhedsperson. FitMesh Sync er en fitness- og wellnessapp, ikke medicinsk udstyr, og hverken diagnosticerer eller behandler nogen tilstande. Ved symptomer, kliniske spørgsmål eller behandlingsbeslutninger skal du altid kontakte din egen læge.",
  },
  no: {
    backToBlog: "← Alle artikler",
    pillarLabel: "Hovedguide",
    readMin: (m: number) => `${m} min lesing`,
    publishedOn: "Publisert",
    updated: "Oppdatert",
    metaCategory: "Kategori",
    metaReadTime: "Lesetid",
    metaDate: "Dato",
    metaShare: "Del",
    metaCopied: "Kopiert!",
    metaCopy: "Kopier lenke",
    metaViews: "Visninger",
    metaShares: "Delinger",
    tldrLabel: "Kort oppsummert",
    faqHeading: "Vanlige spørsmål",
    relatedHeading: "Les videre",
    disclaimerHeading: "Ansvarsfraskrivelse",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync er et uavhengig produkt. ${brands.join(", ")} ${brands.length > 1 ? "er varemerker" : "er et varemerke"} som tilhører sine respektive eiere. Denne artikkelen innebærer ingen tilknytning eller sponsing.`,
    medicalDisclaimerHeading: "Helseinformasjon",
    medicalDisclaimer:
      "Informasjonen i denne artikkelen er kun til informasjonsformål og erstatter ikke råd fra legen din, farmasøyten eller annet helsepersonell. FitMesh Sync er en trenings- og velværeapp, ikke medisinsk utstyr, og verken diagnostiserer eller behandler noen tilstander. Ved symptomer, kliniske spørsmål eller behandlingsbeslutninger må du alltid kontakte fastlegen din.",
  },
  fi: {
    backToBlog: "← Kaikki artikkelit",
    pillarLabel: "Pääopas",
    readMin: (m: number) => `${m} min lukuaika`,
    publishedOn: "Julkaistu",
    updated: "Päivitetty",
    metaCategory: "Kategoria",
    metaReadTime: "Lukuaika",
    metaDate: "Päivämäärä",
    metaShare: "Jaa",
    metaCopied: "Kopioitu!",
    metaCopy: "Kopioi linkki",
    metaViews: "Katselukerrat",
    metaShares: "Jaot",
    tldrLabel: "Lyhyesti",
    faqHeading: "Usein kysytyt kysymykset",
    relatedHeading: "Jatka lukemista",
    disclaimerHeading: "Vastuuvapauslauseke",
    disclaimer: (brands: string[]) =>
      `FitMesh Sync on riippumaton tuote. ${brands.join(", ")} ${brands.length > 1 ? "ovat omistajiensa tavaramerkkejä" : "on omistajansa tavaramerkki"}. Tämä artikkeli ei tarkoita kumppanuutta tai sponsorointia.`,
    medicalDisclaimerHeading: "Terveysvaroitus",
    medicalDisclaimer:
      "Tämän artikkelin tiedot ovat vain tiedoksi eivätkä korvaa lääkärin, farmaseutin tai muun terveydenhuollon ammattilaisen neuvoja. FitMesh Sync on kunto- ja hyvinvointisovellus, ei lääkinnällinen laite, eikä se diagnosoi tai hoida mitään sairauksia. Oireiden, kliinisten kysymysten tai hoitopäätösten osalta ota aina yhteyttä omaan lääkäriisi.",
  },
} as const;

function formatDate(iso: string, lc: Locale): string {
  const d = new Date(iso);
  const bcp47 =
    lc === "it" ? "it-IT" :
    lc === "es" ? "es-ES" :
    lc === "de" ? "de-DE" :
    lc === "pt" ? "pt-BR" :
    lc === "fr" ? "fr-FR" :
    lc === "pl" ? "pl-PL" :
    lc === "tr" ? "tr-TR" :
    lc === "nl" ? "nl-NL" :
    lc === "ja" ? "ja-JP" :
    lc === "ko" ? "ko-KR" :
    "en-US";
  return d.toLocaleDateString(bcp47, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogArticle({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const { post, redirectTo } = await resolveBlogPost(slug, lc);
  if (redirectTo) permanentRedirect(redirectTo);
  if (!post) notFound();
  const t = I18N[lc];

  const path = `/${lc}/blog/${localizedBlogSlug(post.slug, lc)}`;
  const ldType = post.ldType ?? "BlogPosting";

  // JSON-LD Article/BlogPosting
  const articleLd = {
    "@context": "https://schema.org",
    "@type": ldType,
    "@id": `${SITE_URL}${path}#article`,
    headline: tl(post.hero.title, lc),
    description: tl(post.metaDescription, lc),
    inLanguage:
      lc === "it" ? "it-IT" :
      lc === "es" ? "es-ES" :
      lc === "de" ? "de-DE" :
      lc === "pt" ? "pt-BR" :
      lc === "fr" ? "fr-FR" :
      lc === "pl" ? "pl-PL" :
      lc === "tr" ? "tr-TR" :
      lc === "nl" ? "nl-NL" :
      lc === "ja" ? "ja-JP" :
      lc === "ko" ? "ko-KR" :
      "en-US",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url: `${SITE_URL}${path}`,
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}${coverSrc(post)}`,
      width: COVER_W,
      height: COVER_H,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${path}` },
    // E-E-A-T critical su YMYL: author Person con bio + sameAs.
    // Google penalizza articoli salute con author=Organization generico.
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/it/about#matteo-pizzi`,
      name: AUTHOR.name,
      jobTitle: AUTHOR.jobTitle,
      description:
        lc === "it" ? AUTHOR.bioIt :
        lc === "es" ? AUTHOR.bioEs :
        lc === "de" ? AUTHOR.bioDe :
        lc === "pt" ? AUTHOR.bioPt :
        lc === "fr" ? AUTHOR.bioFr :
        lc === "pl" ? AUTHOR.bioPl :
        lc === "tr" ? AUTHOR.bioTr :
        lc === "nl" ? AUTHOR.bioNl :
        lc === "ja" ? AUTHOR.bioJa :
        lc === "ko" ? AUTHOR.bioko :
        AUTHOR.bioEn,
      url: AUTHOR.url,
      sameAs: AUTHOR.sameAs,
    },
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-square.png`,
      },
    },
    keywords: [
      tl(post.primaryKeyword, lc),
      ...tll({ it: post.secondaryKeywords.it, en: post.secondaryKeywords.en }, lc),
    ].join(", "),
    articleSection: categoryLabel(post.category, lc),
  };

  const faqLd =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: tl(f.q, lc),
            acceptedAnswer: {
              "@type": "Answer",
              text: tl(f.a, lc),
            },
          })),
        }
      : null;

  const related = await getRelatedPosts(post.related);

  // Prev/next per data (successivo = piu' recente, precedente = piu' vecchio).
  const ordered = [...(await getBlogPosts())].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const curIdx = ordered.findIndex((p) => p.slug === post.slug);
  const newerPost = curIdx > 0 ? ordered[curIdx - 1] : null;
  const olderPost =
    curIdx >= 0 && curIdx < ordered.length - 1 ? ordered[curIdx + 1] : null;

  return (
    <>
      <JsonLd data={articleLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <Breadcrumbs
        items={[
          { name: "Blog", path: `/${lc}/blog` },
          { name: tl(post.hero.title, lc), path },
        ]}
        locale={lc}
      />

      {/* HEADER */}
      <article>
        <header className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8">
          <div
            aria-hidden
            className="halo-conic absolute left-1/2 top-0 -z-10 h-[320px] w-[520px] -translate-x-1/2 opacity-30"
          />
          <Link
            href={`/${lc}/blog`}
            className="inline-flex items-center text-sm text-text-muted hover:text-brand-aqua transition"
          >
            {t.backToBlog}
          </Link>
          {post.pillar && (
            <div className="mt-6">
              <span className="px-2 py-0.5 rounded-pill border border-brand-aqua/40 bg-brand-aqua/10 text-brand-aqua font-medium text-xs">
                {t.pillarLabel}
              </span>
            </div>
          )}
          <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
            {tl(post.hero.kicker, lc)}
          </p>
          <h1 className="mt-3 font-display text-display-xl font-semibold tracking-tightest text-text-primary leading-[1.1]">
            {tl(post.hero.title, lc)}
          </h1>
          <p className="mt-5 text-lg text-text-secondary leading-relaxed">
            {tl(post.hero.subtitle, lc)}
          </p>
          <ArticleMeta
            slug={post.slug}
            shareLabel={t.metaShare}
            copiedLabel={t.metaCopied}
            copyLabel={t.metaCopy}
            viewsLabel={t.metaViews}
            sharesLabel={t.metaShares}
            items={[
              {
                icon: "category",
                label: t.metaCategory,
                value: categoryLabel(post.category, lc),
              },
              {
                icon: "date",
                label: t.metaDate,
                value: formatDate(post.publishedAt, lc),
              },
              {
                icon: "clock",
                label: t.metaReadTime,
                value: t.readMin(post.readMinutes),
              },
            ]}
          />
        </header>

        {/* COVER */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc(post)}
            alt={tl(post.hero.title, lc)}
            width={COVER_W}
            height={COVER_H}
            decoding="async"
            className="w-full h-auto rounded-card border border-white/5"
          />
        </div>

        {/* TL;DR — il succo in 10 secondi, stile Claude. Solo se presente. */}
        {post.tldr && tll(post.tldr, lc).length > 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="rounded-card border border-brand-aqua/30 bg-gradient-to-br from-brand-aqua/[0.07] to-bg-card p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
                {t.tldrLabel}
              </p>
              <ul className="mt-3 space-y-2">
                {tll(post.tldr, lc).map((point, i) => (
                  <li key={i} className="flex gap-2.5 text-text-secondary leading-relaxed">
                    <span aria-hidden className="text-brand-aqua mt-1.5 flex-none">
                      <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden>
                        <circle cx="3" cy="3" r="3" fill="currentColor" />
                      </svg>
                    </span>
                    <span>{renderMarkdownInline(point, lc)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <BlogRenderer sections={post.body} locale={lc} />
        </div>

        {/* FAQ */}
        {post.faq && post.faq.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 pb-12">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t.faqHeading}
            </h2>
            <div className="mt-6 space-y-4">
              {post.faq.map((f, i) => (
                <details
                  key={i}
                  className="card p-5 group [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="cursor-pointer flex items-start justify-between gap-4 text-text-primary font-medium">
                    <span>{tl(f.q, lc)}</span>
                    <span className="text-text-muted text-xl leading-none group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                    {tl(f.a, lc)}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* DISCLAIMER brand */}
        {post.brandsMentioned && post.brandsMentioned.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
            <div className="rounded-card border border-divider bg-bg-card/40 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                {t.disclaimerHeading}
              </p>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                {t.disclaimer(post.brandsMentioned)}
              </p>
            </div>
          </section>
        )}

        {/* MEDICAL DISCLAIMER (YMYL). Sempre visibile, anche se l'articolo non
           menziona brand. Richiesto da E-E-A-T Google su topic salute. */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
          <div className="rounded-card border border-warning/30 bg-warning/[0.04] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-warning font-semibold flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
                <path d="M12 2L2 22h20L12 2z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              {t.medicalDisclaimerHeading}
            </p>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              {t.medicalDisclaimer}
            </p>
          </div>
        </section>

        {/* AUTHOR BIO CARD — E-E-A-T (YMYL salute). Aiuta Google e i lettori
           a capire chi scrive: nome, ruolo, link About. */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-8">
          <div className="rounded-card border border-divider bg-bg-card/40 p-5 sm:p-6 flex gap-4 items-start">
            <div className="shrink-0 w-12 h-12 rounded-full bg-brand-aqua/15 border border-brand-aqua/30 flex items-center justify-center text-brand-aqua font-display font-bold text-lg">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                {lc === "it"
                ? "Scritto da"
                : lc === "es"
                  ? "Escrito por"
                  : lc === "de"
                    ? "Geschrieben von"
                    : lc === "pt"
                      ? "Escrito por"
                      : lc === "fr"
                        ? "Rédigé par"
                        : lc === "pl"
                          ? "Napisane przez"
                          : lc === "tr"
                            ? "Yazan"
                            : "Written by"}
              </p>
              <p className="mt-1 font-display font-bold text-text-primary">
                {AUTHOR.name}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">{AUTHOR.jobTitle}</p>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                {lc === "it"
                  ? AUTHOR.bioIt
                  : lc === "es"
                    ? AUTHOR.bioEs
                    : lc === "de"
                      ? AUTHOR.bioDe
                      : lc === "pt"
                        ? AUTHOR.bioPt
                        : lc === "fr"
                          ? AUTHOR.bioFr
                          : lc === "pl"
                            ? AUTHOR.bioPl
                            : lc === "tr"
                              ? AUTHOR.bioTr
                              : AUTHOR.bioEn}
              </p>
              <Link
                href={`/${lc}/about`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-brand-aqua hover:text-brand-green transition font-medium"
              >
                {lc === "it"
                  ? "Di più sul progetto"
                  : lc === "es"
                    ? "Más sobre el proyecto"
                    : lc === "de"
                      ? "Mehr über das Projekt"
                      : lc === "pt"
                        ? "Saiba mais sobre o projeto"
                        : lc === "fr"
                          ? "En savoir plus sur le projet"
                          : lc === "pl"
                            ? "Więcej o projekcie"
                            : lc === "tr"
                              ? "Proje hakkında daha fazla bilgi"
                              : "More about the project"}{" "}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
            <h2 className="font-display text-display font-semibold tracking-tightest text-text-primary">
              {t.relatedHeading}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((r) => (
                <Link
                  key={r.slug}
                  href={`/${lc}/blog/${localizedBlogSlug(r.slug, lc)}`}
                  className="card p-5 group hover:-translate-y-0.5 transition-transform"
                >
                  <p className="text-xs text-brand-aqua font-medium">
                    {categoryLabel(r.category, lc)}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-text-primary group-hover:text-brand-aqua transition leading-snug">
                    {tl(r.hero.title, lc)}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {tl(r.hero.subtitle, lc)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* PREV / NEXT — link interni con rel per i crawler */}
        {(olderPost || newerPost) && (
          <nav className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 grid gap-4 sm:grid-cols-2">
            {olderPost ? (
              <Link
                rel="prev"
                href={`/${lc}/blog/${localizedBlogSlug(olderPost.slug, lc)}`}
                className="card p-5 group hover:-translate-y-0.5 transition-transform"
              >
                <span className="text-xs text-text-muted" aria-hidden>
                  ←
                </span>
                <p className="mt-1 font-display text-base font-semibold tracking-tight text-text-primary group-hover:text-brand-aqua transition leading-snug line-clamp-2">
                  {tl(olderPost.hero.title, lc)}
                </p>
              </Link>
            ) : (
              <span />
            )}
            {newerPost ? (
              <Link
                rel="next"
                href={`/${lc}/blog/${localizedBlogSlug(newerPost.slug, lc)}`}
                className="card p-5 group hover:-translate-y-0.5 transition-transform sm:text-right"
              >
                <span className="text-xs text-text-muted" aria-hidden>
                  →
                </span>
                <p className="mt-1 font-display text-base font-semibold tracking-tight text-text-primary group-hover:text-brand-aqua transition leading-snug line-clamp-2">
                  {tl(newerPost.hero.title, lc)}
                </p>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </article>
    </>
  );
}
