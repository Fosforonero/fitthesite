#!/usr/bin/env bash
# ============================================================================
# Scansione meccanica: SECURITY DEFINER che SCRIVONO senza controllare chi
# chiama, ed eseguibili da PUBLIC in uno schema che `anon` attraversa.
#
# NON e' un audit. E' un filtro, e serve a una domanda sola: fra le funzioni
# raggiungibili da un chiamante anonimo, ce n'e' una che cambia dati senza mai
# guardare chi sia?
#
# L'audit vero delle 31 funzioni public eseguibili da PUBLIC e' registrato come
# P1 di sicurezza subito dopo la 190, e non si fa qui.
#
# PERCHE' LO SCHEMA CONTA PIU' DELLA CONCESSIONE
# ----------------------------------------------
# Misurato il 26/08/2026: `anon` ha EXECUTE su
# rls_internal.user_shares_metric_with_caller e non riesce comunque a
# chiamarla, perche' non ha USAGE sullo schema. La concessione da sola non dice
# niente. Su `public`, invece, anon passa: e' li' che la domanda ha senso.
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
CONT="${CONT_NAME:-pg17-190-reset}"
DB="${DB_NAME:-ricostruzione}"
MODO="${1:-}"

# Casi esaminati a mano e archiviati, con la ragione. Chi ne aggiunge uno deve
# scrivere PERCHE', non solo il nome.
declare -a ARCHIVIATE=(
  "public.rate_limit_check|e' il limitatore stesso: deve rispondere PRIMA che ci sia un'identita'. Scrive solo il proprio bucket, mai dati utente, e la chiave e' un HMAC-SHA256 con segreto server (lib/rate-limit/limiter.ts), quindi non e' calcolabile per una vittima"
  "public.rate_limit_cleanup|cancella solo bucket gia' scaduti da oltre un'ora. Nessun dato utente, nessun effetto sul limite in corso"
)

archiviata() {
  local f="$1" v
  for v in "${ARCHIVIATE[@]}"; do [ "${v%%|*}" = "$f" ] && return 0; done
  return 1
}

SONDA=""
[ "$MODO" = "--sonda" ] && SONDA=1

if [ "$MODO" = "--autocontrollo" ]; then
  echo "== autocontrollo: la scansione sa diventare rossa? =="
  out="$(bash "$0" --sonda 2>&1)"; c=$?
  if [ "$c" -eq 0 ]; then
    echo "  ROSSO  con una funzione piantata apposta la scansione esce 0. Non sa fallire."
    printf '%s\n' "$out" | sed 's/^/         | /'; exit 1
  fi
  echo "  ok     la sonda rende rossa la scansione (esce $c)"
  echo "VERDE: la scansione sa fallire."; exit 0
fi

if [ -n "$SONDA" ]; then
  docker exec "$CONT" psql -U postgres -d "$DB" -X -q -c "
    create or replace function public._sonda_scrive_senza_controllo(p_id uuid)
    returns void language plpgsql security definer set search_path to 'public' as \$f\$
    begin delete from public.rate_limit_buckets where key = p_id::text; end \$f\$;
    grant execute on function public._sonda_scrive_senza_controllo(uuid) to public;" >/dev/null 2>&1
fi

LISTA="$(docker exec "$CONT" psql -U postgres -d "$DB" -X -tA -c "
with cand as (
  select n.nspname as sch, p.proname as fn, pg_get_functiondef(p.oid) as def,
         pg_get_function_result(p.oid) as ritorna,
         has_schema_privilege('anon', n.nspname, 'USAGE') as passa
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.prosecdef and p.proacl is not null
    and exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0)
    and n.nspname in ('public','private','internal','rls_internal'))
select sch || '.' || fn from cand
where passa
  -- Una funzione trigger non e' invocabile direttamente: Postgres rifiuta con
  -- «trigger functions can only be called as triggers». Escluderla e'
  -- meccanico, non un giudizio.
  and ritorna <> 'trigger'
  and def ~* '(^|[^a-z_])(insert\s+into|update\s+[a-z_.\"]+\s+set|delete\s+from|truncate)'
  and def !~* 'auth\.uid\(\)|auth\.role\(\)|auth\.jwt\(\)|request\.jwt|is_admin\s*\(|has_role\s*\(|is_gym_owner\s*\(|is_caregiver\s*\(|is_active_group_member\s*\(|current_user|session_user'
order by 1;")"

[ -n "$SONDA" ] && docker exec "$CONT" psql -U postgres -d "$DB" -X -q -c \
  "drop function if exists public._sonda_scrive_senza_controllo(uuid);" >/dev/null 2>&1

# Un filtro che non trova nemmeno le archiviate non sta filtrando: sta zitto.
if [ -z "$LISTA" ]; then
  echo "ROSSO: la scansione non ha trovato NIENTE, nemmeno i casi gia' archiviati."
  echo "       Un filtro che non trova cio' che sa esserci non e' verde: e' rotto."
  exit 1
fi

esito=0
echo "== SECURITY DEFINER raggiungibili da anon che scrivono senza controllare il chiamante =="
while read -r f; do [ -n "$f" ] || continue
  if archiviata "$f"; then
    for v in "${ARCHIVIATE[@]}"; do
      [ "${v%%|*}" = "$f" ] && echo "  archiviata  $f" && echo "              ${v#*|}"
    done
  else
    echo "  ROSSO       $f"
    echo "              scrive dati e non guarda mai chi chiama. Va esaminata: se"
    echo "              l'accesso anonimo e' reale, torna blocker della 190."
    esito=1
  fi
done <<<"$LISTA"

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: caso concreto non archiviato. Non chiudere la 190 prima di averlo deciso."; exit 1; }
echo "VERDE: $(printf '%s\n' "$LISTA" | grep -c .) trovate, tutte archiviate con la loro ragione."
