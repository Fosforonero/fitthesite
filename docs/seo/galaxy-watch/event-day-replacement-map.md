# Galaxy Watch — Event-Day Replacement Map (P1.3N-B Preflight)

Scritto 2026-07-21, giorno prima di Galaxy Unpacked (2026-07-22, 14:00
BST / 15:00 CEST). Unico documento da cui partire domani dopo l'evento:
elenca ogni placeholder residuo, la fonte ufficiale attesa, l'azione se
Samsung non conferma, la checklist di rinomina, la watchlist delle fonti
e i template editoriali pronti ma non pubblicati.

Non contiene nessuna informazione dell'evento: solo struttura e fonti
attese. Nessun push, nessun deploy oggi.

---

## Fase 1 — Inventario placeholder

<!-- PLACEHOLDER_COUNT_DECLARED: 101 -->
**Conteggio esatto (verificato via script automatico, non a occhio):**
**101** occorrenze di `[TBD` in `lib/blog/posts/galaxy-watch-ultra-2-health-connect.ts`
(unico file con placeholder pubblicabili). Il marcatore HTML sopra
(`PLACEHOLDER_COUNT_DECLARED`) è letto automaticamente da
`tools/check-galaxy-watch-placeholder-count.ts`: se questo numero e il
conteggio reale nel post divergono, il check fallisce con exit 1.

**Cronologia di questo numero, per trasparenza**: 101 alla prima stesura
di questa mappa -> 109 dopo l'aggiunta di 2 righe matrice (frequenza
respiratoria, durata/calorie) nello stesso commit di preflight -> il
check automatico ha correttamente rilevato quella divergenza quando
richiesto con una verifica read-only esplicita, non l'ho trovata da
solo -> **101** di nuovo oggi, dopo la correzione architetturale
Samsung Health SDK/Health Connect/Google Health: la Tabella A
sostituisce la vecchia matrice a 5 colonne con una a 6 colonne ma con
un solo tag `[TBD]` per cella invece di due ("misurata dal watch" +
"scritta in HC" erano entrambi taggati separatamente prima; ora
"misurata da Samsung Health"/riga e "scritta in HC"/riga sono ancora
distinti ma alcune righe hanno perso una colonna TBD perché il dato
FitMesh-side è ora certo indipendentemente dal nuovo modello, es.
pressione arteriosa e apnea). Il numero uguale a prima (101) è una
coincidenza aritmetica, non un segnale che nulla sia cambiato: il
check automatico l'ha ri-verificato da zero dopo la riscrittura, non
l'ho semplicemente ripristinato.

Esecuzione (Docker):
```bash
npx tsx tools/check-galaxy-watch-placeholder-count.ts
```

Output raggruppato per categoria/fatto (non solo per occorrenza), con
split IT/EN best-effort:

| Categoria | Totale | IT | EN |
|---|---|---|---|
| Metadata (slug/date/keyword/readMinutes) | 4 | 4 | 0 |
| Hero (title/subtitle) | 5 | 4 | 1 |
| TL;DR | 2 | 2 | 0 |
| Paragrafo "cosa ha annunciato" | 2 | 1 | 1 |
| Tabella specifiche ufficiali | 18 | 9 | 9 |
| Funzioni salute (paragrafo modello-specifico) | 2 | 1 | 1 |
| Matrice verificata (Tabella A, Tabella B non ha TBD) | 50 | 25 | 25 |
| Compatibilità Android | 2 | 1 | 1 |
| Limiti da verificare | 6 | 6 | 0 |
| FAQ | 10 | 0* | 10* |
| **Totale** | **101** | **53** | **48** |

\* **Split IT/EN impreciso per la categoria FAQ**: ogni riga FAQ ha DUE
coppie it/en (`q:` e `a:`), ma l'euristica dello script taglia al primo
"en:" trovato sulla riga (quello di `q:`), quindi attribuisce tutto ciò
che segue (incluso l'it di `a:`) alla colonna EN. Il totale per riga è
comunque corretto (2 per domanda, 5 domande = 10), la sola ripartizione
IT/EN interna alla categoria FAQ non è affidabile. Non ho corretto
l'euristica oggi (richiederebbe un parser vero, non un taglio su
stringa) — segnalato esplicitamente invece di presentarlo come esatto.

Comando di verifica generale placeholder (Fase 2, da rieseguire ogni
volta prima del gate):

```bash
rg -n '\[TBD\]|TBD|provvisor|provisional|to be confirmed|da confermare' \
  lib app components public docs
```

Risultato oggi (21/07), oltre ai 101 nel post: due riferimenti **non
bloccanti**, entrambi al di fuori dello scope pubblicabile:
- `docs/seo/seo-geo-master-plan.md:634` — nota interna già corretta
  ("slug provvisorio... non fissare prima che Samsung confermi"), da
  aggiornare in sincrono col rename ma non un placeholder pubblico.
