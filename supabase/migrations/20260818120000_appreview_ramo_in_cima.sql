-- Il conto di revisione store riconosciuto per PRIMO, e con entrambi gli
-- indirizzi.
--
-- ── PERCHE' ────────────────────────────────────────────────────────────────
--
-- Il ramo `appReview` esisteva dal principio ma NON E' MAI SCATTATO PER
-- NESSUNO. Due difetti sovrapposti, misurati il 18/08/2026:
--
--   1. Puntava a `appreview.demo@fitmesh.fit`, che in produzione NON ESISTE
--      (zero conti). L'unico conto reale e' `review@fitmesh.fit`.
--   2. Anche con l'indirizzo giusto sarebbe rimasto inerte, perche' stava
--      DOPO il ramo founder (posizione 4672 contro 1510) e quel conto ha una
--      riga `pro [founder-launch]` finita li' con la distribuzione di massa.
--
-- Quindi il revisore di Apple entrava, ma **per caso**: grazie a un grant
-- founder che qualcuno avrebbe potuto ripulire, non grazie al meccanismo
-- costruito apposta. La build 181 e' stata bocciata per «demo account
-- murato»: era la stessa classe di problema, a un ripulisci-grant di
-- distanza.
--
-- ── PERCHE' IN CIMA E NON SOLO ALLARGATO ───────────────────────────────────
--
-- Un conto dimostrativo va riconosciuto INCONDIZIONATAMENTE, qualunque grant
-- abbia o non abbia. Metterlo in cima toglie la dipendenza invece di
-- spostarla. Non esiste un caso in cui vogliamo che quel conto risulti
-- founder o subscription invece di appReview.
--
-- ── PERCHE' DUE INDIRIZZI ──────────────────────────────────────────────────
--
-- `lib/core/auth/admin.dart` ha gia' entrambi in `_kAppReviewDemoEmails`, con
-- il commento che `appreview.demo@` e' «un alias storico, mai esistito con
-- questo nome». Il client sapeva; il server no. Allineando il server al
-- client si CHIUDE l'accoppiamento contro cui avverte quel commento, invece
-- di crearne un secondo lato da tenere in sincrono.
--
-- ── PROVA PRIMA DI APPLICARE ───────────────────────────────────────────────
--
-- Eseguita in transazione con rollback: confronto di `kind`/`reason` per
-- OGNI profilo, prima e dopo. Esito: **esattamente una riga cambiata**,
--
--   review@fitmesh.fit · founder/founder_role -> appReview/app_review_email
--
-- e zero altre. Atteso, perche' la condizione e' un confronto esatto su due
-- letterali di email: puo' cambiare l'esito solo per chi ha una di quelle due.
--
-- NOTA: applicata in produzione via `execute_sql` il 18/08/2026, quindi NON
-- registrata in `supabase_migrations.schema_migrations`. Questo file esiste
-- perche' il sorgente non resti fuori da git, che e' il debito documentato in
-- `supabase/migrations-fuori-banda/LEGGIMI.md`. Va registrata a mano.
--
-- NON TOCCARE: il ruolo `pro [founder-launch]` su review@fitmesh.fit resta
-- finche' la nuova strada non e' provata su una build vera della 190.

create or replace function private.entitlement_core(p_user_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
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
$function$;
