# Verifiche sul fix server — diff integrale, costo, e le divergenze locali

## 1. Diff integrale contro la definizione viva

La baseline non è il file di migration: è la definizione **realmente in
produzione**, ricostruita in locale e verificata per MD5 prima di confrontarla.

```
MD5 di public.upsert_fitness_metrics_v189 in produzione : 08619d98b1f8a7351839c8f7af9e0ee0
MD5 della baseline ricostruita in locale                : 08619d98b1f8a7351839c8f7af9e0ee0
```

Diff `pg_get_functiondef` vecchia → nuova: **13 righe rimosse, 36 aggiunte**
(di cui 17 sono commenti), e sono tre cose sole.

1. **Il payload canonicalizzato una volta, in una variabile.**
   `v_new_sleep_stages` alimenta sia il valore scritto dall'INSERT sia il
   conteggio delle sessioni. Prima il conteggio girava sul grezzo e la
   canonicalizzazione veniva rifatta dentro la `VALUES`: due letture diverse
   dello stesso payload, e la prima poteva abortire l'upsert.
2. **Un commento riscritto** su `sleep_minutes`. Nessun cambiamento di codice:
   la regola è identica.
3. **I tre campi del sonno in una sola assegnazione**, con i fallback che
   impediscono a un merge vuoto di scrivere `null` in colonna.

Nient'altro è cambiato. Le 24 righe `case when excluded.collected_at_ms >= ...`
degli altri scalari, il blocco `sleep_apnea_detected`, i due merge sorelle, i
tre controlli di autorizzazione in testa e il `where user_id = auth.uid()`
finale sono byte per byte gli stessi.

### 1b. Lo stesso confronto sul merge

Baseline `internal._merge_sleep_stages_jsonb`: MD5 `0df8a073ebe40610439f858ec3c49c59`
in produzione, e la catena `084132 → 084840` ricostruita in locale dà lo stesso
identico valore. Il repo qui riproduce la produzione.

Diff: **12 righe rimosse, 16 aggiunte**, di cui 4 sono commenti.

- `unnest(array[...]) with ordinality as arr(val, side)` al posto di
  `unnest(array[...]) as arr`, e `group by arr.side, ...` al posto di
  `group by arr, ...`. È la correzione del raddoppio, e da sola vale l'intera
  P0.
- I due lati passano dal canonicalizzatore prima di essere confrontati.
- `order by segmenti desc, (end_ms - start_ms) desc, side, start_ms` al posto
  di `order by jsonb_array_length(stages) desc, (end_ms - start_ms) desc`.
  Le prime due chiavi sono le stesse: `segmenti` è `count(*)` per lato e
  sessione, cioè lo stesso numero. `side, start_ms` in coda rende
  deterministico un pareggio che prima veniva risolto dall'ordine di
  `array_agg`, e a parità preferisce il lato già memorizzato.

Il ciclo di selezione, la scelta di `v_main` e il ri-tag di `sessionIdx` sono
byte per byte gli stessi.

### 1c. Il conteggio delle sessioni: l'unico cambio di comportamento

`internal._sleep_session_count_jsonb`, MD5 `bc8cac33caeaf777bd95738fd93c9cdd`,
identico fra produzione e database locale. È l'unica delle tre funzioni il cui
**contratto osservabile cambia**, e cambia perché era rotto:

```
select count(distinct coalesce((s.value->>'sessionIdx')::int, 0))
```

Il cast è nudo. RED misurato sulla definizione viva, cinque forme su cinque:

| `sessionIdx` | esito |
|---|---|
| `"abc"` | ERRORE 22P02 |
| `1.7` | ERRORE 22P02 |
| `[1]` | ERRORE 22P02 |
| `99999999999999999999` | ERRORE 22003 |
| `{"a":1}` | ERRORE 22P02 |

La RPC la chiamava sul payload **grezzo**, prima di ogni canonicalizzazione:
un solo segmento malformato spedito da un client faceva fallire l'intera
transazione, quindi quel giorno l'utente perdeva anche passi, frequenza
cardiaca e calorie. Non era un difetto del sonno, era un difetto del sync.

Dopo: le stesse cinque forme ritornano un numero, il segmento illeggibile non
conta come sessione, e il caso è esercitato sul percorso RPC vero
(`20-rpc-idempotency.sql`, R8) sia in INSERT sia in DO UPDATE.

## 2. Il costo, misurato

Il merge veniva calcolato **tre volte** per ogni `DO UPDATE`, e ogni chiamata
canonicalizza due lati: fino a sei canonicalizzazioni per upsert. Ora è una
assegnazione multi-colonna da sub-SELECT, quindi **una volta sola**.

Misure su 200 upsert ripetuti, database locale:

| Payload | ms per upsert |
|---|---|
| Senza blocco sonno | 1,27 |
| 2 segmenti | 1,34 |
| 94 segmenti (notte reale) | 8,53 |
| 188 segmenti (la stessa notte duplicata) | 14,09 |

Due cose che vale la pena dire per intero.

**Il calcolo unico ha reso il 5%, non il triplo.** Da 7,29 a 6,96 ms sullo
stesso payload da 94 segmenti. La mia stima iniziale (2,0 ms per merge, quindi
6,1 ms su tre) era sbagliata: misurava una `perform` in un ciclo plpgsql, dove
ogni chiamata serializza l'array come argomento. Dentro l'istruzione SQL quel
costo non c'è. La forma a calcolo unico resta perché è quella giusta — una
valutazione, un posto solo — non perché fosse un guadagno grosso.

**Il costo è lineare nei segmenti**, circa 0,077 ms ciascuno. Una notte
duplicata costa il 65% in più di una pulita: quando lo storico sarà
deduplicato, l'upsert costerà di meno anche senza altre modifiche.

## 3. Lo smoke come `authenticated`, e quattro divergenze locali

`50-smoke-authenticated.sql` esercita la RPC come `authenticated` con RLS
attiva, più i negativi: cross-account in lettura, cross-account in scrittura
diretta, RPC con lo `user_id` di un altro, RPC col device di un altro, `anon`
che non può eseguire la funzione, `anon` che non vede righe pur avendo i grant.
Nove casi.

Per arrivarci servono quattro compensazioni, tutte dentro la transazione e
tutte dichiarate nel file, perché **il database ricostruito dalle migration del
repo non è quello di produzione**:

| # | Divergenza | Gravità |
|---|---|---|
| 1 | Grant di tabella: produzione `arwdDxtm`, locale `Dxt` | blocca ogni QA del percorso di scrittura |
| 2 | `authenticated` senza SELECT su `caregiver_links`, `privacy_consents`, `group_members`: le policy stesse sollevano "permission denied" | una policy che fallisce non è una policy che nega |
| 3 | **La policy `users insert own metrics` non esiste in nessuna migration del repo** | in produzione c'è; ricostruendo da queste migration l'app non potrebbe scrivere metriche |
| 4 | `rls_internal` non esiste in locale; la funzione di condivisione sta in `public`, e le espressioni delle policy locali sono più vecchie di quelle vive | la RLS locale non è quella di produzione, nemmeno dove i nomi coincidono |

La terza è quella che conta: non è una differenza di ambiente, è una migration
mancante. Va aperta come voce a sé.

Lo smoke verifica per prima cosa che l'insieme dei nomi delle policy coincida
con produzione: se un giorno la migration mancante venisse aggiunta, il
`create policy` di compensazione fallirebbe e il rosso arriverebbe subito,
invece di lasciare in giro una compensazione che non serve più.
