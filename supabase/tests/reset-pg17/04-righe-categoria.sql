-- Righe per categoria, IDENTICHE fra ricostruzione e produzione.
--
-- Serve a spiegare le differenze che 03-impronta-strutturale.sql segnala come
-- hash diversi: un hash diverso dice CHE c'e' una differenza, non QUALE.
--
-- Copre tutte e dieci le categorie di 03, non un sottoinsieme: la versione
-- precedente ne copriva cinque (A, B, E, G, I) perche' erano le uniche che al
-- momento differivano. Un estrattore che copre solo le categorie gia' rotte
-- non sa dire niente quando se ne rompe un'altra.
--
-- Solo catalogo: nessun dato sanitario, nessuna riga di utente.
\set QUIET on
\pset tuples_only on
\pset format unaligned
\pset fieldsep '|'
with
funzioni as (
  select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
       ||' secdef='||p.prosecdef::text||' vol='||p.provolatile::text
       ||' cfg='||coalesce(array_to_string(p.proconfig,';'),'-')||' owner='||r.rolname as riga
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_roles r on r.oid=p.proowner
  where n.nspname in ('public','private','rls_internal','payload','internal')
),
concessioni as (
  select routine_schema||'.'||routine_name||' '||grantee||'='||privilege_type as riga
  from information_schema.routine_privileges
  where routine_schema in ('public','private','rls_internal','payload','internal')
),
tabelle as (
  select n.nspname||'.'||c.relname||' rls='||c.relrowsecurity::text
       ||' force='||c.relforcerowsecurity::text||' owner='||r.rolname
       ||' kind='||c.relkind::text as riga
  from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_roles r on r.oid=c.relowner
  where n.nspname in ('public','private','rls_internal','payload','internal') and c.relkind in ('r','p','v','m')
),
colonne as (
  select n.nspname||'.'||c.relname||'.'||a.attname||' '||format_type(a.atttypid,a.atttypmod)
       ||case when a.attnotnull then ' NOTNULL' else '' end
       ||coalesce(' DEF='||pg_get_expr(d.adbin,d.adrelid),'') as riga
  from pg_attribute a join pg_class c on c.oid=a.attrelid
  join pg_namespace n on n.oid=c.relnamespace
  left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  where n.nspname in ('public','private','rls_internal','payload','internal')
    and c.relkind in ('r','p','v','m') and a.attnum>0 and not a.attisdropped
),
policy_ as (
  select n.nspname||'.'||c.relname||'.'||pol.polname||' cmd='||pol.polcmd::text
       ||' roles='||coalesce((select string_agg(rr.rolname,',' order by rr.rolname)
                              from unnest(pol.polroles) x join pg_roles rr on rr.oid=x),'PUBLIC')
       ||' using='||coalesce(pg_get_expr(pol.polqual,pol.polrelid),'-')
       ||' check='||coalesce(pg_get_expr(pol.polwithcheck,pol.polrelid),'-') as riga
  from pg_policy pol join pg_class c on c.oid=pol.polrelid join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload','internal')
),
trigger_ as (
  select n.nspname||'.'||c.relname||'.'||t.tgname||' '||pg_get_triggerdef(t.oid) as riga
  from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload','internal') and not t.tgisinternal
),
indici as (
  select schemaname||'.'||indexname||' '||indexdef as riga
  from pg_indexes where schemaname in ('public','private','rls_internal','payload','internal')
),
vincoli as (
  select n.nspname||'.'||c.relname||'.'||con.conname||' '||pg_get_constraintdef(con.oid) as riga
  from pg_constraint con join pg_class c on c.oid=con.conrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload','internal')
),
cronjob as (select jobname||' ['||schedule||'] '||command as riga from cron.job),
schemi as (select nspname as riga from pg_namespace
           where nspname in ('public','private','rls_internal','payload','internal','cron','net'))
-- Tre campi per riga, e il motivo di ciascuno:
--
--   cat        la categoria, per raggruppare;
--   md5(riga)  l'impronta della riga GREZZA. Due righe con md5 diverso sono
--              diverse, punto. Nessuna normalizzazione puo' nasconderlo;
--   normale    la stessa riga con gli spazi bianchi collassati e su una riga
--              sola. Serve a LEGGERE la differenza, non a decidere se c'e'.
--
-- Il doppio campo distingue due casi che una normalizzazione sola confonde:
-- se md5 differisce ma `normale` coincide, la differenza e' di sola
-- spaziatura (il caso degli otto job cron); se differisce anche `normale`,
-- e' una differenza vera. La versione precedente normalizzava e basta, e
-- avrebbe dichiarato uguali due oggetti diversi solo negli spazi.
select cat||'|'||md5(riga)||'|'||regexp_replace(riga, '\s+', ' ', 'g') from (
  select 'A' as cat, riga from funzioni
  union all select 'B', riga from concessioni
  union all select 'C', riga from tabelle
  union all select 'D', riga from colonne
  union all select 'E', riga from policy_
  union all select 'F', riga from trigger_
  union all select 'G', riga from indici
  union all select 'H', riga from vincoli
  union all select 'I', riga from cronjob
  union all select 'J', riga from schemi
) t order by cat, riga;
