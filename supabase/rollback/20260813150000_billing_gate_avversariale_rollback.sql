-- ============================================================================
-- ROLLBACK di 20260813150000_billing_gate_avversariale.sql
--
-- Toglie le correzioni nate dalla review avversariale su 232bd6c. Vale la pena
-- scrivere COSA si riapre, perche' non sono raffinamenti:
--
--   * le revoche in attesa spariscono. Un rimborso saputo quando l'acquisto non
--     era ancora nel registro torna a essere BUTTATO VIA, e il claim successivo
--     torna a concedere il Pro su un acquisto rimborsato. Le righe ancora in
--     attesa al momento del rollback vanno esportate PRIMA (vedi sotto): sono
--     soldi.
--   * il cancello Sandbox torna a vivere solo nella route. Chi scrive nel
--     registro senza passare di li' non incontra piu' nessun controllo.
--   * la scadenza di un permesso Sandbox torna a non togliere il Pro che aveva
--     concesso.
--   * `gdpr_process_deletions()` torna all'ordine b2c->utente, cioe' in
--     deadlock con `claim_store_purchase`. Questo pero' non e' un problema DOPO
--     un rollback completo, perche' a quel punto claim_store_purchase non
--     esiste piu': ha senso solo se si annulla QUESTA migration da sola, e in
--     quel caso il deadlock torna.
--
-- Uso:
--   psql -v ON_ERROR_STOP=1 -f 20260813150000_billing_gate_avversariale_rollback.sql
-- ============================================================================

\set ON_ERROR_STOP on

begin;

-- ── Prima di cancellare: dire ad alta voce cosa si sta perdendo ────────────
do $$
declare v_attese int;
begin
  select count(*) into v_attese from private.billing_pending_revocations;
  if v_attese > 0 then
    raise warning
      'rollback: % revoche in attesa vengono cancellate. Sono rimborsi gia'' noti ad Apple ma non ancora applicati al loro acquisto: esportarle PRIMA con  select * from private.billing_pending_revocations;  altrimenti quei clienti restano Pro su acquisti rimborsati e nessuno lo sapra'' piu''.',
      v_attese;
  end if;
exception
  when undefined_table then
    null;
end $$;

-- ── Il lavoro periodico ───────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from cron.job where jobname = 'billing-apply-pending-revocations') then
    perform cron.unschedule('billing-apply-pending-revocations');
  end if;
exception
  when undefined_table then
    null;
end $$;

drop function if exists private.billing_apply_pending_revocations(int);

-- ── Il cancello Sandbox sul registro ──────────────────────────────────────
drop trigger if exists trg_billing_cancello_sandbox on private.billing_purchase_claims;
drop function if exists private._billing_cancello_sandbox();
drop function if exists private.billing_teardown_sandbox_reviewer(uuid);

-- ── Le revoche in attesa ──────────────────────────────────────────────────
drop table if exists private.billing_pending_revocations;

-- ── Il GDPR torna com'era in 20260616090000 ───────────────────────────────
--
-- Riportato per intero e non "toccato", perche' un rollback che lascia meta'
-- della correzione e' peggio di nessuno dei due stati: nessuno saprebbe piu'
-- quale delle due versioni sta girando.
create or replace function public.gdpr_process_deletions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  n integer := 0;
begin
  for uid in
    select pc.user_id
    from public.privacy_consents pc
    where pc.data_deletion_requested_at is not null
      and pc.data_deletion_completed_at is null
      and pc.data_deletion_requested_at < now() - interval '24 hours'
  loop
    begin
      delete from public.profiles where id = uid;
      delete from auth.users where id = uid;
      n := n + 1;
    exception when others then
      raise warning 'gdpr deletion skipped for %: %', uid, sqlerrm;
    end;
  end loop;
  return n;
end;
$$;

revoke all on function public.gdpr_process_deletions() from public, anon, authenticated;

comment on function public.gdpr_process_deletions() is null;

-- `claim_store_purchase`, `record_store_purchase_revocation` e
-- `_billing_project_entitlement` NON si toccano qui: questa migration le
-- riscrive con `create or replace`, e a rimuoverle e' il rollback della
-- migration che le ha create. Provare a "ripristinarne la versione
-- precedente" da qui significherebbe tenerne due copie in due file, e prima o
-- poi divergerebbero.

commit;

\echo 'rollback 20260813150000 eseguito.'
\echo 'ATTENZIONE: un rimborso che arriva prima del claim torna a essere scartato.'
