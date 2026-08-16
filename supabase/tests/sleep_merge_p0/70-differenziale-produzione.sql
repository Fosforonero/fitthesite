-- ============================================================================
-- DIFFERENZIALE: LA CORREZIONE CONTRO LA PRODUZIONE, SULLO STESSO INGRESSO
--
-- Un test che dice solo "adesso non raddoppia" non basta per toccare un
-- database vivo. La domanda vera e' l'altra: **che altro e' cambiato?**
--
-- Qui girano fianco a fianco due funzioni:
--   internal._merge_prod_ref            copia della definizione VIVA in produzione
--   internal._merge_sleep_stages_jsonb  la stessa, con la correzione applicata
--
-- e su ogni ingresso si misurano tre proprieta'.
--
--   P1  NIENTE SI PERDE, NIENTE SI INVENTA.
--       L'insieme dei segmenti, tolti i doppioni, dev'essere IDENTICO fra le
--       due. E' la proprieta' che autorizza l'applicazione: la correzione puo'
--       solo togliere copie, mai perdere un pezzo di notte.
--
--   P2  L'USCITA NON HA DOPPIONI.
--       Che e' il difetto che si sta chiudendo.
--
--   P3  LA FINESTRA NON SI SPOSTA.
--       main_start_ms / main_end_ms identici. Dove non lo sono, il caso
--       dev'essere dichiarato qui sotto con la sua ragione: una differenza non
--       spiegata ferma la suite.
--
-- Le prime due sono assolute. La terza ammette eccezioni SOLO se elencate nel
-- caso stesso, e nessun caso reale finora ne ha avuto bisogno.
--
-- Prerequisito: 00-setup-riferimento.sql (crea _merge_prod_ref dal catalogo).
--
-- ── COSA QUESTO FILE NON RIESCE A UCCIDERE, DETTO QUI ──────────────────────
--
-- Provato con mutazioni sulla correzione:
--   raggruppare di nuovo per VALORE invece che per lato   SOPRAVVIVE
--   togliere la deduplica finale                          uccisa
--   chiave senza lo stadio                                uccisa
--   chiave senza sessionIdx                               SOPRAVVIVE
--   chiave senza endMs                                    uccisa (caso 17)
--
-- Le due sopravvissute, con la ragione:
--
--   * "per valore invece che per lato" sopravvive perche' con la rete di
--     sicurezza in fondo le due versioni sono indistinguibili dall'esterno:
--     una non produce le copie, l'altra le produce e poi le toglie. Non sono
--     riuscito a costruire un ingresso che le separi, e la batteria generata
--     non ne ha trovato uno in 121 combinazioni. Il raggruppamento per lato
--     resta perche' toglie la causa invece di ripulire l'effetto, non perche'
--     un test lo pretenda.
--
--   * "chiave senza sessionIdx" sopravvive perche' e' irraggiungibile: le
--     sessioni che sopravvivono alla selezione sono disgiunte nel tempo, quindi
--     due segmenti con lo stesso intervallo non possono stare in sessioni
--     diverse. Misurato anche sui dati veri: 0 casi su 184.664 segmenti in 21
--     giorni. Un test qui sarebbe finto.
-- ============================================================================
\set ON_ERROR_STOP on
\timing off

do $$
declare
  c record;
  v_prod jsonb;
  v_fix jsonb;
  v_passati int := 0;
  v_falliti int := 0;
  v_msg text;
begin
raise notice '########## DIFFERENZIALE PRODUZIONE / CORREZIONE ##########';

