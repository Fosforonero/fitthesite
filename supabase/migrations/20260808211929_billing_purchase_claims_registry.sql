-- ============================================================================
-- Sprint P0 Apple IAP, FASE 2/3: registro immutabile di proprieta' degli
-- acquisti store + operazione atomica claim -> proiezione.
--
-- PERCHE' ESISTE QUESTO FILE
--
-- public.b2c_subscriptions e' la PROIEZIONE dell'entitlement corrente, una
-- riga per utente (PK user_id). L'unico scrittore
-- (app/api/v1/billing/validate-purchase/route.ts) fa upsert con
-- `onConflict: "user_id"`. Il vincolo `unique (billing_source,
-- external_subscription_id)` garantisce quindi "non a due utenti
-- CONTEMPORANEAMENTE", non "appartiene per sempre a uno": quando l'utente A
-- presenta una transazione diversa la sua riga viene SOSTITUITA, il vecchio
-- external_subscription_id smette di esistere nella tabella e da quel momento
-- e' di nuovo reclamabile da un utente B. E' il difetto HIGH che questo file
-- chiude. Il limite e' gia' documentato nel commento di upsertSubscription()
-- in route.ts (righe ~192-215): quel commento resta valido finche' il backend
-- non passa dalla RPC introdotta qui.
--
-- La correzione non e' un vincolo in piu' sulla proiezione: una proiezione
-- sostituibile non puo' MAI essere un registro di proprieta'. Servono due
-- oggetti distinti con due cicli di vita distinti:
--
--   private.billing_purchase_claims  registro APPEND-ONLY della proprieta'.
--                                    Una riga per acquisto, mai sostituita,
--                                    mai cancellata, mai riassegnata.
--   public.b2c_subscriptions         proiezione mutevole dell'entitlement
--                                    corrente. Invariata in forma e semantica
--                                    da questo file.
--
-- CHIAVE DI PROPRIETA' PER STORE (esito della FASE 1, mappatura sola lettura)
--
--   apple_iap    ownership_key = originalTransactionId estratto dal JWS gia'
--                verificato crittograficamente (lib/billing/app-store-jws.ts)
--                oppure dalla risposta verifyReceipt nel ramo legacy
--                StoreKit 1. E' l'UNICO identificatore Apple stabile a
--                restore, reinstallazione, cambio device e rinnovo:
--                transactionId per definizione cambia, e il JWS stesso e' un
--                blob rigenerato a ogni consegna, non un identificatore.
--   google_play  ownership_key = SHA-256 esadecimale del purchase token,
--                calcolato dal BACKEND e SOLO DOPO il 200 di Google
--                (purchases.products.get / purchases.subscriptions.get). Il
--                token grezzo non entra mai in questa tabella: vedi la
--                sezione "COSA NON ENTRA" sotto.
--
-- COSA NON ENTRA IN QUESTA TABELLA, PER SCELTA
--
--   - nessun JWS, nessuna ricevuta App Store, nessun purchase token Play in
--     chiaro, nessun raw payload. Un registro di proprieta' deve poter essere
--     letto in supporto e in audit senza esporre credenziali riutilizzabili.
--     Il purchase token Play e' a tutti gli effetti una credenziale: chi lo
--     possiede lo puo' ripresentare. Per questo di lui resta solo un digest
--     non invertibile.
--   - nessuna riga per founder_grant, per il grandfather pre-lancio o per il
--     trial: non sono acquisti store, non hanno una transazione, non hanno un
--     proprietario da difendere da un secondo reclamante. Vivono in
--     public.user_roles / private.founder_seats e restano li'. Il CHECK su
--     billing_source lo impone, e la RPC lo ricontrolla al proprio ingresso.
--   - nessuna riga stripe: verificato in FASE 1 che non esiste alcun percorso
--     Stripe nel prodotto (zero dipendenze, zero route, zero webhook). Un
--     valore ammesso ma mai scritto sarebbe solo una domanda senza risposta
--     su quale sia la sua chiave di proprieta'. Aggiungere uno store richiede
--     una migration nuova, che e' esattamente il punto in cui quella domanda
--     va posta.
--
-- QUESTO FILE NON MODIFICA NESSUN DATO ESISTENTE. Non tocca le 18 righe
-- founder_grant ne' le 4 righe google_play gia' in public.b2c_subscriptions,
-- non esegue backfill, non altera public.b2c_subscriptions in alcun modo
-- (nessun ALTER TABLE, nessun vincolo aggiunto o rimosso). Il registro nasce
-- vuoto: il popolamento retroattivo degli acquisti gia' esistenti e' una
-- decisione separata, da prendere con i dati reali sotto gli occhi.
-- ============================================================================

