-- MARKER STORICO — NON ESEGUIBILE
-- Primo apply del perf hardening RLS su fitness_metrics (30/07/2026).
--
-- Questo file non contiene piu' il proprio SQL originale. E' un marker: la
-- catena lo attraversa senza fare nulla. Il contenuto originale resta
-- verificabile dal suo hash, ed e' recuperabile dal database di produzione
-- (supabase_migrations.schema_migrations) o dalla storia Git di questo file.
--
--   contenuto originale: md5 28c805445d843e276e532af9d8690fcd, 4536 byte
--
-- PERCHE' E' NEUTRALIZZATA
-- Ricreava 'caregiver select subjects metrics' e 'metrics_select_via_group'\n-- OMETTENDO 'to authenticated': le due policy finivano scoped a PUBLIC invece\n-- che ad authenticated. Rieseguirla su una installazione nuova riaprirebbe\n-- quella finestra permissiva. La fedelta' storica non autorizza a ricreare\n-- una policy insicura: il fatto resta documentato qui, l'effetto no.
--
-- COSA DICHIARAVA
-- schema rls_internal; spostamento di public.user_shares_metric_with_caller in\n-- rls_internal; riscrittura del qual delle due policy da EXISTS correlato a\n-- 'user_id IN (subquery)' piu' prefiltro di gruppo.
--
-- CHI PRODUCE OGGI QUELLO STATO
-- 20260731095701_p0_fitness_metrics_rls_perf_hardening_v2.sql, che produce lo\n-- stesso qual e lo stesso spostamento di schema, ma con 'to authenticated'\n-- esplicito su entrambe le policy.
do $marker$
begin
  raise notice 'marker storico non eseguibile: %', '20260730173213_p0_fitness_metrics_rls_perf_hardening';
end
$marker$;