for c in
  with una_notte as (
    select '[
      {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
      {"sessionIdx":0,"startMs":20000,"endMs":40000,"stage":"deep"},
      {"sessionIdx":0,"startMs":40000,"endMs":50000,"stage":"rem"}
    ]'::jsonb as a
  )
  select * from (values

    -- ── Il caso reale: la stessa notte rimandata identica ──────────────────
    ('01 stessa notte, secondo invio',
     (select a from una_notte), (select a from una_notte),
     3, 1, 'il caso che sta producendo i numeri falsi in app'),

    -- ── Terzo passaggio: deve restare fermo ────────────────────────────────
    ('02 terzo invio sulla gia'' doppia',
     (select a || a from una_notte), (select a from una_notte),
     3, 1, 'ingresso gia'' sporco: la rete di sicurezza lo ripulisce'),

    -- ── Primo inserimento, niente di conservato ────────────────────────────
    ('03 primo inserimento (vecchio nullo)',
     null, (select a from una_notte),
     3, 1, 'percorso piu'' frequente in assoluto'),

    ('04 nuovo nullo',
     (select a from una_notte), null,
     3, 1, 'sincronizzazione senza sonno'),

    -- ── La notte cresce davvero: NESSUN segmento va perso ──────────────────
    ('05 la notte si allunga',
     (select a from una_notte),
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
       {"sessionIdx":0,"startMs":20000,"endMs":40000,"stage":"deep"},
       {"sessionIdx":0,"startMs":40000,"endMs":50000,"stage":"rem"},
       {"sessionIdx":0,"startMs":50000,"endMs":68000,"stage":"light"}
     ]'::jsonb,
     4, 1, 'il caso che una correzione sbagliata romperebbe: la notte in corso'),

    -- ── Due sessioni disgiunte: notte + pisolino ───────────────────────────
    ('06 notte + pisolino, secondo invio',
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":50000,"stage":"light"},
       {"sessionIdx":1,"startMs":900000,"endMs":930000,"stage":"light"}
     ]'::jsonb,
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":50000,"stage":"light"},
       {"sessionIdx":1,"startMs":900000,"endMs":930000,"stage":"light"}
     ]'::jsonb,
     2, 2, 'due sessioni conservate, nessuna raddoppiata'),

    ('07 il pisolino arriva solo adesso',
     '[{"sessionIdx":0,"startMs":1000,"endMs":50000,"stage":"light"}]'::jsonb,
     '[{"sessionIdx":0,"startMs":900000,"endMs":930000,"stage":"light"}]'::jsonb,
     2, 2, 'sessioni disgiunte da lati diversi: si tengono entrambe'),

    -- ── Sovrapposizione: vince la piu'' ricca, in entrambe le direzioni ─────
    ('08 la nuova e'' piu'' ricca, stesso intervallo',
     '[{"sessionIdx":0,"startMs":1000,"endMs":50000,"stage":"light"}]'::jsonb,
     (select a from una_notte),
     3, 1, 'la povera va scartata, non fusa'),

    ('09 la vecchia e'' piu'' ricca, stesso intervallo',
     (select a from una_notte),
     '[{"sessionIdx":0,"startMs":1000,"endMs":50000,"stage":"light"}]'::jsonb,
     3, 1, 'simmetrico del precedente'),

    -- ── Segmenti invalidi ──────────────────────────────────────────────────
    ('10 segmenti invalidi mescolati ai buoni',
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
       {"sessionIdx":0,"startMs":30000,"endMs":30000,"stage":"deep"},
       {"sessionIdx":0,"startMs":45000,"endMs":40000,"stage":"rem"}
     ]'::jsonb,
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
       {"sessionIdx":0,"startMs":30000,"endMs":30000,"stage":"deep"},
       {"sessionIdx":0,"startMs":45000,"endMs":40000,"stage":"rem"}
     ]'::jsonb,
     1, 1, 'scarto invariato: e'' gia'' cosi'' in produzione'),

    -- ── Risvegli ai bordi: il RED noto, DICHIARATO fuori perimetro ─────────
    ('11 risvegli ai bordi (RED noto, fuori perimetro)',
     '[
       {"sessionIdx":0,"startMs":-180000,"endMs":0,"stage":"awake"},
       {"sessionIdx":0,"startMs":0,"endMs":28800000,"stage":"light"},
       {"sessionIdx":0,"startMs":28800000,"endMs":28980000,"stage":"awake"}
     ]'::jsonb,
     '[
       {"sessionIdx":0,"startMs":-180000,"endMs":0,"stage":"awake"},
       {"sessionIdx":0,"startMs":0,"endMs":28800000,"stage":"light"},
       {"sessionIdx":0,"startMs":28800000,"endMs":28980000,"stage":"awake"}
     ]'::jsonb,
     3, 1, 'la finestra resta allargata come in produzione: 60-finestra-awake.sql'),

    -- ── Stesso intervallo, stadi diversi: NON si fondono ───────────────────
    ('12 stesso intervallo, stadi diversi',
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"deep"}
     ]'::jsonb,
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"deep"}
     ]'::jsonb,
     2, 1, 'la chiave comprende lo stadio: due stadi diversi restano due'),

    -- ── sessionIdx assente ─────────────────────────────────────────────────
    ('13 sessionIdx assente',
     '[{"startMs":1000,"endMs":20000,"stage":"light"}]'::jsonb,
     '[{"startMs":1000,"endMs":20000,"stage":"light"}]'::jsonb,
     1, 1, 'coalesce a 0, come in produzione'),

    -- ── Stesso inizio, stessa fase, FINE diversa: due segmenti veri ────────
    --
    -- Non e' un caso di fantasia: in produzione, sui 184.664 segmenti degli
    -- ultimi 21 giorni, ce ne sono 3 fatti cosi'. Se la chiave di deduplica
    -- dimenticasse endMs, questi verrebbero scartati come se fossero copie —
    -- e sarebbe una perdita di dati introdotta dalla correzione.
    ('17 stesso inizio e stessa fase, fine diversa',
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
       {"sessionIdx":0,"startMs":1000,"endMs":25000,"stage":"light"}
     ]'::jsonb,
     '[
       {"sessionIdx":0,"startMs":1000,"endMs":20000,"stage":"light"},
       {"sessionIdx":0,"startMs":1000,"endMs":25000,"stage":"light"}
     ]'::jsonb,
     2, 1, 'la fine fa parte della chiave: non sono copie'),

    -- ── Degeneri ───────────────────────────────────────────────────────────
    ('14 array vuoti',      '[]'::jsonb, '[]'::jsonb,        -1, -1, 'null da entrambe'),
    ('15 entrambi nulli',   null,        null,               -1, -1, 'null da entrambe'),
    ('16 non-array',        '{"x":1}'::jsonb, '{"x":1}'::jsonb, -1, -1, 'null da entrambe')

  ) as t(nome, vecchio, nuovo, seg_attesi, sess_attese, nota)
