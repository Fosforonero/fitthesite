-- ============================================================================
-- Il verdetto unico di accesso alla dashboard web.
--
-- NON APPLICATA. Richiede il GO esplicito di Matteo e un'applicazione a mano
-- (il `db push` generale resta vietato). Finche' non e' applicata, il sito
-- riceve «funzione assente» e mostra «non disponibile, riprova»: mai un
-- paywall.
--
-- ── PERCHE' NON BASTA entitlement_core ─────────────────────────────────────
-- private.entitlement_core (corpo vivo: 20260825120008) decide l'accesso
-- all'APP e regge il muro RLS delle scritture. Per la dashboard web non va
-- bene cosi' com'e', per tre ragioni misurate il 24/09/2026:
--   1. concede la PROVA (ramo `trial_within_window`): la dashboard web no;
--   2. si ferma al PRIMO ramo che corrisponde: un Lifetime comprato con sopra
--      un premio anello a tempo risulta `timed_pro_role`, e una mappatura sul
--      tipo di titolo lo scambierebbe per un regalo;
--   3. il ramo abbonamenti non guarda `active_until`: una riga 'active' non
--      rivalidata continua a concedere anche a scadenza passata.
-- Toccarla non si puo': regge il sync, e c'e' una proposta pendente che la
-- riordina (migration A del P0 Lifetime). Questa funzione le sta ACCANTO e non
-- la modifica.
--
-- ── LA REGOLA (decisa da Matteo il 24/09/2026) ─────────────────────────────
-- Accesso con QUALUNQUE titolo valido fra questi, valutati tutti insieme:
--   app_review         conto di revisione dello store (stessi due indirizzi)
--   founder            ruolo pro 'founder-launch' non scaduto
--   grandfather        ruolo pro '%grandfather%' non scaduto
--   lifetime_grant     ruolo pro senza scadenza (concesso a mano, beta a vita)
--   timed_grant        ruolo pro a tempo non scaduto (premio anello, reward
--                      Play, ponte iOS)
--   lifetime_purchase  riga b2c Lifetime 'active'
--   subscription       riga b2c di un pagamento in 'active' o 'grace' E con
--                      active_until nel futuro
--   admin              ruolo admin non scaduto
--   manual_payment     pagamento registrato a mano, non revocato, non scaduto
-- Nessun accesso con la sola prova, con nessun titolo, con un abbonamento
-- scaduto, con un acquisto revocato o rimborsato, con un pagamento in attesa.
--
-- I predicati sono quelli di entitlement_core, trascritti dal corpo vivo; le
-- sole differenze volute sono `active_until > now` sugli abbonamenti e
-- l'assenza della prova. Un titolo non ne nasconde un altro: si restituiscono
-- tutti. I rami del ruolo pro sono resi disgiunti per nota (founder,
-- grandfather, gli altri), perche' `user_roles` ha una sola riga pro per
-- utente e l'elenco dei titoli deve dire di che riga si tratta.
--
-- ── IDENTITA' ──────────────────────────────────────────────────────────────
-- Il verdetto e' quello dell'account della sessione, e basta: l'involucro
-- pubblico non ha parametri e legge auth.uid(). Un acquisto registrato su un
-- altro account FitMesh non conta, per costruzione. Nessun incrocio per email
-- (salvo i due indirizzi di revisione, come nel nucleo).
--
-- ── COSA NON E' GARANTITO DAI DATI, DICHIARATO ─────────────────────────────
-- Nessun percorso scrive oggi 'grace'; una revoca o un rimborso arrivano solo
-- quando l'app ripresenta l'acquisto (niente notifiche degli store); un
-- rinnovo prolunga active_until solo alla ripresentazione. Chi ha rinnovato e
-- non ha riaperto l'app puo' risultare «abbonamento scaduto» finche' non la
-- riapre.
-- ============================================================================

