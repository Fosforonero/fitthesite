-- ============================================================================
-- FINESTRE DI CRASH — la parte che il database può dimostrare
--
-- Le dieci finestre sono elencate e argomentate in
-- supabase/rollback/README-finestre-di-crash.md. Cinque di esse vivono dentro
-- il database o si osservano da qui, e sono quelle che questo file esercita
-- invece di raccontare.
--
-- Gli stati ammessi sono TRE, e sono gli unici:
--
--   A  transazione aperta, nessun diritto   -> lo store la ripresenta, si ripara
--   B  transazione aperta, diritto concesso -> si chiude al giro successivo
--   C  transazione chiusa, diritto concesso -> stato finale corretto
--
-- I due che non devono MAI verificarsi:
--
--   X  transazione chiusa senza diritto     -> il cliente ha pagato e non ha niente
--   Y  diritto senza verifica dello store   -> abbiamo regalato Pro
--
-- Tutto in una transazione chiusa da ROLLBACK.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.mk_user(p_label text) returns uuid
language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (v, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', p_label || '-' || v::text || '@example.invalid', 'x',
          now(), now() - interval '400 days', now());
  return v;
end $$;

create or replace function pg_temp.claim(
  p_user uuid, p_key text, p_sku text default 'fitmesh_pro_lifetime',
  p_kind text default 'lifetime', p_state text default 'active',
  p_until timestamptz default '9999-12-31T23:59:59Z')
returns jsonb language plpgsql as $$
begin
  return public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => p_key,
    p_owner_user_id => p_user, p_external_product_id => p_sku,
    p_purchase_kind => p_kind, p_environment => 'production',
    p_state => p_state, p_active_until => p_until, p_auto_renewing => false,
    p_store_event_at => now(), p_store_event_source => 'apple_signed_date');
end $$;

/** Il diritto esiste, per questo utente, adesso? */
create or replace function pg_temp.ha_diritto(p_user uuid) returns boolean
language sql as $$
  select exists (
    select 1 from public.b2c_subscriptions t
    where t.user_id = p_user and t.state in ('active','grace')
      and t.active_until > now());
$$;

do $$
declare
  v_ok int := 0;
  v_ko int := 0;
  v_u uuid;
  v_r jsonb;
  v_n int;
