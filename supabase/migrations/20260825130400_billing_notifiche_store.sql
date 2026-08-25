-- ============================================================================
-- F5 — IL REGISTRO DELLE NOTIFICHE DEGLI STORE
-- ============================================================================
-- Lavoro NUOVO: non consolida niente. Ne' la produzione ne' il ramo
-- `p0/apple-jws-verifier` hanno mai avuto un percorso per le notifiche degli
-- store. Il ramo lo dichiara di se stesso, in un commento del suo codice:
--
--     // revoca lato Play: ne' questo, ne' voidedPurchases, ne' RTDN.
--
-- Senza questo, un rimborso deciso dallo store non arriva mai al server:
-- `billing_pending_revocations` e' la macchina che APPLICHEREBBE le revoche, e
-- fino a oggi non c'era niente che le ricevesse.
--
-- COSA QUESTA TABELLA NON CONTIENE
-- --------------------------------
-- Nessun payload, nessun JWS, nessun token, nessuna email. Solo: quale store,
-- quale identificatore di consegna, che tipo di notifica, quale chiave di
-- proprieta' ne e' toccata, e quando. Tutto cio' che serve a deduplicare e a
-- indagare, niente di cio' che non si potrebbe comunque scrivere da nessuna
-- parte.
--
-- L'identificatore di consegna e' `notificationUUID` per Apple e `messageId`
-- per Pub/Sub. Sono entrambi stabili attraverso i tentativi di riconsegna: e'
-- la proprieta' su cui poggia tutta l'idempotenza.
--
-- L'ORDINE, CHE E' LA PARTE CHE CONTA
-- -----------------------------------
-- 1. si verifica la firma;
-- 2. si APRE la notifica — cioe' si scrive la riga, in modo durevole;
-- 3. si applica l'effetto chiamando la stessa autorita' della route sincrona;
-- 4. si CHIUDE la notifica;
-- 5. solo allora si risponde 2xx.
--
-- Se il passo 3 fallisce, si risponde in modo che lo store RIPROVI, e la riga
-- resta aperta. Un ack dato prima della persistenza e' un fatto che lo store
-- considera consegnato e che noi non abbiamo: e' la forma esatta del difetto
-- che ha gia' fatto perdere un cliente sul percorso sincrono.
--
-- RTDN E' UN SEGNALE, NON UNA VERITA'
-- -----------------------------------
-- Per Google la notifica dice soltanto «guarda questo acquisto». Lo stato vero
-- si rilegge dalla Developer API. La tabella registra il segnale; la decisione
-- resta a chi ha parlato con lo store.
-- ============================================================================

create table if not exists private.billing_store_notifications (
  store text not null
    check (store in ('apple', 'google')),

  -- Apple: `notificationUUID`. Google: `messageId` di Pub/Sub.
  notification_id text not null
    check (length(btrim(notification_id)) between 1 and 200),

  notification_type text
    check (notification_type is null or length(notification_type) <= 60),
  subtype text
    check (subtype is null or length(subtype) <= 60),

  -- La chiave di proprieta' toccata, quando la notifica la dichiara. Nulla
  -- finche' non lo sappiamo: una notifica che non si e' ancora riusciti a
  -- interpretare non e' una notifica su nessuno.
  billing_source text
    check (billing_source is null or billing_source in ('apple_iap', 'google_play')),
  ownership_key text
    check (ownership_key is null or length(ownership_key) between 1 and 64),

  -- L'orologio dello STORE, non il nostro. Serve alla precedenza temporale
  -- esattamente come nel percorso sincrono.
  store_event_at timestamptz,

  received_at timestamptz not null default now(),
  processed_at timestamptz,

  esito text
    check (esito is null or esito in ('applicata', 'ignorata', 'rifiutata')),

  -- Quante volte lo store ce l'ha riconsegnata. Non e' una curiosita': se
  -- cresce senza che `processed_at` si valorizzi, c'e' un effetto che non
  -- riusciamo ad applicare e nessuno se ne accorgerebbe altrimenti.
  consegne integer not null default 1 check (consegne >= 1),

  primary key (store, notification_id)
);

