-- Cessione in favore dell'utente su iOS, finche' non esiste un percorso che
-- scriva `apple_iap`.
--
-- NOTA STORICA, perche' il repo racconti la verita': in produzione questa
-- funzione e' stata applicata due volte a distanza di minuti la sera del
-- 17/08/2026. La prima versione aveva due difetti trovati in revisione prima
-- che qualunque chiamante esistesse (vedi sotto). Questo file contiene la
-- versione FINALE: applicarlo a un database pulito produce esattamente lo
-- stato attuale, e la prima versione non e' mai stata raggiungibile.
--
-- ── PERCHE' ────────────────────────────────────────────────────────────────
--
-- `app/api/v1/billing/validate-purchase/route.ts` ha il ramo iOS e scrive
-- `billing_source: 'apple_iap'`, ma in produzione `b2c_subscriptions` ha 24
-- righe e ZERO sono `apple_iap`. Il percorso esiste e non e' mai riuscito.
--
-- Un cliente ha pagato su App Store il 05/08/2026 e non ha ricevuto Pro. Non
-- ce l'ha nemmeno localmente: `billing_service.dart` concede solo dopo che il
-- server ha validato, e in release il ramo senza validazione ritorna false.
--
-- Su Android il percorso Play funziona (sei righe `google_play`, l'ultima del
-- 14/08). **La situazione non e' simmetrica e non va trattata come tale.**
--
-- Decisione di Matteo, 17/08/2026: meglio concedere Pro a qualche utente iOS
-- con la prova scaduta che toglierlo a chi ha pagato Apple.
--
-- ── PERCHE' LA PIATTAFORMA LA DECIDE IL SERVER ─────────────────────────────
--
-- Era stato ipotizzato di far dichiarare la piattaforma al client. Non regge:
-- "sono iOS" sarebbe falsificabile, e un utente Android che lo dichiara
-- otterrebbe Pro gratis. Qui e' verificata dai dati (`source = 'healthkit'`),
-- lo stesso segnale con cui sono stati contati i 90 utenti iOS attivi. Come
-- effetto secondario la cessione non dipende dal rilascio di una build.
--
-- ── I DUE DIFETTI CORRETTI PRIMA DELL'INNESTO ──────────────────────────────
--
-- 1. NIENTE 500. `user_roles` ha PRIMARY KEY (user_id, role): un utente puo'
--    avere UNA sola riga `pro`. Un utente iOS con una riga pro SCADUTA supera
--    tutte le guardie, perche' `entitlement_core` ignora giustamente le righe
--    scadute, e l'insert violerebbe la chiave. L'eccezione risalirebbe fino
--    alla rotta di sync: 500 sull'endpoint che tiene in piedi il prodotto.
--    Non e' teorico: dei tre `ring-reward` a tempo ancora validi, **uno e' su
--    iOS**, e la prima scadenza e' il **13 febbraio 2027**. Era una mina con
--    una data sopra.
--
-- 2. IL PONTE SI RINNOVA finche' la causa esiste. Concedere una volta sola
--    per utente avrebbe ricreato lo stesso problema con una miccia di sei
--    mesi. Il rinnovo non diventa permanente e non richiede promemoria:
--    quando `apple_iap` comincera' a scrivere davvero, quell'utente avra'
--    `hasFullAccess` vero e la PRIMA guardia fermera' il rinnovo. **La
--    condizione di uscita e' automatica, non umana.**
--
-- La clausola `on conflict` rinnova SOLO una cessione gia' scaduta: founder,
-- grandfather, ring-reward e beta non vengono mai toccati.
--
-- `granted_by` resta nullo. La chiave esterna punta a `profiles` e nessun
-- profilo corrisponde al sistema: **nullo qui significa concessione
-- automatica, non dato mancante.**

create or replace function public.concedi_ponte_ios(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  v_ha_diritto boolean;
  v_e_ios boolean;
begin
  if p_user_id is null then
    return false;
  end if;

  select coalesce(
           (private.entitlement_core(p_user_id) ->> 'hasFullAccess')::boolean,
           false)
    into v_ha_diritto;
  if v_ha_diritto then
    return false;
  end if;

  select exists (
    select 1 from public.fitness_metrics
    where user_id = p_user_id and source = 'healthkit'
    limit 1
  ) into v_e_ios;
  if not v_e_ios then
    return false;
  end if;

  insert into public.user_roles (user_id, role, expires_at, note)
  values (
    p_user_id,
    'pro',
    pg_catalog.now() + interval '6 months',
    'cessione-ios-in-attesa-apple-iap'
  )
  on conflict (user_id, role) do update
    set expires_at = excluded.expires_at
  where public.user_roles.note like 'cessione-ios%'
    and public.user_roles.expires_at is not null
    and public.user_roles.expires_at <= pg_catalog.now();

  if not found then
    return false;
  end if;

  return true;
end
$fn$;

comment on function public.concedi_ponte_ios(uuid) is
  'Ponte temporaneo per utenti iOS senza diritto, finche non esiste un percorso che scrive apple_iap. Verifica la piattaforma dai dati, non dal chiamante. Si rinnova finche la causa esiste e si spegne da solo quando arriva una riga apple_iap vera (la prima guardia lo ferma). Non solleva mai eccezioni sulla chiave primaria (user_id, role). granted_by nullo significa concessione automatica, non dato mancante.';

-- Il chiamante legittimo e' la rotta di sync con la chiave di servizio, nel
-- ramo in cui negherebbe l'ingresso. Nessun client deve poterla chiamare: e'
-- una funzione che concede accesso.
revoke execute on function public.concedi_ponte_ios(uuid) from public;
revoke execute on function public.concedi_ponte_ios(uuid) from anon;
revoke execute on function public.concedi_ponte_ios(uuid) from authenticated;
