# SPRINT P0.12 FASE 3 — verifica pre-condizione sitemap: GAP TROVATO, sitemap non toccata

Data: 2026-08-06. Verifica read-only contro produzione (`https://www.fitmesh.fit`, SHA
`a91637591014ece733b794f0bc69b773be50953c`, deploy `dpl_2z6wLPjShe7UfcBSGUzQwXr3hJJW`,
frozen dal freeze SPRINT PRE-FERIE).

## Mandato

> Prima di modificarla, verifica programmaticamente che ogni variante indicizzabile esponga
> nell'HTML: canonical corretto; hreflang reciproci; x-default; solo locale realmente
> disponibili. [...] Se anche una sola famiglia di pagine dipende dagli hreflang della
> sitemap perché l'HTML è incompleto, non fare la modifica: documenta il gap e lascia la
> sitemap invariata.

## Esito: NON tutte le famiglie sono verdi → sitemap NON modificata

### Famiglie verificate OK (canonical self, hreflang reciproci, x-default corretto, solo
locale realmente disponibili)

Campionate via curl live su `<head>`:

| Famiglia | URL campione | Esito |
|---|---|---|
| Homepage | `/it`, `/en` | canonical self, 15 hreflang + x-default=it, tutti reciproci |
| Blog post (indicizzabile ovunque) | `/it/blog/health-connect-not-syncing`, `/en/...` | canonical self, hreflang solo per le varianti realmente indicizzabili (10, non 15 — es/de/pt/fr/nl/sv/da oltre it/en), x-default=it |
| Blog post (variante Nordic gated) | `/sv/blog/health-connect-not-syncing` | stesso set hreflang della versione it/en, canonical self — coerente |
| Landing page (`/lp/...`) | `/it/lp/due-telefoni` | canonical self, hreflang solo sulle 8 lingue realmente tradotte, x-default=it |
| Labs (`/labs`) | `/it/labs` | canonical self, hreflang solo it/en (Labs è it/en-only per design, `LABS_LOCALES`), x-default=en |
| Pagina statica standalone | `/it/famiglia`, `/it/press` | canonical self, 15 hreflang reciproci, x-default=it |

### Famiglia NON verde: provider (`/sync/[provider]`) e modello (`/sync/[provider]/[model]`)

Verifica codice (lettura diretta, non solo campione live) su:
- `app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx`
- `app/(frontend)/[locale]/(marketing)/sync/[provider]/[model]/page.tsx`
- `lib/i18n.ts` (`localeAlternates()`)
- `app/sitemap.ts`
- `lib/providers/indexability.ts`

**Il bug**: entrambe le pagine calcolano `robots` (noindex per-locale) usando i predicati
corretti `isProviderVariantIndexable(p, lc)` / `isProviderModelVariantIndexable(m, lc)` — ma
il campo `alternates.languages` (gli hreflang nell'`<head>`) usa invece la funzione condivisa
non filtrata `localeAlternates()` in `lib/i18n.ts`, che emette **tutte e 15 le lingue
incondizionatamente**, incluse quelle marcate `noindex` per contenuto incompleto/fallback.

Confermato live:
```
$ curl -s https://www.fitmesh.fit/it/sync/garmin/fenix-7 | grep hreflang
→ 15 hreflang (it/en/es/de/pt/fr/pl/tr/nl/ja/ko/sv/da/no/fi) + x-default
```
mentre `app/sitemap.ts` per lo stesso URL usa correttamente
`isProviderModelVariantIndexable` e produce un set filtrato più piccolo — cioè **la sitemap
è già più corretta della pagina stessa** per questa famiglia.

Il commento in `lib/providers/indexability.ts` ("un solo helper, non possono divergere") è
quindi falso nella pratica: robots e hreflang divergono per provider e modello.

### Perché questo blocca FASE 3 (non solo per la famiglia in questione)

Se si rimuovessero dalla sitemap gli hreflang "duplicati" rispetto all'HTML (assumendo che
l'HTML sia la fonte di verità completa), per le pagine provider/modello si perderebbe l'unico
segnale hreflang corretto disponibile (quello della sitemap), perché l'HTML di quella
famiglia include locale non realmente disponibili. Il mandato è esplicito su questo esatto
scenario: una sola famiglia non verde è sufficiente per non toccare la sitemap.

## Decisione

- **Sitemap invariata** in questo sprint. Nessun URL, hreflang o lastmod toccato.
- IndexNow (FASE 1) e prefetch (FASE 2) restano consegnabili — non dipendono da questa
  pre-condizione.
- **Follow-up P1 proposto** (fuori scope P0.12, da programmare dopo le ferie): allineare
  `sync/[provider]/page.tsx` e `sync/[provider]/[model]/page.tsx` per calcolare
  `alternates.languages` con lo stesso predicato già usato per `robots`
  (`isProviderVariantIndexable`/`isProviderModelVariantIndexable`), esattamente come già fanno
  `blogLanguages()` e `landingLanguages()` per blog e landing. Nessuna modifica fatta ora per
  restare rigorosamente nel perimetro P0.12 (niente redeploy oltre l'unico autorizzato di
  questo sprint, niente rischio di introdurre una regressione hreflang durante la finestra
  pre-ferie).
