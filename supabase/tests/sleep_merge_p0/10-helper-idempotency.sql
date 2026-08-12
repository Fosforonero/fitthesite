-- ============================================================================
-- IL MERGE DEL SONNO — le otto proprieta' che deve avere, una per una
--
-- Difetto dimostrato sulla definizione live (MD5 0df8a073ebe40610439f858ec3c49c59):
--
--     from unnest(array[old_stages, new_stages]) as arr
--     ...
--     group by arr, coalesce((stage->>'sessionIdx')::int, 0)
--
-- `arr` e' il VALORE dell'array, non il lato da cui viene. Quando vecchio e
-- nuovo sono identici, unnest produce due righe con lo stesso valore: il
-- GROUP BY le fonde in un gruppo solo, ma il lateral ha gia' prodotto due
-- copie di ogni segmento e jsonb_agg le raccoglie entrambe. Il candidato
-- gonfiato diventa il "piu' ricco" e da li' in avanti vince sempre.
--
-- Misurato: 2 segmenti -> 4 dopo merge(X,X) -> 4 stabile. Raddoppio esatto,
-- deterministico, una volta sola.
--
-- Tutto dentro una transazione chiusa da ROLLBACK.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.stg(a jsonb, b jsonb) returns jsonb
language sql as $$ select internal._merge_sleep_stages_jsonb(a, b)->'stages' $$;

create or replace function pg_temp.n(a jsonb, b jsonb) returns int
language sql as $$ select jsonb_array_length(coalesce(internal._merge_sleep_stages_jsonb(a, b)->'stages', '[]'::jsonb)) $$;

/** Quanti sessionIdx distinti ha il risultato. */
create or replace function pg_temp.sess(a jsonb, b jsonb) returns int
language sql as $$
  select count(distinct (s.value->>'sessionIdx')::int)::int
  from jsonb_array_elements(coalesce(internal._merge_sleep_stages_jsonb(a, b)->'stages', '[]'::jsonb)) s(value)
$$;

do $$
declare
  v_ok int := 0;
  v_ko int := 0;
  -- Una notte canonica: due segmenti contigui, gia' ordinati, sessionIdx 0.
  X  jsonb := '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
                {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0}]';
  -- La stessa notte con ogni segmento ripetuto: e' cio' che un client 190
  -- puo' ancora spedire, perche' toJson() serializza sleepStagesJson grezzo.
  XD jsonb := '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
                {"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
                {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0},
                {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0}]';
  v_r jsonb;
  v_i int;
