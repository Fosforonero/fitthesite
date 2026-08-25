-- ============================================================================
-- UNA SOLA REGOLA SUL DIRITTO — le tre copie diventano una
--
-- Fino a oggi la stessa domanda («questo utente ha diritto?») aveva tre
-- risposte scritte in tre posti diversi:
--
--   1. il client, che le somma a mano in `EntitlementState.hasFullAccess`
--      (features/billing/data/entitlement.dart);
--   2. `public.get_entitlement_status()`, il contratto server-authoritative;
--   3. `public.user_has_active_entitlement(uuid)`, il muro RLS del 16/08.
--
-- Questa migration riduce 2 e 3 a un'unica implementazione. Il client (1) e'
-- il passo successivo e va fatto SOLO dopo questa: collegarlo prima avrebbe
-- aggiunto la quarta copia invece di toglierne due.
--
-- ── PERCHE' ADESSO, VISTO CHE OGGI CONCORDANO ─────────────────────────────
--
-- Misurato sui 558 utenti veri prima del cambio: le due regole danno la
-- stessa risposta a TUTTI. Nessun utente e' oggi danneggiato. Quindi questo
-- non e' un fix, e' prevenzione — ma di una rottura che e' a UNA RIGA di
-- distanza, e la riga in questione e' quella che stiamo per scrivere:
--
--   `private.billing_pagamenti_segnalati` — il registro manuale creato ieri
--   per il cliente Apple che aveva pagato senza essere servito — e' letto dal
--   MURO e NON dal CONTRATTO. Il registro oggi ha zero righe. Appena ne
--   inseriamo una, quella persona potra' sincronizzare (il muro la riconosce)
--   e si vedra' comparire il paywall (il contratto la legge come 'none').
--   Mostreremmo il muro d'acquisto proprio all'unica persona che abbiamo
--   salvato a mano dopo che aveva gia' pagato.
--
--   `admin` — presente nel muro, assente dal contratto. Oggi i due admin
--   hanno anche una riga 'pro', quindi passano da li'. Il giorno che qualcuno
--   toglie quella riga, un admin resta chiuso fuori dal proprio prodotto.
--
-- ── COSA CAMBIA PER GLI UTENTI ESISTENTI: NIENTE, E LO DIMOSTRA ───────────
--
-- I due rami nuovi (`admin`, `manualPayment`) sono inseriti DOPO tutti i rami
-- esistenti che concedono e PRIMA di `trial`. Cosi' nessun utente che oggi
-- riceve un `kind` puo' riceverne un altro: i rami che lo catturavano vengono
-- valutati per primi e sono invariati. La verifica in coda a questo file non
-- si fida di questo ragionamento: confronta la decisione vecchia e la nuova
-- per ogni singolo utente e fa fallire la migration se anche una cambia.
--
-- ── PROPRIETA' DI SICUREZZA DA NON PERDERE ────────────────────────────────
--
-- `get_entitlement_status()` resta SENZA PARAMETRI. Era una richiesta
-- esplicita: non basta ignorare un timestamp fornito dal client, non deve
-- esistere il canale per farlo arrivare. Il nucleo prende un uuid perche' il
-- muro RLS deve poterlo interrogare per la riga che sta scrivendo, ma vive in
-- `private`, che non e' esposto all'API.
--
-- Zero PII nella risposta, e adesso e' piu' vero di prima: l'email serve solo
-- a riconoscere l'account di review, non esce mai dal nucleo, e la RPC
-- pubblica non la legge nemmeno piu'.
-- ============================================================================

-- ── PRIMA DI TOCCARE QUALUNQUE COSA: fotografia della decisione attuale ───
--
-- Si registra, per ogni utente vero, cosa rispondono OGGI le due regole. In
-- coda al file le stesse domande vengono rifatte al nucleo nuovo e le
-- risposte confrontate una per una. Nessuna riga di produzione viene scritta:
-- e' una temp table, muore con la sessione.

drop table if exists _prima_del_cambio;
create temp table _prima_del_cambio as
select u.id,
       public.user_has_active_entitlement(u.id) as muro_vecchio,
       case
         when exists (select 1 from public.user_roles r where r.user_id=u.id and r.role='pro' and r.note='founder-launch' and (r.expires_at is null or r.expires_at > now())) then 'founder'
         when exists (select 1 from public.user_roles r where r.user_id=u.id and r.role='pro' and r.note ilike '%grandfather%' and (r.expires_at is null or r.expires_at > now())) then 'grandfather'
         when exists (select 1 from public.user_roles r where r.user_id=u.id and r.role='pro' and r.expires_at is null) then 'lifetime'
         when exists (select 1 from public.user_roles r where r.user_id=u.id and r.role='pro' and r.expires_at > now()) then 'subscription'
         when exists (select 1 from public.b2c_subscriptions t where t.user_id=u.id and t.state='active' and public.is_b2c_lifetime(t)) then 'lifetime'
         when exists (select 1 from public.b2c_subscriptions b where b.user_id=u.id and b.billing_source <> 'trial' and b.state in ('active','grace')) then 'subscription'
         when lower(u.email) = 'appreview.demo@fitmesh.fit' then 'appReview'
         when u.created_at + interval '14 days' > now() then 'trial'
         else 'none'
       end as kind_vecchio
