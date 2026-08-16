-- ============================================================================
-- END-TO-END SULLA RPC VERA: public.upsert_fitness_metrics_v189
--
-- La funzione pura si puo' provare con letterali; il difetto pero' si vede
-- addosso agli utenti passando dalla RPC, dalla tabella e dal suo ON CONFLICT.
-- Qui si sincronizza piu' volte come fa l'app e si guarda cosa resta scritto.
--
-- Questo file asserisce il comportamento CORRETTO. Va eseguito due volte:
--   * con la definizione di produzione  -> DEVE FALLIRE (prova che esercita il difetto)
--   * con la migration applicata        -> DEVE PASSARE
-- Un file che passa in entrambi gli stati non sta misurando niente.
--
-- Ogni caso apre una transazione e la chiude con ROLLBACK.
-- ============================================================================
\set ON_ERROR_STOP on
\timing off

-- Notte di riferimento: 3 stadi, 8 ore, come la manda il client.
-- 1754006400000 = 2026-08-01 00:00 UTC.
--
-- Sta in un'impostazione di SESSIONE e non in una \set di psql: le variabili di
-- psql non vengono sostituite dentro i blocchi $$...$$, mentre questa si legge
-- con current_setting e sopravvive ai ROLLBACK dei casi.
set test.notte = '[{"sessionIdx":0,"startMs":1754006400000,"endMs":1754020000000,"stage":"light"},{"sessionIdx":0,"startMs":1754020000000,"endMs":1754028000000,"stage":"deep"},{"sessionIdx":0,"startMs":1754028000000,"endMs":1754035200000,"stage":"rem"}]';

begin;

do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-0000000051ee';
  v_device uuid := '00000000-0000-4000-8000-00000000de71';
  v_notte jsonb := current_setting('test.notte')::jsonb;
  v_riga jsonb;
  v_id bigint;
  v_seg int;
  v_dist int;
  v_inizio bigint;
  v_fine bigint;
  v_min int;
  v_somma_stadi bigint;
  v_falliti int := 0;
begin
  raise notice '########## END-TO-END SULLA RPC ##########';

  insert into public.devices (id, user_id) values (v_device, v_utente);
  perform set_config('test.uid', v_utente::text, true);

  v_riga := jsonb_build_object(
    'user_id', v_utente, 'device_id', v_device, 'local_day_key', '2026-08-01',
    'source', 'health_connect', 'source_device', 'Pixel',
    'collected_at_ms', 1754035200000::bigint,
    'window_start_ms', 1754006400000::bigint, 'window_end_ms', 1754035200000::bigint,
    'sleep_minutes', 480,
    'sleep_start_ms', 1754006400000::bigint, 'sleep_end_ms', 1754035200000::bigint,
    'sleep_stages', v_notte
  );

  -- ── E1. La stessa notte, sincronizzata tre volte ──────────────────────────
  v_id := public.upsert_fitness_metrics_v189(v_riga);
  select jsonb_array_length(sleep_stages) into v_seg from public.fitness_metrics where id = v_id;
  if v_seg <> 3 then
    raise warning 'E1 FAIL: dopo il PRIMO invio ci sono % segmenti invece di 3', v_seg;
    v_falliti := v_falliti + 1;
  end if;

  perform public.upsert_fitness_metrics_v189(v_riga);
  select jsonb_array_length(sleep_stages), sleep_start_ms, sleep_end_ms, sleep_minutes
    into v_seg, v_inizio, v_fine, v_min
  from public.fitness_metrics where id = v_id;

  if v_seg <> 3 then
    raise warning 'E1 FAIL: dopo il SECONDO invio ci sono % segmenti invece di 3 — e'' il difetto', v_seg;
    v_falliti := v_falliti + 1;
  end if;
  if v_inizio <> 1754006400000 or v_fine <> 1754035200000 then
    raise warning 'E1 FAIL: finestra spostata a [%, %]', v_inizio, v_fine;
    v_falliti := v_falliti + 1;
  end if;
  if v_min <> 480 then
    raise warning 'E1 FAIL: sleep_minutes passato a % invece di 480', v_min;
    v_falliti := v_falliti + 1;
  end if;

  perform public.upsert_fitness_metrics_v189(v_riga);
  select jsonb_array_length(sleep_stages) into v_seg from public.fitness_metrics where id = v_id;
  if v_seg <> 3 then
    raise warning 'E1 FAIL: dopo il TERZO invio ci sono % segmenti invece di 3', v_seg;
    v_falliti := v_falliti + 1;
  end if;

  -- Le percentuali che l'app mostra: nessuna fase puo' superare la notte.
  select sum((s.value->>'endMs')::bigint - (s.value->>'startMs')::bigint)
    into v_somma_stadi
  from public.fitness_metrics fm, jsonb_array_elements(fm.sleep_stages) s(value)
  where fm.id = v_id;
  if v_somma_stadi > (1754035200000 - 1754006400000) then
    raise warning 'E1 FAIL: la somma degli stadi (% ms) supera la notte (% ms) — e'' il 109%% visto in app',
      v_somma_stadi, 1754035200000 - 1754006400000;
    v_falliti := v_falliti + 1;
  end if;

  if v_falliti = 0 then
    raise notice '  OK  E1 — tre invii della stessa notte: 3 segmenti, finestra ferma, somma degli stadi entro la notte';
  end if;

  if v_falliti > 0 then
    raise exception 'end-to-end E1: % asserzioni fallite', v_falliti;
  end if;
