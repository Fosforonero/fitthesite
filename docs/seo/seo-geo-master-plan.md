# FitMesh SEO/GEO Master Plan

> Documento VIVO — fonte di verità canonica per la strategia SEO/GEO di
> FitMesh Sync. Creato 2026-07-13 (Sprint P0.3) a consolidamento di P0
> (Truth Layer & GEO Foundation) e P0.2 (fitness-data-sync category).
>
> Questo file governa la STRATEGIA (missione, principi, roadmap, gate,
> measurement, decision log). Per il calendario editoriale articolo-per-articolo
> vedi [piano-editoriale-2026.md](./piano-editoriale-2026.md) (subordinato,
> non duplicato qui). Per i risultati misurati vedi
> [seo-results-log.md](./seo-results-log.md). Vedi
> [README.md](./README.md) per l'indice completo di `docs/seo/`.

## 1. Missione

FitMesh deve diventare il riferimento mondiale per:

- fitness data sync
- wearable data portability
- Health Connect
- Apple Health
- export e interpretazione dati wearable
- prevenzione dei duplicati
- compatibilità tra piattaforme
- sonno, HRV e recovery basati su fonti verificabili

Non è un obiettivo di traffico puro: è un posizionamento editoriale.
FitMesh vince se diventa la fonte che sia i motori di ricerca sia gli
assistenti AI citano quando qualcuno chiede "perché i miei dati wearable
non sincronizzano" o "come porto i dati fuori dal mio smartwatch".

## 2. Principi

Questi principi sono permanenti e sovrastano qualunque singola iniziativa
sotto. In caso di conflitto tra un principio e una tattica di crescita, vince
il principio.

- **Utilità prima del volume.** Non si scrive per la keyword, si scrive per
  risolvere il problema che sta dietro la keyword.
- **Niente pagine generate solo per keyword.** Ogni pagina deve avere una
  ragione editoriale, non solo una ragione SEO.
- **IT/EN prima.** Nessuna nuova lingua parte finché IT/EN non sono completi
  per quel contenuto.
- **Massimo due nuove traduzioni/locali al giorno dopo QA.** Il collo di
  bottiglia è la qualità della revisione, non la velocità di traduzione.
- **Nessun locale indicizzabile con fallback EN.** Un URL `/nl/...` che
  mostra contenuto EN sotto canonical proprio è contenuto duplicato agli
  occhi di Google ("Duplicate without user-selected canonical"). Il gate
  tecnico è `isBlogVariantIndexable()` / `isPostLocaleComplete()` in
  `lib/blog/indexability.ts` — vedi anche i controlli Fase 2/3 di questo
  sprint (variante NL di `health-connect-not-syncing`).
- **Fonti primarie.** Percentuali, statistiche o affermazioni quantitative
  richiedono una fonte citabile o vanno riformulate in termini qualitativi.
  Vedi l'audit 2026-07-13 di `health-connect-not-syncing.ts` nel
  [results log](./seo-results-log.md) come precedente diretto.
- **Distinzione tra fatto, inferenza e roadmap.** Un claim di prodotto è
  "live" solo se supera la [capability promotion checklist](./capability-promotion-checklist.md)
  (9 gate, criterio: reachable and completable by a real user — non "il
  codice esiste").
- **Nessuna diagnosi medica.** Trend, recupero, pattern, baseline — mai
  diagnosi o cura. Vedi sezione 7 (YMYL).
- **JSON-LD uguale al contenuto visibile.** Nessun claim, FAQ o entità che
  esiste SOLO nello structured data e non nel testo che un utente legge.
- **Claim di prodotto solo da product-facts/capability matrix.** Ogni
  affermazione su cosa fa FitMesh deve tracciare a `lib/product-facts.ts`,
  `lib/providers/data.ts` o alla capability promotion checklist — mai
  inventata nel copy di un singolo articolo. L'audit Garmin di questo sprint
  (vedi results log) è l'esempio del perché: un articolo affermava
  un'integrazione "via API ufficiale" che il codice non supporta ancora.
- **Niente backlink acquistati.** Solo digital PR basata su asset reali
  (vedi P2 in roadmap).

## 3. Baseline dati 2026-07-13

### Google Search Console (CSV analizzato 2026-07-13)

| Metrica | Valore |
|---|---|
| Query totali | 964 |
| Impression totali | 1.506 |
| Click totali | 149 |
| Impression su query a zero click | 1.273 |
| Garmin export — impression / click | 534 / 51 |
| Fitbit export — impression / click | 168 / 20 |
| HRV meaning — impression / click | 115 / 9 |
| Samsung sync — impression / click | 58 / 8 |
| Polar sync — impression / click | 28 / 0 |
| "fitness data sync" (generico) | nessuna presenza rilevata nel report |

Lettura: il grosso delle impression (1.273 su 1.506, 84%) non converte in
click. Il CTR aggregato è basso (149/1.506 ≈ 9.9%, ma trascinato in alto da
poche query performanti come Garmin export). La query-intento generico
"fitness data sync" non ha ancora presenza — è esattamente il gap che la
categoria `/fitness-data-sync` (P0.2) e questo sprint indirizzano, ma
l'assenza di presenza pre-esistente significa che il lancio (Fase 7-9 di
questo sprint) non ha ancora dati "prima" da confrontare per quella query
specifica: la baseline PER QUELLA CATEGORIA è zero, non "basso".

