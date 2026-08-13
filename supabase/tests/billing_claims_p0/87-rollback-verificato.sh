#!/usr/bin/env bash
#
# UN ROLLBACK CHE NON E' STATO ESEGUITO NON E' UN ROLLBACK VERIFICATO.
#
# Il difetto che ha reso necessario questo file: il rollback della migration
# degli stati faceva
#
#     drop function if exists public.record_store_purchase_revocation(
#       text, text, text, text, timestamptz, text);
#
# cioe' la firma a SEI argomenti, mentre la funzione viva ne ha SETTE da quando
# 20260812093000 ha separato l'efficacia del rimborso dalla freschezza della
# fotografia. `drop function if exists` con la firma sbagliata non e' un errore
# rumoroso: non trova niente e passa in silenzio. Il rollback sembrava riuscito
# e lasciava in piedi una funzione che, dopo il `drop table` della riga
# successiva, puntava a una tabella inesistente.
#
# Un controllo statico — "ogni firma creata compare in qualche rollback" —
# avrebbe preso questo caso e non altri: le dipendenze fra oggetti, l'ordine dei
# drop, un trigger che impedisce di droppare la sua tabella. Quelli si vedono
# solo eseguendo.
#
# ── COME SI ESEGUE SENZA DISTRUGGERE NIENTE ────────────────────────────────
#
# Tutto dentro UNA transazione che finisce in `rollback`. In PostgreSQL il DDL
# e' transazionale: `drop function`, `drop trigger`, `drop table` e
# `alter table` si annullano come qualunque altra cosa. Alla fine il database
# e' identico a com'era, e nel frattempo abbiamo visto se i drop trovano
# davvero qualcosa e se l'ordine regge.
#
# I file di rollback contengono `begin;` e `commit;` propri: vanno tolti, o il
# commit renderebbe permanente cio' che stiamo solo provando. E' l'unica
# modifica applicata al loro contenuto, ed e' meccanica.
set -uo pipefail

CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../rollback" && pwd)"
FAIL=0
fail() { echo "  FAIL - $1"; FAIL=$((FAIL + 1)); }

docker exec "$CID" true >/dev/null 2>&1 || { echo "ROLLBACK: container non raggiungibile"; exit 1; }

echo "############### IL ROLLBACK, ESEGUITO PER DAVVERO ###############"

# ── L'inventario di cio' che deve sparire ──────────────────────────────────
#
# Non una lista scritta a mano: si interroga il catalogo. Una funzione nuova
# aggiunta domani e dimenticata nei rollback finisce qui dentro da sola.
INVENTARIO="
  select coalesce(string_agg(nome, E'\n' order by nome), '') from (
    select n.nspname || '.' || p.proname || '(' ||
           pg_catalog.pg_get_function_identity_arguments(p.oid) || ')' as nome
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'private' and p.proname like '%billing%')
       or (n.nspname = 'private' and p.proname like '%b2c%')
       or (n.nspname = 'public'  and p.proname in
             ('claim_store_purchase','record_store_purchase_revocation'))
    union all
    select 'trigger ' || t.tgname || ' su ' || t.tgrelid::regclass::text
    from pg_catalog.pg_trigger t
    where not t.tgisinternal
      and (t.tgname like '%billing%' or t.tgname like '%b2c%')
      -- Non e' roba di questo lavoro: esiste da 20260514120004, tiene
      -- aggiornato updated_at e nessun rollback del billing deve toglierlo.
      and t.tgname <> 'trg_b2c_subscriptions_updated_at'
    union all
    select 'tabella ' || c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private' and c.relkind = 'r' and c.relname like 'billing%'
  ) s;"

PRIMA=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "$INVENTARIO")
N_PRIMA=$(printf '%s\n' "$PRIMA" | grep -c . || true)
echo "oggetti billing presenti prima: ${N_PRIMA}"
[ "$N_PRIMA" -gt 5 ] || { echo "ROLLBACK: FATAL - il database non ha le migration applicate (${N_PRIMA} oggetti)"; exit 1; }

