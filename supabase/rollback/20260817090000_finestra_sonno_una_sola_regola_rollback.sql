-- Rollback di 20260817090000_finestra_sonno_una_sola_regola.
--
-- Rimette l'INSERT a prendere la finestra dal payload del telefono e a scrivere
-- l'ipnogramma senza passare dalla deduplica.
--
-- ATTENZIONE, da leggere prima di eseguirlo: tornare indietro NON ripara le
-- righe scritte nel frattempo, e soprattutto riapre due cose insieme.
--
--   1. La finestra torna a dipendere da quante volte hai sincronizzato.
--   2. Un client che manda un ipnogramma gia' duplicato torna a inserirlo
--      duplicato al primo salvataggio del giorno.
--
-- Il punto 2 e' il piu' insidioso: era il buco residuo del fix del 16/08, e la
-- riga guarisce solo al sync successivo. Se esegui questo rollback, rimetti in
-- calendario il monitoraggio delle righe sovrapposte.

do $rollback$
declare
  v_src text;
  v_out text;

  c_finestra_nuova constant text :=
$a1$    coalesce((internal._merge_sleep_stages_jsonb(null::jsonb, p_row->'sleep_stages')->>'main_start_ms')::bigint, (p_row->>'sleep_start_ms')::bigint),
    coalesce((internal._merge_sleep_stages_jsonb(null::jsonb, p_row->'sleep_stages')->>'main_end_ms')::bigint, (p_row->>'sleep_end_ms')::bigint),$a1$;

  c_finestra_vecchia constant text :=
$a2$    (p_row->>'sleep_start_ms')::bigint, (p_row->>'sleep_end_ms')::bigint,$a2$;

  c_stadi_nuovi constant text :=
$a3$    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories', coalesce(internal._merge_sleep_stages_jsonb(null::jsonb, p_row->'sleep_stages')->'stages', p_row->'sleep_stages'),$a3$;

  c_stadi_vecchi constant text :=
$a4$    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories', p_row->'sleep_stages',$a4$;
begin
  select pg_get_functiondef(p.oid) into v_src
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'upsert_fitness_metrics_v189';

  if v_src is null then
    raise exception 'public.upsert_fitness_metrics_v189 non esiste';
  end if;

  if position(c_finestra_nuova in v_src) = 0 then
    raise exception 'la forma nuova non c e: la migration non era applicata, niente da annullare';
  end if;

  v_out := replace(v_src, c_finestra_nuova, c_finestra_vecchia);
  v_out := replace(v_out, c_stadi_nuovi, c_stadi_vecchi);

  execute v_out;

  raise notice 'INSERT tornato alle due regole: rimettere in calendario il monitoraggio dei segmenti sovrapposti';
end
$rollback$;
