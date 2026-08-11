-- ============================================================================
-- AUDIT BOUNDED — le altre colonne JSONB dello stesso upsert
--
-- Il difetto del sonno non era nel sonno: era in un idioma SQL. La domanda
-- che conta e' se quell'idioma vive altrove. Non vive: le due funzioni
-- sorelle usano `safe_old.v || safe_new.v` seguito da `distinct on`, che
-- deduplica per costruzione. Ma leggerlo non basta, quindi qui si esercita.
--
-- Le quattro colonne prendono strade diverse, ed e' la cosa da sapere:
--   intraday_hr        -> internal._merge_intraday_hr_jsonb        (deduplica)
--   exercise_sessions  -> internal._merge_exercise_sessions_jsonb  (deduplica)
--   intraday_steps     -> coalesce(excluded, esistente)            (all'ingrosso)
--   intraday_calories  -> coalesce(excluded, esistente)            (all'ingrosso)
--
-- Le ultime due non vengono deduplicate da nessuno lato server: quello che
-- arriva viene scritto. La loro integrita' dipende interamente dal client.
--
-- Tutto dentro una transazione chiusa da ROLLBACK.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.mk_user(p_label text) returns uuid
language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', p_label || '-' || v::text || '@example.invalid', 'x',
          now(), now(), now());
  return v;
end $$;

create or replace function pg_temp.mk_device(p_user uuid) returns uuid
language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into public.devices (id, user_id, device_fingerprint, source_type)
  values (v, p_user, 'fp-' || v::text, 'health_connect');
  return v;
end $$;

do $$
declare
  v_ok int := 0; v_ko int := 0;
  v_u uuid; v_d uuid; v_id bigint; v_i int;
  v_prima jsonb; v_dopo jsonb; v_n int;
  v_t bigint := 1754000000000;
  HR jsonb; EX jsonb; ST jsonb; CA jsonb;
  v_payload jsonb;
begin
  HR := jsonb_build_array(
    jsonb_build_object('ts', v_t,          'bpm', 62),
    jsonb_build_object('ts', v_t + 300000, 'bpm', 64));
  EX := jsonb_build_array(jsonb_build_object(
    'startMs', v_t, 'endMs', v_t + 1800000, 'type', 'running',
    'name', 'Corsa', 'sourceApp', 'test', 'durationMin', 30));
  ST := jsonb_build_array(
    jsonb_build_object('hour', 7, 'steps', 1200),
    jsonb_build_object('hour', 8, 'steps', 900));
  CA := jsonb_build_array(jsonb_build_object('ts', v_t, 'kcal', 80));

  v_u := pg_temp.mk_user('altre');
  v_d := pg_temp.mk_device(v_u);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_u::text, 'role','authenticated')::text, true);

  v_payload := jsonb_build_object(
    'user_id', v_u, 'device_id', v_d, 'local_day_key', '2026-08-10',
    'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
    'collected_at_ms', v_t, 'window_start_ms', v_t, 'window_end_ms', v_t + 86400000,
    'steps', 2100, 'heart_rate_bpm', 63, 'hr_source_name', 'watch',
    'intraday_hr', HR, 'exercise_sessions', EX,
    'intraday_steps', ST, 'intraday_calories', CA);

  -- ── A. Dieci upsert identici non muovono nessuna delle quattro ─────────
  -- Il confronto parte dal SECONDO upsert, non dal primo, e la ragione e' un
  -- reperto: l'INSERT scrive intraday_hr alla lettera, mentre il merge lo
  -- riscrive a bucket di 5 minuti. Fra il primo e il secondo giro quella
  -- colonna cambia sempre, anche con un payload identico. Non e' una
  -- duplicazione, e' una normalizzazione che avviene tardi; il caso A2 la
  -- misura per conto suo invece di lasciarla nascosta dentro questo.
  v_id := public.upsert_fitness_metrics_v189(v_payload);
  declare v_dopo_insert jsonb;
  begin
    select intraday_hr into v_dopo_insert from public.fitness_metrics where id = v_id;
    perform public.upsert_fitness_metrics_v189(v_payload);
    select jsonb_build_object('hr', intraday_hr, 'ex', exercise_sessions,
                              'st', intraday_steps, 'ca', intraday_calories)
      into v_prima from public.fitness_metrics where id = v_id;
    for v_i in 1..9 loop
      perform public.upsert_fitness_metrics_v189(v_payload);
    end loop;
    select jsonb_build_object('hr', intraday_hr, 'ex', exercise_sessions,
                              'st', intraday_steps, 'ca', intraday_calories)
      into v_dopo from public.fitness_metrics where id = v_id;
    if v_dopo = v_prima then
      v_ok := v_ok + 1; raise notice '   A  dieci upsert identici: le quattro invariate      OK';
    else
      v_ko := v_ko + 1; raise notice '   A  dieci upsert identici                           KO';
      raise notice '        hr %  ex %  st %  ca %',
        (v_dopo->'hr' = v_prima->'hr'), (v_dopo->'ex' = v_prima->'ex'),
        (v_dopo->'st' = v_prima->'st'), (v_dopo->'ca' = v_prima->'ca');
    end if;

    -- ── A2. Il reperto: INSERT grezzo, merge a bucket ────────────────────
    -- Una riga che non riceve mai un secondo sync resta con la serie non
    -- bucketizzata. In produzione sono migliaia di righe con piu' campioni
    -- dentro lo stesso bucket da 5 minuti: non sono duplicati, sono righe che
    -- il merge non ha mai toccato. Il test lo dichiara perche' il read-side
    -- vede due forme diverse della stessa colonna.
    if v_dopo_insert = HR and (v_prima->'hr') <> HR then
      v_ok := v_ok + 1; raise notice '   A2 FC: INSERT grezzo, primo merge a bucket         OK   asimmetria dichiarata';
    else
      v_ko := v_ko + 1; raise notice '   A2 FC: asimmetria INSERT/merge cambiata            KO';
    end if;
  end;

  -- ── B. I due merge deduplicano davvero ─────────────────────────────────
  -- Per la FC il confronto non puo' essere merge(X,X) = X: il merge riscrive
  -- ogni campione sul proprio bucket, quindi il risultato non e' mai
  -- testualmente l'ingresso. La proprieta' vera e' che unire X con se stesso
  -- non aggiunge niente rispetto a X da solo, e che dal secondo giro non si
  -- muove piu'.
  if internal._merge_intraday_hr_jsonb(HR, HR, true)
       = internal._merge_intraday_hr_jsonb(null, HR, true)
     and internal._merge_intraday_hr_jsonb(
           internal._merge_intraday_hr_jsonb(null, HR, true), HR, true)
       = internal._merge_intraday_hr_jsonb(null, HR, true)
     and internal._merge_exercise_sessions_jsonb(EX, EX)
       = internal._merge_exercise_sessions_jsonb(null, EX) then
    v_ok := v_ok + 1; raise notice '   B  FC e allenamenti: unire X con se stesso non aggiunge OK';
  else
    v_ko := v_ko + 1; raise notice '   B  FC/allenamenti merge(X,X)                       KO   hr=% ex=%',
      jsonb_array_length(coalesce(internal._merge_intraday_hr_jsonb(HR,HR,true),'[]'::jsonb)),
      jsonb_array_length(coalesce(internal._merge_exercise_sessions_jsonb(EX,EX),'[]'::jsonb));
  end if;

  -- ── C. E deduplicano anche un array gia' sporco in ingresso ────────────
  if jsonb_array_length(internal._merge_intraday_hr_jsonb(null, HR || HR, true)) = 2
     and jsonb_array_length(internal._merge_exercise_sessions_jsonb(null, EX || EX)) = 1 then
    v_ok := v_ok + 1; raise notice '   C  un array gia'' duplicato viene ripulito          OK';
  else
    v_ko := v_ko + 1; raise notice '   C  array gia'' duplicato                            KO';
  end if;

  -- ── D. Bucket temporali unici in uscita da intraday_hr ─────────────────
  -- Il merge lavora a bucket di 5 minuti: due campioni dentro lo stesso
  -- bucket devono uscire come uno solo, altrimenti la serie ha due valori
  -- per lo stesso istante.
  -- Tre campioni scelti DENTRO lo stesso bucket: si parte dal bordo del
  -- bucket, non da un istante qualunque, altrimenti il terzo cadrebbe gia'
  -- nel bucket successivo e il test misurerebbe un'altra cosa.
  declare v_b bigint := (floor(v_t / 300000) * 300000)::bigint;
  begin
    v_dopo := internal._merge_intraday_hr_jsonb(
      null,
      jsonb_build_array(jsonb_build_object('ts', v_b, 'bpm', 60),
                        jsonb_build_object('ts', v_b + 60000, 'bpm', 70),
                        jsonb_build_object('ts', v_b + 299999, 'bpm', 80)), true);
    select count(*), count(distinct s.value->>'ts') into v_n, v_i
      from jsonb_array_elements(v_dopo) s(value);
  end;
  if v_n = 1 and v_i = 1 then
    v_ok := v_ok + 1; raise notice '   D  bucket temporali unici in uscita                OK';
  else
    v_ko := v_ko + 1; raise notice '   D  bucket temporali                                KO   % elementi, % distinti', v_n, v_i;
  end if;

  -- ── E. Gli allenamenti con fine <= inizio non passano ──────────────────
  -- Nota: il merge li tiene se sono l'unica cosa che ha (non ha un filtro di
  -- validita' come quello del sonno). Il test dichiara cio' che ACCADE, non
  -- cio' che vorremmo: se un giorno si aggiunge il filtro, questo test lo
  -- segnala invece di lasciarlo passare inosservato.
  v_dopo := internal._merge_exercise_sessions_jsonb(
    null, jsonb_build_array(jsonb_build_object(
      'startMs', v_t + 1000, 'endMs', v_t, 'type', 'walk', 'sourceApp','test')));
  if v_dopo is not null and jsonb_array_length(v_dopo) = 1 then
    v_ok := v_ok + 1; raise notice '   E  allenamento invertito: PASSA (limite noto)      OK   dichiarato, non corretto qui';
  else
    v_ko := v_ko + 1; raise notice '   E  allenamento invertito: il comportamento e'' cambiato KO';
  end if;

  -- ── F. Passi e calorie: nessuno li deduplica lato server ───────────────
  -- Vale la pena scriverlo come test, non come commento: se un domani si
  -- aggiungesse un merge, questo caso fallirebbe e costringerebbe a
  -- riconsiderare la riparazione dello storico per quelle due colonne.
  declare v_id2 bigint; v_u2 uuid; v_d2 uuid;
  begin
    v_u2 := pg_temp.mk_user('sporco');
    v_d2 := pg_temp.mk_device(v_u2);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u2::text, 'role','authenticated')::text, true);
    v_id2 := public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_u2, 'device_id', v_d2, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
      'collected_at_ms', v_t, 'window_start_ms', v_t, 'window_end_ms', v_t + 86400000,
      'intraday_steps', ST || ST, 'intraday_calories', CA || CA));
    select jsonb_array_length(intraday_steps), jsonb_array_length(intraday_calories)
      into v_n, v_i from public.fitness_metrics where id = v_id2;
    if v_n = 4 and v_i = 2 then
      v_ok := v_ok + 1; raise notice '   F  passi/calorie: scritti come arrivano            OK   dipendono dal client';
    else
      v_ko := v_ko + 1; raise notice '   F  passi/calorie                                   KO   st=% ca=%', v_n, v_i;
    end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── G. Invarianti scalari: l'upsert non li deforma ─────────────────────
  -- SpO2 e stress dentro 0-100, coppia pressoria completa e coerente, totali
  -- non negativi, finestra crescente, provenienza dichiarata conservata.
  declare
    v_u3 uuid; v_d3 uuid; v_id3 bigint; v_bad text := '';
    r record;
  begin
    v_u3 := pg_temp.mk_user('invarianti');
    v_d3 := pg_temp.mk_device(v_u3);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u3::text, 'role','authenticated')::text, true);
    v_id3 := public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_u3, 'device_id', v_d3, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
      'collected_at_ms', v_t, 'window_start_ms', v_t, 'window_end_ms', v_t + 86400000,
      'steps', 5000, 'spo2_percent', 97, 'stress_avg', 42,
      'blood_pressure_systolic', 120, 'blood_pressure_diastolic', 80,
      'heart_rate_bpm', 63, 'hr_source_name', 'watch', 'hr_source_quality', 'standard'));
    select * into r from public.fitness_metrics where id = v_id3;
    if r.spo2_percent < 0 or r.spo2_percent > 100 then v_bad := v_bad || ' [spo2]'; end if;
    if r.stress_avg < 0 or r.stress_avg > 100 then v_bad := v_bad || ' [stress]'; end if;
    if (r.blood_pressure_systolic is null) <> (r.blood_pressure_diastolic is null)
       then v_bad := v_bad || ' [coppia pressoria]'; end if;
    if r.blood_pressure_systolic <= r.blood_pressure_diastolic then v_bad := v_bad || ' [pressione]'; end if;
    if r.steps < 0 then v_bad := v_bad || ' [passi]'; end if;
    if r.window_end_ms <= r.window_start_ms then v_bad := v_bad || ' [finestra]'; end if;
    if r.heart_rate_bpm is not null and r.hr_source_name is null then v_bad := v_bad || ' [provenienza FC]'; end if;
    if v_bad = '' then
      v_ok := v_ok + 1; raise notice '   G  invarianti scalari conservati dall''upsert       OK';
    else
      v_ko := v_ko + 1; raise notice '   G  invarianti scalari                              KO  %', v_bad;
    end if;
  end;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'audit altre metriche: % casi falliti', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'sleep_merge_p0 / altre metriche: SETTE CASI'
\echo '=================================================='
