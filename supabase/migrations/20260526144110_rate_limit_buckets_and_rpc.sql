
-- Rate limit infrastructure (cybersec P0-001, alternativa a Upstash).
-- Bucket di 1 minuto per (key, window_start_minute). Fixed window approach:
-- semplice, sufficiente per nostro scale, niente sliding window approx.

create table public.rate_limit_buckets (
  key text not null,
  window_start_minute timestamptz not null,
  count int not null default 0,
  primary key (key, window_start_minute)
);

create index rate_limit_buckets_window_start_minute_idx
  on public.rate_limit_buckets (window_start_minute);

-- RLS: default deny totale. Nessuno (anon/authenticated) puo' leggere/scrivere
-- direttamente. Solo via RPC rate_limit_check (security definer).
alter table public.rate_limit_buckets enable row level security;

-- RPC atomic: UPSERT + return count corrente per bucket.
-- Chiamabile da anon (per pre-auth route come /api/v1/beta/signup) e
-- da authenticated (per /api/v1/sync). Security definer bypassa RLS.
create or replace function public.rate_limit_check(
  p_key text,
  p_max int,
  p_window_seconds int default 60
) returns table(allowed boolean, remaining int)
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_bucket_start timestamptz;
  v_count int;
begin
  -- Fixed window: trunca al minuto corrente (p_window_seconds ignorato in v1,
  -- previsto per future window != 60s).
  v_bucket_start := date_trunc('minute', now());

  -- Atomic UPSERT + return new count.
  insert into public.rate_limit_buckets(key, window_start_minute, count)
  values (p_key, v_bucket_start, 1)
  on conflict (key, window_start_minute)
  do update set count = rate_limit_buckets.count + 1
  returning count into v_count;

  return query select
    (v_count <= p_max)::boolean as allowed,
    greatest(0, p_max - v_count)::int as remaining;
end;
$$;

-- Grant execute a entrambi i roles client-facing.
grant execute on function public.rate_limit_check(text, int, int) to anon, authenticated;

-- Cleanup function: cancella bucket vecchi >1h. Chiamata dal cron daily
-- gia' esistente (beta-welcome-emails) per evitare un 3o cron (Hobby limit).
create or replace function public.rate_limit_cleanup()
returns int
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_deleted int;
begin
  delete from public.rate_limit_buckets
  where window_start_minute < now() - interval '1 hour';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.rate_limit_cleanup() to service_role;
