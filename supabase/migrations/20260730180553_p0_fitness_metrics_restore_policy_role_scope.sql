-- MARKER STORICO — NON ESEGUIBILE
-- Fix del fix: ALTER POLICY ... TO authenticated (30/07/2026).
--
-- Questo file non contiene piu' il proprio SQL originale. E' un marker: la
-- catena lo attraversa senza fare nulla. Il contenuto originale resta
-- verificabile dal suo hash, ed e' recuperabile dal database di produzione
-- (supabase_migrations.schema_migrations) o dalla storia Git di questo file.
--
--   contenuto originale: md5 1cf9bf53418bf0c42ed074505ee95046, 481 byte
--
-- PERCHE' E' NEUTRALIZZATA
-- Esisteva solo per riparare lo scope ruoli lasciato a {public} dalle due\n-- migration precedenti. Neutralizzate quelle, non c'e' piu' niente da\n-- riparare: non e' un difetto, e' una dipendenza che non esiste piu'.
--
-- COSA DICHIARAVA
-- alter policy 'caregiver select subjects metrics' to authenticated;\n-- alter policy 'metrics_select_via_group' to authenticated;
--
-- CHI PRODUCE OGGI QUELLO STATO
-- nessuno serve: le policy sono 'to authenticated' dalla creazione, e la v2 le\n-- ricrea 'to authenticated'.
do $marker$
begin
  raise notice 'marker storico non eseguibile: %', '20260730180553_p0_fitness_metrics_restore_policy_role_scope';
end
$marker$;
