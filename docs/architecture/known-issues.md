# Known issues — migration history (non bloccanti, non corretti)

Bug pre-esistenti e indipendenti, scoperti durante la verifica Founder P0
(replay dell'intera catena migration da database vuoto su
`supabase/postgres:15.8.1.044`, 2026-07-19/20). Nessuno dei due blocca
l'apply della migration Founder P0 in produzione — Supabase applica le
migration incrementalmente sullo schema live, che ha gia' superato questi
punti storicamente. Bloccano invece un replay letterale `psql -f` dell'intera
catena da zero. Registrati qui separatamente perche' finche' non sono
corretti **non va dichiarato un "full clean-database replay PASS"** senza
questa riserva.

## 1. `row` come nome di parametro (parola riservata Postgres)

**File:** `supabase/migrations/20260514120004_init_b2c_subs.sql`
**Sintomo:** `create or replace function public.is_b2c_lifetime(row public.b2c_subscriptions)`
fallisce con `syntax error at or near "row"` — `row` e' una parola chiave
riservata Postgres, non utilizzabile come nome di parametro non quotato.
**Impatto in produzione:** nessuno accertato — la funzione e' gia' applicata
e in uso sullo schema live; il bug si manifesta solo rieseguendo il file da
un database vuoto.
**Verificato per Founder P0:** aggirato con una copia locale patchata
(parametro rinominato tra virgolette) fornita al container di verifica; il
file reale nel repo **non e' stato toccato** (editare una migration storica
gia' applicata sarebbe pratica scorretta).
**Da fare (fuori scope Founder P0):** una nuova migration che sostituisce la
funzione con un nome di parametro valido, oppure — se non urgente — lasciare
cosi' e documentare che il replay da zero richiede il workaround.

## 2. Colonna `water_ml` mancante al punto della sua prima referenza

**File:** `supabase/migrations/20260522120006_rls_health_data_group_sharing.sql`
**Sintomo:** referenzia una colonna `water_ml` non ancora esistente a quel
punto della sequenza migration — aggiunta solo da una migration successiva
non tracciata in git a quella data (stesso pattern di drift codice/DB gia'
visto e risolto per le 5 migration Founder backfillate in questo stesso
sprint).
**Impatto in produzione:** nessuno accertato, stesso discorso del punto 1.
**Verificato per Founder P0:** scenario saltato nel loop di verifica (non
c'entra con Founder), segnalato come gap di igiene del repository piu' ampio.
**Da fare (fuori scope Founder P0):** identificare la migration reale che ha
aggiunto `water_ml` in produzione (query `information_schema` / storia
Supabase, stesso procedimento usato per backfillare le 5 migration Founder)
e backfillarla in git nella posizione temporale corretta.
