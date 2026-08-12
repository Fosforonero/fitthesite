# Ticket P1 separati dal P0 sonno

Misurati l'11–12/08/2026 in sola lettura su produzione. Nessuno di questi è un
P0 equivalente: sono registrati perché misurati, non perché urgenti. Vanno
tenuti fuori dal P0 sonno e lavorati a parte.

## P1 — Passi: tre formati coesistenti nella stessa colonna

`intraday_steps` contiene oggi tre forme diverse:

| Forma | Elementi |
|---|---|
| `{hour, steps}` | 1.448.280 |
| `{covered, hour, srcCovH, srcCumul, srcPkg, srcSame, srcTotal, steps}` | 24 |
| `{complete, durationMinutes, startMinute, steps}` | 3.545 |

**Zero identità duplicate** su tutte e tre: il difetto del sonno non ha un
gemello qui. Serve però un parser che copra le tre forme e un test per ogni
consumer, perché la forma `startMinute` non ha la chiave `hour` su cui il resto
del codice si appoggia.

Nota metodologica: il primo conteggio che avevo prodotto (60.350 righe
duplicate) era sbagliato. Raggruppavo su `ts`, che in questa colonna non
esiste, quindi tutti gli elementi finivano nello stesso gruppo. Il valore
corretto è zero.

## P1 — Frequenza cardiaca: INSERT grezzo, primo UPDATE bucketizzato

Il percorso di INSERT scrive `intraday_hr` alla lettera; il merge lo riscrive a
bucket di 5 minuti. Una riga che non riceve mai un secondo sync resta con la
serie non bucketizzata, e al primo sync successivo il grafico cambia forma
senza che sia arrivato nessun dato nuovo.

Sono **5.151 righe, 54 utenti** con più campioni dentro lo stesso bucket. Non
sono duplicati: sono righe che il merge non ha mai toccato. Le 76 righe da
luglio misurate in precedenza sono lo stesso fenomeno ristretto a quel periodo,
e il conteggio coincide.

## P1 — Allineamento di verità: 990 righe recenti con FC senza provenienza

`heart_rate_bpm` valorizzato e `hr_source_name` nullo: 990 righe da agosto,
l'ultima in data odierna. Non è solo storico, il writer corrente le produce
ancora. È lo stesso schema del difetto già noto sui passi orari (la fonte del
grafico indipendente da quella del totale).

## P1 — Allenamenti: 267 duplicati storici, da classificare prima di toccare

267 righe da luglio, 3 da agosto. Il merge corrente deduplica per costruzione
(`||` + `distinct on`), quindi il writer non può più crearne per quella strada;
restano quelle entrate dal percorso di INSERT. Prima di correggere serve sapere
se il consumer le mostra davvero: il read-side potrebbe già deduplicarle.

## Rimosso dal report: idempotenza di `intraday_calories`

`intraday_calories` non è **mai** un array in produzione: zero righe. Il test
che era stato scritto verifica una forma che non esiste, quindi il suo verde
non significa niente. Va tolto o riscritto quando quella colonna verrà usata.

## P1 privacy (alta) — `source_package` su iOS contiene nomi personali

Per le sorgenti `healthkit` quel campo non è un identificativo di app: è il
nome che la persona ha dato al proprio dispositivo. È emerso da una query di
ripartizione che ha restituito nomi propri in chiaro.

Serve una categoria canonica (vendor/tipo) da usare in ogni output, e il campo
grezzo non deve comparire in report, dashboard o log.

**Verifica fatta**: nessun valore grezzo di `source_package` è stato salvato in
file, in nessuno dei worktree.

**Ma**: nomi propri di persona sono già presenti nel repo dell'app, in nomi di
test e commenti di sprint precedenti, in almeno 5 file fra `lib/` e `test/`. È
un problema diverso e precedente a questo sprint, e va deciso a parte.

## P1 — Quattro cast nudi nella RPC possono ancora far cadere l'intero upsert

Trovati dalla review avversariale del 12/08/2026, con riproduzione sulla RPC
vera. Sono preesistenti e identici alla definizione viva: il fix del sonno ha
indurito **solo** il percorso di `sessionIdx`.