create schema if not exists private;

-- ============================================================================
-- 1. IL REGISTRO
-- ============================================================================

create table if not exists private.billing_purchase_claims (
  -- Store che ha emesso la transazione. Il CHECK e' volutamente piu' stretto
  -- di quello di public.b2c_subscriptions (che ammette anche 'stripe' e
  -- 'trial'): qui entrano solo gli store per cui la FASE 1 ha stabilito una
  -- chiave di proprieta' stabile e verificata server-side.
  billing_source text not null
    check (billing_source in ('apple_iap', 'google_play')),

  -- Identificatore STABILE della proprieta'. Semantica per store nella
  -- testata del file. Non e' mai il token/JWS grezzo.
  ownership_key text not null,

  -- Identificatore della singola transazione che ha stabilito la proprieta',
  -- registrato una volta sola al primo claim e mai aggiornato. Apple:
  -- transactionId. Google: orderId (assente per alcuni acquisti di test o
  -- promozionali, da qui il nullable). Valore informativo e di audit: non e'
  -- e non puo' essere la chiave, perche' cambia a ogni rinnovo e a ogni
  -- restore.
  external_transaction_id text null,

  -- Prodotto acquistato (fitmesh_pro_lifetime / fitmesh_pro_sub). Serve al
  -- supporto per rispondere a "cosa ha comprato" senza aprire lo store.
  external_product_id text not null,

  -- Proprietario. Nullable SOLO per la tombstone di cancellazione account
  -- (sezione 3). Un NULL qui non significa mai "libero".
  owner_user_id uuid null references auth.users(id) on delete set null,

  -- 'production' | 'sandbox'. Apple lo firma dentro il JWS e il verificatore
  -- lo restituisce come 'Production'/'Sandbox': il backend lo passa in
  -- minuscolo. Google NON espone un equivalente nei campi oggi modellati in
  -- lib/billing/google-play.ts (purchaseType, che distinguerebbe gli acquisti
  -- dei licence tester, non e' letto), quindi oggi ogni claim google_play
  -- viene registrato come 'production'. E' un limite noto e dichiarato, non
  -- una svista: e' anche il motivo per cui l'ambiente NON entra nella chiave
  -- primaria, dove un valore inaffidabile per uno store su due farebbe piu'
  -- danno che bene.
  environment text not null
    check (environment in ('production', 'sandbox')),

  -- appAccountToken Apple: il client lo imposta uguale all'id utente FitMesh,
  -- quindi e' la PROVA di appartenenza piu' forte che abbiamo. Assente su
  -- tutti gli acquisti fatti da build che non lo impostavano e su tutto il
  -- ramo Google, quindi non e' utilizzabile come chiave. Azzerato dalla
  -- tombstone insieme a owner_user_id.
  app_account_token uuid null,

  -- Momento del primo claim. Immutabile: le ripresentazioni successive dello
  -- stesso acquisto non lo spostano, altrimenti il registro racconterebbe
  -- l'ultima sincronizzazione invece della data in cui la proprieta' e' nata.
  claimed_at timestamptz not null default pg_catalog.now(),

  -- Valorizzato solo dalla tombstone. Vedi sezione 3 e retention policy.
  anonymized_at timestamptz null,

  -- Requisito esplicito: la proprieta' e' identificata da (store, chiave).
  constraint billing_purchase_claims_pkey
    primary key (billing_source, ownership_key),

  -- Forma della chiave, asimmetrica di proposito.
  --
  -- google_play: 64 caratteri esadecimali minuscoli, cioe' esattamente uno
  -- SHA-256. Qui possiamo essere rigidi perche' il formato lo produciamo noi:
  -- se un domani qualcuno collegasse il backend passando il purchase token
  -- grezzo (~150 caratteri base64url), questo CHECK lo fermerebbe subito e
  -- rumorosamente, invece di lasciare che una credenziale finisca in chiaro
  -- nel registro. Il fallimento e' il comportamento voluto.
  --
  -- apple_iap: solo lunghezza e assenza di spazi. Apple documenta
  -- originalTransactionId come String, non come intero: un CHECK '^[0-9]+$'
  -- sarebbe piu' bello e piu' pericoloso, perche' l'unico modo in cui puo'
  -- sbagliarsi e' respingere un acquisto vero gia' pagato. In un percorso di
  -- pagamento un falso rifiuto costa piu' di un formato permissivo.
  constraint billing_purchase_claims_ownership_key_shape check (
    case billing_source
      when 'google_play' then ownership_key ~ '^[0-9a-f]{64}$'
      when 'apple_iap'   then length(ownership_key) between 1 and 64
                              and ownership_key !~ '[[:space:]]'
      else false
    end
  ),

  -- Invariante del binding di account: quando l'acquisto porta con se'
  -- l'identita' FitMesh, quella identita' deve essere il proprietario. Il
  -- controllo vive gia' nel backend (route.ts, ramo JWS: 409
  -- purchase_belongs_to_other_account); questo CHECK esiste perche' un
  -- controllo applicativo che nessuno impone a schema prima o poi viene
  -- aggirato da un chiamante nuovo. Sopravvive alla tombstone: quella azzera
  -- entrambi i campi.
  constraint billing_purchase_claims_account_token_matches_owner check (
    app_account_token is null
    or owner_user_id is null
    or app_account_token = owner_user_id
  ),

  -- Coerenza della tombstone nelle due direzioni: un proprietario azzerato
  -- deve avere una data di anonimizzazione (altrimenti sarebbe indistinguibile
  -- da una riga scritta male), e una data di anonimizzazione non puo' convivere
  -- con un proprietario ancora presente.
  constraint billing_purchase_claims_tombstone_consistent check (
    (owner_user_id is null) = (anonymized_at is not null)
  )
);

