-- P0 integrita' dati, 11/08/2026 — il merge del sonno duplica gli stadi.
--
-- ── La causa, dimostrata ────────────────────────────────────────────────────
-- internal._merge_sleep_stages_jsonb (definizione live, MD5
-- 0df8a073ebe40610439f858ec3c49c59) raggruppa cosi':
--
--     from unnest(array[old_stages, new_stages]) as arr
--     cross join lateral jsonb_array_elements(...) as s(value)
--     ...
--     group by arr, coalesce((s.value->>'sessionIdx')::int, 0)
--
-- `arr` e' il VALORE dell'array, non il lato da cui viene. Quando vecchio e
-- nuovo sono identici — cioe' a ogni ri-sync della stessa notte, che e' la
-- norma e non l'eccezione — unnest produce due righe con lo stesso valore e il
-- GROUP BY le fonde in un gruppo solo. Ma il lateral ha gia' prodotto due
-- copie di ogni segmento, e jsonb_agg le raccoglie entrambe: una sessione con
-- il doppio degli stadi e gli stessi estremi. Da li' in avanti quel candidato
-- e' il "piu' ricco" e vince ogni confronto.
--
-- Misurato sulla funzione live: 2 segmenti -> 4 -> 4. Raddoppio esatto,
-- deterministico, una volta sola (la seconda volta i due lati non sono piu'
-- identici, quindi tornano a essere due gruppi).
--
-- `sessionIdx` (introdotto da 8ca36f56, 18/05) non c'entra: e' un marcatore
-- del percorso, non la causa. Il difetto sarebbe identico senza di lui.
--
-- ── La conseguenza peggiore non e' il raddoppio ─────────────────────────────
-- Un lato duplicato sembra piu' ricco di un lato pulito. Se i due si
-- sovrappongono, il gonfiato vince e il pulito viene scartato *intero*: tre
-- segmenti reali sostituiti da quattro copie di uno solo. Non e' inflazione,
-- e' perdita. Esercitato in 10-helper-idempotency.sql, caso P4.
--
-- ── Cosa cambia qui ─────────────────────────────────────────────────────────
-- 1. Un canonicalizzatore unico (internal._canonicalize_sleep_stages_jsonb):
--    scarta i segmenti non validi, normalizza i campi numerici, deduplica per
--    (sessionIdx, startMs, endMs, stage normalizzato). Un solo posto, usato da
--    tutti e due i percorsi.
-- 2. Il merge raggruppa per LATO (`with ordinality`), non per valore: vecchio
--    e nuovo restano candidati distinti anche quando sono identici, ed e'
--    l'unica ragione per cui merge(X,X) = X.
-- 3. Ogni candidato viene canonicalizzato PRIMA che se ne confronti la
--    ricchezza, cosi' il duplicato non puo' vincere un confronto che non
--    merita.
-- 4. Il percorso di INSERT canonicalizza anche lui. Non e' un di piu': una
--    riga nuova non passa da nessun merge, quindi un client che spedisce un
--    array gia' duplicato la scriveva gonfiata al primo colpo.
-- 5. Il merge non cancella piu' cio' che non sa ricalcolare: una fonte che
--    riporta solo il totale (anello prima degli stadi, bucket cumulativo
--    Samsung) perdeva sleep_start_ms/sleep_end_ms al secondo sync della stessa
--    giornata, perche' il merge di due nulli restituisce null e quel null
--    finiva dritto in colonna.
--
-- ── Cosa NON cambia, deliberatamente ────────────────────────────────────────
-- sleep_minutes resta il totale autorevole dichiarato dalla fonte, con la
-- stessa regola richezza-vince di prima: non viene ricalcolato dalla somma
-- degli stadi, ne' qui ne' altrove. Anche i due internal._sleep_session_count_jsonb
-- restano sui valori grezzi: contano sessionIdx DISTINTI, quindi il raddoppio
-- non li ha mai toccati, e cambiarli sposterebbe un contratto che non e' rotto.
--
-- Nessun dato viene riscritto da questa migration: corregge solo il
-- comportamento futuro. La riparazione dello storico e' preparata a parte in
-- supabase/repair/, e non viene eseguita da qui.

