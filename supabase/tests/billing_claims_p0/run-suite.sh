#!/usr/bin/env bash
# Sprint P0 Apple IAP, FASE 2/3: suite del registro di proprieta' degli
# acquisti (migration 20260808211929_billing_purchase_claims_registry.sql).
#
# A differenza delle altre suite di questo repository, questa NON ricostruisce
# uno schema minimo in un container usa e getta: gira contro lo stack locale
# gia' avviato con `supabase start`. Il motivo e' che i casi che contano di
# piu' dipendono da oggetti veri e non simulabili a mano senza cambiarne il
# comportamento: auth.users con la sua FK e la sua cancellazione (tombstone),
# il trigger on_auth_user_created che crea i profili, i ruoli anon /
# authenticated / service_role per le verifiche ACL.
#
# Il file SQL apre una transazione e la chiude con ROLLBACK: al termine il
# database locale e' esattamente come prima. Nessuna scrittura sopravvive.
#
# Uso:
#   supabase start
#   supabase/tests/billing_claims_p0/run-suite.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIR="$REPO_ROOT/supabase/tests/billing_claims_p0"
CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"
DBN="${SUPABASE_DB_NAME:-postgres}"

if ! docker exec "$CID" true >/dev/null 2>&1; then
  echo "Container '$CID' non raggiungibile. Avviare prima lo stack locale con 'supabase start'." >&2
  exit 1
fi

# Tutti i file, non solo il primo. Finche' la suite ne eseguiva uno
# solo, gli altri tre esistevano sul disco e non venivano mai eseguiti: una
# suite che copre meno di quanto sembra e' peggio di una che non esiste,
# perche' il suo verde viene creduto.
# REGISTRO DI ESECUZIONE. Ogni file che gira davvero finisce qui dentro, e in
# fondo al file il guardrail lo confronta col contenuto della directory.
#
# Prima il guardrail cercava i NOMI dentro questo script: commentare una riga
# lasciandone il nome bastava a spegnerla senza che nessuno se ne accorgesse.
# Un nome scritto e' un'intenzione; questo elenco e' un fatto.
ESEGUITI=""

run_sql() {
  ESEGUITI="$ESEGUITI $1"
  echo ""
  echo "### $1"
  docker cp "$DIR/$1" "$CID":/tmp/suite_under_test.sql >/dev/null
  docker exec -e PGPASSWORD=postgres "$CID" \
    psql -U postgres -d "$DBN" -v ON_ERROR_STOP=1 -f /tmp/suite_under_test.sql
}

# Gemella per i file .sh: prima erano nove coppie echo/bash scritte a mano, e
# cancellare la riga `bash` lasciando l'`echo` stampava l'intestazione di un
# file che non girava. Con una funzione sola, l'intestazione e l'esecuzione non
# si possono piu' separare.
run_sh() {
  ESEGUITI="$ESEGUITI $1"
  echo ""
  echo "### $1"
  bash "$DIR/$1"
}

# PRIMA DI TUTTO: che la suite esegua davvero cio' che il repository contiene.
# PRECONDIZIONE: schema pulito.
#
# `87-rollback-verificato.sh` esegue i rollback per davvero, e quelli si
# rifiutano — giustamente — di eliminare tabelle che contengono righe. Se
# questa suite gira su un database su cui e' gia' passato qualcos'altro,
# fallisce per lo stato ereditato e non per un difetto, e il messaggio che
# stampa manda a cercare nel posto sbagliato.
#
# Meglio dirlo qui, in una riga, che farlo scoprire in fondo a duecento righe
# di output.
SPORCO=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA -c "
  select coalesce(sum(n), 0) from (
    select count(*) as n from private.billing_purchase_claims
    union all select count(*) from private.billing_purchase_states
    union all select count(*) from private.billing_pending_revocations
  ) t;" 2>/dev/null)
if [ "${SPORCO:-0}" != "0" ]; then
  echo "PRECONDIZIONE NON SODDISFATTA: il registro contiene gia' ${SPORCO} righe." >&2
  echo "Questa suite pretende uno schema pulito. Rieseguire prima:" >&2
  echo "  supabase/tests/reset-pg17/esegui-reset.sh" >&2
  exit 1
fi

run_sh 00-guardrail-suite-completa.sh

