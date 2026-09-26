# P1.29-IMG Cover Integration Ledger

Date: 2026-09-26. Status: local branch `feat/p129-editorial-covers` only, not published.

Integration of approved editorial WebP covers (1200x675) from `/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite-image-proposals/2026-09-26/` into the Fosforonero blog editorial style, alongside dedicated 1200x630 social preview cards.
Technical and visual update only: no article rewriting, no SEO title or meta description changes, no lastmod bump. The 5 CTR-protected URLs remain frozen and untouched.

## 1. Inventory & Asset Status

### Editorial Covers (1200x675 WebP)

| Source File | Destination File | Post Slug | Previous Cover | Status | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | ---: | --- |
| `huawei-health-path-editorial-concept.webp` | `public/blog/covers/huawei-health-path.webp` | `huawei-health-health-connect-sincronizzazione` | `devices.webp` (`sync`) | **INTEGRATED** | 135,604 | `8bad57cb1689b9965cccc4ca8c93dbfc5e319d495b0b20f9d131c22f5d116da2` |
| `galaxy-watch-steps-troubleshooting-concept.webp` | `public/blog/covers/galaxy-watch-steps-troubleshooting.webp` | `passi-non-si-sincronizzano-galaxy-watch` | `gear.webp` (`troubleshooting`) | **INTEGRATED** | 159,276 | `48af6b6df36a75aa1cbbe00d056938176d8a650278d438c607375a8552aef053` |
| `recovery-metrics-editorial-concept.webp` | — | `metriche-recupero-hrv-sonno-frequenza-cardiaca` | `hearth.webp` (`metrics`) | **GATE FAILED (HOLD)** | 176,976 | `dfff2a6ca0323643a16b9737576cb4b3e93e5e264f9019f903c3a93ebfdaa982` |
| `how-fitmesh-works-editorial-concept.webp` | — | `come-funziona-fitmesh` | `how-fitmesh-works.webp` (`fitmeshOverview`) | **HELD (PR #87 DEP)** | 141,020 | `6339208bd112374e808dff633cf392c66b49d89e62cc502ffe99bccacc9d101c` |

### Social Preview Assets (1200x630 PNG)

| Source Cover | Destination File | Post Slug | Framing / Adaptation | Bytes | SHA-256 |
| --- | --- | --- | --- | ---: | --- |
| `huawei-health-path.webp` | `public/blog/social/huawei-health-path.png` | `huawei-health-health-connect-sincronizzazione` | Top -30px (desk/leaves), bottom -15px. Preserves notebook, paths, watch, phone, pencil, and coffee cup. | 1,019,578 | `daf0327398696d5fa666136e05c26b38cff1a6034f3a763836d50711eb6aa891` |
| `galaxy-watch-steps-troubleshooting.webp` | `public/blog/social/galaxy-watch-steps-troubleshooting.png` | `passi-non-si-sincronizzano-galaxy-watch` | Top -45px (window frame/upper leaves), bottom 0px. Preserves pencil eraser, spiral, watch, phone with screen off. | 1,207,197 | `e120bd0750ab3dd53df0580792cbccdc2612ec9bbfa8959d28e51b3f9fc3d7fa` |

## 2. Gate Decisions & Visual Truth Audit

### Cover 1: Huawei Health Path (`huawei-health-path.webp`) — PASS
- **Visual evaluation**: Overhead perspective of an indie developer's workbench with an unbranded round smartwatch on the left, an unbranded phone with dark/blank display on the right, and an open paper notebook showing two separate, disconnected hand-drawn pencil paths and an empty checkbox.
- **Visual truth**: The illustration strictly depicts two separate, unconnected path fragments on paper, with no direct connecting beam, arrow or link between the devices, and no fake application UI. It reflects the documented path described in the article: in instructions provided by Huawei no official direct route to Health Connect is documented, nor does FitMesh code have a direct Huawei connector, leaving data transfer on Android to be evaluated case-by-case via third-party bridge apps or manual exports. No absolute claims regarding vendor platforms are asserted.
- **Alt text**: 13 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da). In all locales, screen off is strictly distinguished from phone off (e.g. PL uses `smartfona z wyłączonym ekranem`).

