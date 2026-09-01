-- MARKER STORICO — NON ESEGUIBILE
-- Duplicato locale di una migration gia' applicata.
--
-- Questo file non contiene piu' il proprio SQL originale. E' un marker: la
-- catena lo attraversa senza fare nulla. Il contenuto originale resta
-- verificabile dal suo hash, ed e' recuperabile dal database di produzione
-- (supabase_migrations.schema_migrations) o dalla storia Git di questo file.
--
--   contenuto originale: md5 5b563aa228c20fe44d37043085864b76, 667 byte
--
-- PERCHE' E' NEUTRALIZZATA
-- Identica, tolti i commenti, alla migration remota registrata\n-- 20260522110516 mesh_groups_index_fixes, che e' applicata in produzione.\n-- Eseguirle entrambe fallirebbe sulla creazione ripetuta degli indici.
--
-- COSA DICHIARAVA
-- public.touch_updated_at; idx_events_user, idx_invites_created_by,\n-- idx_invites_group. Tutti e quattro VIVI in produzione.
--
-- CHI PRODUCE OGGI QUELLO STATO
-- 20260522110516_mesh_groups_index_fixes.sql (remota, applicata).
do $marker$
begin
  raise notice 'marker storico non eseguibile: %', '20260522120001b_mesh_groups_index_fixes';
end
$marker$;
