-- ============================================================================
-- RIACQUISIZIONE DI UNA TOMBSTONE — INC-APPLE-RESTORE-190-OWNER-DELETED
--
-- Prima di questa correzione, cancellare il proprio account bruciava per
-- sempre un Lifetime gia' pagato: il claim diventava una tombstone
-- (`owner_user_id` NULL, `anonymized_at` valorizzato) e ogni ripristino
-- successivo riceveva `owned_by_other_user` -> HTTP 409.
--
-- Qui si prova che l'unica porta aperta e' quella giusta, e che tutte le
-- altre restano chiuse. Tutto in transazione chiusa da ROLLBACK.
--
-- I casi 4 (JWS non valido -> nessuna chiamata alla RPC) e 7 (due reclaim
-- concorrenti) NON stanno qui: il primo e' una proprieta' della route e vive
-- in `lib/billing/*.test.ts`, il secondo ha bisogno di due sessioni vere e
-- vive in `95-riacquisizione-corsa.sh`. Metterli qui significherebbe fingere
-- di provarli.
-- ============================================================================

\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email, created_at) values
  ('00000000-0000-4000-8000-0000000b0001', 'tomb-vecchio@test.local',  now() - interval '400 days'),
  ('00000000-0000-4000-8000-0000000b0002', 'tomb-nuovo@test.local',    now() - interval '400 days'),
  ('00000000-0000-4000-8000-0000000b0003', 'tomb-estraneo@test.local', now() - interval '400 days'),
  ('00000000-0000-4000-8000-0000000b0004', 'tomb-legacy@test.local',   now() - interval '400 days');

do $$
declare
  vecchio   constant uuid := '00000000-0000-4000-8000-0000000b0001';
  nuovo     constant uuid := '00000000-0000-4000-8000-0000000b0002';
  estraneo  constant uuid := '00000000-0000-4000-8000-0000000b0003';
  legacy    constant uuid := '00000000-0000-4000-8000-0000000b0004';
  tx        constant text := '5000000000000001';
  tx_altra  constant text := '5000000000000002';
  lifetime  constant timestamptz := '9999-12-31T23:59:59Z';
  v jsonb;
  n int;
  s text;
  t timestamptz;
  passati int := 0;
