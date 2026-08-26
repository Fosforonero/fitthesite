#!/usr/bin/env bash
# ============================================================================
# Guardrail generale: nessuna migration puo' contenere BEGIN, COMMIT o ROLLBACK
# nudi.
#
# PERCHE'
# -------
# Un file .sql non decide come viene eseguito. In autocommit ogni istruzione si
# conferma da sola; dentro una transazione esterna il file intero e' una
# transazione, e un `rollback;` al suo interno annulla TUTTO, corpo della
# migration compreso. In quel caso psql esce comunque 0: la migration risulta
# applicata e non ha cambiato niente.
#
# E' successo davvero con F6, che avvolgeva la propria postcondizione in
# `begin;` ... `rollback;`. Il difetto era invisibile perche' l'harness di
# ricostruzione esegue senza --single-transaction, cioe' nell'unica modalita' in
# cui non si manifesta. La CLI Supabase non espone il controllo della
# transazione: la modalita' non si sceglie, quindi le migration devono essere
# corrette in entrambe.
#
# La forma giusta per una postcondizione che scrive: un sotto-blocco PL/pgSQL
# con EXCEPTION, che e' un SAVEPOINT implicito. Si solleva una sentinella e la
# si cattura: cio' che il sotto-blocco ha scritto viene annullato senza aprire
# nessuna transazione.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
MIG="$(cd "$QUI/../../.." && pwd)/supabase/migrations"
MODO="${1:-}"

# La ricerca e' su righe che contengono SOLTANTO la parola chiave: dentro
# PL/pgSQL `begin` e `end` sono struttura del linguaggio e non aprono niente.
CERCA='^[[:space:]]*(begin|commit|rollback)[[:space:]]*;[[:space:]]*$'

if [ "$MODO" = "--autocontrollo" ]; then
  echo "== autocontrollo: il guardrail sa diventare rosso? =="
  finto="$MIG/29999999999999_sonda_transazione_nuda.sql"
  printf 'select 1;\nbegin;\nselect 2;\nrollback;\n' > "$finto"
  bash "$0" >/dev/null 2>&1; c=$?
  rm -f "$finto"
  if [ "$c" -eq 0 ]; then
    echo "  ROSSO  con una migration che apre una transazione il guardrail esce 0."
    exit 1
  fi
  echo "  ok     la sonda rende rosso il guardrail (esce $c)"
  echo "VERDE: il guardrail sa fallire."
  exit 0
fi
[ -n "$MODO" ] && { echo "ROSSO: argomento sconosciuto: $MODO"; exit 2; }

tot=0; colpevoli=0
echo "== BEGIN/COMMIT/ROLLBACK nudi nelle migration =="
for f in "$MIG"/*.sql; do
  tot=$((tot+1))
  righe="$(grep -nE "$CERCA" "$f" || true)"
  if [ -n "$righe" ]; then
    echo "  ROSSO  $(basename "$f")"
    printf '%s\n' "$righe" | sed 's/^/           riga /'
    colpevoli=$((colpevoli+1))
  fi
done

# Un guardrail che non ha letto niente non e' verde.
if [ "$tot" -eq 0 ]; then
  echo "ROSSO: zero migration esaminate. Il guardrail non ha misurato niente."
  exit 1
fi

echo
if [ "$colpevoli" -ne 0 ]; then
  echo "ROSSO: $colpevoli migration su $tot aprono o chiudono una transazione."
  echo "       Il loro effetto dipende da come il runner le esegue, e la modalita'"
  echo "       non si sceglie. Usare un sotto-blocco PL/pgSQL con EXCEPTION."
  exit 1
fi
echo "VERDE: $tot migration esaminate, nessuna apre o chiude una transazione."
