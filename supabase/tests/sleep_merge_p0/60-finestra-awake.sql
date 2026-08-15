-- ============================================================================
-- LA FINESTRA NON SI ALLARGA PER UN RISVEGLIO AI BORDI
--
-- Il client e il server non calcolano gli estremi allo stesso modo, e il
-- server vince.
--
--   _buildSleep (health_repository.dart, ramo finale su `nightSegs`):
--       for (final s in nightSegs) {
--         if (s.type == HealthDataType.SLEEP_AWAKE) continue;   <-- esclude
--         if (startMs == null || s.from < startMs) startMs = s.from;
--         if (endMs   == null || s.to   > endMs)   endMs   = s.to;
--       }
--
--   questa migration (dentro _merge_sleep_stages_jsonb):
--       min((s.value->>'startMs')::bigint) as start_ms,
--       max((s.value->>'endMs')::bigint)   as end_ms
--       -- su TUTTI i segmenti, awake compresi
--
--   e upsert_fitness_metrics_v189, sia sul ramo INSERT sia sul DO UPDATE:
--       coalesce((v_new_sleep_scelta->>'main_start_ms')::bigint,
--                (p_row->>'sleep_start_ms')::bigint)
--
-- Il coalesce mette per PRIMO il valore calcolato dal merge: la finestra
-- corretta che il client ha dichiarato viene sovrascritta da una piu' larga.
-- Non e' un caso limite del merge: succede gia' al primo INSERT.
--
-- Conseguenza per chi guarda l'app: un risveglio di tre minuti prima di
-- addormentarsi e uno di tre minuti prima di alzarsi spostano l'inizio e la
-- fine della notte, quindi il grafico e il tempo a letto. I minuti dormiti
-- restano giusti (sleep_minutes esclude gli awake): e' proprio questo che
-- rende il difetto difficile da vedere, perche' i due numeri si contraddicono
-- senza che nessuno dei due sembri sbagliato.
--
-- Gli awake possono e devono restare nell'array degli stadi: qui non si
-- chiede di scartarli, si chiede che non decidano dove comincia e dove
-- finisce la notte.
--
-- Il sonno vero fuori dalla finestra principale e' un'altra cosa e ha il suo
-- caso a parte: qui i soli segmenti esterni sono awake.
--
-- Tutto dentro una transazione chiusa da ROLLBACK.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

/** Notte di 8 ore [0, 480] minuti, con un awake per lato che la deborda. */
create or replace function pg_temp.notte_con_bordi() returns jsonb
language sql immutable as $$
  select '[
    {"sessionIdx":0,"startMs":-180000,   "endMs":0,        "stage":"awake"},
    {"sessionIdx":0,"startMs":0,         "endMs":14400000, "stage":"light"},
    {"sessionIdx":0,"startMs":14400000,  "endMs":28800000, "stage":"deep"},
    {"sessionIdx":0,"startMs":28800000,  "endMs":28980000, "stage":"awake"}
  ]'::jsonb
$$;

create or replace function pg_temp.inizio(a jsonb, b jsonb) returns bigint
language sql as $$ select (internal._merge_sleep_stages_jsonb(a, b)->>'main_start_ms')::bigint $$;

create or replace function pg_temp.fine(a jsonb, b jsonb) returns bigint
language sql as $$ select (internal._merge_sleep_stages_jsonb(a, b)->>'main_end_ms')::bigint $$;

create or replace function pg_temp.stg(a jsonb, b jsonb) returns jsonb
language sql as $$ select internal._merge_sleep_stages_jsonb(a, b)->'stages' $$;

do $$
declare
  v jsonb := pg_temp.notte_con_bordi();
  -- La finestra dichiarata dal client, cioe' quella che _buildSleep calcola
  -- escludendo gli awake: [0, 28800000] ms = [0, 480] minuti.
  atteso_inizio constant bigint := 0;
  atteso_fine   constant bigint := 28800000;
  i1 bigint; f1 bigint;
  i2 bigint; f2 bigint;
  stadi1 jsonb;
begin
  -- --------------------------------------------------------------------
  -- A. PRIMO INSERT. Nessuno stato precedente: il merge vede solo il payload.
  -- --------------------------------------------------------------------
  i1 := pg_temp.inizio(null, v);
  f1 := pg_temp.fine(null, v);
  stadi1 := pg_temp.stg(null, v);

  if i1 is distinct from atteso_inizio then
    raise exception 'A FAIL: al primo INSERT la notte comincia a % invece che a % (l''awake di apertura ha spostato l''inizio di % minuti)',
      i1, atteso_inizio, (atteso_inizio - i1) / 60000;
  end if;
  if f1 is distinct from atteso_fine then
    raise exception 'A FAIL: al primo INSERT la notte finisce a % invece che a % (l''awake di chiusura ha spostato la fine di % minuti)',
      f1, atteso_fine, (f1 - atteso_fine) / 60000;
  end if;

  -- Gli awake NON vanno scartati: restano nell'array, non nella finestra.
  if jsonb_array_length(stadi1) is distinct from 4 then
    raise exception 'A FAIL: gli stadi sono % invece di 4 — gli awake devono restare nel dato grezzo, la richiesta e'' solo che non allarghino la finestra',
      jsonb_array_length(stadi1);
  end if;

  -- --------------------------------------------------------------------
  -- B. SECONDO SYNC dello stesso payload. Deve dire esattamente la stessa
  --    cosa del primo: ne' un raddoppio degli stadi, ne' una finestra che
  --    cresce a ogni giro.
  -- --------------------------------------------------------------------
  i2 := pg_temp.inizio(stadi1, v);
  f2 := pg_temp.fine(stadi1, v);

  if i2 is distinct from i1 or f2 is distinct from f1 then
    raise exception 'B FAIL: il secondo sync sposta la finestra da [%, %] a [%, %]', i1, f1, i2, f2;
  end if;
  if jsonb_array_length(pg_temp.stg(stadi1, v)) is distinct from 4 then
    raise exception 'B FAIL: il secondo sync porta gli stadi a %', jsonb_array_length(pg_temp.stg(stadi1, v));
  end if;

  raise notice 'OK finestra: [%, %] stabile su due sync, awake conservati negli stadi', i1, f1;
end $$;

rollback;
