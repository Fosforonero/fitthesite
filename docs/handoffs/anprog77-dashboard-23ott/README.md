# Handoff dashboard G-04 per anprog77 (23/10/2026)

Destinatari: anprog77 e i suoi agenti Claude. Mittente: Matteo Pizzi (corsia editoriale e integrazione finale).

Questo ramo contiene la dashboard web locale del 21/10 e un pacchetto di documenti per lavorare sul
primo lotto, **G-04** (il contatore «Giorni con dati negli ultimi 30 giorni» e la finestra di 30 giorni).
**Non è una release, non è una PR, non attiva nulla.**

Repository: `github.com/Fosforonero/fitthesite` (pubblico). Ramo: `handoff/anprog77-dashboard-23ott`.

## 1. Regole dell'handoff

- Nessuna PR verso `main`, nessun merge, nessun deploy, nessuna attivazione della dashboard.
  Se serve una di queste azioni, serve un GO esplicito di Matteo.
- Nessuna migration SQL e nessuna scrittura su un Supabase vero. G-04 non tocca SQL.
- Non riscrivere la storia di questo ramo (niente force push, niente rebase di questo ramo). Lavora su un
  ramo derivato e consegna a Matteo, che integra (vedi sezione 7).
- Dal 23/10 i file elencati in `02-SPECIFICA-G04.md` (sezione 6, «File riservati a G-04») sono riservati
  a G-04: nessun altro writer. Le altre modifiche alla dashboard richiedono prima una divisione esplicita dei file.
- Nel pacchetto non ci sono segreti, credenziali, `.env`, cookie, log o dati personali, e non devono
  entrarne. I dati di prova sono sintetici (indirizzi `*.invalid`, UUID inventati). Se trovi qualcosa che
  sembra un dato reale o un segreto, fermati e segnalalo a Matteo senza copiarlo altrove.

## 2. La base

| Campo | Valore |
|---|---|
| SHA completo della base | `42b811e7d990a860d7f2a4cdc38e01c74618a2b8` |
| Messaggio | `merge(dashboard) main 2ba1a371 (lotto editoriale 21/10) su bdd41ce9: solo integrazione locale` |
| Data del commit | 21/10/2026 |
| Che cos'è | dashboard locale `bdd41ce9` fusa con `main` `2ba1a371` (#111). Non è il candidato editoriale. |
| Originali preservati | `claude/dashboard-su-main-21ott` e `claude/dashboard-g04-dst-22ott` restano a `42b811e7`, intatti, solo locali |
| Questo ramo | base + **un solo commit di sola documentazione** (6 file) sotto `docs/handoffs/anprog77-dashboard-23ott/` |

Per verificare che il commit di handoff non tocchi codice:
`git diff --stat 42b811e7d990a860d7f2a4cdc38e01c74618a2b8 origin/handoff/anprog77-dashboard-23ott`
deve elencare solo i 6 file sotto `docs/handoffs/anprog77-dashboard-23ott/`. (Usa il ramo remoto, non `HEAD`:
dopo i tuoi commit `HEAD` non è più il ramo di handoff.)

### Rapporto con `origin/main` (letto il 23/10 dopo un `git fetch`)

- `origin/main` è `23c6fdf2a02fae46559fbd7f729fe40e845541c7`. La base è **5 commit indietro**:
  #112, #115, #117, #118, #119 (pricing, feature-status, guida di stile, export, cancellazione).
- Nessuno di quei 5 commit tocca file di dashboard (`git log 42b811e7..origin/main --name-only`).
- Un conflitto di merge atteso: `tools/perimetro-suite.conf` (contatori della suite). Lo risolve Matteo in
  integrazione.
