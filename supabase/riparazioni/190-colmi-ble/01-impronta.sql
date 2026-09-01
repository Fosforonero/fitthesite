-- L'impronta di ENTRAMBE le popolazioni, prima di toccare qualunque cosa.
--
-- Le quattro righe di luglio non vengono riparate, ma la loro impronta va presa
-- lo stesso: e' l'unico modo di PROVARE che sono rimaste identiche. Una
-- postcondizione che dice «non le abbiamo toccate» senza una misura prima non
-- prova niente.
--
-- Nessun dato sanitario in uscita: solo md5 e conteggi.
\set ON_ERROR_STOP on
with r as (
  select id, user_id, local_day_key, collected_at_ms,
         case when jsonb_typeof(sleep_stages)='array'
              then sleep_stages else '[]'::jsonb end as st,
         sleep_start_ms, sleep_end_ms, sleep_minutes, steps, spo2_percent,
         hrv_rmssd, stress_avg, skin_temperature_c, calories_kcal,
         distance_meters, resting_heart_rate_bpm, intraday_steps, intraday_hr
  from public.fitness_metrics where source = 'colmi_ble'
), s as (
  select r.id, r.collected_at_ms,
         coalesce((e.value->>'sessionIdx')::int,0) as sidx,
         (e.value->>'endMs')::bigint as b
  from r cross join lateral jsonb_array_elements(r.st) e(value)
  where jsonb_typeof(e.value)='object' and (e.value->>'endMs') is not null
), sess as (
  select id, collected_at_ms, sidx, max(b) as fin
  from s group by id, collected_at_ms, sidx
), colpite as (
  select distinct id,
         case when local_day_key is null then 'luglio-INTOCCABILI'
              else 'INC-R10-da-riparare' end as popolazione
  from sess join r using (id)
  where fin > collected_at_ms + 2*60*60*1000
)
select c.popolazione,
       count(*) as righe,
       md5(string_agg(
         coalesce(r.st::text,'') || '|' ||
         coalesce(r.sleep_start_ms::text,'') || '|' ||
         coalesce(r.sleep_end_ms::text,'') || '|' ||
         coalesce(r.sleep_minutes::text,''), '~' order by r.id)) as impronta_sonno,
       md5(string_agg(
         coalesce(r.steps::text,'') || '|' || coalesce(r.spo2_percent::text,'') || '|' ||
         coalesce(r.hrv_rmssd::text,'') || '|' || coalesce(r.stress_avg::text,'') || '|' ||
         coalesce(r.skin_temperature_c::text,'') || '|' || coalesce(r.calories_kcal::text,'') || '|' ||
         coalesce(r.distance_meters::text,'') || '|' || coalesce(r.resting_heart_rate_bpm::text,'') || '|' ||
         coalesce(r.intraday_steps::text,'') || '|' || coalesce(r.intraday_hr::text,''),
         '~' order by r.id)) as impronta_altre_metriche
from colpite c join r on r.id = c.id
group by c.popolazione order by c.popolazione;
