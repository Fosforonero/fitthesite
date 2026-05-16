# Gym-Social Sprint 0 (Foundation Layer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilire la fondazione DB completa per il gym-social: schema (12 tabelle), RLS policies deny-by-default, helper functions, SECURITY DEFINER gateway functions, seed dati base, regenerazione tipi TypeScript. Nessuna UI in questo sprint.

**Architecture:** Migrations idempotenti SQL applicate in sequenza su Supabase Postgres 15. Tutte le INSERT su tabelle membership/participant passano da funzioni `SECURITY DEFINER` per validazione centralizzata. RLS = deny by default + grant esplicito via policy. Tipi TypeScript rigenerati a fine sprint via `supabase gen types`.

**Tech Stack:**
- Postgres 15 (Supabase managed)
- SQL migrations file-based (`fitthesite/supabase/migrations/`)
- pg_cron extension (già abilitata in migration 007)
- pgcrypto extension (già abilitata in migration 001)
- Supabase CLI per gen types

**Source spec:** [`docs/superpowers/specs/2026-05-13-gym-social-design.md`](../specs/2026-05-13-gym-social-design.md)

---

## File Structure

Nuovi file:

| Path | Purpose | Approx lines |
|------|---------|--------------|
| `supabase/migrations/20260514120001_init_gym_core.sql` | gym_tiers (con seed), gyms, gym_memberships, gym_subscriptions, gym_email_invites + helper functions `is_gym_owner`/`active_gym_id`/`has_premium_access` + RLS | ~280 |
| `supabase/migrations/20260514120002_init_challenges.sql` | challenges, challenge_participants, challenge_scores, challenge_gym_scores + RLS + view `challenge_leaderboard_v` | ~220 |
| `supabase/migrations/20260514120003_init_anti_cheat.sql` | metric_caps (con seed default), disqualifications + RLS | ~90 |
| `supabase/migrations/20260514120004_init_b2c_subs.sql` | b2c_subscriptions (subscription + lifetime support) + RLS | ~80 |
| `supabase/migrations/20260514120005_gym_gateway_functions.sql` | SECURITY DEFINER functions: redeem_invite_code, accept_email_invite, join_challenge, leave_challenge, disqualify_participant, rotate_invite_code, b2c_grant_lifetime, b2c_grant_subscription | ~250 |
| `supabase/migrations/20260514120006_gym_smoke_data.sql` | (OPZIONALE, solo dev) Smoke test data — commentata di default | ~40 |
| `lib/supabase/database.types.ts` | (MODIFICATO) Rigenerato via `supabase gen types` | ~auto |
| `docs/architecture/gym-schema-reference.md` | Nuovo doc: ER diagram + JOIN ricette per Sprint 1 | ~150 |

File esistenti referenziati (NON modificati in Sprint 0):
- `supabase/migrations/20260513120001_init_profiles_roles.sql` — pattern `set_updated_at()`, `has_role()`, `is_admin()`
- `supabase/migrations/20260513120002_init_devices_pairing.sql` — tabella `devices` (FK target)
- `supabase/migrations/20260513120003_init_fitness_metrics.sql` — tabella `fitness_metrics` (consumata da cron Sprint 2)

Order of operations:
1. Task 1: Migration 008 (`init_gym_core`)
2. Task 2: Migration 009 (`init_challenges`)
3. Task 3: Migration 010 (`init_anti_cheat`)
4. Task 4: Migration 011 (`init_b2c_subs`)
5. Task 5: Migration 012 (`gym_gateway_functions`)
6. Task 6: Manual SQL smoke test in Supabase SQL Editor
7. Task 7: Regen TypeScript types
8. Task 8: Schema reference doc + commit chiusura sprint

---

## Conventions used in all migrations

- **Idempotency**: nessun `IF NOT EXISTS` su `CREATE TABLE` (Supabase migrations sono one-shot, non re-runnabili). Su `CREATE INDEX` usiamo nomi unici per evitare collisioni accidentali.
- **Naming**: `<entity>_<purpose>_idx` per indici, `<entity>_<n>_check` per check constraint, `trg_<entity>_<event>` per trigger.
- **Comments**: tutte le tabelle e funzioni hanno `comment on table` / `comment on function` in italiano per documentazione inline.
- **IMMUTABLE awareness**: NESSUNA `now()` in `CREATE INDEX ... WHERE` (errore 42P17, vedi migration 004 fix). Per retention partial index usare colonne fisse o evitare.
- **search_path**: tutte le funzioni `SECURITY DEFINER` includono `set search_path = public, auth`.
- **RLS pattern**: `alter table X enable row level security` immediato dopo `create table`, poi policy specifiche.
- **Grant pattern**: funzioni `SECURITY DEFINER` chiamabili da client → `grant execute on function ... to authenticated`.

---

## Task 1: Migration 008 — Gym Core

**Files:**
- Create: `supabase/migrations/20260514120001_init_gym_core.sql`

- [ ] **Step 1.1: Crea il file migration con header**

```sql
-- ─────────────────────────────────────────────────────────
-- Migration 008 — Gym Core: tiers + gyms + memberships +
--   subscriptions + email_invites + helper functions
-- Source: docs/superpowers/specs/2026-05-13-gym-social-design.md
-- ─────────────────────────────────────────────────────────
```

- [ ] **Step 1.2: Aggiungi tabella `gym_tiers` + seed dei 4 tier**

```sql
-- ─── gym_tiers: catalogo tier palestra ────────────────────
create table public.gym_tiers (
  id text primary key,
  display_name text not null,
  features jsonb not null,
  stripe_price_id text,
  monthly_price_cents int,
  created_at timestamptz not null default now()
);

comment on table public.gym_tiers is
  'Catalogo tier palestra. Seed iniziale: base/advanced/premium/custom.';

-- Seed iniziale dei 4 tier (prezzi rivedibili)
insert into public.gym_tiers (id, display_name, features, monthly_price_cents) values
  ('base', 'Base', jsonb_build_object(
    'max_concurrent_challenges', 1,
    'inter_gym', false,
    'one_v_one', false,
    'analytics', false,
    'branded', false,
    'white_label', false,
    'api_access', false,
    'priority_support', false
  ), 2900),
  ('advanced', 'Advanced', jsonb_build_object(
    'max_concurrent_challenges', 3,
    'inter_gym', true,
    'one_v_one', true,
    'analytics', true,
    'branded', false,
    'white_label', false,
    'api_access', false,
    'priority_support', false
  ), 5900),
  ('premium', 'Premium', jsonb_build_object(
    'max_concurrent_challenges', -1,
    'inter_gym', true,
    'one_v_one', true,
    'analytics', true,
    'branded', true,
    'white_label', false,
    'api_access', true,
    'priority_support', true
  ), 12900),
  ('custom', 'Custom', jsonb_build_object(
    'max_concurrent_challenges', -1,
    'inter_gym', true,
    'one_v_one', true,
    'analytics', true,
    'branded', true,
    'white_label', true,
    'api_access', true,
    'priority_support', true,
    'dedicated_support', true
  ), null);
```

- [ ] **Step 1.3: Aggiungi tabella `gyms`**

```sql
-- ─── gyms: palestre clienti ───────────────────────────────
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  tier_id text not null references public.gym_tiers(id) default 'base',
  status text not null default 'trial'
    check (status in ('trial','active','lapsed','suspended')),
  trial_ends_at timestamptz,
  stripe_customer_id text unique,
  city text,
  country text default 'IT',
  logo_url text,
  brand_color text check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gyms_owner_idx on public.gyms (owner_user_id);
create index gyms_status_idx on public.gyms (status);

create trigger trg_gyms_updated_at
  before update on public.gyms
  for each row execute function public.set_updated_at();

comment on table public.gyms is
  'Palestre clienti SaaS. owner_user_id punta al profilo del titolare.';
```

