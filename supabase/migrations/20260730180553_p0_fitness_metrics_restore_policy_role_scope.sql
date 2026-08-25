-- Fix del fix: il rollback precedente (20260730173649) ha ripristinato
-- correttamente qual/posizione funzione ma NON lo scope ruoli (roles
-- rimasto {public} invece di {authenticated}). ALTER POLICY qui non tocca
-- il qual, SOLO i ruoli applicabili: riporta esattamente allo stato
-- pre-incidente.
alter policy "caregiver select subjects metrics" on public.fitness_metrics to authenticated;
alter policy "metrics_select_via_group" on public.fitness_metrics to authenticated;
