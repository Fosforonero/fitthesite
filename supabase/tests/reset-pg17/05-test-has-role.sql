-- Controlli su public.has_role(text) e public.is_caregiver() dopo la
-- forward-only 20260825120004.
--
-- I RED sull'autorita' sono i primi sei. Il settimo e' il controllo positivo:
-- una copia della funzione senza il predicato di scadenza deve rispondere
-- true al ruolo scaduto, altrimenti il verde del terzo non prova niente.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- FIXTURE
-- a1 caregiver permanente | a2 caregiver futuro | a3 caregiver SCADUTO
-- a4 support permanente   | a5 nessun ruolo
-- Il ruolo scelto e' 'caregiver' perche' cosi' lo stesso insieme di righe
-- prova sia has_role sia is_caregiver, che di has_role e' un guscio.
-- ---------------------------------------------------------------------------
delete from public.user_roles where user_id in (
  'a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333','a4444444-4444-4444-4444-444444444444',
  'a5555555-5555-5555-5555-555555555555');
delete from auth.users where id in (
  'a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333','a4444444-4444-4444-4444-444444444444',
  'a5555555-5555-5555-5555-555555555555');

insert into auth.users (id, email) values
  ('a1111111-1111-1111-1111-111111111111','a1@prova.invalid'),
  ('a2222222-2222-2222-2222-222222222222','a2@prova.invalid'),
  ('a3333333-3333-3333-3333-333333333333','a3@prova.invalid'),
  ('a4444444-4444-4444-4444-444444444444','a4@prova.invalid'),
  ('a5555555-5555-5555-5555-555555555555','a5@prova.invalid');

insert into public.user_roles (user_id, role, expires_at, note) values
  ('a1111111-1111-1111-1111-111111111111','caregiver', null,                      'caregiver permanente'),
  ('a2222222-2222-2222-2222-222222222222','caregiver', now() + interval '30 days','caregiver con scadenza futura'),
  ('a3333333-3333-3333-3333-333333333333','caregiver', now() - interval '1 day',  'caregiver SCADUTO'),
  ('a4444444-4444-4444-4444-444444444444','support',   null,                      'support permanente');

do $t$
declare
  esito  text;
  scarto boolean;
