#!/usr/bin/env bash
# ============================================================================
# GATE DI RELEASE DELLA SUITE (INFRA-5B) — zero skip ambientali.
#
# `pnpm test` in locale puo' saltare i sei test contro il database: non c'e'
# sempre un PG17 sottomano, e il salto viene dichiarato. Va bene per lavorare.
#
# Non va bene per un cancello di rilascio. Li' uno skip ambientale significa
# che sei test NON sono stati eseguiti, e «suite verde» diventa una frase su
# qualcosa che non e' successo. Quindi qui il bersaglio non e' facoltativo: o
# arriva dall'ambiente, o viene COSTRUITO, e in entrambi i casi deve
# dimostrare di essere l'ambiente isolato della release — PG17 e sentinella.
#
# Al termine il database isolato viene distrutto e la distruzione verificata.
#
#   bash tools/gate-release-suite.sh
#   bash tools/gate-release-suite.sh --controllo-positivo
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")/.." && pwd)"
cd "$QUI" || exit 1

CONT_DEFAULT="pg17-190-reset"
DB_DEFAULT="ricostruzione"
esito=0
ok()    { echo "  ok     $*"; }
rosso() { echo "  ROSSO  $*"; esito=1; }
passo() { printf "\n== %s ==\n" "$1"; }

# ── controllo positivo ──────────────────────────────────────────────────────
# Due prove: senza bersaglio il gate deve essere rosso, e con un bersaglio
# VIETATO (il container condiviso) deve rifiutarsi prima di toccare qualsiasi
# cosa. Un cancello di cui non si e' mai visto il rosso e' una decorazione.
if [ "${1:-}" = "--controllo-positivo" ]; then
  echo "== controllo positivo del gate di release =="

  echo "-- 1) nessun bersaglio dichiarato"
  ( unset SUPABASE_DB_CONTAINER SUPABASE_DB_NAME
    npx tsx tools/check-perimetro-suite.ts --release ) > /tmp/gr-cp1.txt 2>&1
  c=$?
  if [ "$c" -eq 0 ]; then
    echo "  ROSSO  senza bersaglio il gate esce 0: non sta misurando."; exit 1
  fi
  if ! grep -q "modalita' release senza bersaglio" /tmp/gr-cp1.txt; then
    echo "  ROSSO  e' rosso, ma non per la mancanza del bersaglio:"; tail -5 /tmp/gr-cp1.txt | sed 's/^/         /'; exit 1
  fi
  grep -q "skip AMBIENTALI" /tmp/gr-cp1.txt \
    && echo "  ok     senza bersaglio: rosso per bersaglio mancante E per skip ambientali" \
    || echo "  ok     senza bersaglio: rosso per bersaglio mancante"

  echo "-- 2) bersaglio VIETATO (il container condiviso)"
  ( export SUPABASE_DB_CONTAINER=supabase_db_fitmesh SUPABASE_DB_NAME=postgres
    npx tsx tools/check-perimetro-suite.ts --release ) > /tmp/gr-cp2.txt 2>&1
  c=$?
  if [ "$c" -eq 0 ]; then
    echo "  ROSSO  col container condiviso il gate esce 0."; exit 1
  fi
  if grep -q "bersaglio non isolato" /tmp/gr-cp2.txt; then
    ok "il container condiviso viene rifiutato per nome"
  else
    echo "  ROSSO  e' rosso, ma non per il bersaglio vietato:"; tail -5 /tmp/gr-cp2.txt | sed 's/^/         /'; exit 1
  fi

  echo "-- 3) la guardia sulla sentinella rifiuta un PG17 senza sentinella"
  docker rm -f zz-pg17-senza-sentinella >/dev/null 2>&1
  if docker run -d --name zz-pg17-senza-sentinella -e POSTGRES_PASSWORD=x -e POSTGRES_DB=nuda postgres:17 >/dev/null 2>&1; then
    for _ in $(seq 1 60); do
      docker exec zz-pg17-senza-sentinella psql -U postgres -d nuda -tAc "select 1" >/dev/null 2>&1 && break
      sleep 1
    done
    ( export SUPABASE_DB_CONTAINER=zz-pg17-senza-sentinella SUPABASE_DB_NAME=nuda
      source supabase/tests/bersaglio.sh ) > /tmp/gr-cp3.txt 2>&1
    c=$?
    docker rm -f zz-pg17-senza-sentinella >/dev/null 2>&1
    if [ "$c" -eq 0 ]; then
      echo "  ROSSO  un PG17 senza sentinella e' stato accettato."; exit 1
    fi
    ok "un PG17 senza sentinella viene rifiutato (uscita $c)"
  else
    echo "  ROSSO  non e' stato possibile creare il container di prova."; exit 1
  fi

  echo "-- 4) un workflow che OMETTE il gate deve far diventare rosso il guardrail"
  WF=".github/workflows/backend-suite.yml"
  if [ ! -f "$WF" ]; then
    echo "  ROSSO  $WF non esiste: non posso provare l'omissione."; exit 1
  fi
  cp "$WF" /tmp/gr-wf.bak
  # Si toglie DAVVERO la riga che invoca il gate, invece di fidarsi.
  perl -pi -e 's{^(\s*)run: bash tools/gate-release-suite\.sh.*$}{$1run: echo "gate rimosso dalla sonda"}' "$WF"
  if grep -q "gate-release-suite.sh --costruisci" "$WF"; then
    cp /tmp/gr-wf.bak "$WF"
    echo "  ROSSO  la mutazione non ha tolto la riga: la sonda non prova niente."; exit 1
  fi
  npx vitest run test/ci-backend.test.ts > /tmp/gr-cp4.txt 2>&1
  c=$?
  cp /tmp/gr-wf.bak "$WF"; rm -f /tmp/gr-wf.bak
  if [ "$c" -eq 0 ]; then
    echo "  ROSSO  col gate tolto dal workflow il guardrail resta verde: non misura."; exit 1
  fi
  ok "senza il gate nel workflow, test/ci-backend.test.ts diventa rosso (uscita $c)"
  npx vitest run test/ci-backend.test.ts > /tmp/gr-cp4b.txt 2>&1
  if [ $? -ne 0 ]; then
    echo "  ROSSO  dopo il ripristino il guardrail non torna verde."; tail -5 /tmp/gr-cp4b.txt | sed 's/^/         /'; exit 1
  fi
  ok "ripristinato il workflow, il guardrail torna verde"

  echo
  echo "VERDE: il gate di release sa dire di no a un bersaglio mancante, vietato o"
  echo "       non isolato, e il guardrail si accorge di un workflow senza gate."
  exit 0
