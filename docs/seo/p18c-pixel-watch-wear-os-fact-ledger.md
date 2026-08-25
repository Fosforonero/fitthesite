# P1.8C — Fact ledger: Pixel Watch, Wear OS, percorso dati verso FitMesh

Verificato 25/08/2026. Fonti esterne lette direttamente (WebFetch), release prodotto verificata a `v3.9.8+189` (sola lettura, `git show v3.9.8+189:AppFitmesh/flutter_app/...` da `App Orologio/`, mai checkout). Copre `lib/providers/data.ts` (provider `pixel-watch`, `wear-os`), `lib/providers/models.ts` (chiave `pixel-watch`), `lib/blog/posts/dati-pixel-watch-dashboard.ts`, `lib/blog/posts/google-fit-api-dismissione-2026.ts`. Nessuna verifica su dispositivo fisico: latenza e ritardi citati sono commenti/costanti nel codice, non una misura fatta in questa sessione.

## Fase 0 — Baseline e cannibalizzazione

HEAD iniziale del worktree: `b8dc4e1` (= `origin/main`, verificato `git diff origin/main --stat` vuoto). Branch di lavoro: `sprint/p1-8c-pixel-watch-health-api`. PR aperte su `origin`: solo due PR Vercel automatiche stale (#8, #20, "Install Vercel Web Analytics"), nessuna sovrapposizione.

Locale indicizzabili (calcolate con `isBlogVariantIndexable`/`isProviderVariantIndexable`, le funzioni reali, non un elenco a memoria):

| Superficie | Indicizzabili (11) | Non indicizzabili |
|---|---|---|
| `dati-pixel-watch-dashboard` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `google-fit-api-dismissione-2026` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `google-health-google-fit` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `/sync/pixel-watch` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `/sync/wear-os` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `/sync/pixel-watch/pixel-watch-2`, `/pixel-watch-3` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |

Nessuna cannibalizzazione reale: landing Pixel (compatibilità/config), landing Wear OS (compatibilità generale), articolo Pixel (percorso dati/novità), articolo API (dismissioni/migrazione dev), pillar Google Health/Fit (confronto consumer) restano su intenti distinti. `wear-os` provider ha 4 FAQ ma nessun `setupGuide` (a differenza di `pixel-watch`, che ne ha uno) — asimmetria strutturale, non di contenuto.

## Fase 1 — Verità prodotto (release pubblica `v3.9.8+189`)

### Percorso dati reale

**Pixel Watch → app Fitbit (companion) → Health Connect → FitMesh.** FitMesh non ha un'app companion Wear OS nativa in questa release (`ROADMAP.md:645`, "Watch companion app" è backlog Sprint 20 futuro). Il codice **non distingue affatto "Pixel Watch" come dispositivo**: tutto ciò che scrive su Health Connect con package che inizia per `com.fitbit` viene etichettato genericamente `'Fitbit / Pixel Watch'` (`health_repository.dart:2643`). Non esiste alcun riferimento a `com.google.android.apps.fitbit` (il package rinominato dell'app Google Health/Fitbit) in tutto l'albero del tag — **fatto non verificabile da questa sessione**: se l'app reale sul dispositivo usa quel package, FitMesh non ha una entry dedicata e la etichetterebbe "sconosciuto".

### Google Fit / Google Health API: nessuna integrazione diretta

- Nessun client, endpoint o chiave per `fit.googleapis.com` nel codice tracciato (grep esaustivo, 512 file).
- Il vecchio SDK Google Fit (`play-services-fitness`) non è nemmeno compilato (`build.gradle.kts`, 0 riferimenti).
- La nuova Google Health API (`health.googleapis.com`, GA 2026-03-24 secondo `developers.google.com/health/about`) esiste **solo come documentazione di audit non implementata** (`AppFitmesh/docs/google-health/`, roadmap S0→S9 non iniziata). Nessuna cartella `oauth/googlehealth` nel backend del sito.
- Un client OAuth per la **Fitbit Web API legacy** esiste, tecnicamente completo, ma è escluso dalla whitelist provider con ingestione (`kIngestingProviderIds = {suunto, strava, oura}`) e ha `client_id` placeholder di default: **non raggiungibile dall'utente**, mostra sempre "In arrivo".
- `GoogleSignIn` nell'app è cablato solo per login (Supabase auth) e per l'export manuale su Drive — mai per leggere dati salute Google.

**Conclusione:** l'unico canale reale, oggi, per i dati Pixel Watch è Health Connect. Nessuna dicitura tipo "FitMesh si integra con Google Health/Fitbit" è sostenibile: FitMesh legge da Health Connect, punto.

### Dedup multi-wearable

