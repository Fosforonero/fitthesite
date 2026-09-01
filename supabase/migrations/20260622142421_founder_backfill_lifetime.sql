-- Backfill: converte i founder già registrati da Pro 1 anno → Pro lifetime.
-- Riguarda solo le righe con note = 'founder-launch' che hanno ancora expires_at != null
-- (cioè create prima del fix del 2026-06-22).

update public.user_roles
set expires_at = null
where note = 'founder-launch'
  and expires_at is not null;
