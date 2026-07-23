# P1.3Q — Blog Locale Indexability Near-Complete Audit (debito tecnico)

Scoperto durante P1.3M mentre si investigava perché
`health-connect-vs-samsung-health` fosse `noindex` per ES/DE da 2 mesi pur
avendo traduzioni complete. Il test di regressione scritto per quel post,
eseguito una volta su tutto il sito per verificarne la generalità, ha trovato
**97 combinazioni post/locale con la stessa identica causa** su altri 31 post,
non toccati da P1.3M.

Non corretto in P1.3M: fuori perimetro dello sprint che lo ha scoperto.
**Corretto in P1.3T-Q (2026-07-23) per le sole combinazioni `es`/`de`**, dopo
un audit qualitativo per-post (title/description distinti da IT/EN, nessun
fallback rilevato, volume di contenuto DE/ES comparabile a IT/EN, nessun
placeholder `[TBD`, nessuna evidenza di claim di prodotto obsoleti). Le altre
7 locale (pt/fr/pl/tr/nl/ja/ko) restano debito tecnico non toccato, per
mandato esplicito dello sprint ("non lavorare su altre lingue").

## Dati

- **Data scansione originale (P1.3M)**: 2026-07-22 — 97 combinazioni, 31 post
- **Data correzione (P1.3T-Q)**: 2026-07-23 — 38 combinazioni residue, 0 es, 0 de
- **Soglia usata**: `noindex` per ≤2 campi mancanti su un post altrimenti
  tradotto per intero (soglia bassa deliberata: un post genuinamente non
  tradotto ne manca decine, non 1-2 — vedi `tools/check-blog-locale-near-miss.ts`)

## P1.3T-Q — Prima / dopo

| Locale | Prima (97 tot.) | Dopo (38 tot.) | Esito |
|---|---|---|---|
| es | 31 | 0 | Tutte recuperate (index,follow) |
| de | 28 | 0 | Tutte recuperate (index,follow) |
| pt | 7 | 7 | Non toccato (fuori scope) |
| fr | 7 | 7 | Non toccato (fuori scope) |
| pl | 5 | 5 | Non toccato (fuori scope) |
| tr | 5 | 5 | Non toccato (fuori scope) |
| nl | 4 | 4 | Non toccato (fuori scope) |
| ja | 5 | 5 | Non toccato (fuori scope) |
| ko | 5 | 5 | Non toccato (fuori scope) |

## URL recuperati (31 post, es+de, 59 varianti locale totali)

Tutte le 31 combinazioni post × {es, de} elencate nella tabella sotto sono
passate da `noindex` a `index,follow`: `secondaryKeywords` (e, per 5 post,
anche `primaryKeyword`) tradotti in modo naturale, non letterale, verificati
contro l'array `en` per lunghezza esatta. Nessun contenuto (title, body, FAQ,
CTA) è stato riscritto: era già completo e genuinamente tradotto prima di
questa correzione, verificato via controllo scriptato (title/metaDescription
distinti da IT/EN su tutti i 31 post; volume testo DE/ES tra 0.94x e 1.19x
rispetto a IT/EN, nessun troncamento). Un bug reale è stato trovato e
corretto durante l'applicazione: su `vedere-dati-wearable-browser-pc` uno
script di inserimento automatico aveva scambiato per errore la stringa
`ctaLabel.es` con l'array `secondaryKeywords.es`; rilevato dal type-check
concettuale (un array iniettato dentro un campo stringa) prima del commit,
corretto manualmente.

## URL mantenuti noindex

Nessuno tra i 59 (31×es/de) è stato mantenuto `noindex`: tutti hanno superato
il gate qualitativo. Le 38 combinazioni residue (pt/fr/pl/tr/nl/ja/ko) restano
`noindex` non perché incomplete di qualità, ma perché il mandato P1.3T-Q
limita esplicitamente la correzione a es/de in questo sprint.

## Bug pre-esistente scoperto (fuori scope, non corretto)

`hrv-cose-significato-valori.ts`: le liste `secondaryKeywords.pl` e
`.tr` contengono traduzioni errate che confondono "HRV" con "GDPR" (il testo
polacco dice letteralmente "wartości normalne RODO" = "valori normali GDPR",
il turco "KVKK normal değerler" = "valori normali KVKK/legge sulla privacy
turca"), verosimilmente residuo di un run di traduzione automatica precedente
mai rivisto. Non in scope per P1.3T-Q (solo es/de); da correggere in un
futuro sprint mirato a pl/tr.

## Causa quasi universale

`secondaryKeywords` (campo `LocalizedList`) manca la chiave `es`/`de` su
quasi tutti i 31 post, oppure ha una lunghezza diversa da `en`/`it` per
pt/fr/pl/tr/nl/ja/ko su un sottoinsieme di essi. Un solo post
(`vedere-dati-wearable-browser-pc`) ha anche un `ctaLabel` mancante.

## Tabella per post — stato ORIGINALE pre-P1.3T-Q (storico, 97 righe)

Le righe `es`/`de` sotto sono STORICHE: descrivono lo stato prima della
correzione del 2026-07-23. Sono tutte risolte (vedi sezione sopra). Le righe
pt/fr/pl/tr/nl/ja/ko restano correnti.

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

Dettaglio completo corrente (38 righe singole per post+locale+campo, solo
pt/fr/pl/tr/nl/ja/ko dopo P1.3T-Q):
`docs/seo/blog-locale-near-miss-baseline.json`.

## Prossimi passi (sprint futuro, non ora — solo pt/fr/pl/tr/nl/ja/ko)

1. Per i post con "length mismatch" (pt/fr/pl/tr/nl/ja/ko), verificare se la
   lista `secondaryKeywords` di quella locale è stata troncata o estesa
   rispetto a `en` e allinearla (stesso pattern usato in P1.3T-Q per es/de:
   `en`, non `it`, è il riferimento di lunghezza usato dal guardrail).
2. Per `vedere-dati-wearable-browser-pc`, tradurre `body.16.ctaLabel` per
   pt/fr.
3. Correggere il bug pl/tr HRV↔GDPR trovato ma non risolto in questo sprint
   (vedi sezione sopra), in un post-locale mirato o insieme al punto 1.
4. Dopo ogni correzione, rigenerare la baseline:
   `pnpm exec tsx tools/check-blog-locale-near-miss.ts --write-baseline`.