| campo | forma | esito |
|---|---|---|
| `sleep_minutes` | `420.5` | 22P02, upsert abortito |
| `sleep_minutes` | `"n/d"` | 22P02, upsert abortito |
| `sleep_start_ms` | `1.5` | 22P02, upsert abortito |
| `sleep_start_ms` | 20 cifre | 22003, upsert abortito |
| `sleep_apnea_detected` | `"forse"` | 22P02, upsert abortito |

Ogni riga è un giorno intero perso: passi, frequenza e calorie compresi. La
forma plausibile è `sleep_minutes: 420.5`, cioè un client che calcola i minuti
in virgola mobile senza arrotondare. Lo schema Zod del sito la intercetta, ma
il repo documenta che la RPC è invocabile direttamente.

**Perché non l'ho corretto nel P0**: accettare `420.5` come `420` significa
introdurre una tolleranza silenziosa. È una decisione, non una svista da
correggere di straforo, e va presa sapendo che il resto dello sprint sta
andando nella direzione opposta ("eliminare tolleranze").

### La prova che 189 e 190 non producono quelle forme

Condizione posta il 12/08/2026 per lasciarli P1. Verificata sui tipi del
modello, che sono il vincolo strutturale: nessuna di queste forme è
esprimibile.

| campo | tipo in `HealthSnapshot` | cosa può uscire da `jsonEncode` |
|---|---|---|
| `sleepMinutes` | `int` (non nullable) | solo un intero |
| `sleepStartMillis` | `int?` | intero o assente |
| `sleepEndMillis` | `int?` | intero o assente |
| `sleepApneaDetected` | `bool?` | `true`/`false` o assente |

Un `int` di Dart è a 64 bit, cioè esattamente il dominio di `bigint`: i due
cast su `sleep_start_ms`/`sleep_end_ms` non possono andare fuori range. Un
`bool?` non può diventare `"forse"`. Una virgola non può comparire in un
`int`.

Resta un solo caso aritmeticamente possibile: `sleep_minutes` oltre i
2.147.483.647 di un `int4`. Serve una finestra di sonno lunga circa 4.000 anni,
cioè timestamp corrotti a monte. In 190 non può più uscire, perché il guard lo
limita al massimo di un `int4` prima di serializzare. In 189 poteva, ma in
quello stesso scenario 189 falliva PRIMA, lato client: `reportedSleepMinutes.clamp(0, windowMinutes)`
con una finestra negativa solleva `ArgumentError` dentro `toJson()`, quindi il
giorno era già perso, per un'altra strada.

L'app inoltre non chiama mai la RPC direttamente: passa da `/api/v1/sync`, che
valida con Zod. I quattro cast restano raggiungibili solo da un chiamante che
non è la nostra app.

**Il che non li rende innocui.** Un campo del sonno malformato non dovrebbe
poter abbattere passi, frequenza e calorie dell'intera giornata: la prova qui
sopra dice che oggi non succede, non che il disegno sia giusto.

## P1 — Il payload del sonno non ha un tetto di dimensione

Misurato lato client: 100.000 segmenti producono 6,6 MB di `sleepStagesJson`;
300.000 elementi arrivano a 19,2 MB. Nessun crash, nessun limite, nessun
rifiuto. Una notte reale ne ha meno di 200.

## P1 alto / privacy — identità dell'anello BLE

Registrato a parte, con la catena verificata riga per riga:
`AppFitmesh/docs/sprints/FINDING-ble-identita-anello.md` (repo dell'app).
Candidato P0, **gate prima del freeze della 190**.

## Monitor sanitario

Separato dal billing, aggregato giornaliero, senza user id, valori sanitari,
device name. Da aggiungere: soppressione delle celle rare. Un aggregato
giornaliero per `(codice, ruolo_sorgente, piattaforma, build)` con conteggio 1
o 2 è re-identificabile quanto un elenco; sotto una soglia (5) la cella va
unita in "altro" invece di essere pubblicata.

## Il denominatore, sempre

La cifra corretta sugli utenti toccati dal difetto del sonno è **137 su 158
della coorte filtrata del percorso canonico, audit del 11/08/2026**. Gli altri
denominatori, perché non venga letta male: 223 utenti con stadi del sonno, 319
con almeno una riga, 525 registrati. Non scrivere "87% di tutti gli utenti".
