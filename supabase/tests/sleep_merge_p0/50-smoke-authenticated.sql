-- ============================================================================
-- SMOKE COME `authenticated`, con i grant di PRODUZIONE
--
-- Le altre suite girano come `postgres` con auth.uid() impostato, e lo
-- dichiarano: misurano l'algoritmo, non il controllo accessi. Il motivo e' una
-- divergenza reale del database locale, verificata l'11/08/2026:
--
--   produzione : anon=arwdDxtm authenticated=arwdDxtm service_role=arwdDxtm
--   locale     : anon=Dxt      authenticated=Dxt      service_role=Dxt
--
-- Con `Dxt` (solo TRUNCATE/REFERENCES/TRIGGER) la RPC fallisce sul proprio
-- controllo di proprieta' del device prima ancora di arrivare al merge. Qui i
-- grant vengono riportati a quelli di produzione DENTRO la transazione, quindi
-- il ROLLBACK finale li rimette come stavano: la divergenza resta, ma almeno
-- un percorso viene esercitato per davvero.
--
-- Prima di tutto si verifica che l'insieme delle policy RLS locali sia quello
-- di produzione. Se un giorno divergesse, un verde qui non varrebbe niente, e
-- il test deve dirlo invece di lasciarlo credere.
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

create or replace function pg_temp.come(p_user uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role','authenticated')::text, true);
end $$;

-- ── Compensazioni, tutte dentro la transazione e tutte dichiarate ─────────
-- Ognuna esiste perche' il database ricostruito dalle migration del repo NON
-- e' quello di produzione. Sono tre divergenze distinte, verificate
-- l'11/08/2026 leggendo produzione in sola lettura.

-- (1) Grant di tabella. Produzione: arwdDxtm per anon/authenticated/service_role.
grant all on public.fitness_metrics to anon, authenticated, service_role;
grant all on public.devices to anon, authenticated, service_role;

-- (2) Le policy di SELECT su fitness_metrics leggono altre tabelle: senza
--     questi grant la policy stessa solleva "permission denied" e la query
--     fallisce invece di restituire zero righe.
grant select on public.caregiver_links, public.privacy_consents, public.group_members
  to authenticated;
do $c$
begin
  -- In produzione la funzione di condivisione vive in `rls_internal`; nel
  -- database ricostruito dalle migration quello schema non esiste affatto e
  -- la funzione sta in `public`. E' la quarta divergenza: qui si concede
  -- l'esecuzione dovunque si trovi, invece di assumere.
  if exists (select 1 from pg_namespace where nspname = 'rls_internal') then
    execute 'grant usage on schema rls_internal to authenticated';
    execute 'grant execute on all functions in schema rls_internal to authenticated';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'user_shares_metric_with_caller') then
    execute 'grant execute on function public.user_shares_metric_with_caller to authenticated';
  end if;
end $c$;

-- (3) LA PIU' SERIA: la policy di INSERT non esiste in nessuna migration del
--     repo. In produzione c'e' e si chiama `users insert own metrics`, con
--     check `user_id = (select auth.uid())`. Ricreata qui verbatim, altrimenti
--     `authenticated` non puo' inserire niente e il percorso di scrittura
--     resterebbe non esercitabile in locale. E' anche il motivo per cui un
--     eventuale ripristino di produzione da queste migration lascerebbe l'app
--     senza la possibilita' di scrivere metriche: vedi il report.
create policy "users insert own metrics" on public.fitness_metrics
  for insert to authenticated with check (user_id = (select auth.uid()));

do $$
declare
  v_ok int := 0; v_ko int := 0;
  v_a uuid; v_b uuid; v_da uuid; v_db uuid;
  v_id bigint; v_n int; v_txt text; v_err text;
  v_start bigint := 1754000000000;
  X jsonb;
