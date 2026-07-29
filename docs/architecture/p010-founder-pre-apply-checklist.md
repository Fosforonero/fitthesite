# Pre-apply checklist — migration 20260729161059 (Sprint P0.10A/B/D/E/E-A/E-B/E-C/E-D/E-E/F)

## ✅ Sprint P0.10F — LE QUATTRO MIGRATION SONO STATE APPLICATE IN PRODUZIONE

Autorizzato da Matteo ("GO APPLY P0.10") e applicato il 2026-07-29. I quattro
file migration sono stati rinominati con `git mv` (contenuto invariato,
SHA-256 identici) per riflettere i timestamp REALMENTE registrati da
Supabase al momento dell'apply (diversi dai timestamp originali nei nomi
file, per via di come lo strumento di apply genera la versione). Mapping
completo, hash pre/post delle funzioni, e nota PG15 vs PG17 in
`docs/architecture/p010-post-apply-migration-mapping.md`. Il resto di
questo documento descrive lo stato PRE-apply (storico) — non più lo stato
attuale del database, mantenuto per il contesto delle decisioni prese.

## ⚠️ I conteggi in questo documento sono un MOMENTO, non un valore fisso

Il programma Founder resta aperto fino al cutoff: ogni conteggio citato qui
(righe `founder_grants`, utenti `user_roles` founder-launch, righe
`b2c_subscriptions`) è vero al momento in cui è stato letto, non un valore
statico da riusare. **Ripetere il dry-run (§12 del preflight) IMMEDIATAMENTE
prima dell'apply reale** e confrontarlo con il `NOTICE` che la migration #1
stampa durante il backfill — non con i numeri scritti in questo file, che
per costruzione sono già vecchi nel momento in cui li leggi.

## Sprint P0.10E-E — CORREZIONE BLOCCANTE: la convenzione P0.10E-D era sbagliata

Matteo ha chiuso direttamente su Supabase produzione il punto rimasto aperto
in P0.10E-D (§17b, secondo giro): ha letto **integralmente** il corpo live
di `_apply_founder_grant` (stesso MD5 gia' verificato,
`5c7649b942f04234c31d3c7961c4c6a0`) e ispezionato le 18 righe reali con
`billing_source='founder_grant'`. Risultato: **la convenzione P0.10E-D era
sbagliata**, non solo incompleta.