- `lib/providers/data.ts:19` — commento su un valore enum `"coming-soon"`
  generico, non correlato a Galaxy Watch.
- `lib/blog/posts/google-health-google-fit.ts:515,523` — "da confermare"
  pre-esistente, articolo diverso, non toccare.

### Tabella placeholder per categoria

| File, riga o chiave | Informazione richiesta | Fonte ufficiale attesa | Azione se non annunciata |
|---|---|---|---|
| `slug` (riga 22), `slugs.ts` entry, `covers.ts` entry, title/H1/keyword (righe 29,42) | Nome commerciale esatto | Samsung Newsroom / pagina prodotto | Rinomina file+slug+ogni riferimento, o **NO-GO** se nessun Watch pertinente annunciato |
| Tabella specifiche, riga "Processore" (85) | Modello e processo produttivo | Specifiche ufficiali Samsung | Eliminare la riga se non dichiarato |
| Tabella specifiche, righe "Batteria"/"Autonomia dichiarata" (86-87) | Capacità nominale e autonomia dichiarata | Specifiche ufficiali Samsung | Eliminare; "Autonomia reale" resta "non ancora testata" comunque |
| Tabella specifiche, riga "Display" (89) | Dimensioni e luminosità | Specifiche ufficiali Samsung | Eliminare se non dichiarato |
| Tabella specifiche, riga "Resistenza" (90) | Certificazioni (ATM/IP) | Specifiche ufficiali / Support | Eliminare se non dichiarato |
| Tabella specifiche, righe "Connettività"/"Prezzo"/"Disponibilità" (91-93) | Varianti, prezzo per mercato, paesi/date | Newsroom / Samsung Italia | Eliminare se non dichiarato per l'Italia/UE |
| Sezione "Funzioni salute" — paragrafo modello-specifico (116) | Apnea/ECG/pressione: paese, versione software, telefono richiesto, ente regolatore | Newsroom/Support/Samsung Health release notes | Segnare "non comunicato da Samsung" |
| Matrice, colonna "Misurata dal watch" (righe 133-147, 15 righe) | Se il nuovo modello ha davvero il sensore per ciascuna metrica | Pagina prodotto/specifiche | Non dedurre da Vitals: lasciare "non comunicato" finché non confermato per QUESTO modello |
| Riga GPS, colonna "Visibile in Samsung Health" | Se il nuovo modello ha GPS integrato | Specifiche ufficiali | Non dedurre |
| Paragrafo compatibilità Android (158) | Versione One UI/Samsung Health richiesta | Support Samsung | Segnare "non comunicato" |
| Lista limiti (163-165, 168-170) | Metriche scritte in HC, disponibilità regionale, device di test | Support/Newsroom, interno FitMesh | Rimuovere le voci risolte, mantenere quelle ancora aperte |
| FAQ Snapdragon (177) | Conferma esplicita adozione chip | Samsung (non basta conferma Qualcomm) | Mantenere la risposta attuale (già event-independent, vedi nota sotto) se non confermato |
| FAQ VO2 max export (180) | Se Samsung scrive Vo2MaxRecord da questo modello | Support/documentazione tecnica | Aggiornare stato, la conclusione FitMesh non cambia comunque |
| FAQ Energy Score/smartphone Samsung/paesi Italia (182-184) | Tre risposte aperte | Support Samsung | Rispondere se la fonte esiste, altrimenti "non comunicato" esplicito nella risposta (non lasciare `[TBD]`) |
| `hero.subtitle` (33-34), `tldr[0]` (52,58) | Riassunto con nome/hardware/prezzo | Sintesi di tutto quanto sopra | Riscrivere per ultimo, dopo aver risolto tutte le altre righe |
| Paragrafo "Cosa ha annunciato Samsung" (77) | Cronaca dell'evento | Newsroom, verificata live | Scrivere solo con fonti Samsung dirette |

**Nota sulla FAQ Snapdragon (riga 177):** questa risposta, a differenza
delle altre, è già scritta in forma pienamente event-independent (dice
esplicitamente "lo diciamo solo se Samsung lo conferma esplicitamente").
Il tag `[TBD post-evento]` è un promemoria di revisione, non un buco di
contenuto: domani va solo deciso se la premessa resta valida (nessuna
conferma → testo invariato, tag rimosso) o se aggiornarla con la
conferma reale.

---

## Fase 2 — Checklist di rinomina completa (fonte unica)

