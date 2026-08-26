#!/usr/bin/env bash
# ============================================================================
# IL RUNNER GENERALE — conosce il bersaglio e lo passa lui.
#
# PERCHE'
# -------
# La suite avversariale ha bisogno di due variabili d'ambiente e non ha piu'
# valori predefiniti. Va bene per la sicurezza, non basta per l'uso: se il
# bersaglio dipende dal comando che l'operatore ricorda di scrivere, prima o poi
# qualcuno lo dimentica. E' successo il 26/08/2026, e la suite e' finita sul
# container condiviso.
#
# Qui l'ambiente della release e' dichiarato UNA volta e passato a tutto. Chi
# lancia questo script non deve ricordare niente.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"

# L'unica dichiarazione del bersaglio in tutto il repository.
export SUPABASE_DB_CONTAINER="${SUPABASE_DB_CONTAINER:-pg17-190-reset}"
export SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-ricostruzione}"
# I gate di integrazione usano nomi propri: si allineano allo stesso bersaglio.
export CONT_NAME="$SUPABASE_DB_CONTAINER"
export DB_NAME="$SUPABASE_DB_NAME"

SALTA_RESET=""
case "${1:-}" in
  --senza-reset) SALTA_RESET=1 ;;
  "") : ;;
  *) echo "uso: $0 [--senza-reset]"; exit 2 ;;
esac

# Il reset viene PRIMA, e non e' un optional: la suite avversariale pretende uno
# schema pulito e si rifiuta di girare su un registro gia' scritto. Un runner
# che lasciasse la ricostruzione al comando ricordato dall'operatore avrebbe
# spostato il problema, non risolto.
if [ -z "$SALTA_RESET" ]; then
  echo "############ ricostruzione da zero ############"
  bash "$QUI/reset-pg17/esegui-reset.sh" > /tmp/et-reset.txt 2>&1; c=$?
  printf "  %-10s %-46s exit %s\n" "$([ $c -eq 0 ] && echo ok || echo KO)" "esegui-reset.sh" "$c"
  grep -E 'applicate|sentinella' /tmp/et-reset.txt | tail -2 | sed 's/^/             /'
  [ $c -ne 0 ] && { echo "ROSSO: ricostruzione fallita, il resto non ha senso."; exit 1; }
  echo
fi

echo "############ ambiente della release ############"
source "$QUI/bersaglio.sh"
echo

esito=0
riga() { printf "  %-10s %-46s exit %s\n" "$1" "$2" "$3"; }

# ORDINE, e non e' arbitrario.
#
# La suite avversariale pretende un registro pulito e si rifiuta di girare
# altrimenti. Il registro e' append-only per costruzione, quindi «pulito»
# significa «appena ricostruito»: nessuno puo' svuotarlo dopo.
#
# E 16-mutazioni-billing.sh lo sporca per forza: per dimostrare che un test sa
# uccidere una mutazione deve eseguire percorsi di claim VERI, che scrivono. Non
# e' un difetto del gate, e' cio' che lo rende una prova.
#
# Quindi l'avversariale va subito dopo la ricostruzione, prima di tutto cio' che
# scrive. Misurato: dopo il reset claims=0, dopo la suite SQL claims=0, dopo
# 16-mutazioni claims=2.

echo "############ suite avversariale ############"
bash "$QUI/billing_claims_p0/run-suite.sh" > /tmp/et-avv.txt 2>&1; c=$?
riga "$([ $c -eq 0 ] && echo ok || echo KO)" "run-suite.sh" "$c"
printf "             %s PASS, %s FAIL\n" "$(grep -c PASS /tmp/et-avv.txt)" "$(grep -c FAIL /tmp/et-avv.txt)"
[ $c -ne 0 ] && esito=1

echo
echo "############ suite SQL (reset-pg17) ############"
bash "$QUI/reset-pg17/esegui-test.sh" > /tmp/et-sql.txt 2>&1; c=$?
riga "$([ $c -eq 0 ] && echo ok || echo KO)" "esegui-test.sh" "$c"
grep -E 'file verdi' /tmp/et-sql.txt | tail -1 | sed 's/^/             /'
[ $c -ne 0 ] && esito=1

echo
echo "############ gate di integrazione ############"
for f in "$QUI"/integrazione-190/*.sh; do
  bash "$f" >/dev/null 2>&1; c=$?
  riga "$([ $c -eq 0 ] && echo ok || echo KO)" "$(basename "$f")" "$c"
  [ $c -ne 0 ] && esito=1
done

echo

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: qualcosa non e' verde. I log completi sono in /tmp/et-*.txt"; exit 1; }
echo "VERDE: suite SQL, gate di integrazione e suite avversariale, tutto verde sul bersaglio dichiarato."