begin
  X := jsonb_build_array(
    jsonb_build_object('startMs', v_start,           'endMs', v_start + 3600000, 'stage','light','sessionIdx',0),
    jsonb_build_object('startMs', v_start + 3600000, 'endMs', v_start + 7200000, 'stage','deep', 'sessionIdx',0));

  -- ── S0. L'insieme delle policy e' quello di produzione (dopo la (3)) ───
  -- Il test non assume: confronta. Se produzione cambia, o se qualcuno
  -- aggiunge la policy mancante alle migration (rendendo la compensazione (3)
  -- superflua e questo create policy un errore), il rosso arriva qui.
  select string_agg(p.polname, ',' order by p.polname) into v_txt
  from pg_policy p where p.polrelid = 'public.fitness_metrics'::regclass;
  if v_txt = 'caregiver select subjects metrics,metrics_select_via_group,users insert own metrics,users select own metrics,users update own metrics' then
    v_ok := v_ok + 1; raise notice '   S0  policy RLS allineate a produzione              OK   (1 ricreata qui, manca alle migration)';
  else
    v_ko := v_ko + 1; raise notice '   S0  policy RLS divergenti                          KO  %', v_txt;
  end if;

  -- Preparazione come postgres: utenti, device, e una riga di B.
  v_a := pg_temp.mk_user('smoke-a');
  v_b := pg_temp.mk_user('smoke-b');
  v_da := gen_random_uuid(); v_db := gen_random_uuid();
  insert into public.devices (id, user_id, device_fingerprint, source_type)
  values (v_da, v_a, 'fp-a-' || v_da::text, 'health_connect'),
         (v_db, v_b, 'fp-b-' || v_db::text, 'health_connect');

  -- ── S1. A chiama la RPC come `authenticated`: funziona davvero ─────────
  perform pg_temp.come(v_a);
  set local role authenticated;
  v_id := public.upsert_fitness_metrics_v189(jsonb_build_object(
    'user_id', v_a, 'device_id', v_da, 'local_day_key', '2026-08-10',
    'source', 'health_connect', 'source_device', 'watch', 'schema_version', 4,
    'collected_at_ms', v_start, 'window_start_ms', v_start, 'window_end_ms', v_start + 86400000,
    'sleep_stages', X || X, 'sleep_start_ms', v_start, 'sleep_end_ms', v_start + 7200000,
    'sleep_minutes', 120));
  select count(*) into v_n from public.fitness_metrics where id = v_id;
  if v_id is not null and v_n = 1 then
    v_ok := v_ok + 1; raise notice '   S1  RPC come authenticated con RLS attiva          OK';
  else
    v_ko := v_ko + 1; raise notice '   S1  RPC come authenticated                         KO   id=% righe viste=%', v_id, v_n;
  end if;

  -- ── S2. E la canonicalizzazione ha lavorato anche su questo percorso ───
  select jsonb_array_length(sleep_stages) into v_n from public.fitness_metrics where id = v_id;
  if v_n = 2 then
    v_ok := v_ok + 1; raise notice '   S2  array duplicato canonicalizzato sotto RLS      OK';
  else
    v_ko := v_ko + 1; raise notice '   S2  canonicalizzazione sotto RLS                   KO   % segmenti', v_n;
  end if;
  reset role;

  -- ── S3. B non vede la riga di A ────────────────────────────────────────
  perform pg_temp.come(v_b);
  set local role authenticated;
  select count(*) into v_n from public.fitness_metrics where id = v_id;
  reset role;
  if v_n = 0 then
    v_ok := v_ok + 1; raise notice '   S3  cross-account in lettura: B non vede A         OK';
  else
    v_ko := v_ko + 1; raise notice '   S3  cross-account in lettura                       KO   B vede % righe', v_n;
  end if;

  -- ── S4. B non puo' scrivere la riga di A dalla porta di servizio ───────
  perform pg_temp.come(v_b);
  set local role authenticated;
  update public.fitness_metrics set sleep_minutes = 999 where id = v_id;
  get diagnostics v_n = row_count;
  reset role;
  if v_n = 0 and (select sleep_minutes from public.fitness_metrics where id = v_id) = 120 then
    v_ok := v_ok + 1; raise notice '   S4  cross-account in scrittura diretta: bloccato   OK';
  else
    v_ko := v_ko + 1; raise notice '   S4  cross-account in scrittura                     KO   % righe toccate', v_n;
  end if;

  -- ── S5. B non puo' usare la RPC sui dati di A ──────────────────────────
  perform pg_temp.come(v_b);
  set local role authenticated;
  v_err := '(nessun errore)';
  begin
    perform public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_a, 'device_id', v_da, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch',
      'collected_at_ms', v_start + 1, 'sleep_minutes', 1));
  exception when others then
    v_err := sqlstate;
  end;
  reset role;
  if v_err = '42501' then
    v_ok := v_ok + 1; raise notice '   S5  RPC cross-account: rifiutata (42501)           OK';
  else
    v_ko := v_ko + 1; raise notice '   S5  RPC cross-account                              KO   %', v_err;
  end if;

  -- ── S6. B non puo' passare il PROPRIO user_id col device di A ──────────
  -- E' il tentativo piu' realistico: l'identita' e' vera, il device no.
  perform pg_temp.come(v_b);
  set local role authenticated;
  v_err := '(nessun errore)';
  begin
    perform public.upsert_fitness_metrics_v189(jsonb_build_object(
      'user_id', v_b, 'device_id', v_da, 'local_day_key', '2026-08-10',
      'source', 'health_connect', 'source_device', 'watch',
      'collected_at_ms', v_start + 1, 'sleep_minutes', 1));
  exception when others then
    v_err := sqlstate;
  end;
  reset role;
  if v_err = '42501' then
    v_ok := v_ok + 1; raise notice '   S6  device di un altro account: rifiutato (42501)  OK';
  else
    v_ko := v_ko + 1; raise notice '   S6  device di un altro account                     KO   %', v_err;
  end if;

  -- ── S7. anon non puo' eseguire la RPC ──────────────────────────────────
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  v_err := '(nessun errore)';
  begin
    perform public.upsert_fitness_metrics_v189('{"user_id":"00000000-0000-0000-0000-000000000001"}'::jsonb);
  exception when others then
    v_err := sqlstate;
  end;
  reset role;
  -- 42501 = insufficient_privilege sull'EXECUTE. Qualunque errore va bene
  -- tranne "nessun errore": quello vorrebbe dire che anon puo' chiamarla.
  if v_err <> '(nessun errore)' then
    v_ok := v_ok + 1; raise notice '   S7  anon non puo'' eseguire la RPC (%)             OK', v_err;
  else
    v_ko := v_ko + 1; raise notice '   S7  anon PUO'' eseguire la RPC                     KO';
  end if;

  -- ── S8. anon non vede righe, pur avendo i grant di tabella ─────────────
  -- I grant ci sono (arwdDxtm anche per anon, in produzione): a fermarlo e'
  -- la RLS, che per anon non ha nessuna policy. Vale la pena esercitarlo
  -- proprio perche' il grant da solo suggerirebbe il contrario.
  set local role anon;
  select count(*) into v_n from public.fitness_metrics;
  reset role;
  if v_n = 0 then
    v_ok := v_ok + 1; raise notice '   S8  anon: zero righe malgrado i grant di tabella   OK';
  else
    v_ko := v_ko + 1; raise notice '   S8  anon vede % righe                              KO', v_n;
  end if;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'smoke authenticated: % casi falliti', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'sleep_merge_p0 / smoke authenticated: NOVE CASI'
\echo '=================================================='
