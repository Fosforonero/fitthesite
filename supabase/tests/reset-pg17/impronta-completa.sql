-- ============================================================================
-- IMPRONTA STRUTTURALE COMPLETA
--
-- Serve a decidere se una migration e' davvero un no-op, e a provare che un
-- rollback ha rimesso le cose ESATTAMENTE com'erano.
--
-- Un md5 del solo corpo della funzione non basta: due definizioni identiche
-- possono avere owner diversi, privilegi diversi, SECURITY DEFINER contro
-- INVOKER, volatilita' diversa o un search_path diverso, e comportarsi in modo
-- completamente diverso. Un rollback che ripristina il corpo e perde il
-- SECURITY DEFINER e' un buco, non un ripristino.
--
-- Copre: funzioni (con firma, owner, security mode, volatilita', search_path,
-- ACL), policy RLS, trigger, tabelle e colonne, indici, privilegi su tabelle,
-- job cron, e il conteggio delle righe nelle tabelle di registro append-only.
--
-- Emette una riga per oggetto, ordinata. Il chiamante ne fa il diff o il md5.
-- ============================================================================
\pset tuples_only on
\pset format unaligned
\pset footer off

select riga from (

  select 'fn  ' || n.nspname || '.' || p.proname
       || '(' || pg_catalog.pg_get_function_identity_arguments(p.oid) || ')'
       || ' owner=' || pg_catalog.pg_get_userbyid(p.proowner)
       || ' secdef=' || p.prosecdef
       || ' vol=' || p.provolatile::text
       || ' cfg=' || coalesce(array_to_string(p.proconfig, ','), '-')
       || ' acl=' || coalesce(array_to_string(p.proacl::text[], ','), '-')
       || ' corpo=' || md5(pg_catalog.pg_get_functiondef(p.oid)) as riga
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private', 'internal', 'rls_internal')

  union all
  select 'pol ' || n.nspname || '.' || c.relname || '.' || pol.polname
       || ' cmd=' || pol.polcmd::text
       || ' perm=' || pol.polpermissive
       || ' roles=' || coalesce(array_to_string(pol.polroles::text[], ','), '-')
       || ' using=' || coalesce(md5(pg_catalog.pg_get_expr(pol.polqual, pol.polrelid)), '-')
       || ' check=' || coalesce(md5(pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid)), '-')
  from pg_catalog.pg_policy pol
  join pg_catalog.pg_class c on c.oid = pol.polrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'private', 'internal', 'rls_internal')

  union all
  select 'trg ' || n.nspname || '.' || c.relname || '.' || t.tgname
       || ' abilitato=' || t.tgenabled::text
       || ' def=' || md5(pg_catalog.pg_get_triggerdef(t.oid))
  from pg_catalog.pg_trigger t
  join pg_catalog.pg_class c on c.oid = t.tgrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal and n.nspname in ('public', 'private', 'internal', 'rls_internal')

  union all
  select 'tab ' || n.nspname || '.' || c.relname
       || ' rls=' || c.relrowsecurity
       || ' forzata=' || c.relforcerowsecurity
       || ' acl=' || coalesce(array_to_string(c.relacl::text[], ','), '-')
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p') and n.nspname in ('public', 'private', 'internal', 'rls_internal')

  union all
  select 'col ' || n.nspname || '.' || c.relname || '.' || a.attname
       || ' tipo=' || pg_catalog.format_type(a.atttypid, a.atttypmod)
       || ' notnull=' || a.attnotnull
       || ' default=' || coalesce(md5(pg_catalog.pg_get_expr(d.adbin, d.adrelid)), '-')
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_class c on c.oid = a.attrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attnum > 0 and not a.attisdropped
    and c.relkind in ('r', 'p') and n.nspname in ('public', 'private', 'internal', 'rls_internal')

  union all
  select 'idx ' || schemaname || '.' || indexname || ' def=' || md5(indexdef)
  from pg_catalog.pg_indexes
  where schemaname in ('public', 'private', 'internal', 'rls_internal')

  union all
  select 'con ' || n.nspname || '.' || c.relname || '.' || con.conname
       || ' tipo=' || con.contype::text
       || ' def=' || md5(pg_catalog.pg_get_constraintdef(con.oid))
  from pg_catalog.pg_constraint con
  join pg_catalog.pg_class c on c.oid = con.conrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'private', 'internal', 'rls_internal')

  -- I job cron: una migration che ne aggiunge o toglie uno cambia il sistema
  -- senza toccare un solo oggetto di schema.
  union all
  select 'cron ' || jobname || ' quando=' || schedule || ' cosa=' || md5(command)
  from cron.job
  where to_regclass('cron.job') is not null

  -- Le mutazioni dati: le tabelle di registro sono append-only, quindi una
  -- riga lasciata da una postcondizione non si puo' togliere. Il conteggio
  -- entra nell'impronta apposta.
  union all
  select 'righe ' || n.nspname || '.' || c.relname || ' = ' ||
         (xpath('/row/cnt/text()',
                query_to_xml(format('select count(*) as cnt from %I.%I', n.nspname, c.relname),
                             false, true, '')))[1]::text
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and n.nspname in ('private', 'internal')

) s order by riga;