- [ ] **Step 1.4: Aggiungi tabella `gym_memberships` con vincolo unique parziale per active**

```sql
-- ─── gym_memberships: storia + active membership ──────────
create table public.gym_memberships (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  role text not null default 'member'
    check (role in ('member','trainer','owner'))
);

-- Vincolo: 1 sola membership attiva (left_at IS NULL) per user.
-- IMMUTABLE: predicato basato su colonna fissa `left_at`, non su `now()`.
create unique index gym_memberships_one_active_idx
  on public.gym_memberships (user_id)
  where left_at is null;

create index gym_memberships_gym_active_idx
  on public.gym_memberships (gym_id) where left_at is null;
create index gym_memberships_user_history_idx
  on public.gym_memberships (user_id, joined_at desc);

comment on table public.gym_memberships is
  'Membership storiche. left_at NULL = membership attiva (al massimo 1 per user).';
```

- [ ] **Step 1.5: Aggiungi tabella `gym_subscriptions`**

```sql
-- ─── gym_subscriptions: collegamento a Stripe ─────────────
create table public.gym_subscriptions (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  stripe_subscription_id text not null unique,
  tier_id text not null references public.gym_tiers(id),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gym_subscriptions_tier_idx on public.gym_subscriptions (tier_id);

create trigger trg_gym_subscriptions_updated_at
  before update on public.gym_subscriptions
  for each row execute function public.set_updated_at();

comment on table public.gym_subscriptions is
  'Mapping gym -> Stripe subscription. tier_id qui authoritative per il billing.';
```

- [ ] **Step 1.6: Aggiungi tabella `gym_email_invites`**

```sql
-- ─── gym_email_invites: attivazione membri via email ──────
create table public.gym_email_invites (
  id bigserial primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  email text not null check (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  invited_by uuid not null references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid references public.profiles(id) on delete set null
);

create unique index gym_email_invites_gym_email_open_idx
  on public.gym_email_invites (gym_id, lower(email))
  where accepted_at is null;
create index gym_email_invites_email_open_idx
  on public.gym_email_invites (lower(email))
  where accepted_at is null;

comment on table public.gym_email_invites is
  'Invitazioni email aperte = accepted_at NULL. Unique per (gym, email) finché aperto.';
```

- [ ] **Step 1.7: Aggiungi helper functions `is_gym_owner`, `active_gym_id`, `has_premium_access`**

```sql
-- ─── Helper: is_gym_owner(gym_id) ─────────────────────────
create or replace function public.is_gym_owner(check_gym_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists(
    select 1 from public.gyms
    where id = check_gym_id and owner_user_id = auth.uid()
  );
$$;
grant execute on function public.is_gym_owner(uuid) to authenticated;

-- ─── Helper: active_gym_id(user_id) ───────────────────────
create or replace function public.active_gym_id(check_user_id uuid)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select gym_id from public.gym_memberships
   where user_id = check_user_id and left_at is null
   limit 1;
$$;
grant execute on function public.active_gym_id(uuid) to authenticated;

-- ─── Helper: has_premium_access(user_id) ──────────────────
-- TRUE se: (a) membership attiva in palestra con status active/trial,
--         (b) OR b2c_subscription attiva (rispetta sentinel lifetime).
-- NB: la tabella b2c_subscriptions viene creata in migration 011; questa
-- funzione contiene reference dinamica via EXECUTE per evitare dipendenza
-- d'ordine. Refactor in funzione SQL una volta che 011 è applicata.
create or replace function public.has_premium_access(check_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
stable
as $$
declare
  result boolean;
begin
  -- Via gym membership
  select exists(
    select 1 from public.gym_memberships m
    join public.gyms g on g.id = m.gym_id
    where m.user_id = check_user_id
      and m.left_at is null
      and g.status in ('trial','active')
  ) into result;

  if result then
    return true;
  end if;

  -- Via b2c subscription (skip se tabella non esiste ancora — migration 011)
  if to_regclass('public.b2c_subscriptions') is not null then
    execute $b$
      select exists(
        select 1 from public.b2c_subscriptions
        where user_id = $1 and active_until > now()
          and state in ('active','grace')
      )
    $b$ into result using check_user_id;
  end if;

  return coalesce(result, false);
end;
$$;
grant execute on function public.has_premium_access(uuid) to authenticated;
```

- [ ] **Step 1.8: Abilita RLS + policies su tutte le tabelle nuove**

```sql
-- ─── RLS gyms ─────────────────────────────────────────────
alter table public.gyms enable row level security;

create policy "owner manages gym"
  on public.gyms for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "member selects own gym"
  on public.gyms for select to authenticated
  using (id = public.active_gym_id(auth.uid()));

create policy "admin selects all gyms"
  on public.gyms for select to authenticated
  using (public.is_admin());

-- ─── RLS gym_tiers (read-only public) ─────────────────────
alter table public.gym_tiers enable row level security;

create policy "anyone reads tiers"
  on public.gym_tiers for select to authenticated
  using (true);

create policy "admin manages tiers"
  on public.gym_tiers for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── RLS gym_memberships ──────────────────────────────────
alter table public.gym_memberships enable row level security;

create policy "self selects membership"
  on public.gym_memberships for select to authenticated
  using (user_id = auth.uid());

create policy "gym owner selects members"
  on public.gym_memberships for select to authenticated
  using (public.is_gym_owner(gym_id));

create policy "admin selects all memberships"
  on public.gym_memberships for select to authenticated
  using (public.is_admin());

-- INSERT: solo via SECURITY DEFINER function redeem_invite_code/accept_email_invite.
-- UPDATE: solo per "leave" — self set left_at = now()
create policy "self leaves own membership"
  on public.gym_memberships for update to authenticated
  using (user_id = auth.uid() and left_at is null)
  with check (user_id = auth.uid() and left_at is not null);

-- Gym owner può rimuovere un membro (set left_at)
create policy "gym owner removes member"
  on public.gym_memberships for update to authenticated
  using (public.is_gym_owner(gym_id) and left_at is null)
  with check (public.is_gym_owner(gym_id) and left_at is not null);

-- ─── RLS gym_subscriptions ────────────────────────────────
alter table public.gym_subscriptions enable row level security;

create policy "owner reads own subscription"
  on public.gym_subscriptions for select to authenticated
  using (public.is_gym_owner(gym_id));

create policy "admin reads all subscriptions"
  on public.gym_subscriptions for select to authenticated
  using (public.is_admin());
-- INSERT/UPDATE/DELETE solo via service_role (webhook Stripe).

-- ─── RLS gym_email_invites ────────────────────────────────
alter table public.gym_email_invites enable row level security;

create policy "owner manages invites"
  on public.gym_email_invites for all to authenticated
  using (public.is_gym_owner(gym_id))
  with check (public.is_gym_owner(gym_id));

-- L'invitato (post-signup) vede inviti rivolti alla sua email
create policy "invitee sees own invites"
  on public.gym_email_invites for select to authenticated
  using (
    lower(email) = (select lower(p.email) from public.profiles p where p.id = auth.uid())
  );
```

- [ ] **Step 1.9: Verifica sintassi SQL localmente (no-apply)**

Apri il file in editor → controlla che non ci siano typo. Le statement che useremo per il check:
- Tutti i `create table` hanno `;` finale
- Tutti i `references` puntano a tabelle esistenti (`profiles`, `gym_tiers`, `gyms`)
- Funzioni `SECURITY DEFINER` hanno `set search_path = public, auth`
- Funzioni chiamabili da client hanno `grant execute ... to authenticated`

