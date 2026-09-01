-- La catena non ricostruisce entitlement_core come vive in produzione.
--
-- ── COME E' STATO TROVATO ──────────────────────────────────────────────────
-- Il confronto strutturale confrontava firma, SECURITY DEFINER, volatilita',
-- search_path, proprietario e concessioni delle funzioni. NON il corpo.
-- Poteva quindi dichiarare «identiche» due funzioni che facevano cose
-- diverse, ed e' esattamente cio' che e' successo qui.
--
-- Aggiunto il confronto dei corpi (25/08/2026): su 66 funzioni, 26 avevano il
-- corpo diverso. Tredici erano solo commenti, cinque solo spaziatura o
-- maiuscole, sei erano le forward-only gia' scritte. Due restavano. Una,
-- public.admin_daily_aggregate, differisce per soli alias di colonna che
-- RETURNS TABLE ignora: registrata, innocua. Questa e' l'altra.
--
-- ── LA DIFFERENZA ──────────────────────────────────────────────────────────
-- Nella catena (ultima versione: 20260816124508_entitlement_una_sola_regola)
-- il ramo appReview e' penultimo, dopo founder, grandfather, lifetime,
-- subscription, admin e registro manuale, e riconosce un solo indirizzo:
--
--     elsif lower(v_email) = 'appreview.demo@fitmesh.fit' then
--
-- In produzione, dal 18/08/2026, quel ramo e' il PRIMO, incondizionato, e
-- riconosce due indirizzi. Il commento nel corpo vivo spiega perche' fu
-- spostato: fino ad allora non era mai scattato per nessuno, perche' l'unico
-- conto reale veniva intercettato prima dal grant founder.
--
-- ── PERCHE' E' UN BLOCKER E NON UN DETTAGLIO ───────────────────────────────
-- Qui la produzione ha ragione e la catena ha torto. E' l'opposto delle
-- quattro forward-only precedenti. Chiunque ricostruisse lo schema da questi
-- file — un ambiente nuovo, un ripristino, un branch Supabase per provare la
-- candidata 190 — otterrebbe il comportamento **precedente al 18/08**, quello
-- in cui il conto di revisione dello store non ottiene appReview. E' il
-- difetto che ha gia' prodotto respingimenti su iOS.
--
-- E' l'undicesimo cambiamento fuori banda noto su questo progetto. I primi
-- dieci erano oggetti mancanti; questo e' un corpo divergente, e nessuna
-- categoria del confronto lo guardava.
--
-- ── COSA FA QUESTA MIGRATION ───────────────────────────────────────────────
-- Porta la catena al corpo vivo. Applicata in produzione sarebbe un NO-OP:
-- non cambia niente, registra soltanto. La postcondizione lo verifica
-- confrontando l'impronta normalizzata con quella misurata sul vivo il
-- 25/08/2026: ffa65db9c73f902b37f52ba19b353ef8.
--
-- Nessun ramo e' stato riprogettato. L'ordine, le condizioni e i valori di
-- ritorno sono quelli del vivo, trascritti e verificati per impronta.

create or replace function private.entitlement_core(p_user_id uuid)
returns jsonb
language plpgsql
stable security definer
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
  -- Il conto di revisione store va riconosciuto INCONDIZIONATAMENTE, prima
  -- di ogni altro ramo: non deve dipendere da quali grant abbia o non abbia.
  -- Fino al 18/08/2026 questo ramo stava dopo founder e non e' mai scattato
  -- per nessuno, perche' l'unico conto reale (review@fitmesh.fit) veniva
  -- intercettato prima dal grant founder. Insieme di indirizzi allineato a
  -- _kAppReviewDemoEmails in lib/core/auth/admin.dart, che li ha gia'
  -- entrambi: qui il server si allinea al client, non viceversa.
  if lower(v_email) in ('review@fitmesh.fit', 'appreview.demo@fitmesh.fit') then
    v_kind := 'appReview'; v_reason := 'app_review_email';

  elsif exists (
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

-- ── POSTCONDIZIONE ─────────────────────────────────────────────────────────
-- L'impronta normalizzata (minuscolo, senza commenti, senza spazi bianchi)
-- deve coincidere con quella misurata sul vivo il 25/08/2026. Una
-- trascrizione fedele nella forma ma infedele nel contenuto fallisce qui.
do $verifica$
declare
  v_atteso constant text := 'ffa65db9c73f902b37f52ba19b353ef8';
  v_ottenuto text;
  v_oid oid;
begin
  select p.oid into v_oid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'entitlement_core' and p.prokind = 'f';

  if v_oid is null then
    raise exception 'private.entitlement_core non esiste dopo la sua stessa creazione';
  end if;

  select md5(regexp_replace(regexp_replace(lower(pg_get_functiondef(v_oid)), '--[^\n]*', '', 'g'), '\s+', '', 'g'))
    into v_ottenuto;

  if v_ottenuto <> v_atteso then
    raise exception 'entitlement_core: impronta % invece di %. La trascrizione non riproduce il corpo vivo: fermarsi.',
      v_ottenuto, v_atteso;
  end if;

  -- e il ramo appReview deve essere il PRIMO, non uno qualsiasi
  if position('if lower(v_email) in' in pg_get_functiondef(v_oid)) = 0 then
    raise exception 'entitlement_core: il ramo appReview non e'' in testa (nessun "if lower(v_email) in")';
  end if;
  if position('elsif lower(v_email)' in pg_get_functiondef(v_oid)) > 0 then
    raise exception 'entitlement_core: il ramo appReview e'' ancora un elsif, cioe'' non in testa';
  end if;

  raise notice 'entitlement_core allineata al vivo: impronta %, ramo appReview in testa', v_ottenuto;
end
$verifica$;
