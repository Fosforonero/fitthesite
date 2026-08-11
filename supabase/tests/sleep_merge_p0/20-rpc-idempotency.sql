-- ============================================================================
-- L'INTERA RPC, non soltanto il helper
--
-- Il helper puo' essere corretto e la riga corrompersi lo stesso: il percorso
-- di INSERT di upsert_fitness_metrics_v189 scrive `p_row->'sleep_stages'`
-- alla lettera, senza passare da nessun merge. Un client che spedisce un
-- array gia' duplicato produce una riga gonfiata al primo colpo, e il helper
-- non lo vede mai.
--
-- Qui si esercita la RPC vera, con auth.uid() impostato, il device, il
-- vincolo di unicita' reale e il giro completo INSERT -> DO UPDATE.
--
-- LIMITE DICHIARATO: gira come `postgres`, non come `authenticated`. Nel
-- database locale il ruolo `authenticated` non ha SELECT/INSERT su
-- public.devices ne' su public.fitness_metrics (relacl = Dxt), quindi la RPC
-- fallirebbe sul suo stesso controllo di proprieta' del device prima di
-- arrivare al merge. I controlli della funzione (user_id = auth.uid(),
-- device del chiamante, `where user_id = auth.uid()` sulla DO UPDATE) restano
-- tutti attivi perche' dipendono da request.jwt.claims, non dal ruolo; quello
-- che NON viene esercitato qui e' la RLS. Per la RLS esistono suite separate:
-- questa misura l'algoritmo di merge, e il suo verde non va letto come una
-- prova di controllo accessi.
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
  insert into public.devices (id, user_id, device_fingerprint, source_type, device_name)
  values (v, p_user, 'fp-' || v::text, 'health_connect', 'test');
  return v;
end $$;

/** Il payload minimo che la RPC accetta, con il blocco sonno parametrico. */
create or replace function pg_temp.payload(
  p_user uuid, p_device uuid, p_stages jsonb,
  p_start bigint, p_end bigint, p_minutes int, p_collected bigint)
returns jsonb language sql immutable as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'user_id', p_user, 'device_id', p_device, 'local_day_key', '2026-08-10',
    'source', 'health_connect', 'source_device', 'watch',
    'schema_version', 4, 'collected_at_ms', p_collected,
    'window_start_ms', p_start, 'window_end_ms', p_end,
    'sleep_stages', p_stages, 'sleep_start_ms', p_start,
    'sleep_end_ms', p_end, 'sleep_minutes', p_minutes));
$$;

do $$
declare
  v_ok int := 0;
  v_ko int := 0;
  v_u uuid;
  v_d uuid;
  v_id bigint;
  v_stages jsonb;
  v_prima jsonb;
  v_i int;
  v_start bigint := 1754000000000;  -- 2026-08-01T00:53:20Z, un istante qualunque
  X  jsonb;
  XD jsonb;
