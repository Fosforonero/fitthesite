-- Le righe da riparare, e SOLO quelle. Sola lettura.
--
-- La soglia e' SEI ore, e non e' arbitraria: separa due popolazioni che non si
-- sovrappongono. INC-R10 sta fra 11,50 e 13,68 ore oltre la raccolta; le righe
-- storiche di luglio (local_day_key nullo, anello R09) stanno fra 2,24 e 2,40.
-- In mezzo non c'e' niente.
\set ON_ERROR_STOP on
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
where fin > collected_at_ms + 6*60*60*1000
order by id;
