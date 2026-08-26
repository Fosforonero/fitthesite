#!/usr/bin/env bash
# ============================================================================
# MUTAZIONI: i controlli sanno diventare rossi?
# ============================================================================
# Una suite verde dice due cose diverse, e solo una e' buona: «il codice e'
# corretto» oppure «i test non guardano». Distinguerle si puo' in un modo solo:
# rompere il codice di proposito e pretendere che qualcuno se ne accorga.
#
# Ogni mutazione qui sotto e' un difetto PLAUSIBILE, non un carattere a caso:
# una condizione dimenticata, una precedenza invertita, una guardia resa
# permissiva. Sono le forme che questi difetti hanno davvero preso in questo
# progetto.
#
# Ogni mutazione viene applicata, il test che dovrebbe accorgersene viene
# eseguito, e la funzione originale viene rimessa a posto PRIMA di qualunque
# verdetto — cosi' un'uscita anticipata non lascia il database mutato.
#
# NON tocca il contenitore condiviso. Serve un PG17 usa-e-getta gia'
# ricostruito (`esegui-reset.sh`).
# ============================================================================
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
RADICE="$(cd "$QUI/../../.." && pwd)"
CONT="${CONT_NAME:-pg17-190-reset}"
DB="${DB_NAME:-ricostruzione}"
SUITE="$RADICE/supabase/tests/billing_claims_p0"
RESET="$RADICE/supabase/tests/reset-pg17"

# Dove sta un file di prova: nella suite avversariale o in quella del reset.
# Un file che non si trova NON e' un test superato: e' una mutazione mai
# esercitata, e va detto.
dove() {
  if [ -f "$SUITE/$1" ]; then printf "%s" "$SUITE/$1"; return 0; fi
  if [ -f "$RESET/$1" ]; then printf "%s" "$RESET/$1"; return 0; fi
  return 1
}

psql_c() { docker exec -i "$CONT" psql -U postgres -d "$DB" -X -tA -v ON_ERROR_STOP=1 -c "$1"; }

SONDA="${1:-}"

# --autocontrollo: rilancia se stesso con ciascuna sonda e pretende il ROSSO.
# Se una sonda uscisse 0, il gate sarebbe di nuovo incapace di fallire e
# l'autocontrollo deve dirlo prima che qualcuno si fidi del verde.
if [ "$SONDA" = "--autocontrollo" ]; then
  echo "== autocontrollo: il gate sa diventare rosso? =="
  fallito=0
  for sonda in --sonda-inesistente --sonda-sopravvissuta; do
    uscita="$(bash "$0" "$sonda" 2>&1)"; codice=$?
    if [ "$codice" -eq 0 ]; then
      echo "  ROSSO  $sonda: il gate e' uscito 0. Non sa fallire."
      printf '%s\n' "$uscita" | sed 's/^/         | /'
      fallito=1
    else
      echo "  ok     $sonda: il gate esce $codice, come deve"
    fi
  done
  echo
  if [ "$fallito" -ne 0 ]; then
    echo "ROSSO: l'autocontrollo e' fallito. Il verde di questo runner non vale niente."
    exit 1
  fi
  echo "VERDE: entrambe le sonde rendono rosso il gate."
  exit 0
fi

# Il corpo vivo di una funzione, per poterla rimettere com'era.
corpo() {
  docker exec "$CONT" psql -U postgres -d "$DB" -X -tA -c \
    "select pg_get_functiondef(p.oid) from pg_proc p
       join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='$1' and p.proname='$2' limit 1;"
}

esegui_file() {
  local f="$1" percorso
  percorso="$(dove "$f")" || { echo "  ROSSO  file di prova non trovato: $f"; return 2; }
  if [ "${f##*.}" = "sql" ]; then
    docker cp "$percorso" "$CONT":/tmp/mut.sql >/dev/null 2>&1
    docker exec "$CONT" psql -U postgres -d "$DB" -X -q -v ON_ERROR_STOP=1 -f /tmp/mut.sql >/dev/null 2>&1
  else
    SUPABASE_DB_CONTAINER="$CONT" SUPABASE_DB_NAME="$DB" bash "$percorso" >/dev/null 2>&1
  fi
}

esito=0
provate=0
sopravvissute=""
non_esercitate=0

# $1 = nome  $2 = schema  $3 = funzione  $4 = sed di mutazione  $5 = file di prova
mutazione() {
  local nome="$1" schema="$2" fn="$3" sed_expr="$4" prova="$5"
  provate=$((provate+1))

  local originale mutato
  originale="$(corpo "$schema" "$fn")"
  if [ -z "$originale" ]; then
    echo "  ROSSO  $nome: la funzione $schema.$fn non esiste. La mutazione non ha mutato niente."
    esito=1
    non_esercitate=$((non_esercitate+1))
    return
  fi

  mutato="$(printf '%s' "$originale" | sed -E "$sed_expr")"
  if [ "$mutato" = "$originale" ]; then
    # Fondamentale: se il sed non cambia niente, il test resterebbe verde e
    # sembrerebbe che la mutazione sia stata "uccisa". Sarebbe il verde piu'
    # ingannevole di tutti.
    echo "  ROSSO  $nome: la mutazione non ha modificato il corpo. Ancora sbagliata, non difetto ucciso."
    esito=1
    non_esercitate=$((non_esercitate+1))
    return
  fi

  printf '%s' "$mutato" | docker exec -i "$CONT" psql -U postgres -d "$DB" -X -q -v ON_ERROR_STOP=1 >/dev/null 2>&1
  local applicata=$?
  if [ "$applicata" -ne 0 ]; then
    echo "  ROSSO  $nome: il corpo mutato non e' nemmeno compilabile. Non prova niente."
    printf '%s' "$originale" | docker exec -i "$CONT" psql -U postgres -d "$DB" -X -q >/dev/null 2>&1
    esito=1
    non_esercitate=$((non_esercitate+1))
    return
  fi

  esegui_file "$prova"
  local codice=$?

  # Ripristino PRIMA del verdetto.
  printf '%s' "$originale" | docker exec -i "$CONT" psql -U postgres -d "$DB" -X -q -v ON_ERROR_STOP=1 >/dev/null 2>&1
  local ripristinata=$?
  if [ "$ripristinata" -ne 0 ]; then
    echo "  ROSSO  $nome: RIPRISTINO FALLITO. Il database resta mutato: rieseguire esegui-reset.sh."
    esito=1
    non_esercitate=$((non_esercitate+1))
    return
  fi

  if [ "$codice" -eq 0 ]; then
    echo "  ROSSO  $nome: mutata, e $prova e' rimasto VERDE."
    sopravvissute="$sopravvissute $nome"
    esito=1
  else
    echo "  ok     $nome: uccisa da $prova"
  fi
}

