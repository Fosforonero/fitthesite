# Site Translation Error Map - 2026-06-23

Scope: `fitthesite` SEO/content translations. This map is for a surgical cleanup pass, not a full retranslation.

Current status:
- UI dictionaries look structurally healthy: `fitthesite/lib/dictionaries/*.json` has 130 keys per locale and no missing keys.
- Main risk is generated SEO/programmatic content: landing pages, blog posts, provider pages, and model comparison copy.
- Two high-confidence error families were found:
  - CJK/script leak in non-CJK locales (`en/es/de/fr/pt/pl/tr/nl`).
  - Pipeline/prompt artifacts left in final content (`__FM_PH_0__`, `__FM_URL_0__`, `value_of...`, Chinese model notes, etc.).

Update 2026-06-23, Codex pass:
- Phase 1 public-critical corrections were applied in:
  - `fitthesite/lib/providers/data.ts`
  - `fitthesite/lib/landing/data.ts`
- Fixed: German Galaxy Watch FAQ block, German Withings FAQ block, French Mi Band answers, Polish Amazfit answer, Turkish Garmin Body Battery question, and the most visible landing-page CJK/prompt leaks listed in Phase 1.
- Remaining wrong-script scan after this pass reports 14 hits, all outside the Phase 1 provider/landing blocks and covered by Phase 2 below.
- Remaining `__FM_*`/prompt artifacts are still expected until Phase 3.
- Update 2026-06-23, second Codex pass:
  - Phase 2 wrong-script leaks were corrected.
  - Extra wrong-script leaks in Polish arrays were also corrected in `scegliere-smartwatch-dati-2026.ts` and `novita-anello-colmi-sonno.ts`.
  - The exact wrong-script verification command now reports `TOTAL 0`.
  - Artifact scan still reported 36 hits before Phase 3.
- Update 2026-06-23, third Codex pass:
  - Phase 3 placeholder/prompt artifacts were corrected in `fitthesite/lib/landing/data.ts` and the affected blog posts.
  - The artifact verification command now returns no public-content hits.
  - The exact wrong-script verification command still reports `TOTAL 0`.
  - `git diff --check` passes.
- Update 2026-06-23, fourth Codex pass:
  - A tighter quality sweep fixed remaining high-confidence artifacts not caught by the first regex, including generic `__FM_APP_1`, CJK fragments inside array strings, Cyrillic-looking `pанel` mojibake, and several obvious `KVKK`/`RODO` brand substitutions.
  - Additional files touched in this sweep: `google-health-google-fit.ts`, `garmin-samsung-health-sync-guide.ts`, `novita-dashboard-multi-device.ts`, plus nearby landing/blog values already in scope.
  - Expanded artifact grep now returns no hits for: `__FM_[A-Z]+_\d+`, `value_of`, known Chinese prompt phrases, `pанel`, `byÅ`, `Güçlendirici betanın`, `Gübre`, and the specific Chinese fragments found in Turkish/Korean/Japanese strings.
  - `git diff --check` still passes.

Suggested fix order:
1. Done: fix all P0 CJK leaks below.
2. Done: fix all P1 unresolved placeholder/prompt artifacts below.
3. Done: re-run the verification commands at the bottom.
4. Next: Claude should do a light linguistic pass on the edited values only.

Do not retranslate the whole file unless necessary. Replace only the bad locale value, preserving object shape, slugs, product names, URLs, Markdown, and route references.

## Token-Saving Priority Plan

Use this if fixing in multiple Claude passes. Each phase is intentionally small enough to be handled surgically.

### Phase 1 - Public Critical / Highest Embarrassment

Status: done by Codex on 2026-06-23. Claude should review the edited values for native quality, not retranslate entire files.

Goal: remove obvious Chinese/model leakage from high-traffic public pages and provider pages.

