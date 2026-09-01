# Ricostruzione da zero contro produzione — esito

25/08/2026, seconda misura. Catena completa applicata su un **PostgreSQL 17
usa-e-getta** (`postgres:17`, container `pg17-190-reset`). Il container
condiviso `supabase_db_fitmesh` non e' mai stato toccato. Produzione:
PostgreSQL 17.6, stessa major.

**116 migration su 116 applicate, zero fallite**, da container nuovo, con il
runner riscritto e il suo controllo positivo a quattro rami.

## Perche' questo documento sostituisce il precedente

La prima versione dichiarava «sette categorie su dieci equivalenti» e
concludeva che la catena ricostruiva lo schema di produzione. Quella
conclusione era **piu' forte di cio' che era stato misurato**, per due buchi
indipendenti nello strumento:

1. **il confronto non guardava i corpi delle funzioni.** La categoria A
   confrontava firma, `SECURITY DEFINER`, volatilita', `search_path`,
   proprietario. Tutte cose vere, tutte insufficienti: due funzioni con la
   stessa firma possono fare cose opposte. Su 66 funzioni, **26 avevano il
   corpo diverso**;
2. **l'elenco degli schemi era scritto a mano** e non conteneva `internal`,
   dove vivono gli helper del merge del sonno — cioe' proprio l'autorita' che
   l'integrazione del filone sonno deve toccare. Sei migration della catena
   nominano quello schema.

Uno strumento che non guarda una cosa non risponde «non lo so»: risponde
verde. Entrambi i buchi sono chiusi, e c'e' un guardrail che li tiene chiusi
(`tests/integrazione-190/14-copertura-del-confronto.sh`).

## Impronta strutturale: dodici categorie

| categoria | ricostruzione | produzione | esito |
|---|---|---|---|
| A funzioni (firma) | 66 | 66 | 4 righe diverse |
| B concessioni | 242 | 249 | 7 righe diverse |
| C tabelle | 71 `aa80c280` | 71 `aa80c280` | **identiche** |
| D colonne | 565 `a6b4cf50` | 565 `a6b4cf50` | **identiche** |
| E policy | 83 | 83 | 2 righe diverse |
| F trigger | 12 `245c803c` | 12 `245c803c` | **identici** |
| G indici | 232 `e74c59e7` | 232 `e74c59e7` | **identici** |
| H vincoli | 222 `a5794669` | 222 `a5794669` | **identici** |
| I cron | 8 | 8 | 4 righe, sola spaziatura |
| J schemi | 7 `5394119b` | 7 `5394119b` | **identici** |
| K corpi grezzi | 66 | 66 | 27 righe diverse |
| L corpi codice | 66 | 66 | 8 righe diverse |

K e L sono nuove. K confronta il corpo grezzo: dice **che** qualcosa e'
cambiato, commenti compresi. L confronta il corpo normalizzato — minuscolo,
senza commenti, senza spazi bianchi — e dice se e' cambiato il **codice**.
Servono entrambe: K da sola produce rumore, L da sola nasconde una riscrittura
dei commenti, che e' comunque il segno di una modifica fuori banda.

Il normalizzatore di L ha un limite dichiarato: due letterali di stringa che
differiscono solo per uno spazio interno risulterebbero uguali. Rischio
stretto e reale, per questo e' accompagnato da un controllo positivo che
costruisce due funzioni diverse solo negli spazi e due diverse nel codice, e
pretende che le distingua. Verde in entrambi i versi.

## Le 26 differenze di corpo, smontate

| quante | cosa erano |
|---|---|
| 13 | **solo commenti** |
| 5 | **solo spaziatura o maiuscole** |
| 6 | **le forward-only gia' scritte** |
| 1 | alias di colonna inerti (`admin_daily_aggregate`) |
| **1** | **`private.entitlement_core` — vera, non spiegata** |

Alla chiusura di 3A si e' aggiunta l'ottava: `internal._merge_sleep_stages_jsonb`,
che nella prima misura era fra le tredici «solo commenti» — cioe' la catena
riproduceva gia' l'autorita' viva del merge — e ora differisce apposta, perche'
`20260825120009` corregge la finestra.

Le cinque cosmetiche sono `admin_device_brand_distribution`,
`admin_overview`, `admin_top_errors`, `fn_group_events_webhook`,
`is_gym_owner`: spazi attorno agli operatori, virgole senza spazio dopo,
maiuscole delle parole chiave.

