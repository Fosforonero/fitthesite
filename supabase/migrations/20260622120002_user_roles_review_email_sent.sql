-- Aggiunge colonna per tracciare quando è stata inviata la mail di review
-- ai founder, in modo che il cron non la reinvii.
alter table public.user_roles
  add column if not exists review_email_sent_at timestamptz default null;
