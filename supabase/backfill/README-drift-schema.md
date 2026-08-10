# Drift fra le migration del repository e lo schema di produzione

Rilevato il 2026-08-10 ricostruendo il database da zero per il gate del registro
di proprietà degli acquisti.

**Non blocca il registro**, che non tocca nessuno degli oggetti coinvolti. Ma
impedisce di dire che il database locale ricostruisce fedelmente la produzione,
e quindi va tenuto separato da qualunque affermazione di quel tipo.

## Perché non se n'era accorto nessuno

`supabase db reset` applica tutte e 56 le migration con **exit 0 e zero
errori**. Postgres non valida i corpi delle funzioni plpgsql alla creazione: una
funzione che referenzia una colonna inesistente viene creata senza protestare, e
fallisce solo quando qualcuno la chiama. Un reset verde non dimostra che lo
schema sia quello giusto.

I due casi sotto sono emersi solo perché il gate ha *eseguito* qualcosa contro
lo schema ricostruito, non perché lo ha applicato.

## Drift 1 — colonne `hr_source_name` e `hr_source_quality`

| | |
|---|---|
| **Dove** | `public.fitness_metrics` |
| **Produzione** | le colonne esistono (verificato in sola lettura) |
| **Ricostruzione locale** | non esistono |
| **Migration che le crea** | **nessuna**: zero `add column` in tutto `supabase/migrations/` |
| **Chi le usa** | `public.upsert_fitness_metrics_v189`, che le legge e le scrive |

Conseguenza: nel database ricostruito la funzione di ingest del sync è **rotta a
runtime**. `supabase db lint` la segnala come errore; l'apply non lo fa.

## Drift 2 — valore `founder_grant` nel vincolo `billing_source`

| | |
|---|---|
| **Dove** | vincolo `b2c_subscriptions_billing_source_check` |
| **Produzione** | `('google_play','apple_iap','stripe','trial','founder_grant')`, con 18 righe che usano `founder_grant` |
| **Ricostruzione locale** | `('google_play','apple_iap','stripe','trial')` |
| **Migration che lo aggiunge** | **nessuna** |

Conseguenza: nel database ricostruito è **impossibile creare** una riga founder,
cioè proprio la casistica più numerosa fra quelle che il backfill deve
escludere. Il test `35-backfill-fixtures.sh` allinea il vincolo prima di
seminare le fixture, dichiarandolo sul posto: senza, proverebbe un'esclusione su
righe che localmente non possono esistere.

## Cosa significa per il gate del registro

Resta valido per quello che prova. Il registro tocca
`private.billing_purchase_claims`, `public.b2c_subscriptions` e `auth.users`:
nessuno dei due drift riguarda le colonne o i vincoli che usa, e il secondo è
compensato esplicitamente nel test.

Quello che **non** si può dire è "il database locale è uguale alla produzione".
Non lo è, e non lo era nemmeno prima di questo sprint.

## Cosa serve per chiuderlo

Fuori dallo scopo del P0 acquisti, ma va fatto prima del prossimo lavoro che
dipenda da una ricostruzione fedele:

1. Recuperare da produzione la definizione reale di `fitness_metrics` e del
   vincolo, e scrivere le migration mancanti come idempotenti
   (`add column if not exists`, `drop constraint if exists` + `add`), così da
   poterle applicare senza rompere la produzione che già le contiene.
2. Confrontare l'intero schema, non solo questi due punti: se ne sono sfuggiti
   due, non c'è ragione di credere che siano gli unici. Un `pg_dump --schema-only`
   della produzione contro quello della ricostruzione locale è il modo diretto.
3. Aggiungere in CI un reset da zero seguito da `supabase db lint`, che fallisce
   sugli errori: è esattamente il controllo che avrebbe trovato il drift 1 il
   giorno in cui è nato.

## Nota sulla memoria di sessione

Esisteva una nota che dichiarava le migration non ricostruibili per via del
parametro chiamato `row` in `20260514120004_init_b2c_subs.sql`. Quella causa
**è stata corretta**: oggi la migration si applica. La conclusione però resta
vera, per due ragioni diverse da quella registrata.
