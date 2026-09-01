-- Beta waitlist: signup form attivo quando i 100 posti founder sono pieni.
-- Tabella separata da beta_signups (founder approvati a vita) — qui sono
-- solo "interessati al prossimo round" senza promesse di accesso.

CREATE TABLE IF NOT EXISTS public.beta_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  locale text NOT NULL DEFAULT 'it' CHECK (locale IN ('it', 'en')),
  referral text NULL,
  notify_when_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz NULL,
  signup_ip text NULL,
  signup_ua text NULL
);

CREATE INDEX IF NOT EXISTS idx_beta_waitlist_created_at
  ON public.beta_waitlist (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_beta_waitlist_notified
  ON public.beta_waitlist (notified_at) WHERE notified_at IS NULL;

ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_waitlist" ON public.beta_waitlist;
CREATE POLICY "anon_insert_waitlist"
ON public.beta_waitlist FOR INSERT
TO anon
WITH CHECK (true);

COMMENT ON TABLE public.beta_waitlist IS 'Lista d''attesa per round successivi del beta program. Email + locale + referral. RLS: anon puo insert, nessuno puo read tranne service_role.';
COMMENT ON COLUMN public.beta_waitlist.signup_ip IS 'SHA-256 hash dell''IP (privacy: niente IP raw)';
COMMENT ON COLUMN public.beta_waitlist.notified_at IS 'NULL = mai notificato, timestamp = email inviata quando si e aperto un nuovo round';
