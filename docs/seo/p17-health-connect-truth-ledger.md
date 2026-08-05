# P0 Hotfix — Truth ledger: `health-connect-not-syncing`

Branch: `hotfix/p17-health-connect-truth-fix` (isolato da `origin/main`, nessuna dipendenza da PR aperte).
Data verifica: 2026-08-05. Ogni fonte primaria elencata sotto è stata aperta direttamente in questa sessione (WebFetch), non ricostruita a memoria.

## Fonti primarie aperte e verificate

| # | Fonte | URL | Cosa conferma |
|---|---|---|---|
| S1 | Android Developers — Get started with Health Connect | https://developer.android.com/health-and-fitness/guides/health-connect/develop/get-started | Senza `PERMISSION_READ_HEALTH_DATA_HISTORY`, lettura limitata ai 30 giorni precedenti alla concessione del permesso |
| S2 | Samsung Developers — Health Connect FAQ | https://developer.samsung.com/health/health-connect-faq.html | Orologio→telefono segue una policy propria (batteria); telefono→Health Connect è immediato quando il dato cambia |
| S3 | Google Health Help — passaggio da Fitbit | https://support.google.com/googlehealth/answer/17068213 | Rebrand Fitbit→Google Health dal 19/05/2026, rollout fino al 26/05/2026 |
| S4 | Google Android Help — integrazione Health Connect in Android 14 | https://support.google.com/android/answer/14119325 | Da Android 14, Health Connect è un modulo di sistema (Google Play system update), non più un'app standalone da Play Store |

## Tabella claim → verdetto → correzione

| Claim originale | Verdetto | Correzione applicata | Locale corrette (testo .ts, live) | Comportamento Android generico | Comportamento FitMesh reale |
|---|---|---|---|---|---|
| "Il recupero storico è automatico" | FALSO (assoluto non supportato) | Riformulato "NON è automatico", condizionato ad app sorgente + permesso storico | it/en/es/de/pt/fr/pl/tr/nl/ja/ko | Health Connect non retro-scrive da solo: dipende dall'app sorgente | FitMesh legge quello che l'app sorgente ha scritto, non triggera un backfill |
| "Concedi il permesso di lettura storica in FitMesh" (framing azionabile, ~24 occorrenze) | FALSO PER QUESTA APP | Rimosso come istruzione azionabile; il fatto dei 30gg resta SOLO nei passaggi esplicativi (TL;DR punto 5, "In sintesi" punto 5, FAQ) | it/en/es/de/pt/fr/pl/tr/nl/ja/ko | Il permesso esiste a livello Health Connect/Android | AndroidManifest FitMesh (letto in sola lettura) NON dichiara `READ_HEALTH_DATA_HISTORY` in nessun file `.dart` o manifest: dirlo come step utente sarebbe azionabile-ma-falso |
| "Samsung Health sincronizza in tempo reale con Health Connect" (framing generico, 2 sezioni: Fix 3 e Fix 5) | IMPRECISO | Corretto: il collo di bottiglia è orologio→telefono (policy batteria Samsung), non la scrittura telefono→Health Connect (quella è immediata) | it/en/es/de/nl (+ pt/fr/pl/tr/ja/ko per coerenza testuale, non indicizzate oggi) | — | — |
| "Fix 5: pipeline dedicata separata Samsung Health→Health Connect" | IMPRECISO | Riformulato: "va autorizzata separatamente dai permessi generali dell'app", non più descritta come pipeline/canale a sé | tutte le 11 locale presenti nel file | — | — |
| Riferimenti a "Fitbit" come app corrente | OBSOLETO dal 19/05/2026 | Aggiornato a "Google Health (ex Fitbit), dal 19 maggio 2026" con fonte inline | tutte le 11 locale presenti nel file | — | — |
| "Da Android 14+ Health Connect si aggiorna dal Play Store" (percorso UI implicito nelle istruzioni cache/aggiornamento) | OBSOLETO SU ANDROID 14+ | Aggiunta diramazione esplicita: Android 13- via Play Store, Android 14+ via Impostazioni→Sistema→Aggiornamento di sistema Google Play | it/en/es/de/nl (+ altre per coerenza) | — | — |
| "L'ottimizzazione batteria è la causa numero uno... risolve la maggioranza dei casi" | ASSOLUTO NON SUPPORTATO (nessuna fonte per la percentuale/rango implicito) | Ammorbidito a "una causa frequente... spesso risolve il problema" | it/en/es/de/nl | — | — |
| 4 corruzioni testuali TR ("Health Connect"→"KVKK", incl. un artefatto template non risolto) | BUG DI TESTO (non un claim, ma comprometteva la leggibilità del claim) | Ripristinato "Health Connect" letterale nelle 4 occorrenze | tr | — | — |
| 2 intestazioni "Fix 2" corrotte (PL/TR, testo misto/garbled) | BUG DI TESTO | Riscritte in polacco/turco corretto | pl, tr | — | — |
| 1 corruzione testuale PL aggiuntiva ("Moż},'d powtarzać się", "Największość") trovata in questa sessione | BUG DI TESTO | Corretto a "Mogą powodować duplikaty... Większość aplikacji..." | pl | — | — |
| Statistiche inventate "90%"/"~60%" (solo overlay nordico sv/da, non nel testo IT/EN canonico) | NUMERI NON DOCUMENTATI | Rimosse da `nordic-overlay.json` (25/25 righe diff, verificato) | sv, da | — | — |
| Articolo senza `sources[]` né citazioni visibili | GAP (richiesto da FASE 1/2) | Aggiunto `sources: string[]` (4 URL S1-S4, alimenta `citation` in JSON-LD) + citazioni inline "Fonte:/Source:/Fuente:/Quelle:/Bron:" ancorate al claim specifico, in it/en/es/de/nl | it/en/es/de/nl | — | — |

## Locale realmente live oggi (confermato via `isBlogVariantIndexable` + `isPostTranslated`, non "11" come riportato erroneamente in una sintesi precedente in questa stessa sessione)

**7 locale indicizzate**: it, en, es, de, nl (testo `.ts`) + sv, da (nordic overlay).
**6 locale bloccate** (causa condivisa: `secondaryKeywords` 5 elementi invece di 6 richiesti, non toccata da questo hotfix): pt, fr, pl, tr, ja, ko.
**2 locale senza overlay per questo post** (non bloccate da un bug, semplicemente mai tradotte lì): no, fi.

Le correzioni di testo sono state comunque propagate anche a pt/fr/pl/tr/ja/ko per non lasciare una versione "vecchia e falsa" in sorgente in attesa dello sblocco futuro (FASE 3 di questo addendum: PT/FR in PR separata, sul testo CORRETTO, non sul draft precedente).

## Limiti ancora non verificabili

- Comportamento esatto di Garmin Connect per tipo di dato/versione app: nessuna documentazione ufficiale Garmin pubblica trovata con lo stesso livello di dettaglio di Android/Samsung/Google; il testo riflette questo mantenendo un linguaggio non assoluto ("varia... non è garantito, ma nemmeno escluso").
- Il claim CTA "log visibile in-app di cosa si è sincronizzato e cosa no" (segnalato dal fact-check come non riscontrato altrove nel repo) resta INVARIATO in questo hotfix, in attesa di conferma di Matteo — non è stato né rimosso né usato per giustificare nuovo testo.
