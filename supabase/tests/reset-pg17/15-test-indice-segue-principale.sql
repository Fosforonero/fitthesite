-- L'etichetta della sessione principale e la finestra dichiarata devono
-- parlare della STESSA sessione.
--
-- `internal._merge_sleep_stages_jsonb` prende la finestra dalla sessione piu'
-- RICCA (`v_main := v_selected[1]`) e poi, prima di S2-SERVER, riordinava per
-- orologio e attaccava `sessionIdx` per POSIZIONE. Quando le due coincidono
-- non si vede niente; quando non coincidono — un pisolino che PRECEDE la
-- notte — la riga dice due cose diverse su se stessa, e il client, che per
-- contratto si fida dell'etichetta, ne fa venti minuti presentati come otto
-- ore.
--
-- Misurato sulla produzione il 27/08/2026, in sola lettura (la funzione e'
-- IMMUTABLE e pura, si sonda con letterali sintetici senza scrivere):
-- finestra 7.200.000-36.000.000 (la notte), sessionIdx 0 su 0-1.200.000 (il
-- pisolino), un solo segmento.
--
-- Qui si prova sul percorso VERO — `upsert_fitness_metrics_v189` — non solo
-- sulla funzione pura: primo INSERT, secondo sync, e ordine dei non
-- principali.
--
-- Valori sintetici. Nessun dato reale, nessun utente reale.

\set ON_ERROR_STOP on

delete from public.fitness_metrics where user_id = 'fb222222-2222-2222-2222-222222222222';
delete from public.devices        where user_id = 'fb222222-2222-2222-2222-222222222222';
delete from public.user_roles     where user_id = 'fb222222-2222-2222-2222-222222222222';
delete from auth.users            where id      = 'fb222222-2222-2222-2222-222222222222';

insert into auth.users (id, email, created_at)
values ('fb222222-2222-2222-2222-222222222222','indice@prova.invalid', now() - interval '1 day');

insert into public.devices (id, user_id, device_fingerprint, source_type)
values ('fbdec222-2222-2222-2222-222222222222','fb222222-2222-2222-2222-222222222222',
        'impronta-sintetica-indice','health_connect');

do $t$
declare
  -- Pisolino di 20 minuti [0, 1.200.000] che PRECEDE una notte di 8 ore
  -- [7.200.000, 36.000.000]. La notte e' la piu' ricca: tre segmenti contro
  -- uno.
  v_pisolino_poi_notte constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":1200000,  "stage":"light"},
    {"sessionIdx":1,"startMs":7200000,  "endMs":18000000, "stage":"light"},
    {"sessionIdx":1,"startMs":18000000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":1,"startMs":28800000, "endMs":36000000, "stage":"rem"}
  ]'::jsonb;
  v_payload jsonb;
  v_i bigint; v_f bigint; v_n int; v_min int;
  v_i0 bigint; v_f0 bigint; v_n0 int; v_idx_pis int;
  v_stadi1 jsonb; v_stadi2 jsonb;
  n int := 0;
