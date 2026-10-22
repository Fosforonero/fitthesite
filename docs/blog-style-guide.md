# Blog Style Guide: FitMesh Sync

> Riferimento permanente per scrivere e revisionare i post del blog.
> Basato sul framework condiviso da Matteo il 2026-06-08, riconciliato il 2026-10-21
> con gli standard in `.fitmesh/governance/standards/` (`EDITORIAL-CORE.md`,
> `SITE-WRITING.md`, `TRANSLATIONS.md`). Se questa guida e uno standard dicono cose
> diverse, vale lo standard: questa guida non lo allenta mai.
> Non è un invito a riscrivere in massa gli articoli esistenti: si applica a quello
> che si scrive o si modifica da ora.

---

## 1. Struttura

**Rispondi in apertura.** La prima frase risponde alla domanda per cui il lettore è arrivato, o dice il punto dell'articolo. Niente preamboli del tipo "In questo articolo vedremo..." (SITE-WRITING 1 e 10).

**Un'idea guida, se serve.** Una sola immagine o frase che aiuti a ricordare il concetto, in apertura o al secondo paragrafo. Se l'argomento non ne ha bisogno, non inventarla.

**Limiti e casi in cui non funziona.** È la parte di valore: cosa l'articolo non copre, quando il metodo non vale, cosa è stato verificato e cosa no. Va nella stessa sezione dell'affermazione che limita, non in una nota finale (SITE-WRITING 11).

**Una posizione chiara, quando i fatti la sostengono.** Si può dire "questo approccio non funziona su mobile" se c'è una fonte o una prova a cui rimandare. Un giudizio senza prova è un'opinione travestita da fatto (EDITORIAL-CORE 2).

**Leggibile a colpo d'occhio.** Heading che descrivono onestamente la sezione e che, letti in sequenza, mostrano il filo. Paragrafi corti. Grassetto solo per i termini che il lettore deve ritrovare.

**Chiusura utile.** L'articolo finisce con l'ultima informazione utile o con un'azione concreta che il lettore può fare. Un riepilogo non è obbligatorio e, se ripete ciò che è appena stato detto, va tolto (EDITORIAL-CORE 10, SITE-WRITING 10). Un riquadro iniziale "in breve" è legittimo se risponde alla domanda, non se anticipa un riassunto.

**Regola d'oro: layer additivo, non riscrittura.** Non svuotare il contenuto tecnico per renderlo snello. Aggiungi struttura sopra a quello che c'è.

---

## 2. Stile

**Voce chiara, diretta, naturale e rispettosa.** Frasi che una persona direbbe a voce, verbi comuni, una idea per frase. Tecnico e sicuro, senza essere freddo o telegrafico. Il calore è attenzione al lettore, non enfasi commerciale né confidenza artificiale.

**Zero trattini lunghi (—).** Usa virgole, parentesi, due punti o spezza la frase. Gli en-dash nei nomi propri (Kerr–Schild, Samsung–Google) restano (EDITORIAL-CORE 8 e 9).

**Niente parentetiche a panino** del tipo "X, e (grazie a Y) Z". Riscrivile.

**Prima persona solo se vera e documentata.** Si scrive "ho verificato", "abbiamo provato", "in test" soltanto se la prova esiste ed è registrata dove si può controllare, con data e versione. Altrimenti si scrive in forma impersonale o si descrive ciò che il prodotto fa. Mai esperienze, storie, citazioni, valutazioni o misure inventate (SITE-WRITING 13, EDITORIAL-CORE 15).

**Evita i riempitivi**: "è importante notare che", "in conclusione", "nel mondo di oggi", liste di tre aggettivi bilanciati, frasi che riassumono la precedente.

**Varietà di ritmo.** Frasi corte alternate a una più lunga. Non cercare la varietà a costo del significato (EDITORIAL-CORE 1).

---

## 3. Fail loud, never fake (non negoziabile)

Ogni approssimazione dichiarata. Ogni numero reale. Ogni fonte citata o linkata, e mai tolta per "alleggerire" il testo (EDITORIAL-CORE 12, SITE-WRITING 14). Niente metriche, screenshot o claim inventati. Se manca un dato, si dice. L'onestà sui limiti è una firma, non una debolezza.

Affermazioni su privacy, regione dei dati, conformità, scelta o fusione delle fonti, scrittura verso Apple Salute o Health Connect: solo con una voce nel registro dei claim e un approvatore (SITE-WRITING 17, `workflows/CLAIM-REVIEW.md`). Funzioni non uscite: non si nominano (decisione di prodotto del 21/10/2026, più severa di SITE-WRITING 7).

---

## 4. Checklist pre-pubblicazione

- [ ] La prima frase risponde alla domanda o dice il punto?
- [ ] Gli heading, letti da soli, mostrano il filo?
- [ ] I limiti stanno accanto alle affermazioni che limitano?
- [ ] La chiusura è un'informazione utile o un'azione, non un riepilogo ripetuto?
- [ ] Ogni esperienza, prova o misura citata è documentata e verificabile?
- [ ] `grep "—"` sull'articolo torna zero (en-dash dei nomi propri a parte)?
- [ ] Ogni approssimazione è dichiarata e ogni fonte è linkata?
- [ ] Nessuna funzione non uscita nominata, nessuna data futura, nessuna promessa non provata?
- [ ] Nessuna frase su dashboard web, Mesh Famiglia, grafici coach, export dopo la prova?

---

## 5. Storico: diagnosi del 2026-06-08

La diagnosi originale giudicava due articoli con criteri che questa riconciliazione ha tolto come obbligo (riepilogo finale, voce in prima persona, "war-story"). Resta valida solo la parte che riguarda la risposta in apertura e i limiti dichiarati.

### `hrv-cose-significato-valori`
- Apre con "Hai un Galaxy Watch... e non capisci se è buono o cattivo." prima di rispondere: l'apertura va riscritta come risposta.
- La nota "il confronto tra app non è diretto" è l'informazione più utile, ma sta in una lista: va portata accanto all'affermazione che limita.

### `come-funziona-health-connect`
- Apre con "Hai un Galaxy Watch... chiedendoti a cosa serve." prima di rispondere.
- La callout "Samsung Health non scrive su HC di default" è il tipo di informazione che distingue l'articolo: va valorizzata e tenuta verificata.

**Priorità di revisione quando si tocca un articolo:** aprire con la risposta, portare i limiti accanto alle affermazioni, verificare le fonti. Nessuna riscrittura di massa.
