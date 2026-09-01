-- ============================================================================
-- F2 — L'AUTORITA' CANONICA DEL REGISTRO
-- ============================================================================
-- Diciotto funzioni e cinque trigger. Consolida sette migration del ramo
-- `p0/apple-jws-verifier` (20260812093000, 20260813103000, 20260813150000,
-- 20260814080000, 20260814140000, 20260814160000, 20260815090000,
-- 20260815120000, 20260815140000, 20260816120000) nella loro forma FINALE.
--
-- COME SONO STATI OTTENUTI QUESTI CORPI
-- -------------------------------------
-- Non ricopiati dai file: alcune di quelle funzioni sono ridefinite fino a
-- cinque volte lungo il ramo, e prendere la definizione sbagliata non
-- produrrebbe nessun errore visibile — produrrebbe un comportamento diverso.
--
-- Sono stati letti con `pg_get_functiondef` da un contenitore PG17 usa-e-getta
-- su cui era stata applicata l'INTERA catena del filone (69 migration, 0
-- fallite), e trascritti con l'md5 calcolato ALLA SORGENTE e riverificato sul
-- file: `4b87cbf381b83f0581bea82ea3bf6d60`. Il confronto ha un controllo
-- positivo (mutare un byte lo fa diventare rosso), perche' un verificatore che
-- non sa fallire non e' una verifica.
--
-- Controllo positivo della FRESCHEZZA del dump: `_billing_consuma_pending` non
-- contiene piu' `v_owner_mancante`, il ramo irraggiungibile rimosso
-- dall'ultima migration del ramo. Se lo contenesse, il dump avrebbe
-- fotografato uno stato intermedio.
--
-- COSA NON ENTRA, E PERCHE'
-- -------------------------
-- `public.get_entitlement_status()` del filone NON entra, in nessuna forma.
-- La sua versione reimplementa la scala dei diritti in linea invece di
-- delegare a `private.entitlement_core`: e' l'architettura precedente al
-- 16/08. Applicarla rimetterebbe due scale dove oggi ce n'e' una, riporterebbe
-- il ramo `appReview` fuori dalla testa — cioe' il difetto che ha gia'
-- prodotto respingimenti su iOS — e reintrodurrebbe `contract_version: 1`,
-- che il lato app ha gia' ritirato.
--
-- Il filone non e' scritto male: e' scritto prima, e ha cinquantaquattro
-- commit di deriva alle spalle.
--
-- SUL NOME `_billing_project_entitlement`
-- ---------------------------------------
-- Il nome dice «proietta un entitlement» e non e' quello che fa: legge
-- `billing_purchase_states` e scrive UNA riga in `public.b2c_subscriptions`,
-- che ha PRIMARY KEY (user_id). Proietta lo stato d'acquisto, non il diritto.
--
-- Avevo proposto di rinominarla. Ci ho ripensato: un rename tocca sette
-- chiamanti in un percorso che tocca i soldi, per un guadagno di sola
-- chiarezza, dentro un cancello di release. Il nome resta, il significato e'
-- scritto qui e nel commento della funzione.
-- ============================================================================

CREATE OR REPLACE FUNCTION private._b2c_projection_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_mode text;
  v_from_ledger boolean;
  v_key text;
  v_owner uuid;
  v_kind text;
  v_new_source text;
  v_old_source text;
