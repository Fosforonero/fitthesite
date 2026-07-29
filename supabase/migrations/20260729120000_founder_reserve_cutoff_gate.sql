-- Sprint P0.10E-B — le 3 riserve Founder non devono mai scavalcare il
-- cutoff, SENZA rompere il client Flutter gia' pubblicato.
--
-- ============================================================================
-- CORREZIONE BLOCCANTE rispetto alla prima versione di questo file (Sprint
-- P0.10E-A, MAI applicata in produzione). Quella versione creava una NUOVA
-- funzione pubblica `claim_founder_grant_if_eligible_gated()` e revocava
-- EXECUTE sulla funzione originale `claim_founder_grant_if_eligible()` da
-- authenticated.
--
-- Verifica diretta di Matteo su produzione (2026-07-29, §14 del preflight):
--   - public.claim_founder_grant_if_eligible(): zero argomenti, ritorna
--     jsonb, SECURITY DEFINER, MD5 corpo live 8419db344a7383ba53f01457335a3494;
--   - nessun controllo created_at, nessun cutoff, nel corpo live;
--   - ACL live: PUBLIC/anon/authenticated/service_role hanno tutti EXECUTE
--     ({=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/
--     postgres,service_role=X/postgres} — "=X" senza ruolo davanti significa
--     EXECUTE concesso a PUBLIC).
--
-- Il client Flutter GIA' PUBBLICATO chiama pero' ESCLUSIVAMENTE il nome
-- originale `claim_founder_grant_if_eligible()`, mai `_gated()`. La prima
-- versione di questo file avrebbe quindi:
--   1. reso IRRAGGIUNGIBILE da authenticated la funzione che il client
--      chiama davvero (revoke su claim_founder_grant_if_eligible) — ogni
--      claim legittimo di riserva pre-cutoff sarebbe fallito silenziosamente
--      (fire-and-forget lato app, nessuna release necessaria per accorgersene);
--   2. lasciato `_gated()` come endpoint pubblico parallelo che nessun
--      client conosce o chiama mai — un gate che non gate-a nulla.
-- Nessuna release Flutter e' prevista per questo sprint: il nome pubblico
-- ESISTENTE deve restare l'unico endpoint, con la stessa firma e la stessa
-- forma di risposta.
--
-- APPROCCIO CORRETTO: spostare la funzione legacy FUORI dal nome pubblico
-- con `ALTER FUNCTION ... SET SCHEMA private` — non un CREATE OR REPLACE.
-- Questo non richiede di conoscere il corpo della funzione (mai letto in
-- questa sessione): sposta la definizione ESISTENTE, bit-per-bit, owner
-- incluso, senza toccarne una singola riga. Il nome pubblico originale
-- viene poi ricreato come wrapper che applica auth + cutoff + finestra
-- individuale, e delega fedelmente alla funzione (ora privata) per ogni
-- account che supera entrambi i controlli.
--
-- QUESTO FILE NON APPLICA ANCORA NULLA IN PRODUZIONE. Vedi
-- docs/architecture/p010-founder-pre-apply-checklist.md per lo stato GO/NO-GO
-- completo, inclusa la BLOCCO 3 (_apply_founder_grant e le sottoscrizioni
-- commerciali) che QUESTO FILE NON RISOLVE — vedi commento dedicato in fondo.
-- ============================================================================

-- ============================================================================
-- 1. Sposta la funzione legacy fuori da `public`, preservandone il corpo
--    esatto.
--
--    Guardia di RIESECUZIONE (trovata mancante in review avversariale sulla
--    prima bozza di questo file): controllare SOLO "esiste in public" non
--    basta a rendere questo passo rieseguibile. Dopo la prima apply,
--    `public.claim_founder_grant_if_eligible()` esiste ANCORA — e' il
--    wrapper creato al passo 2, stesso nome/stessa arieta' della funzione
--    legacy per costruzione (e' l'intero punto di questo file). Una guardia
--    che controllasse solo "esiste in public" rieseguirebbe l'ALTER anche
--    su un DB gia' migrato, tentando di spostare il WRAPPER dentro
--    `private`, dove pero' la funzione legacy occupa gia' quel nome —
--    collisione, errore. La condizione corretta e' quindi doppia: sposta
--    SOLO se la funzione esiste in public E NON esiste gia' in private
--    (cioe' solo se lo spostamento non e' mai avvenuto).
--
--    Se nessuna delle due condizioni vale in un modo inatteso (es. la
--    funzione non esiste ne' in public ne' in private, perche' nome/firma
--    reali sono diversi da quanto documentato), questo passo non fa nulla
--    di silenzioso: il passo 2 sotto fallira' in modo esplicito
--    ("function private.claim_founder_grant_if_eligible() does not exist")
--    al momento di delegare.
--
--    `create schema if not exists private`: no-op in produzione (lo schema
--    esiste gia', creato da 20260728090000 o da drift precedente non
--    tracciato — stesso pattern gia' documentato li'), necessario solo per
--    rendere questo file autosufficiente in un replay locale isolato.
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
-- Assunzione di ownership (verificata in review avversariale, NON ancora
-- confermata su produzione — vedi §17 del preflight): il wrapper SECURITY
-- DEFINER sotto puo' delegare a questa funzione anche dopo il revoke sopra
-- SOLO SE il ruolo che applica questa migration e' il proprietario della
-- funzione legacy, OPPURE e' membro del ruolo proprietario (un owner, o un
-- suo membro via eredita' di privilegi, mantiene sempre EXECUTE implicito,
-- non revocabile via REVOKE). Se la migration venisse applicata da un ruolo
-- SENZA questa relazione con l'owner reale, il passo 1 sopra fallisce
-- immediatamente e in modo esplicito ("must be owner of function") — mai
-- silenziosamente. Su Supabase il ruolo di migration e' tipicamente lo
-- stesso proprietario storico delle funzioni gia' in `public`, ma questo
-- non e' stato confermato con una query diretta in questa sessione.
revoke all on function private.claim_founder_grant_if_eligible() from public, anon, authenticated, service_role;