### Bing (audit 2026-07-13)

| Finding | Quantità |
|---|---|
| Title troppo lunghi | 2 |
| Meta description troppo corte | 7 |
| Noindex accidentale | 1 (NL, `health-connect-not-syncing`) |
| Warning domain-level backlink | presente (off-site, non un bug tecnico — non si "corregge" con link artificiali) |

Stato di questi 4 finding a fine Sprint P0.3: vedi
[seo-results-log.md](./seo-results-log.md), riga "Fix Bing 2026-07-13".

### Convenzione di stato (usare SEMPRE questi 6 stati, non altri)

1. **rilevato** — un problema o un'opportunità è stata identificata.
2. **corretto localmente** — il fix esiste nel branch/worktree, non ancora buildato/pushato.
3. **verificato in Docker** — build, typecheck, guardrail e test HTTP/JSON-LD/redirect/sitemap/robots/hreflang eseguiti in locale via Docker (`next build` + `next start` in container, contro un server locale), non ancora in produzione.
4. **deployato in produzione** — live su `fitmesh.fit`, non ancora ri-verificato post-deploy.
5. **validato post-deploy** — controllato con curl/validator sull'URL pubblico dopo il deploy.
6. **risultato misurato** — ha un numero GSC/Bing a 14/28/90 giorni nel results log.

Non saltare stati nel results log: un'iniziativa che non è ancora
"validato post-deploy" non va descritta come "risultato misurato".

**Nota permanente (2026-07-13)**: le Preview Deployment Vercel per branch
non-`main` sono disabilitate via `vercel.json` (`git.deploymentEnabled`:
`main: true`, `**: false`). La verifica pre-merge passa quindi SOLO dallo
stadio 3 (Docker), mai da una preview Vercel pubblica. Una preview
pubblica è ammessa solo con autorizzazione esplicita di Matteo per quel
caso specifico — non è più il default. Questo elimina sia lo spreco di
build (ogni branch feature buildava ~3427 pagine su infrastruttura
condivisa) sia il problema di preview protette da Vercel SSO non
ispezionabili via curl incontrato nello Sprint P0.3.

## 4. Roadmap ordinata

Per ogni iniziativa: obiettivo, URL, problema utente, query/intento, impatto
1-10, effort 1-10, valore SEO, valore GEO/AI, backlink potential, difficoltà,
dipendenze, KPI, scenario di traffico a 12 mesi (esplicitamente NON
garantito), stato, owner, prossimo controllo.

### P0 — Truth e indicizzazione (FATTO — Sprint P0, P0.2, P0.3)

- **Obiettivo**: eliminare claim di prodotto falsi/non verificati, fissare i
  gap tecnici di indicizzazione (noindex accidentali, cannibalizzazione,
  redirect mancanti) prima di investire in nuovo contenuto.
- **URL**: sito intero (`/llms.txt`, JSON-LD, `/fitness-data-sync`,
  cluster Garmin/Samsung, `health-connect-not-syncing`).
- **Problema utente**: nessuno direttamente — è debito di fiducia/qualità
  che a valle danneggia sia SEO (contenuto duplicato, claim non verificabili
  penalizzati) sia GEO (un assistente AI che cita un claim falso espone
  FitMesh a un rischio reputazionale maggiore di zero citazioni).
