#!/usr/bin/env bash
# OGNI FILE DI PROVA SUL DISCO DEVE ESSERE ESEGUITO DALLA SUITE.
#
# La classe si e' presentata due volte. La prima e' nella testata di
# run-suite.sh: «finche' la suite ne eseguiva uno solo, gli altri tre esistevano
# sul disco e non venivano mai eseguiti». La seconda e' 91-red-pareggio-claim.sql,
# scritto, committato, e mai richiamato: un caso che dimostrava la perdita di un
# rimborso stava nel repository come se fosse coperto, e la suite diceva "67 PASS".
#
# ── PERCHE' QUESTO FILE E' STATO RISCRITTO ─────────────────────────────────
#
# La prima versione confrontava il NOME di ogni file col TESTO di run-suite.sh.
# Una review indipendente l'ha aggirata in un colpo: riscrivendo `run_sql 91-…`
# in `# DISATTIVATO: run_sql 91-…` il nome resta nel file, il grep lo trova, e
# il guardrail dice «22 file, tutti richiamati» mentre due non girano. Stessa
# cosa cancellando la riga `bash "$DIR/90-…"` e lasciando il suo `echo`:
# l'intestazione veniva perfino stampata, quindi cadeva anche il ripiego di
# leggere l'output.
#
# Un controllo che misura il testo di un file misura le intenzioni. Questo
# misura cosa e' stato ESEGUITO: il runner tiene un registro e glielo passa.
#
# ── I DUE MODI ─────────────────────────────────────────────────────────────
#
#   (nessun argomento)      pre-volo. Enumera cosa c'e' da eseguire e verifica
#                           che il runner contenga ancora la verifica finale.
#   --eseguiti NOME...      verifica finale. Confronta il registro col disco.
#
# ── COSA QUESTO CONTROLLO NON PUO' FARE, DETTO QUI ─────────────────────────
#
# Se qualcuno cancella l'ULTIMA riga di run-suite.sh, la verifica finale non
# gira e niente se ne accorge — un verificatore non puo' provare la propria
# esecuzione. Il pre-volo mitiga controllando che quella riga ci sia ancora, ma
# quello si', e' un controllo sul testo, e vale quanto vale: copre la
# cancellazione distratta, non quella deliberata.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$DIR/run-suite.sh"

# Enumerazione ESAUSTIVA: ogni .sql e ogni .sh della directory, tolto il runner.
# Il vecchio glob `[0-9][0-9]-*` avrebbe reso invisibile il primo file senza
# prefisso numerico, e l'invisibilita' e' esattamente il difetto sorvegliato.
elenco_su_disco() {
  local f nome
  for f in "$DIR"/*.sql "$DIR"/*.sh; do
    [ -e "$f" ] || continue
    nome="$(basename "$f")"
    [ "$nome" = "run-suite.sh" ] && continue
    echo "$nome"
  done | sort -u
}

if [ ! -f "$RUNNER" ]; then
  echo "guardrail: run-suite.sh non trovato in $DIR" >&2
  exit 1
fi

# ── Modo pre-volo ──────────────────────────────────────────────────────────
if [ $# -eq 0 ]; then
  if ! grep -q -- '--eseguiti' "$RUNNER"; then
    echo "" >&2
    echo "GUARDRAIL FALLITO: run-suite.sh non contiene piu' la verifica finale" >&2
    echo "dell'esecuzione (la chiamata con --eseguiti in fondo al file)." >&2
    echo "" >&2
    echo "Senza quella riga la suite puo' saltare qualunque file di prova senza" >&2
    echo "che nessuno se ne accorga. Ripristinarla prima di proseguire." >&2
    exit 1
  fi
  totale=$(elenco_su_disco | wc -l | tr -d ' ')
  echo "guardrail: $totale file di prova da eseguire; il conto si chiude in fondo alla suite"
  exit 0
fi

# ── Modo verifica finale ───────────────────────────────────────────────────
if [ "$1" != "--eseguiti" ]; then
  echo "guardrail: argomento sconosciuto '$1' (attesi: nessuno, oppure --eseguiti NOME...)" >&2
  exit 2
fi
shift

eseguiti_tmp="$(mktemp)"
disco_tmp="$(mktemp)"
trap 'rm -f "$eseguiti_tmp" "$disco_tmp"' EXIT

# Il registro si accetta sia come argomenti separati sia come stringa unica.
# Non e' pignoleria: `bash` separa `$ESEGUITI` in parole, `zsh` no, e chi prova
# questo controllo a mano da un terminale zsh riceverebbe un fallimento
# incomprensibile — 22 nomi su una riga sola, letti come un file inesistente
# dal nome lunghissimo. Ci sono gia' cascato.
printf '%s\n' "$@" | tr ' \t' '\n\n' | grep -v '^$' | sort -u > "$eseguiti_tmp"
elenco_su_disco > "$disco_tmp"

# Sul disco ma mai eseguiti: il difetto storico.
mai_eseguiti="$(comm -23 "$disco_tmp" "$eseguiti_tmp")"
# Eseguiti ma non sul disco: un nome sbagliato nel runner, che altrimenti
# gonfierebbe il registro e mascherebbe un file davvero saltato.
inesistenti="$(comm -13 "$disco_tmp" "$eseguiti_tmp")"

if [ -n "$mai_eseguiti" ] || [ -n "$inesistenti" ]; then
  echo "" >&2
  echo "GUARDRAIL FALLITO: il registro di esecuzione non coincide col disco." >&2
  if [ -n "$mai_eseguiti" ]; then
    echo "" >&2
    echo "  Esistono nel repository e NON sono stati eseguiti:" >&2
    echo "$mai_eseguiti" | sed 's/^/      /' >&2
    echo "" >&2
    echo "  Aggiungerli a run-suite.sh, oppure cancellarli. Un file che sta nel" >&2
    echo "  repository senza girare fa sembrare coperto qualcosa che non lo e'." >&2
  fi
  if [ -n "$inesistenti" ]; then
    echo "" >&2
    echo "  Il runner dichiara di aver eseguito file che non esistono:" >&2
    echo "$inesistenti" | sed 's/^/      /' >&2
  fi
  echo "" >&2
  exit 1
fi

# I due conteggi vengono da due file diversi. Scriverli entrambi dallo stesso
# non proverebbe niente e sembrerebbe una verifica: e' lo stesso vizio che ha
# reso credibile per settimane il "22 file, tutti richiamati" di prima.
su_disco=$(wc -l < "$disco_tmp" | tr -d ' ')
eseguiti=$(wc -l < "$eseguiti_tmp" | tr -d ' ')
echo ""
echo "guardrail: $su_disco file di prova sul disco, $eseguiti eseguiti davvero."
