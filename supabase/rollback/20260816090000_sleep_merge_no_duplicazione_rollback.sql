-- ============================================================================
-- ROLLBACK di 20260816090000_sleep_merge_no_duplicazione
--
-- Ripristina la definizione ESATTA che girava in produzione prima
-- dell'applicazione, md5(pg_get_functiondef) = 0df8a073ebe40610439f858ec3c49c59.
-- Non e' riscritta: e' il testo estratto con pg_get_functiondef.
--
-- ATTENZIONE: eseguirlo RIAPRE la duplicazione. Ogni sincronizzazione che
-- rimanda una notte gia' archiviata tornera' a raddoppiarne gli stadi, e le
-- fasi mostrate nell'app torneranno a essere il doppio del vero.
--
-- Serve solo se la correzione causasse un danno peggiore. Le righe gia'
-- scritte pulite restano pulite: il rollback non le ri-sporca da solo.
-- ============================================================================

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
    from unnest(array[old_stages, new_stages]) as arr
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(arr) = 'array' then arr else '[]'::jsonb end
    ) as s(value)
    where jsonb_typeof(s.value) = 'object'
      and (s.value->>'startMs') is not null
      and (s.value->>'endMs') is not null
      and (s.value->>'endMs')::bigint > (s.value->>'startMs')::bigint
    group by arr, coalesce((s.value->>'sessionIdx')::int, 0)
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

  return jsonb_build_object(
    'stages', v_final_stages,
    'main_start_ms', (v_main->>'start_ms')::bigint,
    'main_end_ms', (v_main->>'end_ms')::bigint
  );
end;
$function$
;

do $$
declare v_md5 text;
begin
  select md5(pg_catalog.pg_get_functiondef(p.oid)) into v_md5
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'internal' and p.proname = '_merge_sleep_stages_jsonb';
  if v_md5 <> '0df8a073ebe40610439f858ec3c49c59' then
    raise exception 'rollback NON fedele: md5 % invece di 0df8a073ebe40610439f858ec3c49c59', v_md5;
  end if;
  raise notice 'rollback 20260816090000 eseguito: definizione ripristinata byte per byte.';
  raise notice 'ATTENZIONE: la duplicazione degli stadi del sonno e'' di nuovo attiva.';
end $$;
