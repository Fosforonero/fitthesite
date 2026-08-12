-- ============================================================================
-- I NOVE PUNTI DEL CANCELLO — le difese incomplete, completate
--
-- Il disegno B' (registro append-only, stato per acquisto, proiezione derivata)
-- e' quello giusto e non cambia qui. Quello che cambia sono cinque difese che
-- erano dichiarate e non imposte, e che i test di 80-nove-punti.sql hanno
-- dimostrato aggirabili una per una PRIMA di questa migration.
--
-- Perche' una migration nuova invece di correggere le quattro esistenti:
-- nessuna delle quattro e' mai stata applicata, quindi tecnicamente si
-- potrebbero riscrivere. Ma la storia di come una difesa e' stata trovata
-- incompleta e' informazione, non rumore: chi legge il registro fra sei mesi
-- deve poter vedere che "strict controlla la copertura" e' passato per una
-- versione che la controllava sull'utente invece che sulla transazione.
--
-- ── I punti chiusi qui ─────────────────────────────────────────────────────
--
--   1  il backfill creava i claim ma non gli stati: gli acquisti coperti
--      restavano invisibili al ricalcolo (la parte SQL sta qui, il file di
--      backfill e' aggiornato di conseguenza)
--   2  strict chiedeva "questo utente ha un claim di questa sorgente?" invece
--      di "questa transazione e' registrata?"
--   3  fra il conteggio e il passaggio a strict c'era una corsa
--   4  in compatibility una scrittura commerciale sovrascriveva un Founder
--   5  la guardia si aggirava dichiarando una fonte non commerciale, e non
--      copriva ne' DELETE ne' TRUNCATE
--   6  la freschezza confrontava orologi non equivalenti
--
-- I punti 7, 8 e 9 vivono nel backend e nel client, non qui.
-- ============================================================================

-- ============================================================================
-- 1. IL VOCABOLARIO DELLA FRESCHEZZA, E LA COMPARABILITA' DEGLI OROLOGI
--
-- Il difetto: la guardia in compatibility scriveva `store_event_at = now()` —
-- il NOSTRO orologio — e lo dichiarava 'apple_request_date', cioe' l'orologio
-- di APPLE. Da quel momento l'evidenza vera di un acquisto fatto ieri risultava
-- piu' vecchia della fotografia inventata oggi, e la regola del solo-in-avanti
-- la rifiutava. Lo stato reale di quell'acquisto non era piu' registrabile:
-- ne' un rinnovo, ne' una scadenza, ne' un rimborso. La difesa contro le
-- regressioni si trasformava nel modo di murare uno stato falso.
--
-- La correzione non e' rendere il confronto piu' permissivo: e' smettere di
-- confrontare cose non confrontabili. Un timestamp che non viene da uno store
-- non e' un'evidenza store, e va dichiarato per quello che e'.
-- ============================================================================

alter table private.billing_purchase_states
  drop constraint if exists billing_purchase_states_event_source_check;

alter table private.billing_purchase_states
  add constraint billing_purchase_states_event_source_check check (
    case billing_source
      when 'apple_iap' then store_event_source in (
        'apple_signed_date', 'apple_request_date',
        'projection_backfill', 'projection_compatibility')
      when 'google_play' then store_event_source in (
        'google_backend_fetch',
        'projection_backfill', 'projection_compatibility')
      else false
    end
  );

comment on column private.billing_purchase_states.store_event_source is
  'Da quale orologio viene store_event_at. apple_signed_date / '
  'apple_request_date: orologio di Apple, confrontabili fra loro. '
  'google_backend_fetch: il NOSTRO, all''istante del 200 di Play. '
  'projection_backfill / projection_compatibility: SEGNAPOSTO, nessuno store '
  'ha asserito niente — sono lo stato dedotto da una riga di proiezione '
  'preesistente. Un segnaposto perde SEMPRE contro un''evidenza store, in '
  'entrambe le direzioni del tempo.';

/**
 * La nuova evidenza sostituisce quella registrata?
 *
 * Immutabile e senza accesso a tabelle di proposito: e' una regola, e una
 * regola che legge righe diventa un comportamento.
 */
create or replace function private._billing_evidenza_supera(
  p_vecchia_fonte text, p_vecchia_at timestamptz,
  p_nuova_fonte text,   p_nuova_at timestamptz
)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select case
    -- Un segnaposto non cancella mai un'evidenza store, nemmeno se piu'
    -- recente: e' proprio il caso in cui la 189 riscrive una riga vecchia
    -- mentre l'acquisto e' gia' stato verificato dal percorso nuovo.
    when p_nuova_fonte in ('projection_backfill', 'projection_compatibility')
     and p_vecchia_fonte not in ('projection_backfill', 'projection_compatibility')
      then false
    -- Un'evidenza store supera sempre un segnaposto, anche se il suo timestamp
    -- e' anteriore: i due valori non stanno sullo stesso orologio, e fra i due
    -- l'unico che dice qualcosa sull'acquisto e' quello dello store.
    when p_vecchia_fonte in ('projection_backfill', 'projection_compatibility')
     and p_nuova_fonte not in ('projection_backfill', 'projection_compatibility')
      then true
    -- Stessa classe di orologio: vale l'ordine del tempo. Le due sorgenti Apple
    -- sono lo stesso orologio; una chiave appartiene a un solo store, quindi
    -- Apple e Google non si incontrano mai qui (lo impone il CHECK sopra).
    else p_nuova_at > p_vecchia_at
  end;
$$;

comment on function private._billing_evidenza_supera(text, timestamptz, text, timestamptz) is
  'Regola di precedenza fra due evidenze sullo stesso acquisto. Un segnaposto '
  'perde sempre contro un''evidenza store, in entrambe le direzioni del tempo; '
  'fra evidenze dello stesso orologio vince la piu'' recente.';

-- ============================================================================
-- 2. SOLO IN AVANTI, MA SULL'OROLOGIO GIUSTO
-- ============================================================================
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

  if new.billing_source is distinct from old.billing_source
     or new.ownership_key is distinct from old.ownership_key then
    raise exception
      'private.billing_purchase_states: la chiave d''acquisto e'' immutabile.'
      using errcode = '42501';
  end if;

  -- UNA REVOCA NON E' MAI UNA REGRESSIONE.
  --
  -- E' l'eccezione che la regola degli orologi non puo' esprimere, perche' la
  -- regola confronta timestamp e questa e' una proprieta' dello STATO. Su una
  -- revoca l'evidenza di Apple e' datata a quando APPLE ha deciso il rimborso,
  -- che e' sempre nel passato — spesso prima della nostra ultima validazione,
  -- che porta l'ora in cui abbiamo chiesto NOI. Ordinarle col tempo faceva
  -- scartare la revoca in silenzio, e il cliente teneva il Pro di un acquisto
  -- gia' rimborsato.
  --
  -- 'revoked' e' assorbente per QUELLA chiave, e una chiave e' un acquisto: un
  -- riacquisto genera un originalTransactionId nuovo, quindi una chiave nuova.
  -- Non c'e' niente da proteggere ordinando le revoche.
  if new.state = 'revoked' and old.state <> 'revoked' then
    return new;
  end if;

  -- Prima si confrontava `new.store_event_at < old.store_event_at` e basta,
  -- cioe' due numeri che potevano venire da orologi diversi. Adesso decide la
  -- regola, che sa quali confronti hanno senso.
  if not private._billing_evidenza_supera(
       old.store_event_source, old.store_event_at,
       new.store_event_source, new.store_event_at) then
    raise exception
      'private.billing_purchase_states: evidenza che non supera quella registrata (nuova %/% vs registrata %/%). Uno stato non regredisce, e un segnaposto non sovrascrive un''evidenza store.',
      new.store_event_source, new.store_event_at,
      old.store_event_source, old.store_event_at
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function private._billing_purchase_states_forward_only()
  from public, anon, authenticated;

-- ============================================================================
-- 3. LA GUARDIA SULLA PROIEZIONE, COMPLETA
--
-- Quattro buchi, tutti dimostrati in 80-nove-punti.sql:
--
--   a) usciva subito per qualunque billing_source non commerciale. 'stripe' e'
--      ammesso dal CHECK della proiezione, non ha alcun percorso nel prodotto,
--      e il contratto di entitlement non lo esclude: bastava scrivere quella
--      parola per concedere Pro senza che nessuno store avesse verificato
--      niente. E' lo stato Y, raggiunto cambiando una stringa.
--   b) una riga commerciale gia' proiettata poteva essere aggiornata
--      dichiarandosi 'trial': usciva dal perimetro e nessun controllo di
--      copertura la vedeva piu'.
--   c) `before insert or update`: cancellare la riga di proiezione di un
--      acquisto pagato toglieva il Pro a chi lo aveva comprato E faceva passare
--      il controllo di copertura, che conta righe esistenti.
--   d) in compatibility completava la scrittura anche quando la riga esistente
--      era un Founder, che spariva.
-- ============================================================================
create or replace function private._b2c_projection_guard()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
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
  if exists (
    select 1 from private.billing_purchase_states s
    where s.billing_source = new.billing_source
      and s.ownership_key = v_key
      and s.state = 'revoked'
  ) then
    raise warning 'guardia proiezione: acquisto revocato nel registro, proiettato come scaduto invece che attivo.';
    new.state := 'expired';
    new.auto_renewing := false;
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
$$;

