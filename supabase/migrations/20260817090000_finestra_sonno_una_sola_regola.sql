-- La finestra del sonno smette di dipendere da quante volte hai sincronizzato.
--
-- ── COS'E' ROTTO ───────────────────────────────────────────────────────────
--
-- `public.upsert_fitness_metrics_v189` scrive `sleep_start_ms` / `sleep_end_ms`
-- con DUE regole diverse a seconda del ramo:
--
--   * INSERT (primo salvataggio del giorno): prende i due valori dal payload
--     del telefono, verbatim.
--   * UPDATE (ogni sync successivo): li ricalcola come `main_start_ms` /
--     `main_end_ms`, cioe' dagli stadi, tramite
--     `internal._merge_sleep_stages_jsonb`.
--
-- Stessa notte, finestra diversa a seconda di quanti sync sono arrivati. Il
-- numero mostrato a una persona non deve dipendere da un dettaglio del
-- trasporto.
--
-- Misurato in produzione il 17/08/2026, 21 giorni, sessioni principali che
-- cadono fuori dalla finestra dichiarata dalla loro stessa riga:
--
--     health_connect, una sola sessione   1.399 sessioni   121 fuori (8,6%)
--     healthkit,      una sola sessione     277 sessioni    46 fuori (16,6%)
--     colmi_ble,      una sola sessione     102 sessioni     0 fuori
--
-- Con UNA sola sessione non esiste ambiguita' su quale sia la principale: se
-- la finestra non contiene i propri stadi, e' perche' non viene da li'.
-- L'anello e' a zero perche' finestra e stadi nascono dallo stesso log.
--
-- ── LA DECISIONE ───────────────────────────────────────────────────────────
--
-- Matteo, 17/08/2026: la finestra rappresenta la SOLA NOTTE PRINCIPALE, non
-- l'unione di tutte le sessioni tenute. I pisolini hanno una card, un colore e
-- una finestra propria; un intervallo che comprende anche il pisolino del
-- primo pomeriggio avrebbe dentro dieci ore di buco, e l'efficienza del sonno
-- smetterebbe di essere confrontabile fra sorgenti.
--
-- ── COSA CAMBIA ────────────────────────────────────────────────────────────
--
-- L'INSERT usa la stessa funzione che gia' usa l'UPDATE. Una regola sola.
--
-- Effetto secondario voluto: la deduplica dei segmenti, che oggi vive solo nel
-- ramo UPDATE, comincia a valere anche al primo salvataggio. Fino a ieri una
-- riga inserita da un client con l'ipnogramma gia' doppio restava doppia fino
-- al sync successivo, e guariva solo perche' i sync sono tanti. Questo chiude
-- il buco residuo del fix del 16/08.
--
-- Se il payload non porta stadi leggibili, `_merge_sleep_stages_jsonb`
-- restituisce null e si ricade sui valori del telefono: le righe senza
-- ipnogramma continuano a comportarsi esattamente come prima.
--
-- ── PERCHE' UNA SOSTITUZIONE SUL SORGENTE VIVO ─────────────────────────────
--
-- La funzione e' lunga 11.666 caratteri e tocca l'ingest di tutti i dati di
-- salute. Ricopiarla per intero per cambiarne tre righe significa introdurre
-- il rischio di trascrizione su tutto il resto. Qui si legge il sorgente
-- corrente, si sostituiscono due ancore verificate uniche, e si riesegue: il
-- resto della funzione resta identico byte per byte, per costruzione.
--
-- La migration si rifiuta di procedere se un'ancora non compare esattamente
-- una volta: significherebbe che la funzione e' cambiata sotto i piedi, e a
-- quel punto sostituire alla cieca sarebbe peggio che fermarsi.

do $migrazione$
declare
  v_src text;
  v_out text;

  c_finestra_vecchia constant text :=
$a1$    (p_row->>'sleep_start_ms')::bigint, (p_row->>'sleep_end_ms')::bigint,$a1$;

  c_finestra_nuova constant text :=
$a2$    coalesce((internal._merge_sleep_stages_jsonb(null::jsonb, p_row->'sleep_stages')->>'main_start_ms')::bigint, (p_row->>'sleep_start_ms')::bigint),
    coalesce((internal._merge_sleep_stages_jsonb(null::jsonb, p_row->'sleep_stages')->>'main_end_ms')::bigint, (p_row->>'sleep_end_ms')::bigint),$a2$;

  c_stadi_vecchi constant text :=
$a3$    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories', p_row->'sleep_stages',$a3$;

  c_stadi_nuovi constant text :=
$a4$    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories', coalesce(internal._merge_sleep_stages_jsonb(null::jsonb, p_row->'sleep_stages')->'stages', p_row->'sleep_stages'),$a4$;

  v_occorrenze int;
begin
  select pg_get_functiondef(p.oid) into v_src
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'upsert_fitness_metrics_v189';

  if v_src is null then
    raise exception 'public.upsert_fitness_metrics_v189 non esiste: migration nel posto sbagliato';
  end if;

  v_occorrenze := (length(v_src) - length(replace(v_src, c_finestra_vecchia, '')))
                  / length(c_finestra_vecchia);
  if v_occorrenze <> 1 then
    raise exception 'ancora finestra trovata % volte invece di 1: la funzione e cambiata, fermarsi', v_occorrenze;
  end if;

  v_occorrenze := (length(v_src) - length(replace(v_src, c_stadi_vecchi, '')))
                  / length(c_stadi_vecchi);
  if v_occorrenze <> 1 then
    raise exception 'ancora stadi trovata % volte invece di 1: la funzione e cambiata, fermarsi', v_occorrenze;
  end if;

  v_out := replace(v_src, c_finestra_vecchia, c_finestra_nuova);
  v_out := replace(v_out, c_stadi_vecchi, c_stadi_nuovi);

  if v_out = v_src then
    raise exception 'nessuna sostituzione applicata: qualcosa non torna';
  end if;

  execute v_out;
end
$migrazione$;

-- Verifica di uscita: la nuova forma c'e', la vecchia non c'e' piu', e la
-- funzione e' ancora una funzione con la stessa firma.
do $verifica$
declare
  v_src text;
begin
  select pg_get_functiondef(p.oid) into v_src
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'upsert_fitness_metrics_v189';

  if v_src not like '%main_start_ms'')::bigint, (p_row->>''sleep_start_ms'')::bigint)%' then
    raise exception 'la finestra non risulta ricalcolata dagli stadi: rollback';
  end if;

  if v_src like '%    (p_row->>''sleep_start_ms'')::bigint, (p_row->>''sleep_end_ms'')::bigint,%' then
    raise exception 'la vecchia riga e ancora li: rollback';
  end if;

  if v_src not like '%coalesce(internal._merge_sleep_stages_jsonb(null::jsonb, p_row->''sleep_stages'')->''stages''%' then
    raise exception 'gli stadi non passano piu dalla deduplica: rollback';
  end if;

  raise notice 'finestra e ipnogramma ora hanno una regola sola, su entrambi i rami';
end
$verifica$;
