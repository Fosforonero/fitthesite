# Pre-apply checklist — migration 20260728090000 (Sprint P0.10A/B/D)

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
