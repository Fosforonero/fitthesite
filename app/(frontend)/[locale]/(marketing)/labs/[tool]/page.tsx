import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/product-facts";
import { allLabsStaticParams, labsToolByLocalizedSlug, localizedLabsSlug, relatedLabsTools, lt } from "@/lib/labs/registry";
import { resolveLabsLocale } from "@/lib/labs/locale-redirect";
import { HRV_TOOL_CONTENT } from "@/lib/labs/hrv/content";
import { SLEEP_EFFICIENCY_TOOL_CONTENT } from "@/lib/labs/sleep-efficiency/content";
import { HrvToolPageBody } from "@/components/labs/pages/HrvToolPageBody";
import { SleepEfficiencyToolPageBody } from "@/components/labs/pages/SleepEfficiencyToolPageBody";

/**
 * Router sottile fra i tool live (P1.1 Fase 5): il rendering vero e proprio
 * vive in components/labs/pages/<Tool>PageBody.tsx, uno per tool - questo
 * file sceglie solo quale montare in base a `found.key`. Generalizzato da
 * un file originariamente hardcoded solo su HRV (sprint P1.0), quando è
 * arrivato il secondo tool live (Sleep Efficiency), come previsto dal
 * commento che c'era qui prima.
 */

function metaForTool(key: string, lc: "it" | "en") {
  if (key === "hrv-rmssd") {
    return { title: lt(HRV_TOOL_CONTENT.metaTitle, lc), description: lt(HRV_TOOL_CONTENT.metaDescription, lc) };
  }
  return { title: lt(SLEEP_EFFICIENCY_TOOL_CONTENT.metaTitle, lc), description: lt(SLEEP_EFFICIENCY_TOOL_CONTENT.metaDescription, lc) };
}

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

  const path = `/${lc}/labs/${localizedLabsSlug(found, lc)}`;
  const { title, description } = metaForTool(found.key, lc);

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: {
        it: `${SITE_URL}/it/labs/${localizedLabsSlug(found, "it")}`,
        en: `${SITE_URL}/en/labs/${localizedLabsSlug(found, "en")}`,
        // P1.1 Fase 1: x-default -> inglese, stesso motivo di labs/page.tsx.
        "x-default": `${SITE_URL}/en/labs/${localizedLabsSlug(found, "en")}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      type: "website",
      // Nessun `images` esplicito: la convenzione file `opengraph-image.tsx`
      // (generateImageMetadata per tool+locale) inietta l'URL corretto con
      // hash + id automaticamente. Un `images` manuale qui sovrascriverebbe
      // quell'iniezione con un URL senza hash/id che risulta sempre 404
      // (trovato P1.3: verificato in produzione locale, entrambi i due
      // `opengraph-image.tsx` di Labs usano generateImageMetadata, quindi
      // la route reale ha sempre un segmento [__metadata_id__] che un URL
      // costruito a mano non può replicare).
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

  const lc = resolved;
  const path = `/${lc}/labs/${localizedLabsSlug(found, lc)}`;
  const otherTools = relatedLabsTools(found);

  if (found.key === "hrv-rmssd") {
    return <HrvToolPageBody found={found} otherTools={otherTools} lc={lc} path={path} />;
  }
  return <SleepEfficiencyToolPageBody found={found} otherTools={otherTools} lc={lc} path={path} />;
}
