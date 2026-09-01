-- Wrapper admin-gated per get_dashboard_snapshot(), pensato per il refresh
-- live in-browser della dashboard locale (AppFitmesh/docs/analytics/dashboard-locale.html).
-- get_dashboard_snapshot() resta service_role-only: non tocchiamo quel grant.
-- Questo wrapper e' SECURITY DEFINER, controlla is_admin() (stesso predicato
-- gia' usato dalle policy RLS su devices), e nega con un errore esplicito a
-- chiunque non sia l'account admin. Nessuna service_role key deve mai finire
-- nel file HTML: il client usa la chiave anon + una sessione Supabase Auth
-- autenticata come admin.
create or replace function public.get_dashboard_snapshot_admin(launch_date date default '2026-05-13'::date)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'auth'
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public.get_dashboard_snapshot(launch_date);
end;
$$;

revoke all on function public.get_dashboard_snapshot_admin(date) from public;
grant execute on function public.get_dashboard_snapshot_admin(date) to authenticated;