from auth.users u;

-- ── IL NUCLEO: l'unico posto dove si decide chi ha diritto ────────────────

create or replace function private.entitlement_core(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_now          timestamptz := pg_catalog.clock_timestamp();
  v_created_at   timestamptz;
  v_email        text;
  v_trial_ends   timestamptz;
  v_kind         text;
  v_reason       text;
  v_expires_at   timestamptz := null;
begin
  if p_user_id is null then
    return jsonb_build_object(
      'kind', 'none', 'reason', 'no_user', 'hasFullAccess', false,
      'serverNow', v_now, 'trialStartedAt', null, 'trialEndsAt', null,
      'trialStatus', 'expired', 'expiresAt', null);
  end if;

  select u.created_at, u.email into v_created_at, v_email
  from auth.users u where u.id = p_user_id;

  if v_created_at is null then
    return jsonb_build_object(
      'kind', 'none', 'reason', 'user_not_found', 'hasFullAccess', false,
      'serverNow', v_now, 'trialStartedAt', null, 'trialEndsAt', null,
      'trialStatus', 'expired', 'expiresAt', null);
  end if;

  -- La durata della prova vive QUI e in nessun altro posto lato server.
  v_trial_ends := v_created_at + interval '14 days';

  -- I rami sono ordinati: il primo che matcha vince. `expires_at` va SEMPRE
  -- filtrato — esistono grant pro a tempo davvero in uso (reward Play +1
  -- anno, ring-reward +6 mesi) e nessun cron ripulisce le righe scadute.
  if exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.note = 'founder-launch'
       and (r.expires_at is null or r.expires_at > v_now)
  ) then
    v_kind := 'founder'; v_reason := 'founder_role';

  elsif exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.note ilike '%grandfather%'
       and (r.expires_at is null or r.expires_at > v_now)
  ) then
    v_kind := 'grandfather'; v_reason := 'grandfather_role';

  elsif exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.expires_at is null
  ) then
    -- 'lifetime' e' il bucket "permanente, non scade mai". Un pro a tempo
    -- ancora valido NON e' lifetime: cade nel ramo subito sotto.
    v_kind := 'lifetime'; v_reason := 'lifetime_role';

  elsif exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.expires_at > v_now
  ) then
    v_kind := 'subscription'; v_reason := 'timed_pro_role';
    select max(r.expires_at) into v_expires_at from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.expires_at > v_now;

  elsif exists (
    select 1 from public.b2c_subscriptions t
     where t.user_id = p_user_id and t.state = 'active' and public.is_b2c_lifetime(t)
  ) then
    v_kind := 'lifetime'; v_reason := 'lifetime_subscription_row';

  elsif exists (
    select 1 from public.b2c_subscriptions b
     where b.user_id = p_user_id
       and b.billing_source not in ('trial', 'founder_grant')
       and b.state in ('active', 'grace')
  ) then
    -- `grace` concede: e' il ritentativo di addebito dello store. Togliere il
    -- servizio a chi ha la carta in ritentativo e' il modo piu' rapido di
    -- perdere un abbonato che stava per rinnovare.
    -- `founder_grant` non e' un pagamento, e' il grant: chi ce l'ha e' gia'
    -- passato dai rami sopra tramite user_roles.
    v_kind := 'subscription'; v_reason := 'active_subscription_row';
    select b.active_until into v_expires_at from public.b2c_subscriptions b
     where b.user_id = p_user_id
       and b.billing_source not in ('trial', 'founder_grant')
       and b.state in ('active', 'grace')
     order by b.active_until desc nulls last limit 1;

  -- ── DA QUI IN GIU' I DUE RAMI CHE IL CONTRATTO NON AVEVA ────────────────

  elsif exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'admin'
       and (r.expires_at is null or r.expires_at > v_now)
  ) then
    v_kind := 'admin'; v_reason := 'admin_role';

  elsif exists (
    select 1 from private.billing_pagamenti_segnalati s
     where s.user_id = p_user_id and s.revocato_at is null and s.valido_fino > v_now
  ) then
    -- Pagamento constatato a mano, in attesa che la verifica automatica sia
    -- pronta. Vive nel registro, non in b2c_subscriptions, apposta: non e'
    -- stato verificato dallo store e non deve sembrarlo.
    v_kind := 'manualPayment'; v_reason := 'manual_payment_register';
    select max(s.valido_fino) into v_expires_at
      from private.billing_pagamenti_segnalati s
     where s.user_id = p_user_id and s.revocato_at is null and s.valido_fino > v_now;

  elsif lower(v_email) = 'appreview.demo@fitmesh.fit' then
    -- ATTENZIONE: costante accoppiata a lib/core/auth/admin.dart. Se cambia
    -- li', va cambiata qui. E' l'unico punto SQL in cui compare.
    v_kind := 'appReview'; v_reason := 'app_review_email';

  elsif v_now < v_trial_ends then
    v_kind := 'trial'; v_reason := 'trial_within_window';
    v_expires_at := v_trial_ends;

  else
    v_kind := 'none'; v_reason := 'trial_expired_no_other_entitlement';
  end if;

  return jsonb_build_object(
    'kind',           v_kind,
    'reason',         v_reason,
    'expiresAt',      v_expires_at,
    -- L'unica derivazione di "ha diritto" che esista. Il client legge QUESTO,
    -- non l'elenco dei kind: altrimenti la lista dei kind che concedono
    -- diventerebbe la nuova copia della regola.
    'hasFullAccess',  v_kind <> 'none',
    'serverNow',      v_now,
    'trialStartedAt', v_created_at,
    'trialEndsAt',    v_trial_ends,
    'trialStatus',    case when v_now < v_trial_ends then 'active' else 'expired' end
  );
