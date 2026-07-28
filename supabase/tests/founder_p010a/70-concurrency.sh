#!/bin/bash
# Sprint P0.10A — BLOCCO 1 "concorrenza": due varianti.
#   TEST A: due UTENTI diversi, ultimo posto libero, chiamate concorrenti ->
#           il ledger (private.founder_seats) non deve MAI superare 1000.
#   TEST B: STESSO utente, due device, chiamate concorrenti -> mai entrambe
#           capReached, mai due seat per lo stesso utente.
# Richiede un pg_sleep iniettato DOPO i fast-path pre-lock e PRIMA
# dell'advisory lock (solo per questo test) per forzare la sovrapposizione
# reale, invece di sperare in un jitter di processo. Il resto del corpo e'
# IDENTICO a private.grant_founder_launch_core in 20260728090000 — il
# `create or replace` a fine test ripristina la versione reale applicata
# dalla migration (il container e' comunque usa-e-getta).
set -e
CID="$1"

docker exec -i -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres <<'SQL'
create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to pg_catalog, public, private
as $$
declare
  founder_cap constant int := 1000;
  founder_cutoff constant timestamptz := '2026-07-31T22:00:00Z'::timestamptz;
  founder_window constant interval := interval '14 days';
  v_rule_version constant text := 'founder_p010a_ledger_v1';
  v_email text;
  v_created_at timestamptz;
  v_first_sync_at timestamptz;
  v_taken int;
  v_reserved_pending int;
  v_founder_number int;
  v_rows int;
  v_outcome text;
begin
  if p_user_id is null or p_device_id is null then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'missing_context');
  end if;
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;
  select outcome into v_outcome from private.founder_evaluations where user_id = p_user_id;
  if v_outcome is not null then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false, 'grantKind', null,
      'capReached', v_outcome = 'cap_reached',
      'notEligibleReason', v_outcome);
  end if;
  if not exists (select 1 from public.fitness_metrics where user_id = p_user_id and device_id = p_device_id) then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'no_metrics_evidence');
  end if;
  select email, created_at into v_email, v_created_at from auth.users where id = p_user_id;
  if v_email is null or v_email ilike '%.invalid'
    or lower(v_email) = lower('review@fitmesh.fit') or lower(v_email) = lower('appreview.demo@fitmesh.fit') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'excluded_account');
  end if;
  if exists (select 1 from private.founder_seats where user_id = p_user_id) then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;

  -- TEST-ONLY: forza la sovrapposizione reale dei chiamanti concorrenti
  -- prima che uno dei due prenda l'advisory lock.
  perform pg_sleep(0.5);

  perform pg_advisory_xact_lock(hashtext('founder-launch-grant'));
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'pro') then
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', true,
      'grantKind', null, 'capReached', false, 'notEligibleReason', null);
  end if;
  if v_created_at is null or v_created_at >= founder_cutoff then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'program_closed', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'program_closed');
  end if;
  select first_sync_at into v_first_sync_at from public.devices where id = p_device_id;
  if v_first_sync_at is null or v_first_sync_at > v_created_at + founder_window then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'window_expired', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', false, 'notEligibleReason', 'window_expired');
  end if;
  select count(*) into v_taken from private.founder_seats;
  select count(*) into v_reserved_pending from public.founder_grants where applied_user_id is null;
  if v_taken + v_reserved_pending >= founder_cap then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'cap_reached', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached');
  end if;
  v_founder_number := private._next_founder_number();
  if v_founder_number is null then
    insert into private.founder_evaluations (user_id, outcome, registered_at, rule_version)
    values (p_user_id, 'cap_reached', v_created_at, v_rule_version) on conflict (user_id) do nothing;
    return jsonb_build_object('grantCreated', false, 'alreadyHadEligibleGrant', false,
      'grantKind', null, 'capReached', true, 'notEligibleReason', 'cap_reached');
  end if;
  insert into private.founder_seats (founder_number, user_id, source, registered_at, first_sync_evidence_at, granted_at, rule_version)
  values (v_founder_number, p_user_id, 'verified_sync', v_created_at, v_first_sync_at, now(), v_rule_version);
  insert into public.user_roles (user_id, role, expires_at, note)
  values (p_user_id, 'pro', null, 'founder-launch') on conflict (user_id, role) do nothing;
  get diagnostics v_rows = row_count;
  return jsonb_build_object('grantCreated', v_rows > 0, 'alreadyHadEligibleGrant', v_rows = 0,
    'grantKind', case when v_rows > 0 then 'founder-launch' else null end,
    'capReached', false, 'notEligibleReason', null);
end;
$$;
SQL

echo '################ TEST A: due utenti diversi, ultimo posto libero (concorrenza) ################'
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c \
  "insert into private.founder_seats (founder_number, user_id, source, registered_at, granted_at, rule_version)
   select gs, null, 'verified_sync', now(), now(), 'test_fill'
   from generate_series(1,1000) gs
   where gs not in (select coalesce(founder_number,-1) from private.founder_seats)
     and gs not in (select founder_number from public.founder_grants)
   limit 999;" >/dev/null

