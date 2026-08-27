-- ============================================================================
-- S2-SERVER — L'INDICE DELLA SESSIONE SEGUE LA PRINCIPALE, NON L'OROLOGIO
-- ============================================================================
-- `internal._merge_sleep_stages_jsonb` fa tre cose, in quest'ordine:
--
--     v_main := v_selected[1];                       -- la sessione piu' RICCA
--     select array_agg(v order by (v->>'start_ms'))  -- riordino CRONOLOGICO
--     ... jsonb_build_object('sessionIdx', v_idx)    -- indice per POSIZIONE
--
-- La finestra in uscita (`main_start_ms` / `main_end_ms`) viene da `v_main`,
-- cioe' dalla sessione piu' ricca. L'indice `0` viene invece da chi comincia
-- prima. Quando sono la stessa sessione non si vede niente. Quando non lo sono
-- — un pisolino serale che PRECEDE la notte — **la riga dice due cose diverse
-- su se stessa**.
--
-- ── MISURATO SULLA PRODUZIONE, 27/08/2026, IN SOLA LETTURA ─────────────────
--
-- La funzione e' IMMUTABLE e pura: si sonda con letterali sintetici senza
-- scrivere una riga. Ingresso: pisolino [0, 1.200.000] (20 minuti, un
-- segmento) e notte [7.200.000, 36.000.000] (8 ore, tre segmenti).
--
--     main_start_ms .................. 7.200.000   <- la notte
--     main_end_ms ................... 36.000.000   <- la notte
--     inizio di chi ha sessionIdx=0 ..         0   <- il pisolino
--     fine di chi ha sessionIdx=0 .... 1.200.000   <- il pisolino
--     segmenti con sessionIdx=0 ......         1   <- il pisolino
--
-- Nessun valore reale, nessun utente reale, nessuna scrittura.
--
-- ── PERCHE' CONTA ──────────────────────────────────────────────────────────
--
-- Il client, per contratto, si fida dell'etichetta: `sessionIdx 0` E' la
-- sessione principale in ogni strato (adapter, server, collapse, fusione,
-- dashboard). Una riga che etichetta il pisolino e dichiara la finestra della
-- notte fa uscire dal collapse venti minuti presentati come otto ore.
--
-- Il client della 190 si difende gia': quando la riga si contraddice segue la
-- FINESTRA, che e' da dove `sleep_minutes` gia' arriva. Ma la difesa del
-- client non e' una ragione per lasciare il server incoerente: finche' questa
-- migration non e' applicata, le righe continuano a essere SCRITTE
-- contraddittorie, e ogni consumatore nuovo eredita il difetto.
--
-- ── COSA CAMBIA, E COSA NO ─────────────────────────────────────────────────
--
-- Cambia SOLO l'ordine in cui le sessioni tenute vengono numerate: la
-- principale va in testa, le altre restano in ordine cronologico dopo di lei.
--
-- NON cambia: quale sessione e' la principale (resta `v_selected[1]`, cioe' la
-- piu' ricca, con lo stesso ordinamento di prima); il rilevamento di
-- sovrapposizione; quali sessioni sopravvivono; la finestra in uscita; la
-- deduplica finale. In particolare, quando la principale E' gia' la
-- cronologicamente prima — il caso normale, una notte sola — l'uscita e'
-- identica byte per byte a prima.
--
-- ── NESSUNA RIPARAZIONE STORICA ────────────────────────────────────────────
--
-- Questa migration non tocca nessuna riga. Le righe gia' scritte restano come
-- sono e guariscono al sync successivo, quando il merge le riscrive con
-- l'indice giusto. Un UPDATE di massa su `sleep_stages` riscriverebbe dati
-- sanitari di tutti gli utenti per un difetto di etichetta che il client sa
-- gia' aggirare: il rapporto fra rischio e beneficio non lo giustifica.
--
-- ── ORDINE TOTALE, NON "PRIMA LA PRINCIPALE E POI SI VEDE" ─────────────────
--
-- Le sessioni tenute sono per costruzione non sovrapposte (il ciclo che
-- costruisce `v_selected` scarta chi si accavalla), quindi hanno `start_ms`
-- distinti: la chiave (principale, start_ms) e' un ordine TOTALE e non lascia
-- pareggi. Il confronto con la principale usa la coppia (start_ms, end_ms) e
-- non l'uguaglianza jsonb, cosi' non dipende dall'ordine delle chiavi
-- nell'oggetto.
--
-- ── COME E' SCRITTA ────────────────────────────────────────────────────────
--
-- Idioma gia' della catena (20260817073706, 20260825120007, 20260825120009,
-- 20260825130500): si legge il corpo VIVO con `pg_get_functiondef` e si
-- sostituisce SOLO l'ancora, dopo aver preteso che compaia esattamente una
-- volta. Riscrivere la funzione intera reintrodurrebbe qualunque deriva fra il
-- file e la produzione.
--
-- Conteggio LETTERALE, non con espressioni regolari: l'ancora contiene
-- parentesi e apici, che in un pattern sarebbero metacaratteri.
--
-- `CREATE OR REPLACE` conserva per costruzione firma, owner, privilegi,
-- SECURITY (INVOKER), volatilita' (IMMUTABLE) e `search_path`: owner e ACL non
-- vengono toccati, tutto il resto e' gia' dentro la definizione riletta.
--
-- NON APPLICARE IN PRODUZIONE SENZA GO. Apply, canary e monitor post-deploy
-- restano operazioni umane.
-- ============================================================================
do $migrazione$
declare
  v_def text;
  v_nuova text;

  -- L'ancora: il riordino puramente cronologico.
  v_ancora constant text :=
    '  select array_agg(v order by (v->>''start_ms'')::bigint) into v_selected' || chr(10) ||
    '  from unnest(v_selected) as v;';

  v_sostituzione constant text :=
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

  -- Invarianti da NON toccare: il numero di occorrenze deve restare identico.
  v_inv_main constant text := 'v_main := v_selected[1];';
  v_inv_overlap constant text := 'v_cand->>''start_ms''';
  v_prima int;
  v_dopo int;
