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
| `challenges` | Primitiva challenge (con activity_filter jsonb) | Owner manage, member select |
| `challenge_participants` | Opt-in con device | Co-participants select, INSERT via function |
| `challenge_scores` | Leaderboard individuale | Co-participants select, UPDATE service_role (cron) |
| `challenge_gym_scores` | Leaderboard team gym_vs_gym | Gym/participant select |
| `metric_caps` | Cap anti-cheat (global+gym, seed default) | Read public, manage admin/owner |
| `disqualifications` | Squalifica trainer | Self select, owner select, INSERT via function |
| `b2c_subscriptions` | Subs consumer (sub+lifetime+trial 7gg) | Self read, INSERT service_role + grant_b2c_trial |

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
| `grant_b2c_trial()` | — | boolean | authenticated, idempotente (one-time per user) |

## Helper functions (per RLS policy)

| Funzione | Uso | Note |
|----------|-----|------|
| `is_gym_owner(gym_id uuid)` | Filtro RLS | Stable, security definer |
| `active_gym_id(user_id uuid)` | Lookup gym del membro | Ritorna NULL se nessuna |
| `has_premium_access(user_id uuid)` | Gate B2C+gym+trial | Cover gym-covered, b2c sub/lifetime/trial |
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
select id, name, metric, activity_filter, period_start, period_end
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

### Attivazione trial al primo install

```sql
-- Client (app mobile) chiama questa RPC al primo avvio post-signup.
-- Ritorna TRUE se trial concesso ora, FALSE se gia consumato/in essere.
select public.grant_b2c_trial();
```

## Filtri activity_filter — esempio applicazione (Sprint 2 cron)

Il cron `refresh_challenge_scores` (Sprint 2) leggera `challenges.activity_filter`
e applichera il filtro sui workouts/fitness_metrics:

```sql
-- Esempio: aggregato passi per challenge attive con filtro activity types
select cp.challenge_id, cp.user_id, sum(w.steps) as score
from public.challenge_participants cp
join public.challenges c on c.id = cp.challenge_id
join public.workouts w
  on w.user_id = cp.user_id
  and w.start_ms >= extract(epoch from c.period_start) * 1000
  and w.end_ms <= extract(epoch from c.period_end) * 1000
  and (
    -- Niente filtro o filtro empty -> tutto conta
    c.activity_filter = '{}'::jsonb
    or coalesce(c.activity_filter->'activity_types', '[]'::jsonb) = '[]'::jsonb
    or w.activity_type = any(
      array(select jsonb_array_elements_text(c.activity_filter->'activity_types'))
    )
  )
  and w.duration_min >= coalesce((c.activity_filter->>'min_duration_min')::int, 0)
  and w.distance_m >= coalesce((c.activity_filter->>'min_distance_m')::numeric, 0)
where c.status = 'active'
group by cp.challenge_id, cp.user_id;
```

## Edge cases gestiti

- **Membro abbandona palestra**: `left_at = now()` (UPDATE), display_name diventa
  "Ex-membro" nella view leaderboard.
- **Membro cancella account**: cascade rimuove gym_memberships, challenge_participants,
  challenge_scores. View mostra "Account eliminato".
- **Palestra lapsed**: `has_premium_access` ritorna false → membri perdono accesso
  challenge ma `gym_membership` resta attiva (puo essere riattivata su rinnovo).
- **B2C lifetime**: `active_until = '9999-12-31'`, mai marcato expired dal cron.
- **B2C trial 7gg**: una sola volta per user. Una volta consumato (anche scaduto),
  `grant_b2c_trial()` ritorna false e non sovrascrive.

## Cosa NON c'e ancora (Sprint successivi)

- Cron job `refresh_challenge_scores` (Sprint 2) — applica activity_filter + metric_caps
- Cron job `archive_ended_challenges` (Sprint 2)
- Cron job `mark_lapsed_gyms` (Sprint 3)
- Cron job `cleanup_expired_subscriptions` (Sprint 4, esclude lifetime)
- Edge function per Stripe webhook (Sprint 3)
- Edge function per Google Play verify + RTDN (Sprint 4)
- Branded leaderboard styling (Sprint 5)
- Multi-source (Garmin/Polar/Fitbit) — roadmap v2
- Historical sync configurabile — roadmap v2
