-- La finestra della notte principale non si allarga per un risveglio ai bordi,
-- e non dipende da quante volte hai sincronizzato.
--
-- Due proprieta' distinte, che vanno provate insieme perche' un fix puo'
-- soddisfarne una e rompere l'altra:
--
--   A. gli awake ai BORDI non spostano main_start_ms / main_end_ms;
--   B. il PRIMO INSERT e i sync successivi danno la stessa finestra.
--
-- La B esisteva gia' da 20260817073706, che ha fatto usare all'INSERT la
-- stessa funzione dell'UPDATE. Proprio per quello la A e' diventata visibile
-- fin dal primo salvataggio: prima il valore corretto del client sopravviveva
-- almeno un giro.
--
-- Misurato in produzione il 25/08/2026: 418 notti su 1.038 in 7 giorni,
-- 40,3%, con health_connect al 53,8% e l'anello a zero.
--
-- Valori sintetici. Nessun dato reale, nessun utente reale.

\set ON_ERROR_STOP on

delete from public.fitness_metrics where user_id = 'fa111111-1111-1111-1111-111111111111';
delete from public.devices        where user_id = 'fa111111-1111-1111-1111-111111111111';
delete from public.user_roles     where user_id = 'fa111111-1111-1111-1111-111111111111';
delete from auth.users            where id      = 'fa111111-1111-1111-1111-111111111111';

insert into auth.users (id, email, created_at)
values ('fa111111-1111-1111-1111-111111111111','sonno@prova.invalid', now() - interval '1 day');

insert into public.devices (id, user_id, device_fingerprint, source_type)
values ('fadec111-1111-1111-1111-111111111111','fa111111-1111-1111-1111-111111111111',
        'impronta-sintetica-sonno','health_connect');

do $t$
declare
  -- Notte di 8 ore [0, 28800000] ms, con un awake di 3 minuti prima e uno
  -- di 3 minuti dopo. La finestra giusta e' [0, 28800000], non
  -- [-180000, 28980000].
  v_notte constant jsonb := '[
    {"sessionIdx":0,"startMs":-180000,  "endMs":0,        "stage":"awake"},
    {"sessionIdx":0,"startMs":0,        "endMs":14400000, "stage":"light"},
    {"sessionIdx":0,"startMs":14400000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":0,"startMs":28800000, "endMs":28980000, "stage":"awake"}
  ]'::jsonb;
  v_payload jsonb;
  v_i1 bigint; v_f1 bigint; v_n1 int;
  v_i2 bigint; v_f2 bigint; v_n2 int;
  v_min int;
  n int := 0;
