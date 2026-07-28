#!/usr/bin/env bash
# Sprint P0.10A — verifica delle migration Founder REALI (non riscritte, a
# parte 20260728090000 che E' l'oggetto di questa revisione) su
# supabase/postgres reale (auth.users/auth.uid()/ruoli/owner veri —
# supabase_auth_admin possiede auth.users, postgres non e' superuser ma e'
# membro di supabase_auth_admin — lo stesso identico setup di produzione).
#
# NON un replay completo delle ~50 migration del repo (known-issues.md
# documenta 2 bug pre-esistenti indipendenti che lo bloccherebbero). Qui si
# crea solo lo schema minimo di supporto (00-minimal-schema.sql, ereditato
# da Sprint P0.7) sopra cui la catena Founder REALE di QUESTO branch si
# applica cosi' come e' nel repo: 20260720120247 (live in produzione dal
# 2026-07-20), non 20260720090000 (quella era di un altro worktree, non
# esiste in questo branch).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$REPO_ROOT/supabase/tests/founder_p010a"
MIGRATIONS="$REPO_ROOT/supabase/migrations"
IMAGE="public.ecr.aws/supabase/postgres:15.8.1.085"
CID="founder-p010a-pg-$$"

CHAIN=(
  "$MIGRATIONS/20260714112434_first_sync_activation_tracking.sql"
  "$MIGRATIONS/20260714123833_first_sync_activation_tracking_revoke_anon.sql"
  "$MIGRATIONS/20260714123911_first_sync_legacy_activation_backfill.sql"
  "$MIGRATIONS/20260715095915_handle_new_founder_exclude_invalid_tld.sql"
  "$MIGRATIONS/20260715183049_disable_founder_launch_autogrant_trigger.sql"
  "$MIGRATIONS/20260720055513_founder_launch_first_sync_grant.sql"
  "$MIGRATIONS/20260720120247_founder_launch_exclude_review_email_alias.sql"
  "$MIGRATIONS/20260728090000_founder_launch_cutoff_and_window.sql"
)

cleanup() { docker rm -f "$CID" >/dev/null 2>&1 || true; }
trap cleanup EXIT

log() { echo "== $* =="; }

_fresh_db_with_chain() {
  docker rm -f "$CID" >/dev/null 2>&1 || true
  docker run -d --name "$CID" -e POSTGRES_PASSWORD=postgres -e POSTGRES_HOST=/var/run/postgresql "$IMAGE" >/dev/null
  local tries=0
  until docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -q -X -t -A -c "select 1;" >/dev/null 2>&1; do
    tries=$((tries + 1))
    if [ "$tries" -gt 60 ]; then echo "timeout avvio $IMAGE"; docker logs "$CID" | tail -30; exit 1; fi
    sleep 1
  done
  sleep 5

  docker cp "$DIR/00-minimal-schema.sql" "$CID":/tmp/apply.sql >/dev/null
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql >/dev/null

  # Gap documentato (Sprint P0.7 + P0.10A): lo schema private non e' creato
  # da nessuna migration in git — deve esistere gia' in produzione da
  # un'azione non tracciata.
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "create schema if not exists private; revoke all on schema private from public, anon, authenticated;" >/dev/null

  for f in "${CHAIN[@]}"; do
    docker cp "$f" "$CID":/tmp/apply.sql >/dev/null
    docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql >/dev/null
  done

  docker cp "$DIR/01-test-helpers.sql" "$CID":/tmp/apply.sql >/dev/null
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/apply.sql >/dev/null
}

run_test_file() {
  local file="$1"
  local pguser="${2:-postgres}"
  docker cp "$file" "$CID":/tmp/test.sql >/dev/null
  docker exec -e PGPASSWORD=postgres "$CID" psql -U "$pguser" -d postgres -v ON_ERROR_STOP=1 -f /tmp/test.sql
}

log "1/7 - catena migration reale + 20260728090000 (fresh)"
_fresh_db_with_chain
log "chain OK"

log "2/7 - test funzionali (cutoff/finestra/cap-riservato/esito persistito)"
run_test_file "$DIR/10-functional-tests.sql"

log "3/7 - test GDPR (container dedicato, fresh)"
_fresh_db_with_chain
# supabase_admin (superuser sull'immagine ufficiale) invece di postgres:
# su questo tag postgres NON e' membro di supabase_auth_admin (a differenza
# di quanto documentato in Sprint P0.7 su un tag immagine diverso,
# 15.8.1.044 vs 15.8.1.085 qui disponibile) - un ruolo non-superuser non
# puo' SET ROLE verso un ruolo di cui non e' membro. supabase_admin puo'
# SET ROLE verso qualunque ruolo per definizione di superuser.
run_test_file "$DIR/20-gdpr-tests.sql" supabase_admin

log "4/7 - test ACL (container dedicato, fresh)"
_fresh_db_with_chain
run_test_file "$DIR/30-acl-tests.sql"

log "5/7 - esclusione email + cutoff/finestra attivi insieme (container dedicato, fresh)"
_fresh_db_with_chain
run_test_file "$DIR/40-exclusion-combined-with-cutoff-window.sql"

log "6/7 - multi-device (container dedicato, fresh)"
_fresh_db_with_chain
run_test_file "$DIR/50-multidevice-tests.sql"

log "7/8 - esito terminale: salta la RPC/query ridondanti (container dedicato, fresh)"
_fresh_db_with_chain
run_test_file "$DIR/60-terminal-fastpath-tests.sql"

log "8/8 - concorrenza (container dedicato, fresh)"
_fresh_db_with_chain
bash "$DIR/70-concurrency.sh" "$CID"

echo ""
echo "=========================================="
echo "Sprint P0.10A: TUTTE LE VERIFICHE OK"
echo "=========================================="
