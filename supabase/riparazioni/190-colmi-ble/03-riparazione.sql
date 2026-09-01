-- LA RIPARAZIONE. Finisce in ROLLBACK, ed e' voluto.
--
-- Diventa `commit` SOLO dopo che questo piano e' stato revisionato e la prova
-- su copia e' passata. Non e' un promemoria: e' il valore predefinito.
--
-- NON AUTORIZZATA. Non fa parte della finestra di produzione della 190.
\set ON_ERROR_STOP on
begin;

-- ── Le due righe, ricavate dalla stessa regola di 00-identifica.sql ────────
create temporary table _da_riparare on commit drop as
with r as (
  select id, local_day_key, collected_at_ms,
         case when jsonb_typeof(sleep_stages)='array'
              then sleep_stages else '[]'::jsonb end as st
  from public.fitness_metrics
  where source = 'colmi_ble' and local_day_key is not null
), s as (
  select r.id, r.collected_at_ms,
         coalesce((e.value->>'sessionIdx')::int,0) as sidx,
         (e.value->>'endMs')::bigint as b
  from r cross join lateral jsonb_array_elements(r.st) e(value)
  where jsonb_typeof(e.value)='object' and (e.value->>'endMs') is not null
), sess as (
  select id, collected_at_ms, sidx, max(b) as fin
  from s group by id, collected_at_ms, sidx
)
select distinct id from sess
where fin > collected_at_ms + 6*60*60*1000;

-- ── GUARDIA 1: il dataset e' ancora quello misurato ────────────────────────
do $$
declare n int;
begin
  select count(*) into n from _da_riparare;
  if n <> 2 then
    raise exception
      'ABORT: attese 2 righe da riparare, trovate %. Il dataset e'' cambiato: '
      'rifare la misura, questo piano non e'' piu'' quello giusto.', n;
  end if;
end $$;

-- ── Chi conserva la sessione buona e chi no ────────────────────────────────
-- Una riga va azzerata del tutto: cio' che resterebbe dopo aver tolto la
-- sessione impossibile e' il RING_STALE_REPLAY, cioe' la copia al minuto della
-- sessione di un altro giorno. Promuoverla a «la notte» sarebbe sostituire una
-- risposta sbagliata con un'altra.
-- L'altra conserva la propria sessione 0, che non e' replay di niente.
create temporary table _replay on commit drop as
select a.id
from _da_riparare d
join public.fitness_metrics a on a.id = d.id
where exists (
  -- esiste un'ALTRA riga dello stesso utente, di un altro giorno, con una
  -- sessione identica per orario d'orologio, durata e numero di segmenti
  select 1
  from public.fitness_metrics b
  where b.user_id = a.user_id
    and b.source = 'colmi_ble'
    and b.id <> a.id
    and md5((
      select string_agg(
        to_char(to_timestamp((e.value->>'startMs')::bigint/1000) at time zone 'UTC','HH24:MI')
        || (e.value->>'stage'), '~'
        order by (e.value->>'startMs')::bigint)
      from jsonb_array_elements(b.sleep_stages) e(value)
      where coalesce((e.value->>'sessionIdx')::int,0) = 0
    )) = md5((
      select string_agg(
        to_char(to_timestamp((e.value->>'startMs')::bigint/1000) at time zone 'UTC','HH24:MI')
        || (e.value->>'stage'), '~'
        order by (e.value->>'startMs')::bigint)
      from jsonb_array_elements(a.sleep_stages) e(value)
      where coalesce((e.value->>'sessionIdx')::int,0) = 0
    ))
);

-- ── CASO A: la sessione 0 e' buona → si tiene, e la finestra si riderivа ───
with superstiti as (
  select f.id,
         jsonb_agg(e.value order by (e.value->>'startMs')::bigint) as st,
         min((e.value->>'startMs')::bigint) as a,
         max((e.value->>'endMs')::bigint) as b
  from public.fitness_metrics f
  join _da_riparare d on d.id = f.id
  cross join lateral jsonb_array_elements(f.sleep_stages) e(value)
  where f.id not in (select id from _replay)
    and coalesce((e.value->>'sessionIdx')::int,0) = 0
  group by f.id
)
update public.fitness_metrics f
   set sleep_stages  = s.st,
       sleep_start_ms = s.a,
       sleep_end_ms   = s.b,
       sleep_minutes  = (
         select coalesce(sum(
                  ((x->>'endMs')::bigint - (x->>'startMs')::bigint) / 60000
                ), 0)::int
         from jsonb_array_elements(s.st) x
         where lower(btrim(x->>'stage')) <> 'awake')
  from superstiti s
 where f.id = s.id;

-- ── CASO B: cio' che resta e' un replay → nessuna notte, il resto intatto ──
update public.fitness_metrics
   set sleep_stages = null, sleep_start_ms = null,
       sleep_end_ms = null, sleep_minutes = null
 where id in (select id from _replay);

-- ── GUARDIA 2: esattamente DUE righe toccate, mai una di piu' ──────────────
do $$
declare tot int; a int; b int;
begin
  select count(*) into a from _da_riparare where id not in (select id from _replay);
  select count(*) into b from _replay;
  tot := a + b;
  if tot <> 2 then
    raise exception 'ABORT: righe toccate = % (caso A %, caso B %), attese 2.', tot, a, b;
  end if;
end $$;

-- ── POSTCONDIZIONI (04) vanno eseguite QUI, prima di decidere ──────────────
\i 04-postcondizioni.sql

-- Il valore predefinito. Diventa `commit;` solo dopo la revisione.
rollback;