begin
  v_from_ledger := pg_catalog.current_setting('billing.projection', true) = 'on';

  -- ── DELETE ────────────────────────────────────────────────────────────────
  if tg_op = 'DELETE' then
    if v_from_ledger then
      return old;
    end if;
    -- La cancellazione dell'account arriva qui come CASCADE dalla FK verso
    -- public.profiles. Quando succede, la riga padre e' gia' sparita: e' cosi'
    -- che si distingue una cancellazione GDPR da una cancellazione arbitraria,
    -- senza avere un flag da ricordarsi di impostare. Bloccare una
    -- cancellazione GDPR per difendere una proiezione sarebbe la gerarchia di
    -- priorita' sbagliata, ed e' lo stesso ragionamento gia' fatto per il
    -- registro.
    if not exists (select 1 from public.profiles p where p.id = old.user_id) then
      return old;
    end if;
    if old.billing_source in ('apple_iap', 'google_play') then
      raise exception
        'public.b2c_subscriptions: DELETE di una riga commerciale fuori dal registro rifiutata (utente %). Cancellare la proiezione di un acquisto pagato toglie il diritto a chi lo ha comprato, e fa anche passare il controllo di copertura, che conta le righe esistenti.',
        old.user_id
        using errcode = '42501';
    end if;
    return old;
  end if;

  v_new_source := new.billing_source;
  v_old_source := case when tg_op = 'UPDATE' then old.billing_source else null end;

  -- ── Fonti che non sono acquisti store ────────────────────────────────────
  --
  -- 'stripe' non e' fra queste: la FASE 1 ha verificato che nel prodotto non
  -- esiste alcun percorso Stripe — zero dipendenze, zero route, zero webhook —
  -- quindi una riga stripe non e' un pagamento che non sappiamo mappare, e'
  -- una riga che nessun percorso legittimo puo' avere scritto. Il CHECK della
  -- proiezione la ammette per ragioni storiche; qui no.
  if v_new_source = 'stripe' and not v_from_ledger then
    raise exception
      'public.b2c_subscriptions: billing_source=stripe non e'' un percorso esistente in questo prodotto. Una riga stripe attiva concederebbe Pro senza che nessuno store abbia verificato niente.'
      using errcode = '42501';
  end if;

  -- Riciclaggio: una riga commerciale che si ridichiara non commerciale esce
  -- dal perimetro del registro, e da quel momento nessun controllo di
  -- copertura la vede piu'. Vale in entrambi i modi, perche' il backend
  -- vecchio non fa mai questa transizione: rifiutarla non gli toglie niente.
  if v_old_source in ('apple_iap', 'google_play')
     and v_new_source not in ('apple_iap', 'google_play')
     and not v_from_ledger then
    raise exception
      'public.b2c_subscriptions: una riga commerciale (%) non si ridichiara % . Uscirebbe dal perimetro del registro senza che nessuno se ne accorga.',
      v_old_source, v_new_source
      using errcode = '42501';
  end if;

  if v_new_source not in ('apple_iap', 'google_play') then
    return new;
  end if;

  if v_from_ledger then
    return new;
  end if;

  -- ── Da qui: scrittura commerciale che NON viene dal registro ─────────────
  --
  -- ORDINE UNICO DEI LOCK — gradino 1, ed e' QUI che l'ordine si decide per
  -- tutti. Vedi il blocco "L'ORDINE UNICO DEI LOCK" in testa alla migration.
  --
  -- La 189 scrive con `INSERT ... ON CONFLICT (user_id) DO UPDATE`: in quella
  -- forma il BEFORE INSERT parte PRIMA dell'insert speculativa, quindi prima
  -- che l'executor abbia un lock sulla riga in conflitto. Senza questa riga la
  -- guardia toccava claims e states per prima e b2c per ultima, all'incontrario
  -- del percorso nuovo. 86-ordine-lock.sh lo riproduceva con tre sessioni
  -- reali: deadlock, e la vittima era claim_store_purchase — cioe' il cliente
  -- che aveva appena pagato.
  --
  -- Su una UPDATE questa riga non aggiunge niente (l'executor ha gia' la
  -- tupla). Su una INSERT di un utente senza riga non blocca niente, perche'
  -- non c'e' niente da bloccare: li' a serializzare restano l'indice unico su
  -- user_id e gli advisory lock del percorso nuovo.
  perform 1 from auth.users u where u.id = new.user_id for key share;
  perform 1 from public.b2c_subscriptions t
   where t.user_id = new.user_id for update;

  -- `for share` sulla riga del modo, e non una semplice lettura: e' cio' che
  -- chiude la corsa fra questa scrittura e il passaggio a strict. Finche'
  -- questa transazione non ha finito, set_billing_projection_guard_mode() —
  -- che prende `for update` sulla stessa riga — non puo' contare le righe
  -- scoperte, e quindi non puo' dichiarare coperta una finestra che questa
  -- scrittura sta ancora aprendo. Il lock e' condiviso: due scritture
  -- commerciali concorrenti non si bloccano fra loro.
  select m.mode into v_mode
  from private.billing_projection_guard_mode m
  where m.singleton
  for share;

  if v_mode = 'strict' then
    raise exception
      'public.b2c_subscriptions: scrittura commerciale fuori dal registro rifiutata (billing_source=%). L''entitlement si scrive solo con public.claim_store_purchase, che iscrive la proprieta'' nella stessa transazione.',
      new.billing_source
      using errcode = '42501';
  end if;

  -- ── compatibility ────────────────────────────────────────────────────────
  -- La chiave si ricava dal valore che il backend vecchio scrive in
  -- external_subscription_id, esattamente come lo ricava il backfill.
  if new.external_subscription_id is null then
    raise warning 'guardia proiezione: riga commerciale senza external_subscription_id, proprieta'' non iscrivibile. La scrittura passa, ma il passaggio a strict la segnalera''.';
    return new;
  end if;

  v_key := case new.billing_source
    when 'google_play' then
      case when new.external_subscription_id ~ '^[0-9a-f]{64}$'
           then new.external_subscription_id
           else pg_catalog.encode(
                  pg_catalog.sha256(pg_catalog.convert_to(new.external_subscription_id, 'UTF8')),
                  'hex')
      end
    else new.external_subscription_id
  end;

  -- Forma incompatibile col vincolo del registro: si lascia passare la
  -- scrittura invece di farla fallire. Una scrittura respinta, con la 189 in
  -- giro, significa una transazione chiusa senza diritto — cioe' il danno che
  -- questa difesa esiste per evitare. Il buco resta visibile: il passaggio a
  -- strict lo trova e si rifiuta di procedere.
  if new.billing_source = 'apple_iap'
     and (pg_catalog.length(v_key) > 64 or v_key ~ '[[:space:]]' or v_key = '') then
    raise warning 'guardia proiezione: chiave Apple di forma inattesa, proprieta'' non iscritta. La scrittura passa.';
    return new;
  end if;

  select c.owner_user_id into v_owner
  from private.billing_purchase_claims c
  where c.billing_source = new.billing_source and c.ownership_key = v_key;

  if found and v_owner is distinct from new.user_id then
    raise exception
      'public.b2c_subscriptions: la transazione presentata risulta di un altro account nel registro. Nessuna proiezione.'
      using errcode = '42501';
  end if;

  -- Un acquisto che il registro sa REVOCATO non torna Pro perche' il backend
  -- vecchio lo ripresenta. La guardia consultava il registro solo per la
  -- proprieta' e mai per lo stato: una singola UPSERT della 189 riportava a
  -- 'active' una riga che il registro dichiarava revocata, e durante la
  -- finestra di compatibilita' l'app legge proprio quella riga.
  --
  -- Non si solleva: un errore, con la 189 in giro, chiude la transazione. Si
  -- lascia passare la scrittura proiettando lo stato VERO, che non concede
  -- accesso.
  -- Un acquisto che il registro sa REVOCATO non torna Pro perche' il backend
  -- vecchio lo ripresenta.
  --
  -- Forzare `new.state := 'expired'` non bastava, ed era anzi pericoloso: la
  -- proiezione ha UNA riga per utente, quindi la riga scaduta di K1 avrebbe
  -- preso il posto di K2 — un secondo acquisto ancora valido dello stesso
  -- utente — o di un Founder. Ripresentare un acquisto rimborsato non deve
  -- poter togliere un diritto che il cliente ha davvero.
  --
  -- Si ricalcola quindi il MIGLIORE diritto posseduto dal registro, e si
  -- SCARTA la scrittura del backend vecchio restituendo NULL: la riga resta
  -- quella autorevole. Il chiamante non riceve un errore — con la 189 in giro
  -- un errore chiude la transazione — vede solo zero righe toccate, che e'
  -- esattamente cio' che sta chiedendo di ottenere.
  if exists (
    select 1 from private.billing_purchase_states s
    where s.billing_source = new.billing_source
      and s.ownership_key = v_key
      and s.state = 'revoked'
  ) then
    raise warning 'guardia proiezione: acquisto revocato nel registro, scrittura scartata e proiezione ricalcolata dal registro.';
    perform private._billing_project_entitlement(new.user_id);
    return null;
  end if;

  v_kind := case when new.external_product_id = 'fitmesh_pro_sub'
                 then 'subscription' else 'lifetime' end;

  -- La proprieta' si iscrive in ogni caso: e' il fatto che la finestra di
  -- rollout esiste per non perdere.
  insert into private.billing_purchase_claims (
    billing_source, ownership_key, external_transaction_id,
    external_product_id, owner_user_id, environment, claimed_at
  ) values (
    new.billing_source, v_key, new.external_order_id,
    new.external_product_id, new.user_id, 'production', pg_catalog.now()
  )
  on conflict (billing_source, ownership_key) do nothing;

  -- Lo stato, con la freschezza dichiarata per quello che e': non viene da un
  -- payload store, viene dalla riga che il backend vecchio sta scrivendo. La
  -- fonte 'projection_compatibility' lo dice, e la regola di precedenza fa il
  -- resto: qualunque evidenza store, anche anteriore, la supera; e questa non
  -- puo' mai sovrascrivere un'evidenza store gia' registrata.
  insert into private.billing_purchase_states (
    billing_source, ownership_key, external_product_id, purchase_kind,
    state, active_until, auto_renewing,
    store_event_at, store_event_source, verified_at
  ) values (
    new.billing_source, v_key, new.external_product_id, v_kind,
    new.state,
    case when v_kind = 'lifetime' and new.active_until <= '9000-01-01'::timestamptz
         then '9999-12-31T23:59:59Z'::timestamptz
         else new.active_until end,
    coalesce(new.auto_renewing, false),
    pg_catalog.now(), 'projection_compatibility', pg_catalog.now()
  )
  on conflict (billing_source, ownership_key) do nothing;

  -- ── Il Founder non si sovrascrive ────────────────────────────────────────
  -- La difesa `billing_source <> 'founder_grant'` vive nella ON CONFLICT di
  -- _billing_project_entitlement, cioe' nel percorso NUOVO. Il backend vecchio
  -- non passa di li': faceva il suo upsert e un utente Founder diventava un
  -- utente apple_iap. Se poi quell'acquisto veniva rimborsato, il Founder non
  -- tornava piu': la sua riga non esisteva piu'.
  --
  -- Restituire OLD invece di sollevare e' voluto: la scrittura "riesce" per
  -- chi la fa, quindi la 189 non riceve un errore e non chiude la transazione,
  -- ma la riga non cambia. Il cliente Founder ha gia' il diritto, e adesso ha
  -- anche la proprieta' del suo acquisto iscritta nel registro: quando si
  -- passera' a strict, il ricalcolo lo vedra'.
  if tg_op = 'UPDATE' and old.billing_source = 'founder_grant' then
    return old;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_cancello_sandbox()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.environment = 'sandbox' then
    if new.owner_user_id is null
       or not public.is_sandbox_reviewer(new.owner_user_id) then
      raise exception
        'registro acquisti: transazione sandbox per un account che non e'' un revisore autorizzato. Una transazione Sandbox e'' gratuita per chiunque abbia un Apple ID di test: senza questo controllo il Pro a vita si regala a chi lo chiede.'
        using errcode = '42501';
    end if;
    if new.ownership_key not like 'sandbox:%' then
      raise exception
        'registro acquisti: ambiente sandbox ma chiave senza prefisso. Sandbox e produzione numerano gli identificativi in spazi indipendenti e possono coincidere: senza prefisso un acquisto di prova rivendicherebbe la proprieta'' di un acquisto vero.'
        using errcode = '22023';
    end if;
    if new.app_account_token is null
       or new.app_account_token <> new.owner_user_id then
      raise exception
        'registro acquisti: su sandbox il legame di account e'' obbligatorio. Senza, un revisore autorizzato potrebbe presentare la transazione Sandbox di chiunque altro. StoreKit 1 non porta questo dato, quindi su sandbox non e'' un percorso reclamabile.'
        using errcode = '42501';
    end if;
  elsif new.ownership_key like 'sandbox:%' then
    raise exception
      'registro acquisti: chiave nello spazio sandbox dichiarata di produzione.'
      using errcode = '22023';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_chiave_da_proiezione(p_billing_source text, p_external_subscription_id text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case p_billing_source
    when 'google_play' then
      case when p_external_subscription_id ~ '^[0-9a-f]{64}$'
           then p_external_subscription_id
           else pg_catalog.encode(
                  pg_catalog.sha256(pg_catalog.convert_to(p_external_subscription_id, 'UTF8')),
                  'hex')
      end
    when 'apple_iap' then p_external_subscription_id
    else null
  end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_consuma_pending(p_billing_source text, p_ownership_key text, p_store_event_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  s record;
  v_persistita boolean := false;
  v_superata   boolean := false;
begin
  -- La riga esatta che il chiamante ha letto, non "la riga di quella chiave":
  -- se nel frattempo ne fosse arrivata una piu' recente, quella deve
  -- sopravvivere e aspettare il proprio giro.
  select * into r
  from private.billing_pending_revocations p
  where p.billing_source = p_billing_source
    and p.ownership_key  = p_ownership_key
    and p.store_event_at = p_store_event_at;

  -- Gia' consumata da qualcun altro: non e' un errore.
  if not found then
    return true;
  end if;

  select * into s
  from private.billing_purchase_states t
  where t.billing_source = p_billing_source
    and t.ownership_key  = p_ownership_key;

  if found then
    v_persistita := s.state = 'revoked'
      and not private._billing_evidenza_supera(
            s.store_event_source, s.store_event_at, s.state,
            r.store_event_source, r.store_event_at, 'revoked');

    v_superata := private._billing_evidenza_supera(
            r.store_event_source, r.store_event_at, 'revoked',
            s.store_event_source, s.store_event_at, s.state);
  end if;

  -- Due condizioni, non tre. Il ramo sul proprietario cancellato e' stato
  -- tolto: non era raggiungibile, e nell'unica corsa che lo sfiorava
  -- cancellava l'ultima copia di un rimborso. Nel dubbio la riga resta.
  if not (v_persistita or v_superata) then
    return false;
  end if;

  delete from private.billing_pending_revocations p
   where p.billing_source = p_billing_source
     and p.ownership_key  = p_ownership_key
     and p.store_event_at = p_store_event_at;

  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_evidenza_supera(p_vecchia_fonte text, p_vecchia_at timestamp with time zone, p_vecchio_stato text, p_nuova_fonte text, p_nuova_at timestamp with time zone, p_nuovo_stato text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case
    -- Un segnaposto non cancella mai un'evidenza store, nemmeno se piu'
    -- recente: e' il caso in cui la 189 riscrive una riga vecchia mentre
    -- l'acquisto e' gia' stato verificato dal percorso nuovo.
    when p_nuova_fonte in ('projection_backfill', 'projection_compatibility')
     and p_vecchia_fonte not in ('projection_backfill', 'projection_compatibility')
      then false
    -- Un'evidenza store supera sempre un segnaposto, anche se anteriore: i due
    -- valori non stanno sullo stesso orologio, e fra i due solo quello dello
    -- store dice qualcosa sull'acquisto.
    when p_vecchia_fonte in ('projection_backfill', 'projection_compatibility')
     and p_nuova_fonte not in ('projection_backfill', 'projection_compatibility')
      then true
    -- UNA REVOCA JWS NON SI ANNULLA CON UNA RICEVUTA LEGACY, E VALE NEI DUE
    -- VERSI.
    --
    -- `revoked` NON e' assorbente: Apple prevede REFUND_REVERSED, cioe'
    -- l'annullamento di un rimborso, e in quel caso l'accesso va RIPRISTINATO
    -- sullo stesso originalTransactionId. Una fotografia JWS piu' recente
    -- senza revoca deve quindi poter riattivare.
    --
    -- Ma verifyReceipt (StoreKit 1) non porta la stessa informazione: il suo
    -- `request_date_ms` e' solo "quando abbiamo chiesto", e una sua risposta
    -- successiva non e' una prova che il rimborso sia stato annullato.
    --
    -- Quindi: una ricevuta legacy non toglie una revoca JWS gia' registrata...
    when p_vecchio_stato = 'revoked'
     and p_nuovo_stato <> 'revoked'
     and p_vecchia_fonte = 'apple_signed_date'
     and p_nuova_fonte = 'apple_request_date'
      then false
    -- ...e non le sbarra nemmeno la strada quando arriva per prima. Era questo
    -- il ramo mancante, e non era simmetria per eleganza: `request_date` e'
    -- l'istante in cui NOI abbiamo chiesto, `signedDate` quello in cui APPLE
    -- ha firmato il rimborso. Il primo e' quasi sempre il piu' recente — basta
    -- che il cliente riapra l'app dopo essere stato rimborsato — e senza
    -- questo ramo la revoca perdeva il confronto per sempre.
    when p_vecchio_stato <> 'revoked'
     and p_nuovo_stato = 'revoked'
     and p_vecchia_fonte = 'apple_request_date'
     and p_nuova_fonte = 'apple_signed_date'
      then true
    -- Stessa classe di orologio: vince la fotografia piu' recente. E' la
    -- regola che Apple documenta per ordinare le evidenze della stessa
    -- transazione.
    -- IL RAMO NUOVO (15/08): a parita' di istante la revoca NON perde.
    --
    -- L'ultimo ramo e' `p_nuova_at > p_vecchia_at`, maggiore STRETTO. Per due
    -- letture della stessa cosa e' giusto. Per un rimborso contro un `active`
    -- no: la route legacy passa lo STESSO requestDateMs sia a
    -- registraAnnullate sia al claim, quindi il pareggio e' la forma normale
    -- di una verifyReceipt con un rinnovo rimborsato accanto a quello vivo, e
    -- con il maggiore stretto quel rimborso non entrava mai.
    --
    -- Il verso opposto resta invariato e deve restarlo: un `active` a parita'
    -- di istante non toglie una revoca gia' registrata, e continua a cadere
    -- sul maggiore stretto.
    --
    -- Sta DOPO i rami dei segnaposto e delle coppie di fonti, che sono piu'
    -- specifici, e PRIMA dell'else.
    when p_vecchio_stato <> 'revoked'
     and p_nuovo_stato = 'revoked'
     and p_nuova_at = p_vecchia_at
      then true
    else p_nuova_at > p_vecchia_at
  end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_lock_prima_di_cancellare_utente()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform 1 from public.b2c_subscriptions t where t.user_id = old.id for update;
  return old;
end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_permesso_sandbox_cambiato()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_utente uuid := coalesce(new.user_id, old.user_id);
begin
  -- Durante la cancellazione di un account questa riga sparisce in cascata da
  -- auth.users. Li' non c'e' nessun diritto da ricalcolare e la riga padre non
  -- esiste piu': ricalcolare vorrebbe dire riscrivere la proiezione di un
  -- utente che si sta cancellando, cioe' resuscitarla.
  if not exists (select 1 from auth.users u where u.id = v_utente) then
    return null;
  end if;

  perform private._billing_project_entitlement(v_utente);
  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_project_entitlement(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := pg_catalog.now();
  v_win record;
  v_projected_state text;
  v_active_until timestamptz;
  v_raw_payload jsonb;
  v_actual record;
begin
  select s.*, c.external_transaction_id, c.owner_user_id,
         c.environment, r.expires_at as permesso_fino_a
    into v_win
  from private.billing_purchase_states s
  join private.billing_purchase_claims c
    on c.billing_source = s.billing_source
   and c.ownership_key  = s.ownership_key
  left join private.billing_sandbox_reviewers r
    on r.user_id = c.owner_user_id
  where c.owner_user_id = p_user_id
    -- Un acquisto Sandbox vale finche' vale il permesso di chi lo ha
    -- presentato. Scaduto quello, torna a essere quello che e' sempre stato:
    -- una transazione gratuita.
    and (c.environment <> 'sandbox' or public.is_sandbox_reviewer(c.owner_user_id))
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
    -- Nessun acquisto commerciale valido. Se pero' in proiezione c'e' ancora
    -- la riga prodotta da un claim Sandbox, quella va tolta adesso: e' l'unico
    -- momento in cui si puo' sapere che il permesso e' finito.
    perform pg_catalog.set_config('billing.projection', 'on', true);
    update public.b2c_subscriptions t
       set state = 'expired',
           auto_renewing = false,
           last_notification_at = pg_catalog.now()
     where t.user_id = p_user_id
       and t.billing_source <> 'founder_grant'
       and t.external_subscription_id like 'sandbox:%'
       and t.state <> 'expired';
    perform pg_catalog.set_config('billing.projection', 'off', true);

    return pg_catalog.jsonb_build_object('projected', false, 'reason', 'no_commercial_purchase');
  end if;

  v_projected_state := case
    when v_win.purchase_kind = 'lifetime' and v_win.state = 'active' then 'active'
    when v_win.purchase_kind = 'subscription'
     and v_win.state in ('active', 'cancelled')
     and v_win.active_until > v_now then 'active'
    when v_win.purchase_kind = 'subscription'
     and v_win.state = 'grace'
     and v_win.active_until > v_now then 'grace'
    when v_win.state = 'revoked' then 'expired'
    -- Un abbonamento marcato attivo ma con la scadenza nel passato non e'
    -- attivo, ed e' proprio la coppia di valori che ha prodotto il difetto
    -- originale. Si proietta per quello che e'.
    when v_win.purchase_kind = 'subscription' and v_win.active_until <= v_now then 'expired'
    else v_win.state
  end;

  -- ── IL DIRITTO NON SUPERA IL PERMESSO ─────────────────────────────────────
  --
  -- Il registro dice 9999-12-31 perche' lo store ha detto lifetime, ed e'
  -- vero. Ma un lifetime Sandbox e' gratuito, e quello che noi concediamo
  -- dura quanto il permesso di quella persona. Senza questo limite la riga
  -- proiettata risulta lifetime a `is_b2c_lifetime()` e nessuno dei due
  -- percorsi di lettura guarda oltre.
  v_active_until := v_win.active_until;
  if v_win.environment = 'sandbox' then
    v_active_until := least(v_active_until, coalesce(v_win.permesso_fino_a, v_now));
  end if;

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

  perform pg_catalog.set_config('billing.projection', 'on', true);

  insert into public.b2c_subscriptions (
    user_id, billing_source, external_product_id, external_subscription_id,
    external_order_id, active_until, auto_renewing, state,
    raw_payload, last_notification_at
  ) values (
    p_user_id, v_win.billing_source, v_win.external_product_id, v_win.ownership_key,
    v_win.external_transaction_id, v_active_until,
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

  perform pg_catalog.set_config('billing.projection', 'off', true);

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
$function$
;

CREATE OR REPLACE FUNCTION private._billing_purchase_claims_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'DELETE' then
    raise exception
      'private.billing_purchase_claims: DELETE vietata. Il registro e'' append-only: cancellare una riga renderebbe l''acquisto reclamabile da un altro utente.'
      using errcode = '42501';
  end if;

  if new.billing_source is distinct from old.billing_source
     or new.ownership_key is distinct from old.ownership_key
     or new.external_transaction_id is distinct from old.external_transaction_id
     or new.external_product_id is distinct from old.external_product_id
     or new.environment is distinct from old.environment
     or new.claimed_at is distinct from old.claimed_at then
    raise exception
      'private.billing_purchase_claims: campi di identita'' immutabili (billing_source, ownership_key, external_transaction_id, external_product_id, environment, claimed_at).'
      using errcode = '42501';
  end if;

  -- Unica transizione ammessa: anonimizzazione. Normalizzata qui perche' la
  -- RI action della FK aggiorna la sola colonna owner_user_id.
  if old.owner_user_id is not null and new.owner_user_id is null then
    new.anonymized_at := coalesce(new.anonymized_at, old.anonymized_at, pg_catalog.now());
    new.app_account_token := null;
    return new;
  end if;

  if new.owner_user_id is distinct from old.owner_user_id then
    raise exception
      'private.billing_purchase_claims: la proprieta'' non si riassegna. Una tombstone non torna reclamabile e un acquisto non passa da un utente all''altro con una UPDATE.'
      using errcode = '42501';
  end if;

  if new.anonymized_at is distinct from old.anonymized_at
     or new.app_account_token is distinct from old.app_account_token then
    raise exception
      'private.billing_purchase_claims: anonymized_at e app_account_token cambiano solo insieme alla tombstone.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_purchase_claims_no_truncate()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  raise exception
    'private.billing_purchase_claims: TRUNCATE vietata. Svuotare il registro renderebbe reclamabile ogni acquisto gia'' assegnato.'
    using errcode = '42501';
end;
$function$
;

CREATE OR REPLACE FUNCTION private._billing_purchase_states_forward_only()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'DELETE' then
    raise exception
      'private.billing_purchase_states non ammette DELETE: lo stato di un acquisto verificato non si cancella (chiave %/%).',
      old.billing_source, old.ownership_key
      using errcode = '42501';
  end if;

  if new.billing_source is distinct from old.billing_source
     or new.ownership_key is distinct from old.ownership_key then
    raise exception
      'private.billing_purchase_states: la chiave d''acquisto e'' immutabile.'
      using errcode = '42501';
  end if;

  -- Prima si confrontava `new.store_event_at < old.store_event_at` e basta,
  -- cioe' due numeri che potevano venire da orologi diversi. Adesso decide la
  -- regola, che sa quali confronti hanno senso.
  if not private._billing_evidenza_supera(
       old.store_event_source, old.store_event_at, old.state,
       new.store_event_source, new.store_event_at, new.state) then
    raise exception
      'private.billing_purchase_states: evidenza che non supera quella registrata (nuova %/% vs registrata %/%). Uno stato non regredisce, e un segnaposto non sovrascrive un''evidenza store.',
      new.store_event_source, new.store_event_at,
      old.store_event_source, old.store_event_at
      using errcode = '22023';
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.billing_apply_pending_revocations(p_max integer DEFAULT 100)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  v_esito jsonb;
  v_outcome text;
  n integer := 0;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(2, 815150000) then
    return 0;
  end if;

  for r in
    select p.billing_source, p.ownership_key, p.external_product_id,
           p.purchase_kind, p.store_event_at, p.store_event_source,
           p.revocation_at
    from private.billing_pending_revocations p
    join private.billing_purchase_claims c
      on c.billing_source = p.billing_source
     and c.ownership_key  = p.ownership_key
    where c.owner_user_id is not null
    order by p.billing_source, p.ownership_key
    limit p_max
  loop
    begin
      -- L'ESITO SI GUARDA. Era un `perform`, cioe' un valore buttato via.
      v_esito := public.record_store_purchase_revocation(
        r.billing_source, r.ownership_key, r.external_product_id,
        r.purchase_kind, r.store_event_at, r.store_event_source,
        r.revocation_at
      );
      v_outcome := v_esito->>'outcome';

      -- LA POSTCONDIZIONE STA IN UN POSTO SOLO. Qui c'era la sua unica
      -- copia scritta bene; l'altro percorso ne aveva una sbagliata. Adesso
      -- entrambe chiamano la stessa funzione, che rilegge il registro e
      -- decide.
      if private._billing_consuma_pending(
           r.billing_source, r.ownership_key, r.store_event_at) then
        n := n + 1;
      else
        raise warning 'revoca in attesa NON applicata e conservata (% %): esito %',
          r.billing_source, left(r.ownership_key, 8), coalesce(v_outcome, 'sconosciuto');
      end if;

    exception when others then
      -- Una riga che solleva non deve fermare le altre, e NON si cancella.
      raise warning 'revoca in attesa non applicata (% %): %',
        r.billing_source, left(r.ownership_key, 8), sqlerrm;
    end;
  end loop;

  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.billing_reconcile_sandbox_projections(p_max integer DEFAULT 200)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  n integer := 0;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(2, 816160000) then
    return 0;
  end if;

  for r in
    select t.user_id
    from public.b2c_subscriptions t
    where t.external_subscription_id like 'sandbox:%'
      and t.state <> 'expired'
      and (t.active_until <= pg_catalog.now()
           or not public.is_sandbox_reviewer(t.user_id))
    order by t.user_id
    limit p_max
  loop
    begin
      perform private._billing_project_entitlement(r.user_id);
      n := n + 1;
    exception when others then
      -- Un account che solleva non deve fermare gli altri.
      raise warning 'proiezione sandbox non riconciliata (%): %', r.user_id, sqlerrm;
    end;
  end loop;

  return n;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.billing_teardown_sandbox_reviewer(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_tolti int;
begin
  delete from private.billing_sandbox_reviewers where user_id = p_user_id;
  get diagnostics v_tolti = row_count;

  return pg_catalog.jsonb_build_object(
    'permessoRimosso', v_tolti > 0,
    'entitlement', private._billing_project_entitlement(p_user_id)
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION private.set_billing_projection_guard_mode(p_mode text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_scoperte bigint;
  v_conflitti bigint;
  v_senza_stato bigint;
begin
  if p_mode not in ('compatibility', 'strict') then
    raise exception 'modo non valido: %', p_mode using errcode = '22023';
  end if;

  -- `for update` PRIMA di contare, non dopo. Le scritture commerciali di
  -- compatibilita' prendono `for share` sulla stessa riga: finche' una di loro
  -- e' in volo, questa aspetta. Senza, fra il conteggio e l'aggiornamento del
  -- modo restava una finestra in cui una scrittura poteva entrare scoperta e
  -- trovarsi, un istante dopo, in un mondo che si dichiarava coperto.
  perform 1 from private.billing_projection_guard_mode where singleton for update;

  if p_mode = 'strict' then
    -- La copertura si controlla sulla CHIAVE, che e' l'identita' della
    -- proprieta', e sull'utente insieme.
    select count(*) into v_scoperte
    from public.b2c_subscriptions t
    where t.billing_source in ('apple_iap', 'google_play')
      and not exists (
        select 1 from private.billing_purchase_claims c
        where c.billing_source = t.billing_source
          and c.ownership_key = private._billing_chiave_da_proiezione(
                t.billing_source, t.external_subscription_id)
          and c.owner_user_id = t.user_id);

    select count(*) into v_conflitti
    from public.b2c_subscriptions t
    join private.billing_purchase_claims c
      on c.billing_source = t.billing_source
     and c.ownership_key = private._billing_chiave_da_proiezione(
           t.billing_source, t.external_subscription_id)
    where t.billing_source in ('apple_iap', 'google_play')
      and c.owner_user_id is distinct from t.user_id;

    select count(*) into v_senza_stato
    from private.billing_purchase_claims c
    where not exists (
      select 1 from private.billing_purchase_states s
      where s.billing_source = c.billing_source
        and s.ownership_key = c.ownership_key);

    if v_scoperte > 0 or v_conflitti > 0 or v_senza_stato > 0 then
      raise exception
        'passaggio a strict rifiutato: % righe commerciali la cui transazione non e'' registrata, % attribuite a un altro utente, % proprieta'' senza stato (invisibili al ricalcolo). Finche'' esistono, strict non chiuderebbe la finestra: la dichiarerebbe chiusa. Eseguire il backfill e ricontrollare.',
        v_scoperte, v_conflitti, v_senza_stato
        using errcode = '42501';
    end if;
  end if;

  update private.billing_projection_guard_mode
     set mode = p_mode, changed_at = pg_catalog.now(), note = p_note
   where singleton;

  return pg_catalog.jsonb_build_object('mode', p_mode, 'changedAt', pg_catalog.now());
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_store_purchase(p_billing_source text, p_ownership_key text, p_owner_user_id uuid, p_external_product_id text, p_purchase_kind text, p_environment text, p_state text, p_active_until timestamp with time zone, p_auto_renewing boolean, p_store_event_at timestamp with time zone, p_store_event_source text, p_external_transaction_id text DEFAULT NULL::text, p_app_account_token uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_pending record;
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

  if p_external_product_id is null
     or p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'claim_store_purchase: p_external_product_id "%" non e uno degli SKU supportati (fitmesh_pro_lifetime, fitmesh_pro_sub).', left(coalesce(p_external_product_id, '<null>'), 40)
      using errcode = '22023';
  end if;

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

  if p_state is null or p_state not in ('active', 'grace', 'on_hold', 'paused', 'expired', 'cancelled') then
    raise exception 'claim_store_purchase: p_state non ammesso su questo percorso (ricevuto %). Per rimborso o revoca usare public.record_store_purchase_revocation.', p_state
      using errcode = '22023';
  end if;

  if p_store_event_at is null or p_store_event_source is null then
    raise exception 'claim_store_purchase: p_store_event_at e p_store_event_source obbligatori. Senza un ordinamento dichiarato non si puo'' sapere se questa evidenza sia piu'' recente di quella registrata, e in dubbio non si scrive.'
      using errcode = '22004';
  end if;
  -- Il backend dichiara solo orologi di store. I segnaposto sono del backfill
  -- e della guardia di compatibilita', e non regrediscono mai: metterli in
  -- mano al chiamante significherebbe dargli il modo di murare uno stato che
  -- nessuno store sostiene.
  if p_store_event_source not in ('apple_signed_date', 'apple_request_date', 'google_backend_fetch') then
    raise exception 'claim_store_purchase: p_store_event_source "%" non e'' un orologio di store. I segnaposto (projection_backfill, projection_compatibility) non si dichiarano da qui.', p_store_event_source
      using errcode = '22023';
  end if;
  if p_store_event_at > pg_catalog.now() + interval '24 hours' then
    raise exception 'claim_store_purchase: p_store_event_at nel futuro (%). Un orologio store cosi'' avanti non e'' un ordinamento affidabile.', p_store_event_at
      using errcode = '22023';
  end if;

  if p_app_account_token is not null and p_app_account_token <> p_owner_user_id then
    raise exception 'claim_store_purchase: app_account_token non coincide con il proprietario. Il binding di account va risolto nel backend PRIMA del claim.'
      using errcode = '22023';
  end if;

  -- ORDINE UNICO DEI LOCK — gradini 0 e 1. Vedi il blocco "L'ORDINE UNICO DEI
  -- LOCK" in testa a questa migration.
  --
  -- Il `for key share` su auth.users lo prenderebbe comunque la FK del
  -- registro, ma alla fine e non all'inizio: prenderlo qui e' cio' che mette
  -- questa transazione nello stesso ordine di una cancellazione account.
  perform 1 from auth.users u where u.id = p_owner_user_id for key share;
  perform 1 from public.b2c_subscriptions t
   where t.user_id = p_owner_user_id for update;

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
    where private._billing_evidenza_supera(
            private.billing_purchase_states.store_event_source,
            private.billing_purchase_states.store_event_at,
            private.billing_purchase_states.state,
            excluded.store_event_source,
            excluded.store_event_at,
            excluded.state);

    v_state_applied := found;

    -- ── IL RIMBORSO CHE E' ARRIVATO PRIMA DELL'ACQUISTO ──────────────────
    --
    -- Prima di proiettare qualunque diritto, si guarda se per questa chiave
    -- esiste gia' una revoca in attesa. Ce n'e' una quando l'evidenza del
    -- rimborso e' arrivata mentre l'acquisto non era ancora nel registro:
    -- succede nella corsa fra revoca e claim, e succede — piu' spesso — quando
    -- un client valida tardi una transazione gia' rimborsata.
    --
    -- Senza questo passaggio quella revoca veniva scartata e il claim
    -- successivo concedeva il Pro su un acquisto rimborsato. Con questo, il
    -- fatto aspetta il suo acquisto e gli si applica addosso.
    select * into v_pending
    from private.billing_pending_revocations r
    where r.billing_source = p_billing_source
      and r.ownership_key  = p_ownership_key;

    if found then
      insert into private.billing_purchase_states (
        billing_source, ownership_key, external_product_id, purchase_kind,
        state, active_until, auto_renewing,
        store_event_at, store_event_source, revocation_at, verified_at
      ) values (
        p_billing_source, p_ownership_key, v_pending.external_product_id,
        v_pending.purchase_kind, 'revoked',
        case when v_pending.purchase_kind = 'lifetime'
             then '9999-12-31T23:59:59Z'::timestamptz
             else v_pending.store_event_at end,
        false,
        v_pending.store_event_at, v_pending.store_event_source,
        coalesce(v_pending.revocation_at, v_pending.store_event_at), pg_catalog.now()
      )
      on conflict (billing_source, ownership_key) do update set
        state              = 'revoked',
        auto_renewing      = false,
        store_event_at     = excluded.store_event_at,
        store_event_source = excluded.store_event_source,
        revocation_at      = excluded.revocation_at,
        verified_at        = excluded.verified_at
      -- La stessa regola di precedenza di tutto il resto: se l'evidenza che
      -- stiamo reclamando adesso e' PIU' RECENTE della revoca in attesa, la
      -- revoca perde ed e' giusto cosi' — e' il caso di un riacquisto dopo un
      -- rimborso, che deve tornare a dare accesso.
      where private._billing_evidenza_supera(
              private.billing_purchase_states.store_event_source,
              private.billing_purchase_states.store_event_at,
              private.billing_purchase_states.state,
              excluded.store_event_source,
              excluded.store_event_at,
              excluded.state);

      -- UNICA AUTORITA'. Qui c'era una DELETE incondizionata, e il commento
      -- sopra dichiarava una disgiunzione ("applicata o battuta") che il
      -- codice non verificava: sul pareggio nessuno dei due membri era vero e
      -- la riga spariva lo stesso. Il claim raccoglie le pending DENTRO la
      -- propria transazione, quindi quella era l'ULTIMA copia del rimborso e
      -- la rete di riserva non aveva piu' niente da riprovare.
      perform private._billing_consuma_pending(
        p_billing_source, p_ownership_key, v_pending.store_event_at);
    end if;

    v_entitlement := private._billing_project_entitlement(p_owner_user_id);

  exception
    -- ── UN RIFIUTO NON E' UN GUASTO ──────────────────────────────────────
    --
    -- Il cancello Sandbox vive sulla tabella, quindi si manifesta qui dentro
    -- come eccezione durante la scrittura. Senza questo ramo finiva nel
    -- `when others` e usciva come `persistence_failed`, che per il client
    -- significa "colpa nostra, riprova": un rifiuto di autorizzazione
    -- diventava un ciclo di tentativi infiniti su una cosa che non sara' mai
    -- concessa. Si rilancia, e chi chiama riceve un rifiuto vero.
    when insufficient_privilege or invalid_parameter_value then
      raise;
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_sandbox_reviewer(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from private.billing_sandbox_reviewers r
    where r.user_id = p_user_id
      and r.expires_at > pg_catalog.now()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.record_store_purchase_revocation(p_billing_source text, p_ownership_key text, p_external_product_id text, p_purchase_kind text, p_store_event_at timestamp with time zone, p_store_event_source text, p_revocation_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_owner uuid;
  v_owner_recheck uuid;
  v_claim_apparso boolean := false;
  v_applied boolean := false;
  v_persisted boolean := false;
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
  if p_store_event_source not in ('apple_signed_date', 'apple_request_date', 'google_backend_fetch') then
    raise exception 'record_store_purchase_revocation: p_store_event_source "%" non e'' un orologio di store.', p_store_event_source
      using errcode = '22023';
  end if;

  select c.owner_user_id into v_owner
  from private.billing_purchase_claims c
  where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

  if not found then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
    );

    select c.owner_user_id into v_owner
    from private.billing_purchase_claims c
    where c.billing_source = p_billing_source and c.ownership_key = p_ownership_key;

    v_claim_apparso := found;

    -- Il fatto si scrive in ogni caso, e questo e' cio' che rende lecita una
    -- risposta terminale: non stiamo affermando che nessun claim esista, ma
    -- che qualunque claim arrivi si trovera' addosso questa revoca.
    insert into private.billing_pending_revocations (
      billing_source, ownership_key, external_product_id, purchase_kind,
      store_event_at, store_event_source, revocation_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      p_store_event_at, p_store_event_source, p_revocation_at
    )
    on conflict (billing_source, ownership_key) do update set
      external_product_id = excluded.external_product_id,
      purchase_kind       = excluded.purchase_kind,
      store_event_at      = excluded.store_event_at,
      store_event_source  = excluded.store_event_source,
      revocation_at       = excluded.revocation_at,
      recorded_at         = pg_catalog.now()
    -- Fra due evidenze in attesa vince la fotografia piu' recente, come
    -- ovunque nel registro — e ORA lo chiede alla stessa funzione di tutti gli
    -- altri, invece di riscrivere la regola con un `<`.
    --
    -- Entrambe le evidenze sono revoche, quindi oggi il comparatore si riduce
    -- proprio a "vince il timestamp piu' recente": il comportamento NON cambia,
    -- e nessun test puo' distinguere le due forme. Non e' una correzione, e'
    -- la rimozione di una seconda copia della regola.
    --
    -- Perche' toglierla se e' identica: perche' lo era anche l'altra, in
    -- 20260814080000, finche' qualcuno non ha aggiunto un ramo che valeva solo
    -- per una delle due. La copia scritta a mano non diverge il giorno in cui
    -- la scrivi, diverge il giorno in cui cambi l'originale.
    where private._billing_evidenza_supera(
            private.billing_pending_revocations.store_event_source,
            private.billing_pending_revocations.store_event_at,
            'revoked',
            excluded.store_event_source,
            excluded.store_event_at,
            'revoked');

    if v_claim_apparso then
      -- Il claim ha committato mentre aspettavamo la chiave. La revoca e' al
      -- sicuro, ma NON e' stata applicata: la risposta non e' terminale.
      return pg_catalog.jsonb_build_object(
        'outcome', 'claim_in_flight',
        'applied', false,
        'persisted', false,
        'pendingRegistrata', true
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'outcome', 'unknown_purchase',
      'applied', false,
      'persisted', false,
      -- Dichiarato, perche' e' la differenza fra una risposta terminale lecita
      -- e una scommessa: il rimborso e' scritto e aspetta il suo acquisto.
      'pendingRegistrata', true
    );
  end if;

  if v_owner is null then
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

  -- ORDINE UNICO DEI LOCK — gradini 0 e 1, prima degli advisory. La lettura
  -- del proprietario qui sopra e' una lettura semplice e non prende lock: puo'
  -- essere stale, ed e' esattamente per questo che sotto c'e' una rilettura
  -- dopo gli advisory. Vedi il blocco in testa a 20260812093000.
  perform 1 from auth.users u where u.id = v_owner for key share;
  perform 1 from public.b2c_subscriptions t
   where t.user_id = v_owner for update;

  perform pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext(v_owner::text));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
  );

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
      store_event_at, store_event_source, revocation_at, verified_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      'revoked',
      case when p_purchase_kind = 'lifetime'
           then '9999-12-31T23:59:59Z'::timestamptz
           else p_store_event_at end,
      false,
      p_store_event_at, p_store_event_source,
      coalesce(p_revocation_at, p_store_event_at), pg_catalog.now()
    )
    on conflict (billing_source, ownership_key) do update set
      state              = 'revoked',
      auto_renewing      = false,
      store_event_at     = excluded.store_event_at,
      store_event_source = excluded.store_event_source,
      revocation_at      = excluded.revocation_at,
      verified_at        = excluded.verified_at
    -- Ordinata per fotografia, come tutto il resto. Non c'e' piu' nessuna
    -- eccezione "la revoca vince sempre": con `store_event_at` finalmente
    -- valorizzato col signedDate (e non col revocationDate, che e' anteriore
    -- per costruzione) la revoca e' una fotografia recente e vince da sola.
    -- E deve poter perdere: REFUND_REVERSED e' una fotografia ancora piu'
    -- recente che ripristina l'accesso.
    where private._billing_evidenza_supera(
            private.billing_purchase_states.store_event_source,
            private.billing_purchase_states.store_event_at,
            private.billing_purchase_states.state,
            excluded.store_event_source,
            excluded.store_event_at,
            excluded.state);

    v_applied := found;

    -- `applied = false` non basta a dire che la revoca sia registrata: puo'
    -- voler dire "era gia' revocato" (persistito) oppure "non ho scritto"
    -- (non persistito). Chi legge deve poterli distinguere, perche' su questo
    -- codice il client CHIUDE la transazione.
    select s.state = 'revoked' into v_persisted
    from private.billing_purchase_states s
    where s.billing_source = p_billing_source and s.ownership_key = p_ownership_key;

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

  -- L'esito distingue "la revoca e' nel registro" da "non sono riuscito a
  -- scriverla". Solo il primo autorizza una risposta terminale al client.
  return pg_catalog.jsonb_build_object(
    'outcome', case when v_persisted then 'revoked' else 'not_persisted' end,
    'applied', v_applied,
    'persisted', coalesce(v_persisted, false),
    'entitlement', v_entitlement
  );
end;
$function$
;


-- ── Commenti (dalla stessa sorgente dei corpi) ─────────────────────────────
comment on function private._billing_cancello_sandbox() is 'Le tre condizioni del percorso Sandbox (revisore attivo, coerenza fra ambiente e prefisso della chiave, legame di account) applicate sulla tabella e non nella route: cosi'' valgono per ogni scrittura, compresa quella che qualcuno aggiungera'' domani.';

comment on function private._billing_consuma_pending(p_billing_source text, p_ownership_key text, p_store_event_at timestamp with time zone) is 'Unica autorita'' che puo'' cancellare da private.billing_pending_revocations. Cancella SOLO se la revoca risulta persistita o superata da evidenza piu'' recente, verificate rileggendo lo stato registrato. In ogni altro caso la riga resta e la rete di riserva la riprovera''. Nessun ramo sul proprietario cancellato: non era raggiungibile e cancellava l''ultima copia di un rimborso.';

comment on function private._billing_evidenza_supera(p_vecchia_fonte text, p_vecchia_at timestamp with time zone, p_vecchio_stato text, p_nuova_fonte text, p_nuova_at timestamp with time zone, p_nuovo_stato text) is 'Regola di precedenza fra due evidenze dello store. A parita'' di istante vince la REVOCA: un rimborso che arriva con lo stesso timestamp dell''acquisto non puo'' essere scartato, mentre un acquisto a parita'' di istante non toglie una revoca gia'' registrata.';

comment on function private._billing_lock_prima_di_cancellare_utente() is 'Impone il gradino 1 dell''ordine unico dei lock (riga di public.b2c_subscriptions per prima) anche alla cancellazione account, che passa da due RI action il cui ordine reciproco non e'' documentato. Senza, claim_store_purchase e auth.admin.deleteUser() vanno in deadlock: vedi 86-ordine-lock.sh caso 4b.';

comment on function private._billing_permesso_sandbox_cambiato() is 'Ricalcola l''entitlement quando il permesso Sandbox di un account viene creato, accorciato, prolungato o tolto. Senza, il runbook diceva di fare DELETE sull''allowlist e quel DELETE lasciava il Pro proiettato.';

comment on function private._billing_project_entitlement(p_user_id uuid) is 'Ricalcola la proiezione di entitlement dal registro. Un acquisto Sandbox concede fino alla scadenza del permesso di chi lo ha presentato, mai oltre: e'' cio'' che fa negare per scadenza sia get_entitlement_status() sia la lettura diretta della tabella da parte del client.';

comment on function private.billing_apply_pending_revocations(p_max integer) is 'Applica le revoche rimaste in attesa il cui acquisto e'' comparso dopo. Cancella una riga SOLO dopo che la revoca risulta persistita nel registro oppure superata secondo private._billing_evidenza_supera — non secondo un confronto fra timestamp, che ignora sia i segnaposto sia le ricevute legacy. Su qualunque altro esito la riga resta, perche'' e'' l''ultima copia di quel rimborso.';

comment on function private.billing_reconcile_sandbox_projections(p_max integer) is 'Ricalcola gli account la cui proiezione viene da un acquisto Sandbox ormai scaduto o senza permesso: marca expired oppure riproietta il miglior diritto rimasto. E'' la rete per l''unico caso che nessun trigger puo'' vedere, cioe'' il tempo che passa senza che nessuno scriva niente.';

comment on function private.billing_teardown_sandbox_reviewer(p_user_id uuid) is 'Toglie il permesso Sandbox E ricalcola subito la proiezione, cosi'' il Pro concesso da una transazione gratuita sparisce nello stesso istante del permesso invece di aspettare il prossimo ricalcolo.';

comment on function public.claim_store_purchase(p_billing_source text, p_ownership_key text, p_owner_user_id uuid, p_external_product_id text, p_purchase_kind text, p_environment text, p_state text, p_active_until timestamp with time zone, p_auto_renewing boolean, p_store_event_at timestamp with time zone, p_store_event_source text, p_external_transaction_id text, p_app_account_token uuid) is 'Sprint P0 Apple IAP (B''): claim immutabile della proprieta'' di un acquisto gia'' verificato, aggiornamento dello stato solo se l''evidenza store e'' piu'' recente, ricalcolo del MIGLIORE diritto posseduto e proiezione in public.b2c_subscriptions. Lock in ordine fisso utente->chiave. Restituisce l''entitlement effettivamente proiettato, non l''acquisto ricevuto. NON verifica l''acquisto: la verifica Apple/Google deve essere gia'' avvenuta.';

comment on function public.is_sandbox_reviewer(p_user_id uuid) is 'Vero se quell''account e'' oggi autorizzato a presentare transazioni Apple Sandbox. Solo service_role: la domanda la fa il backend, mai il client.';

comment on function public.record_store_purchase_revocation(p_billing_source text, p_ownership_key text, p_external_product_id text, p_purchase_kind text, p_store_event_at timestamp with time zone, p_store_event_source text, p_revocation_at timestamp with time zone) is 'Registra un rimborso o una revoca su un acquisto gia'' reclamato e ricalcola l''entitlement del proprietario registrato. `unknown_purchase` viene emesso solo dopo aver preso l''advisory lock sulla chiave, quindi esclude un claim in volo; se il claim c''e'' ma non era ancora visibile risponde `claim_in_flight`, che NON autorizza il client a chiudere la transazione.';

comment on function private.set_billing_projection_guard_mode(p_mode text, p_note text) is 'Passa la guardia della proiezione fra compatibility e strict. Il passaggio a strict si RIFIUTA se esiste anche una sola riga commerciale senza proprieta'' registrata: e'' la prova che la finestra di rollout sia stata coperta, non la sua dichiarazione.';


-- ── I trigger, ora che le funzioni esistono ─────────────────────────────────
CREATE TRIGGER billing_purchase_states_forward_only BEFORE DELETE OR UPDATE ON private.billing_purchase_states FOR EACH ROW EXECUTE FUNCTION private._billing_purchase_states_forward_only();
CREATE TRIGGER trg_billing_cancello_sandbox BEFORE INSERT ON private.billing_purchase_claims FOR EACH ROW EXECUTE FUNCTION private._billing_cancello_sandbox();
CREATE TRIGGER trg_billing_permesso_sandbox_cambiato AFTER INSERT OR DELETE OR UPDATE ON private.billing_sandbox_reviewers FOR EACH ROW EXECUTE FUNCTION private._billing_permesso_sandbox_cambiato();
CREATE TRIGGER trg_billing_purchase_claims_immutable BEFORE DELETE OR UPDATE ON private.billing_purchase_claims FOR EACH ROW EXECUTE FUNCTION private._billing_purchase_claims_immutable();
CREATE TRIGGER trg_billing_purchase_claims_no_truncate BEFORE TRUNCATE ON private.billing_purchase_claims FOR EACH STATEMENT EXECUTE FUNCTION private._billing_purchase_claims_no_truncate();

-- ── Permessi ────────────────────────────────────────────────────────────────
-- Le tre funzioni pubbliche sono chiamate dal backend con la chiave di
-- servizio: `service_role` e nessun altro. Tutto il resto vive in `private` e
-- non e' chiamabile da fuori.
revoke all on function public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
) from public, anon, authenticated;
grant execute on function public.claim_store_purchase(
  text, text, uuid, text, text, text, text, timestamptz, boolean, timestamptz, text, text, uuid
) to service_role;

revoke all on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text, timestamptz
) to service_role;

revoke all on function public.is_sandbox_reviewer(uuid) from public, anon, authenticated;
grant execute on function public.is_sandbox_reviewer(uuid) to service_role;

-- Tutte le funzioni di `private`, senza eccezioni.
--
-- Il filone le revocava una per una nelle migration che le introducevano, e
-- ne aveva saltata una: `_billing_evidenza_supera` era rimasta con l'ACL di
-- default, cioe' EXECUTE a PUBLIC. Non era sfruttabile — lo schema `private`
-- non concede USAGE a nessuno tranne il proprietario, verificato in
-- produzione — ma e' il tipo di asimmetria che si chiude quando si vede.
--
-- Consolidando, l'elenco e' generato dal catalogo invece che ricopiato: e' il
-- motivo per cui la dimenticanza non si ripete. La postcondizione qui sotto
-- lo verifica comunque, perche' un elenco generato da un catalogo sbagliato
-- sarebbe sbagliato in silenzio.
revoke all on function private._b2c_projection_guard() from public, anon, authenticated;
revoke all on function private._billing_cancello_sandbox() from public, anon, authenticated;
revoke all on function private._billing_chiave_da_proiezione(p_billing_source text, p_external_subscription_id text) from public, anon, authenticated;
revoke all on function private._billing_consuma_pending(p_billing_source text, p_ownership_key text, p_store_event_at timestamp with time zone) from public, anon, authenticated;
revoke all on function private._billing_evidenza_supera(p_vecchia_fonte text, p_vecchia_at timestamp with time zone, p_vecchio_stato text, p_nuova_fonte text, p_nuova_at timestamp with time zone, p_nuovo_stato text) from public, anon, authenticated;
revoke all on function private._billing_lock_prima_di_cancellare_utente() from public, anon, authenticated;
revoke all on function private._billing_permesso_sandbox_cambiato() from public, anon, authenticated;
revoke all on function private._billing_project_entitlement(p_user_id uuid) from public, anon, authenticated;
revoke all on function private._billing_purchase_claims_immutable() from public, anon, authenticated;
revoke all on function private._billing_purchase_claims_no_truncate() from public, anon, authenticated;
revoke all on function private._billing_purchase_states_forward_only() from public, anon, authenticated;
revoke all on function private.billing_apply_pending_revocations(p_max integer) from public, anon, authenticated;
revoke all on function private.billing_reconcile_sandbox_projections(p_max integer) from public, anon, authenticated;
revoke all on function private.billing_teardown_sandbox_reviewer(p_user_id uuid) from public, anon, authenticated;
revoke all on function private.set_billing_projection_guard_mode(p_mode text, p_note text) from public, anon, authenticated;
-- ── Postcondizione ──────────────────────────────────────────────────────────
-- Non «le funzioni esistono»: le funzioni RISPONDONO. Una postcondizione che
-- interroga solo il catalogo verificherebbe di aver scritto del testo.
do $$
declare
  v_funzioni int;
  v_trigger int;
  v_supera boolean;
  v_non_supera boolean;
  v_acl_aperte int;
begin
  select count(*) into v_funzioni
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prokind = 'f' and n.nspname in ('private','public')
    and (p.proname like '%billing%'
         or p.proname in ('claim_store_purchase','record_store_purchase_revocation',
                          'is_sandbox_reviewer','_b2c_projection_guard'));
  if v_funzioni <> 18 then
    raise exception 'F2: attese 18 funzioni, trovate %', v_funzioni;
  end if;

  select count(*) into v_trigger
  from pg_trigger t where not t.tgisinternal and t.tgname like '%billing%';
  if v_trigger <> 5 then
    raise exception 'F2: attesi 5 trigger billing, trovati %', v_trigger;
  end if;

  -- La precedenza temporale, esercitata in entrambe le direzioni. Un test
  -- solo sul «si» passerebbe anche con una funzione che risponde sempre si'.
  select private._billing_evidenza_supera(
           'apple_signed_date', '2026-08-01 00:00:00+00'::timestamptz, 'active',
           'apple_signed_date', '2026-08-02 00:00:00+00'::timestamptz, 'active')
    into v_supera;
  select private._billing_evidenza_supera(
           'apple_signed_date', '2026-08-02 00:00:00+00'::timestamptz, 'active',
           'apple_signed_date', '2026-08-01 00:00:00+00'::timestamptz, 'active')
    into v_non_supera;
  if v_supera is not true then
    raise exception 'F2: evidenza piu'' recente non supera quella vecchia';
  end if;
  if v_non_supera is not false then
    raise exception 'F2: evidenza piu'' VECCHIA supera quella recente — la precedenza e'' rotta';
  end if;

  -- Nessuna funzione billing deve essere rimasta con EXECUTE a PUBLIC.
  select count(*) into v_acl_aperte
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prokind = 'f' and n.nspname in ('private','public')
    and (p.proname like '%billing%'
         or p.proname in ('claim_store_purchase','record_store_purchase_revocation','is_sandbox_reviewer'))
    and p.proacl is null;   -- proacl NULL = ACL di default = EXECUTE a PUBLIC
  if v_acl_aperte > 0 then
    raise exception 'F2: % funzioni billing con EXECUTE aperto a PUBLIC', v_acl_aperte;
  end if;

  raise notice 'F2: 18 funzioni, 5 trigger, precedenza verde nelle due direzioni.';
end $$;
