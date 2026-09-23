# P0.24-C — Truth ledger: dashboard web personale

Branch: `content/p024c-dashboard-web-truth` (worktree isolato da `origin/main`, HEAD di partenza `d3bf86f` = merge di PR #78, P0.24-B).
Data verifica: 2026-09-23. Metodo: workflow di inventario a 8 agenti su 183 file che menzionano "dashboard" (o equivalente localizzato), seguito da un workflow di correzione a 14 agenti sui claim classificati come correggibili con un editing minimale, più una verifica manuale finale con correzioni dirette sui residui trovati durante quella verifica.

## Fatto di prodotto (fonte: Matteo, riportato qui verbatim)

> La dashboard web personale dei dati salute è decisa ed è in sviluppo, ma non è ancora disponibile. Mesh Famiglia è un'altra funzione, anch'essa in sviluppo. La dashboard nell'app mobile e le eventuali funzioni web già operative vanno distinte con precisione. Non annunciare una data di rilascio.

## Evidenza di codice verificata (sola lettura, non modificata da questo sprint)

- `app/(frontend)/[locale]/app/page.tsx` ("AppHome"): route reale, live, dietro login, `force-dynamic` (mai indicizzata). Il suo stesso menu la etichetta "Dashboard" (`t.app.nav.dashboard`). Renderizza tre `PlaceholderCard` (passi, BPM medio, sonno) che mostrano **sempre** il valore letterale "—" con un messaggio "nessun dispositivo collegato". Nessun percorso di codice in questa pagina legge o mostra una metrica salute reale. L'unica CTA funzionante porta a `/app/devices` (generatore di codice di pairing BLE), non a un visualizzatore di dati.
- `/app/devices`: elenco dispositivi accoppiati (dato reale) — gestione dispositivi, non visualizzazione metriche salute.
- `/app/export`: download JSON di profilo/dispositivi/metriche/allenamenti/consensi (portabilità GDPR art. 20) — un export, non una dashboard visiva.
- `/app/settings`: profilo + richiesta di cancellazione account. **Verificato accurato**: la richiesta imposta `data_deletion_requested_at`, diventa eseguibile dopo 24 ore (`grace_hours: 24` nel payload di audit), esegue logout automatico, ed è processata da un cron reale (`process-deletions`, ogni 10 minuti, chiama `public.gdpr_process_deletions()`), confermato vivo in produzione dai commenti delle migration. Nessun testo che descrive questo meccanismo (compresi i due riferimenti trovati in `lib/blog/posts/come-funziona-fitmesh.ts`, corretti per nome ma non per tempistica) è stato considerato falso.

**Conclusione applicata**: ogni claim che afferma che un lettore può, OGGI, accedere via browser e vedere i propri dati salute sincronizzati (passi, battito, sonno, trend, grafici) in una dashboard web personale è falso e va corretto o segnalato. Un claim sulla dashboard della APP MOBILE è vero e non va toccato. Un claim su una dashboard di TERZI (Garmin Connect, Strava, Samsung Health web, Fitbit/Google Health web, ecc.) non è un claim FitMesh ed è fuori perimetro.

## Perimetro escluso (per istruzione esplicita, non toccato)

- Mesh Famiglia / Family Mesh (altra funzione, altro filone): il paragrafo Mesh Famiglia in `lib/content/about-copy.ts` (righe 448-461) e il post `lib/blog/posts/mesh-famiglia-lancio.ts` non sono stati aperti.
- Badge conteggio wearable ("17+"/"14+") e conteggio di `/integrations`: già corretti in PR #78.
- 5 URL congelate dal test CTR (fino al 28/09 e al 12/10): i 4 file sorgente `lib/blog/posts/google-health-google-fit.ts`, `galaxy-ring-android-health-connect.ts`, `oura-ring-health-connect-android.ts`, `garmin-samsung-health-sync-guide.ts` non sono stati aperti. Verificato: nessuno dei quattro contiene la parola "dashboard", quindi non c'era comunque un conflitto.
- Nessun deploy, IndexNow o Validate Fix eseguito. Nessun push né apertura PR prima della consegna di questo ledger.

## Inventario: portata del problema

- 183 file (su ~15 lingue ciascuno dove applicabile) contengono la parola "dashboard" o un suo equivalente localizzato.
- 475 occorrenze singole classificate: 274 riferite alla dashboard web propria di FitMesh (il pattern falso), 67 mobile-app (legittime), 45 termine UI generico, 17 dashboard di terzi, 4 riferimenti storici/changelog, 68 ambigue.
- Causa radice confermata: non è "qualche riga sparsa" ma il **posizionamento primario del prodotto**, ripetuto sistematicamente su: titolo e meta description dell'homepage (tutte le 15 locale), lead sentence e passo 3 dell'onboarding in 3 passi dell'homepage, titolo/meta/hero di `/about`, JSON-LD Organization (homepage + about), JSON-LD Person del founder (ogni pagina), `/llms.txt`, i Termini di Servizio, ~40 articoli del blog, e le pagine SEO programmatiche `/integrations`-adiacenti per singolo provider.

## Correzioni applicate (diff pronto, non mergiato)

36 file modificati, 653 inserzioni / 661 cancellazioni. Pattern di correzione, applicato in modo uniforme: dove il testo descriveva "una dashboard" senza specificare dove si trova, è stata inserita la minima qualificazione "nell'app"/"in the app"/equivalente locale; dove il testo prometteva esplicitamente un'azione web ("apri da qualsiasi browser"), l'azione è stata sostituita con un'azione vera e altrettanto concreta (aprire l'app). Nessuna data, nessuna promessa di disponibilità futura, nessun em dash introdotto, nessun'altra parola toccata oltre al minimo necessario.

