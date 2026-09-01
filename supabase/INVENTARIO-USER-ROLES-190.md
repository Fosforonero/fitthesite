# Chi legge `public.user_roles`, e con quale diritto

25/08/2026. Inventario esaustivo dei consumatori di `user_roles`, classificati
per **cosa decidono**. Non sono un difetto unico: alcuni devono filtrare la
scadenza, uno sarebbe un difetto se lo facesse, e due la ignorano di proposito.

Fonte: catalogo di produzione (`pg_get_functiondef` riga per riga, non una
ricerca sul nome della tabella) piu' i file attivi del repository e il codice
applicativo.

## Perche' la prima misura era sbagliata in entrambe le direzioni

Il primo giro cercava «il corpo della funzione nomina `expires_at`?». Una
sonda cosi' sbaglia due volte:

- **falsi positivi**: `private.grant_founder_launch_core` risultava «guarda
  expires_at» perche' lo nomina in una INSERT, mentre le sue DUE letture non
  lo filtrano. `public.claim_group_invite` risultava a posto perche' controlla
  `expires_at`... dell'invito, non del ruolo.
- **falsi negativi**: `public.delete_current_user` risultava un consumatore
  perche' la stringa `user_roles` compare nel corpo. Non legge ruoli: azzera
  `granted_by` prima di cancellare l'utente.

Cercare il nome di una tabella non e' cercare una lettura. L'inventario sotto
e' fatto riga per riga.

## Stato dei dati in produzione — solo aggregati, nessuna identita'

| ruolo | permanenti | a termine attivi | scaduti | totale |
|---|---|---|---|---|
| `admin` | 2 | 0 | 0 | 2 |
| `pro` | 399 | **3** | 0 | 402 |

Le righe scadute oggi sono **zero**: nessun numero pubblicato e' mai stato
sbagliato per questo motivo. Ma **tre concessioni `pro` hanno una scadenza
futura**, quindi i difetti sotto non sono ipotesi: sono su un timer.

## Autorizzazione — decidono chi puo' fare cosa

| oggetto | prima | dopo | forward-only |
|---|---|---|---|
| `public.is_admin()` | leggeva una email incorporata in `auth.users` | `user_roles`, ruolo attivo | `20260825120000` |
| `public.has_role(text)` | `role = check_role`, senza scadenza | `+ (expires_at is null or expires_at > now())` | `20260825120004` |
| `public.is_caregiver()` | guscio su `has_role`, concesso ad anon | eredita il controllo, revocato ad anon | `20260825120004` |

`has_role` e' l'**autorita' generale**: non decide su un ruolo particolare,
decide su qualunque ruolo le si chieda. Il suo difetto valeva per ognuno.

Tutte e tre passano da `search_path = 'public', 'auth'` a `''` e perdono
`PUBLIC` e `anon`. Nessuna policy RLS le chiama (verificato su `pg_policy`:
zero righe), quindi la revoca non rompe nessuna valutazione di policy.

## Entitlement — decidono cosa un utente ottiene

| oggetto | esito |
|---|---|
| `private.entitlement_core(uuid)` | **corretto**: cinque letture, tutte con `(expires_at is null or expires_at > v_now)` |
| `public.user_has_active_entitlement(uuid)` | **corretto**, ed e' il CONTROLLO POSITIVO: delega a `entitlement_core` con `search_path=''` |
| `public.claim_group_invite(...)` | **DIFETTO REALE, non corretto in questo giro** — vedi sotto |
| `private.grant_founder_launch_core(...)` | ignora la scadenza **di proposito**, registrato — vedi sotto |

`user_has_active_entitlement` e' il modello di come si fa: non replica la
regola, delega a un unico motore che la applica. Nel confronto strutturale
fra ricostruzione e produzione risulta **byte-identico**: non e' stato
toccato, ed e' la prova che le correzioni non hanno spostato cio' che era
gia' giusto.

### `claim_group_invite` — il posto famiglia su un ruolo scaduto

```
SELECT 1 FROM public.user_roles
WHERE user_id = v_owner_id AND role IN ('pro','admin')
...
v_cap := CASE WHEN v_is_pro THEN 8 ELSE 3 END;
```

Nessun controllo di scadenza. Il proprietario di un gruppo famiglia con un
Pro **scaduto** conserva il tetto di 8 membri invece di scendere a 3.

E' un beneficio concesso su un diritto finito, non un buco di sicurezza, e
oggi non si manifesta perche' le righe scadute sono zero. Ma e' una delle tre
concessioni a termine a poterlo far comparire.

**Non corretto in questo giro perche' non era nell'elenco dei quattro**, e
cambiarlo modifica un tetto di prodotto visibile agli utenti: e' una
decisione, non una riparazione. La correzione e' una riga sola, pronta al GO.