-- ── 1. Il canonicalizzatore, unico ─────────────────────────────────────────
-- Regole, in quest'ordine:
--   - solo oggetti con startMs/endMs numerici interi (fino a 15 cifre, cosi'
--     un valore assurdo non puo' far esplodere il cast a bigint) ed
--     endMs > startMs;
--   - startMs/endMs/sessionIdx riscritti come interi normalizzati, cosi' il
--     valore memorizzato e' castabile per sempre e i confronti a valle non
--     possono piu' sollevare un errore su dati che arrivano dall'esterno;
--   - dedup per (sessionIdx, startMs, endMs, stage normalizzato): due
--     etichette diverse sullo stesso minuto sono un dato contraddittorio e
--     restano entrambe, perche' non sta a noi sceglierne una;
--   - il resto dell'oggetto e' preservato integralmente, etichetta compresa.
create or replace function internal._canonicalize_sleep_stages_jsonb(stages jsonb)
returns jsonb
language sql
immutable
set search_path = pg_catalog, public
as $$
  with src as (
    select case when jsonb_typeof(stages) = 'array' then stages else '[]'::jsonb end as v
  ),
  parsed as (
    select
      s.value as seg,
      s.ord,
      case when (s.value->>'sessionIdx') ~ '^-?[0-9]{1,9}$'
           then (s.value->>'sessionIdx')::int else 0 end as session_idx,
      floor((s.value->>'startMs')::numeric)::bigint as start_ms,
      floor((s.value->>'endMs')::numeric)::bigint   as end_ms,
      lower(btrim(coalesce(s.value->>'stage', ''))) as stage_key
    from src, lateral jsonb_array_elements(src.v) with ordinality as s(value, ord)
    where jsonb_typeof(s.value) = 'object'
      and (s.value->>'startMs') ~ '^-?[0-9]{1,15}(\.[0-9]+)?$'
      and (s.value->>'endMs')   ~ '^-?[0-9]{1,15}(\.[0-9]+)?$'
  ),
  deduped as (
    select distinct on (session_idx, start_ms, end_ms, stage_key)
      seg || jsonb_build_object(
        'startMs', start_ms, 'endMs', end_ms, 'sessionIdx', session_idx) as canon_seg,
      session_idx, start_ms, end_ms, stage_key
    from parsed
    where end_ms > start_ms
    -- A parita' di chiave sopravvive la PRIMA occorrenza nell'array. Non e'
    -- una scelta estetica: e' la stessa regola del canonicalizzatore del
    -- client e della deduplica della riparazione. Tre posti che scelgono la
    -- stessa copia, altrimenti lo stesso identico input darebbe payload
    -- diversi a seconda di chi lo tocca per primo.
    order by session_idx, start_ms, end_ms, stage_key, ord
  )
  select coalesce(
    jsonb_agg(canon_seg order by start_ms, end_ms, session_idx, stage_key),
    '[]'::jsonb)
  from deduped;
$$;

revoke all on function internal._canonicalize_sleep_stages_jsonb(jsonb) from public;
grant execute on function internal._canonicalize_sleep_stages_jsonb(jsonb) to authenticated;

comment on function internal._canonicalize_sleep_stages_jsonb(jsonb) is
  'Forma canonica di un array di stadi del sonno: scarta i segmenti non validi, normalizza startMs/endMs/sessionIdx a interi, deduplica per (sessionIdx, startMs, endMs, stage normalizzato). Unico canonicalizzatore lato server: usato sia dal percorso di INSERT sia da ogni candidato del merge.';

-- ── 2. Il merge: raggruppa per lato, e ordina per copertura ────────────────
-- Due differenze rispetto alla versione precedente.
--
-- (a) `with ordinality`: `side` distingue vecchio da nuovo anche quando i due
--     array sono lo stesso identico valore. E' la correzione del raddoppio.
--
-- (b) L'ordine dei candidati non e' piu' `jsonb_array_length desc`. Contare
--     gli elementi misura la verbosita', non l'informazione: un candidato con
--     quattro etichette contraddittorie sullo STESSO intervallo ne ha quattro,
--     e batteva un candidato pulito con tre intervalli consecutivi reali. Si
--     sovrappongono, quindi il pulito veniva scartato intero. La deduplica
--     esatta non chiude quel caso, perche' i quattro segmenti sono diversi
--     fra loro: differiscono nell'etichetta.
--
--     Il criterio ora e', in ordine:
--       1. i candidati CONTRADDITTORI vanno per ultimi. Contraddittorio vuol
--          dire che la somma delle durate supera la copertura reale, cioe'
--          che dentro la stessa sessione due segmenti si accavallano. Un
--          candidato cosi' non puo' scartarne uno pulito: e' il fail-closed.
--          Se e' l'unico che copre quella finestra viene tenuto lo stesso,
--          perche' buttarlo sarebbe perdere l'unica cosa che abbiamo.
--       2. copertura temporale reale (unione degli intervalli), decrescente.
--       3. numero di segmenti, decrescente: a parita' di copertura, piu'
--          dettaglio e' meglio.
--       4. il lato 1, cioe' quello gia' memorizzato: un pareggio non porta
--          informazione nuova, e preferire il conservato rende l'operazione
--          stabile sotto qualunque ordine di replay.
--
-- main_start_ms/main_end_ms restano invece sulla regola di prima (piu'
-- segmenti, poi piu' lunga) applicata ai soli candidati SOPRAVVISSUTI. Quella
-- scelta e' accoppiata a `mainSession` del client, e cambiarla qui vorrebbe
-- dire aprire una divergenza fra i due lati per un problema che non e'
-- questo. Il fail-closed la protegge comunque: un candidato contraddittorio
-- che non e' sopravvissuto non puo' fornire la finestra.
create or replace function internal._merge_sleep_stages_jsonb(old_stages jsonb, new_stages jsonb)
returns jsonb
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  v_grouped jsonb[];
  v_selected jsonb[] := '{}';
  v_main jsonb;
  v_cand jsonb;
  v_kept jsonb;
  v_overlaps boolean;
  v_final_stages jsonb := '[]'::jsonb;
  v_retagged jsonb;
  v_idx int := 0;
begin
  with lati as (
    select arr.side, s.value as seg,
           (s.value->>'sessionIdx')::int as sess,
           (s.value->>'startMs')::bigint as s0,
           (s.value->>'endMs')::bigint   as s1
    from unnest(array[
           internal._canonicalize_sleep_stages_jsonb(old_stages),
           internal._canonicalize_sleep_stages_jsonb(new_stages)
         ]) with ordinality as arr(val, side)
    cross join lateral jsonb_array_elements(arr.val) as s(value)
    -- Nessun filtro di validita' qui: il canonicalizzatore ha gia' garantito
    -- che ogni elemento e' un oggetto con startMs/endMs interi ed
    -- endMs > startMs. Ripetere il controllo qui vorrebbe dire avere due
    -- definizioni di "valido" che possono divergere.
  ),
  -- Copertura reale per candidato: unione degli intervalli con il massimo
  -- corrente (gaps-and-islands). NON somma contro estensione totale: con un
  -- buco nella notte la somma puo' restare sotto l'estensione pur avendo
  -- segmenti accavallati, e la contraddizione passerebbe inosservata.
  isole as (
    select side, sess, s0, s1,
           count(*) filter (where prev_max is null or s0 > prev_max)
             over (partition by side, sess order by s0, s1 rows unbounded preceding) as isola
    from (
      select side, sess, s0, s1,
             max(s1) over (partition by side, sess order by s0, s1
                           rows between unbounded preceding and 1 preceding) as prev_max
      from lati
    ) o
  ),
  coperture as (
    select side, sess, sum(b - a) as copertura_ms
    from (select side, sess, isola, min(s0) as a, max(s1) as b from isole group by 1,2,3) i
    group by side, sess
  ),
  candidati as (
    select l.side, l.sess,
           jsonb_agg(l.seg order by l.s0) as stages,
           min(l.s0) as start_ms, max(l.s1) as end_ms,
           count(*)::int as segmenti,
           sum(l.s1 - l.s0) as somma_ms,
           c.copertura_ms
    from lati l
    join coperture c on c.side = l.side and c.sess = l.sess
    group by l.side, l.sess, c.copertura_ms
  )
  select array_agg(
    jsonb_build_object('stages', stages, 'start_ms', start_ms, 'end_ms', end_ms,
                       'segmenti', segmenti, 'copertura_ms', copertura_ms,
                       'contraddittorio', somma_ms > copertura_ms)
    order by (somma_ms > copertura_ms), copertura_ms desc, segmenti desc, side, start_ms)
  into v_grouped
  from candidati;

  if v_grouped is null then
    return null;
  end if;

  foreach v_cand in array v_grouped loop
    v_overlaps := false;
    foreach v_kept in array v_selected loop
      if (v_cand->>'start_ms')::bigint < (v_kept->>'end_ms')::bigint
         and (v_kept->>'start_ms')::bigint < (v_cand->>'end_ms')::bigint then
        v_overlaps := true;
        exit;
      end if;
    end loop;
    if not v_overlaps then
      v_selected := array_append(v_selected, v_cand);
    end if;
  end loop;

  -- main_*: piu' segmenti, poi piu' lunga, fra i soli sopravvissuti. Regola
  -- invariata rispetto a prima, deliberatamente (vedi intestazione).
  select v into v_main from unnest(v_selected) as v
  order by (v->>'segmenti')::int desc,
           ((v->>'end_ms')::bigint - (v->>'start_ms')::bigint) desc,
           (v->>'start_ms')::bigint
  limit 1;

  select array_agg(v order by (v->>'start_ms')::bigint) into v_selected
  from unnest(v_selected) as v;

  v_idx := 0;
  foreach v_cand in array v_selected loop
    select coalesce(jsonb_agg(stage || jsonb_build_object('sessionIdx', v_idx)), '[]'::jsonb)
    into v_retagged
    from jsonb_array_elements(v_cand->'stages') as stage;
    v_final_stages := v_final_stages || v_retagged;
    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object(
    'stages', v_final_stages,
    'main_start_ms', (v_main->>'start_ms')::bigint,
    'main_end_ms', (v_main->>'end_ms')::bigint
  );
end;
$$;

revoke all on function internal._merge_sleep_stages_jsonb(jsonb, jsonb) from public;
grant execute on function internal._merge_sleep_stages_jsonb(jsonb, jsonb) to authenticated;

-- ── 3. La RPC: canonicalizza in INSERT, non cancella in UPDATE ─────────────
-- Stessa firma, stessi grant, stesso scoping RLS. Rispetto alla versione
-- precedente cambiano tre punti e nessun altro:
--   - il valore scritto da INSERT passa dal canonicalizzatore;
--   - i tre campi del sonno in DO UPDATE non accettano piu' un null del merge
--     come "cancella", ma ricadono sul valore gia' memorizzato (e, per gli
--     estremi, sulla stessa regola collected_at_ms usata da tutti gli altri
--     scalari, cosi' una fonte senza stadi puo' comunque aggiornare la sua
--     finestra senza inventare una regola nuova);
--   - niente altro.
create or replace function public.upsert_fitness_metrics_v189(p_row jsonb)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (p_row->>'user_id')::uuid;
  v_device_id uuid := (p_row->>'device_id')::uuid;
  v_local_day_key text := p_row->>'local_day_key';
  v_id bigint;
  v_new_sleep_sessions int;
  v_new_sleep_minutes int;
begin
  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'upsert_fitness_metrics_v189: user_id mismatch' using errcode = '42501';
  end if;
  if v_device_id is null or not exists (
    select 1 from public.devices d where d.id = v_device_id and d.user_id = v_user_id
  ) then
    raise exception 'upsert_fitness_metrics_v189: device_id does not belong to caller' using errcode = '42501';
  end if;
  if v_local_day_key is null or v_local_day_key = '' then
    raise exception 'upsert_fitness_metrics_v189: local_day_key required' using errcode = '22004';
  end if;

  v_new_sleep_sessions := internal._sleep_session_count_jsonb(p_row->'sleep_stages');
  v_new_sleep_minutes := coalesce((p_row->>'sleep_minutes')::int, 0);

  insert into public.fitness_metrics (
    user_id, device_id, schema_version, source, window_start_ms, window_end_ms,
    collected_at_ms, received_at, local_day_key,
    steps, heart_rate_bpm, resting_heart_rate_bpm, spo2_percent, calories_kcal,
    active_calories_kcal, sleep_minutes, sleep_start_ms, sleep_end_ms,
    distance_meters, hrv_rmssd, hrv_sdnn, stress_avg, vo2_max, floors_climbed,
    elevation_gained_meters, skin_temperature_c, weight_kg, height_cm, bmi,
    intraday_steps, intraday_hr, intraday_calories, sleep_stages,
    exercise_sessions, source_device, source_package,
    blood_pressure_systolic, blood_pressure_diastolic, blood_glucose_mgdl,
    water_ml, respiratory_rate_bpm, nutrition_kcal_in, sleep_apnea_detected,
    hr_source_name, hr_source_quality
  ) values (
    v_user_id, v_device_id, coalesce((p_row->>'schema_version')::int, 1),
    p_row->>'source', (p_row->>'window_start_ms')::bigint, (p_row->>'window_end_ms')::bigint,
    (p_row->>'collected_at_ms')::bigint, now(), v_local_day_key,
    (p_row->>'steps')::int, (p_row->>'heart_rate_bpm')::numeric, (p_row->>'resting_heart_rate_bpm')::int,
    (p_row->>'spo2_percent')::numeric, (p_row->>'calories_kcal')::numeric,
    (p_row->>'active_calories_kcal')::numeric, (p_row->>'sleep_minutes')::int,
    (p_row->>'sleep_start_ms')::bigint, (p_row->>'sleep_end_ms')::bigint,
    (p_row->>'distance_meters')::numeric, (p_row->>'hrv_rmssd')::int, (p_row->>'hrv_sdnn')::int,
    (p_row->>'stress_avg')::int, (p_row->>'vo2_max')::numeric, (p_row->>'floors_climbed')::int,
    (p_row->>'elevation_gained_meters')::numeric, (p_row->>'skin_temperature_c')::numeric,
    (p_row->>'weight_kg')::numeric, (p_row->>'height_cm')::numeric, (p_row->>'bmi')::numeric,
    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories',
    -- Canonicalizzato all'ingresso: una riga nuova non passa da nessun merge.
    -- Un array non-array diventa null invece di finire in colonna com'e'.
    case when jsonb_typeof(p_row->'sleep_stages') = 'array'
      then internal._canonicalize_sleep_stages_jsonb(p_row->'sleep_stages')
      else null end,
    p_row->'exercise_sessions', p_row->>'source_device', p_row->>'source_package',
    (p_row->>'blood_pressure_systolic')::numeric, (p_row->>'blood_pressure_diastolic')::numeric,
    (p_row->>'blood_glucose_mgdl')::numeric, (p_row->>'water_ml')::int,
    (p_row->>'respiratory_rate_bpm')::numeric, (p_row->>'nutrition_kcal_in')::numeric,
    (p_row->>'sleep_apnea_detected')::boolean, p_row->>'hr_source_name', p_row->>'hr_source_quality'
  )
  on conflict (user_id, device_id, (coalesce(source, '')), (coalesce(source_device, '')), local_day_key)
  where local_day_key is not null
  do update set
    received_at = now(),
    schema_version = coalesce(excluded.schema_version, fitness_metrics.schema_version),
    window_start_ms = least(fitness_metrics.window_start_ms, excluded.window_start_ms),
    window_end_ms = greatest(fitness_metrics.window_end_ms, excluded.window_end_ms),
    collected_at_ms = greatest(fitness_metrics.collected_at_ms, excluded.collected_at_ms),
    steps = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.steps, fitness_metrics.steps) else fitness_metrics.steps end,
    heart_rate_bpm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.heart_rate_bpm, fitness_metrics.heart_rate_bpm) else fitness_metrics.heart_rate_bpm end,
    resting_heart_rate_bpm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.resting_heart_rate_bpm, fitness_metrics.resting_heart_rate_bpm) else fitness_metrics.resting_heart_rate_bpm end,
    spo2_percent = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.spo2_percent, fitness_metrics.spo2_percent) else fitness_metrics.spo2_percent end,
    calories_kcal = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.calories_kcal, fitness_metrics.calories_kcal) else fitness_metrics.calories_kcal end,
    active_calories_kcal = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.active_calories_kcal, fitness_metrics.active_calories_kcal) else fitness_metrics.active_calories_kcal end,
    distance_meters = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.distance_meters, fitness_metrics.distance_meters) else fitness_metrics.distance_meters end,
    hrv_rmssd = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hrv_rmssd, fitness_metrics.hrv_rmssd) else fitness_metrics.hrv_rmssd end,
    hrv_sdnn = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hrv_sdnn, fitness_metrics.hrv_sdnn) else fitness_metrics.hrv_sdnn end,
    stress_avg = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.stress_avg, fitness_metrics.stress_avg) else fitness_metrics.stress_avg end,
    vo2_max = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.vo2_max, fitness_metrics.vo2_max) else fitness_metrics.vo2_max end,
    floors_climbed = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.floors_climbed, fitness_metrics.floors_climbed) else fitness_metrics.floors_climbed end,
    elevation_gained_meters = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.elevation_gained_meters, fitness_metrics.elevation_gained_meters) else fitness_metrics.elevation_gained_meters end,
    skin_temperature_c = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.skin_temperature_c, fitness_metrics.skin_temperature_c) else fitness_metrics.skin_temperature_c end,
    weight_kg = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.weight_kg, fitness_metrics.weight_kg) else fitness_metrics.weight_kg end,
    height_cm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.height_cm, fitness_metrics.height_cm) else fitness_metrics.height_cm end,
    bmi = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.bmi, fitness_metrics.bmi) else fitness_metrics.bmi end,
    blood_pressure_systolic = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.blood_pressure_systolic, fitness_metrics.blood_pressure_systolic) else fitness_metrics.blood_pressure_systolic end,
    blood_pressure_diastolic = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.blood_pressure_diastolic, fitness_metrics.blood_pressure_diastolic) else fitness_metrics.blood_pressure_diastolic end,
    blood_glucose_mgdl = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.blood_glucose_mgdl, fitness_metrics.blood_glucose_mgdl) else fitness_metrics.blood_glucose_mgdl end,
    water_ml = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.water_ml, fitness_metrics.water_ml) else fitness_metrics.water_ml end,
    respiratory_rate_bpm = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.respiratory_rate_bpm, fitness_metrics.respiratory_rate_bpm) else fitness_metrics.respiratory_rate_bpm end,
    nutrition_kcal_in = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.nutrition_kcal_in, fitness_metrics.nutrition_kcal_in) else fitness_metrics.nutrition_kcal_in end,
    hr_source_name = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hr_source_name, fitness_metrics.hr_source_name) else fitness_metrics.hr_source_name end,
    hr_source_quality = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.hr_source_quality, fitness_metrics.hr_source_quality) else fitness_metrics.hr_source_quality end,
    sleep_apnea_detected = case
      when excluded.sleep_apnea_detected is true or fitness_metrics.sleep_apnea_detected is true then true
      when excluded.sleep_apnea_detected is not null or fitness_metrics.sleep_apnea_detected is not null then false
      else null
    end,
    intraday_steps = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.intraday_steps, fitness_metrics.intraday_steps) else fitness_metrics.intraday_steps end,
    intraday_calories = case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
      then coalesce(excluded.intraday_calories, fitness_metrics.intraday_calories) else fitness_metrics.intraday_calories end,
    intraday_hr = internal._merge_intraday_hr_jsonb(
      fitness_metrics.intraday_hr, excluded.intraday_hr,
      excluded.collected_at_ms >= fitness_metrics.collected_at_ms
    ),
    exercise_sessions = internal._merge_exercise_sessions_jsonb(fitness_metrics.exercise_sessions, excluded.exercise_sessions),
    -- sleep_minutes: regola INVARIATA (vedi intestazione).
    sleep_minutes = case
      when v_new_sleep_sessions > internal._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
        or (v_new_sleep_sessions = internal._sleep_session_count_jsonb(fitness_metrics.sleep_stages)
            and v_new_sleep_minutes > coalesce(fitness_metrics.sleep_minutes, 0))
      then excluded.sleep_minutes else fitness_metrics.sleep_minutes end,
    -- I tre campi del sonno in UNA sola assegnazione, da un sub-SELECT: il
    -- merge viene cosi' calcolato una volta invece di tre. Misurato su una
    -- notte reale da 94 segmenti: 7,3 ms per upsert con tre chiamate, di cui
    -- 6,1 nelle chiamate stesse. Il merge era l'84% del costo.
    --
    -- Quando il merge sa ricalcolare gli estremi valgono i suoi; altrimenti
    -- si ricade sulla stessa regola collected_at_ms di ogni altro scalare.
    -- Prima, un merge senza stadi da nessuna parte scriveva null in colonna.
    (sleep_start_ms, sleep_end_ms, sleep_stages) = (
      select
        coalesce((q.m->>'main_start_ms')::bigint,
          case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
            then coalesce(excluded.sleep_start_ms, fitness_metrics.sleep_start_ms)
            else fitness_metrics.sleep_start_ms end),
        coalesce((q.m->>'main_end_ms')::bigint,
          case when excluded.collected_at_ms >= fitness_metrics.collected_at_ms
            then coalesce(excluded.sleep_end_ms, fitness_metrics.sleep_end_ms)
            else fitness_metrics.sleep_end_ms end),
        coalesce(q.m->'stages', fitness_metrics.sleep_stages)
      from (select internal._merge_sleep_stages_jsonb(
                     fitness_metrics.sleep_stages, excluded.sleep_stages) as m) q
    )
  where fitness_metrics.user_id = auth.uid()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_fitness_metrics_v189(jsonb) from public;
grant execute on function public.upsert_fitness_metrics_v189(jsonb) to authenticated;