Nessun refactor strutturale introdotto oggi (niente costante condivisa
per il nome: l'architettura attuale non usa quel pattern per nessuno dei
63 post esistenti — introdurlo per uno solo sarebbe un'incoerenza
architetturale, non una centralizzazione). Questa tabella **è** la fonte
unica per l'operazione di rename, verificata completa via `rg -rl
"galaxy-watch-ultra-2-health-connect|Galaxy Watch Ultra 2"` su tutto il
worktree:

| # | File | Riga/i | Cosa contiene |
|---|---|---|---|
| 1 | `lib/blog/posts/galaxy-watch-ultra-2-health-connect.ts` | tutto il file | Il post stesso — **rinominare anche il nome del file** |
| 2 | `lib/blog/slugs.ts` | 762-773 | Entry `BLOG_SLUGS["galaxy-watch-ultra-2-health-connect"]` (10 chiavi placeholder) |
| 3 | `lib/blog/covers.ts` | 40-44, 106-109 | Commento + entry `CoverType "watch"` + `POST_COVER` |
| 4 | `lib/blog/indexability.ts` | 65 | Entry in `REDIRECT_INCOMPLETE_LOCALE_SLUGS` |
| 5 | `lib/blog/data.ts` | 110, 190 | Import + entry in `RAW_POSTS` |
| 6 | `lib/providers/data.ts` | 676 | `relatedBlogSlugs` del provider Galaxy Watch |
| 7 | `lib/blog/posts/anello-vs-smartwatch.ts` | 449 | `related[]` |
| 8 | `lib/blog/posts/health-connect-vs-samsung-health.ts` | 1068 | `related[]` |
| 9 | `lib/blog/posts/guida-sync-wearable-2026.ts` | 1925 | `related[]` |
| 10 | `lib/blog/posts/come-funziona-health-connect.ts` | 1307 | `related[]` |
| 11 | `tools/check-galaxy-watch-article-claims.ts` | 3, 41, 45 | Import, path target, commento — **rinominare anche il nome dello script + entry `package.json`** |
| 12 | `docs/seo/seo-geo-master-plan.md` | 634 | Nota interna (non pubblica, bassa priorità ma da tenere coerente) |
| 13 | `docs/seo/galaxy-watch/fact-ledger.md` | tutto il file | Già scritto in modo neutro (mai nome nel testo prosa se non tra virgolette come "atteso"), verificare comunque righe con il nome |

**Se Samsung conferma "Galaxy Watch Ultra 2" esattamente**: nessuna delle
13 righe sopra cambia, si passa direttamente alla Fase 2 (eliminazione
placeholder) di domani.

**Se il nome è diverso**: aggiornare tutte le 13 righe con lo stesso
nuovo slug (kebab-case, pattern esistente `<prodotto>-health-connect`),
più: title/H1 (riga 29), `primaryKeyword` (42), testo dentro l'OG image
(nessun testo incorporato oggi, vedi Fase 8 — nessuna azione), keyword
secondarie se contengono il nome vecchio.

**Nessun redirect da creare** in nessuno dei due casi: lo slug attuale
non è mai stato pubblico.

---

## Fase 3 — Watchlist fonti ufficiali per domani

| Fonte | URL/sezione attesa | Tipo di informazione | Priorità | Alternativa ufficiale |
|---|---|---|---|---|
| Samsung Global Newsroom | news.samsung.com/global | Annuncio, nome, specifiche | Massima | — |
| Samsung Italia Newsroom | news.samsung.com/it | Prezzo/disponibilità IT | Alta | Samsung Global se IT non pubblicata subito |
| Pagina prodotto Galaxy Watch | samsung.com (IT o global) | Specifiche complete, prezzo, immagini ufficiali | Massima | Samsung Newsroom se pagina non live subito |
| Pagina specifiche tecniche | samsung.com/.../specs | Hardware dettagliato (processore, batteria, display, resistenza) | Alta | Newsroom (spesso meno dettagliato) |
| Samsung Support | samsung.com/support | Requisiti (telefono, versione app, paese), limitazioni | Alta | Product page FAQ |
| Samsung Health (app/release notes) | Play Store listing, in-app changelog | Funzioni salute effettivamente distribuite | Media | Newsroom (annuncio può precedere il rollout reale) |
| Comunicati funzioni salute specifiche | Newsroom, ricerca dedicata (apnea/ECG/pressione) | Disponibilità regolatoria per paese | Alta | Support |
| Android Health Connect docs | developer.android.com/health-and-fitness/health-connect/data-types | Conferma indipendente dei record type (già verificato, indipendente dall'evento) | Bassa (già fatto) | — |

Regola invariata: le fonti secondarie (stampa tech) restano utili solo
per **trovare dove guardare**, mai per rendere un claim pubblicabile.

---

## Fase 4 — Note interne matrice (righe pronte, non ancora pubbliche)

La tabella nel body del post è dato statico (array TS), non logica
computata: nessuna propagazione automatica esiste già strutturalmente —
verificato leggendo il file, ogni cella è un valore letterale scritto a
mano. Confermato oggi anche per le righe aggiunte sotto (Fase 6).

Righe **preparate ma tenute fuori dalla tabella pubblica** finché non è
chiaro se pertinenti al nuovo modello (regola: non pubblicare righe
speculative come se fossero specifiche del prodotto):

| Metrica | Fatto FitMesh (verificato oggi, codice) | Da aggiungere alla tabella pubblica quando |
|---|---|---|
| Zone cardiache | Nessuna zona HR dedicata letta in nessun percorso (verificato, nessun match nel codice) | Solo se Samsung annuncia zone cardiache come funzione nuova rilevante — altrimenti non menzionare (non è un limite Samsung-specifico da segnalare, è assente ovunque) |
| Pressione arteriosa | Letta **solo** via canale diretto Samsung Health SDK (gap-fill), mai Health Connect — stesso pattern dell'apnea. Citazione: `health_repository.dart:764-765`, `health_snapshot.dart:218-219,274-276` | Se Samsung conferma la funzione pressione sul nuovo modello: aggiungere riga con questa esatta formulazione (non "letta da FitMesh" senza la qualificazione "solo canale diretto") |
| ECG | Non letto in nessun percorso (verificato, nessun match) | Solo se Samsung annuncia ECG come funzione nuova del modello |
| Coaching/punteggi AI generali | Non letto; FitMesh ha un proprio "recovery index" deterministico non-AI, non collegato a Samsung (`recovery_index.dart`) — da NON confondere con Fitness Index/Heart Health Score se menzionato | Solo se Samsung introduce un punteggio "coaching" distinto da quelli già in tabella |

Righe **già aggiunte alla tabella pubblica oggi** (Fase 6, sotto): frequenza
respiratoria, durata e calorie — entrambe fatti di codice, indipendenti
dall'evento, già verificati nel fact ledger.

---

## Fase 5 — Template editoriali interni (NON pubblicati)

Verificati oggi contro il vincolo lunghezza title del sito: **≤70
caratteri** (guardrail `tools/check-bing-seo-recommendations.ts:22-23`,
applicato a tutti i post EN; stesso vincolo adottato per IT per
coerenza), meta description 150-160 caratteri. Il suffisso ` · FitMesh`
(10 caratteri) è aggiunto automaticamente dal template
(`blog/[slug]/page.tsx:79`) e va sottratto dal budget disponibile per lo
`hero.title` (quindi ≤60 caratteri utili per il title puro).

### Caso A — nuovo Ultra annunciato

- IT title: `[Nome ufficiale]: dati salute e Health Connect` — con
  "Galaxy Watch Ultra 2" (20c) → 48c totali, **entro il limite**.
- EN title: `[Official name]: Health Data and Health Connect` — 49c con
  lo stesso nome, **entro il limite**.
- IT H1: `[Nome ufficiale]: quali dati salute arrivano davvero a
  FitMesh?` — 62c con "Galaxy Watch Ultra 2", nessun vincolo di
  lunghezza sull'H1 (solo sul `<title>`).
- EN H1: `[Official name]: Which Health Data Actually Reaches FitMesh?`

### Caso B — nuova serie standard annunciata (non Ultra)

- IT title: `[Nome ufficiale]: dati salute e compatibilità FitMesh`
- EN title: `[Official name]: Health Data and FitMesh Compatibility`
- H1: stesso pattern del Caso A con "arrivano davvero a FitMesh".

### Caso C — più modelli annunciati insieme

- IT title: `Nuovi Galaxy Watch 2026: dati salute e Health Connect` — 54c,
  **entro il limite**.
- EN title: `New Galaxy Watches 2026: Health Data and Health Connect`
- H1 pattern identico, plurale ("i nuovi Galaxy Watch"/"the new Galaxy
  Watches").

Nessun nome non ufficiale è stato scritto nel codice pubblico per questo
test: le verifiche di lunghezza sopra sono state fatte a mano su questo
documento, non nel post file.

---

## Riepilogo: cosa resta SOLO per domani

1. Verificare nome ufficiale (gate Fase 2 di domani) → applicare la
   checklist di rinomina sopra se necessario, o NO-GO.
2. Sostituire i 101 placeholder secondo la tabella Fase 1 sopra.
3. Riverificare il fact ledger riga per riga contro le fonti live.
4. Decidere le 4 righe "in attesa" della Fase 4 (aggiungerle o no).
5. Riscrivere `hero.subtitle`/`tldr[0]` per ultimo.
6. Eseguire `GW_EVENT_DAY=1 npx tsx tools/check-galaxy-watch-article-claims.ts`
   (nuovo gate placeholder-zero, vedi guardrail aggiornato oggi) — deve
   essere verde prima di aprire la PR.
7. Rieseguire l'intero gate Docker (Fase 11 di oggi, stessa lista).
8. Rebase, push, PR, stop.
