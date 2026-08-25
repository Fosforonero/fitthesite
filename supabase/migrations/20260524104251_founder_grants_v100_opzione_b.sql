-- RAPPRESENTAZIONE SANITIZZATA — schema si', dati personali no.
--
-- Non e' il contenuto originale della migration applicata in produzione.
-- L'originale semina 17 indirizzi email reali di beta tester dentro
-- public.founder_grants, e quegli indirizzi non entrano in questo repository.
--
--   contenuto originale in produzione: md5 a32534decf6279c9597fe88047a7bece,
--                                      6680 byte, 17 email
--   questa rappresentazione:           md5 81bd79c890367bdf41c9ea50178cf5f3,
--                                      5196 byte, 0 email
--
-- Rimosse le righe 114-133 dell'originale, e nient'altro: il commento
-- «5) Seed 17 founder_grants» e l'INSERT ... VALUES che lo segue. Per questo
-- la numerazione dei passi salta dal 4) al 6): il buco e' il seed tolto, non
-- un errore di trascrizione. Ogni altra riga e' byte per byte l'originale,
-- ricostruita in blocchi base64 con verifica MD5 per blocco.
--
-- PERCHE' NON E' UN MARKER VUOTO
-- Al primo tentativo questa migration era stata neutralizzata a no-op puro.
-- Il reset su Postgres 17 lo ha smentito: senza i suoi oggetti di schema,
-- 20260729161341 fallisce con «function public._apply_founder_grant(uuid,
-- text) does not exist», perche' verifica l'MD5 del corpo live prima di
-- sostituirlo e da zero quel corpo non esiste.
-- Una rappresentazione sanitizzata toglie i DATI, non gli EFFETTI DI SCHEMA.
--
-- COSA CAMBIA SU UNA RICOSTRUZIONE DA ZERO
-- public.founder_grants nasce vuota invece che con 17 righe. Il contatore
-- pubblico "X/100" del sito parte da 0 invece che da 17, e il backfill del
-- passo 7) non applica niente perche' non c'e' niente da applicare. In
-- produzione le 21 righe vive non vengono toccate da nessuna parte di questo
-- file: il CREATE TABLE e' IF NOT EXISTS e non c'e' nessun drop.
-- Opzione B: tabella allowlist + RPC user-invoked + backfill manuale.
-- Niente trigger automatici su auth.users (richiesta privacy/policy).

-- 1) Estendi CHECK billing_source per accettare 'founder_grant'
ALTER TABLE public.b2c_subscriptions
  DROP CONSTRAINT b2c_subscriptions_billing_source_check;
ALTER TABLE public.b2c_subscriptions
  ADD CONSTRAINT b2c_subscriptions_billing_source_check
  CHECK (billing_source = ANY (ARRAY['google_play'::text, 'apple_iap'::text, 'stripe'::text, 'trial'::text, 'founder_grant'::text]));

-- 2) Tabella founder_grants (allowlist email-based, indipendente da auth.users)
CREATE TABLE IF NOT EXISTS public.founder_grants (
  email           text PRIMARY KEY,
  founder_number  integer UNIQUE NOT NULL,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  notes           text,
  applied_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at      timestamptz,
  CONSTRAINT founder_grants_email_lowercase CHECK (email = lower(email))
);

COMMENT ON TABLE public.founder_grants IS
'Email allowlist for founder lifetime grants. Applied via RPC claim_founder_grant_if_eligible() called from app post-login. No auto-trigger on auth.users.';

ALTER TABLE public.founder_grants ENABLE ROW LEVEL SECURITY;

-- Solo service_role puo' leggere/modificare l'allowlist (admin task).
CREATE POLICY founder_grants_service_only ON public.founder_grants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3) Helper interna che applica il grant (NON esposta come RPC pubblica diretta).
CREATE OR REPLACE FUNCTION public._apply_founder_grant(p_user_id uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_grant record;
BEGIN
  IF p_user_id IS NULL OR p_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_grant FROM public.founder_grants WHERE email = lower(p_email);
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Upsert lifetime subscription: active_until 2099-12-31 = "per sempre".
  INSERT INTO public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state, raw_payload
  ) VALUES (
    p_user_id, 'founder_grant', 'lifetime_founder',
    'founder_grant_' || v_grant.founder_number::text,
    '2099-12-31 23:59:59+00'::timestamptz, false, 'active',
    jsonb_build_object('founder_number', v_grant.founder_number,
                       'grant_email', v_grant.email,
                       'granted_at', v_grant.granted_at,
                       'source', 'rpc_claim')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    billing_source           = EXCLUDED.billing_source,
    external_product_id      = EXCLUDED.external_product_id,
    external_subscription_id = EXCLUDED.external_subscription_id,
    active_until             = EXCLUDED.active_until,
    auto_renewing            = EXCLUDED.auto_renewing,
    state                    = EXCLUDED.state,
    raw_payload              = EXCLUDED.raw_payload,
    updated_at               = now();

  UPDATE public.founder_grants
  SET applied_user_id = p_user_id, applied_at = now()
  WHERE email = lower(p_email);

  RETURN true;
END $$;

REVOKE EXECUTE ON FUNCTION public._apply_founder_grant(uuid, text) FROM public, anon, authenticated;

-- 4) RPC user-invoked: legge auth.uid() + email da JWT, applica grant se eligibile.
--    Chiamata dall'app post-login (idempotente, no-op se non in allowlist).
CREATE OR REPLACE FUNCTION public.claim_founder_grant_if_eligible()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_applied boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = 'P0001';
  END IF;

  -- Email dal JWT auth (popolata da Supabase Auth).
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'no_email');
  END IF;

  v_applied := public._apply_founder_grant(v_uid, v_email);
  RETURN jsonb_build_object(
    'eligible', v_applied,
    'reason', CASE WHEN v_applied THEN 'granted' ELSE 'not_in_allowlist' END
  );
END $$;

GRANT EXECUTE ON FUNCTION public.claim_founder_grant_if_eligible() TO authenticated;


-- 6) Seed 17 beta_signups status='approved' con founder_number
--    Cosi' il counter "X/100" sul sito mostra 17/100.
INSERT INTO public.beta_signups (email, status, founder_number, created_at, approved_at)
SELECT fg.email, 'approved'::beta_signup_status, fg.founder_number, fg.granted_at, fg.granted_at
FROM public.founder_grants fg
ON CONFLICT (email) DO NOTHING;

-- 7) Backfill: applica grant ai 13 user gia' esistenti (idempotente).
DO $$
DECLARE
  r record;
  ok boolean;
  count_applied int := 0;
BEGIN
  FOR r IN
    SELECT au.id, au.email
    FROM auth.users au
    JOIN public.founder_grants fg ON fg.email = lower(au.email)
    WHERE fg.applied_at IS NULL
  LOOP
    ok := public._apply_founder_grant(r.id, r.email);
    IF ok THEN count_applied := count_applied + 1; END IF;
  END LOOP;
  RAISE NOTICE 'Founder grants backfill: applied to % users', count_applied;
END $$;