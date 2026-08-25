-- La finestra principale smette di allargarsi per un risveglio ai bordi.
--
-- ── COS'E' ROTTO ───────────────────────────────────────────────────────────
--
-- internal._merge_sleep_stages_jsonb calcola main_start_ms / main_end_ms come
-- min(startMs) / max(endMs) su TUTTI i segmenti della sessione principale,
-- awake compresi. Il client li calcola escludendo gli awake:
--
--     _buildSleep (health_repository.dart):
--         if (s.type == HealthDataType.SLEEP_AWAKE) continue;
--
-- Da 20260817073706 la finestra viene dal merge anche al primo INSERT, quindi
-- la finestra piu' larga del server sovrascrive quella corretta del client
-- gia' al primo salvataggio.
--
-- Conseguenza per chi guarda l'app: un risveglio prima di addormentarsi e uno
-- prima di alzarsi spostano l'inizio e la fine della notte, quindi il grafico
-- e il tempo a letto. I minuti dormiti restano giusti, perche' sleep_minutes
-- esclude gli awake. E' proprio questo che rende il difetto difficile da
-- vedere: i due numeri si contraddicono senza che nessuno dei due sembri
-- sbagliato.
--
-- ── MISURATO IN PRODUZIONE, 25/08/2026, SOLA LETTURA ───────────────────────
--
-- Finestra mobile di 7 giorni, 1.038 notti con ipnogramma e sessione
-- principale:
--
--     sorgente          notti   con il difetto        scarto medio
--                                                 (a letto - dormito)
--     health_connect      742   399   (53,8%)     53 min   (sane: 31)
--     healthkit           230    19   ( 8,3%)     85 min   (sane: 28)
--     colmi_ble            66     0   ( 0,0%)     --       (sane:  0)
--     TOTALE            1.038   418   (40,3%)     55 min   (sane: 27)
--
-- Allargamento: 210 notti sotto i 5 minuti, 156 fra 5 e 30, 49 fra 30 e 120,
-- 2 oltre le due ore. Peggiore: 140 minuti.
--
-- L'anello e' a zero perche' finestra e stadi nascono dallo stesso log, come
-- gia' osservato il 17/08.
--
-- Due controlli positivi sulla misura: la stessa regola SENZA esclusione da'
-- zero su ogni sorgente, come deve per costruzione; con `rem` al posto di
-- `awake` da' 114 invece di 418. La query risponde a QUALE stadio si esclude,
-- non e' una costante.
--
-- ── PERCHE' DUE CAMPI NUOVI E NON UNA MODIFICA A QUELLI ESISTENTI ──────────
--
-- start_ms / end_ms nella funzione servono a QUATTRO cose:
--
--   1. l'ordinamento che sceglie la sessione principale
--      (order by jsonb_array_length(stages) desc, (end_ms - start_ms) desc);
--   2. il rilevamento di sovrapposizione fra sessioni candidate;
--   3. il riordino cronologico delle sessioni tenute;
--   4. gli estremi in uscita, main_start_ms / main_end_ms.
--
-- Solo la quarta e' la finestra. Cambiare start_ms / end_ms cambierebbe anche
-- le altre tre: quale sessione vince, quali si considerano sovrapposte, in
-- che ordine escono. Sarebbe una riprogettazione mascherata da correzione.
--
-- Qui si aggiungono sleep_start_ms / sleep_end_ms, calcolati sugli stessi
-- segmenti ma escludendo gli awake, e si usano SOLTANTO al punto 4. I punti
-- 1, 2 e 3 restano identici byte per byte, per costruzione.
--
-- ── IL CASO LIMITE, MISURATO E NON DEDOTTO ─────────────────────────────────
--
-- Se una sessione fosse fatta di soli awake, i due nuovi campi sarebbero
-- null. Il coalesce ricade allora sugli estremi di tutti i segmenti, cioe' sul
-- comportamento di oggi: nessuna riga perde la finestra.
--
-- Misurato su 30 giorni: 3.716 sessioni, di cui 3.457 principali, e ZERO
-- interamente awake. Il caso non capita. Il coalesce resta lo stesso, perche'
-- «zero in trenta giorni» non e' «impossibile».
--
-- ── GLI AWAKE RESTANO NELL'IPNOGRAMMA ──────────────────────────────────────
--
-- Qui non si scarta niente. Gli awake continuano a stare nell'array degli
-- stadi, dentro e ai bordi: si chiede solo che non decidano DOVE comincia e
-- dove finisce la notte.
--
-- ── PERCHE' UNA SOSTITUZIONE SUL SORGENTE VIVO ─────────────────────────────
--
-- Stessa ragione di 20260817073706 e 20260825120007: si legge il sorgente
-- corrente, si sostituiscono tre ancore verificate uniche, si riesegue. Il
-- resto della funzione resta identico per costruzione, invece che per
-- attenzione durante una ricopiatura.
--
-- La migration si rifiuta di procedere se un'ancora non compare esattamente
-- una volta, ed e' idempotente: se la correzione c'e' gia', esce senza fare
-- nulla.
--
-- NESSUNA RIPARAZIONE STORICA. Le 418 notti gia' scritte non vengono toccate:
-- guariscono da sole al primo sync successivo, come e' successo per la
-- duplicazione del 16/08. Una migrazione di massa su fitness_metrics richiede
-- il GO esplicito di Matteo.