UX=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select test.mkuser('concx@example.com', now() - interval '1 day');")
UY=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select test.mkuser('concy@example.com', now() - interval '1 day');")
DX=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select test.mkdevice('${UX}'::uuid, 'fp-concx', now());")
DY=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select test.mkdevice('${UY}'::uuid, 'fp-concy', now());")
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${UX}'::uuid, '${DX}'::uuid);" >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${UY}'::uuid, '${DY}'::uuid);" >/dev/null

docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${UX}'; select public.record_first_sync_transition('fp-concx','success','android','1.0');" \
  > /tmp/p010a_race_x.out 2>&1 &
PID_X=$!
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${UY}'; select public.record_first_sync_transition('fp-concy','success','android','1.0');" \
  > /tmp/p010a_race_y.out 2>&1 &
PID_Y=$!
wait $PID_X
wait $PID_Y
echo "--- result X ---"; cat /tmp/p010a_race_x.out
echo "--- result Y ---"; cat /tmp/p010a_race_y.out
FINAL_SEATS=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select count(*) from private.founder_seats;")
echo "--- posti totali nel ledger dopo la race (deve essere 1000, mai 1001) ---"
echo "$FINAL_SEATS"
if [ "$FINAL_SEATS" != "1000" ]; then
  echo "TEST A: FAIL - ledger a $FINAL_SEATS invece di 1000"
  exit 1
fi
X_GRANTED=$(grep -o '"grantCreated": *true' /tmp/p010a_race_x.out | wc -l | tr -d ' ')
Y_GRANTED=$(grep -o '"grantCreated": *true' /tmp/p010a_race_y.out | wc -l | tr -d ' ')
if [ "$((X_GRANTED + Y_GRANTED))" != "1" ]; then
  echo "TEST A: FAIL - esattamente uno dei due doveva vincere l'ultimo posto (X=$X_GRANTED, Y=$Y_GRANTED)"
  exit 1
fi
echo "TEST A: PASS (ledger=1000, esattamente un vincitore tra i due utenti)"

echo '################ TEST B: STESSO utente, due device (concorrenza) ################'
# Reset del cap: TEST A ha volutamente esaurito il ledger a 1000/1000 per
# provare il boundary — TEST B verifica una dimensione ORTOGONALE (stesso
# utente, due device, mai un doppio seat/doppio pro), non il cap, quindi
# libera spazio prima di ripartire (stesso container, stesso db).
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "delete from public.user_roles where note='founder-launch'; delete from private.founder_seats where rule_version='test_fill';" >/dev/null
U15=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select test.mkuser('conc15@example.com', now() - interval '1 day');")
D15A=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select test.mkdevice('${U15}'::uuid, 'fp-conc15a', now());")
D15B=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select test.mkdevice('${U15}'::uuid, 'fp-conc15b', now());")
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${U15}'::uuid, '${D15A}'::uuid);" >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "insert into public.fitness_metrics(user_id, device_id) values ('${U15}'::uuid, '${D15B}'::uuid);" >/dev/null

docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${U15}'; select public.record_first_sync_transition('fp-conc15a','success','android','1.0');" \
  > /tmp/p010a_race15_a.out 2>&1 &
PID_A=$!
docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA \
  -c "set role authenticated; set request.jwt.claim.sub = '${U15}'; select public.record_first_sync_transition('fp-conc15b','success','android','1.0');" \
  > /tmp/p010a_race15_b.out 2>&1 &
PID_B=$!
wait $PID_A
wait $PID_B
echo "--- result A (device 1) ---"; cat /tmp/p010a_race15_a.out
echo "--- result B (device 2) ---"; cat /tmp/p010a_race15_b.out
PRO_ROWS=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select count(*) from public.user_roles where user_id='${U15}'::uuid and role='pro';")
SEAT_ROWS=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -tA -c "select count(*) from private.founder_seats where user_id='${U15}'::uuid;")
echo "--- ruoli pro per l'utente (deve essere esattamente 1): $PRO_ROWS ---"
echo "--- seat per l'utente (deve essere esattamente 1): $SEAT_ROWS ---"
if [ "$PRO_ROWS" != "1" ] || [ "$SEAT_ROWS" != "1" ]; then
  echo "TEST B: FAIL - pro_rows=$PRO_ROWS, seat_rows=$SEAT_ROWS"
  exit 1
fi
if grep -q '"capReached": *true' /tmp/p010a_race15_a.out && grep -q '"capReached": *true' /tmp/p010a_race15_b.out; then
  echo "TEST B: FAIL - entrambi i device hanno visto capReached=true"
  exit 1
fi
echo "TEST B: PASS (un solo ruolo pro, un solo seat, mai doppio capReached)"