- Rispetto a `origin/main` la base aggiunge 130 commit. Di questi, 68 erano già su rami remoti
  (`origin/feat/web-dashboard-l1-microgate-grafici-r3-14ott` e `origin/feat/web-dashboard-l1-cancello`, quest'ultimo
  è la PR Draft #98, aperta e non fusa) e 62 non erano su nessun ref remoto: questo push li pubblica.
- I 130 commit sono prevalentemente lavoro dashboard (componenti, librerie, test, prototipo, migration non applicate,
  rollback SQL, strumenti di gate). Includono anche modifiche a codice condiviso di autenticazione e sessione
  (`app/(frontend)/[locale]/auth/**`, `lib/auth/safe-next.ts`, `lib/supabase/server.ts`, il layout `app/…/app/layout.tsx`,
  `components/BackForwardGuard.tsx`). G-04 non deve toccarli.

## 3. Stato effettivo (quattro stati distinti)

| Stato | G-04 | Baseline `42b811e7` |
|---|---|---|
| Implementato | **No.** `lib/dashboard/giorni-riepilogo.ts` non esiste, `page.tsx` non è modificata. | La dashboard locale (130 commit) è nel ramo, come merge locale. |
| Verificato | **No.** I due test WIP non sono mai stati eseguiti (il mittente non aveva l'ambiente di esecuzione il 22/10). Nessun fail-prima/pass-dopo esiste. | Dichiarato dal mittente il 21/10; **non rieseguito il 23/10** (vedi sotto). |
| Rilasciato | No | No. Non è in `main`. Parte della storia è su rami remoti e nella PR Draft #98 (non fusa). |
| Live | No | No. Il cancello è chiuso nel codice di rilascio (`CAPABILITY_STATUS.webDashboard` = `in_development`). Cosa mostri il sito in produzione non è verificabile da questo ramo. |

Che cosa sappiamo della baseline, e da dove:

- I registri del mittente del 21/10 riportano per `42b811e7`: tsc exit 0, suite con 3371 test raccolti e 23 saltati,
  perimetro verde, `next build` exit 0, guardrail rossi uguali a quelli di `main`, 3 route dinamiche in più.
  Nel ramo c'è un solo riscontro: `tools/perimetro-suite.conf` (righe `file=167`, `test=3371`, `saltati=23`,
  con il commento «MISURATI sull'albero fuso»), scritto a mano dal mittente e non una prova indipendente.
  `test_release` nello stesso file vale `0` ed è provvisorio, non una misura.
- **PG17 non è stato rifatto** su questo SHA. Autenticazione reale, RLS reale, rollback e kill switch non
  sono provati su questo SHA. Al 20/10 le funzioni SQL del verdetto non risultavano in produzione.
- Le fonti di questi numeri (registri e mandato del mittente del 21-22/10, sonda del 16/10) **non sono nel
  repository**: trattale come dichiarazioni del mittente. **Non le ho rieseguite il 23/10** e non vanno
  lette come baseline riverificata. Il primo passo utile per te è rieseguirle e riportare l'esito vero.

## 4. Come lavorare in locale

Non servono segreti. I test usano doppioni (mock) di Supabase e dati sintetici. Docker non serve per G-04.

```bash
git fetch origin handoff/anprog77-dashboard-23ott
git switch -c <tuo-ramo> origin/handoff/anprog77-dashboard-23ott   # ramo derivato, non lavorare su handoff/*
# Node 22.23.2 (.nvmrc), pnpm 11.15.0 (packageManager in package.json):
#   nvm use && corepack enable && corepack prepare pnpm@11.15.0 --activate
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec vitest run lib/dashboard "app/(frontend)/[locale]/app/dashboard"   # test mirati
pnpm exec vitest run components/charts                                       # se tocchi lib/dashboard/finestra.ts
pnpm exec tsc --noEmit        # non c'è uno script "typecheck"
pnpm suite:perimetro-check    # lancia vitest e confronta i test raccolti con tools/perimetro-suite.conf
pnpm governance:check
```

Note:

- I filtri di `vitest run` sono sottostringhe del percorso, non glob; vanno fra virgolette per via di `(` e `[`.
- Il perimetro della suite è positivo e dichiarato in `vitest.config.ts`: un file di test nuovo è
  raccolto solo se sta sotto `app/`, `components/`, `lib/`, `test/` ecc. Aggiungere test cambia i contatori
  `file=` e `test=` di `tools/perimetro-suite.conf`: vedi `02-SPECIFICA-G04.md`, sezione 6.
- `FITMESH_WEB_DASHBOARD=1` serve ai test, che la impostano da soli. **Non avviare `next dev` o `next start` per G-04**:
  la pagina vera richiede una sessione Supabase e non esiste un backend di prova. Non creare né chiedere un `.env`,
  non puntare nessun URL di un Supabase vero.
- Il gate completo con PG17 (`tools/gate-release-suite.sh`) richiede Docker e non serve a G-04, che non tocca SQL.
- Un push su `handoff/**` non avvia workflow GitHub (letto dai blocchi `on:` di `.github/workflows`, non verificato
  sul sito), e `vercel.json` abilita il deploy solo per `main`. Una PR verso qualsiasi base avvierebbe `backend-suite`
  e `governance` se tocca i percorsi elencati nei workflow, e un ramo `integra/**` avvia la suite al push.

## 5. Indice del pacchetto

| File | Contenuto |
|---|---|
| `01-CONTRATTO-E-RIFERIMENTI.md` | contratto di accesso, cancelli, rimandi ai documenti di architettura già nel repository |
| `02-SPECIFICA-G04.md` | specifica G-04, limiti già individuati, file riservati, consegna attesa |
| `03-REALE-PROTOTIPO-SINTETICO.md` | che cosa è dashboard reale, che cosa prototipo, che cosa dati sintetici |
| `riferimento-wip/` | i due test WIP come testo (`.test.ts.txt`), NON eseguibili dalla suite, con l'impronta SHA-256 degli originali |

## 6. I due test WIP

Sono `riferimento-wip/giorni-riepilogo.test.ts.txt` e `riferimento-wip/page.giorni-riepilogo.test.tsx.txt`.
Sono materiale di riferimento: scritti il 22/10 senza poterli eseguire, mai committati nell'origine, copiati qui
**byte per byte** (le impronte SHA-256 sono in `02-SPECIFICA-G04.md`, sezione 5).

**Il primo ha un errore noto** (un array di 40 date dove ne servono 60, vedi la specifica, sezione 5): non
darlo per corretto. Per usarli, dalla radice del repository:

```bash
cp docs/handoffs/anprog77-dashboard-23ott/riferimento-wip/giorni-riepilogo.test.ts.txt \
   lib/dashboard/giorni-riepilogo.test.ts
cp docs/handoffs/anprog77-dashboard-23ott/riferimento-wip/page.giorni-riepilogo.test.tsx.txt \
   "app/(frontend)/[locale]/app/dashboard/page.giorni-riepilogo.test.tsx"
```

Poi implementa il modulo che presuppongono. Leggi i loro punti deboli (specifica, sezione 5) prima di fidarti di un verde.

## 7. Consegna

Il mittente non sa se hai diritti di scrittura sul repository. Due vie, in quest'ordine:

1. Se puoi pubblicare rami: solo un ramo con prefisso `anprog77/` (per esempio `anprog77/g04-giorni-riepilogo`),
   mai `main`, mai `handoff/*`, mai `integra/**` o `chore/**` (possono far partire la CI). Non aprire PR: avvisa Matteo.
2. Altrimenti: consegna una patch (`git format-patch 42b811e7d990a860d7f2a4cdc38e01c74618a2b8..HEAD`) o un `git bundle`
   a Matteo, fuori dal repository.

In entrambi i casi accompagna la consegna con il report descritto in `02-SPECIFICA-G04.md`, sezione 7.
