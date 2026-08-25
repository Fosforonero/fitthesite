-- P0 RLS hotfix — Fase C: migration candidata.
--
-- Obiettivo: STESSO contratto di accesso (owner, caregiver con consenso/link
-- validi, condivisione gruppo con preset/hide_from/left_at), evitando la
-- valutazione costosa (join/funzione) PER OGNI RIGA della finestra
-- richiesta. Nessun aumento di statement_timeout.
--
-- Cosa cambia, e perche' preserva il contratto:
--
-- 1) "caregiver select subjects metrics": da EXISTS correlato a
--    `user_id IN (subquery)`. Trasformazione standard ed equivalente: la
--    EXISTS originale correla SOLO tramite `cl.subject_id = fitness_metrics.
--    user_id`, nessun'altra condizione fa riferimento alla riga esterna —
--    quindi "esiste un link che soddisfa X per subject_id = user_id" e
--    "user_id sta nell'insieme dei subject_id che soddisfano X" sono la
--    stessa cosa. In piu' avvolge auth.uid() in (select ...) (init-plan,
--    stesso fix gia' applicato a "users select own metrics").
--
-- 2) "metrics_select_via_group": aggiunge un PREFILTRO economico calcolato
--    UNA VOLTA per statement — l'insieme dei subject_id che condividono
--    ALMENO un gruppo attivo col caller, SENZA logica di categoria/
--    hide_from (quella resta nella funzione originale, invariata, chiamata
--    identica a prima). Il prefiltro e' un sovrainsieme del risultato
--    finale per costruzione, quindi ANDare il prefiltro con la funzione
--    originale non cambia MAI il risultato, riduce solo quante righe
--    arrivano a invocare la funzione.
--
-- 3) La funzione SECURITY DEFINER si sposta in uno schema non esposto
--    (rls_internal) — stessa definizione, stessi grant EXECUTE, ma non piu'
--    raggiungibile come endpoint RPC pubblico (richiede anche un passo di
--    configurazione progetto separato: escludere rls_internal dagli
--    "Exposed schemas" PostgREST — non SQL, da fare a parte).
--
-- 4) Nessun indice nuovo: verificato pre-apply che production ha gia',
--    sotto altro nome, idx_members_user_active e idx_members_group_active
--    su group_members, che coprono esattamente il prefiltro sotto.
--
-- 5) Verificato pre-apply che ne' group_members ne' caregiver_links/
--    privacy_consents introducono un cambiamento di esposizione RLS:
--    group_members ha policy members_select basata su
--    private.is_active_group_member, semanticamente identica al join
--    gm_caller/gm_target qui sotto; caregiver_links/privacy_consents erano
--    gia' interrogate direttamente (non tramite funzione) dalla EXISTS
--    originale, stessa esposizione di prima, nessun cambiamento introdotto.

create schema if not exists rls_internal;

alter function public.user_shares_metric_with_caller(
  uuid, boolean, boolean, boolean, boolean, boolean
) set schema rls_internal;

drop policy "caregiver select subjects metrics" on public.fitness_metrics;
create policy "caregiver select subjects metrics" on public.fitness_metrics
  for select
  using (
    user_id in (
      select cl.subject_id
      from public.caregiver_links cl
      join public.privacy_consents pc on pc.user_id = cl.subject_id
      where cl.caregiver_id = (select auth.uid())
        and cl.revoked_at is null
        and (cl.expires_at is null or cl.expires_at > now())
        and 'view_dashboard' = any (cl.permissions)
        and pc.caregiver_share = true
    )
  );

drop policy "metrics_select_via_group" on public.fitness_metrics;
create policy "metrics_select_via_group" on public.fitness_metrics
  for select
  using (
    user_id in (
      select gm_target.user_id
      from public.group_members gm_target
      join public.group_members gm_caller
        on gm_caller.group_id = gm_target.group_id
        and gm_caller.left_at is null
      where gm_target.left_at is null
        and gm_caller.user_id = (select auth.uid())
    )
    and rls_internal.user_shares_metric_with_caller(
      user_id,
      (steps is not null) or (active_calories_kcal is not null)
        or (distance_meters is not null) or (floors_climbed is not null)
        or (elevation_gained_meters is not null) or (exercise_sessions is not null),
      (sleep_minutes is not null) or (sleep_start_ms is not null),
      (heart_rate_bpm is not null) or (resting_heart_rate_bpm is not null)
        or (hrv_rmssd is not null),
      (weight_kg is not null) or (height_cm is not null) or (bmi is not null)
        or (spo2_percent is not null) or (skin_temperature_c is not null),
      (calories_kcal is not null) or (water_ml is not null)
        or (nutrition_kcal_in is not null)
    )
  );
