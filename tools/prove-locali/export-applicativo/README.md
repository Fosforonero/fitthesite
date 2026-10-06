# Prova applicativa dell'export web (backend locale vero)

Differenza fra le tre famiglie di prove dell'export:

| Famiglia | Dove | Backend | RLS | Cosa prova |
|---|---|---|---|---|
| Test con mock | `app/(frontend)/[locale]/app/export/ExportDataClient.test.tsx` | finto, in memoria | nessuna | la logica del componente (fail-closed, marcatori, sessione) |
| Test SQL | `supabase/tests/reset-pg17/16-test-export-web-ambito-righe.sql` | Postgres 17 usa-e-getta | vera | il predicato di ambito delle righe, con le query scritte a mano |
| **Prova applicativa** | questa cartella | **Postgres 17 + PostgREST veri** | **vera** | il percorso dell'app: richieste HTTP vere del client supabase-js, componente vero, download, scritture |

Cosa e' finto: l'identita' (JWT sintetico con ruolo `authenticated` e `sub` dell'attore, firmato col segreto del PostgREST di prova; `auth.getUser()` e' uno stub, non c'e' GoTrue) e il browser (Blob e click di download in jsdom).
Non e' una prova sulla produzione: la RLS e' quella delle migration. Non fa parte della suite ne' della CI (richiede Docker e l'immagine PostgREST in locale).

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