-- Unicita' dell'id transazione, per store.
--
-- Perche' e' semanticamente corretto: transactionId (Apple) e orderId
-- (Google) sono emessi dallo store e sono univoci nel loro namespace. Due
-- ownership_key diverse che dichiarano lo stesso id transazione non sono un
-- caso legittimo: o la derivazione della chiave e' sbagliata, o qualcuno sta
-- ripresentando un payload manipolato. In entrambi i casi la scrittura giusta
-- e' nessuna scrittura.
--
-- Perche' e' PARZIALE: orderId e' assente su alcuni acquisti Play (test,
-- promozionali), e in Postgres i NULL sono distinti fra loro in un indice
-- unico. Il WHERE rende esplicito cio' che altrimenti sarebbe un
-- comportamento implicito da ricordare a memoria.
--
-- Perche' include billing_source: i namespace Apple e Google sono
-- indipendenti e una collisione fra le due stringhe, per quanto improbabile,
-- non direbbe niente di reale.
create unique index if not exists billing_purchase_claims_transaction_id_idx
  on private.billing_purchase_claims (billing_source, external_transaction_id)
  where external_transaction_id is not null;

-- Un utente ha pochissimi claim: l'indice serve al supporto ("cosa possiede
-- questo account") e alla tombstone, non a un percorso caldo.
create index if not exists billing_purchase_claims_owner_idx
  on private.billing_purchase_claims (owner_user_id)
  where owner_user_id is not null;

alter table private.billing_purchase_claims enable row level security;

comment on table private.billing_purchase_claims is
  'Registro append-only della proprieta'' degli acquisti store. '
  'PK (billing_source, ownership_key). Nessun token/JWS/ricevuta/raw payload. '
  'Righe mai cancellate: alla cancellazione account diventano tombstone '
  'anonime (owner_user_id null, anonymized_at valorizzato), MAI reclamabili '
  'da un altro utente. Scritto esclusivamente da '
  'public.claim_store_purchase().';

