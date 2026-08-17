# Claude Sprint - Translation Review, Site

Date: 2026-06-23

Scope: `fitthesite` only.

## Goal

Review the surgical translation fixes already applied by Codex. Do not retranslate the whole site. Improve only the edited values where wording is clearly non-native, misleading, or terminologically wrong.

## Current Status

Codex already fixed:

- CJK/wrong-script leaks in non-CJK locales.
- `__FM_*` placeholders and prompt artifacts in rendered site content.
- Extra artifact family `__FM_APP_1`.
- CJK fragments hidden inside array strings.
- Cyrillic mojibake such as `pанel`.
- Obvious `KVKK` / `RODO` substitutions where the text should say Garmin, Polar, Strava, Health Connect, or dashboard.

## What Codex Corrected

This is the cleanup already done. Claude should treat these as fixed values to review for naturalness, not as a request to redo the whole translation layer.

### Provider Pages

- `lib/providers/data.ts`
  - Replaced German Galaxy Watch FAQ answers that were mostly Chinese with German content.
  - Replaced German Withings FAQ answers that were mostly Chinese with German content.
  - Removed Chinese fragments from French Mi Band answers.
  - Removed Chinese instruction leakage from a Polish Amazfit answer.
  - Fixed a Turkish Garmin Body Battery question containing Chinese.

- `lib/providers/models.ts`
  - Removed Chinese/model-failure fragments from Turkish model copy.
  - Fixed a Spanish model paragraph that ended with Chinese.
  - Fixed a Japanese Polar Pacer Pro paragraph containing Chinese `同步` and awkward product naming.

### Landing Pages

- `lib/landing/data.ts`
  - Removed all visible `__FM_*` / `value_of...` placeholder artifacts found in landing copy.
  - Fixed CJK/prompt leaks in Polish and Turkish hero, FAQ, CTA, and body copy.
  - Replaced repeated Turkish CTA artifacts such as `Gübre试用版免费参与` and `Güçlendirici betanın...` with `Ücretsiz betaya katıl`.
  - Fixed Garmin sections where `RODO` / `KVKK` had replaced Garmin/dashboard wording.
  - Fixed Polar sections where Turkish `KVKK + FitMesh` had replaced `Polar + FitMesh`.
  - Fixed Oura copy where `__FM_APP_1__` leaked instead of `Oura`.
  - Fixed Cyrillic mojibake in Polish/Turkish dashboard words, including `pанel`.
  - Fixed Polish mojibake such as `byÅ¼ystwo` / `kosztowaÄ‡`.
  - Fixed Turkish and Polish iOS/Apple Health landing snippets that mixed wrong terminology or corrupted script.

### Blog Posts

- `lib/blog/posts/best-smartwatch-for-elderly.ts`
  - Replaced Chinese-contaminated Polish paragraph and dementia FAQ title.

- `lib/blog/posts/fitmesh-arriva-su-iphone.ts`
  - Replaced Chinese-contaminated Polish Apple Health bridge paragraph.

- `lib/blog/posts/google-fit-cierra-alternativas-health-connect.ts`
  - Replaced mixed English/Chinese content in a Polish paragraph.

- `lib/blog/posts/novita-fonte-del-dato.ts`
  - Removed Chinese translator preamble from Polish metadata/body copy.

- `lib/blog/posts/novita-anello-colmi-sonno.ts`
  - Removed Chinese instruction/preamble leakage in Polish.

- `lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts`
  - Removed Chinese from Polish/Turkish strings.
  - Removed `__FM_PH_0__`, `__FM_URL_0__`, and `__FM_HTML_0__` artifacts from Turkish keywords/body.
  - Rewrote Turkish battery optimization and Health Connect permission paragraphs enough to be readable.

- `lib/blog/posts/scegliere-smartwatch-dati-2026.ts`
  - Removed Chinese fragments from Turkish/Polish headings and comparison labels.
  - Removed `__FM_*` placeholders from Turkish and Polish body/checklist text.
  - Cleaned some high-confidence Turkish accents/phrasing in touched values.

- `lib/blog/posts/piu-smartwatch-insieme-dati-doppi.ts`
  - Removed `__FM_PH_0__` artifacts from Turkish keywords/table rows.
  - Replaced `KVKK` where it had incorrectly replaced HRV/Garmin/Health Connect terminology in touched strings.

- `lib/blog/posts/dati-pixel-watch-dashboard.ts`
  - Removed `__FM_PH_0__` / `__FM_HTML_0__` from Turkish table rows.
  - Fixed Turkish Pixel Watch GPS FAQ question.
  - Cleaned a Turkish/Polish founder CTA paragraph with Cyrillic mojibake.

- `lib/blog/posts/dati-anello-smart-apple-salute.ts`
  - Removed a large prompt-instruction leak from the Turkish "How to activate the bridge" heading.
  - Fixed Polish/Turkish bridge heading wording.

