# Pre-apply checklist — migration 20260728090000 (Sprint P0.10A/B/D/E/E-A/E-B)

## Sprint P0.10E-B — la #4 è stata RISCRITTA dopo un bug bloccante trovato in produzione

La prima versione della migration #4 (Sprint P0.10E-A) non è mai stata
applicata e conteneva un bug che avrebbe rotto il client pubblicato — vedi
"### CORREZIONE BLOCCANTE P0.10E-B" sotto per il dettaglio completo. Il
resto dell'ordine di apply (4 migration separate, dipendenze fra loro)
resta invariato:

| # | File | Cosa fa | Autorizzazione |
|---|---|---|---|
| 1 | `20260728090000_founder_launch_cutoff_and_window.sql` | Sunset Founder: cutoff + finestra + ledger persistente + backfill 375 righe | `GO APPLY P0.10` |
| 2 | `20260728100000_harden_legacy_b2c_trial_acl.sql` | Revoca EXECUTE su `grant_b2c_trial()` da public/anon/authenticated | **separata**, va autorizzata esplicitamente |
| 3 | `20260728110000_entitlement_status_contract.sql` | Nuova RPC `get_entitlement_status()` server-authoritative | **separata**, va autorizzata esplicitamente |
| 4 | `20260729120000_founder_reserve_cutoff_gate.sql` (RISCRITTA, Sprint P0.10E-B) | Sposta `claim_founder_grant_if_eligible()` in `private`, ricrea il nome pubblico originale come wrapper cutoff+finestra, hardening `handle_new_founder()` | **separata**, va autorizzata esplicitamente. **Dipende da §17a del preflight** (ownership reale della funzione legacy) |

La #1 è l'unica che scrive dati (backfill). La #2/#4 toccano solo ACL +
funzioni. La #3 crea una funzione nuova senza toccare nulla di esistente.
#1/#2/#3 non dipendono l'una dall'altra a livello SQL. La #4 presuppone che
il ruolo che applica la migration sia proprietario (o membro del
proprietario) di `claim_founder_grant_if_eligible()` — se il preflight §17a
mostra un owner diverso, la #4 fallisce in modo esplicito al primo passo
("must be owner of function"), non silenziosamente, e va corretta prima di
riprovare. Tenute separate proprio per poterle autorizzare una alla volta
(istruzione esplicita di Matteo: non mescolare l'hardening alla migration
Founder).

SHA-256 al momento della consegna (se cambiano, riconfermare — le prime tre
sono invariate dalla consegna precedente, ricalcolate qui per completezza;
il valore precedentemente registrato per la #3 in questo stesso file era
stale/errato, corretto qui contro `git show 3d23c86:...`):
```
3e79bc3d110fd2ca2d50d3c4d3383c8b5f4297e895129e6fabd84094f5885813  20260728090000_founder_launch_cutoff_and_window.sql
9a9c0a954702b273996d583c58d3797027b7209f43325ba24d1bcdacb0767522  20260728100000_harden_legacy_b2c_trial_acl.sql
af78448c477f95eedbd2a028dc5ad0310fdfb6fee449db2fcf645e8a0532948e  20260728110000_entitlement_status_contract.sql
131c304f7576c7e7b3f935df8b14ccd30a8a22b39bd3937e3fab2658b8452c0a  20260729120000_founder_reserve_cutoff_gate.sql
```

### CORREZIONE BLOCCANTE P0.10E-B: la prima versione della #4 rompeva il client pubblicato

Matteo ha eseguito §14 del preflight direttamente su produzione il
2026-07-29 e confermato: `public.claim_founder_grant_if_eligible()` esiste
con zero argomenti, ritorna `jsonb`, è `SECURITY DEFINER` (MD5 corpo
`8419db344a7383ba53f01457335a3494`), non contiene alcun controllo su
`created_at`, e la sua ACL live concede EXECUTE a **PUBLIC, anon,
authenticated e service_role**.

