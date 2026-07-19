-- Sprint 189 "il buco del primo giorno" — Task 2, hardenizzata in review
-- ("Backend rollout"). Vedi AppFitmesh/docs/sprints/SPRINT-onboarding-funnel.md
-- per il dettaglio completo. Dry-run validato su Postgres 17 disposable
-- (10 scenari, 2026-07-14) prima di questa applicazione.
--
-- Backfillata nel repository il 2026-07-19 (Founder P0 review, punto 3):
-- questo file era gia' applicato in produzione (versione originale
-- 20260714112434) ma non era mai stato committato in git. Contenuto
-- verbatim recuperato da supabase_migrations.schema_migrations.

alter table public.devices
  add column first_sync_state text
    check (first_sync_state in (
      'block_unavailable', 'block_permission', 'proceed_direct_only',
      'read_no_data', 'read_error', 'upload_error', 'success'
    )),
  add column first_sync_state_updated_at timestamptz,
  add column first_sync_at timestamptz,
  add column first_sync_platform text check (first_sync_platform in ('ios', 'android')),
  add column first_sync_app_version text check (char_length(first_sync_app_version) <= 32);

comment on column public.devices.first_sync_state is
  'Sprint 189: ultimo stato osservato del funnel primo-sync. NULL = mai '
  'valutato (legacy pre-189 o mai piu'' aperto dopo il pairing). Mai '
  'sovrascritto dopo "success" — vedi record_first_sync_transition.';

create or replace function public.record_first_sync_transition(
  p_device_fingerprint text,
  p_state text,
  p_platform text,
  p_app_version text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_state not in (
    'block_unavailable', 'block_permission', 'proceed_direct_only',
    'read_no_data', 'read_error', 'upload_error', 'success'
  ) then
    raise exception 'record_first_sync_transition: invalid p_state %', p_state;
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'record_first_sync_transition: invalid p_platform %', p_platform;
  end if;
  if p_app_version is not null and char_length(p_app_version) > 32 then
    raise exception 'record_first_sync_transition: p_app_version too long';
  end if;

  update public.devices
  set
    first_sync_state = p_state,
    first_sync_state_updated_at = now(),
    first_sync_at = case when p_state = 'success' then now() else first_sync_at end,
    first_sync_platform = p_platform,
    first_sync_app_version = p_app_version
  where device_fingerprint = p_device_fingerprint
    and user_id = auth.uid()
    and revoked_at is null
    and first_sync_state is distinct from 'success'
    and first_sync_state is distinct from p_state;
end;
$$;

revoke all on function public.record_first_sync_transition(text, text, text, text) from public;
grant execute on function public.record_first_sync_transition(text, text, text, text) to authenticated;
