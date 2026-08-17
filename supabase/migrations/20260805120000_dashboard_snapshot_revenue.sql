-- Extends get_dashboard_snapshot() with a 'revenue' breakdown: real (non-founder)
-- paying customers split by product type (lifetime one-time vs 6-month
-- auto-renewing subscription) and platform (google_play/apple), counting only
-- currently-active rows. Prices themselves are NOT stored in the DB (no
-- amount/currency column on b2c_subscriptions) - they're the same business
-- constants as fitthesite/lib/pricing.ts (PRICE_LIFETIME_ANDROID_RAW=3.99,
-- PRICE_LIFETIME_IOS_RAW=4.99, PRICE_SUB_6M_RAW=1.19), applied client-side in
-- dashboard-locale.html / refresh_dashboard.py exactly like FOUNDER_CAP already is.
-- Same security posture as the base function: SELECT-only, no PII, service_role only.
--
-- NOT applied automatically. Review before running via Supabase MCP apply_migration
-- or `supabase db push` - production schema change (HUMAN_ONLY per AppFitmesh/CLAUDE.md).

create or replace function public.get_dashboard_snapshot(launch_date date default '2026-05-13')
returns jsonb
language sql
stable
security invoker
set search_path = public, auth
as $$
  with days as (
    select generate_series(launch_date, current_date, interval '1 day')::date as day
  ),
  signups as (
    select created_at::date as day, count(*) as n
    from auth.users
    group by 1
  ),
  platform_first as (
    select distinct on (user_id)
      user_id,
      case
        when os_version ilike 'ios%' then 'iOS'
        when os_version ilike 'android%' then 'Android'
        else 'unknown'
      end as platform,
      paired_at
    from public.devices
    where paired_at is not null
    order by user_id, paired_at asc
  ),
  devices_by_day as (
    select paired_at::date as day, platform, count(*) as n
    from platform_first
    group by 1, 2
  ),
  daily as (
    select
      d.day,
      coalesce(s.n, 0)::int as signups,
      coalesce(sum(db.n) filter (where db.platform = 'iOS'), 0)::int as ios,
      coalesce(sum(db.n) filter (where db.platform = 'Android'), 0)::int as android,
      coalesce(sum(db.n) filter (where db.platform = 'unknown'), 0)::int as unknown
    from days d
    left join signups s on s.day = d.day
    left join devices_by_day db on db.day = d.day
    group by d.day, s.n
  ),
  platform_totals as (
    select platform, count(*) as n from platform_first group by 1
  ),
  device_activity as (
    select user_id, max(last_seen_at) as last_seen
    from public.devices
    where paired_at is not null
    group by user_id
  ),
  metrics_activity as (
    select user_id, max(received_at) as last_synced
    from public.fitness_metrics
    group by user_id
  ),
  activity_base as (
    select
      u.id as user_id,
      u.created_at,
      greatest(coalesce(da.last_seen, '1970-01-01'), coalesce(ma.last_synced, '1970-01-01')) as last_activity
    from auth.users u
    left join device_activity da on da.user_id = u.id
    left join metrics_activity ma on ma.user_id = u.id
  ),
  locale_totals as (
    select coalesce(locale, '(nessuno)') as locale, count(*) as n
    from public.profiles
    group by 1
  ),
  revenue_rows as (
    select
      case
        when external_product_id = 'fitmesh_pro_lifetime' then 'lifetime'
        when external_product_id = 'fitmesh_pro_sub' then 'subscription'
        else 'other'
      end as product_type,
      case
        when billing_source = 'google_play' then 'android'
        when billing_source in ('apple', 'app_store') then 'ios'
        else 'other'
      end as platform
    from public.b2c_subscriptions
    where billing_source <> 'founder_grant'
      and state = 'active'
  )
  select jsonb_build_object(
    'generated_at', now(),
    'launch_date', launch_date,
    'daily', (
      select jsonb_agg(jsonb_build_object('day', day, 'signups', signups, 'ios', ios, 'android', android, 'unknown', unknown) order by day)
      from daily
    ),
    'totals', jsonb_build_object(
      'total_users', (select count(*) from auth.users),
      'users_with_device', (select count(distinct user_id) from platform_first),
      'ios_total', coalesce((select n from platform_totals where platform = 'iOS'), 0),
      'android_total', coalesce((select n from platform_totals where platform = 'Android'), 0),
      'unknown_total', coalesce((select n from platform_totals where platform = 'unknown'), 0),
      'founder_grants', (select count(*) from public.user_roles where role = 'pro' and note = 'founder-launch'),
      'total_pro', (select count(*) from public.user_roles where role = 'pro'),
      'founder_subs', (select count(*) from public.b2c_subscriptions where billing_source = 'founder_grant'),
      'real_paid_subs', (select count(*) from public.b2c_subscriptions where billing_source <> 'founder_grant'),
      'active_7d', (select count(*) from activity_base where last_activity >= now() - interval '7 days'),
      'active_30d', (select count(*) from activity_base where last_activity >= now() - interval '30 days'),
      'never_active', (select count(*) from activity_base where last_activity < '1971-01-01'),
      'cohort_14d_total', (select count(*) from activity_base where created_at <= now() - interval '14 days'),
      'cohort_14d_active', (select count(*) from activity_base where created_at <= now() - interval '14 days' and last_activity >= now() - interval '14 days'),
      'cohort_30d_total', (select count(*) from activity_base where created_at <= now() - interval '30 days'),
      'cohort_30d_active', (select count(*) from activity_base where created_at <= now() - interval '30 days' and last_activity >= now() - interval '30 days'),
      'locale', (select jsonb_object_agg(locale, n) from locale_totals),
      'revenue', jsonb_build_object(
        'lifetime_android', (select count(*) from revenue_rows where product_type = 'lifetime' and platform = 'android'),
        'lifetime_ios', (select count(*) from revenue_rows where product_type = 'lifetime' and platform = 'ios'),
        'lifetime_other', (select count(*) from revenue_rows where product_type = 'lifetime' and platform = 'other'),
        'sub_android', (select count(*) from revenue_rows where product_type = 'subscription' and platform = 'android'),
        'sub_ios', (select count(*) from revenue_rows where product_type = 'subscription' and platform = 'ios'),
        'sub_other', (select count(*) from revenue_rows where product_type = 'subscription' and platform = 'other'),
        'other_active', (select count(*) from revenue_rows where product_type = 'other')
      )
    )
  );
$$;

revoke all on function public.get_dashboard_snapshot(date) from public;
revoke all on function public.get_dashboard_snapshot(date) from anon;
revoke all on function public.get_dashboard_snapshot(date) from authenticated;
grant execute on function public.get_dashboard_snapshot(date) to service_role;

comment on function public.get_dashboard_snapshot(date) is
  'Read-only aggregate snapshot for the local FitMesh analytics dashboard (AppFitmesh/docs/analytics). Counts only, no per-user rows. service_role only. Extended 05/08/2026 with a revenue breakdown (lifetime vs subscription, by platform).';
