import Link from "next/link";
import { HRV_TOOL_CONTENT, METHODOLOGY_VERSION, LAST_REVIEWED } from "@/lib/labs/hrv/content";
import { lt, ltl, localizedLabsSlug, type LiveLabsTool } from "@/lib/labs/registry";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
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
import { LabsCitationBlock } from "@/components/labs/LabsCitationBlock";
import { BlockMath } from "@/components/labs/math/BlockMath";
import { HrvRmssdCalculator } from "@/components/labs/HrvRmssdCalculator";
import { RichParagraph } from "@/components/labs/RichParagraph";

/**
 * Corpo della pagina tool HRV, estratto da labs/[tool]/page.tsx (P1.1
 * Fase 5) quando è arrivato il secondo tool live (Sleep Efficiency) - la
 * generalizzazione predetta dal commento originale del file.
 */
export function HrvToolPageBody({
  found,
  otherTools,
  lc,
  path,
}: {
  found: LiveLabsTool;
  otherTools: LiveLabsTool[];
  lc: "it" | "en";
  path: string;
}) {
  const c = HRV_TOOL_CONTENT;
  const faqForJsonLd = c.faq.map((f) => ({
    question: lt(f.question, lc),
    answer: lt(f.answer, lc),
  }));

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
        dateModified={LAST_REVIEWED}
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
            href={`/${lc}/blog/${localizedBlogSlug("hrv-cose-significato-valori", lc)}`}
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
        <BlockMath tex={c.formulaRows[0].formula} ariaLabel={lt(c.formulaRows[0].label, lc)} />
      </LabsProseSection>

      <LabsProseSection heading={section("stddevFormula").heading}>
        {section("stddevFormula").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
        <BlockMath tex={c.formulaRows[1].formula} ariaLabel={lt(c.formulaRows[1].label, lc)} />
      </LabsProseSection>

      {/* Formule secondarie (HR derivata, ln(RMSSD)): già mostrate come
          numeri calcolati nel calcolatore sopra - qui solo la notazione
          KaTeX per completezza, senza ripetere una spiegazione già data. */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 flex flex-wrap gap-x-10 gap-y-3">
        {c.formulaRows.slice(2).map((row, i) => (
          <div key={i} className="text-sm text-text-secondary">
            <span className="text-xs uppercase tracking-wide text-text-muted mr-2">{lt(row.label, lc)}</span>
            <BlockMath tex={row.formula} ariaLabel={lt(row.label, lc)} />
          </div>
        ))}
      </div>

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

      <p className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 text-sm">
        <Link
          href={`/${lc}/blog/${lc === "it" ? "metriche-recupero-hrv-sonno-frequenza-cardiaca" : "recovery-metrics-hrv-sleep-heart-rate"}`}
          className="text-brand-aqua hover:underline"
        >
          {lc === "it"
            ? "Come si collega l'HRV alle altre metriche di recupero →"
            : "How HRV connects to other recovery metrics →"}
        </Link>
      </p>

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
