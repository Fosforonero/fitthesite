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
MIG="$(cd "$(dirname "$0")/../../migrations" && pwd)"
esito=0

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

echo "=== policy su fitness_metrics create senza clausola TO ==="
trovate=0
for f in "$MIG"/*.sql; do
  out=$(controlla "$f")
  if [ -n "$out" ]; then
    echo "  ROSSO  $(basename "$f")"
    echo "$out" | sed 's/^/         /'
    trovate=$((trovate+1)); esito=1
  fi
done
[ "$trovate" -eq 0 ] && echo "  verde: nessuna."

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
