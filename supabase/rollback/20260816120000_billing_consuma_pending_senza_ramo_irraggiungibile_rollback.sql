-- ============================================================================
-- ROLLBACK di 20260816120000_billing_consuma_pending_senza_ramo_irraggiungibile
--
-- Ripristina la definizione ESATTA precedente, md5(pg_get_functiondef) =
-- aa1eed837011f4e400c87fcc4d67bc31, estratta dal catalogo e non riscritta.
--
-- Rimette dentro il ramo sul proprietario cancellato: irraggiungibile per i
-- due chiamanti, ma nell'unica corsa che lo sfiora cancella l'ultima copia di
-- un rimborso mai persistito. Serve solo se la rimozione avesse rotto qualcosa
-- che non abbiamo previsto.
-- ============================================================================

CREATE OR REPLACE FUNCTION private._billing_consuma_pending(p_billing_source text, p_ownership_key text, p_store_event_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  s record;
  v_owner_mancante boolean;
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

  select c.owner_user_id is null into v_owner_mancante
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source
    and c.ownership_key  = p_ownership_key;
  v_owner_mancante := coalesce(v_owner_mancante, false);

  if not (v_persistita or v_superata or v_owner_mancante) then
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

do $$
declare v_md5 text;
begin
  select md5(pg_catalog.pg_get_functiondef(p.oid)) into v_md5
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = '_billing_consuma_pending';
  if v_md5 <> 'aa1eed837011f4e400c87fcc4d67bc31' then
    raise exception 'rollback NON fedele: md5 % invece di aa1eed837011f4e400c87fcc4d67bc31', v_md5;
  end if;
  raise notice 'rollback 20260816120000 eseguito: ramo sul proprietario cancellato ripristinato.';
end $$;
