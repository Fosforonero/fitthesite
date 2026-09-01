-- ============================================================================
-- 20260825120001: chi puo' SCRIVERE le metriche, e chi puo' eseguire la
-- funzione di condivisione.
--
-- PERCHE' ESISTE
-- --------------
-- Il 26/08/2026 avevo classificato 120001 come «no-op» confrontando le
-- definizioni delle policy: coincidevano. Coincidevano davvero, e la
-- conclusione era sbagliata lo stesso, perche' 120001 non cambia le
-- definizioni: cambia QUALI RUOLI le valutano e CHI puo' eseguire una
-- funzione. Il confronto guardava il `qual`, e il difetto stava nell'ACL.
--
-- In produzione, oggi:
--   - `users insert own metrics` e `users update own metrics` sono valutate
--     per PUBLIC, non per `authenticated`;
--   - `rls_internal.user_shares_metric_with_caller`, che e' SECURITY DEFINER,
--     e' eseguibile da PUBLIC.
-- In Supabase `anon` eredita da PUBLIC: significa che il ruolo non
-- autenticato entra in quelle valutazioni.
--
-- Una prova sola non basta: serve il positivo (chi deve, puo') e il negativo
-- (chi non deve, non puo'). Un test che prova solo il positivo resta verde
-- anche se la concessione e' aperta a tutti.
-- ============================================================================
\set ON_ERROR_STOP on

do $$
declare
  v_u uuid := 'c1000000-0000-0000-0000-000000000001'::uuid;
  v_puo_anon boolean;
  v_puo_auth boolean;
  n int := 0;
begin
  -- ── 1. POSITIVO: authenticated puo' eseguire la funzione ────────────────
  select has_function_privilege('authenticated',
           'rls_internal.user_shares_metric_with_caller(uuid,boolean,boolean,boolean,boolean,boolean)',
           'EXECUTE') into v_puo_auth;
  if not v_puo_auth then
    raise exception '1 FALLISCE  authenticated NON puo'' eseguire user_shares_metric_with_caller: 120001 ha revocato troppo';
  end if;
  n := n + 1; raise notice '1 PASSA  authenticated puo'' eseguire la funzione di condivisione';

  -- ── 2. NEGATIVO: anon NON deve poterla eseguire ─────────────────────────
  select has_function_privilege('anon',
           'rls_internal.user_shares_metric_with_caller(uuid,boolean,boolean,boolean,boolean,boolean)',
           'EXECUTE') into v_puo_anon;
  if v_puo_anon then
    raise exception '2 FALLISCE  anon PUO'' eseguire una SECURITY DEFINER: la concessione a PUBLIC e'' ancora li''';
  end if;
  n := n + 1; raise notice '2 PASSA  anon NON puo'' eseguire la funzione (la concessione a PUBLIC e'' revocata)';

  -- ── 3. NEGATIVO: le due policy di scrittura non valutano PUBLIC ─────────
  if exists (select 1 from pg_policy pol
             where pol.polrelid = 'public.fitness_metrics'::regclass
               and pol.polname in ('users insert own metrics', 'users update own metrics')
               and pol.polroles = '{0}') then
    raise exception '3 FALLISCE  una policy di scrittura su fitness_metrics e'' ancora valutata per PUBLIC';
  end if;
  n := n + 1; raise notice '3 PASSA  le due policy di scrittura sono scoped, non PUBLIC';

  -- ── 4. POSITIVO: sono scoped proprio ad authenticated ───────────────────
  if not exists (select 1 from pg_policy pol
                 where pol.polrelid = 'public.fitness_metrics'::regclass
                   and pol.polname = 'users insert own metrics'
                   and (select rolname from pg_roles where oid = pol.polroles[1]) = 'authenticated') then
    raise exception '4 FALLISCE  «users insert own metrics» non e'' scoped ad authenticated';
  end if;
  n := n + 1; raise notice '4 PASSA  «users insert own metrics» e'' scoped ad authenticated';

  raise notice 'scope pubblico: % controlli, tutti verdi.', n;
end $$;

-- ── CONTROLLO POSITIVO ──────────────────────────────────────────────────────
-- Rimessa la concessione a PUBLIC, il controllo 2 DEVE fallire. Senza questo,
-- un `has_function_privilege` che rispondesse sempre `false` — per esempio
-- perche' il nome della funzione e' sbagliato e nessuno se ne accorge — darebbe
-- un verde che non misura niente.
do $$
declare v_ok boolean; v_errore text;
begin
  execute 'grant execute on function rls_internal.user_shares_metric_with_caller('
       || 'uuid,boolean,boolean,boolean,boolean,boolean) to public';
  select has_function_privilege('anon',
           'rls_internal.user_shares_metric_with_caller(uuid,boolean,boolean,boolean,boolean,boolean)',
           'EXECUTE') into v_ok;
  execute 'revoke execute on function rls_internal.user_shares_metric_with_caller('
       || 'uuid,boolean,boolean,boolean,boolean,boolean) from public';
  if not v_ok then
    raise exception 'CONTROLLO POSITIVO FALLITO: rimessa la concessione a PUBLIC, anon risulta ancora senza EXECUTE. Il controllo 2 non misura la concessione.';
  end if;
  raise notice '5 PASSA  controllo positivo: con la concessione a PUBLIC, anon PUO''. Il controllo 2 misura davvero.';
end $$;