comment on column private.billing_purchase_claims.ownership_key is
  'apple_iap: originalTransactionId dal JWS verificato. google_play: SHA-256 '
  'hex del purchase token, calcolato dal backend DOPO il 200 di Google. Mai '
  'il token grezzo.';

comment on column private.billing_purchase_claims.external_transaction_id is
  'Apple transactionId / Google orderId della transazione che ha stabilito la '
  'proprieta'', registrato al primo claim e mai aggiornato. Informativo: non '
  'e'' la chiave, cambia a ogni rinnovo e a ogni restore.';

comment on column private.billing_purchase_claims.anonymized_at is
  'Tombstone GDPR: valorizzato quando l''account proprietario viene '
  'cancellato. La riga resta, la proprieta'' resta occupata, il legame con la '
  'persona sparisce.';

-- ============================================================================
-- 2. IMMUTABILITA' IMPOSTA A SCHEMA, NON PER CONVENZIONE
--
-- Un registro di proprieta' che si puo' aggiornare non e' un registro di
-- proprieta'. Qui l'immutabilita' non e' affidata alla disciplina del
-- chiamante ma a un trigger che rifiuta ogni transizione diversa da quella
-- unica ammessa (proprietario -> tombstone).
--
-- Vietato:
--   - DELETE, sempre, da chiunque (anche dal service_role: vedi sezione 4).
--   - TRUNCATE, che i trigger di riga non intercetterebbero.
--   - qualunque UPDATE su billing_source, ownership_key,
--     external_transaction_id, external_product_id, environment, claimed_at.
--   - riassegnazione del proprietario (uuid -> altro uuid).
--   - resurrezione di una tombstone (null -> uuid): se un acquisto potesse
--     tornare reclamabile dopo la cancellazione dell'account, l'intera
--     difesa sarebbe aggirabile in due mosse (cancella, ricrea, reclama).
--
-- Ammesso, e uno solo:
--   - uuid -> null, cioe' l'anonimizzazione. Il trigger la NORMALIZZA invece
--     di pretenderla ben formata dal chiamante: valorizza anonymized_at e
--     azzera app_account_token da se'. E' voluto, perche' quella UPDATE puo'
--     arrivare da due strade diverse: la RI action `on delete set null` della
--     FK verso auth.users (che aggiorna la sola colonna) oppure una
--     manutenzione esplicita. Se il trigger pretendesse i campi gia' corretti,
--     la prima strada fallirebbe e la cancellazione dell'account verrebbe
--     BLOCCATA. Bloccare una cancellazione GDPR per difendere un registro di
--     acquisti sarebbe la gerarchia di priorita' sbagliata.
--
-- CONSEGUENZA DA CONOSCERE, non un effetto collaterale nascosto: un utente
-- che cancella l'account e se ne crea uno nuovo NON puo' piu' riprendersi
-- l'acquisto, nemmeno con "Ripristina acquisti". E' il prezzo diretto della
-- regola "cancellare l'account non libera la transazione". Il rimedio
-- operativo non e' una UPDATE a mano (il trigger la rifiuta): e' una
-- migration nuova, scritta, rivista e versionata, che e' esattamente il
-- livello di attenzione che merita spostare la proprieta' di un acquisto
-- pagato. Da decidere con Matteo se e quando servira'.
-- ============================================================================

create or replace function private._billing_purchase_claims_immutable()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
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
$$;

revoke all on function private._billing_purchase_claims_immutable() from public, anon, authenticated;

drop trigger if exists trg_billing_purchase_claims_immutable
  on private.billing_purchase_claims;
create trigger trg_billing_purchase_claims_immutable
  before update or delete on private.billing_purchase_claims
  for each row execute function private._billing_purchase_claims_immutable();

create or replace function private._billing_purchase_claims_no_truncate()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
begin
  raise exception
    'private.billing_purchase_claims: TRUNCATE vietata. Svuotare il registro renderebbe reclamabile ogni acquisto gia'' assegnato.'
    using errcode = '42501';
end;
$$;

