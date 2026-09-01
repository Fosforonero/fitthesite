#!/usr/bin/env bash
# ============================================================================
# La sentinella dell'ambiente di prova non deve MAI finire in produzione.
#
# `private.ambiente_isolato_release` esiste per una ragione sola: dimostrare che
# un database e' l'ambiente isolato costruito per la release, cosi' che la suite
# avversariale rifiuti di scrivere altrove. La crea `esegui-reset.sh`, cioe' il
# banco di prova.
#
# Se una migration la creasse, succederebbero due cose brutte insieme: la
# produzione si porterebbe dietro una tabella che non le serve, e la guardia sul
# bersaglio smetterebbe di distinguere l'ambiente isolato da qualunque altro,
# perche' la sentinella ci sarebbe ovunque. La guardia si disinnescherebbe da
# sola.
#
# Per questo e' anche esclusa dall'impronta strutturale: non e' schema sotto
# review, e comparirebbe come differenza in ogni confronto con la produzione.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/../../.." && pwd)"
MIG="$RADICE/supabase/migrations"
IMPRONTA="$RADICE/supabase/tests/reset-pg17/impronta-completa.sql"
MODO="${1:-}"

if [ "$MODO" = "--autocontrollo" ]; then
  echo "== autocontrollo: il gate sa diventare rosso? =="
  finto="$MIG/29999999999998_sonda_sentinella.sql"
  printf 'create table if not exists private.ambiente_isolato_release(x int);\n' > "$finto"
  bash "$0" >/dev/null 2>&1; c=$?
  rm -f "$finto"
  [ "$c" -eq 0 ] && { echo "  ROSSO  con una migration che crea la sentinella il gate esce 0."; exit 1; }
  echo "  ok     la sonda rende rosso il gate (esce $c)"
  echo "VERDE: il gate sa fallire."; exit 0
fi
[ -n "$MODO" ] && { echo "ROSSO: argomento sconosciuto: $MODO"; exit 2; }

esito=0
tot=0
echo "== la sentinella e' solo del banco di prova? =="

colpevoli=""
for f in "$MIG"/*.sql; do
  tot=$((tot+1))
  grep -qiF 'ambiente_isolato_release' "$f" && colpevoli="$colpevoli $(basename "$f")"
done
if [ "$tot" -eq 0 ]; then
  echo "ROSSO: zero migration esaminate. Il gate non ha misurato niente."; exit 1
fi
if [ -n "$colpevoli" ]; then
  echo "  ROSSO  la sentinella compare in una migration distribuibile:$colpevoli"
  echo "         Andrebbe in produzione, e la guardia sul bersaglio smetterebbe di"
  echo "         distinguere l'ambiente isolato da qualunque altro."
  esito=1
else
  echo "  ok     nessuna delle $tot migration la nomina"
fi

# La crea davvero l'harness? Se sparisse da li', la guardia rifiuterebbe tutto.
if grep -qF 'ambiente_isolato_release' "$RADICE/supabase/tests/reset-pg17/esegui-reset.sh"; then
  echo "  ok     esegui-reset.sh la crea"
else
  echo "  ROSSO  esegui-reset.sh non la crea piu': nessun bersaglio sarebbe piu' accettato."
  esito=1
fi

# Ed e' esclusa dall'impronta? Altrimenti sporca ogni confronto con la produzione.
if grep -qF "c.relname <> 'ambiente_isolato_release'" "$IMPRONTA"; then
  echo "  ok     esclusa dall'impronta strutturale"
else
  echo "  ROSSO  l'impronta strutturale la include: comparirebbe come differenza"
  echo "         in ogni confronto con la produzione, e non e' una differenza dello schema."
  esito=1
fi

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: la sentinella non e' confinata al banco di prova."; exit 1; }
echo "VERDE: creata solo dall'harness, assente da tutte le $tot migration, esclusa dall'impronta."
