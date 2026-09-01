#!/usr/bin/env bash
# ============================================================================
# Controlli positivi sulla guardia del bersaglio.
#
# Una guardia che non si e' mai vista rifiutare non e' una guardia. Qui si
# provano i tre modi in cui deve dire di no, e il modo in cui deve dire di si'.
# Nessuna prova tocca il container condiviso: si verifica che la guardia si
# fermi PRIMA di connettersi.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
GUARDIA="$(cd "$QUI/.." && pwd)/bersaglio.sh"
[ -f "$GUARDIA" ] || { echo "ROSSO: guardia assente: $GUARDIA"; exit 1; }

esito=0
prova() {
  local nome="$1" atteso="$2"; shift 2
  local out codice
  out="$(env "$@" bash -c "source '$GUARDIA'" 2>&1)"; codice=$?
  if [ "$atteso" = "rifiuta" ]; then
    if [ "$codice" -eq 0 ]; then
      echo "  ROSSO  $nome: la guardia ha ACCETTATO (exit 0)"; printf '%s\n' "$out" | sed 's/^/         | /'; esito=1
    else
      echo "  ok     $nome: rifiutato (exit $codice)"
      printf '%s\n' "$out" | head -1 | sed 's/^/         | /'
    fi
  else
    if [ "$codice" -ne 0 ]; then
      echo "  ROSSO  $nome: la guardia ha RIFIUTATO il bersaglio buono (exit $codice)"; printf '%s\n' "$out" | head -2 | sed 's/^/         | /'; esito=1
    else
      echo "  ok     $nome: accettato"
      printf '%s\n' "$out" | tail -1 | sed 's/^/         | /'
    fi
  fi
}

echo "== controlli positivi sulla guardia del bersaglio =="

prova "variabili mancanti"        rifiuta -u SUPABASE_DB_CONTAINER -u SUPABASE_DB_NAME
prova "solo il container"         rifiuta -u SUPABASE_DB_NAME SUPABASE_DB_CONTAINER=pg17-190-reset
prova "container condiviso"       rifiuta SUPABASE_DB_CONTAINER=supabase_db_fitmesh SUPABASE_DB_NAME=postgres
prova "nome che dice produzione"  rifiuta SUPABASE_DB_CONTAINER=qualcosa_production SUPABASE_DB_NAME=postgres

# Sentinella assente: un database vero, PG17, nome innocuo, ma senza la
# sentinella. Deve essere rifiutato lo stesso: il nome non e' una prova.
CID_OK="${SUPABASE_DB_CONTAINER:-pg17-190-reset}"
if docker exec "$CID_OK" psql -U postgres -d postgres -tAc "select 1" >/dev/null 2>&1; then
  docker exec "$CID_OK" psql -U postgres -d postgres -q \
    -c "drop database if exists senza_sentinella;" -c "create database senza_sentinella;" >/dev/null 2>&1
  prova "sentinella assente"      rifiuta SUPABASE_DB_CONTAINER="$CID_OK" SUPABASE_DB_NAME=senza_sentinella
  docker exec "$CID_OK" psql -U postgres -d postgres -q -c "drop database if exists senza_sentinella;" >/dev/null 2>&1
else
  echo "  ROSSO  sentinella assente: non ho potuto creare il database di prova su «$CID_OK»"
  esito=1
fi

# E il bersaglio buono deve passare: una guardia che rifiuta tutto e' inutile
# quanto una che accetta tutto.
prova "bersaglio della release"   accetta SUPABASE_DB_CONTAINER="${SUPABASE_DB_CONTAINER:-pg17-190-reset}" SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-ricostruzione}"

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: la guardia non si comporta come deve."; exit 1; }
echo "VERDE: la guardia rifiuta i quattro bersagli sbagliati e accetta quello giusto."