begin
  X := jsonb_build_array(
    jsonb_build_object('startMs', v_start,          'endMs', v_start + 3600000, 'stage','light','sessionIdx',0),
    jsonb_build_object('startMs', v_start + 3600000,'endMs', v_start + 7200000, 'stage','deep', 'sessionIdx',0));
  -- Lo stesso array con ogni segmento ripetuto: cio' che un client 190 puo'
  -- ancora spedire, perche' toJson() serializza sleepStagesJson grezzo.
  XD := X || X;

  v_u := pg_temp.mk_user('sonno');
  v_d := pg_temp.mk_device(v_u);
  perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);

  -- ── R1. Dieci upsert dello stesso payload lasciano il JSON invariato ────
  v_id := public.upsert_fitness_metrics_v189(pg_temp.payload(v_u, v_d, X, v_start, v_start + 7200000, 120, v_start));
  select sleep_stages into v_prima from public.fitness_metrics where id = v_id;
  for v_i in 1..9 loop
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(v_u, v_d, X, v_start, v_start + 7200000, 120, v_start));
  end loop;
  select sleep_stages into v_stages from public.fitness_metrics where id = v_id;
  if v_stages = v_prima and jsonb_array_length(v_stages) = 2 then
    v_ok := v_ok + 1; raise notice '   R1  dieci upsert identici: JSON invariato       OK';
  else
    v_ko := v_ko + 1; raise notice '   R1  dieci upsert identici                       KO   % segmenti (primo giro: %)',
      jsonb_array_length(coalesce(v_stages,'[]'::jsonb)), jsonb_array_length(coalesce(v_prima,'[]'::jsonb));
  end if;

  -- ── R2. Il percorso di INSERT canonicalizza anche lui ───────────────────
  -- Riga nuova, payload gia' duplicato: nessun merge viene chiamato. Se
  -- l'INSERT scrive alla lettera, la corruzione entra dalla porta principale.
  declare
    v_u2 uuid := pg_temp.mk_user('sonno-insert');
    v_d2 uuid;
    v_id2 bigint;
  begin
    v_d2 := pg_temp.mk_device(v_u2);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u2::text, 'role','authenticated')::text, true);
    v_id2 := public.upsert_fitness_metrics_v189(pg_temp.payload(v_u2, v_d2, XD, v_start, v_start + 7200000, 120, v_start));
    select sleep_stages into v_stages from public.fitness_metrics where id = v_id2;
    if jsonb_array_length(coalesce(v_stages,'[]'::jsonb)) = 2 then
      v_ok := v_ok + 1; raise notice '   R2  INSERT di un array duplicato: canonicalizzato OK';
    else
      v_ko := v_ko + 1; raise notice '   R2  INSERT di un array duplicato                 KO   % segmenti invece di 2',
        jsonb_array_length(coalesce(v_stages,'[]'::jsonb));
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R3. Un pisolino in un sync successivo sopravvive accanto alla notte ─
  perform public.upsert_fitness_metrics_v189(pg_temp.payload(
    v_u, v_d,
    jsonb_build_array(jsonb_build_object(
      'startMs', v_start + 50000000, 'endMs', v_start + 51800000, 'stage','light','sessionIdx',0)),
    v_start + 50000000, v_start + 51800000, 30, v_start + 60000000));
  select sleep_stages into v_stages from public.fitness_metrics where id = v_id;
  if jsonb_array_length(coalesce(v_stages,'[]'::jsonb)) = 3
     and (select count(distinct (s.value->>'sessionIdx')::int)
          from jsonb_array_elements(v_stages) s(value)) = 2 then
    v_ok := v_ok + 1; raise notice '   R3  pisolino in un secondo sync: due sessioni   OK';
  else
    v_ko := v_ko + 1; raise notice '   R3  pisolino in un secondo sync                 KO   % segmenti',
      jsonb_array_length(coalesce(v_stages,'[]'::jsonb));
  end if;

  -- ── R4. Un payload senza sonno non cancella il sonno gia' registrato ────
  -- E' il sync delle 15:00 che porta solo i passi. Non deve azzerare la
  -- notte, ne' i suoi estremi.
  declare
    v_s_prima jsonb; v_ini bigint; v_fin bigint;
    v_s_dopo jsonb;  v_ini2 bigint; v_fin2 bigint;
  begin
    select sleep_stages, sleep_start_ms, sleep_end_ms into v_s_prima, v_ini, v_fin
      from public.fitness_metrics where id = v_id;
    perform public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_u, 'device_id', v_d, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
      'collected_at_ms', v_start + 70000000, 'steps', 8000,
      'window_start_ms', v_start, 'window_end_ms', v_start + 80000000));
    select sleep_stages, sleep_start_ms, sleep_end_ms into v_s_dopo, v_ini2, v_fin2
      from public.fitness_metrics where id = v_id;
    if v_s_dopo = v_s_prima and v_ini2 = v_ini and v_fin2 = v_fin then
      v_ok := v_ok + 1; raise notice '   R4  sync senza sonno: non cancella niente       OK';
    else
      v_ko := v_ko + 1; raise notice '   R4  sync senza sonno                            KO   stadi % -> %, inizio % -> %',
        jsonb_array_length(coalesce(v_s_prima,'[]'::jsonb)), jsonb_array_length(coalesce(v_s_dopo,'[]'::jsonb)), v_ini, v_ini2;
    end if;
  end;

  -- ── R5. La finestra senza stadi non viene cancellata da un secondo sync ─
  -- Una fonte che riporta solo il totale (anello prima degli stadi, bucket
  -- cumulativo Samsung) ha sleep_start_ms/sleep_end_ms ma nessuno stadio.
  -- Il merge di due nulli non deve azzerare quegli estremi.
  declare
    v_u3 uuid; v_d3 uuid; v_id3 bigint; v_ini bigint;
  begin
    v_u3 := pg_temp.mk_user('solo-totale');
    v_d3 := pg_temp.mk_device(v_u3);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u3::text, 'role','authenticated')::text, true);
    v_id3 := public.upsert_fitness_metrics_v189(pg_temp.payload(v_u3, v_d3, null, v_start, v_start + 7200000, 120, v_start));
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(v_u3, v_d3, null, v_start, v_start + 7200000, 120, v_start + 1000));
    select sleep_start_ms into v_ini from public.fitness_metrics where id = v_id3;
    if v_ini = v_start then
      v_ok := v_ok + 1; raise notice '   R5  fonte con solo il totale: finestra intatta  OK';
    else
      v_ko := v_ko + 1; raise notice '   R5  fonte con solo il totale                    KO   sleep_start_ms = %', coalesce(v_ini::text,'NULL');
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R6. Il contratto di sleep_minutes NON cambia ────────────────────────
  -- Resta il totale autorevole dichiarato dalla fonte piu' ricca, mai la
  -- somma grezza degli stadi. Qui la notte dura 120 minuti dichiarati su una
  -- finestra di 120: la somma degli stadi e' la stessa, ma il punto e' che il
  -- valore non venga ricalcolato.
  declare v_min int;
  begin
    select sleep_minutes into v_min from public.fitness_metrics where id = v_id;
    if v_min = 120 then
      v_ok := v_ok + 1; raise notice '   R6  sleep_minutes resta il totale dichiarato    OK';
    else
      v_ko := v_ko + 1; raise notice '   R6  sleep_minutes                               KO   %', v_min;
    end if;
  end;
  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'RPC upsert_fitness_metrics_v189: % casi falliti', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'sleep_merge_p0 / RPC completa: SEI CASI'
\echo '=================================================='
