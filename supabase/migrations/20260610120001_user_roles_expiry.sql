-- ─── Pro a scadenza: reward pre-registrazione Play Store (1 anno gratis) ───
--
-- Riusa la catena entitlement esistente (user_roles.role='pro' → app
-- isBetaTester → hasFullAccess) invece di introdurre un canale parallelo.
-- expires_at NULL = ruolo permanente (beta tester esistenti invariati).
-- expires_at valorizzato = ruolo valido fino a quella data.
--
-- Il client filtra i ruoli scaduti in fetchRoles(); il filtro server-side
-- qui sotto (RLS non cambia) è solo per le query admin/reporting.

alter table public.user_roles
  add column if not exists expires_at timestamptz;

comment on column public.user_roles.expires_at is
  'NULL = ruolo permanente. Valorizzato = ruolo valido fino a questa data '
  '(es. reward pre-registrazione: now() + interval ''1 year'').';

-- Grant Pro con scadenza opzionale via email (admin-only, SQL editor).
-- p_until NULL = Pro a vita (comportamento legacy grant_pro_to_email).
create or replace function public.grant_pro_until_to_email(
  p_email text,
  p_until timestamptz default null,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    return false;
  end if;

  insert into public.user_roles (user_id, role, expires_at, note)
  values (v_user_id, 'pro', p_until, p_note)
  on conflict (user_id, role)
  do update set expires_at = excluded.expires_at,
                note = coalesce(excluded.note, user_roles.note);

  return true;
end;
$$;

revoke execute on function public.grant_pro_until_to_email from anon, authenticated;

-- Esempio uso (SQL editor, service role):
--   select grant_pro_until_to_email('utente@example.com',
--     now() + interval '1 year', 'reward pre-registrazione Play Store');
