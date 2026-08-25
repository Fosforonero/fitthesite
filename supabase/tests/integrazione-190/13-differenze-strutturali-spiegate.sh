#!/usr/bin/env bash
#
# Ogni differenza fra la ricostruzione PG17 e la produzione deve essere
# ATTESA E SPIEGATA da una forward-only, oppure e' un blocker.
#
# Il registro qui sotto e' il contratto. Questo script non decide se una
# differenza sia accettabile: pretende che qualcuno l'abbia gia' decisa e
# scritta, e verifica che la migration citata esista davvero e nomini
# davvero l'oggetto. Una spiegazione che non si puo' controllare non e' una
# spiegazione, e' una rassicurazione.
#
# Non tocca nessun database: legge i file di migration. Il confronto vero fra
# catalogo ricostruito e catalogo live sta in reset-pg17/03 e 04.
set -uo pipefail
QUI="$(cd "$(dirname "$0")" && pwd)"
MIG="${MIG_DIR:-$(cd "$QUI/../../migrations" 2>/dev/null && pwd)}"
esito=0

if [ -z "$MIG" ] || [ ! -d "$MIG" ]; then
  echo "ROSSO: cartella migration non trovata ($MIG)."; exit 1
fi

# ---------------------------------------------------------------------------
# REGISTRO: categoria | oggetto | migration che lo spiega | termine da trovare
#
# Il "termine da trovare" e' cio' che la migration deve nominare perche' la
# spiegazione regga. Non basta che il file esista.
# ---------------------------------------------------------------------------
REGISTRO=(
  "A|is_admin() search_path|20260825120000_is_admin_su_user_roles.sql|is_admin"
  "A|has_role(text) search_path|20260825120004_has_role_onora_scadenza.sql|has_role"
  "A|is_caregiver() search_path|20260825120004_has_role_onora_scadenza.sql|is_caregiver"
  "A|grant_pro_to_email(text) search_path|20260825120005_grant_pro_to_email_lifetime.sql|grant_pro_to_email"
  "B|is_admin PUBLIC=EXECUTE|20260825120000_is_admin_su_user_roles.sql|revoke"
  "B|is_admin anon=EXECUTE|20260825120000_is_admin_su_user_roles.sql|anon"
  "B|has_role PUBLIC=EXECUTE|20260825120004_has_role_onora_scadenza.sql|revoke"
  "B|has_role anon=EXECUTE|20260825120004_has_role_onora_scadenza.sql|anon"
  "B|is_caregiver PUBLIC=EXECUTE|20260825120004_has_role_onora_scadenza.sql|is_caregiver"
  "B|is_caregiver anon=EXECUTE|20260825120004_has_role_onora_scadenza.sql|anon"
  "B|user_shares_metric_with_caller PUBLIC=EXECUTE|20260825120001_scope_ruoli_e_revoche.sql|user_shares_metric_with_caller"
  "E|users insert own metrics roles|20260825120001_scope_ruoli_e_revoche.sql|users insert own metrics"
  "E|users update own metrics roles|20260825120001_scope_ruoli_e_revoche.sql|users update own metrics"
  # ── CORPI DELLE FUNZIONI (categoria L) ────────────────────────────────────
  # Aggiunte il 25/08/2026, quando il confronto ha smesso di guardare solo la
  # firma. Su 66 funzioni, 26 avevano il corpo diverso; tolti commenti,
  # spaziatura e maiuscole ne restavano sette con codice davvero diverso. Sei
  # sono queste, ciascuna con la sua forward-only.
  "L|is_admin corpo|20260825120000_is_admin_su_user_roles.sql|expires_at"
  "L|has_role corpo|20260825120004_has_role_onora_scadenza.sql|expires_at"
  "L|is_caregiver corpo|20260825120004_has_role_onora_scadenza.sql|is_caregiver"
  "L|grant_pro_to_email corpo|20260825120005_grant_pro_to_email_lifetime.sql|grant_pro_to_email"
  "L|get_dashboard_snapshot corpo|20260825120006_dashboard_snapshot_pro_attivi.sql|get_dashboard_snapshot"
  "L|claim_group_invite corpo|20260825120007_claim_group_invite_cap_su_ruolo_attivo.sql|claim_group_invite"
  # La settima e' l'unica in cui la PRODUZIONE aveva ragione e la CATENA torto:
  # il ramo appReview di entitlement_core, spostato in testa in produzione il
  # 18/08 e mai registrato. Applicata al vivo, la forward-only e' un no-op.
  "L|entitlement_core corpo (ramo appReview in testa)|20260825120008_entitlement_core_ramo_appreview_in_testa.sql|appReview"
  # L'ottava, aggiunta il 25/08 con la chiusura di 3A: gli estremi della notte
  # principale escludono gli awake ai bordi. Misurato in produzione prima di
  # scriverla: 418 notti su 1.038 in 7 giorni, 40,3%.
  "L|_merge_sleep_stages_jsonb corpo (finestra senza awake ai bordi)|20260825120009_finestra_sonno_senza_awake_ai_bordi.sql|sleep_start_ms"
)

