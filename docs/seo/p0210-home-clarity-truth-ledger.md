# Truth Ledger P0.210: chiarezza della home e di /about (SPRINT PM 02/10/2026)

- **Versione del testo base**: `BASE-HOME-v2.1-8961c3f9` (sha256 del JSON `8961c3f96017f40430eb6e7dad67812508b6312b13f0e7b869e65693afbf108b`, 81 unità).
- **Sorgenti dei fatti**: sito = ramo `sprint/pm-02ott-pacchetto` (partenza `f142eac`); app = tag `v3.10.0+191`, commit `9e5e80d32ed87b2c8dc9403ccd41812a856f2603`. I percorsi `APP:` sono relativi a `AppFitmesh/flutter_app/lib/`, quelli `SITO:` alla radice del sito.
- **Natura del documento**: registro di verità di agente (CLAIM-REVIEW, categorie E1 a E4). Le valutazioni di chiarezza e di tono sono giudizi di agente, non test con utenti né revisione madrelingua. Nessun comportamento è stato eseguito su dispositivo: tutto ciò che è «nel codice» è lettura statica del tag.
- **Perimetro**: home e /about del sito. Termini, /famiglia, le cinque URL del test CTR, il pillar, blog, landing e provider sono di altre corsie e qui non sono toccati.

## 1. Decisioni di Matteo del 02/10/2026 (E3)

