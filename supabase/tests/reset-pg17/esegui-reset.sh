#!/usr/bin/env bash
# Reset completo su un Postgres 17 usa-e-getta.
# NON tocca mai supabase_db_fitmesh, che e' il container condiviso.
#
# ============================================================================
# PERCHE' L'ESITO SI LEGGE DA $? E NON DALL'OUTPUT
# ============================================================================
# La versione precedente decideva cosi':
#
#   err=$(docker exec ... psql ... < "$f" 2>&1 | grep -E '^(ERROR|FATAL)' | head -3)
#   if [ -z "$err" ]; then ok=$((ok+1)); else ko=$((ko+1)); fi
#
# Tre modi di dare un falso verde, tutti reali:
#
#  1. il codice di uscita di psql finiva dentro una pipe. Con `pipefail` ma
#     senza `-e` nessuno lo guardava comunque: $? sarebbe stato quello di
#     `head`, che riesce sempre. Il verdetto dipendeva SOLO da cosa aveva
#     trovato grep.
#  2. qualunque fallimento che non stampi una riga che inizia per ERROR o
#     FATAL risultava OK. Un psql che non parte, un container morto, un file
#     illeggibile, un messaggio localizzato: tutti verdi.
#  3. dopo il riepilogo lo script usciva con 0 anche con ko > 0, quindi
#     nessun chiamante poteva accorgersene.
#
# Adesso: output in un file temporaneo, $? catturato SUBITO e da solo,
# formattazione soltanto dopo, e uscita non zero se qualcosa e' fallito.
# L'output serve a DIRE cosa e' andato storto, non a decidere se lo sia.
#
# MIG_DIR puo' essere sovrascritto dall'ambiente: serve al controllo positivo
# in 12-controllo-positivo-runner-reset.sh, che punta il runner a una
# directory con dentro una migration deliberatamente invalida e pretende
# un'uscita non zero. Un runner di cui non si e' mai visto il rosso non e'
# un runner, e' una decorazione.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
MIG="${MIG_DIR:-$(cd "$QUI/../../migrations" 2>/dev/null && pwd)}"
CONT="${CONT_NAME:-pg17-190-reset}"
DB="ricostruzione"
ESITO="${ESITO_FILE:-$QUI/esito-reset.txt}"

# Uno script che non trova niente da applicare NON e' verde: e' rotto.
if [ -z "$MIG" ] || [ ! -d "$MIG" ]; then
  echo "ROSSO: la cartella delle migration non esiste ($MIG)."
  exit 1
fi
shopt -s nullglob
DA_APPLICARE=( "$MIG"/*.sql )
if [ "${#DA_APPLICARE[@]}" -eq 0 ]; then
  echo "ROSSO: zero file .sql in $MIG. Niente da applicare."
  exit 1
fi

echo "=== container usa-e-getta $CONT ==="
docker rm -f "$CONT" >/dev/null 2>&1
if ! docker run -d --name "$CONT" -e POSTGRES_PASSWORD=usaegetta -e POSTGRES_DB="$DB" postgres:17 >/dev/null; then
  echo "ROSSO: il container non e' partito."
  exit 1
fi

# pg_isready da solo non basta: risponde gia' durante l'inizializzazione,
# quando il server accetta connessioni ma sta ancora per riavviarsi. Serve
# una query vera, ripetuta finche' non passa due volte di fila.
pronto=0
for i in $(seq 1 90); do
  if docker exec "$CONT" psql -U postgres -d "$DB" -t -A -c "select 1" >/dev/null 2>&1; then
    pronto=$((pronto+1))
    [ "$pronto" -ge 2 ] && break
  else
    pronto=0
  fi
  sleep 1
done
if [ "$pronto" -lt 2 ]; then
  echo "ROSSO: il container non e' diventato pronto."
  exit 1
fi
docker exec "$CONT" psql -U postgres -d "$DB" -t -A -c "select version()" | head -1

echo "=== control file per pg_cron e pg_net simulati ==="
if ! docker exec "$CONT" bash -c '
D=/usr/share/postgresql/17/extension
printf "comment = \x27pg_cron simulato\x27\ndefault_version = \x271.6\x27\nrelocatable = false\nschema = pg_catalog\n" > $D/pg_cron.control
printf -- "-- simulato dal preambolo\n" > $D/pg_cron--1.6.sql
printf "comment = \x27pg_net simulato\x27\ndefault_version = \x270.14\x27\nrelocatable = false\nschema = pg_catalog\n" > $D/pg_net.control
printf -- "-- simulato dal preambolo\n" > $D/pg_net--0.14.sql
'; then
  echo "ROSSO: non e' stato possibile installare i control file simulati."
  exit 1
fi

echo "=== preambolo (ruoli, auth, cron/net simulati) ==="
tmp_pre="$(mktemp)"
docker exec -i "$CONT" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q \
  < "$QUI/00-preambolo-ruoli-supabase.sql" > "$tmp_pre" 2>&1
codice_pre=$?
if [ "$codice_pre" -ne 0 ]; then
  echo "ROSSO: preambolo fallito (psql ha risposto $codice_pre):"
  sed 's/^/    /' "$tmp_pre"
  rm -f "$tmp_pre"
  exit 1
fi
rm -f "$tmp_pre"
echo "preambolo applicato"

echo "=== catena: ${#DA_APPLICARE[@]} migration da $MIG ==="
ok=0; ko=0
: > "$ESITO"
for f in "${DA_APPLICARE[@]}"; do
  nome="$(basename "$f")"
  tmp="$(mktemp)"
  docker exec -i "$CONT" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q < "$f" > "$tmp" 2>&1
  codice=$?            # <-- catturato subito, prima di qualunque filtro
  if [ "$codice" -eq 0 ]; then
    ok=$((ok+1))
    echo "OK   $nome" >> "$ESITO"
  else
    ko=$((ko+1))
    echo "KO   $nome  (psql ha risposto $codice)" >> "$ESITO"
    sed 's/^/       /' "$tmp" >> "$ESITO"
    printf '  KO  %s  (psql ha risposto %s)\n' "$nome" "$codice"
    head -3 "$tmp" | sed 's/^/        /'
  fi
  rm -f "$tmp"
done

echo
echo "=== $ok applicate, $ko fallite ==="
echo "dettaglio in $ESITO"
[ "$ko" -eq 0 ] || exit 1
