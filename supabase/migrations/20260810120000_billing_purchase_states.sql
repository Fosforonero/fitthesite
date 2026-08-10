-- ============================================================================
-- Sprint P0 Apple IAP — B': proprieta' immutabile + STATO PER ACQUISTO
--
-- PERCHE' ESISTE QUESTO FILE
--
-- Il registro di proprieta' (20260808211929) risponde a "di chi e' questo
-- acquisto?" e lo fa per sempre. Non risponde pero' a "che cosa vale, oggi?",
-- e quella seconda domanda viveva ancora tutta dentro public.b2c_subscriptions,
-- che ha una riga sola per utente ed e' scritta in last-write-wins.
--
-- Conseguenza, misurata eseguendo la RPC precedente e non leggendo il codice:
--
--     claim lifetime  -> claimed      state=active  is_lifetime=true
--     claim scaduto   -> claimed      state=expired is_lifetime=false
--     >>> il lifetime attivo era stato sostituito da un acquisto scaduto
--
-- e nella forma che capita davvero, senza bisogno di niente di scaduto: un
-- utente Android che possiede lifetime E abbonamento si ritrova in proiezione
-- l'abbonamento, perche' Play li restituisce entrambi a ogni queryPurchases e
-- il client li valida in ordine non garantito. Quando l'abbonamento scade
-- nessuno riscrive quella riga: resta state='active' con active_until nel
-- passato, e il contratto di entitlement risponde "subscription scaduto".
-- Pro sparito, lifetime pagato.
--
-- La correzione NON e' una regola "non si scende" nella proiezione. Quella
-- regola sembra funzionare finche' non cambia lo stato del vincitore: un
-- lifetime rimborsato resterebbe per sempre il migliore, e nessun diritto
-- successivo potrebbe piu' emergere. In un P0 pagamenti sarebbe una
-- correzione solo apparente.
--
-- Servono TRE oggetti con tre cicli di vita distinti:
--
--   private.billing_purchase_claims  PROPRIETA'. Append-only, immutabile,
--                                    mai riassegnata. Invariata da questo file.
--   private.billing_purchase_states  STATO VERIFICATO, una riga per acquisto.
--                                    Mutabile, ma solo in avanti nel tempo
--                                    dell'evidenza store.
--   public.b2c_subscriptions         PROIEZIONE compatibile con la 189.
--                                    Derivata, mai storia primaria.
--
-- L'entitlement non e' piu' "l'ultima cosa scritta": e' il MIGLIORE fra gli
-- acquisti posseduti, ricalcolato a ogni scrittura. Diventa cosi' indipendente
-- dall'ordine in cui lo store consegna gli acquisti, che e' la proprieta' che
-- mancava.
--
-- COSA NON ENTRA IN private.billing_purchase_states
--
--   Nessun token, nessun JWS, nessuna ricevuta, nessun payload grezzo. Solo
--   dati normalizzati: prodotto, tipo, stato, scadenza, rinnovo automatico, il
--   timestamp autorevole dell'evento store e quando l'abbiamo verificato.
--   Vale la stessa ragione del registro: queste tabelle devono poter essere
--   lette in supporto e in audit senza esporre credenziali riesercitabili.
--
-- QUESTO FILE NON MODIFICA NESSUN DATO ESISTENTE. Crea una tabella vuota, due
-- funzioni, e sostituisce due funzioni con versioni che scrivono meno di
-- prima, non di piu'. Nessun ALTER TABLE su public.b2c_subscriptions, nessuna
-- riga riscritta, nessun backfill.
-- ============================================================================

create schema if not exists private;

-- ============================================================================
-- 1. LO STATO VERIFICATO, UNA RIGA PER ACQUISTO
-- ============================================================================

create table if not exists private.billing_purchase_states (
  billing_source text not null,
  ownership_key  text not null,

  -- Che cosa e' stato comprato, e di che tipo. Il tipo NON si deduce dal nome
  -- del prodotto al momento della lettura: si registra all'ingresso, perche' e'
  -- cio' che decide la precedenza e un catalogo puo' cambiare.
  external_product_id text not null,
  purchase_kind text not null,

  -- Stato dichiarato dallo store, gia' verificato. 'revoked' non esiste nel
  -- vocabolario di public.b2c_subscriptions e per questo vive qui: un rimborso
  -- e' un fatto sull'acquisto, non sull'utente.
  state text not null,

  -- Fino a quando quell'acquisto da' accesso. Per un non consumabile e' il
  -- sentinella oltre l'anno 9000, cioe' la stessa convenzione gia' usata dalla
  -- proiezione e da public.is_b2c_lifetime().
  active_until timestamptz not null,
  auto_renewing boolean not null default false,

  -- ── Freschezza ──────────────────────────────────────────────────────────
  -- Il momento in cui lo STORE ha asserito questo stato, non il momento in cui
  -- l'abbiamo scoperto. Serve a una cosa sola e non negoziabile: un evento
  -- 'active' piu' vecchio non deve poter resuscitare una revoca piu' recente.
  store_event_at timestamptz not null,

  -- Da dove viene quel timestamp. Dichiararlo evita il confronto piu'
  -- pericoloso, cioe' fra due orologi diversi:
  --
  --   apple_signed_date    JWS StoreKit 2, campo `signedDate`: l'orologio di
  --                        Apple al momento della firma di quella evidenza.
  --   apple_request_date   verifyReceipt StoreKit 1, `request_date_ms`:
  --                        l'orologio di Apple al momento della risposta.
  --   google_backend_fetch l'orologio NOSTRO all'istante in cui Google ha
  --                        risposto 200. Play non espone ne' una versione
  --                        monotona ne' un "last updated" sulla risorsa, e
  --                        inventarne uno dal payload sarebbe peggio che
  --                        dichiarare quale orologio stiamo usando. Ogni
  --                        chiamata e' un re-fetch dello stato corrente, quindi
  --                        l'ordine dei nostri fetch E' l'ordine degli stati.
  --
  -- Le due sorgenti Apple sono confrontabili fra loro perche' sono lo stesso
  -- orologio. Una chiave appartiene a UN solo store, quindi non si confronta
  -- mai un timestamp Apple con uno Google: il vincolo sotto lo impone.
  store_event_source text not null,

  verified_at timestamptz not null default now(),

  primary key (billing_source, ownership_key),

  -- Lo stato esiste solo se esiste la proprieta'. Senza questo vincolo si
  -- potrebbe registrare lo stato di un acquisto che nessuno ha mai reclamato,
  -- cioe' un entitlement senza proprietario.
  constraint billing_purchase_states_claim_fkey
    foreign key (billing_source, ownership_key)
    references private.billing_purchase_claims (billing_source, ownership_key)
    on delete restrict,

  constraint billing_purchase_states_kind_check
    check (purchase_kind in ('lifetime', 'subscription')),

  constraint billing_purchase_states_state_check
    check (state in ('active', 'grace', 'on_hold', 'paused',
                     'expired', 'cancelled', 'revoked')),

  -- Un lifetime senza sentinella non sarebbe riconosciuto come tale da
  -- is_b2c_lifetime() una volta proiettato: si rifiuta all'ingresso invece di
  -- scoprirlo dopo.
  constraint billing_purchase_states_lifetime_sentinel_check
    check (
      purchase_kind <> 'lifetime'
      or active_until > '9000-01-01'::timestamptz
    ),

  constraint billing_purchase_states_event_source_check
    check (
      case billing_source
        when 'apple_iap'   then store_event_source in ('apple_signed_date', 'apple_request_date')
        when 'google_play' then store_event_source = 'google_backend_fetch'
        else false
      end
    )
);

