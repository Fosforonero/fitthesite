-- System notifications: tracking idempotente di eventi "one-shot" che
-- generano notifiche email all'admin (es. beta full, primi N signup).
--
-- Usage: INSERT ... ON CONFLICT DO NOTHING. Se INSERT ritorna una riga,
-- e' la prima volta che l'evento accade → trigger notifica. Altrimenti
-- skippa silenziosamente.

CREATE TABLE IF NOT EXISTS public.system_notifications (
  key text PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now(),
  detail jsonb NULL
);

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Nessuna policy → solo service_role puo leggere/scrivere.
-- (anon/authenticated bloccati by default con RLS abilitata e zero policy)

COMMENT ON TABLE public.system_notifications IS 'Marker idempotente per eventi notification one-shot (es. beta_round_1_full). Solo service_role.';
