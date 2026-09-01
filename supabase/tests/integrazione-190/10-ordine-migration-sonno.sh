#!/usr/bin/env bash
#
# INVARIANTE sull'ordine delle migration del sonno.
#
# ── DA SONDA ROSSA A INVARIANTE VERDE ──────────────────────────────────────
#
# Fino al 25/08/2026 questo script era un RED: cercava due ancore in
# `20260811120000_sleep_merge_idempotent.sql` (sul filone
# p0/sleep-merge-idempotency) e non le trovava, perche' quella migration
# ricrea `public.upsert_fitness_metrics_v189` da capo mentre
# `20260817073706_finestra_sonno_una_sola_regola` la modifica per ancore.
# Datata prima, su una ricostruzione sarebbe girata prima, e la 0817 avrebbe
# trovato una funzione diversa da quella per cui le sue ancore sono scritte.
#
# La riconciliazione ha deciso: la 0811 NON entra nella catena. Il suo
# contenuto e' superato — misurato il 25/08,
# `internal._merge_sleep_stages_jsonb` ha codice identico fra ricostruzione e
# produzione, quindi la catena riproduce gia' l'autorita' viva del merge. Il
# residuo vero (la finestra allargata dagli awake ai bordi) e' chiuso da
# `20260825120009`, che e' datata DOPO la catena viva.
#
# Quindi la premessa del vecchio test e' storica, e il test diventa
# un'invariante: pretende che nessuno rimetta una migration nell'ordine
# sbagliato. Resta vivo e diventa verde per il motivo giusto, invece di essere
# un rosso permanente che il cancello impara a ignorare.
#
# Non tocca nessun database: legge i file della catena.
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
MIG="${MIG_DIR:-$(cd "$QUI/../../migrations" 2>/dev/null && pwd)}"
esito=0

if [ -z "$MIG" ] || [ ! -d "$MIG" ]; then
  echo "ROSSO: cartella migration non trovata ($MIG)."; exit 1
fi

ANCORE="20260817073706_finestra_sonno_una_sola_regola.sql"
DOPO_ANCORE="20260825120009_finestra_sonno_senza_awake_ai_bordi.sql"