### Cover 2: Galaxy Watch Steps Troubleshooting (`galaxy-watch-steps-troubleshooting.webp`) — PASS
- **Visual evaluation**: Morning light worktable with an unbranded round smartwatch with side buttons, an unbranded phone with screen turned off, and a notebook showing a simple hand-drawn troubleshooting path made of dots, arrows, and checkboxes.
- **Visual truth**: Round smartwatch evokes the generic hardware category without trademarks, logos, or Samsung branding. No fake UI, no clinical claims, no completed sync implied. Fully compliant.
- **Alt text**: 13 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da). Corrected Polish alt from `wyłączonego smartfona` (phone off) to `smartfona z wyłączonym ekranem` (screen off), aligning with visual reality and the remaining 25 alts.

### Cover 3: Recovery Metrics (`recovery-metrics-editorial-concept.webp`) — GATE FAILED (HOLD)
- **Visual evaluation**: The notebook depicts three hand-drawn pencil traces. The middle trace displays a distinct clinical ECG waveform with sharp P-QRS-T complexes.
- **Visual truth failure**: FitMesh is a consumer fitness/wellness app, not a medical diagnostic device (confirmed by medical disclaimer). Presenting a clinical ECG trace is potentially misleading for users seeking non-clinical HRV/recovery tracking.
- **Action**: STOP. Image held, not copied to `public/` to prevent orphan file violations or unintended publication. Variant proposed to Matteo: substitute the clinical ECG trace with a smooth resting pulse wave or abstract daily recovery trend.

### Cover 4: How FitMesh Works (`how-fitmesh-works-editorial-concept.webp`) — HELD PENDING PR #87
- **Dependency**: PR #87 (`content/p128-pillar-come-funziona-fitmesh`) is currently OPEN and directly modifies `lib/blog/posts/come-funziona-fitmesh.ts`.
- **Strategy declaration**: Integrating Cover 4 in this branch would require editing `come-funziona-fitmesh.ts` to add descriptive `coverAlt` texts (to avoid falling back to H1), creating a merge conflict with PR #87. Alternatively, adding the file to `public/blog/covers/` without updating the post or mapping would violate the orphan guardrail. Therefore, Cover 4 is held and will be integrated after PR #87 is merged (or on PR #87's branch).

## 3. Verification & Guardrails

- `tools/check-p15c-cover-map.ts`: PASS (70 posts with explicit covers, 33 files at 1200x675, 0 orphans, 0 unapproved duplicates).
- `tools/check-governance.ts`: PASS (snapshot 1.0.0, 0 new em-dashes).
- `tools/check-p18s-informative-alt.ts`: PASS (0 empty alts without aria-hidden).
- `tools/check-perimetro-suite.ts`: PASS (62 files, 1212 tests, 23 skipped).
- `next build`: PASS (clean production build, all localized HTML pages and OpenGraph image routes pre-rendered successfully).

## 4. Social Card Audit, Priority Rectification & Multi-Locale Verification

### Rectification of Metadata Priority
- **Correction**: In Next.js App Router, file-based metadata (`opengraph-image.tsx`) has strict priority over `generateMetadata` exports in `page.tsx`. Stating that `openGraph.images` in `generateMetadata` takes precedence over the co-located `opengraph-image.tsx` was factually incorrect: Next.js always generates the canonical `<meta property="og:image">` and `<meta name="twitter:image">` pointing to the file-based route.
- **Implemented Architecture**: The actual colocated `app/(frontend)/[locale]/(marketing)/blog/[slug]/opengraph-image.tsx` handler was updated. For the two targeted slugs (`huawei-health-health-connect-sincronizzazione` and `passi-non-si-sincronizzano-galaxy-watch`), it intercepts the request and serves the dedicated 1200x630 PNG file directly via a static `Response` stream. For all other 68 blog posts, the existing Satori branded template is left completely unchanged.

### Social Card Framing
- **Huawei Health**: The 1200x675 cover was adapted to 1200x630 by cropping 30px from top and 15px from bottom. The round smartwatch, phone with dark display, open notebook with two disconnected routes, pencil on desk, and coffee cup are 100% visible with ample margins.
- **Galaxy Watch**: The 1200x675 cover was adapted to 1200x630 by cropping 45px from top (trimming upper window edge and background foliage) and 0px from bottom. The round smartwatch with physical buttons, phone with screen off, spiral notebook with troubleshooting flowchart, and pencil with pink eraser remain completely intact without any clipping.

### Multi-Locale Evidence (Build & Live Server Verification)

Tested across IT, EN, JA, KO, SV, DA plus the unmodified control article (`come-funziona-health-connect`):

