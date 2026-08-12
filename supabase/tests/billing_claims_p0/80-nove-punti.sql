-- ============================================================================
-- I NOVE PUNTI DEL CANCELLO DI RIPRESA — la parte che il database dimostra
--
-- supabase/rollback/README-checkpoint-pausa-billing.md elenca nove difetti noti
-- del disegno B', nessuno dei quali aveva un test. Questo file li esercita:
-- ognuno e' stato scritto ROSSO contro le funzioni gia' installate, e diventa
-- verde solo con 20260812093000_billing_p0_nove_punti.sql.
--
--   G4  in compatibility una scrittura commerciale sovrascrive un Founder
--   G6  la freschezza confronta orologi non equivalenti: una scrittura di
--       compatibilita' murata con l'orologio NOSTRO impedisce per sempre di
--       registrare l'evidenza vera di Apple
--   G5  la guardia si aggira cambiando billing_source, e non copre DELETE
--       ne' TRUNCATE
--   G2  strict controlla utente + sorgente, non la chiave esatta
--   Y   l'invariante finale, ricontrollata sulla chiave esatta invece che
--       sull'utente
--
-- L'ORDINE NON E' ARBITRARIO. G5 ha bisogno del modo strict, e il passaggio a
-- strict — dopo la correzione — si rifiuta se esiste anche una sola riga
-- scoperta. G2 semina di proposito la riga scoperta, quindi deve venire dopo.
-- Un file che li mettesse in ordine di numero non arriverebbe in fondo.
--
-- Gli altri punti stanno dove possono essere dimostrati davvero:
--   G1  35-backfill-fixtures.sh   (esegue il file di backfill vero)
--   G3  85-corsa-strict.sh        (serve una seconda connessione)
--   G7  route.test.ts             (la revoca non persistita e' HTTP)
--   G8  purchase-disposition.test.ts + il test di parita' col client
--   G9  90-finestre-di-crash.*    (le dieci, non cinque)
--
-- Tutto in una transazione chiusa da ROLLBACK: al termine il database e'
-- esattamente come prima.
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

/**
 * Scrive la proiezione COME LA SCRIVEVA IL BACKEND VECCHIO: upsert diretto su
 * user_id, senza passare dal registro e senza il parametro di sessione. E'
 * questa la scrittura che la guardia deve intercettare, quindi simularla in
 * altro modo renderebbe il test una descrizione invece di una prova.
 */
create or replace function pg_temp.scrittura_189(
  p_user uuid, p_source text, p_sub_id text,
  p_sku text default 'fitmesh_pro_lifetime',
  p_state text default 'active',
  p_until timestamptz default '9999-12-31T23:59:59Z')
returns void language plpgsql as $$
begin
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state)
  values (p_user, p_source, p_sku, p_sub_id, p_until, false, p_state)
  on conflict (user_id) do update set
    billing_source           = excluded.billing_source,
    external_product_id      = excluded.external_product_id,
    external_subscription_id = excluded.external_subscription_id,
    active_until             = excluded.active_until,
    auto_renewing            = excluded.auto_renewing,
    state                    = excluded.state;
end $$;

/**
 * Scrittura interna, quella che dichiara di venire dal registro. Iscrive anche
 * proprieta' e stato, perche' e' cio' che fa il percorso vero: la proiezione e'
 * derivata, non puo' esistere senza. Una fixture che scrivesse la sola
 * proiezione fabbricherebbe proprio la riga scoperta che l'invariante Y cerca,
 * e Y diventerebbe rosso per colpa della fixture.
 */
create or replace function pg_temp.scrittura_registro(
  p_user uuid, p_source text, p_sub_id text)
