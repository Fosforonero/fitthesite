# Piano Editoriale SEO/GEO Internazionale — FitMesh (2026-2027)

> Documento VIVO: si segue e si aggiorna secondo le necessità. Fonte: strategia
> Matteo (15/06) + audit dello stato attuale + regole brand/YMYL del progetto.

## Posizionamento (non negoziabile)
- Nicchia: **"possiedi, comprendi e valorizza i tuoi dati salute"** — NON fitness/dieta/bodybuilding generico.
- Messaggio centrale: *"I tuoi dati salute appartengono a te. FitMesh ti aiuta a raccoglierli,
  comprenderli e usarli in un'unica dashboard, qualunque dispositivo indossi."*
- Comunica: proprietà dei dati, consapevolezza, monitoraggio personale, privacy, health analytics.

## Regole permanenti
- **Niente competitor** in pagine/keyword/confronti (Oura, Whoop, Health Sync, ecc.). NO "X vs competitor".
  Device/standard supportati OK (Galaxy Watch, Wear OS, Colmi, Health Connect, HealthKit). Confronti solo generici
  ("anello vs smartwatch"). Benchmark competitor = SOLO locale (`~/Documents/.../_internal-strategy/`), mai in git.
- **YMYL-safe**: niente claim medici; trend/recupero/pattern/baseline, mai diagnosi/cura.
- **No em-dash** nei testi pubblici; entità canoniche coerenti; tono tecnico-chiaro.
- **GEO oltre SEO**: ogni articolo ottimizzato anche per AI search (AI Overview/Perplexity/ChatGPT):
  risposta netta in apertura, FAQ, entità coerenti, JSON-LD, aggiornare `llms.txt`.

## Lingue (sequenza, una alla volta)
- Attive: **IT, EN**. In corso: **ES** (Fase A live; articoli ES in migrazione).
- Prossime (per mercato): **PT-BR, DE, FR**. Futuro: NL, PL, poi TR, JP.
- Regola: NON aprire una nuova lingua finché la precedente non ha contenuti completi.

## Pillar pages (DA FARE — il gap strutturale principale)
Hub-and-spoke: 6 pillar che linkano i cluster.
1. Health Connect · 2. Wearable & Smartwatch · 3. Smart Ring · 4. Privacy & Health Data
5. HRV & Recovery · 6. Quantified Self / Personal Health Analytics

## Inventario vs piano (stato 15/06 — 33 articoli IT/EN, ES in corso)

### ✅ Già coperti (mappa piano → esistente)
- **Health Connect**: come-funziona-health-connect, health-connect-vs-samsung-health,
  health-connect-not-syncing, google-fit-api-dismissione-2026 (angolo deprecazione 2026, ex google-fit-cierra-alternativas-health-connect).
- **Galaxy Watch**: backup-galaxy-watch-pc, passi-non-si-sincronizzano-galaxy-watch, vedere-dati-wearable-browser-pc.
- **Dashboard**: novita-dashboard-multi-device, piu-smartwatch-insieme-dati-doppi.
- **Smart Ring**: anello-vs-smartwatch, migliori-anelli-economici, colmi-r02-setup, colmi-ring-fitmesh,
  tracciare-sonno-anello, dati-anello-smart-apple-salute.
- **Privacy**: gdpr-dati-fitness-smartwatch. **HRV**: hrv-cose-significato-valori.
- **Export/Sync**: esportare-dati-garmin, esportare-dati-fitbit-google, how-to-export-apple-health-data,
  sync-samsung-health-google-fit, alternative-app-sync-wearable-2026, best-health-data-sync-app-android.
- **Smartwatch**: smartwatch-per-anziani-guida, best-smartwatch-for-elderly, scegliere-smartwatch-dati-2026,
  guida-sync-wearable-2026, smartwatch-estate-2026. **News**: novita-*, fitmesh-arriva-su-iphone, disponibile-google-play.

### ❌ Gap da scrivere (priorità)
1. **6 Pillar pages** (hub).
2. **Cluster Sonno** (5): come misurano il sonno, sleep score, migliorare il sonno coi dati, REM, dispositivi.
3. **Cluster Stress** (5): come si misura, stress e HRV, sensori, ridurlo col monitoraggio, limiti.
4. **HRV in profondità** (4 oltre l'intro): interpretare, HRV+stress, HRV+sonno, HRV+recupero.
5. **Quantified Self** (5) + **Biohacking** (5): consapevolezza data-driven, personal analytics, sistema personale.
6. Singoli: "collegare più app a Health Connect", export/privacy Galaxy specifici.
7. **Product-led** (dopo indicatori app): "cosa dice il tuo Recovery / FitMesh Score" — contenuto unico non copiabile.

## Cadenza & priorità
- Gap-first (non volume puro): pillar → cluster mancanti (Sonno/Stress/HRV-depth) → QS/Biohacking.
- Ritmo sostenibile con assist AI + dedup. Evitare cannibalizzazione (mappare sempre sull'esistente).

## KPI (orientativi)
- 3 mesi: pillar + cluster Sonno/Stress live; ES completo; prime keyword.
- 6 mesi: HRV/QS completi; PT/DE avviati; traffico organico costante.
- 12 mesi: riferimento "wearable analytics / health data aggregation"; AI-search citabile.

## Per ogni articolo (checklist)
EN/IT base → traduzione umanizzata (glossario) → FAQ → JSON-LD Article/FAQ → OG dedicato →
hero image → internal link (home, dashboard, privacy, pillar, correlati) → IndexNow ping.

## FitMesh Labs — categoria separata dagli articoli (nuovo, Sprint P1.0, 2026-07-16)

`/labs` non è un articolo del piano editoriale sopra: è una nuova categoria
di contenuto, calcolatori interattivi standalone (registry in
`lib/labs/registry.ts`), non un pillar/cluster testuale. Regole proprie:
- **Solo IT/EN** (non segue la sequenza lingue generale del piano sopra —
  policy dedicata, non ancora estesa a ES/PT/DE/FR).
- **Un solo tool live per ora**: calcolatore HRV RMSSD/SDNN
  (`/it/labs/calcolatore-hrv-rmssd`, `/en/labs/hrv-rmssd-calculator`).
  Sleep Efficiency e Heart Rate Zones registrati come "in preparazione"
  (nessun URL, nessuna pagina vuota indicizzabile).
  Vedi `docs/seo/seo-geo-master-plan.md` sezione "P1 — FitMesh Labs
  foundation" per impatto/effort/dipendenze, e
  `docs/seo/seo-results-log.md` sezione "Sprint P1.0" per lo stato di
  verifica.
- **Collegato al cluster HRV esistente** (pillar 5, "HRV & Recovery"):
  link bidirezionale fra l'articolo `hrv-cose-significato-valori` (intento
  informativo) e il calcolatore (intento operativo) — non duplica il
  pillar, lo completa. Prossimo cluster HRV-depth (vedi gap #4 sopra) può
  linkare il calcolatore allo stesso modo.
- **Checklist propria** (diversa da quella articoli sopra, vedi Fase 4-8
  dello sprint): risposta diretta + definizioni + formule + esempio
  numerico + limiti + privacy + FAQ + fonti con PMID/DOI + citazione
  strutturata + JSON-LD `@graph` unico (WebPage/WebApplication/
  BreadcrumbList/FAQPage, mai `MedicalWebPage`) + guardrail dedicato
  (`tools/check-labs-truth.ts`).
