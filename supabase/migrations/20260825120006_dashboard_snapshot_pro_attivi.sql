-- Forward-only: public.get_dashboard_snapshot() conta i Pro ATTIVI, e riporta
-- gli scaduti a parte ed etichettati.
--
-- NON APPLICATA IN PRODUZIONE. Nessuna mutazione remota.
-- Esercitata localmente: gira nel reset completo su Postgres 17 usa-e-getta.
--
-- ============================================================================
-- CLASSE: REPORTING, NON AUTORIZZAZIONE
-- ============================================================================
-- Questa funzione non decide niente: alimenta la dashboard. E' SECURITY
-- INVOKER (a differenza di is_admin e has_role) ed e' concessa solo a
-- postgres e service_role. Un errore qui non apre un accesso: fa dire alla
-- dashboard un numero sbagliato.
--
-- Il che non lo rende innocuo. I numeri di questa funzione sono quelli su cui
-- si decide se una leva di crescita ha funzionato, e un conteggio gonfiato
-- fa dichiarare vinto un esperimento che non lo era.
--
-- ============================================================================
-- IL DIFETTO
-- ============================================================================
-- Quattro letture di public.user_roles, nessuna delle quali guardava
-- expires_at:
--
--   entitlement_flags.is_founder     exists(... role='pro' and note='founder-launch')
--   entitlement_flags.is_other_pro   exists(... role='pro' and note <> 'founder-launch')
--   totals.founder_grants            count(... role='pro' and note='founder-launch')
--   totals.total_pro                 count(... role='pro')
--
-- Un ruolo 'pro' scaduto veniva quindi contato come Pro attivo.
--
-- Misurato in produzione il 25/08/2026, solo aggregati: 402 righe 'pro', di
-- cui 399 permanenti, 3 A TERMINE CON SCADENZA FUTURA, 0 scadute.
--
-- Le scadute a zero vogliono dire che nessun numero pubblicato e' mai stato
-- sbagliato per questo motivo. Le tre a termine vogliono dire che il difetto
-- non e' un'ipotesi: e' su un timer. Alla prima che scade, la dashboard
-- inizierebbe a contare come Pro attivo qualcuno che non lo e' piu', e a
-- differenza di un errore secco questo non si nota: il numero resta
-- plausibile e scivola.
--
-- ============================================================================
-- COSA CAMBIA, E COSA NON SI PERDE
-- ============================================================================
-- I quattro conteggi «Pro attivo» ora escludono expires_at <= now().
--
-- Le righe scadute NON spariscono: entrano in due chiavi nuove, dichiarate
-- storiche gia' nel nome, cosi' che nessuno le scambi per attive:
--
--   founder_grants_scaduti_storico
--   total_pro_scaduti_storico
--
-- «other_pro_grants» si corregge da solo: deriva da activity_base.is_other_pro,
-- che ora rispetta la scadenza.
--
-- Le due chiavi nuove sono ADDITIVE: nessun consumatore della dashboard perde
-- una chiave, quindi nessuna parte del cruscotto smette di funzionare per
-- effetto di questa migration.
--
-- ============================================================================
-- SOPRA LA DEFINIZIONE PIU' RECENTE, NON SU UNA VECCHIA
-- ============================================================================
-- Il corpo qui sotto e' quello di 20260818084202_dashboard_snapshot_payments_history,
-- che e' l'ultima definizione registrata nel remoto, con applicate SOLO le
-- quattro modifiche descritte e l'aggiunta delle due chiavi storiche. Non e'
-- riscritto a mano: e' stato estratto dal file di quella migration e
-- modificato per sostituzione, per non resuscitare per distrazione una
-- versione precedente della funzione. Su questo progetto e' un rischio reale:
-- get_dashboard_snapshot e' stata ridefinita otto volte fra luglio e agosto.
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
      )
    )
  );
$function$;

-- ============================================================================
-- CONTROLLO DOPO LA CREAZIONE
-- ============================================================================
do $dopo$
declare
  v_corpo   text;
  v_letture integer;
  v_attive  integer;
begin
  select pg_get_functiondef(p.oid) into v_corpo
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'get_dashboard_snapshot';

  -- Ogni lettura di user_roles deve essere accompagnata da un controllo di
  -- scadenza, oppure essere una delle due dichiarate storiche.
  v_letture := (select count(*) from regexp_matches(v_corpo, 'public\.user_roles', 'g'));
  v_attive  := (select count(*) from regexp_matches(v_corpo, 'expires_at', 'g'));

  if v_letture <> 6 then
    raise exception
      'get_dashboard_snapshot: attese 6 letture di user_roles (4 attive + 2 storiche), '
      'trovate %. La funzione e'' cambiata: rivedere questa migration prima di applicarla.',
      v_letture;
  end if;
  if v_attive < 6 then
    raise exception
      'get_dashboard_snapshot: attesi almeno 6 riferimenti a expires_at, trovati %. '
      'Qualche conteggio «Pro attivo» sta ancora includendo le righe scadute.', v_attive;
  end if;
  if v_corpo !~ 'total_pro_scaduti_storico' or v_corpo !~ 'founder_grants_scaduti_storico' then
    raise exception
      'get_dashboard_snapshot: mancano le chiavi storiche. Gli scaduti non devono '
      'sparire dal cruscotto, devono essere etichettati.';
  end if;

  raise notice
    'get_dashboard_snapshot: 4 conteggi Pro attivi con controllo di scadenza, '
    '2 chiavi storiche etichettate.';
end
$dopo$;
