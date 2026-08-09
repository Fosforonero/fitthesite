-- ============================================================================
-- Sprint P0 Apple IAP, FASE 4: backfill del registro di proprieta' a partire
-- dalla proiezione public.b2c_subscriptions.
--
-- QUESTO FILE NON E' UNA MIGRATION, E NON DEVE DIVENTARLO.
--
-- Vive fuori da supabase/migrations/ per la stessa ragione del rollback: la
-- CLI applica in ordine tutto cio' che trova in migrations/, quindi un
-- backfill messo li' verrebbe eseguito da solo al primo `supabase start` o
-- `db push`, su qualunque database, senza che nessuno abbia guardato i dati
-- prima. Un backfill e' una decisione operativa presa una volta sola guardando
-- righe reali, non un pezzo di schema che si riapplica ovunque.
--
-- DEFAULT: DRY RUN. Senza argomenti questo script legge, valida, riporta e
-- poi fa ROLLBACK. Non scrive niente. Per scrivere davvero serve passare
-- esplicitamente -v claims_backfill_apply=1, e a quel punto il COMMIT e' una
-- scelta cosciente di chi lo lancia.
--
-- USO
--   dry run (default, sicuro):
--     psql "$DB_URL" -v ON_ERROR_STOP=1 \
--       -f supabase/backfill/20260808_billing_purchase_claims_backfill.sql
--   apply reale:
--     psql "$DB_URL" -v ON_ERROR_STOP=1 -v claims_backfill_apply=1 \
--       -f supabase/backfill/20260808_billing_purchase_claims_backfill.sql
--
-- CON QUALE CONNESSIONE: quella amministrativa (postgres / owner), NON la
-- service_role. La migration revoca di proposito ogni privilegio diretto sul
-- registro anche al service_role, che puo' scrivere solo attraverso
-- public.claim_store_purchase(). Qui la RPC non e' utilizzabile: riscriverebbe
-- anche la proiezione, e la proiezione in un backfill e' la SORGENTE, non la
-- destinazione. Si scrive quindi il solo registro, come owner, e la proiezione
-- non viene toccata da nessuna istruzione di questo file.
--
-- COSA FA, IN UNA RIGA: per ogni riga di acquisto store gia' presente nella
-- proiezione crea la riga di proprieta' mancante nel registro, lasciando
-- l'acquisto allo stesso utente che gia' lo possiede oggi.
--
-- COSA NON FA MAI
--   - non aggiorna e non cancella nessuna riga esistente, ne' nel registro
--     (dove il trigger lo vieterebbe comunque) ne' nella proiezione (dove
--     nulla lo vieta, ed e' esattamente per questo che va detto: in questo
--     file non esiste una sola UPDATE o DELETE su public.b2c_subscriptions);
--   - non inventa proprieta' per righe che non sono acquisti store;
--   - non prosegue in presenza di un conflitto: si ferma e lo mostra.
--
-- ATTESO IN PRODUZIONE al momento in cui questo file e' stato scritto:
-- 4 righe google_play, 0 apple_iap, 18 founder_grant (escluse). Il numero va
-- RIVERIFICATO nel pre-apply leggendo il database, non qui: se nel frattempo
-- e' cambiato, il report dello script lo dira' da solo.
-- ============================================================================

\set ON_ERROR_STOP on

-- Default dei parametri, cosi' che lanciarlo senza argomenti sia sempre il
-- caso sicuro invece di un errore di variabile non definita.
\if :{?claims_backfill_apply} \else \set claims_backfill_apply 0 \endif
\if :{?claims_backfill_copy_order_id} \else \set claims_backfill_copy_order_id 0 \endif

begin;

-- ============================================================================
-- 1. INVENTARIO PRIMA
-- ============================================================================

create temporary table _bf_before on commit drop as
select
  (select count(*) from private.billing_purchase_claims) as claim_totali,
  (select count(*) from private.billing_purchase_claims where owner_user_id is null) as claim_tombstone,
  (select count(*) from public.b2c_subscriptions) as proiezione_totali;

