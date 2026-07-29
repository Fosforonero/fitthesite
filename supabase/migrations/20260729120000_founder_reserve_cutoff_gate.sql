-- Sprint P0.10E-D — consolida P0.10E-A/B/C in un'unica migration #4:
-- cutoff+finestra, compatibilita' col client Flutter pubblicato, gate
-- esterno (wrapper) E barriera atomica interna (_apply_founder_grant),
-- ACL minime. Storia delle correzioni precedenti preservata sotto per
-- contesto — non ripetere gli stessi errori in una futura modifica.
--
-- ============================================================================
-- STORIA (P0.10E-A -> B -> C -> D)
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
-- P0.10E-D (questo file): chiude quella race con una barriera atomica
-- DENTRO `_apply_founder_grant(uuid, text)` stessa (FASE 4/5 sotto),
-- integrata nella STESSA migration #4, non in una #5 separata (decisione
-- esplicita di Matteo: gate esterno e barriera atomica devono entrare
-- nella stessa transazione di apply, senza finestra intermedia in cui uno
-- dei due sia live senza l'altro). Aggiunge anche un guard MD5 che
-- ABORTISCE l'intera migration se il corpo LIVE di _apply_founder_grant
-- non corrisponde esattamente a quanto verificato manualmente da Matteo
-- (vedi FASE 4 sotto) — questa e' la prima volta in questo sprint che una
-- migration RISCRIVE (non solo sposta/richiude ACL) una funzione il cui
-- corpo completo non e' mai stato letto direttamente in questa sessione:
-- il guard e' la salvaguardia esplicita contro quel rischio.
-- ============================================================================
--
-- STATO LIVE VERIFICATO (Matteo, 2026-07-29):
--   public.claim_founder_grant_if_eligible(): zero argomenti, ritorna
--     jsonb, SECURITY DEFINER, owner postgres, MD5 corpo live
--     8419db344a7383ba53f01457335a3494, nessun cutoff/controllo created_at,
--     ACL PUBLIC/anon/authenticated/service_role tutti EXECUTE.
--   public._apply_founder_grant(uuid, text): owner postgres, SECURITY
--     DEFINER, MD5 corpo live 5c7649b942f04234c31d3c7961c4c6a0, ACL solo
--     postgres+service_role, usa ON CONFLICT (user_id) DO UPDATE su
--     b2c_subscriptions (puo' sovrascrivere una riga commerciale), dopo
--     l'upsert aggiorna founder_grants.applied_user_id/applied_at, ritorna
--     true SENZA verificare quante righe siano state realmente
--     inserite/aggiornate — questo e' esattamente il bug che FASE 4 chiude.
--   public.handle_new_founder(): owner postgres, nessun trigger live
--     associato, ACL aperta a PUBLIC/anon/authenticated/service_role.
--   private.grant_founder_launch_core(uuid, uuid): owner postgres, ACL
--     chiusa a postgres.
--   public.b2c_subscriptions: owner postgres, postgres ha SELECT/INSERT/
--     UPDATE/DELETE (precondizione §17c del preflight, ora CONFERMATA PASS
--     — non va piu' riaperta).
--
-- QUESTO FILE NON APPLICA ANCORA NULLA IN PRODUZIONE. Vedi
-- docs/architecture/p010-founder-pre-apply-checklist.md per lo stato
-- GO/NO-GO completo.
-- ============================================================================

-- ============================================================================
-- GUARD MD5 (PRIMISSIMO passo dell'intero file, prima di qualunque altra
-- modifica — inclusa la sezione 1 sotto): questa migration sta per
-- SOSTITUIRE per intero il corpo di _apply_founder_grant, una funzione il
-- cui testo completo non e' mai stato letto direttamente in questa
-- sessione — solo il suo comportamento e' stato descritto da Matteo dopo
-- una lettura diretta su produzione. Prima di procedere con QUALUNQUE
-- modifica (compreso lo spostamento di claim_founder_grant_if_eligible
-- nella sezione 1), verifica che il corpo LIVE di _apply_founder_grant
-- corrisponda ESATTAMENTE (stesso MD5) a quello su cui quella descrizione
-- si basa. Se non corrisponde, ABORTISCE l'INTERA migration QUI, prima
-- ancora della sezione 1 — trovato in test locale (run-suite.sh, test
-- negativo dedicato) che posizionare questo guard DOPO lo spostamento
-- della sezione 1 lo rende inutile come "tutto o niente": lo spostamento
-- sarebbe gia' avvenuto quando il guard scopre il mismatch.
--
-- Il guard accetta DUE hash, non uno solo — trovato mancante nella prima
-- stesura (avrebbe rotto la riesecuzione, FASE 7 punto 19): dopo la PRIMA
-- apply riuscita, il corpo live e' gia' quello NUOVO (barriera atomica),
-- non piu' quello originale verificato da Matteo. Una riesecuzione della
-- STESSA migration confronterebbe quindi il corpo (gia' corretto) contro
-- l'hash del corpo VECCHIO, fallendo per un falso allarme. v_post_fix_md5
-- e' l'MD5 esatto del corpo NUOVO prodotto da questa stessa migration
-- (calcolato empiricamente una volta, applicando questo stesso CREATE OR
-- REPLACE in isolamento e leggendo pg_get_functiondef del risultato) —
-- accettarlo rende la riesecuzione un no-op sicuro, mentre continua ad
-- abortire su qualunque TERZO stato inatteso (ne' il corpo pre-fix ne'
-- quello post-fix -> drift genuino, fermarsi).
-- ============================================================================

do $$
declare
  v_actual_md5 text;
  v_pre_fix_md5 constant text := '5c7649b942f04234c31d3c7961c4c6a0';
  v_post_fix_md5 constant text := '90031930f2d7f52abfe1d0583df58b6d';
begin
  select md5(pg_get_functiondef('public._apply_founder_grant(uuid, text)'::regprocedure)) into v_actual_md5;
  if v_actual_md5 is distinct from v_pre_fix_md5 and v_actual_md5 is distinct from v_post_fix_md5 then
    raise exception 'P0.10E-D: ABORT — MD5 live di public._apply_founder_grant(uuid,text) non corrisponde ne'' al corpo pre-fix verificato manualmente (%) ne'' al corpo post-fix atteso da una riesecuzione (%), trovato %. Non sovrascrivere alla cieca una funzione il cui corpo reale non e'' mai stato letto per intero in questa sessione: fermarsi e riverificare manualmente prima di riprovare.',
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
-- FASE 4 — Barriera atomica in _apply_founder_grant(uuid, text). Il guard
-- MD5 che protegge questa riscrittura e' gia' stato eseguito PRIMA della
-- sezione 1 sopra (vedi in cima al file) — se questa riga viene raggiunta,
-- il corpo live corrispondeva gia' a uno dei due hash attesi.
-- ============================================================================

-- Riscrittura mirata (FASE 4): CONSERVA firma (uuid, text), owner
-- (postgres), SECURITY DEFINER, search_path fissato. CAMBIA solo la
-- clausola di conflitto su b2c_subscriptions da un ON CONFLICT DO UPDATE
-- incondizionato a uno con WHERE che permette l'update SOLO se la riga
-- esistente e' 'founder_grant' o 'trial' (whitelist, non blacklist: un
-- qualunque valore FUTURO/sconosciuto di billing_source resta protetto per
-- default, non solo i 3 valori commerciali noti oggi). Poi usa
-- GET DIAGNOSTICS ROW_COUNT per sapere se l'upsert ha realmente scritto
-- qualcosa: SOLO con ROW_COUNT > 0 marca founder_grants.applied_user_id/
-- applied_at e ritorna true; con ROW_COUNT = 0 (conflitto contro una riga
-- commerciale protetta) non tocca founder_grants e ritorna false.
--
-- NON sufficiente un ON CONFLICT ... DO UPDATE ... WHERE senza controllare
-- ROW_COUNT (istruzione esplicita di Matteo): la funzione continuerebbe
-- comunque a marcare founder_grants come applicato e a ritornare true
-- anche quando l'update e' stato silenziosamente saltato dalla WHERE,
-- producendo uno stato falso (riserva "consumata" senza che nulla di reale
-- sia stato scritto).
--
-- CORREZIONE CRITICA (trovata in review avversariale, prima della
-- consegna): la DDL REALE di public.b2c_subscriptions e' gia' TRACCIATA in
-- questo stesso repo (supabase/migrations/20260514120004_init_b2c_subs.sql,
-- mai cercata prima d'ora in questo sprint — un errore di processo, non
-- solo di codice) ed ha QUATTRO colonne NOT NULL senza default che la
-- prima bozza di questa funzione non popolava affatto:
-- external_product_id, external_subscription_id, active_until,
-- auto_renewing (quest'ultima ha un default ma non e' il valore corretto
-- per un grant permanente). Una insert senza queste colonne avrebbe
-- fallito con "null value in column ... violates not-null constraint" su
-- OGNI claim Founder reale, non un edge case — trovato SOLO applicando il
-- corpo esatto di questa funzione contro la DDL reale in un test isolato,
-- mai dalla sola lettura.
--
-- Valori scelti: NON inventati — rispecchiano esattamente la convenzione
-- gia' STABILITA e TRACCIATA in questo stesso repo da
-- public.grant_b2c_trial() (supabase/migrations/20260514120006_
-- sprint0_fixes.sql, versione race-safe finale) per il trial 7gg:
-- external_product_id = identificatore sintetico 'fitmesh_b2c_trial_7d',
-- external_subscription_id = 'trial-' || user_id, active_until = now() +
-- 7gg, auto_renewing = false. Per founder_grant si segue la STESSA forma,
-- sostituendo solo i valori specifici del prodotto: external_product_id =
-- 'fitmesh_founder_grant', external_subscription_id = 'founder-' ||
-- user_id (stesso pattern "<tipo>-<user_id>", garantisce unicita' per
-- costruzione rispetto al vincolo UNIQUE(billing_source,
-- external_subscription_id): nessun'altra riga puo' avere lo stesso
-- user_id incorporato), active_until = '9999-12-31' (il sentinel
-- "lifetime" gia' documentato nel commento di testa della tabella stessa e
-- verificato da public.is_b2c_lifetime(), non un valore scelto a caso —
-- Founder e' concettualmente un grant permanente, esattamente come il
-- prodotto lifetime esistente), auto_renewing = false (nessun rinnovo
-- ricorrente, stessa convenzione lifetime).
--
-- L'UPDATE (ramo conflitto permesso) aggiorna ANCHE queste colonne, non
-- solo billing_source/state: convertire un trial (active_until a ~7
-- giorni) in founder_grant SENZA aggiornare active_until lascerebbe la
-- riga con una scadenza imminente nonostante il nuovo billing_source
-- permanente — bug silenzioso, non solo un dettaglio estetico.
--
-- RESIDUO DICHIARATO, ridotto ma non azzerato: i valori letterali sopra
-- sono dedotti dalla convenzione di un'ALTRA funzione (grant_b2c_trial),
-- non confermati leggendo le 18 righe founder_grant gia' esistenti in
-- produzione (create da un corpo di _apply_founder_grant mai letto). Se
-- quel corpo storico usa convenzioni diverse per queste stesse colonne,
-- le nuove righe scritte da questa funzione avrebbero valori
-- STILISTICAMENTE diversi dalle 18 esistenti (mai un errore/crash — sono
-- comunque valori validi e coerenti — solo una possibile incoerenza
-- cosmetica fra righe vecchie e nuove). §17b del preflight (DDL +
-- ispezione delle righe founder_grant esistenti) resta la verifica finale
-- prima dell'apply.
--
-- RESIDUO DICHIARATO — nomi dei parametri: la funzione legacy
-- (private.claim_founder_grant_if_eligible, mai riletta) chiama
-- internamente _apply_founder_grant. Se quella chiamata usasse sintassi a
-- parametri NOMINATI con nomi diversi da p_user_id/p_email scelti qui, la
-- chiamata fallirebbe in modo esplicito al primo utilizzo (mai
-- silenziosamente) — rischio giudicato basso: p_user_id/p_email segue la
-- stessa convenzione gia' osservata in ogni altra funzione Founder di
-- questo stesso progetto (grant_founder_launch_core(p_user_id, p_device_id),
-- _next_founder_number, ecc.), ma non e' stato possibile confermarlo senza
-- il corpo reale.
--
-- RESIDUO DICHIARATO, deliberatamente NON esteso oltre la specifica
-- ricevuta: il ROW_COUNT della UPDATE su founder_grants (poche righe sotto)
-- non viene controllato separatamente — solo quello dell'upsert su
-- b2c_subscriptions decide true/false, esattamente come specificato. Se
-- p_email non corrispondesse a nessuna riga founder_grants (non dovrebbe
-- mai accadere: il chiamante gia' verifica l'allowlist prima di arrivare
-- qui), la UPDATE sotto sarebbe un no-op silenzioso su founder_grants ma
-- la funzione tornerebbe comunque true (l'entitlement b2c_subscriptions e'
-- comunque reale per l'utente) — non un dato corrotto, solo un ledger
-- founder_grants non aggiornato in uno scenario che non dovrebbe
-- presentarsi nel flusso reale.
--
-- CORREZIONE CRITICA #2 (trovata dal test di concorrenza Caso 36 stesso,
-- non da un'ispezione statica): un `ON CONFLICT (user_id) DO UPDATE`
-- risolve conflitti SOLO sull'indice/arbitro nominato (user_id). La DDL
-- reale di b2c_subscriptions ha PERO' un SECONDO vincolo univoco
-- indipendente, UNIQUE(billing_source, external_subscription_id)
-- (20260514120004_init_b2c_subs.sql). Poiche' external_subscription_id
-- qui e' derivato deterministicamente da user_id ('founder-' || user_id),
-- quel secondo vincolo e' logicamente ridondante con user_id per QUESTA
-- funzione — ma Postgres non lo sa, e un ON CONFLICT che nomina un solo
-- arbitro NON sopprime una violazione su un indice univoco diverso. Sotto
-- concorrenza reale (due chiamate per lo stesso user_id nuovo, testato in
-- run-suite.sh Caso 36), la SECONDA chiamata puo' fallire con
-- "duplicate key value violates unique constraint
-- b2c_subscriptions_billing_source_external_subscription_id_key" invece
-- di essere silenziosamente assorbita dalla ON CONFLICT — riprodotto
-- empiricamente, non solo temuto in astratto.
--
-- Corretto sostituendo l'INSERT...ON CONFLICT con un blocco
-- BEGIN/EXCEPTION: il tentativo di INSERT resta il percorso comune (nessun
-- costo aggiuntivo quando non c'e' conflitto); se scatta UNIQUE_VIOLATION
-- (su QUALUNQUE dei due indici — sono comunque sempre imputabili alla
-- stessa causa: esiste gia' una riga per questo user_id, dato che
-- external_subscription_id lo incorpora), il fallback e' un UPDATE
-- esplicito filtrato per user_id CON LA STESSA whitelist
-- (billing_source in ('founder_grant','trial')) del ramo INSERT: se la
-- riga gia' esistente e' commerciale, l'UPDATE modifica zero righe
-- (ROW_COUNT=0), stessa semantica di prima. Se e' gia' founder_grant o
-- trial, l'UPDATE riesce (ROW_COUNT>0). Nessun cambio di comportamento
-- per i casi gia' testati (Casi 24-29, 33-35) — solo la STESSA vittoria
-- commerciale/Founder ora sopravvive anche quando la riga vincitrice non
-- esiste ancora al momento in cui la seconda chiamata tenta l'INSERT.
create or replace function public._apply_founder_grant(p_user_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_rows int;
begin
  begin
    insert into public.b2c_subscriptions (
      user_id, billing_source, external_product_id, external_subscription_id,
      active_until, auto_renewing, state
    )
    values (
      p_user_id, 'founder_grant', 'fitmesh_founder_grant', 'founder-' || p_user_id::text,
      '9999-12-31'::timestamptz, false, 'active'
    );
    v_rows := 1;
  exception
    when unique_violation then
      -- Riga gia' esistente per questo user_id (conflitto sul PK o
      -- sull'indice secondario, sempre la stessa causa reale per questa
      -- funzione — vedi commento sopra). Fallback esplicito, STESSA
      -- whitelist del ramo INSERT.
      update public.b2c_subscriptions
      set billing_source = 'founder_grant',
          external_product_id = 'fitmesh_founder_grant',
          external_subscription_id = 'founder-' || p_user_id::text,
          active_until = '9999-12-31'::timestamptz,
          auto_renewing = false,
          state = 'active'
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
  where lower(email) = lower(p_email);

  return true;
end;
$$;

comment on function public._apply_founder_grant(uuid, text) is
  'Sprint P0.10E-D: riscrittura mirata (non il corpo originale, mai letto '
  'per intero) — barriera atomica whitelist su b2c_subscriptions.'
  'billing_source (solo founder_grant/trial possono essere sovrascritti), '
  'ROW_COUNT reale via GET DIAGNOSTICS: founder_grants.applied_user_id/'
  'applied_at aggiornati SOLO se l''upsert ha davvero scritto una riga. '
  'Stessa firma/owner/SECURITY DEFINER dell''originale confermato live '
  '(MD5 5c7649b942f04234c31d3c7961c4c6a0), verificato bit-per-bit prima '
  'della sostituzione da un guard MD5 in questa stessa migration.';

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
    raise warning 'P0.10E-D: public._apply_founder_grant(uuid, text) non trovata dopo la riscrittura - reassert ACL SALTATO, verificare manualmente.';
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
--     (whitelist ON CONFLICT + ROW_COUNT), e la risposta al client viene
--     corretta dalla ri-verifica FASE 5 anche se la funzione legacy
--     (mai riletta) non distinguesse internamente questo caso da un
--     generico "non eleggibile".
-- Non risulta piu' alcuna finestra nota e non protetta per la
-- sovrascrittura di una sottoscrizione commerciale tramite questa RPC.
-- ============================================================================