comment on table private.billing_store_notifications is
  'Consegne ricevute da App Store Server Notifications V2 e da Google RTDN. La chiave primaria e'' l''identificatore di consegna dello store, che e'' stabile attraverso le riconsegne: e'' su quello che poggia l''idempotenza. Non contiene payload, JWS, token ne'' dati personali.';

comment on column private.billing_store_notifications.consegne is
  'Numero di consegne ricevute per la stessa notifica. Se cresce mentre processed_at resta nullo, c''e'' un effetto che non riusciamo ad applicare.';

create index if not exists billing_store_notifications_aperte_idx
  on private.billing_store_notifications (received_at)
  where processed_at is null;

alter table private.billing_store_notifications enable row level security;
revoke all on table private.billing_store_notifications
  from public, anon, authenticated, service_role;

-- ── Aprire una notifica ─────────────────────────────────────────────────────
--
-- Ritorna cosa fare, e lo ritorna in modo che il chiamante non debba dedurlo:
--   'nuova'        → applicare l'effetto
--   'gia_applicata'→ replay di qualcosa di gia' fatto: ack e basta
--   'in_corso'     → riconsegna di qualcosa mai chiuso: riprovare l'effetto
--
-- La distinzione fra le ultime due e' il cuore dell'idempotenza. Trattare una
-- riconsegna non chiusa come «gia' fatta» perderebbe per sempre l'effetto di
-- una notifica il cui primo tentativo era morto a meta'.
create or replace function public.apri_notifica_store(
  p_store text,
  p_notification_id text,
  p_notification_type text default null,
  p_subtype text default null
)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_processed timestamptz;
  v_esistente boolean;
begin
  if p_store is null or p_store not in ('apple', 'google') then
    raise exception 'apri_notifica_store: store deve essere apple o google (ricevuto %)', coalesce(p_store, '<null>')
      using errcode = '22023';
  end if;
  if p_notification_id is null or length(btrim(p_notification_id)) = 0 then
    raise exception 'apri_notifica_store: identificatore di consegna obbligatorio. Senza, non esiste idempotenza.'
      using errcode = '22004';
  end if;

  insert into private.billing_store_notifications
    (store, notification_id, notification_type, subtype)
  values
    (p_store, btrim(p_notification_id), p_notification_type, p_subtype)
  on conflict (store, notification_id) do update
    set consegne = private.billing_store_notifications.consegne + 1
  returning processed_at, (xmax <> 0) into v_processed, v_esistente;

  if not v_esistente then
    return 'nuova';
  end if;
  if v_processed is not null then
    return 'gia_applicata';
  end if;
  return 'in_corso';
end;
$$;

comment on function public.apri_notifica_store(text, text, text, text) is
  'Registra in modo durevole una consegna dello store PRIMA che se ne applichi l''effetto, e dice al chiamante se e'' nuova, gia'' applicata o una riconsegna mai chiusa. Le ultime due non vanno confuse: trattare una riconsegna non chiusa come gia'' fatta perderebbe l''effetto per sempre.';

revoke all on function public.apri_notifica_store(text, text, text, text) from public, anon, authenticated;
grant execute on function public.apri_notifica_store(text, text, text, text) to service_role;

