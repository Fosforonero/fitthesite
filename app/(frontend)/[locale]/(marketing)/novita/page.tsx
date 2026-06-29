import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { locales, type Locale, ogLocale, localeAlternates } from "@/lib/i18n";
import { getPostsByCategory } from "@/lib/blog/payload-source";
import { tl } from "@/lib/blog/types";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";

const SITE_URL = "https://www.fitmesh.fit";

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

  const titles: Record<Locale, string> = {
    it: "Novità FitMesh Sync — cosa cambia a ogni aggiornamento",
    en: "FitMesh Sync What's New — every update explained",
    es: "Novedades de FitMesh Sync: todo lo que cambia en cada actualización",
    de: "Neuigkeiten von FitMesh Sync — was sich bei jedem Update ändert",
    pt: "Novidades do FitMesh Sync — o que muda a cada atualização",
    fr: "Nouveautés de FitMesh Sync — ce qui change à chaque mise à jour",
    pl: "Nowości FitMesh Sync — co zmienia każda aktualizacja",
    tr: "FitMesh Sync yenilikleri — her güncellemede ne değişiyor",
    nl: "Wat is nieuw in FitMesh Sync — elke update uitgelegd",
    ja: "FitMesh Syncの新着情報 — 各アップデートの変更点",
    ko: "FitMesh Sync의 새로운 기능 — 업데이트마다 무엇이 바뀌는지",
  };
  const descriptions: Record<Locale, string> = {
    it: "Le novità di FitMesh Sync versione dopo versione: nuove funzioni, dispositivi supportati e miglioramenti. In chiaro, senza gergo tecnico.",
    en: "FitMesh Sync news release after release: new features, supported devices and improvements. Plain language, no technical jargon.",
    es: "Las novedades de FitMesh Sync actualización tras actualización: nuevas funciones, dispositivos compatibles y mejoras. En claro, sin tecnicismos.",
    de: "Die Neuigkeiten von FitMesh Sync, Update für Update: neue Funktionen, unterstützte Geräte und Verbesserungen. Klar erklärt, ohne Fachjargon.",
    pt: "As novidades do FitMesh Sync, atualização após atualização: novas funções, dispositivos compatíveis e melhorias. Em linguagem clara, sem jargão técnico.",
    fr: "Les nouveautés de FitMesh Sync, mise à jour après mise à jour : nouvelles fonctions, appareils compatibles et améliorations. En clair, sans jargon technique.",
    pl: "Nowości FitMesh Sync, aktualizacja po aktualizacji: nowe funkcje, obsługiwane urządzenia i ulepszenia. Jasno i bez technicznego żargonu.",
    tr: "FitMesh Sync'in yenilikleri, güncelleme ardına güncelleme: yeni işlevler, desteklenen cihazlar ve iyileştirmeler. Sade bir dille, teknik jargon olmadan.",
    nl: "Het nieuws van FitMesh Sync, update na update: nieuwe functies, ondersteunde apparaten en verbeteringen. Duidelijk, zonder jargon.",
    ja: "FitMesh Syncの新着情報をアップデートごとに紹介：新機能、対応デバイス、改善点。わかりやすく、専門用語なしで。",
    ko: "FitMesh Sync의 소식을 업데이트마다 전해드립니다: 새 기능, 지원 기기, 개선 사항. 전문 용어 없이 알기 쉽게.",
  };
  const title = titles[lc];
  const description = descriptions[lc];

  const path = `/${lc}/novita`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/novita`),
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      title,
      description,
      siteName: "FitMesh Sync",
      locale: ogLocale[lc],
      alternateLocale: locales.filter((l) => l !== lc).map((l) => ogLocale[l]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const I18N: Record<
  Locale,
  {
    kicker: string;
    heading: string;
    headingAccent: string;
    lead: string;
    readMin: (m: number) => string;
    explore: string;
    empty: string;
  }
> = {
  it: {
    kicker: "Novità",
    heading: "Le novità di FitMesh Sync",
    headingAccent: "versione dopo versione",
    lead: "Cosa abbiamo aggiunto e migliorato a ogni aggiornamento dell'app: nuove funzioni, dispositivi supportati e cosa cambia per te. In chiaro, senza gergo.",
    readMin: (m: number) => `${m} min di lettura`,
    explore: "Leggi →",
    empty: "Le prime novità arrivano a breve. Torna presto.",
  },
  en: {
    kicker: "What's New",
    heading: "What's new in FitMesh Sync",
    headingAccent: "release after release",
    lead: "What we added and improved in each app update: new features, supported devices and what changes for you. Plain language, no jargon.",
    readMin: (m: number) => `${m} min read`,
    explore: "Read →",
    empty: "The first updates are coming soon. Check back shortly.",
  },
  es: {
    kicker: "Novedades",
    heading: "Las novedades de FitMesh Sync",
    headingAccent: "actualización tras actualización",
    lead: "Todo lo que hemos añadido y mejorado en cada actualización de la app: nuevas funciones, dispositivos compatibles y qué cambia para ti. Sin tecnicismos.",
    readMin: (m: number) => `${m} min de lectura`,
    explore: "Leer →",
    empty: "Las primeras novedades llegan próximamente. Vuelve pronto.",
  },
  de: {
    kicker: "Neuigkeiten",
    heading: "Was ist neu bei FitMesh Sync",
    headingAccent: "Update für Update",
    lead: "Was wir bei jedem App-Update hinzugefügt und verbessert haben: neue Funktionen, unterstützte Geräte und was sich für dich ändert. Klar erklärt, ohne Fachjargon.",
    readMin: (m: number) => `${m} Min. Lesezeit`,
    explore: "Lesen →",
    empty: "Die ersten Neuigkeiten kommen in Kürze. Schau bald wieder vorbei.",
  },
  pt: {
    kicker: "Novidades",
    heading: "As novidades do FitMesh Sync",
    headingAccent: "atualização após atualização",
    lead: "Tudo o que adicionamos e melhoramos em cada atualização do app: novas funções, dispositivos compatíveis e o que muda para você. Em linguagem clara, sem jargão técnico.",
    readMin: (m: number) => `${m} min de leitura`,
    explore: "Ler →",
    empty: "As primeiras novidades chegam em breve. Volte logo.",
  },
  fr: {
    kicker: "Nouveautés",
    heading: "Les nouveautés de FitMesh Sync",
    headingAccent: "mise à jour après mise à jour",
    lead: "Tout ce que nous avons ajouté et amélioré à chaque mise à jour de l'app : nouvelles fonctions, appareils compatibles et ce qui change pour vous. En clair, sans jargon technique.",
    readMin: (m: number) => `${m} min de lecture`,
    explore: "Lire →",
    empty: "Les premières nouveautés arrivent bientôt. Revenez vite.",
  },
  pl: {
    kicker: "Nowości",
    heading: "Co nowego w FitMesh Sync",
    headingAccent: "aktualizacja po aktualizacji",
    lead: "Co dodaliśmy i ulepszyliśmy w każdej aktualizacji aplikacji: nowe funkcje, obsługiwane urządzenia i zmiany, które Cię dotyczą. Jasno i bez technicznego żargonu.",
    readMin: (m: number) => `${m} min czytania`,
    explore: "Czytaj →",
    empty: "Pierwsze nowości pojawią się wkrótce. Zajrzyj tu niedługo.",
  },
  tr: {
    kicker: "Yenilikler",
    heading: "FitMesh Sync'teki yenilikler",
    headingAccent: "güncelleme ardına güncelleme",
    lead: "Her uygulama güncellemesinde eklediğimiz ve geliştirdiğimiz özellikler: yeni işlevler, desteklenen cihazlar ve sizi etkileyen değişiklikler. Sade bir dille, teknik jargon olmadan.",
    readMin: (m: number) => `${m} dk okuma`,
    explore: "Oku →",
    empty: "İlk yenilikler yakında geliyor. Kısa süre içinde tekrar bekleriz.",
  },
  nl: {
    kicker: "Nieuw",
    heading: "Wat is er nieuw in FitMesh Sync",
    headingAccent: "update na update",
    lead: "Wat we bij elke app-update hebben toegevoegd en verbeterd: nieuwe functies, ondersteunde apparaten en wat er voor jou verandert. Duidelijk, zonder jargon.",
    readMin: (m: number) => `${m} min lezen`,
    explore: "Lees →",
    empty: "De eerste updates verschijnen binnenkort. Kom snel terug.",
  },
  ja: {
    kicker: "新着情報",
    heading: "FitMesh Syncの新着情報",
    headingAccent: "アップデートのたびに",
    lead: "各アプリアップデートで追加・改善した機能: 新機能、対応デバイス、あなたへの変更点。わかりやすく、専門用語なし。",
    readMin: (m: number) => `${m}分で読める`,
    explore: "読む →",
    empty: "最初のアップデートは近日公開予定です。またご確認ください。",
  },
  ko: {
    kicker: "새로운 기능",
    heading: "FitMesh Sync의 새로운 기능",
    headingAccent: "업데이트마다",
    lead: "각 앱 업데이트에서 추가하고 개선한 내용: 새 기능, 지원되는 기기, 변경 사항. 전문 용어 없이 알기 쉽게.",
    readMin: (m: number) => `${m}분 읽기`,
    explore: "읽기 →",
    empty: "첫 번째 업데이트가 곧 출시됩니다. 다시 방문해주세요.",
  },
};

function formatDate(iso: string, lc: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(ogLocale[lc].replace("_", "-"), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function NovitaIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const lc = locale as Locale;
  const t = I18N[lc];

  const posts = await getPostsByCategory("news");

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/${lc}/novita#collection`,
    name:
      lc === "it"
        ? "Novità FitMesh Sync"
        : lc === "es"
          ? "Novedades de FitMesh Sync"
          : "FitMesh Sync What's New",
    inLanguage: ogLocale[lc].replace("_", "-"),
    url: `${SITE_URL}/${lc}/novita`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`,
        name: tl(p.hero.title, lc),
      })),
    },
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <Breadcrumbs
        items={[{ name: t.kicker, path: `/${lc}/novita` }]}
        locale={lc}
      />

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
        <div
          aria-hidden
          className="halo-conic absolute left-1/2 top-0 -z-10 h-[420px] w-[680px] -translate-x-1/2 opacity-40 animate-float"
        />
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {t.kicker}
        </p>
        <h1 className="mt-4 font-display text-display-xl font-semibold tracking-tightest text-text-primary max-w-3xl">
          {t.heading}{" "}
          <span className="text-brand-gradient">{t.headingAccent}</span>
        </h1>
        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          {t.lead}
        </p>
      </section>

      {/* RELEASES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {posts.length === 0 ? (
          <p className="text-text-secondary">{t.empty}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/${lc}/blog/${localizedBlogSlug(p.slug, lc)}`}
                className="card p-6 group hover:-translate-y-0.5 transition-transform flex flex-col"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted">
                    {formatDate(p.publishedAt, lc)}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-muted">
                    {t.readMin(p.readMinutes)}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-lg font-semibold tracking-tight text-text-primary group-hover:text-brand-aqua transition leading-snug">
                  {tl(p.hero.title, lc)}
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1">
                  {tl(p.hero.subtitle, lc)}
                </p>
                <p className="mt-4 inline-flex items-center text-sm font-semibold text-brand-aqua">
                  {t.explore}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
