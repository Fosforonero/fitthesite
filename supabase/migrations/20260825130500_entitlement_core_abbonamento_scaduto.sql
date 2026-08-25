-- ============================================================================
-- F6 — UN ABBONAMENTO SCADUTO NON E' UN ABBONAMENTO ATTIVO
-- ============================================================================
-- `private.entitlement_core` decide chi ha accesso. Il suo ramo abbonamento
-- guarda SOLO lo stato:
--
--     and b.state in ('active', 'grace')
--
-- e non guarda mai il tempo. Una riga con `state = 'active'` e `active_until`
-- gia' passato concede il Pro per sempre.
--
-- COME CI SI ARRIVA
-- -----------------
-- `state` cambia solo quando qualcuno rivalida. La route lo calcola al momento
-- della verifica e lo scrive. Se un abbonamento scade e la persona non riapre
-- piu' l'app, nessuno riscrive quella riga: resta `active` con una scadenza
-- nel passato, e l'autorita' la crede.
--
-- QUANTO PESA OGGI: NIENTE. E DOMANI SI'
-- -------------------------------------
-- Misurato in produzione il 25/08/2026, in sola lettura: 27 righe in
-- `b2c_subscriptions`, **zero** con `state in ('active','grace')` e
-- `active_until` nel passato. Diciotto sono `founder_grant` con scadenza al
-- 2099, nove sono `google_play` col sentinella lifetime. Nessuno perde
-- l'accesso applicando questa migration, e nessuno lo sta sfruttando adesso.
--
-- Non e' un difetto teorico: e' un difetto latente, e si realizzera' col primo
-- abbonato che lascia scadere senza riaprire l'app. La 190 lo rende peggiore,
-- perche' introduce il percorso dei revisori Sandbox, dove un permesso a tempo
-- scade per costruzione.
--
-- COME L'HO TROVATO
-- -----------------
-- Non cercandolo. Il caso S16 della suite avversariale del filone
-- (`89-attesa-e-sandbox.sql`) verifica che, scaduto il permesso Sandbox e
-- SENZA che giri nessun ricalcolo, i due percorsi neghino entrambi. La lettura
-- diretta della tabella negava — `active_until` era limitato al permesso, come
-- doveva — e `get_entitlement_status` rispondeva ancora «subscription». La
-- proiezione era giusta; a leggerla male era l'autorita'.
--
-- PERCHE' `replace` E NON UNA RISCRITTURA
-- ---------------------------------------
-- E' l'idioma gia' usato da questa catena (20260817073706, 20260825120007,
-- 20260825120009): si legge il corpo VIVO con `pg_get_functiondef` e si
-- sostituisce solo l'ancora, dopo aver preteso che compaia il numero esatto di
-- volte che ci si aspetta. Riscrivere la funzione intera reintrodurrebbe
-- qualunque deriva fra il file e la produzione — ed e' esattamente il modo in
-- cui il ramo `appReview` era finito nel posto sbagliato.
-- ============================================================================
do $$
declare
  v_def text;
  v_ancora constant text := '       and b.state in (''active'', ''grace'')';
  v_nuovo constant text := '       and b.state in (''active'', ''grace'')' || chr(10) ||
                           '       and b.active_until > v_now';
  v_prima int;
  v_dopo int;
begin
  select pg_catalog.pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname = 'entitlement_core';

  if v_def is null then
    raise exception 'F6: private.entitlement_core non esiste';
  end if;

  -- Idempotenza: se il controllo c'e' gia', non si tocca niente.
  if pg_catalog.strpos(v_def, 'b.active_until > v_now') > 0 then
    raise notice 'F6: il controllo sul tempo e'' gia'' presente, nessuna modifica.';
    return;
  end if;

  -- L'ancora deve comparire ESATTAMENTE due volte: una nel ramo che decide
  -- l'accesso, una nella query che sceglie la scadenza da riportare. Se ne
  -- comparissero una o tre, il corpo non e' quello per cui questa migration e'
  -- stata scritta, e sostituire alla cieca produrrebbe una funzione diversa da
  -- quella che ho letto.
  -- Conteggio LETTERALE, non regex: l'ancora contiene parentesi, che in una
  -- regex sono gruppi. Contandola come espressione regolare risultava zero
  -- occorrenze su un corpo che ne ha due, e la migration si fermava accusando
  -- il corpo invece di se stessa.
  v_prima := (pg_catalog.length(v_def) - pg_catalog.length(pg_catalog.replace(v_def, v_ancora, ''))) / pg_catalog.length(v_ancora);
  if v_prima <> 2 then
    raise exception 'F6: l''ancora compare % volte invece di 2. Il corpo non e'' quello atteso.', v_prima;
  end if;

  v_def := pg_catalog.replace(v_def, v_ancora, v_nuovo);

  v_dopo := (pg_catalog.length(v_def) - pg_catalog.length(pg_catalog.replace(v_def, 'b.active_until > v_now', ''))) / pg_catalog.length('b.active_until > v_now');
  if v_dopo <> 2 then
    raise exception 'F6: dopo la sostituzione il controllo compare % volte invece di 2', v_dopo;
  end if;

  execute v_def;
  raise notice 'F6: controllo sul tempo aggiunto in entrambi i punti.';
