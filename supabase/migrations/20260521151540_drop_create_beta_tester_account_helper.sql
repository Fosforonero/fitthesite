-- Drop helper: l'utente ha deciso di lasciare il self-signup standard.
-- I beta tester registrano loro l'account via app, poi grant_pro_to_email()
-- (script grant_pro_beta_testers.sql) li sblocca a vita.
drop function if exists public.create_beta_tester_account(text, text);