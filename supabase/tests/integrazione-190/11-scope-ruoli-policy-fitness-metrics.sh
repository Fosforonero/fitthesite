#!/usr/bin/env bash
# Nessuna migration della catena puo' creare una policy su fitness_metrics
# senza scoparla esplicitamente a un ruolo. Una CREATE POLICY senza clausola
# TO finisce a PUBLIC, che e' il difetto del 30/07/2026: due migration
# consecutive lasciarono 'caregiver select subjects metrics' e
# 'metrics_select_via_group' scoped a PUBLIC invece che ad authenticated.
#
# Questo controllo e' statico e guarda i sorgenti, non un database: serve a
# impedire che il difetto rientri, non a misurare lo stato live.
set -uo pipefail
MIG="$(cd "$(dirname "$0")/../../migrations" 2>/dev/null && pwd)" || MIG=""
esito=0

# Uno script che non trova niente da esaminare NON e' verde: e' rotto. Senza
# questo blocco, spostare il file o rinominare la cartella produce un verde
# che non ha guardato nemmeno una riga.
if [ -z "$MIG" ] || [ ! -d "$MIG" ]; then
  echo "ROSSO: la cartella delle migration non esiste ($MIG). Niente da esaminare."
  exit 1
fi
shopt -s nullglob
da_esaminare=( "$MIG"/*.sql )
if [ "${#da_esaminare[@]}" -eq 0 ]; then
  echo "ROSSO: zero file .sql in $MIG. Niente da esaminare."
  exit 1
fi

# Estrae ogni CREATE POLICY ... ON public.fitness_metrics e controlla che il
# blocco fino al primo USING/WITH CHECK contenga una clausola TO.
controlla () {
  local file="$1"
  awk '
    BEGIN{IGNORECASE=1}
    /create[ \t]+policy/ {dentro=1; blocco=""; nome=$0}
    dentro {blocco = blocco " " $0}
    dentro && /using|with[ \t]+check/ {
      if (blocco ~ /on[ \t]+public\.fitness_metrics/) {
        if (blocco !~ /[ \t]to[ \t]+[a-z_]+/) { print nome }
      }
      dentro=0
    }
  ' "$file"
}

# Eccezione tracciata, UNA SOLA. Non e' un'assoluzione: e' il riconoscimento
# che questa migration e' gia' applicata in produzione, quindi riscriverla
# creerebbe deriva col remoto, e che lo stato live viene corretto altrove.
# Chi la togliesse da qui senza togliere anche la forward-only riaprirebbe il
# buco. Una migration NON in questa lista fa fallire il controllo.
ECCEZIONE_FILE="${ECCEZIONE_FILE:-20260816100824_entitlement_gate_scritture_salute.sql}"
ECCEZIONE_PERCHE="gia' applicata in produzione (riscriverla = deriva col remoto); lo scope ruoli e' corretto da 20260825120001_scope_ruoli_e_revoche.sql con ALTER POLICY, che non tocca qual ne' with check"

echo "=== policy su fitness_metrics create senza clausola TO (${#da_esaminare[@]} file esaminati) ==="
trovate=0
tracciate=0
for f in "${da_esaminare[@]}"; do
  out=$(controlla "$f")
  [ -z "$out" ] && continue
  nome=$(basename "$f")
  if [ "$nome" = "$ECCEZIONE_FILE" ]; then
    echo "  TRACCIATA  $nome"
    echo "$out" | sed 's/^/             /'
    echo "             perche': $ECCEZIONE_PERCHE"
    tracciate=$((tracciate+1))
  else
    echo "  ROSSO  $nome"
    echo "$out" | sed 's/^/         /'
    trovate=$((trovate+1)); esito=1
  fi
done
[ "$trovate" -eq 0 ] && [ "$tracciate" -eq 0 ] && echo "  verde: nessuna."
[ "$trovate" -eq 0 ] && [ "$tracciate" -gt 0 ] && echo "  verde: nessuna nuova. $tracciate tracciata/e sopra."

# Se l'eccezione smette di servire, deve smettere di esistere: un'eccezione
# che non corrisponde piu' a niente e' una bugia che invecchia in silenzio.
if [ "$tracciate" -eq 0 ] && [ -f "$MIG/$ECCEZIONE_FILE" ]; then
  echo
  echo "  ROSSO  l'eccezione tracciata non serve piu': $ECCEZIONE_FILE non ha"
  echo "         piu' policy senza TO. Toglierla da questo script."
  esito=1
fi

# CONTROLLO POSITIVO — la sonda deve saper fallire.
# Ricostruisce il difetto storico e verifica che venga visto.
echo
echo "=== controllo positivo: la sonda vede una policy senza TO? ==="
tmp=$(mktemp -d)
cat > "$tmp/finta.sql" <<'FINTA'
create policy "policy insicura di prova" on public.fitness_metrics
  for select
  using ( user_id = auth.uid() );
FINTA
if [ -n "$(controlla "$tmp/finta.sql")" ]; then
  echo "  verde: la sonda la vede."
else
  echo "  ROSSO: la sonda NON vede il difetto: il verde sopra non vale niente."
  esito=1
fi
# E deve NON allarmarsi su una policy corretta.
cat > "$tmp/finta2.sql" <<'FINTA2'
create policy "policy corretta di prova" on public.fitness_metrics
  for select
  to authenticated
  using ( user_id = auth.uid() );
FINTA2
if [ -z "$(controlla "$tmp/finta2.sql")" ]; then
  echo "  verde: non si allarma su una policy corretta."
else
  echo "  ROSSO: falso positivo su una policy corretta."
  esito=1
fi
rm -rf "$tmp"

echo
[ "$esito" -eq 0 ] && echo "ESITO: verde" || echo "ESITO: rosso"
exit "$esito"
