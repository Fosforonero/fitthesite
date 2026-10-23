# 01 Contratto dashboard e riferimenti

I documenti di architettura sono già nel repository a questo SHA. Qui c'è solo l'indice di quello che
serve a G-04 e le regole da non rompere. In caso di differenza vale il documento originale.

## Documenti nel repository

| Percorso | A che cosa serve per G-04 |
|---|---|
| `docs/architecture/web-dashboard-access-contract-v1.md` | contratto di accesso: verdetto web, due cancelli, decisioni aperte. **Stato: proposta**, la migration non è applicata. |
| `docs/architecture/entitlement-contract-v1.md` | contratto dei titoli (nucleo dell'app). Contesto, G-04 non lo tocca. |
| `docs/web-dashboard/API-CHARTS-L1-IMPORT-01.md` | contratto di import della libreria di grafici in L1 (minimo di tre giorni presenti, nessun ripiego su dati dimostrativi). |
| `docs/web-dashboard/PROVENIENZA.sha256` | provenienza dei file copiati dal prototipo. |
| `lib/dashboard/interruttore.ts` | cancello della dashboard reale (commento di testa = regola completa). |
| `lib/web-dashboard/flag.ts` | cancello del prototipo (solo locale, dati sintetici). |
| `lib/dashboard/verdetto.ts` | esiti del verdetto: `concesso`, `negato`, `non_disponibile`, `non_autenticato`. |
| `lib/dashboard/letture-titolare.ts` | lettura delle righe del titolare, paginazione, `completo`. |
| `lib/dashboard/finestra.ts` | finestra dei sette giorni conclusi del grafico dei passi. |
| `lib/dashboard/passi.ts`, `lib/dashboard/testi.ts` | qualifica dei passi e testi it/en della pagina. |

## Invarianti da non rompere (dal contratto e dal codice)

1. **Fail-closed.** Errore, timeout, funzione assente, versione del contratto diversa o risposta illeggibile
   non aprono mai dati: la pagina mostra «non disponibile». Niente scorciatoie nei test che le nascondano.
2. **Il verdetto si chiede a ogni richiesta**, nessuna cache. La pagina è `force-dynamic`, `revalidate = 0`,
   `fetchCache = 'force-no-store'` e `robots: noindex`.
3. **Due cancelli distinti.** Il prototipo si apre con `WEB_DASHBOARD_PROTOTYPE=1` solo in locale. La pagina reale,
   fuori dallo sviluppo locale, è decisa dal codice di rilascio (`CAPABILITY_STATUS.webDashboard` in `lib/product-facts.ts`, oggi
   `in_development`). La variabile `FITMESH_WEB_DASHBOARD` può solo spegnere in produzione, con valore `0`.
   **Non cambiare lo stato di `webDashboard`.**
4. **Il web non usa `hasFullAccess` né `user_has_active_entitlement`** per decidere l'idoneità. Il verdetto web
   è una funzione separata, con due differenze dichiarate rispetto al nucleo (prova di 14 giorni e abbonamento scaduto).
5. **Nessuno stato di misura inventato.** La pagina reale non produce mai `measured`, `measured-zero` o `partial`:
   nessuna sorgente dà la prova di una giornata completa o di uno zero letterale.
6. **Una lettura non completa non produce grafico** e il conteggio è dichiarato parziale.
7. **Lingue.** I testi della pagina reale esistono solo in `it` e `en` (`lib/dashboard/testi.ts`); per le altre
   lingue la route risponde 404.
8. **Copy dell'utente.** Le regole editoriali del repository (`AGENTS.md`, `CLAUDE.md`: niente em dash nel
   testo per l'utente, niente promesse non verificate) valgono per ogni stringa visibile. G-04 non deve cambiare
   testi senza accordo (vedi specifica).

## Che cosa il contratto NON dice ancora

Le decisioni aperte di Matteo su ponte iOS, abbonamento `cancelled`, Founder e tester (sezione 6 del contratto
di accesso) non riguardano G-04 e non vanno risolte da questo lotto. Le prove SQL (PG17) esistono per il
verdetto e le letture (`supabase/tests/reset-pg17/17-…`, `18-…`, `19-…`) ma **non sono state rifatte su `42b811e7`**.
