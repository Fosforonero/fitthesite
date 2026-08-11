# Riparazione dello storico — istruzioni, e la decisione che non ho preso io

`20260811_sleep_stages_dedup.sql` **non è stato applicato da nessuna parte**.
Questo file dice cosa farebbe, quanto costa, e come si torna indietro.

## Prima di tutto: la migration, poi la riparazione

Riparare lo storico mentre il merge vecchio è ancora in produzione è lavoro
buttato: il primo sync successivo rigonfia la riga appena ripulita. L'ordine è
`20260811120000_sleep_merge_idempotent.sql`, poi questo.

## Cosa c'è da riparare, misurato l'11/08/2026

| | |
|---|---|
| Righe con `sleep_stages` array non vuoto | 40.046 |
| Righe con almeno un segmento duplicato | **1.470** |
| Utenti | **133** |
| Molteplicità massima | 2 (raddoppio esatto, mai di più) |
| Da escludere: array misti | 0 |
| Da escludere: numerici non validi | 0 |
| Da escludere: sovrapposizione non risolvibile | **4** |
| **Riparabili senza ambiguità** | **1.466** |

Le 4 escluse sono righe in cui, *dopo* la deduplica, due segmenti realmente
distinti della stessa sessione si accavallano ancora. Non è duplicazione, è un
dato contraddittorio, e non sta a uno script decidere quale dei due sia vero.

## La sequenza

```sql
-- 1. Prepara: nessuna scrittura sui dati. Ripetere finche' esaminate = 0,
--    passando ogni volta l'ultimo_id restituito.
select * from repair.prepara_sleep_stages(500, 0);

-- 2. Dry-run: il conto di cosa succederebbe.
select * from repair.report_sleep_stages();

-- 3. Applica, a lotti. Il secondo argomento e' la decisione qui sotto.
select * from repair.applica_sleep_stages(200, <true|false>);

-- 4. Se serve tornare indietro.
select * from repair.rollback_sleep_stages(200);
```

Ogni passo è ripartibile: `prepara` avanza su un cursore di `id`, `applica`
lavora solo sulle righe non ancora applicate. Interromperlo a metà e
riprenderlo è il caso normale, non un incidente.

## La decisione: `received_at`

La cache locale del client fa un **pull incrementale con watermark su
`received_at`** (`metrics_cache_sync.dart`: chiede a Supabase solo le righe con
`received_at` maggiore del cursore salvato). Quindi:

> Se la riparazione non tocca `received_at`, le righe corrette **non vengono
> mai richieste di nuovo** e l'utente continua a vedere il numero vecchio.

Non c'è un default sicuro, quindi la funzione non ne ha uno: `p_tocca_received_at`
è obbligatorio.

**`false`** — la riparazione è invisibile ai client con cache calda. Corretta nel
database, inutile sullo schermo. Va abbinata a un'invalidazione della cache
lato client, che oggi non esiste.

**`true`** — le righe riparate tornano nel pull incrementale e l'utente vede il
numero giusto. In cambio, `received_at` cambia significato per quelle righe, e
in `collapseRowGroup` la riga base di un gruppo è la più recente per
`received_at`. Misurato: dei 1.439 gruppi `(utente, giorno, source, source_device)`
che contengono una riga affetta, **1.402 hanno una riga sola** — lì non c'è
nessuna base da spostare. Restano **37 gruppi** con più righe, dove spostare
`received_at` può cambiare quale riga fa da base per passi e intraday.

La terza via, più pulita e più lunga: una colonna `repaired_at` e un pull
incrementale su `greatest(received_at, repaired_at)`. Richiede una migration e
una modifica al client, quindi una build.

**Non ho scelto.** Con 37 gruppi a rischio e un effetto collaterale su metriche
diverse dal sonno, è una decisione di prodotto.

## Backup, checksum, rollback

Il backup **è** la tabella di lavoro: `repair.sleep_stages_lavori` conserva il
JSON originale di ogni riga toccata, con il suo MD5. Non serve un dump
separato, e soprattutto non serve ricostruire il valore vecchio per il
rollback: c'è.

La precondizione è un CAS su quell'MD5. Se fra la preparazione e l'applicazione
la riga è cambiata — l'utente ha sincronizzato, la finestra è di ore — la riga
viene **saltata**, non sovrascritta, e marcata `saltato_cas`. Riparare
sull'analisi di dati che non esistono più sarebbe scrivere un valore calcolato
sul nulla. Il rollback usa la stessa precondizione al contrario, sull'MD5 del
valore nuovo.

Quella tabella contiene stadi del sonno, cioè dati sanitari. Lo schema `repair`
non ha grant ad `anon` né ad `authenticated`, e non deve mai finire fra gli
schemi esposti in Settings > API. Va cancellata quando la riparazione è chiusa
e verificata.

## Costo di scrittura

1.466 UPDATE su una colonna JSONB. Gli array del sonno stanno sotto la soglia
TOAST nella grande maggioranza dei casi, quindi è una riscrittura di tuple
ordinaria: nell'ordine di pochi MB di WAL in totale, a lotti di 200. Nessun
lock di tabella, nessuna migration, nessuna finestra di manutenzione.

L'unico effetto di rilievo è quello descritto sopra, e non è il costo: è la
visibilità.

## `sleep_minutes` non viene toccato

Resta il totale autorevole dichiarato dalla fonte. La tabella di lavoro
registra `minuti_dichiarati` e `minuti_finestra` come diagnostica, così una
decisione successiva ha i numeri davanti, ma nessuna funzione qui li applica.
Il contratto di quel campo è stato deciso nella 190 e non è rotto.

## Cosa è stato provato

`supabase/tests/sleep_merge_p0/30-riparazione.sql`, nove casi: preparazione
ripartibile in più lotti, le tre esclusioni riconosciute una per una, il
dry-run che non scrive, l'applicazione che deduplica lasciando `received_at`
fermo, l'oggetto e l'ordine originali preservati, le righe escluse intatte, il
rollback esatto, il CAS che salta una riga cambiata sotto, e la verifica che la
deduplica della riparazione e la canonicalizzazione del server scartino gli
stessi segmenti — perché due definizioni di "duplicato" che divergono sono
peggio di nessuna.
