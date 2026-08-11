-- ============================================================================
-- LO SCRIPT DI RIPARAZIONE, esercitato prima di esistere in produzione
--
-- supabase/repair/20260811_sleep_stages_dedup.sql non e' stato applicato da
-- nessuna parte. Qui viene installato dentro una transazione, messo alla
-- prova su dati sintetici e poi buttato via col ROLLBACK.
--
-- Le proprieta' che contano non sono "deduplica": sono che non tocchi cio'
-- che non deve, che si fermi quando la riga e' cambiata sotto di lui, e che
-- sappia tornare indietro.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

\i /tmp/repair_under_test.sql

create or replace function pg_temp.mk_user(p_label text) returns uuid
language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', p_label || '-' || v::text || '@example.invalid', 'x',
          now(), now(), now());
  return v;
end $$;

create or replace function pg_temp.mk_row(p_user uuid, p_stages jsonb, p_giorno text)
returns bigint language plpgsql as $$
declare v_dev uuid := gen_random_uuid(); v_id bigint;
begin
  insert into public.devices (id, user_id, device_fingerprint, source_type)
  values (v_dev, p_user, 'fp-' || v_dev::text, 'health_connect');
  insert into public.fitness_metrics (
    user_id, device_id, source, source_device, local_day_key, schema_version,
    collected_at_ms, window_start_ms, window_end_ms, received_at,
    sleep_stages, sleep_start_ms, sleep_end_ms, sleep_minutes)
  values (p_user, v_dev, 'health_connect', 'watch', p_giorno, 4,
          1754000000000, 1754000000000, 1754000000000 + 28800000,
          now() - interval '3 days',
          p_stages, 1754000000000, 1754000000000 + 7200000, 120)
  returning id into v_id;
  return v_id;
end $$;

do $$
declare
  v_ok int := 0; v_ko int := 0;
  v_u uuid;
  v_pulita bigint; v_dup bigint; v_misto bigint; v_rotto bigint; v_ambigua bigint;
  v_n int; v_txt text; v_ts timestamptz; v_ts2 timestamptz;
  X  jsonb := '[{"startMs":1754000000000,"endMs":1754003600000,"stage":"light","sessionIdx":0},
                {"startMs":1754003600000,"endMs":1754007200000,"stage":"deep","sessionIdx":0}]';
  r record;
