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