end $$;

rollback;


-- ── E2. Una riga GIA' SPORCA guarisce alla sincronizzazione dopo ────────────
--
-- E' lo stato in cui si trova oggi il 72-85% delle righe con sonno. Se questa
-- passa, la correzione ripara da sola gli utenti attivi e la riparazione
-- storica serve solo a chi non sincronizza piu'.
begin;

do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-0000000051ee';
  v_device uuid := '00000000-0000-4000-8000-00000000de71';
  v_notte jsonb := current_setting('test.notte')::jsonb;
  v_id bigint;
  v_seg int;
begin
  insert into public.devices (id, user_id) values (v_device, v_utente);
  perform set_config('test.uid', v_utente::text, true);

  -- Si scrive a mano la riga com'e' adesso in produzione: doppia.
  insert into public.fitness_metrics
    (user_id, device_id, source, source_device, local_day_key, collected_at_ms,
     received_at, sleep_minutes, sleep_start_ms, sleep_end_ms, sleep_stages)
  values
    (v_utente, v_device, 'health_connect', 'Pixel', '2026-08-01', 1754035200000,
     now(), 480, 1754006400000, 1754035200000, v_notte || v_notte)
  returning id into v_id;

  select jsonb_array_length(sleep_stages) into v_seg from public.fitness_metrics where id = v_id;
  if v_seg <> 6 then
    raise exception 'E2 PREMESSA: la riga di partenza doveva avere 6 segmenti, ne ha %', v_seg;
  end if;

  perform public.upsert_fitness_metrics_v189(jsonb_build_object(
    'user_id', v_utente, 'device_id', v_device, 'local_day_key', '2026-08-01',
    'source', 'health_connect', 'source_device', 'Pixel',
    'collected_at_ms', 1754035200000::bigint,
    'sleep_minutes', 480,
    'sleep_start_ms', 1754006400000::bigint, 'sleep_end_ms', 1754035200000::bigint,
    'sleep_stages', v_notte));

  select jsonb_array_length(sleep_stages) into v_seg from public.fitness_metrics where id = v_id;
  if v_seg <> 3 then
    raise exception 'E2 FAIL: la riga sporca non guarisce: % segmenti invece di 3', v_seg;
  end if;

  raise notice '  OK  E2 — una riga gia'' doppia torna a 3 segmenti alla prima sincronizzazione utile';
end $$;

rollback;


-- ── E3. Notte e pisolino da sincronizzazioni diverse ────────────────────────
begin;

do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-0000000051ee';
  v_device uuid := '00000000-0000-4000-8000-00000000de71';
  v_notte jsonb := current_setting('test.notte')::jsonb;
  v_pisolino jsonb := '[{"sessionIdx":1,"startMs":1754056800000,"endMs":1754060400000,"stage":"light"}]'::jsonb;
  v_base jsonb;
  v_id bigint;
  v_seg int; v_sess int;
