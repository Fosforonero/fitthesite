-- ============================================================================
-- PENDING_191 — NON APPLICARE NELLA FINESTRA 190
-- ============================================================================
-- Forward-only: public.get_dashboard_snapshot() tiene INSIEME gli analytics
-- extras e l'esclusione dei Pro scaduti.
--
-- STATO: NON registrata in produzione, e non deve esserlo in questa finestra.
-- Il registro vivo si ferma a 101 versioni (89 baseline + 9 release + 3
-- dashboard). Questa e' la dodicesima+1: esiste sul disco, appartiene alla
-- 191, e i gate la contano a parte.
--
-- ============================================================================
-- PERCHE' ESISTE
-- ============================================================================
-- Due migration descrivono correttamente la propria storia e si annullano a
-- vicenda quando la catena viene ricostruita in ordine:
--
--   20260825120006_dashboard_snapshot_pro_attivi
--     Corregge quattro letture di public.user_roles che ignoravano
--     expires_at, e aggiunge due chiavi storiche etichettate. MAI applicata
--     in produzione: e' fra le otto escluse dalla 190.
--
--   20260901121909_dashboard_snapshot_add_analytics_extras
--     Aggiunge la chiave 'extras' (time-to-convert, sync-gap, retention per
--     coorte, churn). APPLICATA in produzione il 01/09/2026 dalla Dashboard,
--     fuori banda, e poi riconciliata nel repository.
--
-- 121909 e' stata scritta partendo da 20260818084202, cioe' dalla definizione
-- VIVA, che e' anteriore al fix. Ridefinisce la funzione INTERA, quindi
-- reintroduce i quattro conteggi senza filtro. E siccome la sua versione e'
-- piu' alta, in qualunque catena ordinata arriva DOPO 120006 e la sovrascrive.
--
-- La direzione del debito e' questa, ed e' l'opposto di quella che sembrava:
-- non e' 120006 a minacciare gli extras, e' 121909 ad aver gia' annullato il
-- fix nel repository. Misurato: la suite SQL su PG17 ricostruito diceva
-- «total_pro = 9, atteso 7. Le righe pro sono 9, di cui 2 scadute».
--
-- In PRODUZIONE non si e' perso niente il 01/09: 120006 non era mai stata
-- applicata, quindi total_pro contava le righe scadute anche prima. Il numero
-- del cruscotto e' gonfiato da sempre, ed e' un difetto noto che questa
-- migration chiude — nella 191, non oggi.
--
-- ============================================================================
-- PERCHE' UNA MIGRATION NUOVA E NON UNA CORREZIONE DELLE DUE
-- ============================================================================
-- 120006 e 121909 sono entrambe vere: la prima dice cosa era sbagliato il
-- 25/08, la seconda dice cosa e' stato applicato al vivo il 01/09. Riscriverle
-- renderebbe il repository incoerente con il registro di produzione, dove
-- 121909 e' registrata con il proprio `statements` byte per byte. La storia si
-- compone in avanti.
--
-- ============================================================================
-- COSA COMPONE, ESATTAMENTE
-- ============================================================================
-- Base: la definizione di 121909, verbatim. Sopra, i quattro effetti di
-- 120006 e nient'altro:
--
--   1. entitlement_flags.is_founder     + (expires_at is null or > now())
--   2. entitlement_flags.is_other_pro   + (expires_at is null or > now())
--   3. totals.founder_grants            + filtro, e chiave storica
--                                         'founder_grants_scaduti_storico'
--   4. totals.total_pro                 + filtro, e chiave storica
--                                         'total_pro_scaduti_storico'
--
-- La chiave 'extras' e i suoi quattro blocchi restano intatti. Nessuna chiave
-- esistente viene tolta o rinominata.
--
-- Rollback: supabase/rollback/20260901151500_dashboard_snapshot_pro_attivi_con_extras_rollback.sql
-- Ripristina la definizione di 121909 — cioe' lo stato VIVO di oggi — non
-- quella di 20260818084202.
-- ============================================================================

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
        when first_sync_platform = 'ios' then 'iOS'
        when first_sync_platform = 'android' then 'Android'
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
  payments_raw as (
    select
      created_at::date as day,
      case
        when billing_source = 'google_play' then 'android'
        when billing_source = 'apple_iap' then 'ios'
        else 'other'
      end as platform
    from public.b2c_subscriptions
    where billing_source not in ('trial', 'founder_grant')
  ),
  payments_by_day as (
    select day, platform, count(*) as n from payments_raw group by 1, 2
  ),
  payments_daily as (
    select
      d.day,
      coalesce(sum(pb.n) filter (where pb.platform = 'android'), 0)::int as android,
      coalesce(sum(pb.n) filter (where pb.platform = 'ios'), 0)::int as ios,
      coalesce(sum(pb.n) filter (where pb.platform = 'other'), 0)::int as other
    from days d
    left join payments_by_day pb on pb.day = d.day
    group by d.day
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
  entitlement_flags as (
    select
      u.id as user_id,
      exists(
        select 1 from public.user_roles ur
        where ur.user_id = u.id and ur.role = 'pro' and ur.note = 'founder-launch'
          -- reporting, non autorizzazione: un ruolo scaduto non e' un Pro attivo
          and (ur.expires_at is null or ur.expires_at > now())
      ) as is_founder,
      exists(
        select 1 from public.user_roles ur
        where ur.user_id = u.id and ur.role = 'pro'
          and (ur.note is distinct from 'founder-launch' or ur.note is null)
          and (ur.expires_at is null or ur.expires_at > now())
      ) as is_other_pro,
      exists(
        select 1 from public.b2c_subscriptions bs
        where bs.user_id = u.id and bs.billing_source <> 'founder_grant' and bs.state = 'active'
      ) as is_paying
    from auth.users u
  ),
  activity_base as (
    select
      u.id as user_id,
      u.created_at,
      greatest(coalesce(da.last_seen, '1970-01-01'), coalesce(ma.last_synced, '1970-01-01')) as last_activity,
      ef.is_founder,
      ef.is_other_pro,
      ef.is_paying
    from auth.users u
    left join device_activity da on da.user_id = u.id
    left join metrics_activity ma on ma.user_id = u.id
    left join entitlement_flags ef on ef.user_id = u.id
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
    select distinct on (user_id)
      user_id,
      paired_at,
      first_sync_state,
      first_sync_at,
      case
        when os_version ilike 'ios%' then 'ios'
        when os_version ilike 'android%' then 'android'
        when first_sync_platform in ('ios', 'android') then first_sync_platform
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
  ),
  -- --- extras: time-to-convert, sync-gap trend, cohort retention, churn ---
  ttc as (
    select extract(day from (bs.created_at - u.created_at))::int as days
    from public.b2c_subscriptions bs
    join auth.users u on u.id = bs.user_id
    where bs.billing_source not in ('trial', 'founder_grant')
      and bs.created_at = (
        select min(bs2.created_at) from public.b2c_subscriptions bs2
        where bs2.user_id = bs.user_id and bs2.billing_source not in ('trial', 'founder_grant')
      )
  ),
  sync_gap_by_week as (
    select date_trunc('week', pf.paired_at)::date as week,
      count(*) as paired,
      count(*) filter (where not exists (select 1 from public.fitness_metrics fm where fm.user_id = pf.user_id)) as no_data
    from platform_first_full pf
    group by 1
  ),
  cohort_activity as (
    select u.id as user_id, u.created_at,
      greatest(coalesce(da.last_seen, '1970-01-01'), coalesce(ma.last_synced, '1970-01-01')) as last_activity
    from auth.users u
    left join device_activity da on da.user_id = u.id
    left join metrics_activity ma on ma.user_id = u.id
  ),
  cohort_weeks as (
    select date_trunc('week', created_at)::date as cohort_week, user_id, last_activity
    from cohort_activity
  ),
  cohort_matrix as (
    select cohort_week, count(*) as cohort_size,
      case when cohort_week + interval '14 days' <= current_date
        then count(*) filter (where last_activity >= cohort_week + interval '7 days' and last_activity < cohort_week + interval '14 days')
        else null end as w1,
      case when cohort_week + interval '21 days' <= current_date
        then count(*) filter (where last_activity >= cohort_week + interval '14 days' and last_activity < cohort_week + interval '21 days')
        else null end as w2,
      case when cohort_week + interval '28 days' <= current_date
        then count(*) filter (where last_activity >= cohort_week + interval '21 days' and last_activity < cohort_week + interval '28 days')
        else null end as w3,
      case when cohort_week + interval '35 days' <= current_date
        then count(*) filter (where last_activity >= cohort_week + interval '28 days' and last_activity < cohort_week + interval '35 days')
        else null end as w4
    from cohort_weeks
    group by cohort_week
  ),
  metrics_per_day as (
    select distinct user_id, received_at::date as day from public.fitness_metrics
  ),
  metrics_gaps as (
    select user_id, day, day - lag(day) over (partition by user_id order by day) as gap_days
    from metrics_per_day
  ),
  metrics_last as (
    select user_id, max(day) as last_day from metrics_per_day group by user_id
  ),
  ever_silent as (
    select distinct user_id from metrics_gaps where gap_days > 14
    union
    select user_id from metrics_last where last_day <= current_date - 14
  )
  select jsonb_build_object(
    'generated_at', now(),
    'launch_date', launch_date,
    'daily', (
      select jsonb_agg(jsonb_build_object('day', day, 'signups', signups, 'ios', ios, 'android', android, 'unknown', unknown) order by day)
      from daily
    ),
    'payments', (
      select jsonb_agg(jsonb_build_object('day', day, 'android', android, 'ios', ios, 'other', other) order by day)
      from payments_daily
    ),
    'totals', jsonb_build_object(
      'total_users', (select count(*) from auth.users),
      'users_with_device', (select count(distinct user_id) from platform_first),
      'users_with_real_data', (select count(distinct user_id) from public.fitness_metrics),
      'ios_total', coalesce((select n from platform_totals where platform = 'iOS'), 0),
      'android_total', coalesce((select n from platform_totals where platform = 'Android'), 0),
      'unknown_total', coalesce((select n from platform_totals where platform = 'unknown'), 0),
      'founder_grants', (select count(*) from public.user_roles
                         where role = 'pro' and note = 'founder-launch' and (expires_at is null or expires_at > now())),
      'founder_grants_scaduti_storico', (select count(*) from public.user_roles
                         where role = 'pro' and note = 'founder-launch'
                           and expires_at is not null and expires_at <= now()),
      'other_pro_grants', (select count(*) from activity_base where is_other_pro and not is_founder),
      'total_pro', (select count(*) from public.user_roles
                    where role = 'pro' and (expires_at is null or expires_at > now())),
      'total_pro_scaduti_storico', (select count(*) from public.user_roles
                    where role = 'pro' and expires_at is not null and expires_at <= now()),
      'founder_subs', (select count(*) from public.b2c_subscriptions where billing_source = 'founder_grant'),
      'real_paid_subs', (select count(*) from public.b2c_subscriptions where billing_source <> 'founder_grant'),
      'active_7d', (select count(*) from activity_base where last_activity >= now() - interval '7 days'),
      'active_7d_founder', (select count(*) from activity_base where last_activity >= now() - interval '7 days' and is_founder),
      'active_7d_non_founder', (select count(*) from activity_base where last_activity >= now() - interval '7 days' and not is_founder),
      'active_30d', (select count(*) from activity_base where last_activity >= now() - interval '30 days'),
      'never_active', (select count(*) from activity_base where last_activity < '1971-01-01'),
      'trial_active', (select count(*) from activity_base where not is_founder and not is_other_pro and not is_paying and created_at + interval '14 days' > now()),
      'trial_expired', (select count(*) from activity_base where not is_founder and not is_other_pro and not is_paying and created_at + interval '14 days' <= now()),
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
      ),
      'extras', jsonb_build_object(
        'time_to_convert_days', (select coalesce(jsonb_agg(days order by days), '[]'::jsonb) from ttc),
        'sync_gap_trend', (select coalesce(jsonb_agg(jsonb_build_object('week', week, 'paired', paired, 'noData', no_data) order by week), '[]'::jsonb) from sync_gap_by_week),
        'cohort_retention', (select coalesce(jsonb_agg(jsonb_build_object('cohortWeek', cohort_week, 'size', cohort_size, 'w1', w1, 'w2', w2, 'w3', w3, 'w4', w4) order by cohort_week), '[]'::jsonb) from cohort_matrix),
        'churn', jsonb_build_object(
          'ever_silent_14d', (select count(*) from ever_silent),
          'reactivated_users', (select count(distinct user_id) from metrics_gaps where gap_days > 14)
        )
      )
    )
  );