fi
FORZA_COSTRUZIONE=""
case "${1:-}" in
  --costruisci) FORZA_COSTRUZIONE=1 ;;
  "") : ;;
  *) echo "uso: $0 [--costruisci] [--controllo-positivo]"; exit 2 ;;
esac

# ── il bersaglio: ricevuto o costruito, mai dedotto ─────────────────────────
#
# In CI il bersaglio e' dichiarato nell'ambiente MA va costruito qui dentro:
# `--costruisci` dice «i nomi me li dai tu, il database lo faccio io» — e chi
# lo fa lo distrugge. Senza il flag, un bersaglio ricevuto si assume gia'
# pronto e resta in carico a chi l'ha creato.
COSTRUITO=""
if [ -n "${SUPABASE_DB_CONTAINER:-}" ] && [ -n "${SUPABASE_DB_NAME:-}" ] && [ -z "$FORZA_COSTRUZIONE" ]; then
  passo "bersaglio RICEVUTO dall'ambiente"
  echo "  container=${SUPABASE_DB_CONTAINER} database=${SUPABASE_DB_NAME}"
else
  passo "bersaglio COSTRUITO: PG17 usa-e-getta + catena delle migration + sentinella"
  export CONT_NAME="${SUPABASE_DB_CONTAINER:-$CONT_DEFAULT}"
  bash supabase/tests/reset-pg17/esegui-reset.sh > /tmp/gr-reset.txt 2>&1
  c=$?
  grep -E 'applicate|sentinella' /tmp/gr-reset.txt | tail -2 | sed 's/^/  /'
  if [ "$c" -ne 0 ]; then
    echo "  ROSSO  ricostruzione fallita (uscita $c). Il resto non ha senso."
    tail -5 /tmp/gr-reset.txt | sed 's/^/         /'
    exit 1
  fi
  export SUPABASE_DB_CONTAINER="$CONT_NAME"
  export SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-$DB_DEFAULT}"
  COSTRUITO=1
  ok "ricostruito su ${SUPABASE_DB_CONTAINER}/${SUPABASE_DB_NAME}"
fi

# ── la guardia: PG17, nomi vietati, sentinella ──────────────────────────────
passo "guardia sul bersaglio"
# L'esito PRIMA della pipe: con `| sed` si leggerebbe il codice di sed, che
# riesce sempre. E' l'errore che questo repository ha gia' fatto quattro volte.
( source supabase/tests/bersaglio.sh ) > /tmp/gr-guardia.txt 2>&1
guardia=$?
sed 's/^/  /' /tmp/gr-guardia.txt
if [ "$guardia" -ne 0 ]; then
  echo "  ROSSO  bersaglio rifiutato dalla guardia (uscita $guardia)."
  exit 1
fi
ok "bersaglio accettato: PG17 isolato con sentinella"

# ── la suite, in modalita' release ──────────────────────────────────────────
passo "suite completa, modalita' release (zero skip ambientali)"
npx tsx tools/check-perimetro-suite.ts --release
[ $? -ne 0 ] && esito=1
# (nessuna pipe qui sopra, di proposito: l'esito e' quello del gate)

# ── distruzione verificata ──────────────────────────────────────────────────
passo "distruzione del database isolato"
if [ -z "$COSTRUITO" ]; then
  echo "  saltata: il bersaglio e' stato ricevuto, lo distrugge chi l'ha creato"
else
  if docker exec "$SUPABASE_DB_CONTAINER" psql -U postgres -d postgres -q \
       -c "drop database if exists ${SUPABASE_DB_NAME};" >/dev/null 2>&1; then
    ancora="$(docker exec "$SUPABASE_DB_CONTAINER" psql -U postgres -d postgres -X -tAc \
      "select count(*) from pg_database where datname = '${SUPABASE_DB_NAME}'" 2>/dev/null)"
    if [ "$ancora" = "0" ]; then
      ok "«${SUPABASE_DB_NAME}» distrutto e verificato assente"
    else
      rosso "«${SUPABASE_DB_NAME}» esiste ancora dopo la drop"
    fi
  else
    rosso "drop del database isolato fallita"
  fi
fi

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: il gate di release non e' verde."; exit 1; }
echo "VERDE: tutti i test previsti eseguiti davvero, zero skip ambientali, database"
echo "       isolato distrutto. Il conteggio esatto e' nel referto del gate qui sopra:"
echo "       non lo ripeto a mano, un numero scritto due volte prima o poi diverge."
echo
echo "       Nota: viene distrutto il DATABASE, non il container. In CI il container"
echo "       effimero e' rimosso dal passo di pulizia con if: always(); in locale"
echo "       resta in piedi e la prossima ricostruzione lo ricrea da zero."
