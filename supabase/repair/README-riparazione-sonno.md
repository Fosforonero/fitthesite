# Riparazione dello storico — istruzioni, e la decisione che non ho preso io

`20260811_sleep_stages_dedup.sql` **non è stato applicato da nessuna parte**.
Questo file dice cosa farebbe, quanto costa, e come si torna indietro.

## Prima di tutto: la migration, poi la riparazione

Riparare lo storico mentre il merge vecchio è ancora in produzione è lavoro
buttato: il primo sync successivo rigonfia la riga appena ripulita. L'ordine è
`20260811120000_sleep_merge_idempotent.sql`, poi questo.

## Cosa c'è da riparare, misurato l'11/08/2026 col detector per UNIONE

I numeri qui sotto sostituiscono quelli del primo giro. Il detector precedente
confrontava la somma delle durate con l'estensione totale della sessione, e
quel confronto non vede le sovrapposizioni quando nella notte ci sono buchi:
con un buco, la somma può restare sotto l'estensione pur avendo segmenti
accavallati. Il detector attuale usa l'unione degli intervalli per singolo
`sessionIdx`, e le righe ambigue passano da 4 a 7.

| | |
|---|---|
| Righe con `sleep_stages` array non vuoto | 40.186 |
| Righe con almeno una copia esatta | **1.514** |
| Utenti | **137** |
| Molteplicità massima | 2 (raddoppio esatto, mai di più) |
| Da escludere: array misti | 0 |
| Da escludere: numerici non validi | 0 |
| Da escludere: sovrapposizione non risolvibile | **7** |
| **Deduplicabili** | **1.507** |

Le 7 escluse sono righe in cui, *dopo* la deduplica esatta, due segmenti
realmente distinti della stessa sessione si accavallano ancora. Non è
duplicazione, è un dato contraddittorio, e non sta a uno script decidere quale
dei due sia vero.

Il denominatore, sempre: **137 utenti su 158 della coorte filtrata del percorso
canonico**. Gli altri denominatori, perché la cifra non venga letta male: 223
utenti con stadi del sonno, 319 con almeno una riga, 525 registrati.

**La corruzione è attiva mentre si legge questo file.** Nelle 24 ore precedenti
il 12/08/2026 sono state scritte 178 righe con stadi del sonno, e 103 di quelle
contengono copie esatte, su 63 utenti.

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

## La decisione, presa il 12/08/2026: `received_at = false`

La cache locale del client fa un **pull incrementale con watermark su
`received_at`** (`metrics_cache_sync.dart`: chiede a Supabase solo le righe con
`received_at` maggiore del cursore salvato). Quindi una riparazione che non
tocca quel campo è invisibile a chi ha la cache calda: corretta nel database,
vecchia sullo schermo.

La decisione è comunque **`false`**, e la visibilità si risolve altrove:

1. **prima** si prova l'aggiornamento in place dalla 189 alla 190 con cache
   calda, per vedere se il percorso normale di aggiornamento già rimette in
   pari quelle righe;
2. se non basta, si fa **una sola** invalidazione di cache limitata agli
   account interessati (o un salto di versione della cache), una tantum;
3. `received_at` **non** viene riusato come segnale di riparazione. Cambiargli
   significato per 1.400 righe per risolvere un problema di visibilità
   lascerebbe in giro un campo che non vuol più dire quello che dice, e in
   `collapseRowGroup` la riga base di un gruppo è la più recente per
   `received_at`: dei 1.439 gruppi `(utente, giorno, source, source_device)`
   che contengono una riga affetta, 37 hanno più righe, e lì spostare
   `received_at` cambierebbe quale riga fa da base per passi e intraday.

`p_tocca_received_at` resta un parametro obbligatorio della funzione, senza
default, perché un default silenzioso su una scelta come questa è il modo
esatto in cui una decisione presa una volta viene dimenticata. Ma il valore da
passare è `false`.

## Cosa manca ancora prima di poter applicare (la riparazione resta in NO-GO)

Questo elenco non è una lista di miglioramenti: finché non è chiuso, i numeri
prodotti dalla preparazione non sono affidabili e non si applica niente.

1. **Detector per unione, non per estensione.** La somma delle durate confrontata
   con l'estensione totale non vede le sovrapposizioni quando ci sono buchi.
   Serve il massimo corrente / unione degli intervalli per singolo `sessionIdx`,
   e **tutti i conteggi vanno ricalcolati** dopo il cambio: i numeri prodotti
   dal detector precedente non valgono.
2. **CAS con uguaglianza JSONB diretta**, non solo sull'MD5.
3. **`saltato_cas` deve essere ri-preparabile.** Oggi è uno stato terminale: una
   riga saltata perché l'utente ha sincronizzato nel frattempo non può più
   rientrare, ed è esattamente la riga che ha più bisogno di essere ripresa.
4. **Il canonicalizzatore e la chiave della riparazione devono normalizzare
   numeri e `sessionIdx` esattamente come il server** (stesse soglie, stesse
   regole su assente/negativo/frazionario/fuori range).
5. **Nessuna tolleranza.** Via i confronti tipo `v_diff <= 2`: ogni divergenza
   deve essere zero, oppure appartenere a un'esclusione con un nome.
6. **ACL esplicite**: REVOKE da PUBLIC, `anon`, `authenticated`, `service_role`;
   `search_path` sicuro; proprietario verificato; test negativi su REST e RLS.
7. **Stato con `run_id`**, versione dell'algoritmo, transizioni valide, limiti
   di lotto, `lock_timeout`, politica di concorrenza dichiarata.
8. **Backup cifrato indipendente**, checksum verificato, e nessun dato sanitario
   nel repo o nei log.

## Come vanno chiamate le righe

Una riga da cui si rimuovono solo copie **esatte** è **deduplicabile**, non
"completamente riparata". Il difetto ha potuto far perdere segmenti reali prima
di oggi: quando due osservazioni sovrapposte si contendevano la stessa
finestra, la più verbosa vinceva intera e l'altra spariva. Quei segmenti non
esistono più e **non vanno ricostruiti**.

Una riga che dopo la deduplica esatta contiene ancora sovrapposizioni non
identiche va classificata **`ambiguous_after_exact_dedup`**: può essere
deduplicata, ma la sua timeline resta incompleta o incoerente e va segnalata o
nascosta, mai ricomposta artificialmente.

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

1.507 UPDATE su una colonna JSONB. Gli array del sonno stanno sotto la soglia
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
