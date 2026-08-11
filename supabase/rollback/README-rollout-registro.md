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