**Prova d'insieme.** Escludendo le otto funzioni con codice diverso, le
restanti **58 su 66** hanno impronta normalizzata identica dalle due parti:
`faa3ac5f83f943b472ea7d3681e08eee`. L'insieme delle differenze e' esattamente
quello dichiarato, non un sottoinsieme di quello che si e' guardato.

## La differenza che era un blocker

**`private.entitlement_core`** — l'unica autorita' che decide se un utente ha
accesso all'app.

Nella catena il ramo `appReview` e' **penultimo**, dopo founder, grandfather,
lifetime, subscription, admin e registro manuale, e riconosce un solo
indirizzo. In produzione, dal **18/08/2026**, quel ramo e' il **primo**,
incondizionato, e ne riconosce due.

Qui la produzione ha ragione e la catena ha torto: e' l'opposto delle altre
forward-only. Chiunque ricostruisse lo schema da questi file — un ambiente
nuovo, un ripristino, un branch Supabase per provare la candidata 190 —
otterrebbe il comportamento **precedente al 18/08**, quello in cui il conto di
revisione dello store non ottiene mai `appReview` perche' un ramo precedente
lo intercetta. E' il difetto che ha gia' prodotto respingimenti su iOS.

Registrata da `20260825120008_entitlement_core_ramo_appreview_in_testa.sql`.
Applicata in produzione sarebbe un **no-op**. Dopo la migration il corpo
**grezzo** coincide byte a byte: `8c7caad78b24cb882a94ff553a26f994`, 6100
byte da entrambe le parti.

E' l'**undicesimo** cambiamento fuori banda noto su questo progetto. I primi
dieci erano oggetti mancanti; questo e' un corpo divergente, e nessuna
categoria del confronto lo guardava.

## Le differenze residue, una per una

Tutte verificate da `tests/integrazione-190/13-differenze-strutturali-spiegate.sh`,
che per ciascuna pretende una migration esistente che nomini l'oggetto.

| # | categoria | oggetto | causa |
|---|---|---|---|
| 1-4 | A | `is_admin`, `has_role`, `is_caregiver`, `grant_pro_to_email`: `search_path` | 120000, 120004, 120005 |
| 5-10 | B | `is_admin`, `has_role`, `is_caregiver` verso PUBLIC e anon | 120000, 120004 |
| 11 | B | `user_shares_metric_with_caller` verso PUBLIC | 120001 |
| 12-13 | E | `users insert/update own metrics`: `roles=authenticated` | 120001 |
| 14-19 | L | corpi di `is_admin`, `has_role`, `is_caregiver`, `grant_pro_to_email`, `get_dashboard_snapshot`, `claim_group_invite` | 120000, 120004, 120005, 120006, 120007 |
| 20 | L | corpo di `entitlement_core` | **120008** |
| 21-24 | I | quattro job cron | sola spaziatura |
| 25 | L | `admin_daily_aggregate` | alias inerti, eccezione tracciata |
| 26 | L | corpo di `internal._merge_sleep_stages_jsonb` | **120009** |

I quattro job cron: la differenza e' `now() - interval` contro
`now()-interval` e `)) * 1000` contro `))*1000`. Provato togliendo ogni spazio
bianco: i quattro comandi coincidono. Il controllo positivo mostra che lo
stesso confronto distingue due comandi davvero diversi.

`admin_daily_aggregate` differisce per quattro **alias di colonna** dentro un
`RETURN QUERY` di una funzione `RETURNS TABLE`. In quella posizione gli alias
sono inerti: i nomi delle colonne li fissa `RETURNS TABLE`. Dimostrato sul
container confrontando due funzioni identiche salvo gli alias, stesso
risultato. E' il **dodicesimo** cambiamento fuori banda: innocuo, la pratica
no.

## Due oggetti applicati fuori banda, trovati dal confronto precedente

Restano validi e coperti: **`fitness_metrics_user_received_idx`** (indice del
fix ai timeout 504, riportato da `20260825120003`) e **la forma init-plan di
`users select own metrics`** (riportata da `20260825120002`). Dopo di essi le
categorie indici e colonne sono identiche al live, hash compreso.

## La finestra del sonno, misurata prima di scriverne il fix

