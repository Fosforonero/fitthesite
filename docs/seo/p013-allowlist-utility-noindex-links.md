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
| `app/(frontend)/[locale]/(marketing)/about/page.tsx` | `/${lc}/self-host` (locale corrente) | Stessa disclosure di trasparenza, versione localizzata nella pagina About. |
| `app/(frontend)/[locale]/auth/login/page.tsx` | `/${lc}/auth/forgot-password` | Recupero password: link funzionale imprescindibile del flusso di login. `/auth/*` è bloccato anche a livello crawler da `Disallow: /auth/` in `app/robots.ts` — doppia protezione, zero rischio crawl budget. |
| `app/(frontend)/[locale]/auth/forgot-password/ForgotPasswordForm.tsx` | `/${locale}/auth/reset-password` | Continuazione dello stesso flusso di recupero password. |
| `app/(frontend)/[locale]/auth/reset-password/ResetPasswordForm.tsx` | `/${locale}/auth/forgot-password` | Link di ritorno per richiedere un nuovo token se quello corrente è scaduto/invalido. |
| `app/(frontend)/[locale]/admin/layout.tsx` | `/${lc}/admin/beta` | Nav interna del backoffice admin, non customer-facing; `/admin/*` non è mai un target di navigazione marketing. |

## Residuo noto, NON in allowlist (richiede decisione di prodotto — vedi report P0.13)

`lib/blog/posts/fitmesh-sync-disponibile-google-play.ts` contiene un callout
in-content che linka `/{locale}/beta` in 11 lingue (contenuto editoriale
pubblicato, non un componente di navigazione). Non è stato aggiunto
all'allowlist perché non è un caso "utility noindex necessario" — è un CTA
editoriale che ha smesso di avere senso ora che il programma Founder è
chiuso e `/beta` non ha più form/CTA. Correggerlo richiede riscrivere una
frase pubblicata in 11 lingue, il che è fuori dal perimetro tecnico di questo
sprint (P0.13 non crea né modifica traduzioni di contenuto editoriale) ed è
esplicitamente una decisione di prodotto (cosa dire ora al posto del CTA
Founder), non una fix di crawl hygiene. Il guardrail lo rileva come
violazione nota e documentata, non silenziata.
