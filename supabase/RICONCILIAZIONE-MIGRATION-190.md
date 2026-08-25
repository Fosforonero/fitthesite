# Riconciliazione delle migration — gate backend 190

**Nessun `db push` e nessun `migration repair` finche' questo documento non e'
completo e approvato.** Misurato il 25/08/2026 in sola lettura contro il
progetto `xcdyhkuyxukaifhhtadr`, confrontato con `origin/main` (`7e16d7f`).

## Come sono stati presi i numeri, e perche' ci si puo' fidare

L'inventario remoto e' stato letto da `supabase_migrations.schema_migrations` e
**ricopiato in locale**. Ricopiare a mano e' la fonte di errore che questa
release ha gia' pagato piu' volte, quindi la copia e' stata verificata contro un
checksum calcolato dal database:

| | valore |
|---|---|
| md5 di `version\|name` per tutte le righe, dal database | `9975138d560bf44c5c9a37eafd8fc0b7` |
| md5 della stessa stringa ricalcolato sulla copia locale | `9975138d560bf44c5c9a37eafd8fc0b7` |
| md5 dell'inventario completo con md5 dei contenuti | `cb3f74b4344081ae878495c006e4e939` |

La copia e' esatta byte per byte. Ogni numero che segue si basa su quella.

## Stato prima

| | quante |
|---|---|
| migration registrate in produzione | **89** |
| file in `supabase/migrations/` su `origin/main` | **64** |
| allineate (stessa versione **e** stesso nome) | **17** |
| drift: stesso nome, versione diversa | **29** |
| file locali senza riscontro in produzione | **18** |
| registrate in produzione senza file su main | **43** |

Diciassette su sessantaquattro. Il repo e la produzione **non descrivono lo
stesso database**, e non e' un caso isolato: e' la condizione normale di questo
progetto da maggio.

### Le 43 senza file su main si dividono in due

**8 esistono in git, ma su altri rami.** Il loro sorgente non e' perso, e'
soltanto fuori da `main`:

| versione prod | nome | dove sta |
|---|---|---|
| 20260718073343 | dashboard_snapshot_rpc | `salvataggio/…` , `migrations-fuori-banda/` |
| 20260805081803 | dashboard_snapshot_revenue | idem |
| 20260807093327 | dashboard_snapshot_fix_apple_billing_source | idem |
| 20260808144749 | dashboard_snapshot_leading_indicators | idem |
| 20260815074409 | dashboard_snapshot_real_sync | idem |
| 20260816092657 | dashboard_snapshot_founder_trial_split | idem |
| 20260816093034 | dashboard_snapshot_platform_fallback | idem |
| 20260816080658 | **sleep_merge_no_duplicazione** | `p0/sleep-merge-idempotency` |

**35 non esistono in nessun ref, di nessun ramo.** Il loro sorgente vive
**soltanto dentro il database**. Fra queste ci sono cose che non sono dettagli:

- `p0_fitness_metrics_rls_perf_hardening` e le sue tre correzioni successive,
  cioe' l'irrobustimento RLS della tabella dei dati di salute
