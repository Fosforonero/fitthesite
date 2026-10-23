# 03 Dashboard reale, prototipo, dati sintetici

Tre cose diverse che nello stesso albero convivono. Confonderle è l'errore più facile.

## Dashboard reale

Rotta `/[locale]/app/dashboard`. Legge dati veri del titolare (sessione Supabase, verdetto, righe di metriche).

- Pagina: `app/(frontend)/[locale]/app/dashboard/page.tsx` e i suoi test `page.*.test.tsx`.
- Librerie: `lib/dashboard/*`.
- Grafico dei passi: `components/charts/*` (kit usato dalla pagina reale).
- Cancello: `lib/dashboard/interruttore.ts` più `CAPABILITY_STATUS.webDashboard` (definito in `lib/product-facts.ts`, letto da `lib/feature-status.ts` tramite `isFeatureAvailable`).
  Oggi chiusa fuori dallo sviluppo locale.
- Dati: righe `local_day_key`, `steps`, sorgente ecc. del titolare. In produzione **mai verificata** con dati veri.
- Supporto SQL (non applicato in produzione): `supabase/migrations/20260924120000_web_dashboard_access_verdict.sql` e
  le sue prove `supabase/tests/reset-pg17/17-…`, `18-…`.

**G-04 vive qui.**

## Prototipo

Rotta `/[locale]/dashboard-preview/**`. Interfaccia di revisione con **dati sintetici**, nessuna metrica reale.

- Pagine: `app/(frontend)/[locale]/dashboard-preview/**`.
- Componenti: `components/web-dashboard/**` (schermate Panoramica, Attività, Sonno, Cuore, Tendenze, Allenamenti, Fonti).
- Librerie: `lib/web-dashboard/**`, in particolare `synthetic.ts` (generatore di dati inventati), `fixtures/`, `from-rows.ts`, `model.ts`, `measure.ts`.
- Cancello: `lib/web-dashboard/flag.ts`. Chiuso su ogni ambiente Vercel e in ogni build di produzione.
- Provenienza: copiato da un prototipo precedente (`docs/web-dashboard/PROVENIENZA.sha256`).
- Il suo vocabolario di misura (`lib/web-dashboard/measure.ts`: `measured`, `measured-zero`, `partial`, `absent`) **non è
  lo stesso** della pagina reale. Il kit condiviso (`components/charts/types.ts`) li accetta tutti più `error`, `received`,
  `ambiguous`, `undetermined`, `placeholder`; la pagina reale emette solo `received`, `ambiguous`, `undetermined`,
  `placeholder`, `absent`, `error`.

**G-04 non deve toccare il prototipo.** In particolare `lib/web-dashboard/from-rows.ts` resta com'è.
Il codice della pagina reale e di `lib/dashboard` non importa niente da `lib/web-dashboard` o
`components/web-dashboard` (verificato con grep sui file non di test a questo SHA).

## Dati sintetici (e che cosa NON è)

| Dove | Che cosa è | Limite |
|---|---|---|
| `lib/web-dashboard/synthetic.ts`, `lib/web-dashboard/fixtures/` | dati inventati del prototipo | non rappresentano utenti veri |
| `lib/dashboard/postgrest-fedele.fixture.ts`, `app/…/dashboard/pagination.fixture.ts` | doppioni (mock) di PostgREST per test | un finto client **non** prova RLS, collation, `max_rows` né filtri `gte/lte` veri; a volte non filtra affatto |
| `supabase/tests/reset-pg17/*` | prove su un PG17 usa-e-getta con righe inventate | non è la produzione; Docker richiesto |
| Test WIP G-04 | UUID inventati, indirizzo `sintetico@example.invalid` | idem |

## Che cosa NON è stato provato su nessun SHA

Autenticazione reale (GoTrue), RLS reale, funzioni SQL del verdetto in produzione, intestazioni
`Cache-Control`/`Vary` reali, WebKit e Firefox, tastiera del grafico fuori da Chromium. Un test verde sul
prototipo o su un doppione non è una prova di nessuna di queste cose: dichiaralo nei report di consegna.
