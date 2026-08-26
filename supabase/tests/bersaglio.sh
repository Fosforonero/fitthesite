#!/usr/bin/env bash
# ============================================================================
# LA GUARDIA SUL BERSAGLIO — da sorgere (`source`), non da eseguire.
#
# PERCHE' ESISTE
# --------------
# Fino al 26/08/2026 dieci file della suite avversariale avevano
# `CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"`: chi dimenticava la
# variabile puntava al container CONDIVISO senza accorgersene. E' successo. Il
# tentativo non ha lasciato residui — verificato in sola lettura, zero righe
# scritte nelle sei ore successive — ma la sicurezza non puo' dipendere dal
# comando che l'operatore ricorda di scrivere.
#
# Qui non c'e' nessun valore predefinito. Le due variabili sono obbligatorie, e
# il bersaglio deve DIMOSTRARE di essere l'ambiente isolato della release: PG17
# e la sentinella. Un database senza sentinella viene rifiutato anche se il nome
# sembra giusto: il nome non e' una prova.
#
# Uso:
#   source "$(dirname "$0")/../bersaglio.sh"   # definisce CID, DBN, BASELINE
# ============================================================================

# Nomi che non devono MAI essere un bersaglio di test, qualunque cosa dicano le
# variabili. L'elenco e' per sottostringa: `supabase_db_fitmesh`,
# `supabase_db_fitmesh_2`, un domani `..._prod` cadono tutti qui.
_bersaglio_vietato() {
  case "$1" in
    *supabase_db*|*prod*|*production*|*live*|*fitmesh_db*) return 0 ;;
  esac
  return 1
}

_bersaglio_muori() { echo "ROSSO: $*" >&2; exit 78; }

[ -n "${SUPABASE_DB_CONTAINER:-}" ] || _bersaglio_muori \
  "SUPABASE_DB_CONTAINER non e' impostata. Non esiste un bersaglio predefinito:
       la suite scrive e cancella, e non deve poterlo fare su un container
       scelto per distrazione. Esempio:
       SUPABASE_DB_CONTAINER=pg17-190-reset SUPABASE_DB_NAME=ricostruzione ..."

[ -n "${SUPABASE_DB_NAME:-}" ] || _bersaglio_muori \
  "SUPABASE_DB_NAME non e' impostata. Vedi sopra: nessun default."

CID="$SUPABASE_DB_CONTAINER"
DBN="$SUPABASE_DB_NAME"

_bersaglio_vietato "$CID" && _bersaglio_muori \
  "«${CID}» e' un bersaglio vietato: e' il container condiviso o di produzione.
       Questa suite non gira li'. Usare l'ambiente isolato della release."
_bersaglio_vietato "$DBN" && _bersaglio_muori \
  "«${DBN}» e' un nome di database vietato."

docker exec "$CID" psql -U postgres -d "$DBN" -tAc "select 1" >/dev/null 2>&1 \
  || _bersaglio_muori "«${CID}»/«${DBN}» non risponde. Eseguire prima esegui-reset.sh."

_bersaglio_ver="$(docker exec "$CID" psql -U postgres -d "$DBN" -X -tAc "show server_version_num" 2>/dev/null)"
case "$_bersaglio_ver" in
  ''|*[!0-9]*) _bersaglio_muori "versione di PostgreSQL non leggibile da «${CID}»." ;;
esac
[ "$_bersaglio_ver" -ge 170000 ] || _bersaglio_muori \
  "«${CID}» e' PostgreSQL $_bersaglio_ver, serve 17 o superiore.
       La produzione e' su 17: provare su una versione diversa non prova niente."

# La sentinella: e' la sola prova che questo database e' stato costruito come
# ambiente isolato della release. La crea esegui-reset.sh alla fine della catena.
_bersaglio_sent="$(docker exec "$CID" psql -U postgres -d "$DBN" -X -tAc \
  "select coalesce((select baseline from private.ambiente_isolato_release limit 1), '')" 2>/dev/null)"
[ -n "$_bersaglio_sent" ] || _bersaglio_muori \
  "«${CID}»/«${DBN}» non ha la sentinella private.ambiente_isolato_release.
       Non e' un ambiente isolato costruito per questa release, o la catena non
       e' stata applicata. Il nome giusto non e' una prova: la sentinella si'."

BASELINE="$_bersaglio_sent"

printf '== bersaglio: container %s | database %s | PostgreSQL %s | baseline %s ==\n' \
  "$CID" "$DBN" "$_bersaglio_ver" "$BASELINE"
