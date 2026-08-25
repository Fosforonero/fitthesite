-- Forward-only: riporta nella catena il secondo oggetto applicato fuori banda.
--
-- NON APPLICATA. Nessuna mutazione remota da questa sessione.
--
-- public.fitness_metrics_user_received_idx esiste in produzione. Nessuna
-- migration lo crea: ne' una delle 89 registrate nel remoto, ne' uno dei 109
-- file di questo repository. Verificato il 25/08/2026 interrogando il
-- contenuto di tutte le statements remote e con un grep su tutta la catena.
--
-- E' l'indice del fix ai timeout 504 su fitness_metrics: la query della
-- dashboard ordinava per received_at senza un indice che la sostenesse.
-- Applicato a mano quando il problema era in corso, e mai registrato.
--
-- Trovato confrontando la ricostruzione su Postgres 17 con il catalogo live:
-- 232 indici contro 231, e la differenza cadeva tutta su fitness_metrics.
--
-- Definizione presa letteralmente da pg_indexes in produzione, non riscritta:
--   CREATE INDEX fitness_metrics_user_received_idx
--     ON public.fitness_metrics USING btree (user_id, received_at DESC)
--
-- IF NOT EXISTS perche' in produzione c'e' gia': li' e' un no-op, e serve solo
-- a far convergere una ricostruzione da zero.
--
-- CONCURRENTLY non si puo' usare: non e' ammesso dentro un blocco di
-- transazione, e le migration girano in transazione. Su una ricostruzione da
-- zero la tabella e' vuota e il lock non costa niente. Se un giorno questo
-- file dovesse girare su una fitness_metrics popolata, l'indice esiste gia'
-- e la IF NOT EXISTS lo rende un no-op, quindi il caso non si presenta.

create index if not exists fitness_metrics_user_received_idx
  on public.fitness_metrics using btree (user_id, received_at desc);

do $dopo$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'fitness_metrics_user_received_idx'
  ) then
    raise exception 'indice user_received: non risulta creato dopo la migration.';
  end if;
  raise notice 'indice user_received: presente.';
end
$dopo$;
