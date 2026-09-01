-- ============================================================================
-- IL MERGE DEL SONNO RADDOPPIA GLI STADI. CORREZIONE MINIMA.
--
-- Difetto: `group by arr` raggruppa per VALORE dell'array, non per il lato da
-- cui viene. Quando il vecchio e il nuovo sono lo stesso identico jsonb — cioe'
-- ogni volta che una sincronizzazione rimanda una notte gia' archiviata e non
-- piu' in evoluzione, quindi quasi sempre — le due righe prodotte da `unnest`
-- hanno lo stesso valore e finiscono in un gruppo solo. Il `cross join lateral`
-- ha pero' gia' esploso entrambe: al gruppo arrivano 2N segmenti, e `jsonb_agg`
-- li riordina per startMs mettendo ogni segmento accanto al suo gemello.
--
-- Da qui, tutte insieme, le tre firme misurate in produzione: raddoppio esatto,
-- copie adiacenti, sessionIdx identico fra le due copie. E il raddoppio
-- PARZIALE, che nessun'altra ipotesi spiegava: due sessioni disgiunte vengono
-- tenute entrambe, quindi la notte puo' risultare doppia e il pisolino no.
--
-- Perche' non si arriva mai a tre copie: alla scrittura dopo, l'array
-- conservato (2N) e' diverso da quello in arrivo (N), i due gruppi si
-- separano, si sovrappongono nel tempo e sopravvive il piu' ricco — cioe'
-- quello gia' raddoppiato. X -> 2X -> 2X.
--
-- E' VISIBILE NELL'APP. Le fasi, le percentuali, l'efficienza, il confronto
-- con l'obiettivo e il punteggio qualita' sommano l'array e raddoppiano; la
-- durata totale e gli orari leggono la finestra e restano giusti. Su una notte
-- reale il sonno leggero e' arrivato al 109%: una fase da sola oltre il 100%
-- della notte, in schermata principale.
--
-- ── PERIMETRO, DICHIARATO ──────────────────────────────────────────────────
--
-- Questa migration corregge SOLO la duplicazione. Non tocca:
--   * quale sessione sia la "principale" (oggi la piu' ricca, poi la piu'
--     lunga), che non coincide con `sessionIdx = 0` dopo il ri-tag
--     cronologico. E' un contratto ambiguo, ed e' una decisione di prodotto;
--   * la finestra `main_start_ms` / `main_end_ms`, che descrive UNA sessione
--     mentre `stages` ne contiene diverse — da cui i segmenti legittimamente
--     fuori finestra;
--   * gli `awake` ai bordi, che allargano la finestra calcolata dal server
--     mentre il client la calcola escludendoli.
-- Sono tre cose separate, con i loro RED, e vanno nella 190 dove possono
-- essere riviste. Qui si chiude il difetto che sta mostrando numeri falsi
-- adesso.
--
-- ── COSA SI STA SOSTITUENDO, ESATTAMENTE ───────────────────────────────────
--
-- Il corpo qui sotto e' la definizione VIVA in produzione, estratta con
-- pg_get_functiondef, con tre righe cambiate e un blocco aggiunto. Non e'
-- riscritta a mano e non viene dal candidato da 905 righe.
--
--   md5(pg_get_functiondef) della definizione sostituita:
--     0df8a073ebe40610439f858ec3c49c59
--
-- E' lo stesso md5 che il candidato dell'11/08 dichiarava come base: la
-- produzione non e' derivata da allora. Se al momento dell'applicazione quel
-- md5 non coincide, FERMARSI: qualcuno ha toccato la funzione e questo diff
-- non e' piu' quello giusto. Il controllo e' nel blocco DO qui sotto.
--
-- ── VERIFICA ESEGUITA ──────────────────────────────────────────────────────
--
-- Banco: container PostgreSQL 17 isolato (produzione e' 17.6), con dentro le
-- definizioni VERE estratte dal catalogo di produzione e verificate per md5:
-- la funzione del sonno, i tre aiutanti e la RPC public.upsert_fitness_metrics_v189.
-- Il container condiviso non e' stato usato come giudice: e' su PostgreSQL 15
-- e la sua RPC e' un'altra (17.089 caratteri contro 11.666).
--
-- 1. DIFFERENZIALE, la correzione contro la produzione sullo stesso ingresso
--    (70-differenziale-produzione.sql): 17 casi scritti a mano + 121 generati.
--    Tre proprieta', tutte verificate su tutti:
--      P1  stesso insieme di segmenti, tolte le copie — niente si perde
--      P2  nessun doppione in uscita
--      P3  main_start_ms / main_end_ms invariati al millisecondo
--    In 23 casi su 121 la correzione toglie davvero copie: il banco esercita
--    il difetto, non gli gira intorno.
--
-- 2. END-TO-END sulla RPC vera (80-rpc-end-to-end.sql), eseguito nei DUE stati:
--      con la definizione di produzione  -> ROSSO (3 -> 6 segmenti al secondo
--        invio; somma degli stadi 57.600.000 ms su una notte da 28.800.000)
--      con questa migration              -> VERDE (E1..E4)
--    E2 e' il caso che conta di piu': una riga GIA' doppia torna a 3 segmenti
--    alla prima sincronizzazione utile. La correzione ripara da sola gli utenti
--    attivi; la riparazione storica serve solo a chi non sincronizza piu'.
--
-- 3. MUTAZIONI sulla correzione: 3 uccise su 5. Le due sopravvissute sono
--    spiegate nella testata del file 70 — una e' ridondanza voluta, l'altra
--    e' irraggiungibile per costruzione e misurata a 0 sui dati veri.
--
-- 4. ROLLBACK provato eseguendolo: ripristina md5 0df8a073…, non "sembra giusto".
--
-- La riga che autorizza l'applicazione e' P3: sul dato pulito il comportamento
-- e' identico al millisecondo, e sul dato sporco cambia solo togliendo copie.
--
-- ── DOPO ───────────────────────────────────────────────────────────────────
--
-- Il criterio di uscita e' `duplicate = 0` su tutte le sorgenti per PIU'
-- GIORNI consecutivi, su `received_at >= ` l'istante di questa applicazione.
-- Le note della 3.9.8 hanno gia' dichiarato risolto questo difetto il 23
-- luglio; tre settimane dopo era vivo sul 70% delle righe. Nessun annuncio
-- prima della query a zero.
--
-- La riparazione dello storico NON parte da qui: prima l'ingest pulito
-- verificato, poi il GO esplicito di Matteo.
-- ============================================================================

-- Il controllo che rende sicura l'applicazione: si sostituisce solo cio' che
-- ci si aspetta di sostituire.
do $$
declare
  v_md5 text;
begin
  select md5(pg_catalog.pg_get_functiondef(p.oid)) into v_md5
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'internal' and p.proname = '_merge_sleep_stages_jsonb';

  if v_md5 is null then
    raise exception 'internal._merge_sleep_stages_jsonb non esiste: schema inatteso, non applicare';
  end if;
  if v_md5 <> '0df8a073ebe40610439f858ec3c49c59' then
    raise exception
      'la funzione viva NON e'' quella attesa (md5 % invece di 0df8a073ebe40610439f858ec3c49c59). Qualcuno l''ha modificata: rifare il diff prima di applicare.', v_md5;
  end if;
end $$;

CREATE OR REPLACE FUNCTION internal._merge_sleep_stages_jsonb(old_stages jsonb, new_stages jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_grouped jsonb[];
  v_selected jsonb[] := '{}';
  v_main jsonb;
  v_cand jsonb;
  v_kept jsonb;
  v_overlaps boolean;
  v_final_stages jsonb := '[]'::jsonb;
  v_retagged jsonb;
  v_idx int := 0;
begin
  select array_agg(
    jsonb_build_object('stages', stages, 'start_ms', start_ms, 'end_ms', end_ms)
    order by jsonb_array_length(stages) desc, (end_ms - start_ms) desc
  )
  into v_grouped
  from (
    select
      jsonb_agg(s.value order by (s.value->>'startMs')::bigint) as stages,
      min((s.value->>'startMs')::bigint) as start_ms,
      max((s.value->>'endMs')::bigint) as end_ms
    -- LA CORREZIONE. `with ordinality` da' a ogni lato un numero (1 e 2), e
    -- il raggruppamento usa QUELLO invece del valore dell'array.
    from unnest(array[old_stages, new_stages]) with ordinality as arr(val, side)
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(arr.val) = 'array' then arr.val else '[]'::jsonb end
    ) as s(value)
    where jsonb_typeof(s.value) = 'object'
      and (s.value->>'startMs') is not null
      and (s.value->>'endMs') is not null
      and (s.value->>'endMs')::bigint > (s.value->>'startMs')::bigint
    group by arr.side, coalesce((s.value->>'sessionIdx')::int, 0)
  ) sessions;

  if v_grouped is null then
    return null;
  end if;

  foreach v_cand in array v_grouped loop
    v_overlaps := false;
    foreach v_kept in array v_selected loop
      if (v_cand->>'start_ms')::bigint < (v_kept->>'end_ms')::bigint
         and (v_kept->>'start_ms')::bigint < (v_cand->>'end_ms')::bigint then
        v_overlaps := true;
        exit;
      end if;
    end loop;
    if not v_overlaps then
      v_selected := array_append(v_selected, v_cand);
    end if;
  end loop;

  -- Richest overall, before the chronological resort below.
  v_main := v_selected[1];

  select array_agg(v order by (v->>'start_ms')::bigint) into v_selected
  from unnest(v_selected) as v;

  v_idx := 0;
  foreach v_cand in array v_selected loop
    select coalesce(jsonb_agg(stage || jsonb_build_object('sessionIdx', v_idx)), '[]'::jsonb)
    into v_retagged
    from jsonb_array_elements(v_cand->'stages') as stage;
    v_final_stages := v_final_stages || v_retagged;
    v_idx := v_idx + 1;
  end loop;

  -- RETE DI SICUREZZA: deduplica finale, sulla chiave canonica.
  --
  -- Serve per cio' che arriva gia' sporco: una riga storica riletta e
  -- riscritta, o un client vecchio con doppioni suoi. Senza questa, la
  -- funzione e' idempotente solo se l'INGRESSO e' pulito.
  --
  -- E OGGI L'INGRESSO NON E' PULITO QUASI MAI. Il 72-85% delle righe con
  -- sonno e' gia' doppio: alla prossima sincronizzazione il conservato e'
  -- sporco e il nuovo e' pulito, e la riga guarisce solo grazie a questo
  -- blocco. E' la parte che fa il lavoro visibile subito dopo l'applicazione;
  -- `arr.side` sopra e' quella che impedisce di ricrearne di nuove.
  --
  -- Provato con mutazioni: togliendo questo blocco la suite diventa rossa.
  -- Togliendo invece `arr.side` (e lasciando questo) la suite resta VERDE:
  -- con la rete in fondo le due versioni sono indistinguibili dall'esterno,
  -- e non sono riuscito a costruire un ingresso che le separi. Il
  -- raggruppamento per lato resta perche' toglie la causa invece di ripulire
  -- l'effetto — non perche' un test lo pretenda. Dettaglio in
  -- supabase/tests/sleep_merge_p0/70-differenziale-produzione.sql.
  --
  -- La chiave e' la stessa del monitor: sessione, inizio, fine, stadio
  -- normalizzato. Comprende endMs perche' in produzione esistono segmenti con
  -- stesso inizio e stessa fase ma fine diversa (3 su 184.664 in 21 giorni):
  -- non sono copie, e non vanno persi.
  select coalesce(
           jsonb_agg(d.v order by (d.v->>'sessionIdx')::int,
                                  (d.v->>'startMs')::bigint),
           '[]'::jsonb)
    into v_final_stages
  from (
    select distinct on (
      coalesce((e.value->>'sessionIdx')::int, 0),
      (e.value->>'startMs')::bigint,
      (e.value->>'endMs')::bigint,
      lower(btrim(coalesce(e.value->>'stage', '')))
    ) e.value as v
    from jsonb_array_elements(v_final_stages) as e(value)
    order by
      coalesce((e.value->>'sessionIdx')::int, 0),
      (e.value->>'startMs')::bigint,
      (e.value->>'endMs')::bigint,
      lower(btrim(coalesce(e.value->>'stage', '')))
  ) d;

  return jsonb_build_object(
    'stages', v_final_stages,
    'main_start_ms', (v_main->>'start_ms')::bigint,
    'main_end_ms', (v_main->>'end_ms')::bigint
  );
end;
$function$
;
