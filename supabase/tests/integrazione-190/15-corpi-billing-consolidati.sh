#!/usr/bin/env bash
# ============================================================================
# I CORPI CONSOLIDATI SONO QUELLI FINALI DEL FILONE, NON UNO STATO INTERMEDIO
# ============================================================================
# F1 e F2 consolidano quindici migration del ramo `p0/apple-jws-verifier` in
# due forward-only. Alcune di quelle funzioni sono ridefinite fino a cinque
# volte lungo il ramo: prendere la definizione sbagliata non produrrebbe
# nessun errore visibile, produrrebbe un comportamento diverso.
#
# Questo guardrail confronta i diciotto corpi ricostruiti dalla catena con
# l'impronta presa dal filone applicato per intero (69 migration, 0 fallite)
# in un contenitore usa-e-getta.
#
# NORMALIZZAZIONE: minuscolo, senza commenti `--`, senza spazi bianchi. Dice
# se e' cambiato il CODICE, non la formattazione. Il limite dichiarato: due
# letterali che differiscono solo per uno spazio interno risultano uguali.
#
# CONTROLLO POSITIVO: il figlio rigira su un'attesa mutata e deve fallire.
# Un confronto di cui non si e' mai visto il rosso e' una decorazione.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
CONT="${CONT_NAME:-pg17-190-reset}"
DB="${DB_NAME:-ricostruzione}"
ATTESE="${ATTESE_FILE:-$QUI/corpi-billing-attesi.txt}"

FIGLIO=no
[ "${1:-}" = "--figlio" ] && FIGLIO=si

if [ ! -s "$ATTESE" ]; then
  echo "ROSSO: file delle attese assente o vuoto ($ATTESE)."
  exit 1
fi

Q="select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' || '|' ||
md5(regexp_replace(regexp_replace(lower(pg_get_functiondef(p.oid)),'--[^'||chr(10)||']*','','g'),'\s+','','g'))
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where p.prokind='f' and n.nspname in ('private','public')
  and (p.proname like '%billing%' or p.proname in ('claim_store_purchase','record_store_purchase_revocation','is_sandbox_reviewer','_b2c_projection_guard','_b2c_no_truncate'))
order by 1;"

OSSERVATO="$(mktemp)"
docker exec "$CONT" psql -U postgres -d "$DB" -t -A -c "$Q" > "$OSSERVATO" 2>/dev/null
codice=$?
if [ "$codice" -ne 0 ]; then
  echo "ROSSO: la query non e' stata eseguita (psql ha risposto $codice). Non e' un verde: e' una misura mancata."
  rm -f "$OSSERVATO"
  exit 1
fi

righe_osservate=$(grep -c . "$OSSERVATO")
righe_attese=$(grep -c . "$ATTESE")
if [ "$righe_osservate" -eq 0 ]; then
  echo "ROSSO: zero funzioni billing trovate. La catena non le ha create."
  rm -f "$OSSERVATO"
  exit 1
fi

esito=0
if ! diff -q "$ATTESE" "$OSSERVATO" >/dev/null 2>&1; then
  esito=1
  if [ "$FIGLIO" = "no" ]; then
    echo "ROSSO: i corpi consolidati non coincidono con quelli finali del filone."
    echo "  attese=$righe_attese  osservate=$righe_osservate"
    diff "$ATTESE" "$OSSERVATO" | head -20 | sed 's/^/    /'
  fi
fi

if [ "$FIGLIO" = "si" ]; then
  exit "$esito"
fi

if [ "$esito" -ne 0 ]; then
  exit 1
fi

echo "VERDE: $righe_osservate corpi billing identici a quelli finali del filone."

# ── controllo positivo ──────────────────────────────────────────────────────
MUT="$(mktemp)"
sed '1s/|.*/|00000000000000000000000000000000/' "$ATTESE" > "$MUT"
ATTESE_FILE="$MUT" CONT_NAME="$CONT" DB_NAME="$DB" "$0" --figlio > /dev/null 2>&1
codice_figlio=$?
rm -f "$MUT" "$OSSERVATO"
if [ "$codice_figlio" -eq 0 ]; then
  echo "ROSSO: con un'attesa deliberatamente falsa il confronto e' rimasto verde. Non sa fallire."
  exit 1
fi
echo "VERDE: controllo positivo — con un'attesa falsa il confronto diventa rosso."