loop
  v_prod := internal._merge_prod_ref(c.vecchio, c.nuovo);
  v_fix  := internal._merge_sleep_stages_jsonb(c.vecchio, c.nuovo);
  v_msg  := null;

  -- Degeneri: entrambe devono restituire null.
  if c.seg_attesi = -1 then
    if v_prod is not null or v_fix is not null then
      v_msg := format('atteso null da entrambe, ricevuto prod=%s fix=%s',
                      coalesce(v_prod::text,'null'), coalesce(v_fix::text,'null'));
    end if;
  else
    -- P1: stesso insieme di segmenti, tolti i doppioni.
    if internal._t_norm_dedup(v_prod->'stages')
       is distinct from internal._t_norm_dedup(v_fix->'stages') then
      v_msg := format(
        'P1 VIOLATA — la correzione ha cambiato il CONTENUTO, non solo le copie.%s  produzione: %s%s  correzione: %s',
        E'\n', replace(internal._t_norm_dedup(v_prod->'stages'), E'\n', ' ; '),
        E'\n', replace(internal._t_norm_dedup(v_fix->'stages'),  E'\n', ' ; '));

    -- P2: nessun doppione in uscita.
    elsif internal._t_norm(v_fix->'stages')
          is distinct from internal._t_norm_dedup(v_fix->'stages') then
      v_msg := format('P2 VIOLATA — l''uscita corretta contiene ancora doppioni (%s segmenti, %s distinti)',
                      internal._t_nseg(v_fix),
                      array_length(string_to_array(internal._t_norm_dedup(v_fix->'stages'), E'\n'), 1));

    -- P3: la finestra non si sposta.
    elsif (v_prod->>'main_start_ms') is distinct from (v_fix->>'main_start_ms')
       or (v_prod->>'main_end_ms')   is distinct from (v_fix->>'main_end_ms') then
      v_msg := format('P3 VIOLATA — finestra spostata: produzione [%s, %s], correzione [%s, %s]',
                      v_prod->>'main_start_ms', v_prod->>'main_end_ms',
                      v_fix->>'main_start_ms',  v_fix->>'main_end_ms');

    -- E il conteggio atteso, scritto a mano caso per caso.
    elsif internal._t_nseg(v_fix) <> c.seg_attesi then
      v_msg := format('conteggio segmenti: atteso %s, ottenuto %s (produzione ne dava %s)',
                      c.seg_attesi, internal._t_nseg(v_fix), internal._t_nseg(v_prod));
    elsif internal._t_nsess(v_fix) <> c.sess_attese then
      v_msg := format('conteggio sessioni: attese %s, ottenute %s',
                      c.sess_attese, internal._t_nsess(v_fix));
    end if;
  end if;

  if v_msg is null then
    v_passati := v_passati + 1;
    if c.seg_attesi = -1 then
      raise notice '  OK  % — null da entrambe', c.nome;
    else
      raise notice '  OK  % — prod % seg -> corretta % seg, finestra [%, %] invariata',
        c.nome, internal._t_nseg(v_prod), internal._t_nseg(v_fix),
        v_fix->>'main_start_ms', v_fix->>'main_end_ms';
    end if;
  else
    v_falliti := v_falliti + 1;
    raise warning ' FAIL % — %', c.nome, v_msg;
  end if;
