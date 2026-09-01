#!/usr/bin/env bash
# Backup cifrato delle SEI righe — le due da riparare e le quattro intoccabili.
#
# PERCHE' SEI E NON DUE
# ---------------------
# La stesura precedente salvava due righe e poi la prova di rollback ne
# nominava sei: uno scarto che avrebbe fatto fallire il ripristino a meta'. Le
# quattro di luglio non si riparano, ma servono nel dataset di prova per
# dimostrare che restano identiche, e servono nel backup perche' il ripristino
# le rimetta a posto se qualcosa va storto.
#
# PERCHE' NIENTE FILE IN CHIARO
# -----------------------------
# La stesura precedente scriveva il JSON in `/tmp` e lo cifrava dopo. Fra i due
# comandi esiste un istante in cui i dati sanitari di una persona stanno in
# chiaro su disco, leggibili da chiunque, e su APFS quell'istante puo'
# sopravvivere in uno snapshot. Qui `psql` scrive direttamente dentro `age`:
# il testo in chiaro non tocca mai il filesystem.
#
# E `rm -P` NON e' una garanzia. Su APFS e su SSD con wear-leveling la
# sovrascrittura non raggiunge i blocchi fisici: il file logico sparisce, i
# blocchi possono restare. Per questo qui non si crea niente da cancellare.
set -euo pipefail
umask 077

: "${DB_URL:?serve DB_URL (mai su disco, mai in un file di ambiente)}"
DEST="${DEST:-$HOME/riparazione-190-colmi.jsonl.age}"
QUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v age >/dev/null 2>&1; then
  echo "ROSSO: manca 'age'. Senza cifratura questo backup non si fa." >&2
  exit 1
fi
if [ -e "$DEST" ]; then
  echo "ROSSO: $DEST esiste gia'. Non lo sovrascrivo: spostalo tu." >&2
  exit 1
fi

# Gli id di ENTRAMBE le popolazioni: quelle da riparare (oltre 6h) e quelle
# intoccabili di luglio (fra 2h e 6h). Una query sola, nessun id scritto a mano.
LEGGI=$(cat <<'SQL'
copy (
  with r as (
    select id, collected_at_ms,
           case when jsonb_typeof(sleep_stages)='array'
                then sleep_stages else '[]'::jsonb end as st
    from public.fitness_metrics where source='colmi_ble'
  ), s as (
    select r.id, r.collected_at_ms,
           coalesce((e.value->>'sessionIdx')::int,0) as sidx,
           (e.value->>'endMs')::bigint as b
    from r cross join lateral jsonb_array_elements(r.st) e(value)
    where jsonb_typeof(e.value)='object' and (e.value->>'endMs') is not null
  ), sess as (
    select id, collected_at_ms, sidx, max(b) as fin
    from s group by id, collected_at_ms, sidx
  ), colpite as (
    select distinct id from sess where fin > collected_at_ms + 2*60*60*1000
  )
  select row_to_json(f) from public.fitness_metrics f
  join colpite c on c.id = f.id order by f.id
) to stdout
SQL
)

# La pipeline diretta: nessun file intermedio, nessuna variabile di shell che
# tenga il contenuto. `pipefail` fa fallire tutto se psql fallisce.
psql "$DB_URL" -X -v ON_ERROR_STOP=1 -q -c "$LEGGI" | age -p -o "$DEST"

RIGHE=$(age -d "$DEST" | wc -l | tr -d ' ')
echo "backup cifrato in $DEST — righe: $RIGHE"
if [ "$RIGHE" -ne 6 ]; then
  echo "ROSSO: attese 6 righe (2 da riparare + 4 intoccabili), trovate $RIGHE." >&2
  echo "       Il dataset e' cambiato: rifare la misura prima di procedere." >&2
  exit 1
fi
echo "ok: 2 da riparare + 4 intoccabili, come misurato."
