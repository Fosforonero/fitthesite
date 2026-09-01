-- MARKER STORICO — NON ESEGUIBILE
-- Rollback del primo apply (30/07/2026, stesso giorno).
--
-- Questo file non contiene piu' il proprio SQL originale. E' un marker: la
-- catena lo attraversa senza fare nulla. Il contenuto originale resta
-- verificabile dal suo hash, ed e' recuperabile dal database di produzione
-- (supabase_migrations.schema_migrations) o dalla storia Git di questo file.
--
--   contenuto originale: md5 e7599b4f5b8225417d0b47c7ea1b3375, 2260 byte
--
-- PERCHE' E' NEUTRALIZZATA
-- Il suo stesso commento dichiara di ripristinare «ESATTAMENTE lo stato\n-- pre-apply», ma ricrea entrambe le policy SENZA 'to authenticated': lo scope\n-- restava {public}. La finestra permissiva non era una migration, erano due.\n-- Neutralizzata per lo stesso motivo della precedente.
--
-- COSA DICHIARAVA
-- ripristino del qual EXISTS originale; rientro della funzione in public; drop\n-- dello schema rls_internal.
--
-- CHI PRODUCE OGGI QUELLO STATO
-- la v2 del 31/07. Con la 173213 neutralizzata non c'e' nulla da annullare:\n-- le policy nascono gia' 'to authenticated' dalle migration fondative\n-- 20260513120005 (caregiver) e 20260522112135 (gruppo).
do $marker$
begin
  raise notice 'marker storico non eseguibile: %', '20260730173649_p0_fitness_metrics_rls_rollback_role_scope_bug';
end
$marker$;