- `gdpr_process_deletions_function` e `schedule_process_deletions_cron`
- `harden_function_search_path`, `harden_is_admin_email_whitelist`
- `payload_cms_schema` (la piu' grande, 29.778 caratteri)
- **`registra_tentativo_acquisto_rpc`** e **`cessione_ios_niente_500_e_rinnovo`**,
  entrambe segnalate da Matteo e entrambe rilevanti per la 190

Totale da recuperare: **94.961 caratteri**, media 2.713, massimo 29.778.

**Sono recuperabili:** la colonna `statements` e' popolata per tutte e 89 le
righe. Il sorgente non e' perso, e' solo in un posto sbagliato.

### Le 18 locali mai applicate sono tutte lo schema iniziale

`20260513120001` … `20260514120006`, piu' quattro sparse. Sono le migration che
hanno creato il database a maggio, e **non sono registrate** perche' allora il
registro non esisteva ancora.

**Su una ricostruzione da zero girerebbero per prime, e una di loro non gira.**
`20260514120004_init_b2c_subs.sql`, riga 35:

```sql
create or replace function public.is_b2c_lifetime(row public.b2c_subscriptions)
```

`row` come nome di parametro non e' valido su PG15 ne' su PG17. Quindi il
**secondo cancello richiesto, «database da zero», e' gia' rotto in partenza**,
e non per colpa del sonno: e' rotto dal 14 maggio. Va messo in conto nel piano,
non scoperto durante il test.

## Il drift per nome, e perche' e' una trappola

Le 29 in drift hanno **lo stesso nome** e **versione diversa**. Cercare per nome
dice «gia' fatta», cercare per versione dice «mai fatta». I casi che toccano la
190:

| file in git | registrata in produzione come | nome |
|---|---|---|
| 20260816140000 | **20260816100548** | entitlement_autorita_unica |
| 20260816150000 | **20260816100824** | entitlement_gate_scritture_salute |
| 20260816160000 | **20260816101622** | entitlement_autorita_sei_casi |
| 20260816170000 | **20260816102210** | registro_pagamenti_segnalati |
| 20260816180000 | **20260816103021** | registro_tentativi_acquisto |
| 20260816200000 | **20260816124508** | entitlement_una_sola_regola |
| 20260816210000 | **20260816125359** | ring_reward_premio_sano |
| 20260817090000 | **20260817073706** | finestra_sonno_una_sola_regola |
| 20260817204500 | **20260817201814** | cessione_ios_ponte_temporaneo |

Le altre venti sono di maggio e giugno e hanno la stessa forma.

## Stato dopo, cioe' l'obiettivo

1. `supabase/migrations/` contiene **una riga per ogni versione registrata in
   produzione**, con la **versione remota reale** nel nome del file.
2. Nessun file in `supabase/migrations/` che non sia registrato: le 18 dello
   schema iniziale escono dalla cartella eseguibile e restano come sorgente
   storico, esattamente come e' gia' stato fatto per le otto fuori banda.
3. `supabase migration list` non mostra scarti.
4. Solo a quel punto la nuova migration del sonno viene creata con
   `supabase migration new`, e sara' **successiva a tutte quelle vive**.

## Come si recuperano le 35, e cosa serve

**Percorso nativo, preferito.** La CLI e' installata (2.111.0) ma **non e'
autenticata**: `supabase projects list` risponde
`LegacyPlatformAuthRequiredError`, e il collegamento in `supabase/.temp/` e' nel
formato vecchio che questa versione non legge. Serve **un `supabase login` di
Matteo**, una volta. Dopo di che il recupero e la riconciliazione si fanno con i
comandi della CLI, senza che nessuno ricopi 95 KB di SQL.

**Percorso di ripiego, gia' verificato che funziona.** Leggere `statements` via
SQL, scrivere il file, e **confrontare l'md5 del file scritto con l'md5
calcolato dal database**. E' lo stesso metodo usato per l'inventario, e ha gia'
provato di saper distinguere una copia esatta da una sbagliata. Costa molte piu'
operazioni, e va bene per poche migration, non per trentacinque.

## Cosa NON si fa

- **Nessun `supabase migration repair`** prima che questo piano sia approvato.
  Il repair riscrive il registro di produzione: e' una scrittura, ed e' proprio
  la classe di operazione che ha creato il drift.
- **Nessun `db push`** finche' locale e remoto non sono allineati. Oggi un push
  proverebbe ad applicare 18 migration di schema iniziale su un database che ha
  gia' quelle tabelle.
- **Nessuna riparazione dello storico dei dati.** Questo documento parla del
  registro delle migration, non delle righe.

## Perche' questo blocca il sonno

La nuova migration del sonno deve essere **successiva a tutte quelle vive**. Con
il registro in questo stato, «tutte quelle vive» non e' una lista che il repo
conosca: la conosce solo il database. Creare adesso la migration del sonno
significherebbe sceglierne il timestamp guardando il posto sbagliato.
