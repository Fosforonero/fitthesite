-- Forward-only: riporta nella catena una modifica applicata fuori banda.
--
-- NON APPLICATA. Nessuna mutazione remota da questa sessione.
--
-- In produzione la policy «users select own metrics» su public.fitness_metrics
-- ha la forma init-plan:  user_id = (SELECT auth.uid())
-- Nella catena delle migration ha invece la forma diretta, che e' quella
-- scritta in 20260513120003_init_fitness_metrics.sql:
--                         user_id = auth.uid()
--
-- Nessuna migration, ne' locale ne' remota, produce la forma init-plan. Le
-- uniche due che nominano questa policy la nominano dentro un commento. Il
-- commento in testa a 20260730173213 lo dice esplicitamente: «avvolge
-- auth.uid() in (select ...) (init-plan, stesso fix gia' applicato a "users
-- select own metrics")». Quel «gia' applicato» e' avvenuto fuori banda,
-- prima del 30/07/2026, e non e' mai stato registrato.
--
-- Trovata confrontando la ricostruzione su Postgres 17 con il catalogo live
-- il 25/08/2026: era una delle otto differenze residue su 1592 righe di
-- impronta strutturale.
--
-- E' un cambiamento di sole prestazioni: con la forma diretta auth.uid()
-- viene valutata UNA VOLTA PER RIGA, con la forma init-plan una volta per
-- statement. Il risultato e' identico riga per riga, e il contratto di
-- accesso non cambia. Per questo si puo' riportare senza rianalizzare la
-- semantica: la si sta allineando alla produzione, non modificando.

do $initplan$
declare
  v_using text;
begin
  select pg_get_expr(pol.polqual, pol.polrelid)
    into v_using
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'fitness_metrics'
    and pol.polname = 'users select own metrics';

  if v_using is null then
    raise exception
      'initplan: la policy «users select own metrics» non esiste su '
      'public.fitness_metrics. Fermarsi: la catena e'' diversa da quella attesa.';
  end if;

  if v_using ~ 'SELECT auth\.uid\(\)' then
    raise notice 'initplan: gia'' nella forma init-plan, niente da fare.';
    return;
  end if;

  alter policy "users select own metrics" on public.fitness_metrics
    using (user_id = (select auth.uid()));

  raise notice 'initplan: «users select own metrics» portata alla forma init-plan.';
end
$initplan$;

do $dopo$
declare
  v_using text;
begin
  select pg_get_expr(pol.polqual, pol.polrelid) into v_using
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'fitness_metrics'
    and pol.polname = 'users select own metrics';

  if v_using !~ 'SELECT auth\.uid\(\)' then
    raise exception 'initplan: la policy non e'' nella forma attesa dopo l''alter: %', v_using;
  end if;
  raise notice 'initplan: verificata.';
end
$dopo$;