begin
  perform set_config('request.jwt.claim.sub','fa111111-1111-1111-1111-111111111111', true);

  v_payload := jsonb_build_object(
    'user_id',        'fa111111-1111-1111-1111-111111111111',
    'device_id',      'fadec111-1111-1111-1111-111111111111',
    'local_day_key',  '2026-08-25',
    'source',         'health_connect',
    'window_start_ms', 0, 'window_end_ms', 28980000,
    'collected_at_ms', 28980000,
    -- gli estremi che il CLIENT dichiara, gia' corretti: escludono gli awake
    'sleep_start_ms', 0, 'sleep_end_ms', 28800000,
    'sleep_minutes',  480,
    'sleep_stages',   v_notte
  );

  -- =========================================================================
  -- 1. PRIMO INSERT: la finestra esclude gli awake ai bordi
  -- =========================================================================
  perform public.upsert_fitness_metrics_v189(v_payload);
  select sleep_start_ms, sleep_end_ms, jsonb_array_length(sleep_stages)
    into v_i1, v_f1, v_n1
  from public.fitness_metrics
  where user_id = 'fa111111-1111-1111-1111-111111111111' and local_day_key = '2026-08-25';

  if v_i1 <> 0 then
    raise exception '1 FALLISCE  primo INSERT: sleep_start_ms % invece di 0 (un awake iniziale sposta la notte)', v_i1;
  end if;
  if v_f1 <> 28800000 then
    raise exception '1 FALLISCE  primo INSERT: sleep_end_ms % invece di 28800000 (un awake finale allunga la notte)', v_f1;
  end if;
  n := n + 1; raise notice '1 PASSA  primo INSERT: finestra 0-28800000, gli awake ai bordi non la spostano';

  -- =========================================================================
  -- 2. GLI AWAKE RESTANO NELL'IPNOGRAMMA
  --    Non si e' chiesto di scartarli: si e' chiesto che non decidano i bordi.
  -- =========================================================================
  if v_n1 <> 4 then
    raise exception '2 FALLISCE  primo INSERT: % stadi invece di 4. Gli awake vanno tenuti', v_n1;
  end if;
  n := n + 1; raise notice '2 PASSA  i 4 stadi restano, awake compresi';

  -- =========================================================================
  -- 3. SECONDO SYNC, PAYLOAD IDENTICO: stessa finestra, nessuna duplicazione
  -- =========================================================================
  perform public.upsert_fitness_metrics_v189(v_payload);
  select sleep_start_ms, sleep_end_ms, jsonb_array_length(sleep_stages)
    into v_i2, v_f2, v_n2
  from public.fitness_metrics
  where user_id = 'fa111111-1111-1111-1111-111111111111' and local_day_key = '2026-08-25';

  if v_i2 <> v_i1 or v_f2 <> v_f1 then
    raise exception '3 FALLISCE  la finestra dipende dal numero di sync: primo (%,%), secondo (%,%)', v_i1, v_f1, v_i2, v_f2;
  end if;
  n := n + 1; raise notice '3 PASSA  secondo sync: stessa finestra del primo INSERT';

  if v_n2 <> 4 then
    raise exception '3b FALLISCE  al secondo sync gli stadi sono % invece di 4: duplicazione', v_n2;
  end if;
  n := n + 1; raise notice '3b PASSA  secondo sync: 4 stadi, nessuna duplicazione';

  -- =========================================================================
  -- 4. PAYLOAD GIA' DUPLICATO: la rete di sicurezza lo ripulisce
  -- =========================================================================
  perform public.upsert_fitness_metrics_v189(v_payload || jsonb_build_object('sleep_stages', v_notte || v_notte));
  select sleep_start_ms, sleep_end_ms, jsonb_array_length(sleep_stages)
    into v_i2, v_f2, v_n2
  from public.fitness_metrics
  where user_id = 'fa111111-1111-1111-1111-111111111111' and local_day_key = '2026-08-25';
  if v_n2 <> 4 then
    raise exception '4 FALLISCE  payload gia doppio: % stadi invece di 4', v_n2;
  end if;
  if v_i2 <> 0 or v_f2 <> 28800000 then
    raise exception '4 FALLISCE  payload gia doppio: finestra %-% invece di 0-28800000', v_i2, v_f2;
  end if;
  n := n + 1; raise notice '4 PASSA  payload gia duplicato: 4 stadi e finestra invariata';

  -- =========================================================================
  -- 5. ESTREMI E MINUTI NON SI CONTRADDICONO
  --    Il tempo a letto non puo' essere minore dei minuti dormiti, e con
  --    questa notte i due devono coincidere: 480 minuti dormiti, 480 di
  --    finestra. Prima del fix la finestra era 483 e i minuti 480.
  -- =========================================================================
  select sleep_minutes into v_min from public.fitness_metrics
  where user_id = 'fa111111-1111-1111-1111-111111111111' and local_day_key = '2026-08-25';
  if (v_f2 - v_i2) / 60000 <> v_min then
    raise exception '5 FALLISCE  finestra % minuti contro sleep_minutes %: i due numeri si contraddicono', (v_f2 - v_i2)/60000, v_min;
  end if;
  n := n + 1; raise notice '5 PASSA  finestra e sleep_minutes coincidono (% minuti)', v_min;

  raise notice '--- finestra sonno: % controlli, tutti verdi ---', n;
