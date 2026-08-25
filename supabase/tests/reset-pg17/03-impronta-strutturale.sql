-- Impronta strutturale, da eseguire IDENTICA sul container ricostruito e sul
-- live. Confronta cio' che le migration governano: schemi public, private,
-- rls_internal, payload. Nessun dato sanitario, nessuna riga di utente:
-- solo catalogo.
with
funzioni as (
  select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
       ||' secdef='||p.prosecdef::text
       ||' vol='||p.provolatile::text
       ||' cfg='||coalesce(array_to_string(p.proconfig,';'),'-')
       ||' owner='||r.rolname as riga
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  join pg_roles r on r.oid=p.proowner
  where n.nspname in ('public','private','rls_internal','payload')
),
concessioni as (
  select routine_schema||'.'||routine_name||' '||grantee||'='||privilege_type as riga
  from information_schema.routine_privileges
  where routine_schema in ('public','private','rls_internal','payload')
),
tabelle as (
  select n.nspname||'.'||c.relname
       ||' rls='||c.relrowsecurity::text
       ||' force='||c.relforcerowsecurity::text
       ||' owner='||r.rolname
       ||' kind='||c.relkind::text as riga
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  join pg_roles r on r.oid=c.relowner
  where n.nspname in ('public','private','rls_internal','payload')
    and c.relkind in ('r','p','v','m')
),
colonne as (
  select n.nspname||'.'||c.relname||'.'||a.attname||' '
       ||format_type(a.atttypid,a.atttypmod)
       ||case when a.attnotnull then ' NOTNULL' else '' end
       ||coalesce(' DEF='||pg_get_expr(d.adbin,d.adrelid),'') as riga
  from pg_attribute a
  join pg_class c on c.oid=a.attrelid
  join pg_namespace n on n.oid=c.relnamespace
  left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  where n.nspname in ('public','private','rls_internal','payload')
    and c.relkind in ('r','p','v','m') and a.attnum>0 and not a.attisdropped
),
policy_ as (
  select n.nspname||'.'||c.relname||'.'||pol.polname
       ||' cmd='||pol.polcmd::text
       ||' roles='||coalesce((select string_agg(rr.rolname,',' order by rr.rolname)
                              from unnest(pol.polroles) x join pg_roles rr on rr.oid=x),'PUBLIC')
       ||' using='||coalesce(pg_get_expr(pol.polqual,pol.polrelid),'-')
       ||' check='||coalesce(pg_get_expr(pol.polwithcheck,pol.polrelid),'-') as riga
  from pg_policy pol
  join pg_class c on c.oid=pol.polrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload')
),
trigger_ as (
  select n.nspname||'.'||c.relname||'.'||t.tgname||' '||pg_get_triggerdef(t.oid) as riga
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload') and not t.tgisinternal
),
indici as (
  select schemaname||'.'||indexname||' '||indexdef as riga
  from pg_indexes where schemaname in ('public','private','rls_internal','payload')
),
vincoli as (
  select n.nspname||'.'||c.relname||'.'||con.conname||' '||pg_get_constraintdef(con.oid) as riga
  from pg_constraint con
  join pg_class c on c.oid=con.conrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload')
),
cronjob as (
  select jobname||' ['||schedule||'] '||command as riga from cron.job
),
schemi as (select nspname as riga from pg_namespace where nspname in ('public','private','rls_internal','payload','cron','net'))
select categoria, n, impronta from (
  select 'A funzioni'   as categoria, count(*) as n, md5(coalesce(string_agg(riga,E'\n' order by riga),'')) as impronta from funzioni
  union all select 'B concessioni', count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from concessioni
  union all select 'C tabelle',     count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from tabelle
  union all select 'D colonne',     count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from colonne
  union all select 'E policy',      count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from policy_
  union all select 'F trigger',     count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from trigger_
  union all select 'G indici',      count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from indici
  union all select 'H vincoli',     count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from vincoli
  union all select 'I cron',        count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from cronjob
  union all select 'J schemi',      count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from schemi
) t order by categoria;
