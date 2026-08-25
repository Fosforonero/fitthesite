-- ============================================================================
-- ROLLBACK DISTRUTTIVO di 20260810120000_billing_purchase_states.sql
--
-- LEGGERE PRIMA supabase/rollback/README-rollback-applicativo.md.
--
-- Questo file NON e' la leva da usare se qualcosa va storto in produzione. Un
-- rollback vero e' il deploy di una versione precedente nota-buona della route
-- e della RPC, che continua a verificare gli acquisti e a scrivere il registro.
-- Questo file serve solo a un database di prova, o a una decisione presa da una
-- persona dopo un export.
--
-- CHE COSA ELIMINA, E CHE COSA SUCCEDE DOPO
--
--   private.billing_purchase_states   lo STATO verificato di ogni acquisto.
--   public.claim_store_purchase       la versione B' (13 parametri).
--   public.record_store_purchase_revocation
--   private._billing_project_entitlement
--
-- Il registro della PROPRIETA' (private.billing_purchase_claims) NON viene
-- toccato: e' l'unica cosa che rende recuperabile tutto il resto, e ha un
-- rollback suo che si rifiuta di girare su una tabella non vuota.
--
-- Conseguenza da avere chiara prima di eseguire: senza la tabella degli stati
-- si perde la risposta alla domanda "quanto vale oggi ogni singolo acquisto".
-- La proprieta' resta, quindi nessuno puo' impadronirsi dell'acquisto di un
-- altro; ma il migliore diritto non e' piu' calcolabile, e la proiezione torna
-- a essere l'ultima cosa scritta — cioe' il difetto che questa migration
-- esiste per chiudere. Le due righe di stato per utente si ricostruiscono solo
-- rifacendo verificare gli acquisti dagli store.
--
-- La versione PRECEDENTE della RPC (12 parametri, commit 262ade1) NON viene
-- ricreata da questo file: ricrearla in silenzio significherebbe riattivare
-- last-write-wins senza che nessuno lo abbia deciso. Se serve davvero, si
-- riapplica quella migration esplicitamente.
--
-- Uso:
--   psql -v ON_ERROR_STOP=1 -f 20260810120000_billing_purchase_states_rollback.sql
--   psql -v ON_ERROR_STOP=1 -v states_rollback_force=1 -f ...   (tabella non vuota)
-- ============================================================================

\set ON_ERROR_STOP on

-- `:'states_rollback_force'` non definito diventa la stringa ':states_rollback_force'.
\if :{?states_rollback_force}
\else
  \set states_rollback_force 0
\endif

begin;

-- Stessa forma del rollback del registro: la variabile psql viene travasata in
-- un parametro di sessione, perche' dentro un blocco dollar-quoted psql non
-- sostituisce le variabili.
select set_config('states.rollback_force', :'states_rollback_force', false);

do $$
declare
  v_righe bigint;
  v_force text := current_setting('states.rollback_force', true);
begin
  select count(*) into v_righe from private.billing_purchase_states;

  if v_righe > 0 and coalesce(v_force, '0') <> '1' then
    raise exception
      'rollback rifiutato: private.billing_purchase_states contiene % righe. Eliminarle significa perdere lo stato verificato di altrettanti acquisti, e la proiezione tornerebbe a essere l''ultima scrittura invece del migliore diritto. Esportare prima, poi rieseguire con -v states_rollback_force=1.',
      v_righe
      using errcode = '42501';
  end if;

  if v_righe > 0 then
    raise warning 'rollback FORZATO: % righe di stato eliminate. Il registro della proprieta'' resta intatto.', v_righe;
  end if;
end $$;

-- Il trigger vieta la DELETE anche al proprietario della tabella: va tolto
-- prima, non aggirato con una disabilitazione temporanea che qualcuno potrebbe
-- dimenticare accesa.
drop trigger if exists billing_purchase_states_forward_only on private.billing_purchase_states;

-- ENTRAMBE le firme, e il motivo va letto invece che dedotto.
--
-- Questo file nasce quando la revoca aveva SEI parametri. La migration
-- 20260812093000 ne ha aggiunto un settimo (`p_revocation_at`, l'efficacia del
-- rimborso, separata dalla freschezza della fotografia) e ha eliminato la
-- vecchia, perche' due funzioni omonime a sei e sette argomenti rendono
-- ambigua una chiamata a sei.
--
-- `drop function` con la firma sbagliata NON e' un errore rumoroso: e'
-- `if exists`, quindi non trova niente e passa in silenzio. Il rollback
-- sembrava riuscito e lasciava in piedi la funzione a sette argomenti, che
-- dopo il `drop table` qui sotto avrebbe puntato a una tabella inesistente:
-- non un ripristino, uno stato che non e' mai esistito.
drop function if exists public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text
);
drop function if exists public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text, timestamptz
);
drop function if exists public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
);
drop function if exists private._billing_project_entitlement(uuid);
drop table if exists private.billing_purchase_states;
drop function if exists private._billing_purchase_states_forward_only();
-- Introdotta da 20260812093000 e usata SOLO dal solo-in-avanti: senza la
-- tabella non ha piu' niente da confrontare.
drop function if exists private._billing_evidenza_supera(
  text, timestamptz, text, text, timestamptz, text
);

commit;

\echo 'rollback 20260810120000 eseguito. private.billing_purchase_claims NON e stato toccato.'
\echo 'public.get_entitlement_status() resta nella versione corretta (active_until > server_now):'
\echo 'ripristinare quella vecchia riattiverebbe un abbonamento scaduto ma marcato active.'