echo "== mutazioni sull'autorita' del billing =="

# 1. L'autorita' smette di guardare il tempo. E' esattamente il difetto che F6
#    ha chiuso: uno stato ancora 'active' con la scadenza nel passato.
mutazione "entitlement_core senza il controllo sul tempo" \
  private entitlement_core \
  's/and b\.active_until > v_now//g' \
  89-attesa-e-sandbox.sql

# 2. La precedenza temporale invertita: l'evidenza piu' vecchia vince.
mutazione "precedenza temporale invertita" \
  private _billing_evidenza_supera \
  's/p_nuova_at > p_vecchia_at/p_nuova_at < p_vecchia_at/g' \
  93-pareggio-verso-opposto.sql

# 3. La guardia sulla proiezione diventa permissiva: lascia passare tutto.
mutazione "guardia sulla proiezione resa permissiva" \
  private _b2c_projection_guard \
  "s/raise exception/raise notice/g" \
  60-rollout-window.sql

# 4. Il registro delle notifiche confonde «riconsegna mai chiusa» con «gia'
#    applicata»: l'effetto di una notifica morta a meta' andrebbe perso.
mutazione "in_corso confuso con gia_applicata" \
  public apri_notifica_store \
  "s/return 'in_corso';/return 'gia_applicata';/" \
  12-test-notifiche-store.sql

# ============================================================================
# LE SONDE, e l'autocontrollo che le usa
#
# Un gate che non si e' mai visto fallire non e' un gate. Queste due sonde
# esercitano i due modi in cui il verdetto deve diventare rosso, e
# `--autocontrollo` pretende che ciascuna esca davvero non zero.
# ============================================================================
case "$SONDA" in
  --sonda-inesistente)
    # Colpisce il ramo «la funzione non esiste»: alza `esito` e NON tocca
    # `$sopravvissute`. E' il ramo che fino al 25/08 usciva 0.
    mutazione "SONDA: funzione inesistente" \
      private questa_funzione_non_esiste_mai \
      's/x/y/g' \
      89-attesa-e-sandbox.sql
    ;;
  --sonda-sopravvissuta)
    # Mutazione vera e compilabile, ma provata con un file che non la copre:
    # il test resta verde, quindi la mutazione SOPRAVVIVE.
    mutazione "SONDA: mutazione non coperta dal test" \
      private entitlement_core \
      's/and b\.active_until > v_now//g' \
      12-test-notifiche-store.sql
    ;;
  "") : ;;
  --autocontrollo) : ;;
  *) echo "ROSSO: argomento sconosciuto: $SONDA"; exit 2 ;;
esac

# ============================================================================
# IL VERDETTO
#
# Fino al 25/08/2026 questo blocco guardava SOLO $sopravvissute. Ma la funzione
# `mutazione` imposta `esito=1` in CINQUE rami e tocca `$sopravvissute` in UNO
# solo: funzione assente, sed inerte, corpo non compilabile e ripristino fallito
# stampavano ROSSO e poi cadevano dritti nel «VERDE», con uscita 0.
#
# Riprodotto: puntando una mutazione a una funzione inesistente lo script
# stampava «ROSSO ... non esiste» e subito dopo «VERDE: 5 mutazioni, tutte
# uccise», exit 0. Lo strumento il cui unico mestiere e' dimostrare che i test
# sanno fallire non sapeva fallire lui.
#
# Ora il verdetto guarda tutte e tre le cose, e `--autocontrollo` in fondo
# pretende che ciascuna sappia davvero rendere rosso il gate.
# ============================================================================
verdetto() {
  echo
  if [ "$provate" -eq 0 ]; then
    echo "ROSSO: zero mutazioni eseguite."
    echo "Un runner che non misura niente non e' verde: e' rotto."
    return 1
  fi
  if [ -n "$sopravvissute" ]; then
    echo "ROSSO: mutazioni sopravvissute:$sopravvissute"
    echo "Una mutazione che sopravvive non e' un test lento: e' un difetto che nessuno vedrebbe."
    return 1
  fi
  if [ "$esito" -ne 0 ]; then
    echo "ROSSO: $non_esercitate mutazioni non sono state esercitate davvero."
    echo "Funzione assente, sed inerte, corpo non compilabile o ripristino fallito:"
    echo "i ROSSO sopra dicono quale. Una mutazione mai esercitata NON e' una"
    echo "mutazione uccisa, e contarla come tale e' esattamente il difetto che"
    echo "questo controllo esiste per impedire."
    return 1
  fi
  echo "VERDE: $provate mutazioni, tutte realmente uccise."
  return 0
}

verdetto
exit $?