comment on table private.billing_purchase_states is
  'Sprint P0 Apple IAP (B''): stato store VERIFICATO di un singolo acquisto, '
  'una riga per (billing_source, ownership_key). Mutabile ma solo in avanti '
  'nel tempo dell''evidenza store. Non contiene token, JWS, ricevute ne'' '
  'payload grezzi. La proprieta'' sta in private.billing_purchase_claims; '
  'l''entitlement corrente e'' una PROIEZIONE derivata in '
  'public.b2c_subscriptions.';

comment on column private.billing_purchase_states.store_event_at is
  'Quando lo STORE ha asserito questo stato. Confrontabile solo con altri '
  'valori della stessa chiave: vedi store_event_source.';

-- Nessun indice aggiuntivo, e il motivo va scritto perche' l'istinto sarebbe
-- di aggiungerne uno. Il ricalcolo parte dall'utente, non dalla chiave: entra
-- da private.billing_purchase_claims, che ha gia' billing_purchase_claims_owner_idx
-- su owner_user_id, e da li' raggiunge questa tabella per chiave primaria. Un
-- indice su (billing_source, ownership_key) sarebbe un duplicato della PK.

-- ============================================================================
-- 2. SOLO IN AVANTI
-- ============================================================================
-- La tabella e' mutabile per costruzione: un abbonamento cambia stato. Ma un
-- aggiornamento con evidenza piu' VECCHIA di quella gia' registrata non e' un
-- aggiornamento, e' una regressione — ed e' esattamente il modo in cui una
-- revoca sparisce e un rimborsato torna Pro.
--
-- Il controllo sta in un trigger e non nella sola RPC perche' la RPC e' una
-- convenzione: il trigger vale per qualunque scrittore, oggi e in futuro.
create or replace function private._billing_purchase_states_forward_only()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'private.billing_purchase_states non ammette DELETE: lo stato di un acquisto verificato non si cancella (chiave %/%).',
      old.billing_source, old.ownership_key
      using errcode = '42501';
  end if;

  -- La chiave d'acquisto non si sposta: sarebbe un cambio di identita'.
  if new.billing_source is distinct from old.billing_source
     or new.ownership_key is distinct from old.ownership_key then
    raise exception
      'private.billing_purchase_states: la chiave d''acquisto e'' immutabile.'
      using errcode = '42501';
  end if;

  if new.store_event_at < old.store_event_at then
    raise exception
      'private.billing_purchase_states: evidenza store piu'' vecchia di quella registrata (% < %). Uno stato non regredisce.',
      new.store_event_at, old.store_event_at
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function private._billing_purchase_states_forward_only() from public, anon, authenticated;

drop trigger if exists billing_purchase_states_forward_only on private.billing_purchase_states;
create trigger billing_purchase_states_forward_only
  before update or delete on private.billing_purchase_states
  for each row execute function private._billing_purchase_states_forward_only();

-- ============================================================================
-- 3. ACL
-- ============================================================================
-- Stesso trattamento del registro: schema non esposto da PostgREST, nessun
-- privilegio a nessuno dei ruoli dell'API, service_role compreso. Si passa
-- dalle funzioni, che sono SECURITY DEFINER.
alter table private.billing_purchase_states enable row level security;

revoke all on table private.billing_purchase_states from public, anon, authenticated, service_role;