### Superfici a massima esposizione

| File | Cosa conteneva | Correzione |
|---|---|---|
| `app/(frontend)/[locale]/layout.tsx` | `<title>`/meta description/OG/Twitter dell'homepage, 15 locale — "Sync your smartwatch to a personal dashboard" | Qualificatore "app" inserito in tutte le 15 locale (titles + descriptions) |
| `app/(frontend)/[locale]/(marketing)/page.tsx` | JSON-LD `WebPage` della homepage (`homeLd.name`/`.description`, rami it/es/en) | Stesso pattern applicato ai 3 rami espliciti |
| `lib/content/homepage-copy.ts` | `leadSentence` (15 locale): "FitMesh Sync è la dashboard che unisce…"; passo 3 dell'onboarding (15 locale): **"La tua dashboard è live — Apri il browser da qualsiasi device"** | `leadSentence`: soggetto cambiato da "è la dashboard" a "è l'app…in un'unica dashboard". Passo 3: azione sostituita con "apri l'app quando vuoi controllarli", clausola privacy invariata |
| `lib/content/about-copy.ts` | Titolo, meta description, hero paragraph, founder-story — tutti brandizzavano il prodotto come "the health dashboard" / "one premium web dashboard" | Titolo derandizzato (con separatore em dash→due punti, altra violazione EDITORIAL-CORE 8 corretta nello stesso edit); meta/hero/founder-story qualificati "in-app" |
| `lib/product-facts.ts` | `ORG_DESCRIPTIONS` (15 locale, alimenta il JSON-LD Organization su home+about) | Qualificatore "app" inserito in tutte le 15 locale |
| `components/seo/OrganizationJsonLd.tsx` | `alternateName: ["FitMesh", "FitMesh Sync Health Dashboard"]` | Rimossa la seconda voce (nome non verificato/mai usato altrove, EDITORIAL-CORE regola 2) |
| `lib/seo/entities.ts` | Bio del founder nel JSON-LD `Person`, presente su ogni pagina, 11 locale — "fill the gap between my smartwatch and a real personal dashboard" | Qualificatore "in the app"/equivalente inserito in tutte le 11 locale, voce narrativa in prima persona preservata |
| `lib/llms-txt.ts` | 2 frasi in `/llms.txt` (unico documento inglese, servito live senza auth/noindex) | Entrambe qualificate "inside the app" / "in-app dashboard" |
| `app/(frontend)/[locale]/(marketing)/terms/page.tsx` | Termini di Servizio, Sezione 2 ("Cos'è FitMesh Sync") e Sezione 5 ("Account e dati"), it/en/es/de/pt/fr (con fallback silenzioso EN su altre 9 locale → falso vivo su 10/15 URL) | Sezione 2: "…permettendoti di visualizzarli nell'app mobile." Sezione 5: "dashboard" → "area account web" (la cancellazione via web resta reale; il periodo di 24 ore non è stato toccato) |
| `app/(frontend)/[locale]/(marketing)/roadmap/page.tsx` | Voce roadmap "Dashboard web nativa" con `status: "live"` (badge letterale "Live"/"Disponibile") | `status` → `"in-progress"` (valore di enum già esistente, badge "In sviluppo" già tradotto in 15 locale). Titolo lasciato invariato: nominare una feature pianificata è corretto, il problema era lo stato |
| `app/(frontend)/[locale]/(marketing)/lp/[slug]/page.tsx` | CTA finale condivisa da **ogni** pagina `/lp/{slug}`, 15 locale: "Scarica FitMesh Sync…La dashboard web è inclusa." | Seconda frase rimossa in tutte le 15 locale |
| `app/(frontend)/[locale]/(marketing)/fitness-data-sync/page.tsx` | Sottotitolo "Android, iPhone, e la dashboard web" + paragrafo "La dashboard stessa è disponibile sul web oltre alle app mobile" (it/en/es/de) | Clausola web rimossa dal sottotitolo; frase interamente rimossa dal paragrafo |

### Blog (17 articoli corretti, ~110 occorrenze)