- **Impatto**: 9/10. **Effort**: già speso (3 sprint). **Valore SEO**: alto
  (rimuove cannibalizzazione e contenuto duplicato). **Valore GEO/AI**: alto
  (un assistente AI che verifica i claim prima di citarli penalizza le fonti
  con claim falsificabili). **Backlink potential**: n/a (non è
  content-led). **Difficoltà**: media (richiede audit manuale, non
  automatizzabile al 100%). **Dipendenze**: nessuna. **KPI**: zero claim
  bandite rilevate dal guardrail (`tools/check-llms-consistency.ts`), zero
  pagine noindex accidentali. **Scenario 12 mesi**: non applicabile (è un
  gate di qualità, non un'iniziativa di crescita). **Stato**: fatto,
  validazione continua tramite guardrail automatico ad ogni push. **Owner**:
  Claude (esecuzione) + Matteo (review). **Prossimo controllo**: ad ogni
  sprint SEO futuro, come prerequisito prima di Fase 6/7.

### P0.3 — Audit title legacy (BACKLOG — rilevato, non ancora corretto)

- **Obiettivo**: 244 title di blog/pagine localizzate superano 70 caratteri
  nel controllo preliminare di questo sprint.
- **URL**: da enumerare (vedi backlog tecnico, sezione 6).
- **Problema utente**: title troncati in SERP riducono il CTR (meno
  informazione utile visibile prima del click).
- **Impatto**: 5/10 (probabile ma non quantificato per singola pagina).
  **Effort**: 6/10 (244 pagine, va prioritizzato per impression GSC, non
  fatto a tappeto). **Valore SEO**: medio. **Valore GEO/AI**: basso (i
  motori AI leggono il body, non il title troncato). **Backlink
  potential**: nessuno. **Difficoltà**: bassa per singola pagina, alta in
  aggregato (244 pagine). **Dipendenze**: nessuna. **KPI**: CTR SERP delle
  pagine corrette, confrontato a 14/28 giorni. **Scenario 12 mesi**: non
  stimato — non garantito. **Stato**: rilevato, non corretto (esplicitamente
  fuori scope di questo sprint, che copre solo i 2 title segnalati da Bing).
  **Owner**: da assegnare. **Prossimo controllo**: prossimo sprint SEO,
  prioritizzando per impression GSC (non accorciare a tappeto — vedi
  sezione 6).

### P1 — Wearable Data Portability Index 2026

- **Obiettivo**: asset di riferimento annuale — una pagina/report che
  classifica i principali wearable per facilità di export/portabilità dati,
  aggiornato annualmente. Asset da citazione (digital PR, GEO).
- **URL**: da definire (probabile `/wearable-data-portability-index` o
  simile, IT+EN).
- **Problema utente**: "quale smartwatch mi lascia davvero portare via i
  miei dati" — nessuna fonte indipendente risponde oggi.
  **Query/intento**: comparativo, informativo, alto intento GEO (un
  assistente AI cita volentieri un "index" strutturato).
- **Impatto**: 8/10. **Effort**: 7/10 (richiede ricerca cross-piattaforma
  verificata, non solo copy). **Valore SEO**: alto (asset linkabile).
  **Valore GEO/AI**: molto alto (formato tabellare/ranking è il formato
  preferito dagli assistenti AI per citazione diretta). **Backlink
  potential**: alto (è esattamente il tipo di asset che riceve link
  editoriali spontanei). **Difficoltà**: medio-alta (serve accuratezza
  verificabile per ogni riga, non stime). **Dipendenze**: nessuna
  bloccante. **KPI**: referring domains verso l'URL, citazioni AI osservate
  (vedi measurement framework, sezione 9). **Scenario 12 mesi**: non
  garantito — dipende da adozione editoriale esterna, non solo da SEO
  on-page. **Stato**: idea, non iniziato. **Owner**: da assegnare.
  **Prossimo controllo**: quando P0.3 (audit title) e i gap Sonno/Stress del
  piano editoriale sono chiusi (vedi piano-editoriale-2026.md, priorità
  gap-first).

### P1 — Export Analyzer client-side

- **Obiettivo**: tool interattivo (client-side, nessun dato utente inviato
  al server) che analizza un file GPX/TCX/FIT caricato e spiega cosa
  contiene/cosa manca.
- **URL**: da definire (probabile `/tools/export-analyzer`).
- **Problema utente**: "ho esportato un file, non so leggerlo / non so se è
  completo" — collegato direttamente ai cluster export Garmin/Fitbit/Apple
  Health già coperti editorialmente.
- **Impatto**: 7/10. **Effort**: 6/10 (parsing client-side di formati noti,
  no backend). **Valore SEO**: medio-alto (tool = pagina con dwell time
  alto). **Valore GEO/AI**: medio (i tool interattivi non si citano
  direttamente, ma generano contenuto derivato citabile). **Backlink
  potential**: medio. **Difficoltà**: media (parsing FIT binario è il pezzo
  più complesso). **Dipendenze**: nessuna. **KPI**: completamenti tool,
  export report (vedi measurement framework). **Scenario 12 mesi**: non
  garantito. **Stato**: idea, non iniziato. **Owner**: da assegnare.
  **Prossimo controllo**: dopo Wearable Data Portability Index.

### P1 — Knowledge hub sync/export

- **Obiettivo**: hub-and-spoke dedicato che raccoglie tutti i cluster
  export/sync esistenti (Garmin, Fitbit, Apple Health, Health Connect,
  Samsung) sotto una struttura di navigazione unica — non un nuovo
  contenuto, un livello di organizzazione sopra quello che esiste già.
- **URL**: probabile evoluzione di `/fitness-data-sync` (P0.2) verso hub
  completo.
- **Problema utente**: oggi i cluster esistono ma non sono collegati in una
  struttura di navigazione esplorabile.
- **Impatto**: 6/10. **Effort**: 4/10 (soprattutto architettura
  informativa, contenuto già esiste). **Valore SEO**: medio (consolida link
  equity interna). **Valore GEO/AI**: medio. **Backlink potential**: basso.
  **Difficoltà**: bassa. **Dipendenze**: P0.2 (fatto). **KPI**: pagine per
  sessione, click interni verso i cluster. **Scenario 12 mesi**: non
  garantito. **Stato**: idea, dipendenza soddisfatta, non iniziato.
  **Owner**: da assegnare. **Prossimo controllo**: valutare insieme al
  redesign hub Integrazioni esistente.

### P1 — FitMesh Labs foundation

- **Obiettivo**: fondare "FitMesh Labs", un sotto-brand per calcolatori/tool
  gratuiti vicini al prodotto (vedi sezione 5, top 20%).
- **URL**: probabile `/labs` o sottodominio.
- **Problema utente**: varia per singolo tool (vedi sezione 5).
- **Impatto**: 8/10 (fondazione per multipli tool ad alto potenziale).
  **Effort**: 5/10 per la fondazione (routing, template, brand), poi
  incrementale per tool. **Valore SEO**: alto (i calcolatori attirano
  ricerche transazionali ad alto volume). **Valore GEO/AI**: alto (i
  calcolatori con formula visibile sono altamente citabili). **Backlink
  potential**: alto. **Difficoltà**: media. **Dipendenze**: gate YMYL
  (sezione 7) per i primi 3 tool, che sono tutti a carattere salute.
  **KPI**: visite/completamenti tool. **Scenario 12 mesi**: non garantito.
  **Stato**: idea, non iniziato. **Owner**: da assegnare. **Prossimo
  controllo**: prima del kickoff, verificare il gate YMYL per i 3 tool
  prioritari.

### P2 — Digital PR basata sugli asset

- **Obiettivo**: outreach editoriale (non link building acquistato) basato
  sugli asset P1 (Portability Index, Export Analyzer, Labs).
- **Impatto**: 7/10. **Effort**: 6/10. **Valore SEO**: alto (backlink
  editoriali). **Valore GEO/AI**: medio. **Backlink potential**: alto per
  definizione (è l'obiettivo dell'iniziativa). **Difficoltà**: alta
  (dipende da relazioni editoriali esterne). **Dipendenze**: P1 completato
  (serve un asset reale da promuovere). **KPI**: referring domains
  verificati, link editoriali. **Scenario 12 mesi**: non garantito — la
  digital PR ha tassi di successo variabili e non prevedibili con
  precisione. **Stato**: non iniziato, dipendenza non soddisfatta.
  **Owner**: da assegnare.

### P2 — Wearable statistics verticali

- **Obiettivo**: pagine statistiche verticali per singola categoria
  (adozione smart ring, mercato Health Connect, ecc.), sempre con fonti
  primarie citate.
- **Impatto**: 5/10. **Effort**: 5/10. **Valore SEO**: medio. **Valore
  GEO/AI**: alto (le pagine "statistics" sono tra le più citate dagli
  assistenti AI, se le fonti sono verificabili). **Backlink potential**:
  medio-alto. **Difficoltà**: media (serve ricerca di fonti primarie reali,
  niente numeri inventati — vedi principio "fonti primarie", sezione 2).
  **Dipendenze**: nessuna bloccante. **Stato**: idea, non iniziato.

### P3 — Research con dati utenti (SOLO dopo privacy/legal gate)

- **Obiettivo**: "FitMesh Health Report" — insight aggregati basati su dati
  utente reali (es. distribuzione HRV per fascia d'età).
- **Impatto**: 9/10 (asset di autorità difficilmente replicabile da
  competitor). **Effort**: alto, non stimato — dipende dall'esito del gate
  legale. **Valore SEO**: molto alto. **Valore GEO/AI**: molto alto.
  **Backlink potential**: molto alto. **Difficoltà**: alta. **Dipendenze**:
  BLOCCANTE — vedi sezione 8 (Research e GDPR). Non iniziare la produzione
  di questo asset prima che il gate privacy/legal sia superato. **Stato**:
  bloccato per policy, non tecnico. **Owner**: da assegnare solo dopo il
  gate.

### P3 — Calcolatori salute più generici

- **Obiettivo**: calcolatori a maggiore volume di ricerca ma più distanti
  dal prodotto (es. calcolatore calorie generico).
- **Impatto**: 4/10 (volume alto ma intento meno qualificato, meno vicino
  al prodotto). **Effort**: 4/10. **Valore SEO**: medio-alto (volume).
  **Valore GEO/AI**: basso (categoria satura, poco differenziata).
  **Backlink potential**: basso. **Difficoltà**: bassa. **Dipendenze**:
  bassa priorità rispetto a P1 Labs (vedi sezione 5 — questi calcolatori
  sono esplicitamente FUORI dal "top 20%" prioritario). **Stato**: idea,
  bassa priorità.

## 5. Top 20% / 80% growth

Priorità esplicita, in quest'ordine:

1. **Wearable Data Portability Index** — asset di citazione, vicino al
   prodotto (portabilità dati è la ragione d'essere di FitMesh).
2. **Export Analyzer** — risolve un problema reale immediato, genera
   dwell-time e completamenti misurabili.
3. **Hub sync/export/compatibilità** — consolida link equity su contenuto
   che già esiste, effort basso.
4. **FitMesh Labs, primi tre tool**: HRV Calculator, Heart Rate Zones +
   Zone 2, Sleep Efficiency Calculator.

Perché questi e non i calcolatori generici (P3) o la digital PR generica
(P2): tutti e quattro sono **vicini al prodotto** (FitMesh già raccoglie e
mostra HRV, zone di frequenza cardiaca e dati sonno — un calcolatore su
questi temi non è contenuto scollegato, è una vetrina della capacità
esistente), **risolvono un problema reale e verificabile** (non
keyword-stuffing), e **sono il tipo di asset che riceve link/citazioni
spontanee** (tool e index, non articoli generici) — a differenza dei
calcolatori salute generici (P3), che competono in una categoria satura con
poca differenziazione possibile per FitMesh.

## 6. Backlog tecnico/editoriale

- **Audit dei 244 title** blog/localizzati oltre 70 caratteri (rilevato
  2026-07-13, controllo preliminare di questo sprint). Non accorciare
  automaticamente in blocco: prioritizzare per impression GSC (i title a
  basso impression hanno impatto trascurabile se accorciati, meglio
  investire tempo sui title delle pagine ad alto traffico).
- **5 meta description provider residue** tra 139 e 149 caratteri
  (rilevate 2026-07-13, sotto la soglia dei 7 segnalati esplicitamente da
  Bing questo sprint). Revisionare editorialmente SOLO se Bing le
  segnalerà in un audit futuro — non sono nel gate di questo sprint.
- **Audit verità di `health-connect-not-syncing`**: completato 2026-07-13
  (rimossi claim "90%"/"60%" non verificabili e la cornice "centinaia di
  report" in 11 lingue — vedi results log). Ripetere per qualunque futuro
  claim quantitativo aggiunto a questo articolo.
- **Controllo periodico dei claim prodotto**: ogni sprint che tocca
  copy pubblico deve rieseguire `tools/check-llms-consistency.ts` E fare
  un audit manuale mirato (il guardrail cattura pattern noti, non ogni
  claim possibile — l'audit Garmin di questo sprint, sezione 2, è stato
  trovato manualmente, non dal guardrail automatico).
- **Controllo redirect e cannibalizzazione**: ripetere ad ogni nuova
  landing/pillar per evitare la situazione P0.2 (consolidamento
  Garmin/Samsung) — vedi precedente in
  [seo-results-log.md](./seo-results-log.md).
- **`og:image` assente sitewide — risolto (Sprint P0.4, `verificato in
  Docker`)**: root cause confermata su `app/opengraph-image.tsx` — il file
  viveva direttamente in `app/`, un livello SOPRA il route group
  `(frontend)`, e senza un `app/layout.tsx` a livello radice (il progetto usa
  root layout separati per route group: `(frontend)` e `(payload)`) quel
  segmento non appartiene all'albero di risoluzione metadata di nessuna
  pagina reale. Next.js lo compilava come endpoint standalone orfano
  `/opengraph-image`, mai referenziato — confermato nel manifest di build e
  dal warning `metadataBase property... not set, using "http://localhost:3000"`
  (il file "vedeva" un `metadataBase` fuori scope). Fix: file spostato in
  `app/(frontend)/[locale]/opengraph-image.tsx` (fallback globale,
  language-neutral, icone/brand senza testo) + `.../fitness-data-sync/opengraph-image.tsx`
  dedicata (headline riusata testualmente da `META_TITLE`, nessuna nuova
  claim). Scoperta aggiuntiva durante la verifica: 9 pagine marketing
  (`about`, `ai`, `beta`, `blog` index, `famiglia`, `integrations`,
  `novita`, `press`, `roadmap`) dichiarano un proprio oggetto `openGraph` in
  `generateMetadata` — Next.js resetta `target.openGraph` in modo stateless
  ad ogni segmento che dichiara un proprio `openGraph` (anche senza
  `images`), quindi il fallback a livello `[locale]` non veniva ereditato da
  quelle pagine (verificato empiricamente e in
  `next/dist/lib/metadata/resolve-metadata.js`). Fix: un
  `opengraph-image.tsx` colocato per ciascuna, re-esportato da un unico
  componente condiviso in `lib/og/fallback-image.tsx` — zero duplicazione
  visiva, zero modifiche a `generateMetadata()`. Nuovo guardrail
  `tools/check-social-metadata.ts` verifica 11 route rappresentative (una
  per famiglia: fallback, fitness-data-sync, blog, lp, sync-provider) via
  HTTP contro un server reale, senza basarsi su hash generati da Next
  (specificità verificata sulla struttura del path, es. `/blog/` vs nessun
  marker = fallback).
- **Traduzione corrotta incidentalmente scoperta**: durante l'audit
  2026-07-13 di `health-connect-not-syncing.ts` sono stati trovati e
  corretti bug di traduzione pre-esistenti non legati alle statistiche
  (PL: testo con placeholder di formato data leaked nel copy; TR: frase
  con testo italiano/nozioni normative estranee mescolate per errore di
  traduzione automatica). Non è stato fatto un audit sistematico delle
  altre ~40 lingue×articoli per lo stesso tipo di corruzione — backlog per
  un futuro sprint i18n dedicato (vedi anche
  `tools/check-translation-corruption.ts`, che copre pattern noti ma non
  garantisce di catturare ogni caso).

## 7. YMYL e medical review

Gate obbligatori, permanenti, per QUALUNQUE pagina/tool che tocchi questi
argomenti:

- Biological Age
- Blood Pressure Classifier
- VO₂ Max Estimator
- Recovery Score
- raccomandazioni nutrizionali
- interpretazioni sanitarie

Nessuno di questi può pubblicare senza TUTTI i seguenti:

- fonti mediche primarie (non blog di terzi, non "si dice che")
- formula visibile (l'utente deve poter vedere come si arriva al numero,
  non solo il risultato)
- limiti e incertezza dichiarati esplicitamente
- autore identificato
- revisore competente identificato (non lo stesso autore)
- `reviewedAt` (data di revisione, distinta da `publishedAt`/`updatedAt`)
- disclaimer visibile
- nessuna diagnosi (linguaggio di trend/pattern, mai "hai la condizione X")
- `MedicalWebPage` in JSON-LD SOLO quando realmente appropriato — non
  applicare questo schema a contenuto che non è genuinamente medico solo
  per un potenziale beneficio SEO percepito.

Questo gate blocca esplicitamente P1 (FitMesh Labs, primi 3 tool) e P3
(Calcolatori salute generici) finché non è superato per ciascun tool
specifico — non è un gate one-time per il progetto, è per-tool.

## 8. Research e GDPR

Principi permanenti per qualunque iniziativa che tocchi dati utente
aggregati (in particolare P3 — Research con dati utenti):

- **Pseudonimizzato non significa anonimo.** I dati salute pseudonimizzati
  restano dati personali sotto GDPR (categoria speciale, Art. 9).
- **Nessun "FitMesh Health Report" basato su dati utenti** senza, TUTTI
  presenti: consenso esplicito, finalità dichiarata, minimizzazione dei
  dati, DPIA (Data Protection Impact Assessment) o revisione privacy
  equivalente, protezione dalla re-identificazione (k-anonymity o
  equivalente, non solo rimozione del nome).
- **Iniziare con benchmark manuali e fonti pubbliche**, non con dati
  utente, finché il gate sopra non è superato.
- **Nessuna coorte troppo piccola** — un aggregato su un numero ridotto di
  utenti è de-anonimizzabile per inferenza anche senza identificatori
  diretti.
- **Metodologia e limiti sempre pubblici** per qualunque research
  pubblicata, anche dopo il gate.

Questo è un gate bloccante per P3 (Research), non un suggerimento.

## 9. Measurement framework

### KPI minimi da tracciare

- click e impression non-brand (escludere query "fitmesh")
- CTR
- posizione media
- query in top 3 / top 10
- pagine indicizzate
- referring domains verificati (non solo menzioni)
- link editoriali
- citazioni AI osservate (manuale: verificare periodicamente se
  ChatGPT/Perplexity/Claude/AI Overview citano FitMesh per le query target)
- visite ai tool (quando esistono — P1)
- completamenti tool
- export report (quando esistono)
- CTA click verso `/fitness-data-sync` e altre landing
- store click (Play Store / App Store)
- install attribuite, solo quando misurabili (oggi non lo sono in modo
  affidabile — non riportare un numero di install "stimato" come se fosse
  misurato)

### Finestre di confronto

Sempre **14 giorni, 28 giorni, 90 giorni** — mai un confronto tra finestre
di lunghezza diversa (es. "prime 2 settimane" vs "mese precedente intero").

### Prossimi controlli programmati per questo sprint

- **+14 giorni**: 2026-07-27
- **+28 giorni**: 2026-08-10
- **+90 giorni**: 2026-10-11

(Queste date partono dal deploy, non dalla stesura del piano — verificare
il timestamp di deploy reale in
[seo-results-log.md](./seo-results-log.md) e correggere se il deploy
avviene in data diversa da 2026-07-13.)

## 10. Decision log

Ogni modifica SEO importante registra: data, URL, problema, ipotesi, dati
pre-modifica, commit, data deploy, risultato 14/28/90 giorni, decisione
(keep / iterate / revert / inconclusive).

Il log delle decisioni vive in
[seo-results-log.md](./seo-results-log.md) (non duplicato qui) per tenere
la strategia (questo file, che cambia raramente) separata dai dati
puntuali (che cambiano ad ogni sprint).

### Decisioni di questo sprint (P0.3) da registrare al superamento dei gate

1. Retarget claim FitMesh↔Garmin da "API ufficiale" a "pass-through Health
   Connect" (11 lingue) — ipotesi: il claim precedente era commercialmente
   falso (verificato contro `lib/providers/data.ts`), la correzione non
   dovrebbe impattare negativamente il ranking (stesso search intent,
   nessuna keyword rimossa) ma riduce il rischio reputazionale se un
   utente lo verifica.
2. Rimozione statistiche "90%"/"60%" non fontate da
   `health-connect-not-syncing` (11 lingue) — ipotesi: nessun impatto
   negativo su CTR/posizione (il claim quantitativo non era nel title/meta,
   solo nel body/TL;DR), riduce rischio reputazionale.
3. Consolidamento cluster Garmin/Samsung con redirect 308 (P0.2, portato in
   produzione questo sprint) — ipotesi: elimina cannibalizzazione,
   dovrebbe consolidare authority su un solo URL invece di dividerla su
   due.

Verdetto (keep/iterate/revert) per tutte e tre: **da registrare dopo il
controllo dei 14 giorni** (2026-07-27) — non anticipare un verdetto senza
dati.