La prima versione della #4 (Sprint P0.10E-A, MAI applicata) creava una
funzione nuova `claim_founder_grant_if_eligible_gated()` e revocava EXECUTE
sull'originale da `authenticated`. Il client Flutter già pubblicato chiama
**esclusivamente** il nome originale. Applicata così, quella migration
avrebbe reso irraggiungibile da `authenticated` la funzione che il client
chiama davvero — ogni claim legittimo di riserva pre-cutoff sarebbe fallito
silenziosamente (fire-and-forget lato app) — lasciando `_gated()` come
endpoint parallelo che nessun client conosce.

**Trovato da Matteo in verifica diretta su produzione, non da questa
sessione.** Corretto riscrivendo per intero la #4: vedi
`supabase/migrations/20260729120000_founder_reserve_cutoff_gate.sql` per il
commento completo. In sintesi, l'approccio ora è:

1. `ALTER FUNCTION public.claim_founder_grant_if_eligible() SET SCHEMA private` — sposta la funzione ESISTENTE (corpo mai letto, mai riscritto) fuori dal nome pubblico, preservandola bit-per-bit.
2. Chiude l'accesso diretto alla funzione ora in `private`.
3. Ricrea `public.claim_founder_grant_if_eligible()` (STESSO nome, STESSA firma) come wrapper: verifica `auth.uid()`, poi cutoff globale (`created_at >= 2026-07-31T22:00:00Z` → `program_closed`), poi finestra individuale di 14 giorni (`now() > created_at + 14gg` → `window_expired`, misurata da `created_at` perché questa RPC è chiamata al login senza `device_id`, quindi senza alcuna evidenza di prima-sync disponibile — vedi il commento nel file per il ragionamento completo), poi delega fedelmente a `private.claim_founder_grant_if_eligible()`.
4. Hardening aggiuntivo (dall'ADDENDUM CORRETTO P0.10E-B): reassert esplicito del REVOKE su `_apply_founder_grant(uuid, text)` (ACL già chiusa in produzione) e revoca EXECUTE su `handle_new_founder()` da PUBLIC/anon/authenticated (nessun trigger live la usa; `service_role` deliberatamente non toccato).

**Zero release Flutter richieste**: il client continua a chiamare lo stesso
nome/firma/contratto JSON di sempre.

### Function graph — prima e dopo l'apply della #4

```
PRIMA (stato live confermato 2026-07-29):
  public.claim_founder_grant_if_eligible()  [EXECUTE: PUBLIC, anon, authenticated, service_role]
    └─ chiama internamente → public._apply_founder_grant(uuid, text)  [EXECUTE: postgres, service_role]
  public.handle_new_founder()  [EXECUTE: PUBLIC, anon, authenticated, service_role — nessun trigger attivo]

DOPO (se la #4 corretta viene applicata):
  public.claim_founder_grant_if_eligible()  [EXECUTE: authenticated soltanto — WRAPPER NUOVO]
    ├─ program_closed / window_expired → mai raggiunge quanto sotto
    └─ pre-cutoff, in finestra → delega a:
       private.claim_founder_grant_if_eligible()  [EXECUTE: nessuno tranne owner — FUNZIONE LEGACY SPOSTATA, corpo invariato]
         └─ chiama internamente → public._apply_founder_grant(uuid, text)  [EXECUTE: postgres, service_role — invariato, reassert esplicito]
  public.handle_new_founder()  [EXECUTE: postgres, service_role soltanto — nessun trigger attivo, non eliminata]
```

### ACL attesa dopo l'apply — matrice completa

| Funzione | PUBLIC | anon | authenticated | service_role | postgres/owner |
|---|---|---|---|---|---|
| `public.claim_founder_grant_if_eligible()` (wrapper) | NO | NO | **SÌ** | NO (non concesso esplicitamente — solo owner) | SÌ (implicito) |
| `private.claim_founder_grant_if_eligible()` (legacy spostata) | NO | NO | NO | NO | SÌ (implicito) |
| `public._apply_founder_grant(uuid, text)` | NO | NO | NO | SÌ | SÌ (implicito) |
| `public.handle_new_founder()` | NO | NO | NO | SÌ (non toccato, nessuna evidenza per revocarlo) | SÌ (implicito) |

### Review avversariale della #4 riscritta — 3 bug trovati e corretti prima della consegna

Una review avversariale indipendente (Workflow, general-purpose agent) ha
verificato empiricamente su `public.ecr.aws/supabase/postgres:15.8.1.085`
(stessa immagine di `run-suite.sh`) — non solo letto il codice. Trovati e
corretti:

1. **CONFERMATO — guardia di riesecuzione rotta.** La guardia originale
   controllava solo "la funzione esiste in `public`" prima di spostarla —
   ma dopo la prima apply, `public.claim_founder_grant_if_eligible()`
   esiste ANCORA (è il wrapper, stesso nome/arietà per costruzione). Una
   riapplicazione del file avrebbe tentato di spostare il WRAPPER dentro
   `private`, collidendo con la funzione legacy già lì. Corretto aggiungendo
   `AND NOT EXISTS` la funzione già in `private` alla condizione. **Test
   aggiunto**: `run-suite.sh` ora riapplica l'intero file una seconda volta
   contro un DB già migrato (Caso 14) — verificato che sia un no-op pulito.
2. **CONFERMATO — un revoke con firma sbagliata avrebbe interrotto l'intero
   file DOPO che il fix critico era già passato**, producendo una migration
   "fallita" agli occhi dello strumento di apply con il fix vero però già
   live — un riavvio ingenuo dell'intero file avrebbe poi urtato contro il
   bug #1. Corretto disaccoppiando i due reassert ACL non critici
   (`_apply_founder_grant`, `handle_new_founder`) in blocchi `do $$ ... $$`
   indipendenti che emettono un `RAISE WARNING` esplicito (mai silenzioso)
   e proseguono se la firma reale non corrisponde, invece di abortire tutto.
   Verificato anche che `pg_get_function_identity_arguments()` include i
   NOMI dei parametri (non solo i tipi) — un controllo per firma letterale
   sarebbe stato fragile anche a parità di tipi con nomi diversi nel corpo
   reale; sostituito con `to_regprocedure(...)`, che risolve solo per tipi.
3. **PLAUSIBILE, non confermabile da questa sessione — assunzione di
   ownership.** Il passo 1 richiede che il ruolo di migration sia
   proprietario (o membro del proprietario) di
   `claim_founder_grant_if_eligible()`. Se non lo fosse, l'apply fallisce
   subito ed esplicitamente ("must be owner of function") — commento
   corretto nel file, e aggiunta la query di verifica diretta **§17a** del
   preflight. Da eseguire prima dell'apply reale.

Trovati anche 3 problemi minori nella sola suite di test locale (mai nella
migration reale), tutti corretti: `test.assert` passava a vuoto su una
condizione NULL invece di fallire (ora `coalesce(..., false)`); il commento
sui Caso 7/8 (boundary finestra) attribuiva il margine di 5 secondi a un
race reale — verificato che `now()` è congelato per l'intera transazione,
quindi il margine serve solo leggibilità, non a evitare un race (corretto);
lo stub di `_apply_founder_grant` nel DB di test partiva con EXECUTE aperto
ad `authenticated` per via dei privilegi di default dell'immagine Postgres
di Supabase su ogni funzione nuova in `public` — non fedele allo stato live
reale (già chiuso) — corretto con un revoke esplicito nello stub stesso.

**13/13 casi funzionali + riesecuzione (Caso 14) + concorrenza (Caso 15) —
tutti verdi** dopo le correzioni, su Postgres reale
(`supabase/tests/founder_reserve_gate/`). Le altre due suite del branch
(`founder_p010a`, `entitlement_p010e`) ri-eseguite invariate: nessuna
regressione.

### BLOCCO 3 — NON RISOLTO, separato deliberatamente da questa migration

`_apply_founder_grant(uuid, text)` usa `ON CONFLICT (user_id) DO UPDATE`
(confermato da Matteo via lettura diretta il 2026-07-29) e può sovrascrivere
una riga `b2c_subscriptions` già presente per lo stesso `user_id` — cioè un
utente con una delle 3 email riservate che ha GIÀ una sottoscrizione
commerciale attiva (Google Play, Apple IAP o Stripe) al momento del claim
rischia di vedersela sostituita da un `founder_grant`.

**Non risolto in `20260729120000`** perché il corpo integrale di
`_apply_founder_grant` e la struttura reale di `b2c_subscriptions` non sono
mai stati letti per intero in questa sessione — scrivere un guard alla
cieca su una tabella/logica non letta per intero rischierebbe di introdurre
un secondo bug al posto del primo (stesso principio già applicato al gate:
mai riscrivere ciò che non si è letto).

**Rischio dichiarato, non dichiarato risolto**: narrow ma reale. Superficie
= i soli 3 posti riservati in `public.founder_grants` (allowlist curata a
mano, zero account associati ad oggi). Si attiva solo se una di quelle 3
email specifiche si registra, ha già una sottoscrizione commerciale attiva,
e chiama questa RPC prima del cutoff e dentro la propria finestra di 14
giorni. **Non blocca l'apply delle 4 migration di questo sprint** (nessuna
di esse tocca la logica di `_apply_founder_grant`, solo il reassert ACL già
vero in produzione oggi) — ma va risolto con un fix dedicato PRIMA che una
di quelle 3 email venga effettivamente reclamata, non dopo.

