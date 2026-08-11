# Verifiche sul fix server — diff integrale, costo, e le divergenze locali

## 1. Diff integrale contro la definizione viva

La baseline non è il file di migration: è la definizione **realmente in
produzione**, ricostruita in locale e verificata per MD5 prima di confrontarla.

```
MD5 di public.upsert_fitness_metrics_v189 in produzione : 08619d98b1f8a7351839c8f7af9e0ee0
MD5 della baseline ricostruita in locale                : 08619d98b1f8a7351839c8f7af9e0ee0
```

Diff `pg_get_functiondef` vecchia → nuova: **12 righe rimosse, 23 aggiunte**, e
sono tre cose sole.

1. **INSERT canonicalizzato.** `p_row->'sleep_stages'` diventa
   `case when jsonb_typeof(...) = 'array' then internal._canonicalize_sleep_stages_jsonb(...) else null end`.
2. **Un commento riscritto** su `sleep_minutes`. Nessun cambiamento di codice:
   la regola è identica.
3. **I tre campi del sonno in una sola assegnazione**, con i fallback che
   impediscono a un merge vuoto di scrivere `null` in colonna.

Nient'altro è cambiato. Le 24 righe `case when excluded.collected_at_ms >= ...`
degli altri scalari, il blocco `sleep_apnea_detected`, i due merge sorelle, i
tre controlli di autorizzazione in testa e il `where user_id = auth.uid()`
finale sono byte per byte gli stessi.

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
