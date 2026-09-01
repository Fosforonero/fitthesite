#!/usr/bin/env bash
# ============================================================================
# INFRA-2 — il manifesto canonico delle forward-only del blocco 3B
#
# PERCHE' ESISTE
# --------------
# `87-rollback-verificato.sh` contiene un elenco di nove file scritto a mano.
# Quei nove sono i rollback del ramo billing di AGOSTO 8-16: nessuno dei sei
# forward-only di questo sprint e' fra loro. La review indipendente lo aveva
# visto per F5; guardando l'intero insieme il quadro e' peggiore, e va scritto
# per esteso:
#
#   cinque forward-only su sei non avevano NESSUN file di rollback, e la sesta
#   ne aveva uno che nessun runner eseguiva.
#
# Quando ho dichiarato «rollback esercitato» alla fine dello sprint, cio' che
# era stato esercitato era il rollback del ramo VECCHIO.
#
# Un elenco scritto a mano non puo' accorgersi di una migration nuova: e'
# esattamente il difetto che ha reso possibile tutto questo. Qui l'insieme si
# DERIVA dal disco, e il manifesto serve a rendere esplicito ogni cambiamento.
#
# COSA CONTROLLA
# --------------
#   1. voce del manifesto senza migration sul disco  -> obsoleta
#   2. migration sul disco non nel manifesto         -> non dichiarata
#   3. voce del manifesto senza file di rollback     -> senza test rollback
#   4. file di rollback in ambito ma non nel manifesto -> orfano
#   5. voce dichiarata ma non eseguita dal runner    -> non eseguita
#
# Ognuno esce non zero. `--autocontrollo` pretende che ognuno sappia davvero
# rendere rosso il gate.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/../../.." && pwd)"
MIG="$RADICE/supabase/migrations"
ROLL="$RADICE/supabase/rollback"
MANIFESTO="$ROLL/MANIFESTO-3B.txt"

# L'ambito, derivato e non elencato: il blocco 3B e' l'insieme delle
# forward-only datate 20260825130000 o oltre. Il confine non e' arbitrario:
# 20260825120009 e' l'ultima del filone precedente, gia' consegnato.
CONFINE=20260825130000