Nessuna somma tra sorgenti: `steps_origin_policy.dart` sceglie **una sola origine vincente** (preferenza utente esplicita > sorgente dominante > totale più alto). Il bridge nativo per-origine (`HealthConnectOriginChannel.kt`) copre **solo STEPS**; per Heart Rate la selezione usa una tabella di priorità fissa per brand, e un package non in tabella riceve priorità 10 (la più bassa). Nessuna gestione speciale per Wear OS/Pixel Watch in questa logica.

### Metriche: lette e mostrate vs assenti

**Lette e mostrate** (Health Connect, Android, manifest verificato riga per riga): passi, frequenza cardiaca (media + a riposo), sonno **con fasi** (hypnogram), HRV (solo RMSSD su Android — SDNN è solo iOS), SpO2, distanza, calorie (attive/totali/basali), allenamenti/esercizi (durata, HR, distanza, calorie, passi, dislivello), peso, altezza, frequenza respiratoria, temperatura cutanea (da `BODY_TEMPERATURE`), pressione, glucosio, acqua, nutrizione.

**Assenti:**
- **VO2max**: mai letto da Health Connect Android. `health_repository.dart:2159` imposta esplicitamente `vo2Max: null` ("tipo non esposto da health 13.1.4"). La card dashboard esiste ma mostra "metrica mancante" su Android.
- **Route GPS** (percorso/polyline dei workout): nessun tipo Health Connect di percorso è richiesto; `HealthSnapshot` non ha alcun campo route/lat/lng. Le coordinate del GPS telefono servono solo al *recorder* interno di FitMesh, non a una lettura da Health Connect.

### Latenza e cadenza (nessun numero inventato: solo costanti/commenti nel codice)

- Sync **automatico**: intervallo scelto dall'utente tra 15/30/60/120/360 minuti (default 30). **15 minuti è il minimo tecnico Android** (limite WorkManager periodic task, non una scelta prodotto). Su iOS nessun intervallo garantito (`frequency: nil`, deciso dal sistema).
- Sync **manuale** ("Sincronizza ora"): bypassa sempre il gate temporale, parte subito.
- Finestra di lettura a ogni sync (automatico e manuale): fissa, da mezzanotte-18h a ora — **non** un backfill storico ampio.
- Backfill storico più ampio (30/90/365gg): solo azione manuale in Impostazioni, opzioni oltre 14gg dietro abbonamento Pro.
- **Ritardi osservati su device reale**, documentati nei commenti del codice: 96–151 minuti su un intervallo configurato di 60 minuti (Doze/scheduling), fino a un caso di 5,5 ore che ha originato la feature di rilevamento "sync in ritardo". L'app stessa avvisa in UI che Android non garantisce il timing esatto (±30% dell'intervallo scelto).
- **Nessuna occorrenza**, in tutto l'albero del tag, di "dati disponibili in pochi secondi"/realtime riferita al sync cloud — le uniche occorrenze di "pochi secondi" riguardano la misura BLE spot dell'anello o il pairing, mai il sync Health Connect.

**Conclusione:** "setup in 5 minuti" e "dati entro pochi secondi" non sono sostenibili per il sync automatico. Latenza tipica onesta: 15–30 minuti (valore già presente altrove nello stesso file provider, riga 915 — la promessa "entro pochi secondi" della FAQ è in **contraddizione interna con lo stesso provider**).

## Fase 2 — Fonti esterne (aperte e lette in questa sessione)

**Pixel Watch 5** (blog.google, 12/08/2026): nessun sensore hardware nuovo dichiarato rispetto a PW4/PW3 (PPG, accelerometro, barometro — stessi sensori, nuovo uso software). Tre nuovi riepiloghi mensili (pressione, qualità respiratoria del sonno, insulino-resistenza) sono **calcolati da Health Foundation Models**, non letture dirette; richiedono un mese di utilizzo, **Google Health Premium** (abbonamento separato) + app + internet. Sonno dichiarato "15% più accurato" (coppia orologio + Google Health Coach, non hardware isolato). Compatibile con "most phones running Android 12.0 or newer" — **nessun requisito di telefono Pixel**. Rilevamento emergenza respiratoria (nuovo, "industry-first"), Loss of Pulse Detection, GPS 2x più accurato. Disclaimer medico esplicito su sonno e pressione ("not intended to diagnose").

**Google Health support** (`support.google.com/googlehealth/answer/14506680`): la sincronizzazione con Health Connect è **bidirezionale e granulare per tipo di dato** (lettura E scrittura separate, tre livelli di consenso). SpO2: Google Health la **legge** da Health Connect ma non la riscrive (asimmetria confermata). HRV: sia lettura sia scrittura. Nessuna data di transizione o dismissione sulla pagina. Fitbit citato solo come link "move your Fitbit Account to a Google Account", nessuna descrizione del rapporto prodotto.