**Cosa sappiamo ora, con precisione, e cosa no**: Matteo ha riportato le
proprieta' comportamentali esatte del corpo live (elencate sotto), non
incollato il testo sorgente letterale. Questo repo quindi conosce ora il
contratto comportamentale completo con precisione (a differenza di
P0.10E-D, che lo ricostruiva per analogia da `grant_b2c_trial()`), ma NON
possiede il testo letterale esatto necessario per un rollback
byte-per-byte — resta la **FASE 9** di Matteo (`pg_get_functiondef` salvato
esternamente PRIMA dell'apply reale) l'unico modo di ottenerlo. Qualunque
affermazione precedente in questo documento o nei commenti della migration
che dicesse "il corpo di `_apply_founder_grant` non e' mai stato letto per
intero in questa sessione" è **superata da questa correzione** — vale
ancora, invariata, SOLO per `claim_founder_grant_if_eligible()` (la
funzione legacy) e per `handle_new_founder()`.

**Convenzione live reale delle 18 righe** (verificata da Matteo, non
dedotta per analogia):

| Campo | Valore live reale | Valore P0.10E-D (SBAGLIATO) |
|---|---|---|
| `external_product_id` | `lifetime_founder` | `fitmesh_founder_grant` |
| `external_subscription_id` | `founder_grant_<founder_number>` | `founder-<user_id>` |
| `active_until` | `2099-12-31 23:59:59+00` | `9999-12-31` |
| `auto_renewing` | `false` | `false` (invariato) |
| `raw_payload` | `{founder_number, grant_email, granted_at, source:'rpc_claim'}` | assente del tutto |
| `updated_at` nel ramo di conflitto | aggiornato | non toccato |

Zero delle 18 righe live usano i valori P0.10E-D — non una differenza
cosmetica, un allineamento a una convenzione mai esistita in produzione.
**Istruzione esplicita di Matteo**: conservare esattamente i valori live,
nessuna normalizzazione/migration di allineamento senza un audit separato
dei consumer.

**Protezioni del corpo live che P0.10E-D aveva eliminato senza saperlo**
(bug bloccante, non cosmetico — perche' nessuno aveva ancora letto il corpo
per intero quando P0.10E-D fu scritta):

1. **Rifiuta `p_user_id`/`p_email` null** — P0.10E-D non verificava nulla,
   un null sarebbe passato silenziosamente fino all'INSERT.
2. **Allowlist reale**: cerca la riga in `founder_grants` per email
   (`SELECT ... FOR UPDATE`) e ritorna `false` se assente — **P0.10E-D non
   verificava questo affatto**: qualunque `(user_id, email)` passato alla
   funzione, anche un'email mai vista in `founder_grants`, avrebbe creato
   un entitlement lifetime valido. Dato che la funzione mantiene EXECUTE
   per `service_role` (non solo per il wrapper pubblico), questo non era
   un problema teorico — qualunque chiamata interna diretta via
   `service_role` avrebbe potuto concedere Founder a chiunque, scavalcando
   l'intero ledger delle 3 riserve. **Questo e' il bug piu' grave trovato
   in questo giro**, piu' grave della convenzione di valori sbagliata.
3. Usa `founder_number` (non un valore derivato da `user_id`) per
   `external_subscription_id`, e i campi reali della riga per
   `raw_payload`.
4. Scrive un `raw_payload` completo con `source='rpc_claim'` — tracciabilita'
   dell'origine, assente del tutto in P0.10E-D.
5. Aggiorna `updated_at` nel ramo di conflitto — assente in P0.10E-D.

**Il bug ORIGINALE che questa migration continua a correggere, invariato da
P0.10E-D**: l'upsert su `b2c_subscriptions` e' un `ON CONFLICT (user_id) DO
UPDATE` **incondizionato**, senza whitelist su `billing_source` — una riga
`google_play`/`apple_iap`/`stripe` gia' esistente verrebbe sovrascritta da
un `founder_grant`. Restano quindi **due correzioni cumulative**, non
alternative: (a) ripristinare tutte le protezioni/convenzioni reali sopra,
perse da P0.10E-D; (b) mantenere la barriera whitelist (il corpo live non
l'ha mai avuta).

**Correzioni tecniche aggiuntive richieste da Matteo e implementate**:

- `SELECT ... FOR UPDATE` su `founder_grants`, **prima** dell'INSERT su
  `b2c_subscriptions` (non dopo) — la riga viene bloccata per l'intera
  transazione. Conseguenza: due chiamate concorrenti per la STESSA email si
  serializzano completamente; l'UPDATE finale su `founder_grants` (stessa
  chiave, stesso lock, stessa transazione) non puo' strutturalmente
  modificare zero righe. Un `GET DIAGNOSTICS` + `RAISE EXCEPTION` difensivo
  resta comunque nel codice se mai accadesse (istruzione esplicita:
  "impossibile O trattato come errore atomico" — soddisfatta da entrambi).
- `GET STACKED DIAGNOSTICS` + `CONSTRAINT_NAME` sostituisce il blanket
  `WHEN unique_violation` di P0.10E-D — istruzione esplicita: "non
  catturare indiscriminatamente ogni `unique_violation`". Solo
  `b2c_subscriptions_pkey` e
  `b2c_subscriptions_billing_source_external_subscription_id_key` vengono
  trattati come "riga gia' esistente, applica il fallback whitelist";
  qualunque altro vincolo fa `RAISE` (ripropaga), mai assorbito. Testato
  con un vincolo sintetico dedicato (Caso 40 — vedi sotto).
- Barriera whitelist invariata da P0.10E-D: solo `billing_source in
  ('founder_grant', 'trial')` sovrascrivibile — whitelist, non blacklist,
  un valore futuro sconosciuto resta protetto per default.

**Incoerenza preesistente documentata, NON corretta qui (istruzione
esplicita di Matteo)**: `is_b2c_lifetime()` (`20260514120004_init_b2c_subs.sql`)
considera lifetime solo `active_until > '9000-01-01'`, ma le 18 righe
Founder live scadono nel 2099 (< 9000) — **`is_b2c_lifetime()` ritorna
`FALSE` per un vero Founder grant**, sia per le 18 righe esistenti sia per
ogni nuova riga scritta da questa stessa funzione (che usa deliberatamente
`2099-12-31`, non `9999-12-31`, per restare identica alla convenzione
live). Non e' una svista di questa migration — e' un difetto piu' ampio di
`is_b2c_lifetime()` stessa, che richiede un audit di **tutti** i suoi
consumer prima di essere toccata (potrebbe gia' essere compensato altrove,
o essere un bug attivo che affligge gia' le 18 righe live oggi). **Da
programmare come sprint dedicato separato** — non risolto ne' mascherato
qui, e non va usato come motivo per cambiare solo le nuove righe a
`9999-12-31` (violerebbe "conserva esattamente i valori live").

**39 casi funzionali (era 32) + riesecuzione + 4 test di concorrenza reale
— tutti verdi, ripetuti 3 volte consecutive**. Nuovi in questo giro: Caso
37 (parametri null → `false` esplicito, zero scritture), Caso 38 (email non
presente in `founder_grants`, chiamata diretta via `service_role` → `false`,
zero scritture — la protezione che P0.10E-D aveva perso), Caso 39
(`unique_violation` su un vincolo sintetico sconosciuto, simulato con un
trigger di test dedicato → rilanciato, mai assorbito). Rafforzati: Caso 24
(struttura byte-per-byte contro la convenzione live, incluso `raw_payload`
completo), Caso 25 (promozione da trial con la convenzione live esatta
anche nel ramo UPDATE), Caso 26 (idempotenza reale su due transazioni
separate, verifica che `updated_at` avanzi — non testabile nella stessa
transazione, dato che `now()` resta congelato per l'intera durata di una
transazione). Le altre due suite del branch (`founder_p010a`,
`entitlement_p010e`) ri-eseguite invariate: nessuna regressione.

**Nuovo hash del corpo (post-fix, sostituisce quello di P0.10E-D)**:
`a26fee26363735a3b49b65face96c107` (v_pre_fix_md5 invariato:
`5c7649b942f04234c31d3c7961c4c6a0` — il corpo live non e' mai cambiato in
questo sprint, solo la nostra conoscenza di esso e' migliorata). Nuovo
SHA-256 del file migration: vedi blocco sotto.

**Nessun apply/merge/deploy avvenuto.** Il dry-run live finale (§12 del
preflight) va ripetuto da Matteo solo DOPO questa correzione e
immediatamente prima di un eventuale `GO APPLY P0.10`.

## Sprint P0.10E-D — barriera atomica reale in `_apply_founder_grant`, due bug critici trovati e corretti

**QUESTA SEZIONE E' STORICA — LA CONVENZIONE DESCRITTA QUI SOTTO E' STATA
SOSTITUITA IN P0.10E-E (vedi sopra).** Conservata solo per contesto: mostra
come si e' arrivati alla barriera atomica (guard MD5, whitelist,
GET DIAGNOSTICS) — quel meccanismo resta valido, solo i VALORI scritti
dentro (`external_product_id`/`external_subscription_id`/`active_until`/
`raw_payload`) sono cambiati.

Questo sprint consolida e sostituisce P0.10E-A/B/C in un'unica migration #4
(FASE 1-6 della richiesta di Matteo). La novità principale: per la prima
volta in questo sprint, la migration **riscrive** (non solo sposta/richiude
ACL) `_apply_founder_grant(uuid, text)` — funzione mai letta per intero in
questa sessione — aggiungendo una barriera atomica whitelist dentro la
stessa transazione dell'upsert, così la race residua dichiarata in
P0.10E-C (un INSERT commerciale che arriva su una riga ancora inesistente
al momento del precheck) è ora chiusa in **entrambe** le direzioni.

**Precondizioni §17a/§17c ora PASS** (confermate da Matteo il 2026-07-29):

| Verifica | Esito |
|---|---|
| Owner di tutte e quattro le funzioni Founder | `postgres` — §17a PASS |
| `postgres` ha EXECUTE/SELECT/INSERT/UPDATE/DELETE su `b2c_subscriptions` | Confermato — §17c PASS |

**DUE BUG CRITICI trovati in review avversariale su Postgres reale, PRIMA
della consegna — nessuno dei due era visibile dalla sola lettura:**

1. **La DDL reale di `b2c_subscriptions` era già TRACCIATA in questo
   stesso repo** (`supabase/migrations/20260514120004_init_b2c_subs.sql`)
   e non è mai stata cercata prima d'ora in questo sprint — un errore di
   processo, non solo di codice. Ha 4 colonne NOT NULL senza default
   (`external_product_id`, `external_subscription_id`, `active_until`,
   più `auto_renewing` con un default sbagliato per un grant permanente)
   che la prima bozza della barriera atomica non popolava affatto:
   l'INSERT sarebbe fallito con `null value ... violates not-null
   constraint` su **ogni** claim Founder reale, non un edge case. Corretto
   usando gli STESSI valori/convenzione già stabiliti e tracciati per
   `grant_b2c_trial()` (`20260514120006_sprint0_fixes.sql`): sentinel
   lifetime `active_until = '9999-12-31'` (già documentato nel commento di
   testa della tabella e usato da `is_b2c_lifetime()`), `auto_renewing =
   false`, identificatori sintetici `fitmesh_founder_grant`/`founder-<user_id>`
   sullo stesso modello di `fitmesh_b2c_trial_7d`/`trial-<user_id>`.
2. **Trovato dal test di concorrenza stesso (Caso 36), non da un'ispezione
   statica**: `ON CONFLICT (user_id) DO UPDATE` risolve conflitti SOLO
   sull'indice nominato. La tabella reale ha un SECONDO vincolo univoco
   indipendente, `UNIQUE(billing_source, external_subscription_id)`.
   Poiché `external_subscription_id` qui è derivato deterministicamente da
   `user_id`, quel vincolo è logicamente ridondante per questa funzione —
   ma Postgres non lo sa, e sotto concorrenza reale (due chiamate per lo
   stesso user_id nuovo) la seconda chiamata falliva con "duplicate key
   value violates unique constraint
   b2c_subscriptions_billing_source_external_subscription_id_key" invece
   di essere assorbita dalla ON CONFLICT. Corretto sostituendo l'upsert con
   un blocco `BEGIN/EXCEPTION WHEN unique_violation` che, su qualunque dei
   due indici, esegue un fallback UPDATE esplicito filtrato per `user_id`
   con la STESSA whitelist (`billing_source in ('founder_grant','trial')`)
   — stessa semantica finale di prima, ma sopravvive anche quando la riga
   vincitrice non esiste ancora al momento del tentativo di INSERT.

Entrambi i bug sono stati trovati EMPIRICAMENTE (applicando il corpo esatto
contro la DDL reale tracciata, e da un test di concorrenza reale che ha
fallito), non dalla sola lettura del codice — coerente con il pattern
già visto nei round precedenti di questo sprint (ogni bug critico finora
è stato trovato da esecuzione reale, mai da revisione statica da sola).

**Guard MD5 esteso**: dato che questa migration ora RISCRIVE
`_apply_founder_grant` (non solo la sposta), un guard in cima al file
verifica che il corpo LIVE corrisponda esattamente (via MD5) al corpo che
Matteo ha verificato manualmente, PRIMA di qualunque altra modifica nel
file (inclusa la sezione che sposta `claim_founder_grant_if_eligible`) —
se non corrisponde, l'intera migration abortisce senza aver toccato nulla.
Il guard accetta anche l'hash del proprio corpo NUOVO (calcolato
empiricamente), così una riesecuzione della migration su un DB già
corretto è un no-op sicuro, non un falso allarme.

**36 casi funzionali + riesecuzione + 4 test di concorrenza reale
(precheck FOR UPDATE, 3× barriera atomica vs commerciale, 1× race
Founder-vince) — tutti verdi**, ri-eseguiti 3 volte consecutive per
escludere flakiness. Le altre due suite del branch (`founder_p010a`,
`entitlement_p010e`) invariate, nessuna regressione.

## Sprint P0.10E-C — BLOCCO 3 risolto nel wrapper, conteggi aggiornati (2026-07-29)

Ownership confermata da Matteo via lettura diretta su produzione
(2026-07-29) — risolve la precondizione aperta da §17a:

| Funzione | Owner |
|---|---|
| `public.claim_founder_grant_if_eligible()` | postgres |
| `public._apply_founder_grant(uuid, text)` | postgres |
| `public.handle_new_founder()` | postgres |
| `private.grant_founder_launch_core(uuid, uuid)` | postgres |

Il ruolo usato dal connettore di migration è `postgres` e può eseguire
`ALTER FUNCTION ... SET SCHEMA` — **§17a è quindi PASS**. Resta aperta una
NUOVA precondizione (§17c, trovata in review avversariale sul no-clobber
P0.10E-C): `postgres` deve avere anche il privilegio **UPDATE** (non solo
SELECT) su `public.b2c_subscriptions`, richiesto da `SELECT ... FOR UPDATE`
nel wrapper — non ancora verificato.

Conteggi reali (Matteo, 2026-07-29 — **non hardcodare, vedi avviso sopra**):

| Voce | Valore (2026-07-29) |
|---|---|
| `founder_grants` totali | 21 |
| `founder_grants` applicati | 18 |
| `founder_grants` riservati | 3 |
| `user_roles` founder-launch (utenti distinti) | 364 |
| overlap fra applied `founder_grants` e founder-launch | 4 |
| popolazione distinta attesa dal backfill (18+364-4) | 378 |
| `b2c_subscriptions` totali | 18 |
| `b2c_subscriptions` billing_source=founder_grant | 18 |
| `b2c_subscriptions` billing_source=google_play/apple_iap/stripe | 0 |
| `b2c_subscriptions` billing_source=trial | 0 |

Il numero "358 righe in founder_grants" citato altrove **non compare in
nessun file di questo repo** (verificato via grep su tutta la cartella
`docs/architecture` e sulle migration) — non riportarlo in nessun report
come se fosse un valore di questa sessione.

L'assenza odierna di righe commerciali (`google_play`/`apple_iap`/`stripe`:
0) significa che non esiste corruzione già avvenuta — **non** significa che
la vulnerabilità potesse essere rinviata dopo il 1° agosto: il wrapper
riserve resta chiamabile durante la finestra individuale di 14gg mentre il
funnel a pagamento si apre, quindi acquisti commerciali reali possono
comparire da un momento all'altro. Per questo, su richiesta esplicita di
Matteo, il no-clobber è stato integrato **direttamente nel wrapper #4**
(non in una migration #5 separata, dato che #4 non era ancora applicata) —
vedi "### BLOCCO 3 — RISOLTO nel wrapper" sotto.

Ordine di apply (invariato, 4 migration separate):

| # | File | Cosa fa | Autorizzazione |
|---|---|---|---|
| 1 | `20260729161059_founder_launch_cutoff_and_window.sql` (rinominata da `20260728090000`) | Sunset Founder: cutoff + finestra + ledger persistente + backfill — **APPLICATA**, backfill reale 380 (18 legacy_allowlist + 362 legacy_autogrant) | ✅ APPLICATA 2026-07-29 |
| 2 | `20260729161132_harden_legacy_b2c_trial_acl.sql` (rinominata da `20260728100000`) | Revoca EXECUTE su `grant_b2c_trial()` da public/anon/authenticated | ✅ APPLICATA 2026-07-29 |
| 3 | `20260729161245_entitlement_status_contract.sql` (rinominata da `20260728110000`) | Nuova RPC `get_entitlement_status()` server-authoritative | ✅ APPLICATA 2026-07-29 |
| 4 | `20260729161341_founder_reserve_cutoff_gate.sql` (rinominata da `20260729120000`, RISCRITTA Sprint P0.10E-E) | Sposta `claim_founder_grant_if_eligible()` in `private`, ricrea il nome pubblico originale come wrapper cutoff+finestra+no-clobber+ri-verifica FASE 5, **riscrive** `_apply_founder_grant()` con la convenzione live ESATTA (P0.10E-E) + allowlist/null-check ripristinati + barriera atomica whitelist + GET STACKED DIAGNOSTICS/CONSTRAINT_NAME, hardening `handle_new_founder()` | ✅ APPLICATA 2026-07-29, guard MD5 superato pulito |

Dettaglio completo apply (conteggi pre/post, ACL, advisor, hash) in
`docs/architecture/p010-post-apply-migration-mapping.md`.

La #1 è l'unica che scrive dati (backfill). La #2/#4 toccano ACL + funzioni
(la #4 ora scrive anche dati reali in `b2c_subscriptions`/`founder_grants`
quando un claim reale va a buon fine — non più solo ACL/logica). La #3
crea una funzione nuova senza toccare nulla di esistente. #1/#2/#3 non
dipendono l'una dall'altra a livello SQL. Tenute separate proprio per
poterle autorizzare una alla volta (istruzione esplicita di Matteo: non
mescolare l'hardening alla migration Founder).

SHA-256 (invariati dalla consegna pre-apply — Sprint P0.10F ha rinominato
solo i FILE con `git mv`, zero modifiche al contenuto, hash riverificati
identici dopo la rinomina):
```
3e79bc3d110fd2ca2d50d3c4d3383c8b5f4297e895129e6fabd84094f5885813  20260729161059_founder_launch_cutoff_and_window.sql
9a9c0a954702b273996d583c58d3797027b7209f43325ba24d1bcdacb0767522  20260729161132_harden_legacy_b2c_trial_acl.sql
af78448c477f95eedbd2a028dc5ad0310fdfb6fee449db2fcf645e8a0532948e  20260729161245_entitlement_status_contract.sql
2a13364a721463acc4efe664bcaa4b3bc42f194da592f8615aaff6246cd4b559  20260729161341_founder_reserve_cutoff_gate.sql
```

MD5 delle funzioni riscritte dentro la #4 (per la guardia in cima al
file, non SHA-256 dell'intero file). v_pre_fix_md5 e' INVARIATO da
P0.10E-D — il corpo live in produzione non e' mai cambiato in questo
sprint, solo la sua ricostruzione in questo repo e' stata corretta.
v_post_fix_md5 e' cambiato (nuovo corpo, convenzione live esatta):
```
5c7649b942f04234c31d3c7961c4c6a0  _apply_founder_grant PRE-fix (verificato manualmente da Matteo, live) — INVARIATO
a26fee26363735a3b49b65face96c107  _apply_founder_grant POST-fix P0.10E-E (calcolato empiricamente su questo corpo esatto, accettato per riesecuzione sicura) — sostituisce 90031930f2d7f52abfe1d0583df58b6d di P0.10E-D
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
`supabase/migrations/20260729161341_founder_reserve_cutoff_gate.sql`
(rinominata da `20260729120000` in Sprint P0.10F) per il commento completo.
In sintesi, l'approccio ora è:

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

DOPO (se la #4 corretta viene applicata, Sprint P0.10E-E):
  public.claim_founder_grant_if_eligible()  [EXECUTE: authenticated soltanto — WRAPPER NUOVO]
    ├─ program_closed / window_expired → mai raggiunge quanto sotto
    ├─ precheck no-clobber (FOR UPDATE) → existing_commercial_entitlement senza mai delegare
    └─ pre-cutoff, in finestra, nessun commerciale visto dal precheck → delega a:
       private.claim_founder_grant_if_eligible()  [EXECUTE: nessuno tranne owner — FUNZIONE LEGACY SPOSTATA, corpo invariato]
         └─ chiama internamente → public._apply_founder_grant(uuid, text)  [EXECUTE: postgres, service_role — ACL invariata, CORPO RISCRITTO P0.10E-E]
              ├─ null-check + allowlist reale (SELECT ... FOR UPDATE su founder_grants) → false se email assente
              ├─ barriera whitelist (INSERT + fallback UPDATE, selettivo via GET STACKED DIAGNOSTICS/CONSTRAINT_NAME): commerciale protetto → false, vincolo sconosciuto → RAISE
              └─ founder_grant/trial → scrive con la convenzione live esatta (lifetime_founder/founder_grant_<n>/2099-12-31/raw_payload), marca founder_grants, → true
    └─ FASE 5: se la delega non e' risultata eligible:true, ri-verifica b2c_subscriptions —
       se ora commerciale (race chiusa dalla barriera atomica ma non visibile al precheck), corregge a existing_commercial_entitlement
  public.handle_new_founder()  [EXECUTE: postgres, service_role soltanto — nessun trigger attivo, non eliminata]
```

### ACL attesa dopo l'apply — matrice completa

| Funzione | PUBLIC | anon | authenticated | service_role | postgres/owner |
|---|---|---|---|---|---|
| `public.claim_founder_grant_if_eligible()` (wrapper) | NO | NO | **SÌ** | NO (non concesso esplicitamente — solo owner) | SÌ (implicito) |
| `private.claim_founder_grant_if_eligible()` (legacy spostata) | NO | NO | NO | NO | SÌ (implicito) |
| `public._apply_founder_grant(uuid, text)` | NO | NO | NO | SÌ | SÌ (implicito) |
| `public.handle_new_founder()` | NO | NO | NO | SÌ (non toccato, nessuna evidenza per revocarlo) | SÌ (implicito) |

Nuova dipendenza P0.10E-C: il wrapper legge (e blocca in scrittura via `FOR
UPDATE`) `public.b2c_subscriptions` per `user_id`. Nessun grant nuovo
necessario per `authenticated` (SECURITY DEFINER, eredita i privilegi del
proprietario) — ma vedi §17c: il proprietario deve avere EXECUTE **e
UPDATE** sulla tabella, non solo SELECT, altrimenti la chiamata fallisce
esplicitamente per ogni account pre-cutoff/in-finestra.

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
tutti verdi** dopo le correzioni P0.10E-B, su Postgres reale. Estesi in
P0.10E-C con i Casi 16-22 (no-clobber) + Caso 23 (concorrenza claim vs
scrittura commerciale) — **22 casi funzionali + riesecuzione + 2 test di
concorrenza, tutti verdi** (`supabase/tests/founder_reserve_gate/`). Le
altre due suite del branch (`founder_p010a`, `entitlement_p010e`)
ri-eseguite invariate ad ogni giro: nessuna regressione.

### BLOCCO 3 — RISOLTO nel wrapper (Sprint P0.10E-C)

`_apply_founder_grant(uuid, text)` usa `ON CONFLICT (user_id) DO UPDATE`
(confermato da Matteo via lettura diretta il 2026-07-29) e può sovrascrivere
una riga `b2c_subscriptions` già presente per lo stesso `user_id` — cioè un
utente con una delle 3 email riservate che ha GIÀ una sottoscrizione
commerciale attiva (Google Play, Apple IAP o Stripe) al momento del claim
rischiava di vedersela sostituita da un `founder_grant`.

**Decisione di Matteo**: dato che il wrapper #4 non era ancora applicato, la
protezione va integrata lì direttamente invece che in una migration #5
separata — il rischio va chiuso PRIMA che il funnel a pagamento del 1°
agosto si sovrapponga alla finestra individuale di 14gg delle riserve, non
dopo (l'assenza odierna di righe commerciali non è una prova che si possa
rimandare — vedi tabella conteggi sopra).

**Implementazione** — nel wrapper, PRIMA di delegare alla funzione legacy:
```sql
select billing_source into v_billing_source
from public.b2c_subscriptions
where user_id = v_user_id
for update;

if v_billing_source in ('google_play', 'apple_iap', 'stripe') then
  return jsonb_build_object('eligible', false, 'reason', 'existing_commercial_entitlement');
end if;
```
Blocca su `billing_source` commerciale **indipendentemente da `state`**
(anche una sottoscrizione scaduta protegge — decisione esplicita: l'utente
mantiene il collegamento storico con lo store, gestione manuale della
riserva). `trial` e `founder_grant` NON bloccano (il primo è un entitlement
inferiore che Founder può sostituire, il secondo è già Founder). Nessuna
riga → flusso legacy normale.

**Deliberatamente NON usato** `ON CONFLICT (user_id) DO UPDATE ... WHERE
billing_source = 'founder_grant'` come unica protezione (istruzione
esplicita di Matteo): un conflict non aggiornato dentro il corpo legacy mai
letto per intero potrebbe comunque marcare `founder_grants` come applicato
e restituire `true`, producendo uno stato falso. Il blocco è quindi PRIMA
della delega — `_apply_founder_grant` non viene mai raggiunta in questi
casi, non importa cosa faccia il suo corpo interno.

**`FOR UPDATE`**: chiude la metà della race in cui una sottoscrizione
commerciale ESISTE già ed è in corso di aggiornamento (es. un webhook che
sta scrivendo) — il wrapper attende il commit e legge il valore fresco, non
uno stale. **NON chiude** l'altra metà (un INSERT commerciale su una riga
ancora inesistente nello stesso istante del claim): richiederebbe che il
percorso di scrittura del pagamento (mai letto in questa sessione) prenda
lo stesso lock — fuori scope per una migration SQL isolata. Dichiarato
esplicitamente, non nascosto.

**Test**: Casi 16/17/18 (Google Play/Apple IAP/Stripe attivi → blocco,
probe legacy piatto), Caso 19 (commerciale scaduto → blocca comunque),
Caso 20 (trial → non blocca, Founder sostituisce), Caso 21 (founder_grant →
non blocca), Caso 22 (nessuna riga → flusso normale), Caso 23 (concorrenza
claim vs UPDATE commerciale in corso, sincronizzazione deterministica via
marker file — non un `sleep` indovinato — dimostra che il `FOR UPDATE`
blocca realmente e legge il valore post-commit). Tutti verdi su Postgres
reale.

**Review avversariale dedicata su questa aggiunta** ha trovato:
1. **PLAUSIBILE, non confermato — precondizione nuova**: `FOR UPDATE`
   richiede il privilegio UPDATE (non solo SELECT) su `b2c_subscriptions`
   per il proprietario della funzione (`postgres`). Se `postgres` avesse
   solo SELECT su questa tabella, ogni chiamata che supera cutoff+finestra
   fallirebbe con un errore esplicito — fail loud, non un bypass di
   sicurezza, ma un'interruzione per QUALUNQUE account pre-cutoff/
   in-finestra, non solo le 3 riserve. **Aggiunta §17c al preflight** per
   verificarlo prima dell'apply — vedi sezione ownership sopra.
2. **CONFERMATO, corretto prima della consegna**: il test di concorrenza
   (Caso 23) usava un `sleep 1.5` fisso per sincronizzare le due sessioni,
   fragile sotto jitter (riprodotto: un ritardo di avvio di 2.5s rompeva il
   test senza errore visibile). Sostituito con un segnale deterministico
   (marker file scritto dal meta-comando client-side `\!` di psql subito
   dopo che la UPDATE ha preso il lock, polling invece di un timeout
   indovinato).
3. **Nitpick di rigore, nessun gap di copertura reale**: i Casi 20/21/22 in
   isolamento passerebbero anche se il blocco no-clobber fosse rimosso
   interamente — ma la suite COMPLETA con `ON_ERROR_STOP=1` si ferma
   comunque al Caso 16 in quello scenario (verificato per mutazione),
   quindi non c'è un buco di copertura reale, solo un limite di rigore dei
   singoli casi presi da soli.

**Superficie del rischio residuo (fino a P0.10E-C)**: narrow — solo le 3
email riservate, solo se una di esse ha già una riga commerciale al
momento del claim (protetto) o riceve un INSERT commerciale nello stesso
istante del claim (**non protetto in P0.10E-C** — race residua dichiarata,
chiusa sotto in P0.10E-D).

### BLOCCO 3 — race residua CHIUSA in entrambe le direzioni (Sprint P0.10E-D)

FASE 4/5 (istruzione esplicita di Matteo, non una migration #5 separata):
la barriera atomica whitelist dentro `_apply_founder_grant` stessa (vedi
sopra) chiude la metà che P0.10E-C aveva dichiarato non protetta — un
INSERT commerciale che arriva DOPO il precheck del wrapper ma PRIMA/
DURANTE il tentativo di scrittura di `_apply_founder_grant`. La barriera è
nella stessa istruzione INSERT/UPDATE, non in un secondo controllo
separato: non c'è finestra temporale fra "verifica" e "scrittura" perché
sono la stessa operazione atomica.

Rimane un solo dettaglio, non un gap: il **wrapper** (che ha già superato
il proprio precheck prima di delegare) non sa a priori quale `reason` la
funzione legacy (mai riletta) assegni internamente quando
`_apply_founder_grant` ritorna `false` per un conflitto commerciale
scoperto tardi. La ri-verifica FASE 5 (il wrapper rilegge
`b2c_subscriptions` dopo un esito non-eligible e corregge la risposta a
`existing_commercial_entitlement` se ora trova una fonte commerciale)
garantisce che il CLIENT veda sempre la risposta semanticamente corretta,
indipendentemente da quel dettaglio interno mai verificato.

**Non risulta più alcuna finestra nota e non protetta** per la
sovrascrittura di una sottoscrizione commerciale tramite questa RPC — testata
con tutti e 3 i billing_source commerciali in concorrenza reale (Casi
33/34/35, sincronizzazione deterministica via marker file, non sleep
indovinati) più una race Founder-vince (Caso 36, due chiamate concorrenti
per un utente nuovo, nessun duplicato/corruzione).

**Due bug critici trovati SOLO applicando il codice contro Postgres reale**
(mai dalla sola lettura — vedi il riepilogo in cima al documento):
colonne NOT NULL mancanti nell'INSERT (avrebbe fallito su ogni claim
reale) e un secondo indice univoco non coperto dall'ON CONFLICT (avrebbe
fallito sotto concorrenza reale, esattamente lo scenario che questa
migration doveva proteggere). Entrambi corretti, ri-testati 3 volte
consecutive per escludere flakiness residua.

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
- **#4 (gate riserve, aggiornato per la versione P0.10E-E)** — **cambiato
  in modo sostanziale rispetto a P0.10E-B/C**: da P0.10E-D in poi la #4
  RISCRIVE `_apply_founder_grant`, non solo la sposta/richiude ad ACL. Un
  rollback fedele richiede il testo letterale ESATTO pre-apply — questo
  repo conosce ora (P0.10E-E) le proprietà comportamentali esatte del corpo
  live (Matteo lo ha letto integralmente), ma NON possiede il testo
  sorgente letterale (mai incollato in questo repo, solo descritto) — **da
  qui la FASE 9 di Matteo: "prima dell'apply salva corpo completo e hash di
  _apply_founder_grant"** è un prerequisito assoluto del rollback, non solo
  un nice-to-have. Prima di applicare, eseguire ed salvare ESTERNAMENTE
  (non in questo repo) l'output di:
  ```sql
  select pg_get_functiondef('public._apply_founder_grant(uuid, text)'::regprocedure);
  ```
  (deve corrispondere all'MD5 `5c7649b942f04234c31d3c7961c4c6a0` già
  confermato — se non corrisponde, il guard della migration stessa
  abortisce comunque prima di qualunque modifica, vedi sopra).
  ```sql
  -- Ordine obbligatorio: il wrapper occupa il nome pubblico, va rimosso
  -- PRIMA di poter rispostare la funzione legacy da private a public
  -- (stessa collisione di nome/arieta' della migration in avanti).
  drop function if exists public.claim_founder_grant_if_eligible();
  alter function private.claim_founder_grant_if_eligible() set schema public;
  grant execute on function public.claim_founder_grant_if_eligible() to public, anon, authenticated, service_role;
  grant execute on function public.handle_new_founder() to public, anon, authenticated, service_role;
  -- _apply_founder_grant: ripristinare il corpo ESATTO salvato PRIMA
  -- dell'apply (vedi sopra) con un CREATE OR REPLACE letterale — NON
  -- lasciare la versione P0.10E-E in produzione con l'ACL riaperta, e NON
  -- inventare un corpo "equivalente": usare esattamente il testo salvato.
  -- L'ACL NON va riaperta a PUBLIC/anon/authenticated (era gia' chiusa a
  -- questi ruoli PRIMA di questa migration, confermato da Matteo il
  -- 2026-07-29 — riaprirla introdurrebbe una regressione di sicurezza che
  -- non esisteva nemmeno nello stato live pre-migration).
  ```
  **Attenzione ai DATI**: a differenza delle versioni precedenti di questo
  file, la #4 (da P0.10E-D in poi) ORA SCRIVE dati reali quando un claim va
  a buon fine (righe in `b2c_subscriptions` con
  `billing_source='founder_grant'` e marcature in
  `founder_grants.applied_user_id`/`applied_at`). Un rollback del CODICE
  non annulla claim già concessi con successo prima del rollback — non
  cancellare mai queste righe: sono founder grant reali e legittimi,
  esattamente come quelli gia' esistenti prima di questa migration.
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

**Aggiornamento Sprint P0.10F**: `20260728090000` (la migration Founder che
all'epoca era la successiva `pending`) è stata nel frattempo applicata e
poi rinominata in `20260729161059` — vedi il mapping completo in
`docs/architecture/p010-post-apply-migration-mapping.md`. `supabase
migration list --linked` è stato rieseguito con accesso reale: nessuna
migration locale pending, nessuna migration remota priva di file locale,
nessun `migration repair` necessario.

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
`supabase/migrations/20260729161059_founder_launch_cutoff_and_window.sql`
(rinominata da `20260728090000` in Sprint P0.10F, dopo l'apply reale del
2026-07-29 — vedi `docs/architecture/p010-post-apply-migration-mapping.md`).
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