-- ============================================================================
-- 4. IL MIGLIORE DIRITTO POSSEDUTO, E LA SUA PROIEZIONE
-- ============================================================================
-- PRECEDENZA (dall'alto):
--
--   1. founder_grant / grandfather   separati, e MAI sovrascritti. Non sono
--                                    acquisti store: non hanno una chiave di
--                                    proprieta' e non partecipano al confronto.
--                                    Una scrittura commerciale non li tocca.
--   2. lifetime store valido         purchase_kind='lifetime' e state='active'.
--   3. subscription ancora valida    state in ('active','grace','cancelled') E
--                                    active_until > adesso, scegliendo la
--                                    scadenza MAGGIORE.
--   4. trial interno ancora valido   non vive qui: il contratto di entitlement
--                                    lo deriva da auth.users.created_at, quindi
--                                    riemerge da solo quando nessun acquisto
--                                    commerciale e' valido. Vedi la nota sotto.
--   5. nessun entitlement            si proietta comunque lo stato reale
--                                    dell'acquisto piu' recente, perche' la
--                                    proiezione deve dire la verita' anche
--                                    quando la verita' e' "niente".
--
-- 'cancelled' con accesso ancora valido NON e' una revoca: chi ha disdetto
-- continua a usare cio' che ha pagato fino alla scadenza. Si proietta quindi
-- come accesso attivo con auto_renewing=false, che e' esattamente la coppia di
-- valori che la 189 sa gia' leggere. Lo stato vero ('cancelled') resta in
-- private.billing_purchase_states, che e' il posto dove vive la storia.
--
-- 'revoked' (rimborso o revoca) invalida QUELLA chiave e basta: il ricalcolo
-- fa riemergere da solo il diritto successivo, se c'e'.
--
-- NOTA SUL TRIAL: le righe legacy billing_source='trial' in
-- public.b2c_subscriptions sono inerti per l'entitlement — il contratto le
-- esclude esplicitamente (`billing_source <> 'trial'`) — e il trial vero e'
-- derivato da auth.users.created_at. Sovrascriverne una con lo stato reale di
-- un acquisto commerciale non toglie quindi nessun diritto: il ramo trial del
-- contratto continua a valutare la stessa cosa di prima.
create or replace function private._billing_project_entitlement(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_win record;
  v_projected_state text;
  v_raw_payload jsonb;
  v_actual record;
begin
  -- Il migliore diritto posseduto, in una sola lettura ordinata. Il rango
  -- riproduce la precedenza; a parita' di rango vince la scadenza maggiore, e
  -- a parita' di scadenza la chiave, che rende il risultato deterministico e
  -- quindi verificabile in un test.
  select s.*, c.external_transaction_id, c.owner_user_id
    into v_win
  from private.billing_purchase_states s
  join private.billing_purchase_claims c
    on c.billing_source = s.billing_source
   and c.ownership_key  = s.ownership_key
  where c.owner_user_id = p_user_id
  order by
    case
      when s.purchase_kind = 'lifetime' and s.state = 'active' then 0
      when s.purchase_kind = 'subscription'
       and s.state in ('active', 'grace', 'cancelled')
       and s.active_until > v_now then 1
      else 2
    end,
    s.active_until desc,
    s.store_event_at desc,
    s.billing_source,
    s.ownership_key
  limit 1;

  if not found then
    -- Nessun acquisto commerciale conosciuto: non c'e' niente da proiettare e
    -- soprattutto niente da cancellare. Founder, trial e ruoli restano dove
    -- sono.
    return pg_catalog.jsonb_build_object('projected', false, 'reason', 'no_commercial_purchase');
  end if;

  -- Stato da scrivere in proiezione. 'revoked' non appartiene al vocabolario
  -- di public.b2c_subscriptions e diventa 'expired': per chi legge la
  -- proiezione il risultato e' lo stesso, cioe' nessun accesso.
  v_projected_state := case
    when v_win.purchase_kind = 'lifetime' and v_win.state = 'active' then 'active'
    when v_win.purchase_kind = 'subscription'
     and v_win.state in ('active', 'cancelled')
     and v_win.active_until > v_now then 'active'
    when v_win.purchase_kind = 'subscription'
     and v_win.state = 'grace'
     and v_win.active_until > v_now then 'grace'
    when v_win.state = 'revoked' then 'expired'
    else v_win.state
  end;

  v_raw_payload := pg_catalog.jsonb_build_object(
    'source', 'billing_entitlement_projection',
    'contract_version', 2,
    'ownership_key_derivation_version', 1,
    'billing_source', v_win.billing_source,
    'product_id', v_win.external_product_id,
    'purchase_kind', v_win.purchase_kind,
    'store_state', v_win.state,
    'store_event_at', v_win.store_event_at,
    'store_event_source', v_win.store_event_source
  );

  -- ── La scrittura, con la difesa del founder dentro la stessa istruzione ──
  -- `where ... <> 'founder_grant'` sulla DO UPDATE non e' una cortesia: e' cio'
  -- che rende impossibile sovrascrivere un founder ANCHE in concorrenza. Il
  -- lock consultivo sull'utente serializza le scritture commerciali fra loro,
  -- ma la riga founder la scrive un altro percorso, che quel lock non lo
  -- prende. Qui la condizione viene valutata da Postgres sulla riga gia'
  -- bloccata dall'ON CONFLICT: se in quell'istante c'e' un founder, l'update
  -- semplicemente non avviene.
  --
  -- external_subscription_id riceve la ownership_key, non il token. Per Apple
  -- e' lo stesso identico valore di prima (originalTransactionId); per Google
  -- e' il digest invece del purchase token in chiaro, che e' una credenziale
  -- riesercitabile e finiva perfino nell'export GDPR dell'utente. La colonna
  -- non viene letta da nessuno: serve solo al vincolo di unicita'.
  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    external_order_id, active_until, auto_renewing, state,
    raw_payload, last_notification_at
  ) values (
    p_user_id, v_win.billing_source, v_win.external_product_id, v_win.ownership_key,
    v_win.external_transaction_id, v_win.active_until,
    case when v_projected_state in ('active', 'grace') then v_win.auto_renewing else false end,
    v_projected_state, v_raw_payload, pg_catalog.now()
  )
  on conflict (user_id) do update set
    billing_source           = excluded.billing_source,
    external_product_id      = excluded.external_product_id,
    external_subscription_id = excluded.external_subscription_id,
    external_order_id        = excluded.external_order_id,
    active_until             = excluded.active_until,
    auto_renewing            = excluded.auto_renewing,
    state                    = excluded.state,
    raw_payload              = excluded.raw_payload,
    last_notification_at     = excluded.last_notification_at
  where public.b2c_subscriptions.billing_source <> 'founder_grant';

  -- Si rilegge cio' che c'e' DAVVERO, non cio' che si e' provato a scrivere:
  -- se ha vinto un founder, il backend deve ricevere il founder.
  select t.billing_source, t.external_product_id, t.state, t.active_until,
         t.auto_renewing, public.is_b2c_lifetime(t) as is_lifetime
    into v_actual
  from public.b2c_subscriptions t
  where t.user_id = p_user_id;

  return pg_catalog.jsonb_build_object(
    'projected', true,
    'source',       v_actual.billing_source,
    'productId',    v_actual.external_product_id,
    'state',        v_actual.state,
    'activeUntil',  v_actual.active_until,
    'autoRenewing', v_actual.auto_renewing,
    'isLifetime',   v_actual.is_lifetime,
    'protectedFounderRow', v_actual.billing_source = 'founder_grant'
  );
end;
$$;

revoke all on function private._billing_project_entitlement(uuid) from public, anon, authenticated, service_role;

comment on function private._billing_project_entitlement(uuid) is
  'Sprint P0 Apple IAP (B''): ricalcola il MIGLIORE diritto posseduto da un '
  'utente a partire da private.billing_purchase_states e lo proietta in '
  'public.b2c_subscriptions. Non sovrascrive mai una riga founder_grant, '
  'nemmeno in concorrenza. Restituisce cio'' che risulta proiettato DAVVERO.';

-- ============================================================================
-- 5. L'OPERAZIONE ATOMICA
-- ============================================================================
-- Una sola transazione Postgres per: prendere i lock, reclamare la proprieta',
-- aggiornare lo stato se l'evidenza e' piu' recente, ricalcolare il migliore
-- diritto, proiettarlo, e restituire cio' che risulta proiettato DAVVERO.
--
-- L'ultimo punto e' la differenza che conta: il backend non riceve indietro
-- l'acquisto che ha appena presentato, riceve l'entitlement dell'utente. Se
-- qualcuno ripresenta un abbonamento scaduto mentre possiede un lifetime, la
-- risposta corretta e' "lifetime attivo", non "abbonamento scaduto".
--
-- ── ORDINE DEI LOCK: UTENTE, POI CHIAVE ────────────────────────────────────
--
-- Prima c'era un solo lock, sulla chiave d'acquisto. Bastava finche' la
-- scrittura riguardava un acquisto per volta. Non basta piu': il ricalcolo
-- legge TUTTI gli acquisti dell'utente e riscrive UNA riga di proiezione,
-- quindi due acquisti DIVERSI dello stesso utente si sovrappongono. Senza un
-- lock sull'utente, due claim simultanei potrebbero calcolare il migliore
-- diritto sullo stesso stato di partenza e scriverlo in ordine arbitrario.
--
-- L'ordine e' fisso e globale — SEMPRE utente, POI chiave — ed e' cio' che
-- rende impossibile il deadlock: ogni transazione prende al massimo un lock
-- per livello e li prende sempre nella stessa direzione, quindi non puo'
-- esistere un ciclo di attesa. Un ciclo richiederebbe una transazione che
-- tiene la chiave e aspetta l'utente, ma per arrivare alla chiave quella
-- transazione l'utente l'ha gia' preso.
--
-- I due lock vivono in spazi DIVERSI di Postgres: la forma a due interi
-- (classid, objid) e la forma a un intero sono namespace separati. Non e' un
-- dettaglio estetico: usando la stessa forma per entrambi, l'hash di un utente
-- e l'hash di una chiave potrebbero coincidere e serializzare due operazioni
-- che non hanno niente in comune.
--
-- ESITI (campo `outcome`), invariati rispetto al contratto gia' approvato:
--   claimed                     proprieta' nuova, assegnata ora.
--   already_owned_by_same_user  gia' sua: successo idempotente.
--   owned_by_other_user         di un altro account, o di un account
--                               cancellato. Nessuna scrittura.
--   persistence_failed          niente e' stato salvato, ritentare e' sicuro.
--
-- In piu', e senza aggiungere esiti: `stateApplied` dice se l'evidenza portata
-- era piu' recente di quella gia' registrata. Falso NON e' un errore — e' il
-- caso normale di un client che ripresenta una fotografia vecchia — e infatti
-- la proiezione viene ricalcolata lo stesso.
-- ============================================================================

drop function if exists public.claim_store_purchase(
  text, text, uuid, text, text, timestamptz, text, boolean, text, uuid, text, text
);

create or replace function public.claim_store_purchase(
  p_billing_source text,
  p_ownership_key text,
  p_owner_user_id uuid,
  p_external_product_id text,
  p_purchase_kind text,
  p_environment text,
  p_state text,
  p_active_until timestamptz,
  p_auto_renewing boolean,
  -- Quando lo STORE ha asserito questo stato, e con quale orologio.
  -- Obbligatori entrambi: senza un ordinamento dichiarato non si puo' decidere
  -- se questa evidenza sia piu' recente di quella gia' registrata, e in dubbio
  -- non si scrive.
  p_store_event_at timestamptz,
  p_store_event_source text,
  p_external_transaction_id text default null,
  p_app_account_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_existing_owner uuid;
  v_existing_anonymized_at timestamptz;
  v_existing_claimed_at timestamptz;
  v_found boolean;
  v_outcome text;
  v_claimed_at timestamptz;
  v_state_applied boolean := false;
  v_entitlement jsonb;
  v_sqlstate text;
  v_message text;
begin
  -- ── Contratto d'ingresso ────────────────────────────────────────────────
  -- Violarlo e' un errore di programmazione del chiamante, non un esito
  -- operativo: si solleva, non si restituisce un outcome.
  if p_owner_user_id is null then
    raise exception 'claim_store_purchase: p_owner_user_id obbligatorio' using errcode = '22004';
  end if;
  if p_billing_source is null or p_billing_source not in ('apple_iap', 'google_play') then
    raise exception 'claim_store_purchase: p_billing_source deve essere apple_iap o google_play (ricevuto %). founder_grant, grandfather e trial non sono acquisti store e non hanno un claim.', p_billing_source
      using errcode = '22023';
  end if;
  if p_ownership_key is null or length(p_ownership_key) = 0 then
    raise exception 'claim_store_purchase: p_ownership_key obbligatorio' using errcode = '22004';
  end if;

  -- Allowlist degli SKU ESATTI, non della forma. Questa guardia ha gia'
  -- sbagliato due volte, e ogni volta perche' era piu' larga del necessario:
  -- prima una blocklist che lasciava passare uno shared secret esadecimale,
  -- poi una forma '^fitmesh...' che accetta qualunque stringa nuova purche'
  -- cominci per "fitmesh". Gli SKU che vendiamo sono due e sono noti.
  if p_external_product_id is null
     or p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'claim_store_purchase: p_external_product_id "%" non e uno degli SKU supportati (fitmesh_pro_lifetime, fitmesh_pro_sub).', left(coalesce(p_external_product_id, '<null>'), 40)
      using errcode = '22023';
  end if;

  -- Il tipo si dichiara E deve combaciare con lo SKU. Un lifetime registrato
  -- come subscription scadrebbe; una subscription registrata come lifetime
  -- diventerebbe un diritto perpetuo. Nessuno dei due si vede al momento
  -- della scrittura.
  if p_purchase_kind is null or p_purchase_kind not in ('lifetime', 'subscription') then
    raise exception 'claim_store_purchase: p_purchase_kind deve essere lifetime o subscription (ricevuto %)', p_purchase_kind
      using errcode = '22023';
  end if;
  if (p_external_product_id = 'fitmesh_pro_lifetime' and p_purchase_kind <> 'lifetime')
     or (p_external_product_id = 'fitmesh_pro_sub' and p_purchase_kind <> 'subscription') then
    raise exception 'claim_store_purchase: SKU % e tipo % non combaciano.', p_external_product_id, p_purchase_kind
      using errcode = '22023';
  end if;

  if p_environment is null or p_environment not in ('production', 'sandbox') then
    raise exception 'claim_store_purchase: p_environment deve essere production o sandbox (ricevuto %)', p_environment
      using errcode = '22023';
  end if;
  if p_active_until is null then
    raise exception 'claim_store_purchase: p_active_until obbligatorio' using errcode = '22004';
  end if;

  -- 'revoked' non entra da qui. Una revoca non e' un acquisto che si presenta:
  -- e' un fatto che arriva dallo store su un acquisto gia' registrato, e ha
  -- una funzione sua (public.record_store_purchase_revocation) che non
  -- assegna proprieta' a nessuno.
  if p_state is null or p_state not in ('active', 'grace', 'on_hold', 'paused', 'expired', 'cancelled') then
    raise exception 'claim_store_purchase: p_state non ammesso su questo percorso (ricevuto %). Per rimborso o revoca usare public.record_store_purchase_revocation.', p_state
      using errcode = '22023';
  end if;

  -- ── Freschezza: obbligatoria, e fail-closed ─────────────────────────────
  if p_store_event_at is null or p_store_event_source is null then
    raise exception 'claim_store_purchase: p_store_event_at e p_store_event_source obbligatori. Senza un ordinamento dichiarato non si puo'' sapere se questa evidenza sia piu'' recente di quella registrata, e in dubbio non si scrive.'
      using errcode = '22004';
  end if;
  if p_store_event_at > pg_catalog.now() + interval '24 hours' then
    raise exception 'claim_store_purchase: p_store_event_at nel futuro (%). Un orologio store cosi'' avanti non e'' un ordinamento affidabile.', p_store_event_at
      using errcode = '22023';
  end if;

  if p_app_account_token is not null and p_app_account_token <> p_owner_user_id then
    raise exception 'claim_store_purchase: app_account_token non coincide con il proprietario. Il binding di account va risolto nel backend PRIMA del claim.'
      using errcode = '22023';
  end if;

  -- ── I lock, nell'ordine fisso ───────────────────────────────────────────
  -- Fuori dal blocco con EXCEPTION di proposito: un rollback di
  -- sottotransazione rilascerebbe i lock presi al suo interno, e la finestra
  -- che si aprirebbe e' esattamente quella che questi lock esistono per
  -- chiudere.
  perform pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext(p_owner_user_id::text));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
  );

  select c.owner_user_id, c.anonymized_at, c.claimed_at
    into v_existing_owner, v_existing_anonymized_at, v_existing_claimed_at
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source
    and c.ownership_key = p_ownership_key;
  v_found := found;

  if v_found then
    if v_existing_owner is not null and v_existing_owner = p_owner_user_id then
      v_outcome := 'already_owned_by_same_user';
      v_claimed_at := v_existing_claimed_at;
    else
      -- Altro utente, oppure tombstone di account cancellato. In entrambi i
      -- casi non e' di chi sta chiedendo, e non si scrive niente: ne' la
      -- proprieta', ne' lo stato, ne' la proiezione.
      return pg_catalog.jsonb_build_object(
        'outcome', 'owned_by_other_user',
        'billingSource', p_billing_source,
        'claimedAt', v_existing_claimed_at,
        'ownerDeleted', v_existing_anonymized_at is not null
      );
    end if;
  else
    v_outcome := 'claimed';
  end if;

  -- ── Claim + stato + proiezione: tutto dentro o tutto fuori ──────────────
  begin
    if v_outcome = 'claimed' then
      insert into private.billing_purchase_claims (
        billing_source, ownership_key, external_transaction_id,
        external_product_id, owner_user_id, environment,
        app_account_token, claimed_at
      ) values (
        p_billing_source, p_ownership_key, p_external_transaction_id,
        p_external_product_id, p_owner_user_id, p_environment,
        p_app_account_token, pg_catalog.now()
      )
      returning claimed_at into v_claimed_at;
    end if;

    -- Lo stato si aggiorna SOLO se l'evidenza portata e' piu' recente di
    -- quella gia' registrata. `where ... store_event_at < excluded...` fa
    -- decidere a Postgres sulla riga gia' bloccata dall'ON CONFLICT, quindi
    -- vale anche fra due transazioni che arrivano insieme.
    insert into private.billing_purchase_states (
      billing_source, ownership_key, external_product_id, purchase_kind,
      state, active_until, auto_renewing,
      store_event_at, store_event_source, verified_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      p_state, p_active_until, coalesce(p_auto_renewing, false),
      p_store_event_at, p_store_event_source, pg_catalog.now()
    )
    on conflict (billing_source, ownership_key) do update set
      external_product_id = excluded.external_product_id,
      purchase_kind       = excluded.purchase_kind,
      state               = excluded.state,
      active_until        = excluded.active_until,
      auto_renewing       = excluded.auto_renewing,
      store_event_at      = excluded.store_event_at,
      store_event_source  = excluded.store_event_source,
      verified_at         = excluded.verified_at
    where private.billing_purchase_states.store_event_at < excluded.store_event_at;

    v_state_applied := found;

    -- Il ricalcolo avviene SEMPRE, anche quando lo stato non e' stato
    -- aggiornato. Costa una lettura, e copre il caso in cui la proiezione sia
    -- rimasta indietro per un motivo qualunque: un ripristino non deve mai
    -- lasciare l'utente peggio di come l'ha trovato.
    v_entitlement := private._billing_project_entitlement(p_owner_user_id);

  exception
    when unique_violation then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'reason', 'projection_or_registry_unique_violation',
        'sqlstate', v_sqlstate,
        'message', v_message
      );
    when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'reason', 'write_failed',
        'sqlstate', v_sqlstate,
        'message', v_message
      );
  end;

  return pg_catalog.jsonb_build_object(
    'outcome', v_outcome,
    'billingSource', p_billing_source,
    'claimedAt', v_claimed_at,
    'ownerDeleted', false,
    'stateApplied', v_state_applied,
    'entitlement', v_entitlement
  );
