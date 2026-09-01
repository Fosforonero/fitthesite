# Le 18 `local_only` — classificazione

25/08/2026. Regola applicata: **nessuna migration viene archiviata soltanto
perche' non risulta applicata.** Per ognuna: oggetti dichiarati, stato live
verificato nel catalogo di produzione, vera migration creatrice, decisione
motivata.

## Il risultato che ribalta l'ipotesi di partenza

Il manifesto del 25/08 proponeva per tutte e diciotto: «mai applicata:
archiviare fuori da migrations/». **Sbagliato per quattordici su diciotto.**

La catena remota di 89 migration **non e' una costruzione completa**.
Verificato interrogando il contenuto di tutte le `statements` remote:
nessuna migration remota crea `public.fitness_metrics`, `public.profiles`,
`public.devices`, `public.b2c_subscriptions`, `public.privacy_consents`,
`public.caregiver_links`, ne' le policy `users select own metrics` e
`caregiver select subjects metrics`.

Il tracciamento in `supabase_migrations` e' iniziato su un database che
**aveva gia' lo schema di base**. Le migration fondative esistono solo in
locale. Archiviarle non avrebbe reso la ricostruzione incompleta: l'avrebbe
resa **impossibile**, perche' ogni migration remota successiva fa ALTER su
tabelle che non esisterebbero.

## Restano eseguibili — unica fonte di oggetti vivi (14)

Per ognuna: tutti gli oggetti dichiarati esistono in produzione, e nessuna
migration remota li crea.

| migration | oggetti dichiarati | live | vera creatrice |
|---|---|---|---|
| `20260513120001_init_profiles_roles` | `profiles`, `user_roles`, `has_role`, `is_admin`, `is_caregiver`, `handle_new_user`, `set_updated_at` | 7/7 | **questa** |
| `20260513120002_init_devices_pairing` | `devices`, `device_pairing_codes`, `increment_pairing_attempts` | 3/3 | **questa** |
| `20260513120003_init_fitness_metrics` | `fitness_metrics`, `workouts` | 2/2 | **questa** |
| `20260513120004_init_events_audit` | `admin_events`, `audit_logs`, `sync_events` | 3/3 | **questa** |
| `20260513120005_init_consents_settings` | `caregiver_links`, `privacy_consents`, `user_settings`, `anonymize_user_audit_on_delete`, policy `caregiver select subjects metrics` | 4/4 + policy | **questa** |
| `20260513120006_admin_aggregates` | `admin_overview`, `admin_daily_aggregate`, `admin_top_errors`, `admin_device_brand_distribution` | 4/4 | **questa** |
| `20260513120007_pg_cron_jobs` | estensione `pg_cron` + 4 job | tutti vivi | **questa** |
| `20260514120001_init_gym_core` | `gyms`, `gym_memberships`, `gym_tiers`, `gym_subscriptions`, `gym_email_invites`, `active_gym_id`, `has_premium_access`, `is_gym_owner` | 8/8 | **questa** |
| `20260514120002_init_challenges` | 4 tabelle challenge + vista `challenge_leaderboard_v` | 4/4 tabelle, **vista NO** | **questa** |
| `20260514120003_init_anti_cheat` | `disqualifications`, `metric_caps` | 2/2 | **questa** |
| `20260514120004_init_b2c_subs` | `b2c_subscriptions`, `is_b2c_lifetime` | 2/2 | **questa**, ma **da riparare** |
| `20260514120005_gym_gateway_functions` | 7 funzioni gateway | 7/7 | **questa** |
| `20260514120006_sprint0_fixes` | 6 funzioni ridefinite + `challenge_leaderboard` | 6/6 | **questa** |
| `20260520120001_schedule_fcm_sync_trigger_cron` | `pg_net` + cron `sync-trigger-fcm-fanout` | vivo | **questa** |

### I quattro cron che esistono solo qui

`cleanup-expired-pairing-codes`, `retention-sync-events`,
`retention-fitness-metrics`, `retention-workouts`, `keepalive-free-tier` da
`20260513120007`; `sync-trigger-fcm-fanout` da `20260520120001`. Tutti
**attivi in produzione**, nessuno schedulato da una migration remota.
Archiviare quei due file avrebbe tolto dalla ricostruzione i job di
retention dei dati sanitari.