\echo ''
\echo '=== STATO PRIMA ==============================================='
select * from _bf_before;

\echo ''
\echo '=== PROIEZIONE PER FONTE ======================================'
select billing_source,
       count(*) as righe,
       count(*) filter (where state = 'active') as attive
from public.b2c_subscriptions
group by billing_source
order by billing_source;

-- ============================================================================
-- 2. CANDIDATI
--
-- Sono candidati SOLO gli acquisti store per cui la FASE 1 ha stabilito una
-- chiave di proprieta' stabile. La chiave si deriva qui esattamente come la
-- deriverebbe il backend:
--   apple_iap    external_subscription_id contiene gia' originalTransactionId
--                (route.ts scrive tx.originalTransactionId in quella colonna),
--                quindi la chiave e' il valore stesso.
--   google_play  external_subscription_id contiene il purchase token IN
--                CHIARO, e la chiave e' il suo SHA-256 esadecimale. Il token
--                grezzo non entra nel registro: e' una credenziale
--                ripresentabile, e il registro deve poter essere letto in
--                supporto senza distribuirla.
--
-- Lo stato NON filtra: si prende anche 'expired' e 'cancelled'. Un abbonamento
-- scaduto resta una transazione gia' consumata da quell'utente, e se non
-- entrasse nel registro tornerebbe reclamabile da chiunque altro, che e'
-- precisamente il difetto che stiamo chiudendo. La proprieta' e' un fatto
-- storico, l'entitlement e' uno stato corrente: sono due cose diverse ed e'
-- il motivo per cui esistono due tabelle.
-- ============================================================================

create temporary table _bf_candidates on commit drop as
select
  s.user_id,
  s.billing_source,
  s.external_product_id,
  s.external_subscription_id,
  s.external_order_id,
  s.state,
  case s.billing_source
    when 'google_play' then encode(sha256(convert_to(s.external_subscription_id, 'UTF8')), 'hex')
    when 'apple_iap'   then s.external_subscription_id
    -- Irraggiungibile finche' il WHERE sotto resta questo. Vale NULL e non
    -- `s.external_subscription_id` di proposito: se un domani qualcuno
    -- allargasse la WHERE a una fonte nuova senza deciderne prima la chiave di
    -- proprieta', il fallback silenzioso scriverebbe nel registro un valore
    -- che NON e' una chiave stabile. Con NULL interviene la validazione V3 e
    -- il backfill si ferma dicendo perche'.
    else null
  end as ownership_key
from public.b2c_subscriptions s
-- SOLO acquisti store. trial, founder_grant e grandfather non sono acquisti,
-- non hanno una transazione e non hanno un proprietario da difendere da un
-- secondo reclamante: il CHECK del registro li rifiuterebbe comunque (23514),
-- ma facendo abortire l'INTERO backfill invece di escluderli. In produzione,
-- dove le righe founder_grant sono 18, quell'abort si tradurrebbe in un
-- backfill che non parte mai e in 4 acquisti Google che restano senza
-- proprietario, cioe' reclamabili.
where s.billing_source in ('apple_iap', 'google_play');

\echo ''
\echo '=== CANDIDATI (acquisti store) ================================'
select billing_source, count(*) as candidati from _bf_candidates
group by billing_source order by billing_source;

\echo ''
\echo '=== ESCLUSI (non sono acquisti store) ========================='
select billing_source, count(*) as righe_escluse
from public.b2c_subscriptions
where billing_source not in ('apple_iap', 'google_play')
group by billing_source order by billing_source;

-- ============================================================================
-- 3. VALIDAZIONI: ogni conflitto ferma tutto, rumorosamente
--
-- Un backfill che "salta le righe strane" e' peggio di un backfill che non
-- parte: lascia il registro incompleto e nessuno se ne accorge, e un acquisto
-- senza claim e' un acquisto reclamabile da un altro utente. Qui ogni
-- anomalia solleva, mostrando le righe interessate.
-- ============================================================================