**Google Health API per sviluppatori** (`developers.google.com/health/about`): è la **legacy Fitbit Web API rinominata e modernizzata**, non un prodotto nuovo affiancato. **Dismissione Fitbit Web API: settembre 2026** (solo il mese, nessun giorno). Nessuna menzione di "Google Fit" in tutta la pagina — la Google Health API **non è dichiarata come erede delle Google Fit APIs**, solo della Fitbit Web API. Dispositivi supportati: "all Fitbit devices and Google Pixel watches, current and past" — nessun modello nominato. Accesso: tutti gli scope sono `Restricted`, richiedono privacy/security review (nessuna procedura descritta).

**Health Connect — tipi di dato** (`developer.android.com/.../health-connect/plan/data-types`): il sonno ha **un solo record type** (`SleepSessionRecord`); le fasi sono un campo (`stages`) dentro quel record, non un tipo separato. HRV = `HeartRateVariabilityRmssdRecord`. SpO2 = `OxygenSaturationRecord`. VO2max = `Vo2MaxRecord`, categoria Activity. Route GPS: **non è un record a sé** — è espressa dai permessi `READ_EXERCISE_ROUTE`/`WRITE_EXERCISE_ROUTE` sulla riga `Exercise`. Le API Google Fit sono banner-avvisate come supportate solo fino a fine 2026.

**Health Connect — overview e permessi** (`developer.android.com/.../health-connect` e `.../get-started`): da **Android 14 (API 34) è un modulo di sistema**, non richiede installazione; su Android 13 e sotto va installata l'app dal Play Store (requisito minimo app-client: Android 9/API 28). Storico leggibile: **30 giorni prima del momento in cui il permesso è stato concesso** (non "ultimi 30 giorni da oggi"); oltre serve `PERMISSION_READ_HEALTH_DATA_HISTORY`. Nessuna fonte ha dichiarato una latenza di scrittura in secondi/minuti: quel numero non esiste lato piattaforma, solo lato implementazione FitMesh (vedi sopra).

## Fase 3 — Errori pre-flag: verificati uno per uno

| # | Errore ipotizzato | Trovato? | Dove |
|---|---|---|---|
| 1 | Pixel Watch limitato a 1/2/3 | **SÌ**, in `data.ts` (provider pixel-watch, tutte le 11 locale) e nella lista dispositivi di `wear-os`. **NO** nell'articolo blog (che anzi include tutte le generazioni). |
| 2 | FAQ Pixel contaminate con "Galaxy Watch" | **SÌ**, tutte e 4 le FAQ del provider pixel-watch, 6 locale (it,es,pt,fr,pl,nl) |
| 3 | "tachicardia" come metrica | **SÌ**, `data.ts:943`, locale `it`, 2 occorrenze |
| 4 | Token corrotto `}};;` in PL | **Variante confermata**: il token reale è `}};` (senza il secondo `;`), stesso effetto — frase troncata, 2 occorrenze in `data.ts` |
| 5 | "Pixel Zamanlayıcısı" (nome tradotto) | **SÌ**, variante `TR`: "Pixel Zamanlayıcımı" ("il mio timer Pixel") al posto di "Pixel Watch", 2 occorrenze FAQ |
| 6 | Setup "in 5 minuti" | **SÌ**, `data.ts` longDesc pixel-watch, 11 locale. **Anche nel TEMPLATE condiviso** `sync/[provider]/page.tsx` (vedi sotto) |
| 7 | Dati "entro pochi secondi" | **SÌ**, `data.ts` FAQ1 pixel-watch, 11 locale — in contraddizione interna con la stessa pagina (techNote dichiara 15–30 min) |
| 8 | "tutti i dati"/"tutte le metriche" | **SÌ**, `models.ts` Pixel Watch 2 FAQ ("FitMesh reads all your Pixel Watch 2 data"), 11 locale |
| 9 | Roadmap "Fitbit Web API Q3 2026" | Presente in `data.ts` (11 locale) come ETA dell'OAuth avanzato. Il trimestre **non è ancora concluso** (oggi 25/08/2026, dentro Q3): non "scaduta" in senso stretto, ma va aggiornata perché la fonte reale (Fitbit Web API) **dismette a settembre 2026**, non lancia un OAuth pubblico — la frase promette il contrario di ciò che accadrà davvero |
| 10 | Wear OS "non passa da app/cloud terze" | **SÌ**, `data.ts` longDesc wear-os, 11 locale — contraddetto dalla FAQ dello stesso provider, che descrive esplicitamente l'app companion come passaggio necessario |
| 11 | Google Fit "già sostituito dal 2025" | **SÌ**, `data.ts` techNote wear-os, 11 locale, affermato come fatto compiuto senza fonte aperta a supporto |
| 12 | "Fitbit Web API" senza distinguere Google Health API | **SÌ**, `data.ts` provider pixel-watch/wear-os: zero occorrenze di "Google Health API" in tutto il blocco. **NO** nell'articolo API (`google-fit-api-dismissione-2026.ts`), che distingue le 5 entità correttamente. |

