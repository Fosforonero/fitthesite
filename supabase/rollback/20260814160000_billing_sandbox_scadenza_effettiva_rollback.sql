-- ============================================================================
-- ROLLBACK di 20260814160000_billing_sandbox_scadenza_effettiva.sql
--
-- Cosa si riapre, detto per intero:
--
--   * togliere il permesso Sandbox torna a NON togliere il diritto. Il
--     runbook dice all'operatore di fare `delete from
--     private.billing_sandbox_reviewers` dopo l'approvazione: dopo questo
--     rollback quel DELETE lascia il Pro proiettato, e nessuno se ne accorge.
--   * un permesso che scade da solo lascia in `public.b2c_subscriptions` una
--     riga `active` su un diritto finito, e chi ha un acquisto di produzione
--     valido non se lo vede piu' davanti finche' qualcuno non ricalcola a mano.
--
-- `_billing_project_entitlement` NON si ripristina qui: questa migration la
-- riscrive con `create or replace`, e a rimuoverla e' il rollback della
-- migration che l'ha creata. Tenerne due copie in due file significa vederle
-- divergere. Conseguenza da sapere: annullando SOLO questa migration, il
-- limite di `active_until` alla scadenza del permesso resta in piedi — ed e'
-- la parte che regge senza che giri niente, quindi e' anche la meno urgente
-- da togliere.
--
-- Uso:
--   psql -v ON_ERROR_STOP=1 -f 20260814160000_billing_sandbox_scadenza_effettiva_rollback.sql
-- ============================================================================

\set ON_ERROR_STOP on

begin;

do $$
declare v_stantie int;
begin
  select count(*) into v_stantie
  from public.b2c_subscriptions t
  where t.external_subscription_id like 'sandbox:%'
    and t.state <> 'expired'
    and (t.active_until <= now() or not public.is_sandbox_reviewer(t.user_id));
  if v_stantie > 0 then
    raise warning
      'rollback: % proiezioni Sandbox scadute restano scritte come attive e nessun job le ricalcolera'' piu''. Sistemarle a mano PRIMA, oppure ricordarsi che quegli account non vedranno il diritto che hanno davvero.',
      v_stantie;
  end if;
exception
  when undefined_table or undefined_function then
    null;
end $$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'billing-reconcile-sandbox') then
    perform cron.unschedule('billing-reconcile-sandbox');
  end if;
exception
  when undefined_table or invalid_schema_name then
    null;
end $$;

drop trigger if exists trg_billing_permesso_sandbox_cambiato
  on private.billing_sandbox_reviewers;
drop function if exists private._billing_permesso_sandbox_cambiato();
drop function if exists private.billing_reconcile_sandbox_projections(int);

commit;

\echo 'rollback 20260814160000 eseguito.'
\echo 'ATTENZIONE: togliere il permesso Sandbox torna a lasciare il Pro proiettato.'