-- ============================================================================
-- 2. Wrapper pubblico — STESSO nome, STESSA firma (zero argomenti), STESSA
--    forma di risposta jsonb del client pubblicato. Applica auth + cutoff
--    globale + finestra individuale di 14 giorni, poi delega fedelmente.
--
--    Finestra individuale — quale timestamp e perche':
--    14 giorni da auth.users.created_at, confrontati con now() al momento
--    della chiamata. NON da devices.first_sync_at (a differenza della
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
--    Confronto al boundary esatto (documentato e testato): now() >
--    created_at + 14 giorni -> scaduta. Esattamente 14 giorni dopo
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
  -- per chi si e' registrato PRIMA che il programma chiudesse.
  if v_created_at >= founder_cutoff then
    return jsonb_build_object('eligible', false, 'reason', 'program_closed');
  end if;

  if now() > v_created_at + founder_window then
    return jsonb_build_object('eligible', false, 'reason', 'window_expired');
  end if;

  -- Account pre-cutoff, dentro la propria finestra individuale:
  -- comportamento INVARIATO, delega totale alla funzione legacy (ora
  -- privata). Se non esistesse (nome/firma reali diversi da quanto
  -- documentato), questa chiamata fallisce in modo rumoroso (funzione non
  -- trovata) invece di fingere un esito.
  return private.claim_founder_grant_if_eligible();
end;
$$;

comment on function public.claim_founder_grant_if_eligible is
  'Sprint P0.10E-B: wrapper di cutoff+finestra davanti alla funzione legacy '
  '(ora private.claim_founder_grant_if_eligible), stesso nome pubblico e '
  'stessa firma del client gia'' pubblicato. Un account creato al o dopo il '
  '2026-07-31T22:00:00Z riceve sempre {"eligible":false,"reason":'
  '"program_closed"}. Un account pre-cutoff la cui finestra individuale di '
  '14 giorni (da auth.users.created_at) e'' scaduta riceve '
  '{"eligible":false,"reason":"window_expired"}. Solo un account pre-cutoff '
  'dentro la propria finestra raggiunge la logica di allowlist legacy, '
  'invariata.';

-- PUBLIC e anon non devono avere EXECUTE. authenticated si', e' l'unico
-- percorso esterno verso la logica di riserva.
revoke all on function public.claim_founder_grant_if_eligible() from public, anon;
grant execute on function public.claim_founder_grant_if_eligible() to authenticated;

-- ============================================================================
-- 3/4. Reassert ACL su _apply_founder_grant/handle_new_founder — BEST
--    EFFORT, disaccoppiato deliberatamente dal fix critico sopra (trovato
--    in review avversariale: nella prima bozza di questo file, un revoke
--    con firma sbagliata qui avrebbe interrotto l'intero file DOPO che il
--    passo 1/2 critico era gia' stato applicato, lasciando una migration
--    "fallita" agli occhi dello strumento di apply ma con il fix vero gia'
--    live — un riavvio ingenuo dell'INTERO file avrebbe poi urtato contro
--    la guardia di riesecuzione del passo 1, producendo un secondo errore
--    fuorviante che oscura il primo). Ogni reassert e' quindi avvolto in
--    una propria guardia: se la firma reale non corrisponde, la migration
--    emette un WARNING esplicito (mai silenzioso, sempre visibile
--    nell'output dell'apply) e prosegue, invece di abortire l'intero file
--    per un problema su una funzione che non e' il gate di cutoff.
--
--    _apply_founder_grant(uuid, text): ACL live gia' chiusa a
--    PUBLIC/anon/authenticated (confermato da Matteo il 2026-07-29) — questo
--    e' un reassert ESPLICITO, non un fix di una falla attiva. Resta in
--    `public` (nessun consumer esterno la chiama comunque: solo la funzione
--    legacy, ora privata, la invoca internamente via SECURITY DEFINER).
--
--    ATTENZIONE — l'ACL corretta NON significa che la LOGICA sia corretta:
--    vedi il blocco "BLOCCO 3, NON RISOLTO" in fondo a questo file.
-- ============================================================================
-- to_regprocedure(): risolve per TIPI degli argomenti, mai per i nomi dei
-- parametri (che potrebbero essere diversi nel corpo reale mai letto
-- integralmente — pg_get_function_identity_arguments() include invece i
-- nomi dei parametri, trovato in review avversariale che avrebbe reso
-- questa guardia fragile anche a parita' di tipi).
do $$
begin
  if to_regprocedure('public._apply_founder_grant(uuid, text)') is not null then
    revoke all on function public._apply_founder_grant(uuid, text) from public, anon, authenticated;
  else
    raise warning 'P0.10E-B: public._apply_founder_grant(uuid, text) non trovata con questa firma esatta - reassert ACL SALTATO, verificare manualmente. Non blocca il resto della migration: il fix critico su claim_founder_grant_if_eligible() e'' indipendente da questo passo.';
  end if;
end $$;

-- handle_new_founder(): nessun trigger live la usa (confermato da Matteo,
-- 2026-07-29), ACL live aperta a PUBLIC/anon/authenticated/service_role
-- senza alcun motivo funzionale. Revocata da PUBLIC/anon/authenticated in
-- questo file. service_role NON revocato qui: a differenza di
-- anon/authenticated (sicuramente irraggiungibili da un flusso legittimo
-- per una funzione trigger senza trigger attivo), manca una verifica
-- esplicita che nulla di amministrativo la invochi via service_role —
-- valutazione rimandata, non e' un blocco. Funzione NON eliminata in questo
-- sprint (istruzione esplicita di Matteo).
do $$
begin
  if to_regprocedure('public.handle_new_founder()') is not null then
    revoke execute on function public.handle_new_founder() from public, anon, authenticated;
  else
    raise warning 'P0.10E-B: public.handle_new_founder() non trovata - reassert ACL SALTATO, verificare manualmente. Non blocca il resto della migration.';
  end if;
end $$;

-- Forza PostgREST a rileggere lo schema: abbiamo spostato una funzione fra
-- schemi e cambiato la definizione di quella esposta con lo stesso nome. Le
-- pipeline Supabase inviano gia' questa NOTIFY dopo ogni migration, ma e'
-- esplicita qui per non dipendere da quel comportamento implicito.
notify pgrst, 'reload schema';

-- ============================================================================
-- BLOCCO 3, NON RISOLTO IN QUESTO FILE — _apply_founder_grant(uuid, text)
-- e sottoscrizioni commerciali.
--
-- Verifica live di Matteo (2026-07-29): il corpo di _apply_founder_grant usa
-- `ON CONFLICT (user_id) DO UPDATE`, e questo puo' sovrascrivere una riga
-- b2c_subscriptions gia' presente per lo stesso user_id — cioe' un utente
-- con una delle 3 email riservate che ha GIA' una sottoscrizione commerciale
-- attiva (Google Play, Apple IAP o Stripe) al momento del claim rischia di
-- vedersela sostituita da un founder_grant.
--
-- QUESTO FILE NON TOCCA _apply_founder_grant: il suo corpo reale non e' mai
-- stato letto integralmente in questa sessione (solo la clausola ON
-- CONFLICT e' stata confermata da Matteo via lettura diretta), e la
-- struttura esatta di b2c_subscriptions (colonne/vincoli/quale sorgente
-- vince) non e' nel preflight di questo branch. Scrivere un guard alla
-- cieca su una tabella/logica non letta per intero rischierebbe di
-- introdurre un secondo bug al posto del primo (stesso principio gia'
-- applicato al gate sopra: mai riscrivere cio' che non si e' letto).
--
-- Rischio, non dichiarato risolto: NARROW ma REALE. La superficie e' i soli
-- 3 posti riservati in public.founder_grants (allowlist curata a mano,
-- zero account associati ad oggi) — non l'intera popolazione utenti. Si
-- attiva SOLO se una di quelle 3 email specifiche si registra, ha gia' una
-- sottoscrizione commerciale attiva, e chiama questa RPC prima del cutoff e
-- dentro la propria finestra di 14 giorni. Non e' bloccante per l'apply
-- delle 4 migration di questo sprint (nessuna di esse tocca
-- _apply_founder_grant oltre al reassert ACL sopra, gia' vero in
-- produzione oggi, indipendentemente da qualunque apply) — ma DEVE essere
-- risolto con un fix dedicato PRIMA che una di quelle 3 email venga
-- effettivamente reclamata, non dopo.
--
-- Prossimo passo proposto (non eseguito qui): §17 del preflight
-- (p010-preflight-readonly-queries.sql) richiede il corpo integrale di
-- _apply_founder_grant via pg_get_functiondef e la DDL di b2c_subscriptions
-- — solo con quei due dati e' possibile progettare un fix corretto (non un
-- guess) come migration separata (#5).
-- ============================================================================
