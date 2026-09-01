-- Forward-only: chiude due buchi di scope ruoli trovati il 25/08/2026
-- riconciliando la cronologia delle migration.
--
-- NON APPLICATA. Nessuna mutazione remota da questa sessione.
--
-- Nessuna delle due tocca un `qual` o una `with check`: cambiano soltanto
-- QUALI RUOLI valutano una policy, e CHI puo' eseguire una funzione. La
-- semantica del write gate WG1 non viene ridisegnata.
--
-- ============================================================================
-- 1. Le due policy di scrittura su fitness_metrics sono scoped a PUBLIC
-- ============================================================================
-- Misurato in produzione il 25/08/2026:
--
--   users select own metrics ......... {authenticated}
--   caregiver select subjects metrics  {authenticated}
--   metrics_select_via_group ......... {authenticated}
--   users insert own metrics ......... {PUBLIC}     <--
--   users update own metrics ......... {PUBLIC}     <--
--
-- L'origine e' 20260816100824 entitlement_gate_scritture_salute, che le
-- ricrea senza clausola TO. Una CREATE POLICY senza TO finisce a PUBLIC.
--
-- E' la stessa identica classe di difetto che il 30/07/2026 fece scattare un
-- rollback immediato sulle policy di lettura, quel giorno in due migration
-- consecutive. Sulle policy di scrittura non se ne era accorto nessuno.
--
-- Oggi non e' sfruttabile: per anon auth.uid() e' NULL, quindi
-- `user_id = auth.uid()` e' falso e nessuna riga passa. Ma e' uno strato di
-- difesa in meno: a fermare anon resta solo l'espressione, non il ruolo.
--
-- ALTER POLICY con la sola clausola TO non tocca USING ne' WITH CHECK.
-- Per authenticated non cambia niente. Per anon il risultato e' identico
-- (negato prima invece che dopo). service_role e postgres hanno
-- rolbypassrls=true e non sono mai stati soggetti a queste policy.

do $scope$
declare
  v_mancanti text;
begin
  select string_agg(pol.polname, ', ')
    into v_mancanti
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'fitness_metrics'
    and pol.polname in ('users insert own metrics', 'users update own metrics')
    and pol.polroles = '{0}';   -- {0} e' PUBLIC

  if v_mancanti is null then
    raise notice 'scope ruoli: le due policy di scrittura sono gia'' scoped a un ruolo, niente da fare.';
  else
    raise notice 'scope ruoli: da correggere -> %', v_mancanti;
  end if;
end
$scope$;

alter policy "users insert own metrics" on public.fitness_metrics to authenticated;
alter policy "users update own metrics" on public.fitness_metrics to authenticated;

-- ============================================================================
-- 2. anon puo' eseguire la funzione SECURITY DEFINER della RLS di gruppo
-- ============================================================================
-- rls_internal.user_shares_metric_with_caller e' SECURITY DEFINER e ha ACL
-- PUBLIC=EXECUTE. Verificato in produzione il 25/08/2026:
-- has_function_privilege('anon', ..., 'EXECUTE') risponde true.
--
-- Una revoca esisteva gia', scritta a maggio nella migration locale
-- 20260522120006, e non e' mai arrivata in produzione. Ma non avrebbe chiuso
-- niente comunque: era REVOKE ... FROM anon, e anon non ha una concessione
-- propria, eredita EXECUTE da PUBLIC. Un REVOKE FROM anon non tocca una
-- concessione a PUBLIC.
--
-- Qui si revoca da PUBLIC, che e' l'unica revoca che serve, e da anon per
-- coprire anche il caso in cui una concessione esplicita venga aggiunta poi.
--
-- L'esposizione pratica e' bassa: rls_internal non e' fra gli schemi esposti
-- da PostgREST, e per anon la funzione risponde sempre false perche'
-- auth.uid() e' NULL. Ma e' uno strato dichiarato nel repository e assente
-- dal database, ed e' esattamente il tipo di scarto che questa
-- riconciliazione doveva trovare.

do $revoca$
begin
  if to_regprocedure(
       'rls_internal.user_shares_metric_with_caller(uuid, boolean, boolean, boolean, boolean, boolean)'
     ) is null then
    raise notice 'revoca: rls_internal.user_shares_metric_with_caller non esiste, salto.';
  else
    execute 'revoke all on function rls_internal.user_shares_metric_with_caller('
         || 'uuid, boolean, boolean, boolean, boolean, boolean) from public';
    execute 'revoke all on function rls_internal.user_shares_metric_with_caller('
         || 'uuid, boolean, boolean, boolean, boolean, boolean) from anon';
    execute 'grant execute on function rls_internal.user_shares_metric_with_caller('
         || 'uuid, boolean, boolean, boolean, boolean, boolean) to authenticated';
    raise notice 'revoca: PUBLIC e anon revocati, authenticated conservato.';
  end if;
end
$revoca$;

-- ============================================================================
-- CONTROLLO DOPO — comportamento, non indicatori indiretti
-- ============================================================================
do $dopo$
declare
  v_pubbliche text;
begin
  select string_agg(pol.polname, ', ')
    into v_pubbliche
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'fitness_metrics'
    and pol.polroles = '{0}';

  if v_pubbliche is not null then
    raise exception
      'scope ruoli: restano policy su fitness_metrics scoped a PUBLIC: %', v_pubbliche;
  end if;

  if to_regprocedure(
       'rls_internal.user_shares_metric_with_caller(uuid, boolean, boolean, boolean, boolean, boolean)'
     ) is not null
     and has_function_privilege('anon',
       'rls_internal.user_shares_metric_with_caller(uuid, boolean, boolean, boolean, boolean, boolean)',
       'EXECUTE') then
    raise exception 'revoca: anon puo'' ancora eseguire user_shares_metric_with_caller.';
  end if;

  raise notice 'scope ruoli e revoche: nessuna policy a PUBLIC su fitness_metrics, anon non esegue la funzione.';
end
$dopo$;