Fix first:
- `fitthesite/lib/providers/data.ts`
  - All P0 entries at lines 197-322: German Galaxy Watch FAQ block is mostly Chinese.
  - Lines 4902-4999: German Withings FAQ block is mostly Chinese.
  - Lines 1402, 1458: French Mi Band FAQ answers contain Chinese.
  - Line 2113: Polish Amazfit answer contains Chinese instruction.
  - Line 3308: Turkish Garmin Body Battery question contains Chinese.
- `fitthesite/lib/landing/data.ts`
  - Lines 1437, 1477, 1780, 1900, 3436, 3597, 3994: severe model/prompt leakage.
  - Lines 366, 1053, 1670, 2767, 2977, 3707: short but visible CTA/headline leaks.

Stop after Phase 1 and run both verification commands. This should remove most screenshot-visible disasters.

### Phase 2 - Blog Posts With CJK In Wrong Locale

Status: done by Codex on 2026-06-23. Claude should review edited values for native quality.

Goal: fix article-level contamination that can hurt SEO snippets and reader trust.

Fix:
- `fitthesite/lib/blog/posts/scegliere-smartwatch-dati-2026.ts`: lines 893, 995, 1400, 1623.
- `fitthesite/lib/blog/posts/best-smartwatch-for-elderly.ts`: lines 355, 1125.
- `fitthesite/lib/blog/posts/fitmesh-arriva-su-iphone.ts`: line 878.
- `fitthesite/lib/blog/posts/google-fit-cierra-alternativas-health-connect.ts`: line 778.
- `fitthesite/lib/blog/posts/novita-fonte-del-dato.ts`: line 95.
- `fitthesite/lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts`: line 263.
- `fitthesite/lib/blog/posts/smartwatch-estate-2026.ts`: line 280.
- `fitthesite/lib/providers/models.ts`: lines 1563, 2024, 2139.

Stop after Phase 2 and rerun the wrong-script scan. Target: `TOTAL 0`.

### Phase 3 - Placeholder / Prompt Artifacts In Public Content

Status: done by Codex on 2026-06-23. Claude should review edited values for native quality and terminology only.

Goal: remove `__FM_*`, `value_of...`, and prompt debris that may render literally.