begin
  perform set_config('request.jwt.claim.sub','fb222222-2222-2222-2222-222222222222', true);

  v_payload := jsonb_build_object(
    'user_id',        'fb222222-2222-2222-2222-222222222222',
    'device_id',      'fbdec222-2222-2222-2222-222222222222',
    'local_day_key',  '2026-08-26',
    'source',         'health_connect',
    'window_start_ms', 0, 'window_end_ms', 36000000,
    'collected_at_ms', 36000000,
    -- Il client dichiara la finestra della NOTTE e i minuti della NOTTE.
    'sleep_start_ms', 7200000, 'sleep_end_ms', 36000000,
    'sleep_minutes',  480,
    'sleep_stages',   v_pisolino_poi_notte
  );

  -- =========================================================================
  -- 1. PRIMO INSERT: la finestra e' quella della notte
  -- =========================================================================
  perform public.upsert_fitness_metrics_v189(v_payload);
  select sleep_start_ms, sleep_end_ms, jsonb_array_length(sleep_stages), sleep_minutes, sleep_stages
    into v_i, v_f, v_n, v_min, v_stadi1
  from public.fitness_metrics
  where user_id = 'fb222222-2222-2222-2222-222222222222' and local_day_key = '2026-08-26';

  if v_i <> 7200000 or v_f <> 36000000 then
    raise exception '1 FALLISCE  primo INSERT: finestra %-% invece di 7200000-36000000 (la notte)', v_i, v_f;
  end if;
  n := n + 1; raise notice '1 PASSA  primo INSERT: la finestra e la notte';

  -- =========================================================================
  -- 2. LA STESSA SESSIONE PORTA L'ETICHETTA 0
  --    E' il punto: una sola autorita'. Chi da' la finestra da' anche l'indice.
  -- =========================================================================
  select min((e->>'startMs')::bigint), max((e->>'endMs')::bigint), count(*)
    into v_i0, v_f0, v_n0
  from jsonb_array_elements(v_stadi1) e
  where (e->>'sessionIdx')::int = 0;

  if v_i0 <> 7200000 or v_f0 <> 36000000 then
    raise exception '2 FALLISCE  sessionIdx 0 sta su %-% mentre la finestra dichiarata e 7200000-36000000: la riga si contraddice', v_i0, v_f0;
  end if;
  if v_n0 <> 3 then
    raise exception '2 FALLISCE  sessionIdx 0 ha % segmenti invece dei 3 della notte', v_n0;
  end if;
  if v_i <> v_i0 or v_f <> v_f0 then
    raise exception '2 FALLISCE  finestra (%-%) e sessione principale (%-%) parlano di due sessioni diverse', v_i, v_f, v_i0, v_f0;
  end if;
  n := n + 1; raise notice '2 PASSA  finestra, minuti ed etichetta 0 sono la stessa sessione';

  -- =========================================================================
  -- 3. I MINUTI SONO QUELLI DELLA NOTTE, NON DEL PISOLINO
  -- =========================================================================
  if v_min <> 480 then
    raise exception '3 FALLISCE  sleep_minutes % invece di 480', v_min;
  end if;
  if (v_f0 - v_i0) / 60000 < v_min then
    raise exception '3 FALLISCE  la sessione etichettata 0 dura % minuti, meno dei % dormiti dichiarati', (v_f0 - v_i0)/60000, v_min;
  end if;
  n := n + 1; raise notice '3 PASSA  i minuti stanno dentro la sessione che porta l etichetta 0';

  -- =========================================================================
  -- 4. IL PISOLINO NON SPARISCE: si rinumera, non si scarta
  -- =========================================================================
  select distinct (e->>'sessionIdx')::int into v_idx_pis
  from jsonb_array_elements(v_stadi1) e
  where (e->>'startMs')::bigint = 0 and (e->>'endMs')::bigint = 1200000;
  if v_idx_pis is null then
    raise exception '4 FALLISCE  il pisolino e sparito dall ipnogramma';
  end if;
  if v_idx_pis = 0 then
    raise exception '4 FALLISCE  il pisolino ha ancora l indice 0';
  end if;
  if v_n <> 4 then
    raise exception '4 FALLISCE  % stadi invece di 4', v_n;
  end if;
  n := n + 1; raise notice '4 PASSA  il pisolino resta, con indice % invece di 0', v_idx_pis;

  -- =========================================================================
  -- 5. SECONDO SYNC IDENTICO: idempotente, nessuna rinumerazione a ogni giro
  -- =========================================================================
  perform public.upsert_fitness_metrics_v189(v_payload);
  select sleep_start_ms, sleep_end_ms, jsonb_array_length(sleep_stages), sleep_stages
    into v_i, v_f, v_n, v_stadi2
  from public.fitness_metrics
  where user_id = 'fb222222-2222-2222-2222-222222222222' and local_day_key = '2026-08-26';

  if v_i <> 7200000 or v_f <> 36000000 or v_n <> 4 then
    raise exception '5 FALLISCE  secondo sync: finestra %-%, % stadi', v_i, v_f, v_n;
  end if;
  if v_stadi2 <> v_stadi1 then
    raise exception '5 FALLISCE  secondo sync: l ipnogramma e cambiato senza che i dati cambiassero';
  end if;
  n := n + 1; raise notice '5 PASSA  secondo sync: byte per byte lo stesso ipnogramma';

  raise notice '--- indice segue la principale: % controlli, tutti verdi ---', n;
end
$t$;