do $migrazione$
declare
  v_oid     oid;
  v_def     text;
  v_nuova   text;
  v_prima_overlap int;
  v_dopo_overlap  int;
  v_anc_a constant text := E'      min((s.value->>''startMs'')::bigint) as start_ms,\n      max((s.value->>''endMs'')::bigint) as end_ms';
  v_sos_a constant text := E'      min((s.value->>''startMs'')::bigint) as start_ms,\n      max((s.value->>''endMs'')::bigint) as end_ms,\n      min((s.value->>''startMs'')::bigint)\n        filter (where lower(btrim(coalesce(s.value->>''stage'',''''))) <> ''awake'')\n        as sleep_start_ms,\n      max((s.value->>''endMs'')::bigint)\n        filter (where lower(btrim(coalesce(s.value->>''stage'',''''))) <> ''awake'')\n        as sleep_end_ms';
  v_anc_b constant text := E'    jsonb_build_object(''stages'', stages, ''start_ms'', start_ms, ''end_ms'', end_ms)';
  v_sos_b constant text := E'    jsonb_build_object(''stages'', stages, ''start_ms'', start_ms, ''end_ms'', end_ms,\n                       ''sleep_start_ms'', sleep_start_ms, ''sleep_end_ms'', sleep_end_ms)';
  v_anc_c constant text := E'    ''main_start_ms'', (v_main->>''start_ms'')::bigint,\n    ''main_end_ms'', (v_main->>''end_ms'')::bigint';
  v_sos_c constant text := E'    ''main_start_ms'', coalesce((v_main->>''sleep_start_ms'')::bigint,\n                              (v_main->>''start_ms'')::bigint),\n    ''main_end_ms'',   coalesce((v_main->>''sleep_end_ms'')::bigint,\n                              (v_main->>''end_ms'')::bigint)';
begin
  select p.oid into v_oid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'internal' and p.proname = '_merge_sleep_stages_jsonb'
    and p.prokind = 'f';

  if v_oid is null then
    raise exception 'internal._merge_sleep_stages_jsonb non esiste: catena fuori ordine, fermarsi';
  end if;

  v_def := pg_get_functiondef(v_oid);

  -- idempotenza
  if position('sleep_start_ms' in v_def) > 0 then
    raise notice 'finestra gia'' corretta: la funzione conosce gia'' sleep_start_ms. Niente da fare.';
    return;
  end if;

  -- Ogni ancora esattamente una volta. Zero significa che la funzione e'
  -- cambiata sotto i piedi; piu' di una, che la sostituzione colpirebbe
  -- anche un punto che non e' stato esaminato.
  if (length(v_def) - length(replace(v_def, v_anc_a, ''))) / nullif(length(v_anc_a),0) <> 1 then
    raise exception 'ancora A trovata % volte invece di 1: la funzione e cambiata, fermarsi',
      (length(v_def) - length(replace(v_def, v_anc_a, ''))) / nullif(length(v_anc_a),0);
  end if;
  if (length(v_def) - length(replace(v_def, v_anc_b, ''))) / nullif(length(v_anc_b),0) <> 1 then
    raise exception 'ancora B trovata % volte invece di 1: la funzione e cambiata, fermarsi',
      (length(v_def) - length(replace(v_def, v_anc_b, ''))) / nullif(length(v_anc_b),0);
  end if;
  if (length(v_def) - length(replace(v_def, v_anc_c, ''))) / nullif(length(v_anc_c),0) <> 1 then
    raise exception 'ancora C trovata % volte invece di 1: la funzione e cambiata, fermarsi',
      (length(v_def) - length(replace(v_def, v_anc_c, ''))) / nullif(length(v_anc_c),0);
  end if;

  -- Il rilevamento di sovrapposizione NON deve cambiare. Si contano le sue
  -- occorrenze prima e dopo: se il numero cambia, la sostituzione ha toccato
  -- qualcosa che non doveva.
  v_prima_overlap := (length(v_def) - length(replace(v_def, 'v_cand->>''start_ms''', ''))) / length('v_cand->>''start_ms''');

  v_nuova := replace(replace(replace(v_def, v_anc_a, v_sos_a), v_anc_b, v_sos_b), v_anc_c, v_sos_c);

  v_dopo_overlap := (length(v_nuova) - length(replace(v_nuova, 'v_cand->>''start_ms''', ''))) / length('v_cand->>''start_ms''');
  if v_prima_overlap <> v_dopo_overlap then
    raise exception 'il rilevamento di sovrapposizione e cambiato (% -> %): fermarsi',
      v_prima_overlap, v_dopo_overlap;
  end if;

  execute v_nuova;
  raise notice 'finestra corretta: gli awake ai bordi non spostano piu'' main_start_ms/main_end_ms';
