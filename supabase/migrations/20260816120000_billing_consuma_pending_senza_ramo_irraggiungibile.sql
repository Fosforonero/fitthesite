-- ============================================================================
-- L'AUTORITA' PERDE UN RAMO CHE NON PUO' ESSERE RAGGIUNTO
--
-- `private._billing_consuma_pending` cancella una revoca in attesa se e' stata
-- PERSISTITA, se e' stata SUPERATA da evidenza piu' recente, oppure — terzo
-- ramo — se il PROPRIETARIO dell'acquisto e' stato cancellato.
--
-- Il terzo ramo non e' raggiungibile:
--
--   * `private.billing_apply_pending_revocations` joina i claim con
--     `owner_user_id is not null`, quindi una pending orfana non entra MAI nel
--     ciclo che chiama l'autorita';
--   * `claim_store_purchase` con owner NULL ritorna `owned_by_other_user`
--     PRIMA di leggere le pending.
--
-- Resta un solo ingresso teorico: l'utente cancellato nella finestra fra la
-- SELECT del ciclo e la rilettura dentro l'autorita'. In quella finestra il
-- ramo cancella l'ultima copia di un rimborso mai persistito — e il danno e'
-- nullo solo perche' l'account non esiste piu'. E' una scommessa che non paga
-- niente: il default «nel dubbio la riga resta» e' gia' la risposta giusta, e
-- una riga in attesa su una chiave orfana non fa male a nessuno.
--
-- Prova che il ramo non serve: `v_owner_mancante := false;` sopravvive
-- all'intera suite. Un ramo che nessun test puo' distinguere da una costante
-- non e' coperto: e' solo codice in piu' che qualcuno un giorno leggera' come
-- se fosse una regola.
--
-- ── COSA CAMBIA E COSA NO ─────────────────────────────────────────────────
--
-- Cambia solo la condizione di uscita: da
--     if not (v_persistita or v_superata or v_owner_mancante) then return false;
-- a
--     if not (v_persistita or v_superata) then return false;
-- e spariscono la variabile e la query che la riempiva — una SELECT su
-- billing_purchase_claims a ogni chiamata, che adesso non si fa piu'.
--
-- NON cambia la postcondizione: la DELETE resta qui dentro e resta l'unica
-- viva, come pretende 92B.
--
--   md5(pg_get_functiondef) della definizione sostituita:
--     aa1eed837011f4e400c87fcc4d67bc31
-- ============================================================================

do $$
declare v_md5 text;
begin
  select md5(pg_catalog.pg_get_functiondef(p.oid)) into v_md5
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = '_billing_consuma_pending';

  if v_md5 is null then
    raise exception 'private._billing_consuma_pending non esiste: applicare prima 20260815120000';
  end if;
  if v_md5 <> 'aa1eed837011f4e400c87fcc4d67bc31' then
    raise exception
      'l''autorita'' viva NON e'' quella attesa (md5 % invece di aa1eed837011f4e400c87fcc4d67bc31): rifare il diff prima di applicare.', v_md5;
  end if;
end $$;

CREATE OR REPLACE FUNCTION private._billing_consuma_pending(p_billing_source text, p_ownership_key text, p_store_event_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  s record;
  v_persistita boolean := false;
  v_superata   boolean := false;
begin
  -- La riga esatta che il chiamante ha letto, non "la riga di quella chiave":
  -- se nel frattempo ne fosse arrivata una piu' recente, quella deve
  -- sopravvivere e aspettare il proprio giro.
  select * into r
  from private.billing_pending_revocations p
  where p.billing_source = p_billing_source
    and p.ownership_key  = p_ownership_key
    and p.store_event_at = p_store_event_at;

  -- Gia' consumata da qualcun altro: non e' un errore.
  if not found then
    return true;
  end if;

  select * into s
  from private.billing_purchase_states t
  where t.billing_source = p_billing_source
    and t.ownership_key  = p_ownership_key;

  if found then
    v_persistita := s.state = 'revoked'
      and not private._billing_evidenza_supera(
            s.store_event_source, s.store_event_at, s.state,
            r.store_event_source, r.store_event_at, 'revoked');

    v_superata := private._billing_evidenza_supera(
            r.store_event_source, r.store_event_at, 'revoked',
            s.store_event_source, s.store_event_at, s.state);
  end if;

  -- Due condizioni, non tre. Il ramo sul proprietario cancellato e' stato
  -- tolto: non era raggiungibile, e nell'unica corsa che lo sfiorava
  -- cancellava l'ultima copia di un rimborso. Nel dubbio la riga resta.
  if not (v_persistita or v_superata) then
    return false;
  end if;

  delete from private.billing_pending_revocations p
   where p.billing_source = p_billing_source
     and p.ownership_key  = p_ownership_key
     and p.store_event_at = p_store_event_at;

  return true;
end;
$function$
;

comment on function private._billing_consuma_pending(text, text, timestamptz) is
  'Unica autorita'' che puo'' cancellare da private.billing_pending_revocations. '
  'Cancella SOLO se la revoca risulta persistita o superata da evidenza piu'' '
  'recente, verificate rileggendo lo stato registrato. In ogni altro caso la '
  'riga resta e la rete di riserva la riprovera''. Nessun ramo sul proprietario '
  'cancellato: non era raggiungibile e cancellava l''ultima copia di un rimborso.';
