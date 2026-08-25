#!/usr/bin/env bash
# CONTROLLO POSITIVO del runner del reset.
#
# esegui-reset.sh dichiara «113 applicate, 0 fallite». Quella frase non vale
# niente finche' non si e' visto il runner dire il contrario quando deve.
#
# La versione precedente NON lo diceva mai: leggeva l'esito da
# `psql | grep | head`, quindi il codice di uscita di psql era quello di head,
# che riesce sempre; qualunque fallimento che non stampasse una riga iniziante
# per ERROR o FATAL passava per OK; e a fine corsa lo script usciva con 0
# anche con fallimenti contati. Tre modi indipendenti di dare un falso verde.
#
# Qui si punta il runner a una directory con dentro UNA migration
# deliberatamente invalida e si pretende un'uscita non zero. Poi lo si lascia
# correre sulla catena vera.
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
RUNNER="$QUI/../reset-pg17/esegui-reset.sh"
esito=0

if [ ! -x "$RUNNER" ]; then
  echo "ROSSO: $RUNNER non e' eseguibile."
  exit 1
fi

# ---------------------------------------------------------------------------
# A) directory scratch con una migration invalida -> uscita NON zero
# ---------------------------------------------------------------------------
SCRATCH="$(mktemp -d)"
cat > "$SCRATCH/20260101000000_valida.sql" <<'SQL'
create table if not exists public.prova_runner_valida (id integer);
SQL
cat > "$SCRATCH/20260101000001_invalida.sql" <<'SQL'
-- SQL deliberatamente invalido: la colonna non esiste e la sintassi e' rotta.
create table public.prova_runner_invalida (id integer) questo non e sql;
SQL
cat > "$SCRATCH/20260101000002_dopo.sql" <<'SQL'
create table if not exists public.prova_runner_dopo (id integer);
SQL

echo "=== A) runner su una catena con una migration invalida ==="
MIG_DIR="$SCRATCH" CONT_NAME="pg17-190-sonda" ESITO_FILE="$SCRATCH/esito.txt" \
  "$RUNNER" > "$SCRATCH/out.txt" 2>&1
codice_a=$?
grep -E "^(===|  KO)" "$SCRATCH/out.txt" | sed 's/^/    /'
echo "    uscita del runner: $codice_a"

if [ "$codice_a" -eq 0 ]; then
  echo "  ROSSO: il runner ha risposto 0 su una catena che contiene una migration"
  echo "         invalida. Il verde della catena vera non prova niente."
  esito=1
else
  echo "  verde: il runner sa fallire (uscita $codice_a)."
fi

# e deve aver contato ESATTAMENTE una fallita, non zero e non tutte
if grep -qE "^=== 2 applicate, 1 fallite ===" "$SCRATCH/esito.txt" 2>/dev/null \
   || grep -qE "2 applicate, 1 fallite" "$SCRATCH/out.txt"; then
  echo "  verde: ha contato 2 applicate e 1 fallita, cioe' ha isolato il file rotto."
else
  echo "  ROSSO: il conteggio non e' 2 applicate / 1 fallita. Il runner sbaglia a"
  echo "         attribuire il fallimento."
  esito=1
fi

docker rm -f pg17-190-sonda >/dev/null 2>&1
rm -rf "$SCRATCH"

# ---------------------------------------------------------------------------
# B) la catena vera -> uscita zero, e tutte applicate
# ---------------------------------------------------------------------------
echo
echo "=== B) runner sulla catena vera ==="
OUT="$(mktemp)"
"$RUNNER" > "$OUT" 2>&1
codice_b=$?
grep -E "^===" "$OUT" | sed 's/^/    /'
echo "    uscita del runner: $codice_b"

if [ "$codice_b" -ne 0 ]; then
  echo "  ROSSO: la catena vera non si applica (uscita $codice_b)."
  grep -E "^  KO" "$OUT" | head -5 | sed 's/^/    /'
  esito=1
else
  echo "  verde: la catena vera si applica, uscita 0."
fi
rm -f "$OUT"

echo
[ "$esito" -eq 0 ] && echo "ESITO: verde" || echo "ESITO: rosso"
exit "$esito"