# ---------------------------------------------------------------------------
# 1. Nessuna migration RICREA upsert_fitness_metrics_v189 dopo la 0817.
#    La 0817 modifica il sorgente vivo per ancore: una ricreazione integrale
#    successiva la annullerebbe in silenzio, senza conflitti e senza errori.
# ---------------------------------------------------------------------------
echo "== chi ricrea upsert_fitness_metrics_v189, e quando =="
n_esaminati=0
n_ricreano=0
for f in "$MIG"/*.sql; do
  n_esaminati=$((n_esaminati + 1))
  nome="$(basename "$f")"
  if grep -qiE 'create or replace function[[:space:]]+public\.upsert_fitness_metrics_v189' "$f"; then
    n_ricreano=$((n_ricreano + 1))
    if [[ "$nome" > "$ANCORE" ]]; then
      echo "  ROSSO   $nome ricrea la funzione ED E' DATATA DOPO $ANCORE."
      echo "          Su una ricostruzione annullerebbe la regola della finestra"
      echo "          senza che nessun conflitto lo segnali."
      esito=1
    else
      echo "  ok      $nome ricrea la funzione, ma e' datata prima delle ancore"
    fi
  fi
done
echo "  ($n_esaminati file esaminati, $n_ricreano la ricreano)"
if [ "$n_esaminati" -eq 0 ]; then
  echo "  ROSSO: zero file esaminati. Un verde su zero file non e' un verde."
  esito=1
fi
if [ "$n_ricreano" -eq 0 ]; then
  echo "  ROSSO: nessun file la ricrea. La funzione non nascerebbe affatto:"
  echo "         la sonda sta guardando la cosa sbagliata."
  esito=1
fi

# ---------------------------------------------------------------------------
# 2. Le due ancore della 0817 esistono, una volta ciascuna, nel file 0817.
#    Era il controllo positivo del vecchio test e resta utile: se sparissero,
#    la 0817 non si applicherebbe piu' e nessun altro test lo direbbe.
# ---------------------------------------------------------------------------
echo "== le ancore della 0817 esistono nel file 0817 =="
ANCORA_FINESTRA="    (p_row->>'sleep_start_ms')::bigint, (p_row->>'sleep_end_ms')::bigint,"
ANCORA_STADI="    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories', p_row->'sleep_stages',"
if [ ! -f "$MIG/$ANCORE" ]; then
  echo "  ROSSO   $ANCORE non esiste nella catena."
  esito=1
else
  for coppia in "finestra:$ANCORA_FINESTRA" "stadi:$ANCORA_STADI"; do
    nome="${coppia%%:*}"; testo="${coppia#*:}"
    n="$(grep -c -F -- "$testo" "$MIG/$ANCORE")"
    if [ "$n" -eq 1 ]; then
      echo "  ok      ancora $nome: 1 occorrenza"
    else
      echo "  ROSSO   ancora $nome: $n occorrenze invece di 1"
      esito=1
    fi
  done
fi

# ---------------------------------------------------------------------------
# 3. La 20260811120000 non e' rientrata dalla finestra.
#    E' la decisione della riconciliazione, e una decisione che nessuno
#    verifica e' una decisione che qualcuno annullera' per distrazione.
# ---------------------------------------------------------------------------
echo "== la 20260811120000 resta fuori dalla catena =="
if [ -f "$MIG/20260811120000_sleep_merge_idempotent.sql" ]; then
  echo "  ROSSO   20260811120000_sleep_merge_idempotent.sql e' rientrata nella"
  echo "          catena. Ricrea upsert_fitness_metrics_v189 ed e' datata prima"
  echo "          della 0817: e' esattamente il conflitto d'ordine che questa"
  echo "          invariante esiste per impedire."
  esito=1
else
  echo "  ok      non c'e', come deciso il 25/08"
fi

# ---------------------------------------------------------------------------
# 4. La correzione della finestra esiste ed e' l'ultima a toccare il merge.
# ---------------------------------------------------------------------------
echo "== la correzione degli awake ai bordi c'e', e viene dopo =="
if [ ! -f "$MIG/$DOPO_ANCORE" ]; then
  echo "  ROSSO   $DOPO_ANCORE non esiste: il difetto misurato in produzione"
  echo "          (418 notti su 1.038 in 7 giorni) non e' chiuso da nessuna parte."
  esito=1
else
  # ── CORREZIONE 27/08: l'invariante era scritta su un NOME ────────────────
  #
  # Prima qui si pretendeva che $DOPO_ANCORE fosse l'ULTIMA migration a
  # toccare il merge. E' un'invariante che scade da sola: la prima correzione
  # legittima successiva la fa diventare rossa, e a quel punto o si blocca il
  # lavoro o si allarga il nome — cioe' si disinnesca il gate.
  #
  # La proprieta' che serve davvero non e' "nessuno viene dopo": e' "chi viene
  # dopo non annulla la correzione, e nessuno arriva in silenzio". Quindi:
  #
  #   1. ogni migration che tocca il merge DOPO le ancore deve essere in
  #      questo elenco, con la sua ragione scritta accanto. Una nuova che non
  #      c'e' rende rosso il gate esattamente come prima;
  #   2. la conservazione della correzione e' provata a RUNTIME, non qui:
  #      `reset-pg17/11-test-finestra-awake.sql` gira DOPO l'intera catena, e
  #      la sua asserzione e' proprio che gli awake ai bordi non spostino piu'
  #      la finestra. Se una migration successiva la annullasse, quel test
  #      diventerebbe rosso. Un controllo testuale qui non potrebbe saperlo:
  #      queste migration sostituiscono stringhe dentro il corpo VIVO, e il
  #      loro effetto non si legge dal file.
  #
  # Formato: nome_file|ragione
  AMMESSE_DOPO=(
    "20260827120000_sonno_indice_segue_la_principale.sql|S2-SERVER: sessionIdx segue la sessione principale invece della posizione cronologica. Non tocca gli estremi: sostituisce solo il riordino, e pretende che il rilevamento di sovrapposizione resti invariato."
  )
  dopo_le_ancore=0
  for f in "$MIG"/*.sql; do
    nome="$(basename "$f")"
    grep -qiE "internal\._merge_sleep_stages_jsonb" "$f" || continue
    [ "$nome" \> "$DOPO_ANCORE" ] || continue
    dopo_le_ancore=$((dopo_le_ancore+1))
    ammessa=0
    for voce in "${AMMESSE_DOPO[@]}"; do
      [ "${voce%%|*}" = "$nome" ] && ammessa=1 && break
    done
    if [ "$ammessa" -eq 1 ]; then
      echo "  ok      $nome tocca il merge dopo la correzione, ed e' dichiarata"
    else
      echo "  ROSSO   $nome tocca il merge DOPO $DOPO_ANCORE e non e' dichiarata."
      echo "          Aggiungila a AMMESSE_DOPO con la ragione, dopo aver verificato"
      echo "          che 11-test-finestra-awake.sql resti verde sulla catena completa."
      esito=1
    fi
  done
  if [ "$dopo_le_ancore" -eq 0 ]; then
    echo "  ok      nessuna migration tocca il merge dopo $DOPO_ANCORE"
  fi
  # Una voce dell'elenco che non esiste piu' sul disco e' un residuo: va tolta,
  # altrimenti l'elenco smette di descrivere la realta'.
  for voce in "${AMMESSE_DOPO[@]}"; do
    n="${voce%%|*}"
    [ -f "$MIG/$n" ] || { echo "  ROSSO   voce residua: $n e' dichiarata ma non esiste sul disco."; esito=1; }
  done
fi

# ---------------------------------------------------------------------------
# CONTROLLO POSITIVO
# Su una copia della cartella con dentro una migration che ricrea la funzione
# ed e' datata DOPO le ancore, questo script deve diventare rosso.
# ---------------------------------------------------------------------------
if [ "${1:-}" != "--figlio" ]; then
  echo "== controllo positivo: una migration nell'ordine sbagliato deve dare rosso =="
  SCRATCH="$(mktemp -d)"
  cp "$MIG"/*.sql "$SCRATCH"/ 2>/dev/null
  cat > "$SCRATCH/29991231235959_intrusa.sql" <<'INTRUSA'
create or replace function public.upsert_fitness_metrics_v189(p_row jsonb)
returns void language plpgsql as $$ begin end; $$;
INTRUSA
  MIG_DIR="$SCRATCH" "$0" --figlio > /dev/null 2>&1
  codice_figlio=$?
  rm -rf "$SCRATCH"
  if [ "$codice_figlio" -eq 0 ]; then
    echo "  SONDA ROTTA: una ricreazione datata dopo le ancore e' passata."
    echo "               L'invariante non protegge niente."
    esito=1
  else
    echo "  ok      l'intrusa fa fallire lo script (uscita $codice_figlio)"
  fi
fi

echo
if [ "$esito" -eq 0 ]; then
  echo "VERDE: l'ordine delle migration del sonno regge."
else
  echo "ROSSO: l'ordine delle migration del sonno non regge."
fi
exit "$esito"