end $$;

-- ── Postcondizione: la funzione RISPONDE, e risponde diversamente ───────────
--
-- Dentro una transazione che si annulla, e non e' un dettaglio di stile.
--
-- La prima versione di questa postcondizione lasciava dietro di se' un claim
-- in `private.billing_purchase_claims`: la fixture usa `google_play`, e la
-- guardia sulla proiezione in modalita' compatibility registra all'indietro
-- ogni scrittura commerciale. Il registro e' append-only per costruzione — un
-- trigger vieta DELETE e UPDATE — quindi quella riga non si poteva nemmeno
-- togliere: restava nello schema di OGNI ricostruzione.
--
-- L'ho scoperto perche' un test della suite avversariale pretendeva
-- esattamente un claim google e ne trovava due. Il test aveva ragione, e il
-- secondo claim era mio.
--
-- Non si puo' evitare la fixture commerciale: il ramo che questa migration
-- corregge esclude di proposito `trial` e `founder_grant`, quindi provarlo con
-- una fonte non commerciale non proverebbe niente.
begin;

do $$
declare
  v_u uuid := 'f6000000-0000-0000-0000-000000000001'::uuid;
  v_kind text;
begin
  insert into auth.users (id, email) values (v_u, 'f6-postcondizione@esempio.invalid')
    on conflict (id) do nothing;
  insert into public.profiles (id, email) values (v_u, 'f6-postcondizione@esempio.invalid')
    on conflict (id) do nothing;

  -- a) scaduta: niente accesso
  insert into public.b2c_subscriptions
    (user_id, billing_source, external_product_id, external_subscription_id,
     active_until, auto_renewing, state)
  values (v_u, 'google_play', 'fitmesh_pro_sub', 'f6-scaduta',
          pg_catalog.now() - interval '1 day', false, 'active')
  on conflict (user_id) do update
    set active_until = excluded.active_until, state = excluded.state,
        billing_source = excluded.billing_source,
        external_product_id = excluded.external_product_id,
        external_subscription_id = excluded.external_subscription_id;

  v_kind := private.entitlement_core(v_u) ->> 'entitlementKind';
  if v_kind in ('lifetime', 'subscription') then
    raise exception 'F6: abbonamento scaduto e l''autorita'' risponde ancora «%»', v_kind;
  end if;

  -- b) valida: accesso concesso. Controllo positivo.
  update public.b2c_subscriptions
     set active_until = pg_catalog.now() + interval '30 days'
   where user_id = v_u;

  v_kind := private.entitlement_core(v_u) ->> 'entitlementKind';
  if v_kind <> 'subscription' then
    raise exception 'F6: abbonamento VALIDO e l''autorita'' risponde «%». Nega tutto, quindi non verifica niente.', v_kind;
  end if;

  -- Ordine obbligato dalla guardia sulla proiezione, che rifiuta la DELETE di
  -- una riga commerciale — e fa bene: cancellare la proiezione di un acquisto
  -- pagato toglierebbe il diritto a chi lo ha comprato. Il ramo che la guardia
  -- ammette e' quello della cancellazione dell'account: sparito il profilo,
  -- la riga orfana si puo' togliere. E' la stessa strada del GDPR, non
  -- un'eccezione inventata per il test.
  delete from public.profiles where id = v_u;
  delete from public.b2c_subscriptions where user_id = v_u;
  delete from auth.users where id = v_u;

  raise notice 'F6: scaduto nega, valido concede.';
end $$;

rollback;