### `grant_founder_launch_core` e `get_entitlement_status` — coppia da non separare

`grant_founder_launch_core` corto-circuita su `exists(... role='pro')` nudo,
senza filtrare la scadenza. `get_entitlement_status` **replica di proposito
la stessa condizione non filtrata**, e lo dichiara nel proprio commento:

> «qui si replica la stessa condizione non filtrata di proposito, perche'
> l'obiettivo e' rispecchiare cosa fara' REALMENTE il motore Founder»

Filtrarne uno solo farebbe divergere lo specchio dalla cosa specchiata, che
e' un difetto peggiore di quello che si toglie. E il programma founder-launch
e' **chiuso dal 31/07/2026** con cutoff nel codice: quel ramo non concede
piu' niente.

Registrati come **coppia**: se il programma riapre, si correggono insieme o
non si correggono.

## Reporting — non decidono niente, dicono numeri

| oggetto | esito | forward-only |
|---|---|---|
| `public.get_dashboard_snapshot(date)` | quattro conteggi «Pro attivo» senza scadenza | `20260825120006` |
| `app/(frontend)/[locale]/app/layout.tsx:33` | legge `note='founder-launch'` per un **banner** | nessun finding |

Il difetto della dashboard non apre un accesso: fa dire un numero sbagliato.
Il che basta, perche' su quei numeri si decide se una leva di crescita ha
funzionato. Gli scaduti non spariscono: vanno in due chiavi nuove dichiarate
storiche gia' nel nome, `total_pro_scaduti_storico` e
`founder_grants_scaduti_storico`.

`isFounder` in `layout.tsx` governa solo `<FounderReviewBanner>`. E'
presentazionale. Nessuna modifica.

## Mutazione — scrivono, non decidono

| oggetto | esito |
|---|---|
| `public.grant_pro_to_email(text)` | **DIFETTO CORRETTO** — `20260825120005` |
| `public.handle_new_founder()` | **corretto cosi' com'e'**, e filtrare sarebbe un difetto |
| `public.delete_current_user()` | **nessun finding**: azzera `granted_by`, non legge ruoli |
| `public.concedi_ponte_ios(...)` | corretto: sovrascrive solo i ponti gia' scaduti, e lo dice nel `where` |
| `public.grant_pro_until_to_email(...)` | corretto: scrive e aggiorna `expires_at` |
| `public.ring_reward_heartbeat(...)` | corretto: estende con `greatest`, e un permanente resta permanente |
| `app/api/cron/beta-welcome-emails/route.ts` | seleziona founder per l'invio e segna `review_email_sent_at` |

### `handle_new_founder` — il contatore che NON deve filtrare

```
select count(*) into taken from public.user_roles where note = 'founder-launch';
if taken < founder_cap then ...
```

Nessun controllo di scadenza, ed e' **giusto**. Conta i **posti consumati**
contro il tetto di 1000. Un posto consumato resta consumato: filtrare gli
scaduti libererebbe posti gia' assegnati e farebbe sforare il cap.

In piu' non puo' proprio capitare: i grant founder si inseriscono con
`expires_at = null` due righe piu' sotto, quindi una riga `founder-launch`
scaduta non esiste per costruzione.

E' il controesempio che smonta la regola «aggiungere `expires_at` ovunque
compaia `user_roles`». La domanda giusta non e' «legge i ruoli?», e' **«cosa
decide?»**.

### `delete_current_user` — perche' non e' un consumatore

```
update public.user_roles set granted_by = null where granted_by = uid;
```

Anonimizza il riferimento a chi aveva concesso i ruoli, prima di cancellare
l'utente. Non legge ruoli, non decide niente, `expires_at` non c'entra.
Verificato anche dall'impronta strutturale: e' **byte-identico** fra la
ricostruzione e la produzione, perche' non e' stato toccato.

## Riepilogo

| classe | oggetti | corretti | finding aperti | nessun finding |
|---|---|---|---|---|
| autorizzazione | 3 | 3 | 0 | 0 |
| entitlement | 4 | 0 | 1 + 1 coppia registrata | 2 |
| reporting | 2 | 1 | 0 | 1 |
| mutazione | 7 | 1 | 0 | 6 |

**Quattro forward-only scritte, nessuna applicata.** Un finding reale aperto
(`claim_group_invite`), una coppia registrata e volutamente non toccata.

## Prima del deploy

Le **due righe `admin` attive** vanno confermate da Matteo dal pannello
privato. Nessuna email e nessuna identita' in log o documenti: qui si
riportano solo i conteggi. Fino a quella conferma la forward-only
`20260825120000` resta scritta e non applicata, e il suo blocco di verifica
aborta comunque se gli admin attivi non sono esattamente due.
