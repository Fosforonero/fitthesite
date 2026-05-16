-- ─────────────────────────────────────────────────────────
-- Migration 009 — Challenges core: challenge primitive +
--   participants + scores (individual & gym_vs_gym)
-- Include activity_filter jsonb (ispirato Health Sync): l'owner
-- può filtrare quali workout contano per metric/durata/distanza.
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

comment on column public.challenges.activity_filter is
  'Filtri opzionali sui workout che contano (Health Sync inspired). Default {} = no filter.';

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

-- ─── view: challenge_leaderboard_v ────────────────────────
-- Espone score JOIN profiles ma SOLO display_name (no email, no PII).
-- Se la membership e' terminata o profile e' cancellato, masking automatico.
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
