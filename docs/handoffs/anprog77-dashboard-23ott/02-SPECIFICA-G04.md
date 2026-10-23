# 02 Specifica G-04: giorni con dati e finestra di 30 giorni

Riferimenti di codice a `42b811e7d990a860d7f2a4cdc38e01c74618a2b8`. Le righe sono state rilette il 23/10.
Le affermazioni sul comportamento sono **letture di codice, non esecuzioni**, salvo dove indicato «misurato».

## 1. Il problema

La pagina reale mostra «Giorni con dati negli ultimi 30 giorni: N.» (testo it; en: «Days with data in the last 30 days: N.»).

- `app/(frontend)/[locale]/app/dashboard/page.tsx:76`:
  `giorni = new Set(lettura.righe.map((r) => r.local_day_key)).size`.
  Il numero è quello delle **chiavi di riga distinte, grezze**, di qualunque riga letta: non valida le chiavi,
  non guarda `steps`, non guarda la sorgente.
- Finestra di lettura: `page.tsx:27` `GIORNI_RIEPILOGO = 30`; `page.tsx:66`
  `new Date(oggi.getTime() - (GIORNI_RIEPILOGO - 1) * 86_400_000)`; `page.tsx:32-33` `giornoLocale(d)` =
  `d.toISOString().slice(0, 10)`. Quindi la finestra è di **date UTC**, estremi compresi, oggi compreso.
  Il filtro lato lettura è `gte/lte` sulla colonna di testo `local_day_key` (`lib/dashboard/letture-titolare.ts:268-269`),
  un confronto lessicografico fra stringhe.
- `local_day_key` è scritta dall'app con regex `^\d{4}-\d{2}-\d{2}$` all'ingresso (`app/api/v1/sync/schema.ts:150-153`),
  ma la regex (righe 150-153) non verifica che la data esista (`2026-09-31` passa).

### Misure del 16/10 (sonda usa-e-getta su una copia di un SHA precedente, orologio fisso 2026-10-15T12:00Z, doppio fedele di PostgREST)

Le misure sono di allora e il codice della pagina è lo stesso a questo SHA per le righe citate; la sonda non è nel pacchetto.

| Caso | Contatore mostrato |
|---|---|
| una riga valida il 14/10 | 1 |
| due righe lo stesso giorno (due sorgenti) | 1 |
| **lo stesso giorno scritto in 3 modi** (`2026-10-14`, `2026-10-14 `, `2026-10-14T00:00:00Z`) | **3** |
| solo il giorno corrente | 1 |
| solo `steps` nullo, oppure negativo | 1 |
| bordo: oggi-29 e oggi-30 | 1 (solo oggi-29) |
| **chiave non zero-padded `2026-10-1`** | **1** |
| chiavi che ordinano fuori intervallo (`2026-10-9`, `ieri`) | 0 |
| una riga `strava_oauth` e una `oura_oauth`, entrambe con `steps` 0 | 2 |

Conclusione: il numero dice «chiavi di riga distinte», non «giorni con dati». Il difetto è di coerenza, non di sicurezza.
Con dati normali (una chiave valida per giorno) il numero non cambia.

## 2. Obiettivo del lotto

Il mandato del 22/10 (voce «G-04: giorni validi e distinti nella finestra, validazione calendariale») chiede:

