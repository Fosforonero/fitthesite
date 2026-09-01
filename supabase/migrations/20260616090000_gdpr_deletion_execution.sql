-- MARKER STORICO — NON ESEGUIBILE
-- Duplicato locale di due migration gia' applicate.
--
-- Questo file non contiene piu' il proprio SQL originale. E' un marker: la
-- catena lo attraversa senza fare nulla. Il contenuto originale resta
-- verificabile dal suo hash, ed e' recuperabile dal database di produzione
-- (supabase_migrations.schema_migrations) o dalla storia Git di questo file.
--
--   contenuto originale: md5 9f76e70f485f290876d79e305b62f247, 2003 byte
--
-- PERCHE' E' NEUTRALIZZATA
-- Il corpo della funzione e' identico, tolti i commenti, alla remota\n-- 20260616065134; il blocco cron e' gia' coperto dalla remota 20260616070752.\n-- Entrambe applicate in produzione, il job 'process-deletions' e' vivo.
--
-- COSA DICHIARAVA
-- public.gdpr_process_deletions() e la schedulazione cron 'process-deletions'\n-- ogni 10 minuti. Entrambi VIVI in produzione.
--
-- CHI PRODUCE OGGI QUELLO STATO
-- 20260616065134_gdpr_process_deletions_function.sql per la funzione e\n-- 20260616070752_schedule_process_deletions_cron.sql per il cron.
do $marker$
begin
  raise notice 'marker storico non eseguibile: %', '20260616090000_gdpr_deletion_execution';
end
$marker$;