end
$t$;

-- ===========================================================================
-- CONTROLLO POSITIVO
--
-- Si rimette la forma PRE-FIX degli estremi — min/max su TUTTI i segmenti,
-- awake compresi — e si pretende che la finestra torni ad allargarsi. Se
-- restasse corretta anche cosi', i test sopra non dipenderebbero dal fix e il
-- loro verde non significherebbe niente.
--
-- La funzione vera viene ripristinata PRIMA di qualunque verdetto.
-- ===========================================================================
do $cp$
declare
  v_notte constant jsonb := '[
    {"sessionIdx":0,"startMs":-180000,  "endMs":0,        "stage":"awake"},
    {"sessionIdx":0,"startMs":0,        "endMs":14400000, "stage":"light"},
    {"sessionIdx":0,"startMs":14400000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":0,"startMs":28800000, "endMs":28980000, "stage":"awake"}
  ]'::jsonb;
  v_vera text;
  v_pre  text;
  v_i_dopo bigint; v_f_dopo bigint;
  v_i_vera bigint; v_f_vera bigint;
begin
  v_vera := pg_get_functiondef('internal._merge_sleep_stages_jsonb(jsonb,jsonb)'::regprocedure);

  v_i_vera := (internal._merge_sleep_stages_jsonb(v_notte, v_notte)->>'main_start_ms')::bigint;
  v_f_vera := (internal._merge_sleep_stages_jsonb(v_notte, v_notte)->>'main_end_ms')::bigint;

  -- forma pre-fix: si toglie il coalesce e si torna agli estremi di tutti
  v_pre := replace(replace(v_vera,
      'coalesce((v_main->>''sleep_start_ms'')::bigint,
                              (v_main->>''start_ms'')::bigint)', '(v_main->>''start_ms'')::bigint'),
      'coalesce((v_main->>''sleep_end_ms'')::bigint,
                              (v_main->>''end_ms'')::bigint)', '(v_main->>''end_ms'')::bigint');

  if v_pre = v_vera then
    raise exception 'CONTROLLO POSITIVO ROTTO: non e riuscito a costruire la forma pre-fix. La sonda non sa mutare la funzione, quindi non prova niente.';
  end if;

  execute v_pre;
  v_i_dopo := (internal._merge_sleep_stages_jsonb(v_notte, v_notte)->>'main_start_ms')::bigint;
  v_f_dopo := (internal._merge_sleep_stages_jsonb(v_notte, v_notte)->>'main_end_ms')::bigint;

  execute v_vera;   -- ripristino PRIMA di giudicare

  if v_i_vera <> 0 or v_f_vera <> 28800000 then
    raise exception 'CONTROLLO POSITIVO ROTTO: la funzione vera non dava 0-28800000 ma %-%', v_i_vera, v_f_vera;
  end if;
  if v_i_dopo <> -180000 or v_f_dopo <> 28980000 then
    raise exception 'CONTROLLO POSITIVO ROTTO: senza il fix attesi -180000/28980000, ottenuti %/%. I test sopra non dipendono dal fix.', v_i_dopo, v_f_dopo;
  end if;
  raise notice '6 PASSA  controllo positivo: senza il fix la finestra torna -180000/28980000, cioe 3 minuti prima e 3 dopo';

  if (internal._merge_sleep_stages_jsonb(v_notte, v_notte)->>'main_start_ms')::bigint <> 0 then
    raise exception '6b FALLISCE  la funzione vera non e stata ripristinata';
  end if;
  raise notice '6b PASSA  la funzione vera e ripristinata';
  raise notice 'finestra sonno: sette controlli, tutti verdi.';
end
$cp$;

delete from public.fitness_metrics where user_id = 'fa111111-1111-1111-1111-111111111111';
delete from public.devices        where user_id = 'fa111111-1111-1111-1111-111111111111';
delete from auth.users            where id      = 'fa111111-1111-1111-1111-111111111111';
