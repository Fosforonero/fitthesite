-- ============================================================================
-- ROLLBACK di 20260812093000_billing_p0_nove_punti.sql
--
-- LEGGERE PRIMA supabase/rollback/README-rollback-applicativo.md.
--
-- ── QUESTO FILE NON RIPRISTINA UNO STATO PRECEDENTE ─────────────────────────
--
-- Va detto per primo, perche' e' la cosa che si sbaglia. La migration di cui
-- questo e' il rollback fa DUE cose diverse:
--
--   AGGIUNGE   una colonna, tre funzioni e due trigger che prima non c'erano.
--              Quelli si tolgono, ed e' cio' che fa questo file.
--
--   SOSTITUISCE il corpo di cinque funzioni che gia' esistevano
--              (_b2c_projection_guard, set_billing_projection_guard_mode,
--              _billing_purchase_states_forward_only, claim_store_purchase,
--              record_store_purchase_revocation). Un `create or replace` non
--              lascia da nessuna parte il corpo precedente: per riaverlo si
--              riapplicano 20260810140000 e 20260810120000, in quest'ordine.
--
-- E riapplicarle RIAPRE i difetti che quella migration ha chiuso. In chiaro,
-- perche' chi esegue un rollback alle tre di notte deve sapere cosa sta
-- riaccendendo:
--
--   1  il backfill torna a creare proprieta' senza stato, invisibili al
--      ricalcolo: quei clienti risultano non possedere niente;
--   2  il passaggio a strict torna a controllare l'utente invece della
--      transazione, e dichiara chiusa una finestra aperta;
--   3  fra il conteggio e il passaggio a strict torna a esserci una corsa;
--   4  una scrittura commerciale torna a poter sovrascrivere un Founder;
--   5  la guardia torna aggirabile dichiarando una fonte non commerciale, e
--      smette di coprire DELETE e TRUNCATE;
--   6  la freschezza torna a confrontare orologi non equivalenti, e uno stato
--      falso diventa non piu' correggibile;
--   7  l'ordine dei lock torna a essere invertito fra il percorso nuovo e
--      l'upsert della 189: deadlock, con claim_store_purchase come vittima —
--      cioe' il cliente che ha appena pagato.
--
-- Il rollback SENSATO, quando qualcosa va storto in produzione, e' il deploy di
-- una versione precedente nota-buona della route. Il database resta avanti, e
-- puo' farlo: il registro e' append-only e la proiezione e' derivata.
--
-- Uso:
--   psql -v ON_ERROR_STOP=1 -f 20260812093000_billing_p0_nove_punti_rollback.sql
-- ============================================================================

\set ON_ERROR_STOP on

begin;

-- ── I trigger, prima delle funzioni che eseguono ───────────────────────────

-- L'ordine unico dei lock imposto alla cancellazione account. Toglierlo
-- riapre il deadlock fra claim_store_purchase e auth.admin.deleteUser().
drop trigger if exists trg_billing_lock_before_user_delete on auth.users;
drop function if exists private._billing_lock_prima_di_cancellare_utente();

-- La difesa contro il TRUNCATE della proiezione. Senza, svuotare
-- public.b2c_subscriptions torna a essere una singola istruzione che toglie il
-- Pro a ogni cliente pagante, e nessun trigger di riga se ne accorge.
drop trigger if exists trg_b2c_no_truncate on public.b2c_subscriptions;
drop function if exists private._b2c_no_truncate();

-- ── Le funzioni aggiunte ───────────────────────────────────────────────────

-- La derivazione condivisa della chiave di proiezione. La usano la guardia, il
-- controllo di copertura e il backfill: dopo questo drop, quelle tre tornano
-- ad avere ciascuna la propria copia, che e' il modo in cui il backfill Google
-- era diventato non idempotente.
drop function if exists private._billing_chiave_da_proiezione(text, text);

-- La regola di precedenza fra evidenze. Viene droppata anche dal rollback di
-- 20260810120000; qui c'e' perche' questo file puo' essere eseguito da solo.
drop function if exists private._billing_evidenza_supera(
  text, timestamptz, text, text, timestamptz, text
);

-- ── La colonna ─────────────────────────────────────────────────────────────
--
-- `revocation_at` e' l'EFFICACIA del rimborso: la data che conta per il
-- supporto e per la contabilita'. Non ordina niente — quello lo fa
-- `store_event_at` — ma e' l'unico posto in cui quel dato esiste. Toglierla
-- significa perderlo per ogni revoca gia' registrata, quindi va fatto solo
-- dopo un export.
do $$
declare v_righe bigint;
begin
  select count(*) into v_righe
  from private.billing_purchase_states
  where revocation_at is not null;

  if v_righe > 0 then
    raise warning
      'rollback: % revoche perdono la data di efficacia del rimborso. Il fatto che siano revocate resta; QUANDO lo sono diventate no.',
      v_righe;
  end if;
exception
  when undefined_table or undefined_column then
    null; -- gia' tolta, o tabella gia' droppata da un rollback precedente
end $$;

alter table if exists private.billing_purchase_states
  drop column if exists revocation_at;

commit;

\echo 'rollback 20260812093000 eseguito: tolte le AGGIUNTE.'
\echo 'I corpi SOSTITUITI non tornano indietro da soli: riapplicare'
\echo '20260810140000 e poi 20260810120000, sapendo che riaprono i sette difetti'
\echo 'elencati in testa a questo file.'
