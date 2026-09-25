# P1.26 cover diversification ledger

Date: 2026-09-24. Status: local branch only, not published.

Six existing articles received distinct conceptual cover images in place of
frequently reused category covers. The pictures show generic devices, not
photographs or specifications of a named commercial product. No article text,
SEO title, URL, publication date or update date changed.

| Post slug | Previous cover | New cover | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| `anello-vs-smartwatch` | `flow.webp` | `ring-vs-smartwatch.webp` | 63,968 | `250901c0f3240af0ea9571295dadd54bc5ce53bc0e6b15c85361345e58025aa8` |
| `sleep-tracker-comparison-2026` | `flow.webp` | `sleep-tracker-comparison.webp` | 58,786 | `b3de29f3c7cce253cdde08810e2ec5a51f58c679ca2b19cf7c4967e32a14e41f` |
| `vo2-max-wearable-comparison-2026` | `flow.webp` | `vo2-max-wearable-comparison.webp` | 86,972 | `000116c3a8674492fd2878020c373c50973f1d45d89a5301ccdf3000318d7867` |
| `anello-smart-guida-completa` | `ring.webp` | `smart-ring-complete-guide.webp` | 63,396 | `59cf1058863fb3740205d21a57e5a3945ef8d54c20de6b38213cb42a8b98361d` |
| `migliori-anelli-economici` | `flow.webp` | `budget-smart-rings.webp` | 65,810 | `a70b6b8a6be08ad497654a06c056452102c1bcee0121a204ffd87019e92fb839` |
| `piu-smartwatch-insieme-dati-doppi` | `wearables.webp` | `multiple-smartwatches-duplicate-data.webp` | 59,300 | `b5948108af9ce82d48cb22bf6e024d740eb856e196fbbd97d3a08926c7975e84` |

Generation used the built-in imagegen mode. The prompt set asked for six
different editorial scenes: a ring next to a watch, bedtime sleep trackers,
running-track watches, a ring beside a phone, three low-cost ring designs,
and two watches with abstract data lines. Shared direction: warm stone,
graphite devices, restrained aqua accents, natural light, realistic materials,
no brands, no words, no watermarks, no identifiable product UI. The images
were generated at 1672 x 941, visually inspected, then converted with a
center crop to 1200 x 675 WebP at quality 80 with metadata stripped.

The existing cover map is the single source for the visible image and the
`BlogPosting.image` URL. In P1.26-IMG-A and P1.26-IMG-B, alternative text was completed for all
indexable locales across all six posts, accounting for the nordic overlay:
- 4 posts with 13 indexable locales (`anello-smart-guida-completa`, `migliori-anelli-economici`, `sleep-tracker-comparison-2026`, `vo2-max-wearable-comparison-2026`) have explicit alt text across all 13 indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da). In P1.26-IMG-B, the 8 missing SV and DA alternative texts were added. NO and FI remain excluded (noindex/incomplete content).
- 2 posts with 2 indexable locales (`anello-vs-smartwatch`, `piu-smartwatch-insieme-dati-doppi`) have explicit alt text in it and en.
- Total indexable variants across the six posts: 56 (4 x 13 + 2 x 2).
Review classification: `AGENT_EDITORIALLY_REVIEWED` (not NATIVE_REVIEWED). JA/KO and SV/DA texts are agent-reviewed translations describing the visual scene; a subsequent editorial quality pass is planned for the body copy of older localized pillars. The sitewide
`opengraph-image.tsx` template still generates generic social cards; it was
not changed in this image-only batch. No additional image sitemap or schema
type was added, since the images are already in HTML and `BlogPosting`.

Validation: visual inspection of all six crops; each asset is a simple VP8
WebP, one frame, no alpha or extended metadata, 1200 x 675; the existing
cover-map guardrail passed with 70 explicit post mappings, 31 present image
files, and no byte-identical duplicates. Automated test in `lib/blog/indexability.test.ts`
applies the nordic overlay to post clones and verifies that every one of the 56
indexable variants has an explicit `coverAlt` that never falls back to the H1 (`hero.title`).
Typecheck, governance, suite perimeter and a clean production build passed. Live HTTP checks
remain pending until a separately authorized release.