-- Il flag di copia dell'order id va reso leggibile dal SQL prima delle
-- validazioni, perche' V6 deve poterlo consultare. Sta al livello piu' esterno
-- e non dentro un blocco DO perche' psql NON sostituisce le proprie variabili
-- all'interno delle stringhe dollar-quoted.
\echo ''
\echo '=== PARAMETRI ================================================='
select :'claims_backfill_apply' as apply,
       set_config('claims_bf.copy_order_id', :'claims_backfill_copy_order_id', true) as copy_order_id;

do $$
declare
  v_n int;
  v_dettaglio text;
begin
  -- V1. Fonti presenti nella proiezione che non sono ne' acquisti store
  -- gestiti, ne' esclusioni note. 'stripe' e' il caso concreto: e' ammesso dal
  -- CHECK della proiezione, la FASE 1 ha verificato che non esiste alcun
  -- percorso Stripe nel prodotto, e non ha una chiave di proprieta' definita.
  -- Se un giorno comparisse una riga stripe, saltarla in silenzio significherebbe
  -- lasciare un acquisto pagato senza proprietario: meglio fermarsi e decidere.
  select count(*), string_agg(distinct billing_source, ', ')
    into v_n, v_dettaglio
  from public.b2c_subscriptions
  where billing_source not in (
    'apple_iap', 'google_play',              -- gestiti
    'trial', 'founder_grant', 'grandfather'  -- esclusi per natura, vedi sotto
  );
  if v_n > 0 then
    raise exception
      'BACKFILL FERMO (V1): % righe con fonte non gestita (%). Non e'' un acquisto store con chiave nota e non e'' un''esclusione dichiarata: serve decidere quale sia la sua chiave di proprieta'' PRIMA di scrivere il registro.',
      v_n, v_dettaglio;
  end if;

  -- V2. Chiave Apple fuori dalla forma ammessa dal CHECK del registro.
  -- Intercettata qui per poterla MOSTRARE, invece di lasciare che sia la
  -- INSERT a fallire con un 23514 senza dire quale riga.
  select count(*), string_agg(format('user=%s key=%L', user_id, ownership_key), ' | ')
    into v_n, v_dettaglio
  from _bf_candidates
  where billing_source = 'apple_iap'
    and (length(ownership_key) not between 1 and 64 or ownership_key ~ '[[:space:]]');
  if v_n > 0 then
    raise exception
      'BACKFILL FERMO (V2): % righe apple_iap con external_subscription_id fuori forma: %. Attesa: originalTransactionId, 1..64 caratteri, senza spazi.',
      v_n, v_dettaglio;
  end if;

  -- V3. Chiave vuota. La colonna e' NOT NULL, quindi resta il caso stringa
  -- vuota, che passerebbe il NOT NULL ma non identificherebbe niente.
  select count(*) into v_n from _bf_candidates where coalesce(ownership_key, '') = '';
  if v_n > 0 then
    raise exception
      'BACKFILL FERMO (V3): % righe con external_subscription_id vuoto: non esiste una proprieta'' da registrare.', v_n;
  end if;

  -- V4. Due righe di proiezione che collassano sulla stessa chiave. Per Apple
  -- la mappatura e' l'identita' e il vincolo unique (billing_source,
  -- external_subscription_id) lo escluderebbe gia'; per Google servirebbe una
  -- collisione SHA-256. Il controllo costa nulla e trasforma un'ipotesi in un
  -- fatto verificato.
  select count(*), string_agg(format('%s/%s', billing_source, ownership_key), ' | ')
    into v_n, v_dettaglio
  from (
    select billing_source, ownership_key
    from _bf_candidates
    group by billing_source, ownership_key
    having count(*) > 1
  ) dup;
  if v_n > 0 then
    raise exception
      'BACKFILL FERMO (V4): % chiavi di proprieta'' condivise da piu'' righe di proiezione: %. Due utenti non possono possedere la stessa transazione.',
      v_n, v_dettaglio;
  end if;

  -- V5. IL CONTROLLO CHE CONTA. Esiste gia' un claim per questa chiave, ma
  -- intestato a un altro utente, oppure e' una tombstone di account
  -- cancellato. Sovrascriverlo e' vietato dal trigger e sarebbe sbagliato
  -- comunque: significherebbe spostare la proprieta' di un acquisto pagato
  -- con uno script batch.
  select count(*), string_agg(
           format('%s/%s: registro=%s proiezione=%s',
                  c.billing_source, c.ownership_key,
                  coalesce(r.owner_user_id::text, 'TOMBSTONE'), c.user_id), ' | ')
    into v_n, v_dettaglio
  from _bf_candidates c
  join private.billing_purchase_claims r
    on r.billing_source = c.billing_source
   and r.ownership_key = c.ownership_key
  where r.owner_user_id is distinct from c.user_id;
  if v_n > 0 then
    raise exception
      'BACKFILL FERMO (V5): % acquisti gia'' registrati a un utente DIVERSO da quello della proiezione: %. Va risolto a mano, caso per caso: il registro non si sovrascrive.',
      v_n, v_dettaglio;
  end if;

  -- V6. Solo se si e' scelto di copiare l'order id: collisioni sull'indice
  -- unico parziale (billing_source, external_transaction_id).
  select count(*) into v_n
  from (
    select c.billing_source, c.external_order_id
    from _bf_candidates c
    where c.external_order_id is not null
    group by 1, 2
    having count(*) > 1
  ) d;
  if v_n > 0 and current_setting('claims_bf.copy_order_id', true) = '1' then
    raise exception
      'BACKFILL FERMO (V6): % order id duplicati fra candidati. Con claims_backfill_copy_order_id=1 violerebbero l''indice unico sull''id transazione. Rilanciare senza quel flag, oppure risolvere i duplicati.', v_n;
  end if;

  raise notice 'Validazioni V1..V6: nessun conflitto.';
