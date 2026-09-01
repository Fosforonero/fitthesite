-- Sprint M FCM: aggiungi token Cloud Messaging per silent push bg sync.
-- fcm_token rotato dal client al login/refresh. fcm_token_updated_at
-- per pulizia di token stale > 60gg (Firebase invalida automaticamente
-- token inattivi a quel punto).

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMPTZ;

-- Index parziale per query veloci del cron Vercel ("dammi tutti i device
-- attivi con last_seen recente"). Skippa token NULL e device revocati.
CREATE INDEX IF NOT EXISTS idx_devices_fcm_active
  ON devices (fcm_token_updated_at DESC)
  WHERE fcm_token IS NOT NULL AND revoked_at IS NULL;

COMMENT ON COLUMN devices.fcm_token IS
  'Firebase Cloud Messaging device token. Aggiornato dal client al login + onTokenRefresh. NULL = device non ha ancora completato setup FCM.';
COMMENT ON COLUMN devices.fcm_token_updated_at IS
  'Last touch del fcm_token. Pulizia automatica server-side: token con updated_at < now - 60gg sono stale (FCM li scarta).';