Fix:
- `fitthesite/lib/landing/data.ts`: lines 74, 322, 545, 565-568, 649, 992, 2651, 2859, 3681, 3911 plus any Phase 1 overlap.
- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts`: lines 722, 747, 856, 861, 1436, 1584, 1664.
- `fitthesite/lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts`: lines 138, 325, 489, 751.
- `fitthesite/lib/blog/posts/scegliere-smartwatch-dati-2026.ts`: lines 506, 1158, 1526.
- `fitthesite/lib/blog/posts/dati-pixel-watch-dashboard.ts`: lines 462, 952.
- `fitthesite/lib/blog/posts/migliori-anelli-economici.ts`: lines 133, 322.
- `fitthesite/lib/blog/posts/piu-smartwatch-insieme-dati-doppi.ts`: lines 139, 818.
- `fitthesite/lib/blog/posts/dati-anello-smart-apple-salute.ts`: line 584.
- `fitthesite/lib/blog/posts/health-connect-not-syncing.ts`: line 991.
- `fitthesite/lib/blog/posts/novita-anello-colmi-sonno.ts`: line 141.
- `fitthesite/lib/blog/posts/smartwatch-estate-2026.ts`: line 425.

Stop after Phase 3 and rerun the artifact `rg`. Target: no rendered-content hits.

### Phase 4 - Quality Polish Only Where Already Touched

Status: partially done by Codex on 2026-06-23. Claude should now review wording quality, terminology, and locale-native phrasing without broad retranslation.

Goal: improve bad-but-not-broken phrasing without spending tokens on the whole site.

Review only the edited neighborhood, especially:
- Turkish values containing `KVKK` where the source was not actually about Turkish privacy law.
- Polish values with English/Italian residue.
- Repeated CTA blocks in `fitthesite/lib/landing/data.ts`.
- Provider FAQ blocks in `fitthesite/lib/providers/data.ts` around the fixed Galaxy Watch, Mi Band, Amazfit, Garmin, and Withings sections.

## P0 - CJK / Wrong-Script Leaks

These are exact matches where a non-CJK locale value contains Chinese/Japanese/Korean characters.

### `fitthesite/lib/providers/data.ts`

- Line 197, `de`: `Wie同步我的Galaxy Watch与FitMesh？`
- Line 210, `de`: Chinese sentence for Galaxy Watch sync instructions.
- Line 225, `de`: `FitMesh从Galaxy Watch导入哪些数据？`
- Line 238, `de`: Chinese sentence for Galaxy Watch imported data.
- Line 253, `de`: Chinese question about missing Galaxy Watch data.
- Line 266, `de`: Chinese troubleshooting answer for Samsung Health / Health Connect permissions.
- Line 281, `de`: Chinese question about Galaxy Watch 4/5/6/7 support.
- Line 294, `de`: Chinese answer about supported Galaxy Watch models.
- Line 309, `de`: Chinese question about web dashboard access.
- Line 322, `de`: Chinese answer about web dashboard health data.
- Line 966, `de`: Mixed German + Chinese in Pixel Watch tech note.
- Line 1402, `fr`: French starts correctly, then Chinese Health Connect instructions.
- Line 1458, `fr`: French starts correctly, ends with Chinese `同步`.
- Line 2113, `pl`: Polish/Amazfit text ends with Chinese model instruction.
- Line 3308, `tr`: Turkish key contains Chinese question about Garmin Body Battery.
- Line 4902, `de`: Chinese question about Withings device sync.
- Line 4915, `de`: Chinese Withings Health Mate / Health Connect instructions.
- Line 4930, `de`: Chinese question about compatible Withings devices.
- Line 4943, `de`: Chinese answer about Withings device support.
- Line 4958, `de`: Chinese question about body composition data.
- Line 4971, `de`: Chinese answer about Withings body composition metrics.
- Line 4986, `de`: Chinese question about blood pressure readings.
- Line 4999, `de`: Chinese answer about Withings BPM Connect blood pressure.

### `fitthesite/lib/landing/data.ts`

- Line 366, `pl`: `Czy gotowy na automatyczny备份？`
- Line 1053, `tr`: Turkish/Russian/Chinese mix: `Ücretsiz beta期内...`
- Line 1437, `pl`: Polish starts, then Chinese model error about locale fallback.
- Line 1477, `tr`: Turkish starts, then Chinese sync sentence.
- Line 1670, `tr`: CTA text includes Chinese: `Gübre试用版免费参与`
- Line 1780, `tr`: Turkish starts, then Chinese translator note.
- Line 1900, `tr`: Severe prompt leakage with `__FM_*` placeholders and Chinese instructions.
- Line 2767, `pl`: Polish starts, then Chinese iPhone/Android duplicate-data question.
- Line 2977, `tr`: CTA text includes Chinese: `Gübre试用版免费参与`
- Line 3436, `tr`: Turkish starts, then Chinese instruction `登记以中文回答`.
- Line 3597, `tr`: Turkish starts, then Chinese medical/wellness disclaimer.
- Line 3707, `tr`: `Katıl beta测试iOS`
- Line 3994, `tr`: Turkish starts, then Chinese `免费` and placeholder noise.

### `fitthesite/lib/blog/posts/scegliere-smartwatch-dati-2026.ts`

- Line 893, `tr`: Turkish title includes Chinese `取得一次购买资格`.
- Line 995, `pl`: Polish title includes Chinese `订阅`.
- Line 1400, `tr`: Turkish sentence includes Chinese note `有一个空格`.
- Line 1623, `pl`: Polish question includes Chinese `订阅类型`.

### `fitthesite/lib/providers/models.ts`

- Line 1563, `es`: Spanish text ends with Chinese phrase about ecosystem preference.
- Line 2024, `tr`: Turkish text contains Chinese model failure message.
- Line 2139, `tr`: Turkish text contains Chinese model failure message.

### Other Blog Posts

- `fitthesite/lib/blog/posts/best-smartwatch-for-elderly.ts:355`, `pl`: Polish paragraph ends with Chinese explanation about cheap/unknown devices.
- `fitthesite/lib/blog/posts/best-smartwatch-for-elderly.ts:1125`, `pl`: Question begins Polish then Chinese.
- `fitthesite/lib/blog/posts/fitmesh-arriva-su-iphone.ts:878`, `pl`: Polish paragraph contains Chinese model explanation.
- `fitthesite/lib/blog/posts/google-fit-cierra-alternativas-health-connect.ts:778`, `pl`: English/Spanish/Chinese mixed in Polish locale.
- `fitthesite/lib/blog/posts/novita-fonte-del-dato.ts:95`, `pl`: Polish paragraph contains Chinese translator preamble.
- `fitthesite/lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts:263`, `pl`: Polish paragraph contains Chinese phrase.
- `fitthesite/lib/blog/posts/smartwatch-estate-2026.ts:280`, `pl`: Polish phrase contains Chinese `防水智能手表`.

## P1 - Placeholder / Prompt Artifacts

These values contain unresolved translation placeholders or prompt leakage. Some also overlap with P0.

### `fitthesite/lib/landing/data.ts`

- Line 74: Turkish keyword contains `__FM_PH_0__`.
- Line 322: Turkish setup text contains `__FM_URL_0__`.
- Line 545: Polish kicker contains `value_ofGoogle` / `value_ofFitbit`.
- Lines 565-568: `tr/nl/ja/ko` Fitbit copy still contains `__FM_URL_0__`.
- Line 649: Polish roadmap text contains `__FM_HTML_0__`.
- Line 992: Turkish text contains `__FM_PH_0__`.
- Line 1437: Polish model failure note.
- Line 1780: Turkish translator note in Chinese.
- Line 1900: Severe prompt leakage, many `__FM_*` placeholders.
- Line 2651: Polish text is almost entirely unresolved `__FM_*` placeholders.
- Line 2859: Turkish copy contains `__FM_URL_0__`.
- Line 3681: `pl` and `tr` kicker values are `FitMesh __FM_TERM_0__`.
- Line 3911: Turkish copy contains `__FM_URL_0__`.
- Line 3994: Turkish copy contains `__FM_*` placeholders and `KVKK` noise.

### Blog Posts

- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts:722`: Turkish text contains `__FM_PH_0__`.
- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts:747`: Turkish text contains `__FM_PH_0__`.
- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts:856`: Polish text contains `__FM_PH_0__`.
- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts:861`: Polish text contains `__FM_PH_0__`.
- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts:1436`: Polish markdown link contains `[__FM_URL_0__]`.
- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts:1584`: Turkish CTA text contains `__FM_URL_0__`.
- `fitthesite/lib/blog/posts/guida-sync-wearable-2026.ts:1664`: Turkish summary contains `__FM_TERM_4__` and `__FM_TERM_5__`.
- `fitthesite/lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts:138`: Turkish keyword contains `__FM_PH_0__` and `__FM_URL_0__`.
- `fitthesite/lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts:325`: Turkish body contains `__FM_HTML_0__`.
- `fitthesite/lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts:489`: Turkish paragraph likely mistranslated; review even though only partly placeholder-related.
- `fitthesite/lib/blog/posts/passi-non-si-sincronizzano-galaxy-watch.ts:751`: Turkish paragraph contains unresolved URL placeholder.
- `fitthesite/lib/blog/posts/scegliere-smartwatch-dati-2026.ts:506`: Turkish paragraph contains many `__FM_*` placeholders.
- `fitthesite/lib/blog/posts/scegliere-smartwatch-dati-2026.ts:1158`: Turkish paragraph contains unresolved URLs.
- `fitthesite/lib/blog/posts/scegliere-smartwatch-dati-2026.ts:1526`: Polish checklist contains many `__FM_*` placeholders.
- `fitthesite/lib/blog/posts/dati-pixel-watch-dashboard.ts:462`: Turkish bullet contains `__FM_PH_0__` and `__FM_HTML_0__`.
- `fitthesite/lib/blog/posts/dati-pixel-watch-dashboard.ts:952`: Turkish FAQ answer contains `__FM_PH_0__`.
- `fitthesite/lib/blog/posts/migliori-anelli-economici.ts:133`: Turkish keyword contains `__FM_PH_0__` and `__FM_URL_0__`.
- `fitthesite/lib/blog/posts/migliori-anelli-economici.ts:322`: Turkish paragraph contains many `__FM_*` placeholders.
- `fitthesite/lib/blog/posts/piu-smartwatch-insieme-dati-doppi.ts:139`: Turkish keyword contains `__FM_PH_0__`.
- `fitthesite/lib/blog/posts/piu-smartwatch-insieme-dati-doppi.ts:818`: Turkish text contains `__FM_PH_0__`.
- `fitthesite/lib/blog/posts/dati-anello-smart-apple-salute.ts:584`: Turkish paragraph contains prompt instructions and many `__FM_*` placeholders.
- `fitthesite/lib/blog/posts/health-connect-not-syncing.ts:991`: Turkish paragraph contains many `__FM_*` placeholders.
- `fitthesite/lib/blog/posts/novita-anello-colmi-sonno.ts:141`: Polish text contains Chinese instruction/preamble.
- `fitthesite/lib/blog/posts/smartwatch-estate-2026.ts:425`: Polish paragraph contains repeated `__FM_*` placeholders.

### `fitthesite/lib/providers/models.ts`

- Line 2024, `tr`: Chinese model failure message inside Turkish.
- Line 2139, `tr`: Chinese model failure message inside Turkish.

## P2 - Locale Quality Smells To Review After P0/P1

These are not mechanically guaranteed errors, but they are likely low-quality output discovered while scanning:

- Several Turkish strings use `KVKK` as if it replaced unrelated terms. Review nearby Turkish content in files listed under P1.
- Some Polish strings are awkward or mixed with English/Italian even when they do not contain CJK.
- `fitthesite/lib/landing/data.ts` has repeated rough CTA translations such as Turkish `Güçlendirici betanın içine gir...`; fix only if touching the same landing sections.
- `fitthesite/lib/providers/data.ts` likely has whole FAQ blocks generated in the wrong target language, especially German provider FAQs for Galaxy Watch and Withings.

## Verification Commands

Run from repo root:

```bash
# Exact wrong-script leaks in non-CJK locale literals.
python3 - <<'PY'
import pathlib,re,collections
files=[]
for root in [pathlib.Path('fitthesite/lib'), pathlib.Path('fitthesite/app')]:
    files += [p for p in root.rglob('*') if p.suffix in {'.ts','.tsx','.json'} and 'node_modules' not in str(p)]
