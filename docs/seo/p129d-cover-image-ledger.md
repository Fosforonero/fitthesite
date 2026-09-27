# P1.29-IMG-D: cover editoriali round 3 (cinque post)

Data: 27/09/2026. Base: `origin/main` `1212cfe` (produzione). Ramo:
`feat/p129d-editorial-covers-round3`. Filone separato dall'audit del sito e da
ogni intervento di sicurezza. Nessuna modifica a PR #90, #79, #80.

## Asset

Proposte esterne al repo: `fitthesite-image-proposals/2026-09-27-round3/`.
Copiate come file nuovi in `public/blog/covers/`, nessuna cover condivisa
sovrascritta. Impronte verificate contro il README della proposta.

| Post | Prima (condivisa) | Dopo (dedicata) | SHA-256 | Dimensioni |
| --- | --- | --- | --- | --- |
| `esportare-dati-garmin` | `data-sync.webp` (export) | `garmin-activity-export-editorial.webp` | `e6b2624399bec9817820e9902b30d8f456a66c4575cbaaf2c258e34d32b5eaec` | 1200 × 675 |
| `fitbit-data-not-syncing-android` | `gear.webp` (troubleshooting) | `fitbit-sync-troubleshooting-editorial.webp` | `f0c8268f3a60acc491d1c0231541640cf01b25fbf279078d53005028a5f5d0bd` | 1200 × 675 |
| `health-connect-vs-samsung-health` | `flow.webp` (compare) | `health-connect-vs-samsung-health-editorial.webp` | `ab0637ff1fe65da399289f6dd740e10bc5b4a8ebaac3aac7c1f22338ed5542d3` | 1200 × 675 |
| `da-android-a-iphone-dati-fitness` | `smartphones.webp` (platform) | `android-to-iphone-fitness-data-editorial.webp` | `3a776091b4f669dcae0c8da3650e3f10cf1a6f2ee8dd390c44b304c9daa46b71` | 1200 × 675 |
| `tracciare-sonno-anello` | `recovery.webp` (sleep) | `smart-ring-sleep-recovery-editorial.webp` | `f916a840b923f3ff5d98309441a6499b940802176ce2c0480ab8cd15d1902cdb` | 1200 × 675 |

## Verifica di pertinenza (immagine rispetto all'intento della pagina)

Le immagini sono proposte visive, non approvazioni dei claim degli articoli.
Controllate a vista a piena risoluzione:

- Garmin export: dopo una corsa su sentiero, schede bianche riordinate in una
  scatola d'archivio. Richiama la conservazione dei propri dati; nessuna
  sincronizzazione automatica, nessuna dashboard, nessun marchio.
- Fitbit che non sincronizza: controllo calmo di braccialetto e telefono spento
  dopo un allenamento in casa. Nessuna promessa di soluzione.
- Health Connect e Samsung Health (H1: dove finiscono i dati del Galaxy Watch):
  due fogli dipinti affiancati su un taccuino a bordo pista. Uno contiene un
  piccolo istogramma simbolico senza numeri: non è un'interfaccia del prodotto
  né una direzione di trasferimento. Da confermare in revisione (vedi decisioni).
- Da Android a iPhone: due telefoni spenti e una busta di carta dopo un giro in
  bici. Nessuna promessa di migrazione completa.
- Sonno con anello: stiramento al mattino accanto al letto, anello al dito,
  scarpe da corsa. Nessun punteggio del sonno, nessun segno clinico.

Nessuna immagine contiene testo leggibile, numeri, loghi o misure cliniche.

## Alt text (`coverAlt`)

- Solo le varianti indicizzabili (`isBlogVariantIndexable` con overlay nordico
  applicato): 13 lingue per quattro post (it, en, es, de, pt, fr, pl, tr, nl,
  ja, ko, sv, da), 12 per `health-connect-vs-samsung-health` (nessuna variante
  da). no e fi non sono indicizzabili per nessuno dei cinque. Totale 64.
- Descrivono la scena; non ripetono l'H1, non contengono parole chiave, marchi o
  em dash (verificato dal test `P1.29-IMG-D` in `lib/blog/indexability.test.ts`).
- Dichiarazione di origine (TRANSLATIONS, "Declaring the source"): lingua
  autoriale `it`; le altre lingue sono derivate dalla fonte `it`, scritte
  direttamente senza passare dall'inglese; revisione del contenuto: `1212cfe`.
- Controllo applicato: `AGENT_EDITORIALLY_REVIEWED`. Nessuna revisione
  madrelingua: non è `NATIVE_REVIEWED`.

## Dati strutturati, OG, sitemap

- `BlogPosting.image.url` deriva da `coverSrc()` con URL assoluto
  (`https://www.fitmesh.fit/blog/covers/<file>`): cambia con la mappatura, nessun
  JSON-LD scritto a mano.
- OG: i cinque post usano oggi la card generata da `opengraph-image.tsx`, non la
  cover. Non modificato: la card è valida e la mappa delle anteprime dedicate è
  il punto che PR #90 cambia. Eventuali anteprime 1200 × 630 dalle nuove cover
  sono una decisione separata, da fare dopo il merge di #90.
- Nessun cambio a title, H1, meta description, slug, `publishedAt`,
  `updatedAt`, quindi nessun cambio a `lastmod` in sitemap.
- Le cinque URL del test CTR non sono toccate.

## Dipendenze con PR aperte

- PR #90 (STOP): modifica `covers.ts`, `opengraph-image.tsx`,
  `lib/blog/indexability.test.ts`, `tools/perimetro-suite.conf`; non rimappa
  nessuno dei cinque post. Le voci nuove qui sono inserite lontano dai suoi
  blocchi e il test è in un punto diverso del file, quindi `covers.ts` e il test
  si fondono senza conflitti. Conflitto certo solo su `tools/perimetro-suite.conf`
  (entrambe portano `test` e `test_release` da 1212 a 1213): chi fa merge per
  secondo scrive 1214.
- PR #79: modifica il corpo di tre dei cinque post (`esportare-dati-garmin`,
  `fitbit-data-not-syncing-android`, `health-connect-vs-samsung-health`) per i
  claim sulla dashboard web; questa PR aggiunge solo il blocco `coverAlt` prima
  di `related`, fuori dalle sue righe.
- PR #80: tocca solo `tools/perimetro-suite.conf` (già in conflitto con main).