begin
  select pg_catalog.pg_get_functiondef(p.oid) into v_def
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'internal' and p.proname = '_merge_sleep_stages_jsonb';

  if v_def is null then
    raise exception 'S2-SERVER: internal._merge_sleep_stages_jsonb non esiste';
  end if;

  -- Idempotenza: se l'indice segue gia' la principale, non si tocca niente.
  if pg_catalog.strpos(v_def, 'L''INDICE SEGUE LA PRINCIPALE') > 0 then
    raise notice 'S2-SERVER: l''indice segue gia'' la principale, nessuna modifica.';
    return;
  end if;

  v_prima := (pg_catalog.length(v_def)
              - pg_catalog.length(pg_catalog.replace(v_def, v_ancora, '')))
             / pg_catalog.length(v_ancora);
  if v_prima <> 1 then
    raise exception
      'S2-SERVER: ancora trovata % volte invece di 1. Il corpo non e'' quello per cui questa migration e'' stata scritta: fermarsi.',
      v_prima;
  end if;

  -- La scelta della principale non deve cambiare.
  v_prima := (pg_catalog.length(v_def)
              - pg_catalog.length(pg_catalog.replace(v_def, v_inv_main, '')))
             / pg_catalog.length(v_inv_main);
  if v_prima <> 1 then
    raise exception
      'S2-SERVER: "v_main := v_selected[1];" trovato % volte invece di 1: fermarsi.',
      v_prima;
  end if;

  v_nuova := pg_catalog.replace(v_def, v_ancora, v_sostituzione);

  -- Il rilevamento di sovrapposizione non deve essere stato sfiorato.
  v_prima := (pg_catalog.length(v_def)
              - pg_catalog.length(pg_catalog.replace(v_def, v_inv_overlap, '')))
             / pg_catalog.length(v_inv_overlap);
  v_dopo := (pg_catalog.length(v_nuova)
             - pg_catalog.length(pg_catalog.replace(v_nuova, v_inv_overlap, '')))
            / pg_catalog.length(v_inv_overlap);
  if v_prima <> v_dopo then
    raise exception
      'S2-SERVER: il rilevamento di sovrapposizione e'' cambiato (% -> %): fermarsi.',
      v_prima, v_dopo;
  end if;

  execute v_nuova;
  raise notice 'S2-SERVER: sessionIdx 0 e'' la sessione principale, non la piu'' mattutina.';
