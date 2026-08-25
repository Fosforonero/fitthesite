# Rollout del registro — la sequenza, e perché quest'ordine

Da leggere insieme a `README-rollback-applicativo.md`, che spiega perché un
feature flag non è un rollback.

## Il problema

Il registro protegge gli acquisti solo se **nessuna scrittura commerciale lo
aggira**. Ma migration e deploy non sono simultanei, e qualunque ordine si
scelga lascia scoperto un intervallo:

| Ordine | Cosa succede nell'intervallo |
|---|---|
| Migration con divieto, poi deploy | Il backend vecchio fa ancora upsert diretti. Cominciano a fallire. **La 189 chiude comunque la transazione**: acquisti pagati e mai serviti, in massa, causati dalla difesa stessa. |
| Deploy, poi migration | La route nuova cerca una RPC che non esiste. Stessa fine. |
| Migration permissiva, poi deploy, e **un secondo backfill** | Sembra risolvere. Non risolve: una transazione scritta durante l'intervallo può essere stata **sovrascritta** da una successiva sullo stesso utente, e ciò che è stato sovrascritto non è "mancante", è irrecuperabile. Il backfill legge `b2c_subscriptions`, e lì di quella transazione non resta niente. |

L'ultima riga è il motivo per cui non basta rifare il backfill dopo.

## La soluzione: la protezione è attiva *dalla migration*, non dal deploy

`20260810140000_b2c_projection_guard.sql` installa un trigger su
`public.b2c_subscriptions` in modalità **compatibility**:

- una scrittura commerciale che non viene dal registro **non viene respinta**;
- viene completata, e la proprietà mancante viene **iscritta al volo** dal
  trigger, con la stessa chiave che ricava il backfill (Apple:
  `originalTransactionId`; Google: SHA-256 del purchase token);
- se quella transazione risulta già di un altro account, la scrittura **viene
  respinta**: il difetto HIGH è chiuso da subito, prima ancora che la route
  nuova esista.

Il backend vecchio continua a funzionare esattamente come prima, e ogni sua
scrittura lascia comunque una riga nel registro. **Non c'è nessun istante
scoperto.**

Provato in `supabase/tests/billing_claims_p0/60-rollout-window.sql`, che
riproduce l'upsert della 189 nella sua forma letterale nell'istante esatto fra
migration e deploy. 9 casi su 9.

## La sequenza

| # | Passo | Verifica prima di procedere |
|---|---|---|
| 1 | Applicare le migration del registro in ordine: `20260808211929`, `20260810090000`, `20260810120000`, `20260810140000` | `select mode from private.billing_projection_guard_mode` → `compatibility` |
| 2 | **Backfill in dry-run** sulle righe commerciali esistenti | Zero righe scritte, elenco delle chiavi attese |
| 3 | **Backfill in apply** | Nessun conflitto; `claimed_at` non spostato su un secondo giro |
| 4 | Osservare almeno un ciclo di acquisti reali col backend **ancora vecchio** | Ogni nuova riga commerciale ha una proprietà: `set_billing_projection_guard_mode('strict')` in *dry run* non protesterebbe |
| 5 | **Deploy della route nuova** | Un acquisto reale risponde 200 e produce claim + stato + proiezione |
| 6 | `select private.set_billing_projection_guard_mode('strict', '<motivo>')` | Si rifiuta da solo se resta anche una sola riga scoperta |
| 7 | Conservare l'artefatto (vedi sotto) | — |

Il passo 6 è l'unico irreversibile nel senso che conta: da lì in avanti una
scrittura commerciale fuori dal registro è un errore, non un avviso. Va fatto
**dopo** il deploy, mai prima.

## Le quattro righe Google, verificate prima del backfill

Controllate in **sola lettura** su produzione l'11/08/2026, con una query che
restituisce solo conteggi e booleani: nessun purchase token, nessun
identificativo, nessuna email.

| Controllo | Atteso | Trovato |
|---|---|---|
| righe `google_play` | 4 | 4 |
| token nulli, o con spazi | 0 | 0 |
| valori **già** in forma di digest | 0 | 0 |
| SKU fuori catalogo | 0 | 0 |
| token distinti / utenti distinti / chiavi derivate distinte | 4 / 4 / 4 | 4 / 4 / 4 |
| chiavi derivate che violerebbero il vincolo di forma | 0 | 0 |