- `lib/blog/posts/migliori-anelli-economici.ts`
  - Removed `__FM_*` artifacts and Chinese from Turkish keywords and heading.

- `lib/blog/posts/health-connect-not-syncing.ts`
  - Removed a long `__FM_*` placeholder chain from Turkish reset copy.
  - Removed Chinese fragments from Turkish reset/checklist bullets.

- `lib/blog/posts/guida-sync-wearable-2026.ts`
  - Removed `__FM_*` placeholders from Turkish/Polish device comparison rows and links.
  - Replaced incorrect `KVKK` / `RODO` substitutions for Fitbit, Garmin, Huawei, and Strava rows.
  - Fixed the Polish Pixel Watch markdown link that contained `[__FM_URL_0__]`.
  - Removed Chinese from Turkish Strava row.

- `lib/blog/posts/google-health-google-fit.ts`
  - Replaced a Korean sentence that ended in Chinese with Korean copy.

- `lib/blog/posts/garmin-samsung-health-sync-guide.ts`
  - Replaced Japanese `同步` with `同期`.

- `lib/blog/posts/novita-dashboard-multi-device.ts`
  - Fixed Polish Cyrillic mojibake in `pанel` and made the touched paragraph readable.

Verification passed:

```bash
rg -n "__FM_[A-Z]+_\\d+|value_of|硬件无法|无法直接处理|译者注|请确认|保持每个标记|Qwen|阿里云|同步|不起作用|pанel|byÅ|Güçlendirici betanın|Gübre|试用版|免费参与|订阅|取得一次|alım指南" \
  fitthesite/lib fitthesite/app \
  -g '*.ts' -g '*.tsx' -g '*.json'
```

Expected: no hits.

```bash
git -C fitthesite diff --check
```

Expected: no output.

## Review Files

Prioritize the files currently changed by Codex:

- `lib/landing/data.ts`
- `lib/providers/data.ts`
- `lib/providers/models.ts`
- `lib/blog/posts/guida-sync-wearable-2026.ts`
- `lib/blog/posts/health-connect-not-syncing.ts`
- `lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts`
- `lib/blog/posts/scegliere-smartwatch-dati-2026.ts`
- `lib/blog/posts/piu-smartwatch-insieme-dati-doppi.ts`
- `lib/blog/posts/dati-pixel-watch-dashboard.ts`
- `lib/blog/posts/dati-anello-smart-apple-salute.ts`
- `lib/blog/posts/migliori-anelli-economici.ts`
- `lib/blog/posts/smartwatch-estate-2026.ts`
- `lib/blog/posts/fitmesh-arriva-su-iphone.ts`
- `lib/blog/posts/google-health-google-fit.ts`
- `lib/blog/posts/google-fit-cierra-alternativas-health-connect.ts`
- `lib/blog/posts/garmin-samsung-health-sync-guide.ts`
- `lib/blog/posts/novita-dashboard-multi-device.ts`
- `lib/blog/posts/novita-fonte-del-dato.ts`
- `lib/blog/posts/novita-anello-colmi-sonno.ts`
- `lib/blog/posts/best-smartwatch-for-elderly.ts`

## Instructions

1. Inspect only the current diff against HEAD.
2. Improve native quality only where Codex touched values.
3. Preserve object shape, keys, slugs, URLs, Markdown, product names, and route references.
4. Do not touch `package-lock.json`; it was already modified before this cleanup.
5. Do not introduce new translation systems or broad refactors.
6. Keep terminology consistent:
   - Health Connect stays `Health Connect`.
   - Apple Health can stay `Apple Health` unless the locale already consistently localizes it.
   - Garmin, Polar, Fitbit, Oura, Strava, Withings, Galaxy Watch, Pixel Watch stay as brand/product names.
   - Use GDPR/RODO/KVKK only when the source text is actually about privacy law, not as a replacement for product names or data systems.

## Highest-Value Review Areas

- Turkish values edited by Codex: many were corrected from severe artifacts but may still need native phrasing.
- Polish values edited by Codex: check grammar and whether `beta`, `dashboard`, `founder`, `wearable` should be localized or left as product-market terms.
- Japanese/Korean values touched in the extra sweep:
  - `lib/providers/models.ts`
  - `lib/blog/posts/google-health-google-fit.ts`
  - `lib/blog/posts/garmin-samsung-health-sync-guide.ts`
- Landing page CTAs in `lib/landing/data.ts`: make sure repeated CTA labels sound consistent by locale.

## Acceptance Criteria

- The two verification commands above still pass.
- Wrong-script check still reports `TOTAL 0`.
- No broad retranslation or unrelated churn.
- Final report lists only:
  - files touched,
  - notable terminology decisions,
  - any remaining risky passages that should be reviewed by a native speaker.

## Reference Map

See `docs/translation-error-map-2026-06-23.md` for the full error map and chronology of Codex fixes.
