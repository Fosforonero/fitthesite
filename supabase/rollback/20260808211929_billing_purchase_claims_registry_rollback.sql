-- ============================================================================
-- ROLLBACK di supabase/migrations/20260808211929_billing_purchase_claims_registry.sql
--
-- NON e' una migration attiva. Vive fuori da supabase/migrations/ apposta: se
-- stesse li' la CLI la eseguirebbe subito dopo la migration diretta,
-- annullandola nello stesso identico `supabase start`. Va eseguita a mano,
-- consapevolmente, contro il database che si vuole riportare indietro:
--
--   psql "$DB_URL" -f supabase/rollback/20260808211929_billing_purchase_claims_registry_rollback.sql
--
-- COSA RIMUOVE
--   public.claim_store_purchase(...)                       (funzione)
--   private._billing_purchase_claims_immutable()           (trigger function)
--   private._billing_purchase_claims_no_truncate()         (trigger function)
--   private.billing_purchase_claims                        (tabella + indici)
--
-- COSA NON TOCCA
--   public.b2c_subscriptions, in nessun modo: la migration diretta non l'ha
--   mai alterata e questo rollback nemmeno. Nessuna riga di entitlement viene
--   letta, scritta o cancellata.
--   Lo schema private, che ospita anche founder_seats e founder_evaluations e
--   quindi NON va eliminato.
--
-- QUELLO CHE SI PERDE E NON TORNA
--   Il registro E' il dato. Eliminare la tabella significa che ogni acquisto
--   gia' reclamato torna reclamabile da chiunque ripresenti la stessa
--   transazione, cioe' riapre esattamente il difetto HIGH che la migration
--   chiudeva. Per questo il guard sotto RIFIUTA di procedere se il registro
--   contiene anche una sola riga.
--
-- SE IL GUARD BLOCCA E SI VUOLE PROCEDERE COMUNQUE
--   1. esportare prima, fuori dal database:
--        \copy (select billing_source, ownership_key, external_transaction_id,
--                      external_product_id, owner_user_id, environment,
--                      app_account_token, claimed_at, anonymized_at
--               from private.billing_purchase_claims)
--          to 'billing_purchase_claims_backup.csv' with (format csv, header)
--   2. solo dopo, rieseguire questo file con:
--        psql "$DB_URL" -v claims_rollback_force=1 -f <questo file>
--      (senza la variabile il guard resta attivo: e' voluto)
-- ============================================================================

\set ON_ERROR_STOP on

\if :{?claims_rollback_force}
\else
\set claims_rollback_force 0
\endif

-- L'interpolazione della variabile psql avviene qui, fuori da qualunque
-- stringa dollar-quoted (dentro un blocco $$ ... $$ psql non sostituisce
-- nulla). Il valore viaggia poi come GUC di sessione, che il DO block sotto
-- puo' leggere.
select set_config('claims.rollback_force', :'claims_rollback_force', false);

do $$
declare
  v_rows bigint;
  v_force boolean := (current_setting('claims.rollback_force', true) = '1');
begin
  if to_regclass('private.billing_purchase_claims') is null then
    raise notice 'rollback: private.billing_purchase_claims non esiste, niente da proteggere.';
    return;
  end if;

  execute 'select count(*) from private.billing_purchase_claims' into v_rows;

  if v_rows > 0 and not v_force then
    raise exception
      'rollback rifiutato: private.billing_purchase_claims contiene % righe. Eliminare la tabella rende quegli acquisti di nuovo reclamabili da un altro utente. Esportare prima (vedi testata del file), poi rieseguire con -v claims_rollback_force=1.',
      v_rows;
  end if;

  if v_rows > 0 then
    raise warning 'rollback forzato: % righe di proprieta'' stanno per essere eliminate.', v_rows;
  end if;
end $$;

-- La funzione va rimossa per prima: e' l'unico scrittore del registro.
drop function if exists public.claim_store_purchase(
  text, text, uuid, text, text, timestamptz, text, boolean, text, uuid, text, text, jsonb
);

drop trigger if exists trg_billing_purchase_claims_immutable
  on private.billing_purchase_claims;
drop trigger if exists trg_billing_purchase_claims_no_truncate
  on private.billing_purchase_claims;

drop function if exists private._billing_purchase_claims_immutable();
drop function if exists private._billing_purchase_claims_no_truncate();

-- Gli indici (billing_purchase_claims_transaction_id_idx,
-- billing_purchase_claims_owner_idx) cadono con la tabella.
drop table if exists private.billing_purchase_claims;

-- Lo schema private resta: ci vivono founder_seats e founder_evaluations.

-- La riga di storico va tolta insieme agli oggetti, altrimenti il database
-- resterebbe a dichiarare applicata una migration i cui oggetti non esistono
-- piu': `supabase db push` la salterebbe e la correzione non tornerebbe mai
-- da sola. Non e' un dettaglio di pulizia, e' cio' che rende il rollback
-- reversibile.
delete from supabase_migrations.schema_migrations where version = '20260808211929';