create or replace function private.web_dashboard_verdict(p_user_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $$
declare
  v_now        timestamptz := pg_catalog.clock_timestamp();
  v_created_at timestamptz;
  v_email      text;
  v_titoli     text[] := '{}';
  v_motivo     text := null;
begin
  if p_user_id is null then
    return jsonb_build_object(
      'contractVersion', 1, 'granted', false, 'titles', '[]'::jsonb,
      'denialReason', 'no_user', 'serverNow', v_now);
  end if;

  select u.created_at, u.email into v_created_at, v_email
  from auth.users u where u.id = p_user_id;

  if v_created_at is null then
    return jsonb_build_object(
      'contractVersion', 1, 'granted', false, 'titles', '[]'::jsonb,
      'denialReason', 'user_not_found', 'serverNow', v_now);
  end if;

  if lower(v_email) in ('review@fitmesh.fit', 'appreview.demo@fitmesh.fit') then
    v_titoli := array_append(v_titoli, 'app_review');
  end if;

  if exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.note = 'founder-launch'
       and (r.expires_at is null or r.expires_at > v_now)
  ) then
    v_titoli := array_append(v_titoli, 'founder');
  end if;

  if exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.note ilike '%grandfather%'
       and r.note is distinct from 'founder-launch'
       and (r.expires_at is null or r.expires_at > v_now)
  ) then
    v_titoli := array_append(v_titoli, 'grandfather');
  end if;

  if exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.expires_at is null
       and r.note is distinct from 'founder-launch'
       and coalesce(r.note, '') not ilike '%grandfather%'
  ) then
    v_titoli := array_append(v_titoli, 'lifetime_grant');
  end if;

  if exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'pro' and r.expires_at > v_now
       and r.note is distinct from 'founder-launch'
       and coalesce(r.note, '') not ilike '%grandfather%'
  ) then
    v_titoli := array_append(v_titoli, 'timed_grant');
  end if;

  -- Nel nucleo una riga Lifetime concede in 'active' (ramo 6) e anche in
  -- 'grace' (ramo 7, che non esclude i Lifetime): qui e' un titolo solo.
  if exists (
    select 1 from public.b2c_subscriptions t
     where t.user_id = p_user_id and t.state in ('active', 'grace')
       and public.is_b2c_lifetime(t)
  ) then
    v_titoli := array_append(v_titoli, 'lifetime_purchase');
  end if;

  if exists (
    select 1 from public.b2c_subscriptions b
     where b.user_id = p_user_id
       and b.billing_source not in ('trial', 'founder_grant')
       and b.state in ('active', 'grace')
       and not public.is_b2c_lifetime(b)
       and b.active_until > v_now
  ) then
    v_titoli := array_append(v_titoli, 'subscription');
  end if;

  if exists (
    select 1 from public.user_roles r
     where r.user_id = p_user_id and r.role = 'admin'
       and (r.expires_at is null or r.expires_at > v_now)
  ) then
    v_titoli := array_append(v_titoli, 'admin');
  end if;

  if exists (
    select 1 from private.billing_pagamenti_segnalati s
     where s.user_id = p_user_id and s.revocato_at is null and s.valido_fino > v_now
  ) then
    v_titoli := array_append(v_titoli, 'manual_payment');
  end if;

  if cardinality(v_titoli) = 0 then
    -- Il motivo serve a dire la cosa giusta a chi e' negato, non a decidere:
    -- la decisione e' gia' presa (nessun titolo). Prima le ragioni che
    -- riguardano un acquisto, poi la prova, poi il resto.
    v_motivo := case
      when exists (
        select 1 from public.b2c_subscriptions b
         where b.user_id = p_user_id
           and b.billing_source not in ('trial', 'founder_grant')
           and b.state = 'on_hold'
      ) then 'purchase_pending'
      when exists (
        select 1 from public.b2c_subscriptions b
         where b.user_id = p_user_id
           and b.billing_source not in ('trial', 'founder_grant')
           and public.is_b2c_lifetime(b)
      ) then 'purchase_revoked'
      when exists (
        select 1 from public.b2c_subscriptions b
         where b.user_id = p_user_id
           and b.billing_source not in ('trial', 'founder_grant')
      ) then 'subscription_inactive'
      when v_now < v_created_at + interval '14 days' then 'trial_only'
      else 'no_entitlement'
    end;
  end if;

  return jsonb_build_object(
    'contractVersion', 1,
    'granted',         cardinality(v_titoli) > 0,
    'titles',          to_jsonb(v_titoli),
    'denialReason',    v_motivo,
    'serverNow',       v_now
  );
end;
$$;

comment on function private.web_dashboard_verdict(uuid) is
  'Verdetto di accesso alla dashboard web: tutti i titoli validi insieme, senza '
  'la prova, abbonamenti solo con active_until futuro. Non chiamarla con un uuid '
  'arbitrario: passa da public.get_web_dashboard_access().';

create or replace function public.get_web_dashboard_access()
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  return private.web_dashboard_verdict(v_uid);
end;
$$;

comment on function public.get_web_dashboard_access() is
  'Verdetto di accesso alla dashboard web per l''account della sessione. Nessun '
  'parametro: l''identita'' e'' auth.uid(), e basta.';

-- I privilegi predefiniti di Supabase concedono EXECUTE ad anon e authenticated
-- su ogni funzione nuova: si tolgono in modo esplicito.
revoke all on function private.web_dashboard_verdict(uuid) from public, anon, authenticated;
revoke all on function public.get_web_dashboard_access() from public, anon;
grant execute on function public.get_web_dashboard_access() to authenticated;

-- ── POSTCONDIZIONE ─────────────────────────────────────────────────────────
-- I privilegi si misurano: una revoca scritta non e' una revoca applicata.
do $verifica$
begin
  if has_function_privilege('anon', 'public.get_web_dashboard_access()', 'execute') then
    raise exception 'anon puo'' eseguire get_web_dashboard_access';
  end if;
  if not has_function_privilege('authenticated', 'public.get_web_dashboard_access()', 'execute') then
    raise exception 'authenticated non puo'' eseguire get_web_dashboard_access';
  end if;
  if has_function_privilege('anon', 'private.web_dashboard_verdict(uuid)', 'execute')
     or has_function_privilege('authenticated', 'private.web_dashboard_verdict(uuid)', 'execute') then
    raise exception 'web_dashboard_verdict e'' eseguibile da un ruolo del client';
  end if;
end
$verifica$;
