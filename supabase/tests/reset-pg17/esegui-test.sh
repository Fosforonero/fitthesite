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

FILE=(01-test-is-admin.sql 02-controllo-positivo-ricorsione.sql
      05-test-has-role.sql 06-test-grant-pro-to-email.sql
      07-test-dashboard-snapshot.sql 08-test-claim-group-invite-cap.sql
      09-test-founder-due-proprieta.sql
      10-test-entitlement-core-appreview.sql
      11-test-finestra-awake.sql)

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
