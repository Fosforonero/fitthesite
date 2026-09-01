# Proposte non applicate

File che **non sono migration** e non devono stare in `migrations/`, dove un
`db reset` o un `db push` li eseguirebbe.

## 20260711120001_fitness_metrics_hrv_historical_correction.sql

Spostato qui il 25/08/2026 durante la riconciliazione della 190.

Il file **dichiara sé stesso non applicabile**, in testa: «REVIEW ONLY — DO
NOT APPLY». Nonostante questo stava in `migrations/`. E' una **DML di massa
su `public.fitness_metrics`** che riclassifica valori HRV storici delle righe
iOS: copia `hrv_rmssd` in `hrv_sdnn` e poi azzera `hrv_rmssd`.

Non esce perche' «non risulta applicata». Esce per tre motivi indipendenti:

1. Si autodichiara non applicabile.
2. E' una migrazione di massa su `fitness_metrics`, che richiede **GO
   esplicito di Matteo** prima di essere eseguita, in qualunque ambiente.
3. La sua tabella di backup `private.fitness_metrics_hrv_correction_backup_20260711`
   **non esiste in produzione**, e nessuna migration remota la nomina: la
   correzione non e' mai partita.

Il conteggio che porta dentro (67 righe `healthkit`, 14 `apple_health`, 7
utenti distinti) e' una fotografia della data dell'audit, non un dato
corrente, e il file stesso lo dice.

Da riprendere quando si decide la correzione storica HRV, ripartendo dal
PRE-CHECK, non dai numeri scritti qui.