end
$migrazione$;

-- ── POSTCONDIZIONE: si CHIAMA la funzione, non si legge il suo testo ────────
-- Una migration che verifica solo di aver scritto le parole giuste ha provato
-- di saper scrivere, non di aver corretto qualcosa.
do $verifica$
declare
  v_notte  constant jsonb := '[
    {"sessionIdx":0,"startMs":-180000,  "endMs":0,        "stage":"awake"},
    {"sessionIdx":0,"startMs":0,        "endMs":14400000, "stage":"light"},
    {"sessionIdx":0,"startMs":14400000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":0,"startMs":28800000, "endMs":28980000, "stage":"awake"}
  ]'::jsonb;
  v_senza_awake constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":14400000, "stage":"light"},
    {"sessionIdx":0,"startMs":14400000, "endMs":28800000, "stage":"deep"}
  ]'::jsonb;
  v_interni constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":10800000, "stage":"light"},
    {"sessionIdx":0,"startMs":10800000, "endMs":11100000, "stage":"awake"},
    {"sessionIdx":0,"startMs":11100000, "endMs":28800000, "stage":"deep"}
  ]'::jsonb;
  v_solo_awake constant jsonb := '[
    {"sessionIdx":0,"startMs":100,      "endMs":200,      "stage":"awake"}
  ]'::jsonb;
  r jsonb;
begin
  -- 1. i bordi awake non spostano piu' la finestra
  r := internal._merge_sleep_stages_jsonb(v_notte, v_notte);
  if (r->>'main_start_ms')::bigint <> 0 then
    raise exception 'postcondizione 1: main_start_ms % invece di 0 (un awake iniziale sposta ancora la notte)', r->>'main_start_ms';
  end if;
  if (r->>'main_end_ms')::bigint <> 28800000 then
    raise exception 'postcondizione 1: main_end_ms % invece di 28800000 (un awake finale allunga ancora la notte)', r->>'main_end_ms';
  end if;

  -- 2. gli awake restano nell'ipnogramma: non si scarta niente
  if jsonb_array_length(r->'stages') <> 4 then
    raise exception 'postcondizione 2: % stadi invece di 4. Gli awake vanno tenuti, non scartati', jsonb_array_length(r->'stages');
  end if;

  -- 3. una notte senza awake da' esattamente gli stessi estremi di prima
  r := internal._merge_sleep_stages_jsonb(v_senza_awake, v_senza_awake);
  if (r->>'main_start_ms')::bigint <> 0 or (r->>'main_end_ms')::bigint <> 28800000 then
    raise exception 'postcondizione 3: una notte senza awake e cambiata (% - %)', r->>'main_start_ms', r->>'main_end_ms';
  end if;

  -- 4. un awake INTERNO non restringe la finestra
  r := internal._merge_sleep_stages_jsonb(v_interni, v_interni);
  if (r->>'main_start_ms')::bigint <> 0 or (r->>'main_end_ms')::bigint <> 28800000 then
    raise exception 'postcondizione 4: un awake interno ha ristretto la finestra (% - %)', r->>'main_start_ms', r->>'main_end_ms';
  end if;

  -- 5. sessione di soli awake: il coalesce ricade sugli estremi di tutti
  r := internal._merge_sleep_stages_jsonb(v_solo_awake, v_solo_awake);
  if (r->>'main_start_ms')::bigint <> 100 or (r->>'main_end_ms')::bigint <> 200 then
    raise exception 'postcondizione 5: sessione di soli awake, attesi 100-200, ottenuti % - %', r->>'main_start_ms', r->>'main_end_ms';
  end if;

  -- 6. idempotenza del merge: merge(X,X) = X
  if internal._merge_sleep_stages_jsonb(v_notte, v_notte)
     is distinct from internal._merge_sleep_stages_jsonb(
       internal._merge_sleep_stages_jsonb(v_notte, v_notte)->'stages', v_notte) then
    raise exception 'postcondizione 6: il merge non e piu idempotente';
  end if;

  raise notice 'finestra sonno: sei postcondizioni verdi, verificate CHIAMANDO la funzione';
end
$verifica$;