returns void language plpgsql as $$
begin
  insert into private.billing_purchase_claims (
    billing_source, ownership_key, external_product_id, owner_user_id, environment)
  values (p_source, p_sub_id, 'fitmesh_pro_lifetime', p_user, 'production')
  on conflict (billing_source, ownership_key) do nothing;

  insert into private.billing_purchase_states (
    billing_source, ownership_key, external_product_id, purchase_kind,
    state, active_until, auto_renewing, store_event_at, store_event_source)
  values (p_source, p_sub_id, 'fitmesh_pro_lifetime', 'lifetime',
          'active', '9999-12-31T23:59:59Z', false, now(),
          case when p_source = 'apple_iap' then 'apple_signed_date'
               else 'google_backend_fetch' end)
  on conflict (billing_source, ownership_key) do nothing;

  perform set_config('billing.projection', 'on', true);
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state)
  values (p_user, p_source, 'fitmesh_pro_lifetime', p_sub_id,
          '9999-12-31T23:59:59Z', false, 'active');
  perform set_config('billing.projection', 'off', true);
end $$;

do $$
declare
  v_ok int := 0;
  v_ko int := 0;
  v_u uuid;
  v_n int;
  v_txt text;
  v_r jsonb;
  v_passato boolean;
begin
  raise notice '';
  raise notice '################ I NOVE PUNTI: cio'' che il database dimostra ################';
  raise notice '';

  -- ══ G4. Il Founder sovrascritto da una scrittura commerciale ═════════════
  -- La difesa `billing_source <> 'founder_grant'` vive nella ON CONFLICT di
  -- _billing_project_entitlement. Il backend VECCHIO non passa di li': fa il
  -- suo upsert, la guardia in compatibility lo lascia completare, e un utente
  -- Founder diventa un utente apple_iap. Se poi quell'acquisto viene
  -- rimborsato, il Founder non torna: la sua riga non esiste piu'.
  v_u := pg_temp.mk_user('g4');
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state)
  values (v_u, 'founder_grant', 'founder', 'founder-' || v_u::text,
          '9999-12-31T23:59:59Z', false, 'active');

  perform pg_temp.scrittura_189(v_u, 'apple_iap', '4000000000000004');

  select billing_source into v_txt from public.b2c_subscriptions where user_id = v_u;
  select count(*) into v_n from private.billing_purchase_claims
   where billing_source = 'apple_iap' and ownership_key = '4000000000000004';

  if v_txt = 'founder_grant' and v_n = 1 then
    v_ok := v_ok + 1;
    raise notice '   G4  Founder intatto, e la proprieta'' registrata lo stesso        OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G4  Founder sovrascritto in compatibility                         KO   fonte=% claim=%', v_txt, v_n;
  end if;

  -- ══ G6. Due orologi diversi confrontati come se fossero uno ══════════════
  -- La guardia in compatibility scriveva lo stato con `store_event_at = now()`,
  -- cioe' il NOSTRO orologio, e lo dichiarava 'apple_request_date', cioe'
  -- l'orologio di Apple. Da quel momento l'evidenza vera — il signedDate di un
  -- acquisto fatto ieri — risultava piu' VECCHIA della fotografia inventata, e
  -- la regola del solo-in-avanti la rifiutava. Lo stato reale dell'acquisto non
  -- era piu' registrabile: ne' un rinnovo, ne' una scadenza, ne' un rimborso.
  v_u := pg_temp.mk_user('g6');
  perform pg_temp.scrittura_189(v_u, 'apple_iap', '4000000000000007');

  -- L'acquisto vero, firmato da Apple ieri.
  v_r := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '4000000000000007',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false,
    p_store_event_at => now() - interval '1 day',
    p_store_event_source => 'apple_signed_date');

  select store_event_source into v_txt from private.billing_purchase_states
   where billing_source = 'apple_iap' and ownership_key = '4000000000000007';

  if (v_r->>'stateApplied')::boolean and v_txt = 'apple_signed_date' then
    v_ok := v_ok + 1;
    raise notice '   G6  l''evidenza vera di Apple supera il segnaposto                 OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G6  l''evidenza vera respinta dal segnaposto                       KO   applied=% fonte=%',
      v_r->>'stateApplied', v_txt;
  end if;

  -- ══ G6b. Ma un segnaposto non deve poter sovrascrivere l'evidenza vera ═══
  -- La correzione di G6 apre una domanda simmetrica: se il segnaposto perde
  -- sempre, deve perdere anche DOPO. Una seconda scrittura di compatibilita'
  -- su un acquisto gia' verificato non deve cancellarne lo stato.
  perform pg_temp.scrittura_189(v_u, 'apple_iap', '4000000000000007',
                                'fitmesh_pro_lifetime', 'expired');
  select store_event_source into v_txt from private.billing_purchase_states
   where billing_source = 'apple_iap' and ownership_key = '4000000000000007';
  if v_txt = 'apple_signed_date' then
    v_ok := v_ok + 1;
    raise notice '   G6b un segnaposto non sovrascrive l''evidenza store                OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G6b il segnaposto ha cancellato l''evidenza store                  KO   fonte=%', v_txt;
  end if;

  -- ══ G6c. La RPC non accetta le fonti-segnaposto dai chiamanti ════════════
  -- Le due fonti nuove esistono per il backfill e per la compatibilita'. Se il
  -- backend potesse dichiararle, potrebbe scrivere uno stato che nessuna
  -- evidenza store sostiene e che non regredisce mai.
  v_u := pg_temp.mk_user('g6c');
  v_passato := true;
  begin
    perform public.claim_store_purchase(
      p_billing_source => 'apple_iap', p_ownership_key => '4000000000000008',
      p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
      p_purchase_kind => 'lifetime', p_environment => 'production',
      p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
      p_auto_renewing => false, p_store_event_at => now(),
      p_store_event_source => 'projection_backfill');
  exception when others then
    v_passato := false;
  end;
  if not v_passato then
    v_ok := v_ok + 1;
    raise notice '   G6c la RPC rifiuta una fonte-segnaposto dal chiamante             OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G6c il backend puo'' dichiarare una fonte-segnaposto               KO';
  end if;

  -- ══ R1. Una revoca in ritardo NON si scarta ══════════════════════════════
  -- Trovato dalla review avversariale. `apple_request_date` e
  -- `apple_signed_date` sono lo stesso orologio ma datano EVENTI DIVERSI:
  -- il primo e' quando abbiamo chiesto NOI (adesso), il secondo su una revoca
  -- e' quando APPLE ha deciso il rimborso, che e' sempre nel passato. Un
  -- lifetime validato dal ramo legacy e poi rimborsato produceva quindi una
  -- revoca piu' "vecchia" della validazione, scartata in silenzio: il cliente
  -- teneva il Pro di un acquisto gia' rimborsato, e la route rispondeva
  -- comunque il rifiuto TERMINALE, che chiude la transazione.
  v_u := pg_temp.mk_user('r1');
  perform public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '4000000000000020',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false, p_store_event_at => now(),
    p_store_event_source => 'apple_request_date');

  -- Apple ha deciso il rimborso TRE GIORNI FA; la fotografia che ce lo dice e'
  -- di adesso. Prima la route passava il revocationDate come orologio di
  -- ordinamento, e la revoca risultava sempre piu' vecchia della validazione
  -- che la precedeva: scartata in silenzio.
  v_r := public.record_store_purchase_revocation(
    'apple_iap', '4000000000000020', 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '10 seconds', 'apple_signed_date',
    now() - interval '3 days');

  select state into v_txt from private.billing_purchase_states
   where billing_source = 'apple_iap' and ownership_key = '4000000000000020';

  if v_txt = 'revoked'
     and (v_r->>'persisted')::boolean
     and v_r->>'outcome' = 'revoked'
     and not exists (select 1 from public.b2c_subscriptions t
                     where t.user_id = v_u and t.state in ('active','grace')) then
    v_ok := v_ok + 1;
    raise notice '   R1  revoca in ritardo registrata, e il Pro tolto            OK';
  else
    v_ko := v_ko + 1;
    raise notice '   R1  revoca in ritardo scartata                              KO   stato=% esito=%', v_txt, v_r->>'outcome';
  end if;

  -- ══ R1b. E una revoca gia' registrata resta persistita ═══════════════════
  -- `applied=false` non deve piu' essere ambiguo: qui significa "era gia'
  -- revocato", e il chiamante deve poterlo distinguere da "non ho scritto".
  v_r := public.record_store_purchase_revocation(
    'apple_iap', '4000000000000020', 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '10 seconds', 'apple_signed_date',
    now() - interval '3 days');
  if v_r->>'outcome' = 'revoked'
     and (v_r->>'persisted')::boolean
     and not (v_r->>'applied')::boolean then
    v_ok := v_ok + 1;
    raise notice '   R1b gia'' revocato: applied falso ma persisted vero          OK';
  else
    v_ko := v_ko + 1;
    raise notice '   R1b replay della revoca                                     KO   %', v_r::text;
  end if;

  -- ══ R1c. REFUND_REVERSED: l'accesso si ripristina ════════════════════════
  -- Apple prevede l'annullamento di un rimborso, e in quel caso l'accesso va
  -- ripristinato sullo STESSO originalTransactionId. `revoked` non puo' quindi
  -- essere assorbente: una fotografia JWS piu' recente senza revoca deve poter
  -- riattivare. E' il motivo per cui la freschezza e' il signedDate (la
  -- fotografia) e non il revocationDate (l'efficacia del rimborso).
  v_r := public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '4000000000000020',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false,
    p_store_event_at => now() + interval '1 minute',
    p_store_event_source => 'apple_signed_date');
  select state into v_txt from private.billing_purchase_states
   where billing_source = 'apple_iap' and ownership_key = '4000000000000020';
  if v_txt = 'active'
     and exists (select 1 from public.b2c_subscriptions t
                 where t.user_id = v_u and t.state = 'active') then
    v_ok := v_ok + 1;
    raise notice '   R1c REFUND_REVERSED ripristina l''accesso                   OK';
  else
    v_ko := v_ko + 1;
    raise notice '   R1c dopo una revoca l''accesso non torna piu''               KO   stato=%', v_txt;
  end if;

  -- ══ R1d. Ma una ricevuta legacy non annulla una revoca JWS ═══════════════
  -- verifyReceipt non porta l'informazione "il rimborso e' stato annullato":
  -- il suo request_date dice solo quando abbiamo chiesto. Da sola non deve
  -- poter resuscitare un acquisto che il JWS dichiara revocato.
  perform public.record_store_purchase_revocation(
    'apple_iap', '4000000000000020', 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '2 minutes', 'apple_signed_date',
    now() - interval '3 days');
  perform public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '4000000000000020',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false,
    p_store_event_at => now() + interval '3 minutes',
    p_store_event_source => 'apple_request_date');
  select state into v_txt from private.billing_purchase_states
   where billing_source = 'apple_iap' and ownership_key = '4000000000000020';
  if v_txt = 'revoked' then
    v_ok := v_ok + 1;
    raise notice '   R1d una ricevuta legacy non annulla una revoca JWS          OK';
  else
    v_ko := v_ko + 1;
    raise notice '   R1d la revoca JWS annullata da una ricevuta legacy          KO   stato=%', v_txt;
  end if;

  -- ══ R2. Un revocato non riemerge per una scrittura della 189 ═════════════
  -- La guardia consultava il registro solo per la PROPRIETA' e mai per lo
  -- stato: una singola UPSERT del backend vecchio riportava ad 'active' una
  -- riga che il registro dichiarava revocata. E durante la finestra di
  -- compatibilita' l'app legge proprio quella riga.
  perform pg_temp.scrittura_189(v_u, 'apple_iap', '4000000000000020');
  select state into v_txt from public.b2c_subscriptions where user_id = v_u;
  if v_txt <> 'active' then
    v_ok := v_ok + 1;
    raise notice '   R2  la 189 non fa riemergere un acquisto revocato           OK   proiettato "%"', v_txt;
  else
    v_ko := v_ko + 1;
    raise notice '   R2  un acquisto revocato torna Pro con una UPSERT           KO';
  end if;

  -- ══ R3. K1 revocato non porta via K2, che e' ancora valido ═══════════════
  -- La proiezione ha UNA riga per utente. Forzare la riga di K1 a 'expired'
  -- avrebbe preso il posto di K2 — un secondo acquisto dello stesso utente,
  -- ancora attivo. Ripresentare un acquisto rimborsato non deve poter togliere
  -- un diritto che il cliente ha davvero.
  v_u := pg_temp.mk_user('r3');
  perform public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '4000000000000030',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false, p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date');
  perform public.record_store_purchase_revocation(
    'apple_iap', '4000000000000030', 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '1 minute', 'apple_signed_date', now());
  -- K2: il secondo acquisto, sano.
  perform public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '4000000000000031',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false, p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date');

  -- La 189 ripresenta K1, che e' revocato.
  perform pg_temp.scrittura_189(v_u, 'apple_iap', '4000000000000030');
  select external_subscription_id || '/' || state into v_txt
    from public.b2c_subscriptions where user_id = v_u;
  if v_txt = '4000000000000031/active' then
    v_ok := v_ok + 1;
    raise notice '   R3  K1 revocato non porta via K2                            OK';
  else
    v_ko := v_ko + 1;
    raise notice '   R3  ripresentare K1 revocato ha cambiato la proiezione      KO   %', v_txt;
  end if;

  -- ══ R3b. E nemmeno un Founder ════════════════════════════════════════════
  v_u := pg_temp.mk_user('r3b');
  perform public.claim_store_purchase(
    p_billing_source => 'apple_iap', p_ownership_key => '4000000000000032',
    p_owner_user_id => v_u, p_external_product_id => 'fitmesh_pro_lifetime',
    p_purchase_kind => 'lifetime', p_environment => 'production',
    p_state => 'active', p_active_until => '9999-12-31T23:59:59Z',
    p_auto_renewing => false, p_store_event_at => now(),
    p_store_event_source => 'apple_signed_date');
  perform public.record_store_purchase_revocation(
    'apple_iap', '4000000000000032', 'fitmesh_pro_lifetime', 'lifetime',
    now() + interval '1 minute', 'apple_signed_date', now());
  perform set_config('billing.projection', 'on', true);
  update public.b2c_subscriptions
     set billing_source = 'founder_grant', external_product_id = 'founder',
         external_subscription_id = 'founder-' || v_u::text,
         state = 'active', active_until = '9999-12-31T23:59:59Z'
   where user_id = v_u;
  perform set_config('billing.projection', 'off', true);

  perform pg_temp.scrittura_189(v_u, 'apple_iap', '4000000000000032');
  select billing_source into v_txt from public.b2c_subscriptions where user_id = v_u;
  if v_txt = 'founder_grant' then
    v_ok := v_ok + 1;
    raise notice '   R3b K1 revocato non porta via un Founder                    OK';
  else
    v_ko := v_ko + 1;
    raise notice '   R3b il Founder e'' stato sostituito                          KO   fonte=%', v_txt;
  end if;

  -- ══ G5. La guardia, nei quattro modi in cui si aggirava ══════════════════
  -- Da qui in strict. Il passaggio stesso e' una prova: dopo la correzione si
  -- rifiuta se qualcosa e' scoperto, e a questo punto del file non lo e'.
  perform private.set_billing_projection_guard_mode('strict', 'test G5');

  -- G5a. Fonte non commerciale inventata. La guardia usciva subito per
  -- qualunque billing_source diverso da apple_iap/google_play. 'stripe' e'
  -- ammesso dal CHECK della proiezione, non ha alcun percorso nel prodotto, e
  -- il contratto di entitlement NON lo esclude: una riga stripe attiva concede
  -- Pro senza che nessuno store l'abbia verificata. E' lo stato Y, raggiunto
  -- scrivendo una parola diversa.
  v_u := pg_temp.mk_user('g5a');
  v_passato := true;
  begin
    perform pg_temp.scrittura_189(v_u, 'stripe', 'stripe-inventato-' || v_u::text);
  exception when others then
    v_passato := false;
  end;
  if not v_passato then
    v_ok := v_ok + 1;
    raise notice '   G5a fonte non commerciale inventata rifiutata in strict           OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G5a "stripe" concede Pro senza registro, in strict                KO';
  end if;

  -- G5b. Riciclaggio: da commerciale a non commerciale. Una riga apple_iap
  -- gia' proiettata viene aggiornata dichiarando billing_source='trial'. La
  -- guardia usciva prima di guardare cosa c'era, e la riga usciva dal
  -- perimetro del registro: da quel momento nessun controllo di copertura la
  -- vedeva piu'.
  v_u := pg_temp.mk_user('g5b');
  perform pg_temp.scrittura_registro(v_u, 'apple_iap', '4000000000000005');
  v_passato := true;
  begin
    update public.b2c_subscriptions set billing_source = 'trial' where user_id = v_u;
  exception when others then
    v_passato := false;
  end;
  if not v_passato then
    v_ok := v_ok + 1;
    raise notice '   G5b commerciale -> non commerciale rifiutato                      OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G5b una riga commerciale esce dal perimetro con una UPDATE        KO';
  end if;

  -- G5c. DELETE non era coperta. Il trigger era `before insert or update`.
  -- Cancellare la riga di proiezione di un acquisto pagato toglie il Pro a chi
  -- lo ha comprato, e fa anche PASSARE il controllo di copertura: le righe
  -- scoperte si contano su b2c_subscriptions, e una riga cancellata non si
  -- conta.
  v_u := pg_temp.mk_user('g5c');
  perform pg_temp.scrittura_registro(v_u, 'apple_iap', '4000000000000006');
  v_passato := true;
  begin
    delete from public.b2c_subscriptions where user_id = v_u;
  exception when others then
    v_passato := false;
  end;
  if not v_passato then
    v_ok := v_ok + 1;
    raise notice '   G5c DELETE fuori dal registro rifiutata                           OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G5c la proiezione di un acquisto pagato si cancella               KO';
  end if;

  -- G5c-bis. Ma la cancellazione dell'account deve continuare a funzionare.
  -- La riga di proiezione sparisce per CASCADE dalla FK verso profiles:
  -- bloccarla per difendere il registro sarebbe la gerarchia di priorita'
  -- sbagliata, ed e' lo stesso ragionamento gia' fatto per il registro stesso.
  v_u := pg_temp.mk_user('g5c2');
  perform pg_temp.scrittura_registro(v_u, 'apple_iap', '4000000000000009');
  v_passato := true;
  begin
    delete from auth.users where id = v_u;
  exception when others then
    v_passato := false;
  end;
  select count(*) into v_n from public.b2c_subscriptions where user_id = v_u;
  if v_passato and v_n = 0 then
    v_ok := v_ok + 1;
    raise notice '   G5c2 la cancellazione account resta possibile (CASCADE)           OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G5c2 la guardia BLOCCA la cancellazione account                   KO   riuscita=% righe=%', v_passato, v_n;
  end if;

  -- G5d. TRUNCATE non era coperta. I trigger di riga non la intercettano, e
  -- svuotare la proiezione significa togliere il Pro a tutti in una sola
  -- istruzione. Il registro ha gia' questa difesa; la proiezione no.
  v_passato := true;
  begin
    truncate table public.b2c_subscriptions;
  exception when others then
    v_passato := false;
  end;
  if not v_passato then
    v_ok := v_ok + 1;
    raise notice '   G5d TRUNCATE della proiezione rifiutata                           OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G5d la proiezione si svuota con una TRUNCATE                      KO';
  end if;

  perform private.set_billing_projection_guard_mode('compatibility', 'ripristino test');

  -- ══ G2. strict accetta una copertura che non copre ═══════════════════════
  -- Il conteggio delle righe scoperte chiedeva "esiste un claim di questa
  -- sorgente intestato a questo utente?". Non chiedeva se fosse il claim di
  -- QUESTA transazione. Un utente che possiede un acquisto Apple e ne ha in
  -- proiezione un SECONDO, mai registrato, risultava coperto: strict veniva
  -- concesso, e la finestra dichiarata chiusa mentre era aperta.
  v_u := pg_temp.mk_user('g2');
  perform set_config('billing.projection', 'on', true);
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    active_until, auto_renewing, state)
  values (v_u, 'apple_iap', 'fitmesh_pro_lifetime', '4000000000000002',
          '9999-12-31T23:59:59Z', false, 'active');
  perform set_config('billing.projection', 'off', true);
  -- Nel registro esiste solo K1, dello stesso utente e dello stesso store.
  insert into private.billing_purchase_claims (
    billing_source, ownership_key, external_product_id, owner_user_id, environment)
  values ('apple_iap', '4000000000000001', 'fitmesh_pro_lifetime', v_u, 'production');
  insert into private.billing_purchase_states (
    billing_source, ownership_key, external_product_id, purchase_kind,
    state, active_until, auto_renewing, store_event_at, store_event_source)
  values ('apple_iap', '4000000000000001', 'fitmesh_pro_lifetime', 'lifetime',
          'active', '9999-12-31T23:59:59Z', false, now(), 'apple_signed_date');

  v_passato := true;
  begin
    perform private.set_billing_projection_guard_mode('strict', 'test G2');
  exception when others then
    v_passato := false;
  end;

  if not v_passato then
    v_ok := v_ok + 1;
    raise notice '   G2  strict rifiutato: la chiave in proiezione non e'' registrata   OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G2  strict CONCESSO con la chiave sbagliata                       KO';
  end if;

  -- ══ G2b. E strict si rifiuta anche per una proprieta' senza stato ════════
  -- Un claim senza riga di stato e' invisibile al ricalcolo, che entra da
  -- billing_purchase_states. E' esattamente cio' che il backfill produceva
  -- (punto 1): acquisti "coperti" che al primo ricalcolo non risultano
  -- esistere. Il cancello deve vederlo.
  v_u := pg_temp.mk_user('g2b');
  insert into private.billing_purchase_claims (
    billing_source, ownership_key, external_product_id, owner_user_id, environment)
  values ('apple_iap', '4000000000000003', 'fitmesh_pro_lifetime', v_u, 'production');
  begin
    perform private.set_billing_projection_guard_mode('strict', 'test G2b');
    v_passato := true;
  exception when others then
    v_passato := false;
    v_txt := sqlerrm;
  end;
  if not v_passato and v_txt like '%senza stato%' then
    v_ok := v_ok + 1;
    raise notice '   G2b strict rifiutato: proprieta'' senza stato, invisibile          OK';
  else
    v_ko := v_ko + 1;
    raise notice '   G2b una proprieta'' senza stato non ferma il passaggio a strict    KO';
  end if;

  -- ══ Y. L'invariante, ricontrollata sulla chiave esatta ═══════════════════
  -- La versione in 70-crash-windows.sql chiede se l'utente possieda QUALCHE
  -- acquisto di quella sorgente. E' la stessa debolezza di G2: la si
  -- ricontrolla qui sulla coppia (sorgente, chiave), che e' l'identita' vera
  -- della proprieta'.
  select count(*) into v_n
  from public.b2c_subscriptions t
  where t.billing_source in ('apple_iap', 'google_play')
    and not exists (
      select 1 from private.billing_purchase_claims c
      where c.billing_source = t.billing_source
        and c.ownership_key = private._billing_chiave_da_proiezione(
              t.billing_source, t.external_subscription_id)
        and c.owner_user_id = t.user_id);
  -- G2 semina di proposito UNA riga scoperta e non la ripulisce: e' la sua prova.
  if v_n = 1 then
    v_ok := v_ok + 1;
    raise notice '   Y   nessun diritto commerciale senza LA SUA proprieta''            OK   (1 seminata da G2)';
  else
    v_ko := v_ko + 1;
    raise notice '   Y   righe commerciali senza la loro proprieta'': % (attese 1)      KO', v_n;
  end if;

  raise notice '';
  raise notice '   PASSATI: %   FALLITI: %', v_ok, v_ko;
  if v_ko > 0 then
    raise exception 'nove punti: % casi falliti', v_ko;
  end if;
end $$;

rollback;

\echo ''
\echo '=================================================='
\echo 'billing_claims_p0 / nove punti: G2 G4 G5 G6 Y'
\echo '=================================================='
