# Mapping post-apply — Sprint P0.10 (GO APPLY P0.10, 2026-07-29)

Autorizzato da Matteo con la frase esplicita "GO APPLY P0.10". Applicato
il 2026-07-29 tramite Supabase MCP (`apply_migration`, sola scrittura DDL
guidata, nessuna scrittura manuale diretta). Questo documento è la fonte
di verità per la riconciliazione fra i nomi file locali (repo git) e le
versioni realmente registrate da Supabase in
`supabase_migrations.schema_migrations` — vedi anche
`docs/architecture/p010-founder-pre-apply-checklist.md` (stato pre-apply,
storico) e `docs/architecture/entitlement-contract-v1.md`.

## Perché serve un mapping

Lo strumento di apply (`mcp__claude_ai_Supabase__apply_migration`) registra
ogni migration con un timestamp generato AL MOMENTO della chiamata, non con
il timestamp incorporato nel nome del file locale passato come `name`. È lo
stesso pattern già visto e riconciliato in questo sprint per le 6 migration
Sprint 189-RC2 (`docs/architecture/p010-founder-pre-apply-checklist.md`,
sezione storica "§-1"). Senza questa rinomina, `supabase migration list
--linked` avrebbe mostrato le 4 migration locali come "pending" (nomi file
diversi dalle versioni realmente applicate), rischiando un secondo apply
involontario o un `migration repair` non necessario.

## Mapping completo

| # | Timestamp logico (nome file originale, pre-apply) | Timestamp realmente registrato (Supabase, post-apply) | Nome migration | SHA-256 file (invariato dal rename) |
|---|---|---|---|---|
| 1 | `20260728090000` | `20260729161059` | `founder_launch_cutoff_and_window` | `3e79bc3d110fd2ca2d50d3c4d3383c8b5f4297e895129e6fabd84094f5885813` |
| 2 | `20260728100000` | `20260729161132` | `harden_legacy_b2c_trial_acl` | `9a9c0a954702b273996d583c58d3797027b7209f43325ba24d1bcdacb0767522` |
| 3 | `20260728110000` | `20260729161245` | `entitlement_status_contract` | `af78448c477f95eedbd2a028dc5ad0310fdfb6fee449db2fcf645e8a0532948e` |
| 4 | `20260729120000` | `20260729161341` | `founder_reserve_cutoff_gate` | `2a13364a721463acc4efe664bcaa4b3bc42f194da592f8615aaff6246cd4b559` |