revoke all on function private._b2c_projection_guard() from public, anon, authenticated, service_role;

drop trigger if exists b2c_projection_guard on public.b2c_subscriptions;
create trigger b2c_projection_guard
  before insert or update or delete on public.b2c_subscriptions
  for each row execute function private._b2c_projection_guard();

-- I trigger di riga non intercettano TRUNCATE, e svuotare la proiezione
-- significa togliere il Pro a tutti in una istruzione. Il registro ha gia'
-- questa difesa (trg_billing_purchase_claims_no_truncate); la proiezione no.
create or replace function private._b2c_no_truncate()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
begin
  raise exception
    'public.b2c_subscriptions: TRUNCATE vietata. Svuotare la proiezione toglierebbe il diritto a ogni cliente pagante in una sola istruzione, e nessun trigger di riga se ne accorgerebbe.'
    using errcode = '42501';
end;
$$;

revoke all on function private._b2c_no_truncate() from public, anon, authenticated;

drop trigger if exists trg_b2c_no_truncate on public.b2c_subscriptions;
create trigger trg_b2c_no_truncate
  before truncate on public.b2c_subscriptions
  for each statement execute function private._b2c_no_truncate();

-- ============================================================================
-- 4. IL PASSAGGIO A STRICT: LA COPERTURA E' DELLA TRANSAZIONE, NON DELL'UTENTE
--
-- Il conteggio chiedeva "esiste un claim di questa sorgente intestato a questo
-- utente?". Un utente che possiede un acquisto Apple e ne ha in proiezione un
-- SECONDO, mai registrato, risultava coperto. Il passaggio a strict veniva
-- concesso e la finestra dichiarata chiusa mentre era aperta — che e'
-- esattamente il modo di fallire contro cui questa funzione esisteva.
--
-- Si aggiunge anche il terzo conteggio: un claim senza stato e' invisibile al
-- ricalcolo, perche' _billing_project_entitlement entra da
-- billing_purchase_states. Un acquisto coperto ma senza stato e' un cliente
-- che, al primo ricalcolo, non risulta possedere niente.
-- ============================================================================
create or replace function private.set_billing_projection_guard_mode(
  p_mode text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
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
$$;

revoke all on function private.set_billing_projection_guard_mode(text, text)
  from public, anon, authenticated, service_role;

-- La derivazione della chiave dalla proiezione stava scritta tre volte
-- identica — nella guardia, nel controllo di strict, nel backfill — e una
-- regola scritta tre volte e' una regola che prima o poi diverge in uno dei
-- tre posti. Qui e' una sola.
create or replace function private._billing_chiave_da_proiezione(
  p_billing_source text, p_external_subscription_id text)
returns text
language sql
immutable
set search_path to ''
as $$
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
$$;

revoke all on function private._billing_chiave_da_proiezione(text, text)
  from public, anon, authenticated, service_role;

-- ============================================================================
-- 5. LE DUE RPC: LA PRECEDENZA PASSA DALLA REGOLA, E I SEGNAPOSTO NON SI
--    DICHIARANO DAL BACKEND
--
-- Entrambe usavano `where ... store_event_at < excluded.store_event_at`, che
-- e' il confronto fra due numeri senza sapere da quale orologio vengano. Adesso
-- decide _billing_evidenza_supera. E il backend non puo' dichiarare una fonte
-- segnaposto: quelle esistono per il backfill e per la guardia, e un backend
-- che potesse usarle scriverebbe uno stato che nessuno store sostiene e che non
-- regredisce mai.
-- ============================================================================
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

  perform pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext(p_owner_user_id::text));
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('billing-purchase-claim:' || p_billing_source || ':' || p_ownership_key)
  );

  -- La riga di proiezione si blocca ADESSO, prima del registro, e non alla
  -- fine dentro _billing_project_entitlement.
  --
  -- Gli advisory lock non bastavano, perche' la guardia di compatibilita' non
  -- ne prende nessuno: una UPDATE della 189 su public.b2c_subscriptions blocca
  -- la tupla PRIMA che parta il BEFORE trigger, e il trigger poi legge
  -- billing_purchase_claims. Ordine b2c -> claims da una parte, claims -> b2c
  -- dall'altra: un ABBA, riprodotto con due sessioni concorrenti, in cui la
  -- vittima era il percorso NUOVO e a vincere era la scrittura della 189.
  -- Prendendola qui, entrambi i percorsi vedono b2c prima di claims.
  perform 1 from public.b2c_subscriptions t
   where t.user_id = p_owner_user_id for update;

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
            excluded.store_event_source,
            excluded.store_event_at);

    v_state_applied := found;

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
    return pg_catalog.jsonb_build_object('outcome', 'unknown_purchase', 'applied', false);
  end if;
  if v_owner is null then
    return pg_catalog.jsonb_build_object('outcome', 'owner_deleted', 'applied', false);
  end if;

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
      store_event_at, store_event_source, verified_at
    ) values (
      p_billing_source, p_ownership_key, p_external_product_id, p_purchase_kind,
      'revoked',
      case when p_purchase_kind = 'lifetime'
           then '9999-12-31T23:59:59Z'::timestamptz
           else p_store_event_at end,
      false,
      p_store_event_at, p_store_event_source, pg_catalog.now()
    )
    on conflict (billing_source, ownership_key) do update set
      state              = 'revoked',
      auto_renewing      = false,
      -- La freschezza avanza solo se l'evidenza e' davvero piu' recente: una
      -- revoca vecchia registra il FATTO senza far arretrare l'orologio.
      store_event_at     = greatest(private.billing_purchase_states.store_event_at,
                                    excluded.store_event_at),
      store_event_source = case
        when excluded.store_event_at > private.billing_purchase_states.store_event_at
        then excluded.store_event_source
        else private.billing_purchase_states.store_event_source end,
      verified_at        = excluded.verified_at
    -- UNA REVOCA NON E' MAI UNA REGRESSIONE, e non si ordina col tempo.
    --
    -- Prima qui c'era la stessa regola di freschezza del claim, e il commento
    -- diceva che le due sorgenti Apple sono "lo stesso orologio". Sono lo
    -- stesso orologio ma datano EVENTI DIVERSI: `apple_request_date` e' quando
    -- abbiamo chiesto NOI (cioe' adesso), `apple_signed_date` su una revoca e'
    -- quando APPLE ha deciso il rimborso, che e' sempre nel passato. Un
    -- lifetime validato dal ramo legacy e poi rimborsato produceva quindi una
    -- revoca piu' "vecchia" della validazione, che veniva scartata in
    -- silenzio: il cliente teneva il Pro di un acquisto gia' rimborsato.
    --
    -- Lo stato 'revoked' e' assorbente per QUELLA chiave, e una chiave e' un
    -- acquisto: un riacquisto genera un originalTransactionId nuovo, quindi
    -- una chiave nuova. Non c'e' niente da proteggere ordinando le revoche.
    where private.billing_purchase_states.state <> 'revoked';

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
$$;

revoke all on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.record_store_purchase_revocation(
  text, text, text, text, timestamptz, text
) to service_role;