Titolare: Matteo (PM e proprietario del prodotto). Data: 02/10/2026. Questo paragrafo è la registrazione nel repository richiesta da CLAIM-REVIEW per la categoria E3 (una decisione solo a voce non è E3). La trascrizione di partenza è il documento di lavoro `.claude/stato-lavoro/sprint-pm-02ott/decisioni/DECISIONI-MATTEO-2026-10-02.md` (decisioni 1-6: H1, modello commerciale, hero, privacy, lingue, pillar; l'H1 e il comportamento sul nuovo dispositivo alle righe 8-12); quel file non vive in `.fitmesh/governance`, quindi vale il testo qui sotto.

| # | Decisione | Applicazione in questo pacchetto |
|---|---|---|
| D1 | **H1 opzione B.** IT: «I tuoi dati fitness, insieme. Anche quando cambi dispositivo.» EN: «Your fitness data, together. Even when you switch devices.» | U-HERO-01 e U-HERO-02 (`hero.heading_1`, `hero.heading_accent`) |
| D1b | **Comportamento sul nuovo dispositivo CONFERMATO dal titolare** (stesso account su un telefono nuovo: l'app scarica dal cloud e mostra i dati già sincronizzati), con i limiti del paragrafo 2. Non va esteso a conservazione eterna né a trasferimento di qualsiasi metrica. | U-HERO-04 (`hero.description`), U-STEP-03/07, U-FAQ-02 |
| D2 | **Modello commerciale senza importi.** Distinguere download, prova gratuita, funzionalità che richiedono un titolo Pro valido. Non inventare prezzi, non trasformare l'app in un servizio solo a pagamento. | paragrafo 3; U-PRICE-*, U-FAQ-01, U-ABOUT-07/08 |
| D3 | **Hero senza riga commerciale.** Il blocco prezzi spiega download gratuito, prova Pro di 14 giorni e opzioni successive, senza importi non verificati. | U-HERO-05 (chiave `hero.pricing` tolta), sezione prezzi |
| D4 | **Slogan privacy tolti da home e /about**, senza claim sostitutivi; restano i collegamenti alle informative. | U-PRIV-01..11, U-AI-01/03, U-META-02, U-ABOUT-01/02 |
| D5 | **15 lingue adattate prima del rilascio** del pacchetto. La revisione è registrata come **revisione di agente, non madrelingua** (paragrafo 6). | paragrafo 6 |
| D6 | Pillar `come-funziona-fitmesh`: fuori da questo pacchetto (card tolta dalla home finché testo, excerpt e metadata non sono coerenti). | U-STRUCT-01 |

Regole di accesso già registrate e che questo pacchetto non reinterpreta: dashboard web e Mesh Famiglia sono «in sviluppo, non disponibili»; la prova gratuita non abilita mai né l'una né l'altra; i testi di stato vengono solo da `lib/feature-status.ts`.

## 2. H1: nuovo dispositivo, fatti H1-F1..F8 e limiti

Perimetro del claim (E3 + E1): **con lo stesso account, su un telefono nuovo, con i dati già sincronizzati, con una connessione e con un accesso attivo (prova di 14 giorni o Pro)**, l'app scarica dal cloud e mostra i dati del telefono precedente.

**Cosa NON passa al telefono nuovo** (dichiarato nel testo pubblico di U-HERO-04 e U-FAQ-02): gli allenamenti registrati con l'app, l'abbinamento dell'anello, i collegamenti ai servizi esterni, i giorni non sincronizzati.

**Cosa il sito NON promette**: conservazione eterna; trasferimento di ogni metrica; «tutto il tuo storico»; backup o ripristino; funzionamento senza connessione al primo avvio; Free con storico garantito; lettura dei dati di Apple Salute o Health Connect del vecchio telefono che l'app non ha mai letto; sincronizzazione in tempo reale su più telefoni.

Fonte dei fatti: `.claude/stato-lavoro/sprint-pm-02ott/fatti/H1-nuovo-dispositivo.md` (sezione 5). Categoria E1 per il comportamento del codice; nessun fatto è E2 (nessun test asserisce il flusso intero).

| ID | Enunciato | File:riga (APP, tag v3.10.0+191, salvo dove indicato) | Limiti |
|---|---|---|---|
| H1-F1 | Con lo stesso account su un telefono nuovo l'app scarica dal cloud le righe di metriche dell'utente e le mostra, senza leggere il telefono precedente. | `data/cache/metrics_cache_sync.dart:354` (filtro `user_id`), `:228` (`_pullDeltasNow`); `features/main_screen.dart:119`, `:262` (avvio a freddo); `features/dashboard/data/metrics_repository.dart:392-398` | richiede rete; l'errore di scarico è assorbito (`metrics_cache_sync.dart:285`) e la cache di un telefono nuovo è vuota; cooldown 3 minuti (`:151`) |
| H1-F2 | Il primo scarico copre le righe ricevute negli ultimi circa 400 giorni, a pagine da 1000 righe con tetto di 50000. | `data/cache/metrics_cache_sync.dart:334`, `:337-338`, `:355` | finestra sul momento di ricezione (`received_at`), non sul giorno di misura; dopo il primo scarico si avanza dal cursore (`:94-100`) |
| H1-F3 | La dashboard mostra per default 7 giorni e permette 1, 7, 30, 90, 365 giorni; con accesso pieno tutti i periodi sono selezionabili. | `core/di/providers.dart:1666`; `features/dashboard/presentation/screens/dashboard_screen.dart:1258-1262`, `:1278`; `features/dashboard/utils/lookback_giorni.dart:80`, `:93` | 365 è un massimo selezionabile, non una garanzia di conservazione |
| H1-F4 | Il diritto di accesso lo decide il server quando risponde; la prova dura 14 giorni; senza titolo valido e con risposta «no» l'app mostra un muro bloccante, non una dashboard ridotta. | `features/billing/data/entitlement.dart:13`, `:45`, `:195-204`, `:219-220`; `main.dart:532`, `:541`, `:764-766`; `dashboard_screen.dart:1278`; `features/settings/presentation/settings_screen.dart:2890`, `:2923` | CONTRADDIZIONE aperta fra i selettori con lucchetto a 14 giorni (`kFreeHistoryDays`) e il muro; lato server le SELECT restano aperte (SITO `supabase/migrations/20260816100824_entitlement_gate_scritture_salute.sql:38`, non verificato in produzione) |
| H1-F5 | Il cloud riceve solo ciò che è stato sincronizzato: la giornata in corso a ogni ciclo, gli ultimi 7 giorni mancanti all'apertura della dashboard, un recupero automatico di 14 giorni per sorgenti ferme, il recupero manuale 14/30/90/365 (oltre 14 solo con accesso pieno). | `data/repositories/health_repository.dart:766-773`; `data/sync/sync_engine.dart:539`, `:677`, `:807`, `:930`; `dashboard_screen.dart:491-499`; `data/sync/background_sync.dart:320`; `settings_screen.dart:2890-2893`, `:2923` | i giorni passati esistono nel cloud solo se il telefono precedente li aveva caricati; tutto è subordinato al diritto (`sync_engine.dart:413-425`) |
| H1-F6 | Non passano: allenamenti registrati con l'app (GPS incluso, nessun backup cloud), abbinamento dell'anello Bluetooth, token dei servizi esterni (archivio sicuro locale), giorni mai sincronizzati. | `features/workout/data/workout_repository.dart:35`, `:223`; `features/workout/presentation/workout_detail_screen.dart:10`, `:20`; `core/di/providers.dart:1065`, `:1174`; `data/repositories/settings_repository.dart:362`; `features/providers/data/oauth/token_storage.dart:25-35`; `features/settings/data/workout_export_service.dart:362-363` | copia server dei token OAuth: non verificato; misure manuali: nessuna funzione trovata nel tag (ricerca testuale); buffer dell'anello non caricato: non verificato |
| H1-F7 | Secondo le migration, il cloud elimina le righe di metriche e allenamenti più vecchie di 24 mesi con un job settimanale. | SITO `supabase/migrations/20260513120007_pg_cron_jobs.sql:30-48` | E1 sul testo della migration, NON verificato in produzione (le migration non ricostruiscono la produzione). Serve solo a vietare la promessa di conservazione eterna: non è usato in copy |
| H1-F8 | Il telefono nuovo ottiene un Device ID proprio e viene abbinato all'account con una chiamata di auto-claim; se il Device ID risulta di un altro utente l'abbinamento fallisce con conflitto. | `data/repositories/settings_repository.dart:74-76`; `features/pairing/presentation/auto_pairing_screen.dart:55`, `:82`; `main.dart:544` | non è descritto nel copy hero: serve solo a spiegare perché il telefono nuovo non «eredita» il vecchio |

Nota di governance: il comportamento del codice è E1 con i file:riga sopra; la decisione D1b del titolare conferma il perimetro del claim ma non sostituisce il codice. Etichetta SITE-WRITING per le frasi in copy: Condition (la condizione sta nella frase).

Testi pubblici che portano il claim (it, `lib/dictionaries/it.json` e `lib/content/*`): `hero.description` («...accedi con lo stesso account e ritrovi i dati già sincronizzati, a patto di avere una connessione e un accesso attivo. Gli allenamenti registrati con l'app restano sul telefono che li ha registrati.»), `HOMEPAGE_COPY.steps[0].d`, `steps[2].d`, FAQ `Ho cambiato telefono. Perdo i miei dati?` in `lib/content/faqs.ts`.

## 3. Modello commerciale verificato (E1, con E3 per le regole di accesso)

Fonte: `.claude/stato-lavoro/sprint-pm-02ott/fatti/FATTI-COMMERCIALI.md` (sezioni A e C). Il testo pubblico di questo pacchetto non contiene importi.

| Affermazione scrivibile | Prova | Cat. |
|---|---|---|
| L'app si scarica gratis (Google Play e App Store). | SITO `lib/product-facts.ts:251` (`appDownloadIsFree: true`); APP `features/billing/data/billing_service.dart:31-38` (i prodotti in-app sbloccano Pro, non c'è un acquisto per scaricare) | E1 |
| Ogni nuovo account ha una prova di FitMesh Pro di 14 giorni. | APP `features/billing/data/entitlement.dart:13` (`kTrialDuration`), `:186`, `:196-201`, `:204`; SITO `lib/product-facts.ts:144` | E1 |
| Dopo la prova, per continuare a usare le funzioni Pro serve un acquisto o un abbonamento (formula già approvata, it/en verbatim). | SITO `lib/pricing-section.ts` `PRICING_SECTION.subhead`, identica a `lib/product-facts.ts:144`; muro APP `main.dart:538-541` | E1 |
| Le opzioni di acquisto e il prezzo sono quelli che lo store mostra nell'app, nel paese dell'utente. | APP `billing_service.dart:31-32` (prezzo sempre dallo store); `features/billing/presentation/pro_screen.dart:540-590` | E1 |
| Dashboard web e Mesh Famiglia: in sviluppo, non disponibili, nessuna data. | SITO `lib/product-facts.ts:207`, `:226` (`status: "in_development"`); decisioni di accesso 28-29/09/2026 punti 3, 20, 48 | E3 |

**Importi e piattaforme che il sito NON scrive.** Nessun importo è verificato su Play Console; sull'App Store il solo riscontro è l'istantanea del 27/09 (4,99 EUR nello storefront IT, 3,99 USD in quello US), quindi il prezzo cambia per paese. L'abbonamento semestrale (`fitmesh_pro_sub`, rinnovo ogni 6 mesi) esiste nel codice app (`billing_service.dart:33-38`) ma il backend lo dichiara non acquistabile su iPhone (SITO `app/api/v1/billing/validate-purchase/route.ts:764-772`): per questo il sito parla di «acquisto o abbonamento secondo lo store» e rinvia al prezzo dello store.

### 3.1 DISCREPANZA con «funzionalità Free» del mandato

Il mandato del 02/10 (decisione 2) chiede di distinguere «download, prova gratuita, funzionalità Free, funzionalità che richiedono un titolo Pro valido». **Il codice non mostra un livello Free utilizzabile a regime**:

- esistono residui di un livello Free con storico a 14 giorni: `kFreeHistoryDays = 14` in `APP: features/billing/data/entitlement.dart:43-45`, usato dai selettori con lucchetto `dashboard_screen.dart:1278`, `:1283`, `:1322` e `settings_screen.dart:2889-2890`;
- ma a regime chi non ha titolo valido e ha la prova finita vede il **muro duro**: `main.dart:538-541` (`isBlocked` porta a `paywallBlocked`), `main.dart:764-766` (`ProScreen(locked: true)`, schermata non chiudibile che consente solo di pagare, ripristinare, uscire o eliminare account e dati), `entitlement.dart:219-220`;
- la dashboard senza accesso pieno risulta raggiungibile solo in stati transitori (verifica in corso). NON verificato su dispositivo (lettura statica);
- i Termini del sito dicono lo stesso: non esiste un piano gratuito permanente (SITO `app/(frontend)/[locale]/(marketing)/terms/page.tsx:213-222`, testo sotto gate legale).

Esito per il copy: il sito **non** descrive un piano Free e **non** scrive «gratis per sempre», «free tier», «storico limitato gratuito». «Gratis» compare solo riferito al download e alla prova di 14 giorni. La distinzione richiesta dal mandato resta aperta come decisione di prodotto (rimuovere il residuo Free dall'app o renderlo raggiungibile): il sito non la anticipa. Il ponte iOS (concessione automatica di 6 mesi di Pro a chi ha dati HealthKit, `SITO app/api/v1/sync/cessione-ios.ts:38`) è citato nei fatti come domanda aperta e non è descritto come offerta.

Altri punti aperti dal referto, mai trasformati in copy: contraddizione interna all'app sulla prova (`l10n/app_en.arb:633` dice «la prova mostra gli ultimi 14 giorni», mentre `entitlement.dart:196-201` apre tutti i gate), quindi il sito non scrive né «prova completa» né «prova con storico limitato»; l'export JSON completo è raggiungibile solo oltre il muro.

## 4. Percorsi di raccolta (M1)

Fonte: `.claude/stato-lavoro/sprint-pm-02ott/base-v2/M1-percorsi-raccolta.md`. Lettura statica del tag, nessun dispositivo.

I percorsi che la frase guida (U-HERO-03) può nominare sono **tre**:

| Percorso | Piattaforma | Prove (file:riga) | Cat. |
|---|---|---|---|
| Apple Salute (HealthKit) | iPhone | `APP: ios/Runner/Info.plist:61-64`; `features/sources/data/sources_providers.dart:40-49`; `data/repositories/health_repository.dart:815-826`, `:1089-1097`; SITO `lib/providers/data.ts:6300-6307` (`apple-health`, `live`) | E1 |
| Health Connect | Android | `APP: android/app/src/main/AndroidManifest.xml:69-87`, `:116`; `health_repository.dart:827-830` | E1 |
| Bluetooth diretto verso anelli Colmi (non passa da Apple Salute né da Health Connect) | iPhone e Android | `APP: features/providers/presentation/providers_screen.dart:46-48`; `features/ring/presentation/ring_settings_section.dart:21`; `features/ring/data/colmi_protocol.dart:30-33`, `:58-60`; `pubspec.yaml:57`; SITO `lib/providers/data.ts:6036-6041` (`colmi-ring`, `direct-ble`, `platforms: ["android","ios"]`) | E1 |

Per questo il testo dice «anello Colmi compatibile» (il riconoscimento è per nome Bluetooth, non provato modello per modello: `colmi_protocol.dart:30-33`) e non elenca modelli. L'etichetta «Collega anello» citata in U-STEP-05 è quella dell'app (`APP: l10n/app_it.arb:2385`, chiave `ringSettingsConnect`).

**Non nominati nel testo pubblico, con motivo**: Samsung Health diretto (non verificato sotto firma Play, rifiuto 2003 osservato il 10/09); Strava (accesso limitato, `limited-beta`); Suunto (il registro del sito dice non disponibile, il codice ha un ingresso con configurazione fuori dal tag: discrepanza da portare al PM, il pubblico segue il registro); Oura (ID cliente vuoto, il tile mostra «In arrivo»; il percorso reale è Health Connect o Apple Salute); Garmin, Fitbit, Polar, Withings (origini che scrivono in Health Connect o Apple Salute, non collegamenti diretti); Huawei (stub, `huawei_health_source.dart:12`, `:62-65`).

## 5. Fusione dei passi (M2)

Fonte: `.claude/stato-lavoro/sprint-pm-02ott/base-v2/M2-fusione-passi.md`. Percorsi relativi a `AppFitmesh/flutter_app/lib/`.

Testo pubblico (U-CARD-02): «Se più fonti contano i passi dello stesso giorno, FitMesh mostra un solo conteggio. In automatico lo ricava in base all'affidabilità e alla copertura dei dati e, con un anello collegato via Bluetooth e l'app salute del telefono, può comporlo ora per ora. Nell'app puoi anche indicare la fonte che preferisci per i passi. Se un numero non ti torna, confrontalo con l'app del produttore.»

| Claim | Prova | Cat. |
|---|---|---|
| un solo conteggio per giornata | un solo `steps` per giorno: `features/dashboard/data/fusion/fuse_day.dart:151` | E1 |
| in base all'affidabilità e alla copertura dei dati | sette criteri in cascata: `.../fusion/additive.dart:257-278` (implementati `:347-415`); etichetta dell'app «Fonte scelta per affidabilità e copertura» (`l10n/app_it.arb:2611`) | E1 |
| con anello collegato via Bluetooth e app salute del telefono, può comporlo ora per ora | fusione oraria solo se esattamente due fonti, un anello `colmi_ble` e una fonte salute del telefono: `additive.dart:524`, `:624-796`; ruolo anello `source_role.dart:70-71`; test `additive_test.dart:327-356` (50 + 130 = 180) | E1 e E2 (parziale: il test copre il caso composito, non l'intero testo) |
| nell'app puoi indicare la fonte preferita per i passi | `features/settings/presentation/settings_screen.dart:2655-2664`, `:2775-2790`; `preferenze_sorgente.dart:44-45`, `:120-130`; se non trovata torna ad Automatico `additive.dart:226-228` | E1 |
| non è il numero più alto a decidere (frase non scritta nel testo, vincolo) | `additive.dart:278`; test `passi_niente_magnitudine_test.dart` | E1 e E2 |

Vincoli rispettati: niente «ne sceglie una» (falso nel ramo orario, `additive.dart:751`), niente «non somma» come regola, niente «sorgente con più dati» (l'etichetta dell'app `app_it.arb:1065` non descrive il motore: incoerenza dell'app, non risolta qui), niente estensione di «mai il massimo» a distanza e calorie attive (dove il massimo dentro lo stesso ruolo è un criterio, `spot_fusion.dart:106-128`). Non verificato: come Apple Salute produce le righe per un Apple Watch con iPhone (una o più righe per giorno).

## 6. Regola per le 15 lingue: revisione di agente, non madrelingua

1. L'italiano è la fonte, l'inglese è derivato. Le 13 altre lingue (es, de, pt, fr, pl, tr, nl, ja, ko, sv, da, no, fi) **non ricevono traduzioni nuove da questa lane**.
2. Per le 13 lingue valgono solo: (a) cancellazioni; (b) riuso verbatim di frasi già approvate nel repository (`REUSE_ESISTENTE`, `NEUTRAL_EXISTING_KEY`); (c) le stringhe consegnate da Gemini nel pacchetto `fitthesite-image-proposals/2026-10-01-ultra-athlete-guide/gemini-handoff/PACCHETTO-LINGUISTICO-HOME-13-LINGUE.md` (e `HOME-13-LOCALES.json`) classificate **COPERTA_E_INVARIATA** in `base-v2/COPERTURA-GEMINI.md` (la base it/en ricevuta da Gemini è uguale carattere per carattere a quella finale), con le sole correzioni di nome proprio di M3.
3. La classificazione dell'intero pacchetto è `AGENT_EDITORIALLY_REVIEWED`: revisione redazionale di agente, **non** madrelingua e **non** un test con utenti. Nessuna lingua è stata riletta da un parlante nativo. La registrazione di questa natura è la decisione D5.
4. Le unità MANCANTI o SCOSTATE restano al testo attuale finché Gemini non consegna l'adattamento (richiesta: `base-v2/RICHIESTA-GEMINI-ADATTAMENTI.md`, già inviata). **Nessun ripiego silenzioso sull'inglese**: i campi nuovi (`storeNote`, `priceFromStore`, la sezione AI in `lib/content/home-ai-copy.ts`, la voce Pixel Watch) sono opzionali per lingua, si leggono con `tlOwn()` (`lib/content/localized-own.ts`) e il blocco che li usa si ritira dove manca il valore; le FAQ di costo e di cambio telefono non si rendono in pl, tr, sv, da, no, fi (non ereditano più it o en).
5. Il gate di A3 segnala le celle ancora al testo precedente. Finché ci sono, il pacchetto non è rilasciabile in quelle lingue (vincolo della decisione 5). Elenco per unità nel paragrafo 8.

## 7. Verifica del pacchetto A2

- **Confronto automatico it/en**: ogni valore it/en dei file (dizionari, `homepage-copy.ts`, `home-ai-copy.ts`, `pricing-section.ts`, `about-copy.ts`, `faqs.ts`, `home-meta.ts`, `product-facts.ts`, `llms-txt.ts`) è stato confrontato con l'unità del JSON congelato: 108 valori coincidono, 0 differenze. I valori sono stati copiati dal JSON con script, non a mano.
- **Lingue**: le 13 lingue ricevono solo le stringhe COPERTA_E_INVARIATA (U-HERO-01, U-HERO-02, U-STEP-01, U-CARD-01, U-META-01 in 13 lingue; U-PRICE-16 in 9: es, de, fr, pt, nl, sv, da, no, fi). Le stringhe U-STEP-02 e U-STEP-04 (COPERTA) non sono applicate perché i rispettivi testi (U-STEP-03/05) sono SCOSTATI: un titolo nuovo su un testo vecchio dà un passo incoerente. Cancellazioni in 13 lingue: U-FEAT-04 («percorso» e equivalenti) e U-ABOUT-06 (in ogni lingua resta la sola clausola «il codice dell'app è privato»; in ja e ko la desinenza della frase è adattata alla chiusura, nessuna parola nuova).
- **Esiti**: `tsc --noEmit` sull'intero progetto exit 0 (log `a2-tsc2.log`); vitest mirato su `lib/content`, `lib/dictionaries`, `lib/product-facts`, `lib/llms-txt`, `lib/feature-status`, `lib/analytics`, `components/Footer.structure` e `app/(frontend)/[locale]/(marketing)`: 18 file, 244 test, tutti verdi (log `a2-vitest2.log`). Un rosso trovato lungo la strada (`homepage-p024b-fixes.test.ts`, due test che cercavano ancora il testo della sezione AI uscito da `page.tsx` nel commit 689d393) è stato aggiornato. Log in `.claude/stato-lavoro/sprint-pm-02ott/log-pacchetto/`.

## 8. Indice delle unità e stato

Legenda: «applicati e verificati» = i valori it/en sono nel codice e coincidono con il JSON `BASE-HOME-v2.1-8961c3f9`. «Commit precedenti della lane» = struttura o cancellazione eseguita in A1 e nei commit `fix(S02-home)` precedenti ad A2, non rieseguita riga per riga in A2. Le celle «al testo attuale» sono le MANCANTI o SCOSTATE del referto di copertura Gemini: il gate di A3 le segnala e il pacchetto non è rilasciabile in quelle lingue finché Gemini non consegna.

| ID | Campo | Azione 13 lingue | it/en | Stato 13 lingue |
|---|---|---|---|---|
| U-HERO-01 | hero.heading_1 | TRANSLATE_NEEDED | applicati e verificati | da Gemini, COPERTA_E_INVARIATA (applicata) |
| U-HERO-02 | hero.heading_accent | TRANSLATE_NEEDED | applicati e verificati | da Gemini, COPERTA_E_INVARIATA (applicata) |
| U-HERO-03 | HOMEPAGE_COPY.leadSentence | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-HERO-04 | hero.description | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-HERO-05 | render di hero.pricing | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-STEP-01 | HOMEPAGE_COPY.howItWorksHeading | TRANSLATE_NEEDED | applicati e verificati | da Gemini, COPERTA_E_INVARIATA (applicata) |
| U-STEP-02 | HOMEPAGE_COPY.steps[0].t | TRANSLATE_NEEDED | applicati e verificati | coperta da Gemini ma NON applicata: titolo e testo passo vanno insieme (testo SCOSTATO); passo intero al testo attuale |
| U-STEP-03 | HOMEPAGE_COPY.steps[0].d | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-STEP-04 | HOMEPAGE_COPY.steps[1].t | TRANSLATE_NEEDED | applicati e verificati | coperta da Gemini ma NON applicata: titolo e testo passo vanno insieme (testo SCOSTATO); passo intero al testo attuale |
| U-STEP-05 | HOMEPAGE_COPY.steps[1].d | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-STEP-06 | HOMEPAGE_COPY.steps[2].t | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-STEP-07 | HOMEPAGE_COPY.steps[2].d | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-CARD-01 | features.items[4].title | TRANSLATE_NEEDED | applicati e verificati | da Gemini, COPERTA_E_INVARIATA (applicata) |
| U-CARD-02 | features.items[4].desc | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-FEAT-01 | features.heading | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-FEAT-02 | features.items[0].desc | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-FEAT-03 | features.items[2].desc | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-FEAT-04 | features.items[3].desc | DELETE_ONLY | applicati e verificati | cancellazione «percorso» eseguita in A2 (13 lingue) |
| U-AI-01 | kicker della sezione AI | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-AI-02 | H2 della sezione AI | TRANSLATE_NEEDED | applicati e verificati | valore assente, blocco ritirato (tlOwn) |
| U-AI-03 | paragrafo della sezione AI | TRANSLATE_NEEDED | applicati e verificati | valore assente, blocco ritirato (tlOwn) |
| U-AI-04 | elenco 'Porta il tuo wearable' / 'Porta la tu… | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-AI-05 | etichetta del link verso /{lc}/ai | TRANSLATE_NEEDED | applicati e verificati | valore assente, blocco ritirato (tlOwn) |
| U-LABS-01 | render di LABS_TEASER_COPY.privacyNote in home | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-TICKER-01 | tickerProviders | NESSUNA | struttura/lettura da altra unità | nessun testo |
| U-PRICE-01 | PRICING_SECTION.kicker | REUSE_ESISTENTE | applicati e verificati | riuso verbatim |
| U-PRICE-02 | PRICING_SECTION.heading | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-PRICE-03 | PRICING_SECTION.subhead | REUSE_ESISTENTE | applicati e verificati | riuso verbatim in 11 lingue; ja e ko ancora con «全機能»/«모든 Pro 기능» (da Gemini) |
| U-PRICE-04 | PRICING_SECTION.storeNote | TRANSLATE_NEEDED | applicati e verificati | valore assente, blocco ritirato (tlOwn) |
| U-PRICE-05 | link 'Guida completa ai prezzi' / 'Full prici… | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRICE-06 | HOMEPAGE_COPY.trialName | REUSE_ESISTENTE | applicati e verificati | riuso verbatim |
| U-PRICE-07 | HOMEPAGE_COPY.trialTagline | REUSE_ESISTENTE | applicati e verificati | riuso verbatim |
| U-PRICE-08 | PRICING_SECTION.trialPeriodLabel e PRICING_SE… | REUSE_ESISTENTE | applicati e verificati | riuso verbatim |
| U-PRICE-09 | PRICING_SECTION.trialFeatures | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRICE-10 | PRICING_SECTION.proName | REUSE_ESISTENTE | applicati e verificati | riuso verbatim |
| U-PRICE-11 | PRICING_SECTION.proTagline | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-PRICE-12 | card Pro: p("lifetimeBothShort", lc) | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRICE-13 | PRICING_SECTION.priceFromStore | TRANSLATE_NEEDED | applicati e verificati | valore assente, blocco ritirato (tlOwn) |
| U-PRICE-14 | PRICING_SECTION.proFeatures | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRICE-15 | riga sotto i bottoni della CTA finale | REUSE_ESISTENTE | struttura/lettura da altra unità | riuso verbatim |
| U-PRICE-16 | final_cta.description | TRANSLATE_NEEDED | applicati e verificati | da Gemini in da,de,es,fi,fr,nl,no,pt,sv; altre al testo attuale (SCOSTATA per nome proprio M3) |
| U-PRICE-17 | commento di sezione | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-FAQ-01 | FAQ_IT[4] / FAQ_EN[4] | TRANSLATE_NEEDED | applicati e verificati | FAQ non resa in pl,tr,sv,da,no,fi; es,de,pt,fr,nl,ja,ko ancora il testo attuale |
| U-FAQ-02 | FAQ_IT[5] / FAQ_EN[5] | TRANSLATE_NEEDED | applicati e verificati | FAQ non resa in pl,tr,sv,da,no,fi; es,de,pt,fr,nl,ja,ko ancora il testo attuale |
| U-FAQ-03 | riga 146 | DELETE_ONLY | presente in `lib/llms-txt.ts` | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRIV-01 | privacy_block.kicker | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRIV-02 | H2 del blocco privacy della home: dict.nav.pr… | NEUTRAL_EXISTING_KEY | applicati e verificati | riuso verbatim |
| U-PRIV-03 | privacy_block.description | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRIV-04 | HOMEPAGE_COPY.privacyPoints | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRIV-05 | link del blocco privacy della home: privacy_b… | NEUTRAL_EXISTING_KEY | applicati e verificati | riuso verbatim |
| U-PRIV-06 | H2 id="privacy" di /about: dict.nav.privacy a… | NEUTRAL_EXISTING_KEY | applicati e verificati | riuso verbatim |
| U-PRIV-07 | ABOUT_COPY.privacyBody1 | DELETE_ONLY | applicati e verificati | già ridotta alla sola frase GA4 (commit precedenti) |
| U-PRIV-08 | ABOUT_COPY.privacyBody2 | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRIV-09 | ABOUT_COPY.deleteAccountPrefix + ABOUT_COPY.d… | NEUTRAL_EXISTING_KEY | applicati e verificati | riuso verbatim |
| U-PRIV-10 | ABOUT_COPY.serverChoice e link 'Stato attuale… | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-PRIV-11 | footer.tagline | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-PRIV-12 | metaTitle e metaDescription di /about, descri… | TRANSLATE_NEEDED | struttura/lettura da altra unità | rinvio a U-ABOUT-01/02, U-META-01/02/04 |
| U-FOOT-01 | blocco 'Status pill' | DELETE_ONLY | struttura/lettura da altra unità | cancellazione/struttura eseguita dai commit precedenti della lane |
| U-FOOT-02 | link 'Mesh Famiglia' / 'Family Mesh' | NESSUNA | struttura/lettura da altra unità | nessun testo |
| U-ABOUT-01 | ABOUT_COPY.metaTitle | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-ABOUT-02 | ABOUT_COPY.metaDescription | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-ABOUT-03 | ABOUT_COPY.heroTitlePrefix | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-ABOUT-04 | ABOUT_COPY.heroTitleAccent | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-ABOUT-05 | ABOUT_COPY.heroDescription | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-ABOUT-06 | ABOUT_COPY.teamBody2 | DELETE_ONLY | applicati e verificati | ridotta a «il codice dell'app è privato» in A2 (13 lingue) |
| U-ABOUT-07 | riquadro 'Quanto costa' | REUSE_ESISTENTE | applicati e verificati | riuso verbatim |
| U-ABOUT-08 | ABOUT_COPY.trialDesc | REUSE_ESISTENTE | applicati e verificati | riuso verbatim in 11 lingue; ja e ko ancora con «全機能»/«모든 Pro 기능» (da Gemini) |
| U-ABOUT-09 | blocco Mesh | REUSE_ESISTENTE | struttura/lettura da altra unità | riuso verbatim |
| U-ABOUT-10 | ABOUT_COPY.featuresIntro | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-ABOUT-11 | ABOUT_COPY.devicesIntro | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-ABOUT-12 | voce della lista dispositivi | TRANSLATE_NEEDED | applicati e verificati | valore assente, blocco ritirato (tlOwn) |
| U-ABOUT-13 | ABOUT_COPY.teamBody1 | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-META-01 | home.metaTitle | TRANSLATE_NEEDED | applicati e verificati | da Gemini, COPERTA_E_INVARIATA (applicata) |
| U-META-02 | home.metaDescription | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-META-03 | homeLd.name e homeLd.description | NEUTRAL_EXISTING_KEY | struttura/lettura da altra unità | riuso verbatim |
| U-META-04 | ORG_DESCRIPTIONS | TRANSLATE_NEEDED | applicati e verificati | al testo attuale, in attesa di Gemini |
| U-LLMS-01 | riga 101 | NESSUNA | presente in `lib/llms-txt.ts` | nessun testo |
| U-LLMS-02 | riga 144 | NESSUNA | presente in `lib/llms-txt.ts` | nessun testo |
| U-LLMS-03 | riga 149 | NESSUNA | presente in `lib/llms-txt.ts` | nessun testo |
| U-TRIAL-01 | trialExpired.iosNote | DELETE_ONLY | struttura/lettura da altra unità | iosNote e render tolti in A2 |
| U-STRUCT-01 | featuredSlugs senza 'come-funziona-fitmesh' | NESSUNA | struttura/lettura da altra unità | nessun testo |

### 8.1 Unità non chiuse per le 13 lingue (36 su 81)

U-HERO-03, U-HERO-04, U-STEP-02..07, U-CARD-02, U-FEAT-01..03, U-AI-02/03/05, U-PRICE-02/03 (ja, ko)/04/11/13/16 (pl, tr, ja, ko), U-FAQ-01/02, U-PRIV-11, U-ABOUT-01..05, 08 (ja, ko), 10..13, U-META-02, U-META-04. Dove la lingua non ha il valore: campi nuovi ritirati (`tlOwn`), FAQ di costo e cambio telefono non rese in pl, tr, sv, da, no, fi. Le FAQ di es, de, pt, fr, nl, ja, ko contengono ancora il testo precedente (con importi e «niente abbonamento»): non si toccano in A2 per mandato e vanno riscritte alla consegna di Gemini.