$function$;

-- ============================================================================
-- CONTROLLO DOPO LA CREAZIONE
-- ============================================================================
-- Le due proprieta' che questa migration esiste per tenere insieme devono
-- valere ENTRAMBE sulla funzione appena creata. Se una delle due manca, la
-- composizione e' fallita e non deve passare in silenzio: e' esattamente il
-- modo in cui il fix era gia' sparito una volta.
do $dopo$
declare
  v_corpo   text;
  v_letture integer;
  v_attive  integer;
  v_manca   text[] := '{}';
  k         text;
begin
  select pg_get_functiondef(p.oid) into v_corpo
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'get_dashboard_snapshot';

  if v_corpo is null then
    raise exception 'get_dashboard_snapshot non esiste dopo la sua stessa creazione.';
  end if;

  -- ---- proprieta' 1: i Pro scaduti restano fuori dai conteggi attivi ------
  --
  -- 20260825120006 si accontentava di «almeno 6 riferimenti a expires_at» nel
  -- corpo. Non basta: il corpo ne contiene dodici, e togliendo il filtro da UN
  -- conteggio ne restano dieci. La soglia sarebbe rimasta soddisfatta proprio
  -- mentre il difetto tornava. Qui si contano le TRE FORME, ciascuna per il
  -- numero esatto di volte in cui deve comparire.
  v_letture := (select count(*) from regexp_matches(v_corpo, 'public\.user_roles', 'g'));
  if v_letture <> 6 then
    raise exception
      'get_dashboard_snapshot: attese 6 letture di user_roles (4 attive + 2 storiche), '
      'trovate %. La funzione e'' cambiata: rivedere questa migration prima di applicarla.',
      v_letture;
  end if;

  -- i due exists di entitlement_flags (is_founder, is_other_pro)
  v_attive := (select count(*) from regexp_matches(v_corpo,
                 'ur\.expires_at is null or ur\.expires_at > now\(\)', 'g'));
  if v_attive <> 2 then
    raise exception
      'get_dashboard_snapshot: entitlement_flags deve filtrare la scadenza in 2 punti '
      '(is_founder, is_other_pro), trovati %. Un flag «Pro» acceso da un ruolo scaduto '
      'sposta anche other_pro_grants, active_7d_founder e le coorti.', v_attive;
  end if;

  -- i due conteggi di totals (founder_grants, total_pro)
  v_attive := (select count(*) from regexp_matches(v_corpo,
                 '\(expires_at is null or expires_at > now\(\)\)', 'g'));
  if v_attive <> 2 then
    raise exception
      'get_dashboard_snapshot: totals deve filtrare la scadenza in 2 punti '
      '(founder_grants, total_pro), trovati %. E'' il conteggio che finisce sul '
      'cruscotto: gonfiarlo fa dichiarare vinto un esperimento che non lo era.', v_attive;
  end if;

  -- le due chiavi storiche, che etichettano invece di nascondere
  v_attive := (select count(*) from regexp_matches(v_corpo,
                 'expires_at is not null and expires_at <= now\(\)', 'g'));
  if v_attive <> 2 then
    raise exception
      'get_dashboard_snapshot: attese 2 letture degli scaduti storici, trovate %.',
      v_attive;
  end if;
  if v_corpo !~ 'total_pro_scaduti_storico' or v_corpo !~ 'founder_grants_scaduti_storico' then
    raise exception
      'get_dashboard_snapshot: mancano le chiavi storiche. Gli scaduti non devono '
      'sparire dal cruscotto, devono essere etichettati.';
  end if;

  -- ---- proprieta' 2: gli analytics extras sono ancora tutti li' -----------
  foreach k in array array[
    '''extras'', jsonb_build_object',
    'time_to_convert_days',
    'sync_gap_trend',
    'cohort_retention',
    'ever_silent_14d',
    'reactivated_users'
  ] loop
    if position(k in v_corpo) = 0 then
      v_manca := v_manca || k;
    end if;
  end loop;
  if array_length(v_manca, 1) is not null then
    raise exception
      'get_dashboard_snapshot: la composizione ha perso gli analytics extras: %. '
      'Comporre significa tenere entrambe le cose, non sceglierne una.',
      array_to_string(v_manca, ', ');
  end if;

  raise notice
    'get_dashboard_snapshot: 4 conteggi Pro attivi con controllo di scadenza, '
    '2 chiavi storiche etichettate, 4 blocchi extras intatti.';
end
$dopo$;