end;
$$;

comment on function private.entitlement_core(uuid) is
  'UNICO posto in cui si decide se un utente ha diritto. Usato da '
  'public.user_has_active_entitlement (muro RLS sulle scritture) e da '
  'public.get_entitlement_status (contratto letto dal client). Vive in '
  '`private` perche'' prende un uuid: non deve essere raggiungibile dall''API.';

revoke all on function private.entitlement_core(uuid) from public, anon, authenticated;

-- ── IL MURO: ora e' una lettura del nucleo, non una seconda regola ────────

create or replace function public.user_has_active_entitlement(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce((private.entitlement_core(p_user_id) ->> 'hasFullAccess')::boolean, false);
$$;

comment on function public.user_has_active_entitlement(uuid) is
  'Muro RLS sulle scritture di dati salute. Non contiene piu'' nessuna regola: '
  'legge private.entitlement_core(), la stessa che risponde al client.';

revoke all on function public.user_has_active_entitlement(uuid) from public;
grant execute on function public.user_has_active_entitlement(uuid) to authenticated, service_role;

-- ── IL CONTRATTO: stessa forma di prima, ma non decide piu' nulla ─────────
--
-- Resta responsabile di cio' che riguarda l'idoneita' Founder e la politica
-- offline; la domanda «ha diritto?» la gira al nucleo.
--
-- contractVersion passa da 1 a 2. Non e' cosmetico: l'insieme dei valori
-- possibili di `entitlementKind` e' cresciuto (`admin`, `manualPayment`) ed e'
-- comparso `hasFullAccess`. Un client che confrontasse i kind con una lista
-- chiusa leggerebbe i due nuovi come sconosciuti. Oggi nessun client legge
-- questa RPC — il primo lo sto scrivendo adesso — quindi il momento giusto
-- per rendere la versione una cosa vera invece che decorativa e' questo.

create or replace function public.get_entitlement_status()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_contract_version constant int := 2;
  v_offline_grace constant interval := interval '24 hours';
  v_user_id uuid;
  v_core jsonb;
  v_server_now timestamptz;
  v_created_at timestamptz;
  v_trial_ends timestamptz;
  v_founder_eligibility text;
  v_founder_window_closed boolean;
  v_offline_valid_until timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  v_core := private.entitlement_core(v_user_id);

  if v_core ->> 'reason' = 'user_not_found' then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  v_server_now := (v_core ->> 'serverNow')::timestamptz;
  v_created_at := (v_core ->> 'trialStartedAt')::timestamptz;
  v_trial_ends := (v_core ->> 'trialEndsAt')::timestamptz;

  -- founderWindowClosed=true e' SOLO un motivo di ineleggibilita' per un
  -- NUOVO grant Founder (permette al client di smettere di richiamare
  -- claim_founder_grant_if_eligible() ad ogni sign-in): non revoca mai un
  -- entitlement gia' concesso.
  if v_core ->> 'kind' = 'founder' then
    v_founder_eligibility := 'already_founder';
    v_founder_window_closed := true;
  elsif v_created_at >= '2026-07-31T22:00:00Z'::timestamptz then
    v_founder_eligibility := 'program_closed';
    v_founder_window_closed := true;
  elsif exists (
    select 1 from public.user_roles r where r.user_id = v_user_id and r.role = 'pro'
  ) then
    -- private.grant_founder_launch_core short-circuita su `role='pro'` nudo,
    -- senza guardare `note` e senza filtrare expires_at: qui si replica la
    -- stessa condizione non filtrata di proposito, perche' l'obiettivo e'
    -- rispecchiare cosa fara' REALMENTE il motore Founder.
    v_founder_eligibility := 'already_has_pro';
    v_founder_window_closed := true;
  else
    v_founder_eligibility := 'pending_first_sync';
    v_founder_window_closed := false;
  end if;

  if v_trial_ends > v_server_now then
    v_offline_valid_until := least(v_server_now + v_offline_grace, v_trial_ends);
  else
    v_offline_valid_until := v_server_now + v_offline_grace;
  end if;

  return jsonb_build_object(
    'contractVersion',      v_contract_version,
    'serverNow',            v_server_now,
    'trialStartedAt',       v_created_at,
    'trialEndsAt',          v_trial_ends,
    'trialStatus',          v_core ->> 'trialStatus',
    'entitlementKind',      v_core ->> 'kind',
    'entitlementExpiresAt', v_core -> 'expiresAt',
    -- Il campo che il client deve leggere. Esiste per impedirgli di ricostruire
    -- "quali kind concedono": quella lista sarebbe la quarta copia della regola.
    'hasFullAccess',        (v_core ->> 'hasFullAccess')::boolean,
    'evaluationReason',     v_core ->> 'reason',
    'founderEligibility',   v_founder_eligibility,
    'founderWindowClosed',  v_founder_window_closed,
    'offlineValidUntil',    v_offline_valid_until
  );
end;
$$;

revoke all on function public.get_entitlement_status() from public, anon;
grant execute on function public.get_entitlement_status() to authenticated;

comment on function public.get_entitlement_status is
  'Stato entitlement server-authoritative, auth.uid()-scoped, sola lettura. '
  'Non contiene piu'' la regola sul diritto: la legge da '
  'private.entitlement_core(), la stessa che alimenta il muro RLS. Nessun '
  'parametro di input: un utente puo'' leggere solo il proprio stato.';

-- ── LA VERIFICA: la migration si rifiuta di applicarsi se cambia qualcosa ─

do $verifica$
declare
  v_muro_cambiato int;
  v_kind_cambiato int;
  v_persi int;
  v_esempio text;
begin
  -- 1. Il muro deve rispondere ESATTAMENTE come prima, per ogni utente.
  select count(*) into v_muro_cambiato
  from _prima_del_cambio p
  where p.muro_vecchio is distinct from public.user_has_active_entitlement(p.id);

  if v_muro_cambiato > 0 then
    select string_agg(p.id::text, ', ') into v_esempio
    from (select id from _prima_del_cambio p2
           where p2.muro_vecchio is distinct from public.user_has_active_entitlement(p2.id)
           limit 5) p;
    raise exception 'il muro cambia risposta per % utenti (primi: %)', v_muro_cambiato, v_esempio;
  end if;

  -- 2. Il kind deve restare lo stesso per ogni utente esistente. I due rami
  --    nuovi sono progettati per non poter catturare nessuno che oggi ha gia'
  --    un kind: qui si controlla che sia vero, invece di crederci.
  select count(*) into v_kind_cambiato
  from _prima_del_cambio p
  where p.kind_vecchio is distinct from (private.entitlement_core(p.id) ->> 'kind');

  if v_kind_cambiato > 0 then
    select string_agg(x.riga, ' | ') into v_esempio
    from (select p.kind_vecchio || ' -> ' || (private.entitlement_core(p.id) ->> 'kind') as riga
          from _prima_del_cambio p
          where p.kind_vecchio is distinct from (private.entitlement_core(p.id) ->> 'kind')
          limit 5) x;
    raise exception 'il kind cambia per % utenti (esempi: %)', v_kind_cambiato, v_esempio;
  end if;

  -- 3. Rete di sicurezza indipendente dalla fotografia: nessuno con un grant
  --    valido puo' restare fuori, qualunque cosa dicano i confronti sopra.
  select count(*) into v_persi
  from public.user_roles r
  where r.role in ('pro','admin')
    and (r.expires_at is null or r.expires_at > now())
    and not public.user_has_active_entitlement(r.user_id);
  if v_persi > 0 then
    raise exception 'il cambio toglie il diritto a % utenti con grant valido', v_persi;
  end if;

  raise notice 'unificazione verificata: % utenti, nessuna decisione cambiata',
    (select count(*) from _prima_del_cambio);
end
$verifica$;

drop table if exists _prima_del_cambio;