# verifica_voce: 0 se la spiegazione regge, 1 altrimenti. Stampa il verdetto.
# E' una funzione e non codice in linea perche' il controllo positivo in fondo
# deve poter esercitare ESATTAMENTE questa logica su una voce falsa. Un
# controllo positivo che riesegue una copia della logica non prova niente
# sulla logica vera.
verifica_voce() {
  local cat="$1" oggetto="$2" file="$3" termine="$4" muto="${5:-no}"
  local dire=echo
  [ "$muto" = "muto" ] && dire=:
  if [ ! -f "$MIG/$file" ]; then
    $dire "  ROSSO   [$cat] $oggetto"
    $dire "          la migration citata non esiste: $file"
    return 1
  fi
  if grep -qiF -- "$termine" "$MIG/$file"; then
    $dire "  ok      [$cat] $oggetto  <- $file"
    return 0
  fi
  $dire "  ROSSO   [$cat] $oggetto"
  $dire "          ${file} esiste ma non nomina «${termine}»: la spiegazione non regge."
  # Le graffe non sono cosmetica: senza, bash inglobava il byte multibyte di
  # » nel nome della variabile e questa riga moriva con «unbound variable».
  # Stava solo nel ramo rosso, quindi nessuna esecuzione verde poteva
  # incontrarla: l'ha trovata il controllo positivo, che e' il suo mestiere.
  return 1
}

echo "== differenze strutturali attese, e la migration che le spiega =="
for voce in "${REGISTRO[@]}"; do
  IFS='|' read -r cat oggetto file termine <<< "$voce"
  verifica_voce "$cat" "$oggetto" "$file" "$termine" || esito=1
done

# ---------------------------------------------------------------------------
# Le quattro differenze di categoria I (cron) NON hanno una forward-only, e
# non devono averla: sono di sola spaziatura, provate tali rimuovendo ogni
# spazio bianco dai due comandi. La prova sta in
# supabase/CONFRONTO-RICOSTRUZIONE-LIVE-190.md. Qui si verifica soltanto che
# la migration che genera quei job esista, perche' se sparisse la
# ricostruzione perderebbe i job e la differenza smetterebbe di essere
# cosmetica senza che nessuno se ne accorga.
# ---------------------------------------------------------------------------
echo "== categoria I (cron): differenza di sola spaziatura, non forward-only =="
# Gli otto job non nascono da un file solo: quattro migration chiamano
# cron.schedule. Verificarne uno solo lascerebbe scoperti gli altri tre.
CRON_FILE=(
  20260513120007_pg_cron_jobs.sql
  20260520120001_schedule_fcm_sync_trigger_cron.sql
  20260522112506_anonymize_left_members_cron.sql
  20260616070752_schedule_process_deletions_cron.sql
)
tot=0
for cf in "${CRON_FILE[@]}"; do
  if [ -f "$MIG/$cf" ]; then
    n=$(grep -c "cron.schedule" "$MIG/$cf")
    tot=$((tot + n))
    echo "  ok      $cf: $n chiamate a cron.schedule"
  else
    echo "  ROSSO   $cf non esiste: la ricostruzione perderebbe dei job e la"
    echo "          differenza I smetterebbe di essere cosmetica senza avvisare."
    esito=1
  fi
