-- Fix bug: il check constraint originale era '^d{6}$' (matcha solo "dddddd")
-- invece di '^\d{6}$'. Il backslash si era perso nella migration source,
-- bloccando tutti gli INSERT di codici numerici.
-- Uso character class [0-9] invece di \d per evitare problemi di escape futuri.

alter table public.device_pairing_codes
  drop constraint if exists device_pairing_codes_code_check;

alter table public.device_pairing_codes
  add constraint device_pairing_codes_code_check
  check (code ~ '^[0-9]{6}$');