-- MARKER STORICO — NON ESEGUIBILE
-- Variante locale mai applicata della RLS di condivisione via gruppo.
--
--   contenuto originale: md5 7c44731dc6db0fd19c60785472ff9c50, 6117 byte
--
-- PERCHE' E' NEUTRALIZZATA
-- Non e' un duplicato: e' la remota 20260522112135 (applicata) PIU' un
-- REVOKE EXECUTE su public.user_shares_metric_with_caller FROM anon.
-- La parte duplicata non puo' rieseguirsi: CREATE POLICY
-- metrics_select_via_group fallirebbe, la policy esiste gia'.
--
-- LA PARTE CHE NON VA PERSA, E CHE NON FUNZIONAVA COMUNQUE
-- Il REVOKE era l'unica cosa che questa migration aggiungeva, e non e' mai
-- arrivato in produzione. Verificato live il 25/08/2026: la funzione (oggi
-- in rls_internal, SECURITY DEFINER) ha ACL PUBLIC=EXECUTE e
-- has_function_privilege('anon', ..., 'EXECUTE') risponde true.
--
-- Ma il REVOKE come era scritto non avrebbe chiuso niente: anon non ha una
-- concessione propria, eredita EXECUTE da PUBLIC, e un REVOKE FROM anon non
-- tocca una concessione a PUBLIC. Serve REVOKE ... FROM PUBLIC.
--
-- Va nella forward-only, scritta correttamente. Non qui: questa e' storia.
do $marker$
begin
  raise notice 'marker storico non eseguibile: %', '20260522120006_rls_health_data_group_sharing';
end
$marker$;
