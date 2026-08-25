\set QUIET on
with
funzioni as (
  select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
       ||' secdef='||p.prosecdef::text||' vol='||p.provolatile::text
       ||' cfg='||coalesce(array_to_string(p.proconfig,';'),'-')||' owner='||r.rolname as riga
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_roles r on r.oid=p.proowner
  where n.nspname in ('public','private','rls_internal','payload')
),
policy_ as (
  select n.nspname||'.'||c.relname||'.'||pol.polname||' cmd='||pol.polcmd::text
       ||' roles='||coalesce((select string_agg(rr.rolname,',' order by rr.rolname)
                              from unnest(pol.polroles) x join pg_roles rr on rr.oid=x),'PUBLIC')
       ||' using='||coalesce(pg_get_expr(pol.polqual,pol.polrelid),'-')
       ||' check='||coalesce(pg_get_expr(pol.polwithcheck,pol.polrelid),'-') as riga
  from pg_policy pol join pg_class c on c.oid=pol.polrelid join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload')
),
cronjob as (select jobname||' ['||schedule||'] '||command as riga from cron.job),
indici as (select schemaname||'.'||indexname||' '||indexdef as riga
           from pg_indexes where schemaname in ('public','private','rls_internal','payload')),
concessioni as (select routine_schema||'.'||routine_name||' '||grantee||'='||privilege_type as riga
                from information_schema.routine_privileges
                where routine_schema in ('public','private','rls_internal','payload'))
select cat||' '||md5(riga) from (
  select 'A' as cat, riga from funzioni
  union all select 'E', riga from policy_
  union all select 'I', riga from cronjob
  union all select 'G', riga from indici
  union all select 'B', riga from concessioni
) t order by 1;
