-- ============================================================================
-- ROLLBACK di S2-SERVER — l'indice torna a seguire l'orologio.
--
-- S2-SERVER non crea niente: MODIFICA una funzione che preesiste. Un rollback
-- che facesse `drop function` cancellerebbe il merge del sonno di ogni riga.
-- Qui si toglie soltanto cio' che S2-SERVER ha aggiunto, con la sostituzione
-- inversa sul corpo VIVO, letto da `pg_get_functiondef`.
--
-- Cosi' si conservano per costruzione firma, owner, privilegi, SECURITY
-- (INVOKER), volatilita' (IMMUTABLE) e `search_path`: `CREATE OR REPLACE` non
-- tocca owner e ACL, e tutto il resto e' gia' dentro la definizione riletta.
-- Non ci si fida di questa frase: i cinque attributi vengono letti PRIMA e
-- riconfrontati DOPO, e una differenza fa fallire il rollback.
--
-- Il conteggio delle occorrenze e' letterale, non con espressioni regolari:
-- l'ancora contiene parentesi e apici, che in un pattern sarebbero
-- metacaratteri.
--
-- Nessuna riga di dati viene toccata, ne' dalla migration ne' da qui: le
-- righe gia' scritte con l'indice nuovo restano come sono e verranno
-- rinumerate dal merge successivo, secondo la regola che sara' allora in
-- vigore.
-- ============================================================================
do $rollback$
declare
  v_oid oid;
  v_def text;
  v_nuova text;

  -- Cio' che S2-SERVER ha scritto.
  v_ancora constant text :=
    '  -- L''INDICE SEGUE LA PRINCIPALE, NON L''OROLOGIO.' || chr(10) ||
    '  -- v_main e'' gia'' la sessione scelta, ed e'' da lei che vengono' || chr(10) ||
    '  -- main_start_ms/main_end_ms. Riordinando solo per orologio, sessionIdx' || chr(10) ||
    '  -- finiva su chi comincia prima: con un pisolino che precede la notte la' || chr(10) ||
    '  -- riga usciva con la finestra della notte e l''etichetta sul pisolino.' || chr(10) ||
    '  -- Le sessioni tenute non si sovrappongono, quindi (principale, start_ms)' || chr(10) ||
    '  -- e'' un ordine totale.' || chr(10) ||
    '  select array_agg(' || chr(10) ||
    '           v order by' || chr(10) ||
    '             case when (v->>''start_ms'')::bigint = (v_main->>''start_ms'')::bigint' || chr(10) ||
    '                   and (v->>''end_ms'')::bigint = (v_main->>''end_ms'')::bigint' || chr(10) ||
    '                  then 0 else 1 end,' || chr(10) ||
    '             (v->>''start_ms'')::bigint' || chr(10) ||
    '         ) into v_selected' || chr(10) ||
    '  from unnest(v_selected) as v;';

  -- Cio' che c'era prima.
  v_originale constant text :=
    '  select array_agg(v order by (v->>''start_ms'')::bigint) into v_selected' || chr(10) ||
    '  from unnest(v_selected) as v;';

  v_occorrenze int;

  -- I cinque attributi da conservare, letti prima e riconfrontati dopo.
  v_owner_prima text;   v_owner_dopo text;
  v_secdef_prima bool;  v_secdef_dopo bool;
  v_volat_prima "char"; v_volat_dopo "char";
  v_conf_prima text;    v_conf_dopo text;
  v_acl_prima text;     v_acl_dopo text;
  v_firma_prima text;   v_firma_dopo text;
