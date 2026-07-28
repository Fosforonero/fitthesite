-- Sprint P0.10E addendum — contratto entitlement server-authoritative.
--
-- Motivazione (audit app, Sprint P0.10A): il trial reale (14gg da
-- auth.users.created_at) e' oggi valutato interamente lato client con
-- l'orologio del dispositivo. Un rollback dell'orologio locale puo'
-- riattivare un trial gia' scaduto, perche' il client non ha alcuna fonte
-- di verita' server-side da confrontare. Questa funzione espone un'unica
-- RPC autenticata che calcola lo stato entitlement usando SOLO l'orologio
-- del server (clock_timestamp()), cosi' che il client possa: 1) sapere lo
-- stato reale indipendentemente dal proprio orologio, 2) rilevare uno
-- scarto sospetto confrontando il proprio now() con `serverNow` restituito.
--
-- La policy "verifica online almeno ogni 24h, rollback sospetto ->
-- verification_required" e' responsabilita' del client (fuori da questo
-- file): qui viene esposto solo cio' che serve per implementarla senza
-- fidarsi mai del clock locale come autorita' - in particolare `serverNow`
-- in ogni risposta.
--
-- account-safe: auth.uid() e' l'UNICO utente interrogabile (nessun
-- parametro user_id in input, nessun modo di leggere lo stato di un altro
-- account). idempotente: sola lettura, nessuna riga scritta.
--
-- Requisiti vincolanti confermati con Matteo dopo il draft consumer app
-- (commit 247fca9/0db854a, branch develop/post-189):
--   - nessun timestamp fornito dal client e' mai letto: la funzione non ha
--     PARAMETRI di alcun tipo, quindi non esiste un canale per iniettarne
--     uno (piu' forte di "lo ignoriamo": non puo' fisicamente arrivare).
--   - zero PII nella risposta: v_email e' usata SOLO internamente per il
--     confronto con l'alias App Review, mai incluso nel jsonb restituito.
--   - una contractVersion sconosciuta dal client deve degradare a
--     "serve verifica online", MAI concedere Pro per default — questo e'
--     un requisito lato CLIENT (non essendoci logica di versioning multipla
--     qui, la funzione restituisce sempre v_contract_version=1 finche' non
--     cambia la forma della risposta in modo incompatibile).
--   - il client cattura lo user id ad inizio richiesta e scarta la
--     risposta se l'account autenticato cambia prima del completamento —
--     anche questo e' un requisito lato CLIENT: dato che questa funzione
--     legge SEMPRE auth.uid() al momento della chiamata (mai un id passato
--     dal client), non esiste un modo per farle rispondere per un account
--     diverso da quello autenticato in quell'istante.
--
-- entitlementKind, in ordine di priorita' (il primo che matcha vince):
--   founder     -> user_roles(role='pro', note='founder-launch')
--   grandfather -> user_roles(role='pro', note ilike '%grandfather%')
--                  (il valore reale documentato e' 'grandfather-prelaunch',
--                  8 utenti permanenti senza sovrapposizione con
--                  founder-launch - fonte: docs/architecture/
--                  founder-p0-grant-design-v3.md sul branch
--                  feat/p11-founder-close-fase0, sezione "Stato live
--                  confermato" del 19-20/07/2026. Il match ilike copre
--                  quel valore. Il preflight P0.10E §16 lo riconferma
--                  comunque sui dati attuali: la fonte citata e' di dieci
--                  giorni fa e `note` non ha alcun CHECK constraint.)
--   lifetime    -> qualunque altra riga user_roles(role='pro') PERMANENTE
--                  (expires_at is null: es. 'beta-tester', o note non
--                  riconosciuta - bucket generico "accesso permanente
--                  non-Founder"), OPPURE una riga b2c_subscriptions con
--                  is_b2c_lifetime() vera (active_until oltre l'anno 9000)
--                  e state='active'
--   subscription -> un pro A TEMPO ancora valido (user_roles.expires_at nel
--                  futuro: reward Play +1 anno, ring-reward +6 mesi),
--                  OPPURE b2c_subscriptions con billing_source reale
--                  (google_play/apple_iap/stripe, MAI 'trial') e state in
--                  ('active','grace')
--   appReview   -> email = appreview.demo@fitmesh.fit (stesso alias gia'
--                  escluso da grant_founder_launch_core)
--   trial       -> auth.users.created_at + 14 giorni > now() server
--   none        -> nessuno dei precedenti
--
-- founderEligibility e' informativo/coarse: NON ri-esegue la logica di
-- private.grant_founder_launch_core (cutoff+finestra+cap+lock), che resta
-- l'unica fonte di verita' per la decisione reale al momento del primo
-- sync. Qui si limita a distinguere "gia' Founder" / "creato dopo il
-- cutoff, mai piu' possibile" / "creato prima del cutoff, esito dipende
-- dalla prima sync riuscita". founderWindowClosed e' lo stesso dato ridotto
-- a booleano (proposta lato app, doc AppFitmesh
-- docs/design/2026-07-28-trial-server-verification-contract-draft.md §6):
-- true per already_founder/program_closed (il client puo' smettere di
-- richiamare claim_founder_grant_if_eligible() ad ogni sign-in), false per
-- pending_first_sync. Puro risparmio di una RPC lato client, MAI una fonte
-- di autorizzazione: isFounder/hasFullAccess restano derivati solo da
-- user_roles.note lato app.
--
-- contrattoVersion/evaluationReason/offlineValidUntil aggiunti su richiesta
-- esplicita di Matteo dopo il draft consumer lato app (commit 247fca9,
-- branch develop/post-189): contractVersion e' un intero che il client
-- puo' controllare per rilevare un cambio di forma incompatibile;
-- evaluationReason e' la motivazione puntuale (un valore per ciascun ramo
-- sotto, piu' granulare di entitlementKind da solo, utile per telemetria/
-- debug); offlineValidUntil = serverNow + 24h e' la stessa soglia della
-- policy offline del draft app (punto 4: "oltre 24h senza verifica
-- riuscita -> serve rete"), calcolata QUI cosi' il client non deve
-- hardcodare "24 ore" per conto suo - se la soglia cambia, cambia solo qui.
--
-- Questa risposta e' SEMPRE uno snapshot completo e fresco (nessuna cache
-- lato server, nessun delta): un client che riceve una risposta fresca con
-- entitlementKind in (founder/grandfather/lifetime/subscription/appReview)
-- deve sovrascrivere per intero qualunque stato trial scaduto tenuto in
-- cache, mai fonderlo/preservarlo — non serve alcuna logica di merge lato
-- client, la priorita' e' gia' risolta qui (vedi ordine dei rami sotto).

create or replace function public.get_entitlement_status()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_contract_version constant int := 1;
  v_offline_grace constant interval := interval '24 hours';
  v_user_id uuid;
  v_created_at timestamptz;
  v_email text;
  v_server_now timestamptz := clock_timestamp();
  v_trial_ends_at timestamptz;
  v_trial_status text;
  v_kind text;
  v_expires_at timestamptz := null;
  v_founder_eligibility text;
  v_founder_window_closed boolean;
  v_evaluation_reason text;
  v_offline_valid_until timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select u.created_at, u.email into v_created_at, v_email
  from auth.users u
  where u.id = v_user_id;

  if v_created_at is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  v_trial_ends_at := v_created_at + interval '14 days';
  v_trial_status := case when v_server_now < v_trial_ends_at then 'active' else 'expired' end;

  -- `expires_at` (colonna reale, 20260610120001_user_roles_expiry.sql:
  -- "NULL = ruolo permanente, valorizzato = valido fino a quella data")
  -- va SEMPRE filtrato: esistono grant pro a tempo realmente in uso —
  -- grant_pro_until_to_email (reward pre-registrazione Play, +1 anno) e
  -- ring_reward_heartbeat (note='ring-reward', +6 mesi,
  -- 20260612120001_ring_reward_antifraud.sql:107-116). Senza questo
  -- filtro un reward SCADUTO verrebbe letto come 'lifetime' permanente
  -- con entitlementExpiresAt null, cioe' accesso Pro perpetuo gratuito.
  -- Nessun cron/trigger ripulisce le righe scadute (verificato: l'unico
  -- filtro pre-esistente e' client-side in fetchRoles()), quindi il
  -- filtro DEVE stare qui.
  if exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro' and note = 'founder-launch'
      and (expires_at is null or expires_at > v_server_now)
  ) then
    v_kind := 'founder';
    v_evaluation_reason := 'founder_role';

  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro' and note ilike '%grandfather%'
      and (expires_at is null or expires_at > v_server_now)
  ) then
    v_kind := 'grandfather';
    v_evaluation_reason := 'grandfather_role';

  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro'
      and expires_at is null
  ) then
    -- SOLO expires_at IS NULL: 'lifetime' e' il bucket "permanente e non
    -- scade mai". Un pro a tempo ancora valido non e' lifetime — cade nel
    -- ramo dedicato subito sotto, con entitlementExpiresAt valorizzato.
    v_kind := 'lifetime';
    v_evaluation_reason := 'lifetime_role';

  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro' and expires_at > v_server_now
  ) then
    v_kind := 'subscription';
    v_evaluation_reason := 'timed_pro_role';
    select max(expires_at) into v_expires_at
    from public.user_roles
    where user_id = v_user_id and role = 'pro' and expires_at > v_server_now;

  elsif exists (
    select 1 from public.b2c_subscriptions t
    where t.user_id = v_user_id and t.state = 'active' and public.is_b2c_lifetime(t)
  ) then
    v_kind := 'lifetime';
    v_evaluation_reason := 'lifetime_subscription_row';

  elsif exists (
    select 1 from public.b2c_subscriptions
    where user_id = v_user_id and billing_source <> 'trial' and state in ('active', 'grace')
  ) then
    v_kind := 'subscription';
    v_evaluation_reason := 'active_subscription_row';
    select active_until into v_expires_at
    from public.b2c_subscriptions
    where user_id = v_user_id and billing_source <> 'trial' and state in ('active', 'grace')
    order by active_until desc
    limit 1;

  elsif lower(v_email) = lower('appreview.demo@fitmesh.fit') then
    v_kind := 'appReview';
    v_evaluation_reason := 'app_review_email';

  elsif v_trial_status = 'active' then
    v_kind := 'trial';
    v_evaluation_reason := 'trial_within_window';
    v_expires_at := v_trial_ends_at;

  else
    v_kind := 'none';
    v_evaluation_reason := 'trial_expired_no_other_entitlement';
  end if;

  -- founderWindowClosed=true e' SOLO un motivo di ineleggibilita' per un
  -- NUOVO grant Founder (permette al client di smettere di richiamare
  -- claim_founder_grant_if_eligible() ad ogni sign-in) — non revoca mai un
  -- entitlement gia' concesso: se v_kind e' gia' 'founder' qui sopra,
  -- questo ramo lo lascia intatto (il fast-path 'founder' e' sempre il
  -- primo controllato, prima di qualunque logica di finestra/cutoff).
  if v_kind = 'founder' then
    v_founder_eligibility := 'already_founder';
    v_founder_window_closed := true;
  elsif v_created_at >= '2026-07-31T22:00:00Z'::timestamptz then
    v_founder_eligibility := 'program_closed';
    v_founder_window_closed := true;
  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro'
  ) then
    -- Gia' pro per QUALUNQUE motivo (grandfather, beta-tester, ring-reward,
    -- reward Play a tempo...): private.grant_founder_launch_core lo
    -- short-circuita al primo controllo, su `role='pro'` nudo senza guardare
    -- `note` (20260728090000, riga 397) — quell'utente ricevera' sempre e
    -- solo alreadyHadEligibleGrant=true, mai un nuovo grant Founder. Dirgli
    -- founderWindowClosed=false lo farebbe richiamare
    -- claim_founder_grant_if_eligible() ad ogni sign-in a vuoto, per sempre.
    -- NOTA: il fast-path SQL non filtra expires_at, quindi qui replichiamo
    -- la stessa condizione non filtrata di proposito — l'obiettivo e'
    -- rispecchiare cosa fara' REALMENTE il motore Founder, non cosa
    -- sarebbe piu' corretto in astratto.
    v_founder_eligibility := 'already_has_pro';
    v_founder_window_closed := true;
  else
    v_founder_eligibility := 'pending_first_sync';
    v_founder_window_closed := false;
  end if;

  -- offlineValidUntil = min(trialEndsAt, serverNow + 24h) — richiesta
  -- esplicita di Matteo dopo il draft consumer app: non ha senso dire al
  -- client "fidati offline per 24h" se il trial scade prima di allora, il
  -- client deve riverificare non oltre la scadenza reale. Il cap si applica
  -- SOLO se trialEndsAt e' ancora nel futuro: per un entitlement permanente
  -- (founder/grandfather/lifetime/subscription) o un trial gia' scaduto da
  -- tempo, trialEndsAt e' irrilevante o nel passato — forzare
  -- offlineValidUntil al passato non avrebbe senso e non serve, perche'
  -- quelle fonti hanno gia' il proprio round-trip server ad ogni apertura
  -- app (vedi doc draft app, punto 5: resolveEntitlementStatus non viene
  -- nemmeno interpellata quando founder/lifetime/subscription sono gia' true).
  --
  -- Una risposta con trial scaduto (trialStatus='expired') NON impedisce in
  -- alcun modo un acquisto o un restore successivi: questa funzione e' sola
  -- lettura, zero side-effect, non tocca mai billing/purchase state — la
  -- decisione di acquistare/restore resta interamente lato store/app.
  if v_trial_ends_at > v_server_now then
    v_offline_valid_until := least(v_server_now + v_offline_grace, v_trial_ends_at);
  else
    v_offline_valid_until := v_server_now + v_offline_grace;
  end if;

  return jsonb_build_object(
    'contractVersion', v_contract_version,
    'serverNow', v_server_now,
    'trialStartedAt', v_created_at,
    'trialEndsAt', v_trial_ends_at,
    'trialStatus', v_trial_status,
    'entitlementKind', v_kind,
    'entitlementExpiresAt', v_expires_at,
    'evaluationReason', v_evaluation_reason,
    'founderEligibility', v_founder_eligibility,
    'founderWindowClosed', v_founder_window_closed,
    'offlineValidUntil', v_offline_valid_until
  );
end;
$$;

revoke all on function public.get_entitlement_status() from public, anon;
grant execute on function public.get_entitlement_status() to authenticated;

comment on function public.get_entitlement_status is
  'Sprint P0.10E: stato entitlement server-authoritative, auth.uid()-scoped, '
  'sola lettura. serverNow permette al client di rilevare clock skew/rollback '
  'senza mai fidarsi del proprio orologio come autorita'' per trial/Founder. '
  'Nessun accesso anon. Nessun parametro di input: un utente puo'' leggere '
  'esclusivamente il proprio stato.';
