-- L'unico advisory che il registro aggiunge, e perché non è accesso esposto.
--
-- Applicando la migration, Supabase segnalerà `rls_enabled_no_policy` su
-- private.billing_purchase_claims, a livello INFO: "la tabella ha RLS attiva
-- ma nessuna policy". La regola esiste per un caso reale e pericoloso, cioè una
-- tabella in `public` raggiungibile via PostgREST dove qualcuno ha acceso RLS
-- e poi si è dimenticato di scrivere le policy: il risultato è una tabella che
-- sembra protetta e non lo è, oppure che nessuno legge senza capire perché.
--
-- Qui la stessa forma significa l'opposto. RLS senza policy vuol dire "nessuno
-- passa", e nessuno deve passare: il registro si scrive e si legge solo
-- attraverso claim_store_purchase(), che è SECURITY DEFINER.
--
-- Un advisory però non si liquida leggendo il proprio disegno. Questi test
-- provano l'accesso davvero, assumendo i ruoli con cui l'API parla al database.

begin;

do $$
declare
  v_n int;
  v_letto int;
begin
  ---------------------------------------------------------------------------
  -- Le tre condizioni che rendono l'advisory innocuo, misurate.
  ---------------------------------------------------------------------------

  -- 1. Lo schema non è raggiungibile: senza USAGE non si arriva nemmeno a
  --    nominare la tabella, quale che sia il suo RLS.
  select count(*) into v_n
  from (values ('anon'), ('authenticated'), ('service_role')) as r(nome)
  where has_schema_privilege(r.nome, 'private', 'USAGE');
  if v_n <> 0 then
    raise exception '% ruoli hanno USAGE su private: la tabella sarebbe nominabile', v_n;
  end if;

  -- 2. Nessun grant sulla tabella, per nessuno di quei ruoli e per nessun verbo.
  select count(*) into v_n
  from (values ('anon'), ('authenticated'), ('service_role')) as r(nome)
     , (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(verbo)
  where has_table_privilege(r.nome, 'private.billing_purchase_claims', p.verbo);
  if v_n <> 0 then
    raise exception '% privilegi concessi sulla tabella del registro', v_n;
  end if;

  -- 3. La tabella non sta in uno schema esposto da PostgREST. Supabase espone
  --    solo gli schemi elencati in config (public, graphql_public): `private`
  --    non c'è, quindi non esiste nessuna rotta REST che la nomini.
  select count(*) into v_n
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relname = 'billing_purchase_claims'
    and n.nspname in ('public', 'graphql_public');
  if v_n <> 0 then
    raise exception 'il registro e in uno schema esposto via API';
  end if;

  raise notice 'esposizione: 0 USAGE, 0 grant, 0 schemi esposti';
end $$;

---------------------------------------------------------------------------
-- E adesso il tentativo vero, non la teoria: si assume il ruolo e si legge.
---------------------------------------------------------------------------
do $$
declare
  v_esito text;
  v_bloccati int := 0;
  v_ruolo text;
begin
  foreach v_ruolo in array array['anon', 'authenticated'] loop
    begin
      execute format('set local role %I', v_ruolo);
      execute 'select count(*) from private.billing_purchase_claims';
      -- Se si arriva qui, la lettura è riuscita.
      execute 'reset role';
      raise exception 'il ruolo % ha LETTO il registro', v_ruolo;
    exception
      when insufficient_privilege then
        execute 'reset role';
        v_bloccati := v_bloccati + 1;
      when undefined_table then
        -- Senza USAGE sullo schema la tabella non esiste nemmeno come nome:
        -- è il rifiuto più netto possibile.
        execute 'reset role';
        v_bloccati := v_bloccati + 1;
    end;
  end loop;

  if v_bloccati <> 2 then
    raise exception 'solo % ruoli su 2 sono stati respinti', v_bloccati;
  end if;
  raise notice 'lettura diretta: anon e authenticated respinti entrambi';
end $$;

---------------------------------------------------------------------------
-- service_role: NON legge la tabella, ma esegue la funzione. È la differenza
-- fra "il backend può scrivere il registro" e "il backend può leggerlo tutto".
---------------------------------------------------------------------------
do $$
declare v_puo boolean;
begin
  select has_table_privilege('service_role', 'private.billing_purchase_claims', 'SELECT')
    into v_puo;
  if v_puo then
    raise exception 'service_role legge direttamente il registro: deve passare dalla funzione';
  end if;

  select has_function_privilege(
           'service_role',
           'public.claim_store_purchase(text,text,uuid,text,text,timestamptz,text,boolean,text,uuid,text,text)'::regprocedure,
           'EXECUTE')
    into v_puo;
  if not v_puo then
    raise exception 'service_role non puo eseguire la funzione: il backend non scriverebbe piu niente';
  end if;

  raise notice 'service_role: 0 accesso diretto, EXECUTE sulla sola funzione';
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / esposizione: TUTTE LE VERIFICHE OK'
\echo '=================================================='
