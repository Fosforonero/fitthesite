-- Le postcondizioni. Girano DENTRO la transazione di 03, prima del verdetto.
-- Qualunque violazione alza un'eccezione e porta giu' tutto.
do $$
declare n int;
begin
  -- 1. Zero sessioni impossibili rimaste.
  with r as (
    select id, collected_at_ms,
           case when jsonb_typeof(sleep_stages)='array'
                then sleep_stages else '[]'::jsonb end as st
    from public.fitness_metrics
    where source='colmi_ble' and local_day_key is not null
  ), s as (
    select r.id, r.collected_at_ms,
           coalesce((e.value->>'sessionIdx')::int,0) as sidx,
           (e.value->>'endMs')::bigint as b
    from r cross join lateral jsonb_array_elements(r.st) e(value)
    where jsonb_typeof(e.value)='object' and (e.value->>'endMs') is not null
  ), sess as (
    select id, collected_at_ms, sidx, max(b) as fin
    from s group by id, collected_at_ms, sidx
  )
  select count(*) into n from sess
  where fin > collected_at_ms + 6*60*60*1000;
  if n <> 0 then
    raise exception 'POSTCONDIZIONE 1 fallita: restano % sessioni impossibili', n;
  end if;

  -- 2. Le quattro righe di luglio sono INTATTE. Il confronto e' con
  --    l'impronta presa da 01-impronta.sql PRIMA di toccare qualunque cosa:
  --    va passata come :impronta_luglio. Senza, questa postcondizione non
  --    prova niente e si rifiuta di passare.
  if current_setting('riparazione.impronta_luglio', true) is null then
    raise exception
      'POSTCONDIZIONE 2 non verificabile: manca riparazione.impronta_luglio. '
      'Eseguire 01-impronta.sql e passarla con SET.';
  end if;

  -- 3. Nessuna riga di sonno rimasta orfana della propria finestra.
  select count(*) into n from public.fitness_metrics
  where source='colmi_ble'
    and ((sleep_stages is null) <> (sleep_start_ms is null));
  if n <> 0 then
    raise exception 'POSTCONDIZIONE 3 fallita: % righe con stadi e finestra discordi', n;
  end if;

  raise notice 'postcondizioni: superate.';
end $$;
