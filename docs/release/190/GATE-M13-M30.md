# GATE M13 e M30 — due cancelli che uscivano verdi senza provare niente

> **Destinazione prevista:** `AppFitmesh/docs/release/190/GATE-M13-M30.md`.
> Il lavoro e' stato svolto in un worktree isolato di `fitthesite`, che non puo'
> scrivere fuori dal proprio albero: il file va spostato nel repo dell'app.
> Entrambi i file corretti vivono comunque in `fitthesite`.

Repository: `fitthesite`, worktree isolato `agent-a02a2584bf50087c6`, basato su
`integra/190-backend` (`103571c`).
Banco di prova: contenitore `pg17-190-corsiac`, database `ricostruzione`.
Data: 28/08/2026.

**Nessuna migration e' stata applicata in produzione.** L'unica lettura verso
Supabase produzione e' stata l'elenco delle migration registrate, in sola
lettura, per stabilire se `20260825130500` fosse gia' viva. Non lo e'.

I due difetti sono della stessa famiglia, ed e' la famiglia che questo progetto
ha gia' pagato piu' volte: **un'uscita zero con un messaggio d'errore a
schermo**. In entrambi i casi il controllo stampava la cosa giusta e non la
faceva contare.

---

## M13 — la postcondizione di F6 leggeva una chiave che non esiste

File: `supabase/migrations/20260825130500_entitlement_core_abbonamento_scaduto.sql`

### Cosa era rotto

Le due asserzioni della postcondizione leggevano

```sql
v_kind := private.entitlement_core(v_u) ->> 'entitlementKind';
```

Ma `private.entitlement_core` costruisce il proprio JSON con la chiave
**`kind`** (`20260816124508_entitlement_una_sola_regola.sql`, riga ~211).
`entitlementKind` e' il nome che le da' **un'altra** funzione,
`public.get_entitlement_status`, quando ribattezza il campo per il client
(stessa migration, riga ~334):

```sql
'entitlementKind',      v_core ->> 'kind',
```

Da un JSON che non ha quella chiave, `->>` risponde NULL. E in SQL:

| espressione | valore | l'`if` entra? |
|---|---|---|
| `NULL in ('lifetime','subscription')` | NULL | no |
| `NULL <> 'subscription'` | NULL, **non TRUE** | no |

Un `if` PL/pgSQL entra solo su TRUE. Nessuno dei due `raise` poteva scattare:
**entrambe le asserzioni passavano sempre, su qualunque risposta**
dell'autorita'.

Verificato sul banco:

```
select (private.entitlement_core(...) ->> 'entitlementKind') is null;  -> t
select  private.entitlement_core(...) ->> 'kind';                      -> none
```

### Correzione IN LOCO, e perche' e' lecito

`20260825130500` e' **pending, mai applicata**. La baseline live congelata nel
manifesto e' `20260818084202`; l'elenco delle migration registrate in
produzione, letto in sola lettura, si ferma esattamente a `20260818084202`.
Non esiste nessun artefatto deployato il cui contenuto divergerebbe dal file.

E' anche la pratica gia' stabilita in questo filone: il manifesto registra che
l'impronta della stessa migration era gia' stata **ricongelata il 26/08**, dopo
la rimozione dei `begin`/`rollback` nudi. Il guardrail di quella pratica e'
il gate `19-insieme-pending.sh`, che deve diventare rosso alla modifica e
tornare verde solo dopo il ricongelamento esplicito. Cosi' e' stato (sotto).

Una migration successiva sarebbe stata la scelta peggiore: avrebbe lasciato in
coda una postcondizione cieca che il deploy esegue comunque, e avrebbe dovuto
ri-creare la fixture commerciale una seconda volta.

### Cosa e' cambiato

1. **La chiave giusta**: `->> 'kind'`.
2. **La chiave si PRETENDE, non si spera**:
   `if not pg_catalog.jsonb_exists(v_core, 'kind') then raise ...`.
   Se domani il nucleo la ribattezzasse, la migration si ferma invece di
   diventare cieca in silenzio. Si usa `jsonb_exists` e non l'operatore `?`
   perche' alcuni driver leggono `?` come segnaposto di parametro, e un file di
   migration non puo' dipendere da chi lo esegue — e' la stessa lezione dei
   `begin`/`rollback` nudi.
3. **Confronti che non tacciono su NULL**: `is distinct from` al posto di `<>`.
4. **Un backstop differenziale** (`v_scaduto is not distinct from v_valido`):
   le due letture — abbonamento scaduto e abbonamento valido — devono
   risultare DIVERSE. Con due NULL `is not distinct from` vale TRUE e ferma;
   `=` avrebbe taciuto. Da solo avrebbe fermato M13.
5. **La notice riporta i valori misurati** invece di una frase fissa:
   `F6: scaduto risponde «trial», valido risponde «subscription».`

