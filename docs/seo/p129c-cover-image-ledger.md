# P1.29-IMG-C Cover Integration Ledger (Round 2)

Date: 2026-09-26. Status: local branch `feat/p129c-editorial-covers-round2` only, not published.

Integration of approved Round 2 editorial WebP covers (1200x675) from `/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite-image-proposals/2026-09-26-round2/` into the Fosforonero blog editorial style, alongside dedicated 1200x630 social preview cards.
Technical and visual update only: no article rewriting, no SEO title or meta description changes, no lastmod bump. The 5 CTR-protected URLs remain frozen and untouched.

## 1. Inventory & Asset Status

### Editorial Covers (1200x675 WebP)

| Source File | Destination File | Post Slug | Previous Cover | Status | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | ---: | --- |
| `health-connect-not-syncing-editorial-concept.webp` | `public/blog/covers/health-connect-not-syncing.webp` | `health-connect-not-syncing` | `health-connect-sync-troubleshooting.webp` (dedicated) | **INTEGRATED** | 133,764 | `2d6a36eae80adcb1f9d3752e50cf58231fa7ba4d1b8fa15886d30be1e39b9215` |
| `how-health-connect-works-editorial-concept-v2.webp` | `public/blog/covers/how-health-connect-works.webp` | `come-funziona-health-connect` | `devices.webp` (`sync` shared placeholder) | **INTEGRATED** | 124,260 | `5d739af54d6df1a2e7c1fe01c89018445100067300dbf4e9185a73e6f8aa5fd1` |
| `colmi-ring-fitmesh-editorial-concept.webp` | `public/blog/covers/colmi-ring-fitmesh.webp` | `colmi-ring-fitmesh` | `ring.webp` (`ring` shared placeholder) | **INTEGRATED** | 122,942 | `03eb3451028dc7685a7d6e4cebb293b70743b7ba8f62f31d06ff9ff3ee2c5950` |
| `change-smartwatch-editorial-concept.webp` | `public/blog/covers/change-smartwatch.webp` | `cambiare-smartwatch-senza-perdere-dati` | `wearables.webp` (`multidevice` shared placeholder) | **INTEGRATED** | 139,890 | `3bfb2341c939ea30e70464f141bf1625f9b456209b552fa06ea32f14697f26d8` |
| `recovery-metrics-nonclinical-concept.webp` | — | `metriche-recupero-hrv-sonno-frequenza-cardiaca` | `recovery.webp` (`sleep` / `recovery`) | **GATE FAILED (EDITORIAL HOLD)** | 134,818 | `1c89c8ea6181f72591a3cf86cfc532439366df65541604a8b7a42145b5c9ce61` |

### Retired Cover Asset

| Retired File | Path | Status | Bytes | SHA-256 | Rationale |
| --- | --- | --- | ---: | --- | --- |
| `health-connect-sync-troubleshooting.webp` | `public/blog/covers/` | **REMOVED** | 88,482 | `18f8e02d4fb21a3e6f6630f5ec89fa9d1cba908be58cb123e4ea92b49ecb3c2e` | Superseded by dedicated editorial cover `health-connect-not-syncing.webp`. Removed to strictly avoid orphan file violation in `check-p15c-cover-map.ts`. |

### Social Preview Assets (1200x630 PNG)