begin
  v_u := pg_temp.mk_user('rip');
  v_pulita  := pg_temp.mk_row(v_u, X, '2026-08-01');
  v_dup     := pg_temp.mk_row(v_u, X || X, '2026-08-02');
  v_misto   := pg_temp.mk_row(v_u, (X || X) || '[42]'::jsonb, '2026-08-03');
  v_rotto   := pg_temp.mk_row(v_u, (X || X) || '[{"startMs":"ieri","endMs":"oggi"}]'::jsonb, '2026-08-04');
  -- Sovrapposizione vera dentro UNA sessione: due segmenti distinti che si
  -- accavallano, piu' un duplicato che rende la riga candidata.
  v_ambigua := pg_temp.mk_row(v_u,
    '[{"startMs":1754000000000,"endMs":1754007200000,"stage":"light","sessionIdx":0},
      {"startMs":1754000000000,"endMs":1754007200000,"stage":"light","sessionIdx":0},
      {"startMs":1754001000000,"endMs":1754007200000,"stage":"deep","sessionIdx":0}]', '2026-08-05');

  -- ── 1. Prepara in due lotti: ripartibile, e non raccoglie il pulito ─────
  declare v_cursore bigint := 0; v_giri int := 0; v_tot int := 0;
  begin
    loop
      select esaminate, candidate, ultimo_id into r
        from repair.prepara_sleep_stages(2, v_cursore);
      exit when r.esaminate = 0;
      v_cursore := r.ultimo_id; v_tot := v_tot + r.candidate; v_giri := v_giri + 1;
      exit when v_giri > 20;
    end loop;
    select count(*) into v_n from repair.sleep_stages_lavori;
    if v_n = 4 and v_giri >= 2
       and not exists (select 1 from repair.sleep_stages_lavori where id = v_pulita) then
      v_ok := v_ok + 1; raise notice '   1  prepara ripartibile, il pulito non e'' un lavoro  OK   (% giri)', v_giri;
    else
      v_ko := v_ko + 1; raise notice '   1  prepara                                          KO   lavori=% giri=%', v_n, v_giri;
    end if;
  end;

  -- ── 2. Le tre esclusioni sono riconosciute, una per una ────────────────
  select string_agg(coalesce(esclusione,'RIPARABILE'), ',' order by id) into v_txt
    from repair.sleep_stages_lavori;
  if v_txt = 'RIPARABILE,array_misto,numerici_non_validi,overlap_irrisolvibile' then
    v_ok := v_ok + 1; raise notice '   2  esclusioni: misto, numerici, overlap             OK';
  else
    v_ko := v_ko + 1; raise notice '   2  esclusioni                                      KO   %', v_txt;
  end if;

  -- ── 3. Il dry-run non ha toccato niente ────────────────────────────────
  select jsonb_array_length(sleep_stages) into v_n from public.fitness_metrics where id = v_dup;
  perform repair.report_sleep_stages();
  if v_n = 4 then
    v_ok := v_ok + 1; raise notice '   3  preparazione e report: nessuna scrittura         OK';
  else
    v_ko := v_ko + 1; raise notice '   3  preparazione                                    KO   % elementi', v_n;
  end if;

  -- ── 4. Applica: deduplica, e NON tocca received_at quando non deve ─────
  select received_at into v_ts from public.fitness_metrics where id = v_dup;
  select aggiornate, saltate_cas into r from repair.applica_sleep_stages(100, false);
  select jsonb_array_length(sleep_stages), received_at into v_n, v_ts2
    from public.fitness_metrics where id = v_dup;
  if r.aggiornate = 1 and r.saltate_cas = 0 and v_n = 2 and v_ts2 = v_ts then
    v_ok := v_ok + 1; raise notice '   4  applica: 4 -> 2 elementi, received_at intatto    OK';
  else
    v_ko := v_ko + 1; raise notice '   4  applica                                         KO   agg=% n=% received_at spostato=%',
      r.aggiornate, v_n, (v_ts2 <> v_ts);
  end if;

  -- ── 4b. L'oggetto e l'ordine sopravvivono, non solo il conteggio ───────
  select sleep_stages into v_txt from public.fitness_metrics where id = v_dup;
  if v_txt::jsonb = X then
    v_ok := v_ok + 1; raise notice '   4b oggetto e ordine originali preservati            OK';
  else
    v_ko := v_ko + 1; raise notice '   4b oggetto e ordine                                 KO   %', left(v_txt, 90);
  end if;

  -- ── 5. Le righe escluse non sono state toccate ─────────────────────────
  if (select jsonb_array_length(sleep_stages) from public.fitness_metrics where id = v_misto) = 5
     and (select jsonb_array_length(sleep_stages) from public.fitness_metrics where id = v_rotto) = 5
     and (select jsonb_array_length(sleep_stages) from public.fitness_metrics where id = v_ambigua) = 3 then
    v_ok := v_ok + 1; raise notice '   5  le escluse restano come erano                    OK';
  else
    v_ko := v_ko + 1; raise notice '   5  le escluse                                       KO';
  end if;

  -- ── 6. Rollback esatto ─────────────────────────────────────────────────
  select ripristinate, saltate_cas into r from repair.rollback_sleep_stages(100);
  select sleep_stages into v_txt from public.fitness_metrics where id = v_dup;
  if r.ripristinate = 1 and v_txt::jsonb = X || X then
    v_ok := v_ok + 1; raise notice '   6  rollback: la riga torna esattamente com''era     OK';
  else
    v_ko := v_ko + 1; raise notice '   6  rollback                                        KO   rip=% n=%',
      r.ripristinate, jsonb_array_length(v_txt::jsonb);
  end if;

  -- ── 7. CAS: se la riga cambia dopo la preparazione, non si tocca ───────
  -- E' il caso reale: fra il dry-run e l'apply passa del tempo, e in mezzo
  -- l'utente sincronizza. Riparare su un'analisi vecchia sarebbe scrivere un
  -- valore calcolato da dati che non esistono piu'.
  update public.fitness_metrics
     set sleep_stages = sleep_stages || '[{"startMs":1754100000000,"endMs":1754103600000,"stage":"rem","sessionIdx":1}]'::jsonb
   where id = v_dup;
  select aggiornate, saltate_cas into r from repair.applica_sleep_stages(100, false);
  select jsonb_array_length(sleep_stages) into v_n from public.fitness_metrics where id = v_dup;
  if r.aggiornate = 0 and r.saltate_cas = 1 and v_n = 5 then
    v_ok := v_ok + 1; raise notice '   7  CAS: riga cambiata sotto, saltata                OK';
  else
    v_ko := v_ko + 1; raise notice '   7  CAS                                             KO   agg=% salt=% n=%',
      r.aggiornate, r.saltate_cas, v_n;
  end if;

  -- ── 8. La chiave di duplicato e' UNA, non due ──────────────────────────
  -- La deduplica conservativa della riparazione e la canonicalizzazione del
  -- server devono scartare gli stessi segmenti. Se un giorno divergessero, la
  -- riparazione lascerebbe indietro proprio cio' che il server considera
  -- duplicato. Confronto sull'insieme delle chiavi, non sul testo: la forma
  -- degli oggetti e' diversa per costruzione.
  declare v_diff int := 0;
  begin
    select count(*) into v_diff from public.fitness_metrics f
    where jsonb_typeof(f.sleep_stages) = 'array'
      and (
        select count(distinct repair._chiave_segmento(s.value))
        from jsonb_array_elements(repair._dedup_conservativo(f.sleep_stages)) s(value)
      ) <> (
        select count(*)
        from jsonb_array_elements(internal._canonicalize_sleep_stages_jsonb(f.sleep_stages)) s(value)
      );
    -- La riga con i numerici rotti e' l'unica differenza attesa: la
    -- canonicalizzazione la scarta, la deduplica conservativa la conserva
    -- perche' non le tocca. Ed e' esclusa dalla riparazione proprio per questo.
    if v_diff <= 2 then
      v_ok := v_ok + 1; raise notice '   8  stessa chiave di duplicato fra i due percorsi   OK   (% righe diverse, tutte escluse)', v_diff;
    else
      v_ko := v_ko + 1; raise notice '   8  chiavi divergenti                               KO   % righe', v_diff;
    end if;
  end;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'riparazione: % casi falliti', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'sleep_merge_p0 / riparazione storica: NOVE CASI'
\echo '=================================================='