## Fase 4 — Corruzioni aggiuntive trovate (fuori dalla lista pre-flag)

- **`dati-pixel-watch-dashboard.ts`, locale TR**: contaminazione sistemica con "KVKK" (legge turca protezione dati) al posto di brand/entità reali (Pixel Watch, Fitbit, Health Connect, Google Fit), **7 punti distinti**: secondaryKeywords, metaDescription, hero.subtitle (H1 sub-copy), primo paragrafo del corpo, callout riassuntivo (dove inverte anche READ/WRITE Fitbit↔Health Connect), primo step del setup, prima domanda FAQ. Stesso pattern osservato e già corretto nello sprint P1.8A su un'altra superficie (`[[sprint-p18a-health-connect-garmin-truth-ctr]]`), qui mai toccato.
- **Stesso file, locale PL**: pattern gemello con "rodo" (GDPR polacco) in un callout, più parole polacche inesistenti ("Spospolite", "prywatność" minuscolo a inizio heading) e un errore di entità (anello smart → "zegarka smart"/smartwatch, duplica concettualmente il dispositivo).
- **TR, ulteriori corruzioni testuali**: token tecnico grezzo `&display_name=` incollato nel testo pubblico; emoji 😉 iniettata in un H2 pubblico; "Tanpa"/"Con" (indonesiano/italiano residui) al posto di "olmadan"/"ile"; "kalsiyum" (calcio) al posto di "kalori" (calorie), 2 occorrenze; parole turche inesistenti in almeno 6 altri punti (tabella e FAQ).
- **CTA finale dell'articolo**: `ctaHref` definito solo per 6 locale su 11 (mancano pl,tr,nl,ja,ko) — il pulsante principale dell'articolo non ha link in 5 lingue indicizzabili.
- **`google-fit-api-dismissione-2026.ts`, TR/PL**: stesso pattern KVKK/RODO (4 punti TR, 1 PL) in FAQ pubbliche visibili + JSON-LD; più refusi isolati ("Wydrukowanie" = "Stampa" invece di "Riepilogo" in un H2 PL; "radek" non esiste in polacco; residuo "I" maiuscolo isolato in TR).
- **`google-health-google-fit.ts` (pillar, fuori scope testuale per questo sprint)**: trovata corruzione di escape Unicode a doppio backslash in JA/KO (10+ righe, il rendering pubblico stamperebbe `\uXXXX` letterale) e perdita sistemica di accenti nelle lingue latine sugli stessi heading. **Non corretto in questo sprint** per vincolo esplicito del mandato ("non modificare testo, H1, title o metadata editoriali" di questo articolo) — segnalato come debito per lo sprint successivo, con posizione esatta delle righe in `docs/seo/` (vedi report finale).
- **Template condiviso `sync/[provider]/page.tsx`**: due stringhe hardcoded di tempo assoluto non sostenuto ("Setup in 5 minuti", "in 30 secondi i tuoi dati sono live") — non sono dati per-provider, sono nel markup condiviso da OGNI landing `/sync/[provider]`. Trattato come bug di verità pre-esistente, corretto una volta per tutte le pagine (motivazione nel report finale).
- **`models.ts`, ES, Pixel Watch 2 FAQ**: la domanda chiede esplicitamente della "nueva aplicación de Salud de Google" (Google Health) ma la risposta nomina solo "Health Connect, que reemplazó a Google Fit" — non risponde mai su Google Health, fondendo le due entità.

## Fase 5 — Cosa NON si può ancora scrivere (UNVERIFIABLE)

- Se il client_id reale Fitbit sia impostato nella build firmata di produzione (lo script `build-with-secrets.sh` non è nel repo tracciato).
- Il vero package name con cui l'app Google Health/Fitbit rinominata scrive su Health Connect oggi (`com.fitbit.FitbitMobile` è l'unico hardcoded nel codice; se il rebrand ha cambiato package, FitMesh non lo riconosce).
- La cadenza reale del cron server-side che manda il push FCM "sync_now" (fuori dal repo Flutter, non ispezionato in questa sessione).
- Se Health Connect sia storage locale o sincronizzato cloud (nessuna fonte aperta lo specifica esplicitamente).
