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

  -- ── R5. Le finestre senza stadi non vengono cancellate ──────────────────
  -- Una fonte che riporta solo il totale (anello prima degli stadi, bucket
  -- cumulativo Samsung) ha sleep_start_ms/sleep_end_ms ma nessuno stadio. Il
  -- merge di due nulli non deve azzerare quegli estremi. Quattro scenari,
  -- perche' il primo controllava solo l'inizio e solo il caso "stesso
  -- payload": ne bastava uno diverso per non accorgersi di niente.
  declare
    v_u3 uuid; v_d3 uuid; v_id3 bigint;
    v_ini bigint; v_fin bigint; v_fail text := '';
  begin
    v_u3 := pg_temp.mk_user('solo-totale');
    v_d3 := pg_temp.mk_device(v_u3);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u3::text, 'role','authenticated')::text, true);

    -- (a) stesso payload due volte: inizio E fine intatti.
    v_id3 := public.upsert_fitness_metrics_v189(pg_temp.payload(v_u3, v_d3, null, v_start, v_start + 7200000, 120, v_start));
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(v_u3, v_d3, null, v_start, v_start + 7200000, 120, v_start + 1000));
    select sleep_start_ms, sleep_end_ms into v_ini, v_fin from public.fitness_metrics where id = v_id3;
    if v_ini is distinct from v_start then v_fail := v_fail || ' [a:inizio]'; end if;
    if v_fin is distinct from v_start + 7200000 then v_fail := v_fail || ' [a:fine]'; end if;

    -- (b) payload PIU' NUOVO con una finestra diversa: deve poter aggiornare
    -- entrambi gli estremi, non restare congelato sul primo valore.
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u3, v_d3, null, v_start + 100000, v_start + 8000000, 125, v_start + 90000000));
    select sleep_start_ms, sleep_end_ms into v_ini, v_fin from public.fitness_metrics where id = v_id3;
    if v_ini is distinct from v_start + 100000 then v_fail := v_fail || ' [b:inizio non aggiornato]'; end if;
    if v_fin is distinct from v_start + 8000000 then v_fail := v_fail || ' [b:fine non aggiornata]'; end if;

    -- (c) payload PIU' VECCHIO: non deve tirare indietro gli estremi.
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u3, v_d3, null, v_start - 500000, v_start + 1000, 60, v_start - 90000000));
    select sleep_start_ms, sleep_end_ms into v_ini, v_fin from public.fitness_metrics where id = v_id3;
    if v_ini is distinct from v_start + 100000 then v_fail := v_fail || ' [c:inizio arretrato]'; end if;
    if v_fin is distinct from v_start + 8000000 then v_fail := v_fail || ' [c:fine arretrata]'; end if;

    -- (d) payload senza NESSUNA finestra e senza stadi: non cancella niente.
    perform public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_u3, 'device_id', v_d3, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
      'collected_at_ms', v_start + 95000000, 'steps', 3000,
      'window_start_ms', v_start, 'window_end_ms', v_start + 99000000));
    select sleep_start_ms, sleep_end_ms into v_ini, v_fin from public.fitness_metrics where id = v_id3;
    if v_ini is distinct from v_start + 100000 then v_fail := v_fail || ' [d:inizio cancellato]'; end if;
    if v_fin is distinct from v_start + 8000000 then v_fail := v_fail || ' [d:fine cancellata]'; end if;

    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   R5  fonte con solo il totale: 4 scenari, estremi intatti OK';
    else
      v_ko := v_ko + 1; raise notice '   R5  fonte con solo il totale                    KO  %', v_fail;
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R7. LIMITE NOTO sul percorso RPC reale ──────────────────────────────
  -- Il caso P4b non sul solo helper: la notte pulita e' gia' in tabella, il
  -- payload contraddittorio arriva dopo e passa dalla DO UPDATE. Nessuno dei
  -- quattro e' duplicato di un altro, quindi la deduplica non li tocca, e il
  -- ranking per conteggio (semantica 189-RC2, confermata per la 190) li fa
  -- vincere: quattro elementi contro tre.
  --
  -- Questo caso pinna il LIMITE accettato, non una proprieta' desiderabile.
  -- Sta qui, sul percorso vero, perche' il giorno in cui gli overlap verranno
  -- risolti si deve vedere subito che la riga in tabella cambia — non solo il
  -- valore di ritorno di un helper.
  declare
    v_u4 uuid; v_d4 uuid; v_id4 bigint; v_st jsonb;
    v_pulita jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start,           'endMs', v_start + 3600000, 'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 3600000, 'endMs', v_start + 7200000, 'stage','deep', 'sessionIdx',0),
      jsonb_build_object('startMs', v_start + 7200000, 'endMs', v_start + 10800000,'stage','rem',  'sessionIdx',0));
    v_contraddittoria jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start, 'endMs', v_start + 3600000, 'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start, 'endMs', v_start + 3600000, 'stage','deep', 'sessionIdx',0),
      jsonb_build_object('startMs', v_start, 'endMs', v_start + 3600000, 'stage','rem',  'sessionIdx',0),
      jsonb_build_object('startMs', v_start, 'endMs', v_start + 3600000, 'stage','awake','sessionIdx',0));
  begin
    v_u4 := pg_temp.mk_user('contraddittoria');
    v_d4 := pg_temp.mk_device(v_u4);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u4::text, 'role','authenticated')::text, true);
    v_id4 := public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u4, v_d4, v_pulita, v_start, v_start + 10800000, 180, v_start));
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u4, v_d4, v_contraddittoria, v_start, v_start + 3600000, 60, v_start + 1000));
    select sleep_stages into v_st from public.fitness_metrics where id = v_id4;
    if jsonb_array_length(coalesce(v_st,'[]'::jsonb)) = 4
       and (v_st->-1->>'endMs')::bigint = v_start + 3600000 then
      v_ok := v_ok + 1; raise notice '   R7  LIMITE: overlap non identici irrisolti      OK (atteso)';
    else
      v_ko := v_ko + 1; raise notice '   R7  LIMITE: comportamento cambiato              KO   % segmenti, fine %',
        jsonb_array_length(coalesce(v_st,'[]'::jsonb)), coalesce((v_st->-1->>'endMs'),'?');
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R8. Un sessionIdx illeggibile non deve far cadere l'INTERO sync ─────
  -- Il difetto piu' grave trovato dalla review, e non era del sonno: la RPC
  -- chiamava internal._sleep_session_count_jsonb sul payload GREZZO, prima di
  -- ogni canonicalizzazione, e quel cast era nudo. Un solo segmento con
  -- sessionIdx "abc" / 1.7 / [1] / fuori range faceva fallire la transazione:
  -- quel giorno l'utente perdeva anche passi, frequenza e calorie.
  --
  -- RED misurato l'11/08 sulla definizione live (MD5
  -- bc8cac33caeaf777bd95738fd93c9cdd, identica a produzione): 5 forme su 5
  -- sollevano 22P02 o 22003.
  --
  -- ONESTA' SU COSA COPRE QUESTO CASO: dopo il fix la RPC non chiama piu' il
  -- conteggio sul payload grezzo, quindi rimettere il cast nudo dentro
  -- internal._sleep_session_count_jsonb NON fa diventare rosso questo test —
  -- fa diventare rossa P12, che e' il posto giusto. Qui si verifica una cosa
  -- diversa e complementare: che l'upsert COMPLETO sopravviva a un payload
  -- con sessionIdx illeggibile e che le altre metriche del giorno arrivino
  -- comunque in tabella.
  declare
    v_u5 uuid; v_d5 uuid; v_id5 bigint;
    v_passi int; v_fc numeric; v_kcal numeric; v_st jsonb;
    v_fail text := '';
    v_rotto jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start, 'endMs', v_start + 3600000, 'stage','light','sessionIdx','abc'),
      jsonb_build_object('startMs', v_start + 3600000, 'endMs', v_start + 7200000, 'stage','deep','sessionIdx',0));
  begin
    v_u5 := pg_temp.mk_user('sessionidx-rotto');
    v_d5 := pg_temp.mk_device(v_u5);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u5::text, 'role','authenticated')::text, true);

    -- (a) percorso INSERT: la riga nasce, con tutto il resto delle metriche.
    begin
      v_id5 := public.upsert_fitness_metrics_v189(jsonb_build_object(
        'user_id', v_u5, 'device_id', v_d5, 'local_day_key', '2026-08-10',
        'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
        'collected_at_ms', v_start, 'window_start_ms', v_start, 'window_end_ms', v_start + 7200000,
        'steps', 7777, 'heart_rate_bpm', 62, 'calories_kcal', 1900,
        'sleep_stages', v_rotto, 'sleep_minutes', 120,
        'sleep_start_ms', v_start, 'sleep_end_ms', v_start + 7200000));
    exception when others then
      v_fail := v_fail || ' [a:INSERT abortito ' || sqlstate || ']';
    end;
    if v_fail = '' then
      select steps, heart_rate_bpm, calories_kcal, sleep_stages
        into v_passi, v_fc, v_kcal, v_st
        from public.fitness_metrics where id = v_id5;
      if v_passi is distinct from 7777 then v_fail := v_fail || ' [a:passi persi]'; end if;
      if v_fc is distinct from 62 then v_fail := v_fail || ' [a:FC persa]'; end if;
      if v_kcal is distinct from 1900 then v_fail := v_fail || ' [a:calorie perse]'; end if;
      -- Il segmento illeggibile e' scartato, quello buono resta.
      if jsonb_array_length(coalesce(v_st,'[]'::jsonb)) <> 1 then
        v_fail := v_fail || ' [a:stadi ' || jsonb_array_length(coalesce(v_st,'[]'::jsonb)) || ' invece di 1]';
      end if;
    end if;

    -- (b) percorso DO UPDATE: stesso payload rotto su una riga che esiste gia'.
    begin
      perform public.upsert_fitness_metrics_v189(jsonb_build_object(
        'user_id', v_u5, 'device_id', v_d5, 'local_day_key', '2026-08-10',
        'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
        'collected_at_ms', v_start + 1000, 'window_start_ms', v_start, 'window_end_ms', v_start + 7200000,
        'steps', 8888, 'sleep_stages', v_rotto, 'sleep_minutes', 120,
        'sleep_start_ms', v_start, 'sleep_end_ms', v_start + 7200000));
    exception when others then
      v_fail := v_fail || ' [b:UPDATE abortito ' || sqlstate || ']';
    end;
    select steps into v_passi from public.fitness_metrics where id = v_id5;
    if v_passi is distinct from 8888 then v_fail := v_fail || ' [b:passi non aggiornati]'; end if;

    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   R8  sessionIdx illeggibile: il sync non cade    OK';
    else
      v_ko := v_ko + 1; raise notice '   R8  sessionIdx illeggibile ABORTISCE il sync    KO  %', v_fail;
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R9. Il conteggio delle sessioni gira sul payload CANONICALIZZATO ───
  -- Cambiamento reale della RPC che nessun test osservava: prima
  -- `v_new_sleep_sessions` contava sul payload grezzo. Qui il payload nuovo
  -- DICHIARA due sessioni, ma quella in piu' e' fatta di un solo segmento
  -- degenere (fine <= inizio) che la canonicalizzazione butta. Contando sul
  -- grezzo sembrerebbe piu' ricco della riga memorizzata e ne sostituirebbe il
  -- totale con uno piu' basso; contando sul canonicalizzato non lo e', e il
  -- totale resta quello buono.
  declare
    v_u6 uuid; v_d6 uuid; v_id6 bigint; v_min int;
  begin
    v_u6 := pg_temp.mk_user('conteggio-canonico');
    v_d6 := pg_temp.mk_device(v_u6);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u6::text, 'role','authenticated')::text, true);
    v_id6 := public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u6, v_d6,
      jsonb_build_array(jsonb_build_object(
        'startMs', v_start, 'endMs', v_start + 7200000, 'stage','light','sessionIdx',0)),
      v_start, v_start + 7200000, 120, v_start));
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u6, v_d6,
      jsonb_build_array(
        jsonb_build_object('startMs', v_start, 'endMs', v_start + 3600000, 'stage','light','sessionIdx',0),
        -- Sessione 1 dichiarata ma vuota: fine <= inizio.
        jsonb_build_object('startMs', v_start + 9000000, 'endMs', v_start + 9000000, 'stage','light','sessionIdx',1)),
      v_start, v_start + 3600000, 60, v_start + 1000));
    select sleep_minutes into v_min from public.fitness_metrics where id = v_id6;
    if v_min = 120 then
      v_ok := v_ok + 1; raise notice '   R9  sessioni contate sul canonicalizzato       OK';
    else
      v_ko := v_ko + 1; raise notice '   R9  sessioni contate sul grezzo                KO   sleep_minutes %', v_min;
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R10. Un merge che non produce stadi non azzera la colonna ──────────
  -- Il fallback `coalesce(q.m->'stages', fitness_metrics.sleep_stages)` e'
  -- raggiungibile solo quando il memorizzato e' gia' vuoto o interamente
  -- invalido: con stadi validi in tabella il merge non restituisce mai null,
  -- quindi R4 passava anche senza questo fallback. Qui la riga nasce con soli
  -- segmenti degeneri (canonicalizzati a '[]'), e il sync successivo non porta
  -- sonno: senza il coalesce la colonna diventerebbe null.
  declare
    v_u7 uuid; v_d7 uuid; v_id7 bigint; v_st jsonb;
  begin
    v_u7 := pg_temp.mk_user('merge-vuoto');
    v_d7 := pg_temp.mk_device(v_u7);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u7::text, 'role','authenticated')::text, true);
    v_id7 := public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u7, v_d7,
      jsonb_build_array(jsonb_build_object(
        'startMs', v_start, 'endMs', v_start, 'stage','light','sessionIdx',0)),
      v_start, v_start + 7200000, 120, v_start));
    perform public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_u7, 'device_id', v_d7, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
      'collected_at_ms', v_start + 1000, 'steps', 500,
      'window_start_ms', v_start, 'window_end_ms', v_start + 7200000));
    select sleep_stages into v_st from public.fitness_metrics where id = v_id7;
    if v_st = '[]'::jsonb then
      v_ok := v_ok + 1; raise notice '   R10 merge senza stadi: la colonna non si azzera OK';
    else
      v_ko := v_ko + 1; raise notice '   R10 merge senza stadi azzera la colonna        KO   %', coalesce(v_st::text,'null');
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R11. sessionIdx 0 e' la NOTTE, anche se il pisolino la precede ─────
  -- Il caso misurato, sul percorso RPC vero: una notte da 360 minuti e un
  -- pisolino da 60 che cronologicamente la precede. Con il ri-tag posizionale
  -- la riga finiva in tabella con il pisolino a 0 e la notte a 1, e il
  -- read-side (che calcola i minuti della notte sulla sessione 0) leggeva una
  -- notte da 60 minuti e un pisolino da 360.
  --
  -- Si verificano insieme le tre cose che devono restare la stessa sessione:
  -- gli stadi con indice 0, sleep_start_ms/sleep_end_ms, e sleep_minutes.
  declare
    v_u8 uuid; v_d8 uuid; v_id8 bigint;
    v_st jsonb; v_ini bigint; v_fin bigint; v_min int;
    v_fail text := '';
    -- Pisolino 0..60min. Notte 120min..480min, sei segmenti: piu' ricca,
    -- quindi principale per la stessa regola della 189-RC2.
    v_pisolino jsonb := jsonb_build_array(jsonb_build_object(
      'startMs', v_start, 'endMs', v_start + 3600000, 'stage','light','sessionIdx',0));
    v_notte jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start + 7200000,  'endMs', v_start + 10800000, 'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 10800000, 'endMs', v_start + 14400000, 'stage','deep', 'sessionIdx',0),
      jsonb_build_object('startMs', v_start + 14400000, 'endMs', v_start + 18000000, 'stage','rem',  'sessionIdx',0),
      jsonb_build_object('startMs', v_start + 18000000, 'endMs', v_start + 21600000, 'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 21600000, 'endMs', v_start + 25200000, 'stage','deep', 'sessionIdx',0),
      jsonb_build_object('startMs', v_start + 25200000, 'endMs', v_start + 28800000, 'stage','rem',  'sessionIdx',0));
  begin
    v_u8 := pg_temp.mk_user('notte-e-pisolino');
    v_d8 := pg_temp.mk_device(v_u8);
    perform set_config('request.jwt.claims', json_build_object('sub', v_u8::text, 'role','authenticated')::text, true);

    -- (a) prima la notte, poi il pisolino.
    v_id8 := public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u8, v_d8, v_notte, v_start + 7200000, v_start + 28800000, 360, v_start));
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u8, v_d8, v_pisolino, v_start, v_start + 3600000, 60, v_start + 1000));
    select sleep_stages, sleep_start_ms, sleep_end_ms, sleep_minutes
      into v_st, v_ini, v_fin, v_min from public.fitness_metrics where id = v_id8;
    if jsonb_array_length(coalesce(v_st,'[]'::jsonb)) <> 7 then
      v_fail := v_fail || ' [a:segmenti ' || jsonb_array_length(coalesce(v_st,'[]'::jsonb)) || ']';
    end if;
    if (select count(*) from jsonb_array_elements(v_st) s(value)
        where (s.value->>'sessionIdx')::int = 0) <> 6 then
      v_fail := v_fail || ' [a:la sessione 0 non e'' la notte]';
    end if;
    if v_ini is distinct from v_start + 7200000 or v_fin is distinct from v_start + 28800000 then
      v_fail := v_fail || ' [a:estremi non della notte]';
    end if;
    if v_min is distinct from 360 then v_fail := v_fail || ' [a:minuti ' || coalesce(v_min::text,'null') || ']'; end if;
    -- Un resync dello stesso payload non deve spostare niente.
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u8, v_d8, v_pisolino, v_start, v_start + 3600000, 60, v_start + 2000));
    if (select sleep_stages from public.fitness_metrics where id = v_id8) is distinct from v_st then
      v_fail := v_fail || ' [a:il resync sposta gli stadi]';
    end if;

    -- (b) ordine invertito: prima il pisolino, poi la notte. Stesso esito.
    declare
      v_u9 uuid := pg_temp.mk_user('pisolino-e-notte');
      v_d9 uuid;
      v_id9 bigint;
      v_st2 jsonb; v_ini2 bigint; v_fin2 bigint; v_min2 int;
    begin
      v_d9 := pg_temp.mk_device(v_u9);
      perform set_config('request.jwt.claims', json_build_object('sub', v_u9::text, 'role','authenticated')::text, true);
      v_id9 := public.upsert_fitness_metrics_v189(pg_temp.payload(
        v_u9, v_d9, v_pisolino, v_start, v_start + 3600000, 60, v_start));
      perform public.upsert_fitness_metrics_v189(pg_temp.payload(
        v_u9, v_d9, v_notte, v_start + 7200000, v_start + 28800000, 360, v_start + 1000));
      select sleep_stages, sleep_start_ms, sleep_end_ms, sleep_minutes
        into v_st2, v_ini2, v_fin2, v_min2 from public.fitness_metrics where id = v_id9;
      if v_st2 is distinct from v_st then v_fail := v_fail || ' [b:esito diverso dall''ordine (a)]'; end if;
      if v_ini2 is distinct from v_start + 7200000 or v_fin2 is distinct from v_start + 28800000 then
        v_fail := v_fail || ' [b:estremi non della notte]';
      end if;
      if v_min2 is distinct from 360 then v_fail := v_fail || ' [b:minuti ' || coalesce(v_min2::text,'null') || ']'; end if;
    end;

    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   R11 RPC: la sessione 0 e'' la notte, non la prima OK';
    else
      v_ko := v_ko + 1; raise notice '   R11 RPC: sessione 0 sbagliata                  KO  %', v_fail;
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
  -- ── R12. UN SOLO upsert basta: l'INSERT ri-tagga ────────────────────────
  -- Il difetto che R11 non copriva, perche' R11 fa sempre due upsert. Qui il
  -- payload arriva UNA volta sola, con il pisolino etichettato 0 e la notte
  -- etichettata 1, e con `sleep_start_ms`/`sleep_end_ms` che descrivono la
  -- notte. E' la forma di 3.749 righe su 5.709 in produzione.
  --
  -- RED misurato il 12/08/2026 sulla definizione precedente: dopo il primo
  -- INSERT la riga aveva UN segmento con indice 0 (il pisolino) invece di sei,
  -- e serviva un secondo upsert perche' il merge la rimettesse a posto. Un
  -- utente che apriva l'app fra i due sync vedeva una notte da un'ora.
  --
  -- Si verifica anche la conseguenza: dopo il secondo upsert dello stesso
  -- payload la riga non cambia piu'. Prima cambiava, ed e' la firma esatta del
  -- difetto: l'idempotenza serviva a riparare il primo giro.
  declare
    v_u12 uuid; v_d12 uuid; v_id12 bigint;
    v_st jsonb; v_st2 jsonb; v_ini bigint; v_fin bigint;
    v_fail text := '';
    v_notte_ini bigint := v_start + 10800000;
    v_notte_fin bigint := v_start + 32400000;
    -- Pisolino di un'ora, etichettato 0. Notte di sei ore, etichettata 1.
    v_payload jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start,             'endMs', v_start + 3600000,  'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 10800000,  'endMs', v_start + 14400000, 'stage','light','sessionIdx',1),
      jsonb_build_object('startMs', v_start + 14400000,  'endMs', v_start + 18000000, 'stage','deep', 'sessionIdx',1),
      jsonb_build_object('startMs', v_start + 18000000,  'endMs', v_start + 21600000, 'stage','rem',  'sessionIdx',1),
      jsonb_build_object('startMs', v_start + 21600000,  'endMs', v_start + 25200000, 'stage','light','sessionIdx',1),
      jsonb_build_object('startMs', v_start + 25200000,  'endMs', v_start + 28800000, 'stage','deep', 'sessionIdx',1),
      jsonb_build_object('startMs', v_start + 28800000,  'endMs', v_start + 32400000, 'stage','rem',  'sessionIdx',1));
  begin
    v_u12 := pg_temp.mk_user('insert-ritag');
    v_d12 := pg_temp.mk_device(v_u12);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u12::text, 'role','authenticated')::text, true);

    v_id12 := public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u12, v_d12, v_payload, v_notte_ini, v_notte_fin, 360, v_start));
    select sleep_stages, sleep_start_ms, sleep_end_ms
      into v_st, v_ini, v_fin from public.fitness_metrics where id = v_id12;

    if (select count(*) from jsonb_array_elements(v_st) s(value)
        where (s.value->>'sessionIdx')::int = 0) <> 6 then
      v_fail := v_fail || ' [dopo UN upsert la sessione 0 non e'' la notte]';
    end if;
    if v_ini is distinct from v_notte_ini or v_fin is distinct from v_notte_fin then
      v_fail := v_fail || ' [estremi non della notte]';
    end if;
    if jsonb_array_length(coalesce(v_st,'[]'::jsonb)) <> 7 then
      v_fail := v_fail || ' [segmenti persi: ' || jsonb_array_length(coalesce(v_st,'[]'::jsonb)) || ']';
    end if;

    -- Secondo upsert identico: la riga resta esattamente la stessa.
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u12, v_d12, v_payload, v_notte_ini, v_notte_fin, 360, v_start));
    select sleep_stages into v_st2 from public.fitness_metrics where id = v_id12;
    if v_st2 is distinct from v_st then
      v_fail := v_fail || ' [il secondo sync cambia ancora la riga]';
    end if;

    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   R12 un solo INSERT ri-tagga la notte a 0        OK';
    else
      v_ko := v_ko + 1; raise notice '   R12 il primo INSERT persiste l''etichetta sbagliata KO  %', v_fail;
    end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R13. Il wrapper da 480 minuti batte il pisolino dettagliato ─────────
  -- Sul percorso RPC vero, e in DUE sync — che e' l'unico modo per esercitare
  -- davvero la scelta fra sessioni disgiunte. Con un upsert solo il payload
  -- porta gia' le etichette giuste e il test non discriminerebbe niente: e'
  -- stato verificato il 12/08/2026, la versione a un upsert passava anche
  -- sulla definizione difettosa.
  --
  -- La forma e' quella reale: ogni sync vede UNA sessione e la dichiara
  -- principale (`sessionIdx` 0 con la propria finestra), perche' dal suo punto
  -- di vista e' l'unica che c'e'. E' il server a doverle mettere in fila.
  --   - sync 1: la notte, un unico segmento `asleep` da otto ore;
  --   - sync 2: un pisolino da venti minuti in tre fasi.
  --
  -- RED misurato il 12/08/2026 sulla definizione precedente: vinceva il
  -- pisolino, perche' a parita' di dichiarazione decideva il numero di
  -- segmenti — tre contro uno. Contare i segmenti misura la verbosita' della
  -- fonte, non quanto si e' dormito.
  --
  -- Il caso viene provato nei due ordini di arrivo: l'esito non puo' dipendere
  -- da quale sync e' arrivato prima.
  declare
    v_st jsonb; v_ini bigint; v_fin bigint;
    v_fail text := '';
    v_notte jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start, 'endMs', v_start + 28800000, 'stage','asleep','sessionIdx',0));
    v_pisolino jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start + 36000000, 'endMs', v_start + 36400000, 'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 36400000, 'endMs', v_start + 36800000, 'stage','deep', 'sessionIdx',0),
      jsonb_build_object('startMs', v_start + 36800000, 'endMs', v_start + 37200000, 'stage','rem',  'sessionIdx',0));
    v_ordini text[] := array['notte-poi-pisolino', 'pisolino-poi-notte'];
    v_etichetta text;
    v_u13 uuid; v_d13 uuid; v_id13 bigint;
  begin
    foreach v_etichetta in array v_ordini loop
      v_u13 := pg_temp.mk_user(v_etichetta);
      v_d13 := pg_temp.mk_device(v_u13);
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_u13::text, 'role','authenticated')::text, true);

      if v_etichetta = 'notte-poi-pisolino' then
        v_id13 := public.upsert_fitness_metrics_v189(pg_temp.payload(
          v_u13, v_d13, v_notte, v_start, v_start + 28800000, 480, v_start));
        perform public.upsert_fitness_metrics_v189(pg_temp.payload(
          v_u13, v_d13, v_pisolino, v_start + 36000000, v_start + 37200000, 20, v_start + 1000));
      else
        v_id13 := public.upsert_fitness_metrics_v189(pg_temp.payload(
          v_u13, v_d13, v_pisolino, v_start + 36000000, v_start + 37200000, 20, v_start));
        perform public.upsert_fitness_metrics_v189(pg_temp.payload(
          v_u13, v_d13, v_notte, v_start, v_start + 28800000, 480, v_start + 1000));
      end if;

      select sleep_stages, sleep_start_ms, sleep_end_ms
        into v_st, v_ini, v_fin from public.fitness_metrics where id = v_id13;

      if (select count(*) from jsonb_array_elements(v_st) s(value)
          where (s.value->>'sessionIdx')::int = 0) <> 1 then
        v_fail := v_fail || ' [' || v_etichetta || ': l''indice 0 non e'' sul wrapper]';
      end if;
      if (select (s.value->>'sessionIdx')::int from jsonb_array_elements(v_st) s(value)
          where (s.value->>'startMs')::bigint = v_start) <> 0 then
        v_fail := v_fail || ' [' || v_etichetta || ': la notte non e'' la principale]';
      end if;
      if v_ini is distinct from v_start or v_fin is distinct from v_start + 28800000 then
        v_fail := v_fail || ' [' || v_etichetta || ': estremi del pisolino invece che della notte]';
      end if;
      -- Nessuna fusione artificiale: le due sessioni disgiunte restano due.
      if jsonb_array_length(coalesce(v_st,'[]'::jsonb)) <> 4 then
        v_fail := v_fail || ' [' || v_etichetta || ': segmenti persi o fusi]';
      end if;
    end loop;

    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   R13 wrapper 480min batte il pisolino a 3 fasi   OK';
    else
      v_ko := v_ko + 1; raise notice '   R13 principale scelta per verbosita''            KO  %', v_fail;
    end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R14. Notte con un pisolino PRIMA e uno DOPO, in un solo upsert ──────
  -- Tre sessioni disgiunte. La notte deve restare 0 qualunque sia la sua
  -- posizione nell'orologio, e i due pisolini prendono 1 e 2 in ordine
  -- cronologico fra loro. Copre insieme il caso "pisolino precedente" e
  -- "pisolino successivo", che sono lo stesso difetto visto da due lati.
  --
  -- Si verifica anche che l'ORDINE DEGLI ELEMENTI nell'array in ingresso non
  -- conti: la stessa notte impaginata al contrario deve dare la stessa riga.
  declare
    v_u14 uuid; v_d14 uuid; v_id14 bigint; v_id14b bigint;
    v_u14b uuid; v_d14b uuid;
    v_st jsonb; v_stb jsonb; v_ini bigint; v_fin bigint; v_min int;
    v_fail text := '';
    v_notte_ini bigint := v_start + 10800000;
    v_notte_fin bigint := v_start + 32400000;
    -- Le etichette dei due pisolini arrivano in ordine NON cronologico (il
    -- precedente ha 2, il successivo 1): e' quello che rende il caso una prova
    -- e non una formalita'. Con le etichette gia' giuste il test passerebbe
    -- anche sulla definizione difettosa, perche' l'INSERT le scriveva alla
    -- lettera — verificato il 12/08/2026.
    v_payload jsonb := jsonb_build_array(
      -- pisolino precedente (1 ora), etichettato 2
      jsonb_build_object('startMs', v_start,            'endMs', v_start + 3600000,  'stage','light','sessionIdx',2),
      -- notte (6 ore)
      jsonb_build_object('startMs', v_start + 10800000, 'endMs', v_start + 21600000, 'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 21600000, 'endMs', v_start + 28800000, 'stage','deep', 'sessionIdx',0),
      jsonb_build_object('startMs', v_start + 28800000, 'endMs', v_start + 32400000, 'stage','rem',  'sessionIdx',0),
      -- pisolino successivo (1 ora), etichettato 1
      jsonb_build_object('startMs', v_start + 43200000, 'endMs', v_start + 46800000, 'stage','light','sessionIdx',1));
    v_invertito jsonb;
  begin
    select jsonb_agg(s.value order by s.ord desc) into v_invertito
    from jsonb_array_elements(v_payload) with ordinality as s(value, ord);

    v_u14 := pg_temp.mk_user('notte-fra-due-pisolini');
    v_d14 := pg_temp.mk_device(v_u14);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u14::text, 'role','authenticated')::text, true);
    v_id14 := public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u14, v_d14, v_payload, v_notte_ini, v_notte_fin, 360, v_start));
    select sleep_stages, sleep_start_ms, sleep_end_ms, sleep_minutes
      into v_st, v_ini, v_fin, v_min from public.fitness_metrics where id = v_id14;

    -- Le tre cose che devono descrivere la STESSA sessione.
    if (select count(*) from jsonb_array_elements(v_st) s(value)
        where (s.value->>'sessionIdx')::int = 0) <> 3 then
      v_fail := v_fail || ' [la sessione 0 non e'' la notte]';
    end if;
    if v_ini is distinct from v_notte_ini or v_fin is distinct from v_notte_fin then
      v_fail := v_fail || ' [estremi non della notte]';
    end if;
    if v_min is distinct from 360 then
      v_fail := v_fail || ' [minuti ' || coalesce(v_min::text,'null') || ']';
    end if;
    -- I pisolini restano due, numerati in ordine di orologio.
    if (select (s.value->>'sessionIdx')::int
        from jsonb_array_elements(v_st) s(value)
        where (s.value->>'startMs')::bigint = v_start) <> 1
       or (select (s.value->>'sessionIdx')::int
           from jsonb_array_elements(v_st) s(value)
           where (s.value->>'startMs')::bigint = v_start + 43200000) <> 2 then
      v_fail := v_fail || ' [pisolini non numerati in ordine cronologico]';
    end if;
    if jsonb_array_length(coalesce(v_st,'[]'::jsonb)) <> 5 then
      v_fail := v_fail || ' [segmenti persi]';
    end if;

    -- Stesso contenuto, array impaginato al contrario.
    v_u14b := pg_temp.mk_user('notte-fra-due-pisolini-invertita');
    v_d14b := pg_temp.mk_device(v_u14b);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u14b::text, 'role','authenticated')::text, true);
    v_id14b := public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u14b, v_d14b, v_invertito, v_notte_ini, v_notte_fin, 360, v_start));
    select sleep_stages into v_stb from public.fitness_metrics where id = v_id14b;
    if v_stb is distinct from v_st then
      v_fail := v_fail || ' [l''ordine degli elementi in ingresso cambia la riga]';
    end if;

    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   R14 notte fra due pisolini, ordine irrilevante  OK';
    else
      v_ko := v_ko + 1; raise notice '   R14 notte fra due pisolini                      KO  %', v_fail;
    end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R15. Una riga LEGACY si ripara da sola al primo ri-sync ─────────────
  -- Il caso piu' importante di tutta la suite, perche' riguarda dati che
  -- esistono davvero: 3.749 righe su 5.709 in produzione hanno il pisolino
  -- etichettato 0 e la notte etichettata 1, con `sleep_start_ms`/
  -- `sleep_end_ms` che descrivono la notte. Nessuna migration le riscrive:
  -- l'unica speranza che tornino giuste e' che un normale ri-sync le ripari.
  --
  -- Qui lo stato legacy viene scritto DIRETTAMENTE in tabella (come se fosse
  -- stato memorizzato prima del fix), poi arriva un upsert normalissimo.
  --
  -- RED misurato il 12/08/2026 su una versione intermedia di questa stessa
  -- correzione, quella che metteva la chiave `dichiarata` davanti al sonno
  -- dormito: la riga NON si riparava, e non si sarebbe riparata mai, con
  -- nessun numero di sync. La spazzata, a parita' di ricchezza, tiene la
  -- versione gia' memorizzata di entrambe le sessioni — ed e' giusto cosi',
  -- e' la stabilita' della riga — quindi entrambi i candidati superstiti
  -- portavano l'etichetta vecchia e il pisolino restava "dichiarato
  -- principale" in eterno. Il difetto non era piu' "la principale la sceglie
  -- la verbosita'", era "la principale e' congelata sull'errore": peggio,
  -- perche' non si autocorregge.
  declare
    v_u15 uuid; v_d15 uuid; v_id15 bigint;
    v_st jsonb; v_ini bigint; v_fin bigint;
    v_fail text := '';
    v_notte_ini bigint := v_start + 10800000;
    v_notte_fin bigint := v_start + 32400000;
    -- Pisolino con l'indice 0, notte con l'indice 1: la forma legacy.
    v_legacy jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start,            'endMs', v_start + 3600000,  'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 10800000, 'endMs', v_start + 21600000, 'stage','light','sessionIdx',1),
      jsonb_build_object('startMs', v_start + 21600000, 'endMs', v_start + 32400000, 'stage','deep', 'sessionIdx',1));
  begin
    v_u15 := pg_temp.mk_user('riga-legacy');
    v_d15 := pg_temp.mk_device(v_u15);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u15::text, 'role','authenticated')::text, true);

    insert into public.fitness_metrics (
      user_id, device_id, schema_version, source, source_device, local_day_key,
      window_start_ms, window_end_ms, collected_at_ms, received_at,
      sleep_minutes, sleep_start_ms, sleep_end_ms, sleep_stages)
    values (v_u15, v_d15, 4, 'health_connect', 'watch', '2026-08-10',
            v_start, v_notte_fin, v_start, now(),
            360, v_notte_ini, v_notte_fin, v_legacy)
    returning id into v_id15;

    -- Un ri-sync qualunque della stessa giornata.
    perform public.upsert_fitness_metrics_v189(pg_temp.payload(
      v_u15, v_d15, v_legacy, v_notte_ini, v_notte_fin, 360, v_start + 1000));

    select sleep_stages, sleep_start_ms, sleep_end_ms
      into v_st, v_ini, v_fin from public.fitness_metrics where id = v_id15;
    if (select count(*) from jsonb_array_elements(v_st) s(value)
        where (s.value->>'sessionIdx')::int = 0) <> 2 then
      v_fail := v_fail || ' [la riga legacy non si e'' riparata: la sessione 0 non e'' la notte]';
    end if;
    if v_ini is distinct from v_notte_ini or v_fin is distinct from v_notte_fin then
      v_fail := v_fail || ' [estremi ancora del pisolino]';
    end if;
    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   R15 una riga legacy si ripara al primo ri-sync  OK';
    else
      v_ko := v_ko + 1; raise notice '   R15 la riga legacy resta sbagliata per sempre   KO  %', v_fail;
    end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
  end;

  -- ── R16. Senza finestra dichiarata decide il sonno, non l'etichetta ─────
  -- Il confine dichiarato del contratto. Quando la fonte non manda
  -- `sleep_start_ms`/`sleep_end_ms` non esiste evidenza indipendente su quale
  -- sessione sia la principale: resta solo `sessionIdx`, che pero' dopo il
  -- primo giro e' l'eco di una decisione gia' presa, non una prova. Allora
  -- decide il dato: fra sessioni disgiunte vince quella con piu' sonno reale.
  --
  -- Qui il pisolino da venti minuti arriva etichettato 0 e la notte da otto
  -- ore etichettata 1: vince la notte. E' esattamente cio' che permette a R15
  -- di riparare le righe vecchie, e va detto che il prezzo e' questo — una
  -- fonte che insistesse a chiamare "principale" un pisolino, senza mandare
  -- la finestra, non verrebbe assecondata.
  declare
    v_u16 uuid; v_d16 uuid; v_id16 bigint;
    v_st jsonb;
    v_payload jsonb := jsonb_build_array(
      jsonb_build_object('startMs', v_start, 'endMs', v_start + 1200000, 'stage','light','sessionIdx',0),
      jsonb_build_object('startMs', v_start + 36000000, 'endMs', v_start + 64800000, 'stage','asleep','sessionIdx',1));
  begin
    v_u16 := pg_temp.mk_user('senza-finestra');
    v_d16 := pg_temp.mk_device(v_u16);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u16::text, 'role','authenticated')::text, true);
    -- Payload costruito a mano: senza sleep_start_ms/sleep_end_ms.
    v_id16 := public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_u16, 'device_id', v_d16, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
      'collected_at_ms', v_start, 'window_start_ms', v_start,
      'window_end_ms', v_start + 86400000, 'sleep_minutes', 20,
      'sleep_stages', v_payload));
    select sleep_stages into v_st from public.fitness_metrics where id = v_id16;
    if (select (s.value->>'sessionIdx')::int from jsonb_array_elements(v_st) s(value)
        where (s.value->>'startMs')::bigint = v_start + 36000000) = 0 then
      v_ok := v_ok + 1; raise notice '   R16 senza finestra decide il sonno dormito     OK';
    else
      v_ko := v_ko + 1; raise notice '   R16 senza finestra ha vinto l''etichetta        KO   %', v_st;
    end if;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_u::text, 'role','authenticated')::text, true);
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
\echo 'sleep_merge_p0 / RPC completa: UNDICI CASI'
\echo '=================================================='
