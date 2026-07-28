-- Sprint P0.10 — Founder Sunset. Il momento di installazione dell'app non è
-- una fonte affidabile lato server (nessuna colonna app-side arriva prima
-- della prima sync riuscita); la sola fonte di verità per l'eligibility resta
-- l'orologio del database e auth.users.created_at, mai un timestamp inviato
-- dal client.
--
-- Estende IN PLACE private.grant_founder_launch_core(uuid, uuid) — stessa
-- firma, stesso contratto JSON già consumato da record_first_sync_transition
-- e da /api/v1/sync (Build 189): nessun secondo motore di grant, nessuna RPC
-- nuova. Aggiunge due condizioni di non-eligibility, valutate DOPO il
-- fast-path "già pro" (i Founder già assegnati e qualunque altro ruolo pro
-- esistente — Google Play/Apple IAP/Stripe/trial/grandfathering/App Review —
-- restano intoccati, mai rivalutati contro il cutoff) e PRIMA del lock/cap:
--
--   1. auth.users.created_at >= FOUNDER_END_AT (2026-07-31T22:00:00Z, cioè
--      2026-08-01T00:00:00+02:00 CEST — unica fonte di verità, identica a
--      lib/founder/program-window.ts, verificata dal guardrail
--      founder:window-check) -> notEligibleReason = 'program_closed'.
--      Un account registrato ESATTAMENTE al cutoff non è eligible (>=, non
--      solo >, simmetrico allo stretto `<` di isFounderProgramOpen lato TS).
--
--   2. prima sync riuscita oltre 14 giorni dalla registrazione (now() >
--      created_at + interval '14 days') -> notEligibleReason =
--      'window_expired'. Al limite esatto dei 14 giorni (now() = created_at
--      + 14gg) resta eligible (<=).
--
-- Non toccato: cap 1000 (atomico via advisory lock, invariato), esclusioni
-- email (.invalid, review@fitmesh.fit, appreview.demo@fitmesh.fit,
-- invariate), fast-path/ricontrollo post-lock "già pro" (invariati — è
-- questo che garantisce che nessun Founder esistente o ruolo pro da
-- acquisto/trial venga mai rivalutato contro cutoff/finestra), idempotenza
-- (ON CONFLICT DO NOTHING, invariato), retry/doppio device (invariati, la
-- funzione resta pura rispetto allo stato salvato, nessuna scrittura fuori
-- da user_roles).
--
-- Reinstallazione dell'app: non esiste alcun concetto di "installazione" in
-- questa funzione (mai un timestamp client), quindi una reinstallazione non
-- può in alcun modo riavviare l'eligibility — created_at di auth.users non
-- cambia mai per lo stesso account.
--
-- Cancellazione GDPR: se l'account viene cancellato, auth.users.id non
-- esiste più; `select email into v_email from auth.users where id =
-- p_user_id` non trova righe (v_email resta NULL), la funzione ritorna
-- 'excluded_account' come già faceva per qualunque id sconosciuto — nessun
-- comportamento nuovo introdotto da questa migration su quel percorso.
--
-- NON APPLICATA in produzione da questo commit: richiede snapshot pre-apply,
-- suite di test locale e GO esplicito di Matteo (vedi report P0.10).

create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  founder_cap constant int := 1000;
  founder_cutoff constant timestamptz := '2026-07-31T22:00:00Z'::timestamptz;
  founder_window constant interval := interval '14 days';
  v_email text;
  v_created_at timestamptz;
  v_taken int;
  v_rows int;
begin
  if p_user_id is null or p_device_id is null then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'missing_context'
    );
  end if;

  -- Prova indipendente di sync riuscito (difesa in profondita': il
  -- chiamante gia' verifica questo prima di arrivare qui, ma non ci
  -- fidiamo comunque).
  if not exists (
    select 1 from public.fitness_metrics
    where user_id = p_user_id and device_id = p_device_id
  ) then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'no_metrics_evidence'
    );
  end if;

  select email into v_email from auth.users where id = p_user_id;
  if v_email is null or v_email ilike '%.invalid' or lower(v_email) = lower('review@fitmesh.fit') or lower(v_email) = lower('appreview.demo@fitmesh.fit') then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account'
    );
  end if;

  -- Fast path pre-lock: puramente un'ottimizzazione (evita di prendere il
  -- lock per il caso comune "utente gia' Founder o gia' pro da qualunque
  -- altra fonte"), MAI la fonte di verita'. Un ruolo pro esistente (Google
  -- Play/Apple IAP/Stripe/trial/grandfathering/App Review/founder-launch)
  -- esce qui, PRIMA di qualunque valutazione di cutoff/finestra: non deve
  -- mai essere sovrascritto ne' rivalutato.
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null
    );
  end if;

  -- P0.10: eligibility sul cutoff del programma, sempre e solo da
  -- auth.users.created_at (mai un timestamp client). >= perche' una
  -- registrazione ESATTAMENTE al cutoff non e' eligible (simmetrico allo
  -- stretto `<` di isFounderProgramOpen lato TypeScript).
  select created_at into v_created_at from auth.users where id = p_user_id;
  if v_created_at is null or v_created_at >= founder_cutoff then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'program_closed'
    );
  end if;

  -- P0.10: finestra individuale di 14 giorni dalla registrazione, misurata
  -- dall'orologio del database (now()) al momento della prima sync
  -- REALMENTE riuscita (questa funzione viene chiamata esattamente in quel
  -- momento da record_first_sync_transition). Al limite esatto dei 14
  -- giorni resta eligible (<=).
  if now() > v_created_at + founder_window then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'window_expired'
    );
  end if;

  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));

  -- Ricontrollo POST-lock: fonte di verita'. Una chiamata concorrente per
  -- lo STESSO utente (due device, un retry di rete) puo' aver gia' inserito
  -- il ruolo mentre questa chiamata attendeva il lock.
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null
    );
  end if;

  -- Cap contato per utente distinto, non per riga.
  select count(distinct user_id) into v_taken from public.user_roles where note = 'founder-launch';
  if v_taken >= founder_cap then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached'
    );
  end if;

  insert into public.user_roles (user_id, role, expires_at, note)
  values (p_user_id, 'pro', null, 'founder-launch')
  on conflict (user_id, role) do nothing;
  get diagnostics v_rows = row_count;

  return jsonb_build_object(
    'grantCreated', v_rows > 0, 'alreadyHadEligibleGrant', v_rows = 0,
    'grantKind', case when v_rows > 0 then 'founder-launch' else null end,
    'capReached', false, 'notEligibleReason', null
  );
end;
$$;

revoke all on schema private from public, anon, authenticated;
revoke all on function private.grant_founder_launch_core(uuid, uuid) from public, anon, authenticated;

-- Dopo l'apply: rieseguire get_advisors(security) — verificare che la
-- funzione non risulti "SECURITY DEFINER senza search_path fisso" e che
-- private.grant_founder_launch_core non risulti eseguibile da alcun ruolo
-- pubblico. Verificare inoltre: select count(distinct user_id) from
-- public.user_roles where note = 'founder-launch' PRIMA e DOPO l'apply
-- (deve restare identico: questa migration non tocca righe esistenti).
