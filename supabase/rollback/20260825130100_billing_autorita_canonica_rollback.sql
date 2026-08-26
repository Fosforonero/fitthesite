-- ============================================================================
-- ROLLBACK di F2 — via l'autorita' canonica: 18 funzioni e 5 trigger.
--
-- L'elenco e' DERIVATO: le sei forward-only sono state applicate una per volta
-- su un PG17 ricostruito e si e' guardato il delta dell'impronta. Contarle per
-- nome dava 17, poi 18: due risposte diverse alla stessa domanda, perche' i
-- nomi non seguono una regola sola.
--
-- I trigger vanno prima delle funzioni: dipendono da loro.
-- ============================================================================
drop trigger if exists trg_billing_cancello_sandbox on private.billing_purchase_claims;
drop trigger if exists trg_billing_purchase_claims_immutable on private.billing_purchase_claims;
drop trigger if exists trg_billing_purchase_claims_no_truncate on private.billing_purchase_claims;
drop trigger if exists billing_purchase_states_forward_only on private.billing_purchase_states;
drop trigger if exists trg_billing_permesso_sandbox_cambiato on private.billing_sandbox_reviewers;

drop function if exists public.claim_store_purchase(uuid, text, text, text, text, timestamptz, text, timestamptz, text);
drop function if exists public.record_store_purchase_revocation(text, text, text, timestamptz, text);
drop function if exists public.is_sandbox_reviewer(uuid);
drop function if exists private.set_billing_projection_guard_mode(text);
drop function if exists private.billing_apply_pending_revocations();
drop function if exists private.billing_reconcile_sandbox_projections();
drop function if exists private.billing_teardown_sandbox_reviewer(uuid);
drop function if exists private._billing_project_entitlement(uuid);
drop function if exists private._billing_consuma_pending(uuid, text, text);
drop function if exists private._billing_evidenza_supera(text, timestamptz, text, timestamptz);
drop function if exists private._billing_chiave_da_proiezione(text, text);
drop function if exists private._billing_cancello_sandbox();
drop function if exists private._billing_permesso_sandbox_cambiato();
drop function if exists private._billing_purchase_claims_immutable();
drop function if exists private._billing_purchase_claims_no_truncate();
drop function if exists private._billing_purchase_states_forward_only();
drop function if exists private._billing_lock_prima_di_cancellare_utente();
drop function if exists private._b2c_projection_guard();

do $$
declare v_resti text;
begin
  -- Si cerca per COMPORTAMENTO: tutto cio' che F2 ha creato, non un prefisso.
  select coalesce(string_agg(nome, ', ' order by nome), '') into v_resti from (
    select n.nspname || '.' || p.proname as nome
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'private' and (p.proname like '%billing%' or p.proname like '%b2c%'))
       or (n.nspname = 'public' and p.proname in
             ('claim_store_purchase','record_store_purchase_revocation','is_sandbox_reviewer'))
    union all
    select 'trigger:' || tgname from pg_trigger
    where not tgisinternal and (tgname like '%billing%' or tgname like '%b2c%')
      and tgname <> 'trg_b2c_subscriptions_updated_at'
      and tgname <> 'trg_billing_lock_before_user_delete'
  ) s;
  if v_resti <> '' then
    raise exception 'ROLLBACK F2: sopravvissuti: %', v_resti;
  end if;
  raise notice 'ROLLBACK F2: 18 funzioni e 5 trigger rimossi';
end $$;
