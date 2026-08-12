-- ============================================================================
-- IL MERGE DEL SONNO — le proprieta' che deve avere, una per una
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
-- ATTENZIONE alla lettura di questo file: la scelta fra due osservazioni
-- SOVRAPPOSTE non e' cambiata rispetto alla 189-RC2 (vince intera quella con
-- piu' segmenti). I casi che la esercitano sono etichettati LIMITE: pinnano il
-- comportamento accettato per la 190, non una proprieta' desiderabile.
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

/** Il conteggio delle sessioni, ma catturando l'errore: ritorna -1 se solleva.
    Serve a distinguere "vale 0" da "fa fallire l'upsert", che e' l'unica cosa
    che conta per il difetto 6 dell'intestazione della migration. */
create or replace function pg_temp.conta_sicuro(v jsonb) returns int
language plpgsql as $$
begin
  return internal._sleep_session_count_jsonb(v);
exception when others then
  return -1;
end;
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
  -- due segmenti reali spariscono per sempre. La deduplica esatta chiude
  -- QUESTO caso: le quattro copie tornano una sola.
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

  -- ── P4b. LIMITE NOTO E ACCETTATO: gli overlap non identici ──────────────
  -- Quattro segmenti DIVERSI fra loro (differiscono nell'etichetta) tutti
  -- sullo stesso identico intervallo. Nessuno e' duplicato di un altro,
  -- quindi la deduplica esatta li tiene tutti e quattro; contandoli, quel
  -- candidato ne ha quattro contro i tre intervalli reali e consecutivi
  -- dell'altro, si sovrappongono, e vince lui.
  --
  -- Questo test NON pinna una proprieta' desiderabile: pinna cio' che la 190
  -- fa, perche' cambiarlo richiede una decisione di prodotto che non e' di
  -- questo hotfix. Un ranking per copertura temporale era stato scritto e poi
  -- ritirato: chiudeva questo caso ma ne apriva uno speculare (un segmento
  -- grossolano da otto ore che batte quattordici stadi reali). Se un giorno
  -- questo test diventa rosso perche' qualcuno ha risolto gli overlap, e'
  -- una buona notizia: si aggiorna qui e si scrive perche'.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0},
      {"startMs":3000,"endMs":4000,"stage":"rem","sessionIdx":0}]',
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"deep","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"rem","sessionIdx":0},
      {"startMs":1000,"endMs":2000,"stage":"awake","sessionIdx":0}]');
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 4
     and (v_r->-1->>'endMs')::bigint = 2000 then
    v_ok := v_ok + 1; raise notice '   P4b LIMITE: overlap non identici irrisolti      OK (atteso)';
  else
    v_ko := v_ko + 1; raise notice '   P4b LIMITE: comportamento cambiato              KO   % segmenti, fine %',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb)), coalesce((v_r->-1->>'endMs'),'?');
  end if;

  -- ── P4c. Il wrapper generico non batte le fasi dettagliate ──────────────
  -- Alcune fonti scrivono sia un unico segmento che avvolge tutta la notte
  -- sia le fasi REM/Leggero/Profondo. Il wrapper e' un contenitore, non una
  -- misura: quando esistono le fasi della stessa sessione non deve vincere.
  -- Il conteggio dei segmenti lo garantisce (1 contro 3) anche se il wrapper
  -- copre piu' tempo.
  v_r := pg_temp.stg(
    '[{"startMs":1000,"endMs":9000,"stage":"asleep","sessionIdx":0}]',
    '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
      {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":0},
      {"startMs":3000,"endMs":4000,"stage":"rem","sessionIdx":0}]');
  if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) = 3
     and not (v_r::text like '%asleep%') then
    v_ok := v_ok + 1; raise notice '   P4c il wrapper asleep non batte le fasi         OK';
  else
    v_ko := v_ko + 1; raise notice '   P4c il wrapper asleep vince sulle fasi          KO   % segmenti',
      jsonb_array_length(coalesce(v_r,'[]'::jsonb));
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

  -- ── P10. sessionIdx ASSENTE = 0, forma legacy ───────────────────────────
  -- Gli array scritti prima di 8ca36f56 (18/05) non hanno il campo. Valgono
  -- notte principale, e devono continuare a valere notte principale.
  v_r := internal._canonicalize_sleep_stages_jsonb(
    '[{"startMs":1000,"endMs":2000,"stage":"light"},
      {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":null}]');
  if jsonb_array_length(v_r) = 2
     and (v_r->0->>'sessionIdx')::int = 0
     and (v_r->1->>'sessionIdx')::int = 0 then
    v_ok := v_ok + 1; raise notice '   P10 sessionIdx assente = 0 (legacy)             OK';
  else
    v_ko := v_ko + 1;
    raise notice '   P10 sessionIdx assente                          KO   %', v_r;
  end if;

  -- ── P11. sessionIdx PRESENTE ma illeggibile scarta il segmento ──────────
  -- Prima diventava 0 in silenzio: un dato che non sappiamo leggere veniva
  -- promosso a notte principale, cioe' a quella su cui si calcolano i minuti
  -- mostrati in dashboard. Negativo, frazionario, non numerico, fuori range,
  -- di tipo sbagliato: nessuno di questi e' una sessione.
  declare
    v_fail text := '';
    v_casi jsonb[] := array[
      '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":-1}]'::jsonb,
      '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":1.7}]'::jsonb,
      '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":"abc"}]'::jsonb,
      '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":9999999999}]'::jsonb,
      '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":[1]}]'::jsonb,
      '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":{"a":1}}]'::jsonb
    ];
    v_c jsonb;
  begin
    foreach v_c in array v_casi loop
      if internal._canonicalize_sleep_stages_jsonb(v_c) <> '[]'::jsonb then
        v_fail := v_fail || ' [' || (v_c->0->>'sessionIdx') || ']';
      end if;
    end loop;
    -- E la stessa cosa attraverso il merge: il segmento illeggibile sparisce,
    -- ma quello buono che gli sta accanto no.
    v_r := pg_temp.stg(
      '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":0},
        {"startMs":2000,"endMs":3000,"stage":"deep","sessionIdx":-5}]', null);
    if jsonb_array_length(coalesce(v_r,'[]'::jsonb)) <> 1 then
      v_fail := v_fail || ' [merge tiene il segmento invalido]';
    end if;
    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   P11 sessionIdx illeggibile scarta il segmento   OK';
    else
      v_ko := v_ko + 1; raise notice '   P11 sessionIdx illeggibile                      KO  %', v_fail;
    end if;
  end;

  -- ── P12. Il conteggio delle sessioni non fa piu' esplodere l'upsert ─────
  -- Difetto 6 dell'intestazione: il cast era nudo e la RPC lo chiamava sul
  -- payload GREZZO, quindi un solo sessionIdx malformato abortiva l'intera
  -- transazione. Non era un difetto del sonno: quel giorno perdeva anche
  -- passi, frequenza e calorie. `conta_sicuro` ritorna -1 se solleva.
  declare
    v_fail text := '';
    v_casi jsonb[] := array[
      '[{"startMs":1,"endMs":2,"sessionIdx":"abc"}]'::jsonb,
      '[{"startMs":1,"endMs":2,"sessionIdx":1.7}]'::jsonb,
      '[{"startMs":1,"endMs":2,"sessionIdx":[1]}]'::jsonb,
      '[{"startMs":1,"endMs":2,"sessionIdx":99999999999999999999}]'::jsonb,
      '[{"startMs":1,"endMs":2,"sessionIdx":-1}]'::jsonb
    ];
    v_c jsonb;
  begin
    foreach v_c in array v_casi loop
      if pg_temp.conta_sicuro(v_c) < 0 then
        v_fail := v_fail || ' [' || coalesce(v_c->0->>'sessionIdx','?') || ']';
      end if;
    end loop;
    -- Il contratto resta quello: quante sessioni distinte ci sono davvero.
    if pg_temp.conta_sicuro(X) <> 1 then v_fail := v_fail || ' [X non vale 1]'; end if;
    if pg_temp.conta_sicuro('[{"startMs":1,"endMs":2},{"startMs":3,"endMs":4,"sessionIdx":1}]') <> 2 then
      v_fail := v_fail || ' [assente+1 non vale 2]';
    end if;
    if pg_temp.conta_sicuro(null) <> 0 then v_fail := v_fail || ' [null non vale 0]'; end if;
    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   P12 conteggio sessioni shape-safe               OK';
    else
      v_ko := v_ko + 1; raise notice '   P12 conteggio sessioni                          KO  %', v_fail;
    end if;
  end;

  -- ── P13. LIMITE NOTO: il merge RI-NUMERA le sessioni ────────────────────
  -- Il retagging finale assegna sessionIdx 0..n-1 in ordine CRONOLOGICO. Se
  -- il client non le aveva numerate cosi', le etichette escono scambiate: il
  -- contenuto e' intatto, ma l'uguaglianza JSON di merge(X,X) non vale.
  --
  -- Non e' teorico. Distribuzione misurata in produzione l'11/08/2026 sulle
  -- sequenze cronologiche degli indici: [1,0] su 3.086 righe, [1,0,2] su 560,
  -- [1,2,0] su 102, contro [0,1] su 1.891 e [0,1,2] su 67. Tremilasettecento-
  -- quarantanove righe multi-sessione su 5.709 hanno indici non cronologici.
  --
  -- Il retagging c'era gia' nella definizione viva e questo hotfix non lo
  -- tocca. Il test esiste perche' nessuno se ne accorgesse leggendo P1: la
  -- conseguenza vera e' che dopo un merge `sessionIdx = 0` vuol dire "la
  -- sessione che inizia prima", non "la notte principale", e il read-side
  -- calcola i minuti della notte proprio sulla sessione 0.
  declare
    v_fuori_ordine jsonb := '[{"startMs":1000,"endMs":2000,"stage":"light","sessionIdx":1},
                              {"startMs":9000,"endMs":10000,"stage":"light","sessionIdx":0},
                              {"startMs":10000,"endMs":11000,"stage":"deep","sessionIdx":0}]';
    v_fail text := '';
    v_uno jsonb;
    v_due jsonb;
  begin
    v_uno := pg_temp.stg(v_fuori_ordine, v_fuori_ordine);
    -- Il contenuto c'e' tutto: tre segmenti, nessuno inventato, nessuno perso.
    if jsonb_array_length(v_uno) <> 3 then
      v_fail := v_fail || ' [segmenti ' || jsonb_array_length(v_uno) || ']';
    end if;
    -- Ma le etichette sono cambiate: chi era 1 ora e' 0, perche' inizia prima.
    if (v_uno->0->>'startMs')::bigint <> 1000 or (v_uno->0->>'sessionIdx')::int <> 0 then
      v_fail := v_fail || ' [il primo non e'' stato ri-numerato a 0]';
    end if;
    if (v_uno->2->>'sessionIdx')::int <> 1 then
      v_fail := v_fail || ' [l''ultimo non e'' stato ri-numerato a 1]';
    end if;
    -- E dal secondo giro non si muove piu': converge, non oscilla.
    v_due := pg_temp.stg(v_uno, v_uno);
    if v_due <> v_uno then v_fail := v_fail || ' [non converge al secondo giro]'; end if;
    if v_fail = '' then
      v_ok := v_ok + 1; raise notice '   P13 LIMITE: le sessioni vengono ri-numerate    OK (atteso)';
    else
      v_ko := v_ko + 1; raise notice '   P13 LIMITE: ri-numerazione cambiata            KO  %', v_fail;
    end if;
  end;

  -- ── P14. A pari merito, main_* viene dal lato gia' memorizzato ──────────
  -- Due sessioni che non si sovrappongono, stesso numero di segmenti e stessa
  -- durata: il ranking pareggia su entrambe le chiavi, e a decidere resta
  -- `side, start_ms`.
  --
  -- ONESTA' SU COSA COPRE: togliendo lo spareggio dalla migration questo test
  -- resta VERDE (mutazione provata il 12/08/2026). L'ordine prodotto dal piano
  -- coincide gia' con quello del lato, quindi lo spareggio non cambia il
  -- comportamento osservabile: lo rende garantito invece che casuale. Qui si
  -- pinna l'ESITO — a parita' vince il memorizzato, e invertendo i lati il
  -- risultato si inverte — non il meccanismo con cui ci si arriva.
  declare
    v_a jsonb := '[{"startMs":1000,"endMs":3000,"stage":"light","sessionIdx":0}]';
    v_b jsonb := '[{"startMs":50000,"endMs":52000,"stage":"light","sessionIdx":0}]';
    v_r1 jsonb := internal._merge_sleep_stages_jsonb(v_a, v_b);
    v_r2 jsonb := internal._merge_sleep_stages_jsonb(v_b, v_a);
  begin
    if (v_r1->>'main_start_ms')::bigint = 1000
       and (v_r2->>'main_start_ms')::bigint = 50000 then
      v_ok := v_ok + 1; raise notice '   P14 a pari merito vince il lato memorizzato    OK';
    else
      v_ko := v_ko + 1; raise notice '   P14 spareggio non deterministico               KO   % / %',
        v_r1->>'main_start_ms', v_r2->>'main_start_ms';
    end if;
  end;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'merge del sonno: % proprieta'' violate', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'sleep_merge_p0 / helper: DICIOTTO PROPRIETA'''
\echo '=================================================='
