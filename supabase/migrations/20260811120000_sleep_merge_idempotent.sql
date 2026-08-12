-- P0 integrita' dati, 11-12/08/2026 — il merge del sonno duplica gli stadi.
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
--    l'unica ragione per cui il CONTENUTO di merge(X,X) e' quello di X.
--
--    Attenzione a come e' scritta questa frase, perche' la versione breve
--    ("merge(X,X) = X") e' FALSA e lo e' su 3.749 righe di produzione. Il
--    merge, dopo aver scelto i candidati, ri-numera le sessioni superstiti in
--    ordine cronologico (`v_idx`, piu' sotto). Se il client non le aveva
--    numerate in ordine cronologico — e in produzione succede su 3.749 righe
--    multi-sessione su 5.709 — le etichette escono scambiate. I segmenti sono
--    gli stessi, nessuno si perde e nessuno si inventa, ma l'uguaglianza JSON
--    non vale e converge solo dal secondo giro.
--
--    Il retagging c'era gia' nella definizione viva e non viene toccato qui.
--    Ma la sua conseguenza va detta: `sessionIdx = 0` dopo un merge significa
--    "la sessione che inizia prima", non "la notte principale". Il client
--    scrive 0 per la notte e 1..n per i pisolini; dopo il primo ri-sync della
--    stessa giornata quel significato non e' piu' garantito. Pinnato da P13.
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
-- 6. internal._sleep_session_count_jsonb non fa piu' esplodere l'upsert. Il
--    cast `(s.value->>'sessionIdx')::int` era senza guardia e la RPC lo
--    chiamava sul payload GREZZO, prima di ogni canonicalizzazione: un
--    `sessionIdx` non numerico, frazionario o fuori range faceva fallire
--    l'intera transazione, quindi quel giorno perdeva anche passi, frequenza
--    e calorie. Non era un difetto del sonno, era un difetto del sync.
--
--    Chiuso quel percorso, NON la classe. Restano quattro cast nudi sul
--    payload, tutti preesistenti e tutti identici alla definizione viva:
--    `sleep_minutes::int`, `sleep_start_ms::bigint`, `sleep_end_ms::bigint`,
--    `sleep_apnea_detected::boolean`. Misurati sulla RPC vera: un
--    `sleep_minutes` frazionario (420.5, cioe' un client che calcola i minuti
--    in virgola mobile senza arrotondare) risponde 22P02 e aborta l'intero
--    upsert. Lo schema Zod del sito li intercetta, ma il repo stesso
--    documenta che la RPC e' invocabile direttamente. Sono registrati come P1
--    in supabase/repair/TICKET-P1-metriche-e-privacy.md, non induriti qui:
--    accettare 420.5 come 420 vuol dire introdurre una tolleranza, ed e' una
--    decisione, non una svista da correggere di straforo.
-- 7. Il merge viene calcolato UNA volta per upsert (assegnazione multi-colonna
--    da un solo sub-SELECT) invece di tre, e il payload in ingresso viene
--    canonicalizzato una volta sola invece di due.
--
-- ── Cosa NON cambia, deliberatamente ────────────────────────────────────────
-- La semantica di scelta fra osservazioni resta quella della 189-RC2: quando
-- due candidati si sovrappongono ne sopravvive UNO INTERO, quello con piu'
-- segmenti (a parita', il piu' lungo). Non c'e' fusione stadio-per-stadio fra
-- due osservazioni sovrapposte, e non deve essercene: produrrebbe un
-- ipnogramma ibrido mai realmente misurato da nessuno.
--
-- sleep_minutes resta il totale autorevole dichiarato dalla fonte, con la
-- stessa regola ricchezza-vince di prima: non viene ricalcolato dalla somma
-- degli stadi, ne' qui ne' altrove.
--
-- ── Il limite noto, dichiarato ──────────────────────────────────────────────
-- Questo hotfix corregge i DUPLICATI ESATTI. Non rende il merge "lossless" in
-- generale, e chiamarlo cosi' sarebbe falso: due osservazioni sovrapposte ma
-- non identiche restano un caso irrisolto, e la piu' verbosa vince anche
-- quando la verbosita' viene da etichette contraddittorie sullo stesso
-- intervallo. Contare i segmenti misura la verbosita', non l'informazione.
-- Una ranking per copertura temporale era stata scritta e poi RITIRATA: chiude
-- quel caso ma ne apre uno speculare (un unico segmento grossolano da otto ore
-- batte quattordici stadi reali che ne coprono sette e mezza) e rende ogni
-- notte Apple con envelope permanentemente perdente. Nessun criterio scalare
-- chiude tutti e due i lati: serve una decisione di prodotto, ed e' fuori
-- dalla 190.
--
-- Nessun dato viene riscritto da questa migration: corregge solo il
-- comportamento futuro. La riparazione dello storico e' preparata a parte in
-- supabase/repair/, resta in NO-GO e non viene eseguita da qui.

-- ── 1. Il canonicalizzatore, unico ─────────────────────────────────────────
-- Regole, in quest'ordine:
--   - solo oggetti con startMs/endMs numerici (fino a 15 cifre, cosi' un
--     valore assurdo non puo' far esplodere il cast a bigint) ed
--     endMs > startMs;
--   - `sessionIdx` ASSENTE (chiave mancante o null JSON) vale 0: e' la forma
--     legacy, scritta prima di 8ca36f56. Per il client 0 e' la notte
--     principale — ma vedi il punto 2 dell'intestazione: dopo un merge
--     l'indice e' posizionale, non semantico, quindi qui 0 vuol dire soltanto
--     "prima sessione". PRESENTE ma negativo, frazionario, non numerico o
--     fuori range rende il segmento INVALIDO e lo scarta. Prima diventava 0 in
--     silenzio, cioe' un dato illeggibile finiva nella sessione su cui si
--     calcolano i minuti mostrati;
--   - startMs/endMs/sessionIdx riscritti come interi normalizzati;
--   - dedup per (sessionIdx, startMs, endMs, stage normalizzato): due
--     etichette diverse sullo stesso minuto sono un dato contraddittorio e
--     restano entrambe, perche' non sta a noi sceglierne una;
--   - il resto dell'oggetto e' preservato integralmente, etichetta compresa.
--
-- Ogni cast e' dentro il proprio CASE con la guardia: la WHERE non basta,
-- perche' nulla garantisce che un filtro venga valutato prima della proiezione
-- dopo l'inlining delle CTE. Un cast guardato non puo' sollevare errori in
-- nessun piano.
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
      case
        when (s.value->>'sessionIdx') is null then 0
        when (s.value->>'sessionIdx') ~ '^[0-9]{1,9}$' then (s.value->>'sessionIdx')::int
        else null
      end as session_idx,
      case when (s.value->>'startMs') ~ '^-?[0-9]{1,15}(\.[0-9]+)?$'
           then floor((s.value->>'startMs')::numeric)::bigint end as start_ms,
      case when (s.value->>'endMs') ~ '^-?[0-9]{1,15}(\.[0-9]+)?$'
           then floor((s.value->>'endMs')::numeric)::bigint end as end_ms,
      lower(btrim(coalesce(s.value->>'stage', ''))) as stage_key
    from src, lateral jsonb_array_elements(src.v) with ordinality as s(value, ord)
    where jsonb_typeof(s.value) = 'object'
  ),
  deduped as (
    select distinct on (session_idx, start_ms, end_ms, stage_key)
      seg || jsonb_build_object(
        'startMs', start_ms, 'endMs', end_ms, 'sessionIdx', session_idx) as canon_seg,
      session_idx, start_ms, end_ms, stage_key
    from parsed
    where session_idx is not null
      and start_ms is not null
      and end_ms is not null
      and end_ms > start_ms
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
-- Esplicito anche su `anon`, non solo per effetto transitivo del revoke da
-- PUBLIC: e' la convenzione fissata da 20260722111746 per questa esatta classe
-- di helper, e una convenzione seguita da tutti tranne uno non e' piu' una
-- convenzione. L'effetto e' identico, la verificabilita' no.
revoke execute on function internal._canonicalize_sleep_stages_jsonb(jsonb) from anon;
grant execute on function internal._canonicalize_sleep_stages_jsonb(jsonb) to authenticated;

comment on function internal._canonicalize_sleep_stages_jsonb(jsonb) is
  'Forma canonica di un array di stadi del sonno: scarta i segmenti non validi (compreso un sessionIdx presente ma illeggibile, che non diventa piu'' 0 in silenzio), normalizza startMs/endMs/sessionIdx a interi, deduplica per (sessionIdx, startMs, endMs, stage normalizzato). Unico canonicalizzatore lato server: usato sia dal percorso di INSERT sia da ogni candidato del merge.';

-- ── 2. Il conteggio delle sessioni: shape-safe ─────────────────────────────
-- Stesso contratto di prima (quanti sessionIdx DISTINTI ci sono), ma un
-- segmento con sessionIdx illeggibile ora viene ignorato invece di far
-- fallire la funzione. La RPC la chiama sul payload grezzo prima di
-- qualunque canonicalizzazione: finche' il cast era nudo, un solo segmento
-- malformato spedito da un client abortiva l'INTERO upsert di quel giorno —
-- passi, frequenza e calorie compresi.
--
-- Stesse identiche regole del canonicalizzatore, cosi' i due non possono
-- divergere su cosa sia una sessione: assente -> 0, `^[0-9]{1,9}$` -> valore,
-- tutto il resto -> il segmento non conta come sessione.
create or replace function internal._sleep_session_count_jsonb(stages jsonb)
returns integer
language sql
immutable
set search_path = pg_catalog, public
as $$
  select count(distinct
    case
      when (s.value->>'sessionIdx') is null then 0
      when (s.value->>'sessionIdx') ~ '^[0-9]{1,9}$' then (s.value->>'sessionIdx')::int
      else null
    end)::int
  from jsonb_array_elements(
    case when jsonb_typeof(stages) = 'array' then stages else '[]'::jsonb end
  ) as s(value)
  where jsonb_typeof(s.value) = 'object';
$$;

revoke all on function internal._sleep_session_count_jsonb(jsonb) from public;
grant execute on function internal._sleep_session_count_jsonb(jsonb) to authenticated;

comment on function internal._sleep_session_count_jsonb(jsonb) is
  'Quante sessioni distinte (sessionIdx) contiene un array di stadi. Shape-safe: un sessionIdx assente vale 0 (forma legacy), uno presente ma illeggibile non conta e non solleva errori. Prima il cast era nudo e un segmento malformato faceva fallire l''intero upsert, non solo il sonno.';

-- ── 3. Il merge: raggruppa per lato, sceglie come la 189-RC2 ───────────────
-- Una sola differenza rispetto alla definizione live, ed e' la correzione del
-- difetto: `with ordinality` fa si' che `side` distingua vecchio da nuovo
-- anche quando i due array sono lo stesso identico valore.
--
-- Il criterio di scelta fra candidati sovrapposti resta quello della 189-RC2:
--
--     order by jsonb_array_length(stages) desc, (end_ms - start_ms) desc
--
-- cioe' piu' segmenti, poi piu' lunga. Qui `segmenti` e' lo stesso numero
-- (count(*) per lato e sessione dopo la canonicalizzazione). L'unica aggiunta
-- e' il pareggio: `side, start_ms` in coda, che a parita' preferisce il lato 1,
-- cioe' il valore gia' memorizzato.
--
-- Va detto con precisione, perche' la versione entusiasta di questa frase non
-- regge alla prova: togliendo lo spareggio la suite resta VERDE. L'ordine che
-- oggi produce il piano coincide gia' con quello del lato, quindi lo spareggio
-- non cambia il comportamento osservabile. Cambia lo statuto: da coincidenza
-- (l'ordine dei gruppi non e' specificato, e con un HashAggregate su piu' dati
-- puo' non coincidere) a garanzia scritta. Il risultato che conta e' pinnato da
-- P14, che verifica l'esito — a parita' vince il memorizzato — non il
-- meccanismo.
--
-- Un wrapper generico (un solo segmento "asleep" sull'intera notte) perde
-- quindi contro le fasi dettagliate della stessa sessione, che sono di piu'.
-- Se wrapper e fasi arrivano nello STESSO candidato restano entrambi, perche'
-- buttarne uno qui sarebbe scegliere al posto della fonte: e' il confine di
-- serializzazione del client a non contarli due volte (unione di intervalli,
-- mai somma).
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
  select array_agg(
    jsonb_build_object('stages', stages, 'start_ms', start_ms, 'end_ms', end_ms)
    order by segmenti desc, (end_ms - start_ms) desc, side, start_ms
  )
  into v_grouped
  from (
    select
      arr.side,
      jsonb_agg(s.value order by (s.value->>'startMs')::bigint) as stages,
      min((s.value->>'startMs')::bigint) as start_ms,
      max((s.value->>'endMs')::bigint) as end_ms,
      count(*)::int as segmenti
    from unnest(array[
           internal._canonicalize_sleep_stages_jsonb(old_stages),
           internal._canonicalize_sleep_stages_jsonb(new_stages)
         ]) with ordinality as arr(val, side)
    cross join lateral jsonb_array_elements(arr.val) as s(value)
    -- Nessun filtro di validita' qui: il canonicalizzatore ha gia' garantito
    -- che ogni elemento e' un oggetto con startMs/endMs interi, sessionIdx
    -- leggibile ed endMs > startMs. Ripetere il controllo qui vorrebbe dire
    -- avere due definizioni di "valido" che possono divergere.
    group by arr.side, (s.value->>'sessionIdx')::int
  ) sessions;

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

  -- Il piu' ricco fra i sopravvissuti, prima del riordino cronologico:
  -- v_selected conserva l'ordine del ranking, quindi [1] e' il vincitore.
  v_main := v_selected[1];

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

-- ── 4. La RPC: canonicalizza in INSERT, non cancella in UPDATE ─────────────
-- Stessa firma, stessi grant, stesso scoping RLS. Rispetto alla versione
-- precedente cambiano tre punti e nessun altro:
--   - il payload in ingresso viene canonicalizzato UNA volta, in una
--     variabile, e da li' vanno sia il valore scritto da INSERT sia il
--     conteggio delle sessioni. Prima il conteggio girava sul grezzo e la
--     canonicalizzazione veniva rifatta nella VALUES: due letture diverse
--     dello stesso payload, e la prima poteva abortire l'upsert;
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
  v_new_sleep_stages jsonb;
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

  -- Canonicalizzato all'ingresso, una volta sola: una riga nuova non passa da
  -- nessun merge, quindi un client che spedisce un array gia' duplicato la
  -- scriveva gonfiata al primo colpo. Un non-array diventa null invece di
  -- finire in colonna com'e'.
  v_new_sleep_stages := case when jsonb_typeof(p_row->'sleep_stages') = 'array'
    then internal._canonicalize_sleep_stages_jsonb(p_row->'sleep_stages')
    else null end;
  v_new_sleep_sessions := internal._sleep_session_count_jsonb(v_new_sleep_stages);
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
    v_new_sleep_stages,
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
    -- 6,1 nelle chiamate stesse. Il merge era l'84% del costo della UPDATE,
    -- ma il guadagno end-to-end misurato e' del 5%: il resto dell'upsert
    -- domina, e la cifra isolata era gonfiata dall'overhead di chiamata.
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
