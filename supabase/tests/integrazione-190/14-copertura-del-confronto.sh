#!/usr/bin/env bash
#
# Guardrail sullo STRUMENTO, non sui dati.
#
# Il 25/08/2026 il confronto strutturale ha dichiarato «sei categorie su dieci
# identiche fra ricostruzione e produzione» mentre 26 funzioni su 66 avevano
# il corpo diverso, fra cui private.entitlement_core, che e' l'autorita' che
# decide chi ha accesso all'app. Due buchi indipendenti nello strumento:
#
#   1. confrontava la FIRMA delle funzioni, non il CORPO. Due funzioni con la
#      stessa firma possono fare cose opposte;
#   2. l'elenco degli schemi era scritto a mano e non conteneva `internal`,
#      dove vivono gli helper del merge del sonno.
#
# Uno strumento che non guarda una cosa non dice «non lo so»: dice verde.
# Questo script pretende che lo strumento guardi.
set -uo pipefail
# --figlio: invocazione dal proprio controllo positivo. Salta il controllo
# positivo, altrimenti lo script richiama se stesso all'infinito. Il flag
# veniva passato ma non letto: la prima esecuzione e' andata in ricorsione e
# l'ha fermata il timeout, non lo script.
FIGLIO=no
[ "${1:-}" = "--figlio" ] && FIGLIO=si
QUI="$(cd "$(dirname "$0")" && pwd)"
IMPRONTA="${IMPRONTA_FILE:-$QUI/../reset-pg17/03-impronta-strutturale.sql}"
MIG="${MIG_DIR:-$(cd "$QUI/../../migrations" 2>/dev/null && pwd)}"
esito=0

if [ ! -f "$IMPRONTA" ]; then
  echo "ROSSO: $IMPRONTA non esiste."; exit 1
fi
if [ -z "$MIG" ] || [ ! -d "$MIG" ]; then
  echo "ROSSO: cartella migration non trovata ($MIG)."; exit 1
fi

# ---------------------------------------------------------------------------
# 1. Il confronto deve guardare i corpi, in due forme.
# ---------------------------------------------------------------------------
echo "== il confronto guarda i corpi delle funzioni? =="
for cosa in "pg_get_functiondef" "K corpi grezzi" "L corpi codice"; do
  if grep -qF -- "$cosa" "$IMPRONTA"; then
    echo "  ok      «${cosa}» presente"
  else
    echo "  ROSSO   «${cosa}» assente: il confronto non guarda i corpi, e un corpo"
    echo "          divergente passerebbe per identico."
    esito=1
  fi
done
# prokind='f' serve o pg_get_functiondef solleva sugli aggregati
if grep -qF "prokind" "$IMPRONTA"; then
  echo "  ok      filtro prokind presente (senza, gli aggregati fanno esplodere la query)"
else
  echo "  ROSSO   manca il filtro prokind: la query morira' sul primo aggregato."
  esito=1
fi

# ---------------------------------------------------------------------------
# 2. L'elenco degli schemi non si eredita: si rideriva dalle migration.
#    Ogni schema che le migration CREANO deve comparire nel confronto.
# ---------------------------------------------------------------------------
echo "== ogni schema creato dalle migration e' nel confronto? =="
SCHEMI="$(grep -ohiE 'create schema( if not exists)? +[a-z_]+' "$MIG"/*.sql \
          | awk '{print tolower($NF)}' | sort -u | grep -vx 'if')"
# `public` non viene creato da nessuna migration ma e' governato da tutte
SCHEMI="$(printf '%s\npublic\n' "$SCHEMI" | sort -u)"
n_schemi=0
for sc in $SCHEMI; do
  n_schemi=$((n_schemi+1))
  if grep -qF "'$sc'" "$IMPRONTA"; then
    echo "  ok      $sc"
  else
    echo "  ROSSO   $sc: le migration lo creano, il confronto non lo guarda."
    esito=1
  fi
done
if [ "$n_schemi" -eq 0 ]; then
  echo "  ROSSO: nessuno schema derivato dalle migration. La derivazione e' rotta,"
  echo "         e un elenco vuoto passa qualunque controllo."
  esito=1
else
  echo "  ($n_schemi schemi derivati dai file, non scritti a mano qui)"
fi

# ---------------------------------------------------------------------------
# CONTROLLO POSITIVO
# Una copia dell'impronta senza il confronto dei corpi e senza uno schema deve
# far diventare rosso QUESTO script. Si riesegue lo script su quella copia.
# ---------------------------------------------------------------------------
if [ "$FIGLIO" = "no" ]; then
  echo "== controllo positivo: su un'impronta mutilata questo script deve fallire =="
  MUT="$(mktemp)"
  sed -e "s/pg_get_functiondef/PLACEHOLDER_SENZA_CORPI/g" \
      -e "s/'internal'//g" "$IMPRONTA" > "$MUT"
  IMPRONTA_FILE="$MUT" MIG_DIR="$MIG" "$0" --figlio > /dev/null 2>&1
  codice_figlio=$?
  if [ "$codice_figlio" -eq 0 ]; then
    echo "  SONDA ROTTA: l'impronta mutilata e' passata. Questo script non protegge"
    echo "               niente."
    esito=1
  else
    echo "  ok      l'impronta mutilata fa fallire lo script (uscita $codice_figlio)"
  fi
  rm -f "$MUT"
fi

echo
if [ "$esito" -eq 0 ]; then
  echo "VERDE: il confronto guarda corpi e schemi giusti."
else
  echo "ROSSO: il confronto ha un punto cieco. Un verde da qui non vale."
fi
exit "$esito"
