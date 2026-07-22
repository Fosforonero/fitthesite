# P1.3Q — Blog Locale Indexability Near-Complete Audit (debito tecnico)

Scoperto durante P1.3M mentre si investigava perché
`health-connect-vs-samsung-health` fosse `noindex` per ES/DE da 2 mesi pur
avendo traduzioni complete. Il test di regressione scritto per quel post,
eseguito una volta su tutto il sito per verificarne la generalità, ha trovato
**97 combinazioni post/locale con la stessa identica causa** su altri 31 post,
non toccati da P1.3M.

Non corretto qui: fuori perimetro dello sprint che lo ha scoperto. Tracciato
come sprint futuro separato (P1.3Q). Il guardrail
`tools/check-blog-locale-near-miss.ts` (baseline
`docs/seo/blog-locale-near-miss-baseline.json`) impedisce che si aggiungano
nuove combinazioni senza essere notate, ma non blocca né richiede la
correzione di queste 97.

## Dati

- **Data scansione**: 2026-07-22
- **Totale combinazioni post/locale**: 97
- **Post distinti coinvolti**: 31
- **Soglia usata**: `noindex` per ≤2 campi mancanti su un post altrimenti
  tradotto per intero (soglia bassa deliberata: un post genuinamente non
  tradotto ne manca decine, non 1-2 — vedi `tools/check-blog-locale-near-miss.ts`)

## Causa quasi universale

`secondaryKeywords` (campo `LocalizedList`) manca la chiave `es`/`de` su
quasi tutti i 31 post, oppure ha una lunghezza diversa da `en`/`it` per
pt/fr/pl/tr/nl/ja/ko su un sottoinsieme di essi. Un solo post
(`vedere-dati-wearable-browser-pc`) ha anche un `ctaLabel` mancante.

## Tabella per post (raggruppata; dettaglio completo per-locale nel JSON)

| Post | Locale interessate | Campo mancante |
|---|---|---|
| `alternative-app-sync-wearable-2026` | es, de | primaryKeyword, secondaryKeywords; secondaryKeywords |
| `anello-smart-guida-completa` | es, de | secondaryKeywords |
| `backup-galaxy-watch-pc` | es, de | secondaryKeywords |
| `best-health-data-sync-app-android` | es, de, pt, fr, pl, tr, nl, ja, ko | primaryKeyword, secondaryKeywords; secondaryKeywords; secondaryKeywords (length mismatch) |
| `best-smartwatch-for-elderly` | es, de, pt, fr, pl, tr, nl, ja, ko | secondaryKeywords; secondaryKeywords (length mismatch) |
| `colmi-r02-setup` | es, de | secondaryKeywords |
| `colmi-ring-fitmesh` | es, de | primaryKeyword, secondaryKeywords; secondaryKeywords |
| `come-funziona-health-connect` | es, de | secondaryKeywords |
| `dati-anello-smart-apple-salute` | es, de | secondaryKeywords |
| `esportare-dati-fitbit-google` | es, de | secondaryKeywords |
| `esportare-dati-garmin` | es, de | secondaryKeywords |
| `fitbit-data-not-syncing-android` | es, de | primaryKeyword, secondaryKeywords; secondaryKeywords |
| `fitmesh-arriva-su-iphone` | es, de | primaryKeyword, secondaryKeywords; secondaryKeywords |
| `fitmesh-sync-disponibile-google-play` | es, de | secondaryKeywords |
| `gdpr-dati-fitness-smartwatch` | es, de | secondaryKeywords |
| `guida-sync-wearable-2026` | es, de | secondaryKeywords |
| `health-connect-not-syncing` | es, de, pt, fr, pl, tr, ja, ko | secondaryKeywords; secondaryKeywords (length mismatch) |
| `how-to-export-apple-health-data` | es, de, pt, fr, pl, tr, nl, ja, ko | secondaryKeywords; secondaryKeywords (length mismatch) |
| `hrv-cose-significato-valori` | es, de | secondaryKeywords |
| `migliori-anelli-economici` | es, de | secondaryKeywords |
| `novita-anello-colmi-sonno` | es, de | secondaryKeywords |
| `novita-dashboard-multi-device` | es, de | secondaryKeywords |
| `novita-fonte-del-dato` | es, de | secondaryKeywords |
| `passi-non-si-sincronizzano-galaxy-watch` | es, de | secondaryKeywords |
| `scegliere-smartwatch-dati-2026` | es | secondaryKeywords |
| `smartwatch-estate-2026` | es, de | secondaryKeywords |
| `smartwatch-per-anziani-guida` | es, de, pt, fr | secondaryKeywords; secondaryKeywords (length mismatch) |
| `sync-samsung-health-google-fit` | es, de, pt, fr, pl, tr, nl, ja, ko | secondaryKeywords; secondaryKeywords (length mismatch) |
| `sync-them-all` | es, de | secondaryKeywords |
| `tracciare-sonno-anello` | es | secondaryKeywords |
| `vedere-dati-wearable-browser-pc` | es, pt, fr | body.16.ctaLabel; secondaryKeywords, body.16.ctaLabel |

Dettaglio completo (97 righe singole per post+locale+campo):
`docs/seo/blog-locale-near-miss-baseline.json`.

## Prossimi passi (sprint futuro, non ora)

1. Per ciascun post, aggiungere le chiavi `es`/`de` mancanti a
   `secondaryKeywords` (4 parole chiave nello stile delle altre locale già
   presenti sullo stesso post — pattern già usato per il fix P1.3M).
2. Per i post con "length mismatch" (pt/fr/pl/tr/nl/ja/ko), verificare se la
   lista `secondaryKeywords` di quella locale è stata troncata o estesa
   rispetto a `en`/`it` e allinearla.
3. Per `vedere-dati-wearable-browser-pc`, tradurre `body.16.ctaLabel` per
   es/pt/fr.
4. Dopo ogni correzione, rigenerare la baseline:
   `pnpm exec tsx tools/check-blog-locale-near-miss.ts --write-baseline`.
