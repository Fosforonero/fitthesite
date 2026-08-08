# SPRINT P0.13 — Allowlist link verso utility noindex

Fonte di verità per il guardrail `tools/check-p013-crawl-hygiene.ts` (regola
FASE 5.3: "una pagina marketing indicizzabile linka noindex/redirect/404
senza allowlist motivata" deve fallire). Ogni riga qui sotto è un link
**intenzionale e necessario** da una pagina indicizzabile verso una pagina
`noindex` — categoria A della FASE 1 ("link necessari verso utility
noindex"), non un difetto da correggere.

Non è una lista per silenziare violazioni: ogni voce nuova richiede una
motivazione concreta (non solo "serve"), altrimenti il guardrail la rifiuta
(FASE 5.5).

| Sorgente | Target noindex | Motivazione |
|---|---|---|
| `app/(frontend)/[locale]/(marketing)/privacy/page.tsx` (tutte le locale) | `/it/self-host`, `/en/self-host` (hardcoded) | Disclosure di trasparenza sul backend self-host nella privacy policy stessa — deve restare raggiungibile per chi legge la policy, indipendentemente dalla propria lingua; `/self-host` è `noindex,follow` per design (feature non pubblicamente disponibile, F3 non pronto — vedi `selfhost-f1-review-blocker` in memoria progetto), quindi il link è "follow" e non pesa sul crawl budget in modo dannoso. |
| `app/(frontend)/[locale]/(marketing)/about/page.tsx` | `/it/self-host`, `/en/self-host` (via `resolveSelfHostLocale(lc)`) | Stessa disclosure di trasparenza, versione localizzata nella pagina About. MICRO-GATE P0.13B (2026-08-08): prima era `/${lc}/self-host` incondizionato — per le 13 locale senza pagina self-host reale (tutte tranne it/en) l'href generava un redirect interno evitabile verso `/en/self-host`, mascherato da link diretto perché l'allowlist usava un pattern troppo ampio (`/^\/[a-z]{2}\/self-host$/`). Ora l'href è calcolato in anticipo con la stessa funzione che usa `self-host/page.tsx` per il redirect — zero hop, sempre 200 diretto. |
| `app/(frontend)/[locale]/auth/login/page.tsx` | `/${lc}/auth/forgot-password` | Recupero password: link funzionale imprescindibile del flusso di login. `/auth/*` è bloccato anche a livello crawler da `Disallow: /auth/` in `app/robots.ts` — doppia protezione, zero rischio crawl budget. |
| `app/(frontend)/[locale]/auth/forgot-password/ForgotPasswordForm.tsx` | `/${locale}/auth/reset-password` | Continuazione dello stesso flusso di recupero password. |
| `app/(frontend)/[locale]/auth/reset-password/ResetPasswordForm.tsx` | `/${locale}/auth/forgot-password` | Link di ritorno per richiedere un nuovo token se quello corrente è scaduto/invalido. |
| `app/(frontend)/[locale]/admin/layout.tsx` | `/${lc}/admin/beta` | Nav interna del backoffice admin, non customer-facing; `/admin/*` non è mai un target di navigazione marketing. |
| `lib/blog/posts/fitmesh-sync-disponibile-google-play.ts` (11 lingue) | `/${lc}/beta` | Riferimento storico genuino, non promozionale: la frase è narrata al **passato** ("i primi 1000 **hanno ricevuto** il Pro a vita", non un invito ad agire) e spiega ai lettori cosa fosse il programma Founder, rimandando alla pagina archivio per chi vuole i dettagli. `/beta` è deliberatamente `noindex,follow` da P0.10L-A (archivio storico, non più un funnel di iscrizione — nessun form/CTA residuo). Riclassificato da "residuo non allowlistato" ad allowlist esplicita in MICRO-GATE P0.13A dopo lettura diretta del testo pubblicato: non è un CTA Founder mascherato, è contenuto editoriale accurato che risponde a una domanda legittima del lettore ("esiste ancora questa offerta?"). Rimuoverlo o convertirlo in testo non cliccabile non guadagnerebbe crawl budget (il target è già noindex) e degraderebbe un percorso di lettura reale. |
