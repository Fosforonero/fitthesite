-- Sprint P0.10E-A — le 3 riserve Founder non devono mai scavalcare il cutoff.
--
-- BLOCCANTE trovato in review avversariale (Sprint P0.10E): il cutoff in
-- private.grant_founder_launch_core (20260728090000) e' airtight per il
-- percorso ORGANICO (`created_at >= cutoff` -> 'program_closed' prima di
-- qualunque logica di cap/allocatore) — ma quella funzione NON assegna mai
-- una delle 3 email riservate in public.founder_grants a un utente
-- specifico. Il percorso che LO FA e' public.claim_founder_grant_if_eligible()
-- / public._apply_founder_grant(uuid, text), funzioni MAI create da alcuna
-- migration in questo repo (drift di schema non tracciato, come
-- founder_grants/schema private stessi).
--
-- Il contratto JSON live di claim_founder_grant_if_eligible() documentato
-- (docs/architecture/founder-p0-grant-design-v3.md, branch orfano
-- feat/p11-founder-close-fase0, "Stato live confermato 19-20/07/2026"):
--   {"eligible": true,  "reason": "granted"}
--   {"eligible": false, "reason": "not_in_allowlist"}
-- L'UNICO motivo di rifiuto documentato e' l'allowlist. NESSUN controllo
-- di data. Se questo e' ancora il corpo live, un account creato DOPO il
-- cutoff con una delle 3 email riservate otterrebbe Founder scavalcando
-- interamente 20260728090000.
--
-- Decisione di Matteo (Sprint P0.10E-A, vincolante):
--   auth.users.created_at <  2026-07-31T22:00:00Z -> le regole esistenti
--   auth.users.created_at >= 2026-07-31T22:00:00Z -> MAI un nuovo Founder,
--     nemmeno per un'email allowlisted.
-- Le riserve restano reclamabili SOLO da account creati prima del cutoff.
-- I Founder gia' assegnati non sono toccati da questo file (nessuna
-- modifica a user_roles/founder_grants gia' applicati).
--
-- APPROCCIO SCELTO: gate esterno, MAI riscrittura del corpo esistente.
-- Non e' stato possibile leggere il corpo live reale di
-- claim_founder_grant_if_eligible()/_apply_founder_grant() (nessun accesso
-- Supabase autenticato da questa sessione — vedi §14 del preflight,
-- p010-preflight-readonly-queries.sql). Riscriverle alla cieca rischierebbe
-- di alterare silenziosamente la logica di allowlist/allocazione per gli
-- account PRE-cutoff, che deve restare ESATTAMENTE quella di oggi. Il gate
-- sotto e' invece una funzione NUOVA che:
--   1. verifica SOLO auth.uid() + auth.users.created_at (nessuna conoscenza
--      del corpo della funzione legacy necessaria);
--   2. se post-cutoff, ritorna {"eligible": false, "reason":
--      "program_closed"} SENZA MAI chiamare la funzione legacy — il
--      controllo allowlist non viene nemmeno raggiunto per un account
--      post-cutoff, quindi non puo' in alcun modo produrre "eligible: true"
--      per uno di essi, indipendentemente da cosa fa il corpo legacy;
--   3. se pre-cutoff, delega INTERAMENTE alla funzione legacy esistente,
--      invariata, stesso comportamento di oggi bit-per-bit.
--
-- L'ACL viene chiusa sulla funzione grezza (mai piu' chiamabile
-- direttamente da anon/authenticated) cosi' che il gate sia l'UNICO
-- percorso raggiungibile dall'esterno verso la logica di riserva — la
-- funzione legacy resta chiamabile dal gate perche' questo e' SECURITY
-- DEFINER (esegue con i privilegi del proprietario, non del chiamante).
--
-- QUESTO FILE NON APPLICA ANCORA NULLA IN PRODUZIONE. Il preflight §14
-- deve confermare che il corpo/contratto legacy sia davvero quello
-- documentato prima di qualunque apply: se il corpo reale gia' contiene un
-- controllo di data (scoperta che contraddirebbe la premessa di questo
-- file), questa migration diventerebbe un doppio controllo ridondante ma
-- innocuo, non pericoloso — il gate non fa mai peggio del legacy, solo
-- uguale o piu' restrittivo.

create or replace function public.claim_founder_grant_if_eligible_gated()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid;
  v_created_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select created_at into v_created_at from auth.users where id = v_user_id;
  if v_created_at is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  -- Stesso istante letterale di lib/founder/program-window.ts
  -- FOUNDER_END_AT e di private.grant_founder_launch_core.founder_cutoff.
  -- Nessun meccanismo automatico tiene sincronizzate le tre copie (stesso
  -- residuo gia' dichiarato per le altre due — vedi founder:window-check).
  if v_created_at >= '2026-07-31T22:00:00Z'::timestamptz then
    return jsonb_build_object('eligible', false, 'reason', 'program_closed');
  end if;

  -- Account pre-cutoff: comportamento INVARIATO, delega totale alla
  -- funzione esistente. Se non esistesse (nome/firma reali diversi da
  -- quanto documentato), questa chiamata fallisce in modo rumoroso
  -- (funzione non trovata) invece di fingere un esito — corretto: meglio
  -- un errore esplicito che un fallback silenzioso su una premessa
  -- verificata solo indirettamente.
  return public.claim_founder_grant_if_eligible();
end;
$$;

comment on function public.claim_founder_grant_if_eligible_gated is
  'Sprint P0.10E-A: gate di cutoff davanti a claim_founder_grant_if_eligible(). '
  'Un account creato al o dopo il 2026-07-31T22:00:00Z riceve sempre '
  '{"eligible":false,"reason":"program_closed"} SENZA raggiungere la logica '
  'di allowlist legacy. Un account pre-cutoff delega interamente alla '
  'funzione esistente, comportamento invariato.';

revoke all on function public.claim_founder_grant_if_eligible_gated() from public, anon;
grant execute on function public.claim_founder_grant_if_eligible_gated() to authenticated;

-- Chiude il bypass: la funzione grezza non deve piu' essere raggiungibile
-- direttamente da alcun ruolo applicativo. Resta chiamabile dal gate sopra
-- (SECURITY DEFINER, esegue come proprietario) e da postgres/service_role
-- per uso amministrativo diretto.
--
-- Idempotente: REVOKE non fallisce se il privilegio non era gia' concesso.
-- Se _apply_founder_grant non esistesse con questa esatta firma (uuid,
-- text), lo statement fallisce in modo esplicito invece di essere
-- silenziosamente ignorato — corretto, e' un'assunzione da verificare col
-- preflight prima dell'apply, non da bypassare con IF EXISTS.
revoke execute on function public.claim_founder_grant_if_eligible() from public, anon, authenticated;
revoke execute on function public._apply_founder_grant(uuid, text) from public, anon, authenticated;
