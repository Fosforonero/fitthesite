-- ============================================================================
-- ROLLBACK di 20260901121244 — anon torna a poter eseguire il wrapper.
--
-- ATTENZIONE, e va detto qui e non in un ticket: questo rollback RIAPRE una
-- porta. La migration toglieva ad `anon` un EXECUTE che il default privilege
-- del progetto concede automaticamente a ogni nuova funzione in `public`;
-- annullarla rimette quell'EXECUTE. Da solo, in produzione, sarebbe un passo
-- indietro sulla sicurezza.
--
-- Non e' un difetto del rollback: e' cosa significa tornare indietro. Lo stato
-- che ripristina e' quello ESATTO fra 20260901121214 e 20260901121244, e ha
-- senso solo dentro la catena, seguito dal rollback di 121214 che elimina del
-- tutto la funzione. La sequenza inversa del manifesto lo garantisce.
--
-- Il grant e' condizionato all'esistenza della funzione: nella prova su PG17
-- la base non applica le 20260901*, quindi un `grant` nudo fallirebbe su un
-- oggetto inesistente e il rosso sarebbe dell'ambiente, non della migration.
-- ============================================================================
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_dashboard_snapshot_admin'
  ) then
    execute 'grant execute on function public.get_dashboard_snapshot_admin(date) to anon';
    raise notice 'ripristinato EXECUTE ad anon su get_dashboard_snapshot_admin(date)';
  else
    raise notice 'get_dashboard_snapshot_admin non esiste: niente da ripristinare';
  end if;
end
$$;
