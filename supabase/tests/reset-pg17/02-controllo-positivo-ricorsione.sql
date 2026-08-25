-- CONTROLLO POSITIVO del test 5.
--
-- Il test 5 dice «nessuna ricorsione». Un verde del genere non vale niente
-- finche' non si dimostra che la sonda sa diventare rossa.
--
-- La prima stesura di questo controllo provava a innescare la ricorsione
-- attivando FORCE ROW LEVEL SECURITY, e NON ci riusciva. Non era un difetto
-- del controllo: era un'ipotesi sbagliata. FORCE vincola il proprietario
-- della tabella e non ha effetto su un ruolo che bypassa RLS, quindi con
-- is_admin() SECURITY DEFINER di postgres la ricorsione non arriva mai.
--
-- Le due configurazioni che la producono davvero sono queste, misurate:
--   A) SECURITY INVOKER
--   B) SECURITY DEFINER con un proprietario privo di bypassrls
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
                           where ur.user_id = auth.uid() and ur.role = 'admin') end
$f$;
grant execute on function public.prova_is_admin() to prova_definer_debole;

drop policy if exists "prova policy ricorsiva" on public.user_roles;
create policy "prova policy ricorsiva" on public.user_roles
  for select to prova_definer_debole using (public.prova_is_admin());

do $t$
declare
  r boolean;
  a_rossa boolean := false;
  b_rossa boolean := false;
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
      'fallire, quindi il verde del test 5 non prova niente.';
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
--  EXECUTE da PUBLIC: e' il test 7 che funziona)
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

\echo 'CONTROLLO POSITIVO: la sonda sa fallire (A e B rosse) e la funzione vera resta verde (C).'
