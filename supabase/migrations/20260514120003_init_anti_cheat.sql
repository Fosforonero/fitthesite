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
  ('active_minutes', 'global', 720, '12 ore di attivita'),
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