Il controllo che conta di più è il terzo. Se anche una sola riga contenesse già
un digest a 64 esadecimali, il backfill lo ri-digerirebbe e produrrebbe una
chiave che non corrisponde a nessun acquisto reale — un claim iscritto su una
proprietà inesistente, in una tabella append-only. Nessuna lo contiene.

Il registro in produzione **non esiste ancora**: la migration non è stata
applicata. Quindi oggi tutte e quattro le righe sono "scoperte", ed è normale —
è esattamente ciò che il backfill al passo 3 deve coprire, e ciò che il rifiuto
del passo 6 controlla.

## Il primo rilascio è forward-only

Non esiste ancora una versione precedente **nota-buona** del percorso ledger da
ridistribuire: prima di questa non ce n'è nessuna che scriva il registro. Quindi
per il primo rilascio:

- **non c'è un rollback applicativo.** L'unica leva, se qualcosa va storto, è
  correggere in avanti;
- la modalità `compatibility` è la rete: riportare la guardia da `strict` a
  `compatibility` **non riapre il buco** — le scritture continuano a produrre
  proprietà, semplicemente smettono di essere respinte quando arrivano da fuori.
  È l'unica manovra all'indietro sicura, e va usata solo se un percorso
  legittimo che non conoscevamo viene respinto;
- se non esiste nessun percorso ledger funzionante, vale la regola del runbook
  di rollback: **si sospendono i nuovi acquisti lato store**, non si aggira il
  registro.

## L'artefatto noto-buono, da conservare al passo 7

Appena una versione del percorso ledger è stata verificata in produzione, va
registrata qui — diventa il rollback noto-buono del rilascio successivo, e
senza questi tre dati non lo è.

```
Versione ledger verificata #1
  SHA route + RPC ........  <commit>
  Deploy .................  <id deployment Vercel>
  Migration applicate ....  20260808211929, 20260810090000, 20260810120000, 20260810140000
  Guardia ................  strict, dal <data/ora>
  Verificato con .........  <acquisto reale: piattaforma, esito, entitlement proiettato>
  Suite ..................  supabase/tests/billing_claims_p0/run-suite.sh, exit 0
```

Da compilare **dopo** il passo 6, non prima: una versione non ancora esercitata
su un acquisto vero non è nota-buona, è solo deployata.

## Cosa NON è una manovra di rollout

- Rispondere 503 a tutte le validazioni. Finché la 189 è la build più diffusa,
  un errore restituito in massa è una perdita di acquisti in massa: quella build
  chiude la transazione anche dopo una validazione fallita.
- Riabilitare le scritture dirette con un flag. Vedi
  `README-rollback-applicativo.md`: `b2c_subscriptions` ha una riga per utente,
  e ciò che viene sovrascritto non si recupera.
- Eseguire il rollback distruttivo del registro. Cancellarlo rende ogni acquisto
  che conteneva di nuovo reclamabile dal primo account che lo presenta.

---

## Le conseguenze, senza attenuanti

Questa sezione è scritta per essere letta durante un incidente, quindi non
contiene "in genere", "dovrebbe" e "salvo casi". Ogni riga è una cosa che non si
fa, con il motivo per cui non si fa.

**Il 503 non è un interruttore.** Non si risponde 503 in massa per "fermare" le
validazioni. Ogni client che precede la 190 chiude la transazione in ogni modo
di guasto: un errore restituito in massa è una perdita di acquisti in massa. La
traduzione 503 → 502 per i client legacy (`statusPerIlClient`) concede tre
tentativi invece di zero. **Non li rende sicuri**: al terzo fallimento quella
transazione viene chiusa lo stesso, e non esiste nessuno status code che faccia
tenere aperta una transazione a una 189 — nemmeno un 200 senza `active_until`,
che lì diventa `malformed_response` e chiude.

**Non si torna a un backend che non conosce il registro.** Una versione
precedente scrive `public.b2c_subscriptions` direttamente. Con la guardia in
`strict` quelle scritture vengono respinte, e ogni rifiuto è una transazione
chiusa senza diritto; con la guardia in `compatibility` passano, ma smettono di
iscrivere la proprietà con le stesse garanzie del percorso nuovo. In entrambi i
casi si sta scambiando un problema con uno peggiore.