**Prossimo passo**: §17b del preflight richiede il corpo integrale via
`pg_get_functiondef` e la DDL di `b2c_subscriptions` — solo con quei due
dati è possibile progettare un fix corretto (non un guess) come migration
separata (#5).

### BLOCCANTE P0.10E (storico): le 3 riserve possono bypassare il cutoff — origine del problema

`private.grant_founder_launch_core` (la #1) è verificata airtight: il suo
controllo cutoff (`created_at >= 2026-07-31T22:00:00Z` → `program_closed`)
precede qualunque logica di cap/allocatore, e la funzione **non assegna mai**
un posto riservato a un utente specifico (usa `founder_grants` solo per un
`count(*)` dei posti non applicati).

Ma il percorso che *reclama* una delle 3 email riservate è un'altra
funzione: `public.claim_founder_grant_if_eligible()`, mai creata da alcuna
migration su questo branch (drift non tracciato, come `founder_grants` e lo
schema `private`). Questo è il conflitto di specifica che Matteo ha chiesto
di trattare come NO-GO da non risolvere in autonomia (Sprint P0.10E, Fase
2) — confermato dal vivo il 2026-07-29 (§14 del preflight, vedi sopra):
nessun controllo di data nel corpo live, ACL aperta a PUBLIC/anon/
authenticated/service_role. Un account creato dopo il cutoff con una delle
3 email riservate avrebbe altrimenti ottenuto Founder scavalcando
interamente il blocco della migration #1.

**Decisione presa da Matteo (2026-07-29): opzione 2.** Le riserve restano
reclamabili SOLO da account creati prima del cutoff, e solo dentro una
finestra individuale di 14 giorni dalla registrazione.

**Implementazione**: vedi "### CORREZIONE BLOCCANTE P0.10E-B" e il function
graph in cima a questo documento — la prima implementazione (P0.10E-A,
`claim_founder_grant_if_eligible_gated()` come endpoint nuovo) non è mai
stata applicata ed è stata sostituita perché avrebbe rotto il client
pubblicato. La versione corrente preserva il nome pubblico originale.

### Risolto in P0.10E: valore reale di `user_roles.note` per i grandfather

Lo stesso documento conferma il cohort: **`grandfather-prelaunch`, 8 utenti
permanenti, zero sovrapposizione con `founder-launch`**. Il match
`note ILIKE '%grandfather%'` usato da `get_entitlement_status()` (#3) è
quindi corretto sui dati reali. Resta comunque nel preflight (§16) la query
di conferma sui valori distinti attuali: il dato citato è di dieci giorni fa.

### Rollback delle migration nuove

- **#2 (hardening ACL)**: `grant execute on function public.grant_b2c_trial() to authenticated;`
  ripristina lo stato precedente. Nessun dato coinvolto, reversibile al 100%.
- **#3 (entitlement RPC)**: `drop function if exists public.get_entitlement_status();`
  La funzione è nuova e non referenziata da nulla in produzione (l'app non è
  wired: il consumer lato Flutter esiste ma è inerte, commit `247fca9`/`0db854a`
  su `develop/post-189`). Drop sicuro, nessun dato coinvolto.
- **#4 (gate riserve, aggiornato per la versione P0.10E-B)**:
  ```sql
  -- Ordine obbligatorio: il wrapper occupa il nome pubblico, va rimosso
  -- PRIMA di poter rispostare la funzione legacy da private a public
  -- (stessa collisione di nome/arieta' della migration in avanti).
  drop function if exists public.claim_founder_grant_if_eligible();
  alter function private.claim_founder_grant_if_eligible() set schema public;
  grant execute on function public.claim_founder_grant_if_eligible() to public, anon, authenticated, service_role;
  grant execute on function public.handle_new_founder() to public, anon, authenticated, service_role;
  -- _apply_founder_grant NON va ri-aperta: la sua ACL era gia' chiusa a
  -- PUBLIC/anon/authenticated PRIMA di questa migration (confermato da
  -- Matteo il 2026-07-29) — riaprirla in un rollback introdurrebbe una
  -- regressione di sicurezza che non esisteva nemmeno nello stato live
  -- pre-migration.
  ```
  Ripristina il corpo legacy esatto (mai riscritto, solo spostato) sotto il
  nome pubblico originale con l'ACL live pre-migration. Nessun dato
  coinvolto — l'intero flusso #4 è sola logica/ACL, non scrive mai in
  `founder_grants`/`user_roles`.
- **#1**: invariata rispetto a quanto già documentato sotto (mai droppare
  ledger non vuoti).

---


**Sprint P0.10D (2026-07-28) — riconciliazione con dati reali di produzione.**
Matteo ha eseguito le 13 verifiche read-only del preflight
(`docs/architecture/p010-preflight-readonly-queries.sql`) su un accesso
Supabase autenticato esterno a questa sessione. Risultati e riconciliazione:

| Voce | Assunto (P0.10A/B) | Reale (P0.10D, 2026-07-28) | Esito |
|---|---|---|---|
| Ultima migration applicata | `20260720120247` | `20260722145516` (6 migration Sprint 189-RC2 in più, tutte non-Founder) | **Deriva di naming, non di contenuto** — vedi §-1 sotto. Corretta rinominando i 6 file locali. |
| `founder_grants` totali | ~21 | 21 | ✅ confermato |
| `founder_grants` applicati | non noto con precisione | 18 | ✅ nessuna sorpresa (`legacy_allowlist` = 18) |
| `founder_grants` riservati | 3 | 3 | ✅ confermato, zero account associati |
| `user_roles` founder-launch | non noto | 361 righe = 361 utenti distinti | ✅ nessuna duplicazione |
| Backfill totale atteso | non calcolato | **375** (18 legacy_allowlist + 357 legacy_autogrant) | ✅ ricalcolato a mano dalla union `founder_grants.applied_user_id` ∪ `user_roles(founder-launch)` — combacia esattamente con la dry-run SQL §12 |
| Founder_number duplicati | 0 atteso | 0 | ✅ |
| `founder_grants` applicati senza nota founder-launch | non previsto esplicitamente | 14 (7 beta tester, 7 grandfather-prelaunch, tutti già Pro) | ✅ **non è un'anomalia**: il backfill li include comunque via `legacy_allowlist` (basato su `founder_grants.applied_user_id`, non su `user_roles`) — nessuna riga scritta in `user_roles` dal backfill, nessun doppio entitlement |
| Schema `private` | drift non tracciato, atteso pre-esistente | esiste, owner postgres, USAGE revocato per anon/authenticated/service_role | ✅ conferma il pattern già documentato |
| `private.founder_seats`/`founder_evaluations` | attese assenti | assenti | ✅ |
| `grant_founder_launch_core` | atteso invariato da `20260720120247` | MD5 combacia col corpo di `20260720120247` | ✅ nessuna delle 6 migration intermedie lo tocca (verificato anche via grep locale) |
| RLS/grants `founder_grants` | atteso solo service_role | policy `founder_grants_service_only` (service_role, USING/CHECK true) + grant residui table-level per anon/authenticated bloccati solo da RLS default-deny | ⚠️ `revoke all ... from public, anon, authenticated` di questo file è un hardening reale (non solo un no-op) — rimuove un grant ridondante, non un fix di una falla attiva (RLS già negava l'accesso) |
| RPC legacy (`claim_founder_grant_if_eligible`, `handle_new_founder`, `grant_b2c_trial`) | — | ancora eseguibili da PUBLIC/anon/authenticated secondo l'advisor | **Non bloccante per questa migration** — deferral già esplicito nel file stesso (righe finali, commento "DELIBERATAMENTE NON TOCCATE"), ereditato da Sprint P0.7. `handle_new_founder()` è `returns trigger`: Postgres rifiuta l'invocazione diretta via RPC, il grant PUBLIC è inerte. `claim_founder_grant_if_eligible()` già verificato in P0.7 come non sfruttabile via RLS su `founder_grants`. `grant_b2c_trial()` appartiene a un sottosistema diverso (trial B2B/gym-gateway, 7gg, product id `fitmesh_b2c_trial_7d`, zero subscription reali) — non correlato al Founder-launch o al trial 14gg del pricing pivot. Hardening di tutti e tre raccomandato come sprint separato, non come blocco di questa apply. |

### §-1. Fix applicato: rinomina dei 6 file migration (Sprint 189-RC2)

Le 6 migration Sprint 189-RC2 erano committate in questo repo con timestamp
diversi da quelli realmente assegnati da Supabase all'apply (content
normalizzato identico, solo il prefisso-versione differiva). Rinominate
(solo `git mv`, **zero modifica al contenuto SQL**, ordine di applicazione
invariato — verificato che l'ordine relativo resta lo stesso prima e dopo):

- `20260721180000` → `20260722062946_fitness_metrics_canonical_upsert.sql`
- `20260722090000` → `20260722084132_sleep_lossless_merge_and_helper_schema_move.sql`
- `20260722091000` → `20260722084223_workouts_canonical_upsert.sql`
- `20260722100000` → `20260722084840_advisor_fixes_search_path_and_rls_initplan.sql`
- `20260722110000` → `20260722111746_explicit_revoke_anon_execute_189rc2.sql`
- `20260722130000` → `20260722145516_workouts_fuzzy_merge_and_race_lock.sql`

Nessuna delle 6 tocca `founder_grants`, `user_roles`, lo schema `private` o
`grant_founder_launch_core` (verificato via grep sul contenuto). Riferimenti
ai vecchi timestamp nei commenti di `app/api/v1/sync/route.ts` aggiornati di
conseguenza (solo commenti, nessun cambio funzionale — tsc/vitest/build
rieseguiti verdi dopo la modifica).

**Ancora da fare, non eseguibile da questa sessione**: rieseguire
`supabase migration list --linked` (o dashboard) DOPO la rinomina per
confermare che l'unica migration `pending` risulti `20260728090000` e che
Supabase non richieda un `migration repair` (non deve servirne uno: i nomi
locali ora coincidono esattamente con le versioni registrate da remoto).

**Non ancora deciso da Matteo, non bloccante per l'apply**: i 3 posti
riservati restano permanentemente sottratti dal cap (`v_reserved_pending`
in `grant_founder_launch_core`, righe 496-498) indipendentemente da
qualunque decisione — il design esistente (approvato in P0.10A) già li
tratta come eccezioni grandfathered a tempo indeterminato. Non serve una
nuova decisione per procedere; serve solo la conferma che questo
comportamento resta quello voluto.

---

**Nessuna di queste query è stata eseguita da questa sessione**: nessun
accesso Supabase production autenticato disponibile (MCP Supabase non
autorizzato in questo ambiente non-interattivo). Questo documento prepara
le query esatte per chi ha accesso reale — da eseguire in ordine, con
conferma esplicita di Matteo prima di ogni passo che scrive.

## 0. Migration history — confermare lo stato reale prima di applicare

```sql
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 15;
```

Atteso: l'ultima versione applicata è `20260720120247` (esclusione
review@fitmesh.fit/appreview.demo@fitmesh.fit). Se compare qualunque
versione successiva non presente in questo repo, **fermarsi** — significa
che un altro agente/sessione ha applicato qualcosa di non tracciato qui.

## 1. DDL reale di `public.founder_grants`

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'founder_grants'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.founder_grants'::regclass;

select polname, pg_get_expr(polqual, polrelid), pg_get_expr(polwithcheck, polrelid)
from pg_policy
where polrelid = 'public.founder_grants'::regclass;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'founder_grants';
```

Verifica che `create table if not exists` nella migration resti un no-op
(schema compatibile) e che nessuna policy/grant venga duplicata in modo
inatteso dai blocchi idempotenti del file.

## 2. Definizione LIVE di `grant_founder_launch_core` (baseline pre-apply)

```sql
select pg_get_functiondef('private.grant_founder_launch_core(uuid, uuid)'::regprocedure);
```

Salvare il risultato **testuale** da qualche parte prima di applicare — è
il corpo esatto che il rollback di emergenza deve poter ripristinare
verbatim (dovrebbe coincidere con `20260720120247`, già in git).

## 3. Conteggio Founder corrente

```sql
select count(distinct user_id) as founder_launch_roles
from public.user_roles
where role = 'pro' and note = 'founder-launch';
```

## 4. Posti riservati (i famosi 3 non applicati)

```sql
select count(*) as total_grants,
       count(*) filter (where applied_user_id is not null) as applied,
       count(*) filter (where applied_user_id is null) as reserved_pending
from public.founder_grants;
```

Atteso (da confermare, non assunto): ~21 totali, 3 riservati/non
applicati — se il numero reale differisce, il cap 1000 nel report finale
va ricalcolato con il numero VERO, non quello atteso.

## 5. ACL e owner delle funzioni coinvolte

```sql
select p.proname, r.rolname as owner, p.prosecdef as security_definer,
       p.proconfig as search_path_setting
from pg_proc p
join pg_roles r on r.oid = p.proowner
where p.pronamespace = 'private'::regnamespace
   or (p.pronamespace = 'public'::regnamespace and p.proname in
       ('record_first_sync_transition', 'gdpr_process_deletions'));

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_name in ('grant_founder_launch_core', '_next_founder_number',
                        '_anonymize_founder_seat_on_user_delete',
                        'record_first_sync_transition');
```

Atteso: `anon`/`authenticated`/`public` **non** compaiono per
`grant_founder_launch_core`/`_next_founder_number`/
`_anonymize_founder_seat_on_user_delete` — solo `record_first_sync_transition`
deve avere `authenticated` con `EXECUTE`.

## 6. Trigger coinvolti

```sql
select tgname, tgrelid::regclass, tgenabled, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
  and not tgisinternal;
```

Verifiche attese:
- `trg_anonymize_founder_seat_before_user_delete` su `auth.users`: NON
  deve esistere prima dell'apply (la migration lo crea).
- `on_profile_created_founder` su `public.profiles`: NON deve esistere
  (guardia anti-regressione della migration — se esiste, la migration
  fallisce volutamente con un errore esplicito, non silenziosamente).

## 7. Snapshot pre-apply (bundle da salvare)

Eseguire e salvare l'output di §0, §3, §4, §6 (più lo schema `private`
esistente, se presente, con `\d+ private.*` o equivalente) **prima**
dell'apply. Questo è il termine di paragone per il confronto post-apply.

## 8. Applicazione (solo dopo GO esplicito di Matteo)

Un solo file, una sola transazione (comportamento standard Supabase):
`supabase/migrations/20260728090000_founder_launch_cutoff_and_window.sql`.
Il backfill interno stamperà via `raise notice` il conteggio
legacy_allowlist/legacy_autogrant — **leggere quell'output**, deve
coincidere con §3/§4.

## 9. Confronto post-apply

```sql
-- Deve coincidere ESATTAMENTE con §3 (la migration non tocca righe esistenti).
select count(distinct user_id) as founder_launch_roles
from public.user_roles where role = 'pro' and note = 'founder-launch';

-- Deve coincidere col numero di §3 (backfill = 1:1, mai duplicato/perso).
select count(*) as seats_with_user from private.founder_seats where user_id is not null;

-- Deve essere 0 (nessun account gia' esistente valutato invalido dal backfill).
select count(*) from private.founder_evaluations;

-- Ripetere §5 e §6 — stesso esito, nessun nuovo finding.
```

## 10. Security/performance advisors

Da rieseguire con lo stesso protocollo già usato per `20260720055513`
(commit `827e12c`, Sprint P0.7 §6): `get_advisors()` per `security` e
`performance` — verificare che nessuna funzione/tabella di questo file
compaia come nuovo finding (in particolare: "SECURITY DEFINER senza
search_path fisso", "RLS enabled senza policy").

## Rollback di emergenza — NON deve mai cancellare un ledger non vuoto

Se qualcosa va storto dopo l'apply:

1. **Ripristinare il corpo precedente della funzione**, verbatim, da
   `supabase/migrations/20260720120247_founder_launch_exclude_review_email_alias.sql`
   (già in git — nessuna necessità del testo salvato in §2 se il file è
   integro, quello serve solo come controprova indipendente):
   ```sql
   -- corpo esatto di 20260720120247, invariato
   create or replace function private.grant_founder_launch_core(p_user_id uuid, p_device_id uuid)
   returns jsonb ...
   ```
2. **Lasciare `private.founder_seats`/`private.founder_evaluations` intatte
   e dormienti** — la funzione ripristinata non le referenzia più, quindi
   restano semplicemente inutilizzate. Non droppare mai queste tabelle se
   contengono anche una sola riga: significherebbe perdere posti Founder
   già assegnati (fonte di verità del cap) o esiti già decisi.
3. **Droppare tabelle/trigger SOLO se sicuramente vuoti e mai usati**:
   ```sql
   select count(*) from private.founder_seats;        -- deve essere 0
   select count(*) from private.founder_evaluations;  -- deve essere 0
   ```
   Se ed solo se entrambi 0, è sicuro:
   ```sql
   drop trigger if exists trg_anonymize_founder_seat_before_user_delete on auth.users;
   drop function if exists private._anonymize_founder_seat_on_user_delete();
   drop function if exists private._next_founder_number();
   drop table if exists private.founder_evaluations;
   drop table if exists private.founder_seats;
   ```
4. Non toccare mai `public.founder_grants` in un rollback: è l'allowlist
   storica, pre-esistente a questa migration.

**Non esiste una finestra in cui il codice deployato (record_first_sync_transition,
già live, contratto invariato) chiami una funzione inesistente o con un
contratto diverso** — l'estensione in place garantisce questo sia
all'apply che a un eventuale rollback.