begin
  -- ── Attrezzatura: un acquisto vero, poi la cancellazione dell'account ────
  v := public.claim_store_purchase(
    'apple_iap', tx, vecchio, 'fitmesh_pro_lifetime', 'lifetime', 'production',
    'active', lifetime, false, now() - interval '6 hours', 'apple_signed_date',
    tx, null);   -- legacy: nessun appAccountToken, e' il perimetro della 190
  if v->>'outcome' <> 'claimed' then
    raise exception 'attrezzatura: primo acquisto non riuscito, %', v;
  end if;
  select claimed_at into t from private.billing_purchase_claims
   where billing_source='apple_iap' and ownership_key=tx;

  delete from auth.users where id = vecchio;

  select count(*) into n from private.billing_purchase_claims
   where billing_source='apple_iap' and ownership_key=tx
     and owner_user_id is null and anonymized_at is not null;
  if n <> 1 then
    raise exception 'attrezzatura: la cancellazione non ha prodotto una tombstone (n=%)', n;
  end if;

  -- ── 2. Un proprietario VIVO non viene mai scavalcato ─────────────────────
  -- Prima della tombstone: `estraneo` prova a prendersi una transazione di
  -- `nuovo`. Deve fallire, e questo ramo non e' stato toccato.
  v := public.claim_store_purchase(
    'apple_iap', tx_altra, nuovo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
    'active', lifetime, false, now(), 'apple_signed_date', tx_altra, nuovo);
  if v->>'outcome' <> 'claimed' then raise exception '2: setup fallito, %', v; end if;

  v := public.claim_store_purchase(
    'apple_iap', tx_altra, estraneo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
    'active', lifetime, false, now(), 'apple_signed_date', tx_altra, estraneo);
  if v->>'outcome' <> 'owned_by_other_user' then
    raise exception '2: un proprietario vivo e stato scavalcato: %', v;
  end if;
  if (v->>'ownerDeleted')::boolean then
    raise exception '2: ownerDeleted vero su un proprietario vivo: %', v;
  end if;
  passati := passati + 1;

  -- ── 1. Tombstone + presentazione valida -> nuovo proprietario e Lifetime ─
  v := public.claim_store_purchase(
    'apple_iap', tx, nuovo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
    'active', lifetime, false, now(), 'apple_signed_date', tx, null);
  if v->>'outcome' <> 'reclaimed_after_owner_deletion' then
    raise exception '1: riacquisizione non riuscita: %', v;
  end if;
  select owner_user_id::text, anonymized_at into s, t
    from private.billing_purchase_claims
   where billing_source='apple_iap' and ownership_key=tx;
  if s <> nuovo::text then raise exception '1: proprietario sbagliato: %', s; end if;
  if t is not null then raise exception '1: anonymized_at non azzerato: %', t; end if;
  passati := passati + 1;

  -- ── 10. La proiezione produce ESATTAMENTE una riga, ed e' Lifetime ───────
  select count(*) into n from public.b2c_subscriptions where user_id = nuovo;
  if n <> 1 then raise exception '10: righe proiettate per il nuovo proprietario: %', n; end if;
  select state, active_until into s, t from public.b2c_subscriptions where user_id = nuovo;
  if s <> 'active' or t <> lifetime then
    raise exception '10: proiezione non Lifetime attivo (stato=% fino=%)', s, t;
  end if;
  passati := passati + 1;

  -- ── 8. Ritentare e' idempotente ─────────────────────────────────────────
  v := public.claim_store_purchase(
    'apple_iap', tx, nuovo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
    'active', lifetime, false, now(), 'apple_signed_date', tx, null);
  if v->>'outcome' <> 'already_owned_by_same_user' then
    raise exception '8: il retry non e idempotente: %', v;
  end if;
  select count(*) into n from private.billing_riacquisizioni
   where ownership_key = tx;
  if n <> 1 then raise exception '8: il retry ha duplicato la riga di audit (n=%)', n; end if;
  select count(*) into n from public.b2c_subscriptions where user_id = nuovo;
  if n <> 1 then raise exception '8: il retry ha duplicato la proiezione (n=%)', n; end if;
  passati := passati + 1;

  -- ── 9. L'audit c'e', ed e' privo di segreti ─────────────────────────────
  select count(*) into n from private.billing_riacquisizioni
   where ownership_key = tx and nuovo_proprietario = nuovo
     and tombstone_anonimizzata_at is not null;
  if n <> 1 then raise exception '9: audit della riacquisizione assente o doppio (n=%)', n; end if;
  -- La tabella non ha colonne che possano contenere email, Order ID o JWS.
  select string_agg(column_name, ',' order by ordinal_position) into s
    from information_schema.columns
   where table_schema='private' and table_name='billing_riacquisizioni';
  if s <> 'id,billing_source,ownership_key,nuovo_proprietario,claim_originale_at,tombstone_anonimizzata_at,riacquisito_at' then
    raise exception '9: lo schema dell audit e cambiato senza che il test lo sappia: %', s;
  end if;
  passati := passati + 1;

  -- ── 3. Una chiave diversa non riacquisisce niente ───────────────────────
  -- `estraneo` presenta una transazione che NON e' la tombstone: nasce un
  -- claim nuovo, e la tombstone non viene toccata.
  v := public.claim_store_purchase(
    'apple_iap', '5000000000000009', estraneo, 'fitmesh_pro_lifetime', 'lifetime',
    'production', 'active', lifetime, false, now(), 'apple_signed_date',
    '5000000000000009', estraneo);
  if v->>'outcome' <> 'claimed' then raise exception '3: esito inatteso: %', v; end if;
  select owner_user_id::text into s from private.billing_purchase_claims
   where billing_source='apple_iap' and ownership_key=tx;
  if s <> nuovo::text then raise exception '3: la tombstone e stata toccata da unaltra chiave'; end if;
  passati := passati + 1;

  -- ── 6. appAccountToken discordante -> rifiuto ───────────────────────────
  -- Il vincolo esisteva gia' e vale anche sul ramo nuovo: si prova che il
  -- ramo di riacquisizione non lo aggira.
  begin
    v := public.claim_store_purchase(
      'apple_iap', tx, estraneo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
      'active', lifetime, false, now(), 'apple_signed_date', tx, nuovo);
    raise exception '6: appAccountToken discordante accettato: %', v;
  exception when sqlstate '22023' then
    passati := passati + 1;
  end;

  -- ── 4b. PERIMETRO: con `appAccountToken` la porta resta CHIUSA ──────────
  -- Un acquisto fatto da una build che imposta il token non e' recuperabile
  -- cosi', e non deve esserlo: dopo una nuova registrazione il JWS porta
  -- ancora l'UUID del vecchio account, e la route lo respinge prima di
  -- arrivare qui. La 190 recupera la classe legacy, non ogni cancellazione.
  declare tx_tok constant text := '5000000000000044';
  begin
    v := public.claim_store_purchase(
      'apple_iap', tx_tok, nuovo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
      'active', lifetime, false, now() - interval '4 hours', 'apple_signed_date',
      tx_tok, nuovo);
    if v->>'outcome' <> 'claimed' then raise exception '4b: setup fallito, %', v; end if;
    delete from auth.users where id = nuovo;
    -- `estraneo` presenta la stessa transazione col PROPRIO token: fuori
    -- perimetro, quindi rifiuto.
    v := public.claim_store_purchase(
      'apple_iap', tx_tok, estraneo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
      'active', lifetime, false, now(), 'apple_signed_date', tx_tok, estraneo);
    if v->>'outcome' <> 'owned_by_other_user' then
      raise exception '4b: una tombstone CON appAccountToken e stata riacquisita: %', v;
    end if;
    if not (v->>'ownerDeleted')::boolean then
      raise exception '4b: ownerDeleted dovrebbe essere vero';
    end if;
    passati := passati + 1;
  end;

  -- ── 11. Una seconda cancellazione ritorna una tombstone coerente ────────
  select count(*) into n from private.billing_purchase_claims
   where billing_source='apple_iap' and ownership_key=tx
     and owner_user_id is null and anonymized_at is not null
     and app_account_token is null;
  if n <> 1 then raise exception '11: la seconda cancellazione non ha prodotto una tombstone (n=%)', n; end if;
  passati := passati + 1;

  if passati <> 9 then
    raise exception 'attesi 9 casi in questo blocco, passati %', passati;
  end if;
  raise notice '94: 9 casi passati (1,2,3,4b,6,8,9,10,11)';