-- ===========================================================================
-- ORDINE DEI NON PRINCIPALI: deterministico, cronologico, dopo la principale
-- ===========================================================================
do $t2$
declare
  v_notte_due_pisolini constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":10800000, "stage":"light"},
    {"sessionIdx":0,"startMs":10800000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":1,"startMs":50400000, "endMs":52200000, "stage":"light"},
    {"sessionIdx":2,"startMs":61200000, "endMs":63000000, "stage":"light"}
  ]'::jsonb;
  r jsonb;
begin
  r := internal._merge_sleep_stages_jsonb(v_notte_due_pisolini, v_notte_due_pisolini);
  if (select (e->>'sessionIdx')::int from jsonb_array_elements(r->'stages') e
       where (e->>'startMs')::bigint = 0 limit 1) <> 0 then
    raise exception '6 FALLISCE  la notte (la piu ricca) non ha l indice 0';
  end if;
  if (select (e->>'sessionIdx')::int from jsonb_array_elements(r->'stages') e
       where (e->>'startMs')::bigint = 50400000 limit 1) <> 1 then
    raise exception '6 FALLISCE  il primo pisolino non ha l indice 1';
  end if;
  if (select (e->>'sessionIdx')::int from jsonb_array_elements(r->'stages') e
       where (e->>'startMs')::bigint = 61200000 limit 1) <> 2 then
    raise exception '6 FALLISCE  il secondo pisolino non ha l indice 2';
  end if;
  raise notice '6 PASSA  i non principali seguono in ordine cronologico';
end
$t2$;

-- ===========================================================================
-- CONTROLLO POSITIVO
--
-- Si rimette la forma PRE-FIX del riordino — solo cronologico — e si pretende
-- che l'indice torni sul pisolino. Se restasse corretto anche cosi', i
-- controlli qui sopra non dipenderebbero dal fix e il loro verde non
-- significherebbe niente. Alla fine si rimette la forma corretta.
-- ===========================================================================
do $cp$
declare
  v_def text;
  v_rotta text;
  v_caso constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":1200000,  "stage":"light"},
    {"sessionIdx":1,"startMs":7200000,  "endMs":18000000, "stage":"light"},
    {"sessionIdx":1,"startMs":18000000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":1,"startMs":28800000, "endMs":36000000, "stage":"rem"}
  ]'::jsonb;
  v_corretta text;
  v_nuova constant text :=
    '  select array_agg(' || chr(10) ||
    '           v order by' || chr(10) ||
    '             case when (v->>''start_ms'')::bigint = (v_main->>''start_ms'')::bigint' || chr(10) ||
    '                   and (v->>''end_ms'')::bigint = (v_main->>''end_ms'')::bigint' || chr(10) ||
    '                  then 0 else 1 end,' || chr(10) ||
    '             (v->>''start_ms'')::bigint' || chr(10) ||
    '         ) into v_selected';
  v_vecchia constant text :=
    '  select array_agg(v order by (v->>''start_ms'')::bigint) into v_selected';
  r jsonb;
  v_i0 bigint;
begin
  select pg_catalog.pg_get_functiondef(p.oid) into v_corretta
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'internal' and p.proname = '_merge_sleep_stages_jsonb';

  if pg_catalog.strpos(v_corretta, v_nuova) = 0 then
    raise exception 'CONTROLLO POSITIVO: la forma corretta non e nel corpo vivo, il test non sta misurando il fix';
  end if;

  v_rotta := pg_catalog.replace(v_corretta, v_nuova, v_vecchia);
  execute v_rotta;

  r := internal._merge_sleep_stages_jsonb(v_caso, v_caso);
  select min((e->>'startMs')::bigint) into v_i0
  from jsonb_array_elements(r->'stages') e where (e->>'sessionIdx')::int = 0;

  -- Si rimette subito la forma corretta, prima di qualunque asserzione: cosi'
  -- il database resta buono anche se il controllo positivo fallisce.
  execute v_corretta;

  if v_i0 <> 0 then
    raise exception 'CONTROLLO POSITIVO: con la forma pre-fix l indice 0 e su % invece che sul pisolino (0). Il test non dipende dal fix.', v_i0;
  end if;
  raise notice 'CONTROLLO POSITIVO PASSA  con il riordino solo cronologico l indice 0 torna sul pisolino';
end
$cp$;

delete from public.fitness_metrics where user_id = 'fb222222-2222-2222-2222-222222222222';
delete from public.devices        where user_id = 'fb222222-2222-2222-2222-222222222222';
delete from auth.users            where id      = 'fb222222-2222-2222-2222-222222222222';