done
echo "  ($tot chiamate a cron.schedule in totale; i job vivi sono 8 da entrambe le"
echo "   parti, perche' alcune chiamate riprogrammano lo stesso nome)"

# ECCEZIONE TRACCIATA: public.admin_daily_aggregate
#
# Il corpo differisce anche dopo aver tolto commenti, spazi e maiuscole, ma la
# differenza sono QUATTRO ALIAS DI COLONNA dentro un RETURN QUERY di una
# funzione RETURNS TABLE. In quella posizione gli alias sono inerti: i nomi
# delle colonne li fissa RETURNS TABLE. Dimostrato sul container ricostruito
# confrontando due funzioni identiche salvo gli alias: stesso risultato.
#
# Non si scrive una forward-only per riallineare un alias: si registra. Se un
# giorno la differenza diventasse qualcos'altro, questa voce non basterebbe
# piu' e andrebbe riaperta.
#
# E' il dodicesimo cambiamento fuori banda noto: qualcuno ha ricreato la
# funzione senza gli alias, senza registrarlo. Innocuo qui, la pratica no.
# ---------------------------------------------------------------------------
echo "== eccezione tracciata: differenza reale ma inerte =="
if ls "$MIG"/*admin_functions*.sql >/dev/null 2>&1 || grep -rlq "admin_daily_aggregate" "$MIG"/*.sql; then
  echo "  ok      public.admin_daily_aggregate: alias di colonna in RETURN QUERY,"
  echo "          inerti sotto RETURNS TABLE. Registrata, non riallineata."
else
  echo "  ROSSO   nessuna migration definisce admin_daily_aggregate: l'eccezione"
  echo "          tracciata non ha piu' un oggetto a cui riferirsi."
  esito=1
fi

# ---------------------------------------------------------------------------
# CONTROLLO POSITIVO
#
# Non basta mostrare che grep sa dire di no: bisogna mostrare che QUESTO
# script diventa rosso. Si esercita verifica_voce, la stessa funzione usata
# sopra, su due voci deliberatamente false, e si pretende che entrambe
# falliscano. Se una delle due passasse, il verde di tutte le altre non
# significherebbe niente.
# ---------------------------------------------------------------------------
echo "== controllo positivo: verifica_voce deve rifiutare due voci false =="
cp_ok=0

# falsa 1: la migration esiste ma non nomina l'oggetto
verifica_voce "Z" "oggetto inventato" \
  "20260825120000_is_admin_su_user_roles.sql" \
  "questo_termine_non_compare_da_nessuna_parte_190" muto
if [ $? -ne 0 ]; then
  echo "  ok      rifiutata: migration presente ma termine assente"
else
  echo "  SONDA ROTTA: ha accettato una spiegazione che non nomina l'oggetto."
  cp_ok=1
fi

# falsa 2: la migration citata non esiste affatto
verifica_voce "Z" "oggetto inventato" \
  "29991231235959_migration_che_non_esiste.sql" "is_admin" muto
if [ $? -ne 0 ]; then
  echo "  ok      rifiutata: migration citata inesistente"
else
  echo "  SONDA ROTTA: ha accettato una migration che non esiste."
  cp_ok=1
fi

# e una vera deve continuare a passare, altrimenti la funzione dice sempre no
verifica_voce "Z" "controllo di segno opposto" \
  "20260825120000_is_admin_su_user_roles.sql" "is_admin" muto
if [ $? -eq 0 ]; then
  echo "  ok      una voce vera passa ancora: la funzione non dice no a tutto"
else
  echo "  SONDA ROTTA: rifiuta anche le voci vere."
  cp_ok=1
fi
esito=$(( esito | cp_ok ))

echo
if [ "$esito" -eq 0 ]; then
  echo "VERDE: tutte le differenze strutturali hanno una spiegazione verificabile."
else
  echo "ROSSO: almeno una differenza non e' spiegata. E' un blocker, non un dettaglio."
fi
exit "$esito"