end;
$$;

-- ── 5. Un acquisto revocato o rimborsato non concede niente ─────────────────
do $$
declare
  tizio    constant uuid := '00000000-0000-4000-8000-0000000b0003';
  tx_revoc constant text := '5000000000000011';
  lifetime constant timestamptz := '9999-12-31T23:59:59Z';
  v jsonb;
  n int;
begin
  -- Acquisto, cancellazione del proprietario, revoca registrata, poi
  -- riacquisizione: la tombstone risale, ma il diritto no.
  insert into auth.users (id, email, created_at)
    values ('00000000-0000-4000-8000-0000000b0005', 'tomb-revoc@test.local', now() - interval '400 days');
  v := public.claim_store_purchase(
    'apple_iap', tx_revoc, '00000000-0000-4000-8000-0000000b0005', 'fitmesh_pro_lifetime',
    'lifetime', 'production', 'active', lifetime, false, now() - interval '3 hours',
    'apple_signed_date', tx_revoc, null);
  if v->>'outcome' <> 'claimed' then raise exception '5: setup fallito, %', v; end if;

  perform public.record_store_purchase_revocation(
    'apple_iap', tx_revoc, 'fitmesh_pro_lifetime', 'lifetime',
    now() - interval '1 hour', 'apple_signed_date', now() - interval '1 hour');

  delete from auth.users where id = '00000000-0000-4000-8000-0000000b0005';

  v := public.claim_store_purchase(
    'apple_iap', tx_revoc, tizio, 'fitmesh_pro_lifetime', 'lifetime', 'production',
    'active', lifetime, false, now(), 'apple_signed_date', tx_revoc, null);

  select count(*) into n from public.b2c_subscriptions
   where user_id = tizio and external_subscription_id = tx_revoc
     and state in ('active','grace');
  if n <> 0 then
    raise exception '5: un acquisto revocato ha concesso un diritto (esito=%)', v;
  end if;
  -- La riacquisizione DEVE essere avvenuta: se fosse stata rifiutata a monte
  -- questo caso passerebbe per la ragione sbagliata, senza mai arrivare alla
  -- revoca che vuole misurare.
  if v->>'outcome' <> 'reclaimed_after_owner_deletion' then
    raise exception '5: il caso non ha esercitato la riacquisizione (esito=%)', v->>'outcome';
  end if;
  raise notice '5: revocato -> nessun diritto (esito %)', v->>'outcome';