in_ambito() {
  ls -1 "$MIG"/*.sql 2>/dev/null | while read -r f; do
    b="$(basename "$f" .sql)"; v="${b%%_*}"
    awk -v v="$v" -v c="$CONFINE" 'BEGIN{exit !(v+0 >= c+0)}' && printf '%s\n' "$b"
  done | sort
}

MODO="${1:-}"

# --- rigenerazione del manifesto -------------------------------------------
if [ "$MODO" = "--rigenera" ]; then
  { echo "# Manifesto canonico delle forward-only del blocco 3B."
    echo "# DERIVATO dal disco, non scritto a mano: rigenerare con --rigenera."
    echo "# Ambito: ogni migration con versione >= $CONFINE."
    echo "# Ogni voce DEVE avere un file <nome>_rollback.sql in supabase/rollback/."
    in_ambito
  } > "$MANIFESTO"
  echo "manifesto rigenerato: $(in_ambito | grep -c .) voci in $MANIFESTO"
  exit 0
fi

esito=0
rosso() { echo "  ROSSO  $*"; esito=1; }

echo "== manifesto canonico delle forward-only 3B (ambito: versione >= $CONFINE) =="

if [ ! -f "$MANIFESTO" ]; then
  echo "ROSSO: il manifesto non esiste. Rigeneralo con --rigenera e leggilo prima di fidartene."
  exit 1
fi

DICHIARATE="$(grep -v '^#' "$MANIFESTO" | grep -v '^[[:space:]]*$' | sort)"
SUL_DISCO="$(in_ambito)"

# Un gate che non misura niente non e' verde.
if [ -z "$SUL_DISCO" ]; then
  echo "ROSSO: zero migration in ambito. Il gate non ha misurato niente."
  exit 1
fi

# 1 e 2 — il manifesto e il disco devono coincidere.
while read -r v; do [ -n "$v" ] || continue
  grep -qxF "$v" <<<"$SUL_DISCO" || rosso "voce obsoleta: «${v}» e' nel manifesto ma non sul disco."
done <<<"$DICHIARATE"
while read -r v; do [ -n "$v" ] || continue
  grep -qxF "$v" <<<"$DICHIARATE" || rosso "forward-only NON dichiarata: «${v}» e' sul disco e non nel manifesto.
         Una migration nuova senza voce nel manifesto e' esattamente il modo in
         cui il rollback di F5 e' rimasto fuori dal gate per un intero sprint."
done <<<"$SUL_DISCO"

# 3 — ogni voce deve avere il suo rollback.
senza=0
while read -r v; do [ -n "$v" ] || continue
  if [ ! -f "$ROLL/${v}_rollback.sql" ]; then
    rosso "senza test rollback: «${v}» non ha ${v}_rollback.sql"
    senza=$((senza+1))
  fi
done <<<"$DICHIARATE"

# 4 — nessun rollback orfano in ambito.
ls -1 "$ROLL"/*_rollback.sql 2>/dev/null | while read -r r; do
  b="$(basename "$r" _rollback.sql)"; v="${b%%_*}"
  awk -v v="$v" -v c="$CONFINE" 'BEGIN{exit !(v+0 >= c+0)}' || continue
  grep -qxF "$b" <<<"$DICHIARATE" || echo "  ROSSO  rollback orfano: ${b}_rollback.sql non ha una voce nel manifesto."
done | tee /tmp/orfani-17.txt
grep -q ROSSO /tmp/orfani-17.txt 2>/dev/null && esito=1

# 5 — ogni voce deve essere davvero eseguita da 18-rollback-due-modalita.sh.
#
# La prima stesura si accontentava di `grep -q MANIFESTO` nel sorgente del
# runner: verificava che la parola comparisse, non che l'elenco coincidesse.
# Un runner che legge il manifesto e poi applica una glob diversa — cioe'
# esattamente quello che 18 ha fatto per una settimana — passava.
#
# Ora si confrontano gli INSIEMI, nei due sensi, chiedendo al runner la sua
# dichiarazione. Il runner, a sua volta, verifica in fondo che l'insieme
# dichiarato sia quello eseguito: la catena regge da capo a fondo.
ESEC="$QUI/18-rollback-due-modalita.sh"
if [ ! -f "$ESEC" ]; then
  rosso "il runner 18-rollback-due-modalita.sh non esiste: nessuna voce e' eseguita."
else
  DICH_18="$(bash "$ESEC" --dichiara 2>&1)"
  if [ $? -ne 0 ]; then
    rosso "il runner non sa dichiarare cosa esercita:
$(printf '%s\n' "$DICH_18" | sed 's/^/         /')"
  else
    ATTESI="$(while read -r v; do [ -n "$v" ] || continue; echo "${v}_rollback.sql"; done <<<"$DICHIARATE" | sort)"
    DICH_18="$(printf '%s\n' "$DICH_18" | sed '/^$/d' | sort)"
    if [ "$ATTESI" != "$DICH_18" ]; then
      rosso "il runner non esercita l'insieme del manifesto:
$(diff <(printf '%s\n' "$ATTESI") <(printf '%s\n' "$DICH_18") | sed 's/^/         /')"
    else
      echo "  ok     il runner 18 dichiara ed esercita gli stessi $(printf '%s\n' "$ATTESI" | grep -c .) rollback del manifesto"
    fi
  fi
fi

# Cio' che sta fuori ambito ma non ha rollback: dichiarato, non nascosto.
echo
echo "== fuori ambito, ma senza rollback (dichiarato, non silenziato) =="
fuori=0
ls -1 "$MIG"/*.sql | while read -r f; do
  b="$(basename "$f" .sql)"; v="${b%%_*}"
  awk -v v="$v" -v c="$CONFINE" 'BEGIN{exit !(v+0 < c+0 && v+0 > 20260818084202)}' || continue
  [ -f "$ROLL/${b}_rollback.sql" ] || echo "  (fuori ambito) $b"
done
echo "  Sono le forward-only del filone precedente: sopra la baseline"
echo "  20260818084202 e sotto il confine $CONFINE del blocco 3B."
echo "  Non le copre questo gate, e sei di esse restano ESCLUSE anche"
echo "  dall'apply (120002, 120003, 120005, 120006, 120007, 120008)."

echo
if [ "$esito" -ne 0 ]; then
  echo "ROSSO: il manifesto e il disco non concordano, o manca un test di rollback."
  [ "$senza" -gt 0 ] && echo "       $senza forward-only su $(grep -c . <<<"$DICHIARATE") non hanno un file di rollback."
  exit 1
fi
echo "VERDE: $(grep -c . <<<"$DICHIARATE") forward-only dichiarate, tutte sul disco e tutte con rollback."
