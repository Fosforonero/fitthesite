-- Esito opzionale Samsung Health Monitor per il rischio di apnea notturna.
-- Non e' un indice AHI e non contiene un conteggio di apnee/ipopnee.
alter table public.fitness_metrics
  add column if not exists sleep_apnea_detected boolean;

comment on column public.fitness_metrics.sleep_apnea_detected is
  'Samsung Health Monitor sleep-apnea risk sign: true detected, false not detected, null unavailable. Not an AHI value.';
