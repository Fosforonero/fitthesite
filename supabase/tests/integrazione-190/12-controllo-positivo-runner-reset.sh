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
# Quattro rami, perche' un runner puo' dare un falso verde in quattro modi:
#   A) una migration invalida in mezzo alla catena  -> deve uscire non zero
#      e deve CONTARE bene: 2 applicate, 1 fallita, non 0 e non tutte.
#   B) la catena vera                                -> deve uscire zero.
#   C) docker irraggiungibile                        -> deve uscire non zero.
#      E' il caso che il 25/08 ha smascherato la vecchia logica: con Colima
#      fermo rispondeva «113 applicate, 0 fallite» e uscita 0, senza aver
#      eseguito una riga di SQL.
#   D) il container dei test assente                 -> esegui-test.sh deve
#      uscire non zero invece di dichiarare sette file verdi sul nulla.
#
# C e D provano la stessa cosa da due lati: che il verde dipenda da un
# database realmente raggiungibile e non dall'assenza di righe di errore.
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

# ---------------------------------------------------------------------------
# C) docker irraggiungibile -> il runner del reset deve uscire NON zero
#
# Si sposta DOCKER_HOST su un socket che non esiste. Non si ferma Colima e non
# si tocca nessun container vero: il resto della macchina continua a lavorare.
# ---------------------------------------------------------------------------
echo
echo "=== C) runner del reset con docker irraggiungibile ==="
OUTC="$(mktemp)"
DOCKER_HOST="unix:///tmp/socket-che-non-esiste-$$.sock" \
  CONT_NAME="pg17-190-sonda-c" ESITO_FILE="$(mktemp)" \
  "$RUNNER" > "$OUTC" 2>&1
codice_c=$?
sed 's/^/    /' "$OUTC" | head -4
echo "    uscita del runner: $codice_c"
if [ "$codice_c" -eq 0 ]; then
  echo "  ROSSO: il runner ha risposto 0 senza poter parlare con docker."
  echo "         E' esattamente il falso verde del 25/08: un riepilogo di migration"
  echo "         applicate senza che nessuna sia stata applicata."
  esito=1
else
  echo "  verde: senza docker il runner esce $codice_c e non conta niente."
fi
# e non deve aver stampato un riepilogo di successo
if grep -qE '^=== [0-9]+ applicate, 0 fallite ===' "$OUTC"; then
  echo "  ROSSO: ha comunque stampato un riepilogo di sole applicate."
  esito=1
else
  echo "  verde: nessun riepilogo di sole applicate."
fi
rm -f "$OUTC"

# ---------------------------------------------------------------------------
# D) container dei test assente -> esegui-test.sh deve uscire NON zero
# ---------------------------------------------------------------------------
echo
echo "=== D) runner dei test su un container che non esiste ==="
TESTRUNNER="$QUI/../reset-pg17/esegui-test.sh"
if [ ! -x "$TESTRUNNER" ]; then
  echo "  ROSSO: $TESTRUNNER non e' eseguibile."
  esito=1
else
  OUTD="$(mktemp)"
  CONT_NAME="pg17-container-inesistente-$$" "$TESTRUNNER" > "$OUTD" 2>&1
  codice_d=$?
  sed 's/^/    /' "$OUTD" | head -4
  echo "    uscita del runner dei test: $codice_d"
  if [ "$codice_d" -eq 0 ]; then
    echo "  ROSSO: la suite si e' dichiarata eseguita senza un database."
    esito=1
  else
    echo "  verde: senza container la suite esce $codice_d."
  fi
  if grep -qE 'file verdi' "$OUTD"; then
    echo "  ROSSO: ha comunque stampato un conteggio di file verdi."
    esito=1
  else
    echo "  verde: nessun conteggio di file verdi."
  fi
  rm -f "$OUTD"
fi

echo
[ "$esito" -eq 0 ] && echo "ESITO: verde" || echo "ESITO: rosso"
exit "$esito"
