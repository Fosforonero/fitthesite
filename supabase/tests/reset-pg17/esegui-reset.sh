#!/usr/bin/env bash
# Reset completo su un Postgres 17 usa-e-getta.
# NON tocca mai supabase_db_fitmesh, che e' il container condiviso.
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
MIG="$(cd "$QUI/../../migrations" && pwd)"
CONT="pg17-190-reset"
DB="ricostruzione"

echo "=== container usa-e-getta $CONT ==="
docker rm -f "$CONT" >/dev/null 2>&1
docker run -d --name "$CONT" -e POSTGRES_PASSWORD=usaegetta -e POSTGRES_DB="$DB" postgres:17 >/dev/null
# pg_isready da solo non basta: risponde gia' durante l'inizializzazione,
# quando il server accetta connessioni ma sta ancora per riavviarsi. Serve
# una query vera, ripetuta finche' non passa due volte di fila.
pronto=0
for i in $(seq 1 90); do
  if docker exec "$CONT" psql -U postgres -d "$DB" -t -A -c "select 1" >/dev/null 2>&1; then
    pronto=$((pronto+1))
    [ "$pronto" -ge 2 ] && break
  else
    pronto=0
  fi
  sleep 1
done
if [ "$pronto" -lt 2 ]; then echo "il container non e' diventato pronto"; exit 1; fi
docker exec "$CONT" psql -U postgres -d "$DB" -t -A -c "select version()" | head -1


echo "=== control file per pg_cron e pg_net simulati ==="
docker exec "$CONT" bash -c '
D=/usr/share/postgresql/17/extension
printf "comment = \x27pg_cron simulato\x27\ndefault_version = \x271.6\x27\nrelocatable = false\nschema = pg_catalog\n" > $D/pg_cron.control
printf -- "-- simulato dal preambolo\n" > $D/pg_cron--1.6.sql
printf "comment = \x27pg_net simulato\x27\ndefault_version = \x270.14\x27\nrelocatable = false\nschema = pg_catalog\n" > $D/pg_net.control
printf -- "-- simulato dal preambolo\n" > $D/pg_net--0.14.sql
'
echo "=== preambolo (ruoli, auth, cron/net simulati) ==="
perr=$(docker exec -i "$CONT" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q < "$QUI/00-preambolo-ruoli-supabase.sql" 2>&1 | grep -E '^(ERROR|FATAL)')
if [ -n "$perr" ]; then echo "preambolo fallito:"; echo "$perr"; exit 1; fi
echo "preambolo applicato"

echo "=== catena: $(ls "$MIG"/*.sql | wc -l | tr -d ' ') migration ==="
ok=0; ko=0
: > "$QUI/esito-reset.txt"
shopt -s nullglob
for f in "$MIG"/*.sql; do
  nome=$(basename "$f")
  err=$(docker exec -i "$CONT" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q < "$f" 2>&1 | grep -E '^(ERROR|FATAL)' | head -3)
  if [ -z "$err" ]; then
    ok=$((ok+1)); echo "OK   $nome" >> "$QUI/esito-reset.txt"
  else
    ko=$((ko+1)); echo "KO   $nome" >> "$QUI/esito-reset.txt"
    echo "$err" | sed 's/^/       /' >> "$QUI/esito-reset.txt"
    printf '  KO  %s\n' "$nome"
    echo "$err" | head -1 | sed 's/^/        /'
  fi
done
echo
echo "=== $ok applicate, $ko fallite ==="
echo "dettaglio in $QUI/esito-reset.txt"
