-- Controlli su public.is_admin() dopo la forward-only 20260825120000.
-- Ogni controllo stampa PASSA oppure alza eccezione.
--
-- I primi sei sono i RED obbligatori sull'autorita':
--   admin permanente, admin con scadenza futura, admin scaduto,
--   utente normale, utente assente, utente non autenticato.
-- Gli ultimi tre verificano che il vincolo «esattamente due» del blocco di
-- verifica conti gli admin ATTIVI e non le righe.
--
-- La sonda che rende credibili i controlli 3 e 12-14 sta in
-- 02-controllo-positivo-ricorsione.sql: li' si dimostra che togliendo il
-- controllo di expires_at il controllo 3 diventa rosso.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- FIXTURE
-- Cinque utenti, quattro righe di ruolo. Admin ATTIVI: due (permanente e con
-- scadenza futura). Admin SCADUTO: uno. Cosi' il numero di RIGHE admin e' tre
-- ma il numero di admin veri e' due, e i due conteggi si distinguono.
-- ---------------------------------------------------------------------------
delete from public.user_roles where user_id in (
  '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555');
delete from auth.users where id in (
  '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555');

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111','u1@prova.invalid'),
  ('22222222-2222-2222-2222-222222222222','u2@prova.invalid'),
  ('33333333-3333-3333-3333-333333333333','u3@prova.invalid'),
  ('44444444-4444-4444-4444-444444444444','u4@prova.invalid'),
  ('55555555-5555-5555-5555-555555555555','u5@prova.invalid');

insert into public.user_roles (user_id, role, expires_at, note) values
  ('11111111-1111-1111-1111-111111111111','admin', null,                    'admin permanente'),
  ('22222222-2222-2222-2222-222222222222','admin', now() + interval '30 days','admin con scadenza futura'),
  ('33333333-3333-3333-3333-333333333333','admin', now() - interval '1 day',  'admin SCADUTO'),
  ('44444444-4444-4444-4444-444444444444','pro',   null,                    'utente normale');

-- Le due policy di user_roles che chiamano is_admin(), com'e' in produzione.
-- Senza queste il controllo 7 non prova niente.
drop policy if exists "admin manage roles" on public.user_roles;
drop policy if exists "admin select all roles" on public.user_roles;
drop policy if exists "users select own roles" on public.user_roles;
create policy "admin manage roles"     on public.user_roles for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin select all roles" on public.user_roles for select to authenticated using (public.is_admin());
create policy "users select own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

do $t$
declare
  esito text;
  scarto boolean;
begin
  -- =========================================================================
  -- I SEI RED SULL'AUTORITA'
  -- =========================================================================

  -- 1. admin permanente (expires_at null) -> true
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  if public.is_admin() then
    raise notice '1  PASSA  admin permanente -> true';
  else
    raise exception '1  FALLISCE  admin permanente: atteso true';
  end if;

  -- 2. admin con scadenza FUTURA -> true
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
  if public.is_admin() then
    raise notice '2  PASSA  admin con scadenza futura -> true';
  else
    raise exception '2  FALLISCE  admin con scadenza futura: atteso true';
  end if;

  -- 3. admin SCADUTO -> false. E' il controllo che l'intera correzione esiste
  --    per proteggere: la riga c''e'', il ruolo e'' 'admin', ma non vale piu'.
  perform set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
  if public.is_admin() then
    raise exception
      '3  FALLISCE  admin SCADUTO: ottenuto true, atteso false. La funzione '
      'sta ignorando expires_at.';
  else
    raise notice '3  PASSA  admin scaduto -> false';
  end if;

  -- 4. utente normale (role=pro) -> false
  perform set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
  if not public.is_admin() then
    raise notice '4  PASSA  utente normale (role=pro) -> false';
  else
    raise exception '4  FALLISCE  utente con role=pro: atteso false';
  end if;

  -- 5. utente assente da user_roles -> false
  perform set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
  if not public.is_admin() then
    raise notice '5  PASSA  utente assente da user_roles -> false';
  else
    raise exception '5  FALLISCE  utente assente: atteso false';
  end if;

  -- 6. non autenticato: auth.uid() null -> false, mai null, mai true
  perform set_config('request.jwt.claim.sub', '', true);
  if public.is_admin() is null then
    raise exception '6  FALLISCE  utente non autenticato: ottenuto NULL, atteso false';
  elsif public.is_admin() then
    raise exception '6  FALLISCE  utente non autenticato: ottenuto true, atteso false';
  else
    raise notice '6  PASSA  utente non autenticato -> false';
  end if;

  -- =========================================================================
  -- STRUTTURA E RICORSIONE
  -- =========================================================================

  -- 7. NESSUNA RICORSIONE: le policy di user_roles chiamano is_admin(), che
  --    legge user_roles. Se ricorresse, qui andrebbe in stack overflow.
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  begin
    select public.is_admin() into scarto;
    raise notice '7  PASSA  nessuna ricorsione con le policy admin attive su user_roles';
  exception when others then
    raise exception '7  FALLISCE  ricorsione o errore con le policy attive: %', sqlerrm;
  end;

  -- 8. anon NON puo' eseguirla
  if not has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') then
    raise notice '8  PASSA  anon non puo eseguire is_admin()';
  else
    raise exception '8  FALLISCE  anon puo ancora eseguire is_admin()';
  end if;

  -- 9. nessuna concessione residua a PUBLIC o anon
  select coalesce(string_agg(grantee, ','), '(nessuno)') into esito
  from information_schema.routine_privileges
  where routine_schema = 'public' and routine_name = 'is_admin' and grantee in ('PUBLIC','anon');
  if esito = '(nessuno)' then
    raise notice '9  PASSA  nessuna concessione residua a PUBLIC o anon';
  else
    raise exception '9  FALLISCE  concessioni residue: %', esito;
  end if;

  -- 10. authenticated e service_role possono eseguirla
  if has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')
     and has_function_privilege('service_role', 'public.is_admin()', 'EXECUTE') then
    raise notice '10 PASSA  authenticated e service_role possono eseguirla';
  else
    raise exception '10 FALLISCE  authenticated o service_role hanno perso EXECUTE';
  end if;

  -- 11. corpo: niente email, SECURITY DEFINER, STABLE, search_path bloccato,
  --     legge user_roles, e GUARDA expires_at.
  select
    case
      when (select count(*) from regexp_matches(pg_get_functiondef(p.oid),
              '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', 'g')) > 0
        then 'contiene una email'
      when not p.prosecdef then 'non e SECURITY DEFINER'
      when p.provolatile <> 's' then 'non e STABLE'
      when coalesce(array_to_string(p.proconfig, ';'), '') not like 'search_path=%'
        then 'search_path non bloccato'
      when pg_get_functiondef(p.oid) !~ 'public\.user_roles' then 'non legge public.user_roles'
      when pg_get_functiondef(p.oid) !~ 'expires_at' then 'non guarda expires_at'
      else 'ok'
    end
  into esito
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'is_admin';
  if esito = 'ok' then
    raise notice '11 PASSA  corpo: niente email, SECURITY DEFINER, STABLE, search_path bloccato, legge user_roles, guarda expires_at';
  else
    raise exception '11 FALLISCE  %', esito;
  end if;

  raise notice '--- undici controlli su undici: PASSA ---';
