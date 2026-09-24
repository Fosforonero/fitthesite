-- ============================================================================
-- 16 — Export web «i miei dati»: la RLS dice cosa si PUO' leggere, non cosa e' proprio
--
-- PERCHE' ESISTE
-- --------------
-- `app/(frontend)/[locale]/app/export/ExportDataClient.tsx` interrogava dodici
-- tabelle con `select('*')` e un commento diceva «la RLS restituisce solo le
-- sue righe». Non e' vero per chi ha relazioni o ruoli: admin, membri di un
-- gruppo e co-partecipanti a una sfida leggono anche righe altrui, e il file
-- scaricato — che si presenta come «i tuoi dati» — le conteneva.
--
-- Misurato con dati sintetici su questo database (ricostruito dalle migration):
--   admin      -> righe altrui in profiles, devices (token FCM), b2c_subscriptions
--                 (raw_payload), user_roles (note)
--   membri G1  -> righe altrui in fitness_metrics (glicemia e pressione comprese,
--                 anche col preset «activity») e in group_members (share_settings)
--   alice/zed  -> nessuna riga altrui (controllo negativo)
--
-- IL CLIENT ORA FILTRA SUL PROPRIETARIO: lib/privacy/export-scope.ts. Questo file
-- prova due cose e una terza fa da controllo:
--   1. CONTROLLO POSITIVO: senza filtro la sonda VEDE righe altrui (se non le
--      vedesse, il verde del punto 2 non misurerebbe niente);
--   2. col filtro proprietario, per OGNI attore e OGNI tabella, zero righe altrui;
--   3. l'elenco tabella -> colonna proprietario qui sotto deve coincidere con
--      EXPORT_OWNER_SCOPE (lib/privacy/export-scope.test.ts lo verifica).
--
-- LIMITI DICHIARATI
-- -----------------
--  - Questo e' il database RICOSTRUITO dalle migration, non la produzione.
--    Le policy che qui espongono righe altrui esistono anche in produzione
--    secondo supabase/MANIFESTO-RICONCILIAZIONE-190.md, ma nessuna query e' stata
--    eseguita su dati veri.
--  - `challenge_participants` e `challenge_scores` in questa catena rispondono
--    con «infinite recursion» (42P17) per qualunque utente. E' l'unico errore
--    tollerato, e solo su quelle due tabelle: viene segnalato come NON MISURATO,
--    non contato come verde. Qualunque altro errore fa fallire il test.
--  - Il caregiver NON vede le righe del soggetto in questa catena (la sua policy
--    legge privacy_consents con le regole del chiamante): non e' riprodotto e non
--    e' asserito.
-- ============================================================================
\set ON_ERROR_STOP on

-- Ogni prova gira in un sotto-blocco con EXCEPTION, che e' un savepoint implicito:
-- fixture e ruoli vengono annullati senza dipendere da come il file e' eseguito.
do $$
declare
  v_passati int := 0;
  a record; v_modo text;
  v_own text; v_q text; v_tot int; v_alt int;
  v_visti_admin int; v_visti_gruppo int;
  v_non_misurate text[] := '{}';
  tabelle constant text[][] := array[
    array['profiles','id'],
    array['privacy_consents','user_id'],
    array['user_settings','user_id'],
    array['devices','user_id'],
    array['fitness_metrics','user_id'],
    array['workouts','user_id'],
    array['caregiver_links','caregiver_id|subject_id'],
    array['group_members','user_id'],
    array['b2c_subscriptions','user_id'],
    array['challenge_participants','user_id'],
    array['challenge_scores','user_id'],
    array['user_roles','user_id']
  ];
  i int;
