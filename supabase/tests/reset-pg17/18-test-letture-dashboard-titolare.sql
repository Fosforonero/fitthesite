-- ============================================================================
-- 18 — Le letture della dashboard web: solo le righe del titolare
--
-- PERCHE' ESISTE
-- --------------
-- La RLS dice cosa un utente PUO' leggere, non cosa e' suo. Su fitness_metrics
-- la policy dei gruppi consegna ai co-membri la riga intera (20260731095701);
-- una dashboard che si affidasse alla RLS mostrerebbe a un membro di un gruppo
-- i dati degli altri. Il mandato del 24/09/2026 dice il contrario: le letture
-- della dashboard non si estendono ai membri di un gruppo.
--
-- `lib/dashboard/letture-titolare.ts` interroga con un filtro esplicito sul
-- proprietario e una lista di colonne esplicita. Questo file esegue la STESSA
-- forma di query, come `authenticated` con il JWT di ciascun attore:
--   1. CONTROLLO POSITIVO: senza filtro i membri del gruppo vedono righe altrui
--      di fitness_metrics (se non le vedessero, il verde del punto 2 non
--      misurerebbe niente);
--   2. col filtro sul proprietario, per ogni attore e ogni tabella, zero righe
--      altrui, e le proprie righe ci sono;
--   3. le colonne della lista esistono (la query si esegue) e la lista non
--      contiene glicemia, pressione, piani, nomi o identificativi di dispositivo,
--      calorie intraday, sessioni o testi liberi. Le serie di un giorno (passi
--      orari, battito, fasi del sonno) hanno una lista a parte, letta un giorno
--      per volta; l'estensione del 29/09/2026 e' spiegata in letture-titolare.ts.
-- La lista delle colonne qui sotto deve coincidere con quella di
-- lib/dashboard/letture-titolare.ts: lo verifica letture-titolare.test.ts.
--
-- LIMITI DICHIARATI
-- -----------------
-- Database RICOSTRUITO dalle migration, non la produzione. Dati sintetici.
-- ============================================================================
\set ON_ERROR_STOP on

do $$
declare
  v_passati int := 0;
  a record; v_modo text; v_q text; v_tot int; v_alt int; v_proprie int;
  v_visti_gruppo int;
  -- COLONNE_METRICHE, COLONNE_SERIE_DEL_GIORNO e COLONNE_ALLENAMENTI in lib/dashboard/letture-titolare.ts
  colonne_metriche constant text := 'user_id,local_day_key,window_start_ms,window_end_ms,source,steps,distance_meters,active_calories_kcal,calories_kcal,sleep_minutes,heart_rate_bpm,resting_heart_rate_bpm,hrv_rmssd,received_at';
  colonne_serie constant text := 'user_id,local_day_key,source,steps,intraday_steps,intraday_hr,sleep_stages';
  colonne_allenamenti constant text := 'user_id,id,start_ms,end_ms,type,duration_min,distance_meters,calories_kcal,hr_avg';
  -- Terza colonna: il filtro in piu' della lettura. Le serie si leggono SOLO per un giorno
  -- (leggiSerieDelGiorno filtra su user_id e local_day_key): qui si esegue la stessa forma.
  tabelle constant text[][] := array[
    array['fitness_metrics', colonne_metriche, ''],
    array['fitness_metrics', colonne_serie, 'and local_day_key = ''2026-09-20'''],
    array['workouts', colonne_allenamenti, '']
  ];
  vietate constant text[] := array['blood_glucose_mgdl','blood_pressure_systolic','blood_pressure_diastolic',
    'intraday_calories','exercise_sessions','notes','title',
    'floors_climbed','sleep_start_ms','sleep_end_ms','hrv_sdnn',
    'source_device','source_package','hr_source_name','hr_source_quality','device_id','hr_max'];
  i int; v_col text;