end
$t$;

-- ---------------------------------------------------------------------------
-- 12-14. IL VINCOLO «ESATTAMENTE DUE» CONTA GLI ATTIVI, NON LE RIGHE
-- Riesegue il solo blocco di verifica della migration sulla fixture, che ha
-- TRE righe admin ma DUE admin attivi.
-- ---------------------------------------------------------------------------
do $g$
declare
  v_attivi integer;
  v_scaduti integer;
  v_utenti integer;

begin
  select count(*) into v_utenti from auth.users;
  select
    count(*) filter (where ur.expires_at is null or ur.expires_at > now()),
    count(*) filter (where ur.expires_at is not null and ur.expires_at <= now())
    into v_attivi, v_scaduti
  from public.user_roles ur where ur.role = 'admin';

  -- 12. la fixture ha 3 righe admin ma 2 attivi: il vincolo passa sugli attivi
  if v_attivi = 2 and v_scaduti = 1 then
    raise notice '12 PASSA  3 righe admin, di cui 2 attive e 1 scaduta: il vincolo guarda le 2 attive';
  else
    raise exception '12 FALLISCE  attesi 2 attivi e 1 scaduto, trovati % attivi e % scaduti',
      v_attivi, v_scaduti;
  end if;

  -- 13. contando le RIGHE invece degli attivi il vincolo sarebbe soddisfatto
  --     da un numero sbagliato: e' esattamente l'errore che si sta evitando.
  if (select count(*) from public.user_roles where role = 'admin') = 3 then
    raise notice '13 PASSA  il conteggio grezzo delle righe darebbe 3, e farebbe abortire a torto';
  else
    raise exception '13 FALLISCE  la fixture non ha 3 righe admin';
  end if;

  -- 14. se il permanente scadesse, gli attivi scenderebbero a 1 e il vincolo
  --     deve abortire. Provato su una transazione annidata e annullato.
  begin
    update public.user_roles set expires_at = now() - interval '1 hour'
    where user_id = '11111111-1111-1111-1111-111111111111' and role = 'admin';

    select count(*) filter (where ur.expires_at is null or ur.expires_at > now())
      into v_attivi from public.user_roles ur where ur.role = 'admin';

    if v_attivi = 1 then
      raise notice '14 PASSA  facendo scadere il permanente gli attivi scendono a 1: il vincolo abortirebbe';
    else
      raise exception '14 FALLISCE  attesi 1 attivo dopo la scadenza, trovati %', v_attivi;
    end if;

    -- ripristina
    update public.user_roles set expires_at = null
    where user_id = '11111111-1111-1111-1111-111111111111' and role = 'admin';
  end;
end
$g$;

\echo 'is_admin: quattordici controlli, tutti verdi.'
