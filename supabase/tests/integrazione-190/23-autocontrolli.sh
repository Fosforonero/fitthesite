#!/usr/bin/env bash
# ============================================================================
# GLI AUTOCONTROLLI, ESEGUITI DAVVERO
#
# PERCHE' ESISTE
# --------------
# Sei gate di questa cartella sanno mettersi alla prova da soli: lanciati con
# `--autocontrollo` rompono di proposito la propria difesa e pretendono di
# diventare rossi. E' la sola cosa che distingue un cancello da una
# decorazione.
#
# Nessuno li lanciava mai. `esegui-tutto.sh` cammina `integrazione-190/*.sh`
# e li invoca SENZA argomenti, quindi ogni esecuzione della suite eseguiva il
# gate e mai la sua prova di saper fallire. La capacita' di diventare rossi
# era dichiarata nel codice e non misurata da nessuna parte: esattamente la
# forma di verde che questi gate esistono per impedire, applicata a loro
# stessi.
#
# Misurato il 31/08/2026: sei gate dichiarano `--autocontrollo`, zero
# esecuzioni automatiche.
#
# COSA FA
# -------
# Scopre i gate che dichiarano `--autocontrollo`, li confronta con l'elenco
# congelato qui sotto, ed esegue l'autocontrollo di ciascuno pretendendo
# uscita 0.
#
# LE DUE DIREZIONI DEL CONFRONTO, e perche' servono entrambe
#   scoperto ma non dichiarato -> un gate nuovo che nessuno ha collegato qui
#   dichiarato ma non scoperto -> un gate che ha PERSO il suo autocontrollo
#
# La seconda e' quella silenziosa: senza, basta togliere `--autocontrollo` da
# un gate perche' la sua prova sparisca senza che niente diventi rosso.
# Un'invariante scritta su un elenco scade da sola: qui l'elenco e' dichiarato
# con la ragione, e la conservazione e' verificata a ogni esecuzione.
#
# La scoperta e' volutamente GROSSOLANA — nomina la stringa `--autocontrollo`
# in qualunque punto del file. Un falso positivo (un gate che la cita solo in
# un commento) esce 2 con «argomento sconosciuto» e rende rosso questo runner:
# fallisce chiuso, che e' il verso giusto in cui sbagliare.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
IO="$(basename "$0")"
MODO="${1:-}"

# I gate che DEVONO avere un autocontrollo, e cosa protegge ciascuno.
# Non e' un elenco di comodo: e' la dichiarazione di quali difese della 190
# devono sapersi vedere fallire.
declare -a ATTESI=(
  "16-mutazioni-billing.sh"            # che i test sappiano uccidere un difetto vero
  "17-manifesto-rollback.sh"           # che ogni forward-only abbia un rollback eseguito
  "19-insieme-pending.sh"              # che l'insieme pending coincida col manifesto congelato
  "20-secdef-senza-controllo.sh"       # che nessuna SECURITY DEFINER resti senza controllo
  "21-nessuna-transazione-nelle-migration.sh"  # che nessuna migration apra transazioni nude
  "22-sentinella-solo-harness.sh"      # che la sentinella del banco non finisca in produzione
)