Onesta' sul punto 4: cosi' com'e' ordinato il blocco, quel `raise` **non e'
raggiungibile** — se (a) e (b) valgono entrambe, i due valori non possono
essere uguali. Sta li' perche' e' l'unica asserzione del blocco che non puo'
passare a vuoto, e resta accesa se qualcuno indebolisse (a) o (b). E'
dichiarato anche nel commento del file.

### Le mutazioni eseguite, e l'exit code osservato

La mutazione **non** sostituisce la funzione: altera il **corpo vivo** con un
`sed` minimo sul solo `jsonb_build_object`, cosi' che l'ancora e il controllo
sul tempo restino al loro posto, il primo blocco della migration esca per
idempotenza, e cio' che viene esercitato sia **la postcondizione e nient'altro**.
Il corpo originale viene sempre rimesso e il ripristino verificato con `cmp`.

Conta l'exit code di `psql -v ON_ERROR_STOP=1 -f <migration>`
(0 = passata, 3 = errore nello script, cioe' la migration si e' fermata).

| # | mutazione del corpo vivo di `private.entitlement_core` | PRIMA | DOPO |
|---|---|---|---|
| 1 | nessuna (caso nominale) | **0** | **0** |
| 2 | `kind` forzata a `'subscription'` — l'abbonamento SCADUTO viene concesso | **0** ← difetto | **3** |
| 3 | `kind` forzata a `'none'` — l'abbonamento VALIDO viene negato | **0** ← difetto | **3** |
| 4 | chiave `kind` rinominata in `entitlementKind` — M13 al contrario | **0** ← difetto | **3** |

Messaggi osservati DOPO la correzione:

- #2 → `ERROR: F6: abbonamento scaduto e l'autorita' risponde ancora «subscription»`
- #3 → `ERROR: F6: abbonamento VALIDO e l'autorita' risponde «none». Nega tutto, quindi non verifica niente.`
- #4 → `ERROR: F6: private.entitlement_core non espone la chiave «kind» (ha risposto {...}). Senza quella chiave la postcondizione non confronta niente.`

Nel caso #2 PRIMA della correzione, la migration stampava
`NOTICE: F6: scaduto nega, valido concede.` mentre l'autorita' stava
concedendo il Pro a un abbonamento scaduto — il difetto esatto che F6 esiste
per chiudere — e usciva **0**.

### Il difetto VERO, non una mutazione sintetica

Prova decisiva: si riporta `private.entitlement_core` allo stato **pre-F6**
(si toglie `and b.active_until > v_now` da entrambi i punti) e si esegue **solo
il blocco di postcondizione**, a parita' di stato del database.

| postcondizione eseguita | exit |
|---|---|
| quella ORIGINALE (letta da `git show HEAD:`) | **0** — `NOTICE: F6: scaduto nega, valido concede.` |
| quella CORRETTA | **3** — `ERROR: F6: abbonamento scaduto e l'autorita' risponde ancora «subscription»` |

### La prima applicazione funziona ancora

La postcondizione e' stata riscritta: bisogna provare che la migration passa
anche sul percorso reale, quello in cui la correzione viene davvero applicata
e non saltata per idempotenza. Corpo riportato a pre-F6, migration eseguita
per intero:

```
NOTICE: F6: controllo sul tempo aggiunto in entrambi i punti.
NOTICE: F6: scaduto risponde «trial», valido risponde «subscription».
NOTICE: F6: postcondizione superata, fixture annullata, nessun residuo.
controllo sul tempo: prima=0  dopo=2   EXIT_MIGRATION=0
```

Nessun residuo della fixture: `auth.users`, `public.profiles`,
`public.b2c_subscriptions` e il registro append-only
`private.billing_purchase_claims` tornano tutti a zero righe per l'utente di
prova. Il sotto-blocco con EXCEPTION regge.

### Il gate 19 se n'e' accorto, e l'impronta e' stata ricongelata

`19-insieme-pending.sh` PRIMA del ricongelamento — **exit 1**:

```
ROSSO  impronta cambiata: 20260825130500_entitlement_core_abbonamento_scaduto
       congelata 9217d732...ab22a0
       sul disco 6e91093a...e65bd1
```

Manifesto aggiornato (`supabase/rollback/MANIFESTO-PENDING-190.tsv`) con la
nuova impronta `6e91093a617fb9d1336245ab7b53e1d23eefa3e82d405f121fcb23692de65bd1`
e la ragione del ricongelamento. Dopo: **exit 0**.
`19-insieme-pending.sh --autocontrollo`: **exit 0**, tutte e tre le sonde rosse.

---

## M30 — il cancello delle mutazioni contava per «ucciso» un test mai partito

File: `supabase/tests/integrazione-190/16-mutazioni-billing.sh`

### Cosa era rotto