end;
$$;

revoke all on function public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
) to service_role;

comment on function public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
) is
  'Sprint P0 Apple IAP (B''): claim immutabile della proprieta'' di un acquisto '
  'gia'' verificato, aggiornamento dello stato solo se l''evidenza store e'' '
  'piu'' recente, ricalcolo del MIGLIORE diritto posseduto e proiezione in '
  'public.b2c_subscriptions. Lock in ordine fisso utente->chiave. Restituisce '
  'l''entitlement effettivamente proiettato, non l''acquisto ricevuto. NON '
  'verifica l''acquisto: la verifica Apple/Google deve essere gia'' avvenuta.';

-- ============================================================================
-- 6. RIMBORSO E REVOCA
-- ============================================================================
-- Una revoca non e' un acquisto che si presenta: e' un fatto che lo store
-- afferma su un acquisto gia' registrato. Ha una funzione sua per tre ragioni:
--
--   1. NON assegna proprieta' a nessuno. Chi porta la prova di una revoca non
--      diventa il proprietario di quell'acquisto — sarebbe il modo piu' comodo
--      per impadronirsi di una chiave altrui.
--   2. L'entitlement da ricalcolare e' quello del PROPRIETARIO REGISTRATO, che
--      puo' non essere chi sta chiamando. L'evidenza e' firmata dallo store,
--      quindi vale a prescindere da chi la consegna.
--   3. Il diritto successivo deve riemergere da solo: chi aveva lifetime e
--      abbonamento, e si vede rimborsare il lifetime, resta Pro con
--      l'abbonamento senza dover fare niente.
--
-- ORDINE DEI LOCK, di nuovo utente->chiave. Il proprietario pero' si scopre
-- leggendo il registro, che sta dietro il lock sulla chiave: una lettura senza
-- lock, poi i due lock nell'ordine giusto, poi una RILETTURA sotto lock. Il
-- solo cambiamento possibile su owner_user_id e' diventare NULL (FK ON DELETE
-- SET NULL alla cancellazione dell'account), e la rilettura lo intercetta.
create or replace function public.record_store_purchase_revocation(
  p_billing_source text,
  p_ownership_key text,
  p_external_product_id text,
  p_purchase_kind text,
  p_store_event_at timestamptz,
  p_store_event_source text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_owner uuid;
  v_owner_recheck uuid;
  v_applied boolean := false;
  v_entitlement jsonb;
  v_sqlstate text;
  v_message text;
begin
  if p_billing_source is null or p_billing_source not in ('apple_iap', 'google_play') then
    raise exception 'record_store_purchase_revocation: p_billing_source deve essere apple_iap o google_play (ricevuto %)', p_billing_source
      using errcode = '22023';
  end if;
  if p_ownership_key is null or length(p_ownership_key) = 0 then
    raise exception 'record_store_purchase_revocation: p_ownership_key obbligatorio' using errcode = '22004';
  end if;
  if p_external_product_id is null
     or p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'record_store_purchase_revocation: SKU non supportato' using errcode = '22023';
  end if;
  if p_purchase_kind is null or p_purchase_kind not in ('lifetime', 'subscription') then
    raise exception 'record_store_purchase_revocation: p_purchase_kind non valido' using errcode = '22023';
  end if;
  if p_store_event_at is null or p_store_event_source is null then
    raise exception 'record_store_purchase_revocation: freschezza obbligatoria' using errcode = '22004';
  end if;

  -- Lettura senza lock, solo per sapere CHI bloccare.
  select c.owner_user_id into v_owner
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

  if not found then
    -- Nessuna proprieta' registrata: non c'e' nessun entitlement da togliere e
    -- non si crea niente. Registrare la revoca di un acquisto mai reclamato
    -- vorrebbe dire scrivere uno stato senza proprietario, che il vincolo di
    -- chiave esterna vieta per costruzione.
    return pg_catalog.jsonb_build_object('outcome', 'unknown_purchase', 'applied', false);
  end if;
  if v_owner is null then
    -- Tombstone: l'account e' stato cancellato. L'acquisto resta non
    -- reclamabile, e non c'e' nessun entitlement da ricalcolare.
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext(v_owner::text));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
  );

  -- Rilettura sotto lock: se nel frattempo l'account e' stato cancellato, il
  -- proprietario e' diventato NULL e il lock che abbiamo preso non e' piu'
  -- quello giusto. Ci si ferma invece di scrivere per conto di nessuno.
  select c.owner_user_id into v_owner_recheck
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

  if v_owner_recheck is null or v_owner_recheck <> v_owner then
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

  begin
    insert into private.billing_purchase_states (
      billing_source, ownership_key, external_product_id, purchase_kind,
      state, active_until, auto_renewing,
      store_event_at, store_event_source, verified_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      'revoked',
      -- Un lifetime deve mantenere la sentinella per il vincolo di forma; la
      -- scadenza non conta comunque, perche' 'revoked' non da' accesso in
      -- nessun caso.
      case when p_purchase_kind = 'lifetime'
           then '9999-12-31T23:59:59Z'::timestamptz
           else p_store_event_at end,
      false,
      p_store_event_at, p_store_event_source, pg_catalog.now()
    )
    on conflict (billing_source, ownership_key) do update set
      state              = 'revoked',
      auto_renewing      = false,
      store_event_at     = excluded.store_event_at,
      store_event_source = excluded.store_event_source,
      verified_at        = excluded.verified_at
    where private.billing_purchase_states.store_event_at < excluded.store_event_at;

    v_applied := found;

    -- Il ricalcolo avviene sempre: anche quando la revoca era gia' registrata,
    -- riallineare la proiezione non fa danno ed e' il percorso che fa
    -- riemergere il diritto successivo.
    v_entitlement := private._billing_project_entitlement(v_owner);

  exception
    when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'applied', false,
        'sqlstate', v_sqlstate,
        'message', v_message
      );
  end;

  return pg_catalog.jsonb_build_object(
    'outcome', 'revoked',
    'applied', v_applied,
    'entitlement', v_entitlement
  );
