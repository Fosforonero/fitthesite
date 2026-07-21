# SPRINT P1.1 - report di consegna (Fase 13, aggiornato da P1.1B + P1.1C + P1.1D)

Stato: pronto per revisione. Nessun push, nessuna PR, nessun deploy, nessun comando
Vercel, nessuna modifica Supabase eseguita da questa sessione (le uniche azioni DB
dell'intero sprint sono state HUMAN_ONLY, eseguite e verificate da Matteo - vedi
sezione "Incidente Founder" sotto). Questo file descrive il codice così com'è al
momento dell'amend che lo include: l'hash finale è quello del commit di amend
(assegnato da git al commit, non prevedibile prima - comunicato nel report di
consegna in chat, non riscrivibile qui senza un secondo commit).

Questo documento è il report canonico, riscritto tre volte dopo la consegna
originale (Fase 13): **P1.1B** (release hardening: accessibilità reale, errori
bloccanti, reduced-motion, KaTeX fail-closed, toolchain pnpm deterministico),
**P1.1C** (riconciliazione: contenuto CSV letto realmente, selettore risultati
deterministico, correzione terminologica sull'ambiente di verifica) e **P1.1D**
(internal linking Labs zero-redirect: nav diretta su 15 locale, link
tool↔articolo con slug reale, nuovo guardrail dedicato). Tutto quanto descritto
qui è integrato in un unico commit locale, nessuno step intermedio.

## Cosa consegna questo sprint

1. **Founder hardening (Fase 0)**: chiusura automatica programma Founder
   (`FOUNDER_END_AT` SSOT, homepage statica invariata, `/beta` unica pagina
   force-dynamic, guardrail dedicato) + rimozione claim "sync continuo" non
   qualificati.
2. **Fondamenta bilingue**: registry Labs esteso, hreflang IT/EN/x-default corretto
   (x-default → EN, non IT come il resto del sito).
3. **Sleep Efficiency Calculator**: secondo tool live, motore di calcolo puro con
   validazione a due livelli (avviso per valori insoliti-ma-possibili, errore
   bloccante per valori fisiologicamente/matematicamente impossibili - P1.1B Fase
   3), oracle Python indipendente, UI modalità semplice E avanzata (entrambe
   IT/EN, entrambe accessibili via tastiera con nomi contestuali), contenuto IT/EN
   completo.
4. **Retrofit HRV**: grafici SVG (RR/differenze successive), rilevamento outlier
   fisiologicamente implausibili, condivisione risultati, formule KaTeX reali
   (fail-closed, vedi sotto), esportazione CSV corretta strutturalmente (P1.1C).
5. **Recovery Content Cluster**: pillar + articolo Sleep Efficiency, cross-link con
   l'articolo HRV esistente.
6. **KaTeX server-side, fail-closed**: zero JS lato client per le formule, CSS
   scoped solo a `/labs/**`, `throwOnError: true` - una formula LaTeX malformata
   deve far fallire test/build in modo rumoroso, mai produrre silenziosamente un
   elemento `.katex-error` in produzione (P1.1B Fase 5).
7. **Accessibilità reale, verificata su Chromium e WebKit** (P1.1B Fase 1/2, vedi
   sezione dedicata sotto): nomi accessibili contestuali su ogni campo (mai
   generici/duplicati), semantica radio nativa per il selettore modalità,
   percorso di errore bloccante mai silenzioso, percorso da tastiera che
   attraversa deterministicamente tutti i controlli del calcolatore.
8. **`prefers-reduced-motion` rispettato** su tutti e 4 gli elementi con
   animazione infinita del sito (non solo Labs), verificato su tutte e 4 le
   pagine Labs (P1.1B Fase 4, vedi sezione dedicata).
9. **Toolchain pnpm deterministico**: un solo lockfile operativo, versione pnpm
   fissata, installazione riproducibile a lockfile congelato (P1.1B Fase 6, vedi
   nota toolchain sotto).
10. **Contenuto dei file scaricati (CSV) verificato realmente**, non solo
    l'esistenza di un blob URL: intestazione, righe, struttura, coerenza col
    risultato mostrato in UI (P1.1C Fase 2, vedi sezione Privacy).
11. **Incidente Founder trigger** (fuori scope originale, gestito in parallelo):
    trigger di produzione perso e ripristinato - vedi sezione dedicata.
12. **Internal linking Labs zero-redirect** (P1.1D): il link "Labs" in
    Header/MobileMenu risolve direttamente `/it/labs` o `/en/labs` su tutte e
    15 le locale del sito (mai un hop di redirect generato dalla navigazione
    stessa); il link editoriale calcolatore HRV → articolo usa lo slug EN
    reale (prima puntava allo slug IT anche in inglese); nuovo guardrail
    `labs:internal-linking-check` (42 URL verificate) - vedi sezione dedicata.

## Formule e fonti (IT/EN)

- **RMSSD**: `lib/labs/hrv/rmssd-math.ts` - root-mean-square delle differenze
  successive tra intervalli RR consecutivi. Fonte: Shaffer & Ginsberg 2017
  (Frontiers in Public Health), citata in `lib/labs/hrv/content.ts`.
- **Efficienza del sonno**: `lib/labs/sleep-efficiency/math.ts` - `tempo totale di sonno / tempo a letto × 100`. Fonti: AASM scoring manual,
  Buysse et al. 1989 (PSQI), citate in `lib/labs/sleep-efficiency/content.ts`.
- Entrambe le formule sono rese via KaTeX (`components/labs/math/`), stringhe LaTeX
  costanti nel codice sorgente (verificato dal guardrail `labs:katex-input-check`,
  304 file scansionati, zero input utente rilevato nell'espressione).
- **KaTeX fail-closed (P1.1B Fase 5)**: `lib/labs/katex/render.ts` usa
  `throwOnError: true` - una formula malformata lancia, non produce mai
  silenziosamente un elemento `.katex-error` visibile in produzione. Il nuovo
  guardrail `pnpm run labs:formulas-render-check`
  (`tools/check-labs-formulas-render.ts`) enumera e renderizza **tutte e 10** le
  formule reali usate dai due calcolatori (4 HRV + 6 Sleep Efficiency, importate
  dalle stesse costanti esportate dal codice sorgente, mai fixture scritte a
  mano) e verifica che ognuna produca sia HTML sia albero MathML, senza errori.

## Oracle Python (Fase 7/12, numeri aggiornati P1.1B Fase 3)

`bash tools/run-labs-oracle-check.sh`: 24 vettori HRV + 28 vettori Sleep
Efficiency validi, generati dal TypeScript reale (non da fixture scritte a mano)
e confrontati con un'implementazione Python indipendente scritta da zero -
**concordanza entro 1e-6 su tutti i 52 vettori di calcolo**.

A questi si aggiungono **15 vettori di errore atteso** (P1.1B Fase 3): input
deliberatamente impossibili (sonno > tempo a letto in modalità semplice, latenza
+ WASO + veglia finale > tempo a letto in modalità avanzata - inclusi 10 casi
pseudo-casuali ma deterministici, seed fisso). Per questi, l'oracle non confronta
un valore calcolato (non esiste: l'input è bloccato) ma il **codice d'errore**
che TypeScript riporta con una classificazione Python scritta in modo
indipendente (`scripts/oracle/sleep_efficiency_oracle.py::classify_expected_error`)
- prova che le due implementazioni concordano su COSA sia impossibile, non solo
su come calcolare ciò che è possibile. Tutti e 15 concordano.

## Validazione a due livelli: avviso vs errore bloccante (P1.1B Fase 3)

Prima di P1.1B, alcuni input fisiologicamente/matematicamente impossibili (sonno
totale maggiore del tempo a letto; somma di latenza+WASO+veglia finale maggiore
del tempo a letto) producevano solo un **avviso** non bloccante, mostrando
comunque un risultato numerico (potenzialmente <0% o >100%). Ora sono **errori
bloccanti** (`SLEEP_EXCEEDS_TIME_IN_BED`, `NEGATIVE_DERIVED_SLEEP_TIME`, e un
controllo finale difensivo `EFFICIENCY_OUT_OF_RANGE` nel motore di calcolo
stesso): nessun risultato, nessun grafico, nessun copia/CSV, un messaggio IT/EN
comprensibile che indica quale campo correggere. Restano avvisi non bloccanti
solo i casi genuinamente insoliti-ma-possibili (tempo a letto molto corto o molto
lungo). Anche i campi grezzi ore/minuti fuori dai limiti dichiarati (minuti
0-59, ore 0-23/1-12) sono ora un errore bloccante esplicito
(`MINUTES_OUT_OF_RANGE`/`TIME_OUT_OF_RANGE`), mai una normalizzazione silenziosa.
Coperto da 39 test in `lib/labs/sleep-efficiency/math.test.ts` (inclusi i casi
limite: 100% esatto, 0% esatto, TST=0 al limite del TIB - mai un falso
`EFFICIENCY_OUT_OF_RANGE`) e dai 15 vettori d'errore dell'oracle sopra.

## Privacy (Fase 8, esteso P1.1B Fase 7 e P1.1C Fase 2)

`pnpm run labs:privacy-check` contro le **6 combinazioni** tool×locale×modalità
live: HRV it/en, Sleep Efficiency modalità **semplice** it/en, Sleep Efficiency
modalità **avanzata** it/en (non più solo 4 - la modalità avanzata introduce
campi/interazioni diversi, es. il selettore radio-as-pill, verificati
separatamente). Valori-marcatore fisiologicamente impossibili e univoci per
target, matching a **confine di parola** (`\b`) sulle richieste di rete post-load
(non substring semplice: un marker breve può comparire per puro caso dentro un ID
numerico più lungo generato da un tool di terze parti - trovato un vero falso
positivo in P1.1B Fase 7, un marker di 4 cifre dentro un parametro GA4 `tag_exp`,
risolto strutturalmente col confine di parola, non scegliendo un numero "più
fortunato"). **Zero esfiltrazione**: nessuna richiesta di rete post-load contiene
un valore marcatore, l'URL della pagina non cambia mai durante l'interazione,
zero errori console reali (esclusi i noti falsi positivi CSP report-only).

**P1.1C Fase 2 - contenuto del CSV letto realmente**: il controllo precedente si
fermava a "il download usa un blob: URL locale" - non leggeva mai cosa contenesse
il file. Ora, per tutte e 6 le combinazioni, il guardrail cattura l'evento
Download di Playwright, legge il contenuto reale via
`download.createReadStream()`, e verifica: nome file esatto (`fitmesh-labs-hrv-
rmssd.csv` / `sleep-efficiency.csv`), estensione `.csv`, riga di intestazione
esatta, numero di righe dati atteso, **struttura di ogni riga** (numero di
colonne atteso - un valore numerico con una virgola delle migliaia non gestita
spezzerebbe silenziosamente questo conteggio), ed etichette di riga nell'ordine
atteso. Il valore della riga primaria (`rmssd` per HRV, `sleepEfficiencyPercent`
per Sleep Efficiency) è confrontato con il risultato numerico mostrato nella UI
nella stessa sessione (stesso calcolo, tolleranza di arrotondamento - UI e CSV
usano precisioni decimali diverse per lo stesso numero, non devono essere
identici carattere per carattere). Un CSV vuoto, con intestazione sbagliata, un
numero di righe sbagliato, una struttura corrotta, o un valore che diverge dalla
UI: il test fallisce (verificato: vedi "Correzione CSV HRV" sotto).

**Correzione CSV HRV trovata durante questa Fase**: l'esportazione CSV di HRV
(`components/labs/HrvRmssdCalculator.tsx::downloadCsv`) usava `formatNumber`
(`toLocaleString`, con separatore delle migliaia) per i valori numerici. Per
qualunque durata totale ≥1000 secondi (~16.7 minuti - una registrazione HRV
comune) o media RR ≥1000ms (frequenza cardiaca a riposo ≤60bpm - comune),
`toLocaleString` inserisce una virgola non quotata dentro il valore (es.
"1,234.567"), che qualunque parser CSV standard interpreta come DUE colonne,
spezzando silenziosamente la struttura del file per utenti reali, non solo per i
marker artificialmente grandi di questo test. Corretto: i valori CSV ora usano
`toFixed()` (mai virgole), la UI a schermo continua a usare `formatNumber` per la
leggibilità. Verificato in isolamento (non solo via il guardrail end-to-end):
uno script standalone alimenta la stessa logica di parsing con un CSV sintetico
che riproduce il vecchio bug (virgola nel valore `rmssd`) e con l'equivalente
corretto (`toFixed`) - il primo viene correttamente rilevato come corrotto (4
colonne invece di 3), il secondo passa pulito. Non è stato eseguito un
rebuild-revert-rebuild completo del codice precedente (costo/beneficio: la
correzione è meccanica e la garanzia che `toFixed()` non inserisca mai un
separatore delle migliaia è una proprietà della specifica del linguaggio, non
qualcosa da ri-dimostrare empiricamente).

**Clipboard**: click su "Copia risultati" verificato con lo stesso confronto
tollerante (valore numerico primario mostrato in UI presente nel clipboard,
entro la stessa tolleranza di arrotondamento), non più un pattern testuale
generico.

## Accessibilità (Fase 8/12, riscritta P1.1B Fase 1/2, selettore risultati P1.1C Fase 3)

`pnpm run labs:a11y-check`: **4 pagine × 2 motori (Chromium e WebKit) = 8
combinazioni, 0 problemi** su tutte.

Il guardrail precedente (Fase 8/12) copriva solo la modalità semplice di Sleep
Efficiency e simulava 8 Tab da un punto imprecisato della pagina (poteva
percorrere la navigazione globale invece del calcolatore). **P1.1B Fase 1+2** lo
ha riscritto insieme al componente:

- ogni campo del calcolatore (incluse le coppie ore/minuti, prima con
  `aria-label` generici e duplicati come "ore"/"minuti" ripetuti su 5 coppie
  diverse) ha ora un nome accessibile **contestuale e univoco** (es. "Ore del
  tempo totale a letto" vs "Ore del tempo totale dormito"), via `id`+`htmlFor`
  o `fieldset`+`legend`;
- il selettore modalità (semplice/avanzata) usa **radio input nativi** condivisi
  dallo stesso `name`, dentro un `fieldset`+`legend` (mai una reimplementazione
  ARIA custom con `role="radio"` su bottoni, che richiederebbe roving tabindex
  scritto a mano);
- i campi latenza/WASO/veglia finale (prima senza alcuna associazione label)
  hanno ora `<label htmlFor>` espliciti;
- il percorso da tastiera è ancorato al primo controllo REALE del calcolatore
  (mai un Tab-walk alla cieca dalla cima della pagina) e attraversa
  **deterministicamente tutti** i controlli visibili (non solo i primi 8),
  contando correttamente un gruppo di radio con lo stesso `name` come **un solo**
  tab-stop (comportamento nativo reale del browser - un conteggio ingenuo per
  singolo elemento avrebbe prodotto falsi "uscito dal calcolatore" anche su
  markup corretto, bug trovato e corretto durante l'auto-verifica di questa
  fase);
- verificato che ogni nome accessibile sia non solo non-vuoto ma anche **non
  duplicato/ambiguo** all'interno dello stesso gruppo di controlli;
- copre esplicitamente **entrambe le modalità** di Sleep Efficiency, per
  **entrambe le lingue**;
- gira su **Chromium e WebKit**, non solo Chromium.

**Auto-verifica eseguita** (requisito esplicito P1.1B: "il test deve fallire con
il codice precedente e passare soltanto dopo il fix"): il componente e il
guardrail precedenti (versione committata pre-P1.1B) sono stati ripristinati
temporaneamente e testati contro il NUOVO guardrail - fallisce con 20 problemi
itemizzati (10 per motore: semantica radio nativa assente, input impossibile che
mostra comunque un risultato, bottone copia visibile senza risultato valido) su
Chromium e WebKit. Ripristinato il codice corretto: 0 problemi su entrambi.

**P1.1C Fase 3**: l'ultimo controllo non deterministico rimasto - la prova che un
calcolo fosse avvenuto si basava in parte su un pattern testuale generico
(`text=/%/` dentro il container, nel percorso di errore bloccante) - è stato
sostituito da un selettore stabile e dedicato:
`data-testid="labs-calculation-results"` per la regione risultati,
`data-testid="labs-result-value"` per il valore numerico primario (RMSSD per
HRV, percentuale di efficienza per Sleep Efficiency), aggiunti direttamente nei
due componenti. Il guardrail ora verifica esplicitamente, per ogni pagina e per
entrambe le modalità di Sleep Efficiency: con dati validi la regione è presente,
visibile, contiene un valore numerico riconoscibile, e i bottoni copia/CSV sono
visibili; con un input impossibile la regione **non esiste affatto** nel DOM (non
solo "priva del simbolo %" - un risultato parziale o mal formattato sarebbe
comunque passato il vecchio controllo testuale) e i bottoni copia/CSV sono
assenti. Stesso selettore riusato dal guardrail privacy (sopra) per individuare
il risultato da confrontare col CSV.

### Matrice accessibilità (P1.1B + P1.1C, verificata live)

| Combinazione | Chromium | WebKit |
|---|---|---|
| HRV - it | ✅ | ✅ |
| HRV - en | ✅ | ✅ |
| Sleep Efficiency semplice - it | ✅ | ✅ |
| Sleep Efficiency semplice - en | ✅ | ✅ |
| Sleep Efficiency avanzata - it | ✅ | ✅ |
| Sleep Efficiency avanzata - en | ✅ | ✅ |
| Percorso errore bloccante (semplice) - it/en | ✅ | ✅ |

## `prefers-reduced-motion` (P1.1B Fase 4, risolto)

Il sito ha **4 elementi con animazione infinita** (`animate-pulse`/`animate-ping`
Tailwind) che non rispettavano `prefers-reduced-motion: reduce`, tutti
site-wide, non specifici di Labs: il badge pulsante "Beta" in
`components/Header.tsx`, lo status pill "All systems operational" (ring + dot,
due elementi) in `components/Footer.tsx`, un pulse nell'anello attorno al
monogramma provider in `app/.../sync/[provider]/page.tsx`. Nessun componente
Labs (`HrvCharts.tsx`, `SleepEfficiencyCalculator.tsx`, `FormulaCard.tsx` ecc.)
usa `animate-pulse`/`animate-ping`.

**Corretto**: `motion-reduce:animate-none` aggiunto a tutti e 4 gli elementi
(Header.tsx, Footer.tsx ×2, sync/[provider]/page.tsx). `labs:cross-browser-check`
esteso da 2 pagine campione a **tutte e 4** le pagine Labs (HRV it/en, Sleep
Efficiency it/en), verificato su Chromium con `reducedMotion: "reduce"`: **zero
animazioni infinite effettive nel DOM renderizzato**, su tutte e 4 le pagine.

**Perché il report di consegna P1.1 originale mostrava questa riga come ✅
nonostante il finding fosse già reale**: lo script del guardrail era già
corretto e falliva (exit 1) su quel run, con i 3 finding (allora 3, non 4 - il
quarto, sync/[provider], è stato scoperto quando la Fase 4 ha esteso la
copertura a tutte le pagine). L'incoerenza era nel report stesso, che aveva
etichettato la riga `labs:cross-browser-check` con un ✅ pur descrivendo il
finding reale accanto ("fuori scope, non bloccante"): un lettore del solo elenco
a colpo d'occhio leggeva "verde" invece di "trovato un problema, giudicato non
bloccante". Corretto qui: la riga ora riflette lo stato reale (✅ genuino, non
un finding declassato silenziosamente a verde).

## Toolchain: pnpm deterministico (P1.1B Fase 6)

- **Un solo lockfile operativo**: `package-lock.json` non è più nel repository
  (era stato generato da un `npm install --legacy-peer-deps` mai usato in
  produzione - rimosso con `git rm --cached`, aggiunto a `.gitignore`). L'unico
  consumatore di un lockfile è Vercel (`installCommand`); l'unico workflow
  GitHub Actions del repo (`fcm-sync-trigger.yml`) è un trigger cron via curl
  senza step di installazione - nessun consumatore npm reale da preservare.
- **Versione pnpm fissata**: `"packageManager": "pnpm@11.15.0"` in
  `package.json`. Prima di questa fissazione, `corepack enable` senza un
  `packageManager` pinnato risolveva "l'ultima versione disponibile" ad ogni
  invocazione - osservato uno slittamento reale da 11.14.0 a 11.15.0 nella
  stessa sessione di lavoro.
- **Installazione a lockfile congelato**: `vercel.json` →
  `"installCommand": "pnpm install --frozen-lockfile"` (prima:
  `--no-frozen-lockfile`, che avrebbe silenziosamente accettato un lockfile
  disallineato). Verificato da checkout pulito: `rm -rf node_modules` seguito da
  `pnpm install --frozen-lockfile` con la versione pnpm pinnata completa senza
  errori (rieseguito anche in questa Fase P1.1C, vedi "Verifica completa"
  sotto).
- `@types/katex` spostato da `dependencies` a `devDependencies` (è un pacchetto
  di soli tipi, mai richiesto a runtime).

## Performance (Fase 11, `labs:perf-check`)

Misurato via Playwright/Chromium contro un **server Next locale in modalità
production, avviato in Docker con `next start`** (non un CDN edge reale: proxy
della sola spesa lato client, non delle condizioni di rete reali). Numeri
misurati in P1.1B Fase 7 - il codice del percorso di rendering non è cambiato in
P1.1C (`tools/check-labs-performance.ts` ha ricevuto solo una correzione
cosmetica, nessuna modifica di logica), non rimisurato in questa Fase:

| Pagina | LCP | CLS | Interazione (click→repaint) |
|---|---|---|---|
| it/calcolatore-hrv-rmssd | 460ms | 0.000 | 121.5ms |
| en/hrv-rmssd-calculator | 264ms | 0.000 | 60.4ms |
| it/calcolatore-efficienza-sonno | 216ms | 0.000 | 53.6ms |
| en/sleep-efficiency-calculator | 144ms | 0.000 | 58.8ms |

Target (LCP<2000ms, CLS<0.05, interazione<150ms): **rispettati con ampio margine
su tutte e 4**, alla data della misurazione. Bundle: nessuna libreria di grafici
nelle dipendenze (grafici SVG puri), CSS KaTeX importato una sola volta
(`app/.../labs/layout.tsx`), homepage resta `●` statica nel build (nessuna nuova
Vercel Function).

## Cross-browser (Fase 12, esteso P1.1B Fase 4, `labs:cross-browser-check`)

Chromium + WebKit, viewport desktop/390px/320px, **tutte e 4 le pagine Labs**
(non più solo 2 campione): **zero overflow orizzontale, zero errori console** su
tutte le combinazioni, verificato contro il server Next locale in modalità
production descritto sopra. Il sito ha un solo tema (scuro fisso, nessun toggle
light/dark verificato via grep - nessun `prefers-color-scheme`/`ThemeToggle` nel
codice), quindi non esiste un "dark mode" da alternare oltre a quello già
verificato. `prefers-reduced-motion`: risolto, vedi sezione dedicata sopra.

## JSON-LD (Fase 10, verificato live in questa Fase)

- `/it/labs` e `/en/labs`: `CollectionPage` con `mainEntity.ItemList` popolato
  dai soli tool live, verificato via curl+parse contro il server locale in
  modalità production: entrambi gli strumenti presenti, URL e nome corretti.
- OG image dedicate: le due immagini differiscono per contenuto (titolo
  corretto per tool richiesto, non più hardcoded su HRV).

## Sitemap e hreflang (Fase 12, verificato live in questa Fase)

`sitemap.xml` contiene esattamente le 6 URL Labs attese (2 index + 4 tool),
ciascuna con alternate `it`/`en`/`x-default` - `x-default` punta sempre a `en`,
nessuna delle altre 13 lingue del sito compare per le route Labs (per design:
Labs è solo it/en). Verificato contro il server locale in modalità production.

## Route matrix (Fase 12, verificato live in questa Fase)

| Richiesta | Atteso | Osservato |
|---|---|---|
| `/de/labs` (locale non supportata) | 307 → `/en/labs` | ✅ 307, Location: `/en/labs` |
| `/it/labs/hrv-rmssd-calculator` (slug EN sotto IT) | 404 | ✅ 404 |
| `/en/labs/calcolatore-hrv-rmssd` (slug IT sotto EN) | 404 | ✅ 404 |
| `/it/labs`, `/en/labs` | 200 | ✅ 200 |

Verificato via curl contro il server Next locale in modalità production
(Docker, `next start`) - non contro Vercel/produzione pubblica.

## Mappa internal linking

- Header/MobileMenu: voce "Labs" dopo "Blog" (tutte le pagine del sito), link
  **diretto** su tutte e 15 le locale dal P1.1D (vedi sezione dedicata sotto).
- Homepage: sezione Labs statica (2 card) tra Integrazioni e Privacy.
- Blog index: callout editoriale verso Labs nell'hero.
- Pillar `metriche-recupero-hrv-sonno-frequenza-cardiaca` (nuovo) ↔ articolo
  `hrv-cose-significato-valori` (esistente, aggiornato) ↔ articolo
  `efficienza-del-sonno-formula-calcolo` (nuovo) ↔ `tracciare-sonno-anello`
  (esistente): tutti e 4 collegati tramite il campo `related`, grafo
  completamente connesso.
- Pagina tool HRV → articolo pillar recovery + link diretto all'articolo
  `hrv-cose-significato-valori` (slug risolto correttamente per lingua dal
  P1.1D, vedi sotto - prima puntava allo slug IT anche in EN).
- Pagina tool Sleep Efficiency → articolo `efficienza-del-sonno-formula-calcolo` +
  pillar recovery.

## Internal linking Labs: zero-redirect (P1.1D)

**Problema trovato**: `components/Header.tsx` e `components/MobileMenu.tsx`
generavano il link "Labs" come `/${locale}/labs` per QUALUNQUE locale del sito
(15 in totale). Labs esiste solo in it/en (`resolveLabsLocale`, già usato dal
redirect server-side delle pagine `/labs/*`): per le altre 13 locale (es, de,
pt, fr, pl, tr, nl, ja, ko, sv, da, no, fi) il link nella navigazione puntava a
un URL come `/de/labs` che la pagina stessa reindirizza con un 307 verso
`/en/labs` - un hop di redirect inutile generato dal sito stesso, non da un
link esterno. **Corretto**: entrambi i componenti ora calcolano
`resolveLabsLocale(locale)` (la stessa funzione già usata dal redirect
server-side, non una nuova logica) prima di costruire l'href - il link generato
punta sempre direttamente a `/it/labs` o `/en/labs`, mai a un URL che richiede
un ulteriore salto.

**Secondo problema trovato**: il link editoriale dalla pagina del calcolatore
HRV al suo articolo (`components/labs/pages/HrvToolPageBody.tsx`) puntava
allo slug **IT** (`hrv-cose-significato-valori`) anche quando la pagina era in
inglese, invece di risolvere lo slug EN reale dal sistema di localizzazione
del blog (`lib/blog/slugs.ts`: lo slug EN vero è `what-is-hrv-meaning-values`,
non una traduzione letterale ovvia del canonico). La pagina Sleep Efficiency
equivalente usava già correttamente lo slug per-lingua (verificato contro
`lib/blog/slugs.ts`: corretto). Corretto usando lo stesso resolver del
sistema blog (`localizedBlogSlug`, `lib/blog/slug-i18n.ts`) invece di un nuovo
slug scritto a mano, per eliminare strutturalmente questa classe di bug (uno
slug hardcoded sbagliato non verrebbe rilevato da un typecheck, solo da un
guardrail live o da un utente che clicca un link rotto).

**Nuovo guardrail**: `pnpm run labs:internal-linking-check`
(`tools/check-labs-internal-linking.ts`), contro un server Next locale in
modalità production (Docker, `next start`) - **42 URL verificate, tutte con lo
status atteso**:

| Categoria | Sorgenti verificate | Status atteso | Esito |
|---|---|---|---|
| Nav Labs (Header + MobileMenu) | tutte le 15 locale | 200 diretto (mai 3xx) | ✅ 15/15 |
| Tool → articolo/pillar/tool-correlato | HRV + Sleep, it/en | 200 diretto, link presente nell'HTML | ✅ 10/10 |
| Slug incrociato (EN sotto /it, IT sotto /en) | HRV + Sleep, entrambe le direzioni | 404 | ✅ 4/4 |
| Fallback esterno (richiesta diretta, non generata dal sito) | 13 locale non supportate da Labs | 307 → `/en/labs` | ✅ 13/13 |

Distinzione esplicita che il guardrail impone strutturalmente (categorie
separate, mai confuse in un unico controllo): un **link interno** (generato
dalla navigazione o dal contenuto del sito stesso) deve risolvere 200
DIRETTO, zero hop - se un utente lo clicca da una pagina FitMesh, non deve mai
attraversare un redirect. Un **fallback esterno** (qualcuno digita/salva
`/de/labs` da solo, o arriva da un vecchio link) continua legittimamente a
fare 307 verso `/en/labs`: non è una regressione se continua a esistere,
lo sarebbe se sparisse - il guardrail verifica ENTRAMBE le proprietà
esplicitamente, non solo una delle due.

**Comportamento delle 15 locale** (nav Labs): `it` → `/it/labs` (diretto); le
altre 14 (`en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da, no, fi`) →
`/en/labs` (diretto - **non** più `/${locale}/labs` seguito da un redirect).

**Auto-verifica**: la correzione è un cambio meccanico di una riga per
componente (riuso di `resolveLabsLocale`, una funzione pura già in produzione
per il redirect server-side delle pagine Labs, non nuova logica scritta per
questo sprint) - non è stato eseguito un ciclo completo di
revert-rebuild-riverifica del codice precedente (costo/beneficio: il fix è
banalmente ispezionabile a occhio, e la funzione riusata era già provata
corretta dai controlli route-matrix di P1.1B/C). La prova di correttezza qui è
empirica end-to-end su tutte e 15 le locale reali (sopra), non solo un test
unitario sintetico.

## Verifica completa (P1.1D Fase 4, interamente in Docker/pnpm, tutta rieseguita in sequenza)

```
✅ pnpm install --frozen-lockfile (da checkout pulito, pnpm@11.15.0 pinnato)
✅ tsc --noEmit
✅ vitest run - 160/160 test (9 file: rmssd-math [31], program-window [9],
   monitor [14], founder-window-copy [13], sleep-efficiency/math [39],
   locale-negotiation [18], sync/schema [13], LabsJsonLd [6], katex/render [17])
✅ founder:counter-check
✅ founder:window-check
✅ seo:truth-check
✅ labs:truth-check
✅ labs:katex-input-check
✅ content:no-continuous-sync-check
✅ labs:oracle-gen + scripts/oracle/compare.py (24 HRV + 28 Sleep Efficiency
   validi entro 1e-6, + 15 vettori di errore atteso concordanti)
✅ labs:formulas-render-check (10 formule: 4 HRV + 6 Sleep Efficiency, HTML+
   MathML su tutte, throwOnError:true)
✅ pnpm run build (produzione, pnpm - non npm; 3650 pagine generate)
✅ labs:privacy-check (6/6 combinazioni tool×locale×modalità, contro il server
   locale in modalità production avviato con `next start` - CSV letto e
   verificato realmente, non solo l'URL blob:)
✅ labs:a11y-check (4 pagine × 2 motori Chromium/WebKit = 8/8 combinazioni,
   contro lo stesso server locale in modalità production)
✅ labs:cross-browser-check (4 pagine × Chromium+WebKit × 3 viewport, contro lo
   stesso server locale in modalità production - reduced-motion genuinamente
   verde su tutti e 4 gli elementi)
✅ labs:internal-linking-check (NUOVO, P1.1D: 42 URL verificate - 15 locale nav
   diretta, 10 relazioni tool↔articolo↔pillar↔tool-correlato, 4 slug incrociati
   404, 13 fallback esterni ancora 307 - contro lo stesso server locale in
   modalità production)
✅ route matrix / sitemap / hreflang / JSON-LD verificati via curl contro lo
   stesso server locale in modalità production (mai contro Vercel/produzione
   pubblica)
✅ git diff --check (nessun conflitto residuo, nessun whitespace error)
```

**Nota terminologica**: ovunque in questo report "server di produzione" indica
un **server Next locale in modalità production, avviato in Docker con
`next start`** contro un build locale - mai il deployment pubblico Vercel, che
questa sessione non ha mai toccato (nessun comando Vercel eseguito, nessun
deployment innescato).

## Correzioni P1.1C (riepilogo prima/dopo)

| Area | Prima (P1.1B) | Dopo (P1.1C) |
|---|---|---|
| Report canonico | Descriveva lo stato pre-P1.1B (130 test, reduced-motion aperto, package-lock.json "ripristinato", nessuna menzione di P1.1B) | Riscritto per descrivere il codice attuale (questo file) |
| Contenuto CSV | Verificato solo `download.url().startsWith("blob:")` | Letto realmente via `createReadStream()`: nome file, intestazione, righe, struttura, valore coerente con la UI |
| CSV HRV | Poteva corrompersi (virgola delle migliaia non gestita) per durate/medie ≥1000 | `toFixed()`, mai virgole, corretto alla fonte |
| Prova "calcolo avvenuto" | Pattern testuale (`resultProbe`/`text=/%/`) potenzialmente ambiguo con copy editoriale | `data-testid="labs-calculation-results"`/`"labs-result-value"`, deterministico |
| Terminologia ambiente | Rischio di lettura come "produzione reale/Vercel" | Esplicitamente "server Next locale in modalità production (Docker, `next start`)" ovunque |

## Correzioni P1.1D (riepilogo prima/dopo)

| Area | Prima (P1.1C) | Dopo (P1.1D) |
|---|---|---|
| Nav Labs (Header/MobileMenu) | `/${locale}/labs` per tutte le 15 locale - 307 verso `/en/labs` per le 13 non supportate, generato dal sito stesso | `resolveLabsLocale(locale)` - link diretto `/it/labs` o `/en/labs`, zero hop |
| Link tool HRV → articolo | Slug IT hardcoded anche in EN (`hrv-cose-significato-valori` sotto `/en/blog/`) | `localizedBlogSlug()`, slug EN reale (`what-is-hrv-meaning-values`) |
| Copertura guardrail | Route matrix verificata manualmente (curl ad hoc), nessun controllo automatico sui link generati dalla nav | `labs:internal-linking-check`: 42 URL, 15 locale, ripetibile |

## Incidente Founder trigger (fuori scope originale, HUMAN_ONLY)

Il 18/07 è emerso che il trigger `on_profile_created_founder` era assente in
produzione dal 15/07 (zero grant Founder per 3 giorni, causa quasi certa: un
`DROP FUNCTION ... CASCADE` durante un fix non versionato del 14/07). Gestito in
parallelo a questo sprint, cronologia completa in
`docs/architecture/incident-2026-07-18-founder-trigger-loss.md`:

- Migrazione di ripristino preparata, **eseguita da Matteo** (HUMAN_ONLY), trigger
  confermato presente/enabled, account QA positivo verificato (`pro`/`founder-launch`),
  caso `.invalid` negativo confermato, cap e hash dei ruoli preesistenti verificati
  invariati.
- Monitor di rilevamento (`lib/founder/monitor.ts`, 14 test) integrato nel cron
  Vercel esistente `beta-welcome-emails` - nessun nuovo cron (Hobby già al limite
  di 2/progetto), nessuna nuova tabella Supabase, nessun secret nuovo nel database.
  **Azione residua prima del prossimo deploy**: configurare `FOUNDER_ALERT_EMAIL`
  su Vercel Production (documentato in `.env.example`, non versionato in questo
  commit - un content-scanner locale lo blocca su un placeholder Firebase
  preesistente non correlato, da chiarire separatamente).
- `lib/founder/program-window.ts` (SSOT `FOUNDER_END_AT`) riconciliato: la versione
  di questo branch (più ricca - `FOUNDER_END_AT_MS`, `formatFounderEndDate`) è
  quella canonica, l'hotfix vi si aggancia senza duplicare il timestamp
  (verificato dal guardrail `founder:window-check`: 313 file scansionati, nessun
  timestamp divergente).

**Importante - cosa questo incidente NON risolve**: `lib/product-facts.ts`
(`founderAutoGrant.status`) resta `pending_production_verification`, **non
modificato**. L'incidente riguardava l'assenza totale del trigger (zero grant);
il gate di merge esplicito verso `main` (commit `67014c5`) riguarda un requisito
diverso e più ampio, ancora aperto: il trigger oggi conosce solo il cap numerico
(1000 posti), non la scadenza calendariale `FOUNDER_END_AT` - il rifiuto dei nuovi
grant Founder esattamente da quell'istante in poi non è implementato lato
database (è il soggetto di `SPRINT-founder-chiusura.md`, Fase 1B, non ancora
scritta in nessun branch). Risolvere l'incidente di oggi non soddisfa quel gate:
restano aperti gli stessi 5 punti elencati nel commit `67014c5`, il merge di
questo branch su `main` resta non autorizzato finché Build 189 non li conferma.

## Limiti noti (onesti, non riclassificati come "verde")

- `FOUNDER_ALERT_EMAIL` non ancora configurata in produzione - da fare prima del
  prossimo deploy che include questo branch.
- Performance Fase 11 misurata su server Docker locale, non su edge Vercel reale,
  e non rimisurata in questa Fase (nessuna modifica di logica nel percorso di
  rendering) - proxy ragionevole del costo lato client, non sostituisce un audit
  Lighthouse su produzione dopo il deploy.
- `founderAutoGrant.status` resta `pending_production_verification`: il merge su
  `main` resta bloccato dal gate Build 189, indipendente da questo sprint.
- Origine dei 20 grant Founder delle 07:38 UTC del 18/07 non identificata dal
  repo (nessun cron/job corrispondente trovato) - richiede controllo manuale dei
  log Supabase, non ancora fatto (fuori dalle capacità di questa sessione: nessun
  accesso Supabase MCP autenticato).
- Il confronto CSV↔UI (P1.1C Fase 2) usa una tolleranza di arrotondamento
  (±0.5, o ±0.5% del valore se maggiore), non un confronto byte-esatto: sufficiente
  a rilevare un CSV vuoto, corrotto, o con un valore radicalmente diverso, non a
  garantire che l'arrotondamento dell'ultima cifra decimale sia identico byte per
  byte tra CSV e UI (che non è un requisito - le due rappresentazioni hanno
  precisioni decimali dichiaratamente diverse per design).
- La correzione del bug CSV HRV (virgola delle migliaia) è stata verificata
  contro un CSV sintetico che riproduce la stessa struttura del bug reale, non
  tramite un rebuild-revert-rebuild completo del codice precedente (vedi
  motivazione nella sezione Privacy sopra) - la garanzia che `toFixed()` non
  inserisca mai un separatore delle migliaia è una proprietà della specifica
  ECMAScript, non qualcosa verificato empiricamente riga per riga in questa
  sessione.
- `labs:perf-check` non fa parte della catena di verifica richiesta per questa
  Fase (non menzionato nell'elenco comandi del mandato P1.1C) e non è stato
  rieseguito - i numeri riportati sopra restano quelli di P1.1B Fase 7.
- Il fix nav Labs (P1.1D Fase 1) è verificato empiricamente end-to-end su
  tutte e 15 le locale reali, ma non tramite un ciclo revert-rebuild-riverifica
  del codice precedente (vedi motivazione nella sezione "Internal linking Labs"
  sopra) - proporzionato alla natura meccanica del fix (riuso di una funzione
  pura già in produzione), non un test di regressione formale in stile P1.1B
  Fase 2.
- `labs:internal-linking-check` verifica presenza/status dei link, non il
  posizionamento visivo o l'ordine nella pagina (es. "il link è nel primo
  paragrafo della sezione X") - una verifica editoriale/visiva resta manuale.

## File toccati (P1.1B + P1.1C + P1.1D, tutti locali, nessuno pushato)

Riassunto per area (diff completo via `git diff` sul branch
`feat/p11-founder-close-fase0`, non riprodotto qui per lunghezza):

- **Founder hardening**: `app/.../beta/page.tsx`, `app/.../page.tsx` (homepage),
  `app/.../press/page.tsx`, `components/founder/FounderClientGate.tsx`,
  `lib/founder/program-window.ts(.test.ts)`, `lib/founder/monitor.ts(.test.ts)`
  (dall'hotfix, fuso), `lib/content/founder-window-copy.ts(.test.ts)`,
  `lib/pricing.ts`, `lib/product-facts.ts`, `lib/llms-txt.ts`,
  `tools/check-founder-program-window.ts`, `components/Footer.tsx`
  (reduced-motion, P1.1B Fase 4).
- **Labs infrastruttura**: `lib/labs/registry.ts`, `lib/labs/katex/`
  (fail-closed, P1.1B Fase 5), `components/labs/math/`,
  `app/.../labs/layout.tsx`, `app/.../labs/page.tsx`,
  `app/.../labs/[tool]/page.tsx`, `app/.../labs/[tool]/opengraph-image.tsx`,
  `app/sitemap.ts`.
- **HRV retrofit**: `lib/labs/hrv/rmssd-math.ts(.test.ts)`,
  `lib/labs/hrv/content.ts`, `components/labs/HrvCharts.tsx`,
  `components/labs/HrvRmssdCalculator.tsx` (testid Fase 3 + fix CSV Fase 2,
  P1.1C), `components/labs/pages/HrvToolPageBody.tsx` (fix slug articolo
  EN reale via `localizedBlogSlug`, P1.1D Fase 2).
- **Sleep Efficiency**: `lib/labs/sleep-efficiency/math.ts(.test.ts)` (errori
  bloccanti, P1.1B Fase 3), `lib/labs/sleep-efficiency/content.ts`,
  `components/labs/SleepEfficiencyCalculator.tsx` (riscritto accessibilità
  P1.1B Fase 1 + testid Fase 3 P1.1C),
  `components/labs/pages/SleepEfficiencyToolPageBody.tsx` (formule esportate,
  P1.1B Fase 5).
- **Content cluster**: `lib/blog/posts/efficienza-del-sonno-formula-calcolo.ts`,
  `lib/blog/posts/metriche-recupero-hrv-sonno-frequenza-cardiaca.ts`,
  `lib/blog/posts/hrv-cose-significato-valori.ts`, `lib/blog/data.ts`,
  `lib/blog/slugs.ts`, `lib/blog/covers.ts`.
- **Nav/homepage teaser**: `components/Header.tsx` (reduced-motion P1.1B Fase
  4 + link Labs diretto su 15 locale, `data-testid="nav-labs-desktop"`, P1.1D
  Fase 1), `components/MobileMenu.tsx` (stesso fix, `data-testid=
  "nav-labs-mobile"`, P1.1D Fase 1), `lib/content/labs-teaser-copy.ts`,
  `app/.../blog/page.tsx`, `app/.../sync/[provider]/page.tsx` (reduced-motion,
  P1.1B Fase 4).
- **Oracle**: `scripts/oracle/` (`sleep_efficiency_oracle.py`::
  `classify_expected_error`, `compare.py` esteso, P1.1B Fase 7),
  `tools/gen-labs-oracle-vectors.ts` (vettori d'errore, P1.1B Fase 7),
  `tools/run-labs-oracle-check.sh`.
- **Guardrail**: `tools/check-katex-no-user-input.ts`,
  `tools/check-labs-accessibility.ts` (riscritto P1.1B Fase 2, selettore
  risultati P1.1C Fase 3), `tools/check-labs-performance.ts`,
  `tools/check-labs-cross-browser.ts` (esteso a 4 pagine, P1.1B Fase 4),
  `tools/check-labs-formulas-render.ts` (nuovo, P1.1B Fase 5),
  `tools/check-no-continuous-sync-claim.ts`, `tools/check-labs-privacy.ts`
  (modalità avanzata + word-boundary matching P1.1B Fase 7, contenuto CSV reale
  P1.1C Fase 2), `tools/check-labs-internal-linking.ts` (nuovo, P1.1D Fase 3:
  42 URL, 15 locale, nav+tool+articolo+pillar+fallback).
- **Documentazione**: `docs/seo/labs/competitive-benchmark-p11.md`, questo
  report (riscritto P1.1B, riscritto di nuovo P1.1C, riscritto di nuovo P1.1D).
- **Toolchain**: `package.json` (`packageManager` pinnato,
  `@types/katex`→devDependencies, script `labs:cross-browser-check`/
  `labs:formulas-render-check`/`labs:perf-check`/`labs:internal-linking-check`
  [nuovo, P1.1D], P1.1B Fase 6), `pnpm-lock.yaml`, `vercel.json`
  (`--frozen-lockfile`, P1.1B Fase 6), `.gitignore` (`package-lock.json`
  rimosso dal repo, P1.1B Fase 6).

## Cosa manca prima di un merge reale

1. Conferma Build 189 sui 5 punti del gate `founderAutoGrant` (fuori dal controllo
   di questo sprint).
2. `FOUNDER_ALERT_EMAIL` configurata in produzione.
3. Origine dei 20 grant delle 07:38 UTC, se rilevante per la sicurezza (vedi P0
   separato su `handle_new_founder` SECURITY DEFINER, stesso documento incidente).

## Prossimo passo

Fermo qui in attesa di revisione, come richiesto. Il commit di amend che include
questo stesso file segue subito dopo la scrittura di questo report - l'hash
esatto è comunicato nel report di consegna in chat (non riscrivibile qui senza
un secondo commit, che lo sprint vieta esplicitamente).