Run (richiede Supabase CLI installata):

```bash
cd /Volumes/LOS\ ANGELES/Matteo/Dev\ Roba\ Mia/App\ Orologio/fitthesite
npx supabase migration up --dry-run --linked || true
```

Expected: nessun errore di sintassi. Se non hai Supabase CLI, salta questo step e affidati al check manuale.

- [ ] **Step 1.10: Commit migration 008**

```bash
cd /Volumes/LOS\ ANGELES/Matteo/Dev\ Roba\ Mia/App\ Orologio/fitthesite
git add supabase/migrations/20260514120001_init_gym_core.sql
git commit -m "$(cat <<'EOF'
feat(migration-008): gym core schema + helper functions

- gym_tiers (con seed base/advanced/premium/custom)
- gyms (slug, invite_code 6-char, trial 30gg)
- gym_memberships (unique partial index per 1 active per user)
- gym_subscriptions (mapping Stripe)
- gym_email_invites (unique parziale su accepted_at NULL)
- Helper: is_gym_owner, active_gym_id, has_premium_access (con fallback a b2c_subscriptions via to_regclass)
- RLS: deny-by-default, INSERT memberships solo via SECURITY DEFINER

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Migration 009 — Challenges core

**Files:**
- Create: `supabase/migrations/20260514120002_init_challenges.sql`

- [ ] **Step 2.1: Header + tabella `challenges`**

```sql
-- ─────────────────────────────────────────────────────────
-- Migration 009 — Challenges core: challenge primitive +
--   participants + scores (individual & gym_vs_gym)
-- ─────────────────────────────────────────────────────────

-- ─── challenges: primitiva unica ──────────────────────────
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms(id) on delete cascade,
  name text not null check (length(name) between 3 and 80),
  description text check (description is null or length(description) <= 500),
  metric text not null check (metric in (
    'steps','distance_m','active_minutes','calories_kcal','workouts_count'
  )),
  -- activity_filter: optional restrizioni sul tipo di workout che conta nella
  -- challenge. Esempio: {"activity_types":["running"],"min_duration_min":10,
  -- "min_distance_m":100}. Default '{}'::jsonb = nessun filtro.
  -- Il cron refresh_challenge_scores (Sprint 2) applica il filter sui workouts.
  activity_filter jsonb not null default '{}'::jsonb,
  participant_type text not null check (participant_type in (
    'individual','team','gym_vs_gym'
  )),
  recurrence text not null default 'one_shot'
    check (recurrence in ('one_shot','weekly','monthly')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft','active','ended','archived')),
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end > period_start),
  check (
    -- Solo gli inter-gym e B2C pubblici possono avere gym_id NULL.
    -- I challenge intra-gym devono avere gym_id NOT NULL.
    (gym_id is not null) or (participant_type in ('gym_vs_gym','individual'))
  )
);

create index challenges_gym_status_idx
  on public.challenges (gym_id, status, period_start);
create index challenges_status_period_idx
  on public.challenges (status, period_end)
  where status in ('draft','active');
create index challenges_public_idx
  on public.challenges (period_start)
  where gym_id is null and status = 'active';

create trigger trg_challenges_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

comment on table public.challenges is
  'Primitiva challenge. gym_id NULL = challenge B2C pubblica o inter-gym aggregato.';
```

- [ ] **Step 2.2: Aggiungi tabella `challenge_participants`**

```sql
-- ─── challenge_participants: opt-in del membro ────────────
create table public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id_used uuid not null references public.devices(id) on delete restrict,
  joined_at timestamptz not null default now(),
  consent_to_share boolean not null default true,
  primary key (challenge_id, user_id)
);

-- Una persona usa UN solo device per challenge (no double-counting tra phone+wearable)
create unique index challenge_participants_device_idx
  on public.challenge_participants (challenge_id, device_id_used);

create index challenge_participants_user_idx
  on public.challenge_participants (user_id);

comment on table public.challenge_participants is
  'Opt-in esplicito. device_id_used impone una sola fonte per partecipante.';
