-- Stress medio 0-100 dagli anelli smart (BLE diretto). Gli smartwatch via
-- Health Connect non lo espongono: gap-fill puro dalla sorgente ring.
alter table public.fitness_metrics
  add column if not exists stress_avg integer;

comment on column public.fitness_metrics.stress_avg is
  'Stress medio 0-100 stimato dal wearable (tipicamente smart ring via HRV). NULL = sorgente non disponibile.';
