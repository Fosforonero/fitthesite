# P1.5C — Ledger cover immagini

Audit dei 4 asset WebP consegnati da Matteo il 2026-08-05 per 3 post del
blog (2 nuove traduzioni DE di P1.5B Fase B + il micro-fix CTR DE di
P1.5B Fase A). Verifica eseguita prima di copiare qualunque file in
`public/blog/covers/` o di modificare `lib/blog/covers.ts`.

## Asset consegnati

| File sorgente (Downloads) | SHA-256 | Dimensioni | Peso | Esito |
|---|---|---|---|---|
| `samsung health.webp` | `febe77ba3de68ede474145375430f8bb6e9f5f44056b58274cf920c78848fbd6` | 1200×675 | 64072 B | ✅ Accettato |
| `zona2.webp` | `d24814d790bcd66511e93d65f2055a192f7cea942d60b0bc3cf607f35a3916b8` | 1200×675 | 84360 B | ✅ Accettato |
| `sleep score.webp` | `52076ba6acef443413ab9dc694ca417c1f8eda738dbf8ab7d6d57fb295b9babe` | 1200×675 | 61122 B | ✅ Accettato |
| `pillar fitmesh.webp` | `d24814d790bcd66511e93d65f2055a192f7cea942d60b0bc3cf607f35a3916b8` | 1200×675 | 84360 B | ❌ **RESPINTO** — byte-identico a `zona2.webp` (stesso SHA-256, stesso peso) |

## Destinazione (dopo accettazione)

| Sorgente accettata | File in `public/blog/covers/` | `CoverType` | Post associato |
|---|---|---|---|
| `samsung health.webp` | `health-connect-sync-troubleshooting.webp` | `healthconnect` | `health-connect-not-syncing` |
| `zona2.webp` | `zone-2-different-devices.webp` | `zone2` | `perche-zona-2-cambia-smartwatch-app` |
| `sleep score.webp` | `sleep-score-circadian-rhythm.webp` | `circadian` | `sleep-score-regolarita-ritmo-circadiano` |

Hash verificati byte-identici tra sorgente e file copiato in
`public/blog/covers/` (`shasum -a 256` prima/dopo, nessuna
ricompressione).

## `pillar fitmesh.webp` — perché è stato respinto

SHA-256 identico a `zona2.webp` fino all'ultimo bit: è lo stesso identico
file con un nome diverso, non un'illustrazione dedicata al pillar
"Cos'è FitMesh e come funziona". Trattarlo come cover del pillar
avrebbe prodotto due pagine con la stessa identica immagine (zona-2 e il
pillar), un problema sia di riconoscibilità in-page (social card, index
blog) sia di segnale SEO (immagine non specifica al contenuto). Per
questo:

- **non è stato copiato** in `public/blog/covers/`;
- **non è stato rinominato** ne' altrimenti registrato in
  `lib/blog/covers.ts`;
- **non è usato** dal pillar (che nel frattempo, in attesa di una cover
  dedicata, resta sul cover esistente `dashboard.webp` già assegnato a
  `come-funziona-fitmesh`, invariato da questa PR — vedi PR #42, non
  toccata qui).
- Il guardrail `check-p15c-cover-map.ts` include un test negativo reale
  che verifica esplicitamente l'assenza di questo hash sotto
  `public/blog/covers/` (con l'unica eccezione legittima
  `zone-2-different-devices.webp`, che è la fonte originale con lo
  stesso hash).

## Controlli eseguiti sui 3 asset accettati

- **Dimensioni**: 1200×675 su tutti e 3 (via `sips -g pixelWidth -g
  pixelHeight`, confermato indipendentemente dal parser WebP del
  guardrail).
- **Metadata sensibili**: nessun EXIF, nessun profilo ICC, nessun XMP
  (verificato via Pillow, `Image.info` vuoto di quelle chiavi su tutti e
  3). Nessun dato di geolocalizzazione o autore incorporato.
- **Animazione**: `n_frames == 1` su tutti e 3 — file statici nonostante
  il container VP8X (che supporta ICC/EXIF/animazione anche quando non
  usati).
- **Ispezione visiva** (via rendering PNG intermedio): nessun testo
  incorporato, nessun logo di terze parti (Samsung, Google, Garmin,
  ecc.), nessun watermark di stock-photo (Shutterstock/Getty/iStock),
  nessuna scritta leggibile. Nessuno dei 3 è uno screenshot reale
  dell'app: sono illustrazioni stilizzate (orologio/telefono/anello con
  effetti di dati luminosi), quindi non si applica il vincolo "solo dati
  sintetici" riservato agli screenshot reali dell'app (P1.5C Fase 5).
- **Leggibilità in miniatura**: nessuno dei 3 contiene testo piccolo che
  rischi di diventare illeggibile in formato card (~400px) — sono scene
  fotografiche/illustrative senza tipografia incorporata.
- **Licenza terze parti**: nessun marchio, nessun elemento riconoscibile
  di un prodotto specifico (i dispositivi raffigurati sono generici, non
  copie di un modello reale) — stesso standard già applicato a
  `galaxy-watch-unpacked.webp` (P1.3N-C).
- **Duplicati incrociati con le cover esistenti**: nessuna delle 13
  cover pre-esistenti in `public/blog/covers/` condivide l'hash con
  nessuno dei 3 nuovi file.

## Data verifica

2026-08-05, worktree `feat/p15c-cover-images`.
