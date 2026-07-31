#!/usr/bin/env bash
#
# Gate completo Sprint P0.10K — "GO IMMEDIATE SITE FOUNDER SUNSET".
#
# Provenienza: questo file era `tools/.gate-p10k-pass1.sh`, un dotfile
# untracked lasciato da una sessione precedente. E' effettivamente lo script
# che orchestra il gate, quindi in FASE 9 e' stato rinominato in chiaro
# (`tools/gate-p10k.sh`): un gate nascosto e' un gate che nessuno esegue.
# Il suffisso "pass1" e' caduto — non c'e' un pass2, e' LA sequenza.
#
# Uso (dalla root del repo, dentro il container node:22):
#   docker run --rm -v "$PWD":/app -w /app node:22 bash tools/gate-p10k.sh
#
# Ogni riga `run` e' indipendente: lo script NON si ferma al primo errore,
# esegue tutto e riporta il totale dei fallimenti (exit code = numero di
# check falliti). Serve la fotografia completa, non il primo intoppo.
set -uo pipefail
cd /app
FAIL=0
run(){ echo "== $1 =="; shift; if "$@"; then echo "PASS"; else echo "FAIL"; FAIL=$((FAIL+1)); fi; }
corepack enable >/dev/null 2>&1 || true

run "install" pnpm install --frozen-lockfile
run "tsc" pnpm exec tsc --noEmit
run "vitest (full)" pnpm exec vitest run
run "blog integrity" pnpm exec tsx tools/check-blog-integrity.ts
run "seo:truth-check" pnpm run seo:truth-check

# ── Guardrail Founder ────────────────────────────────────────────────────
run "founder:window-check" pnpm run founder:window-check
run "founder:backend-check" pnpm run founder:backend-check
run "founder:migration-identity-check" pnpm run founder:migration-identity-check
run "founder:static-invariant-check" pnpm run founder:static-invariant-check
run "founder:commercial-truth-check" pnpm run founder:commercial-truth-check
# FASE 9 — "zero superfici pubbliche di acquisizione Founder": scansione
# strutturale sito-wide, .json di overlay inclusi (nordic/es), 15 locale.
# E' l'unico check che copre le classi a..g del mandato; va sempre dopo
# commercial-truth (che resta la difesa sulle 5 superfici note) e prima del
# build, perche' e' statico e costa secondi.
run "founder:acquisition-surfaces-check" pnpm run founder:acquisition-surfaces-check
run "founder:metadata-invariant-check" pnpm run founder:metadata-invariant-check
run "founder:counter-check" pnpm run founder:counter-check
run "post-founder:pricing-check" pnpm run post-founder:pricing-check

run "blog:locale-near-miss-check" pnpm run blog:locale-near-miss-check
run "build" pnpm run build
run "vercel:fluid-check" pnpm run vercel:fluid-check

# NON incluso deliberatamente: `founder:cutoff-render-check`. Non e' un check
# statico — pilota Chromium via Playwright contro il sito servito, quindi
# richiede `npx playwright install` e un server in ascolto. Nel container
# node:22 nudo fallisce con "Executable doesn't exist" a prescindere dallo
# stato del sito, cioe' produrrebbe un FAIL che non dice nulla sul codice.
# Va eseguito a parte, in un ambiente con i browser installati.

echo "FAILURES=$FAIL"
exit $FAIL
