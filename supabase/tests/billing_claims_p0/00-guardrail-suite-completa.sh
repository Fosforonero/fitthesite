#!/usr/bin/env bash
# OGNI FILE DI PROVA SUL DISCO DEVE ESSERE ESEGUITO DALLA SUITE.
#
# Questo controllo esiste perche' la classe si e' presentata due volte.
#
# La prima e' scritta nella testata di run-suite.sh: «finche' la suite ne
# eseguiva uno solo, gli altri tre esistevano sul disco e non venivano mai
# eseguiti». La seconda e' 91-red-pareggio-claim.sql, scritto, committato, e
# mai richiamato da nessuna parte: un caso che dimostrava la perdita di un
# rimborso stava nel repository come se fosse coperto, e la suite continuava a
# dire "67 PASS".
#
# Un file di prova non eseguito e' peggio di un file assente: quello assente si
# nota, questo si conta.
#
# ESAUSTIVO, NON CAMPIONATO: enumera la directory, non un elenco scritto a
# mano. Un elenco a mano avrebbe lo stesso difetto che sta controllando.
#
# Gira per PRIMO (prefisso 00) cosi' il messaggio arriva prima dei minuti di
# suite, non dopo.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$DIR/run-suite.sh"

if [[ ! -f "$RUNNER" ]]; then
  echo "guardrail: run-suite.sh non trovato in $DIR" >&2
  exit 1
fi

mancanti=()
for f in "$DIR"/[0-9][0-9]-*; do
  nome="$(basename "$f")"
  # Il guardrail stesso non si auto-invoca: e' il runner a chiamarlo, e se non
  # lo facesse non girerebbe questo controllo — quindi lo si verifica come
  # tutti gli altri.
  if ! grep -q -- "$nome" "$RUNNER"; then
    mancanti+=("$nome")
  fi
done

if (( ${#mancanti[@]} > 0 )); then
  echo "" >&2
  echo "GUARDRAIL FALLITO: ${#mancanti[@]} file di prova esistono e NON vengono eseguiti." >&2
  echo "" >&2
  for m in "${mancanti[@]}"; do echo "    $m" >&2; done
  echo "" >&2
  echo "Aggiungerli a run-suite.sh, oppure cancellarli. Un file che sta nel" >&2
  echo "repository senza girare fa sembrare coperto qualcosa che non lo e'." >&2
  exit 1
fi

totale=$(ls "$DIR"/[0-9][0-9]-* | wc -l | tr -d ' ')
echo "guardrail: $totale file di prova, tutti richiamati da run-suite.sh"