`internal._merge_sleep_stages_jsonb` calcolava `main_start_ms` / `main_end_ms`
come `min(startMs)` / `max(endMs)` su **tutti** i segmenti della sessione
principale, awake compresi. Il client li calcola escludendo gli awake. Da
`20260817073706` la finestra viene dal merge anche al primo INSERT, quindi la
finestra piu' larga sovrascrive quella corretta gia' al primo salvataggio.

Misurato in sola lettura prima di scrivere una riga, finestra mobile di 7
giorni, 1.038 notti con ipnogramma e sessione principale:

| sorgente | notti | con il difetto | scarto medio a letto - dormito |
|---|---|---|---|
| health_connect | 742 | 399 (53,8%) | 53 min (sane: 31) |
| healthkit | 230 | 19 (8,3%) | 85 min (sane: 28) |
| colmi_ble | 66 | 0 (0,0%) | — (sane: 0) |
| **totale** | **1.038** | **418 (40,3%)** | **55 min (sane: 27)** |

Allargamento: 210 notti sotto i 5 minuti, 156 fra 5 e 30, 49 fra 30 e 120, 2
oltre le due ore. Peggiore 140 minuti.

**Due controlli positivi sulla misura**: la stessa regola senza esclusione da'
zero su ogni sorgente, come deve per costruzione; con `rem` al posto di
`awake` da' 114 invece di 418. La query risponde a *quale* stadio si esclude,
non e' una costante.

`20260825120009` aggiunge due campi nuovi — `sleep_start_ms` /
`sleep_end_ms` — invece di modificare `start_ms` / `end_ms`, che nella
funzione servono anche a scegliere la sessione principale, a rilevare le
sovrapposizioni e a riordinare cronologicamente. Il diff sul corpo vivo tocca
**esattamente le tre ancore e nient'altro**.

Nessuna riparazione storica in questa migration. Le 418 notti gia' scritte
sono **riparabili** al prossimo sync di quel giorno, non gia' riparate: la
differenza non e' verbale. Le notti degli utenti che non sincronizzeranno piu'
quel giorno **restano storicamente sbagliate**. Dire «guariscono da sole»
dichiarerebbe chiuso un problema che e' chiuso solo per chi torna.

Restano quindi tre cose distinte: **ingest nuovo corretto** (questa
migration), **monitor post-deploy** che misuri la discesa del 40,3%, e
**riparazione storica separata**, che non parte senza giorni puliti
consecutivi e senza il GO esplicito di Matteo.

## WG1: il muro regge, e non per assenza di traffico

Canary punto-nel-tempo su sette giorni, sola lettura, aggregati:

| | |
|---|---|
| scritture salute/allenamenti | 3.438 |
| utenti distinti | 173 |
| **scritture senza diritto** | **0** |
| **utenti in violazione** | **0** |

Il diritto e' ricostruito all'istante di ogni scrittura, non adesso.
**Controllo positivo**: la stessa query senza il ramo della prova segnalerebbe
1.738 scritture e 77 utenti. La query sa contare; lo zero non e' cecita'.

Limite dichiarato: `b2c_subscriptions` conserva lo stato corrente e non la sua
storia, quindi il ramo abbonamento e' ricostruito in modo generoso. Nessun
falso allarme da li'; ma una violazione che passasse solo da quel ramo
potrebbe sfuggire. Un rosso qui e' quasi certamente vero, un verde e' forte e
non totale. Query in `tests/canary-190/wg1-canary-punto-nel-tempo.sql`.

## Cosa NON e' stato confrontato

Nessun dato sanitario, nessuna riga di utente, nessun conteggio di
`fitness_metrics` oltre gli aggregati del canary. Il confronto e' di catalogo:
funzioni, firme e **corpi**, SECURITY DEFINER, `search_path`, proprietario,
concessioni, RLS, policy, trigger, indici, vincoli, job cron, schemi.

Fuori dal confronto restano gli schemi di piattaforma (`auth`, `storage`,
`realtime`, `vault`, `extensions`, `graphql`, `pgbouncer`,
`supabase_migrations`) e i loro oggetti: non sono governati dalle migration di
questo repository.

## Stato

**Nessuna mutazione remota.** Le dieci forward-only esistono solo come file in
`supabase/migrations/`, verificate su Postgres 17. Non sono state applicate, e
non lo saranno senza GO esplicito.
