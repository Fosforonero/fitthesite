# Prova applicativa dell'export web (backend locale vero)

Differenza fra le tre famiglie di prove dell'export:

| Famiglia | Dove | Backend | RLS | Cosa prova |
|---|---|---|---|---|
| Test con mock | `app/(frontend)/[locale]/app/export/ExportDataClient.test.tsx` | finto, in memoria | nessuna | la logica del componente (fail-closed, marcatori, sessione) |
| Test SQL | `supabase/tests/reset-pg17/16-test-export-web-ambito-righe.sql` | Postgres 17 usa-e-getta | vera | il predicato di ambito delle righe, con le query scritte a mano |
| **Prova applicativa** | questa cartella | **Postgres 17 + PostgREST veri** | **vera** | il percorso dell'app: richieste HTTP vere del client supabase-js, componente vero, download, scritture |

**Cosa e' vero:** Postgres 17 ricostruito dalle 126 migration con le policy RLS vere della catena; PostgREST vero (verifica la firma del JWT, applica la RLS); le STESSE QUERY che `supabase-js` genera per il componente (filtri, ordine, offset/limit, `count=exact`, insert, upsert); il componente vero, e come controllo quello di main.
**Cosa e' finto o non esercitato:**
- l'identita': JWT sintetico (`role: authenticated`, `sub` dell'attore) firmato col segreto del PostgREST di prova; non c'e' GoTrue e `auth.getUser()` e' uno stub, quindi i controlli di cambio sessione del componente NON sono esercitati (li coprono i test con mock);
- il `createClient` reale dell'app (`@supabase/ssr`, cookie, refresh) NON gira: le richieste sono le stesse query, non gli stessi byte del browser;
- il browser: Blob e click di download sono simulati (jsdom);
- `rowBelongsToOwner` (la seconda difesa sulle righe) NON e' provata qui: un backend vero rispetta il filtro, togliere quel controllo lascia la prova verde; lo coprono i test con mock;
- versioni: Postgres 17.10 (la config locale di Supabase dice major 15), PostgREST v14.15 (la stessa dello stack locale, quella di produzione e' ignota), `max_rows` 1000 impostato a mano.
**Non e' una prova sulla produzione**: la RLS e' quella delle migration. Non fa parte della suite ne' della CI (richiede Docker e l'immagine PostgREST gia' in locale).

Igiene: ogni esecuzione usa nomi di container e di rete UNICI e una porta libera scelta dal sistema (legata a 127.0.0.1); lo script si ferma se un nome forzato esiste gia' e distrugge solo cio' che ha creato (mai `supabase_*`, mai `docker rm -f` su nomi altrui). Il segreto JWT e' casuale, non e' scritto su disco (e' visibile in `docker inspect` del container di prova, che e' usa-e-getta). La rete Docker non e' interna.

Uso: `colima start`, poi `bash tools/prove-locali/export-applicativo/esegui.sh`. Distrugge sempre i propri container (mai `supabase_*`).

## Verificatore del file scaricato

`verifica-export-json.ts` controlla OFFLINE un file di export (nessuna rete): JSON valido, le 12 chiavi nell'ordine,
dichiarazione di incompletezza coerente con le tabelle marcate, nessuna riga con proprietario diverso dall'account,
nessun identificativo della controparte nei legami, nessuna colonna sensibile, ogni colonna nella proiezione, nessun
testo tecnico del database. Uso: `npx tsx tools/prove-locali/export-applicativo/verifica-export-json.ts <file.json>`
(esito 0 = conforme). La prova applicativa lo esercita con un controllo positivo (i file del candidato sono conformi)
e uno negativo (il file prodotto dal componente di main per l'admin NON lo e', e cinque varianti guaste del file sano
sono tutte rosse); lo stesso verificatore serve a controllare il file scaricato in uno smoke in produzione.
I file prodotti stanno in `.generato/` (ignorato da git).