| Source Cover | Destination File | Post Slug | Framing / Adaptation | Bytes | SHA-256 |
| --- | --- | --- | --- | ---: | --- |
| `health-connect-not-syncing.webp` | `public/blog/social/health-connect-not-syncing.png` | `health-connect-not-syncing` | Crop top -30px, bottom -15px. Preserves smartphone with landscape wallpaper, circular smartwatch, open notebook with broken sequence and checkboxes, and pencil. | 1,155,284 | `d6cb73c36d0b4b217b50e8557b3ceb7b0d50491edb25767042dd26a60efff9c5` |
| `how-health-connect-works.webp` | `public/blog/social/how-health-connect-works.png` | `come-funziona-health-connect` | Center crop top -22px, bottom -23px. Preserves desk tray, phone with landscape wallpaper, circular smartwatch, three index cards (activity, sleep, vitals), and pen. | 1,048,517 | `bfe79c4189e33081d540366e3c93b1d29ddeaf9caf7933b2094c6baf851702e6` |
| `colmi-ring-fitmesh.webp` | `public/blog/social/colmi-ring-fitmesh.png` | `colmi-ring-fitmesh` | Crop top -30px, bottom -15px. Preserves hand holding dark smart ring, smartphone with screen off, and delicate dotted line indicating local BLE proximity. | 1,078,174 | `02f8cf64b2ecf9bf492cdf4d9976452fc99c6fe5d86477b37acc4d7db3a7a846` |
| `change-smartwatch.webp` | `public/blog/social/change-smartwatch.png` | `cambiare-smartwatch-senza-perdere-dati` | Crop top -30px, bottom -15px. Preserves desktop timeline, sports watch, smart watch, smart ring, and continuous project notes without clipping. | 1,167,254 | `79a9ae30d13837984a3d9eeddaf85bc17ff865bf1013eccec01595527b3a35b0` |

---

## 2. Gate Decisions & Visual Truth Audit

### Cover 1: Health Connect Not Syncing (`health-connect-not-syncing.webp`) — PASS
- **Visual evaluation**: Modern workbench scene featuring a smartphone displaying a decorative landscape wallpaper (no fake app UI), a round smartwatch, an open notebook showing a broken/interrupted dotted path with checklist boxes, and a pencil.
- **Visual truth**: The illustration communicates troubleshooting and diagnostics conceptually without displaying misleading simulated status screens or platform logos.
- **Alt text**: 11 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, nl, ja, sv, da). Correctly specifies in Polish `tapetą krajobrazową` and avoids phone-off terminology (`wyłączonego smartfona`).

### Cover 2: How Health Connect Works (`how-health-connect-works.webp`) — PASS
- **Visual evaluation**: Stylized wooden desk tray holding a smartphone with decorative landscape wallpaper, a round smartwatch, and three neatly arranged index cards representing data categories (activity, sleep, vitals/heart rate) with an ink pen.
- **Visual truth**: Represents the local hub/storage concept cleanly. Does not depict vendor proprietary logos or imply universal unmediated cloud sync.
- **Alt text**: 13 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da).

### Cover 3: Colmi Ring FitMesh (`colmi-ring-fitmesh.webp`) — PASS
- **Visual evaluation**: An open palm holding a dark smart ring beside a smartphone lying flat on a wooden desk with screen turned off, accompanied by a subtle hand-drawn dotted line evoking local proximity.
- **Visual truth**: Depicts direct BLE proximity conceptually. No misleading clinical sensor depictions or fake companion app screens. Screen off is accurately depicted.
- **Alt text**: 11 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko). Accurately distinguishes screen off (`ekran wyłączony` / `z wyłączonym ekranem` in Polish) rather than claiming the phone is turned off.

### Cover 4: Change Smartwatch Without Losing Data (`change-smartwatch.webp`) — PASS
- **Visual evaluation**: Overhead view of a workbench with a continuous horizontal timeline connecting multiple wearable formats (a rugged sports watch with silicone band, a sleek smartwatch, a smart ring) alongside project notes and continuous line charts.
- **Visual truth**: Symbolizes long-term timeline continuity across wearable switches without promising retroactive automatic cloud extraction from closed vendor silos. Zero trademarks or brand logos.
- **Alt text**: 6 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr).

### Cover 5: Recovery Metrics (`recovery-metrics-nonclinical-concept.webp`) — GATE FAILED (EDITORIAL HOLD)
- **Mandate condition**: The user mandate explicitly requires: "Recovery resta in HOLD finché il testo non è riconciliato".
- **Decision**: Strictly kept in EDITORIAL HOLD. Asset not ingested into `public/blog/covers/` or `lib/blog/covers.ts` to prevent orphan violations and avoid breaking the editorial lock until text reconciliation is completed in a dedicated task.

