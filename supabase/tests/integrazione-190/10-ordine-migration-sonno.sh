#!/usr/bin/env bash
#
# RED dell'integrazione 190 — l'ordine delle migration del sonno.
#
# ── COSA PROVA ─────────────────────────────────────────────────────────────
#
# `20260817073706_finestra_sonno_una_sola_regola.sql` non riscrive
# `public.upsert_fitness_metrics_v189` da capo: legge il sorgente vivo con
# `pg_get_functiondef`, cerca due ancore e **si rifiuta di procedere se
# un'ancora non compare esattamente una volta**.
#
# `20260811120000_sleep_merge_idempotent.sql` (sul filone
# `p0/sleep-merge-idempotency`) **ricrea quella stessa funzione**, ed e' datata
# prima. Su una ricostruzione da zero girerebbe prima, e la 0817 troverebbe una
# funzione diversa da quella per cui le sue ancore sono state scritte.
#
# Le due linee hanno risolto lo stesso difetto in due modi diversi:
#
#   0811 calcola la finestra dagli stadi una volta sola, in una variabile
#        locale (`v_new_sleep_scelta`), e la riusa;
#   0817 la calcola chiamando `internal._merge_sleep_stages_jsonb` in linea,
#        due volte per la finestra e una per gli stadi.
#
# Quindi non e' un conflitto testuale (zero file in comune) ed e' invisibile a
# git: e' un conflitto di ordine, e si manifesta solo quando qualcuno
# ricostruisce lo schema.
#
# ── COME LEGGERLO ──────────────────────────────────────────────────────────
#
# Questo test **deve fallire finche' il conflitto non e' risolto**. Un verde
# qui senza aver toccato niente significa che la sonda si e' rotta, non che il
# problema e' sparito: per questo c'e' il controllo positivo alla fine.
#
# Non tocca nessun database. Legge i due file dalle rispettive ref git e
# rifa' esattamente il conteggio che fa la migration in SQL.

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT" || exit 2

REF_FILONE="${REF_FILONE:-p0/sleep-merge-idempotency}"
MIG_0811="supabase/migrations/20260811120000_sleep_merge_idempotent.sql"
# RINOMINATA durante la riconciliazione del 25/08/2026: il file si chiamava
# 20260817090000_..., ma la versione registrata nel remoto e applicata in
# produzione e' 20260817073706. Il vecchio nome faceva uscire questo script
# con 2 («test nel posto sbagliato»), che a un chiamante distratto sembra il
# rosso atteso: un rosso per il motivo sbagliato inganna quanto un verde falso.
MIG_0817="supabase/migrations/20260817073706_finestra_sonno_una_sola_regola.sql"

# Le due ancore, copiate verbatim dalla 0817.
ANCORA_FINESTRA="    (p_row->>'sleep_start_ms')::bigint, (p_row->>'sleep_end_ms')::bigint,"
ANCORA_STADI="    p_row->'intraday_steps', p_row->'intraday_hr', p_row->'intraday_calories', p_row->'sleep_stages',"

fallimenti=0

echo "== ordine migration sonno: 0811 (filone) prima di 0817 (main) =="

if ! git cat-file -e "HEAD:$MIG_0817" 2>/dev/null; then
  echo "  SONDA ROTTA (uscita 2, NON il rosso atteso): $MIG_0817 non e' su"
  echo "  questo ramo. Questo non e' un verdetto sul conflitto: e' il test che"
  echo "  non trova cio' che deve esaminare."
  altro="$(git ls-tree --name-only HEAD supabase/migrations/ \
           | grep -F 'finestra_sonno_una_sola_regola' || true)"
  if [ -n "$altro" ]; then
    echo "  Sul ramo c'e' pero': $altro"
    echo "  Probabile rinomina: aggiornare MIG_0817 in questo script."
  fi
  exit 2
fi
if ! git cat-file -e "$REF_FILONE:$MIG_0811" 2>/dev/null; then
  echo "  ERRORE: $MIG_0811 non e' su $REF_FILONE."
  exit 2
fi

sorgente_0811="$(git show "$REF_FILONE:$MIG_0811")"

conta() { printf '%s' "$1" | grep -c -F -- "$2"; }

n_finestra="$(conta "$sorgente_0811" "$ANCORA_FINESTRA")"
n_stadi="$(conta "$sorgente_0811" "$ANCORA_STADI")"

for coppia in "finestra:$n_finestra" "stadi:$n_stadi"; do
  nome="${coppia%%:*}"; n="${coppia##*:}"
  if [ "$n" -eq 1 ]; then
    echo "  ok       ancora $nome: 1 occorrenza, la 0817 puo' applicarsi"
  else
    echo "  FALLITO  ancora $nome: $n occorrenze invece di 1"
    echo "           => la 0817 solleverebbe:"
    echo "              'ancora $nome trovata $n volte invece di 1: la funzione e cambiata, fermarsi'"
    fallimenti=$((fallimenti + 1))
  fi
done

# ── Controllo positivo ─────────────────────────────────────────────────────
# Le stesse ancore, cercate nel sorgente da cui la 0817 e' stata scritta,
# DEVONO comparire. Se anche qui danno zero, la sonda e' rotta e il rosso
# sopra non significa niente.
echo "== controllo positivo: le ancore esistono nel file 0817 stesso =="
sorgente_0817="$(git show "HEAD:$MIG_0817")"
for coppia in "finestra:$ANCORA_FINESTRA" "stadi:$ANCORA_STADI"; do
  nome="${coppia%%:*}"; testo="${coppia#*:}"
  n="$(conta "$sorgente_0817" "$testo")"
  if [ "$n" -ge 1 ]; then
    echo "  ok       ancora $nome presente nel file 0817 ($n)"
  else
    echo "  SONDA ROTTA: l'ancora $nome non compare nemmeno nella 0817"
    exit 2
  fi
done

echo
if [ "$fallimenti" -gt 0 ]; then
  echo "ROSSO: $fallimenti ancore su 2 non reggono."
  echo "Il filone sonno backend NON si integra prima di aver deciso quale delle"
  echo "due implementazioni resta. Vedi AppFitmesh/docs/sprints/MATRICE-P0-190.md."
  exit 1
fi
echo "VERDE: l'ordine delle migration regge."
echo "Attenzione a come si legge: questo script usa 1 per il rosso vero e 2 per"
echo "la sonda rotta. Un chiamante che tratta «non zero» come «rosso atteso»"
echo "non distingue i due casi, ed e' esattamente l'errore che ha nascosto la"
echo "rinomina del 25/08."
exit 0
