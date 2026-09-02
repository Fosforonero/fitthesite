-- ============================================================================
-- PENDING_191 — NON APPLICARE NELLA FINESTRA 190
--
-- Proposta, scritta come file, MAI eseguita su produzione (nessun
-- apply_migration lanciato per questo file). Nasce dalla riconciliazione
-- manuale del 02/09/2026 (vedi memoria
-- apple-restore-tombstone-katie-reconciliation): get_dashboard_snapshot()
-- conta le vendite leggendo solo public.b2c_subscriptions, che è la
-- proiezione degli ENTITLEMENT collegati, non il registro delle VENDITE
-- VERIFICATE dallo store. Una vendita con JWS/ricevuta verificata ma il cui
-- claim è tombstone (proprietario cancellato, in attesa di riacquisizione)
-- esiste per lo store ma sparisce da b2c_subscriptions finché non viene
-- ricollegata — la dashboard può quindi sottocontare le vendite reali senza
-- che nulla segnali l'errore. Vedi
-- fitthesite/app/api/v1/billing/validate-purchase per il percorso di
-- verifica JWS/ricevuta a monte di private.billing_purchase_claims.
-- ============================================================================
-- COSA FA QUESTO FILE (proposta)
-- ------------------------------
-- Aggiunge UNA nuova funzione, `get_dashboard_snapshot_verified_sales()`,
-- separata da `get_dashboard_snapshot()` (che NON viene toccata: nessun
-- CREATE OR REPLACE su una funzione viva). Espone SOLO conteggi aggregati
-- per piattaforma da private.billing_purchase_claims/billing_purchase_states/
-- billing_riacquisizioni — zero user_id, email, JWS, Order ID o transaction
-- ID. Ammette che tre quantità sono diverse e le tiene separate:
--
--   verified_claims   = count(*) da billing_purchase_claims, per piattaforma
--                        e prodotto — "questa transazione store esiste ed è
--                        stata verificata", indipendentemente da chi la
--                        possiede oggi.
--   linked            = count(*) dove owner_user_id is not null — collegata
--                        a un account vivo oggi (quello che proietta su
--                        b2c_subscriptions e che get_dashboard_snapshot()
--                        già conta).
--   tombstoned        = count(*) dove owner_user_id is null AND
--                        anonymized_at is not null — verificata, proprietario
--                        cancellato, in attesa di Restore/riacquisizione.
--                        NON è "persa": è "temporaneamente non collegata".
--
-- Più `reacquisitions_total` da billing_riacquisizioni (quante tombstone
-- sono state riprese, mai quali). L'obiettivo NON è sostituire
-- get_dashboard_snapshot(): è dare alla dashboard un secondo blocco che le
-- permetta di mostrare "vendite verificate" ed "entitlement collegati" come
-- due numeri distinti invece di uno solo che li confonde — esattamente la
-- separazione che oggi il file HTML ricostruisce a mano con una
-- riconciliazione manuale periodica (RECONCILIATION in
-- dashboard-locale.html), da sostituire con questa funzione quando verrà
-- applicata.
--
-- COSA NON FA
-- -----------
-- Non scrive niente. Non tocca billing_purchase_claims, billing_purchase_
-- states, billing_riacquisizioni, b2c_subscriptions, user_roles. Non
-- modifica get_dashboard_snapshot() né get_dashboard_snapshot_admin(). Non
-- concede permessi a nessuno finché non viene applicata — la GRANT qui sotto
-- è parte della proposta, non un fatto compiuto.
--
-- PERCHÉ RESTA FUORI DALLA 190
-- -----------------------------
-- La 190 è in review: zero DDL, zero RPC nuove finché non chiude. Questo
-- file è la proposta pronta per quando la finestra si apre, non un debito
-- nascosto: SNAPSHOT_PAYMENT_DEFINITION_INCOMPLETE resta lo stato
-- dichiarato finché questa (o una soluzione equivalente) non è applicata.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_snapshot_verified_sales()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private', 'auth'
AS $function$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with claim_rows as (
    select
      c.billing_source,
      c.external_product_id,
      (c.owner_user_id is not null) as is_linked,
      (c.owner_user_id is null and c.anonymized_at is not null) as is_tombstoned
    from private.billing_purchase_claims c
  ),
  by_platform as (
    select
      billing_source,
      count(*) as verified_claims,
      count(*) filter (where is_linked) as linked,
      count(*) filter (where is_tombstoned) as tombstoned
    from claim_rows
    group by billing_source
  )
  select jsonb_build_object(
    'generated_at', now(),
    'note', 'verified_claims/linked/tombstoned sono conteggi da private.billing_purchase_claims — zero PII, zero identificativi store',
    'by_platform', (
      select coalesce(jsonb_object_agg(billing_source, jsonb_build_object(
        'verifiedClaims', verified_claims,
        'linked', linked,
        'tombstoned', tombstoned
      )), '{}'::jsonb)
      from by_platform
    ),
    'reacquisitions_total', (select count(*) from private.billing_riacquisizioni)
  )
  into v_result;

  return v_result;
end;
$function$;

-- Stesso schema di autorizzazione già in produzione per
-- get_dashboard_snapshot_admin (migration 20260901121214 + revoke_anon
-- 20260901121244): revoke esplicito da public E da anon (il progetto
-- concede EXECUTE ad anon di default sulle funzioni nuove in public — non è
-- un pseudo-ruolo PUBLIC, va tolto a mano, vedi commento in
-- 20260901121244_dashboard_snapshot_admin_wrapper_revoke_anon.sql).
REVOKE ALL ON FUNCTION public.get_dashboard_snapshot_verified_sales() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_snapshot_verified_sales() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_snapshot_verified_sales() TO authenticated;