revoke all on function private._billing_purchase_claims_no_truncate() from public, anon, authenticated;

drop trigger if exists trg_billing_purchase_claims_no_truncate
  on private.billing_purchase_claims;
create trigger trg_billing_purchase_claims_no_truncate
  before truncate on private.billing_purchase_claims
  for each statement execute function private._billing_purchase_claims_no_truncate();

-- ============================================================================
-- 3. RETENTION POLICY (documentata, non implicita)
--
-- Conservazione: ILLIMITATA. Nessun cron, nessuna scadenza, nessuna
-- cancellazione automatica. La riga di claim sopravvive all'account.
--
-- Alla cancellazione dell'account (public.gdpr_process_deletions() oppure
-- auth.admin.deleteUser(), entrambe passano dalla FK `on delete set null`):
--   VIENE RIMOSSO   owner_user_id, app_account_token. Sono gli unici due
--                   campi che collegano la riga a una persona identificata.
--   VIENE CONSERVATO billing_source, ownership_key, external_transaction_id,
--                   external_product_id, environment, claimed_at,
--                   anonymized_at.
--
-- Perche' il residuo si puo' e si deve conservare: ownership_key e
-- external_transaction_id non identificano un utente FitMesh, identificano una
-- TRANSAZIONE presso lo store. Senza di loro non esiste modo di sapere che
-- quell'acquisto e' gia' stato consumato, e la difesa contro il doppio reclamo
-- svanisce nel momento esatto in cui serve di piu' (cancella account, ricrea,
-- reclama di nuovo). La finalita' e' antifrode e tenuta dei registri di
-- pagamento, e il dato e' gia' ridotto al minimo che quella finalita'
-- consente: non e' comprimibile oltre senza annullarla.
--
-- AZIONE PER MATTEO, non risolvibile in una migration: questa conservazione
-- va rispecchiata nell'informativa privacy (finalita' antifrode, base
-- giuridica, tempo di conservazione illimitato per il solo dato
-- pseudonimizzato di transazione). Va coordinata con quanto gia' dichiarato
-- in Play Data Safety e nell'App Privacy Apple.
-- ============================================================================

-- ============================================================================
-- 4. ACL
--
-- Lo schema private non e' esposto da PostgREST (config.toml: schemas =
-- ["public"]), quindi non e' raggiungibile via API. I revoke sotto servono
-- comunque, perche' "non raggiungibile oggi" e "non concesso" sono due cose
-- diverse e solo la seconda si mantiene da sola.
--
-- Il revoke include service_role di proposito: il backend deve scrivere il
-- registro SOLO attraverso public.claim_store_purchase(), che e' l'unico
-- punto in cui claim e proiezione sono atomici. Una INSERT diretta con la
-- chiave di servizio ricreerebbe, in una forma nuova, esattamente il difetto
-- che stiamo chiudendo. La funzione e' SECURITY DEFINER e continua a
-- funzionare: gira come il proprio owner, non come il chiamante.
-- ============================================================================

revoke all on schema private from public, anon, authenticated;
revoke all on table private.billing_purchase_claims from public, anon, authenticated, service_role;

