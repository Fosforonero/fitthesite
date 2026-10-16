#!/usr/bin/env bash
# ============================================================================
# Rollback di 20260924120000 (verdetto di accesso alla dashboard web): le GUARDIE,
# le MODALITA' di esecuzione e lo script di PRECONDIZIONI, su PG17 usa-e-getta.
#
# Il gate 18 prova apply/rollback/impronta nelle due modalita' per TUTTO il manifesto;
# questo prova cio' che 18 non prova: che il rollback RIFIUTI quando deve, che non
# lasci mezze rimozioni, che sia neutro rispetto alla transazione del chiamante, e che le
# precondizioni diano rosso quando una dipendenza manca. Solo banco: mai un database
# condiviso, mai produzione. Ogni caso usa un database copiato da un modello (le sole
# migration PRECEDENTI a questa: oggi e' l'ultima della catena, quindi coincide con «tutta la catena meno questa») e lo
# distrugge. UNA corsa alla volta per container: i nomi dei database (rb24_*) sono fissi.
#
#   bash 24-rollback-verdetto-dashboard.sh                 casi
#   bash 24-rollback-verdetto-dashboard.sh --autocontrollo  rompe di proposito il rollback in 7
#                                                           modi e pretende che i casi diventino rossi
# Variabili: CONT_NAME (container PG17 del banco, default pg17-190-reset),
#            ROLLBACK_FILE (per l'autocontrollo: file di rollback da provare).
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/../../.." && pwd)"
MIG="$RADICE/supabase/migrations"
ROLL="$RADICE/supabase/rollback"
VERS=20260924120000
NOME=20260924120000_web_dashboard_access_verdict
MIGRATION="$MIG/$NOME.sql"
RB="${ROLLBACK_FILE:-$ROLL/${NOME}_rollback.sql}"
PRE="$ROLL/${NOME}_precondizioni.sql"
IMPRONTA="$RADICE/supabase/tests/reset-pg17/impronta-completa.sql"
PREAMBOLO="$RADICE/supabase/tests/reset-pg17/00-preambolo-ruoli-supabase.sql"
CONT="${CONT_NAME:-pg17-190-reset}"
MODELLO=rb24_modello
MODO="${1:-}"

# ── autocontrollo ───────────────────────────────────────────────────────────
if [ "$MODO" = "--autocontrollo" ]; then
  echo "== autocontrollo: i casi sanno diventare rossi? =="
  T="$(mktemp -d)"
  # Il modello (catena senza questa migration) si costruisce UNA volta e lo riusano tutti i mutanti.
  trap 'rm -rf "${T:?}"; docker exec "$CONT" psql -U postgres -d postgres -q -c "drop database if exists '"$MODELLO"';" >/dev/null 2>&1' EXIT
  mut() { # nome  perl-espressione
    local n="$1" e="$2"
    local f="$T/$n.sql"
    perl -0pe "$e" "$RB" > "$f"
    if cmp -s "$f" "$RB"; then echo "  ROSSO  mutante $n non applicato (nessuna differenza)"; ESITO=1; return; fi
    RIUSA_MODELLO=1 ROLLBACK_FILE="$f" bash "$0" > "$T/$n.log" 2>&1; local c=$?
    if [ "$c" -ne 0 ]; then echo "  ok     mutante $n: il gate diventa rosso ($(grep -c 'ROSSO' "$T/$n.log") casi)"
    else echo "  ROSSO  mutante $n: il gate resta VERDE"; ESITO=1; fi
  }
  ESITO=0
  # il gate sul file reale deve essere verde, altrimenti l'autocontrollo non misura niente
  RIUSA_MODELLO=1 bash "$0" > "$T/reale.log" 2>&1 || { echo "  ROSSO  il gate sul file reale non e' verde"; tail -5 "$T/reale.log"; exit 1; }
  echo "  ok     gate sul file reale: verde"
  mut M1-senza-guardia-md5     's/if v_pub is distinct from c_md5_pub or v_priv is distinct from c_md5_priv then/if false then/'
  mut M2-con-cascade           's/drop function public\.get_web_dashboard_access\(\);/drop function public.get_web_dashboard_access() cascade;/'
  mut M3-senza-stato-parziale  's/if v_n <> 2 or v_exact <> 2 then/if false then/'
  mut M4-con-begin-commit      's/^(do \$rollback\$)/begin;\n$1/m; s/\$rollback\$;\s*$/\$rollback\$;\ncommit;\n/'
  mut M5-non-idempotente       's/if v_n = 0 then/if false then/'
  mut M6-md5-sbagliato         's/(c_md5_pub\s+constant text := \x27)[0-9a-f]{32}/${1}00000000000000000000000000000000/'
  mut M7-senza-lock-timeout    "s/perform pg_catalog\.set_config\('lock_timeout', '5s', true\);//"
  [ "$ESITO" -eq 0 ] && echo "VERDE: l'autocontrollo ha reso rosso il gate in tutti e 7 i modi" && exit 0
  echo "ROSSO: almeno un difetto non e' visto dal gate"; exit 1