begin
  -- ── F4. Crash DENTRO la RPC, dopo il claim e prima della proiezione ─────
  -- Non è simulabile con un kill di processo dentro una transazione, ma si
  -- riproduce la sua conseguenza esatta: la proiezione fallisce. Il claim
  -- appena creato deve sparire insieme a lei, altrimenti resterebbe una
  -- proprietà assegnata a chi non ha ricevuto il diritto — e quella persona
  -- non potrebbe nemmeno ritentare, perché la sua stessa transazione
  -- risulterebbe già consumata. È il caso peggiore possibile.
  v_u := pg_temp.mk_user('f4');
  declare
    v_altro uuid := pg_temp.mk_user('f4-legacy');
  begin
    -- Riga legacy senza proprietà, che occupa il valore che la proiezione
    -- vorrebbe scrivere: la collisione è reale, sul vincolo vero.
    perform set_config('billing.projection', 'on', true);
    insert into public.b2c_subscriptions (
      user_id, billing_source, external_product_id, external_subscription_id,
      active_until, auto_renewing, state)
    values (v_altro, 'apple_iap', 'fitmesh_pro_lifetime', '3000000000000004',
            '9999-12-31T23:59:59Z', false, 'active');
    perform set_config('billing.projection', 'off', true);
  end;

  v_r := pg_temp.claim(v_u, '3000000000000004');
  select count(*) into v_n from private.billing_purchase_claims
   where ownership_key = '3000000000000004' and owner_user_id = v_u;

  if v_r->>'outcome' = 'persistence_failed'
     and v_n = 0
     and not exists (select 1 from private.billing_purchase_states where ownership_key = '3000000000000004')
     and not pg_temp.ha_diritto(v_u) then
    v_ok := v_ok + 1;
    raise notice '   F4  claim senza proiezione -> stato A            OK   niente scritto, ritentabile';
  else
    v_ko := v_ko + 1;
    raise notice '   F4  claim senza proiezione                      KO   esito=% claim=%', v_r->>'outcome', v_n;
  end if;

  -- ── F5. Crash DOPO la proiezione e PRIMA del commit ────────────────────
  -- Distinta da F4: li' a fallire era la proiezione, qui va tutto bene e a
  -- mancare e' il commit. E' la finestra piu' facile da dare per scontata
  -- ("senza commit non esiste niente") e quella in cui una svista costerebbe
  -- di piu': se il claim sopravvivesse al rollback, quella transazione
  -- risulterebbe consumata da un utente che non ha ricevuto il diritto, e non
  -- potrebbe piu' essere reclamata da nessuno — nemmeno da lui.
  --
  -- Si riproduce con un SAVEPOINT: la RPC completa, scrive claim, stato e
  -- proiezione, e poi la transazione che la conteneva viene annullata.
  v_u := pg_temp.mk_user('f5');
  begin
    v_r := pg_temp.claim(v_u, '3000000000000005');
    if v_r->>'outcome' <> 'claimed' or not pg_temp.ha_diritto(v_u) then
      raise exception 'premessa F5 non valida: %', v_r->>'outcome';
    end if;
    -- Il processo muore qui, prima del COMMIT.
    raise exception 'crash simulato dopo la proiezione';
  exception
    when others then null;
  end;

  select count(*) into v_n from private.billing_purchase_claims
   where ownership_key = '3000000000000005';
  if v_n = 0
     and not exists (select 1 from private.billing_purchase_states where ownership_key = '3000000000000005')
     and not pg_temp.ha_diritto(v_u) then
    v_ok := v_ok + 1;
    raise notice '   F5  crash prima del commit -> stato A            OK   claim, stato e proiezione annullati insieme';
  else
    v_ko := v_ko + 1;
    raise notice '   F5  crash prima del commit                      KO   claim=% diritto=%', v_n, pg_temp.ha_diritto(v_u);
  end if;

  -- ── F6. La risposta si perde per strada ────────────────────────────────
  -- Il commit è avvenuto, il diritto esiste, ma il 200 non arriva al client
  -- (crash del processo, rete che cade, app uccisa). La transazione resta
  -- APERTA: stato B. Lo store la ripresenta, e la ripresentazione deve
  -- convergere a C senza creare niente di nuovo.
  v_u := pg_temp.mk_user('f6');
  v_r := pg_temp.claim(v_u, '3000000000000006');
  if v_r->>'outcome' <> 'claimed' or not pg_temp.ha_diritto(v_u) then
    v_ko := v_ko + 1;
    raise notice '   F6  premessa                                    KO';
  else
    -- Qui il client non ha visto niente. Riprova.
    v_r := pg_temp.claim(v_u, '3000000000000006');
    select count(*) into v_n from private.billing_purchase_claims
     where ownership_key = '3000000000000006';
    if v_r->>'outcome' = 'already_owned_by_same_user'
       and v_n = 1
       and (v_r->'entitlement'->>'state') = 'active'
       and pg_temp.ha_diritto(v_u) then
      v_ok := v_ok + 1;
      raise notice '   F6  risposta persa -> B, e la replay converge a C OK';
    else
      v_ko := v_ko + 1;
      raise notice '   F6  replay dopo risposta persa                  KO   esito=% claim=%', v_r->>'outcome', v_n;
    end if;
  end if;

  -- ── F7. Il client riceve 200 e muore prima di chiudere la transazione ───
  -- Identico a F6 dal lato server, ma con una differenza che conta: il
  -- diritto c'è GIÀ. La ripresentazione non deve toglierlo né duplicarlo, e
  -- soprattutto non deve rispondere "conflitto" all'utente che ne è titolare.
  v_u := pg_temp.mk_user('f7');
  perform pg_temp.claim(v_u, '3000000000000007');
  for v_n in 1..3 loop
    v_r := pg_temp.claim(v_u, '3000000000000007');
    if v_r->>'outcome' <> 'already_owned_by_same_user' then
      v_ko := v_ko + 1;
      raise notice '   F7  ripresentazione numero %                    KO   %', v_n, v_r->>'outcome';
      exit;
    end if;
  end loop;
  if pg_temp.ha_diritto(v_u) then
    v_ok := v_ok + 1;
    raise notice '   F7  tre ripresentazioni -> sempre C              OK';
  else
    v_ko := v_ko + 1;
    raise notice '   F7  tre ripresentazioni                          KO   diritto perso';
  end if;

  -- ── F10. Crash con evidenza VECCHIA in coda ────────────────────────────
  -- Una richiesta partita prima di una revoca arriva dopo. Non deve
  -- resuscitare il diritto: sarebbe lo stato Y, cioè Pro senza una verifica
  -- store che lo sostenga oggi.
  v_u := pg_temp.mk_user('f10');
  perform public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '3000000000000010',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false, p_store_event_at => now() - interval '2 hours',
    p_store_event_source => 'apple_signed_date');
  perform public.record_store_purchase_revocation(
    'apple_iap', '3000000000000010', 'fitmesh_pro_lifetime', 'lifetime',
    now() - interval '1 hour', 'apple_signed_date');

  -- La richiesta rimasta in coda, con l'evidenza di due ore fa.
  v_r := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '3000000000000010',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false, p_store_event_at => now() - interval '2 hours',
    p_store_event_source => 'apple_signed_date');

  if (v_r->>'stateApplied')::boolean = false and not pg_temp.ha_diritto(v_u) then
    v_ok := v_ok + 1;
    raise notice '   F10 evidenza vecchia dopo revoca -> resta A      OK   nessun Pro resuscitato';
  else
    v_ko := v_ko + 1;
    raise notice '   F10 evidenza vecchia dopo revoca                KO   applied=% diritto=%',
      v_r->>'stateApplied', pg_temp.ha_diritto(v_u);
  end if;

  -- ── Lo stato Y non è raggiungibile da qui, per costruzione ─────────────
  -- Nessun diritto può esistere senza una riga di stato, che a sua volta non
  -- può esistere senza una proprietà (chiave esterna), che a sua volta la
  -- scrive solo la RPC, che non verifica niente ma viene chiamata solo dopo
  -- la verifica. La catena si controlla qui invece di darla per buona.
  select count(*) into v_n
  from public.b2c_subscriptions t
  where t.billing_source in ('apple_iap','google_play')
    and not exists (
      select 1 from private.billing_purchase_claims c
      where c.billing_source = t.billing_source and c.owner_user_id = t.user_id);
  -- Le righe legacy seminate qui sopra sono l'eccezione nota: una sola.
  if v_n <= 1 then
    v_ok := v_ok + 1;
    raise notice '   Y   nessun diritto commerciale senza proprieta''  OK   (% legacy note)', v_n;
  else
    v_ko := v_ko + 1;
    raise notice '   Y   diritti commerciali senza proprieta''         KO   %', v_n;
  end if;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'finestre di crash: % casi falliti', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / finestre di crash: TRE STATI'
\echo '=================================================='
