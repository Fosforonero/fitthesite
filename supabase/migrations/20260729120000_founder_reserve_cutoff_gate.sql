-- Sprint P0.10E-D — consolida P0.10E-A/B/C in un'unica migration #4:
-- cutoff+finestra, compatibilita' col client Flutter pubblicato, gate
-- esterno (wrapper) E barriera atomica interna (_apply_founder_grant),
-- ACL minime. Storia delle correzioni precedenti preservata sotto per
-- contesto — non ripetere gli stessi errori in una futura modifica.
--
-- ============================================================================
-- STORIA (P0.10E-A -> B -> C -> D -> E-E)
--
-- P0.10E-A (MAI applicata): creava una NUOVA funzione pubblica
-- `claim_founder_grant_if_eligible_gated()` e revocava EXECUTE
-- sull'originale da authenticated. Il client Flutter gia' pubblicato chiama
-- pero' ESCLUSIVAMENTE il nome originale — quella versione avrebbe rotto
-- silenziosamente ogni claim legittimo di riserva pre-cutoff. Trovato da
-- Matteo in verifica diretta su produzione, non da questa sessione.
--
-- P0.10E-B: corretto spostando la funzione legacy FUORI dal nome pubblico
-- con `ALTER FUNCTION ... SET SCHEMA private` (non un CREATE OR REPLACE:
-- non serve conoscere il corpo per spostarla, la preserva bit-per-bit) e
-- ricreando il nome pubblico originale come wrapper cutoff+finestra.
--
-- P0.10E-C: aggiunto un precheck no-clobber nel wrapper (BLOCCO 3) contro
-- sottoscrizioni commerciali (google_play/apple_iap/stripe) in
-- b2c_subscriptions, PRIMA di delegare alla funzione legacy. Dichiarato
-- pero' esplicitamente che quel precheck (SELECT ... FOR UPDATE) NON e' la
-- barriera atomica definitiva: FOR UPDATE non puo' bloccare una riga che
-- non esiste ancora (race fra il precheck e un INSERT commerciale
-- concorrente).
--
-- P0.10E-D: chiude quella race con una barriera atomica DENTRO
-- `_apply_founder_grant(uuid, text)` stessa (FASE 4/5), integrata nella
-- STESSA migration #4. QUESTA VERSIONE E' STATA SOSTITUITA (vedi P0.10E-E
-- sotto): la convenzione di valori usata per la riscrittura (dedotta per
-- analogia da grant_b2c_trial(), MAI verificata contro le righe reali) si e'
-- rivelata SBAGLIATA rispetto alle 18 righe founder_grant gia' esistenti in
-- produzione, e la riscrittura aveva eliminato — senza saperlo, perche' il
-- corpo live non era ancora stato letto per intero da nessuno — alcune
-- protezioni che il corpo live ha sempre avuto (null-check, allowlist,
-- raw_payload). Conservata qui solo per contesto storico.
--
-- P0.10E-E (questo file, versione CORRENTE): Matteo ha chiuso direttamente
-- su Supabase produzione il punto rimasto aperto in P0.10E-D (§17b, secondo
-- giro) — ha letto INTEGRALMENTE il corpo live di _apply_founder_grant
-- (stesso MD5 gia' verificato, 5c7649b942f04234c31d3c7961c4c6a0) e
-- ispezionato le 18 righe reali con billing_source='founder_grant'.
-- Risultato: la convenzione P0.10E-D era sbagliata (vedi FASE 4 sotto per il
-- dettaglio completo). Corretto usando ESATTAMENTE i valori/proprieta' live
-- confermati, non una nuova convenzione. Guard MD5 invariato nel meccanismo
-- (v_pre_fix_md5 e' lo stesso — il corpo live in produzione non e' mai
-- cambiato, solo la nostra conoscenza di esso e' migliorata), v_post_fix_md5
-- ricalcolato per il nuovo corpo.
-- ============================================================================
--
-- STATO LIVE VERIFICATO (Matteo, 2026-07-29, aggiornato P0.10E-E):
--   public.claim_founder_grant_if_eligible(): zero argomenti, ritorna
--     jsonb, SECURITY DEFINER, owner postgres, MD5 corpo live
--     8419db344a7383ba53f01457335a3494, nessun cutoff/controllo created_at,
--     ACL PUBLIC/anon/authenticated/service_role tutti EXECUTE. Corpo MAI
--     letto per intero in nessuna sessione — solo firma/ACL/MD5 confermati.
--   public._apply_founder_grant(uuid, text): owner postgres, SECURITY
--     DEFINER, MD5 corpo live 5c7649b942f04234c31d3c7961c4c6a0. A differenza
--     della funzione sopra, QUESTO corpo e' stato letto INTEGRALMENTE da
--     Matteo (2026-07-29, secondo giro) — non incollato testuale in questo
--     repo, ma le sue proprieta' comportamentali sono ora note con
--     precisione: rifiuta p_user_id/p_email null; cerca la riga in
--     founder_grants per email (allowlist reale) e ritorna false se
--     assente; usa founder_number per costruire external_subscription_id
--     ('founder_grant_' || founder_number); external_product_id =
--     'lifetime_founder'; active_until = '2099-12-31 23:59:59+00'
--     (NON '9999-12-31'); auto_renewing = false; scrive un raw_payload
--     completo (founder_number, grant_email, granted_at, source='rpc_claim')
--     e aggiorna updated_at nel ramo di conflitto. Il difetto che questa
--     migration corregge (invariato da P0.10E-D): l'upsert su
--     b2c_subscriptions e' un `ON CONFLICT (user_id) DO UPDATE`
--     INCONDIZIONATO, senza whitelist su billing_source — puo' sovrascrivere
--     una riga commerciale gia' esistente. Dopo l'upsert aggiorna
--     founder_grants.applied_user_id/applied_at e ritorna true SENZA
--     verificare quante righe siano state realmente scritte — anche questo
--     e' invariato e viene corretto qui.
--   public.handle_new_founder(): owner postgres, nessun trigger live
--     associato, ACL aperta a PUBLIC/anon/authenticated/service_role.
--   private.grant_founder_launch_core(uuid, uuid): owner postgres, ACL
--     chiusa a postgres.
--   public.b2c_subscriptions: owner postgres, postgres ha SELECT/INSERT/
--     UPDATE/DELETE (precondizione §17c del preflight, ora CONFERMATA PASS
--     — non va piu' riaperta). DDL reale tracciata in
--     20260514120004_init_b2c_subs.sql: colonne NOT NULL senza default
--     external_product_id/external_subscription_id/active_until,
--     auto_renewing con default true (sbagliato per un grant permanente,
--     va sempre impostato esplicitamente a false), raw_payload jsonb
--     nullable, UNIQUE(billing_source, external_subscription_id) oltre alla
--     PK su user_id. CHECK su billing_source non include 'founder_grant'
--     nel file tracciato — drift non tracciato in produzione (stesso
--     pattern gia' documentato per founder_grants/schema private/altre
--     funzioni Founder), confermato indirettamente dalle 18 righe reali che
--     Matteo ha contato.
--
-- QUESTO FILE NON APPLICA ANCORA NULLA IN PRODUZIONE. Vedi
-- docs/architecture/p010-founder-pre-apply-checklist.md per lo stato
-- GO/NO-GO completo.
-- ============================================================================

-- ============================================================================
-- GUARD MD5 (PRIMISSIMO passo dell'intero file, prima di qualunque altra
-- modifica — inclusa la sezione 1 sotto): questa migration sta per
-- SOSTITUIRE per intero il corpo di _apply_founder_grant. Il testo letterale
-- esatto di quel corpo non e' disponibile in questo repo (Matteo ne ha letto
-- il contenuto integrale in produzione e riportato qui le proprieta'
-- comportamentali esatte — vedi STATO LIVE VERIFICATO sopra — non incollato
-- il codice sorgente). Prima di procedere con QUALUNQUE modifica (compreso
-- lo spostamento di claim_founder_grant_if_eligible nella sezione 1),
-- verifica che il corpo LIVE di _apply_founder_grant corrisponda ESATTAMENTE
-- (stesso MD5) a quello su cui questa descrizione si basa. Se non
-- corrisponde, ABORTISCE l'INTERA migration QUI, prima ancora della sezione
-- 1 — trovato in test locale (run-suite.sh, test negativo dedicato) che
-- posizionare questo guard DOPO lo spostamento della sezione 1 lo rende
-- inutile come "tutto o niente": lo spostamento sarebbe gia' avvenuto
-- quando il guard scopre il mismatch.
--
-- Il guard accetta DUE hash, non uno solo — trovato mancante nella prima
-- stesura (avrebbe rotto la riesecuzione, FASE 7 punto 19): dopo la PRIMA
-- apply riuscita, il corpo live e' gia' quello NUOVO, non piu' quello
-- originale verificato da Matteo. Una riesecuzione della STESSA migration
-- confronterebbe quindi il corpo (gia' corretto) contro l'hash del corpo
-- VECCHIO, fallendo per un falso allarme. v_post_fix_md5 e' l'MD5 esatto del
-- corpo NUOVO prodotto da questa stessa migration (calcolato empiricamente
-- una volta, applicando questo stesso CREATE OR REPLACE in isolamento e
-- leggendo pg_get_functiondef del risultato) — accettarlo rende la
-- riesecuzione un no-op sicuro, mentre continua ad abortire su qualunque
-- TERZO stato inatteso (ne' il corpo pre-fix ne' quello post-fix -> drift
-- genuino, fermarsi).
--
-- v_pre_fix_md5 e' INVARIATO da P0.10E-D: il corpo live in produzione non e'
-- mai cambiato in questo sprint (nessuna apply e' mai avvenuta) — solo la
-- nostra conoscenza delle sue proprieta' e' migliorata (P0.10E-E). Se questo
-- valore non corrispondesse piu', significherebbe che qualcos'altro ha
-- modificato la funzione fuori da questo repo fra le due letture di Matteo —
-- il guard abortirebbe correttamente anche in quel caso.
-- ============================================================================

do $$
declare
  v_actual_md5 text;
  v_pre_fix_md5 constant text := '5c7649b942f04234c31d3c7961c4c6a0';
  v_post_fix_md5 constant text := 'a26fee26363735a3b49b65face96c107';
begin
  select md5(pg_get_functiondef('public._apply_founder_grant(uuid, text)'::regprocedure)) into v_actual_md5;
  if v_actual_md5 is distinct from v_pre_fix_md5 and v_actual_md5 is distinct from v_post_fix_md5 then
    raise exception 'P0.10E-E: ABORT — MD5 live di public._apply_founder_grant(uuid,text) non corrisponde ne'' al corpo pre-fix verificato manualmente (%) ne'' al corpo post-fix atteso da una riesecuzione (%), trovato %. Non sovrascrivere alla cieca una funzione il cui testo letterale non e'' disponibile in questo repo: fermarsi e riverificare manualmente prima di riprovare.',
      v_pre_fix_md5, v_post_fix_md5, coalesce(v_actual_md5, 'NULL (funzione non trovata con questa firma)');
  end if;
end $$;

-- ============================================================================
-- 1. Sposta la funzione legacy claim fuori da `public`, preservandone il
--    corpo esatto (invariato dalle versioni precedenti di questo file).
--
--    Guardia di RIESECUZIONE: sposta SOLO se la funzione esiste in public
--    E NON esiste gia' in private (cioe' solo se lo spostamento non e' mai
--    avvenuto) — controllare solo "esiste in public" non basterebbe: dopo
--    la prima apply, public.claim_founder_grant_if_eligible() esiste
--    ANCORA (e' il wrapper, stesso nome/arieta' per costruzione), e una
--    guardia piu' debole tenterebbe di spostare il WRAPPER dentro private,
--    collidendo con la funzione legacy gia' li' (trovato in review
--    avversariale sulla prima bozza P0.10E-B).
--
--    `create schema if not exists private`: no-op in produzione (lo schema
--    esiste gia', creato da 20260728090000 o da drift precedente non
--    tracciato), necessario solo per rendere questo file autosufficiente
--    in un replay locale isolato.
-- ============================================================================

create schema if not exists private;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_founder_grant_if_eligible'
      and p.pronargs = 0
  ) and not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'claim_founder_grant_if_eligible'
      and p.pronargs = 0
  ) then
    alter function public.claim_founder_grant_if_eligible() set schema private;
  end if;
end $$;

-- Chiude l'accesso diretto alla funzione ora privata. ALTER ... SET SCHEMA
-- preserva l'ACL esistente (PUBLIC/anon/authenticated/service_role avevano
-- tutti EXECUTE in produzione) — va quindi revocata esplicitamente, non e'
-- un no-op. REVOKE non fallisce mai su un privilegio gia' assente, quindi
-- questa riga resta idempotente anche in una riesecuzione.
--
-- Assunzione di ownership: CONFERMATA da Matteo il 2026-07-29 (owner
-- postgres per tutte e quattro le funzioni coinvolte) — §17a del preflight
-- e' PASS, non va piu' riaperta.
revoke all on function private.claim_founder_grant_if_eligible() from public, anon, authenticated, service_role;