begin
  -- =========================================================================
  -- I SEI RED SULL'AUTORITA'
  -- =========================================================================

  -- 1. ruolo permanente -> true
  perform set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);
  if public.has_role('caregiver') then
    raise notice '1 PASSA  ruolo permanente -> true';
  else
    raise exception '1 FALLISCE  ruolo permanente: atteso true';
  end if;

  -- 2. ruolo con scadenza futura -> true
  perform set_config('request.jwt.claim.sub', 'a2222222-2222-2222-2222-222222222222', true);
  if public.has_role('caregiver') then
    raise notice '2 PASSA  ruolo con scadenza futura -> true';
  else
    raise exception '2 FALLISCE  ruolo con scadenza futura: atteso true';
  end if;

  -- 3. ruolo SCADUTO -> false
  perform set_config('request.jwt.claim.sub', 'a3333333-3333-3333-3333-333333333333', true);
  if public.has_role('caregiver') then
    raise exception
      '3 FALLISCE  ruolo SCADUTO: ottenuto true, atteso false. has_role sta '
      'ignorando expires_at, e siccome e'' l''autorita'' generale lo sta '
      'ignorando per OGNI ruolo.';
  else
    raise notice '3 PASSA  ruolo scaduto -> false';
  end if;

  -- 4. ruolo di un ALTRO utente -> false. a1 e'' caregiver, non support: il
  --    ruolo 'support' esiste (ce l''ha a4) ma non deve rispondere per a1.
  perform set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);
  if public.has_role('support') then
    raise exception
      '4 FALLISCE  ruolo di un altro utente: has_role(''support'') risponde true '
      'a chi non ce l''ha. La lettura non e'' ancorata ad auth.uid().';
  else
    raise notice '4 PASSA  ruolo posseduto da un altro utente -> false';
  end if;

  -- 5. auth.uid() null -> false, mai null, mai true
  perform set_config('request.jwt.claim.sub', '', true);
  if public.has_role('caregiver') is null then
    raise exception '5 FALLISCE  non autenticato: ottenuto NULL, atteso false';
  elsif public.has_role('caregiver') then
    raise exception '5 FALLISCE  non autenticato: ottenuto true, atteso false';
  else
    raise notice '5 PASSA  non autenticato -> false';
  end if;

  -- 6. is_caregiver() con caregiver SCADUTO -> false.
  --    Prova che la correzione si propaga attraverso il guscio.
  perform set_config('request.jwt.claim.sub', 'a3333333-3333-3333-3333-333333333333', true);
  if public.is_caregiver() then
    raise exception
      '6 FALLISCE  is_caregiver() con caregiver scaduto: ottenuto true. Il '
      'guscio non eredita il controllo di scadenza.';
  else
    raise notice '6 PASSA  is_caregiver() con caregiver scaduto -> false';
  end if;

  -- e il caregiver valido deve continuare a passare dal guscio
  perform set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);
  if not public.is_caregiver() then
    raise exception '6b FALLISCE  is_caregiver() con caregiver permanente: atteso true';
  else
    raise notice '6b PASSA  is_caregiver() con caregiver permanente -> true';
  end if;

  -- =========================================================================
  -- ACL, STRUTTURA E RICORSIONE
  -- =========================================================================

  -- 7. nessuna concessione a PUBLIC o anon, ne' su has_role ne' sul guscio
  select coalesce(string_agg(routine_name||'/'||grantee, ', '), '(nessuna)') into esito
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name in ('has_role','is_caregiver')
    and grantee in ('PUBLIC','anon');
  if esito = '(nessuna)' then
    raise notice '7 PASSA  nessuna concessione a PUBLIC o anon su has_role e is_caregiver';
  else
    raise exception '7 FALLISCE  concessioni residue: %', esito;
  end if;

  -- 8. authenticated e service_role le possono ancora eseguire
  if has_function_privilege('authenticated', 'public.has_role(text)', 'EXECUTE')
     and has_function_privilege('service_role', 'public.has_role(text)', 'EXECUTE')
     and has_function_privilege('authenticated', 'public.is_caregiver()', 'EXECUTE') then
    raise notice '8 PASSA  authenticated e service_role possono eseguirle';
  else
    raise exception '8 FALLISCE  authenticated o service_role hanno perso EXECUTE';
  end if;

  -- 9. corpo: SECURITY DEFINER, STABLE, search_path bloccato a vuoto,
  --    guarda expires_at, legge auth.uid()
  select
    case
      when not p.prosecdef then 'non e SECURITY DEFINER'
      when p.provolatile <> 's' then 'non e STABLE'
      when coalesce(array_to_string(p.proconfig, ';'), '') <> 'search_path=""'
        then 'search_path non bloccato a vuoto: ' || coalesce(array_to_string(p.proconfig, ';'), '(nessuno)')
      when pg_get_functiondef(p.oid) !~ 'expires_at' then 'non guarda expires_at'
      when pg_get_functiondef(p.oid) !~ 'auth\.uid\(\)' then 'non legge auth.uid()'
      else 'ok'
    end
  into esito
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'has_role';
  if esito = 'ok' then
    raise notice '9 PASSA  has_role: SECURITY DEFINER, STABLE, search_path vuoto, guarda expires_at, legge auth.uid()';
  else
    raise exception '9 FALLISCE  has_role: %', esito;
  end if;

  -- 10. nessuna ricorsione con le policy di user_roles attive
  perform set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);
  begin
    select public.has_role('caregiver') into scarto;
    select public.is_caregiver()        into scarto;
    raise notice '10 PASSA  nessuna ricorsione con le policy attive su user_roles';
  exception when others then
    raise exception '10 FALLISCE  ricorsione o errore: %', sqlerrm;
  end;

  raise notice '--- has_role: undici controlli, tutti verdi ---';
end
$t$;

-- ---------------------------------------------------------------------------
-- 11. CONTROLLO POSITIVO: la mutazione senza expires_at deve diventare rossa
-- ---------------------------------------------------------------------------
create or replace function public.prova_has_role_senza_scadenza(check_role text)
returns boolean
language sql stable security definer set search_path = '' as $f$
  select case
    when auth.uid() is null then false
    else exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = check_role
      -- QUI MANCA APPOSTA: and (ur.expires_at is null or ur.expires_at > now())
    )
  end;
$f$;

do $t$
declare
  v_senza boolean;
  v_con   boolean;
begin
  perform set_config('request.jwt.claim.sub', 'a3333333-3333-3333-3333-333333333333', true);
  select public.prova_has_role_senza_scadenza('caregiver') into v_senza;
  select public.has_role('caregiver')                      into v_con;

  if not v_senza then
    raise exception
      '11 CONTROLLO POSITIVO FALLISCE: la variante SENZA il predicato di '
      'scadenza risponde false al caregiver scaduto. Il verde del controllo 3 '
      'non dipende da quel predicato e quindi non prova quello che dichiara. '
      'Verificare la fixture: la riga scaduta esiste davvero?';
  end if;
  if v_con then
    raise exception '11 CONTROLLO POSITIVO FALLISCE: has_role vera risponde true a un ruolo scaduto.';
  end if;

  raise notice
    '11 PASSA  controllo positivo: sullo stesso ruolo scaduto la variante senza '
    'expires_at risponde %, has_role vera risponde %.', v_senza, v_con;
end
$t$;

drop function if exists public.prova_has_role_senza_scadenza(text);

\echo 'has_role e is_caregiver: dodici controlli, tutti verdi.'