```

- [ ] **Step 2.3: Aggiungi tabelle `challenge_scores` e `challenge_gym_scores`**

```sql
-- ─── challenge_scores: leaderboard individuale ────────────
create table public.challenge_scores (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null default 0 check (score >= 0),
  rank int check (rank is null or rank >= 1),
  updated_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create index challenge_scores_rank_idx
  on public.challenge_scores (challenge_id, rank)
  where rank is not null;

create trigger trg_challenge_scores_updated_at
  before update on public.challenge_scores
  for each row execute function public.set_updated_at();

comment on table public.challenge_scores is
  'Aggregato per partecipante. Computato dal cron refresh_challenge_scores (Sprint 2).';

-- ─── challenge_gym_scores: leaderboard inter-gym ──────────
create table public.challenge_gym_scores (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  team_score numeric not null default 0 check (team_score >= 0),
  member_count int not null default 0 check (member_count >= 0),
  rank int check (rank is null or rank >= 1),
  updated_at timestamptz not null default now(),
  primary key (challenge_id, gym_id)
);

create trigger trg_challenge_gym_scores_updated_at
  before update on public.challenge_gym_scores
  for each row execute function public.set_updated_at();

comment on table public.challenge_gym_scores is
  'Solo per participant_type=gym_vs_gym. team_score = somma membri della palestra.';
```

- [ ] **Step 2.4: Aggiungi view `challenge_leaderboard_v` per privacy-safe SELECT**

```sql
-- ─── view: challenge_leaderboard_v ────────────────────────
-- Espone score JOIN profiles ma SOLO display_name (no email, no PII).
-- Se la membership è terminata o profile è cancellato, masking automatico.
create or replace view public.challenge_leaderboard_v
with (security_invoker = on)
as
select
  cs.challenge_id,
  cs.user_id,
  case
    when p.id is null then 'Account eliminato'
    when m.left_at is not null then 'Ex-membro'
    else coalesce(p.display_name, 'Anonimo')
  end as display_name,
  cs.score,
  cs.rank,
  cs.updated_at
from public.challenge_scores cs
left join public.profiles p on p.id = cs.user_id
left join public.gym_memberships m
  on m.user_id = cs.user_id
  and m.gym_id = (select gym_id from public.challenges where id = cs.challenge_id);

comment on view public.challenge_leaderboard_v is
  'Privacy-safe leaderboard. Maschera ex-member e account eliminati.';

grant select on public.challenge_leaderboard_v to authenticated;
```

- [ ] **Step 2.5: RLS su challenges + participants + scores + gym_scores**

```sql
-- ─── RLS challenges ───────────────────────────────────────
alter table public.challenges enable row level security;

create policy "owner manages gym challenges"
  on public.challenges for all to authenticated
  using (gym_id is not null and public.is_gym_owner(gym_id))
  with check (gym_id is not null and public.is_gym_owner(gym_id));

create policy "member selects gym challenges"
  on public.challenges for select to authenticated
  using (gym_id is not null and gym_id = public.active_gym_id(auth.uid()));

create policy "premium selects public challenges"
  on public.challenges for select to authenticated
  using (gym_id is null and public.has_premium_access(auth.uid()));

create policy "invited gym selects inter-gym challenge"
  on public.challenges for select to authenticated
  using (
    participant_type = 'gym_vs_gym'
    and exists (
      select 1 from public.challenge_gym_scores cgs
      where cgs.challenge_id = challenges.id
        and cgs.gym_id = public.active_gym_id(auth.uid())
    )
  );

create policy "admin selects all challenges"
  on public.challenges for select to authenticated
  using (public.is_admin());

-- ─── RLS challenge_participants ───────────────────────────
alter table public.challenge_participants enable row level security;

-- INSERT: solo via SECURITY DEFINER join_challenge.
-- SELECT: co-partecipanti vedono lista (per leaderboard).
create policy "co-participants see participation"
  on public.challenge_participants for select to authenticated
  using (
    exists(
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_participants.challenge_id
        and cp.user_id = auth.uid()
    )
  );

create policy "gym owner sees challenge participants"
  on public.challenge_participants for select to authenticated
  using (
    exists(
      select 1 from public.challenges c
      where c.id = challenge_participants.challenge_id
        and c.gym_id is not null and public.is_gym_owner(c.gym_id)
    )
  );

-- DELETE: self leave
create policy "self leaves challenge"
  on public.challenge_participants for delete to authenticated
  using (user_id = auth.uid());

-- ─── RLS challenge_scores ─────────────────────────────────
alter table public.challenge_scores enable row level security;

create policy "co-participants see scores"
  on public.challenge_scores for select to authenticated
  using (
    exists(
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_scores.challenge_id
        and cp.user_id = auth.uid()
    )
  );

create policy "gym owner sees gym challenge scores"
  on public.challenge_scores for select to authenticated
  using (
    exists(
      select 1 from public.challenges c
      where c.id = challenge_scores.challenge_id
        and c.gym_id is not null and public.is_gym_owner(c.gym_id)
    )
  );

create policy "admin sees all scores"
  on public.challenge_scores for select to authenticated
  using (public.is_admin());
-- UPDATE: solo service_role (cron refresh).

-- ─── RLS challenge_gym_scores ─────────────────────────────
alter table public.challenge_gym_scores enable row level security;

create policy "gym sees own gym scores"
  on public.challenge_gym_scores for select to authenticated
  using (gym_id = public.active_gym_id(auth.uid()) or public.is_gym_owner(gym_id));

create policy "challenge participants see gym scores"
  on public.challenge_gym_scores for select to authenticated
  using (
    exists(
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenge_gym_scores.challenge_id
        and cp.user_id = auth.uid()
    )
  );

create policy "admin sees all gym scores"
  on public.challenge_gym_scores for select to authenticated
  using (public.is_admin());
```

- [ ] **Step 2.6: Commit migration 009**

```bash
git add supabase/migrations/20260514120002_init_challenges.sql
git commit -m "$(cat <<'EOF'
feat(migration-009): challenges core schema + leaderboard view

- challenges (gym_id nullable per B2C/inter-gym)
- challenge_participants (unique device_id per challenge)
- challenge_scores (individual leaderboard)
- challenge_gym_scores (team aggregato inter-gym)
- view challenge_leaderboard_v (privacy-safe, maschera ex-member)
- RLS deny-by-default, INSERT participants solo via SECURITY DEFINER

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migration 010 — Anti-cheat

**Files:**
- Create: `supabase/migrations/20260514120003_init_anti_cheat.sql`

- [ ] **Step 3.1: Crea tabelle `metric_caps` + `disqualifications` + seed default caps**

```sql
-- ─────────────────────────────────────────────────────────
-- Migration 010 — Anti-cheat: metric_caps + disqualifications
-- Cap giornaliero per metrica (global o per-gym) + escape hatch
-- manuale del trainer per squalifica partecipante.
-- ─────────────────────────────────────────────────────────

-- ─── metric_caps: limite giornaliero contabile in leaderboard ─
create table public.metric_caps (
  id bigserial primary key,
  metric text not null check (metric in (
    'steps','distance_m','active_minutes','calories_kcal','workouts_count'
  )),
  scope text not null check (scope in ('global','gym')),
  gym_id uuid references public.gyms(id) on delete cascade,
  daily_max numeric not null check (daily_max > 0),
  reason text,
  created_at timestamptz not null default now(),
  -- Coerenza: scope='gym' richiede gym_id, scope='global' richiede gym_id NULL
  check (
    (scope = 'global' and gym_id is null) or
    (scope = 'gym' and gym_id is not null)
  )
);

-- Un solo cap global per metrica, un solo cap per (gym, metrica)
create unique index metric_caps_global_idx
  on public.metric_caps (metric)
  where scope = 'global';
create unique index metric_caps_gym_idx
  on public.metric_caps (gym_id, metric)
  where scope = 'gym';

comment on table public.metric_caps is
  'Cap giornaliero anti-cheating. Global come fallback, gym override per palestre con atleti veri.';

-- Seed default global caps (sensati per persone normali)
insert into public.metric_caps (metric, scope, daily_max, reason) values
  ('steps', 'global', 50000, 'Limite passi giornalieri normali (max ultramaratoneta ~80k)'),
  ('distance_m', 'global', 100000, '100km/giorno limite ragionevole (incl. ciclismo)'),
  ('active_minutes', 'global', 720, '12 ore di attività'),
  ('calories_kcal', 'global', 8000, 'Limite biofisico estremo'),
  ('workouts_count', 'global', 6, 'Massimo 6 workout in un giorno');

-- ─── disqualifications: squalifica manuale del trainer ────
create table public.disqualifications (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  disqualified_by uuid not null references public.profiles(id) on delete set null,
  reason text not null check (length(reason) between 5 and 500),
  created_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create index disqualifications_user_idx
  on public.disqualifications (user_id);

comment on table public.disqualifications is
  'Trainer/owner override per squalifica partecipante. Conteggio nel cron refresh esclude i record qui.';

-- ─── RLS metric_caps ──────────────────────────────────────
alter table public.metric_caps enable row level security;

create policy "anyone reads metric caps"
  on public.metric_caps for select to authenticated
  using (true);

create policy "admin manages global caps"
  on public.metric_caps for all to authenticated
  using (public.is_admin() and scope = 'global')
  with check (public.is_admin() and scope = 'global');

create policy "gym owner manages own caps"
  on public.metric_caps for all to authenticated
  using (scope = 'gym' and public.is_gym_owner(gym_id))
  with check (scope = 'gym' and public.is_gym_owner(gym_id));

-- ─── RLS disqualifications ────────────────────────────────
alter table public.disqualifications enable row level security;

-- INSERT/DELETE: solo via SECURITY DEFINER disqualify_participant.
-- SELECT: l'utente squalificato vede (trasparenza); owner/trainer vede.
create policy "self sees own disqualification"
  on public.disqualifications for select to authenticated
  using (user_id = auth.uid());

create policy "gym owner sees disqualifications"
  on public.disqualifications for select to authenticated
  using (
    exists (
      select 1 from public.challenges c
      where c.id = disqualifications.challenge_id
        and c.gym_id is not null and public.is_gym_owner(c.gym_id)
    )
  );

create policy "admin sees all disqualifications"
  on public.disqualifications for select to authenticated
  using (public.is_admin());
```

- [ ] **Step 3.2: Commit migration 010**

```bash
git add supabase/migrations/20260514120003_init_anti_cheat.sql
git commit -m "$(cat <<'EOF'
feat(migration-010): anti-cheat — metric_caps + disqualifications

- metric_caps con scope global o gym, default seed sensati
- disqualifications con motivazione richiesta (5-500 char)
- RLS: owner/trainer override su sua gym, admin su global

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Migration 011 — B2C subscriptions (con supporto Lifetime)

**Files:**
- Create: `supabase/migrations/20260514120004_init_b2c_subs.sql`

- [ ] **Step 4.1: Crea tabella `b2c_subscriptions` con supporto subscription + lifetime**

```sql
-- ─────────────────────────────────────────────────────────
-- Migration 011 — B2C subscriptions
-- Supporta DUE acquisti via Google Play (e futuro Apple IAP):
--   1. Subscription product 'fitmesh_b2c_semi_annual' (0,99€/6mo)
--   2. One-time non-consumable 'fitmesh_b2c_lifetime' (3,99€)
--   Lifetime: active_until = '9999-12-31', auto_renewing=false.
-- ─────────────────────────────────────────────────────────

create table public.b2c_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  -- 'trial' = 7gg gratis al primo install (one-time per user).
  billing_source text not null
    check (billing_source in ('google_play','apple_iap','stripe','trial')),
  external_product_id text not null,
  external_subscription_id text not null,
  external_order_id text,
  active_until timestamptz not null,
  auto_renewing boolean not null default true,
  state text not null default 'active'
    check (state in ('active','grace','on_hold','paused','expired','cancelled')),
  last_notification_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_source, external_subscription_id)
);