begin
  insert into public.devices (id, user_id) values (v_device, v_utente);
  perform set_config('test.uid', v_utente::text, true);

  v_base := jsonb_build_object(
    'user_id', v_utente, 'device_id', v_device, 'local_day_key', '2026-08-01',
    'source', 'health_connect', 'source_device', 'Pixel',
    'collected_at_ms', 1754035200000::bigint, 'sleep_minutes', 480,
    'sleep_start_ms', 1754006400000::bigint, 'sleep_end_ms', 1754035200000::bigint);

  v_id := public.upsert_fitness_metrics_v189(v_base || jsonb_build_object('sleep_stages', v_notte));
  perform public.upsert_fitness_metrics_v189(
    v_base || jsonb_build_object('sleep_stages', v_pisolino, 'collected_at_ms', 1754060400000::bigint));
  -- e poi la stessa cosa di nuovo, come farebbe una risincronizzazione
  perform public.upsert_fitness_metrics_v189(
    v_base || jsonb_build_object('sleep_stages', v_pisolino, 'collected_at_ms', 1754060400000::bigint));

  select jsonb_array_length(sleep_stages),
         (select count(distinct s.value->>'sessionIdx')
            from jsonb_array_elements(fm.sleep_stages) s(value))
    into v_seg, v_sess
  from public.fitness_metrics fm where fm.id = v_id;

  if v_sess <> 2 then
    raise exception 'E3 FAIL: attese 2 sessioni (notte + pisolino), trovate %', v_sess;
  end if;
  if v_seg <> 4 then
    raise exception 'E3 FAIL: attesi 4 segmenti (3 notte + 1 pisolino), trovati %', v_seg;
  end if;

  raise notice '  OK  E3 — notte e pisolino sopravvivono entrambi, e la ripetizione non li raddoppia';
end $$;

rollback;


-- ── E4. La notte cresce: nessun segmento va perso ───────────────────────────
begin;

do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-0000000051ee';
  v_device uuid := '00000000-0000-4000-8000-00000000de71';
  v_parziale jsonb := '[{"sessionIdx":0,"startMs":1754006400000,"endMs":1754020000000,"stage":"light"}]'::jsonb;
  v_notte jsonb := current_setting('test.notte')::jsonb;
  v_base jsonb;
  v_id bigint;
  v_seg int;
  v_fine bigint;
begin
  insert into public.devices (id, user_id) values (v_device, v_utente);
  perform set_config('test.uid', v_utente::text, true);

  v_base := jsonb_build_object(
    'user_id', v_utente, 'device_id', v_device, 'local_day_key', '2026-08-01',
    'source', 'health_connect', 'source_device', 'Pixel', 'sleep_minutes', 480,
    'sleep_start_ms', 1754006400000::bigint, 'sleep_end_ms', 1754035200000::bigint);

  -- sincronizzazione a notte in corso, poi a notte finita, poi ripetuta
  v_id := public.upsert_fitness_metrics_v189(
    v_base || jsonb_build_object('sleep_stages', v_parziale, 'collected_at_ms', 1754020000000::bigint));
  perform public.upsert_fitness_metrics_v189(
    v_base || jsonb_build_object('sleep_stages', v_notte, 'collected_at_ms', 1754035200000::bigint));
  perform public.upsert_fitness_metrics_v189(
    v_base || jsonb_build_object('sleep_stages', v_notte, 'collected_at_ms', 1754035200000::bigint));

  select jsonb_array_length(sleep_stages), sleep_end_ms into v_seg, v_fine
  from public.fitness_metrics where id = v_id;

  if v_seg <> 3 then
    raise exception 'E4 FAIL: attesi 3 segmenti dopo la crescita, trovati %', v_seg;
  end if;
  if v_fine <> 1754035200000 then
    raise exception 'E4 FAIL: la notte cresciuta non arriva in fondo: fine = %', v_fine;
  end if;

  raise notice '  OK  E4 — la notte che cresce arriva completa, e la ripetizione non la raddoppia';
end $$;

rollback;

do $$ begin raise notice '########## END-TO-END: tutte verdi ##########'; end $$;
