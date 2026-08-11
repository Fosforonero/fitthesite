# Monitor di integrità dei dati — proposta

Non ancora implementato: qui c'è la forma, il perché di ogni scelta, e cosa
deve restare fuori.

## Perché non la tabella degli acquisti

Il registro Apple (`private.billing_purchase_claims` e la tabella di stato)
esiste per una cosa sola: stabilire chi possiede un acquisto. Ci scrive un solo
percorso, dopo una verifica dello store, e ogni riga ha una chiave esterna che
la lega a una proprietà. Appoggiarci un contatore di segmenti del sonno
vorrebbe dire aprire un secondo percorso di scrittura su una tabella la cui
unica difesa è che ne esiste uno solo, e mescolare due cicli di vita che non
hanno niente in comune: un acquisto è per sempre, una violazione di integrità
si guarda per una settimana.

Tabella separata, schema separato.

## Cosa registra

Una riga per violazione osservata, con **soltanto** questi campi:

| Campo | Tipo | Esempio |
|---|---|---|
| `codice` | text | `sleep_stages_duplicati` |
| `ruolo_sorgente` | text | `health_connect`, `healthkit`, `colmi_ble` |
| `piattaforma` | text | `android`, `ios` |
| `schema_version` | int | `4` |
| `build` | text | `190` |
| `segmenti` | int | `188` |
| `duplicati` | int | `94` |
| `azione` | text | `repaired` \| `rejected` |
| `giorno` | date | `2026-08-11` |

E un aggregato giornaliero `(giorno, codice, ruolo_sorgente, piattaforma, build)`
con i conteggi, che è la cosa che si guarda davvero.

## Cosa NON registra, mai

Nessun JSON degli stadi. Nessun timestamp del sonno — né `startMs`, né `endMs`,
né `sleep_start_ms`. Nessun valore sanitario. Nessuna email. Nessun
`source_package`, e questa merita una riga di spiegazione: per le sorgenti
HealthKit quel campo **non** è un identificativo di app, è il nome che la
persona ha dato al proprio dispositivo. È emerso durante i conteggi di oggi,
dove una query di ripartizione ha restituito nomi propri. Per questo il monitor
registra `ruolo_sorgente` (la categoria) e non il pacchetto.

Nessun `user_id`. Il numero di utenti colpiti si ottiene contando gli utenti
distinti con una query sui dati veri quando serve, non tenendo un elenco.

## Codici, uno per invariante

| Codice | Cosa ha osservato |
|---|---|
| `sleep_stages_duplicati` | due segmenti con la stessa `(sessionIdx, startMs, endMs, stage)` |
| `sleep_sessione_oltre_finestra` | la somma dei segmenti di una sessione supera la finestra di **quella** sessione |
| `sleep_stages_forma_non_array` | la colonna contiene qualcosa che non è un array |
| `hr_bucket_duplicato` | due campioni nello stesso bucket da 5 minuti |
| `serie_forma_mista` | la stessa colonna usa due schemi diversi (es. `hour` e `startMinute` in `intraday_steps`) |
| `provenienza_mancante` | una metrica è presente ma la sua provenienza dichiarata no |
| `intervallo_non_crescente` | `end <= start` |
| `totale_negativo` | un cumulativo sotto zero |
| `percentuale_fuori_scala` | SpO₂ o stress fuori 0–100 |
| `coppia_pressoria_incompleta` | sistolica senza diastolica, o viceversa |

## Dove osserva

Nel percorso di scrittura, dentro `upsert_fitness_metrics_v189`, **dopo** la
canonicalizzazione: si registra ciò che è stato corretto (`repaired`) o
rifiutato (`rejected`), non ciò che è arrivato. Un monitor che osserva
l'ingresso conta il rumore dei client vecchi per sempre; uno che osserva
l'uscita dice se le difese stanno reggendo.

Costo: una `insert` in più per riga con almeno una violazione. Oggi sarebbero
circa 140 righe al giorno, e con il fix a regime devono tendere a zero — se non
lo fanno, è il monitor a dirlo.

## Come si guarda

Una sola domanda: **la curva giornaliera per codice scende dopo il rilascio?**
Se `sleep_stages_duplicati` non va a zero entro pochi giorni dal deploy,
significa che i client vecchi continuano a spedire array duplicati e che la
difesa server sta lavorando da sola. È esattamente l'informazione che serve per
decidere se forzare un aggiornamento.

## Ritenzione

90 giorni per le righe di dettaglio, indefinita per gli aggregati giornalieri:
sono conteggi, non dati personali.
