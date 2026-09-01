-- ============================================================================
-- ROLLBACK di F3 — via la guardia sulla proiezione b2c.
--
-- F3 crea una funzione e due trigger su public.b2c_subscriptions. Nessuna
-- funzione preesistente viene toccata, quindi qui si lascia cadere e basta.
--
-- ATTENZIONE: `private._b2c_projection_guard` NON e' di F3, e' di F2. Qui si
-- toglie solo `_b2c_no_truncate`. Derivato applicando le sei una per volta e
-- guardando il delta, non leggendo i nomi.
-- ============================================================================
drop trigger if exists b2c_projection_guard on public.b2c_subscriptions;
drop trigger if exists trg_b2c_no_truncate on public.b2c_subscriptions;
drop function if exists private._b2c_no_truncate();

do $$
begin
  if exists (select 1 from pg_trigger where tgname in ('b2c_projection_guard','trg_b2c_no_truncate') and not tgisinternal) then
    raise exception 'ROLLBACK F3: un trigger della guardia e'' sopravvissuto';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='private' and p.proname='_b2c_no_truncate') then
    raise exception 'ROLLBACK F3: _b2c_no_truncate e'' sopravvissuta';
  end if;
  -- La proiezione stessa NON e' di questo lavoro e deve restare.
  if to_regclass('public.b2c_subscriptions') is null then
    raise exception 'ROLLBACK F3: b2c_subscriptions e'' sparita. Non era nostra da togliere.';
  end if;
  raise notice 'ROLLBACK F3: guardia rimossa, proiezione intatta';
end $$;
