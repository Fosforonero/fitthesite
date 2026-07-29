-- Sprint P0.10E addendum — hardening ACL, public.grant_b2c_trial().
--
-- Separata DELIBERATAMENTE dalla migration Founder (20260728090000): questo
-- file NON deve essere mescolato silenziosamente a quella apply. Puo' essere
-- approvato insieme o in un giro separato, ma resta un file a se stante con
-- una propria versione/registrazione.
--
-- Contesto: l'audit lato app (Sprint P0.10A, agente app, AppFitmesh/flutter_app)
-- ha concluso che grant_b2c_trial() ha ZERO caller in Flutter, Kotlin, Swift,
-- backend o history Git — e' codice orfano del vecchio modello
-- fitmesh_b2c_trial_7d. Il trial realmente offerto agli utenti e' interamente
-- applicativo (14 giorni da auth.users.created_at, calcolato lato client),
-- non passa mai da questa funzione ne' da una riga b2c_subscriptions con
-- billing_source='trial'.
--
-- Perche' non e' "difficile da invocare" = "ACL corretta": la funzione e'
-- SECURITY DEFINER, richiede solo un JWT valido (auth.uid() non null) — un
-- qualunque utente autenticato puo' chiamarla direttamente via
-- supabase.rpc('grant_b2c_trial') / PostgREST, indipendentemente da cosa fa
-- o non fa il client ufficiale. Con `on conflict (user_id) do nothing` la
-- funzione e' single-shot per utente (non permette di riottenere o
-- estendere i 7 giorni con chiamate ripetute: la seconda chiamata trova gia'
-- una riga in public.b2c_subscriptions con quello user_id e ritorna false
-- senza inserire nulla) — quindi NON e' classificabile come P0 RELEASE
-- BLOCKER nel senso "abuso ripetuto per accumulare giorni". Resta pero' un
-- percorso non necessario per ottenere un'unica riga b2c_subscriptions
-- (billing_source='trial', state='active', active_until = now()+7gg) che
-- nessuna parte del prodotto oggi si aspetta di vedere per un utente che non
-- e' passato dal vero flusso trial applicativo — hardening dovuto anche se
-- il rischio pratico e' basso.
--
-- Non elimina la funzione ne' dati storici: solo revoca di EXECUTE dai ruoli
-- applicativi. Nessun ruolo tecnico ha bisogno di chiamarla (nessun caller
-- server-side trovato in questo repo: ne' cron, ne' altre RPC, ne'
-- supabase/functions) — quindi non viene ri-concessa ad alcun ruolo.
--
-- Idempotente: `revoke` non fallisce se il privilegio non era gia' concesso.

revoke execute on function public.grant_b2c_trial() from public, anon, authenticated;

comment on function public.grant_b2c_trial is
  'Sprint P0.10E: EXECUTE revocato da public/anon/authenticated il 2026-07-28. '
  'Confermata orfana lato app (zero caller in Flutter/Kotlin/Swift/backend/git '
  'history, Sprint P0.10A). Funzione e dati storici in b2c_subscriptions NON '
  'toccati. Nessun ruolo applicativo ha bisogno di EXECUTE su questa funzione: '
  'un eventuale nuovo trial 7gg self-service andrebbe ridisegnato con un nome '
  'esplicito, non riattivando questa funzione nella forma attuale.';
