-- ─────────────────────────────────────────────────────────
-- Migration 006 — Admin aggregate functions (privacy-safe)
-- Vedi docs/architecture/07-admin-dashboard-privacy-safe.md
--
-- Pattern: SECURITY DEFINER function + check is_admin() interno.
-- L'admin NON ha policy SELECT su fitness_metrics → solo queste function
-- (che girano come postgres role, bypassando RLS) ritornano aggregati.
-- ─────────────────────────────────────────────────────────

-- Daily aggregate: sync count, active users, active devices
create or replace function public.admin_daily_aggregate()
returns table(
  day date,
  active_users bigint,
  active_devices bigint,
  total_syncs bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select
      date_trunc('day', received_at)::date as day,
      count(distinct user_id)::bigint as active_users,
      count(distinct device_id)::bigint as active_devices,
      count(*)::bigint as total_syncs
    from public.fitness_metrics
    where received_at > now() - interval '90 days'
    group by 1
    order by 1 desc;
end;
$$;

revoke all on function public.admin_daily_aggregate() from public, authenticated;
grant execute on function public.admin_daily_aggregate() to authenticated;
-- (granted ma controllo `is_admin()` interno: chi non è admin riceve eccezione 42501)

-- Device distribution by brand (privacy-safe: aggregato)
create or replace function public.admin_device_brand_distribution()
returns table(brand text, count bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select coalesce(device_brand, 'unknown')::text, count(*)::bigint
    from public.devices
    where revoked_at is null
    group by 1
    order by 2 desc;
end;
$$;

grant execute on function public.admin_device_brand_distribution() to authenticated;

-- Top sync error codes (last 7 days)
create or replace function public.admin_top_errors(p_days int default 7)
returns table(error_code text, occurrences bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select coalesce(s.error_code, 'unknown')::text, count(*)::bigint
    from public.sync_events s
    where s.event_type = 'sync_failed'
      and s.created_at > now() - (p_days || ' days')::interval
    group by 1
    order by 2 desc
    limit 20;
end;
$$;

grant execute on function public.admin_top_errors(int) to authenticated;

-- Overview counters (single-row stats)
create or replace function public.admin_overview()
returns table(
  total_users bigint,
  active_users_7d bigint,
  active_users_30d bigint,
  new_users_7d bigint,
  total_devices bigint,
  active_devices bigint,
  syncs_24h bigint,
  failed_syncs_24h bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select
      (select count(*) from public.profiles)::bigint,
      (select count(distinct user_id) from public.sync_events
        where created_at > now() - interval '7 days' and user_id is not null)::bigint,
      (select count(distinct user_id) from public.sync_events
        where created_at > now() - interval '30 days' and user_id is not null)::bigint,
      (select count(*) from public.profiles
        where created_at > now() - interval '7 days')::bigint,
      (select count(*) from public.devices)::bigint,
      (select count(*) from public.devices where revoked_at is null)::bigint,
      (select count(*) from public.sync_events
        where event_type = 'sync_ok' and created_at > now() - interval '1 day')::bigint,
      (select count(*) from public.sync_events
        where event_type = 'sync_failed' and created_at > now() - interval '1 day')::bigint;
end;
$$;

grant execute on function public.admin_overview() to authenticated;
