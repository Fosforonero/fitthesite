-- ============================================================================
-- ROLLBACK di 20260813103000_billing_sandbox_reviewers.sql
--
-- Toglie l'elenco degli account autorizzati a presentare transazioni Apple
-- Sandbox, e la funzione con cui il backend lo interroga.
--
-- CONSEGUENZA IMMEDIATA: TestFlight e App Review tornano a non poter comprare.
-- Comprano in Sandbox contro il backend di produzione, e senza questo elenco
-- ogni loro transazione viene respinta con `jws_sandbox_not_allowed`: il
-- revisore di Apple completa l'acquisto e vede un paywall. Non e' un
-- peggioramento marginale, e' iOS che torna non rilasciabile.
--
-- Non c'e' niente da esportare prima: le righe sono permessi temporanei, e la
-- loro sparizione non toglie nessun diritto a nessun cliente pagante.
--
-- Uso:
--   psql -v ON_ERROR_STOP=1 -f 20260813103000_billing_sandbox_reviewers_rollback.sql
-- ============================================================================

\set ON_ERROR_STOP on

begin;

do $$
declare v_attivi int;
begin
  select count(*) into v_attivi
  from private.billing_sandbox_reviewers
  where expires_at > now();

  if v_attivi > 0 then
    raise warning
      'rollback: % permessi Sandbox ancora attivi vengono revocati adesso. Se una revisione Apple e'' in corso, quel revisore smettera'' di poter comprare.',
      v_attivi;
  end if;
exception
  when undefined_table then
    null;
end $$;

drop function if exists public.is_sandbox_reviewer(uuid);
drop table if exists private.billing_sandbox_reviewers;

commit;

\echo 'rollback 20260813103000 eseguito: nessun account puo piu presentare transazioni Sandbox.'
\echo 'TestFlight e App Review NON possono completare un acquisto finche questa migration non viene riapplicata.'
