-- ============================================================================
-- IL PERCORSO SANDBOX E' DI UNA PERSONA, NON DELL'AMBIENTE
--
-- Quello che questi casi difendono e' una cosa sola: una transazione Apple
-- Sandbox e' GRATUITA per chiunque abbia un Apple ID di test. Se il permesso
-- di presentarla fosse dell'ambiente, chiunque sapesse chiederlo avrebbe il Pro
-- a vita. Se e' della persona, e la persona la decide il server, no.
--
-- Ogni caso qui sotto e' un modo in cui quella difesa potrebbe cedere.
-- ============================================================================

\set ON_ERROR_STOP on
\timing off

do $$
declare
  v_utente uuid := '00000000-0000-4000-8000-00000000f001';
  v_altro  uuid := '00000000-0000-4000-8000-00000000f002';
  v_ok     boolean;
  v_errore text;
begin
  raise notice '################ SANDBOX: REVISORI AUTORIZZATI ################';

  delete from private.billing_sandbox_reviewers where user_id in (v_utente, v_altro);
  delete from auth.users where id in (v_utente, v_altro);
  insert into auth.users (id, email, created_at) values
    (v_utente, 'revisore@test.local', now()),
    (v_altro,  'nonrevisore@test.local', now());

  -- ── S1: chi non e' nell'elenco non e' autorizzato ────────────────────────
  select public.is_sandbox_reviewer(v_utente) into v_ok;
  if v_ok then
    raise exception 'S1 FAIL: un account mai iscritto risulta autorizzato';
  end if;
  raise notice 'S1 PASS: elenco vuoto, nessun permesso';

  -- ── S2: iscritto e non scaduto: autorizzato ──────────────────────────────
  insert into private.billing_sandbox_reviewers (user_id, note, expires_at)
  values (v_utente, 'revisione Apple build 190', now() + interval '14 days');

  select public.is_sandbox_reviewer(v_utente) into v_ok;
  if not v_ok then
    raise exception 'S2 FAIL: un revisore iscritto e valido non e'' autorizzato';
  end if;
  raise notice 'S2 PASS: il revisore iscritto e'' autorizzato';

  -- ── S3: il permesso e' SOLO suo ──────────────────────────────────────────
  -- Il difetto che questo esclude: un elenco letto come "esiste almeno un
  -- revisore?" invece che "questo utente e' un revisore?" aprirebbe la Sandbox
  -- a tutti nel momento in cui se ne autorizza uno.
  select public.is_sandbox_reviewer(v_altro) into v_ok;
  if v_ok then
    raise exception 'S3 FAIL: il permesso di un revisore vale anche per un altro account';
  end if;
  raise notice 'S3 PASS: il permesso non tracima su altri account';

  -- ── S4: scaduto = non autorizzato, senza bisogno di cancellare ───────────
  -- Un permesso senza scadenza sopravvive alla revisione che lo ha chiesto, e
  -- nessuno si ricorda di toglierlo: e' cosi' che un accesso temporaneo
  -- diventa una porta aperta.
  -- Si sposta indietro anche `created_at`: il vincolo pretende che la
  -- scadenza sia successiva alla creazione, e giustamente — una riga che nasce
  -- gia' scaduta e' un errore di chi la scrive, non uno stato da simulare.
  -- Qui si finge una riga VECCHIA, che e' il caso vero.
  update private.billing_sandbox_reviewers
     set created_at = now() - interval '30 days',
         expires_at = now() - interval '1 second'
   where user_id = v_utente;

  select public.is_sandbox_reviewer(v_utente) into v_ok;
  if v_ok then
    raise exception 'S4 FAIL: un permesso scaduto autorizza ancora';
  end if;
  raise notice 'S4 PASS: scaduto significa scaduto';

  -- ── S5: non si puo' iscrivere un permesso eterno ─────────────────────────
  begin
    insert into private.billing_sandbox_reviewers (user_id, note, expires_at)
    values (v_altro, 'permesso lungo', now() + interval '400 days');
    raise exception 'S5 FAIL: accettato un permesso di 400 giorni';
  exception
    when check_violation then
      raise notice 'S5 PASS: un permesso oltre i 90 giorni viene rifiutato';
  end;

  -- ── S6: la nota e' obbligatoria e non puo' essere fuffa ──────────────────
  -- Serve a chi trovera' la riga fra sei mesi e dovra' decidere se toglierla.
  begin
    insert into private.billing_sandbox_reviewers (user_id, note, expires_at)
    values (v_altro, '  ', now() + interval '7 days');
    raise exception 'S6 FAIL: accettata una nota vuota';
  exception
    when check_violation then
      raise notice 'S6 PASS: senza una nota leggibile non si iscrive nessuno';
  end;

  -- ── S7: la cancellazione dell'account porta via il permesso ──────────────
  update private.billing_sandbox_reviewers
     set created_at = now(),
         expires_at = now() + interval '7 days'
   where user_id = v_utente;
  delete from auth.users where id = v_utente;

  if exists (select 1 from private.billing_sandbox_reviewers where user_id = v_utente) then
    raise exception 'S7 FAIL: il permesso e'' sopravvissuto alla cancellazione dell''account';
  end if;
  raise notice 'S7 PASS: account cancellato, permesso sparito con lui';

  delete from private.billing_sandbox_reviewers where user_id in (v_utente, v_altro);
  delete from auth.users where id in (v_utente, v_altro);
end $$;

-- ── S8: il client non arriva a questa funzione ──────────────────────────────
-- Il permesso lo concede il server. Se `authenticated` potesse chiamarla, un
-- utente qualunque potrebbe almeno sondare chi e' autorizzato; e se potesse
-- leggere la tabella, avrebbe l'elenco.
do $$
declare v_grants int;
begin
  select count(*) into v_grants
  from information_schema.role_routine_grants
  where routine_schema = 'public'
    and routine_name = 'is_sandbox_reviewer'
    and grantee in ('anon', 'authenticated', 'PUBLIC');
  if v_grants > 0 then
    raise exception 'S8 FAIL: is_sandbox_reviewer e'' chiamabile dal client (% grant)', v_grants;
  end if;

  select count(*) into v_grants
  from information_schema.role_table_grants
  where table_schema = 'private'
    and table_name = 'billing_sandbox_reviewers'
    and grantee in ('anon', 'authenticated', 'PUBLIC');
  if v_grants > 0 then
    raise exception 'S8 FAIL: la tabella dei revisori e'' leggibile dal client (% grant)', v_grants;
  end if;

  raise notice 'S8 PASS: ne la funzione ne la tabella sono raggiungibili dal client';
end $$;

\echo ''
\echo '=================================================='
\echo 'SANDBOX REVISORI: il permesso e della persona, e scade'
\echo '=================================================='
