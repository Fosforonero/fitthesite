-- Founder P0 (Build 189 "buco del primo giorno") — grant legato al primo
-- sync realmente riuscito, non al signup. Sostituisce l'idea di riattivare
-- il trigger su auth.users/profiles (esplicitamente rifiutata: consumava
-- il cap 1000 su ogni signup, zero criteri di eligibility oltre .invalid,
-- vedi 20260715183049_disable_founder_launch_autogrant_trigger).
--
-- Un solo entry point esposto: record_first_sync_transition. Nessuna RPC
-- "regalami Founder" separata — qualunque client authenticated l'avrebbe
-- potuta chiamare direttamente senza mai sincronizzare nulla. La logica di
-- eligibility/cap vive in private.grant_founder_launch_core, mai concessa
-- a public/anon/authenticated: raggiungibile solo internamente (una
-- SECURITY DEFINER che ne chiama un'altra esegue con i privilegi del suo
-- owner, non del chiamante originale).
--
-- Revisionata tre volte da Matteo prima di questo commit:
--   v1 -> v2: rimossa una RPC standalone che avrebbe permesso self-grant a
--     qualunque authenticated (bug reale, trovato in review).
--   v2 -> v3: P0.3 — l'evidenza (fitness_metrics per quello user+device) va
--     verificata PRIMA di scrivere first_sync_state='success', non solo
--     prima del grant. P0.4 — la piattaforma e' telemetria opzionale (NULL
--     accettato), mai un requisito che blocca transizione o grant.
--   v3 -> v4 (questo file): contratto di risposta esplicito
--     (transitionAccepted / transitionRecordedNow / effectiveState) invece
--     di dedurre l'accettazione dall'assenza di notEligibleReason; race sul
--     cap corretta (ricontrollo "gia' pro" DOPO il lock, prima di contare);
--     search_path ristretto a pg_catalog, public, private; limite di
--     lunghezza su p_device_fingerprint.
--
-- Validata su Postgres 17 disposable (Docker, non branch Supabase a
-- pagamento): 17 scenari numerati (1-17, incluso 15 = race concorrente
-- sullo STESSO utente su due device), script committati e rieseguibili in
-- supabase/tests/founder_p0/ (README con i comandi esatti) — conteggio
-- riproducibile eseguendo quegli script in sequenza su un container pulito,
-- riverificato integralmente il 2026-07-20. Verificata anche via replay
-- dell'intera catena migration su supabase/postgres ufficiale (schema
-- Supabase reale, non simulato, auth.users/auth.uid() veri) da database
-- vuoto, MA quel replay non e' "full clean-database replay PASS": un file
-- pre-esistente non-founder (20260514120004_init_b2c_subs.sql) ha un bug di
-- sintassi indipendente (parametro chiamato `row`, parola riservata
-- Postgres) che blocca il replay letterale con `psql -f`; girato solo
-- aggirandolo con una copia locale patchata, il file reale in repo non e'
-- stato toccato (fuori scope, gia' applicato in produzione, tracciato in
-- docs/architecture/known-issues.md insieme al secondo gap trovato,
-- water_ml mancante in 20260522120006). La catena founder/first-sync
-- (incluse le 5 migration backfillate + questa) applica pulita una volta
-- superato quel punto, senza dipendenze mancanti.
--
-- APPLICATA in produzione il 2026-07-20 (dry-run pre-apply: cap 313/1000,
-- 0 utenti eleggibili senza pro da backfillare, trigger signup assente,
-- nessuna RPC standalone di grant introdotta da questo file). Versione
-- realmente assegnata da Supabase: 20260720055513 (differisce dal
-- timestamp 20260719120000 usato durante lo sviluppo — filename Git
-- riallineato per non introdurre drift col database reale).

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
  if v_email is null or v_email ilike '%.invalid' or lower(v_email) = lower('appreview.demo@fitmesh.fit') then
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
  -- il ruolo mentre questa chiamata attendeva il lock. Senza questo
  -- ricontrollo, questa chiamata conterebbe il cap e potrebbe riportare
  -- erroneamente capReached anche se l'utente e' gia' Founder — bug di
  -- race trovato in review (2026-07-19): mai riportare cap_reached a un
  -- utente che in realta' ha gia' il ruolo.
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


-- Sostituisce integralmente la versione 20260714112434 (return type void
-- -> jsonb: drop esplicito necessario). Nessun client in produzione la
-- chiama oggi: e' codice Build 189 mai shippato, rischio zero.
drop function if exists public.record_first_sync_transition(text, text, text, text);