-- ============================================================================
-- FASE 4 (Sprint P0.10E-E, CORREZIONE BLOCCANTE rispetto a P0.10E-D) — Il
-- guard MD5 sopra protegge ancora questa riscrittura, ma la riscrittura
-- stessa e' ora COMPLETAMENTE diversa da quella consegnata in P0.10E-D.
--
-- Matteo ha chiuso direttamente su Supabase produzione il punto aperto
-- §17b (2026-07-29, secondo giro): ha letto INTEGRALMENTE il corpo live di
-- _apply_founder_grant (stesso MD5 gia' verificato,
-- 5c7649b942f04234c31d3c7961c4c6a0) e ispezionato le 18 righe
-- b2c_subscriptions reali con billing_source='founder_grant'. Risultato:
-- LA CONVENZIONE INVENTATA IN P0.10E-D ERA SBAGLIATA. Nessuna delle 18
-- righe live usa 'fitmesh_founder_grant'/'founder-<user_id>' (i valori
-- dedotti per analogia da grant_b2c_trial(), mai confrontati con le righe
-- reali) — usano tutte:
--   external_product_id       = 'lifetime_founder'
--   external_subscription_id  = 'founder_grant_' || founder_number
--   active_until               = '2099-12-31 23:59:59+00' (NON '9999-12-31')
--   auto_renewing              = false
--   raw_payload                = {founder_number, grant_email, granted_at,
--                                 source: 'rpc_claim'}
--   updated_at aggiornato nel ramo di conflitto
-- Questa versione usa ESATTAMENTE questi valori, non una nuova convenzione:
-- istruzione esplicita di Matteo, "conserva esattamente i valori live",
-- niente normalizzazione ne' migration di allineamento senza audit
-- separato dei consumer.
--
-- NOTA su cosa sappiamo e cosa no: Matteo ha letto il corpo per intero e ne
-- ha riportato qui le proprieta' comportamentali esatte (elencate sopra e
-- sotto) — non ha incollato il testo sorgente letterale. Questo repo quindi
-- CONOSCE ORA il contratto comportamentale completo di _apply_founder_grant
-- con precisione (a differenza di P0.10E-D, che lo ricostruiva per
-- analogia), ma NON possiede il testo letterale esatto necessario per un
-- rollback byte-per-byte — resta la FASE 9 di Matteo (pg_get_functiondef
-- salvato esternamente PRIMA dell'apply reale) il solo modo di ottenerlo.
--
-- Il corpo live, oltre alla convenzione dei valori sopra, contiene protezioni
-- che la riscrittura P0.10E-D aveva ELIMINATO senza saperlo (bug bloccante,
-- non solo cosmetico):
--   1. rifiuta p_user_id o p_email null (P0.10E-D non lo faceva affatto —
--      un null sarebbe passato silenziosamente fino all'INSERT, fallendo
--      con un errore NOT NULL generico invece di un false esplicito);
--   2. cerca PRIMA la riga in founder_grants per email (allowlist reale) e
--      ritorna false se l'email non e' presente — P0.10E-D non verificava
--      NULLA: qualunque (user_id, email) passato a questa funzione, anche
--      un'email mai vista in founder_grants, avrebbe creato un entitlement
--      lifetime valido. Dato che la funzione mantiene EXECUTE per
--      service_role (non solo per il wrapper pubblico), questo non era un
--      problema teorico: qualunque chiamata interna diretta via
--      service_role (script, altra RPC, futuro codice) avrebbe potuto
--      concedere Founder a chiunque, scavalcando l'intero ledger delle 3
--      riserve;
--   3. usa v_grant.founder_number (non un valore derivato da user_id) per
--      costruire external_subscription_id, e i campi REALI della riga
--      (v_grant.email, v_grant.granted_at) per raw_payload;
--   4. scrive un raw_payload completo con source='rpc_claim' (tracciabilita'
--      dell'origine della scrittura — assente del tutto in P0.10E-D);
--   5. aggiorna updated_at nel ramo di conflitto (assente in P0.10E-D, che
--      non toccava affatto quella colonna nell'update).
--
-- Il bug ORIGINALE che questa funzione ha sempre avuto in produzione (quello
-- che questa migration continua a correggere, invariato da P0.10E-D):
-- l'upsert e' un ON CONFLICT (user_id) DO UPDATE INCONDIZIONATO, senza
-- alcuna whitelist su billing_source — una riga google_play/apple_iap/
-- stripe gia' esistente per lo stesso user_id verrebbe sovrascritta da un
-- founder_grant. Restano quindi due correzioni cumulative in questa
-- funzione, non alternative: (a) ripristinare TUTTE le protezioni/
-- convenzioni reali sopra elencate che P0.10E-D aveva perso, (b) aggiungere
-- la barriera whitelist che il corpo live non ha mai avuto.
--
-- SELECT ... FOR UPDATE su founder_grants, PRIMA dell'INSERT su
-- b2c_subscriptions (istruzione esplicita di Matteo: "la riga deve essere
-- verificata e bloccata prima dell'INSERT"): blocca la riga founder_grants
-- per l'intera durata della transazione. Due conseguenze, entrambe
-- verificate in test: (1) due chiamate concorrenti per la STESSA email si
-- serializzano completamente (la seconda attende il commit della prima
-- prima ancora di tentare l'INSERT su b2c_subscriptions — non c'e' piu'
-- alcuna finestra in cui entrambe leggono "riga presente, non ancora
-- consumata" e procedono in parallelo); (2) l'UPDATE finale su
-- founder_grants (piu' sotto) usa la STESSA chiave (email) della riga gia'
-- bloccata — non puo' strutturalmente modificare zero righe, dato che
-- nessun'altra sessione puo' cancellare o rinominare quella riga mentre
-- deteniamo il lock. Il GET DIAGNOSTICS + RAISE EXCEPTION su quell'update
-- (vedi sotto) e' quindi una difesa "non deve mai scattare per costruzione",
-- non una scorciatoia per un caso atteso — istruzione esplicita di Matteo:
-- "impossibile O trattato come errore atomico", soddisfatta da entrambi
-- (impossibile per costruzione, e comunque un errore atomico se mai
-- accadesse — RAISE EXCEPTION annulla l'intera funzione, INSERT/UPDATE su
-- b2c_subscriptions incluso, dato che non c'e' un blocco BEGIN/EXCEPTION
-- attorno a questo secondo statement).
--
-- GET STACKED DIAGNOSTICS + CONSTRAINT_NAME (sostituisce il blanket "WHEN
-- unique_violation" di P0.10E-D — istruzione esplicita di Matteo: "non
-- catturare indiscriminatamente ogni unique_violation"): solo le due
-- collisioni REALMENTE possibili per QUESTA insert vengono trattate come
-- "riga gia' esistente, applica il fallback whitelist" —
-- b2c_subscriptions_pkey (stesso user_id) e
-- b2c_subscriptions_billing_source_external_subscription_id_key (stesso
-- founder_number riusato per due email diverse — non dovrebbe mai accadere,
-- ma e' comunque la stessa causa reale: questo user_id ha gia' un
-- founder_grant). Qualunque ALTRO nome di vincolo (Caso 40 in
-- 10-functional-tests.sql, simula un vincolo sconosciuto con un trigger di
-- test dedicato) fa RAISE (ripropaga l'eccezione originale) invece di
-- essere silenziosamente assorbito nel fallback — un vincolo futuro non
-- previsto qui non deve mai essere trattato come "riga gia' esistente, va
-- bene aggiornarla".
--
-- Barriera whitelist invariata da P0.10E-D: solo billing_source IN
-- ('founder_grant', 'trial') puo' essere sovrascritto dal fallback UPDATE —
-- whitelist, non blacklist, quindi un valore futuro sconosciuto di
-- billing_source resta protetto per default, non solo i 3 valori
-- commerciali noti oggi (istruzione esplicita di Matteo, invariata).
--
-- is_b2c_lifetime() — INCOERENZA PREESISTENTE, NON CORRETTA QUI (istruzione
-- esplicita di Matteo): quella funzione (20260514120004_init_b2c_subs.sql)
-- considera lifetime solo active_until > '9000-01-01', ma le 18 righe
-- Founder live scadono nel 2099 (< 9000) — is_b2c_lifetime() ritorna quindi
-- FALSE per un vero Founder grant, sia per le 18 righe esistenti sia per
-- ogni nuova riga scritta da questa stessa funzione (che usa
-- deliberatamente '2099-12-31', non '9999-12-31', per restare
-- byte-identica alla convenzione live). Non e' una svista di questa
-- migration: e' un difetto preesistente e piu' ampio di is_b2c_lifetime()
-- stessa, che richiede un audit di TUTTI i suoi consumer prima di essere
-- toccata (potrebbe gia' essere compensato altrove, o potrebbe essere un
-- bug attivo che affligge gia' le 18 righe live oggi) — documentato
-- separatamente in docs/architecture/p010-founder-pre-apply-checklist.md,
-- da programmare come sprint dedicato, NON risolto ne' mascherato da
-- questa migration. Non usare questa incoerenza come motivo per cambiare
-- SOLO le nuove righe a '9999-12-31': violerebbe l'istruzione "conserva
-- esattamente i valori live" sopra.
-- ============================================================================
create or replace function public._apply_founder_grant(p_user_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_grant public.founder_grants%rowtype;
  v_rows int;
  v_ledger_rows int;
  v_constraint_name text;
  v_raw_payload jsonb;
begin
  if p_user_id is null or p_email is null then
    return false;
  end if;

  select * into v_grant
  from public.founder_grants
  where lower(email) = lower(p_email)
  for update;

  if not found then
    return false;
  end if;

  v_raw_payload := jsonb_build_object(
    'founder_number', v_grant.founder_number,
    'grant_email', v_grant.email,
    'granted_at', v_grant.granted_at,
    'source', 'rpc_claim'
  );

  begin
    insert into public.b2c_subscriptions (
      user_id, billing_source, external_product_id, external_subscription_id,
      active_until, auto_renewing, state, raw_payload
    )
    values (
      p_user_id, 'founder_grant', 'lifetime_founder',
      'founder_grant_' || v_grant.founder_number,
      '2099-12-31 23:59:59+00'::timestamptz, false, 'active', v_raw_payload
    );
    v_rows := 1;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint_name = constraint_name;
      if v_constraint_name not in (
        'b2c_subscriptions_pkey',
        'b2c_subscriptions_billing_source_external_subscription_id_key'
      ) then
        raise;
      end if;

      update public.b2c_subscriptions
      set billing_source = 'founder_grant',
          external_product_id = 'lifetime_founder',
          external_subscription_id = 'founder_grant_' || v_grant.founder_number,
          active_until = '2099-12-31 23:59:59+00'::timestamptz,
          auto_renewing = false,
          state = 'active',
          raw_payload = v_raw_payload,
          updated_at = now()
      where user_id = p_user_id
        and billing_source in ('founder_grant', 'trial');
      get diagnostics v_rows = row_count;
  end;

  if v_rows = 0 then
    -- Riga esistente protetta (google_play/apple_iap/stripe, o un
    -- qualunque valore non in whitelist): zero righe scritte, zero effetti
    -- collaterali. founder_grants NON toccata, riserva NON consumata.
    return false;
  end if;

  update public.founder_grants
  set applied_user_id = p_user_id,
      applied_at = now()
  where email = v_grant.email;
  get diagnostics v_ledger_rows = row_count;

  if v_ledger_rows = 0 then
    raise exception 'P0.10E-E: invariante violata - founder_grants.email % era gia'' bloccata via SELECT ... FOR UPDATE in questa stessa transazione, ma la UPDATE finale ha modificato zero righe. Non deve poter accadere per costruzione (stessa chiave, stesso lock, stessa transazione) - se accade e'' un bug o una corruzione dati, non un esito silenzioso.', v_grant.email;
  end if;

  return true;
end;
$$;

comment on function public._apply_founder_grant(uuid, text) is
  'Sprint P0.10E-E: corpo riscritto per allinearsi ESATTAMENTE alla '
  'convenzione live delle 18 righe founder_grant esistenti (external_'
  'product_id=lifetime_founder, external_subscription_id=founder_grant_'
  '<founder_number>, active_until=2099-12-31 23:59:59+00, raw_payload '
  'completo con source=rpc_claim) - non una convenzione nuova inventata. '
  'Ripristina l''allowlist (SELECT ... FOR UPDATE su founder_grants, false '
  'se email assente, null-check su entrambi i parametri) che la riscrittura '
  'P0.10E-D aveva perso senza saperlo. Aggiunge la barriera whitelist su '
  'billing_source (founder_grant/trial sovrascrivibili, tutto il resto '
  'protetto per default) che il corpo live non ha mai avuto - il bug '
  'originale che questa migration corregge. GET STACKED DIAGNOSTICS + '
  'CONSTRAINT_NAME distingue le due collisioni note (pkey, '
  'billing_source+external_subscription_id) da qualunque altro '
  'unique_violation, che viene rilanciato, mai assorbito. Stessa firma/'
  'owner/SECURITY DEFINER dell''originale confermato live (MD5 '
  '5c7649b942f04234c31d3c7961c4c6a0), letto integralmente da Matteo il '
  '2026-07-29 (proprieta'' comportamentali note con precisione, testo '
  'letterale non disponibile in questo repo - vedi FASE 9 per il rollback).';

-- Reassert ACL — gia' vero in produzione oggi (solo postgres/service_role),
-- questo e' un reassert esplicito, non un fix di una falla attiva.
-- Disaccoppiato in un blocco guardato (a differenza del guard MD5 sopra,
-- che DEVE abortire tutto): un mismatch di firma qui non deve abortire il
-- resto della migration, emette solo un WARNING esplicito, mai silenzioso.
do $$
begin
  if to_regprocedure('public._apply_founder_grant(uuid, text)') is not null then
    revoke all on function public._apply_founder_grant(uuid, text) from public, anon, authenticated;
  else
    raise warning 'P0.10E-E: public._apply_founder_grant(uuid, text) non trovata dopo la riscrittura - reassert ACL SALTATO, verificare manualmente.';
  end if;
end $$;

-- ============================================================================
-- 2. Wrapper pubblico — STESSO nome, STESSA firma (zero argomenti), STESSA
--    forma di risposta jsonb del client pubblicato. Applica auth + cutoff
--    globale + finestra individuale di 14 giorni + precheck no-clobber,
--    poi delega fedelmente, con una ri-verifica FASE 5 dopo la delega.
--
--    Finestra individuale — quale timestamp e perche':
--    14 giorni da auth.users.created_at, confrontati con clock_timestamp()
--    (tempo reale di valutazione, non il timestamp di inizio transazione
--    di now()/CURRENT_TIMESTAMP — scelta esplicita per un confronto
--    accurato anche se la chiamata ha atteso su un lock, es. il precheck
--    FOR UPDATE sotto). NON da devices.first_sync_at (a differenza della
--    finestra usata da private.grant_founder_launch_core in 20260728090000,
--    che riceve p_device_id ed e' chiamata solo da record_first_sync_
--    transition dopo una sync riuscita). Questa RPC e' chiamata al login,
--    a zero argomenti: non riceve alcun device_id, quindi non esiste alcuna
--    "prova di prima sync" disponibile a questo livello. Usare first_sync_at
--    qui renderebbe impossibile il claim per chiunque non abbia ancora
--    sincronizzato un device — che e' esattamente il momento in cui questa
--    RPC viene chiamata (al login, non alla sync). L'unico segnale
--    server-side disponibile senza device_id e' created_at.
--
--    Conseguenza esplicita, accettata: un account che effettua il primo
--    login utile (quello che tenta il claim) piu' di 14 giorni dopo la
--    registrazione riceve `window_expired` anche se non ha mai avuto prima
--    l'occasione di provare. E' lo stesso principio del cutoff globale
--    (confronto con >=, non <): al limite esatto la finestra e' gia' chiusa,
--    mai ancora aperta.
--
--    Confronto al boundary esatto (documentato e testato): clock_timestamp()
--    > created_at + 14 giorni -> scaduta. Esattamente 14 giorni dopo
--    created_at NON e' ancora scaduta (stesso operatore stretto `>` usato in
--    private.grant_founder_launch_core per la finestra first_sync_at, per
--    coerenza fra i due path).
-- ============================================================================

create or replace function public.claim_founder_grant_if_eligible()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_user_id uuid;
  v_created_at timestamptz;
  v_billing_source text;
  v_legacy_result jsonb;
  -- Stesso istante letterale di lib/founder/program-window.ts FOUNDER_END_AT
  -- e di private.grant_founder_launch_core.founder_cutoff. Nessun meccanismo
  -- automatico tiene sincronizzate le copie (residuo gia' dichiarato altrove
  -- — vedi guardrail founder:window-check).
  founder_cutoff constant timestamptz := '2026-07-31T22:00:00Z'::timestamptz;
  founder_window constant interval := interval '14 days';
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select created_at into v_created_at from auth.users where id = v_user_id;
  if v_created_at is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  -- Cutoff globale: ha priorita' assoluta sulla finestra individuale.
  -- Un account post-cutoff riceve sempre program_closed, indipendentemente
  -- da quanto sia "giovane" rispetto alla propria finestra di 14 giorni —
  -- il cutoff chiude il PROGRAMMA, la finestra e' solo un vincolo aggiuntivo
  -- per chi si e' registrato PRIMA che il programma chiudesse. Un account
  -- Founder gia' assegnato non passa comunque piu' da questa funzione per
  -- essere revocato: nessun ramo di questo file scrive mai una revoca.
  if v_created_at >= founder_cutoff then
    return jsonb_build_object('eligible', false, 'reason', 'program_closed');
  end if;

  if clock_timestamp() > v_created_at + founder_window then
    return jsonb_build_object('eligible', false, 'reason', 'window_expired');
  end if;

  -- FASE 3 (BLOCCO 3, precheck no-clobber) — PRIMA di delegare alla
  -- funzione legacy, non dopo. `for update`: se la riga esiste, la blocca
  -- fino a fine chiamata, cosi' una UPDATE concorrente gia' in corso sulla
  -- STESSA riga (es. un webhook che sta aggiornando lo stato di una
  -- sottoscrizione esistente) viene attesa e letta nel suo valore
  -- committed, non in un valore stale. NON e' la barriera atomica
  -- definitiva: FOR UPDATE non puo' bloccare una riga che non esiste
  -- ancora (race fra questo precheck e un INSERT commerciale concorrente
  -- su una riga non ancora creata) — quella race e' chiusa dalla barriera
  -- atomica dentro _apply_founder_grant (FASE 4 sopra) e dalla
  -- ri-verifica FASE 5 sotto, non da questo SELECT.
  --
  -- Privilegio UPDATE su b2c_subscriptions per postgres: CONFERMATO
  -- (§17c del preflight, PASS) — non va piu' riaperto.
  --
  -- billing_source in ('google_play','apple_iap','stripe'): NON delegare,
  -- NON toccare founder_grants/b2c_subscriptions, riserva NON consumata,
  -- indipendentemente da `state` (anche una sottoscrizione commerciale
  -- SCADUTA blocca — decisione esplicita di Matteo: la riga resta
  -- disponibile per webhook/restore/riconciliazione, l'utente mantiene il
  -- collegamento storico con lo store). 'trial' e 'founder_grant' non
  -- bloccano (il primo e' un entitlement inferiore che Founder puo'
  -- sostituire, il secondo e' gia' Founder, idempotenza gestita dalla
  -- whitelist in _apply_founder_grant); nessuna riga -> flusso legacy
  -- normale (v_billing_source NULL, `in (...)` valuta NULL, l'IF tratta
  -- NULL come falso, si procede a delegare).
  select billing_source into v_billing_source
  from public.b2c_subscriptions
  where user_id = v_user_id
  for update;

  if v_billing_source in ('google_play', 'apple_iap', 'stripe') then
    return jsonb_build_object('eligible', false, 'reason', 'existing_commercial_entitlement');
  end if;

  -- Account pre-cutoff, dentro la propria finestra individuale, senza una
  -- sottoscrizione commerciale gia' vista dal precheck: delega alla
  -- funzione legacy (ora privata), invariata. Se non esistesse (nome/firma
  -- reali diversi da quanto documentato), questa chiamata fallisce in modo
  -- rumoroso (funzione non trovata) invece di fingere un esito.
  v_legacy_result := private.claim_founder_grant_if_eligible();

  -- FASE 5 — gestione della race residua: il precheck sopra puo' non aver
  -- visto ancora nessuna riga (nessuna riga esisteva al momento del
  -- precheck), ma un INSERT commerciale concorrente puo' essere stato
  -- committato DOPO il precheck e PRIMA/DURANTE la chiamata legacy. In tal
  -- caso la barriera atomica dentro _apply_founder_grant (FASE 4) ha gia'
  -- correttamente rifiutato l'upsert (ROW_COUNT=0, ritorna false) — ma il
  -- corpo legacy che consuma quel booleano non e' mai stato letto in
  -- questa sessione: non sappiamo con certezza quale `reason` la funzione
  -- legacy assegni internamente a un esito "_apply_founder_grant ha
  -- ritornato false" (potrebbe non distinguerlo da 'not_in_allowlist').
  -- Per questo, se il risultato della delega NON e' eligible:true,
  -- ri-verifichiamo qui b2c_subscriptions: se ORA (dopo la delega) esiste
  -- una fonte commerciale, la risposta al client viene corretta in
  -- existing_commercial_entitlement — indipendentemente da cosa la
  -- funzione legacy abbia effettivamente restituito internamente. Se
  -- invece non c'e' alcuna fonte commerciale, il risultato legacy originale
  -- viene conservato inalterato (es. not_in_allowlist per un utente
  -- genuinamente non eleggibile, nessuna relazione con una race).
  --
  -- Nessun FOR UPDATE qui: non stiamo per scrivere, solo osservare lo stato
  -- finale gia' stabilito dall'upsert atomico appena eseguito all'interno
  -- della stessa transazione (READ COMMITTED: una lettura successiva vede
  -- sempre lo stato piu' recente committed).
  if coalesce(v_legacy_result->>'eligible', 'false') != 'true' then
    select billing_source into v_billing_source
    from public.b2c_subscriptions
    where user_id = v_user_id;

    if v_billing_source in ('google_play', 'apple_iap', 'stripe') then
      return jsonb_build_object('eligible', false, 'reason', 'existing_commercial_entitlement');
    end if;
  end if;

  return v_legacy_result;
end;
$$;

comment on function public.claim_founder_grant_if_eligible is
  'Sprint P0.10E-D: wrapper di cutoff+finestra+no-clobber (con ri-verifica '
  'post-delega) davanti alla funzione legacy (ora '
  'private.claim_founder_grant_if_eligible), stesso nome pubblico e stessa '
  'firma del client gia'' pubblicato. Un account creato al o dopo il '
  '2026-07-31T22:00:00Z riceve sempre {"eligible":false,"reason":'
  '"program_closed"}. Un account pre-cutoff la cui finestra individuale di '
  '14 giorni (da auth.users.created_at) e'' scaduta riceve '
  '{"eligible":false,"reason":"window_expired"}. Un account con una '
  'sottoscrizione commerciale attiva o scaduta (google_play/apple_iap/'
  'stripe in b2c_subscriptions), vista dal precheck O rilevata dopo la '
  'delega, riceve sempre {"eligible":false,"reason":'
  '"existing_commercial_entitlement"}. Solo un account pre-cutoff, dentro '
  'la propria finestra, senza sottoscrizione commerciale protetta, ottiene '
  'l''esito della logica di allowlist legacy invariata.';

-- PUBLIC e anon non devono avere EXECUTE. authenticated si', e' l'unico
-- percorso esterno verso la logica di riserva.
revoke all on function public.claim_founder_grant_if_eligible() from public, anon;
grant execute on function public.claim_founder_grant_if_eligible() to authenticated;

-- ============================================================================
-- FASE 6 — handle_new_founder(): nessun trigger live la usa (confermato da
-- Matteo, 2026-07-29), ACL live aperta a PUBLIC/anon/authenticated/
-- service_role senza alcun motivo funzionale. Revocata da PUBLIC/anon/
-- authenticated in questo file. service_role NON revocato qui: a
-- differenza di anon/authenticated (sicuramente irraggiungibili da un
-- flusso legittimo per una funzione trigger senza trigger attivo), manca
-- una verifica esplicita che nulla di amministrativo la invochi via
-- service_role — valutazione rimandata, non e' un blocco. Funzione NON
-- eliminata in questo sprint (istruzione esplicita di Matteo). Guardato
-- (non un hard-abort come il guard MD5 sopra): un mismatch qui non deve
-- abortire il resto della migration.
-- ============================================================================
do $$
begin
  if to_regprocedure('public.handle_new_founder()') is not null then
    revoke execute on function public.handle_new_founder() from public, anon, authenticated;
  else
    raise warning 'P0.10E-D: public.handle_new_founder() non trovata - reassert ACL SALTATO, verificare manualmente.';
  end if;
end $$;

-- Forza PostgREST a rileggere lo schema: abbiamo spostato una funzione fra
-- schemi e cambiato la definizione di due funzioni esposte con lo stesso
-- nome. Le pipeline Supabase inviano gia' questa NOTIFY dopo ogni
-- migration, ma e' esplicita qui per non dipendere da quel comportamento
-- implicito.
notify pgrst, 'reload schema';

-- ============================================================================
-- Superficie del rischio residuo (FASE 3/4/5, dopo la barriera atomica):
-- narrow, invariata rispetto a P0.10E-C — i soli 3 posti riservati in
-- public.founder_grants. La race fra precheck e scrittura commerciale e'
-- ora chiusa in ENTRAMBE le direzioni:
--   - commerciale gia' esistente al momento del precheck -> bloccato dal
--     precheck stesso (FOR UPDATE, attende il commit di una UPDATE in
--     corso, legge il valore fresco);
--   - commerciale che arriva DOPO il precheck ma PRIMA/DURANTE la delega
--     -> bloccato dalla barriera atomica in _apply_founder_grant
--     (whitelist + GET STACKED DIAGNOSTICS/CONSTRAINT_NAME, P0.10E-E), e la
--     risposta al client viene corretta dalla ri-verifica FASE 5 anche se
--     la funzione legacy (mai riletta) non distinguesse internamente
--     questo caso da un generico "non eleggibile".
-- Non risulta piu' alcuna finestra nota e non protetta per la
-- sovrascrittura di una sottoscrizione commerciale tramite questa RPC.
--
-- P0.10E-E, ulteriore: la barriera ora usa ANCHE la convenzione di valori
-- e le protezioni (allowlist, null-check, raw_payload) esattamente
-- confermate contro le 18 righe founder_grant reali — vedi FASE 4 sopra e
-- docs/architecture/p010-founder-pre-apply-checklist.md per il dettaglio
-- completo dei due bug corretti (convenzione sbagliata, protezioni perse)
-- e per l'incoerenza preesistente e NON corretta qui di is_b2c_lifetime().
-- ============================================================================