create index b2c_subscriptions_state_idx
  on public.b2c_subscriptions (state, active_until);

-- Helper boolean predicato lifetime: active_until oltre 100 anni dal now()
-- è il sentinel "mai scade" (in pratica '9999-12-31').
-- Non IMMUTABLE per CREATE INDEX, ma usabile in WHERE delle query.
create or replace function public.is_b2c_lifetime(row public.b2c_subscriptions)
returns boolean
language sql
immutable
as $$
  select row.active_until > '9000-01-01'::timestamptz;
$$;

create trigger trg_b2c_subscriptions_updated_at
  before update on public.b2c_subscriptions
  for each row execute function public.set_updated_at();

comment on table public.b2c_subscriptions is
  'B2C consumer subs. Lifetime = active_until > 9000-01-01 (sentinel).';

comment on function public.is_b2c_lifetime is
  'TRUE se row è lifetime (active_until oltre il 9000). Immutable.';

-- ─── RLS b2c_subscriptions ────────────────────────────────
alter table public.b2c_subscriptions enable row level security;

create policy "self reads own b2c sub"
  on public.b2c_subscriptions for select to authenticated
  using (user_id = auth.uid());

create policy "admin reads all b2c subs"
  on public.b2c_subscriptions for select to authenticated
  using (public.is_admin());
-- INSERT/UPDATE/DELETE: solo via service_role (backend Play verify endpoint).
```

- [ ] **Step 4.2: Commit migration 011**

```bash
git add supabase/migrations/20260514120004_init_b2c_subs.sql
git commit -m "$(cat <<'EOF'
feat(migration-011): b2c_subscriptions — supporto 6mo + Lifetime

- billing_source per multi-store (google_play, apple_iap, stripe)
- Lifetime via active_until sentinel '9999-12-31'
- Funzione is_b2c_lifetime() helper IMMUTABLE
- RLS: self read, admin read, INSERT/UPDATE solo service_role

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Migration 012 — Gateway functions (SECURITY DEFINER)

**Files:**
- Create: `supabase/migrations/20260514120005_gym_gateway_functions.sql`

- [ ] **Step 5.1: Header + `redeem_invite_code(code text)`**

```sql
-- ─────────────────────────────────────────────────────────
-- Migration 012 — Gateway functions (SECURITY DEFINER)
-- Tutti gli INSERT su gym_memberships e challenge_participants
-- passano da queste funzioni che validano ownership + auth.uid().
-- ─────────────────────────────────────────────────────────

-- ─── redeem_invite_code(code) ─────────────────────────────
-- Validates: code matches gym, user not already in active membership,
--            gym is in 'trial' or 'active' status.
create or replace function public.redeem_invite_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_gym_id uuid;
  v_gym_status text;
  v_user_id uuid;
  v_membership_id bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Trova gym corrispondente
  select id, status into v_gym_id, v_gym_status
  from public.gyms
  where invite_code = upper(p_code);

  if v_gym_id is null then
    raise exception 'Invalid invite code' using errcode = 'P0002';
  end if;

  if v_gym_status not in ('trial','active') then
    raise exception 'Gym is not accepting members (status: %)', v_gym_status
      using errcode = 'P0001';
  end if;

  -- Verifica no membership attiva
  if exists(
    select 1 from public.gym_memberships
    where user_id = v_user_id and left_at is null
  ) then
    raise exception 'Already member of another gym (leave first)'
      using errcode = 'P0001';
  end if;

  -- Insert
  insert into public.gym_memberships (user_id, gym_id, role)
  values (v_user_id, v_gym_id, 'member')
  returning id into v_membership_id;

  return v_gym_id;
end;
$$;

grant execute on function public.redeem_invite_code(text) to authenticated;

comment on function public.redeem_invite_code is
  'Join palestra via codice 6-digit. Ritorna gym_id su successo.';
```

- [ ] **Step 5.2: `accept_email_invite(invite_id uuid)`**

```sql
-- ─── accept_email_invite(invite_id) ───────────────────────
create or replace function public.accept_email_invite(p_invite_id bigint)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite record;
  v_user_id uuid;
  v_user_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select email into v_user_email from public.profiles where id = v_user_id;

  -- Trova invito valido (per email del user, non scaduto, non già accettato)
  select * into v_invite from public.gym_email_invites
  where id = p_invite_id
    and lower(email) = lower(v_user_email)
    and accepted_at is null
    and expires_at > now();

  if v_invite.id is null then
    raise exception 'Invite not found or expired' using errcode = 'P0002';
  end if;

  -- Verifica no membership attiva
  if exists(
    select 1 from public.gym_memberships
    where user_id = v_user_id and left_at is null
  ) then
    raise exception 'Already member of another gym (leave first)'
      using errcode = 'P0001';
  end if;

  -- Insert membership
  insert into public.gym_memberships (user_id, gym_id, role)
  values (v_user_id, v_invite.gym_id, 'member');

  -- Marca invito come accettato
  update public.gym_email_invites
  set accepted_at = now(), accepted_user_id = v_user_id
  where id = p_invite_id;

  return v_invite.gym_id;
end;
$$;

grant execute on function public.accept_email_invite(bigint) to authenticated;

comment on function public.accept_email_invite is
  'Accetta invito email. Verifica match email + non scaduto.';
```

- [ ] **Step 5.3: `join_challenge(challenge_id, device_id)`**