end
$migrazione$;

-- ── POSTCONDIZIONI: si CHIAMA la funzione, non si legge il suo testo ────────
-- Una migration che verifica solo di aver scritto le parole giuste ha provato
-- di saper scrivere, non di aver corretto qualcosa. La funzione e' IMMUTABLE e
-- pura: queste chiamate non scrivono nulla.
do $verifica$
declare
  -- Pisolino di 20 minuti che PRECEDE una notte di 8 ore.
  v_pisolino_poi_notte constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":1200000,  "stage":"light"},
    {"sessionIdx":1,"startMs":7200000,  "endMs":18000000, "stage":"light"},
    {"sessionIdx":1,"startMs":18000000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":1,"startMs":28800000, "endMs":36000000, "stage":"rem"}
  ]'::jsonb;
  -- Caso normale: una notte sola. Deve restare identico a prima.
  v_solo_notte constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":14400000, "stage":"light"},
    {"sessionIdx":0,"startMs":14400000, "endMs":28800000, "stage":"deep"}
  ]'::jsonb;
  -- Notte + due pisolini, entrambi dopo: l'ordine dei non-principali deve
  -- essere cronologico e stabile.
  v_notte_due_pisolini constant jsonb := '[
    {"sessionIdx":0,"startMs":0,        "endMs":10800000, "stage":"light"},
    {"sessionIdx":0,"startMs":10800000, "endMs":28800000, "stage":"deep"},
    {"sessionIdx":1,"startMs":50400000, "endMs":52200000, "stage":"light"},
    {"sessionIdx":2,"startMs":61200000, "endMs":63000000, "stage":"light"}
  ]'::jsonb;
  r jsonb;
  r2 jsonb;
  v_i0 bigint;
  v_f0 bigint;
  v_n0 int;
  v_idx_pis int;
