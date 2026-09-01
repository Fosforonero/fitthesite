-- ============================================================================
-- 14 — L'accesso anonimo alle metriche: misurato sui DATI, non sui privilegi
--
-- PERCHE' ESISTE
-- --------------
-- 20260825120001 revoca una concessione a PUBLIC su una SECURITY DEFINER e
-- riporta le due policy di scrittura di fitness_metrics da PUBLIC ad
-- authenticated. `has_function_privilege` dice chi PUO' CHIAMARE; non dice se,
-- chiamando, si leggono o si cambiano dati. E' la differenza fra
-- «vulnerabilita' attiva» e «superficie da stringere», e si decide sui dati.
--
-- Misurato il 26/08/2026 su PG17 isolato, riportando prima il database alla
-- forma della produzione (concessione aperta, policy a PUBLIC):
--
--   anon senza claim non legge NIENTE e non scrive NIENTE, in entrambe le
--   forme. Le letture tornano zero righe, le scritture le rifiuta la policy
--   perche' auth.uid() e' nullo, e l'helper non e' nemmeno raggiungibile.
--
-- Quindi: HARDENING della superficie, non vulnerabilita' viva. Resta nella 190
-- e non richiede una distribuzione separata.
--
-- La differenza che 120001 produce e' UNA sola su dodici prove: con un claim
-- falsificato, la forma-produzione lascia scrivere e quella corretta no. Un
-- claim falsificato non e' raggiungibile dall'API — PostgREST popola
-- request.jwt.claims da un JWT verificato — quindi e' una seconda barriera
-- indipendente, che e' esattamente cio' che l'hardening deve essere.
--
-- Quello che ha davvero fermato l'helper non e' la revoca: e' che `anon` non ha
-- USAGE sullo schema rls_internal. La concessione EXECUTE c'era. Una prova che
-- si fosse fermata a has_function_privilege avrebbe dato la risposta opposta.
-- ============================================================================
\set ON_ERROR_STOP on

-- Ogni prova gira in un sotto-blocco con EXCEPTION, che e' un savepoint
-- implicito: cio' che scrive viene annullato senza dipendere da come il file
-- viene eseguito. Nessun begin/rollback nudo.
do $$
declare
  v_n int; n int := 0;
  a  uuid := 'aa000000-0000-0000-0000-00000000000a';
  b  uuid := 'bb000000-0000-0000-0000-00000000000b';
  da uuid := 'da000000-0000-0000-0000-00000000000a';
  db uuid := 'db000000-0000-0000-0000-00000000000b';