```sql
-- ─── join_challenge(challenge_id, device_id) ──────────────
create or replace function public.join_challenge(
  p_challenge_id uuid,
  p_device_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_challenge record;
  v_user_gym_id uuid;
  v_device_owner uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Verifica device appartiene al user
  select user_id into v_device_owner from public.devices where id = p_device_id;
  if v_device_owner is null then
    raise exception 'Device not found' using errcode = 'P0002';
  end if;
  if v_device_owner <> v_user_id then
    raise exception 'Device does not belong to caller' using errcode = '42501';
  end if;

  -- Carica challenge
  select * into v_challenge from public.challenges where id = p_challenge_id;
  if v_challenge.id is null then
    raise exception 'Challenge not found' using errcode = 'P0002';
  end if;

  if v_challenge.status not in ('draft','active') then
    raise exception 'Challenge not joinable (status: %)', v_challenge.status
      using errcode = 'P0001';
  end if;

  if v_challenge.period_end < now() then
    raise exception 'Challenge has ended' using errcode = 'P0001';
  end if;

  -- Authorization: l'utente può joinare se:
  -- (a) challenge ha gym_id e l'utente è membro di quel gym, OPPURE
  -- (b) challenge ha gym_id NULL (B2C/public) e l'utente ha has_premium_access
  if v_challenge.gym_id is not null then
    v_user_gym_id := public.active_gym_id(v_user_id);
    if v_user_gym_id is null or v_user_gym_id <> v_challenge.gym_id then
      -- Per gym_vs_gym, controlla se la gym dell'utente è invitata
      if v_challenge.participant_type = 'gym_vs_gym' and exists(
        select 1 from public.challenge_gym_scores cgs
        where cgs.challenge_id = p_challenge_id
          and cgs.gym_id = v_user_gym_id
      ) then
        null; -- ok, sua palestra è invitata
      else
        raise exception 'Not a member of this gym' using errcode = '42501';
      end if;
    end if;
  else
    -- Challenge B2C pubblica
    if not public.has_premium_access(v_user_id) then
      raise exception 'Premium access required for public challenges'
        using errcode = '42501';
    end if;
  end if;

  -- Insert (idempotente se già joinato)
  insert into public.challenge_participants (challenge_id, user_id, device_id_used)
  values (p_challenge_id, v_user_id, p_device_id)
  on conflict (challenge_id, user_id) do nothing;

  -- Inizializza score row
  insert into public.challenge_scores (challenge_id, user_id, score)
  values (p_challenge_id, v_user_id, 0)
  on conflict do nothing;
end;
$$;

grant execute on function public.join_challenge(uuid, uuid) to authenticated;

comment on function public.join_challenge is
  'Opt-in challenge con device picker. Verifica membership/premium.';
```

- [ ] **Step 5.4: `leave_challenge(challenge_id)`**

```sql
-- ─── leave_challenge(challenge_id) ────────────────────────
create or replace function public.leave_challenge(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  delete from public.challenge_participants
  where challenge_id = p_challenge_id and user_id = v_user_id;

  delete from public.challenge_scores
  where challenge_id = p_challenge_id and user_id = v_user_id;
end;
$$;

grant execute on function public.leave_challenge(uuid) to authenticated;

comment on function public.leave_challenge is
  'Abbandono challenge. Rimuove participation e score (la riga ricomparirà come Ex-membro nella view se torna).';
```

- [ ] **Step 5.5: `disqualify_participant(challenge_id, user_id, reason)`**

```sql
-- ─── disqualify_participant(challenge_id, user_id, reason) ─
create or replace function public.disqualify_participant(
  p_challenge_id uuid,
  p_user_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller_id uuid;
  v_challenge_gym uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if length(coalesce(p_reason,'')) < 5 then
    raise exception 'Reason must be at least 5 characters' using errcode = 'P0001';
  end if;

  -- Trova gym della challenge
  select gym_id into v_challenge_gym from public.challenges where id = p_challenge_id;
  if v_challenge_gym is null then
    raise exception 'Challenge has no owning gym (cannot disqualify)'
      using errcode = 'P0001';
  end if;

  -- Verifica caller è owner della gym
  if not public.is_gym_owner(v_challenge_gym) then
    raise exception 'Only gym owner can disqualify' using errcode = '42501';
  end if;

  -- Insert (rimpiazza eventuale precedente)
  insert into public.disqualifications (challenge_id, user_id, disqualified_by, reason)
  values (p_challenge_id, p_user_id, v_caller_id, p_reason)
  on conflict (challenge_id, user_id) do update
    set disqualified_by = excluded.disqualified_by,
        reason = excluded.reason,
        created_at = now();

  -- Forza score a 0 immediato (il cron lo escluderebbe comunque)
  update public.challenge_scores
  set score = 0, rank = null
  where challenge_id = p_challenge_id and user_id = p_user_id;
end;
$$;

grant execute on function public.disqualify_participant(uuid, uuid, text) to authenticated;

comment on function public.disqualify_participant is
  'Squalifica manuale. Solo gym owner della challenge.';
```

- [ ] **Step 5.6: `rotate_invite_code(gym_id)`**

```sql
-- ─── rotate_invite_code(gym_id) ───────────────────────────
create or replace function public.rotate_invite_code(p_gym_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_new_code text;
  v_attempts int := 0;
begin
  if not public.is_gym_owner(p_gym_id) then
    raise exception 'Only gym owner can rotate code' using errcode = '42501';
  end if;

  -- Genera nuovo codice 6-char alphanum uppercase, retry su collisione
  loop
    v_attempts := v_attempts + 1;
    v_new_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));

    begin
      update public.gyms set invite_code = v_new_code, updated_at = now()
      where id = p_gym_id;
      exit; -- ok, no conflict
    exception when unique_violation then
      if v_attempts > 10 then
        raise exception 'Could not generate unique code after 10 attempts';
      end if;
    end;
  end loop;

  return v_new_code;
end;
$$;

grant execute on function public.rotate_invite_code(uuid) to authenticated;

comment on function public.rotate_invite_code is
  'Genera nuovo invite_code 6-char. Solo owner.';
```

- [ ] **Step 5.7: `grant_b2c_trial()` — attiva trial 7gg one-time**

```sql
-- ─── grant_b2c_trial() — trial premium 7gg one-time ───────
-- Idempotente. Crea row b2c_subscriptions con billing_source='trial'
-- se il caller non ha mai consumato un trial né ha sub attiva.
-- Ritorna TRUE se trial concesso ora, FALSE se già esistente.
create or replace function public.grant_b2c_trial()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_existing record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Verifica no row preesistente (trial già consumato o sub attiva/scaduta)
  select billing_source, state, active_until into v_existing
  from public.b2c_subscriptions
  where user_id = v_user_id;

  if v_existing is not null then
    -- Trial già consumato (anche scaduto) blocca un secondo trial.
    -- Sub paying esistente: non sovrascrivere.
    return false;
  end if;

  insert into public.b2c_subscriptions (
    user_id,
    billing_source,
    external_product_id,
    external_subscription_id,
    active_until,
    auto_renewing,
    state
  ) values (
    v_user_id,
    'trial',
    'fitmesh_b2c_trial_7d',
    'trial-' || v_user_id::text,
    now() + interval '7 days',
    false,
    'active'
  );

  return true;
end;
$$;

grant execute on function public.grant_b2c_trial() to authenticated;

comment on function public.grant_b2c_trial is
  'Trial premium 7gg one-time. Idempotente: blocca un secondo trial sullo stesso user.';
```

- [ ] **Step 5.8: Commit migration 012**

```bash
git add supabase/migrations/20260514120005_gym_gateway_functions.sql
git commit -m "$(cat <<'EOF'
feat(migration-012): SECURITY DEFINER gateway functions

- redeem_invite_code(code) — join gym via 6-char code
- accept_email_invite(id) — accetta invito email
- join_challenge(challenge_id, device_id) — opt-in con auth check
- leave_challenge(id) — abbandono
- disqualify_participant(challenge_id, user_id, reason) — owner only
- rotate_invite_code(gym_id) — rigenera 6-char con retry su collisione
- grant_b2c_trial() — trial premium 7gg one-time per user

Tutte SET search_path = public, auth + raise exception con errcode coerenti.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Smoke test SQL su Supabase (manuale)

**Files:**
- No file changes — testing only

- [ ] **Step 6.1: Applica le 5 migration su Supabase**

Apri Supabase Dashboard → progetto fitmesh-site → SQL Editor → New Query.

Per ogni migration (in ordine 008 → 012):
1. Copia il contenuto del file SQL
2. Incolla nel SQL Editor
3. Run
4. Conferma "Success. No rows returned" (o seed inserito per 008/010)

In alternativa via CLI:
```bash
cd /Volumes/LOS\ ANGELES/Matteo/Dev\ Roba\ Mia/App\ Orologio/fitthesite
npx supabase db push --linked
```

Expected: 5 file applicati senza errori.

- [ ] **Step 6.2: Verifica schema: tabelle create**

In SQL Editor esegui:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'gym_tiers','gyms','gym_memberships','gym_subscriptions',
    'gym_email_invites','challenges','challenge_participants',
    'challenge_scores','challenge_gym_scores','metric_caps',
    'disqualifications','b2c_subscriptions'
  )
order by table_name;
```

