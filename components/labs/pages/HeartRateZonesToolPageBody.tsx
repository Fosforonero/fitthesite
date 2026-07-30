import Link from "next/link";
import { HEART_RATE_ZONES_TOOL_CONTENT, METHODOLOGY_VERSION, LAST_REVIEWED } from "@/lib/labs/heart-rate-zones/content";
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
import { HeartRateZonesCalculator } from "@/components/labs/HeartRateZonesCalculator";
import { RichParagraph } from "@/components/labs/RichParagraph";

// P1.1B Fase 5 (riuso): formule come costanti editoriali nominate ed
// esportate - tools/check-labs-formulas-render.ts le enumera ed importa
// direttamente da qui, mai da una copia scritta a mano nel test.
export const HR_MAX_ZONE_LATEX = String.raw`\mathrm{Zone}_{\%\mathrm{HRmax}} = \mathrm{HR}_{\max} \times \%`;
export const HR_MAX_ZONE_LATEX_IT = String.raw`\mathrm{Zona}_{\%\mathrm{FCmax}} = \mathrm{FC}_{\max} \times \%`;
export const KARVONEN_ZONE_LATEX = String.raw`\mathrm{Zone}_{\mathrm{Karvonen}} = \mathrm{HR}_{\mathrm{rest}} + (\mathrm{HR}_{\max} - \mathrm{HR}_{\mathrm{rest}}) \times \%`;
export const KARVONEN_ZONE_LATEX_IT = String.raw`\mathrm{Zona}_{\mathrm{Karvonen}} = \mathrm{FC}_{\mathrm{riposo}} + (\mathrm{FC}_{\max} - \mathrm{FC}_{\mathrm{riposo}}) \times \%`;
export const TANAKA_LATEX = String.raw`\mathrm{HR}_{\max} = 208 - 0.7 \times \mathrm{age}`;
export const TANAKA_LATEX_IT = String.raw`\mathrm{FC}_{\max} = 208 - 0{,}7 \times \mathrm{et\grave{a}}`;

export function HeartRateZonesToolPageBody({
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
  const c = HEART_RATE_ZONES_TOOL_CONTENT;
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
        <HeartRateZonesCalculator content={c} locale={lc} />
      </div>

      <LabsProseSection heading={section("whatAreZones").heading}>
        {section("whatAreZones").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
        <p>
          <Link
            href={`/${lc}/blog/${lc === "it" ? "perche-zona-2-cambia-smartwatch-app" : "why-zone-2-differs-watches-apps"}`}
            className="text-brand-aqua hover:underline"
          >
            {lc === "it"
              ? "Guida completa: perché la Zona 2 cambia da smartwatch/app →"
              : "Full guide: why Zone 2 differs between watches and apps →"}
          </Link>
        </p>
      </LabsProseSection>

      <LabsProseSection heading={section("twoMethods").heading}>
        {section("twoMethods").paragraphs.map((p, i) => (
          <RichParagraph key={i} text={p} />
        ))}
      </LabsProseSection>

      <LabsProseSection heading={lt(c.formulaHeading, lc)}>
        <div className="space-y-6">
          <FormulaCard
            heading={lc === "it" ? "Stima FC massima (Tanaka)" : "Max heart rate estimate (Tanaka)"}
            tex={lc === "it" ? TANAKA_LATEX_IT : TANAKA_LATEX}
            ariaLabel={lc === "it" ? "Formula di Tanaka" : "Tanaka formula"}
            explanation={
              lc === "it"
                ? "Usata solo in modalità \"stima da età\"."
                : "Used only in \"estimate from age\" mode."
            }
            variables={[]}
            example={{
              label: lc === "it" ? "Esempio" : "Example",
              lines: lc === "it" ? ["Età 40 → FC max = 208 − 0,7×40 = 180 bpm"] : ["Age 40 → Max HR = 208 − 0.7×40 = 180 bpm"],
            }}
          />
          <FormulaCard
            heading={lc === "it" ? "Zona, metodo % FC massima" : "Zone, %HRmax method"}
            tex={lc === "it" ? HR_MAX_ZONE_LATEX_IT : HR_MAX_ZONE_LATEX}
            ariaLabel={lc === "it" ? "Formula zona % FC massima" : "Zone %HRmax formula"}
            explanation={lc === "it" ? "Percentuale diretta della FC massima." : "Direct percentage of max heart rate."}
            variables={[]}
            example={{
              label: lc === "it" ? "Esempio" : "Example",
              lines: lc === "it" ? ["FC max 180, 70% → 126 bpm"] : ["Max HR 180, 70% → 126 bpm"],
            }}
          />
          <FormulaCard
            heading={lc === "it" ? "Zona, metodo Karvonen (% riserva)" : "Zone, Karvonen method (%reserve)"}
            tex={lc === "it" ? KARVONEN_ZONE_LATEX_IT : KARVONEN_ZONE_LATEX}
            ariaLabel={lc === "it" ? "Formula zona Karvonen" : "Karvonen zone formula"}
            explanation={
              lc === "it"
                ? "Percentuale della riserva cardiaca (FC max meno FC a riposo), sommata alla FC a riposo."
                : "Percentage of heart rate reserve (max HR minus resting HR), added back to resting HR."
            }
            variables={[]}
            example={{
              label: lc === "it" ? "Esempio" : "Example",
              lines:
                lc === "it"
                  ? ["FC max 180, FC riposo 60, 70% → 60 + 120×0,70 = 144 bpm"]
                  : ["Max HR 180, resting HR 60, 70% → 60 + 120×0.70 = 144 bpm"],
            }}
          />
        </div>
      </LabsProseSection>

      <LabsProseSection heading={section("whyDevicesDisagree").heading}>
        {section("whyDevicesDisagree").paragraphs.map((p, i) => (
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
        ctaId="labs-heart-rate-zones-sync-cta"
        ctaPlacement="labs_tool_footer"
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