create or replace function public.record_first_sync_transition(
  p_device_fingerprint text,
  p_state text,
  p_platform text,
  p_app_version text
) returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_device_id uuid;
  v_current_state text;
  v_rows int;
  v_grant jsonb;
  v_effective_state text;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  if p_state not in (
    'block_unavailable', 'block_permission', 'proceed_direct_only',
    'read_no_data', 'read_error', 'upload_error', 'success'
  ) then
    raise exception 'record_first_sync_transition: invalid p_state %', p_state;
  end if;
  -- P0.4: platform e' telemetria opzionale, non un requisito. NULL
  -- accettato; se presente deve comunque essere un valore valido.
  if p_platform is not null and p_platform not in ('ios', 'android') then
    raise exception 'record_first_sync_transition: invalid p_platform %', p_platform;
  end if;
  if p_app_version is not null and char_length(p_app_version) > 32 then
    raise exception 'record_first_sync_transition: p_app_version too long';
  end if;
  if p_device_fingerprint is null or char_length(p_device_fingerprint) = 0
     or char_length(p_device_fingerprint) > 200 then
    raise exception 'record_first_sync_transition: invalid p_device_fingerprint';
  end if;

  select id, first_sync_state into v_device_id, v_current_state
  from public.devices
  where device_fingerprint = p_device_fingerprint
    and user_id = v_uid
    and revoked_at is null;

  -- Device inesistente/cross-user/revocato: NON accettato. Resta
  -- retryable lato client (mai messo in cache) — un re-pairing o una
  -- revoca temporanea non deve restare bloccata per sempre.
  if v_device_id is null then
    return jsonb_build_object(
      'transitionAccepted', false,
      'transitionRecordedNow', false,
      'effectiveState', null
    );
  end if;

  -- Gia' a questo stato, o gia' terminale ('success'): nessuna scrittura,
  -- ma il device e' valido -> accepted=true. effectiveState riflette la
  -- verita' ATTUALE del server, non necessariamente lo stato richiesto da
  -- questa chiamata (es. p_state='read_error' ma il device e' gia'
  -- 'success': effectiveState resta 'success').
  if v_current_state = 'success' or v_current_state = p_state then
    v_effective_state := v_current_state;
    if v_effective_state = 'success' then
      v_grant := private.grant_founder_launch_core(v_uid, v_device_id);
    end if;
    return jsonb_build_object(
      'transitionAccepted', true,
      'transitionRecordedNow', false,
      'effectiveState', v_effective_state
    ) || coalesce(v_grant, '{}'::jsonb);
  end if;

  -- P0.3: per una transizione a 'success', l'evidenza deve esistere PRIMA
  -- di scrivere qualunque cosa. Se manca: nessuna UPDATE, first_sync_state
  -- e first_sync_at restano quello che erano (mai settati la prima volta),
  -- transitionAccepted=false -> il client NON mette in cache, una chiamata
  -- successiva (dopo che i dati sono arrivati) ritenta da zero. La
  -- correttezza non dipende dall'ordine con cui il client chiama upload vs
  -- transition.
  if p_state = 'success' and not exists (
    select 1 from public.fitness_metrics
    where user_id = v_uid and device_id = v_device_id
  ) then
    return jsonb_build_object(
      'transitionAccepted', false,
      'transitionRecordedNow', false,
      'effectiveState', v_current_state,
      'notEligibleReason', 'no_metrics_evidence'
    );
  end if;

  update public.devices
  set
    first_sync_state = p_state,
    first_sync_state_updated_at = now(),
    first_sync_at = case when p_state = 'success' then now() else first_sync_at end,
    -- sticky: non sovrascrivere un platform/app_version gia' noto con NULL
    -- solo perche' questa chiamata non lo porta.
    first_sync_platform = coalesce(p_platform, first_sync_platform),
    first_sync_app_version = coalesce(p_app_version, first_sync_app_version)
  where id = v_device_id
    and first_sync_state is distinct from 'success'
    and first_sync_state is distinct from p_state;

  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    -- Race con un'altra chiamata concorrente per lo STESSO device (due
    -- isolate/richieste quasi simultanee) che ha gia' scritto mentre
    -- questa chiamata leggeva lo stato pre-UPDATE: rileggi la verita' vera
    -- invece di fidarti del v_current_state ormai stantio.
    select first_sync_state into v_current_state
    from public.devices where id = v_device_id;
    v_effective_state := v_current_state;
    if v_effective_state = 'success' then
      v_grant := private.grant_founder_launch_core(v_uid, v_device_id);
    end if;
    return jsonb_build_object(
      'transitionAccepted', true,
      'transitionRecordedNow', false,
      'effectiveState', v_effective_state
    ) || coalesce(v_grant, '{}'::jsonb);
  end if;

  v_effective_state := p_state;
  if p_state = 'success' then
    v_grant := private.grant_founder_launch_core(v_uid, v_device_id);
  end if;

  return jsonb_build_object(
    'transitionAccepted', true,
    'transitionRecordedNow', true,
    'effectiveState', v_effective_state
  ) || coalesce(v_grant, '{}'::jsonb);
end;
$$;

revoke all on function public.record_first_sync_transition(text, text, text, text) from public;
revoke execute on function public.record_first_sync_transition(text, text, text, text) from anon;
grant execute on function public.record_first_sync_transition(text, text, text, text) to authenticated;

-- Guardia anti-regressione: fallisce l'intera migration se il trigger
-- signup-time riappare (per errore, merge accidentale, restore di un
-- backup vecchio). Founder P0 dipende esplicitamente sul fatto che
-- l'unico grant automatico sia questo, mai piu' un trigger a ogni signup.
do $$
begin
  if exists (
    select 1 from pg_trigger
    where tgname = 'on_profile_created_founder'
      and tgrelid = 'public.profiles'::regclass
  ) then
    raise exception 'Founder P0 guard: on_profile_created_founder trigger e'' '
      'ricomparso su public.profiles. Il grant a signup e'' stato '
      'esplicitamente disabilitato (vedi 20260715183049) e non va mai '
      'riattivato: DROP il trigger prima di riapplicare questa migration.';
  end if;
end;
$$;

-- Dopo l'apply: rieseguire get_advisors(security) — verificare che
-- nessuna delle 2 funzioni compaia come "SECURITY DEFINER senza
-- search_path fisso" e che private.grant_founder_launch_core non risulti
-- eseguibile da alcun ruolo pubblico.