Expected: 12 righe (tutte le tabelle nuove).

- [ ] **Step 6.3: Verifica seed `gym_tiers`**

```sql
select id, display_name, monthly_price_cents,
       features->>'max_concurrent_challenges' as max_challenges,
       features->>'inter_gym' as inter_gym
from public.gym_tiers
order by coalesce(monthly_price_cents, 999999);
```

Expected: 4 righe (base 2900, advanced 5900, premium 12900, custom NULL).

- [ ] **Step 6.4: Verifica seed `metric_caps` (global)**

```sql
select metric, scope, daily_max from public.metric_caps
where scope = 'global' order by metric;
```

Expected: 5 righe (steps 50000, distance_m 100000, active_minutes 720, calories_kcal 8000, workouts_count 6).

- [ ] **Step 6.5: Verifica funzioni SECURITY DEFINER esistenti**

```sql
select proname, prosecdef
from pg_proc
where proname in (
  'is_gym_owner','active_gym_id','has_premium_access',
  'redeem_invite_code','accept_email_invite','join_challenge',
  'leave_challenge','disqualify_participant','rotate_invite_code'
)
order by proname;
```

Expected: 9 righe, tutte con `prosecdef = true`.

- [ ] **Step 6.6: Test funzionale base (RLS + gateway)**

Setup: serve almeno un user autenticato. Usa l'utente che hai già loggato in /it/admin (es. mat.pizzi@gmail.com).

A. **Crea una gym test** (devi farlo come tuo owner — diretto, non via gateway):

```sql
-- Esegui come service_role o admin (via SQL Editor è service_role)
insert into public.gyms (owner_user_id, name, slug, invite_code, status, trial_ends_at)
values (
  (select id from public.profiles where email = 'mat.pizzi@gmail.com'),
  'Test Gym Alpha',
  'test-gym-alpha',
  'ALPHA1',
  'trial',
  now() + interval '30 days'
)
returning id, invite_code;
```

Salva il gym_id ritornato per i passi successivi.

B. **Simula join via SECURITY DEFINER (con un secondo utente)**:

Per testare `redeem_invite_code` serve un altro user loggato (auth.uid() != owner). Skippa se non hai un secondo account; testa solo che la funzione esista e dia errore "Not authenticated" su anon call:

```sql
-- Test che la funzione esista
select pg_get_function_arguments(oid) from pg_proc where proname = 'redeem_invite_code';
-- Expected: 'p_code text'

-- Test invocazione con codice inesistente (deve dare P0002)
-- Da Supabase SQL Editor sei service_role, salta. Per testare RLS:
-- set role authenticated; set request.jwt.claims = ...
```

C. **Cleanup test gym**:

```sql
delete from public.gyms where slug = 'test-gym-alpha';
```

Expected: 1 row deleted. Cascade rimuove eventuali membership.

- [ ] **Step 6.7: Documenta risultati nel CURRENT_HANDOFF**

Apri (o crea) `/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/App Orologio/fitthesite/CURRENT_HANDOFF.md` e annota:
- Data applicazione migration 008-012
- Output di Step 6.2 / 6.3 / 6.4 / 6.5
- Eventuali deviazioni dal piano

(Se il file non esiste o non ha senso modificarlo, salta — questo è documentation overhead opzionale.)

---

## Task 7: Regen TypeScript types

**Files:**
- Modify: `lib/supabase/database.types.ts` (rigenerato automaticamente)

- [ ] **Step 7.1: Esegui `supabase gen types`**

```bash
cd /Volumes/LOS\ ANGELES/Matteo/Dev\ Roba\ Mia/App\ Orologio/fitthesite
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Expected: file `lib/supabase/database.types.ts` aggiornato con le 12 tabelle nuove.

Se il comando `--linked` non funziona (project non collegato CLI), usa:
```bash
npx supabase gen types typescript \
  --project-id <PROJECT_ID> > lib/supabase/database.types.ts
```

dove `<PROJECT_ID>` è preso da Supabase Dashboard → Settings → API → Project Reference.

- [ ] **Step 7.2: Verifica che i tipi compilino**

```bash
cd /Volumes/LOS\ ANGELES/Matteo/Dev\ Roba\ Mia/App\ Orologio/fitthesite
npx tsc --noEmit
```

Expected: no errors. Se ci sono errori, sono probabilmente legati al cast `as never` nel `DeleteAccountSection` che ora potrebbe avere tipi reali e fallire. In quel caso rimuovi il cast `as never` e usa i tipi generati.

- [ ] **Step 7.3: Commit tipi rigenerati**

```bash
git add lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
chore(types): rigenera database.types.ts da live schema

Include le 12 nuove tabelle gym-social + b2c_subscriptions + le viste
e funzioni SECURITY DEFINER esposte come RPC.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Schema reference doc + chiusura sprint

**Files:**
- Create: `docs/architecture/gym-schema-reference.md`

- [ ] **Step 8.1: Crea documentazione reference per Sprint 1**

Crea il file con questo contenuto:

```markdown
# Gym Schema Reference (Sprint 0 deliverable)

Riferimento rapido per Sprint 1+ implementatori. Per la spec completa vedi
[`docs/superpowers/specs/2026-05-13-gym-social-design.md`](../superpowers/specs/2026-05-13-gym-social-design.md).

## Tabelle nuove (Sprint 0)

| Tabella | Scopo | RLS pattern |
|---------|-------|-------------|
| `gym_tiers` | Catalogo 4 tier (seed) | Read public, manage admin |
| `gyms` | Palestre clienti | Owner all, member select own |
| `gym_memberships` | Active + storico | Self select, owner select, INSERT via function |
| `gym_subscriptions` | Mapping Stripe | Owner read, INSERT service_role |
| `gym_email_invites` | Email invite | Owner manage, invitee select |
| `challenges` | Primitiva challenge | Owner manage, member select, INSERT solo via owner |
| `challenge_participants` | Opt-in con device | Co-participants select, INSERT via function |
| `challenge_scores` | Leaderboard individuale | Co-participants select, UPDATE service_role (cron) |
| `challenge_gym_scores` | Leaderboard team gym_vs_gym | Gym/participant select |
| `metric_caps` | Cap anti-cheat (global+gym) | Read public, manage admin/owner |
| `disqualifications` | Squalifica trainer | Self select, owner select, INSERT via function |
| `b2c_subscriptions` | Subs consumer (sub+lifetime) | Self read, INSERT service_role |

## View

- `challenge_leaderboard_v` — privacy-safe SELECT: maschera ex-member ("Ex-membro")
  e account eliminati ("Account eliminato"). Sempre usare questa view nel client,
  mai SELECT diretta su `challenge_scores` JOIN `profiles`.

## Gateway functions (chiamabili da client `to authenticated`)

| Funzione | Argomenti | Ritorno | Permessi |
|----------|-----------|---------|----------|
| `redeem_invite_code(code text)` | code 6-char | uuid (gym_id) | authenticated |
| `accept_email_invite(invite_id bigint)` | id invito | uuid (gym_id) | authenticated, match email |
| `join_challenge(challenge_id uuid, device_id uuid)` | id challenge + device | void | authenticated, must be member/premium |
| `leave_challenge(challenge_id uuid)` | id challenge | void | authenticated, self |
| `disqualify_participant(challenge_id, user_id, reason)` | trio | void | authenticated, must be gym owner |
| `rotate_invite_code(gym_id uuid)` | gym | text (new code) | authenticated, must be gym owner |

## Helper functions (per RLS policy)

| Funzione | Uso | Note |
|----------|-----|------|
| `is_gym_owner(gym_id uuid)` | Filtro RLS | Stable, security definer |
| `active_gym_id(user_id uuid)` | Lookup gym del membro | Ritorna NULL se nessuna |
| `has_premium_access(user_id uuid)` | Gate B2C+gym | Cover gym-covered e b2c |
| `is_b2c_lifetime(row b2c_subscriptions)` | Predicato lifetime | Immutable |

## Pattern di JOIN

### Leaderboard di una challenge (mostra a un partecipante)

```sql
select display_name, score, rank
from public.challenge_leaderboard_v
where challenge_id = $1
order by rank nulls last
limit 50;
```

### Lista challenge attive della mia palestra

```sql
select id, name, metric, period_start, period_end
from public.challenges
where gym_id = public.active_gym_id(auth.uid())
  and status = 'active'
  and period_end > now()
