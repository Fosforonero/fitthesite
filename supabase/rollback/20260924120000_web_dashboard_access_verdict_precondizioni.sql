-- ============================================================================
-- PRECONDIZIONI di 20260924120000_web_dashboard_access_verdict.sql — SOLA LETTURA.
-- Da eseguire PRIMA della migration (e prima di fidarsi del suo rollback):
--
--     psql -v ON_ERROR_STOP=1 -f <questo file>
--
-- Non scrive niente: un solo blocco DO con SELECT e RAISE. Esito:
--     NOTICE  «PRECONDIZIONI: PASSA»         -> si puo' procedere (con il GO di applicazione)
--     ERROR   «PRECONDIZIONI NON SODDISFATTE» -> NON si applica; l'elenco dice cosa manca
-- Ogni controllo scrive il proprio esito come NOTICE, cosi' resta traccia anche del PASSA.
--
-- Cosa controlla (e perche')
--   P-1  le due funzioni NON esistono gia'. La migration usa `create or replace`: se
--        esistevano le sostituirebbe e il rollback non potrebbe ripristinarle
--        (vedi 20260924120000_web_dashboard_access_verdict_rollback.sql). Se esistono:
--        salvare l'originale con pg_get_functiondef() PRIMA e decidere con Matteo.
--   P-2  le dipendenze del corpo esistono, con i tipi attesi: auth.users(id, created_at,
--        email), public.user_roles(user_id, role, note, expires_at),
--        public.b2c_subscriptions(user_id, state, billing_source, active_until),
--        public.is_b2c_lifetime(public.b2c_subscriptions), auth.uid(),
--        private.billing_pagamenti_segnalati(user_id, revocato_at, valido_fino),
--        lo schema private, i ruoli anon e authenticated. La funzione e' plpgsql: un
--        oggetto mancante o con un altro tipo esplode solo alla prima chiamata.
--   P-3  informativo: versione 20260924120000 nel registro delle migration, se leggibile.
-- NON controlla: i dati (nessuna riga utente viene letta), la collation, i privilegi di chi esegue.
-- ============================================================================
do $precondizioni$
declare
  v_falle text[] := '{}';
  r record;
  v_tipo text;
  v_n int;
  v_registro text;
begin
  -- P-1: le due funzioni non devono esistere
  for r in
    select n.nspname, p.proname, (n.nspname || '.' || p.proname || '(' || pg_catalog.oidvectortypes(p.proargtypes) || ')') as firma, pg_catalog.md5(p.prosrc) as md5
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in (('public', 'get_web_dashboard_access'), ('private', 'web_dashboard_verdict'))
  loop
    v_falle := v_falle || format('P-1: esiste gia'' %s (md5 prosrc %s): salvare pg_get_functiondef(%L::regprocedure) prima di applicare', r.firma, r.md5, r.firma);
  end loop;
  if cardinality(v_falle) = 0 then
    raise notice 'P-1 ok: nessuna delle due funzioni esiste';
  end if;

  -- P-2: schema, ruoli, funzioni
  if pg_catalog.to_regnamespace('private') is null then
    v_falle := v_falle || 'P-2: schema private assente';
  end if;
  select count(*) into v_n from pg_catalog.pg_roles where rolname in ('anon', 'authenticated');
  if v_n <> 2 then
    v_falle := v_falle || format('P-2: ruoli anon/authenticated trovati %s su 2', v_n);
  end if;
  if pg_catalog.to_regprocedure('auth.uid()') is null then
    v_falle := v_falle || 'P-2: auth.uid() assente';
  end if;
  if pg_catalog.to_regclass('public.b2c_subscriptions') is null
     or pg_catalog.to_regprocedure('public.is_b2c_lifetime(public.b2c_subscriptions)') is null then
    v_falle := v_falle || 'P-2: public.is_b2c_lifetime(public.b2c_subscriptions) assente';
  end if;

  -- P-2: colonne e tipi (schema, tabella, colonna, tipo atteso)
  for r in
    select * from (values
      ('auth', 'users', 'id', 'uuid'), ('auth', 'users', 'created_at', 'timestamp with time zone'), ('auth', 'users', 'email', 'text|character varying'),
      ('public', 'user_roles', 'user_id', 'uuid'), ('public', 'user_roles', 'role', null), ('public', 'user_roles', 'note', 'text|character varying'),
      ('public', 'user_roles', 'expires_at', 'timestamp with time zone'),
      ('public', 'b2c_subscriptions', 'user_id', 'uuid'), ('public', 'b2c_subscriptions', 'state', null),
      ('public', 'b2c_subscriptions', 'billing_source', null), ('public', 'b2c_subscriptions', 'active_until', 'timestamp with time zone'),
      ('private', 'billing_pagamenti_segnalati', 'user_id', 'uuid'), ('private', 'billing_pagamenti_segnalati', 'revocato_at', 'timestamp with time zone'),
      ('private', 'billing_pagamenti_segnalati', 'valido_fino', 'timestamp with time zone')
    ) as t(s, tab, col, atteso)
  loop
    select pg_catalog.format_type(a.atttypid, a.atttypmod) into v_tipo
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = r.s and c.relname = r.tab and a.attname = r.col and a.attnum > 0 and not a.attisdropped;
    if v_tipo is null then
      v_falle := v_falle || format('P-2: colonna %s.%s.%s assente', r.s, r.tab, r.col);
    elsif r.atteso is not null and not (v_tipo ~ ('^(' || r.atteso || ')')) then
      v_falle := v_falle || format('P-2: %s.%s.%s ha tipo %s, atteso %s', r.s, r.tab, r.col, v_tipo, r.atteso);
    end if;
    v_tipo := null;
  end loop;
  if not exists (select 1 from unnest(v_falle) f where f like 'P-2%') then
    raise notice 'P-2 ok: schema, ruoli, funzioni, colonne e tipi attesi presenti';
  end if;

  -- P-3: informativo (il registro puo' non esistere o non essere leggibile da questo ruolo)
  begin
    execute $q$select coalesce(string_agg(version, ',' order by version desc), '') from (select version from supabase_migrations.schema_migrations order by version desc limit 3) s$q$ into v_registro;
    execute $q$select count(*) from supabase_migrations.schema_migrations where version = '20260924120000'$q$ into v_n;
    raise notice 'P-3 (informativo): ultime versioni nel registro: %; 20260924120000 %', v_registro, case when v_n > 0 then 'GIA'' REGISTRATA' else 'non registrata' end;
  exception when others then
    raise notice 'P-3 (informativo): registro non leggibile o assente (%)', sqlerrm;
  end;

  if cardinality(v_falle) > 0 then
    raise exception E'PRECONDIZIONI NON SODDISFATTE (%):\n  - %', cardinality(v_falle), array_to_string(v_falle, E'\n  - ');
  end if;
  raise notice 'PRECONDIZIONI: PASSA';
end
$precondizioni$;