end $$;

-- ============================================================================
-- 4. SCRITTURA
--
-- Idempotenza: `where not exists` sulla chiave. Rilanciare lo script non
-- produce errori e non produce scritture, perche' i candidati gia' registrati
-- semplicemente non compaiono piu'. Non serve ON CONFLICT DO NOTHING, che qui
-- sarebbe anzi peggio: nasconderebbe le collisioni che V4 e V5 devono far
-- vedere.
--
-- CAMPI CHE RESTANO VUOTI, E PERCHE'
--
--   external_transaction_id  NULL per default. La proiezione conserva in
--       external_order_id l'ULTIMO ordine visto, non il primo: per un
--       abbonamento Google l'order id cambia a ogni rinnovo e la riga e' stata
--       sovrascritta ogni volta. Copiarlo scriverebbe "la transazione che ha
--       stabilito la proprieta'" con un valore che quasi certamente non e'
--       quella, dentro una colonna che il trigger rende poi incorreggibile.
--       NULL qui significa "precede il registro, non ricostruibile", che e'
--       vero. Chi ha il contesto per volerlo comunque puo' passare
--       -v claims_backfill_copy_order_id=1 e prendersi la responsabilita'.
--
--   app_account_token        NULL sempre. Non e' nella proiezione e non e'
--       derivabile da niente di cio' che abbiamo.
--
--   environment              'production' per tutte le righe di backfill. La
--       proiezione non registra l'ambiente. E' lo stesso limite gia' dichiarato
--       nella migration per il ramo Google, e per il backfill vale su entrambi
--       gli store. Una riga sandbox registrata come production e' un errore di
--       etichetta su un dato di audit, non un errore di proprieta': la chiave
--       resta quella giusta e l'utente resta quello giusto.
-- ============================================================================

