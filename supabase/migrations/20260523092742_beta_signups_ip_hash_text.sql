-- signup_ip è inet ma il route hash-a l'IP per privacy → hex non valida come inet
-- Cambia tipo a text per accettare hash hex (semantica preservata via commento)
ALTER TABLE public.beta_signups
  ALTER COLUMN signup_ip TYPE text USING signup_ip::text;

COMMENT ON COLUMN public.beta_signups.signup_ip IS
  'SHA-256 hash dell IP raw (privacy: non salviamo IP in chiaro). Era inet, cambiato a text per il hash.';