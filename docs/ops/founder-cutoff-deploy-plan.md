# Cutoff Founder: cosa si chiude da solo e cosa richiede un deploy umano

Sprint P0.10E, Fase 5. Cutoff: **2026-07-31T22:00:00Z** = 2026-08-01
00:00:00 Europe/Rome.

## La distinzione che conta

| | Backend (Supabase) | Sito (Vercel, statico) |
|---|---|---|
| Cosa fa | Rifiuta ogni nuovo grant Founder | Smette di presentare Founder come offerta attiva |
| Quando | **All'istante esatto**, da solo | **Solo dopo un deploy umano** |
| Meccanismo | `created_at >= cutoff` valutato ad ogni chiamata | Bundle statico rigenerato al build |
| Serve intervento? | No, una volta applicata la migration | **Sì**, qualcuno deve fare il merge e il deploy |

**Un sito statico non cambia da solo allo scoccare dell'ora.** Le pagine
sono prerenderizzate al build: l'HTML pubblicato il 28 luglio resta
byte-identico il 1 agosto finché non viene ricostruito e ripubblicato.
Questo non è un difetto da aggirare, è come funziona la generazione statica
(ed è ciò che ci fa risparmiare Fluid CPU: nessuna decisione server-side a
runtime).

## Cosa copre già `FounderClientGate` (e cosa no)

`components/founder/FounderClientGate.tsx` mitiga il problema per le
superfici interattive: l'HTML statico contiene **sempre** la variante
evergreen, e la variante Founder appare solo dopo l'hydration, solo se
l'orologio del browser dice che il programma è ancora aperto. Una tab
lasciata aperta a cavallo del cutoff passa a evergreen da sola (un solo
`setTimeout`, mai polling).

Conseguenza pratica: **anche senza deploy, dal 1 agosto header, menu
mobile, footer, card pricing Founder e la pagina /beta smettono di mostrare
la promo attiva a qualunque visitatore con JS attivo.** Verificato a
livello di rendering reale (`npm run founder:cutoff-render-check`, browser
Chromium con orologio iniettato a cutoff-1s / cutoff / cutoff+1s).

Ciò che il gate **non** copre:
- prosa editoriale statica (press kit, blog, landing programmatiche): non
  ha una variante client-side. Mitigata da `lib/founder/historical-note.ts`,
  che però risolve la frase **al momento del build**, quindi dipende anch'essa
  dal deploy;
- crawler e client senza JS: vedono sempre l'HTML statico, cioè la variante
  evergreen. Corretto dopo il cutoff, leggermente conservativo prima (non
  mostrano la promo Founder nemmeno mentre è attiva). Compromesso
  deliberato, preferibile all'inverso;
- `llms.txt`/JSON-LD e ogni altra superficie machine-readable generata al
  build.

## Piano operativo

1. **Ora (prima del 31/07)**: tutto pronto sul branch. Nessun deploy.
2. **Apply migration Founder**: dopo `GO APPLY P0.10` esplicito. Da questo
   momento il backend è già corretto, indipendentemente dal sito: un account
   creato dopo il cutoff non riceve Founder anche se il sito lo sta ancora
   pubblicizzando.
3. **Deploy del bundle "chiuso"**: checkpoint **umano** di Matteo, da
   eseguire in prossimità del cutoff (ragionevolmente il 31/07 sera o il
   01/08 mattina). Un solo merge, un solo deploy produzione, nessun preview.
4. **QA post-deploy**: verifica pubblica su IT/EN che header/footer/menu/
   pricing/beta non presentino più Founder come offerta attiva, e che
   `/beta` risponda `noindex, follow` restando fuori sitemap.

**L'ordine 2 → 3 è quello sicuro.** Backend prima: nel peggiore dei casi il
sito pubblicizza per qualche ora un programma che il backend ha già chiuso
(un utente che si registra riceve il trial invece del Founder). L'ordine
inverso sarebbe peggiore: sito che dice "chiuso" mentre il backend continua
a concedere posti.

## Cosa NON fare

- **Niente `force-dynamic`** su homepage o /beta per "far cambiare la pagina
  da sola": annullerebbe il risparmio Fluid CPU di P0.9 e reintrodurrebbe
  una decisione server-side a ogni richiesta. Il guardrail
  `founder:window-check` fallisce se ricompare.
- **Niente chiamata di rete** per decidere lo stato: il gate legge solo
  l'orologio del browser, zero richieste. Verificato da
  `FounderClientGate.test.tsx` (nessun `fetch`) e dal guardrail.
- **Niente ISR/revalidate a tempo** su queste pagine per inseguire il
  cutoff: stesso problema di costo, e comunque non garantirebbe l'istante
  esatto.
- **Nessun commit vuoto o redeploy** per "rinfrescare" il sito: se serve
  ripubblicare, si ripubblica il deployment esistente dalla dashboard.