fi

# ── infrastruttura ──────────────────────────────────────────────────────────
for f in "$RB" "$PRE" "$MIGRATION" "$IMPRONTA" "$PREAMBOLO"; do
  [ -f "$f" ] || { echo "ROSSO: manca $f"; exit 1; }
done
docker exec "$CONT" psql -U postgres -d postgres -tAc "select 1" >/dev/null 2>&1 || { echo "ROSSO: il container $CONT non risponde"; exit 1; }
TMPD="$(mktemp -d)"
IMP_C="/tmp/imp24-$$.sql"
docker cp "$IMPRONTA" "$CONT":"$IMP_C" >/dev/null
esito=0
ok()    { echo "  ok     $*"; }
rosso() { echo "  ROSSO  $*"; esito=1; }
pg()    { docker exec -i "$CONT" psql -U postgres -X -q -v ON_ERROR_STOP=1 "$@"; }
sqlv()  { docker exec "$CONT" psql -U postgres -d "$1" -X -tAc "$2" 2>/dev/null; }
file_in() { # db file [opzioni psql]
  local db="$1" f="$2"; shift 2
  docker exec -i "$CONT" psql -U postgres -d "$db" -X -q -v ON_ERROR_STOP=1 "$@" < "$f" > $TMPD/ultimo.log 2>&1
  return $?
}
impronta() { docker exec "$CONT" psql -U postgres -d "$1" -X -q -f "$IMP_C" 2>&1; }
nfun()  { sqlv "$1" "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname,p.proname) in (('public','get_web_dashboard_access'),('private','web_dashboard_verdict'))"; }
md5fun() { sqlv "$1" "select string_agg(md5(prosrc),',' order by proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname,p.proname) in (('public','get_web_dashboard_access'),('private','web_dashboard_verdict'))"; }
nuovo() { pg -d postgres -c "drop database if exists $1;" -c "create database $1 template $MODELLO;" >/dev/null 2>&1; }
via()   { pg -d postgres -c "drop database if exists $1;" >/dev/null 2>&1 || echo "  AVVISO: drop di $1 non riuscito" >&2; }
CASI="rb24_a rb24_b rb24_c rb24_d rb24_e rb24_f rb24_g rb24_h rb24_i rb24_j rb24_k rb24_l rb24_m"
pulisci() { for d in $CASI; do via "$d"; done; [ -n "${RIUSA_MODELLO:-}" ] || via "$MODELLO"; }
trap 'pulisci; rm -rf "${TMPD:?}"; docker exec "$CONT" rm -f "$IMP_C" >/dev/null 2>&1' EXIT

echo "== rollback di $VERS: guardie, modalita', precondizioni (container $CONT) =="
echo "   rollback sotto prova: $(basename "$RB")"

# ── modello: catena completa MENO questa migration ──────────────────────────
# RIUSA_MODELLO=1 (solo l'autocontrollo lo imposta): se il modello esiste gia' non si ricostruisce e non si distrugge.
n="riusato"
if [ -n "${RIUSA_MODELLO:-}" ] && [ "$(sqlv postgres "select 1 from pg_database where datname='$MODELLO'")" = "1" ]; then
  :
