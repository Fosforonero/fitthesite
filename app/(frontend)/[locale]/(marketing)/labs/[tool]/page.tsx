import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import {
  allLabsStaticParams,
  labsToolByLocalizedSlug,
  liveLabsTools,
  localizedLabsSlug,
  lt,
  ltl,
} from "@/lib/labs/registry";
import { resolveLabsLocale } from "@/lib/labs/locale-redirect";
import { HRV_TOOL_CONTENT, METHODOLOGY_VERSION, LAST_REVIEWED } from "@/lib/labs/hrv/content";
import { LabsToolJsonLd } from "@/components/seo/LabsJsonLd";
import {
  LabsBreadcrumbNav,
  LabsHero,
  LabsDirectAnswer,
  LabsProseSection,
  LabsRevisionFooter,
  LabsRelatedTools,
  LabsCta,
} from "@/components/labs/LabsChrome";
import { LabsFaq } from "@/components/labs/LabsFaq";
import { LabsSources } from "@/components/labs/LabsSources";
import { LabsCitationBlock, LabsFormulaTable } from "@/components/labs/LabsCitationBlock";
import { HrvRmssdCalculator } from "@/components/labs/HrvRmssdCalculator";

/**
 * Unico tool live in questo sprint (P1.0): HRV RMSSD. Il registry supporta
 * più tool, ma il rendering del contenuto è ancora specifico per-tool
 * (`HRV_TOOL_CONTENT`): quando arriverà un secondo tool live, questo file
 * andrà generalizzato con uno switch su `tool.key`, non prima (evitare
 * un'astrazione speculativa su un solo caso reale).
 */