begin
  begin
    create temp table dl_attori(n text primary key, id uuid);
    insert into dl_attori values
      ('alice','dd000000-0000-4000-8000-000000000001'),
      ('bob',  'dd000000-0000-4000-8000-000000000002'),
      ('dan',  'dd000000-0000-4000-8000-000000000004'),
      ('erin', 'dd000000-0000-4000-8000-000000000005'),
      ('admin','dd000000-0000-4000-8000-000000000006');
    insert into auth.users (id, email) select id, 'synth-dl-' || n || '@example.invalid' from dl_attori;
    insert into public.profiles (id, email) select id, 'synth-dl-' || n || '@example.invalid' from dl_attori
      on conflict do nothing;
    insert into public.privacy_consents (user_id) select id from dl_attori on conflict (user_id) do nothing;
    insert into public.user_roles (user_id, role) select id, 'admin' from dl_attori where n = 'admin'
      on conflict do nothing;
    insert into public.devices (id, user_id, device_fingerprint, device_name, source_type)
      select ('dd100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid, id,
             'synth-dl-fp-' || n, 'synth-dl-dev-' || n, 'health_connect'
      from dl_attori;
    insert into public.fitness_metrics
      (user_id, device_id, window_start_ms, window_end_ms, collected_at_ms, source, steps, local_day_key,
       blood_glucose_mgdl, blood_pressure_systolic, blood_pressure_diastolic)
      select id, ('dd100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid,
             1000, 2000, 3000, 'health_connect', 1234, '2026-09-20', 999.9, 199, 99
      from dl_attori;
    insert into public.workouts (user_id, device_id, start_ms, end_ms, type, title, notes)
      select id, ('dd100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid, 1000, 2000, 'run',
             'SYNTH-' || n, 'SYNTH-NOTE-' || n
      from dl_attori;
    insert into public.groups (id, type, name, owner_id)
      select 'dd200000-0000-4000-8000-000000000001', 'family', 'SYNTH-DL-G1', id from dl_attori where n = 'dan';
    insert into public.group_members (group_id, user_id, role, share_settings, display_name)
      select 'dd200000-0000-4000-8000-000000000001', a2.id, x.role,
             jsonb_build_object('preset', x.preset, 'hide_from', '[]'::jsonb), 'SYNTH-DL-' || a2.n
      from dl_attori a2
      join (values ('dan','owner','full'),('bob','member','activity'),('erin','member','activity')) x(n,role,preset)
        on x.n = a2.n;

    create temp table dl_res(attore text, tabella text, modo text, totale int, altrui int, proprie int);

    for a in select * from dl_attori order by n loop
      for i in 1 .. array_length(tabelle, 1) loop
        foreach v_modo in array array['senza_filtro','con_filtro_proprietario'] loop
          v_q := format('select count(*), count(*) filter (where user_id <> %2$L::uuid), count(*) filter (where user_id = %2$L::uuid) from (select %1$s from public.%3$I %4$s) q',
                        tabelle[i][2], a.id, tabelle[i][1],
                        case when v_modo = 'con_filtro_proprietario' then format('where user_id = %L::uuid', a.id) else 'where true' end
                          || ' ' || tabelle[i][3]);
          execute 'set local role authenticated';
          perform set_config('request.jwt.claims',
                             json_build_object('sub', a.id, 'role', 'authenticated')::text, true);
          execute v_q into v_tot, v_alt, v_proprie;
          execute 'reset role';
          insert into dl_res values (a.n, tabelle[i][1], v_modo, v_tot, v_alt, v_proprie);
        end loop;
      end loop;
    end loop;

    -- ── 1. CONTROLLO POSITIVO ────────────────────────────────────────────────
    select coalesce(sum(altrui), 0) into v_visti_gruppo from dl_res
      where modo = 'senza_filtro' and attore in ('bob','dan','erin') and tabella = 'fitness_metrics';
    if v_visti_gruppo = 0 then
      raise exception '1 FALLISCE  CONTROLLO POSITIVO: senza filtro i membri del gruppo non vedono righe altrui di fitness_metrics. O la RLS e'' cambiata o la sonda non misura.';
    end if;
    v_passati := v_passati + 1;
    raise notice '1 PASSA  controllo positivo: senza filtro i membri del gruppo vedono % righe altrui di fitness_metrics', v_visti_gruppo;

    -- ── 2. col filtro: zero righe altrui, e le proprie ci sono ──────────────
    if exists (select 1 from dl_res where modo = 'con_filtro_proprietario' and altrui > 0) then
      raise exception '2 FALLISCE  col filtro restano righe altrui: %',
        (select string_agg(attore || '/' || tabella || '=' || altrui, ', ')
           from dl_res where modo = 'con_filtro_proprietario' and altrui > 0);
    end if;
    if exists (select 1 from dl_res where modo = 'con_filtro_proprietario' and proprie = 0) then
      raise exception '2 FALLISCE  col filtro mancano le righe proprie: %',
        (select string_agg(attore || '/' || tabella, ', ')
           from dl_res where modo = 'con_filtro_proprietario' and proprie = 0);
    end if;
    v_passati := v_passati + 1;
    raise notice '2 PASSA  col filtro sul proprietario: zero righe altrui e righe proprie presenti, % combinazioni',
      (select count(*) from dl_res where modo = 'con_filtro_proprietario');

    -- ── 3. la lista delle colonne non porta dati che la dashboard non usa ───
    foreach v_col in array vietate loop
      if v_col = any (string_to_array(colonne_metriche, ',')) or v_col = any (string_to_array(colonne_serie, ','))
         or v_col = any (string_to_array(colonne_allenamenti, ',')) then
        raise exception '3 FALLISCE  la lista delle colonne contiene %', v_col;
      end if;
    end loop;
    v_passati := v_passati + 1;
    raise notice '3 PASSA  le liste si eseguono e non contengono glicemia, pressione, piani, nomi di dispositivo, sessioni o testi liberi';

    raise exception using errcode = 'P0999', message = 'ROLLBACK_INTENZIONALE';
  exception when sqlstate 'P0999' then
    null;
  end;
  raise notice 'letture dashboard del titolare: % controlli passati', v_passati;
end $$;
