-- CONTROLLI POSITIVI per 01-test-is-admin.sql.
--
-- Un verde non vale niente finche' non si dimostra che la sonda sa diventare
-- rossa. Qui si ricostruiscono deliberatamente le condizioni difettose e si
-- verifica che vengano viste.
--
--   A, B, C  la ricorsione: il controllo 7
--   D        la scadenza:   il controllo 3
--
-- La prima stesura della parte A-B provava a innescare la ricorsione
-- attivando FORCE ROW LEVEL SECURITY, e NON ci riusciva. Non era un difetto
-- del controllo: era un'ipotesi sbagliata. FORCE vincola il proprietario
-- della tabella e non ha effetto su un ruolo che bypassa RLS, quindi con
-- is_admin() SECURITY DEFINER di postgres la ricorsione non arriva mai.
-- Le due configurazioni che la producono davvero sono quelle qui sotto.

\set ON_ERROR_STOP on

create role prova_definer_debole nologin;
grant usage on schema public, auth to prova_definer_debole;
grant select on public.user_roles to prova_definer_debole;
grant execute on function auth.uid() to prova_definer_debole;
grant prova_definer_debole to postgres;

create or replace function public.prova_is_admin() returns boolean
language sql stable security invoker set search_path = '' as $f$
  select case when auth.uid() is null then false
              else exists (select 1 from public.user_roles ur
                           where ur.user_id = auth.uid() and ur.role = 'admin'
                             and (ur.expires_at is null or ur.expires_at > now())) end
$f$;
grant execute on function public.prova_is_admin() to prova_definer_debole;

drop policy if exists "prova policy ricorsiva" on public.user_roles;
create policy "prova policy ricorsiva" on public.user_roles
  for select to prova_definer_debole using (public.prova_is_admin());

do $t$
declare
  r boolean;
  a_rossa boolean := false;
begin
  -- A) SECURITY INVOKER
  set local role prova_definer_debole;
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  begin
    select public.prova_is_admin() into r;
  exception when others then
    a_rossa := true;
    raise notice '  A) SECURITY INVOKER -> %', left(sqlerrm, 60);
  end;
  reset role;

  if not a_rossa then
    raise exception
      'CONTROLLO POSITIVO FALLISCE (A): con SECURITY INVOKER e una policy che '
      'richiama la funzione la ricorsione non si manifesta. La sonda non sa '
      'fallire, quindi il verde del controllo 7 non prova niente.';
  end if;
  raise notice 'A PASSA: con SECURITY INVOKER la ricorsione si manifesta.';
end
$t$;

-- B) SECURITY DEFINER, ma proprietario senza bypassrls
alter function public.prova_is_admin() security definer;
alter function public.prova_is_admin() owner to prova_definer_debole;

do $t$
declare
  r boolean;
  b_rossa boolean := false;
begin
  set local role prova_definer_debole;
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  begin
    select public.prova_is_admin() into r;
  exception when others then
    b_rossa := true;
    raise notice '  B) DEFINER senza bypassrls -> %', left(sqlerrm, 60);
  end;
  reset role;

  if not b_rossa then
    raise exception
      'CONTROLLO POSITIVO FALLISCE (B): un SECURITY DEFINER con proprietario '
      'privo di bypassrls dovrebbe ricorrere e non ricorre.';
  end if;
  raise notice 'B PASSA: con un definer senza bypassrls la ricorsione si manifesta.';
end
$t$;

-- C) e la funzione VERA, nelle stesse identiche condizioni, non ricorre.
-- (la concessione esplicita serve proprio perche' la forward-only ha revocato
--  EXECUTE da PUBLIC: e' il controllo 9 che funziona)
grant execute on function public.is_admin() to prova_definer_debole;
do $t$
declare r boolean;
begin
  set local role prova_definer_debole;
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  begin
    select public.is_admin() into r;
    raise notice 'C PASSA: la is_admin() vera, chiamata dallo stesso ruolo debole, risponde % senza ricorrere.', r;
  exception when others then
    reset role;
    raise exception 'C FALLISCE: la is_admin() vera ricorre o fallisce: %', sqlerrm;
  end;
  reset role;
end
$t$;

drop policy if exists "prova policy ricorsiva" on public.user_roles;
drop function if exists public.prova_is_admin();
revoke prova_definer_debole from postgres;
drop owned by prova_definer_debole;
drop role prova_definer_debole;

-- ---------------------------------------------------------------------------
-- D) CONTROLLO POSITIVO SULLA SCADENZA
--
-- Il controllo 3 di 01-test-is-admin.sql dice «admin scaduto -> false». Se la
-- funzione ignorasse expires_at quel controllo direbbe la stessa cosa? No, e
-- qui si prova: una copia della funzione SENZA il predicato di scadenza deve
-- rispondere TRUE all'admin scaduto. Se rispondesse false lo stesso, il
-- controllo 3 sarebbe verde per un motivo diverso da quello che dichiara, e
-- non proverebbe che la scadenza viene onorata.
-- ---------------------------------------------------------------------------
create or replace function public.prova_is_admin_senza_scadenza() returns boolean
language sql stable security definer set search_path = '' as $f$
  select case
    when auth.uid() is null then false
    else exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
      -- QUI MANCA APPOSTA: and (ur.expires_at is null or ur.expires_at > now())
    )
  end;
$f$;

do $t$
declare
  v_senza boolean;
  v_con   boolean;
begin
  -- L'utente 3 della fixture e' un admin SCADUTO da un giorno.
  perform set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

  select public.prova_is_admin_senza_scadenza() into v_senza;
  select public.is_admin()                      into v_con;

  if not v_senza then
    raise exception
      'CONTROLLO POSITIVO FALLISCE (D): la variante SENZA il controllo di '
      'expires_at risponde false all''admin scaduto. Vuol dire che il verde del '
      'controllo 3 non dipende dal predicato di scadenza, e quel controllo non '
      'sta provando quello che dichiara. Verificare la fixture: la riga admin '
      'scaduta esiste davvero?';
  end if;

  if v_con then
    raise exception
      'CONTROLLO POSITIVO FALLISCE (D): la funzione VERA risponde true a un '
      'admin scaduto. Il predicato di scadenza non sta funzionando.';
  end if;

  raise notice
    'D PASSA: sullo stesso admin scaduto la variante senza expires_at risponde %, '
    'la funzione vera risponde %. Il controllo 3 dipende davvero dal predicato '
    'di scadenza.', v_senza, v_con;
end
$t$;

drop function if exists public.prova_is_admin_senza_scadenza();

\echo 'Controlli positivi: A e B rosse, C verde, D dimostra che il controllo 3 sa fallire.'
