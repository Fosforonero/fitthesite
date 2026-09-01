# Negative test log — `tools/check-p19a-funnel-module.ts`

Il file referenziato dall'header del guardrail non esisteva ancora quando i
controlli 1-10 sono stati scritti (SPRINT P1.9 FASE 8) — questo log copre
solo i controlli aggiunti nell'ADDENDUM P1.9 del 2026-09-01 (controlli 11 e
12), con la prova reale eseguita in quella sessione. Non retro-documenta i
negative test dei controlli 1-10.

## Check 11 — parità locale del modulo (`cta-locale-gap`)

**Scoperta**: riconciliando una discrepanza segnalata (9→7 locale
indicizzabili per `health-connect-not-syncing`, 13→11 per
`garmin-samsung-health-sync-guide`), causa A confermata (un audit ad-hoc
aveva letto `BLOG_POSTS` senza applicare `applyNordicOverlay` — nessuna
regressione reale di indicizzabilità). L'indagine ha però scoperto un
secondo problema reale e distinto: il blocco `fitmesh-editorial-cta` non è
mai stato coperto da `walkPost`/`walkSection` (`nordic-overlay.ts` non ha un
case per questo tipo), quindi la sua completezza di traduzione non
influenza `isPostLocaleComplete`. Risultato verificato via HTTP reale
(dev server, porta 3919): sv/da renderizzavano il modulo in inglese su
entrambi i post, senza alcun marcatore "(EN)" (quel marcatore esiste solo
per `secondaryHref`), dentro pagine altrimenti completamente tradotte e
correttamente indicizzabili (200, canonical corretto, hreflang reciproco,
presenti in sitemap.xml).

**Fix**: aggiunte traduzioni sv/da reali (non segnaposto) a title/body/
benefits/secondaryLabel di entrambi i blocchi CTA.

**Negative test reale**:
1. Rimosse le righe `sv:`/`da:` dal campo `title` del blocco CTA di
   `health-connect-not-syncing.ts` (uniche righe modificate).
2. `npx tsx tools/check-p19a-funnel-module.ts` → FAIL, 2 errori
   `[cta-locale-gap]` (sv, da), messaggio corretto.
3. File ripristinato dal backup pre-modifica — MD5 identico
   (`3bfa059e2ee78b2eafc4f4a70a9b1e94`) prima e dopo.
4. Guardrail rieseguito → PASS (16/16 controlli).

## Check 12 — unicità intra-pagina di `data-cta-id` (`cta-id-collision`)

**Motivazione**: `OutboundTracker.tsx` deduplica `cta_view` per
`data-cta-id` scoperto nell'ambito di una page-view. Se due elementi
semanticamente diversi sulla STESSA pagina calcolassero lo stesso
`data-cta-id`, verrebbero trattati come un'unica CTA — la seconda non
genererebbe mai una propria impression. Verificato staticamente (stessa
derivazione di BlogRenderer.tsx: `storeButtonsCtaId(placement)` per la CTA
primaria, `` `${placement}__secondary__${contentCluster}` `` per il link
secondario, `ctaId` diretto per il tipo `"cta"` legacy quando presente) su
tutti i 65 post: zero collisioni reali. Le due proprietà che lo garantiscono
oggi: (a) `storeButtonsCtaId` dipende solo da `placement`, e il guardrail
check 1 vieta già due blocchi `fitmesh-editorial-cta` con lo stesso
placement nello stesso post; (b) le due famiglie di placement
(`sync_provider_*` vs `blog_editorial_*`) vivono su famiglie di pagine
disgiunte. Il check 12 rende questa proprietà un invariante verificato ad
ogni run, non solo una conseguenza accidentale delle regole attuali.

**Unicità "per pathname"**: già garantita a runtime dalla struttura
esistente di `viewedThisPageView` in `OutboundTracker.tsx` (un `Set`
azzerato al cambio di `window.location.pathname`, testato dai test
"ADDENDUM P1.9 — contratto cta_view" in `OutboundTracker.test.tsx`) — un
`data-cta-id` deve essere unico solo ALL'INTERNO di una pagina, non
sito-wide; il check 12 verifica esattamente questo ambito (per singolo
post), non una chiave composta a runtime (ridondante data la garanzia
statica già più forte: un id duplicato sulla stessa pagina è un bug nella
sorgente dati, non qualcosa che una chiave diversa nel tracker potrebbe
"risolvere" — dovrebbe comunque trattare i due elementi come la stessa CTA
se condividono davvero lo stesso identificatore).

**Negative test reale**:
1. Iniettato temporaneamente un blocco `type: "cta"` con
   `ctaId: "store_buttons_blog_editorial_article_end"` (uguale all'id che
   la CTA primaria `fitmesh-editorial-cta` dello stesso post calcola per
   `placement="article_end"`) in testa al `body` di
   `health-connect-not-syncing.ts`.
2. `npx tsx tools/check-p19a-funnel-module.ts` → FAIL, 1 errore
   `[cta-id-collision]`, che nomina correttamente entrambe le fonti in
   conflitto.
3. Blocco rimosso, file ripristinato — MD5 identico
   (`3bfa059e2ee78b2eafc4f4a70a9b1e94`) prima e dopo.
4. Guardrail rieseguito → PASS (16/16 controlli).
