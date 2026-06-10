# Blog Style Guide — FitMesh Sync

> Riferimento permanente per scrivere e revisionare i post del blog.
> Basato sul framework condiviso da Matteo il 2026-06-08.

---

## 1. Struttura

**Tesi in apertura.** Prima frase = il punto. Zero preamboli del tipo "In questo articolo vedremo...". Il lettore capisce cosa porta a casa prima ancora di decidere se leggere.

**Una cornice memorabile.** Una sola immagine o frase-gancio per articolo. Non dieci. Deve restare in testa. Esempi riusciti: "un orbitale non è un'orbita", "quadro elettrico che decide quali circuiti si parlano". Inserirla in apertura o al massimo al secondo paragrafo, non sepolta nel mezzo.

**Gotchas / lezioni imparate.** È la parte di valore vero: cosa è andato storto, cosa ha sorpreso, la war-story in prima persona. Quello che distingue un articolo tuo da una pagina enciclopedica. Se non c'è almeno un gotcha, l'articolo non è pronto.

**Una opinione netta.** Prendi posizione una volta sola, chiara. "Questo approccio non funziona su mobile, ed è giusto dirlo." Il giudizio dimostra competenza più dell'enciclopedismo.

**Skimmable.** Heading che raccontano la storia da soli (leggibili in sequenza senza il corpo). Paragrafi corti. Grassetti sui concetti chiave. Si deve capire il filo scorrendo solo i titoli.

**TL;DR finale.** Chiusura "In sintesi" con 3-5 bullet. Obbligatoria.

**Regola d'oro: layer additivo, non riscrittura.** Non svuotare il contenuto tecnico per renderlo snello. Aggiungere struttura sopra a quello che c'è.

---

## 2. Stile (de-AI)

**Zero em-dash (—).** È il tic numero uno dell'IA. Usa virgole, parentesi, due punti o spezza la frase. Gli en-dash nei nomi propri (Kerr–Schild, Samsung–Google) restano, sono corretti.

**Niente parentetiche a panino** del tipo "X, e — grazie a Y — Z". Riscrivile.

**Voce in prima persona, concreta.** "Io ho trovato", "ho scelto", "mi serviva", "ho sbagliato". Non il passivo impersonale da paper.

**Evita i riempitivi da IA:** "è importante notare che", "in conclusione", "nel mondo di oggi", liste di tre aggettivi perfettamente bilanciati, frasi che riassumono la frase precedente.

**Varietà di ritmo.** Frasi corte secche alternate a una lunga. L'IA tende a una lunghezza media uniforme — rompila.

---

## 3. Fail loud, never fake (non negoziabile)

Ogni approssimazione dichiarata. Ogni numero reale. Ogni fonte citata o linkata. Niente metriche, screenshot o claim inventati. Se manca un dato, si dice. L'onestà sui limiti è una firma, non una debolezza.

---

## 4. Checklist pre-pubblicazione

- [ ] La prima frase è già la tesi?
- [ ] C'è una cornice memorabile (una sola)?
- [ ] C'è almeno una lezione/gotcha che solo chi ha costruito la cosa poteva scrivere?
- [ ] C'è un TL;DR finale "In sintesi"?
- [ ] Si capisce il filo leggendo solo gli heading?
- [ ] `grep "—"` sull'MDX torna zero? (en-dash dei nomi propri a parte)
- [ ] Ogni approssimazione è dichiarata, ogni fonte linkata?

---

## 5. Diagnosi articoli esistenti

### `hrv-cose-significato-valori`
- Tesi in apertura: NO. Apre con "Hai un Galaxy Watch... e non capisci se è buono o cattivo." Preambolo, non tesi.
- Cornice memorabile: ASSENTE. Nessuna immagine-gancio.
- Gotcha: QUASI ZERO. Tutto enciclopedico. La nota "il confronto tra app non è diretto" è l'unico spunto reale ma è in una lista, non enfatizzato.
- Opinione netta: ASSENTE. "Conta il trend personale" è utile ma non è una posizione.
- TL;DR: ASSENTE.
- Em-dash: da verificare.
- Voce: terza persona distaccata ovunque.

### `come-funziona-health-connect`
- Tesi in apertura: NO. Apre con "Hai un Galaxy Watch... chiedendoti a cosa serve."
- Cornice memorabile: PRESENTE ma sepolta al para 3 ("quadro elettrico"). Va spostata in apertura o al para 2.
- Gotcha: UN BUON UNO. La callout "Samsung Health non scrive su HC di default" è esattamente il tipo di informazione che distingue questo articolo. Va valorizzata di più.
- Opinione netta: ASSENTE.
- TL;DR: ASSENTE.
- Voce: terza persona.

**Priorità di revisione:** aggiungere TL;DR a tutti, spostare la cornice memorabile in apertura dove esiste, riscrivere la prima frase come tesi.
