-- Nove controlli obbligatori su public.is_admin() dopo la forward-only.
-- Ogni controllo stampa PASSA o FALLISCE e, se fallisce, alza eccezione.

\set ON_ERROR_STOP on

-- Ricrea le due policy di user_roles che chiamano is_admin(), com'e' in
-- produzione. Senza queste il test 5 non prova niente.
drop policy if exists "admin manage roles" on public.user_roles;
drop policy if exists "admin select all roles" on public.user_roles;
drop policy if exists "users select own roles" on public.user_roles;
create policy "admin manage roles"     on public.user_roles for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin select all roles" on public.user_roles for select to authenticated using (public.is_admin());
create policy "users select own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

do $t$
declare
  n integer := 0;
  esito text;
  procedure_dummy boolean;
begin
  -- 1. auth.uid() NULL -> false, mai NULL, mai true.
  perform set_config('request.jwt.claim.sub', '', true);
  if public.is_admin() is not true and public.is_admin() is not null and public.is_admin() = false then
    raise notice '1 PASSA  utente non autenticato -> false';
  else
    raise exception '1 FALLISCE  utente non autenticato: atteso false, ottenuto %', public.is_admin();
  end if;

  -- 2. utente con role=admin -> true
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  if public.is_admin() then
    raise notice '2 PASSA  utente con role=admin -> true';
  else
    raise exception '2 FALLISCE  utente con role=admin: atteso true';
  end if;

  -- 3. utente con un ruolo diverso -> false
  perform set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
  if not public.is_admin() then
    raise notice '3 PASSA  utente con role=pro -> false';
  else
    raise exception '3 FALLISCE  utente con role=pro: atteso false';
  end if;

  -- 4. utente assente da user_roles -> false
  perform set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);
  if not public.is_admin() then
    raise notice '4 PASSA  utente assente da user_roles -> false';
  else
    raise exception '4 FALLISCE  utente assente: atteso false';
  end if;

  -- 5. NESSUNA RICORSIONE: le policy di user_roles chiamano is_admin(), che
  --    legge user_roles. Se ricorresse, qui andrebbe in stack overflow.
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  begin
    select public.is_admin() into procedure_dummy;
    raise notice '5 PASSA  nessuna ricorsione con le policy admin attive su user_roles';
  exception when others then
    raise exception '5 FALLISCE  ricorsione o errore chiamando is_admin() con le policy attive: %', sqlerrm;
  end;

  -- 6. anon NON puo' eseguirla
  if not has_function_privilege('anon', 'public.is_admin()', 'EXECUTE') then
    raise notice '6 PASSA  anon non puo eseguire is_admin()';
  else
    raise exception '6 FALLISCE  anon puo ancora eseguire is_admin()';
  end if;

  -- 7. PUBLIC non ha piu' EXECUTE
  select coalesce(string_agg(grantee, ','), '(nessuno)') into esito
  from information_schema.routine_privileges
  where routine_schema='public' and routine_name='is_admin' and grantee in ('PUBLIC','anon');
  if esito = '(nessuno)' then
    raise notice '7 PASSA  nessuna concessione residua a PUBLIC o anon';
  else
    raise exception '7 FALLISCE  concessioni residue: %', esito;
  end if;

  -- 8. authenticated e service_role possono eseguirla
  if has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')
     and has_function_privilege('service_role', 'public.is_admin()', 'EXECUTE') then
    raise notice '8 PASSA  authenticated e service_role possono eseguirla';
  else
    raise exception '8 FALLISCE  authenticated o service_role hanno perso EXECUTE';
  end if;

  -- 9. nessuna email nel corpo, search_path bloccato, SECURITY DEFINER, STABLE
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
      else 'ok'
    end
  into esito
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname='is_admin';
  if esito = 'ok' then
    raise notice '9 PASSA  nessuna email, SECURITY DEFINER, STABLE, search_path bloccato, legge user_roles';
  else
    raise exception '9 FALLISCE  %', esito;
  end if;

  raise notice '--- nove controlli su nove: PASSA ---';
end
$t$;
