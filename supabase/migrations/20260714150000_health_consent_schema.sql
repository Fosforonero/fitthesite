-- =============================================================================
-- Explicit health-data consent system
-- =============================================================================
-- Design goals (per Matteo's approved product decisions, 2026-07-14):
--   * "terms" (ToS acceptance) and "health_data" (explicit Art. 9 consent) are
--     two SEPARATE, never-conflated purposes. A third purpose, "privacy_notice",
--     tracks that the privacy notice/version was PRESENTED -- this is explicitly
--     NOT itself consent, so it uses a different action ("presented") and can
--     never be granted/revoked.
--   * Append-only event history is the source of truth (grant/revoke/re-grant
--     are distinct rows, never edited). A small current-state projection table
--     gives O(1) lookups for the app's ConsentGate and for server-side
--     enforcement, and is only ever written in the same transaction as the
--     event that produced it.
--   * All writes happen through SECURITY DEFINER RPCs that resolve the acting
--     user from auth.uid() -- the client can never pass an arbitrary user_id.
--   * Minimal evidence only: user_id, purpose, version, action, server
--     timestamp, platform, app_version. No IP address, no health metrics, no
--     free text, no device identifiers.
--   * Enforcement (blocking sync when consent is missing) is built here as an
--     inert primitive (assert_health_sync_consent) gated behind
--     consent_enforcement_config.enforcement_enabled, which defaults to FALSE.
--     Nothing in this migration wires it into any live ingestion path --
--     that wiring is a separate, later, separately-approved change per
--     Matteo's staged rollout requirement.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. consent_documents -- catalog of published document versions.
--    Purely reference data (no PII). Exists so that record_consent_event can
--    reject made-up/stale version strings via a real foreign key, instead of
--    trusting whatever the client happens to send.
-- -----------------------------------------------------------------------------
create table public.consent_documents (
  purpose       text        not null
                check (purpose in ('terms', 'health_data', 'privacy_notice')),
  version       text        not null
                check (char_length(version) between 1 and 32),
  published_at  timestamptz not null default now(),
  is_current    boolean     not null default false,
  primary key (purpose, version)
);

comment on table public.consent_documents is
  'Reference catalog of published Terms / Privacy Policy / health-data-consent copy versions. No user data. record_consent_event() FK-references this so clients cannot submit an arbitrary or fabricated version string.';

-- Exactly one "current" version per purpose.
create unique index consent_documents_one_current_per_purpose
  on public.consent_documents (purpose)
  where is_current;

alter table public.consent_documents enable row level security;

create policy "anyone can read consent documents"
  on public.consent_documents
  for select
  using (true);

create policy "admin manage consent documents"
  on public.consent_documents
  for all
  using (is_admin())
  with check (is_admin());

revoke insert, update, delete on public.consent_documents from anon, authenticated;
grant select on public.consent_documents to anon, authenticated;

-- Bootstrap rows. PLACEHOLDER version tags -- product/legal must confirm the
-- real Terms/Privacy version identifiers before this is used to gate any
-- production consent flow (see Matteo's point 8: final copy needs legal
-- review before production enforcement).
insert into public.consent_documents (purpose, version, is_current) values
  ('terms',          '2026-07-14', true),
  ('privacy_notice',  '2026-07-14', true),
  ('health_data',     '2026-07-14', true);

create or replace function public.current_consent_document_version(p_purpose text)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select version
  from public.consent_documents
  where purpose = p_purpose
    and is_current
  limit 1;
$$;

revoke all on function public.current_consent_document_version(text) from public;
grant execute on function public.current_consent_document_version(text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. health_consent_events -- append-only audit log. Source of truth.
--    No UPDATE / DELETE is ever permitted, enforced by trigger (not just RLS),
--    so even a mistaken direct SQL statement cannot rewrite history.
-- -----------------------------------------------------------------------------
create table public.health_consent_events (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id),
  purpose      text        not null
               check (purpose in ('terms', 'health_data', 'privacy_notice')),
  action       text        not null
               check (action in ('granted', 'revoked', 'presented')),
  version      text        not null
               check (char_length(version) between 1 and 32),
  occurred_at  timestamptz not null default now(),
  platform     text
               check (platform is null or platform in ('ios', 'android', 'web')),
  app_version  text
               check (app_version is null or char_length(app_version) <= 32),

  -- purpose/action pairing: privacy_notice can only ever be "presented";
  -- terms and health_data can only ever be granted/revoked. Prevents
  -- conflating "we showed you the privacy policy" with "you consented".
  constraint health_consent_events_purpose_action_pairing check (
    (purpose in ('terms', 'health_data') and action in ('granted', 'revoked'))
    or
    (purpose = 'privacy_notice' and action = 'presented')
  ),

  -- the version must correspond to a real, known published document version
  -- for that exact purpose -- not an arbitrary client-supplied string.
  constraint health_consent_events_version_fk
    foreign key (purpose, version) references public.consent_documents (purpose, version)
);

comment on table public.health_consent_events is
  'Append-only consent/notice event history (grant / revoke / presented). Source of truth for consent state. Never updated or deleted -- see health_consent_events_block_mutation trigger. Written only by record_consent_event(); never accepts a client-supplied user_id.';
comment on column public.health_consent_events.occurred_at is
  'Server timestamp (now()) at the moment the event was recorded. Never accepted as client input.';

create index health_consent_events_user_purpose_idx
  on public.health_consent_events (user_id, purpose, occurred_at desc);

alter table public.health_consent_events enable row level security;

create policy "users select own consent events"
  on public.health_consent_events
  for select
  using (user_id = auth.uid());

create policy "admin select all consent events"
  on public.health_consent_events
  for select
  using (is_admin());

-- Deliberately NO insert/update/delete policy for anon/authenticated: all
-- writes must go through the SECURITY DEFINER record_consent_event() RPC,
-- which (as the function owner) is not subject to these RLS policies.
revoke insert, update, delete on public.health_consent_events from anon, authenticated;
grant select on public.health_consent_events to authenticated;

create or replace function public.health_consent_events_block_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'health_consent_events is append-only: % is not permitted', TG_OP
    using errcode = '0A000'; -- feature_not_supported
end;
$$;

create trigger health_consent_events_no_update
  before update on public.health_consent_events
  for each row execute function public.health_consent_events_block_mutation();

create trigger health_consent_events_no_delete
  before delete on public.health_consent_events
  for each row execute function public.health_consent_events_block_mutation();


-- -----------------------------------------------------------------------------
-- 3. health_consent_state -- fast current-state projection.
--    Kept consistent with health_consent_events by construction: both are
--    written atomically inside record_consent_event(), in the same statement.
-- -----------------------------------------------------------------------------
create table public.health_consent_state (
  user_id      uuid        not null references public.profiles(id),
  purpose      text        not null
               check (purpose in ('terms', 'health_data', 'privacy_notice')),
  status       text        not null
               check (status in ('granted', 'revoked', 'presented')),
  version      text        not null
               check (char_length(version) between 1 and 32),
  occurred_at  timestamptz not null,
  platform     text
               check (platform is null or platform in ('ios', 'android', 'web')),
  app_version  text
               check (app_version is null or char_length(app_version) <= 32),
  updated_at   timestamptz not null default now(),

  primary key (user_id, purpose),

  constraint health_consent_state_purpose_status_pairing check (
    (purpose in ('terms', 'health_data') and status in ('granted', 'revoked'))
    or
    (purpose = 'privacy_notice' and status = 'presented')
  ),

  constraint health_consent_state_version_fk
    foreign key (purpose, version) references public.consent_documents (purpose, version)
);

comment on table public.health_consent_state is
  'Current-state projection of health_consent_events, one row per (user_id, purpose). Cheap lookup table for ConsentGate and server-side enforcement. Written only inside record_consent_event(); never a substitute for the append-only log.';

alter table public.health_consent_state enable row level security;

create policy "users select own consent state"
  on public.health_consent_state
  for select
  using (user_id = auth.uid());

create policy "admin select all consent state"
  on public.health_consent_state
  for select
  using (is_admin());

revoke insert, update, delete on public.health_consent_state from anon, authenticated;
grant select on public.health_consent_state to authenticated;

-- NOTE: no backfill rows are inserted for the ~277/280 existing profiles.
-- Absence of a "granted" row IS the correct "not consented" state -- we do
-- not fabricate a synthetic "revoked" event for something the user was
-- never actually asked about. has_consent()/user_has_consent() below both
-- treat "no row" as "not granted".


-- -----------------------------------------------------------------------------
-- 4. record_consent_event -- the only write path.
--    Mirrors the record_first_sync_transition (build 189, migration
--    first_sync_activation_tracking) hardening pattern: SECURITY DEFINER,
--    search_path pinned, explicit input validation, transition-only guard
--    via IS DISTINCT FROM, user scoped exclusively to auth.uid().
-- -----------------------------------------------------------------------------
create or replace function public.record_consent_event(
  p_purpose     text,
  p_action      text,
  p_version     text,
  p_platform    text default null,
  p_app_version text default null
)
returns table (purpose text, status text, version text, occurred_at timestamptz)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_now     timestamptz := now();
begin
  -- Never silently record anything: require a genuinely authenticated
  -- session. There is no parameter for the target user -- it is always
  -- the caller, resolved server-side from the verified JWT.
  if v_user_id is null then
    raise exception 'record_consent_event: no authenticated session'
      using errcode = '28000'; -- invalid_authorization_specification
  end if;

  if p_purpose is null or p_purpose not in ('terms', 'health_data', 'privacy_notice') then
    raise exception 'record_consent_event: invalid p_purpose %', p_purpose
      using errcode = '22023'; -- invalid_parameter_value
  end if;

  if p_action is null or p_action not in ('granted', 'revoked', 'presented') then
    raise exception 'record_consent_event: invalid p_action %', p_action
      using errcode = '22023';
  end if;

  if (p_purpose in ('terms', 'health_data') and p_action = 'presented')
     or (p_purpose = 'privacy_notice' and p_action != 'presented') then
    raise exception 'record_consent_event: action % is not valid for purpose %', p_action, p_purpose
      using errcode = '22023';
  end if;

  if p_version is null or char_length(p_version) < 1 or char_length(p_version) > 32 then
    raise exception 'record_consent_event: invalid p_version'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.consent_documents d
    where d.purpose = p_purpose and d.version = p_version
  ) then
    raise exception 'record_consent_event: % is not a known published version for purpose %', p_version, p_purpose
      using errcode = '22023';
  end if;

  if p_platform is not null and p_platform not in ('ios', 'android', 'web') then
    raise exception 'record_consent_event: invalid p_platform %', p_platform
      using errcode = '22023';
  end if;

  if p_app_version is not null and char_length(p_app_version) > 32 then
    raise exception 'record_consent_event: p_app_version too long'
      using errcode = '22023';
  end if;

  -- Atomic transition-only write: the projection is upserted first; the
  -- WHERE clause on DO UPDATE means the upsert only actually changes the
  -- row (and therefore RETURNS a row) when this is a genuine transition
  -- (different status or different version than what's already recorded).
  -- The append-only event is inserted only when that real transition
  -- occurred -- this dedupes accidental client retries (e.g. a network
  -- retry re-submitting the same tap) without ever silently dropping a
  -- real grant -> revoke -> re-grant sequence, since each of those is a
  -- distinct (status, version) pair.
  with upserted as (
    insert into public.health_consent_state as s
      (user_id, purpose, status, version, occurred_at, platform, app_version, updated_at)
    values
      (v_user_id, p_purpose, p_action, p_version, v_now, p_platform, p_app_version, v_now)
    -- NOTE: deliberately targets the constraint by name, not by bare column
    -- list (`on conflict (user_id, purpose)`) -- this function's RETURNS
    -- TABLE clause introduces OUT-parameter variables named purpose/status/
    -- version/occurred_at, which shadow the identically-named table columns
    -- and make a bare `purpose` in the conflict target ambiguous in plpgsql.
    on conflict on constraint health_consent_state_pkey do update
      set status      = excluded.status,
          version     = excluded.version,
          occurred_at = excluded.occurred_at,
          platform    = excluded.platform,
          app_version = excluded.app_version,
          updated_at  = excluded.updated_at
      where s.status is distinct from excluded.status
         or s.version is distinct from excluded.version
    returning user_id
  )
  insert into public.health_consent_events
    (user_id, purpose, action, version, occurred_at, platform, app_version)
  select v_user_id, p_purpose, p_action, p_version, v_now, p_platform, p_app_version
  where exists (select 1 from upserted);

  return query
    select s.purpose, s.status, s.version, s.occurred_at
    from public.health_consent_state s
    where s.user_id = v_user_id
      and s.purpose = p_purpose;
end;
$function$;

revoke all on function public.record_consent_event(text, text, text, text, text) from public;
grant execute on function public.record_consent_event(text, text, text, text, text) to authenticated;


-- -----------------------------------------------------------------------------
-- 5. Read-side helpers for the app's ConsentGate.
-- -----------------------------------------------------------------------------

-- Self-service, single purpose: "am I currently consented for X?"
create or replace function public.has_consent(p_purpose text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.health_consent_state s
    where s.user_id = auth.uid()
      and s.purpose = p_purpose
      and s.status = 'granted'
  );
$$;

revoke all on function public.has_consent(text) from public;
grant execute on function public.has_consent(text) to authenticated;

-- Self-service, full detail across all purposes -- what ConsentGate needs to
-- decide whether/what to show, without a separate round trip per purpose.
create or replace function public.my_consent_status()
returns table (purpose text, status text, version text, occurred_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.purpose, s.status, s.version, s.occurred_at
  from public.health_consent_state s
  where s.user_id = auth.uid();
$$;

revoke all on function public.my_consent_status() from public;
grant execute on function public.my_consent_status() to authenticated;

-- Server-side / cross-user check, for use by trusted backend contexts
-- (edge functions, background sync workers) running as service_role, or
-- by the user checking themselves. Rejects any other caller checking
-- someone else's consent (information-leak guard).
create or replace function public.user_has_consent(p_user_id uuid, p_purpose text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $function$
begin
  if auth.uid() is distinct from p_user_id and auth.role() is distinct from 'service_role' then
    raise exception 'user_has_consent: not authorized'
      using errcode = '42501'; -- insufficient_privilege
  end if;

  if p_purpose not in ('terms', 'health_data', 'privacy_notice') then
    raise exception 'user_has_consent: invalid p_purpose %', p_purpose
      using errcode = '22023';
  end if;

  return exists (
    select 1
    from public.health_consent_state s
    where s.user_id = p_user_id
      and s.purpose = p_purpose
      and s.status = 'granted'
  );
end;
$function$;

revoke all on function public.user_has_consent(uuid, text) from public;
grant execute on function public.user_has_consent(uuid, text) to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 6. Server-side enforcement primitive (inert until separately approved).
--
-- This is the guard a later, SEPARATELY APPROVED change would call at the
-- top of foreground sync / background sync / historical import / provider
-- OAuth ingestion / direct-ring upload / write-back paths, e.g.:
--
--   -- inside e.g. public.ingest_fitness_metrics(...):
--   perform public.assert_health_sync_consent(auth.uid());
--   -- ... existing ingestion logic continues only if no exception raised.
--
-- Nothing in this migration adds that call to any existing ingestion
-- function. The guard is also self-disabling: it is a no-op unless
-- consent_enforcement_config.enforcement_enabled is explicitly flipped to
-- true, which is its own admin action, not part of this migration.
-- -----------------------------------------------------------------------------
create table public.consent_enforcement_config (
  id                   boolean     primary key default true,
  enforcement_enabled  boolean     not null default false,
  updated_at           timestamptz not null default now(),
  updated_by           uuid        references auth.users(id),

  constraint consent_enforcement_config_singleton check (id)
);

comment on table public.consent_enforcement_config is
  'Single-row kill switch for server-side health-data-consent enforcement. enforcement_enabled defaults to FALSE: creating this table does not itself block any sync. Flipping it to TRUE is a distinct, separately-approved rollout step (see Matteo point 4).';

insert into public.consent_enforcement_config (id, enforcement_enabled) values (true, false);

alter table public.consent_enforcement_config enable row level security;

create policy "admin manage consent enforcement config"
  on public.consent_enforcement_config
  for all
  using (is_admin())
  with check (is_admin());

revoke all on public.consent_enforcement_config from anon, authenticated;

create or replace function public.assert_health_sync_consent(p_user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_enabled boolean;
begin
  if auth.uid() is distinct from p_user_id and auth.role() is distinct from 'service_role' then
    raise exception 'assert_health_sync_consent: not authorized'
      using errcode = '42501';
  end if;

  select enforcement_enabled into v_enabled
  from public.consent_enforcement_config
  where id = true;

  if coalesce(v_enabled, false) is false then
    return; -- staged rollout: enforcement not yet activated, guard is inert
  end if;

  if not exists (
    select 1
    from public.health_consent_state s
    where s.user_id = p_user_id
      and s.purpose = 'health_data'
      and s.status = 'granted'
  ) then
    -- Distinct, greppable error code (SQLSTATE 'FM001') so that even an old
    -- client that cannot render a proper consent gate still surfaces a
    -- diagnosable, non-generic failure in logs/crash reports, instead of a
    -- silent drop or an unrelated-looking generic sync error.
    raise exception using
      errcode = 'FM001',
      message = format('HEALTH_CONSENT_REQUIRED: health-data consent not granted for user %s', p_user_id),
      hint    = 'Client must complete the health-data consent gate (or the account must re-consent) before sync can proceed.';
  end if;
end;
$function$;

revoke all on function public.assert_health_sync_consent(uuid) from public;
grant execute on function public.assert_health_sync_consent(uuid) to authenticated, service_role;