scopri() {
  for f in "$QUI"/*.sh; do
    b="$(basename "$f")"
    [ "$b" = "$IO" ] && continue
    grep -qF -- '--autocontrollo' "$f" && printf '%s\n' "$b"
  done | sort
}

# ── L'AUTOCONTROLLO DI QUESTO RUNNER ────────────────────────────────────────
#
# Un runner che pretende dagli altri la prova di saper fallire deve darla lui
# per primo. Tre sonde, una per ciascuno dei tre modi in cui questo runner deve
# diventare rosso:
#
#   --sonda-rossa      un gate il cui autocontrollo FALLISCE
#   --sonda-scollegata un gate che dichiara --autocontrollo e non e' in elenco
#   --sonda-persa      un gate in elenco che ha PERSO il suo --autocontrollo
#
# La terza e' quella che nessuno scriverebbe spontaneamente, ed e' la piu'
# importante: senza, basta cancellare tre righe da un gate perche' la sua prova
# sparisca senza che niente diventi rosso.
if [ "$MODO" = "--autocontrollo" ]; then
  echo "== autocontrollo del runner: sa diventare rosso? =="
  finto="$QUI/99-sonda-autocontrollo-finta.sh"
  fallito=0

  prova() {
    local nome="$1" corpo="$2" arg="$3"
    printf '%s\n' "$corpo" > "$finto"
    bash "$0" $arg >/dev/null 2>&1
    local c=$?
    rm -f "$finto"
    if [ "$c" -eq 0 ]; then
      echo "  ROSSO  $nome: il runner esce 0. Non sta misurando niente."
      fallito=1
    else
      echo "  ok     $nome: il runner esce $c, come deve"
    fi
  }

  # 1. Un gate il cui autocontrollo fallisce.
  prova "--sonda-rossa" \
'#!/usr/bin/env bash
# Sonda: dichiara --autocontrollo e lo fa fallire.
[ "${1:-}" = "--autocontrollo" ] && exit 1
exit 0' \
    "--interno-con-sonda"

  # 2. Un gate nuovo che dichiara --autocontrollo e che nessuno ha collegato
  #    all elenco: la sua prova non girerebbe mai.
  prova "--sonda-scollegata" \
'#!/usr/bin/env bash
# Sonda: dichiara --autocontrollo, passa, ma non e in elenco.
[ "${1:-}" = "--autocontrollo" ] && exit 0
exit 0' \
    ""

  # 3. Un gate dichiarato in elenco che non ha (piu) un --autocontrollo.
  bash "$0" --interno-atteso-fantasma >/dev/null 2>&1
  c=$?
  if [ "$c" -eq 0 ]; then
    echo "  ROSSO  --sonda-persa: il runner esce 0 con un gate che ha perso il suo autocontrollo."
    fallito=1
  else
    echo "  ok     --sonda-persa: il runner esce $c, come deve"
  fi

  echo
  [ "$fallito" -ne 0 ] && { echo "ROSSO: l'autocontrollo del runner e' fallito."; exit 1; }
  echo "VERDE: il runner sa diventare rosso in tutti e tre i modi."
  exit 0
fi

# I due argomenti interni esistono SOLO per l'autocontrollo qui sopra, e non
# hanno nessun uso legittimo dall'esterno.
case "$MODO" in
  --interno-con-sonda)
    # La sonda e' messa in elenco apposta: cosi' il rosso NON puo' arrivare
    # dal confronto degli elenchi, e deve arrivare dall'esito della sonda.
    # Senza questo, la prova proverebbe il controllo sbagliato.
    ATTESI+=("99-sonda-autocontrollo-finta.sh"); MODO="" ;;
  --interno-atteso-fantasma)
    ATTESI+=("00-gate-che-non-esiste.sh"); MODO="" ;;
esac
[ -n "$MODO" ] && { echo "ROSSO: argomento sconosciuto: $MODO"; exit 2; }

SCOPERTI="$(scopri)"
n="$(printf '%s\n' "$SCOPERTI" | grep -c .)"

# Un runner che non trova niente da eseguire NON e' verde: e' rotto.
if [ "$n" -eq 0 ]; then
  echo "ROSSO: nessun gate dichiara --autocontrollo. Il runner non ha misurato niente."
  exit 1
fi

esito=0

echo "== l'elenco atteso e cio' che c'e' davvero =="
for a in "${ATTESI[@]}"; do
  printf '%s\n' "$SCOPERTI" | grep -qxF "$a" || {
    echo "  ROSSO  $a e' dichiarato qui ma non ha (piu') un --autocontrollo."
    echo "         La sua prova di saper fallire e' sparita senza rendere rosso niente."
    esito=1; }
done
while read -r s; do [ -n "$s" ] || continue
  printf '%s\n' "${ATTESI[@]}" | grep -qxF "$s" || {
    echo "  ROSSO  $s dichiara --autocontrollo e non e' nell'elenco di questo runner."
    echo "         Un gate nuovo che nessuno ha collegato: la sua prova non gira."
    esito=1; }
done <<<"$SCOPERTI"
[ "$esito" -eq 0 ] && echo "  ok     $n gate, elenco e disco coincidono"

echo
echo "== ciascun gate sa diventare rosso? =="
for g in $SCOPERTI; do
  uscita="$(bash "$QUI/$g" --autocontrollo 2>&1)"; c=$?
  if [ "$c" -eq 0 ]; then
    echo "  ok     $g"
  else
    echo "  ROSSO  $g: l'autocontrollo esce $c"
    printf '%s\n' "$uscita" | sed 's/^/         | /'
    esito=1
  fi
done

echo
if [ "$esito" -ne 0 ]; then
  echo "ROSSO: almeno un gate non ha dimostrato di saper fallire."
  echo "Un cancello che non si e' mai visto rosso non protegge: decora."
  exit 1
fi
echo "VERDE: $n gate, tutti capaci di diventare rossi quando la loro difesa viene tolta."
