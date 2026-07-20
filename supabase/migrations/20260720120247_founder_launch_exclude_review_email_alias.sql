-- Founder P0 — coerenza account App Review. L'indirizzo canonico REALE in
-- produzione e' review@fitmesh.fit (verificato via query diretta su
-- auth.users durante lo smoke test del deploy precedente,
-- 20260720055513_founder_launch_first_sync_grant.sql) — non
-- appreview.demo@fitmesh.fit, che risultava nella documentazione/memoria
-- di sviluppo come indirizzo storico ma non esiste con questo nome in
-- produzione. Esclude ENTRAMBI, case-insensitive: l'indirizzo storico
-- resta supportato come alias per coerenza con codice/documentazione che
-- potrebbe ancora riferirsi ad esso, finche' non e' stato ripulito ovunque.
--
-- Additiva, NON tocca il ruolo gia' presente di review@fitmesh.fit (ha
-- gia' pro:founder-launch, concesso prima della disabilitazione del
-- trigger di signup del 15/07 — vedi 20260715183049). Il fast-path "gia'
-- pro" che segue il controllo di esclusione lo copre comunque in pratica;
-- questo fix riguarda un futuro, ipotetico resync SOLO se quell'account
-- perdesse il ruolo pro e tornasse a sincronizzare per la prima volta.
--
-- APPLICATA in produzione il 2026-07-20 (versione assegnata da Supabase:
-- 20260720120247, allineata al nome di questo file — l'orario nel nome
-- locale, 094500, era solo di sviluppo). Verificato post-apply: owner
-- postgres, security definer, search_path 'pg_catalog, public, private',
-- grant EXECUTE solo a postgres (anon/authenticated revocati come prima).
-- review@fitmesh.fit: role=pro/note=founder-launch/expires_at=null
-- INVARIATO pre/post apply.
create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  founder_cap constant int := 1000;
  v_email text;
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
  if v_email is null
     or v_email ilike '%.invalid'
     or lower(v_email) = lower('review@fitmesh.fit')
     or lower(v_email) = lower('appreview.demo@fitmesh.fit') then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account'
    );
  end if;

  -- Fast path pre-lock: puramente un'ottimizzazione (evita di prendere il
  -- lock per il caso comune "utente gia' Founder"), MAI la fonte di verita'.
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object(
      'grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null
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