-- ============================================================================
-- 5. L'OPERAZIONE ATOMICA
--
-- Una sola transazione Postgres per: tentare il claim, decidere l'esito,
-- aggiornare la proiezione. Se la proiezione fallisce, si annulla ANCHE il
-- claim appena creato, altrimenti resterebbe una proprieta' assegnata a un
-- utente che non ha ricevuto l'entitlement, cioe' un cliente che ha pagato,
-- non e' servito, e per giunta non puo' piu' ritentare perche' la sua stessa
-- transazione risulta gia' consumata. E' il caso peggiore possibile ed e' la
-- ragione per cui questo passaggio esiste.
--
-- Il rollback selettivo si ottiene con il blocco BEGIN/EXCEPTION di plpgsql,
-- che apre una sottotransazione: al sollevarsi dell'eccezione tutto cio' che
-- e' stato scritto dentro il blocco viene annullato, e la funzione puo'
-- comunque restituire un esito tipizzato invece di far esplodere la
-- chiamata. Un semplice `raise` annullerebbe tutto ma non lascerebbe niente
-- da leggere al backend.
--
-- ESITI (campo `outcome`):
--   claimed                     proprieta' nuova, assegnata ora.
--   already_owned_by_same_user  gia' sua: successo idempotente. La proiezione
--                               viene comunque riscritta, perche' e' il
--                               percorso normale di un rinnovo o di un
--                               "Ripristina acquisti".
--   owned_by_other_user         di un altro account, oppure di un account
--                               cancellato (tombstone). Nessuna scrittura,
--                               ne' sul registro ne' sulla proiezione.
--   persistence_failed          il database non ha scritto. Niente e' stato
--                               salvato, il claim e' stato annullato,
--                               ritentare e' sicuro e corretto.
--
-- SICUREZZA
--   - SECURITY DEFINER con search_path esplicito e fisso.
--   - EXECUTE revocato da public, anon, authenticated. Concesso al solo
--     service_role.
--   - nessuna autorizzazione derivata da user metadata, da JWT o da qualunque
--     cosa il client possa scrivere. Il proprietario e' un parametro passato
--     dal backend, che lo ha ricavato dalla sessione autenticata e lo ha gia'
--     confrontato con appAccountToken quando presente.
--   - nessun parametro si chiama `row`: e' parola riservata Postgres e ha
--     gia' rotto una migration di questo repository (vedi il commento in
--     20260514120004_init_b2c_subs.sql).
--
-- CONFINE: questa funzione NON verifica l'acquisto. La verifica
-- crittografica Apple e la chiamata a Google restano nel backend e devono
-- essere gia' avvenute. Qui si decide solo DI CHI E' una transazione gia'
-- verificata. Chiamarla con dati non verificati significa registrare una
-- proprieta' su un acquisto inesistente.
-- ============================================================================

