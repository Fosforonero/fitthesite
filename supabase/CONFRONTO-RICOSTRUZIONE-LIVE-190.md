# Ricostruzione da zero contro produzione — esito

25/08/2026. Catena completa applicata su un **PostgreSQL 17 usa-e-getta**
(`postgres:17`, container `pg17-190-reset`). Il container condiviso
`supabase_db_fitmesh` non e' mai stato toccato.

**110 migration su 110 applicate, zero fallite**, in tre esecuzioni
consecutive da container nuovo.

Runner: `supabase/tests/reset-pg17/esegui-reset.sh`.

## Il preambolo, e perche' non e' barare

Un `postgres:17` nudo non e' un progetto Supabase. Il preambolo
`00-preambolo-ruoli-supabase.sql` ricrea **solo cio' che la piattaforma
fornisce e che nessuna migration crea**: i ruoli `anon`, `authenticated`,
`service_role`, `authenticator`, `supabase_admin`; lo schema `auth` con
`auth.users`, `auth.identities`, `auth.uid()`, `auth.role()`, `auth.jwt()`;
i privilegi di default su `public`; e due simulazioni di `pg_cron` e `pg_net`.

I flag `rolbypassrls` riproducono quelli misurati in produzione: `postgres` e
`service_role` ce l'hanno, `anon` e `authenticated` no. Non e' un dettaglio:
e' cio' che rende `is_admin()` non ricorsiva ed equivalenti le due forme
della policy su `founder_grants`.

I privilegi di default sono stati aggiunti dopo il primo confronto, che dava
144 concessioni contro 238. Senza di essi il confronto misurava una
differenza di piattaforma spacciandola per una differenza della catena.

## Impronta strutturale: sette categorie su dieci equivalenti

| categoria | ricostruzione | produzione | esito |
|---|---|---|---|
| A funzioni | 62 | 62 | 1 riga diversa |
| B concessioni | 235 | 238 | 3 righe diverse |
| C tabelle | 71 `aa80c280` | 71 `aa80c280` | **identiche** |
| D colonne | 565 `a6b4cf50` | 565 `a6b4cf50` | **identiche** |
| E policy | 83 | 83 | 2 righe diverse |
| F trigger | 12 `245c803c` | 12 `245c803c` | **identici** |
| G indici | 232 `e74c59e7` | 232 `e74c59e7` | **identici** |
| H vincoli | 222 `a5794669` | 222 `a5794669` | **identici** |
| I cron | 8 | 8 | **equivalenti**, vedi sotto |
| J schemi | 6 `b35f7734` | 6 `b35f7734` | **identici** |

565 colonne su 565 e 222 vincoli su 222 con lo stesso hash: la catena
ricostruisce lo schema di produzione.

## Le differenze residue, una per una

**Sei righe su otto sono le forward-only che, per mandato, NON sono state
applicate in produzione.** La differenza le dimostra scritte, non
un problema.

| # | dove | ricostruzione | produzione | causa |
|---|---|---|---|---|
| 1 | `public.is_admin()` | `search_path=""` | `search_path=public, auth` | `20260825120000` |
| 2 | `is_admin` concessioni | niente a PUBLIC/anon | PUBLIC + anon | `20260825120000` |
| 3 | `user_shares_metric_with_caller` | niente a PUBLIC | PUBLIC | `20260825120001` |
| 4 | `users insert own metrics` | `roles=authenticated` | `roles=PUBLIC` | `20260825120001` |
| 5 | `users update own metrics` | `roles=authenticated` | `roles=PUBLIC` | `20260825120001` |
| 6 | 8 job cron | comando su piu' righe | comando su una riga | spaziatura |

Il punto 6 e' cosmetico e **provato tale**: normalizzando gli spazi bianchi,
l'insieme degli otto job da' lo stesso hash da entrambe le parti,
`9976a7117fbbd65a46b8417f363d96ca`. Stessi nomi, stessi orari, stessi
comandi. La differenza nasce perche' `20260513120007_pg_cron_jobs.sql` non e'
mai stata applicata: in produzione quei job sono stati creati altrove, con la
stessa SQL scritta su una riga sola.

## Due oggetti applicati fuori banda, trovati dal confronto

Il reset ha trovato due cose che nessuna migration produce e che in
produzione esistono. Entrambe ora hanno una forward-only.

**`fitness_metrics_user_received_idx`** — l'indice del fix ai timeout 504.
Nessuna delle 89 migration remote lo crea, nessuno dei file locali lo crea.
Applicato a mano mentre il problema era in corso. Riportato da
`20260825120003`, dopo il quale la categoria indici e' **identica al live,
hash compreso**.

**La forma init-plan di `users select own metrics`** — in produzione la
policy usa `user_id = (SELECT auth.uid())`, nella catena
`user_id = auth.uid()`. Nessuna migration la riscrive: le due che la nominano
la nominano dentro un commento. E il commento in testa a `20260730173213` lo
dice, senza accorgersene: «stesso fix gia' applicato a "users select own
metrics"». Quel «gia' applicato» non e' mai stato registrato. Riportato da
`20260825120002`.

Sono il nono e il decimo cambiamento fuori banda noti su questo progetto.

## Cosa NON e' stato confrontato

Nessun dato sanitario, nessuna riga di utente, nessun conteggio di
`fitness_metrics`. Il confronto e' solo di catalogo: funzioni e firme,
SECURITY DEFINER, `search_path`, proprietario, concessioni, RLS, policy,
trigger, indici, vincoli, job cron, schemi.

## Stato

**Nessuna mutazione remota.** Le quattro forward-only esistono solo come file
in `supabase/migrations/`, verificate su Postgres 17. Non sono state
applicate, e non lo saranno senza GO esplicito.
