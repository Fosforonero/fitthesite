import Link from "next/link";
import { SLEEP_EFFICIENCY_TOOL_CONTENT, METHODOLOGY_VERSION, LAST_REVIEWED } from "@/lib/labs/sleep-efficiency/content";
import { lt, ltl, localizedLabsSlug, type LiveLabsTool } from "@/lib/labs/registry";
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
import { FormulaCard } from "@/components/labs/math/FormulaCard";
import { SleepEfficiencyCalculator } from "@/components/labs/SleepEfficiencyCalculator";
import { RichParagraph } from "@/components/labs/RichParagraph";

// P1.1B Fase 5: formule come costanti editoriali nominate ed esportate, mai
// solo inline nel JSX - così tools/check-labs-formulas-render.ts (KaTeX
// fail-closed) può enumerarle ed importarle direttamente dalla stessa
// sorgente reale usata dalla pagina, non da una copia scritta a mano nel
// test (che non scoprirebbe una regressione della formula reale).
export const SLEEP_EFFICIENCY_LATEX = String.raw`\mathrm{Sleep\ Efficiency}\,(\%) = \frac{\mathrm{Total\ Sleep\ Time}}{\mathrm{Time\ in\ Bed}} \times 100`;
export const SLEEP_EFFICIENCY_LATEX_IT = String.raw`\mathrm{Efficienza\ del\ sonno}\,(\%) = \frac{\mathrm{Tempo\ totale\ di\ sonno}}{\mathrm{Tempo\ trascorso\ a\ letto}} \times 100`;
export const SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_EN = String.raw`\mathrm{Total\ Sleep\ Time}`;
export const SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_IT = String.raw`\mathrm{Tempo\ totale\ di\ sonno}`;
export const SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_EN = String.raw`\mathrm{Time\ in\ Bed}`;
export const SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_IT = String.raw`\mathrm{Tempo\ trascorso\ a\ letto}`;

export function SleepEfficiencyToolPageBody({
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
  const c = SLEEP_EFFICIENCY_TOOL_CONTENT;
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
        datePublished={LAST_REVIEWED}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <SleepEfficiencyCalculator labels={c.calculatorLabels} locale={lc} />
      </div>

      <LabsProseSection heading={section("whatIsSleepEfficiency").heading}>
        {section("whatIsSleepEfficiency").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
        <p>
          <Link
            href={`/${lc}/blog/${lc === "it" ? "efficienza-del-sonno-formula-calcolo" : "sleep-efficiency-formula-calculation"}`}
            className="text-brand-aqua hover:underline"
          >
            {lc === "it"
              ? "Guida completa: formula, esempio e interpretazione dell'efficienza del sonno →"
              : "Full guide: sleep efficiency formula, worked example and interpretation →"}
          </Link>
        </p>
      </LabsProseSection>

      <LabsProseSection heading={section("simpleVsAdvanced").heading}>
        {section("simpleVsAdvanced").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={lt(c.formulaHeading, lc)}>
        <FormulaCard
          heading={lt(c.formulaHeading, lc)}
          tex={lc === "it" ? SLEEP_EFFICIENCY_LATEX_IT : SLEEP_EFFICIENCY_LATEX}
          ariaLabel={lt(c.formulaHeading, lc)}
          explanation={lt(c.formulaExplanation, lc)}
          variables={[
            {
              symbolTex: lc === "it" ? SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_IT : SLEEP_EFFICIENCY_SYMBOL_TOTAL_SLEEP_TIME_EN,
              meaning: lc === "it" ? "Tempo effettivamente dormito" : "Time actually spent asleep",
              unit: lc === "it" ? "minuti" : "minutes",
            },
            {
              symbolTex: lc === "it" ? SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_IT : SLEEP_EFFICIENCY_SYMBOL_TIME_IN_BED_EN,
              meaning: lc === "it" ? "Tempo totale passato a letto" : "Total time spent in bed",
              unit: lc === "it" ? "minuti" : "minutes",
            },
          ]}
          example={{
            label: lc === "it" ? "Esempio" : "Example",
            lines:
              lc === "it"
                ? ["Tempo totale di sonno = 420 min (7h)", "Tempo a letto = 480 min (8h)", "Efficienza = 420 / 480 × 100 = 87,5%"]
                : ["Total Sleep Time = 420 min (7h)", "Time in Bed = 480 min (8h)", "Efficiency = 420 / 480 × 100 = 87.5%"],
          }}
        />
      </LabsProseSection>

      <LabsProseSection heading={section("midnightAndMethodology").heading}>
        {section("midnightAndMethodology").paragraphs.map((p, i) => (
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
            ? "Come si collega l'efficienza del sonno alle altre metriche di recupero →"
            : "How sleep efficiency connects to other recovery metrics →"}
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