`esegui_file()` restituiva **2** quando il file di prova non esisteva, e
stampava «ROSSO file di prova non trovato». Il chiamante guardava solo

```bash
if [ "$codice" -eq 0 ]; then   # mutazione SOPRAVVISSUTA
else                            # "ok ... uccisa da ..."
```

Un 2 finiva nel ramo `else` e diventava «**ok … uccisa da …**», senza toccare
`$esito`. La riga ROSSO veniva stampata e **non contava niente**.

### Riprodotto, non dedotto

Aggiunta al gate una quinta mutazione **vera** — la stessa della riga 1, quella
che il gate sa uccidere — puntata a un file di prova inesistente:

```
  ROSSO  file di prova non trovato: 99-questo-file-di-prova-non-esiste.sql
  ok     RIPRODUZIONE M30: prova inesistente: uccisa da 99-questo-file-di-prova-non-esiste.sql

VERDE: 5 mutazioni, tutte realmente uccise.
EXIT=0
```

Lo strumento il cui unico mestiere e' dimostrare che i test sanno fallire
contava per «difetto ucciso» un test che non era mai partito.

### Cosa e' cambiato

L'esito **non si deduce piu' dal codice di uscita**, che e' ambiguo per
costruzione. `esegui_file` dichiara `$PROVA_ESEGUITA` (1 solo se il test e'
davvero partito) e `$PROVA_MOTIVO` (perche' no, quando no). Il chiamante,
**prima** di leggere il verdetto del test, pretende che un verdetto ci sia:

```bash
if [ "$eseguita" -ne 1 ]; then
  echo "  ROSSO  $nome: la prova NON e' stata eseguita ($motivo)."
  echo "         Non e' una mutazione uccisa: e' una mutazione mai provata."
  esito=1; non_esercitate=$((non_esercitate+1)); return
fi
```

I casi ora distinti:

| esito | classificazione |
|---|---|
| file di prova non trovato | **non eseguito** |
| `docker cp` fallita (la prova non e' arrivata nel contenitore) | **non eseguito** |
| prova `.sql`, psql esce **1** (psql non e' partito) o **2** (connessione persa) | **non eseguito** |
| prova `.sql`, docker esce **125/126/127** | **non eseguito** |
| prova `.sql`, psql esce **3** (errore nello script con `ON_ERROR_STOP`) | eseguito, **fallito** → mutazione uccisa |
| prova `.sql`, psql esce **0** | eseguito, **verde** → mutazione SOPRAVVISSUTA |
| prova `.sh`, esce **125/126/127** | **non eseguito** |
| prova `.sh`, esce **0** / altro non-zero | eseguito, verde / eseguito, fallito |

Chiusa nello stesso passaggio una seconda via allo stesso difetto: il file
remoto aveva **nome fisso** (`/tmp/mut.sql`) e la `docker cp` non veniva
controllata. Una `cp` fallita lasciava in piedi il file della mutazione
PRECEDENTE, e psql eseguiva quello — un verde sul file sbagliato. Ora il nome
e' unico per invocazione, la `cp` e' controllata e il file viene rimosso.

Aggiunta la sonda **`--sonda-prova-mancante`**, inserita nel giro di
`--autocontrollo` (che ora ne esercita tre invece di due).

### Le mutazioni eseguite, e l'exit code osservato

Tutte su `pg17-190-corsiac` / `ricostruzione`.

| invocazione | atteso | PRIMA | DOPO |
|---|---|---|---|
| nominale (4 mutazioni reali) | 0 | **0** | **0** |
| mutazione vera + file di prova inesistente | non-zero | **0** ← difetto | **1** |
| `--sonda-prova-mancante` | non-zero | (non esisteva) | **1** |
| `--sonda-sopravvissuta` (mutazione che sopravvive) | non-zero | 1 | **1** |
| `--sonda-inesistente` (funzione assente) | non-zero | 1 | **1** |
| `--autocontrollo` | 0 | 0 (su due sonde) | **0** (su tre) |

Riga prodotta ora dal caso mancante:

```
  ROSSO  SONDA: file di prova inesistente: la prova NON e' stata eseguita
         (file di prova non trovato: 99-questo-file-di-prova-non-esiste.sql).
         Non e' una mutazione uccisa: e' una mutazione mai provata.

ROSSO: 1 mutazioni non sono state esercitate davvero.
EXIT=1
```

### E l'autocontrollo sa accorgersi se la correzione sparisse?

Copia del gate con la sola guardia su `$PROVA_ESEGUITA` rimossa — cioe' M30
reintrodotto di proposito — eseguita con `--autocontrollo`: **exit 1**, e
nomina il colpevole.

```
  ok     --sonda-inesistente: il gate esce 1, come deve
  ok     --sonda-sopravvissuta: il gate esce 1, come deve
  ROSSO  --sonda-prova-mancante: il gate e' uscito 0. Non sa fallire.
         | ...
         |   ok     SONDA: file di prova inesistente: uccisa da 99-questo-file-di-prova-non-esiste.sql
         | VERDE: 5 mutazioni, tutte realmente uccise.

ROSSO: l'autocontrollo e' fallito. Il verde di questo runner non vale niente.
EXIT=1
```

Nella copia regredita la riga «ROSSO file di prova non trovato» non compare
nemmeno piu' — il messaggio e' stato spostato nel chiamante — quindi il verde
sarebbe stato ancora piu' silenzioso di prima. E' un buon promemoria di quanto
poco valga la riga stampata rispetto al codice di uscita.

---

## Gate collaterali rieseguiti

Nessuno era rosso prima e nessuno lo e' dopo.

| gate | exit |
|---|---|
| `13-differenze-strutturali-spiegate.sh` | 0 |
| `14-copertura-del-confronto.sh` | 0 |
| `15-corpi-billing-consolidati.sh` | 0 — 19 corpi identici + controllo positivo rosso |
| `16-mutazioni-billing.sh` (nominale / `--autocontrollo`) | 0 / 0 |
| `17-manifesto-rollback.sh` | 0 |
| `18-rollback-due-modalita.sh` | **0** |
| `19-insieme-pending.sh` (dopo ricongelamento / `--autocontrollo`) | 0 / 0 |
| `20-secdef-senza-controllo.sh` | 0 |
| `21-nessuna-transazione-nelle-migration.sh` | 0 |
| `22-sentinella-solo-harness.sh` | 0 |
| `bash -n 16-mutazioni-billing.sh` | 0 |

`18-rollback-due-modalita.sh` e' quello che conta per M13: applica le sette
forward-only **in autocommit e dentro una transazione esterna**, due giri per
modalita', con le postcondizioni vere. Riscrivere una postcondizione e' proprio
il cambiamento che quel gate esiste per sorvegliare — e' li' che F6 si era gia'
rotta con i `begin`/`rollback` nudi.

```
autocommit:  848 -> 981 righe (+133), rollback all'impronta iniziale, 2 giri
transazione: 848 -> 981 righe (+133), rollback all'impronta iniziale, 2 giri
ok  impronta post-apply identica nelle due modalita'
VERDE: 7 forward-only, apply e rollback verdi in autocommit e in transazione
       esterna, due giri per modalita'.
```

Il banco e' stato lasciato pulito: `private.entitlement_core` col controllo sul
tempo presente in entrambi i punti, zero righe di fixture, zero database
residui di `18`.

---

## Cosa resta scoperto

1. **Niente e' stato applicato in produzione**, e non deve esserlo da qui. Tutte
   le misure sono su `pg17-190-corsiac`. `20260825130500` resta pending.

2. **Il gate 16 e' stato provato su `pg17-190-corsiac`, non su
   `pg17-190-reset`** — il suo contenitore di default, che al momento non
   aveva il database `ricostruzione` (in uso da un'altra corsia). Va rifatto
   almeno un giro sul percorso di default prima di dichiarare chiuso il gate.

3. **`--autocontrollo` non e' nel giro automatico.** `supabase/tests/esegui-tutto.sh`
   esegue ogni gate **senza argomenti** (`bash "$f"`), quindi gli autocontrolli
   di `16`, `19` e `22` non partono mai da soli. La capacita' di questi
   cancelli di fallire viene provata solo da chi se la ricorda a mano. E'
   esattamente la premessa di M30, e non e' chiusa.

4. **Il ramo `.sh` di `esegui_file` non e' esercitato da nessuna mutazione.**
   Tutte e quattro le prove attuali sono `.sql`. La classificazione dei codici
   per gli script di prova e' scritta ma non misurata.

5. **La classificazione «psql 1/2, docker 125-127 = non eseguito» e' ragionata
   sui codici documentati di psql, non misurata.** Non ho ucciso il contenitore
   a meta' corsa per vederlo davvero. Il caso file-mancante, che e' quello di
   M30, e' invece misurato.

6. **Il backstop differenziale della migration non e' raggiungibile** con
   l'ordine attuale delle asserzioni. E' dichiarato tale nel file. Copre solo
   un futuro indebolimento di (a) o (b).

7. **La migration non e' mai passata dal runner della CLI Supabase**, solo da
   psql — in entrambe le modalita' di transazione, via gate 18. La scelta di
   `jsonb_exists` al posto dell'operatore `?` e' precauzionale proprio per
   questo, e resta non verificata contro il runner reale.

8. **Le altre migration pending non sono state riesaminate** per lo stesso
   difetto di M13 (postcondizione che confronta contro NULL). M13 e' stato
   corretto dove e' stato segnalato; non ho fatto una passata sistematica sulle
   altre sedici.
