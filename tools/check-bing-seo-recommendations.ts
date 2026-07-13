import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { isBlogVariantIndexable } from "@/lib/blog/indexability";
import { tl } from "@/lib/blog/types";
import { PROVIDERS_BY_SLUG } from "@/lib/providers/data";
import { isProviderVariantIndexable } from "@/lib/providers/indexability";
import { toMetaDescription } from "@/lib/seo/meta-description";

const errors: string[] = [];

const bingTitleCases = [
  "esportare-dati-fitbit-google",
  "esportare-dati-garmin",
];

for (const slug of bingTitleCases) {
  const post = BLOG_POSTS_BY_SLUG[slug];
  if (!post) {
    errors.push(`post mancante: ${slug}`);
    continue;
  }
  const renderedTitle = `${tl(post.hero.title, "en")} · FitMesh`;
  if (renderedTitle.length > 70) {
    errors.push(`title EN oltre 70c (${renderedTitle.length}): ${slug}`);
  }
}

const bingMetaCases = [
  { locale: "en", provider: "suunto" },
  { locale: "en", provider: "oura" },
  { locale: "en", provider: "galaxy-watch" },
  { locale: "en", provider: "oneplus-health" },
  { locale: "ja", provider: "withings" },
  { locale: "en", provider: "smartphone-android" },
  { locale: "en", provider: "amazfit-zepp" },
] as const;

for (const { locale, provider: slug } of bingMetaCases) {
  const provider = PROVIDERS_BY_SLUG[slug];
  if (!provider) {
    errors.push(`provider mancante: ${slug}`);
    continue;
  }
  const source = provider.longDesc[locale] ?? provider.longDesc.en;
  const description = toMetaDescription(source);
  if (description.length < 150 || description.length > 160) {
    errors.push(
      `meta description fuori 150-160c (${description.length}): /${locale}/sync/${slug}`,
    );
  }
  if (!isProviderVariantIndexable(provider, locale)) {
    errors.push(`provider segnalato da Bing ancora noindex: /${locale}/sync/${slug}`);
  }
}

const healthConnectPost = BLOG_POSTS_BY_SLUG["health-connect-not-syncing"];
if (!healthConnectPost || !isBlogVariantIndexable(healthConnectPost, "nl")) {
  errors.push("la variante NL di health-connect-not-syncing è ancora noindex");
}

if (errors.length > 0) {
  console.error(`❌ Bing SEO guardrail: ${errors.length} problema/i`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  "✅ Bing SEO guardrail: 2 title ≤70c, 7 meta description 150-160c, variante NL indicizzabile.",
);