# 87 PRIMA di tutto il resto, e non per gusto dell'ordine.
#
# Prova il rollback ESEGUENDOLO, dentro una transazione che si annulla. Gli
# script di rollback si rifiutano — giustamente — di eliminare tabelle che
# contengono righe: cancellarle sarebbe perdere lo stato verificato di
# altrettanti acquisti. Ma i file `.sh` di questa suite COMMETTONO, quindi
# eseguendolo in fondo trovava sempre righe e falliva per lo stato lasciato
# dagli altri, non per un difetto del rollback.
#
# Qui davanti lo stato e' quello della ricostruzione, cioe' vuoto, e la sua
# transazione si annulla: non disturba nessuno dei file che seguono.
run_sh 87-rollback-verificato.sh

run_sql 10-functional-tests.sql
run_sql 20-ownership-persistence-tests.sql
run_sql 25-payload-sanitization-tests.sql
run_sql 45-advisor-exposure.sql
# B': prima la baseline ROSSA (ricrea in transazione la funzione del commit
# 262ade1 e dimostra che quegli scenari fallivano davvero), poi la matrice
# della precedenza. L'ordine conta: la seconda si legge solo dopo la prima.
run_sql 48-red-baseline-last-write-wins.sql
run_sql 50-entitlement-precedence.sql
# La finestra fra migration e deploy: si simula l'istante esatto in cui la
# migration e' applicata e il backend in produzione e' ancora quello vecchio.
run_sql 60-rollout-window.sql
# Le finestre di crash che il database puo' dimostrare. Le altre cinque sono
# argomentate in supabase/rollback/README-finestre-di-crash.md.
run_sql 70-crash-windows.sql
# I nove punti del cancello di ripresa: la parte che il database dimostra.
# L'ordine interno del file non e' quello dei numeri, e il file spiega perche'.
run_sql 80-nove-punti.sql
# Il percorso Sandbox per App Review: il permesso e' della persona, scade, e
# non e' raggiungibile dal client.
run_sql 88-sandbox-revisori.sql
# La revoca che aspetta il suo acquisto, e il cancello Sandbox come vincolo
# della tabella invece che controllo della route.
run_sql 89-attesa-e-sandbox.sql
# Il PAREGGIO di store_event_at: il claim e la revoca nello stesso istante, che
# e' cio' che la route legacy genera passando un solo requestDateMs a entrambe
# le chiamate. Era RED e mai eseguito da nessuno.
run_sql 91-red-pareggio-claim.sql
# L'autorita' e' una sola, e nel dubbio la riga in attesa resta.
run_sql 92-autorita-unica-revoche.sql
# Il pareggio nel verso OPPOSTO: un `active` non riaccende un rimborso. 91 non
# lo osserva mai, perche' costruisce il pareggio con l'acquisto non reclamato.
run_sql 93-pareggio-verso-opposto.sql

# Questi due aprono connessioni proprie: la corsa a due connessioni reali non
# si puo' simulare dentro una singola sessione psql.
run_sh 30-backfill-tests.sh

run_sh 35-backfill-fixtures.sh

run_sh 40-concurrency.sh

run_sh 55-concurrency-entitlement.sh

# La corsa fra una scrittura di compatibilita' in volo e il passaggio a strict.
# Anche questo apre connessioni proprie, e misura l'attesa: senza quella
# misura, l'esito giusto potrebbe essere un caso.
run_sh 85-corsa-strict.sh

# L'ordine dei lock, provato con l'UPSERT letterale della 189 e con la
# cancellazione account. Tre e quattro sessioni reali: la pausa che serve a
# fermare una funzione atomica a meta' arriva da un advisory lock tenuto da
# fuori, non da una modifica al codice sotto prova.
run_sh 86-ordine-lock.sh

# I rollback, ESEGUITI. Dentro una transazione che si annulla, quindi il
# database resta identico; ma i drop vengono provati per davvero, ed e' cosi'
# che si e' scoperto che uno puntava a una firma che non esisteva piu' e che a
# una migration mancava del tutto il rollback.
# Il GDPR VERO contro il claim, con la mutazione che prova che il test sa
# vedere il deadlock che dichiara di sorvegliare.
run_sh 90-gdpr-ordine-lock.sh


# ULTIMA ISTRUZIONE, e deve restare l'ultima: il conto si chiude qui.
#
# Il guardrail riceve il registro di cio' che e' stato eseguito davvero e lo
# confronta con la directory. Se un file esiste e non e' passato di qui, la
# suite fallisce — anche se il suo nome comparisse altrove in questo script.
bash "$DIR/00-guardrail-suite-completa.sh" --eseguiti $ESEGUITI