`come-funziona-fitmesh.ts` (pattern a densità più alta: sottotitolo, meta description es/de/pt/fr, TLDR, paragrafo di apertura, riga tabella comparativa rimossa, CTA di chiusura, 2 FAQ, 2 keyword SEO, passo 3 dei "3 passi per iniziare", 2 riferimenti alla cancellazione account rietichettati "area web dell'account"), `anello-colmi-r02-affidabile.ts`, `fitmesh-gratis-prezzo-founder.ts` (incluse una riga di tabella comparativa e una voce elenco benefici, corrette in una seconda passata dopo che la prima aveva lasciato alcuni residui adiacenti non compresi nel ledger originale), `cambiare-smartwatch-senza-perdere-dati.ts`, `alternative-app-sync-wearable-2026.ts`, `backup-galaxy-watch-pc.ts`, `google-fit-api-dismissione-2026.ts`, `best-health-data-sync-app-android.ts`, `best-smartwatch-for-elderly.ts`, `come-funziona-health-connect.ts`, `esportare-dati-fitbit-google.ts`, `esportare-dati-garmin.ts`, `fitbit-data-not-syncing-android.ts`, `fitmesh-arriva-su-iphone.ts`, `guida-sync-wearable-2026.ts`, `health-connect-vs-samsung-health.ts`, `hrv-cose-significato-valori.ts`.

### Contenuti minori

`lib/content/faqs.ts` (FAQ "funziona offline?", 15 locale), `lib/content/fitness-data-sync-copy.ts` (tassonomia architetture sync, it/en/es/de — riformulata "un dashboard nella propria app" mantenendo la tassonomia a 3 categorie intatta), `lib/labs/hrv/content.ts`, `lib/labs/sleep-efficiency/content.ts`, `lib/compatibility/matrix-data.ts` (9 voci, 1 corretta — le altre 8 descrivono esplicitamente il percorso dell'app Android/iOS, nessun claim web), `lib/compatibility/glossary-data.ts`, `components/compatibility/CompatibilityMatrix.tsx`.

## Verifica di completezza post-correzione

Dopo il primo giro di correzioni, tre agenti hanno segnalato di aver lasciato intenzionalmente intatte frasi adiacenti con lo stesso pattern falso, perché non comprese nella loro sezione del ledger originale (regola "non toccare ciò che non è elencato"). Verificate e corrette manualmente in un secondo passaggio: `anello-colmi-r02-affidabile.ts` (una frase nel corpo "CTA" con "nel pannello web…accessibile da qualsiasi browser"), `fitmesh-gratis-prezzo-founder.ts` (un paragrafo, una voce elenco, un paragrafo Pro, una riga tabella — 4 punti), `come-funziona-fitmesh.ts` (passo 3 dei "3 passi", meta description es/de/pt/fr, 2 keyword SEO, 2 frasi sulla cancellazione account rietichettate).

Scansione finale (grep automatizzata su tutti i 36+ file toccati per i pattern "dashboard web"/"web dashboard"/"pannello web"/"da qualsiasi browser" ecc.) non ha trovato ulteriori residui azionabili. Le uniche 3 occorrenze residue trovate sono legittime e non toccate: il titolo della voce roadmap (ora corretta a "in-progress", il nome resta accurato), una frase generica su cosa *potrebbe* esporre un'app di terze parti in `backup-galaxy-watch-pc.ts` (non è un claim FitMesh), e un claim su Fitbit.com in `esportare-dati-fitbit-google.ts` (dashboard di terzi, dismessa — fuori perimetro).

Nessun em dash introdotto da queste correzioni (verificato via grep sul diff): i separatori "FitMesh Sync — …" preesistenti nei titoli di homepage/about sono un pattern sitewide preesistente, non toccato da questo sprint tranne nel titolo di `/about` dove era comunque necessario riscrivere la frase (sostituito con i due punti). **Segnalazione per una futura pulizia governance**: questo separatore em dash appare in molti altri titoli del sito non coperti da questo sprint (regola EDITORIAL-CORE 8, nessuna eccezione applicabile) — non corretto qui perché fuori perimetro (non è un claim sulla dashboard).

## Verdetto separato: cancellazione account (Privacy, Terms, /delete-account)

Richiesto esplicitamente dal brief. **Verificato accurato, nessuna correzione di tempistica necessaria**:
- Il meccanismo (24 ore di grazia, poi elaborazione automatica) è reale e confermato vivo in produzione (migration `20260616070752_schedule_process_deletions_cron.sql`, cron ogni 10 minuti).
- `app/(frontend)/delete-account/*`: zero occorrenze di "dashboard" (letto per intero).
- `lib/content/delete-account-copy.ts`: la frase sulla richiesta dalla "dashboard web" con 24 ore di grazia è consistente col meccanismo verificato; la frase "non ancora disponibile dalla dashboard web" per l'export dati è già correttamente etichettata come non disponibile. Nessuna modifica.
- L'unica correzione in quest'area (Termini di Servizio, Sezione 5, e le 2 frasi di cancellazione in `come-funziona-fitmesh.ts`) ha sostituito l'etichetta "dashboard" con "area account web" per la pagina da cui si effettua la richiesta, **senza toccare le 24 ore** — la pagina esiste davvero (`/app/settings`, gated), semplicemente non è "la dashboard" (quella mostra dati placeholder, questa gestisce l'account).

## Escalation: richiedono una decisione di Matteo, nessuna modifica applicata

### A. Pagine il cui intero argomento/premessa è la dashboard web (redirect / noindex / riscrittura)

Non correggibili con un editing minimale: rimuovere il claim smonta la struttura dell'H1/meta/TLDR/tabella comparativa/FAQ della pagina.

