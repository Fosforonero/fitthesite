-- v101: tracking HR source per priority picker multi-source.
-- Permette dashboard UI di mostrare badge "premium" (Polar fascia >
-- smartwatch > band) e all'utente di capire quale device sta dando
-- accuracy migliore.
ALTER TABLE public.fitness_metrics
  ADD COLUMN IF NOT EXISTS hr_source_name    text,
  ADD COLUMN IF NOT EXISTS hr_source_quality text
    CHECK (hr_source_quality IS NULL
       OR hr_source_quality = ANY (ARRAY['premium','standard','basic','unknown']));

COMMENT ON COLUMN public.fitness_metrics.hr_source_name IS
'Package name della sorgente HR vincente (es. fi.polar.beat, com.samsung.android.shealth). Null = legacy/single-source.';
COMMENT ON COLUMN public.fitness_metrics.hr_source_quality IS
'Tier qualita HR: premium (chest strap), standard (smartwatch), basic (fitness band/phone), unknown.';