else
  via "$MODELLO"
  pg -d postgres -c "create database $MODELLO;" >/dev/null 2>&1
  file_in "$MODELLO" "$PREAMBOLO" || { rosso "preambolo non applicato"; tail -3 $TMPD/ultimo.log; exit 1; }
  n=0
  for f in "$MIG"/*.sql; do
    b="$(basename "$f" .sql)"; [ "${b%%_*}" = "$VERS" ] && continue
    awk -v v="${b%%_*}" -v c="$VERS" 'BEGIN{exit !(v+0 > c+0)}' && continue
    file_in "$MODELLO" "$f" || { rosso "catena: KO su $b"; head -3 $TMPD/ultimo.log; exit 1; }
    n=$((n+1))
  done
fi
[ "$(nfun "$MODELLO")" = "0" ] || { rosso "il modello contiene gia' le funzioni: la base non e' pulita"; exit 1; }
A="$(impronta "$MODELLO")"
ok "modello: $n migration (tutte quelle prima di $VERS; «riusato» = costruito dal chiamante), 0 funzioni, impronta di $(printf '%s\n' "$A" | grep -c .) righe"

# ── G1: apply -> rollback -> impronta identica -> riapplica identico ────────
nuovo rb24_a
file_in rb24_a "$MIGRATION" || rosso "G1: apply fallito"
B="$(impronta rb24_a)"; [ "$(nfun rb24_a)" = "2" ] || rosso "G1: dopo l'apply le funzioni sono $(nfun rb24_a), attese 2"
[ "$(printf '%s\n' "$B" | grep -c .)" -gt "$(printf '%s\n' "$A" | grep -c .)" ] || rosso "G1: l'apply non ha cambiato l'impronta (psql non se n'e' accorto)"
if file_in rb24_a "$RB"; then
  C="$(impronta rb24_a)"
  [ "$C" = "$A" ] && ok "G1: apply -> rollback riporta l'impronta COMPLETA del catalogo a quella iniziale" || { rosso "G1: il rollback non riporta all'impronta iniziale"; diff <(printf '%s\n' "$A") <(printf '%s\n' "$C") | head -5; }
  [ "$(nfun rb24_a)" = "0" ] || rosso "G1: restano $(nfun rb24_a) funzioni"
else rosso "G1: rollback fallito: $(head -2 $TMPD/ultimo.log | tr '\n' ' ')"; fi
file_in rb24_a "$MIGRATION"; D="$(impronta rb24_a)"
[ "$D" = "$B" ] && ok "G1: la riapplicazione dopo il rollback da' la stessa impronta dell'apply" || rosso "G1: riapplicazione diversa dall'apply"

# ── G2: idempotenza ─────────────────────────────────────────────────────────
file_in rb24_a "$RB" ; file_in rb24_a "$RB"; c=$?
[ "$c" = "0" ] && grep -q "idempotente" $TMPD/ultimo.log && ok "G2: secondo rollback con 0 funzioni: nessun errore, avviso di idempotenza" || rosso "G2: il secondo rollback non e' idempotente (rc=$c)"

# ── G3: omonime preesistenti con altro corpo, migration NON applicata ───────
nuovo rb24_b
pg -d rb24_b -c "create function public.get_web_dashboard_access() returns jsonb language sql as \$\$select '{}'::jsonb\$\$;" -c "create function private.web_dashboard_verdict(uuid) returns jsonb language sql as \$\$select '{}'::jsonb\$\$;" >/dev/null 2>&1
M0="$(md5fun rb24_b)"
file_in rb24_b "$RB"; c=$?
if [ "$c" -ne 0 ] && grep -q "RIFIUTATO" $TMPD/ultimo.log && [ "$(nfun rb24_b)" = "2" ] && [ "$(md5fun rb24_b)" = "$M0" ]; then
  ok "G3: omonime con altro corpo: RIFIUTA, le funzioni e i loro corpi restano"
else rosso "G3: omonime non protette (rc=$c, funzioni=$(nfun rb24_b))"; fi

# ── G4: stato parziale ──────────────────────────────────────────────────────
nuovo rb24_c
pg -d rb24_c -c "create function public.get_web_dashboard_access() returns jsonb language sql as \$\$select '{}'::jsonb\$\$;" >/dev/null 2>&1
file_in rb24_c "$RB"; c=$?
if [ "$c" -ne 0 ] && grep -q "attese 0 o 2" $TMPD/ultimo.log && [ "$(nfun rb24_c)" = "1" ]; then ok "G4: una sola funzione: RIFIUTA, non tocca niente"
else rosso "G4: stato parziale non protetto (rc=$c, funzioni=$(nfun rb24_c))"; fi

# ── G5: oggetto dipendente -> nessun CASCADE, nessuna rimozione parziale ────
nuovo rb24_d
file_in rb24_d "$MIGRATION"
pg -d rb24_d -c "create view public.v_dip_rb24 as select public.get_web_dashboard_access() as x;" >/dev/null 2>&1
file_in rb24_d "$RB"; c=$?
if [ "$c" -ne 0 ] && grep -q -i "depend" $TMPD/ultimo.log && [ "$(nfun rb24_d)" = "2" ] && [ "$(sqlv rb24_d "select count(*) from pg_views where viewname='v_dip_rb24'")" = "1" ]; then ok "G5: oggetto dipendente: il DROP fallisce, entrambe le funzioni e la vista restano (nessun CASCADE, nessun parziale)"
else rosso "G5: dipendente non protetto (rc=$c, funzioni=$(nfun rb24_d))"; fi

# ── G6: eseguito da un ruolo non proprietario ───────────────────────────────
nuovo rb24_e
file_in rb24_e "$MIGRATION"
{ echo "set role authenticated;"; cat "$RB"; } > $TMPD/auth.sql
file_in rb24_e $TMPD/auth.sql; c=$?
[ "$c" -ne 0 ] && grep -q -E "must be owner|permission denied|ROLLBACK RIFIUTATO" $TMPD/ultimo.log && ! grep -q "does not exist" $TMPD/ultimo.log && [ "$(nfun rb24_e)" = "2" ] && ok "G6: da authenticated fallisce (non proprietario) e non cambia niente" || rosso "G6: un ruolo del client ha potuto agire (rc=$c, funzioni=$(nfun rb24_e))"

# ── G7: neutralita' rispetto alla transazione del chiamante ─────────────────
nuovo rb24_f
file_in rb24_f "$MIGRATION"
file_in rb24_f "$RB" --single-transaction; c=$?
[ "$c" = "0" ] && [ "$(nfun rb24_f)" = "0" ] && ok "G7a: --single-transaction: rollback riuscito, 0 funzioni" || rosso "G7a: --single-transaction rc=$c, funzioni=$(nfun rb24_f)"
nuovo rb24_g
file_in rb24_g "$MIGRATION"
{ echo "begin;"; cat "$RB"; echo "rollback;"; } > $TMPD/esterna.sql
file_in rb24_g $TMPD/esterna.sql; c=$?
[ "$c" = "0" ] && [ "$(nfun rb24_g)" = "2" ] && ok "G7b: dentro 'begin; <file>; rollback;' il rollback ESTERNO annulla tutto (2 funzioni tornano): il file non conferma la transazione del chiamante" || rosso "G7b: transazione esterna confermata dal file (rc=$c, funzioni=$(nfun rb24_g), atteso 2)"
nuovo rb24_h
file_in rb24_h "$MIGRATION"
pg -d rb24_h -c "create view public.v_dip_rb24 as select public.get_web_dashboard_access() as x;" >/dev/null 2>&1
file_in rb24_h "$RB" --single-transaction; c=$?
[ "$c" -ne 0 ] && [ "$(nfun rb24_h)" = "2" ] && ok "G7c: guasto dentro --single-transaction: nessuna rimozione parziale (2 funzioni restano)" || rosso "G7c: rimozione parziale (rc=$c, funzioni=$(nfun rb24_h))"

# ── G8: lock_timeout: un lock sulla funzione non mette il rollback in coda ──
nuovo rb24_i
file_in rb24_i "$MIGRATION"
( docker exec -i "$CONT" psql -U postgres -d rb24_i -X -q -c "begin; comment on function private.web_dashboard_verdict(uuid) is 'lock di prova'; select pg_sleep(14); rollback;" >/dev/null 2>&1 & )
for _ in $(seq 1 20); do [ "$(sqlv rb24_i "select count(*) from pg_stat_activity where datname='rb24_i' and query like '%lock di prova%'")" -ge 1 ] && break; sleep 0.5; done
sleep 1
t0=$(date +%s); file_in rb24_i "$RB"; c=$?; dt=$(( $(date +%s) - t0 ))
if [ "$c" -ne 0 ] && [ "$dt" -lt 10 ] && grep -q "lock timeout" $TMPD/ultimo.log && [ "$(nfun rb24_i)" = "2" ]; then ok "G8: con un lock sulla funzione il rollback fallisce dopo ~${dt}s (lock timeout), le funzioni restano"
else rosso "G8: lock_timeout non protegge (rc=$c, ${dt}s, funzioni=$(nfun rb24_i))"; fi
sleep 13

# ── G9: LIMITE dichiarato: omonime preesistenti + migration sopra + rollback ─
nuovo rb24_j
pg -d rb24_j -c "create function public.get_web_dashboard_access() returns jsonb language sql as \$\$select '{}'::jsonb\$\$;" -c "create function private.web_dashboard_verdict(uuid) returns jsonb language sql as \$\$select '{}'::jsonb\$\$;" >/dev/null 2>&1
file_in rb24_j "$PRE"; cp=$?
grep -q "P-1: esiste gia'" $TMPD/ultimo.log && pcond_p1=1 || pcond_p1=0
file_in rb24_j "$MIGRATION"; file_in rb24_j "$RB"; cr=$?
[ "$cp" -ne 0 ] && [ "$pcond_p1" = "1" ] && ok "G9a: PRIMA della migration le precondizioni sono rosse su quelle omonime (P-1)" || rosso "G9a: le precondizioni non hanno visto le omonime prima dell'apply (rc=$cp)"
[ "$cr" = "0" ] && [ "$(nfun rb24_j)" = "0" ] && ok "G9b: LIMITE confermato: con omonime preesistenti sostituite dalla migration il rollback le toglie (l'originale e' perso): per questo esistono le precondizioni" || rosso "G9b: comportamento del limite cambiato (rc=$cr, funzioni=$(nfun rb24_j))"

# ── P1..P4: precondizioni ───────────────────────────────────────────────────
nuovo rb24_k
PA="$(impronta rb24_k)"
file_in rb24_k "$PRE"; c=$?
PB="$(impronta rb24_k)"
[ "$c" = "0" ] && grep -q "PRECONDIZIONI: PASSA" $TMPD/ultimo.log && ok "P1: su una base pulita le precondizioni PASSANO" || rosso "P1: precondizioni non passano su base pulita (rc=$c: $(head -3 $TMPD/ultimo.log | tr '\n' ' '))"
[ "$PA" = "$PB" ] && ok "P2: lo script di precondizioni non cambia il catalogo (impronta identica prima/dopo): sola lettura" || rosso "P2: lo script ha cambiato il catalogo"
nuovo rb24_l
pg -d rb24_l -c "create function private.web_dashboard_verdict(uuid) returns jsonb language sql as \$\$select '{}'::jsonb\$\$;" >/dev/null 2>&1
file_in rb24_l "$PRE"; c=$?
[ "$c" -ne 0 ] && grep -q "P-1: esiste gia'" $TMPD/ultimo.log && ok "P3: una funzione omonima preesistente: precondizioni ROSSE (P-1) con il comando per salvarne l'originale" || rosso "P3: P-1 non rilevata (rc=$c)"
nuovo rb24_m
pg -d rb24_m -c "alter table private.billing_pagamenti_segnalati rename column valido_fino to valido_fino_x;" >/dev/null 2>&1
file_in rb24_m "$PRE"; c=$?
[ "$c" -ne 0 ] && grep -q "P-2: colonna private.billing_pagamenti_segnalati.valido_fino assente" $TMPD/ultimo.log && ok "P4: una colonna dipendente mancante: precondizioni ROSSE (P-2)" || rosso "P4: P-2 non rilevata (rc=$c: $(head -3 $TMPD/ultimo.log | tr '\n' ' '))"

# ── md5 dichiarati nel rollback = md5 misurati sulla migration applicata ────
nuovo rb24_k
file_in rb24_k "$MIGRATION" || rosso "md5: apply fallito ($(head -1 $TMPD/ultimo.log))"
for coppia in "public|get_web_dashboard_access|c_md5_pub" "private|web_dashboard_verdict|c_md5_priv"; do
  IFS='|' read -r sc nm cost <<<"$coppia"
  h="$(sqlv rb24_k "select md5(prosrc) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='$sc' and p.proname='$nm'")"
  if [ "${#h}" -ne 32 ]; then rosso "md5 di $sc.$nm: misura vuota o non valida («$h»)"; continue; fi
  grep -q "$cost *constant text := '$h'" "$RB" && ok "md5 misurato di $sc.$nm ($h) = costante $cost del rollback" || rosso "md5 misurato di $sc.$nm ($h) NON e' la costante $cost del rollback (la migration e' cambiata?)"
done

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: il rollback di $VERS non regge in almeno un caso."; exit 1; }
echo "VERDE: rollback di $VERS: guardie, neutralita' di transazione, lock_timeout e precondizioni provati su PG17 usa-e-getta."