begin
  -- ── P1. merge(X,X) = X ──────────────────────────────────────────────────
  -- La proprieta' che manca oggi, e da cui discende tutto il resto.
  v_r := pg_temp.stg(X, X);
  if v_r = X then
    v_ok := v_ok + 1; raise notice '   P1  merge(X,X) = X                              OK';
  else
    v_ko := v_ko + 1; raise notice '   P1  merge(X,X) = X                              KO   % segmenti invece di %',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb)), jsonb_array_length(X);
  end if;

  -- ── P2. Dieci applicazioni non spostano niente ──────────────────────────
  -- Non basta che la seconda sia stabile: un upsert ripetuto e' la norma,
  -- non l'eccezione, e la stabilita' deve valere a ogni giro.
  v_r := X;
  for v_i in 1..10 loop
    v_r := pg_temp.stg(v_r, X);
  end loop;
  if v_r = X then
    v_ok := v_ok + 1; raise notice '   P2  dieci merge ripetuti: JSON invariato        OK';
  else
    v_ko := v_ko + 1; raise notice '   P2  dieci merge ripetuti                        KO   % segmenti',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb));
  end if;

  -- ── P3. Canonicalizzazione PRIMA del confronto di ricchezza ─────────────
  -- Il lato duplicato non deve sembrare piu' ricco solo perche' ha piu'
  -- elementi. Qui vecchio e nuovo sono la stessa notte, uno pulito e uno
  -- duplicato: il risultato deve essere la notte, due segmenti.
  v_r := pg_temp.stg(X, XD);
  if v_r = X then
    v_ok := v_ok + 1; raise notice '   P3  il lato duplicato non vince la ricchezza    OK';
  else
    v_ko := v_ko + 1; raise notice '   P3  il lato duplicato non vince la ricchezza    KO   % segmenti',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb));
  end if;

  -- ── P4. Il caso in cui la ricchezza finta CANCELLA dati veri ────────────
  -- Vecchio: tre segmenti reali su 1000-4000. Nuovo: un solo segmento vero,
  -- ripetuto quattro volte, su 1000-2000. Si sovrappongono, quindi ne
  -- sopravvive uno solo: senza canonicalizzazione vince il finto (4 > 3) e
  -- due segmenti reali spariscono per sempre.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0},
      {"startMs":3000,"endMs":4000,"stage":"rem","sessionIdx":0}]',
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0}]');
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 3 then
    v_ok := v_ok + 1; raise notice '   P4  la ricchezza finta non cancella dati veri   OK';
  else
    v_ko := v_ko + 1; raise notice '   P4  la ricchezza finta cancella dati veri       KO   % segmenti invece di 3',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb));
  end if;

  -- ── P4b. La ricchezza finta SENZA duplicati esatti ──────────────────────
  -- Il caso che la sola deduplica non chiude, ed e' il piu' insidioso: quattro
  -- segmenti DIVERSI fra loro (differiscono nell'etichetta) tutti sullo stesso
  -- identico intervallo. Nessuno e' duplicato di un altro, quindi il
  -- canonicalizzatore li tiene tutti e quattro. Contandoli, quel candidato ne
  -- ha quattro contro i tre intervalli reali e consecutivi dell'altro: si
  -- sovrappongono, vince lui, e tre segmenti veri spariscono.
  -- Contare gli elementi misura la verbosita', non l'informazione.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0},
      {"startMs":3000,"endMs":4000,"stage":"rem","sessionIdx":0}]',
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"deep","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"rem","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"awake","sessionIdx":0}]');
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 3
     and (v_r->2->>'endMs')::bigint = 4000 then
    v_ok := v_ok + 1; raise notice '   P4b quattro etichette sovrapposte non vincono    OK';
  else
    v_ko := v_ko + 1; raise notice '   P4b quattro etichette sovrapposte VINCONO       KO   % segmenti, fine %',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb)), coalesce((v_r->-1->>'endMs'),'?');
  end if;

  -- ── P4c. Ma se il contraddittorio e'' l'unico, non lo si butta ───────────
  -- Fail-closed vuol dire "non sostituire un candidato pulito con quello
  -- ambiguo", non "cancellare l'ambiguo". Se copre una finestra che nessun
  -- altro copre, buttarlo sarebbe perdere l'unica cosa che abbiamo.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"deep","sessionIdx":0}]', null);
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 2 then
    v_ok := v_ok + 1; raise notice '   P4c il contraddittorio solo non viene cancellato OK';
  else
    v_ko := v_ko + 1; raise notice '   P4c il contraddittorio solo                     KO   %',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb));
  end if;

  -- ── P4d. La copertura batte il conteggio anche senza contraddizioni ─────
  -- Due candidati puliti sovrapposti: uno con due segmenti che coprono
  -- 1000-9000, uno con tre segmentini che coprono 1000-4000. Prima vinceva il
  -- secondo perche' ha piu' elementi, e si perdevano cinque secondi di notte.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":5000,"stage":"light","sessionIdx":0},
      {"startMs":5000,"endMs":9000,"stage":"deep","sessionIdx":0}]',
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0},
      {"startMs":3000,"endMs":4000,"stage":"rem","sessionIdx":0}]');
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 2
     and (v_r->1->>'endMs')::bigint = 9000 then
    v_ok := v_ok + 1; raise notice '   P4d la copertura batte il conteggio             OK';
  else
    v_ko := v_ko + 1; raise notice '   P4d la copertura batte il conteggio             KO   % segmenti, fine %',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb)), coalesce((v_r->-1->>'endMs'),'?');
  end if;

  -- ── P5. Dedup per (sessionIdx, startMs, endMs, stage normalizzato) ──────
  -- Dentro UN SOLO array: "Light" e "light" sono lo stesso segmento. Qui non
  -- c'e' nessuna sovrapposizione fra lati a salvare la situazione.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":2000,"stage":"Light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":" light ","sessionIdx":0},
      {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0}]', null);
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 2 then
    v_ok := v_ok + 1; raise notice '   P5  dedup dentro un array, stage normalizzato   OK';
  else
    v_ko := v_ko + 1; raise notice '   P5  dedup dentro un array                       KO   % segmenti invece di 2',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb));
  end if;

  -- ── P5b. Stage DIVERSI sulla stessa finestra restano due ────────────────
  -- Il dedup e' per tupla, non per intervallo: due etichette diverse sullo
  -- stesso minuto sono un dato contraddittorio, e non sta a noi risolverlo
  -- buttandone via una.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"deep","sessionIdx":0}]', null);
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 2 then
    v_ok := v_ok + 1; raise notice '   P5b stage diversi sulla stessa finestra: due    OK';
  else
    v_ko := v_ko + 1; raise notice '   P5b stage diversi sulla stessa finestra         KO   %',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb));
  end if;

  -- ── P5c. A parita' di chiave sopravvive la PRIMA occorrenza ─────────────
  -- Stessa regola del canonicalizzatore del client e della deduplica della
  -- riparazione. Prima qui vinceva il minimo testuale e sul client il primo:
  -- lo stesso identico input poteva produrre due risultati diversi a seconda
  -- di chi lo toccava. Il campo `marcatore` esiste solo per rendere visibile
  -- quale delle due copie e' sopravvissuta.
  v_r := internal._canonicalize_sleep_stages_jsonb(
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0,"marcatore":"primo"},
      {"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0,"marcatore":"secondo"}]');
  if jsonb_array_length(v_r) = 1 and (v_r->0->>'marcatore') = 'primo' then
    v_ok := v_ok + 1; raise notice '   P5c a parita'' di chiave vince la prima copia    OK';
  else
    v_ko := v_ko + 1; raise notice '   P5c scelta del duplicato                        KO   % (%)',
      jsonb_array_length(v_r), coalesce(v_r->0->>'marcatore','?');
  end if;

  -- ── P6. Notte principale e pisolino sopravvivono entrambi ───────────────
  -- Arrivano da due sync diversi, entrambi taggati sessionIdx 0 dalla loro
  -- sorgente. Non si sovrappongono: devono restare due sessioni.
  if pg_temp.n(X, '[{"startMs":50000,"endMs":60000,"stage":"light","sessionIdx":0}]') = 3
     and pg_temp.sess(X, '[{"startMs":50000,"endMs":60000,"stage":"light","sessionIdx":0}]') = 2 then
    v_ok := v_ok + 1; raise notice '   P6  notte + pisolino: due sessioni distinte     OK';
  else
    v_ko := v_ko + 1; raise notice '   P6  notte + pisolino                            KO   % segmenti, % sessioni',
      pg_temp.n(X, '[{"startMs":50000,"endMs":60000,"stage":"light","sessionIdx":0}]'),
      pg_temp.sess(X, '[{"startMs":50000,"endMs":60000,"stage":"light","sessionIdx":0}]');
  end if;

  -- ── P7. Due sessioni legittime nello STESSO array non vengono appiattite ─
  declare
    v_due jsonb := '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
                     {"startMs":9000,"endMs":9500,"stage":"light","sessionIdx":1}]';
  begin
    if pg_temp.stg(v_due, v_due) = v_due and pg_temp.sess(v_due, v_due) = 2 then
      v_ok := v_ok + 1; raise notice '   P7  due sessioni nello stesso array: invariate  OK';
    else
      v_ko := v_ko + 1; raise notice '   P7  due sessioni nello stesso array             KO   % segmenti, % sessioni',
        pg_temp.n(v_due, v_due), pg_temp.sess(v_due, v_due);
    end if;
  end;

  -- ── P8. Input nulli, malformati, parziali: nessuno cancella niente ──────
  declare
    v_fail text := '';
  begin
    if internal._merge_sleep_stages_jsonb(null, null) is not null then
      v_fail := v_fail || ' [null,null non e'' null]';
    end if;
    if pg_temp.stg(null, X) <> X then v_fail := v_fail || ' [null+X]'; end if;
    if pg_temp.stg(X, null) <> X then v_fail := v_fail || ' [X+null]'; end if;
    if pg_temp.stg(X, '[]'::jsonb) <> X then v_fail := v_fail || ' [X+vuoto]'; end if;
    if pg_temp.stg(X, '{"non":"un array"}'::jsonb) <> X then v_fail := v_fail || ' [X+oggetto]'; end if;
    if pg_temp.stg(X, '"stringa"'::jsonb) <> X then v_fail := v_fail || ' [X+stringa]'; end if;
    -- Segmenti scartabili: senza startMs, con endMs <= startMs, non oggetti.
    if pg_temp.stg(X, '[{"endMs":5000},{"startMs":5000,"endMs":5000},{"startMs":7000,"endMs":6000},42,null]'::jsonb) <> X then
      v_fail := v_fail || ' [X+malformati]';
    end if;
    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   P8  null / malformati / parziali: fail-safe     OK';
    else
      v_ko := v_ko + 1; raise notice '   P8  fail-safe                                   KO  %', v_fail;
    end if;
  end;

  -- ── P9. I limiti della sessione principale restano quelli della piu' ricca ─
  -- Semantica esistente, non la cambiamo: main_* viene dalla sessione con
  -- piu' stadi, che puo' non essere la prima in ordine cronologico.
  v_r := internal._merge_sleep_stages_jsonb(
    '[{"startMs":50000,"endMs":51000,"stage":"light","sessionIdx":0}]',
    X);
  if (v_r->>'main_start_ms')::bigint = 1000 and (v_r->>'main_end_ms')::bigint = 3000 then
    v_ok := v_ok + 1; raise notice '   P9  main_* dalla sessione piu'' ricca            OK';
  else
    v_ko := v_ko + 1; raise notice '   P9  main_*                                      KO   %..%',
      v_r->>'main_start_ms', v_r->>'main_end_ms';
  end if;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'merge del sonno: % proprieta'' violate', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'sleep_merge_p0 / helper: QUATTORDICI PROPRIETA'''
\echo '=================================================='