end;
$$;

-- ── 12. La riga legacy gia' recuperata a mano resta intatta ─────────────────
do $$
declare
  legacy constant uuid := '00000000-0000-4000-8000-0000000b0004';
  n int; s text; t timestamptz;
begin
  -- Riga com'e' in produzione per il cliente del 28/08: nessun claim nel
  -- registro, `external_subscription_id` che NON e' una chiave sandbox.
  perform pg_catalog.set_config('billing.projection', 'on', true);
  insert into public.b2c_subscriptions
    (user_id, billing_source, external_product_id, external_subscription_id,
     active_until, auto_renewing, state, raw_payload)
  values (legacy, 'apple_iap', 'fitmesh_pro_lifetime',
          'manual-inc-apple-purchase-189-live-20260831',
          '9999-12-31T23:59:59Z', false, 'active',
          '{"incidente":"INC-APPLE-PURCHASE-189-LIVE"}'::jsonb);
  perform pg_catalog.set_config('billing.projection', 'off', true);

  -- La proiezione canonica gira per quell'utente: non ha claim, quindi cade
  -- nel ramo `no_commercial_purchase`, che tocca SOLO le righe `sandbox:%`.
  perform private._billing_project_entitlement(legacy);

  select count(*) into n from public.b2c_subscriptions where user_id = legacy;
  if n <> 1 then raise exception '12: la riga legacy e stata duplicata o rimossa (n=%)', n; end if;
  select state, active_until into s, t from public.b2c_subscriptions where user_id = legacy;
  if s <> 'active' or t <> '9999-12-31T23:59:59Z'::timestamptz then
    raise exception '12: la riga legacy e stata degradata (stato=% fino=%)', s, t;
  end if;
  raise notice '12: la riga legacy del 28/08 resta Lifetime attiva e unica';
end;
$$;