-- La INSERT sta in una CTE che modifica i dati perche' CREATE TABLE AS
-- richiede una query, non un comando INSERT: la CTE consente di catturare la
-- RETURNING e quindi di riportare esattamente cosa e' stato scritto, invece di
-- ricalcolarlo dopo e sperare che coincida.
create temporary table _bf_inserted on commit drop as
with ins as (
  insert into private.billing_purchase_claims (
    billing_source, ownership_key, external_transaction_id,
    external_product_id, owner_user_id, environment,
    app_account_token, claimed_at
  )
  select
    c.billing_source,
    c.ownership_key,
    case when current_setting('claims_bf.copy_order_id', true) = '1'
         then c.external_order_id else null end,
    c.external_product_id,
    c.user_id,
    'production',
    null,
    now()
  from _bf_candidates c
  where not exists (
    select 1 from private.billing_purchase_claims r
     where r.billing_source = c.billing_source
       and r.ownership_key = c.ownership_key
  )
  returning billing_source, ownership_key, owner_user_id
)
select * from ins;

\echo ''
\echo '=== SCRITTE ORA ==============================================='
select billing_source, count(*) as claim_creati from _bf_inserted
group by billing_source order by billing_source;

-- ============================================================================
-- 5. VERIFICA FINALE
--
-- Non "l'insert non ha dato errore" ma "ogni acquisto store della proiezione
-- ha ora nel registro una proprieta' intestata al suo utente".
-- ============================================================================

do $$
declare
  v_mancanti int;
  v_disallineati int;
  v_proiezione_prima bigint;
  v_proiezione_dopo bigint;
begin
  select count(*) into v_mancanti
  from _bf_candidates c
  where not exists (
    select 1 from private.billing_purchase_claims r
     where r.billing_source = c.billing_source and r.ownership_key = c.ownership_key
  );
  if v_mancanti > 0 then
    raise exception 'VERIFICA FALLITA: % acquisti store restano senza claim.', v_mancanti;
  end if;

  select count(*) into v_disallineati
  from _bf_candidates c
  join private.billing_purchase_claims r
    on r.billing_source = c.billing_source and r.ownership_key = c.ownership_key
  where r.owner_user_id is distinct from c.user_id;
  if v_disallineati > 0 then
    raise exception 'VERIFICA FALLITA: % claim intestati a un utente diverso da quello della proiezione.', v_disallineati;
  end if;

  -- La proiezione non deve essere cambiata di una riga. E' la sorgente.
  select proiezione_totali into v_proiezione_prima from _bf_before;
  select count(*) into v_proiezione_dopo from public.b2c_subscriptions;
  if v_proiezione_prima <> v_proiezione_dopo then
    raise exception 'VERIFICA FALLITA: la proiezione e'' cambiata (% -> %). Questo script non deve toccarla.',
      v_proiezione_prima, v_proiezione_dopo;
  end if;

  raise notice 'Verifica finale: ogni acquisto store ha un claim, intestato correttamente, proiezione intatta.';
end $$;

\echo ''
\echo '=== STATO DOPO ================================================'
select
  b.claim_totali as claim_prima,
  (select count(*) from private.billing_purchase_claims) as claim_dopo,
  (select count(*) from private.billing_purchase_claims) - b.claim_totali as delta,
  b.proiezione_totali as proiezione_prima,
  (select count(*) from public.b2c_subscriptions) as proiezione_dopo
from _bf_before b;

-- ============================================================================
-- 6. COMMIT O ROLLBACK
-- ============================================================================

\if :claims_backfill_apply
  \echo ''
  \echo '>>> claims_backfill_apply=1: COMMIT. Le righe sopra sono stati scritte.'
  commit;
\else
  \echo ''
  \echo '>>> DRY RUN (default): ROLLBACK, nessuna riga scritta.'
  \echo '>>> Per applicare davvero: -v claims_backfill_apply=1'
  rollback;
\endif