---

## 3. Verification & Guardrails

- `tools/check-p15c-cover-map.ts`: **PASS** (70 posts all with explicit covers, 36 cover files all present at 1200x675, 0 unapproved duplicates, 0 orphans).
- `tools/check-governance.ts`: **PASS** (snapshot 1.0.0, 0 new em-dashes).
- `tools/check-perimetro-suite.ts`: **PASS** (62 files, 1213 tests, 23 skipped). Added +1 test verifying all 4 covers, their 41 localized alt texts, and dedicated social PNG files.
- `next build`: **PASS** (clean production build, all localized HTML pages and OpenGraph image routes pre-rendered successfully).

---

## 4. Social Card Priority & Verification Across Locales

The route handler `app/(frontend)/[locale]/(marketing)/blog/[slug]/opengraph-image.tsx` routes requests for the 4 newly integrated slugs directly to their static 1200x630 PNG cards.

### Byte-for-Byte Build Verification (.next Output vs Source Assets)

| Article Slug | Source PNG SHA-256 | Built Route File | Built Route SHA-256 | Verification |
| --- | --- | --- | --- | --- |
| `health-connect-not-syncing` | `d6cb73c36d0b...` | `.next/.../it/blog/health-connect-not-syncing/opengraph-image-1tm0gh.body` | `d6cb73c36d0b...` | **MATCH 100%** |
| | `d6cb73c36d0b...` | `.next/.../sv/blog/health-connect-not-syncing/opengraph-image-1tm0gh.body` | `d6cb73c36d0b...` | **MATCH 100%** |
| | `d6cb73c36d0b...` | `.next/.../da/blog/health-connect-not-syncing/opengraph-image-1tm0gh.body` | `d6cb73c36d0b...` | **MATCH 100%** |
| `come-funziona-health-connect` | `bfe79c4189e3...` | `.next/.../it/blog/come-funziona-health-connect/opengraph-image-1tm0gh.body` | `bfe79c4189e3...` | **MATCH 100%** |
| | `bfe79c4189e3...` | `.next/.../sv/blog/come-funziona-health-connect/opengraph-image-1tm0gh.body` | `bfe79c4189e3...` | **MATCH 100%** |
| | `bfe79c4189e3...` | `.next/.../da/blog/come-funziona-health-connect/opengraph-image-1tm0gh.body` | `bfe79c4189e3...` | **MATCH 100%** |
| `colmi-ring-fitmesh` | `02f8cf64b2ec...` | `.next/.../it/blog/colmi-ring-fitmesh/opengraph-image-1tm0gh.body` | `02f8cf64b2ec...` | **MATCH 100%** |
| | `02f8cf64b2ec...` | `.next/.../ja/blog/colmi-ring-fitmesh-renkei/opengraph-image-1tm0gh.body` | `02f8cf64b2ec...` | **MATCH 100%** |
| | `02f8cf64b2ec...` | `.next/.../ko/blog/colmi-ring-fitmesh-yeongyeol/opengraph-image-1tm0gh.body` | `02f8cf64b2ec...` | **MATCH 100%** |
| `cambiare-smartwatch-senza-perdere-dati` | `79a9ae30d138...` | `.next/.../it/blog/cambiare-smartwatch-senza-perdere-dati/opengraph-image-1tm0gh.body` | `79a9ae30d138...` | **MATCH 100%** |
| | `79a9ae30d138...` | `.next/.../en/blog/switch-smartwatch-without-losing-data/opengraph-image-1tm0gh.body` | `79a9ae30d138...` | **MATCH 100%** |
| `anello-vs-smartwatch` *(Control)* | *(dynamic)* | `.next/.../it/blog/anello-vs-smartwatch/opengraph-image-1tm0gh.body` | `fccd2876884f...` (133,903 B) | **UNTOUCHED (CONTROL)** |