export function generateStaticParams() {
  return allLabsStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}): Promise<Metadata> {
  const { locale, tool } = await params;
  const lc = resolveLabsLocale(locale as Locale);
  const found = labsToolByLocalizedSlug(tool, lc);
  if (!found) return {};

  const c = HRV_TOOL_CONTENT;
  const path = `/${lc}/labs/${localizedLabsSlug(found, lc)}`;
  const ogImagePath = `${path}/opengraph-image`;
  const title = lt(c.metaTitle, lc);
  const description = lt(c.metaDescription, lc);

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/labs/${localizedLabsSlug(found, "it")}`,
        en: `${SITE_URL}/en/labs/${localizedLabsSlug(found, "en")}`,
        "x-default": `${SITE_URL}/it/labs/${localizedLabsSlug(found, "it")}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      type: "website",
      images: [{ url: `${SITE_URL}${ogImagePath}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LabsToolPage({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}) {
  const { locale, tool } = await params;
  const requested = locale as Locale;
  const resolved = resolveLabsLocale(requested);

  // Le 13 lingue non supportate da Labs vengono qui rimappate a 'en' (o
  // 'it' resta 'it'): nessuna pagina fallback indicizzabile, solo un
  // redirect pulito. Vedi lib/labs/locale-redirect.ts.
  if (resolved !== requested) {
    const fallbackTool = labsToolByLocalizedSlug(tool, "it") ?? labsToolByLocalizedSlug(tool, "en");
    if (!fallbackTool) notFound();
    redirect(`/${resolved}/labs/${localizedLabsSlug(fallbackTool, resolved)}`);
  }

  const found = labsToolByLocalizedSlug(tool, resolved);
  if (!found) notFound();

  const c = HRV_TOOL_CONTENT;
  const lc = resolved;
  const path = `/${lc}/labs/${localizedLabsSlug(found, lc)}`;
  const faqForJsonLd = c.faq.map((f) => ({
    question: lt(f.question, lc),
    answer: lt(f.answer, lc),
  }));
  const otherTools = liveLabsTools().filter((t) => t.key !== found.key);

  const section = (key: keyof typeof c.sections) => ({
    heading: lt(c.sections[key].heading, lc),
    paragraphs: ltl(c.sections[key].paragraphs, lc),
  });

  return (
    <>
      <LabsToolJsonLd
        locale={lc}
        path={path}
        pageTitle={lt(c.metaTitle, lc)}
        pageDescription={lt(c.metaDescription, lc)}
        toolName={lt(found.name, lc)}
        toolDescription={lt(found.shortDescription, lc)}
        datePublished="2026-07-16"
        dateModified="2026-07-16"
        breadcrumb={[
          { name: lt(c.breadcrumbHome, lc), path: `/${lc}` },
          { name: lt(c.breadcrumbLabs, lc), path: `/${lc}/labs` },
          { name: lt(c.heroTitle, lc), path },
        ]}
        faq={faqForJsonLd}
        ogImagePath={`${path}/opengraph-image`}
      />

      <LabsBreadcrumbNav
        items={[
          { name: lt(c.breadcrumbHome, lc), href: `/${lc}` },
          { name: lt(c.breadcrumbLabs, lc), href: `/${lc}/labs` },
          { name: lt(found.name, lc) },
        ]}
      />

      <LabsHero kicker={lt(c.heroKicker, lc)} title={lt(c.heroTitle, lc)} subtitle={lt(c.heroSubtitle, lc)} />

      <LabsDirectAnswer>
        {ltl(c.directAnswer, lc).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LabsDirectAnswer>

      <HrvRmssdCalculator labels={c.calculatorLabels} locale={lc} />

      <LabsProseSection heading={section("whatIsHrv").heading}>
        {section("whatIsHrv").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
        <p>
          <Link
            href={`/${lc}/blog/hrv-cose-significato-valori`}
            className="text-brand-aqua hover:underline"
          >
            {lc === "it"
              ? "Per una guida più ampia su cosa significano i valori di HRV e come interpretarli nel tempo, leggi l'articolo dedicato →"
              : "For a broader guide on what HRV values mean and how to interpret them over time, read the dedicated article →"}
          </Link>
        </p>
      </LabsProseSection>

      <LabsProseSection heading={section("rrIbiNn").heading}>
        {section("rrIbiNn").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={section("rmssdFormula").heading}>
        {section("rmssdFormula").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsFormulaTable
        heading={lt(c.formulaTableHeading, lc)}
        rows={c.formulaRows.map((r) => ({ label: lt(r.label, lc), formula: r.formula }))}
      />

      <LabsProseSection heading={section("stddevFormula").heading}>
        {section("stddevFormula").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={section("rmssdVsSdnn").heading}>
        {section("rmssdVsSdnn").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={section("whyDevicesDiffer").heading}>
        {section("whyDevicesDiffer").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={section("durationPostureEtc").heading}>
        {section("durationPostureEtc").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={section("workedExample").heading}>
        {section("workedExample").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={section("limits").heading}>
        {section("limits").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={section("privacy").heading}>
        {section("privacy").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsCitationBlock
        heading={lt(c.citationHeading, lc)}
        citationText={lt(c.citationText, lc)}
        copyLabel={lt(c.copyLabel, lc)}
        copiedLabel={lt(c.copiedLabel, lc)}
      />

      <LabsSources
        heading={lt(c.sourcesHeading, lc)}
        items={c.sources.map((s) => ({
          title: lt(s.title, lc),
          authorOrOrg: lt(s.authorOrOrg, lc),
          year: s.year,
          url: s.url,
          verifiedOn: lt(s.verifiedOn, lc),
        }))}
      />

      <LabsFaq
        heading={lt(c.faqHeading, lc)}
        items={c.faq.map((f) => ({ question: lt(f.question, lc), answer: lt(f.answer, lc) }))}
      />

      <LabsCta
        heading={lt(c.ctaHeading, lc)}
        body={lt(c.ctaBody, lc)}
        ctaLabel={lt(c.ctaLabel, lc)}
        ctaHref={`/${lc}/fitness-data-sync`}
      />

      <LabsRelatedTools
        heading={lt(c.relatedToolsHeading, lc)}
        items={otherTools.map((t) => ({
          name: lt(t.name, lc),
          description: lt(t.shortDescription, lc),
          href: `/${lc}/labs/${localizedLabsSlug(t, lc)}`,
        }))}
      />

      <LabsRevisionFooter
        label={lt(c.revisionLabel, lc)}
        methodologyVersion={METHODOLOGY_VERSION}
        reviewedLabel={lt(c.revisionReviewedLabel, lc)}
        reviewedDate={LAST_REVIEWED}
        methodologyLabel={lt(c.revisionMethodologyLabel, lc)}
      />

      <div className="h-16" />
    </>
  );
}

/**
 * Rendering minimale di `**grassetto**` nel testo del content file: stesso
 * bisogno di `renderMarkdownInline` usato dal blog, ma qui limitato a
 * grassetto (unico marcatore usato in questo contenuto) per non introdurre
 * una dipendenza dal parser markdown del blog in un modulo Labs
 * indipendente.
 */
function RichParagraph({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
