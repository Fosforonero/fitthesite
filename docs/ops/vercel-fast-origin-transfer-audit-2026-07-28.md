# Vercel Fast Origin Transfer audit — 2026-07-28 (Sprint P0.10C)

Baseline documentata **prima** di qualunque modifica di questo sprint, sul
branch `sprint/p10-founder-sunset`. Nessun accesso MCP Vercel autenticato
in questa sessione (non-interattiva) — tutti i dati "osservati" sotto sono
quelli forniti direttamente da Matteo nel messaggio che ha aperto questo
sprint, non riverificati indipendentemente da qui. Dove non specificato,
questo documento lo segnala esplicitamente invece di assumere un valore.

## 1. Fatto osservato — warning Fast Origin Transfer

Vercel segnala **75% dei 10 GB** inclusi nel piano Hobby per Fast Origin
Transfer. **Data e ora esatte del warning: non fornite dal messaggio che
ha aperto questo sprint** — nota come gap, non assunta. Giornata del
report: 2026-07-28 (data di questa sessione).

## 2. Fatto osservato — volume di invocazioni /api/v1/sync

`/api/v1/sync` registra **circa 1.100 Function invocation ogni 12 ore**
(cifra fornita da Matteo, coerente con l'osservazione ADDENDUM Fluid CPU di
Sprint P0.10 — stesso ordine di grandezza, non riverificata qui in modo
indipendente).

## 3. Fatto osservato — cache sulle pagine pubbliche

Verifica pubblica già eseguita (da Matteo, non da questa sessione):
homepage localizzate, blog, Labs e pagine provider rispondono con
`x-vercel-cache: HIT`. Questo conferma che **Sprint P0.9 ha già risolto**
la causa principale lato marketing/statico (le pagine pubbliche non
rigenerano contenuto a ogni richiesta né consumano Fast Origin Transfer in
uscita in modo anomalo) — P0.9 aveva già portato le route statiche a 3561
(vedi `docs/ops/vercel-fluid-cpu-audit-2026-07-24.md`), baseline confermata
ancora invariata in questo sprint (§6 sotto).

## 4. Limite noto — impossibilità di interrogare le metriche Vercel

Sul piano Hobby, l'API/dashboard "Vercel Metrics" per il breakdown
dettagliato di Fast Origin Transfer (per route, per Function vs
Middleware, incoming vs outgoing) restituisce `payment_required` — è una
funzionalità di **Observability Plus**, non disponibile senza upgrade.
Questo significa che **non esiste, in questo sprint, un modo per
confermare quantitativamente** quale frazione del 75% osservato provenga
da `/api/v1/sync` rispetto ad altre fonti (altri endpoint API, immagini
OG, asset non cacheable, ecc.).

## 5. Fatto tecnico — architettura reale del path di `/api/v1/sync`

Verificato leggendo il codice reale di questo repo (non un'inferenza):

- **Prima di questo sprint**: `middleware.ts` includeva `/api/v1/sync` nel
  proprio `config.matcher` e chiamava `limitSync(request)` PRIMA di
  inoltrare la richiesta alla Function `app/api/v1/sync/route.ts` — due
  hop Vercel distinti (Middleware, poi Function) per la stessa richiesta.
- Per documentazione Vercel: l'intero body di una richiesta POST conta
  come Fast Origin Transfer **incoming**, e una richiesta che attraversa
  sia Middleware sia Function **può maturare Fast Origin Transfer due
  volte** (una per hop).
- `/api/v1/sync` è l'endpoint con il payload medio più pesante del
  progetto (snapshot giornaliera + intraday + eventuali workout, dati
  salute) — tra tutti gli endpoint del progetto è quindi quello con il
  potenziale beneficio più alto a evitare il doppio hop.

## 6. Distinzione esplicita: fatto osservato vs inferenza

| Affermazione | Tipo |
|---|---|
| Il warning Fast Origin Transfer è al 75% di 10 GB | **Fatto osservato** (Matteo, dashboard Vercel) |
| `/api/v1/sync` fa ~1.100 invocazioni/12h | **Fatto osservato** (Matteo) |
| Le pagine pubbliche campione sono `x-vercel-cache: HIT` | **Fatto osservato** (Matteo) |
| Il middleware matcher includeva `/api/v1/sync` e chiamava `limitSync` prima della Function | **Fatto verificato** (lettura diretta del codice, questa sessione) |
| Un body che attraversa Middleware+Function può maturare FOT due volte | **Fatto documentato da Vercel** (non verificabile sperimentalmente da questa sessione senza Observability Plus) |
| `/api/v1/sync` è la causa **dominante** del 75% osservato | **NON dichiarato** — inferenza plausibile (payload più pesante, doppio hop, volume di invocazioni), ma senza breakdown quantitativo per-route non è verificabile da questa sessione. Non trattarla come conclusione, solo come motivazione per l'intervento a costo/rischio più basso disponibile (FASE 1: rimuovere il doppio hop) mentre si aspetta un dato reale post-deploy. |
| L'intervento di questo sprint (FASE 1) ridurrà il Fast Origin Transfer misurato | **NON dichiarato come misurato** — atteso, non ancora osservato (vedi FASE 8 del report, piano di confronto post-deploy a 24h/72h/7gg). |

## 7. Piano di confronto post-deploy (FASE 8, NON eseguibile da questa sessione)

Da eseguire da Matteo (o da chi ha accesso Vercel dashboard/Observability)
a 3 checkpoint dopo il deploy di questa correzione — **solo dopo il GO
esplicito e il deploy reale**, mai simulato o dichiarato qui:

| Checkpoint | Cosa confrontare vs baseline pre-deploy (questo documento) |
|---|---|
| **24 ore** | Fast Origin Transfer totale giornaliero (GB); incoming vs outgoing; Function vs Middleware (se il breakdown è disponibile); invocazioni `/api/v1/sync`; Active CPU; error rate (429/500) |
| **72 ore** | Stessi campi — conferma che il trend a 24h non sia rumore di un giorno anomalo |
| **7 giorni** | Stessi campi su una settimana intera (copre variazione settimanale d'uso) — questo è il numero da citare come "risultato", non il dato a 24h |

Campo aggiuntivo disponibile SOLO dopo che il profiler campionato (FASE 3)
ha raccolto dati reali: `requestBytes` medio, mediano, P75, P95 sui
campioni raccolti. **Se il payload medio/P75 risulta ancora elevato**,
questo è il segnale per aprire un follow-up congiunto sito+app su
compressione o payload incrementale — non implementato in questo sprint,
richiede coordinamento esplicito con l'agente app prima di qualunque
cambio al protocollo mobile.

Nessuno di questi numeri esiste ancora: la tabella è la checklist da
compilare ai tre checkpoint, non un risultato già osservato.

## 8. Cosa NON fa questo sprint (esplicitamente fuori perimetro)

- Non cambia il protocollo mobile (formato payload, campi, compressione).
- Non implementa gzip lato client, payload delta, batching diverso o
  rimozione campi — tutte queste richiedono coordinamento con l'agente app
  e una misura reale di `requestBytes` (raccolta dal profiler esteso in
  FASE 3), non ancora disponibile.
- Non aggiunge cache a `/api/v1/sync` (è POST, autenticato, dati sanitari
  — non deve mai essere servito da cache, vedi FASE 4 del report).
- Non dichiara una percentuale di risparmio Fast Origin Transfer: la
  riduzione attesa è strutturale (un hop invece di due per le richieste
  bloccate/consentite di questo endpoint), non quantificata qui.
