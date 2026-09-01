-- ============================================================================
-- ROLLBACK di F1 — via le cinque tabelle del registro.
--
-- Va eseguito DOPO quelli di F2 e F3: le loro funzioni e i loro trigger
-- dipendono da queste tabelle. Niente CASCADE: se qualcosa dipende ancora, il
-- rollback deve fermarsi e dirlo, non trascinarsi dietro oggetti che non sono
-- suoi.
-- ============================================================================
drop table if exists private.billing_pending_revocations;
drop table if exists private.billing_purchase_states;
drop table if exists private.billing_purchase_claims;
drop table if exists private.billing_sandbox_reviewers;
drop table if exists private.billing_projection_guard_mode;

do $$
declare v_resti text;
begin
  select coalesce(string_agg(c.relname, ', ' order by c.relname), '') into v_resti
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'private' and c.relkind = 'r'
    and c.relname in ('billing_pending_revocations','billing_purchase_states',
                      'billing_purchase_claims','billing_sandbox_reviewers',
                      'billing_projection_guard_mode');
  if v_resti <> '' then
    raise exception 'ROLLBACK F1: tabelle sopravvissute: %', v_resti;
  end if;
  raise notice 'ROLLBACK F1: cinque tabelle rimosse';
end $$;