### Correzione a un punto del piano precedente

Era scritto che `20260514120004_init_b2c_subs` potesse uscire dalla catena
«una volta provato quale migration remota valida crea `is_b2c_lifetime`
oggi». La prova e' stata cercata e ha dato l'esito opposto: **nessuna
migration remota crea `b2c_subscriptions` ne' `is_b2c_lifetime`**. La
remota `20260616071926_harden_function_search_path` fa ALTER sulla
funzione, il che prova che esisteva, non che l'abbia creata lei.

Quindi **non esce: si ripara.** Il difetto e' a riga 35, il parametro si
chiama `row`, che e' parola riservata: la firma
`is_b2c_lifetime(row public.b2c_subscriptions)` e' invalida su PG15 e PG17.
Va rinominato il parametro, non rimossa la migration.

### Le due divergenze aperte

**`challenge_leaderboard_v` non esiste in produzione** e nessuna migration
remota la nomina. La migration la dichiara, il database non ce l'ha. Da
decidere: la vista serve ancora o la ricostruzione deve smettere di
crearla. Non toccata qui.

## Escono come marker storico — duplicati provati (4)

Non archiviate: **neutralizzate in loco**, con hash e descrizione del
contenuto originale. Il file resta al suo posto nella catena e non fa
nulla, cosi' la storia resta leggibile e la ricostruzione non fallisce.

| migration | perche' esce | chi produce oggi quello stato |
|---|---|---|
| `20260522120001b_mesh_groups_index_fixes` | identica, tolti i commenti, alla remota applicata | `20260522110516` |
| `20260616090000_gdpr_deletion_execution` | funzione identica alla remota `20260616065134`, cron gia' coperto dalla remota `20260616070752` | quelle due |
| `20260522120006_rls_health_data_group_sharing` | **non e' un duplicato puro** — vedi sotto | `20260522112135` + forward-only |
| `20260711120001_fitness_metrics_hrv_historical_correction` | si autodichiara «DO NOT APPLY» — vedi sotto | nessuno: non e' mai partita |

### `20260522120006` — il revoke che non c'era, e che non avrebbe funzionato

E' la remota `20260522112135` **piu'** un
`REVOKE EXECUTE ON FUNCTION public.user_shares_metric_with_caller(...) FROM anon`.
La parte duplicata non puo' rieseguirsi. Ma il revoke e' l'unica cosa che
questa migration aggiungeva, e non e' mai arrivato in produzione.

**Verificato live il 25/08:** la funzione, oggi in `rls_internal` e
SECURITY DEFINER, ha ACL `PUBLIC=EXECUTE` e
`has_function_privilege('anon', ..., 'EXECUTE')` risponde `true`.

E il revoke **come era scritto non avrebbe chiuso niente**: `anon` non ha
una concessione propria, eredita EXECUTE da `PUBLIC`, e un `REVOKE FROM
anon` non tocca una concessione a `PUBLIC`. Serve `REVOKE ... FROM PUBLIC`.

Va nella forward-only, scritto correttamente. L'esposizione pratica oggi e'
bassa — `rls_internal` non e' fra gli schemi esposti da PostgREST, e per
`anon` la funzione risponde sempre `false` perche' `auth.uid()` e' NULL —
ma e' uno strato di difesa dichiarato nel repository e assente dal database.

### `20260711120001` — spostata, non neutralizzata

Spostata in `supabase/proposte-non-applicate/`. Il file dichiara sé stesso
«REVIEW ONLY — DO NOT APPLY» in testa, e stava in `migrations/`, dove un
reset o un push l'avrebbe eseguito. E' una **DML di massa su
`fitness_metrics`**: richiede GO esplicito di Matteo in qualunque ambiente.
La sua tabella di backup non esiste in produzione: la correzione non e' mai
partita. Dettagli in `proposte-non-applicate/LEGGIMI.md`.

## Verifica finale

Prima: 18 `local_only`, tutte proposte per l'archiviazione.
Dopo: **14 restano eseguibili** (una da riparare), **3 diventano marker
storici**, **1 esce da `migrations/`**.
