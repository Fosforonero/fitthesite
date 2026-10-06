#!/usr/bin/env bash
# Prova applicativa dell'export web con BACKEND LOCALE VERO (vedi export-applicativo.prova.tsx).
#
# Cosa fa: ricostruisce un Postgres 17 usa-e-getta dalle migration, ci mette dati SINTETICI, avvia un PostgREST
# vero davanti (RLS attiva, JWT firmato), esegue il componente vero dell'export (e, come controllo, quello di
# main) con identita' `authenticated` sintetiche, poi distrugge SOLO cio' che ha creato (nomi unici per ogni
# esecuzione, mai `docker rm -f` su nomi altrui). NON tocca supabase_*, NON legge la produzione, NON scarica
# l'immagine di PostgREST (se manca si ferma; l'immagine postgres:17 la usa il resto dei gate del repository).
#
# Requisiti: Docker raggiungibile (colima start), immagine PostgREST gia' presente in locale.
# Uso: bash tools/prove-locali/export-applicativo/esegui.sh [cartella-log]
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$QUI/../../.." && pwd)"
LOG="${1:-$QUI/.generato}"
# Nomi UNICI per ogni esecuzione e porta libera scelta dal sistema: due esecuzioni (o un container di un altro
# processo) non possono collidere. Se si forzano i nomi e il nome esiste gia', lo script SI FERMA: non fa mai
# `docker rm -f` su qualcosa che non ha creato lui.
SUFFISSO="$$-$RANDOM"
PG="${PG_NAME:-pg17-export-app-$SUFFISSO}"
REST="${REST_NAME:-postgrest-export-app-$SUFFISSO}"
NET="${NET_NAME:-export-app-net-$SUFFISSO}"
PORTA="${REST_PORTA:-$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')}"
IMG="${POSTGREST_IMAGE:-public.ecr.aws/supabase/postgrest:v14.15}"
COMPONENTE="app/(frontend)/[locale]/app/export/ExportDataClient.tsx"
BASE_MAIN="${BASE_MAIN:-b85870a9d43cd9a2389566311fab8e5fd60ec2ee}"
mkdir -p "$LOG" "$QUI/.generato"

for n in "$PG" "$REST"; do
  case "$n" in supabase_*) echo "ROSSO: nome vietato ($n): sono i container condivisi"; exit 2 ;; esac
done
docker info >/dev/null 2>&1 || { echo "ROSSO: Docker non risponde (colima start)."; exit 2; }
docker image inspect "$IMG" >/dev/null 2>&1 || { echo "ROSSO: l'immagine $IMG non c'e' in locale (non la scarico)."; exit 2; }

for n in "$PG" "$REST"; do
  if docker ps -a --format '{{.Names}}' | grep -qx "$n"; then echo "ROSSO: il container $n esiste gia': non lo tocco (cambia PG_NAME / REST_NAME)."; exit 2; fi
done
if docker network ls --format '{{.Name}}' | grep -qx "$NET"; then echo "ROSSO: la rete $NET esiste gia': non la tocco (cambia NET_NAME)."; exit 2; fi

CREATI=""   # solo cio' che questa esecuzione ha creato
pulisci() {
  case "$CREATI" in *rest*) docker rm -f "$REST" >/dev/null 2>&1 ;; esac
  case "$CREATI" in *pg*)   docker rm -f "$PG" >/dev/null 2>&1 ;; esac
  case "$CREATI" in *net*)  docker network rm "$NET" >/dev/null 2>&1 ;; esac
}
trap pulisci EXIT
trap 'exit 130' INT TERM

echo "== 1) Postgres 17 usa-e-getta dalle migration (container $PG, porta REST $PORTA) =="
CREATI="$CREATI pg"
CONT_NAME="$PG" DB_NAME=ricostruzione ESITO_FILE="$LOG/esito-reset.txt" bash "$REPO/supabase/tests/reset-pg17/esegui-reset.sh" > "$LOG/1-reset.log" 2>&1 \
  || { echo "ROSSO: ricostruzione"; tail -5 "$LOG/1-reset.log"; exit 1; }
grep -E 'applicate' "$LOG/1-reset.log" | tail -1

echo "== 2) dati sintetici e ruolo authenticator =="
docker exec -i "$PG" psql -U postgres -d ricostruzione -v ON_ERROR_STOP=1 < "$QUI/seed.sql" > "$LOG/2-seed.log" 2>&1 \
  || { echo "ROSSO: seed"; tail -5 "$LOG/2-seed.log"; exit 1; }

echo "== 3) PostgREST vero (RLS attiva, max_rows 1000 come Supabase) =="
SEGRETO="$(openssl rand -hex 24)"
 docker network create "$NET" >/dev/null && CREATI="$CREATI net" && docker network connect "$NET" "$PG" || { echo "ROSSO: rete"; exit 1; }
CREATI="$CREATI rest"
docker run -d --name "$REST" --network "$NET" -p "127.0.0.1:$PORTA:3000" \
  -e PGRST_DB_URI="postgres://authenticator:usaegetta@$PG:5432/ricostruzione" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$SEGRETO" -e PGRST_DB_MAX_ROWS=1000 "$IMG" >/dev/null || { echo "ROSSO: PostgREST non parte"; exit 1; }
n=0
until [ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORTA/")" = "200" ] || [ $n -ge 40 ]; do sleep 2; n=$((n+1)); done
[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORTA/")" = "200" ] || { echo "ROSSO: PostgREST non risponde"; docker logs "$REST" 2>&1 | tail -5; exit 1; }
echo "PostgREST: $(docker logs "$REST" 2>&1 | grep -c 'Schema cache loaded') caricamenti di schema, risponde 200"

echo "== 4) componente di main per il CONTROLLO =="
git -C "$REPO" show "$BASE_MAIN:$COMPONENTE" > "$QUI/.generato/ExportDataClientMain.tsx" || { echo "ROSSO: main non leggibile"; exit 1; }

echo "== 5) prova applicativa =="
cd "$REPO" || exit 1
POSTGREST_URL="http://127.0.0.1:$PORTA" JWT_SECRET="$SEGRETO" PG_CONTAINER="$PG" \
  npx vitest run --config tools/prove-locali/export-applicativo/vitest.config.ts --reporter=verbose > "$LOG/5-prova.log" 2>&1
ESITO=$?
grep -E '✓|✗|×|Test Files|Tests |FAIL|AssertionError' "$LOG/5-prova.log" | cut -c1-220 | tail -25
echo "esito prova: $ESITO"

echo "== 6) distruzione =="
pulisci
trap - EXIT
if docker ps -a --format '{{.Names}}' | grep -qE "^($PG|$REST)$" || docker network ls --format '{{.Name}}' | grep -qx "$NET"; then echo "ROSSO: container o rete ancora presenti"; exit 1; else echo "ok: container e rete rimossi"; fi
exit $ESITO