| Article / Group | Locale | Localized Slug | Dimensions | Size (Bytes) | SHA-256 (prefix) | HTTP Status | Content-Type | HTML og:image URL |
| --- | --- | --- | --- | ---: | --- | ---: | --- | --- |
| **Huawei Health** | `it` | `huawei-health-health-connect-sincronizzazione` | 1200x630 | 1,019,578 | `daf032739869` | 200 | `image/png` | `.../it/blog/huawei-health-health-connect-sincronizzazione/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `en` | `huawei-health-health-connect-sync` | 1200x630 | 1,019,578 | `daf032739869` | 200 | `image/png` | `.../en/blog/huawei-health-health-connect-sync/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `ja` | `huawei-health-health-connect-renraku` | 1200x630 | 1,019,578 | `daf032739869` | 200 | `image/png` | `.../ja/blog/huawei-health-health-connect-renraku/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `ko` | `huawei-health-health-connect-dongihwa` | 1200x630 | 1,019,578 | `daf032739869` | 200 | `image/png` | `.../ko/blog/huawei-health-health-connect-dongihwa/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `sv` | `huawei-health-health-connect-sincronizzazione` | 1200x630 | 1,019,578 | `daf032739869` | 200 | `image/png` | `.../sv/blog/huawei-health-health-connect-sincronizzazione/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `da` | `huawei-health-health-connect-sincronizzazione` | 1200x630 | 1,019,578 | `daf032739869` | 200 | `image/png` | `.../da/blog/huawei-health-health-connect-sincronizzazione/opengraph-image-1tm0gh?fda025c9c89f5538` |
| **Galaxy Watch** | `it` | `passi-non-si-sincronizzano-galaxy-watch` | 1200x630 | 1,207,197 | `e120bd0750ab` | 200 | `image/png` | `.../it/blog/passi-non-si-sincronizzano-galaxy-watch/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `en` | `steps-not-syncing-galaxy-watch` | 1200x630 | 1,207,197 | `e120bd0750ab` | 200 | `image/png` | `.../en/blog/steps-not-syncing-galaxy-watch/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `ja` | `galaxy-watch-hosu-douki-fuguai` | 1200x630 | 1,207,197 | `e120bd0750ab` | 200 | `image/png` | `.../ja/blog/galaxy-watch-hosu-douki-fuguai/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `ko` | `galaxy-watch-georeum-dongkihwa-munje` | 1200x630 | 1,207,197 | `e120bd0750ab` | 200 | `image/png` | `.../ko/blog/galaxy-watch-georeum-dongkihwa-munje/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `sv` | `passi-non-si-sincronizzano-galaxy-watch` | 1200x630 | 1,207,197 | `e120bd0750ab` | 200 | `image/png` | `.../sv/blog/passi-non-si-sincronizzano-galaxy-watch/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `da` | `passi-non-si-sincronizzano-galaxy-watch` | 1200x630 | 1,207,197 | `e120bd0750ab` | 200 | `image/png` | `.../da/blog/passi-non-si-sincronizzano-galaxy-watch/opengraph-image-1tm0gh?fda025c9c89f5538` |
| **Control Post** | `it` | `come-funziona-health-connect` | 1200x630 | 129,899 | `0c06ec087aa0` | 200 | `image/png` | `.../it/blog/come-funziona-health-connect/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `en` | `how-does-health-connect-work` | 1200x630 | 132,289 | `dbc8f4978393` | 200 | `image/png` | `.../en/blog/how-does-health-connect-work/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `ja` | `health-connect-shikumi-kaisetsu` | 1200x630 | 132,170 | `6c5cbd25a117` | 200 | `image/png` | `.../ja/blog/health-connect-shikumi-kaisetsu/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `ko` | `health-connect-jakdong-bangbeop` | 1200x630 | 127,189 | `c86cb02a102b` | 200 | `image/png` | `.../ko/blog/health-connect-jakdong-bangbeop/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `sv` | `come-funziona-health-connect` | 1200x630 | 132,090 | `546467578318` | 200 | `image/png` | `.../sv/blog/come-funziona-health-connect/opengraph-image-1tm0gh?fda025c9c89f5538` |
| | `da` | `come-funziona-health-connect` | 1200x630 | 130,578 | `83a434a8422e` | 200 | `image/png` | `.../da/blog/come-funziona-health-connect/opengraph-image-1tm0gh?fda025c9c89f5538` |

- **Verification Summary**:
  - The two PR posts consistently serve the dedicated 1200x630 editorial social card across all localized routes.
  - The control post dynamically preserves the existing Satori branded title card across all localized routes without regression.
