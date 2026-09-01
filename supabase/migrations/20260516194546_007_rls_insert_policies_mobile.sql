-- Migration 007 — RLS INSERT policies for mobile-facing tables (USER APPROVED)
-- Allows user-bound client (anon + Bearer JWT) to insert/update own records,
-- replacing service_role requirement for /api/v1/sync, /api/v1/pair, /api/v1/auth/devices/codes.

drop policy if exists "users insert own metrics" on public.fitness_metrics;
create policy "users insert own metrics"
  on public.fitness_metrics for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users insert own workouts" on public.workouts;
create policy "users insert own workouts"
  on public.workouts for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users insert own devices" on public.devices;
create policy "users insert own devices"
  on public.devices for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users update own devices" on public.devices;
create policy "users update own devices"
  on public.devices for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users insert own pairing codes" on public.device_pairing_codes;
create policy "users insert own pairing codes"
  on public.device_pairing_codes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users select own pairing codes" on public.device_pairing_codes;
create policy "users select own pairing codes"
  on public.device_pairing_codes for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users update own pairing codes" on public.device_pairing_codes;
create policy "users update own pairing codes"
  on public.device_pairing_codes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());