# ── La prova ───────────────────────────────────────────────────────────────
#
# I tre rollback in ordine inverso di applicazione, piu' il controllo finale,
# tutto in una transazione sola che si annulla.
SENZA_TRANSAZIONE=$(
  for f in 20260813103000_billing_sandbox_reviewers_rollback.sql \
           20260812093000_billing_p0_nove_punti_rollback.sql \
           20260810140000_b2c_projection_guard_rollback.sql \
           20260810120000_billing_purchase_states_rollback.sql \
           20260808211929_billing_purchase_claims_registry_rollback.sql; do
    echo "\\echo '--- $f ---'"
    # Via `begin;`, `commit;` e le meta-direttive psql che non si possono
    # annidare. Il contenuto vero resta intatto.
    grep -v -E "^\s*(begin|commit)\s*;|^\\\\set ON_ERROR_STOP|^\\\\if|^\\\\else|^\\\\endif" "$DIR/$f"
  done
)

docker exec -i -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA \
  -v ON_ERROR_STOP=1 > /tmp/rollback-prova.out 2>&1 <<SQL
begin;
-- Le due variabili che i file si aspettano gia' impostate: qui si forza,
-- perche' provare il rollback su un database vuoto non proverebbe niente.
select set_config('claims.rollback_force', '1', false);
select set_config('states.rollback_force', '1', false);
\set states_rollback_force 1
\set claims_rollback_force 1
${SENZA_TRANSAZIONE}

-- ── Il controllo: non deve restare NIENTE ───────────────────────────────
do \$\$
declare v_resti text;
begin
  select coalesce(string_agg(nome, ', ' order by nome), '') into v_resti from (
    select n.nspname || '.' || p.proname || '/' || p.pronargs as nome
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'private' and (p.proname like '%billing%' or p.proname like '%b2c%'))
       or (n.nspname = 'public' and p.proname in
             ('claim_store_purchase','record_store_purchase_revocation'))
    union all
    select 'trigger:' || t.tgname
    from pg_catalog.pg_trigger t
    where not t.tgisinternal and (t.tgname like '%billing%' or t.tgname like '%b2c%')
      and t.tgname <> 'trg_b2c_subscriptions_updated_at'
    union all
    select 'tabella:' || c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private' and c.relkind = 'r' and c.relname like 'billing%'
  ) s;

  if v_resti <> '' then
    raise exception 'ROLLBACK INCOMPLETO, sopravvivono: %', v_resti;
  end if;
  raise notice 'ROLLBACK COMPLETO: nessun oggetto billing sopravvive';
end \$\$;

rollback;
SQL
ESITO=$?

if [ "$ESITO" -ne 0 ]; then
  fail "l'esecuzione dei rollback e' fallita"
  sed -n '1,40p' /tmp/rollback-prova.out | sed 's/^/    /'
elif grep -q 'ROLLBACK INCOMPLETO' /tmp/rollback-prova.out; then
  fail "$(grep -m1 'ROLLBACK INCOMPLETO' /tmp/rollback-prova.out)"
elif ! grep -q 'ROLLBACK COMPLETO' /tmp/rollback-prova.out; then
  fail "il controllo finale non e' stato raggiunto (vedi /tmp/rollback-prova.out)"
else
  echo "CASO 1: PASS (i rollback tolgono tutto cio' che le migration creano)"
fi

# ── E il database non si e' mosso ──────────────────────────────────────────
DOPO=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "$INVENTARIO")
if [ "$PRIMA" != "$DOPO" ]; then
  fail "la prova ha lasciato il database diverso da come lo ha trovato"
  diff <(printf '%s\n' "$PRIMA") <(printf '%s\n' "$DOPO") | head -20 | sed 's/^/    /'
else
  echo "CASO 2: PASS (la prova non ha modificato niente: ${N_PRIMA} oggetti, prima e dopo)"
fi

echo ""
echo "=================================================="
if [ "$FAIL" -eq 0 ]; then
  echo "ROLLBACK: verificato eseguendolo, non leggendolo"
  echo "=================================================="
  exit 0
fi
echo "ROLLBACK: ${FAIL} FALLIMENTI (output in /tmp/rollback-prova.out)"
echo "=================================================="
exit 1