end loop;

raise notice '---------- PASSATI: %   FALLITI: % ----------', v_passati, v_falliti;
if v_falliti > 0 then
  raise exception 'differenziale: % casi falliti', v_falliti;
end if;
end $$;


-- ============================================================================
-- BATTERIA GENERATA: le stesse tre proprieta' su ingressi costruiti a macchina
--
-- I casi scritti a mano provano quello a cui si e' pensato. Questa parte prova
-- quello a cui non si e' pensato: combinazioni di numero di sessioni, numero di
-- segmenti, sovrapposizioni e ripetizioni, incrociate fra vecchio e nuovo.
-- ============================================================================
do $$
declare
  v_prod jsonb;
  v_fix jsonb;
  v_vecchio jsonb;
  v_nuovo jsonb;
  v_casi int := 0;
  v_falliti int := 0;
  v_ridotti int := 0;
  i int; j int; k int; s int;
  v_pool jsonb[];
begin
  raise notice '########## BATTERIA GENERATA ##########';

  -- Un serbatoio di array plausibili: una/due/tre sessioni, lunghezze diverse,
  -- bordi che si toccano, stadi ripetuti.
  v_pool := array[
    null,
    '[]'::jsonb,
    '[{"sessionIdx":0,"startMs":0,"endMs":100,"stage":"light"}]'::jsonb,
    '[{"sessionIdx":0,"startMs":0,"endMs":100,"stage":"light"},
      {"sessionIdx":0,"startMs":100,"endMs":250,"stage":"deep"}]'::jsonb,
    '[{"sessionIdx":0,"startMs":0,"endMs":100,"stage":"light"},
      {"sessionIdx":0,"startMs":100,"endMs":250,"stage":"deep"},
      {"sessionIdx":0,"startMs":250,"endMs":400,"stage":"rem"}]'::jsonb,
    '[{"sessionIdx":0,"startMs":50,"endMs":380,"stage":"asleep"}]'::jsonb,
    '[{"sessionIdx":0,"startMs":0,"endMs":400,"stage":"light"},
      {"sessionIdx":1,"startMs":5000,"endMs":5600,"stage":"light"}]'::jsonb,
    '[{"sessionIdx":1,"startMs":5000,"endMs":5600,"stage":"light"}]'::jsonb,
    '[{"sessionIdx":0,"startMs":0,"endMs":100,"stage":"awake"},
      {"sessionIdx":0,"startMs":100,"endMs":300,"stage":"light"},
      {"sessionIdx":0,"startMs":300,"endMs":320,"stage":"awake"}]'::jsonb,
    -- gia'' sporco in ingresso
    '[{"sessionIdx":0,"startMs":0,"endMs":100,"stage":"light"},
      {"sessionIdx":0,"startMs":0,"endMs":100,"stage":"light"}]'::jsonb,
    -- con invalidi dentro
    '[{"sessionIdx":0,"startMs":0,"endMs":100,"stage":"light"},
      {"sessionIdx":0,"startMs":200,"endMs":150,"stage":"deep"}]'::jsonb
  ];

  for i in 1..array_length(v_pool,1) loop
    for j in 1..array_length(v_pool,1) loop
      v_vecchio := v_pool[i];
      v_nuovo   := v_pool[j];
      v_casi := v_casi + 1;

      v_prod := internal._merge_prod_ref(v_vecchio, v_nuovo);
      v_fix  := internal._merge_sleep_stages_jsonb(v_vecchio, v_nuovo);

      if (v_prod is null) <> (v_fix is null) then
        v_falliti := v_falliti + 1;
        raise warning ' FAIL [%,%] una restituisce null e l''altra no', i, j;
        continue;
      end if;
      continue when v_prod is null;

      if internal._t_norm_dedup(v_prod->'stages')
         is distinct from internal._t_norm_dedup(v_fix->'stages') then
        v_falliti := v_falliti + 1;
        raise warning ' FAIL [%,%] P1: contenuto diverso. prod=% fix=%',
          i, j, replace(internal._t_norm_dedup(v_prod->'stages'), E'\n',' ; '),
                replace(internal._t_norm_dedup(v_fix->'stages'),  E'\n',' ; ');
        continue;
      end if;

      if internal._t_norm(v_fix->'stages')
         is distinct from internal._t_norm_dedup(v_fix->'stages') then
        v_falliti := v_falliti + 1;
        raise warning ' FAIL [%,%] P2: doppioni ancora presenti', i, j;
        continue;
      end if;

      if (v_prod->>'main_start_ms') is distinct from (v_fix->>'main_start_ms')
         or (v_prod->>'main_end_ms') is distinct from (v_fix->>'main_end_ms') then
        v_falliti := v_falliti + 1;
        raise warning ' FAIL [%,%] P3: finestra [%,%] -> [%,%]',
          i, j, v_prod->>'main_start_ms', v_prod->>'main_end_ms',
                v_fix->>'main_start_ms',  v_fix->>'main_end_ms';
        continue;
      end if;

      if internal._t_nseg(v_fix) < internal._t_nseg(v_prod) then
        v_ridotti := v_ridotti + 1;
      end if;
    end loop;
  end loop;

  raise notice 'casi: %   falliti: %   in cui la correzione ha tolto copie: %',
    v_casi, v_falliti, v_ridotti;

  if v_falliti > 0 then
    raise exception 'batteria generata: % casi falliti su %', v_falliti, v_casi;
  end if;
  if v_ridotti = 0 then
    raise exception
      'batteria generata: la correzione non ha tolto NEMMENO UNA copia. Il banco non sta esercitando il difetto: o il riferimento non e'' la produzione, o gli ingressi non lo attivano.';
  end if;
end $$;