end;
$$;

revoke all on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text
) to service_role;

comment on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text
) is
  'Sprint P0 Apple IAP (B''): registra un rimborso o una revoca su un acquisto '
  'GIA'' reclamato e ricalcola l''entitlement del proprietario registrato. Non '
  'assegna proprieta'' a nessuno: chi porta la prova di una revoca non diventa '
  'proprietario di quell''acquisto.';

-- ============================================================================
-- 7. CORREZIONE COLLEGATA: una subscription "active" ma scaduta non e' attiva
-- ============================================================================
-- public.get_entitlement_status() considerava valida una subscription solo
-- perche' state in ('active','grace'), senza guardare active_until. Con la
-- vecchia proiezione last-write-wins quella riga poteva restare marcata
-- 'active' con una scadenza nel passato per sempre — nessuno la riscriveva,
-- perche' lo store smette di restituire un abbonamento scaduto.
--
-- Da qui in avanti la proiezione non produce piu' quella combinazione, ma le
-- righe scritte PRIMA di questa migration esistono ancora. Il filtro va quindi
-- messo anche in lettura: e' l'unica delle due difese che protegge i dati
-- gia' scritti.
--
-- La funzione e' riprodotta integralmente perche' plpgsql non ammette
-- modifiche parziali. Rispetto alla versione di 20260729161245 cambiano DUE
-- righe, entrambe nel ramo 'active_subscription_row', ed e' l'intero diff.
create or replace function public.get_entitlement_status()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_contract_version constant int := 1;
  v_offline_grace constant interval := interval '24 hours';
  v_user_id uuid;
  v_created_at timestamptz;
  v_email text;
  v_server_now timestamptz := clock_timestamp();
  v_trial_ends_at timestamptz;
  v_trial_status text;
  v_kind text;
  v_expires_at timestamptz := null;
  v_founder_eligibility text;
  v_founder_window_closed boolean;
  v_evaluation_reason text;
  v_offline_valid_until timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select u.created_at, u.email into v_created_at, v_email
  from auth.users u
  where u.id = v_user_id;

  if v_created_at is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  v_trial_ends_at := v_created_at + interval '14 days';
  v_trial_status := case when v_server_now < v_trial_ends_at then 'active' else 'expired' end;

  -- `expires_at` (colonna reale, 20260610120001_user_roles_expiry.sql:
  -- "NULL = ruolo permanente, valorizzato = valido fino a quella data")
  -- va SEMPRE filtrato: esistono grant pro a tempo realmente in uso —
  -- grant_pro_until_to_email (reward pre-registrazione Play, +1 anno) e
  -- ring_reward_heartbeat (note='ring-reward', +6 mesi,
  -- 20260612120001_ring_reward_antifraud.sql:107-116). Senza questo
  -- filtro un reward SCADUTO verrebbe letto come 'lifetime' permanente
  -- con entitlementExpiresAt null, cioe' accesso Pro perpetuo gratuito.
  -- Nessun cron/trigger ripulisce le righe scadute (verificato: l'unico
  -- filtro pre-esistente e' client-side in fetchRoles()), quindi il
  -- filtro DEVE stare qui.
  if exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro' and note = 'founder-launch'
      and (expires_at is null or expires_at > v_server_now)
  ) then
    v_kind := 'founder';
    v_evaluation_reason := 'founder_role';

  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro' and note ilike '%grandfather%'
      and (expires_at is null or expires_at > v_server_now)
  ) then
    v_kind := 'grandfather';
    v_evaluation_reason := 'grandfather_role';

  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro'
      and expires_at is null
  ) then
    -- SOLO expires_at IS NULL: 'lifetime' e' il bucket "permanente e non
    -- scade mai". Un pro a tempo ancora valido non e' lifetime — cade nel
    -- ramo dedicato subito sotto, con entitlementExpiresAt valorizzato.
    v_kind := 'lifetime';
    v_evaluation_reason := 'lifetime_role';

  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro' and expires_at > v_server_now
  ) then
    v_kind := 'subscription';
    v_evaluation_reason := 'timed_pro_role';
    select max(expires_at) into v_expires_at
    from public.user_roles
    where user_id = v_user_id and role = 'pro' and expires_at > v_server_now;

  elsif exists (
    select 1 from public.b2c_subscriptions t
    where t.user_id = v_user_id and t.state = 'active' and public.is_b2c_lifetime(t)
  ) then
    v_kind := 'lifetime';
    v_evaluation_reason := 'lifetime_subscription_row';

  elsif exists (
    select 1 from public.b2c_subscriptions
    where user_id = v_user_id and billing_source <> 'trial'
      and state in ('active', 'grace') and active_until > v_server_now
  ) then
    v_kind := 'subscription';
    v_evaluation_reason := 'active_subscription_row';
    select active_until into v_expires_at
    from public.b2c_subscriptions
    where user_id = v_user_id and billing_source <> 'trial'
      and state in ('active', 'grace') and active_until > v_server_now
    order by active_until desc
    limit 1;

  elsif lower(v_email) = lower('appreview.demo@fitmesh.fit') then
    v_kind := 'appReview';
    v_evaluation_reason := 'app_review_email';

  elsif v_trial_status = 'active' then
    v_kind := 'trial';
    v_evaluation_reason := 'trial_within_window';
    v_expires_at := v_trial_ends_at;

  else
    v_kind := 'none';
    v_evaluation_reason := 'trial_expired_no_other_entitlement';
  end if;

  -- founderWindowClosed=true e' SOLO un motivo di ineleggibilita' per un
  -- NUOVO grant Founder (permette al client di smettere di richiamare
  -- claim_founder_grant_if_eligible() ad ogni sign-in) — non revoca mai un
  -- entitlement gia' concesso: se v_kind e' gia' 'founder' qui sopra,
  -- questo ramo lo lascia intatto (il fast-path 'founder' e' sempre il
  -- primo controllato, prima di qualunque logica di finestra/cutoff).
  if v_kind = 'founder' then
    v_founder_eligibility := 'already_founder';
    v_founder_window_closed := true;
  elsif v_created_at >= '2026-07-31T22:00:00Z'::timestamptz then
    v_founder_eligibility := 'program_closed';
    v_founder_window_closed := true;
  elsif exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role = 'pro'
  ) then
    -- Gia' pro per QUALUNQUE motivo (grandfather, beta-tester, ring-reward,
    -- reward Play a tempo...): private.grant_founder_launch_core lo
    -- short-circuita al primo controllo, su `role='pro'` nudo senza guardare
    -- `note` (20260728090000, riga 397) — quell'utente ricevera' sempre e
    -- solo alreadyHadEligibleGrant=true, mai un nuovo grant Founder. Dirgli
    -- founderWindowClosed=false lo farebbe richiamare
    -- claim_founder_grant_if_eligible() ad ogni sign-in a vuoto, per sempre.
    -- NOTA: il fast-path SQL non filtra expires_at, quindi qui replichiamo
    -- la stessa condizione non filtrata di proposito — l'obiettivo e'
    -- rispecchiare cosa fara' REALMENTE il motore Founder, non cosa
    -- sarebbe piu' corretto in astratto.
    v_founder_eligibility := 'already_has_pro';
    v_founder_window_closed := true;
  else
    v_founder_eligibility := 'pending_first_sync';
    v_founder_window_closed := false;
  end if;

  -- offlineValidUntil = min(trialEndsAt, serverNow + 24h) — richiesta
  -- esplicita di Matteo dopo il draft consumer app: non ha senso dire al
  -- client "fidati offline per 24h" se il trial scade prima di allora, il
  -- client deve riverificare non oltre la scadenza reale. Il cap si applica
  -- SOLO se trialEndsAt e' ancora nel futuro: per un entitlement permanente
  -- (founder/grandfather/lifetime/subscription) o un trial gia' scaduto da
  -- tempo, trialEndsAt e' irrilevante o nel passato — forzare
  -- offlineValidUntil al passato non avrebbe senso e non serve, perche'
  -- quelle fonti hanno gia' il proprio round-trip server ad ogni apertura
  -- app (vedi doc draft app, punto 5: resolveEntitlementStatus non viene
  -- nemmeno interpellata quando founder/lifetime/subscription sono gia' true).
  --
  -- Una risposta con trial scaduto (trialStatus='expired') NON impedisce in
  -- alcun modo un acquisto o un restore successivi: questa funzione e' sola
  -- lettura, zero side-effect, non tocca mai billing/purchase state — la
  -- decisione di acquistare/restore resta interamente lato store/app.
  if v_trial_ends_at > v_server_now then
    v_offline_valid_until := least(v_server_now + v_offline_grace, v_trial_ends_at);
  else
    v_offline_valid_until := v_server_now + v_offline_grace;
  end if;

  return jsonb_build_object(
    'contractVersion', v_contract_version,
    'serverNow', v_server_now,
    'trialStartedAt', v_created_at,
    'trialEndsAt', v_trial_ends_at,
    'trialStatus', v_trial_status,
    'entitlementKind', v_kind,
    'entitlementExpiresAt', v_expires_at,
    'evaluationReason', v_evaluation_reason,
    'founderEligibility', v_founder_eligibility,
    'founderWindowClosed', v_founder_window_closed,
    'offlineValidUntil', v_offline_valid_until
  );
end;
$$;

revoke all on function public.get_entitlement_status() from public, anon;
grant execute on function public.get_entitlement_status() to authenticated;
