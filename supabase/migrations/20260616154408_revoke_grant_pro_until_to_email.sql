-- Sicurezza (audit SECURITY DEFINER, 2026-06-16).
--
-- grant_pro_until_to_email concede il ruolo 'pro' (anche a vita) a una qualsiasi
-- email. Era pensata per il solo admin/tooling via service_role: il revoke degli
-- execute era nella migration 20260610120001_user_roles_expiry.sql, ma in
-- produzione il grant risultava aperto a `authenticated` (drift: la funzione è
-- stata ricreata durante l'hardening search_path ed è tornata al default PUBLIC).
-- Risultato: qualsiasi utente autenticato poteva auto-concedersi Pro gratis.
--
-- Ri-applichiamo il revoke. service_role (admin tooling) bypassa i grant, quindi
-- l'uso legittimo non è impattato. La sorella grant_pro_to_email è già bloccata.
revoke execute on function
  public.grant_pro_until_to_email(text, timestamptz, text)
  from anon, authenticated, public;
