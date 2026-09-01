#!/usr/bin/env bash
# Esegue la suite sul container ricostruito da esegui-reset.sh.
# Il codice di uscita di psql viene letto PRIMA di qualunque pipe: un `| sed`
# in mezzo lo sostituirebbe con quello di sed, che e' sempre 0, e ogni test
# risulterebbe verde.
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
# CONT_NAME sovrascrivibile dall'ambiente: serve al controllo positivo in
# 12-controllo-positivo-runner-reset.sh, che punta questo runner a un
# container inesistente e pretende un'uscita non zero. Un runner che non
# ha mai dimostrato di sapersi accorgere di un database assente non e'
# distinguibile da uno che non guarda affatto.
CONT="${CONT_NAME:-pg17-190-reset}"
DB="${DB_NAME:-ricostruzione}"

if ! docker exec "$CONT" psql -U postgres -d "$DB" -t -A -c "select 1" >/dev/null 2>&1; then
  echo "ROSSO: il container $CONT non risponde. Eseguire prima esegui-reset.sh."
  exit 1
fi

# ----------------------------------------------------------------------------
# L'elenco si DERIVA dalla cartella. Un array scritto a mano non si accorge di
# un file nuovo: e' lo stesso difetto per cui il rollback di F5 e' rimasto
# fuori dal gate per un intero sprint.
#
# Cio' che non e' un test va escluso QUI, con la sua ragione. Se un .sql non e'
# ne' eseguito ne' escluso, il runner diventa rosso: un file di test che nessuno
# esegue e' peggio di un file che manca, perche' sembra copertura.
# ----------------------------------------------------------------------------
declare -a ESCLUSI=(
  "00-preambolo-ruoli-supabase.sql|lo applica esegui-reset.sh prima della catena, non e' un test"
  "03-impronta-strutturale.sql|strumento di confronto, lo chiama il gate di integrazione"
  "04-righe-categoria.sql|strumento di confronto, lo chiama il gate di integrazione"
  "impronta-completa.sql|strumento di footprint, non contiene asserzioni"
)
escluso() {
  local f="$1" voce
  for voce in "${ESCLUSI[@]}"; do [ "${voce%%|*}" = "$f" ] && return 0; done
  return 1
}

FILE=()
for percorso in "$QUI"/*.sql; do
  f="$(basename "$percorso")"
  escluso "$f" && continue
  FILE+=("$f")
done

if [ "${#FILE[@]}" -eq 0 ]; then
  echo "ROSSO: zero file di test trovati. Il runner non ha misurato niente."
  exit 1
fi
echo "== ${#FILE[@]} file di test derivati dalla cartella; ${#ESCLUSI[@]} esclusi con ragione =="
for voce in "${ESCLUSI[@]}"; do
  f="${voce%%|*}"; perche="${voce#*|}"
  [ -f "$QUI/$f" ] || { echo "ROSSO: escluso un file che non esiste: $f"; exit 1; }
  echo "   escluso  $f  ($perche)"
done

verdi=0; rossi=0
for f in "${FILE[@]}"; do
  echo "############ $f ############"
  uscita_file="$(mktemp)"
  docker exec -i "$CONT" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q < "$QUI/$f" > "$uscita_file" 2>&1
  codice=$?
  sed 's/^NOTICE:  //' "$uscita_file" | grep -v "does not exist, skipping"
  rm -f "$uscita_file"
  if [ "$codice" -eq 0 ]; then
    verdi=$((verdi+1))
  else
    rossi=$((rossi+1)); echo "   >>> ROSSO (psql ha risposto $codice)"
  fi
done

echo
echo "=== $verdi file verdi, $rossi rossi ==="
[ "$rossi" -eq 0 ] || exit 1