order by period_end;
```

### Lista membri di una palestra (per owner)

```sql
select m.user_id, p.display_name, p.email, m.joined_at, m.role
from public.gym_memberships m
join public.profiles p on p.id = m.user_id
where m.gym_id = $1
  and m.left_at is null
order by m.joined_at desc;
```

### Verifica premium (per gate UI)

```sql
select public.has_premium_access(auth.uid());
```

## Edge cases gestiti

- **Membro abbandona palestra**: `left_at = now()` (UPDATE), display_name diventa
  "Ex-membro" nella view leaderboard.
- **Membro cancella account**: cascade rimuove gym_memberships, challenge_participants,
  challenge_scores. View mostra "Account eliminato".
- **Palestra lapsed**: `has_premium_access` ritorna false → membri perdono accesso
  challenge ma `gym_membership` resta attiva (può essere riattivata su rinnovo).
- **B2C lifetime**: `active_until = '9999-12-31'`, mai marcato expired dal cron.

## Cosa NON c'è ancora (Sprint successivi)

- Cron job `refresh_challenge_scores` (Sprint 2)
- Cron job `archive_ended_challenges` (Sprint 2)
- Cron job `mark_lapsed_gyms` (Sprint 3)
- Cron job `cleanup_expired_subscriptions` (Sprint 4)
- Edge function per Stripe webhook (Sprint 3)
- Edge function per Google Play verify + RTDN (Sprint 4)
- Branded leaderboard styling (Sprint 5)
```

- [ ] **Step 8.2: Commit doc reference + chiusura sprint**

```bash
cd /Volumes/LOS\ ANGELES/Matteo/Dev\ Roba\ Mia/App\ Orologio/fitthesite
git add docs/architecture/gym-schema-reference.md
git commit -m "$(cat <<'EOF'
docs(gym-schema): quick reference per Sprint 1 + chiusura Sprint 0

Reference rapido: tabelle, view, gateway functions, helper functions,
pattern JOIN comuni, edge cases. Punto di partenza per Sprint 1
(gym owner dashboard).

Sprint 0 deliverables complete:
- 5 migration applicate (008-012)
- Schema 12 tabelle + view + 9 funzioni
- RLS deny-by-default + gateway SECURITY DEFINER
- Tipi TypeScript rigenerati
- Smoke test SQL passato

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Acceptance Criteria — Sprint 0 complete

L'utente conferma Sprint 0 chiuso quando:

1. ✅ 5 file migration creati in `supabase/migrations/` (timestamp 20260514120001-005)
2. ✅ Le 5 migration applicate su Supabase senza errori
3. ✅ Query SQL `select count(*) from information_schema.tables where table_schema='public'` ritorna almeno **12 nuove tabelle**
4. ✅ Seed `gym_tiers` ha 4 righe (base/advanced/premium/custom)
5. ✅ Seed `metric_caps` ha 5 righe global
6. ✅ Funzioni SECURITY DEFINER 10 totali (3 helper + 7 gateway incluso `grant_b2c_trial`), tutte con `set search_path = public, auth`
7. ✅ `database.types.ts` rigenerato e `npx tsc --noEmit` passa senza errori
8. ✅ `docs/architecture/gym-schema-reference.md` esiste
9. ✅ 7 commit puliti sul branch (uno per migration + 1 types + 1 doc) — nessun `--no-verify`, nessun hooks skip
10. ✅ Test SQL manuale di Step 6.2/6.3/6.4/6.5 tutti green

Cose **non** richieste in Sprint 0:
- Nessuna UI/route Next.js
- Nessun webhook Stripe / Google Play
- Nessun cron job nuovo (i cron job vengono in Sprint 2+)
- Nessuna seed data oltre `gym_tiers` e `metric_caps`

---

## Risks & mitigations

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Errore IMMUTABLE su CREATE INDEX (recidiva migration 004) | Bassa | Alto | Tutti i partial index usano colonne non-volatili (`left_at`, `accepted_at`, `scope`); nessun `now()` nei `WHERE` |
| Conflitto invite_code 6-char collision | Bassa | Medio | `rotate_invite_code` ha retry loop fino a 10 tentativi |
| FK cascade rompe storico (es. DELETE gym cancella memberships storiche) | Media | Alto | Le memberships storiche **sono** cascade DELETE (intenzionale: se palestra cancella account, suo contenuto va con lei). Score storici cascade da challenges. |
| `has_premium_access` ordine d'applicazione (referenzia b2c_subscriptions creata in 011) | Bassa | Medio | Funzione usa `to_regclass()` per check esistenza tabella prima di EXECUTE. Refattorizzabile in 012 in pure SQL una volta che 011 è in place. |
| `supabase gen types` non funziona (CLI non installata / non collegata) | Media | Basso | Fallback: copia-incolla via Dashboard → API Docs → TypeScript types |
| RLS troppo restrittiva blocca query legittime in Sprint 1 | Media | Medio | Test SQL Step 6.6 + smoke con secondo account dev. Eventuali fix in migration 013 in fase Sprint 1 |
| Tipi `as never` esistenti in `DeleteAccountSection.tsx` fallano dopo rigen | Media | Basso | Rimuovere cast `as never`, usare tipi reali — change isolato a 1 file |
| Hooks pre-commit (lint/prettier) bloccano migration file | Bassa | Basso | I file `.sql` non passano da next-lint; verifica `.gitignore`/hooks config locali se errore |

---

## Self-review note

Spec coverage check (sezione 3 dello spec): tutte le 12 tabelle dichiarate sono in
plan ✓. Funzioni `is_gym_owner` + `active_gym_id` + `has_premium_access` in
Task 1 ✓. Le 6 gateway functions del spec sezione 4 in Task 5 ✓. Privacy view
`challenge_leaderboard_v` in Task 2 ✓. Lifetime support B2C in Task 4 ✓ (con
sentinel '9999-12-31'). RLS deny-by-default + INSERT solo via gateway in tutti
i task ✓.

Placeholder scan: nessun "TBD" / "TODO" / "fill in" nei task. Tutte le commit
message hanno contenuto reale. Tutti i nomi colonne, funzioni, vincoli sono
espliciti.

Type consistency: helper functions sono `stable security definer` ovunque,
gateway functions sono `plpgsql security definer`. Naming `is_gym_owner` /
`active_gym_id` / `has_premium_access` coerente in tutti i riferimenti.

Open risks: la rigen types (Task 7) richiede Supabase CLI configurata. Se non
funziona, segui fallback in Step 7.1.