1. contare **solo date di calendario reali**, nel formato esatto `AAAA-MM-GG`, **distinte**, **dentro la finestra** (estremi compresi);
2. definire la finestra di 30 giorni come **aritmetica di giorni di calendario** (numero di giorno dall'epoca), indipendente dal fuso del processo e dalla lunghezza in ore del giorno;
3. con test scritti a mano (attesi senza `Date` nell'oracolo), compresi i giorni del cambio ora in Europe/Rome nel 2026: 29 marzo (23 h) e 25 ottobre (25 h).

API che i due test WIP presuppongono (da implementare in `lib/dashboard/giorni-riepilogo.ts`):

```ts
finestraRiepilogo(nowMs: number, giorni: number): { da: string; a: string }
  // a  = data UTC di nowMs; da = a - (giorni - 1) giorni di calendario; 'AAAA-MM-GG'
contaGiorniValidiDistinti(chiavi: readonly unknown[], da: string, a: string): number
  // 0 se da o a non sono date valide, o se da > a
```

Suggerimento di struttura: in `lib/dashboard/finestra.ts` esistono già `giorniDaData` (valida l'esistenza reale
della data per ricostruzione) e `dataDaGiorni`, entrambe **non esportate** (righe 42-51 e 53-55, più le costanti `FORMA`
e `GIORNO_MS` alle righe 37-39). Riusarle esportandole, oppure duplicare circa quindici righe nel modulo nuovo.
A questo SHA `finestra.ts` è importato da `page.tsx` e da `lib/dashboard/passi.ts` (file non di test) e dai test
`finestra.test.ts`, `passi.test.ts`, `passi.hardening.test.ts`. Aggiungere un export non cambia le firme esistenti, ma
`passi.test.ts` (circa riga 391) controlla che `passi.ts` importi solo `./finestra` e un tipo da `./letture-titolare`,
e `finestra.test.ts` (circa righe 305-316) scansiona il sorgente di `finestra.ts` (nessun import, nessun parametro
`now`, nessuno stato di modulo): rileggili prima di toccare quel file.

In `page.tsx` cambiano: l'import; le righe 65-66 (la finestra: `oggi`, `inizio`); la riga 74 (le due date passate a
`leggiMetricheDelTitolare`, che oggi usano `giornoLocale(inizio)` e `giornoLocale(oggi)`); la riga 76 (il conteggio).
`GIORNI_RIEPILOGO` (27) e `giornoLocale` (32-34, con il commento 29-31) possono restare inutilizzati: decidi se
rimuoverli e dichiaralo. Nei dati normali il numero mostrato non cambia; nei casi anomali scende (tre scritture
dello stesso giorno diventano 1, una chiave non standard diventa 0).

## 3. Che cosa NON è in questo lotto (decisioni di Matteo)

Non farle, non anticiparle, non nasconderle in un commit di G-04:

- **Il nome o l'etichetta del contatore.** Il testo `Giorni con dati negli ultimi 30 giorni` resta com'è
  (`lib/dashboard/testi.ts`, `giorniConDati`). Cambiare solo il testo non risolverebbe l'ambiguità e cambiarlo
  tocca copy it/en soggetto a revisione.
- **Allineare il contatore al grafico** (solo sette giorni conclusi, solo stati qualificati): cambia la funzione del contatore.
- **Che cosa conta come «dato»**: righe con `steps` nullo o non valido, righe Strava/Oura con `steps` 0 (decisione di Matteo ancora aperta, nel suo elenco interno con le etichette D1-a e D1-b; non è il «D1» del contratto di accesso, che riguarda la prova di 14 giorni), giorno corrente non concluso.
- Regole di accesso, migration, cancello, `CAPABILITY_STATUS` (definito in `lib/product-facts.ts`, letto da `lib/feature-status.ts`: non toccare nessuno dei due), `lib/web-dashboard/**`, `from-rows.ts`.

Se durante il lavoro una di queste emerge come necessaria, **fermati e scrivilo nel report**: non decidere.

## 4. Limiti già individuati

Dalle verifiche indipendenti del 22/10 (lettura di codice, nessuna esecuzione):

- **(a) Finestra in UTC, chiave in giorno del telefono.** `local_day_key` è il giorno locale del telefono,
  `giornoLocale` è UTC (commento a `page.tsx:29-31`). Per chi è in anticipo su UTC, nelle ore tra la sua mezzanotte
  e quella UTC, il giorno corrente locale supera `a`: il filtro `lte` lo esclude già oggi e un contatore
  «dentro finestra» lo scarterebbe comunque. Decidere se la finestra va allargata di un giorno è una decisione
  di prodotto: **segnalala, non risolverla**. Il test WIP «non dipende dal fuso» verifica solo la funzione di
  finestra, non questo caso.
- **(b) Periodo corrente incompleto.** L'ultimo giorno (oggi) è contato come giorno intero anche se parziale.
- **(c) Chiamanti.** Esportare helper di `finestra.ts` è a basso rischio per i file non di test, ma i test che
  importano `finestra.ts` non sono stati verificati.
- **(d) Collation.** Il confronto `gte/lte` fra stringhe dipende dall'ordinamento del database; la collation di
  produzione non è nota. Non provato.
- **(e) Test esistenti con date fisse e senza orologio.** `page.test.tsx` (righe di prova 2026-09-20/21/22, 1 occorrenza di «Giorni con dati»),
  `page.cancello.test.tsx` (14 occorrenze di «Giorni con dati», alle righe 216, 264, 274, 290, 298, 314, 321, 331, 340,
  362, 367, 376, 380, 381: alcune sono asserzioni negative `not.toContain`, che la correzione non cambia; controlla ciascuna)
  e `page.sessione.test.tsx` (1) non fissano l'orologio
  (nessun `useFakeTimers`/`setSystemTime`, riletto il 23/10). Dopo la correzione, con la finestra «dentro» i
  conteggi, le date di settembre escono dalla finestra e quei test falliranno finché non si fissa l'orologio
  (`vi.useFakeTimers({ toFake: ['Date'] })` e `vi.setSystemTime(...)`). Aggiornali nello stesso commit e dichiaralo.
  Il conteggio esatto delle asserzioni da toccare va rifatto con `grep`. Altri file della stessa cartella citano il
  contatore e hanno già un orologio fisso (2026-10-15): `page.completezza.api.test.tsx`,
  `page.pagination-fault.api.test.tsx`, `page.grafico-passi.test.tsx`. Dopo la correzione rilanciali; se la correzione
  li rompe, sistemali con motivazione nel report.

## 5. Punti deboli dei due test WIP (non fidarti ciecamente di un verde)

- **Errore aritmetico noto nel test del modulo** (`giorni-riepilogo.test.ts.txt`, riga 39, test «una finestra di N giorni
  contiene esattamente N date consecutive»): `Array.from({ length: 40 }, ...)` genera le date dal 2026-09-01 al 2026-10-10,
  ma la finestra controllata è 2026-09-26..2026-10-25, quindi un'implementazione corretta conta 15, non 30, e il test
  va in rosso. Serve `length: 60` (dal 1/9 al 30/10, con esattamente 30 date nella finestra). La copia qui è lasciata
  **identica all'originale** (impronta sotto): correggi la tua copia di lavoro e dichiaralo.
- Il test del modulo oggi fallirebbe solo per modulo mancante: fallimento banale, nessun valore di prova.
- «Non dipende dal fuso» usa `vi.stubEnv('TZ', ...)`: se `TZ` non ha effetto a processo avviato, il test è debole.
  Considera di lanciare l'intera suite con `TZ` diversi invece di fidarti dello stub.
- Il blocco «equivalenza con la formula precedente» è **caratterizzazione**: coincide con il codice vecchio per
  costruzione e passerebbe anche prima della correzione. Non dimostra nessun difetto.
- Test di pagina: il finto client **non filtra** per giorno. Di quelli, solo «conta solo date reali…» e «nessuna riga valida…»
  dovrebbero fallire sul codice attuale; i sei casi `gte/lte` passerebbero già (la finestra UTC è corretta).
  Quindi non provano il confine lato server. Queste sono **previsioni**, non esiti: nessuno è stato eseguito.
- Il progetto vuole una prova **fail-prima / pass-dopo** reale. In pratica: (1) copia il test di pagina, aggiungilo con
  `git add`, lancia `pnpm exec vitest run "app/(frontend)/[locale]/app/dashboard/page.giorni-riepilogo"` PRIMA di toccare
  `page.tsx`: dovrebbero fallire i due test di conteggio (previsione: 8 invece di 2, 3 invece di 0); salva l'output reale;
  (2) il test del modulo non può dare un rosso significativo prima che il modulo esista: crea il modulo con una versione
  deliberatamente sbagliata (per esempio la formula con `getHours`/fuso locale, o senza validazione) e registra quel rosso;
  (3) implementa e registra il verde. Le previsioni di questo documento non sono esiti.

Impronte SHA-256 degli originali (identiche alle copie `.txt`):

```
e7995f1fba8ec3c1caca7e067bc90cd732abdd006ed33f8edf3550f592350c50  lib/dashboard/giorni-riepilogo.test.ts
4995bbde60c9e972c74844b706e67181135f5ac88391d53c9e2dc48cd7441a13  app/(frontend)/[locale]/app/dashboard/page.giorni-riepilogo.test.tsx
```

## 6. File riservati a G-04 (dal 23/10, un solo writer: anprog77)

| File | Modo |
|---|---|
| `lib/dashboard/giorni-riepilogo.ts` e `.test.ts` | nuovi |
| `app/(frontend)/[locale]/app/dashboard/page.giorni-riepilogo.test.tsx` | nuovo |
| `app/(frontend)/[locale]/app/dashboard/page.tsx` | solo righe 66 e 76 e l'import |
| `app/(frontend)/[locale]/app/dashboard/page.test.tsx`, `page.cancello.test.tsx`, `page.sessione.test.tsx` | solo orologio fisso e attesi coerenti |
| `lib/dashboard/finestra.ts` e `finestra.test.ts` | solo export di helper esistenti |
| `tools/perimetro-suite.conf` | solo `file=` e `test=` (e `saltati=` solo se cambia davvero), misurati con `pnpm suite:perimetro-check` dopo aver aggiunto i nuovi test con `git add` (il controllo confronta con i file tracciati), più un blocco di commento datato nello stile delle voci precedenti («misurato, non sommato»). **Non toccare** `test_release`, `saltati_release`, `skip_autorizzato`. È l'unico file a conflitto previsto con `main`: lo risolve Matteo |
| `page.completezza.api.test.tsx`, `page.pagination-fault.api.test.tsx`, `page.grafico-passi.test.tsx` | solo se rotti dalla correzione, con motivazione nel report |

Tutto il resto della dashboard è fuori perimetro. Per toccare altro serve prima una divisione esplicita dei file.

## 7. Consegna attesa

A Matteo, come ramo derivato (o patch) più un report breve con **quattro stati separati** per ogni affermazione:
implementato / verificato / rilasciato / live. Il report deve contenere:

1. l'esito **reale** (output copiato) di: tsc, test mirati, suite completa, `pnpm suite:perimetro-check`, `pnpm governance:check`, ciascuno con il comando e l'ambiente;
2. il rosso dei test nuovi sul codice precedente (fail-prima) e il verde dopo (pass-dopo);
3. i contatori prima/dopo (`file`, `test`, `saltati`) misurati, non sommati;
4. i limiti (a)-(e) con l'esito della scelta fatta, o «segnalato, non deciso»;
5. che cosa non hai potuto provare (PG17, autenticazione reale, browser).

Commit in italiano, con `Co-Authored-By` se un agente ha scritto il codice. Niente `git push` verso `main`.
Niente nuove dipendenze.
