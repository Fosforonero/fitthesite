ALTER TABLE public.beta_signups
  ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_beta_signups_welcome_pending
  ON public.beta_signups(created_at) WHERE welcome_sent_at IS NULL;