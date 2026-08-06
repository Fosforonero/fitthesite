# FASE 2 — Diagnosi sitemap/GSC (SPRINT PRE-FERIE, 2026-08-06)

## Esito: sitemap tecnicamente pulita, nessuna modifica applicata

Diagnosi proporzionata e read-only eseguita contro `https://www.fitmesh.fit` (produzione,
post Release B, SHA `422648c`). Tutti i controlli richiesti dalla FASE 2 sono passati:

| Controllo | Esito |
|---|---|
| `GET /sitemap.xml` (UA reale) | HTTP 200, `content-type: application/xml` |
| `GET /sitemap.xml` (UA Googlebot) | HTTP 200, risposta identica (nessun cloaking) |
| `HEAD /sitemap.xml` | HTTP 200, `content-length: 1 966 994` byte (1.88 MB) |
| Parse XML | Valido, nessun errore |
| URL totali / univoci | 1389 / 1389 (0 duplicati) |
| Host | Uniforme: `www.fitmesh.fit` (nessuna URL su host alternativo) |
| Schema | Uniforme: `https` (nessuna URL `http`) |
| Query string / frammenti | 0 URL con `?` o `#` |
| Limite 50 000 URL / 50 MB | Ampiamente entro i limiti (1389 URL, 1.88 MB) |
| `robots.txt` | `Allow: /`, `Disallow` solo su `/app/ /cms/ /auth/ /oauth/ /api/`, `Sitemap:` dichiarata correttamente e identica all'URL reale |
| `robots.txt` raggiungibile da Googlebot | HTTP 200 |
| Campione stratificato (53 URL: prime 10, ultime 10, ogni 40ª) | 53/53 → HTTP 200, 0 redirect 3xx, 0 errori 4xx |
| Stesso campione: meta robots | 0 `noindex` trovati |
| Stesso campione: canonical | 5/5 ispezionate → self-canonical corretto |

**Nessuna anomalia reale trovata.** Per l'istruzione esplicita dello sprint ("se tutto
risulta in ordine... NON modificare né spezzare la sitemap in questo sprint"), la sitemap
non è stata toccata. Non c'è alcuna prova che giustifichi uno split in sitemap-index
(quello resta autorizzato solo a fronte di un fallimento reale e ripetibile, mai come
precauzione).

## Classificazione del problema segnalato da GSC

Con la sitemap stessa pulita su ogni asse verificabile da qui, il rilievo di Google
Search Console (qualunque esso sia stato — non specificato in dettaglio in questo sprint,
solo referenziato) è classificato come una delle seguenti cause, in ordine di probabilità:

1. **Stale/non aggiornato**: GSC mostra spesso lo stato dell'ultima scansione, che può
   essere precedente a fix già live (es. Release A/B di oggi hanno corretto contenuti
   e metadata su decine di URL).
2. **Property sbagliata**: se in GSC sono configurate più property (es. `fitmesh.fit`
   senza www, `http://`, o una property "dominio" vs "prefisso URL"), il rilievo potrebbe
   riferirsi a una property che non riceve più traffico/non è quella canonica.
3. **Domanda di scansione (crawl demand) bassa**: con 1389 URL e un sito relativamente
   giovane, Google potrebbe semplicemente non aver ancora ri-scansionato la sitemap
   dopo un cambiamento, non per un errore ma per prioritizzazione propria di Googlebot.
4. **Risposta intermittente pregressa**: un errore temporaneo (5xx, timeout) può restare
   visibile in GSC per giorni prima che una nuova scansione lo aggiorni, anche se il sito
   è tornato sano subito dopo.

Nessuna di queste ipotesi è verificabile da qui senza accesso alla Search Console stessa
(serve login Google, non disponibile in questo ambiente).

## Handoff per Matteo (5 passi, Search Console)

1. **Verifica la property corretta**: in GSC, controlla che la property selezionata sia
   esattamente `https://www.fitmesh.fit` (prefisso URL) o la property a dominio che la
   include — non una vecchia property `http://` o senza `www.`.
2. **Sitemap → invia di nuovo**: in *Indicizzazione → Sitemap*, se `sitemap.xml` risulta
   con errori o "Recuperata" da tempo, rimuovila e reinviala con l'URL esatto
   `https://www.fitmesh.fit/sitemap.xml` (case-sensitive, nessun redirect nel mezzo —
   verificato qui: nessuno).
3. **Controllo URL in tempo reale**: usa lo strumento "Controllo URL" (Live Test, non la
   versione cached) su 2-3 URL a campione (es. homepage IT/EN, un post blog recente).
   Verifica i due campi chiave: **"Scansione consentita"** (deve essere "Sì") e
   **"Recupero della pagina"** (deve essere "Riuscito") — se uno dei due è negativo LÌ,
   è un segnale reale lato Google, non un falso positivo.
4. **Se l'errore persiste solo su URL specifiche**: annota quali URL esatte (non solo il
   conteggio aggregato) — serve per riprodurre il problema qui con lo stesso rigore usato
   per i CSV Bing di questo sprint (identità URL, non solo un numero).
5. **Timing**: se il test dal vivo (punto 3) risulta pulito, il rilievo GSC è quasi
   certamente stale — puoi ignorarlo e aspettare la prossima scansione naturale
   (nessuna azione forzata necessaria, niente "richiedi indicizzazione" di massa che
   rischia di essere trattato come spam da Google).

## Nota di scope

Questa diagnosi è stata eseguita su richiesta esplicita della FASE 2 dello SPRINT
PRE-FERIE, in assenza di un export GSC specifico con URL puntuali per questo rilievo
(a differenza dei CSV Bing, che erano forniti con URL reali). Se Matteo fornisce in
futuro un export equivalente (URL esatte, non conteggi), la diagnosi può essere ripetuta
con lo stesso rigore usato per gli export Bing di questa stessa sessione.