-- ── Chiudere una notifica ───────────────────────────────────────────────────
create or replace function public.chiudi_notifica_store(
  p_store text,
  p_notification_id text,
  p_esito text,
  p_billing_source text default null,
  p_ownership_key text default null,
  p_store_event_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_toccate int;
begin
  if p_esito is null or p_esito not in ('applicata', 'ignorata', 'rifiutata') then
    raise exception 'chiudi_notifica_store: esito deve essere applicata, ignorata o rifiutata (ricevuto %)', coalesce(p_esito, '<null>')
      using errcode = '22023';
  end if;

  update private.billing_store_notifications
     set processed_at = pg_catalog.now(),
         esito = p_esito,
         billing_source = coalesce(p_billing_source, billing_source),
         ownership_key = coalesce(p_ownership_key, ownership_key),
         store_event_at = coalesce(p_store_event_at, store_event_at)
   where store = p_store
     and notification_id = btrim(p_notification_id)
     -- Una notifica gia' chiusa non si richiude: il primo esito e' quello
     -- vero, e sovrascriverlo cancellerebbe la storia di cosa e' successo.
     and processed_at is null;

  get diagnostics v_toccate = row_count;
  return v_toccate = 1;
end;
$$;

comment on function public.chiudi_notifica_store(text, text, text, text, text, timestamptz) is
  'Chiude una consegna gia'' aperta, dopo che il suo effetto e'' stato applicato. Ritorna false se non c''era niente da chiudere: una notifica gia'' chiusa non si richiude, perche'' il primo esito e'' quello vero.';

revoke all on function public.chiudi_notifica_store(text, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.chiudi_notifica_store(text, text, text, text, text, timestamptz) to service_role;

-- ── Postcondizione ──────────────────────────────────────────────────────────
-- Le funzioni si esercitano. Il ciclo di vita di una notifica ha tre stati e
-- una transizione che non deve avvenire: si provano tutti e quattro.
do $$
declare
  v1 text; v2 text; v3 text;
  v_chiusa boolean;
  v_richiusa boolean;
  v_consegne int;
  v_esito text;
begin
  -- 1. la prima consegna e' nuova
  v1 := public.apri_notifica_store('apple', 'F5-POSTCONDIZIONE-0001', 'REFUND', null);
  if v1 <> 'nuova' then
    raise exception 'F5: la prima consegna doveva essere «nuova», e'' stata «%»', v1;
  end if;

  -- 2. la riconsegna di qualcosa mai chiuso e' «in_corso», NON «gia_applicata»
  v2 := public.apri_notifica_store('apple', 'F5-POSTCONDIZIONE-0001', 'REFUND', null);
  if v2 <> 'in_corso' then
    raise exception 'F5: la riconsegna non chiusa doveva essere «in_corso», e'' stata «%». Cosi'' un effetto mai applicato andrebbe perso.', v2;
  end if;

  select consegne into v_consegne
  from private.billing_store_notifications
  where store = 'apple' and notification_id = 'F5-POSTCONDIZIONE-0001';
  if v_consegne <> 2 then
    raise exception 'F5: il contatore delle consegne dice %, atteso 2', v_consegne;
  end if;

  -- 3. si chiude
  v_chiusa := public.chiudi_notifica_store(
    'apple', 'F5-POSTCONDIZIONE-0001', 'applicata', 'apple_iap', 'F5KEY', pg_catalog.now());
  if not v_chiusa then
    raise exception 'F5: la chiusura di una notifica aperta ha risposto false';
  end if;

  -- 4. dopo la chiusura, la riconsegna e' «gia_applicata»
  v3 := public.apri_notifica_store('apple', 'F5-POSTCONDIZIONE-0001', 'REFUND', null);
  if v3 <> 'gia_applicata' then
    raise exception 'F5: dopo la chiusura la riconsegna doveva essere «gia_applicata», e'' stata «%»', v3;
  end if;

  -- 5. la transizione che NON deve avvenire: richiudere con un esito diverso
  v_richiusa := public.chiudi_notifica_store(
    'apple', 'F5-POSTCONDIZIONE-0001', 'rifiutata');
  if v_richiusa then
    raise exception 'F5: una notifica gia'' chiusa si e'' lasciata richiudere. Il primo esito non e'' piu'' quello vero.';
  end if;
  select esito into v_esito
  from private.billing_store_notifications
  where store = 'apple' and notification_id = 'F5-POSTCONDIZIONE-0001';
  if v_esito <> 'applicata' then
    raise exception 'F5: l''esito e'' stato sovrascritto: %', v_esito;
  end if;

  delete from private.billing_store_notifications
  where notification_id = 'F5-POSTCONDIZIONE-0001';

  raise notice 'F5: nuova / in_corso / gia_applicata distinti, e un esito chiuso non si sovrascrive.';
end $$;