begin
  select p.oid,
         pg_catalog.pg_get_functiondef(p.oid),
         pg_catalog.pg_get_userbyid(p.proowner),
         p.prosecdef, p.provolatile,
         coalesce(array_to_string(p.proconfig, ','), ''),
         coalesce(array_to_string(p.proacl::text[], '|'), ''),
         p.oid::regprocedure::text
    into v_oid, v_def, v_owner_prima, v_secdef_prima, v_volat_prima,
         v_conf_prima, v_acl_prima, v_firma_prima
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'internal' and p.proname = '_merge_sleep_stages_jsonb';

  if v_def is null then
    raise exception 'ROLLBACK S2-SERVER: internal._merge_sleep_stages_jsonb non esiste';
  end if;

  v_occorrenze := (pg_catalog.length(v_def)
                   - pg_catalog.length(pg_catalog.replace(v_def, v_ancora, '')))
                  / pg_catalog.length(v_ancora);

  if v_occorrenze = 0 then
    raise notice 'ROLLBACK S2-SERVER: la migration non e'' applicata, niente da fare.';
    return;
  end if;
  if v_occorrenze <> 1 then
    raise exception
      'ROLLBACK S2-SERVER: ancora trovata % volte invece di 1: fermarsi.', v_occorrenze;
  end if;

  v_nuova := pg_catalog.replace(v_def, v_ancora, v_originale);
  execute v_nuova;

  -- Riconfronto: CREATE OR REPLACE non deve aver toccato niente di questo.
  select pg_catalog.pg_get_functiondef(p.oid),
         pg_catalog.pg_get_userbyid(p.proowner),
         p.prosecdef, p.provolatile,
         coalesce(array_to_string(p.proconfig, ','), ''),
         coalesce(array_to_string(p.proacl::text[], '|'), ''),
         p.oid::regprocedure::text
    into v_def, v_owner_dopo, v_secdef_dopo, v_volat_dopo,
         v_conf_dopo, v_acl_dopo, v_firma_dopo
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'internal' and p.proname = '_merge_sleep_stages_jsonb';

  if v_owner_dopo is distinct from v_owner_prima then
    raise exception 'ROLLBACK S2-SERVER: owner cambiato (% -> %)', v_owner_prima, v_owner_dopo;
  end if;
  if v_secdef_dopo is distinct from v_secdef_prima then
    raise exception 'ROLLBACK S2-SERVER: SECURITY DEFINER cambiato (% -> %)', v_secdef_prima, v_secdef_dopo;
  end if;
  if v_volat_dopo is distinct from v_volat_prima then
    raise exception 'ROLLBACK S2-SERVER: volatilita'' cambiata (% -> %)', v_volat_prima, v_volat_dopo;
  end if;
  if v_conf_dopo is distinct from v_conf_prima then
    raise exception 'ROLLBACK S2-SERVER: search_path cambiato (% -> %)', v_conf_prima, v_conf_dopo;
  end if;
  if v_acl_dopo is distinct from v_acl_prima then
    raise exception 'ROLLBACK S2-SERVER: privilegi cambiati (% -> %)', v_acl_prima, v_acl_dopo;
  end if;
  if v_firma_dopo is distinct from v_firma_prima then
    raise exception 'ROLLBACK S2-SERVER: firma cambiata (% -> %)', v_firma_prima, v_firma_dopo;
  end if;

  -- E il corpo deve essere tornato quello di prima: nessuna traccia residua.
  if pg_catalog.strpos(v_def, 'L''INDICE SEGUE LA PRINCIPALE') > 0 then
    raise exception 'ROLLBACK S2-SERVER: la sostituzione inversa non ha tolto tutto';
  end if;
  if (pg_catalog.length(v_def)
      - pg_catalog.length(pg_catalog.replace(v_def, v_originale, '')))
     / pg_catalog.length(v_originale) <> 1 then
    raise exception 'ROLLBACK S2-SERVER: il riordino cronologico non e'' tornato esattamente una volta';
  end if;

  raise notice 'ROLLBACK S2-SERVER: indice di nuovo per posizione cronologica; owner, privilegi, security, volatilita'' e search_path invariati.';
end
$rollback$;

-- ── POSTCONDIZIONE DEL ROLLBACK ────────────────────────────────────────────
-- Il difetto e' tornato: e' esattamente cio' che un rollback deve produrre, e
-- verificarlo e' l'unico modo di sapere che ha davvero agito.
do $verifica$
declare
  v_caso constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":1200000,  "stage":"light"},
    {"sessionIdx":1,"startMs":7200000,  "endMs":18000000, "stage":"light"},
    {"sessionIdx":1,"startMs":18000000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":1,"startMs":28800000, "endMs":36000000, "stage":"rem"}
  ]'::jsonb;
  r jsonb;
  v_i0 bigint;
begin
  r := internal._merge_sleep_stages_jsonb(v_caso, v_caso);
  select min((e->>'startMs')::bigint) into v_i0
  from jsonb_array_elements(r->'stages') e
  where (e->>'sessionIdx')::int = 0;

  if v_i0 <> 0 then
    raise exception
      'ROLLBACK S2-SERVER: il comportamento non e'' tornato quello di prima (sessionIdx 0 parte da % invece che da 0)', v_i0;
  end if;
  raise notice 'ROLLBACK S2-SERVER verificato: sessionIdx 0 e'' di nuovo la sessione piu'' mattutina.';
end
$verifica$;