cjk=re.compile(r'[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]')
pat=re.compile(r'\b(?P<lang>en|es|de|fr|pt|pl|tr|nl)\s*:\s*(?P<q>["\\'`])(?P<value>(?:\\\\.|(?!\\2).)*?)(?P=q)')
hits=[]
for p in files:
    for i,line in enumerate(p.read_text(errors='ignore').splitlines(),1):
        for m in pat.finditer(line):
            if cjk.search(m.group('value')):
                hits.append((p,i,m.group('lang'),m.group('value')[:120]))
for p,i,lang,v in hits:
    print(f'{p}:{i}: {lang}: {v}')
print(f'TOTAL {len(hits)}')
PY
```

```bash
# Unresolved placeholder / prompt artifacts.
rg -n "__FM_(PH|URL|HTML|LINK|CODE|FENCE|BRAND|TERM)_\\d+|value_of|硬件无法|无法直接处理|译者注|请确认|保持每个标记|Qwen|阿里云" \
  fitthesite/lib fitthesite/app \
  -g '*.ts' -g '*.tsx' -g '*.json'
```

Expected after cleanup:
- The first command should report `TOTAL 0`, except any deliberately allowed non-CJK locale value must be documented inline.
- The second command should return no public content hits. If placeholder tokens are intentionally used in tooling code, they should not be in rendered SEO/app content.