| File | Problema | Opzioni |
|---|---|---|
| `lib/blog/posts/dati-pixel-watch-dashboard.ts` | H1, meta, TLDR, diagramma, tabella "dove lo vedi", paragrafo "Verificato", CTA, 2 FAQ — tutto costruito su "vedi i dati Pixel Watch su una dashboard personale" | Riscrittura attorno al solo flusso dati Health Connect; noindex; o redirect/fusione in un articolo Health Connect generico |
| `lib/blog/posts/esportare-dati-xiaomi-amazfit.ts` | Stesso pattern per Xiaomi/Amazfit, incluso un passo "Accedi alla dashboard web da browser" | Idem |
| `lib/blog/posts/fitmesh-vs-alternative-sync.ts` | L'intero confronto a 4 vie posiziona FitMesh come alla pari di FitnessSyncer per "avere una vera dashboard web", con colonna tabella dedicata e FAQ | Riscrittura del framework di confronto; il verdetto per FitMesh cambia se la dashboard web non è più una differenziazione |
| `lib/blog/posts/how-to-export-apple-health-data.ts` | Sezione dedicata "Metodo 3: Dashboard web" che presenta FitMesh iOS come implementazione funzionante | Riscrittura o rimozione del Metodo 3 (la struttura a 3 metodi va rivista) |
| `lib/blog/posts/sincronizzare-withings.ts` | Sezione "FitMesh Sync e Withings" (~600 parole) è un intero pitch per una dashboard web inesistente | Riscrittura o rimozione della sezione (il resto dell'articolo su Withings generico non è toccato) |
| `lib/blog/posts/vedere-dati-wearable-browser-pc.ts` | La seconda metà dell'intero articolo (titolo di sezione, corpo, callout, albero decisionale, riepilogo, CTA) è costruita per presentare FitMesh come dashboard web funzionante | Riscrittura sostanziale o noindex; il contenuto di confronto tra terzi potrebbe reggersi da solo senza il pitch FitMesh |
| `lib/landing/data.ts` | **38 occorrenze** su ~10 landing page SEO (`/lp/{slug}`): backup Galaxy Watch, alternativa Fitbit, alternativa Garmin, alternativa Oura, alternativa Polar, Android+iPhone unificato, Colmi ring, dashboard Apple Health, dashboard Health Connect, sleep tracker. **Le keyword primarie/secondarie di più pagine sono letteralmente "web dashboard"/"dashboard alternative"** | Decisione per pagina: riscrittura del posizionamento SEO, noindex, o redirect. Una modifica di questa portata cambia l'obiettivo di ranking di ogni pagina coinvolta |
| `lib/providers/data.ts` | 13 occorrenze sulle pagine `/sync/[provider]`, incluso il claim più diretto trovato in tutto l'audit: FAQ Galaxy Watch **"Can I see Galaxy Watch data in a web dashboard? — Yes. FitMesh provides a web-based health dashboard… from any browser."** (probabile FAQPage JSON-LD). Claim simili su Pixel Watch, Strava, Apple Health | Stessa decisione di `landing/data.ts`. La FAQ Galaxy Watch/Apple Health è il singolo claim a priorità più alta dell'intero audit per chiarezza e sfacciataggine |
| `lib/blog/nordic-overlay.json` | ~60 occorrenze in danese/svedese su ~25 articoli (overlay per le 4 locale nordiche non tradotte per i contenuti lunghi) | Dipende dalle decisioni sopra: va corretto in lockstep con qualunque riscrittura EN/IT dei post sorgente, non isolatamente |

### B. Decisioni di prodotto/copy separate (non SEO, ma comunque non decidibili da un editing meccanico)

| Superficie | Problema | Nota |
|---|---|---|
| `lib/dictionaries/*.json` (15 file, riga ~56) | Tagline del footer, ripetuta su **ogni pagina del sito**: "Sync your smartwatch data to a premium dashboard of your own" ecc. Vicino all'hero è chiaramente l'app (badge Android/iOS, CTA download); lontano dall'hero (blog, legale, supporto) perde quel contesto | Serve una decisione di wording in 15 lingue, non un edit meccanico |
| `lib/dictionaries/*.json` (15 file, riga ~144) | "Tutto solo per la tua dashboard personale e gamification" — clausola di finalità privacy che presuppone dati reali mostrati nella dashboard, mentre oggi mostra solo placeholder | Decisione privacy/prodotto: la clausola di finalità va riformulata per riflettere lo stato attuale, non solo un problema di wording |
| `app/(frontend)/[locale]/(marketing)/press/page.tsx` | Tagline pronta per la stampa, ripetuta 11 volte: "FitMesh Sync is the privacy-first premium dashboard for all your family's smartwatch data" — pensata per essere citata fuori contesto da un giornalista | Aggiungere "app" potrebbe suonare peggio in una riga da citare; decisione di copy per Matteo |
| `lib/social-proof/data.ts` | "Real founders, real dashboard." | Non live oggi (array testimonianze vuoto), bassa urgenza ma da correggere prima che la sezione venga popolata |
| `lib/email/templates/beta-welcome.ts` | Email di benvenuto descrive l'app come portante "tutti i tuoi dati smartwatch in un'unica dashboard salute unificata" | Decisione su come descrivere onestamente lo stato attuale di AppHome (solo placeholder) senza over-promise in un'email che arriva prima di ogni sincronizzazione |
| `lib/providers/data.ts` riga 303-304 | Testo copy incoerente tra locale (en/de/pt/tr dicono "dashboard", es/fr dicono "home screen") per un "pulsante di sync sulla dashboard" — verificato che AppHome non ha alcun pulsante di sync manuale | Serve una decisione su cosa descrivere realmente (il sync è automatico in background, non manuale da un pulsante web) |
| `lib/blog/posts/huawei-health-health-connect-sincronizzazione.ts` (fr) | La variante francese aggiunge "prochainement" (presto) a un'integrazione futura — promessa di ETA vietata da EDITORIAL-CORE regola 4, indipendente dal tema dashboard | Segnalato per revisione editoriale separata |
| `lib/blog/posts/tracciare-sonno-anello.ts` | Contraddizione interna: un bullet iniziale afferma al presente che l'app unisce già i dati anello+smartwatch in un'unica dashboard; un paragrafo successivo descrive lo stesso accesso come non ancora disponibile ("non appena disponibile") | Le due frasi vanno riconciliate, non corrette isolatamente |
| ~10 file di blog con un singolo claim confinato (elenco completo nel journal del workflow) | Claim "dashboard web accessibile da browser" confinati a una frase/CTA in articoli altrimenti non correlati (es. `dove-sono-i-tuoi-dati-server-ue.ts`, `novita-fitmesh-su-app-store.ts`, `passi-non-si-sincronizzano-galaxy-watch.ts`, `smartwatch-estate-2026.ts`, `smartwatch-per-anziani-guida.ts`, `sync-samsung-health-google-fit.ts`) | Correggibili con un edit puntuale, ma lasciati per un editor/Matteo perché toccano contenuto privacy-adiacente (SITE-WRITING regola 17) o link incrociati a pagine in Escalation A |

## Dati di esposizione (GSC)

Nessun dato GSC fresco disponibile localmente: l'unico report giornaliero presente in `docs/seo/daily/` risale al 27/05/2026 (quasi 4 mesi fa) e le credenziali dell'API GSC non sono configurate in questo ambiente. La prioritizzazione sopra si basa quindi su segnali strutturali verificabili (indicizzabilità, tipo di pagina, posizione nel funnel) piuttosto che su clic/impressioni misurate: **homepage e `/about`** sono a priorità massima per costruzione (pagine più linkate/brandizzate del sito, indicizzate in tutte le 15 locale); i Termini di Servizio sono ad alta priorità perché è un documento legale, non per traffico; le pagine `/sync/[provider]` e `/lp/{slug}` sono presumibilmente ad alto traffico organico perché costruite apposta per intercettare ricerche di confronto/alternative, ma nessuna cifra di clic/impressioni è stata attribuita qui — nessuna conversione è stata attribuita a nessuna pagina, come richiesto.

## Verifiche eseguite prima della consegna

Tutte eseguite in Docker (`node:22`, pnpm pinnato a 11.15.0 da `packageManager`, `--config.verify-deps-before-run=false`, mai `CI=true`), montando anche la directory padre del worktree perché i guardrail che chiamano `git` risolvano il gitdir reale.

- `pnpm governance:check` — ✅ OK dopo una correzione: il primo giro ha rifiutato 11 em dash su righe che questo sprint stava già riscrivendo (titolo/meta homepage, 8 locale in `layout.tsx` + `homeLd` in `page.tsx`) — non erano nuovi caratteri ma la riga toccata rientrava nel controllo diff. Sostituiti con i due punti (le locale de/pt/fr/sv/da/no/fi usavano già i due punti). Il check finale: 243 file nel perimetro, 1000 occorrenze preesistenti tollerate, **zero nuove**, e nota di bonifica (64 occorrenze in meno rispetto alla baseline).
- `npx tsc --noEmit` — ✅ nessun errore.
- `pnpm test -- run` (vitest) — ✅ **1181 passati, 23 skippati intenzionalmente, 0 falliti** su 1204 test totali (60/62 file; i primi 4 fallimenti apparenti in `billing-route-fixtures/manifesto.test.ts` erano un artefatto del mount Docker senza la directory padre del worktree, spariti al secondo giro con il mount corretto).
- `pnpm run build` (next build) — ✅ completata senza errori, tutte le route generate per le 15 locale (incluse `/terms`, `/sync/[provider]`, `/sync/[provider]/[model]`, `/roadmap`, `/`, `/about`).
- `pnpm run seo:truth-check` (coerenza `/llms.txt`) — ✅ 10304 caratteri generati, 15 locale JSON-LD verificate, 138 file scansionati per claim obsolete, nessun problema.
- `pnpm run seo:structured-data-check` (guardrail P0.16 JSON-LD) — ✅ nessun `SoftwareApplication`/`MobileApplication` incompleto, nessun `aggregateRating` senza fonte, nessun `@id` duplicato (controlli live saltati perché `BASE_URL` non impostata in locale, non dichiarati verdi).
- `pnpm run blog:locale-near-miss-check` — ✅ nessuna nuova combinazione post/locale near-miss oltre la baseline nota; 4 combinazioni della baseline risultano addirittura migliorate.
- Scansione manuale finale per claim residui "dashboard web"/"web dashboard"/"pannello web"/"da qualsiasi browser" su tutti i file toccati: 3 residui trovati, tutti legittimi e lasciati intenzionalmente (titolo roadmap ora coerente col suo `status: "in-progress"`; una frase generica su app di terze parti in `backup-galaxy-watch-pc.ts`; un claim su Fitbit.com dismesso in `esportare-dati-fitbit-google.ts`).

Non eseguiti (fuori perimetro per questo sprint, solo contenuti): `suite:perimetro-check` e il gate backend con PG17 effimero (nessuna migration toccata).

---

## MICRO-GATE P0.24-C-A (23/09) — FAQ provider + tabella whole-page-promise

Mandato: (1) correggere le FAQ provider che affermano esplicitamente la disponibilità della dashboard web, in ogni lingua pubblicata, verificando la parità risposta visibile/FAQPage JSON-LD, senza sostituire il claim con una nuova promessa commerciale; (2) consegnare una tabella URL per URL, con proposta motivata (non decisa), per le pagine la cui intera premessa dipende dalla dashboard web.

### 1. FAQ provider corrette — `lib/providers/data.ts`

Scansionati tutti i 17 blocchi `faqs:` del file (uno per provider). Trovate e corrette **4 coppie domanda/risposta su 3 provider**, tutte le lingue effettivamente pubblicate per ciascuna (11 lingue: it/en/es/de/pt/fr/pl/tr/nl/ja/ko — il file non copre sv/da/no/fi):

| Provider | Domanda | Prima | Dopo |
|---|---|---|---|
| Galaxy Watch | "Posso vedere i dati del mio Galaxy Watch in una dashboard web?" | "Sì. FitMesh fornisce una dashboard di salute basata su browser..." | "No: FitMesh non ha una dashboard web. I dati... si vedono nell'app FitMesh." (domanda invariata, risposta onesta) |
| Pixel Watch | "Posso esportare i dati del Pixel Watch in un foglio di calcolo tramite FitMesh?" | "Sì. La dashboard web di FitMesh ti consente di visualizzare **ed esportare**... come **CSV o JSON**" | "Sì. Puoi scaricare una copia completa dei tuoi dati... in formato **JSON** direttamente dall'app FitMesh..." (tolto sia il claim di visualizzazione web sia **CSV**, mai esistito) |
| Apple Health (#1) | "Posso esportare i dati di Apple Health utilizzando FitMesh?" | "Sì. FitMesh fornisce una dashboard web dove puoi visualizzare e esportare... per intervallo di date" | Stesso trattamento: solo export **JSON** dall'app, tolto il claim di visualizzazione web e il filtro per intervallo date (mai verificato) |
| Apple Health (#2) | "FitMesh è disponibile sia per iPhone che per Android?" | "...puoi visualizzarli su qualsiasi dispositivo **attraverso la dashboard web**" | "...li ritrovi **nell'app** su qualsiasi dispositivo tu usi" (tenuto il vero: stesso account, sync multipiattaforma) |

**Verifica CSV**: prima di correggere, verificato nel codice (`ExportDataClient.tsx`, `export/page.tsx`, tutte le 15 locale) che l'unico formato di export account realmente implementato è **JSON** — nessun percorso CSV esiste. Il claim "CSV o JSON" nella FAQ Pixel Watch era quindi doppiamente falso (formato, non solo canale). Non ho aggiunto alcuna promessa nuova: l'unica cosa affermata come disponibile è l'export JSON, già verificato in P0.24-C base.

**Parità risposta visibile / FAQPage JSON-LD**: verificata per costruzione, non per test aggiuntivo — `app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx` genera sia il rendering visibile (riga ~923, `p.faqs.map(...)`, testo tramite `tl(f.q, lc)`/`tl(f.a, lc)`) sia il JSON-LD FAQPage (riga ~272, stesso `p.faqs.map(...)`, stessa funzione `tl()`) dalla stessa fonte `p.faqs`, nello stesso file. Non esiste un secondo punto dove il FAQPage potrebbe divergere dal testo visibile: correggere l'array corregge entrambi, sempre, per ogni lingua.

**Scansione di completezza**: ripetuta su tutti i 17 blocchi FAQ con un pattern più ampio (`web dashboard|dashboard web|pannello web|...|any browser|from any device`). Tre FAQ apparentemente simili — Strava, Polar, Withings — usano "dashboard" senza mai "web"/"browser": descrivono la dashboard dell'app mobile reale, non toccate. Nessun altro provider ha un claim di disponibilità web nelle sue FAQ.

**Lasciato fuori da questa correzione, per rispettare lo scope letterale del mandato ("le FAQ")**:
- Il `longDesc` del Galaxy Watch (righe 261-269, tutte le 11 lingue: "...li mostra su una dashboard web personale...") ripete lo stesso claim falso ma **non è una FAQ** — è il paragrafo descrittivo della pagina. Ora la pagina Galaxy Watch è incoerente al suo interno: il `longDesc` promette ancora la dashboard web, la FAQ appena sotto lo smentisce. Segnalato, non corretto: possibile micro-gate successivo.
- Una FAQ Galaxy Watch separata (righe 303-309, "Apri FitMesh e tocca il pulsante di sincronizzazione **nel pannello di dashboard**") descrive un pulsante di sync manuale che, per quanto verificato in questo sprint, non esiste in `AppHome` (il sync è automatico in background, nessun pulsante manuale trovato). Non è un claim di disponibilità web e non rientra nel mandato di questo micro-gate; segnalato come debito separato.
- Le liste `seoKeywords` (es. "galaxy watch web dashboard", "pixel watch web dashboard", "apple health web dashboard") non sono FAQ: restano invariate. Ora sono in parte disallineate dal contenuto reale della pagina (keyword promette "dashboard", pagina lo smentisce) — decisione di targeting SEO, non un edit meccanico, fuori scope di questo micro-gate.

### 2. Tabella whole-page-promise — proposta, nessuna decisione presa

18 URL (6 articoli blog + 12 landing page `/lp/*`) la cui intera premessa dipende da una dashboard web non disponibile. Per ciascuna: URL canonico (IT = slug chiave, sempre indicizzato; EN sempre indicizzato; le altre 9 locale lo sono solo se ogni campo traducibile per quella lingua è completo e diverso dall'inglese — nessuna verifica per-locale eseguita qui, regola strutturale in `lib/blog/indexability.ts` / `lib/landing/indexability.ts`), il problema, e una proposta motivata. **Nessuna azione eseguita**: né riscrittura, né noindex, né redirect.

#### Articoli blog

| # | URL (IT / EN) | Problema | Proposta | Motivazione |
|---|---|---|---|---|
| 1 | `/it/blog/dati-pixel-watch-dashboard` · `/en/blog/pixel-watch-data-personal-dashboard` | H1, meta, TLDR, diagramma, tabella "dove lo vedi", CTA, 2 FAQ: intera tesi "vedi i dati Pixel Watch su una dashboard personale" | **Riscrittura** | Il valore informativo reale (flusso dati Pixel Watch → Google Health → Health Connect → FitMesh) sopravvive rimuovendo la sola promessa di visualizzazione web; nessun rischio di perdere il resto dell'articolo |
| 2 | `/it/blog/esportare-dati-xiaomi-amazfit` · `/en/blog/xiaomi-amazfit-health-connect-data-dashboard` | Stesso pattern per Xiaomi/Amazfit, incluso un passo "Accedi alla dashboard web da browser" | **Riscrittura** | Stessa motivazione del #1 |
| 3 | `/it/blog/fitmesh-vs-alternative-sync` · `/en/blog/fitmesh-sync-vs-alternatives` | L'intero framework di confronto a 4 vie posiziona FitMesh alla pari di FitnessSyncer per "avere una vera dashboard web" (tabella dedicata + FAQ); senza quel claim FitMesh scivola verso il gruppo Health Sync/Gadgetbridge (solo ponte, nessuna dashboard) | **Ritiro temporaneo (noindex)**, riscrittura da programmare | Il verdetto competitivo dell'articolo cambia sostanzialmente, non solo il testo: è una decisione di posizionamento, non un edit. Alternativa più rapida ma più rischiosa: riscrittura diretta riposizionando FitMesh nel gruppo bridge-only |
| 4 | `/it/blog/how-to-export-apple-health-data` · `/en/blog/how-to-export-apple-health-data` | "Metodo 3: Dashboard web" è una sezione su tre nella guida all'export | **Riscrittura** (rischio basso) | Rimuovere/riscrivere un metodo su tre non compromette gli altri due (export nativo Apple + eventuale terzo metodo reale) |
| 5 | `/it/blog/sincronizzare-withings` · `/en/blog/sync-withings-data` | Sezione autonoma "FitMesh Sync e Withings" (~600 parole) è un pitch per una dashboard web inesistente, incastonata in un articolo più ampio su Withings via Health Connect/HealthKit (quella parte resta corretta) | **Riscrittura** (rischio basso-medio) | Sezione isolabile, resto dell'articolo indipendente e già corretto |
| 6 | `/it/blog/vedere-dati-wearable-browser-pc` · `/en/blog/view-smartwatch-data-on-pc` | Titolo e seconda metà dell'intero articolo ESISTONO per rispondere "come vedo i dati wearable nel browser" — la tabella di confronto di terze parti (FitnessSyncer, Gadgetbridge, ecc.) può avere valore informativo autonomo, ma il pitch FitMesh (CTA, albero decisionale) presuppone la funzione che non c'è | **Ritiro temporaneo (noindex)**, rivalutare riposizionamento | Il titolo stesso promette una risposta che oggi FitMesh non dà; una riscrittura "onesta" rischia di ammettere involontariamente che FitMesh non risolve il problema per cui la pagina è pensata di posizionarsi — decisione di prodotto/marketing, non solo editoriale |

Nota: `lib/blog/nordic-overlay.json` ripete alcune di queste stesse pagine in danese/svedese (~60 righe su ~25 post, cifra complessiva già segnalata nel corpo principale del ledger): va corretto in lockstep con qualunque riscrittura EN/IT decisa sopra, non isolatamente.

#### Landing page `/lp/*` (tutte le 12 esistenti — ogni landing page del sito ha questo problema)

| # | URL (IT / EN, slug invariante per locale) | Problema | Proposta | Motivazione |
|---|---|---|---|---|
| 7 | `/it/lp/backup-galaxy-watch` · `/en/lp/backup-galaxy-watch` | "Backup automatico dati Galaxy Watch su una dashboard che possiedi" | **Riscrittura** | Il valore reale (backup cloud automatico senza Samsung Cloud) non dipende dalla visualizzazione web |
| 8 | `/it/lp/fitbit-export-google` · `/en/lp/fitbit-export-google` | Keyword primaria/secondarie letteralmente "dashboard alternativa a Fitbit"; l'intent di ricerca presuppone una vista, non solo un export | **Redirect a `/sync/fitbit`** (alternativa: ritiro temporaneo) | La pagina provider Fitbit copre già lo stesso argomento con un posizionamento onesto; riscrivere qui manterrebbe comunque un mismatch tra intent di ricerca ("dashboard") e offerta reale |
| 9 | `/it/lp/garmin-connect-pc` · `/en/lp/garmin-connect-pc` | "Dashboard alternativa accessibile da PC, oltre a Garmin Connect web" | **Redirect a `/sync/garmin`** (alternativa: ritiro temporaneo) | Stessa motivazione del #8 |
| 10 | `/it/lp/oura-ring-sync` · `/en/lp/oura-ring-sync` | "Dashboard web per Oura Ring" | **Redirect a `/sync/oura`** (alternativa: ritiro temporaneo) | Stessa motivazione del #8 |
| 11 | `/it/lp/polar-flow-sync` · `/en/lp/polar-flow-sync` | "Dashboard web per Polar Flow" | **Redirect a `/sync/polar`** (alternativa: ritiro temporaneo) | Stessa motivazione del #8 |
| 12 | `/it/lp/due-telefoni` · `/en/lp/due-telefoni` | "Stessa dashboard su entrambi i telefoni", "dashboard immediatamente attiva su entrambe le piattaforme" | **Riscrittura** (rischio basso) | Il valore reale (un account, stesso dato su Android e iPhone) sopravvive riformulando "stesso account, stessi dati" invece di "stessa dashboard" |
| 13 | `/it/lp/anello-smart-sonno` · `/en/lp/anello-smart-sonno` | "Dashboard web unificata" anello+smartwatch, focus sonno | **Riscrittura** (rischio medio) | Il merge dati anello+smartwatch è reale nell'app; la promessa centrale sopravvive riformulata come funzione app, non web |
| 14 | `/it/lp/apple-health-export` · `/en/lp/apple-health-export` | "Dashboard web per Apple Health su iOS" | **Riscrittura** | Stesso trattamento applicato con successo alla FAQ Apple Health in questo stesso micro-gate: export JSON + visualizzazione in app |
| 15 | `/it/lp/health-connect-dashboard` · `/en/lp/health-connect-dashboard` | Lo **slug stesso** contiene "dashboard"; keyword primaria "health connect dashboard"/"health connect web dashboard" | **Ritiro temporaneo (noindex)**, decisione su slug/redirect a parte | Una riscrittura del solo contenuto non risolve l'incoerenza slug↔realtà; cambiare lo slug è una decisione SEO/redirect esplicitamente fuori dal mandato di editing di questo sprint |
| 16 | `/it/lp/sleep-tracking` · `/en/lp/sleep-tracking` | Un'occorrenza: "traccia il sonno da qualunque wearable Android in un'unica dashboard" | **Riscrittura** (rischio basso) | Occorrenza singola, isolata, facilmente riformulabile come funzione app |
| 17 | `/it/lp/google-fit-alternative` · `/en/lp/google-fit-alternative` | "FitMesh è la migliore alternativa: una dashboard che legge..." | **Riscrittura** (rischio basso) | Il posizionamento "alternativa a Google Fit" non dipende dalla parola "dashboard"; riformulabile come "l'app che legge i tuoi dati Health Connect" |
| 18 | `/it/lp/colmi-ring-sync` · `/en/lp/colmi-ring-sync` | "Dashboard web unificata" anello Colmi + smartwatch | **Riscrittura** (rischio medio) | Stessa motivazione del #13: connessione BLE diretta e merge dati sono reali nell'app |

**Come leggere le proposte**: "Riscrittura" = il valore/argomento centrale della pagina sopravvive rimuovendo la sola promessa web, editing di contenuto normale. "Ritiro temporaneo (noindex)" = il contenuto in questa forma non può diventare onesto senza una decisione di posizionamento/prodotto che va oltre l'editing (il verdetto stesso della pagina cambia). "Redirect" = esiste già una pagina più onesta sullo stesso argomento (`/sync/[provider]`) che può assorbire l'intent di ricerca. Nessuna di queste azioni è stata eseguita: sono proposte per una decisione esplicita.