begin
  begin
    -- ── fixture sintetica (prefisso ee: nessun altro test lo ripulisce) ─────
    create temp table ex_attori(n text primary key, id uuid);
    insert into ex_attori values
      ('alice','ee000000-0000-4000-8000-000000000001'),
      ('bob',  'ee000000-0000-4000-8000-000000000002'),
      ('carla','ee000000-0000-4000-8000-000000000003'),
      ('dan',  'ee000000-0000-4000-8000-000000000004'),
      ('erin', 'ee000000-0000-4000-8000-000000000005'),
      ('admin','ee000000-0000-4000-8000-000000000006'),
      ('frank','ee000000-0000-4000-8000-000000000007'),
      ('gina', 'ee000000-0000-4000-8000-000000000008'),
      ('zed',  'ee000000-0000-4000-8000-000000000009');
    insert into auth.users (id, email) select id, 'synth-' || n || '@example.invalid' from ex_attori;

    insert into public.privacy_consents (user_id, caregiver_share)
      select id, (n = 'bob') from ex_attori
      on conflict (user_id) do update set caregiver_share = excluded.caregiver_share;
    insert into public.user_settings (user_id) select id from ex_attori on conflict (user_id) do nothing;
    insert into public.user_roles (user_id, role, note)
      select id, case when n = 'admin' then 'admin' else 'user' end, 'SYNTH-NOTE-' || n from ex_attori
      on conflict do nothing;
    insert into public.devices (id, user_id, device_fingerprint, device_name, source_type, fcm_token)
      select ('ee100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid, id,
             'synth-fp-' || n, 'synth-dev-' || n, 'health_connect', 'SYNTH-FCM-TOKEN-' || n
      from ex_attori;
    insert into public.fitness_metrics
      (user_id, device_id, window_start_ms, window_end_ms, collected_at_ms, source, steps,
       blood_glucose_mgdl, blood_pressure_systolic, blood_pressure_diastolic)
      select id, ('ee100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid,
             1000, 2000, 3000, 'health_connect', 1234, 999.9, 199, 99
      from ex_attori;
    insert into public.workouts (user_id, device_id, start_ms, end_ms, type, title)
      select id, ('ee100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid, 1000, 2000, 'run', 'SYNTH-' || n
      from ex_attori;
    insert into public.b2c_subscriptions
      (user_id, billing_source, external_product_id, external_subscription_id, active_until, state, raw_payload)
      select id, 'google_play', 'synth.product', 'SYNTH-SUB-' || n, now() + interval '30 days', 'active',
             jsonb_build_object('synthetic', true, 'owner', n)
      from ex_attori;
    insert into public.caregiver_links (caregiver_id, subject_id, permissions)
      select c.id, s.id, array['view_dashboard'] from ex_attori c, ex_attori s where c.n='carla' and s.n='bob';
    insert into public.groups (id, type, name, owner_id)
      select 'ee200000-0000-4000-8000-000000000001', 'family', 'SYNTH-G1', id from ex_attori where n='dan';
    insert into public.group_members (group_id, user_id, role, share_settings, display_name)
      select 'ee200000-0000-4000-8000-000000000001', a2.id, x.role,
             jsonb_build_object('preset', x.preset, 'hide_from', '[]'::jsonb), 'SYNTH-' || a2.n
      from ex_attori a2
      join (values ('dan','owner','full'),('bob','member','activity'),('erin','member','activity')) x(n,role,preset)
        on x.n = a2.n;
    insert into public.challenges (id, name, metric, participant_type, period_start, period_end)
      values ('ee300000-0000-4000-8000-000000000001','SYNTH-CH','steps','individual', now(), now() + interval '7 days');
    insert into public.challenge_participants (challenge_id, user_id, device_id_used)
      select 'ee300000-0000-4000-8000-000000000001', a2.id,
             ('ee100000-0000-4000-8000-00000000000' || right(a2.id::text,1))::uuid
      from ex_attori a2 where a2.n in ('frank','gina');
    insert into public.challenge_scores (challenge_id, user_id, score)
      select 'ee300000-0000-4000-8000-000000000001', a2.id, 100 from ex_attori a2 where a2.n in ('frank','gina');

    create temp table ex_res(attore text, tabella text, modo text, totale int, altrui int, errore text);

    -- ── la sonda: la stessa query del client, come `authenticated` con il JWT dell'attore ──
    for a in select * from ex_attori order by n loop
      for i in 1 .. array_length(tabelle, 1) loop
        v_own := case
          when tabelle[i][2] like '%|%' then
            format('(%1$s = %3$L::uuid or %2$s = %3$L::uuid)',
                   split_part(tabelle[i][2], '|', 1), split_part(tabelle[i][2], '|', 2), a.id)
          else format('%s = %L::uuid', tabelle[i][2], a.id) end;
        foreach v_modo in array array['senza_filtro','con_filtro_proprietario'] loop
          v_q := format('select count(*), count(*) filter (where not (%s)) from public.%I %s',
                        v_own, tabelle[i][1],
                        case when v_modo = 'con_filtro_proprietario' then 'where ' || v_own else '' end);
          begin
            execute 'set local role authenticated';
            perform set_config('request.jwt.claims',
                               json_build_object('sub', a.id, 'role', 'authenticated')::text, true);
            execute v_q into v_tot, v_alt;
            execute 'reset role';
            insert into ex_res values (a.n, tabelle[i][1], v_modo, v_tot, v_alt, null);
          exception when others then
            insert into ex_res values (a.n, tabelle[i][1], v_modo, -1, 0, sqlstate || ': ' || sqlerrm);
          end;
        end loop;
      end loop;
    end loop;

    -- ── 1. CONTROLLO POSITIVO: senza filtro la sonda vede righe altrui ──────
    select coalesce(sum(altrui), 0) into v_visti_admin from ex_res
      where modo = 'senza_filtro' and attore = 'admin'
        and tabella in ('profiles','devices','b2c_subscriptions','user_roles');
    select coalesce(sum(altrui), 0) into v_visti_gruppo from ex_res
      where modo = 'senza_filtro' and attore in ('bob','dan','erin')
        and tabella in ('fitness_metrics','group_members');
    if v_visti_admin = 0 then
      raise exception '1 FALLISCE  CONTROLLO POSITIVO: l''admin, senza filtro, non vede nessuna riga altrui in profiles/devices/b2c_subscriptions/user_roles. O la RLS e'' cambiata (aggiornare questo test e il commento del client) o la sonda non misura.';
    end if;
    if v_visti_gruppo = 0 then
      raise exception '1 FALLISCE  CONTROLLO POSITIVO: i membri del gruppo, senza filtro, non vedono righe altrui in fitness_metrics/group_members. O la RLS e'' cambiata o la sonda non misura.';
    end if;
    v_passati := v_passati + 1;
    raise notice '1 PASSA  controllo positivo: senza filtro la sonda vede righe altrui (admin: %, membri di gruppo: %)', v_visti_admin, v_visti_gruppo;

    -- ── 2a. controllo negativo: chi non ha relazioni non vede righe altrui neanche senza filtro ──
    if exists (select 1 from ex_res where modo = 'senza_filtro' and attore in ('alice','zed') and altrui > 0) then
      raise exception '2a FALLISCE  un utente senza relazioni vede righe altrui anche senza filtro: e'' una perdita piu'' grave di quella dell''export.';
    end if;
    v_passati := v_passati + 1;
    raise notice '2a PASSA  alice e zed (nessuna relazione) non vedono righe altrui, nemmeno senza filtro';

    -- ── 2b. col filtro proprietario: zero righe altrui, ovunque ─────────────
    if exists (select 1 from ex_res where modo = 'con_filtro_proprietario' and altrui > 0) then
      raise exception '2b FALLISCE  col filtro proprietario restano righe altrui: %',
        (select string_agg(attore || '/' || tabella || '=' || altrui, ', ')
           from ex_res where modo = 'con_filtro_proprietario' and altrui > 0);
    end if;
    v_passati := v_passati + 1;
    raise notice '2b PASSA  col filtro proprietario: zero righe altrui su % combinazioni attore x tabella',
      (select count(*) from ex_res where modo = 'con_filtro_proprietario');

    -- ── 2c. nessun errore, salvo la ricorsione nota sulle due tabelle delle sfide ──
    if exists (select 1 from ex_res where totale = -1
                 and not (tabella in ('challenge_participants','challenge_scores') and errore like '42P17:%')) then
      raise exception '2c FALLISCE  errore inatteso della sonda: %',
        (select string_agg(distinct tabella || ' -> ' || errore, ' | ')
           from ex_res where totale = -1
            and not (tabella in ('challenge_participants','challenge_scores') and errore like '42P17:%'));
    end if;
    select coalesce(array_agg(distinct tabella), '{}') into v_non_misurate from ex_res where totale = -1;
    v_passati := v_passati + 1;
    if array_length(v_non_misurate, 1) is null then
      raise notice '2c PASSA  nessun errore: tutte le tabelle misurate';
    else
      raise notice '2c PASSA  ma NON MISURATE (ricorsione 42P17 nota in questa catena): %. Se la catena le ripara, questo avviso sparisce da solo.', v_non_misurate;
    end if;

    -- ── annulla la fixture: un'eccezione col suo SQLSTATE, catturata subito sotto ──
    raise exception using errcode = 'P0999', message = 'ROLLBACK_INTENZIONALE';
  exception when sqlstate 'P0999' then
    null;
  end;
  raise notice 'export web, ambito delle righe: % controlli passati', v_passati;
end $$;