I file locali sono stati rinominati con `git mv` puro (nessuna modifica al
contenuto, commenti interni inclusi — anche dove citano ancora i vecchi
timestamp logici, per istruzione esplicita di Matteo: "byte-per-byte uguali
a ciò che è stato applicato"). SHA-256 riverificati identici dopo il
rename.

## Timestamp di apply (UTC)

| Fase | Timestamp |
|---|---|
| Pre-apply dry-run (ultimo, immediatamente prima del GO) | 2026-07-29 16:08:14 UTC |
| Apply #1 (`founder_launch_cutoff_and_window`) | ~2026-07-29 16:10:59 UTC (da versione registrata `20260729161059`) |
| Apply #2 (`harden_legacy_b2c_trial_acl`) | ~2026-07-29 16:11:32 UTC |
| Apply #3 (`entitlement_status_contract`) | ~2026-07-29 16:12:45 UTC |
| Apply #4 (`founder_reserve_cutoff_gate`) | ~2026-07-29 16:13:41 UTC |
| Verifica post-apply completa | 2026-07-29 16:14:02 UTC |

## Hash delle funzioni — pre/post apply

| Funzione | MD5 pre-apply | MD5 post-apply | Nota |
|---|---|---|---|
| `public._apply_founder_grant(uuid,text)` | `5c7649b942f04234c31d3c7961c4c6a0` | `e88190bc8bf56bfab60b979be58fecac` | Riscritta (P0.10E-E). Corpo verificato riga per riga: logica byte-identica al sorgente committato — vedi FASE 3 sotto per la spiegazione della differenza di hash |
| `public.claim_founder_grant_if_eligible()` | `8419db344a7383ba53f01457335a3494` | `bbaaaf1eb6fcf13575ddbfba1543d39b` | Sostituita dal wrapper nuovo (nome pubblico, contratto compatibile col client) |
| `private.claim_founder_grant_if_eligible()` (funzione legacy, spostata) | — (era `public.`, stesso MD5 8419db3...) | `bf937cf6317bbc4151cddf0cebad6428` | **Nessuna modifica di logica**: `ALTER FUNCTION ... SET SCHEMA private`, non un `CREATE OR REPLACE`. L'hash cambia SOLO perché `pg_get_functiondef` include il nome schema-qualificato nell'intestazione (`CREATE OR REPLACE FUNCTION private....` invece di `public....`) — corpo fra `$function$...$function$` verificato bit-identico |
| `public.handle_new_founder()` | `36b7c2fd054b0e27e62c115573c99cfc` | `36b7c2fd054b0e27e62c115573c99cfc` | **Invariata** — solo ACL toccata (nessun `CREATE OR REPLACE` sul corpo) |
| `private.grant_founder_launch_core(uuid,uuid)` | `f62f91f1ac328563c8e0c8048c105985` | `614fe8a0ee6629fd8c53e1c8832f3de8` | Riscritta (migration #1, BLOCCO 1/2/3: cutoff+finestra+cap persistente) |
| `public.grant_b2c_trial()` | (non capturato in FASE 9 — fuori scope, solo ACL toccata) | `fc35b217df74b4dce8809d282fe737eb` | Solo `revoke execute`, corpo invariato |
| `public.get_entitlement_status()` | — (non esisteva) | `9263fbd16b4edf475e7432f2afce911d` | Nuova (migration #3) |

Backup pre-apply completo (corpi letterali + ACL + owner + search_path):
`/Volumes/LOS ANGELES/Matteo/Backups/FitMesh/P0.10/2026-07-29/pre-apply-function-bodies.txt`
(SHA-256 `be3a50685c6640c871c209780d76ae6af3f3c1bfbeadc82ed6f9c90fe7b38b40`,
esterno a questo repo, permessi 600).

## Nota PostgreSQL 15 vs 17 (FASE 3)

Il guard MD5 dentro `20260729161341_founder_reserve_cutoff_gate.sql`
dichiara:

```sql
v_pre_fix_md5 constant text := '5c7649b942f04234c31d3c7961c4c6a0';
v_post_fix_md5 constant text := 'a26fee26363735a3b49b65face96c107';
```

`v_post_fix_md5` era stato calcolato applicando il `CREATE OR REPLACE`
in isolamento su un container Postgres 15.8.1 locale (usato da tutta la
suite di test di questo sprint). Il progetto Supabase reale (`fitmesh`,
`xcdyhkuyxukaifhhtadr`) gira su **Postgres 17.6.1**. L'hash live
osservato dopo l'apply reale è invece `e88190bc8bf56bfab60b979be58fecac`
— **diverso da `v_post_fix_md5`**.

**Causa, verificata testualmente, non presunta**: `pg_get_functiondef()`
deparsa la clausola `SET search_path` in modo diverso fra le due versioni
di Postgres. Il sorgente della migration scrive:

```sql
set search_path = pg_catalog, public
```

Postgres 17 restituisce questa clausola come:

```sql
SET search_path TO 'pg_catalog', 'public'
```

mentre Postgres 15 la restituiva con una formattazione leggermente
diversa (da cui l'hash `a26fee2...` calcolato allora). **Il resto del
corpo — ogni riga di logica, ogni valore, ogni commento — è stato
confrontato manualmente fra il testo live e il sorgente committato: sono
identici.** Non è una corruzione né un bug applicativo, solo un artefatto
di deparsing cross-versione di uno strumento usato per calcolare l'hash
in un ambiente di test diverso da quello di produzione.

**Conseguenza pratica dichiarata, non corretta ora (istruzione esplicita
di Matteo)**: una *futura riesecuzione* di questa migration su QUESTO
stesso database Supabase fallirebbe il guard MD5, perché né
`v_pre_fix_md5` (`5c7649...`, il corpo pre-apply, ormai sostituito) né
`v_post_fix_md5` (`a26fee2...`, calcolato su Postgres 15) corrispondono
all'hash reale post-apply (`e88190bc...`). Questo NON blocca l'uso
normale della funzione (non viene mai rieseguita "normalmente" dopo la
riconciliazione dei timestamp — vedi sotto) — è un limite noto del guard,
da correggere in un giro dedicato futuro se mai servisse rieseguire questo
file (aggiornando `v_post_fix_md5` al valore reale osservato su Postgres
17), non ora: **nessuna modifica al file applicato in questo giro**.

Dopo la riconciliazione dei timestamp (questo documento), la versione
`20260729161341` risulta già presente in
`supabase_migrations.schema_migrations` — un futuro `supabase db push` o
`migration up` non la rieseguirà nel flusso normale, perché la versione
coincide già con quella registrata da remoto.

## Verifica migration list (FASE 4)

Eseguita con accesso Supabase MCP reale (`xcdyhkuyxukaifhhtadr`, progetto
`fitmesh`) il 2026-07-29:

- **Nessuna migration locale pending**: le 4 versioni rinominate
  (`20260729161059`, `20260729161132`, `20260729161245`, `20260729161341`)
  coincidono esattamente con le 4 righe più recenti di
  `supabase_migrations.schema_migrations`.
- **Nessuna migration remota priva di file locale**: verificato per
  confronto diretto version-by-version fino a `20260722145516`
  (`workouts_fuzzy_merge_and_race_lock`, ultima migration pre-P0.10, già
  presente come file locale con lo stesso nome).
- **Le quattro versioni finali coincidono esattamente** fra repo e
  database (tabella sopra).
- **Nessun `migration repair` necessario**: i nomi locali ora coincidono
  bit-per-bit con le versioni registrate da remoto, stesso principio già
  applicato alle 6 migration Sprint 189-RC2.

## Guardrail di identità (FASE 4)

`tools/check-founder-migration-identity.ts` (nuovo, aggiunto in questo
giro): confronta i 4 file migration Founder in `supabase/migrations/`
(per nome) contro la tabella di mapping sopra — verifica che esistano
esattamente con questi 4 timestamp e che il loro SHA-256 corrisponda
esattamente ai valori registrati qui. Fallisce rumorosamente se: un file
manca, un timestamp è stato ri-cambiato, o il contenuto è stato alterato
dopo l'apply — così una futura rinomina o modifica accidentale del
contenuto di questi 4 file (già applicati in produzione) viene rilevata
subito, invece di scoprirla al prossimo apply reale.