begin
  -- 1. PISOLINO PRIMA DELLA NOTTE: finestra della notte, minuti della notte,
  --    e la STESSA sessione etichettata 0.
  r := internal._merge_sleep_stages_jsonb(v_pisolino_poi_notte, v_pisolino_poi_notte);

  if (r->>'main_start_ms')::bigint <> 7200000
     or (r->>'main_end_ms')::bigint <> 36000000 then
    raise exception 'postcondizione 1: la finestra non e'' piu'' quella della notte (% - %)',
      r->>'main_start_ms', r->>'main_end_ms';
  end if;

  select min((e->>'startMs')::bigint), max((e->>'endMs')::bigint), count(*)
    into v_i0, v_f0, v_n0
  from jsonb_array_elements(r->'stages') e
  where (e->>'sessionIdx')::int = 0;

  if v_i0 <> 7200000 or v_f0 <> 36000000 then
    raise exception 'postcondizione 1: sessionIdx 0 sta su % - % invece che sulla notte 7200000 - 36000000',
      v_i0, v_f0;
  end if;
  if v_n0 <> 3 then
    raise exception 'postcondizione 1: sessionIdx 0 ha % segmenti invece dei 3 della notte', v_n0;
  end if;
  -- La riga non deve piu' contraddirsi: la finestra dichiarata e' quella di
  -- chi porta l'etichetta 0.
  if (r->>'main_start_ms')::bigint <> v_i0 or (r->>'main_end_ms')::bigint <> v_f0 then
    raise exception 'postcondizione 1: la riga si contraddice ancora (finestra % - %, indice 0 su % - %)',
      r->>'main_start_ms', r->>'main_end_ms', v_i0, v_f0;
  end if;

  -- 2. IL PISOLINO NON SPARISCE: e' ancora li', con un indice diverso da 0.
  select distinct (e->>'sessionIdx')::int into v_idx_pis
  from jsonb_array_elements(r->'stages') e
  where (e->>'startMs')::bigint = 0 and (e->>'endMs')::bigint = 1200000;
  if v_idx_pis is null then
    raise exception 'postcondizione 2: il pisolino e'' sparito. Si rinumera, non si scarta.';
  end if;
  if v_idx_pis = 0 then
    raise exception 'postcondizione 2: il pisolino ha ancora l''indice 0';
  end if;
  if jsonb_array_length(r->'stages') <> 4 then
    raise exception 'postcondizione 2: % segmenti invece di 4', jsonb_array_length(r->'stages');
  end if;

  -- 3. PRIMO SYNC (nessuno stato conservato): stesso risultato.
  r2 := internal._merge_sleep_stages_jsonb(null, v_pisolino_poi_notte);
  if r2->'stages' <> r->'stages'
     or (r2->>'main_start_ms') <> (r->>'main_start_ms')
     or (r2->>'main_end_ms') <> (r->>'main_end_ms') then
    raise exception 'postcondizione 3: il primo INSERT non da'' lo stesso risultato del sync successivo';
  end if;

  -- 4. SECONDO SYNC IDEMPOTENTE: rimettere dentro l'uscita non cambia niente.
  r2 := internal._merge_sleep_stages_jsonb(r->'stages', v_pisolino_poi_notte);
  if r2->'stages' <> r->'stages'
     or (r2->>'main_start_ms') <> (r->>'main_start_ms')
     or (r2->>'main_end_ms') <> (r->>'main_end_ms') then
    raise exception 'postcondizione 4: il secondo sync cambia la riga. Non e'' idempotente.';
  end if;

  -- 5. IL CASO NORMALE NON CAMBIA: una notte sola resta com'era.
  r := internal._merge_sleep_stages_jsonb(v_solo_notte, v_solo_notte);
  if (r->>'main_start_ms')::bigint <> 0 or (r->>'main_end_ms')::bigint <> 28800000 then
    raise exception 'postcondizione 5: una notte sola e'' cambiata (% - %)',
      r->>'main_start_ms', r->>'main_end_ms';
  end if;
  if exists (select 1 from jsonb_array_elements(r->'stages') e
             where (e->>'sessionIdx')::int <> 0) then
    raise exception 'postcondizione 5: una notte sola non ha piu'' tutti gli stadi su sessionIdx 0';
  end if;

  -- 6. LE ALTRE SESSIONI SEGUONO LA PRINCIPALE, IN ORDINE CRONOLOGICO.
  r := internal._merge_sleep_stages_jsonb(v_notte_due_pisolini, v_notte_due_pisolini);
  if (select (e->>'sessionIdx')::int from jsonb_array_elements(r->'stages') e
       where (e->>'startMs')::bigint = 0 limit 1) <> 0 then
    raise exception 'postcondizione 6: la notte non ha l''indice 0';
  end if;
  if (select (e->>'sessionIdx')::int from jsonb_array_elements(r->'stages') e
       where (e->>'startMs')::bigint = 50400000 limit 1) <> 1 then
    raise exception 'postcondizione 6: il primo pisolino non ha l''indice 1';
  end if;
  if (select (e->>'sessionIdx')::int from jsonb_array_elements(r->'stages') e
       where (e->>'startMs')::bigint = 61200000 limit 1) <> 2 then
    raise exception 'postcondizione 6: il secondo pisolino non ha l''indice 2';
  end if;

  raise notice 'S2-SERVER: sei postcondizioni verdi.';
end
$verifica$;
