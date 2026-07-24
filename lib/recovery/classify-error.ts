/**
 * Classifica un errore di `verifyOtp`/`updateUser` in una categoria UX.
 *
 * Supabase non distingue in modo affidabile "scaduto" da "gia' usato" da
 * "codice errato" per un OTP di recovery: sono lo stesso controllo
 * server-side ("token non trovato o non valido") e arrivano con lo stesso
 * codice/messaggio. Per questo `expired_or_used` copre tutti e tre i casi con
 * un solo messaggio onesto ("richiedine uno nuovo"), invece di inventare una
 * distinzione che il backend non garantisce.
 */
export type RecoveryErrorKind =
  | 'expired_or_used'
  | 'rate_limited'
  | 'network'
  | 'generic';

interface ClassifiableError {
  status?: number;
  code?: string;
  message?: string;
}

export function classifyRecoveryError(error: unknown): RecoveryErrorKind {
  if (error instanceof TypeError) {
    // fetch() lancia TypeError per fallimenti di rete (DNS, offline, CORS).
    return 'network';
  }

  const err = (error ?? {}) as ClassifiableError;
  const status = err.status;
  const code = (err.code ?? '').toLowerCase();
  const message = (err.message ?? '').toLowerCase();

  if (status === 429 || code.includes('rate_limit') || message.includes('rate limit')) {
    return 'rate_limited';
  }

  if (
    code === 'otp_expired' ||
    code === 'otp_disabled' ||
    message.includes('expired') ||
    (message.includes('invalid') && message.includes('token'))
  ) {
    return 'expired_or_used';
  }

  if (message.includes('fetch') || message.includes('network')) {
    return 'network';
  }

  return 'generic';
}