**Il backend nuovo si prova col payload LETTERALE della 189 prima di prendere
traffico.** Non "con un payload equivalente": quello vero, senza
`token_format` e senza `client_contract_version`, su iOS e su Android. I casi
stanno in `app/api/v1/billing/validate-purchase/route.test.ts`, e il backend
vecchio viene fatto girare contro il database nuovo in `route.db.test.ts`. Una
compatibilità dedotta è già stata sbagliata due volte in questo lavoro: sulla
forma dell'istruzione della 189 (era un upsert, non una UPDATE) e sul
discriminante delle build vecchie (`token_format` copriva solo iOS).

**L'intervallo fra migration applicata e deploy completato si tiene il più corto
possibile.** In quella finestra le istanze vecchie parlano col database nuovo. È
misurato, non ipotizzato (`route.db.test.ts`): la vecchia route risponde 200
`state: active` per un acquisto revocato mentre il database dice `expired`, e
risponde `apple_iap` a un Founder mentre il database tiene `founder_grant`. Il
database non si corrompe in nessuno dei due casi — la guardia scarta la
scrittura e ricalcola — ma **la risposta è falsa finché dura la finestra**. La
falsità è sempre in eccesso, mai in difetto: nessun cliente perde un diritto che
aveva, qualcuno può crederne di avere uno che non ha fino alla prima rilettura.

**Durante un incidente senza un artefatto noto-buono si sospende la vendita.**
Non si restituiscono errori di proposito per "far ritentare più tardi": vedi
sopra, ritentare più tardi non è quello che fa la 189. Si toglie la
disponibilità all'acquisto lato store e si corregge in avanti.

**Il recupero della 189 resta manuale.** Un cliente che ha perso una transazione
la riprende premendo "Ripristina acquisti", cioè compiendo un gesto che nessuno
gli ha chiesto e di cui probabilmente non conosce l'esistenza. Questo percorso
esiste e va detto al supporto, ma **non rende sicuro nessun nuovo fallimento**:
è una riparazione, non una rete.

### Il rischio residuo che non si chiude

Finché la 189 è installata, ogni fallimento di validazione può costare una
transazione. Nessuna delle correzioni di questo lavoro lo elimina, perché il
codice che chiude la transazione è già sui telefoni. Le correzioni riducono la
probabilità che il fallimento avvenga e la rendono recuperabile a mano; non
rendono il rollout *fail-safe*, e **il rollout non va descritto così**.

---

## Il ciclo di vita delle revoche è INCOMPLETO, e va deciso a parte

Quello che il backend sa fare oggi, provato: quando gli **arriva** una nuova
evidenza — un JWS che dichiara la revoca, o una risposta `verifyReceipt` con
`cancellation_date_ms` — la registra, ricalcola la proiezione e risponde
terminale solo se la scrittura è andata a buon fine. Vale in entrambe le
direzioni: un `REFUND_REVERSED` successivo riattiva l'accesso, perché
l'ordinamento è sulla freschezza della fotografia.

Quello che il backend **non** sa fare: accorgersene da solo.

- **App Store Server Notifications V2 non è collegato.** Nessun endpoint
  registrato, nessun handler, nessuna verifica di firma. Apple non ha dove
  mandare `REFUNDED`, `REVOKE` o `REFUND_REVERSED`.
- **Non c'è nessun polling.** Nessun job interroga periodicamente lo stato degli
  acquisti già registrati.

Conseguenza diretta: **un rimborso viene registrato solo quando quel cliente
riapre l'app e ripresenta l'acquisto.** Se non la riapre più — ed è
esattamente ciò che fa chi ha appena chiesto un rimborso — il lifetime
rimborsato resta il suo migliore diritto a tempo indefinito. È un costo per noi,
non un danno per lui, e per questo non blocca da solo la 190.

**Da decidere con Matteo, separatamente**: se collegare Notifications V2 prima
della 190 o farne il P0 della 191. Finché non è deciso, il ciclo di vita delle
revoche **non va descritto come completo** in nessun documento, nota di rilascio
o risposta al supporto.
