# P1.29-IMG-C Cover Integration Ledger (Round 2)

Date: 2026-09-26. Status: local branch `feat/p129c-editorial-covers-round2` only, not published.

Integration of approved Round 2 editorial WebP covers (1200x675) from `/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite-image-proposals/2026-09-26-round2/` into the Fosforonero blog editorial style, alongside dedicated 1200x630 social preview cards.
Technical and visual update only: no article rewriting, no SEO title or meta description changes, no lastmod bump. The 5 CTR-protected URLs remain frozen and untouched.

All dimensions and SHA-256 checksums in this ledger are computed directly on the physical files via automated scripting (zero manual transcription).

---

## 1. Inventory & Asset Status

### Editorial Covers (1200x675 WebP) — Source vs Destination Checksum Parity

| Target Post Slug | Source Proposal File | Destination Cover File | Previous Cover | Status | Bytes | SHA-256 (Source & Destination Match 100%) |
| --- | --- | --- | --- | --- | ---: | --- |
| `health-connect-not-syncing` | `health-connect-not-syncing-editorial-concept.webp` | `public/blog/covers/health-connect-not-syncing.webp` | `health-connect-sync-troubleshooting.webp` (dedicated) | **INTEGRATED** | 133,764 | `2d6a36eae80a77af725fb7ad93b3ace4f61fbd1a35f373f57308d0d0244b354a` |
| `come-funziona-health-connect` | `how-health-connect-works-editorial-concept-v2.webp` | `public/blog/covers/how-health-connect-works.webp` | `devices.webp` (`sync` shared placeholder) | **INTEGRATED** | 124,260 | `5d739af54d6de61bfb5fa5e972fa55d58184704306c93ba16d6e2dcbb58d70ab` |
| `colmi-ring-fitmesh` | `colmi-ring-fitmesh-editorial-concept.webp` | `public/blog/covers/colmi-ring-fitmesh.webp` | `ring.webp` (`ring` shared placeholder) | **INTEGRATED** | 122,942 | `03eb3451028d869646f129cbe6c921218fd19478c65327cf6b6bf557423c87b8` |
| `cambiare-smartwatch-senza-perdere-dati` | `change-smartwatch-editorial-concept.webp` | `public/blog/covers/change-smartwatch.webp` | `wearables.webp` (`multidevice` shared placeholder) | **INTEGRATED** | 139,890 | `3bfb2341c93909b2e4d6a4c12bb32ca67ae48a03a92858c747316ffd6ebc2d6c` |

### Proposal in EDITORIAL HOLD (Out of PR Scope)

| Proposal File | Target Article | Current Post Cover | Status | Bytes | SHA-256 | Reason |
| --- | --- | --- | --- | ---: | --- | --- |
| `recovery-metrics-nonclinical-concept.webp` | `metriche-recupero-hrv-sonno-frequenza-cardiaca` | `recovery.webp` (`sleep` / `recovery`) | **GATE FAILED (EDITORIAL HOLD)** | 120,390 | `73cb32125b6d4ec825b2849ab15dddde57c3ca4675e94707b2d45552afa4236d` | Held until article copy and non-clinical health claims are formally reconciled in a separate task. Strictly excluded from the PR and from `public/`. |

### Retired Cover Asset (from origin/main)

| Retired File | Repository Path | Status | Bytes | SHA-256 | Rationale |
| --- | --- | --- | ---: | --- | --- |
| `health-connect-sync-troubleshooting.webp` | `public/blog/covers/` | **REMOVED** | 64,072 | `febe77ba3de68ede474145375430f8bb6e9f5f44056b58274cf920c78848fbd6` | Superseded by dedicated editorial cover `health-connect-not-syncing.webp`. Removed to strictly avoid orphan file violation in `check-p15c-cover-map.ts`. |

### Social Preview Assets (1200x630 PNG)

