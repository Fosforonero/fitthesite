-- Aggiunge users_with_real_data a get_dashboard_snapshot(): utenti con almeno
-- una riga in fitness_metrics, a prescindere da first_sync_state o da quando
-- hanno accoppiato il device. E' la metrica che risponde a "quanti hanno
-- REALMENTE sincronizzato dati", distinta da users_with_device (che include
-- anche chi ha un device accoppiato ma zero dati mai arrivati, cioe' il caso
-- read_no_data/B2 del piano di crescita). Richiesta di Matteo 15/08/2026 dopo
-- la conversazione sulla mail di re-engagement: prima di scrivere qualunque
-- mail bisogna sapere esattamente quanti hanno davvero visto il prodotto
-- funzionare, non solo quanti hanno un device accoppiato.
--
-- Nessuna nuova tabella, nessuna colonna nuova: solo un count(distinct)
-- aggiuntivo su fitness_metrics dentro la funzione esistente (stessa CTE
-- metrics_activity gia' usata per active_7d/30d, qui interrogata a se'
-- perche' metrics_activity la aggrega per activity_base, non da sola).
create or replace function public.get_dashboard_snapshot(launch_date date default '2026-05-13'::date)
 returns jsonb
 language sql
 stable
 set search_path to 'public', 'auth'
as $function$
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
        when billing_source = 'apple_iap' then 'ios'
        else 'other'
      end as platform
    from public.b2c_subscriptions
    where billing_source <> 'founder_grant'
      and state = 'active'
  ),
  -- --- leading indicators (M1-M4) ---
  platform_first_full as (
    -- come platform_first, ma porta anche i campi first_sync_* del primo
    -- device accoppiato per utente (serve a M1/M2, senza rifare la join).
    select distinct on (user_id)
      user_id,
      paired_at,
      first_sync_state,
      first_sync_at,
      case
        when os_version ilike 'ios%' then 'ios'
        when os_version ilike 'android%' then 'android'
        else 'unknown'
      end as platform
    from public.devices
    where paired_at is not null
    order by user_id, paired_at asc
  ),
  m1_base as (
    select p.id as user_id, p.created_at as signup_at, pf.platform, pf.first_sync_state, pf.first_sync_at
    from public.profiles p
    join platform_first_full pf on pf.user_id = p.id
    where p.created_at <= now() - interval '24 hours'
  ),
  m1_agg as (
    select platform,
      count(*) as cohort,
      count(*) filter (
        where first_sync_state = 'success'
          and first_sync_at is not null
          and first_sync_at <= signup_at + interval '24 hours'
      ) as success_24h
    from m1_base
    group by platform
  ),
  m2_agg as (
    select platform,
      count(*) as paired,
      count(*) filter (where first_sync_state = 'read_no_data') as read_no_data
    from platform_first_full
    group by platform
  ),
  m4_recent_signups as (
    select p.id as user_id, coalesce(pf.platform, 'no_device') as platform
    from public.profiles p
    left join platform_first_full pf on pf.user_id = p.id
    where p.created_at >= now() - interval '7 days'
  ),
  m4_agg as (
    select platform,
      count(*) as signups,
      count(*) filter (
        where exists (
          select 1 from public.b2c_subscriptions bs
          where bs.user_id = m4_recent_signups.user_id
            and bs.billing_source not in ('founder_grant')
        )
      ) as paid
    from m4_recent_signups
    group by platform
  ),
  m4_regions as (
    select coalesce(raw_payload->>'regionCode', '(sconosciuta)') as region, count(*) as n
    from public.b2c_subscriptions
    where billing_source not in ('founder_grant')
    group by 1
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
      'users_with_real_data', (select count(distinct user_id) from public.fitness_metrics),
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
      ),
      'leading_indicators', jsonb_build_object(
        'm1_sync_success_24h', (select coalesce(jsonb_object_agg(platform, jsonb_build_object('cohort', cohort, 'success24h', success_24h)), '{}'::jsonb) from m1_agg),
        'm2_read_no_data', (select coalesce(jsonb_object_agg(platform, jsonb_build_object('paired', paired, 'readNoData', read_no_data)), '{}'::jsonb) from m2_agg),
        'm3_apple_iap_rows', (select count(*) from public.b2c_subscriptions where billing_source = 'apple_iap'),
        'm4_conversion_7d', (select coalesce(jsonb_object_agg(platform, jsonb_build_object('signups', signups, 'paid', paid)), '{}'::jsonb) from m4_agg),
        'm4_paid_by_region', (select coalesce(jsonb_object_agg(region, n), '{}'::jsonb) from m4_regions)
      )
    )
  );
$function$;
