# P1.29-IMG Cover Integration Ledger

Date: 2026-09-26. Status: local branch `feat/p129-editorial-covers` only, not published.

Integration of approved editorial WebP covers (1200x675) from `/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite-image-proposals/2026-09-26/` into the Fosforonero blog editorial style.
Technical and visual update only: no article rewriting, no SEO title or meta description changes, no lastmod bump. The 5 CTR-protected URLs remain frozen and untouched.

## 1. Inventory & Asset Status

| Source File | Destination File | Post Slug | Previous Cover | Status | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | ---: | --- |
| `huawei-health-path-editorial-concept.webp` | `public/blog/covers/huawei-health-path.webp` | `huawei-health-health-connect-sincronizzazione` | `devices.webp` (`sync`) | **INTEGRATED** | 135,604 | `8bad57cb1689b9965cccc4ca8c93dbfc5e319d495b0b20f9d131c22f5d116da2` |
| `galaxy-watch-steps-troubleshooting-concept.webp` | `public/blog/covers/galaxy-watch-steps-troubleshooting.webp` | `passi-non-si-sincronizzano-galaxy-watch` | `gear.webp` (`troubleshooting`) | **INTEGRATED** | 159,276 | `48af6b6df36a75aa1cbbe00d056938176d8a650278d438c607375a8552aef053` |
| `recovery-metrics-editorial-concept.webp` | — | `metriche-recupero-hrv-sonno-frequenza-cardiaca` | `hearth.webp` (`metrics`) | **GATE FAILED (HOLD)** | 176,976 | `dfff2a6ca0323643a16b9737576cb4b3e93e5e264f9019f903c3a93ebfdaa982` |
| `how-fitmesh-works-editorial-concept.webp` | — | `come-funziona-fitmesh` | `how-fitmesh-works.webp` (`fitmeshOverview`) | **HELD (PR #87 DEP)** | 141,020 | `6339208bd112374e808dff633cf392c66b49d89e62cc502ffe99bccacc9d101c` |

## 2. Gate Decisions & Visual Truth Audit

### Cover 1: Huawei Health Path (`huawei-health-path.webp`) — PASS
- **Visual evaluation**: Overhead perspective of an indie developer's workbench with an unbranded round smartwatch on the left, an unbranded phone with dark/blank display on the right, and an open paper notebook showing two separate, disconnected hand-drawn pencil paths and an empty checkbox.
- **Visual truth**: No direct connecting beam or arrow between devices, no implication of an available direct integration, no logos/trademarks, no fake app UI. Fully compliant with product reality.
- **Alt text**: 13 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da).

### Cover 2: Galaxy Watch Steps Troubleshooting (`galaxy-watch-steps-troubleshooting.webp`) — PASS
- **Visual evaluation**: Morning light worktable with an unbranded round smartwatch with side buttons, an unbranded phone with screen turned off, and a notebook showing a simple hand-drawn troubleshooting path made of dots, arrows, and checkboxes.
- **Visual truth**: Round smartwatch evokes the generic hardware category without trademarks, logos, or Samsung branding. No fake UI, no clinical claims, no completed sync implied. Fully compliant.
- **Alt text**: 13 localized `coverAlt` entries added across all indexable locales (it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da).

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
- `tools/check-perimetro-suite.ts`: PASS (62 files, 1211 tests).
- `next build`: PASS (clean production build, all 26 localized HTML pages verified with updated cover image and localized alt attributes).