begin
  -- La fixture sta DENTRO il blocco che si annulla, non prima. Nella prima
  -- stesura stava in un blocco DO separato: quello si conferma da solo, e
  -- lasciava sei righe nel database dopo ogni esecuzione. E' la stessa classe
  -- del difetto della postcondizione di F6, e l'ho ripetuta.
  insert into auth.users (id, email) values (a,'a@esempio.invalid'),(b,'b@esempio.invalid') on conflict do nothing;
  insert into public.profiles (id, email) values (a,'a@esempio.invalid'),(b,'b@esempio.invalid') on conflict do nothing;
  insert into public.user_roles (user_id, role, granted_at, expires_at)
    values (a,'pro',now(),now()+interval '30 days') on conflict do nothing;
  insert into public.devices (id, user_id, device_fingerprint, source_type, paired_at)
    values (da,a,'fp-a','health_connect',now()), (db,b,'fp-b','health_connect',now()) on conflict do nothing;
  insert into public.fitness_metrics (user_id, device_id, window_start_ms, window_end_ms, collected_at_ms, steps)
    values (a,da,1000,2000,1500,1000), (b,db,1000,2000,1500,2000) on conflict do nothing;
  if not public.user_has_active_entitlement(a) then
    raise exception 'FIXTURE ROTTA: A non ha diritto, quindi ogni «negato» sarebbe negato per il motivo sbagliato';
  end if;
  raise notice 'fixture pronta, A ha diritto';

  -- 1. anon NON deve poter chiamare l'helper.
  begin
    set local role anon;
    perform set_config('request.jwt.claims','',true);
    perform rls_internal.user_shares_metric_with_caller(
      'aa000000-0000-0000-0000-00000000000a'::uuid,true,true,true,true,true);
    reset role;
    raise exception '1 FALLISCE  anon ha potuto chiamare l''helper SECURITY DEFINER';
  exception when insufficient_privilege then
    reset role; n := n+1;
    raise notice '1 PASSA  anon non raggiunge l''helper (manca USAGE su rls_internal, non solo EXECUTE)';
  end;

  -- 2. anon NON deve leggere nessuna riga.
  set local role anon;
  perform set_config('request.jwt.claims','',true);
  select count(*) into v_n from public.fitness_metrics;
  reset role;
  if v_n <> 0 then raise exception '2 FALLISCE  anon legge % righe di metriche', v_n; end if;
  n := n+1; raise notice '2 PASSA  anon legge zero righe';

  -- 3. anon NON deve poter scrivere, nemmeno una riga «propria».
  begin
    set local role anon;
    perform set_config('request.jwt.claims','',true);
    insert into public.fitness_metrics(user_id,device_id,window_start_ms,window_end_ms,collected_at_ms,steps)
      values ('aa000000-0000-0000-0000-00000000000a'::uuid,'da000000-0000-0000-0000-00000000000a'::uuid,9000,9999,9500,5);
    reset role;
    raise exception '3 FALLISCE  anon ha scritto una riga';
  exception when insufficient_privilege or check_violation then
    reset role; n := n+1; raise notice '3 PASSA  anon non scrive (la policy rifiuta con auth.uid() nullo)';
  end;

  -- 4. anon con claim falsificato NON deve scrivere: e' la barriera che
  --    120001 aggiunge, e l'unica prova che distingue le due forme.
  begin
    set local role anon;
    perform set_config('request.jwt.claims',
      '{"sub":"aa000000-0000-0000-0000-00000000000a","role":"anon"}', true);
    insert into public.fitness_metrics(user_id,device_id,window_start_ms,window_end_ms,collected_at_ms,steps)
      values ('aa000000-0000-0000-0000-00000000000a'::uuid,'da000000-0000-0000-0000-00000000000a'::uuid,8000,8999,8500,5);
    reset role;
    raise exception '4 FALLISCE  anon con claim falsificato ha scritto: le policy di scrittura sono ancora valutate per PUBLIC';
  exception when insufficient_privilege or check_violation then
    reset role; n := n+1; raise notice '4 PASSA  anon con claim falsificato non scrive (policy scoped ad authenticated)';
  end;

  -- 5. authenticated deve poter scrivere la PROPRIA riga: se questo fallisse,
  --    tutti i «negato» sopra sarebbero negati per il motivo sbagliato.
  set local role authenticated;
  perform set_config('request.jwt.claims',
    '{"sub":"aa000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
  insert into public.fitness_metrics(user_id,device_id,window_start_ms,window_end_ms,collected_at_ms,steps)
    values ('aa000000-0000-0000-0000-00000000000a'::uuid,'da000000-0000-0000-0000-00000000000a'::uuid,7000,7999,7500,5);
  reset role;
  n := n+1; raise notice '5 PASSA  authenticated scrive la propria riga';

  -- 6. authenticated NON deve scrivere la riga di un altro.
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims',
      '{"sub":"aa000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
    insert into public.fitness_metrics(user_id,device_id,window_start_ms,window_end_ms,collected_at_ms,steps)
      values ('bb000000-0000-0000-0000-00000000000b'::uuid,'db000000-0000-0000-0000-00000000000b'::uuid,6000,6999,6500,5);
    reset role;
    raise exception '6 FALLISCE  A ha scritto una riga di B';
  exception when insufficient_privilege or check_violation then
    reset role; n := n+1; raise notice '6 PASSA  A non scrive righe di B';
  end;

  -- 7. authenticated NON deve modificare righe altrui.
  set local role authenticated;
  perform set_config('request.jwt.claims',
    '{"sub":"aa000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
  update public.fitness_metrics set steps = 99999
   where user_id = 'bb000000-0000-0000-0000-00000000000b'::uuid;
  get diagnostics v_n = row_count;
  reset role;
  if v_n <> 0 then raise exception '7 FALLISCE  A ha modificato % righe di B', v_n; end if;
  n := n+1; raise notice '7 PASSA  A non modifica righe di B (zero righe toccate)';

  -- 8. service_role deve continuare a funzionare: il percorso backend
  --    autorizzato non va rotto dall'hardening.
  set local role service_role;
  perform set_config('request.jwt.claims','',true);
  select count(*) into v_n from public.fitness_metrics;
  reset role;
  if v_n < 2 then raise exception '8 FALLISCE  service_role legge solo % righe', v_n; end if;
  n := n+1; raise notice '8 PASSA  service_role legge tutto (% righe)', v_n;

  raise notice 'accesso anonimo: % controlli, tutti verdi.', n;
  raise exception 'ANNULLA_FIXTURE';
exception when others then
  if sqlerrm <> 'ANNULLA_FIXTURE' then raise; end if;
  raise notice 'fixture annullata: nessun residuo';
end $$;
