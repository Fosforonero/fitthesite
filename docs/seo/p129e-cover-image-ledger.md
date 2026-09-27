# P1.29-IMG-E: cover editoriali round 5

Data: 27/09/2026. Base: `origin/main` `1212cfe` (produzione). Ramo:
`feat/p129e-editorial-covers-round5`. Filone separato da audit, sicurezza, verità commerciale e
dalle PR #79, #80, #90, #91.

## Decisioni sui cinque abbinamenti proposti

Gate: fact review dell'intero articolo renderizzato (varianti indicizzabili, FAQ, metadata,
JSON-LD) prima di copiare l'asset. Un post con claim di prodotto, salute, privacy o prezzi non
verificati resta con la cover attuale.

| Post | Proposta | Decisione | Motivo |
| --- | --- | --- | --- |
| `efficienza-del-sonno-formula-calcolo` | `sleep-efficiency-morning.webp` | INTEGRATED | nessun claim falso (it, en) |
| `novita-passi-piu-affidabili` | `daily-steps-city-walk.webp` | INTEGRATED | coerente con quanto rilasciato nella versione 190 |
| `fitmesh-sync-disponibile-google-play` | `fitmesh-mobile-introduction-coast.webp` | BLOCKED_BY_COPY | FAQ de "alle Pro-Funktionen" nella prova (MISLEADING, anche in JSON-LD); keyword "Pro a vita gratis founder" in JSON-LD e meta in 10 lingue |
| `anello-orologio-scenari-reali` | `ring-watch-real-scenarios.webp` | BLOCKED_BY_COPY | fusione "ora per ora" dichiarata in meta, sottotitolo e FAQ ma non conforme al prodotto; fascia cardio usata "solo per la sessione" non vera; "giornata incerta" segnalata senza alcun marcatore nell'app |
| `novita-fonte-del-dato` | `wearable-data-source-city-walk.webp` | BLOCKED_BY_COPY | grafico orario descritto come "ora per ora con il dispositivo" (mostra una sola fonte); condizione del grafico superata dalla 3.10.0; "nessun buco durante la ricarica" non vale per i passi; sv/da senza la cautela "nella maggior parte dei casi" |

Report completo con file:riga e correzioni minime: `.claude/stato-lavoro/copertine-round5/fact-review.md`
(fuori dal repo). I tre post bloccati mantengono `news`, `ring`, `news`: il test lo verifica.

## Asset integrati

| Post | Prima | Dopo | SHA-256 | Dimensioni |
| --- | --- | --- | --- | --- |
| `efficienza-del-sonno-formula-calcolo` | `recovery.webp` (sleep, condivisa con altri 2) | `sleep-efficiency-morning.webp` | `8378b30b082cbd46ae65cd9cf15d190fa704d78a5e62bde16f5d1a5955b7675a` | 1200 × 675, 192.392 B |
| `novita-passi-piu-affidabili` | `steps-total-vs-hourly-chart.webp` (stepsChart, condivisa con 1) | `daily-steps-city-walk.webp` | `834606321d6fdf94fd6093ec7266e0261b730dc104696ef3cfcca0c820d1de9d` | 1200 × 675, 232.308 B |

Nessun testo leggibile, interfaccia, grafico, marchio o misura clinica nelle due immagini (controllo
a vista a piena risoluzione e a 360 px).

## Alt text (`coverAlt`)

- Solo le varianti indicizzabili con overlay applicato: it/en per l'efficienza del sonno, it/en/de/fr
  per i passi. Totale 6.
- Descrivono la scena; nessun H1, marchio o em dash (test `P1.29-IMG-E`).
- Fonte `it`, derivate scritte dalla fonte. Controllo `AGENT_EDITORIALLY_REVIEWED`, nessuna
  revisione madrelingua.

## Dati strutturati, OG, sitemap

- `BlogPosting.image` deriva da `coverSrc()` (URL assoluto): segue la mappatura.
- OG: resta la card generata da `opengraph-image.tsx`; la mappa delle anteprime dedicate è
  modificata da PR #90 e non viene toccata.
- Nessun cambio a title, H1, meta description, slug, `publishedAt`, `updatedAt`: nessun cambio a
  `lastmod` in sitemap. Nessuna delle cinque URL del test CTR è interessata.

## Dipendenze con PR aperte

Voci nuove in `covers.ts` inserite lontano dai blocchi di #90 e #91; test in un punto diverso del
file. Conflitto atteso solo su `tools/perimetro-suite.conf` (tutte e tre portano `test` da 1212 a
1213): chi fa merge dopo aggiorna il numero.
