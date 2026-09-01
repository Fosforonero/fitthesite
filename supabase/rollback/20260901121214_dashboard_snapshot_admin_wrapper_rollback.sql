-- ============================================================================
-- ROLLBACK di 20260901121214 — via il wrapper admin-gated della dashboard.
--
-- La migration crea public.get_dashboard_snapshot_admin(date), le toglie il
-- grant a PUBLIC e lo concede ad authenticated. Eliminare la funzione porta
-- via anche i suoi grant: non c'e' niente da revocare a parte.
--
-- Va eseguito DOPO il rollback di 20260901121244, che agisce sulla stessa
-- funzione. L'ordine inverso e' quello che 18-rollback-due-modalita.sh usa
-- gia' (`sort -r` sul manifesto), quindi non serve altro.
--
-- Niente CASCADE: se qualcosa dipendesse da questo wrapper, il rollback deve
-- fermarsi e dirlo, non trascinarsi dietro oggetti che non sono suoi.
-- ============================================================================
drop function if exists public.get_dashboard_snapshot_admin(date);

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_dashboard_snapshot_admin'
  ) then
    raise exception 'ROLLBACK INCOMPLETO: get_dashboard_snapshot_admin esiste ancora.';
  end if;
end
$$;
