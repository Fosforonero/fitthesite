-- Sprint 189 "il buco del primo giorno" — backfill legacy, correzione terza
-- passata ("Final activation recovery implementation"). Dry-run validato su
-- Postgres 17 disposable (2026-07-14) prima di questa applicazione.
--
-- Backfill legacy: device con fitness_metrics → success, timestamp piu'
-- antico. Device pairati ma senza fitness_metrics → restano NULL (nessuna
-- UPDATE necessaria, e' gia' il default della colonna).
--
-- Join corretto: devices.id = fitness_metrics.device_id (chiave esterna
-- reale). MAI device_fingerprint: quella colonna non esiste affatto su
-- fitness_metrics.
--
-- Non distruttivo: `and d.first_sync_state is null` esclude sia le righe
-- gia' scritte dalla nuova telemetria (mai sovrascritte da un backfill
-- storico) sia una riesecuzione accidentale dello script stesso (idempotente).
--
-- Backfillata nel repository il 2026-07-19 (Founder P0 review, punto 3):
-- contenuto verbatim recuperato da supabase_migrations.schema_migrations.
update public.devices d
set
  first_sync_state = 'success',
  first_sync_at = earliest.first_received_at,
  first_sync_state_updated_at = now()
from (
  select device_id, min(received_at) as first_received_at
  from public.fitness_metrics
  group by device_id
) earliest
where d.id = earliest.device_id
  and d.first_sync_state is null;
