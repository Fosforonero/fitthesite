-- Impronta strutturale, da eseguire IDENTICA sul container ricostruito e sul
-- live. Confronta cio' che le migration governano: schemi public, private,
-- rls_internal, payload, internal. Nessun dato sanitario, nessuna riga di
-- utente: solo catalogo.
--
-- `internal` e' stato AGGIUNTO il 25/08/2026, dopo essere mancato al primo
-- confronto. Non era una svista innocua: quello schema contiene gli helper
-- del merge del sonno (internal._merge_sleep_stages_jsonb e compagni), cioe'
-- proprio l'autorita' che l'integrazione del filone sonno deve toccare. Sei
-- migration della catena lo nominano. Un confronto che dichiarava «sei
-- categorie su dieci identiche» stava misurando un insieme di schemi che
-- escludeva il punto piu' delicato della release.
--
-- Regola che ne discende: l'elenco degli schemi non si eredita, si rideriva
-- dai file di migration. Il guardrail
-- integrazione-190/14-copertura-schemi-confronto.sh lo verifica.
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
  where n.nspname in ('public','private','rls_internal','payload','internal')
),
concessioni as (
  select routine_schema||'.'||routine_name||' '||grantee||'='||privilege_type as riga
  from information_schema.routine_privileges
  where routine_schema in ('public','private','rls_internal','payload','internal')
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
  where n.nspname in ('public','private','rls_internal','payload','internal')
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
  where n.nspname in ('public','private','rls_internal','payload','internal')
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
  where n.nspname in ('public','private','rls_internal','payload','internal')
),
trigger_ as (
  select n.nspname||'.'||c.relname||'.'||t.tgname||' '||pg_get_triggerdef(t.oid) as riga
  from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload','internal') and not t.tgisinternal
),
indici as (
  select schemaname||'.'||indexname||' '||indexdef as riga
  from pg_indexes where schemaname in ('public','private','rls_internal','payload','internal')
),
vincoli as (
  select n.nspname||'.'||c.relname||'.'||con.conname||' '||pg_get_constraintdef(con.oid) as riga
  from pg_constraint con
  join pg_class c on c.oid=con.conrelid
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','rls_internal','payload','internal')
),
cronjob as (
  select jobname||' ['||schedule||'] '||command as riga from cron.job
),
schemi as (select nspname as riga from pg_namespace where nspname in ('public','private','rls_internal','payload','internal','cron','net')),
-- ── K e L: I CORPI DELLE FUNZIONI ──────────────────────────────────────────
-- Aggiunte il 25/08/2026, dopo che il confronto senza di esse aveva
-- dichiarato «sei categorie su dieci identiche» mentre 26 funzioni su 66
-- avevano il corpo diverso, fra cui private.entitlement_core, che decide chi
-- ha accesso all'app.
--
-- La categoria A confronta firma, SECURITY DEFINER, volatilita', search_path,
-- proprietario. Tutte cose vere e tutte insufficienti: due funzioni possono
-- avere la stessa firma e fare cose opposte.
--
-- K = corpo grezzo. Dice CHE qualcosa e' cambiato, commenti compresi.
-- L = corpo normalizzato (minuscolo, senza commenti, senza spazi bianchi).
--     Dice se e' cambiato il CODICE.
-- Servono entrambe: K da solo produce rumore, L da solo nasconde una
-- riscrittura dei commenti che segnala una modifica fuori banda.
--
-- prokind='f' esclude gli aggregati, su cui pg_get_functiondef solleva.
corpi_grezzi as (
  select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|'
       ||md5(pg_get_functiondef(p.oid)) as riga
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','private','rls_internal','payload','internal') and p.prokind='f'
),
corpi_normalizzati as (
  select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|'
       ||md5(regexp_replace(regexp_replace(lower(pg_get_functiondef(p.oid)),'--[^\n]*','','g'),'\s+','','g')) as riga
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','private','rls_internal','payload','internal') and p.prokind='f'
)
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
  union all select 'K corpi grezzi', count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from corpi_grezzi
  union all select 'L corpi codice', count(*), md5(coalesce(string_agg(riga,E'\n' order by riga),'')) from corpi_normalizzati
) t order by categoria;
