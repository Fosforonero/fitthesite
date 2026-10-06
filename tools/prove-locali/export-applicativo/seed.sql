-- Dati SINTETICI per la prova applicativa dell'export (nessun dato vero, nessuna produzione).
-- Stessa fixture del test SQL 16 (supabase/tests/reset-pg17/16-test-export-web-ambito-righe.sql), ma
-- PERMANENTE (la prova applicativa la legge tramite PostgREST in transazioni separate) e con in piu':
--   - zed con 1250 righe in fitness_metrics (paginazione contro PostgREST vero, max_rows 1000);
--   - alice senza nessuna relazione (identita' «normale»).
-- Attori: alice (normale), bob (membro di gruppo e soggetto di un legame caregiver), carla (caregiver),
-- dan (proprietario del gruppo), erin (membro), admin, frank e gina (partecipanti a una sfida), zed (molte righe).
\set ON_ERROR_STOP on

create temp table ex_attori(n text primary key, id uuid);
insert into ex_attori values
  ('alice','ee000000-0000-4000-8000-000000000001'),
  ('bob',  'ee000000-0000-4000-8000-000000000002'),
  ('carla','ee000000-0000-4000-8000-000000000003'),
  ('dan',  'ee000000-0000-4000-8000-000000000004'),
  ('erin', 'ee000000-0000-4000-8000-000000000005'),
  ('admin','ee000000-0000-4000-8000-000000000006'),
  ('frank','ee000000-0000-4000-8000-000000000007'),
  ('gina', 'ee000000-0000-4000-8000-000000000008'),
  ('zed',  'ee000000-0000-4000-8000-000000000009');
insert into auth.users (id, email) select id, 'synth-' || n || '@example.invalid' from ex_attori;

insert into public.privacy_consents (user_id, caregiver_share)
  select id, (n = 'bob') from ex_attori
  on conflict (user_id) do update set caregiver_share = excluded.caregiver_share;
insert into public.user_settings (user_id) select id from ex_attori on conflict (user_id) do nothing;
insert into public.user_roles (user_id, role, note)
  select id, case when n = 'admin' then 'admin' else 'user' end, 'SYNTH-NOTE-' || n from ex_attori
  on conflict do nothing;
insert into public.devices (id, user_id, device_fingerprint, device_name, source_type, fcm_token)
  select ('ee100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid, id,
         'synth-fp-' || n, 'synth-dev-' || n, 'health_connect', 'SYNTH-FCM-TOKEN-' || n
  from ex_attori;
insert into public.fitness_metrics
  (user_id, device_id, window_start_ms, window_end_ms, collected_at_ms, source, steps,
   blood_glucose_mgdl, blood_pressure_systolic, blood_pressure_diastolic)
  select id, ('ee100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid,
         1000, 2000, 3000, 'health_connect', 1234, 999.9, 199, 99
  from ex_attori;
-- zed: 1250 righe in piu' (oltre la prima pagina da 1000)
insert into public.fitness_metrics
  (user_id, device_id, window_start_ms, window_end_ms, collected_at_ms, source, steps)
  select a.id, ('ee100000-0000-4000-8000-00000000000' || right(a.id::text,1))::uuid,
         1000 + g * 60000, 2000 + g * 60000, 3000 + g * 60000, 'health_connect', g
  from ex_attori a, generate_series(1, 1250) g where a.n = 'zed';
insert into public.workouts (user_id, device_id, start_ms, end_ms, type, title)
  select id, ('ee100000-0000-4000-8000-00000000000' || right(id::text,1))::uuid, 1000, 2000, 'run', 'SYNTH-' || n
  from ex_attori;
insert into public.b2c_subscriptions
  (user_id, billing_source, external_product_id, external_subscription_id, active_until, state, raw_payload)
  select id, 'google_play', 'synth.product', 'SYNTH-SUB-' || n, now() + interval '30 days', 'active',
         jsonb_build_object('synthetic', true, 'owner', n)
  from ex_attori;
insert into public.caregiver_links (caregiver_id, subject_id, permissions)
  select c.id, s.id, array['view_dashboard'] from ex_attori c, ex_attori s where c.n='carla' and s.n='bob';
insert into public.groups (id, type, name, owner_id)
  select 'ee200000-0000-4000-8000-000000000001', 'family', 'SYNTH-G1', id from ex_attori where n='dan';
insert into public.group_members (group_id, user_id, role, share_settings, display_name)
  select 'ee200000-0000-4000-8000-000000000001', a2.id, x.role,
         jsonb_build_object('preset', x.preset, 'hide_from', '[]'::jsonb), 'SYNTH-' || a2.n
  from ex_attori a2
  join (values ('dan','owner','full'),('bob','member','activity'),('erin','member','activity')) x(n,role,preset)
    on x.n = a2.n;
insert into public.challenges (id, name, metric, participant_type, period_start, period_end)
  values ('ee300000-0000-4000-8000-000000000001','SYNTH-CH','steps','individual', now(), now() + interval '7 days');
insert into public.challenge_participants (challenge_id, user_id, device_id_used)
  select 'ee300000-0000-4000-8000-000000000001', a2.id,
         ('ee100000-0000-4000-8000-00000000000' || right(a2.id::text,1))::uuid
  from ex_attori a2 where a2.n in ('frank','gina');
insert into public.challenge_scores (challenge_id, user_id, score)
  select 'ee300000-0000-4000-8000-000000000001', a2.id, 100 from ex_attori a2 where a2.n in ('frank','gina');

-- il ruolo con cui PostgREST si connette (come in Supabase): puo' diventare anon/authenticated/service_role
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator noinherit login; end if;
end $$;
alter role authenticator with login noinherit password 'usaegetta';
grant anon, authenticated, service_role to authenticator;