-- ── 4a. Nessun client puo' chiamare la RPC scavalcando la verifica ─────────
-- Il caso 4 pieno («JWS non valido -> nessuna chiamata alla RPC») e' una
-- proprieta' dell'ORDINE dentro la route, e si prova li'. Qui si prova la
-- meta' strutturale, che e' quella che nessuno puo' aggirare: la funzione non
-- e' eseguibile da un client. Chi arriva a `claim_store_purchase` e' passato
-- dal backend, e il backend verifica il JWS prima.
do $$
declare r text; puo boolean;
begin
  foreach r in array array['anon','authenticated'] loop
    select has_function_privilege(r,
      'public.claim_store_purchase(text,text,uuid,text,text,text,text,timestamptz,boolean,timestamptz,text,text,uuid)',
      'execute') into puo;
    if puo then
      raise exception '4a: il ruolo % puo eseguire claim_store_purchase: un client potrebbe reclamare senza JWS', r;
    end if;
  end loop;
  if not has_function_privilege('service_role',
      'public.claim_store_purchase(text,text,uuid,text,text,text,text,timestamptz,boolean,timestamptz,text,text,uuid)',
      'execute') then
    raise exception '4a: nemmeno service_role puo chiamarla: il percorso canonico e rotto';
  end if;
  raise notice '4a: la RPC e riservata a service_role (anon e authenticated esclusi)';
end;
$$;

-- ── 2b. ATOMICITA': se la proiezione fallisce, non resta NIENTE ────────────
--
-- La riacquisizione scrive tre cose — claim riassegnato, audit, stato — e poi
-- proietta l'entitlement. Se la proiezione fallisce e l'esito diventa
-- `persistence_failed`, la frase «non e' stato scritto niente» deve restare
-- vera anche per la riacquisizione. Nella prima stesura UPDATE e audit
-- stavano FUORI dal blocco con l'handler e sopravvivevano al fallimento.
--
-- Si forza l'errore sostituendo la proiezione: dentro questa transazione la
-- sostituzione e' reversibile come tutto il resto.
insert into auth.users (id, email, created_at) values
  ('00000000-0000-4000-8000-0000000b0006', 'atom-vecchio@test.local', now() - interval '400 days'),
  ('00000000-0000-4000-8000-0000000b0007', 'atom-nuovo@test.local',   now() - interval '400 days');

do $$
declare v jsonb;
begin
  v := public.claim_store_purchase(
    'apple_iap', '5000000000000033', '00000000-0000-4000-8000-0000000b0006',
    'fitmesh_pro_lifetime', 'lifetime', 'production', 'active',
    '9999-12-31T23:59:59Z', false, now() - interval '5 hours',
    'apple_signed_date', '5000000000000033', null);
  if v->>'outcome' <> 'claimed' then raise exception '2b: setup fallito, %', v; end if;
  delete from auth.users where id = '00000000-0000-4000-8000-0000000b0006';
end;
$$;

create or replace function private._billing_project_entitlement(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  raise exception 'proiezione rotta di proposito (test 2b)' using errcode = 'XX000';
end;
$$;

do $$
declare
  nuovo constant uuid := '00000000-0000-4000-8000-0000000b0007';
  tx    constant text := '5000000000000033';
  v jsonb; n int; s text; t timestamptz;
begin
  v := public.claim_store_purchase(
    'apple_iap', tx, nuovo, 'fitmesh_pro_lifetime', 'lifetime', 'production',
    'active', '9999-12-31T23:59:59Z', false, now(), 'apple_signed_date', tx, null);

  if v->>'outcome' <> 'persistence_failed' then
    raise exception '2b: atteso persistence_failed, ottenuto %', v;
  end if;

  select owner_user_id::text, anonymized_at into s, t
    from private.billing_purchase_claims
   where billing_source='apple_iap' and ownership_key=tx;
  if s is not null then
    raise exception '2b: il claim e stato riassegnato nonostante il fallimento (proprietario=%)', s;
  end if;
  if t is null then
    raise exception '2b: la tombstone e stata sciolta nonostante il fallimento';
  end if;

  select count(*) into n from private.billing_riacquisizioni where ownership_key = tx;
  if n <> 0 then raise exception '2b: audit scritto nonostante il fallimento (n=%)', n; end if;

  select count(*) into n from public.b2c_subscriptions where user_id = nuovo;
  if n <> 0 then raise exception '2b: entitlement proiettato nonostante il fallimento (n=%)', n; end if;

  raise notice '2b: proiezione fallita -> claim ancora tombstone, zero audit, zero diritto';
end;
$$;

rollback;