| Source Cover | Destination File | Post Slug | Framing / Adaptation | Bytes | SHA-256 |
| --- | --- | --- | --- | ---: | --- |
| `health-connect-not-syncing.webp` | `public/blog/social/health-connect-not-syncing.png` | `health-connect-not-syncing` | Crop top -30px, bottom -15px. Preserves smartphone with landscape wallpaper, circular smartwatch, open notebook with broken sequence and checkboxes, and pencil. | 1,155,284 | `d6cb73c36d0b4b217b50e8557b3ceb7b0d50491edb25767042dd26a60efff9c5` |
| `how-health-connect-works.webp` | `public/blog/social/how-health-connect-works.png` | `come-funziona-health-connect` | Center crop top -22px, bottom -23px. Preserves wooden desk tray, smartphone with black screen, hand-drawn paper cards (shoe, crescent moon, watch drawn on paper), and pen. | 1,048,517 | `bfe79c4189e33081d540366e3c93b1d29ddeaf9caf7933b2094c6baf851702e6` |
| `colmi-ring-fitmesh.webp` | `public/blog/social/colmi-ring-fitmesh.png` | `colmi-ring-fitmesh` | Crop top -30px, bottom -15px. Preserves hand holding dark smart ring, smartphone with screen off, and delicate dotted line indicating local BLE proximity. | 1,078,174 | `02f8cf64b2ecf9bf492cdf4d9976452fc99c6fe5d86477b37acc4d7db3a7a846` |
| `change-smartwatch.webp` | `public/blog/social/change-smartwatch.png` | `cambiare-smartwatch-senza-perdere-dati` | Crop top -30px, bottom -15px. Preserves wooden desk surface, two wristwatches, open journal with ribbon bookmark, and pencil without clipping. | 1,167,254 | `79a9ae30d13837984a3d9eeddaf85bc17ff865bf1013eccec01595527b3a35b0` |

---

## 2. Gate Decisions & Visual Truth Audit

### Cover 1: Health Connect Not Syncing (`health-connect-not-syncing.webp`) — PASS
- **Visual evaluation**: Modern workbench scene featuring a smartphone displaying a decorative landscape wallpaper (no fake app UI), a round smartwatch, an open notebook showing an interrupted dotted path with checklist boxes, and a pencil.
- **Visual truth**: The illustration communicates troubleshooting and diagnostics conceptually without displaying misleading simulated status screens or platform logos.
- **Alt text**: 11 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, nl, ja, sv, da). Correctly specifies in Polish `tapetą krajobrazową` and avoids phone-off terminology (`wyłączonego smartfona`).

### Cover 2: How Health Connect Works (`how-health-connect-works.webp`) — PASS
- **Visual evaluation**: Stylized wooden desk tray holding a smartphone with a black/blank screen (schermo nero), an ink pen, and paper cards showing simple hand-drawn sketches representing categories: a running shoe (steps/activity), a crescent moon (sleep), and a round watch drawn on paper (l'orologio è disegnato su carta, non un orologio fisico).
- **Visual truth**: Represents local centralized data organization conceptually. The smartphone display is completely black/off; the watch is a pencil drawing on an index card, not physical hardware. No vendor proprietary logos or claims of direct cloud sync.
- **Alt text**: 13 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da).

### Cover 3: Colmi Ring FitMesh (`colmi-ring-fitmesh.webp`) — PASS
- **Visual evaluation**: An open palm holding a dark smart ring beside a smartphone lying flat on a wooden desk with screen turned off, accompanied by a subtle hand-drawn dotted line evoking local proximity.
- **Visual truth**: Depicts direct BLE proximity conceptually. No misleading clinical sensor depictions or fake companion app screens. Screen off is accurately depicted.
- **Alt text**: 11 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko). Accurately distinguishes screen off (`ekran wyłączony` / `z wyłączonym ekranem` in Polish) rather than claiming the phone is turned off.

### Cover 4: Change Smartwatch Without Losing Data (`change-smartwatch.webp`) — PASS
- **Visual evaluation**: Overhead view of a wooden desk with two wristwatches (a dark round smartwatch and an analogue/classic watch with dial and leather strap) laid beside an open journal/notebook and a pencil. There is NO smart ring, NO charts or diagrams, and NO project notes.
- **Visual truth**: Depicts two wristwatches resting on a wooden desk next to an open journal. Does NOT show or guarantee automated continuity of data history, nor does it display a physical or wireless connection between the two devices. Zero trademarks or brand logos.
- **Alt text**: 6 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr). Strictly rewritten to describe only the visible scene (two wristwatches on a wooden desk next to an open journal and pencil) without attributing data continuity or inter-device connections.

### Cover 5: Recovery Metrics (`recovery-metrics-nonclinical-concept.webp`) — GATE FAILED (EDITORIAL HOLD)
- **Mandate condition**: Explicitly held until text reconciles non-clinical claim and visual truth.
- **Decision**: Strictly kept in EDITORIAL HOLD. Asset not ingested into `public/blog/covers/` or `lib/blog/covers.ts` to prevent orphan violations and avoid breaking the editorial lock until text reconciliation is completed in a dedicated task.

---

## 3. Verification & Guardrails

- `tools/check-p15c-cover-map.ts`: **PASS** (70 posts all with explicit covers, 36 cover files all present at 1200x675, 0 unapproved duplicates, 0 orphans).
- `tools/check-governance.ts`: **PASS** (snapshot 1.0.0, 0 new em-dashes).
- `tools/check-perimetro-suite.ts`: **PASS** (62 files, 1213 tests, 23 skipped). Added +1 test verifying all 4 covers, their 41 localized alt texts, visual truth assertions, and dedicated social PNG files.
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