create or replace function public.claim_store_purchase(
  p_billing_source text,
  p_ownership_key text,
  p_owner_user_id uuid,
  p_external_product_id text,
  p_environment text,
  p_active_until timestamptz,
  p_state text,
  p_auto_renewing boolean,
  p_external_transaction_id text default null,
  p_app_account_token uuid default null,
  -- Valore da scrivere in public.b2c_subscriptions.external_subscription_id.
  -- Tenuto SEPARATO da p_ownership_key di proposito: la proiezione conserva
  -- oggi il purchase token Play in chiaro, e cambiarne il significato
  -- riscriverebbe la semantica di righe gia' esistenti. Questo file non
  -- tocca dati esistenti.
  p_external_subscription_id text default null,
  p_external_order_id text default null
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
  v_projection_key text;
  v_raw_payload jsonb;
  v_sqlstate text;
  v_message text;
  v_reason text;
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
  if p_external_product_id is null or length(p_external_product_id) = 0 then
    raise exception 'claim_store_purchase: p_external_product_id obbligatorio' using errcode = '22004';
  end if;

  -- Nessun valore a forma di segreto puo' entrare nella proiezione.
  --
  -- public.b2c_subscriptions e' LEGGIBILE dall'utente (policy "self reads own
  -- b2c sub"), e tre di questi parametri finiscono dentro raw_payload. Non
  -- basta che oggi il backend passi un identificativo di prodotto: se domani
  -- qualcuno ci passa per sbaglio un JWS, una ricevuta App Store, un purchase
  -- token o uno shared secret, quel segreto diventa leggibile via API.
  --
  -- La forma e' quella dei blob firmati e delle credenziali: due punti con
  -- segmenti lunghi (JWS), base64 lunghi (ricevute, purchase token), stringhe
  -- esadecimali lunghe (shared secret). Un identificativo di prodotto vero
  -- (fitmesh_pro_lifetime) non assomiglia a nessuna di queste.
  -- Allowlist degli SKU ESATTI, non della forma.
  --
  -- Questa guardia ha gia' sbagliato due volte, e ogni volta perche' era piu'
  -- larga del necessario. Prima era una blocklist: respingeva JWS, ricevute e
  -- purchase token, e lasciava passare uno shared secret esadecimale e un
  -- header "Bearer eyJ...", perche' nessuno dei due somiglia a cio' che stava
  -- cercando. Poi era una forma: '^fitmesh[a-z0-9_.]{1,56}$', che respinge i
  -- travestimenti noti ma accetta comunque qualunque stringa nuova purche'
  -- cominci per "fitmesh".
  --
  -- Gli SKU che vendiamo sono due, e sono noti. Elencarli e' l'unica versione
  -- di questo controllo che non ha bisogno di indovinare niente: cio' che non
  -- e' uno dei due non entra, punto. Aggiungerne uno richiede una migration, ed
  -- e' voluto: un prodotto nuovo e' una decisione, non un dato che arriva.
  if p_external_product_id not in ('fitmesh_pro_lifetime', 'fitmesh_pro_sub') then
    raise exception 'claim_store_purchase: p_external_product_id "%" non e uno degli SKU supportati (fitmesh_pro_lifetime, fitmesh_pro_sub).', left(p_external_product_id, 40)
      using errcode = '22023';
  end if;
  if p_environment is null or p_environment not in ('production', 'sandbox') then
    raise exception 'claim_store_purchase: p_environment deve essere production o sandbox (ricevuto %)', p_environment
      using errcode = '22023';
  end if;
  if p_active_until is null then
    raise exception 'claim_store_purchase: p_active_until obbligatorio (colonna NOT NULL nella proiezione)' using errcode = '22004';
  end if;
  if p_state is null or p_state not in ('active', 'grace', 'on_hold', 'paused', 'expired', 'cancelled') then
    raise exception 'claim_store_purchase: p_state fuori dal CHECK di public.b2c_subscriptions (ricevuto %)', p_state
      using errcode = '22023';
  end if;
  if p_app_account_token is not null and p_app_account_token <> p_owner_user_id then
    -- Il backend deve gia' aver risposto 409 in questo caso. Se arriva fin
    -- qui, il controllo a monte e' saltato: meglio fermarsi che registrare
    -- una proprieta' che contraddice la prova di appartenenza.
    raise exception 'claim_store_purchase: app_account_token non coincide con il proprietario. Il binding di account va risolto nel backend PRIMA del claim.'
      using errcode = '22023';
  end if;

  if p_environment is null or p_environment not in ('production', 'sandbox') then
    raise exception 'claim_store_purchase: p_environment deve essere production o sandbox (ricevuto %)', p_environment
      using errcode = '22023';
  end if;

  v_projection_key := coalesce(p_external_subscription_id, p_ownership_key);

  -- Il contenuto di raw_payload lo COSTRUISCE questa funzione, non lo riceve.
  --
  -- Prima era un parametro jsonb con scritto in un commento che il backend lo
  -- passava gia' sanificato. Un commento non e' una garanzia: bastava un
  -- chiamante distratto, o un domani in cui quel percorso cambia, e dentro
  -- public.b2c_subscriptions.raw_payload (tabella che l'utente LEGGE, policy
  -- "self reads own b2c sub") sarebbe finito un JWS, una ricevuta App Store o
  -- un purchase token Play.
  --
  -- Costruendolo qui dentro, da parametri gia' tipizzati e gia' scritti in
  -- colonne proprie, non esiste piu' nessun canale attraverso cui un segreto
  -- possa arrivarci: non c'e' un parametro capace di trasportarlo.
  --
  -- Deliberatamente ASSENTI: ownership_key, external_subscription_id,
  -- external_order_id e qualunque identificatore di transazione. Vivono gia'
  -- nelle loro colonne, e duplicarli qui allargherebbe la superficie senza
  -- aggiungere niente.
  -- Campi espliciti, scelti uno per uno, e nessun input JSON libero. Ogni
  -- valore qui dentro proviene da un parametro tipizzato che questa funzione
  -- ha gia' validato: lo SKU e' uno dei due dell'allowlist, l'ambiente e' uno
  -- dei due ammessi, la fonte e' uno dei due store.
  --
  -- Tutto il resto (scadenza, stato, rinnovo automatico, identificativi) vive
  -- gia' in colonne proprie di public.b2c_subscriptions: ripeterlo qui non
  -- aggiungerebbe niente e allargherebbe la superficie di una tabella che
  -- l'utente legge.
  v_raw_payload := pg_catalog.jsonb_build_object(
    'source', 'claim_store_purchase',
    'contract_version', 1,
    'ownership_key_derivation_version', 1,
    'billing_source', p_billing_source,
    'product_id', p_external_product_id,
    'environment', p_environment
  );

  -- Serializza i claim concorrenti sulla STESSA chiave. Il vincolo di
  -- unicita' resta l'ultima parola (e infatti e' gestito nell'handler sotto):
  -- il lock evita che due richieste simultanee dello stesso acquisto
  -- arrivino entrambe a leggere "non esiste" e producano una fra loro un
  -- errore invece di un esito pulito.
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
      -- casi non e' di chi sta chiedendo, e non si scrive niente.
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

  -- ── Claim + proiezione, tutto dentro o tutto fuori ──────────────────────
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

    insert into public.b2c_subscriptions (
      user_id, billing_source, external_product_id, external_subscription_id,
      external_order_id, active_until, auto_renewing, state,
      raw_payload, last_notification_at
    ) values (
      p_owner_user_id, p_billing_source, p_external_product_id, v_projection_key,
      p_external_order_id, p_active_until, coalesce(p_auto_renewing, false), p_state,
      v_raw_payload, pg_catalog.now()
    )
    on conflict (user_id) do update set
      billing_source = excluded.billing_source,
      external_product_id = excluded.external_product_id,
      external_subscription_id = excluded.external_subscription_id,
      external_order_id = excluded.external_order_id,
      active_until = excluded.active_until,
      auto_renewing = excluded.auto_renewing,
      state = excluded.state,
      raw_payload = excluded.raw_payload,
      last_notification_at = excluded.last_notification_at;

  exception
    when unique_violation then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_message = message_text;
      -- Due sorgenti possibili, entrambe rollbackate insieme al claim:
      --  1. corsa persa sul registro nonostante l'advisory lock;
      --  2. `unique (billing_source, external_subscription_id)` della
      --     proiezione, cioe' una riga LEGACY scritta prima che il registro
      --     esistesse e appartenente a un altro utente. Il backend puo'
      --     mappare questa reason su 409 invece che su 500.
      v_reason := 'projection_or_registry_unique_violation';
      return pg_catalog.jsonb_build_object(
        'outcome', 'persistence_failed',
        'reason', v_reason,
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
    'ownerDeleted', false
  );
end;
$$;

revoke all on function public.claim_store_purchase(
  text, text, uuid, text, text, timestamptz, text, boolean, text, uuid, text, text
) from public, anon, authenticated;

grant execute on function public.claim_store_purchase(
  text, text, uuid, text, text, timestamptz, text, boolean, text, uuid, text, text
) to service_role;

comment on function public.claim_store_purchase(
  text, text, uuid, text, text, timestamptz, text, boolean, text, uuid, text, text
) is
  'Sprint P0 Apple IAP: claim immutabile della proprieta'' di un acquisto '
  'store gia'' VERIFICATO dal backend, poi aggiornamento della proiezione '
  'public.b2c_subscriptions, nella stessa transazione. Se la proiezione '
  'fallisce viene annullato anche il claim. Esiti: claimed | '
  'already_owned_by_same_user | owned_by_other_user | persistence_failed. '
  'Non verifica l''acquisto: la verifica JWS/Google resta nel backend. '
  'EXECUTE solo a service_role.';

-- ============================================================================
-- DOPO L'APPLY, da verificare (non eseguito da questo file):
--   1. get_advisors(security): nessuna funzione di questo file deve comparire
--      come "SECURITY DEFINER senza search_path fisso", e
--      private.billing_purchase_claims non deve risultare raggiungibile da
--      anon/authenticated.
--   2. select count(*) from public.b2c_subscriptions, prima e dopo: deve
--      coincidere. Questo file non scrive nessuna riga.
--   3. select count(*) from private.billing_purchase_claims: deve essere 0.
--      Il registro nasce vuoto, il backfill degli acquisti gia' esistenti e'
--      una decisione separata.
-- ============================================================================
