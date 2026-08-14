#!/usr/bin/env bash
#
# L'ORDINE DEI LOCK, PROVATO CON L'UPSERT LETTERALE DELLA 189
#
# L'analisi precedente diceva: "la 189 fa una UPDATE, quindi blocca la riga di
# b2c_subscriptions prima che parta il BEFORE trigger; basta che il percorso
# nuovo prenda quella riga per primo e i due ordini coincidono". Era sbagliata
# per un dettaglio che nessun test copriva: la 189 non fa una UPDATE.
#
#   admin.from("b2c_subscriptions").upsert(row, { onConflict: "user_id" })
#
# PostgREST lo traduce in `INSERT ... ON CONFLICT (user_id) DO UPDATE`, e in
# quella forma il BEFORE INSERT parte PRIMA dell'insert speculativa — cioe'
# prima che esista un lock sulla riga in conflitto. La guardia toccava quindi
# claims e states, e solo dopo l'executor prendeva b2c. Ordine claims -> b2c da
# una parte, b2c -> claims dall'altra: un ABBA.
#
# ── COME SI FA A FERMARE UNA FUNZIONE ATOMICA A META' ───────────────────────
#
# claim_store_purchase e record_store_purchase_revocation sono atomiche: dentro
# non si puo' infilare una pausa senza modificarle, e un test che modifica il
# codice che sta provando non prova niente.
#
# La pausa arriva da fuori, e da una risorsa che il codice prende DAVVERO: una
# terza sessione tiene l'advisory lock dell'utente — lo stesso
# pg_advisory_xact_lock(1, hashtext(user)) che le due funzioni prendono al
# gradino 2. Con l'ordine unico applicato, la sessione A prende la riga di
# b2c_subscriptions (gradino 1) e poi si ferma li', in attesa dell'advisory:
# tiene b2c e nient'altro. E' esattamente lo stato in cui serve trovarla.
#
# Nessuna delle tre sessioni esegue SQL inventato al posto del codice di
# produzione: A chiama la funzione vera, B esegue l'UPSERT letterale della 189,
# H prende un lock che esiste. L'unica cosa artificiale e' la DURATA della
# pausa, che in produzione sarebbe di microsecondi.
#
# ── COSA DEVE SUCCEDERE ─────────────────────────────────────────────────────
#
# Zero deadlock (SQLSTATE 40P01) in tutti i casi, e proiezione coerente col
# registro alla fine di ognuno. Un test che guardasse solo la proiezione
# passerebbe anche col deadlock: la vittima viene abortita, e chi sopravvive
# lascia comunque uno stato coerente. Per questo si controlla PRIMA il 40P01.
set -uo pipefail

CID="${SUPABASE_DB_CONTAINER:-supabase_db_fitmesh}"
Q() { docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA -c "$1"; }
FAIL_COUNT=0
fail()  { echo "  FAIL - $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
fatal() { echo "ORDINE LOCK: FATAL - $1"; exit 1; }

docker exec "$CID" true >/dev/null 2>&1 || fatal "container '$CID' non raggiungibile"

U='00000000-0000-4000-8000-00000000d001'
# K e' la transazione NUOVA che i due percorsi si contendono; K0 e' un acquisto
# precedente dello stesso utente, che esiste solo per far esistere la riga di
# public.b2c_subscriptions. La distinzione non e' cosmetica: e' la differenza
# fra un test che prova l'inversione e uno che passa da solo (vedi il CASO 1).
K='6000000000000001'
K0='6000000000000000'
LIFETIME='9999-12-31T23:59:59Z'
OUT=/tmp/ordine-lock

mkdir -p "$OUT"

# ── L'UPSERT LETTERALE DELLA 189 ────────────────────────────────────────────
# Copiato dalla forma che PostgREST genera per .upsert(row, {onConflict}) sulle
# dieci colonne che buildAppleRow() valorizza. Le colonne assenti dalla SET
# sono quelle che la 189 non scrive (created_at, updated_at).
upsert_189() {
  cat <<SQL
insert into public.b2c_subscriptions
  (user_id, billing_source, external_product_id, external_subscription_id,
   external_order_id, active_until, auto_renewing, state,
   raw_payload, last_notification_at)
values
  ('${U}', 'apple_iap', 'fitmesh_pro_lifetime', '${K}',
   null, '${LIFETIME}'::timestamptz, false, 'active',
   '{"fonte":"upsert letterale 189"}'::jsonb, now())
on conflict (user_id) do update set
  billing_source           = excluded.billing_source,
  external_product_id      = excluded.external_product_id,
  external_subscription_id = excluded.external_subscription_id,
  external_order_id        = excluded.external_order_id,
  active_until             = excluded.active_until,
  auto_renewing            = excluded.auto_renewing,
  state                    = excluded.state,
  raw_payload              = excluded.raw_payload,
  last_notification_at     = excluded.last_notification_at;
SQL
}

claim_sql() { # claim_sql [chiave]
  local chiave="${1:-$K}"
  cat <<SQL
select public.claim_store_purchase(
  'apple_iap', '${chiave}', '${U}'::uuid, 'fitmesh_pro_lifetime', 'lifetime',
  'production', 'active', '${LIFETIME}'::timestamptz, false,
  now(), 'apple_signed_date', 'tx-${chiave}', null
);
SQL
}

revoca_sql() { # revoca_sql [chiave]
  local chiave="${1:-$K}"
  cat <<SQL
select public.record_store_purchase_revocation(
  'apple_iap', '${chiave}', 'fitmesh_pro_lifetime', 'lifetime',
  now(), 'apple_signed_date', now() - interval '1 hour'
);
SQL
}

# Aspetta che una sessione sia DAVVERO in attesa di un lock, invece di sperare
# che una pausa fissa basti. Guarda pg_stat_activity, cioe' il fatto.
attendi_in_coda() { # attendi_in_coda <frammento-query> [secondi]
  local frammento="$1" limite="${2:-15}" i=0 n
  while [ "$i" -lt $((limite * 5)) ]; do
    n=$(Q "select count(*) from pg_stat_activity
            where state = 'active' and wait_event_type = 'Lock'
              and query like '%${frammento}%'
              and pid <> pg_backend_pid();")
    [ "$n" != "0" ] && return 0
    sleep 0.2; i=$((i + 1))
  done
  return 1
}

# Imposta PID_BG invece di stamparlo: `pid=$(bg ...)` farebbe partire il job
# dentro una subshell, e la shell principale non potrebbe piu' aspettarlo
# (wait su un non-figlio ritorna 127, e il test misurerebbe il nulla).
bg() { # bg <file-out> <sql>  -> PID_BG
  docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d postgres -X -tA \
    -v ON_ERROR_STOP=1 -c "$2" > "$1" 2>&1 &
  PID_BG=$!
}

# Il registro e' append-only e i suoi trigger lo impongono anche al
# proprietario della tabella: per rimettere il banco a zero fra un caso e
# l'altro vanno spenti e riaccesi, come gia' fanno 30/40/55. Se non lo si fa,
# il claim del giro precedente sopravvive come tombstone anonima e ogni caso
# successivo riceve 'owned_by_other_user' invece di eseguire cio' che prova.
teardown() {
  Q "begin; select set_config('billing.projection','on',true);
     delete from public.b2c_subscriptions where user_id='${U}'; commit;" >/dev/null 2>&1
  Q "alter table private.billing_purchase_states disable trigger billing_purchase_states_forward_only;
     alter table private.billing_purchase_claims disable trigger trg_billing_purchase_claims_immutable;
     delete from private.billing_purchase_states
       where billing_source='apple_iap' and ownership_key in ('${K}','${K0}');
     delete from private.billing_purchase_claims
       where billing_source='apple_iap' and ownership_key in ('${K}','${K0}');
     alter table private.billing_purchase_claims enable trigger trg_billing_purchase_claims_immutable;
     alter table private.billing_purchase_states enable trigger billing_purchase_states_forward_only;" >/dev/null 2>&1
  Q "delete from auth.users where id='${U}';" >/dev/null 2>&1
}
trap teardown EXIT INT TERM

seed_utente() {
  teardown
  Q "insert into auth.users (id, email, created_at)
     values ('${U}','ordine-lock@test.local', now());" >/dev/null \
    || fatal "seed utente non riuscito"
}

# Un acquisto PRECEDENTE (K0), che serve solo a far esistere la riga di
# proiezione. La transazione contesa (K) resta non registrata: e' la premessa
# senza la quale il CASO 1 non prova niente.
seed_acquisto_precedente() {
  Q "$(claim_sql "$K0")" >/dev/null || fatal "seed acquisto precedente non riuscito"
}

MODO_INIZIALE=$(Q "select mode from private.billing_projection_guard_mode where singleton;")
Q "update private.billing_projection_guard_mode
   set mode='compatibility', note='86-ordine-lock' where singleton;" >/dev/null
ripristina_modo() {
  Q "update private.billing_projection_guard_mode
     set mode='${MODO_INIZIALE}', note='86-ordine-lock teardown' where singleton;" >/dev/null 2>&1
}
# INT e TERM oltre a EXIT: questo test apre connessioni che dormono, quindi e'
# il piu' probabile da interrompere a meta'. Un giro ucciso lasciava due claim
# nel registro, e il test del backfill — che pretende la tabella VUOTA — falliva
# al giro dopo per una ragione che non c'entrava niente con lui.
trap 'teardown; ripristina_modo' EXIT INT TERM

# ── Il corpo comune dei casi 1-3 ────────────────────────────────────────────
#
# H tiene l'advisory dell'utente per 6 secondi. A parte a t=1 e si ferma con la
# riga b2c in mano. B parte a t=2 e incontra A. A t=6 H molla e A riparte: se
# gli ordini sono invertiti, il ciclo si chiude proprio qui.
corsa() { # corsa <nome> <sql-A> [frammento-query-A]
  local nome="$1" sql_a="$2" frammento="${3:-claim_store_purchase}"

  local pid_h pid_a pid_b
  bg "${OUT}/${nome}-H.out" \
    "begin; select pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext('${U}')); select pg_sleep(8); commit;"

  pid_h=$PID_BG
  sleep 1
  bg "${OUT}/${nome}-A.out" "$sql_a"

  pid_a=$PID_BG
  # NON `sleep 1`. La sequenza che questi casi vogliono e' "A entra in coda,
  # POI arriva B", e con una pausa fissa non e' garantita: fra avviare
  # `docker exec` e vedere la query in attesa passano centinaia di millisecondi
  # variabili, e quando B arrivava per primo la corsa provava un'altra cosa
  # senza dirlo. E' cosi' che il CASO 1M restava verde: B vinceva l'advisory,
  # registrava lui la chiave, e A trovava tutto gia' fatto.
  #
  # Si aspetta il FATTO invece di sperarlo: A dev'essere visibile in
  # pg_stat_activity mentre aspetta un lock.
  attendi_in_coda "$frammento" || {
    fail "${nome}: A non e' mai entrato in coda su un lock, la corsa non e' avvenuta"
    wait "$pid_h" >/dev/null 2>&1; wait "$pid_a" >/dev/null 2>&1
    return 1
  }
  bg "${OUT}/${nome}-B.out" "$(upsert_189)"

  pid_b=$PID_BG

  wait "$pid_h" >/dev/null 2>&1; local esito_h=$?
  wait "$pid_a" >/dev/null 2>&1; local esito_a=$?
  wait "$pid_b" >/dev/null 2>&1; local esito_b=$?

  echo "  esiti: H=${esito_h} A=${esito_a} B=${esito_b}"

  local morto=""
  for s in H A B; do
    if grep -qi 'deadlock detected' "${OUT}/${nome}-${s}.out"; then morto="${morto}${s} "; fi
  done
  DEADLOCK_IN="$morto"
  if [ -n "$morto" ]; then
    if [ "${ATTESO_DEADLOCK:-no}" = "si" ]; then return 1; fi
    fail "${nome}: DEADLOCK nelle sessioni ${morto}"
    grep -i -m2 'deadlock\|DETAIL' "${OUT}/${nome}-A.out" "${OUT}/${nome}-B.out" | sed 's/^/    /'
    return 1
  fi

  # Nessun deadlock non basta: fino al 13/08/2026 questa funzione guardava SOLO
  # la parola 'deadlock', quindi una sessione che moriva per qualunque altro
  # motivo — un errore di sintassi nel SQL del test, un permesso mancante, una
  # connessione caduta — passava per un successo. Un test che non sa distinguere
  # "non e' successo il male" da "non e' successo niente" non prova niente.
  if [ "${ATTESO_DEADLOCK:-no}" != "si" ] &&
     { [ "$esito_h" -ne 0 ] || [ "$esito_a" -ne 0 ] || [ "$esito_b" -ne 0 ]; }; then
    fail "${nome}: una sessione e' uscita con errore (H=${esito_h} A=${esito_a} B=${esito_b})"
    for s in H A B; do
      grep -i -m2 'ERROR\|FATAL' "${OUT}/${nome}-${s}.out" | sed "s/^/    ${s}: /"
    done
    return 1
  fi
  return 0
}

# La proiezione deve dire esattamente cio' che il registro sostiene. Non "un
# valore plausibile": il valore che _billing_project_entitlement ricalcolerebbe.
proiezione_coerente() { # proiezione_coerente <nome>
  local nome="$1"
  local reale atteso
  reale=$(Q "select coalesce((select t.billing_source || '|' || t.state
                                from public.b2c_subscriptions t where t.user_id='${U}'),
                               'nessuna riga');")
  atteso=$(Q "
    select coalesce(
      (select s.billing_source || '|' ||
              case when s.state = 'revoked' then 'expired' else s.state end
         from private.billing_purchase_states s
         join private.billing_purchase_claims c
           on c.billing_source = s.billing_source and c.ownership_key = s.ownership_key
        where c.owner_user_id = '${U}'
        order by case
                   when s.purchase_kind='lifetime' and s.state='active' then 0
                   when s.purchase_kind='subscription'
                    and s.state in ('active','grace','cancelled')
                    and s.active_until > now() then 1
                   else 2 end,
                 s.active_until desc, s.store_event_at desc, s.billing_source, s.ownership_key
        limit 1),
      'nessuna riga');")
  if [ "$reale" != "$atteso" ]; then
    fail "${nome}: proiezione '${reale}', il registro sostiene '${atteso}'"
    return 1
  fi
  echo "  proiezione coerente col registro: ${reale}"
  return 0
}

echo "############### ORDINE DEI LOCK — tre sessioni reali ###############"

# ── CASO 0: l'ordine dichiarato e' quello scritto, in tutti e tre i percorsi ─
#
# I casi 1-4 provano che oggi non si deadlocka. Non provano che l'ordine sia
# una REGOLA: basterebbe che qualcuno spostasse una riga per riaprire tutto,
# e i casi tornerebbero verdi o rossi a seconda di quale forma di istruzione
# capita in produzione quel giorno.
#
# Questo controllo legge la definizione delle funzioni DAL DATABASE — non dal
# file, che potrebbe non essere quello applicato — e verifica che dentro ogni
# corpo i tre gradini compaiano nell'ordine dichiarato.
#
# I COMMENTI VANNO TOLTI PRIMA DI CERCARE. Fino al 13/08/2026 non lo erano, e
# la cosa era invisibile perche' passava lo stesso: dentro claim_store_purchase
# c'e' un commento che NOMINA il `for key share`, e sta qualche riga sopra
# l'istruzione vera. `position()` trovava quello, cioe' il test misurava dove
# fosse scritta la spiegazione invece di dove fosse il lock. Con la spiegazione
# spostata sotto, o cancellata, il verdetto sarebbe cambiato senza che il
# codice cambiasse — e viceversa.
echo ""
echo "CASO 0 — l'ordine dei gradini e' quello dichiarato, letto dal database"
ORDINE=$(Q "
  with d as (
    select p.proname::text as nome,
           -- Via i commenti di riga: si cercano ISTRUZIONI, non prosa.
           pg_catalog.regexp_replace(
             pg_catalog.pg_get_functiondef(p.oid), '--[^\n]*', '', 'g') as def
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where (n.nspname, p.proname) in
      (('public','claim_store_purchase'),
       ('public','record_store_purchase_revocation'),
       ('private','_b2c_projection_guard'))
  ), pos as (
    select nome,
           position('for key share' in def) as g0,
           position('for update'    in def) as g1,
           least(
             coalesce(nullif(position('insert into private.billing_purchase_claims' in def), 0), 2147483647),
             coalesce(nullif(position('insert into private.billing_purchase_states' in def), 0), 2147483647)
           ) as g3
    from d
  )
  select string_agg(nome || '=' ||
           case when g0 = 0 then 'MANCA-auth.users'
                when g1 = 0 then 'MANCA-b2c'
                when g0 < g1 and g1 < g3 then 'ok'
                else 'INVERTITO(' || g0 || ',' || g1 || ',' || g3 || ')'
           end, ' ' order by nome)
  from pos;")
echo "  ${ORDINE}"
case "$ORDINE" in
  *MANCA*|*INVERTITO*) fail "caso0: l'ordine dei lock non e' quello dichiarato -> ${ORDINE}" ;;
  "") fatal "caso0: nessuna delle tre funzioni trovata nel database" ;;
  *) echo "CASO 0: PASS" ;;
esac

# ── CASO 1: UPSERT letterale 189 contro claim, riga b2c PRESENTE ────────────
echo ""
echo "CASO 1 — UPSERT letterale 189 contro claim_store_purchase, riga b2c PRESENTE"
#
# QUESTA E' L'INVERSIONE. Le due premesse contano tutte e due:
#
#   riga b2c PRESENTE   perche' e' l'unica cosa che il gradino 1 puo' bloccare.
#                       Senza riga, `for update` non blocca niente e non c'e'
#                       nessun ordine da invertire.
#   chiave K ASSENTE    perche' `insert ... on conflict do nothing` su una riga
#                       che esiste gia' non prende nessun lock. E' il motivo per
#                       cui la prima stesura di questo test passava senza il
#                       fix: seminava la chiave contesa, e la guardia non
#                       teneva piu' niente da contendere.
#
# Insieme sono la situazione piu' comune che esista: un cliente che ha gia' una
# riga di abbonamento — un rinnovo precedente, un Founder — e presenta una
# transazione nuova.
seed_utente
seed_acquisto_precedente
N=$(Q "select count(*) from public.b2c_subscriptions where user_id='${U}';")
[ "$N" = "1" ] || fatal "premessa del caso 1: la riga b2c doveva esistere (trovate ${N})"
N=$(Q "select count(*) from private.billing_purchase_claims
       where billing_source='apple_iap' and ownership_key='${K}';")
[ "$N" = "0" ] || fatal "premessa del caso 1: la chiave contesa doveva essere nuova (trovate ${N})"
if corsa "caso1" "$(claim_sql)"; then
  proiezione_coerente "caso1" && echo "CASO 1: PASS"
fi

# ── CASO 1M: la mutazione deve morire ───────────────────────────────────────
#
# Il CASO 1 dice "nessun deadlock". E' credibile solo se questa impalcatura sa
# produrne uno: tre sessioni, due `sleep` e un advisory lock sono abbastanza
# parti mobili perche' un test possa diventare verde per il motivo sbagliato —
# le sessioni non si incrociano piu', e nessuno se ne accorge.
#
# Qui si prende la funzione VERA dal catalogo, le si tolgono i due gradini in
# testa (cioe' la si riporta a com'era prima della correzione) e si rifa'
# esattamente la corsa del CASO 1. Deve andare in deadlock. Se non ci va, il
# fallimento e' di questo file, non del codice: significa che il CASO 1 non
# sorveglia piu' niente.
echo ""
echo "CASO 1M — la versione senza i due gradini DEVE andare in deadlock"
CLAIM_ORIGINALE=$(Q "select pg_catalog.pg_get_functiondef('public.claim_store_purchase(text,text,uuid,text,text,text,text,timestamptz,boolean,timestamptz,text,text,uuid)'::regprocedure);")
[ -n "$CLAIM_ORIGINALE" ] || fatal "caso1M: claim_store_purchase non trovata nel catalogo"

ripristina_claim() {
  [ -n "${CLAIM_ORIGINALE:-}" ] || return 0
  printf '%s;\n' "$CLAIM_ORIGINALE" > "${OUT}/claim-originale.sql"
  docker cp "${OUT}/claim-originale.sql" "$CID":/tmp/claim-originale.sql >/dev/null 2>&1
  docker exec -e PGPASSWORD=postgres "$CID" \
    psql -U postgres -d postgres -X -q -f /tmp/claim-originale.sql >/dev/null 2>&1
}
# Il ripristino entra nei trap PRIMA di installare il mutante: se il test viene
# ucciso a meta', il database non deve restare con una funzione mutilata.
trap 'ripristina_claim; teardown; ripristina_modo' EXIT INT TERM

printf '%s;\n' "$CLAIM_ORIGINALE" \
  | perl -0pe 's/^\s*perform 1 from auth\.users u where u\.id = p_owner_user_id for key share;\s*$//m;
               s/^\s*perform 1 from public\.b2c_subscriptions t\s*\n\s*where t\.user_id = p_owner_user_id for update;\s*$//m' \
  > "${OUT}/claim-mutante.sql"
# Si contano ISTRUZIONI, non prosa: dentro la funzione c'e' un commento che
# nomina il `for key share`, e contarlo farebbe credere che la mutazione non
# abbia funzionato. E' la stessa trappola del CASO 0, un livello piu' in la'.
senza_commenti() { perl -pe 's/--.*//' "$1"; }
GRADINI_PRIMA=$(printf '%s;\n' "$CLAIM_ORIGINALE" | perl -pe 's/--.*//' \
  | grep -c 'for key share\|for update' || true)
GRADINI_DOPO=$(senza_commenti "${OUT}/claim-mutante.sql" \
  | grep -c 'for key share\|for update' || true)
[ "$GRADINI_PRIMA" = "2" ] \
  || fatal "caso1M: nella funzione vera i gradini dovevano essere 2, trovati ${GRADINI_PRIMA} — il testo e' cambiato, aggiornare il pattern"
[ "$GRADINI_DOPO" = "0" ] \
  || fatal "caso1M: la mutazione non ha tolto i due gradini (ne restano ${GRADINI_DOPO})"
docker cp "${OUT}/claim-mutante.sql" "$CID":/tmp/claim-mutante.sql >/dev/null
docker exec -e PGPASSWORD=postgres "$CID" \
  psql -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 -f /tmp/claim-mutante.sql >/dev/null \
  || fatal "caso1M: installazione del mutante non riuscita"

# ── La corsa del CASO 1M usa una pausa DIVERSA, e il motivo va scritto ─────
#
# Il primo tentativo riusava la corsa del CASO 1 (H tiene l'advisory, A poi B).
# Con la mutazione installata il deadlock NON arrivava, e non perche' il codice
# fosse a posto: perche' A e B finivano tutti e due in coda sullo stesso
# advisory lock, e chi lo ottiene per primo quando H molla decide l'esito. Una
# monetina. Se B vince, la sua guardia registra la chiave, A trova tutto fatto
# e nessuno si contende niente.
#
# Qui la pausa e' sulla RIGA di b2c_subscriptions, e l'ordine di partenza e'
# invertito. Cosi' il ciclo non e' possibile, e' OBBLIGATO:
#
#   H  tiene la riga b2c e dorme
#   B  UPSERT 189 -> la guardia vuole la riga: si mette in coda, prima
#   A  claim mutato -> l'advisory e' libero, se lo prende, scrive nel registro
#      e alla proiezione vuole la riga: si mette in coda, seconda
#   H  molla. La riga va a B, che era primo. B chiede l'advisory: ce l'ha A.
#      A aspetta la riga: ce l'ha B.                              -> ciclo
#
# E la stessa corsa col codice VERO non puo' chiudere il ciclo, perche' A la
# riga la chiede al gradino 1 — prima di prendere qualunque advisory — quindi
# si limita ad accodarsi dietro B e ad aspettare il suo turno.
corsa_riga_contesa() { # corsa_riga_contesa <nome>
  local nome="$1" pid_h pid_a pid_b
  bg "${OUT}/${nome}-H.out" \
    "begin; select 1 from public.b2c_subscriptions where user_id='${U}' for update; select pg_sleep(8); commit;"
  pid_h=$PID_BG
  sleep 1
  bg "${OUT}/${nome}-B.out" "$(upsert_189)"
  pid_b=$PID_BG
  attendi_in_coda "insert into public.b2c_subscriptions" || {
    fail "${nome}: l'UPSERT 189 non e' mai entrato in coda sulla riga"
    wait "$pid_h" >/dev/null 2>&1; wait "$pid_b" >/dev/null 2>&1
    return 1
  }
  bg "${OUT}/${nome}-A.out" "$(claim_sql)"
  pid_a=$PID_BG

  wait "$pid_h" >/dev/null 2>&1
  wait "$pid_a" >/dev/null 2>&1
  wait "$pid_b" >/dev/null 2>&1

  DEADLOCK_IN=""
  for s in H A B; do
    grep -qi 'deadlock detected' "${OUT}/${nome}-${s}.out" && DEADLOCK_IN="${DEADLOCK_IN}${s} "
  done
  [ -z "$DEADLOCK_IN" ]
}

seed_utente
seed_acquisto_precedente
if corsa_riga_contesa "caso1M"; then
  fail "caso1M: la versione SENZA i gradini non ha prodotto deadlock: questa impalcatura non e' in grado di vedere il difetto che il CASO 1 dichiara di sorvegliare"
else
  echo "  deadlock nelle sessioni: ${DEADLOCK_IN}"
  echo "CASO 1M: PASS (il difetto e' riproducibile, quindi il CASO 1 significa qualcosa)"
fi
ripristina_claim

# ── CASO 1B: la stessa corsa, col codice VERO ──────────────────────────────
echo ""
echo "CASO 1B — la corsa che uccide il mutante, contro la funzione vera"
seed_utente
seed_acquisto_precedente
if corsa_riga_contesa "caso1B"; then
  proiezione_coerente "caso1B" && echo "CASO 1B: PASS"
else
  fail "caso1B: DEADLOCK nelle sessioni ${DEADLOCK_IN}"
fi

# ── CASO 2: la stessa corsa con la riga b2c ASSENTE ─────────────────────────
#
# Il gradino 1 non blocca niente quando la riga non c'e': l'ordine non e' piu'
# imposto da un lock di riga, e a serializzare restano l'advisory sull'utente e
# l'indice unico su user_id. E' il caso in cui una difesa "basta prendere la
# riga per prima" smette silenziosamente di difendere, quindi va provato.
echo ""
echo "CASO 2 — la stessa corsa con la riga b2c ASSENTE (primo acquisto)"
seed_utente
N=$(Q "select count(*) from public.b2c_subscriptions where user_id='${U}';")
[ "$N" = "0" ] || fatal "premessa del caso 2: la riga b2c non doveva esistere (trovate ${N})"
if corsa "caso2" "$(claim_sql)"; then
  proiezione_coerente "caso2" && echo "CASO 2: PASS"
fi

# ── CASO 3: UPSERT letterale 189 contro la REVOCA ───────────────────────────
echo ""
echo "CASO 3 — UPSERT letterale 189 contro record_store_purchase_revocation"
seed_utente
seed_acquisto_precedente
Q "$(claim_sql)" >/dev/null || fatal "seed del caso 3: la chiave da revocare non e' registrata"
if corsa "caso3" "$(revoca_sql)" "record_store_purchase_revocation"; then
  # Qui la coerenza ha un contenuto in piu': l'UPSERT della 189 arriva DOPO la
  # revoca e prova a rimettere 'active'. La guardia deve scartarlo.
  STATO=$(Q "select state from private.billing_purchase_states
             where billing_source='apple_iap' and ownership_key='${K}';")
  if [ "$STATO" != "revoked" ]; then
    fail "caso3: il registro dice '${STATO}', la revoca non e' sopravvissuta all'UPSERT della 189"
  else
    proiezione_coerente "caso3" && echo "CASO 3: PASS"
  fi
fi

# ── CASO 4: concorrenza con la cancellazione GDPR ───────────────────────────
#
# Due forme, perche' non sono la stessa cosa:
#   4a  gdpr_process_deletions(): `delete from public.profiles` (cascata verso
#       b2c) e poi `delete from auth.users` (cascata verso claims). L'ordine
#       b2c -> claims e' scritto nel codice.
#   4b  auth.admin.deleteUser(): una sola `delete from auth.users`, che scatena
#       ENTRAMBE le cascate nello stesso statement. L'ordine fra due RI action
#       non e' documentato, quindi non e' un ordine su cui appoggiarsi: va
#       provato che nessuno dei due possibili lo rompe.
echo ""
echo "CASO 4a — claim in corsa con la cancellazione GDPR (profiles, poi auth.users)"
seed_utente
seed_acquisto_precedente
bg "${OUT}/caso4a-H.out" \
  "begin; select pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext('${U}')); select pg_sleep(6); commit;"

pid_h=$PID_BG
sleep 1
bg "${OUT}/caso4a-A.out" "$(claim_sql)"

pid_a=$PID_BG
sleep 1
bg "${OUT}/caso4a-B.out" \
  "begin; delete from public.profiles where id='${U}'; delete from auth.users where id='${U}'; commit;"

pid_b=$PID_BG
wait "$pid_h" >/dev/null 2>&1
wait "$pid_a" >/dev/null 2>&1
wait "$pid_b" >/dev/null 2>&1; ESITO_B=$?
MORTO=""
for s in H A B; do
  grep -qi 'deadlock detected' "${OUT}/caso4a-${s}.out" && MORTO="${MORTO}${s} "
done
if [ -n "$MORTO" ]; then
  fail "caso4a: DEADLOCK nelle sessioni ${MORTO}"
else
  # La cancellazione deve avere vinto: l'account non esiste piu', la proiezione
  # e' sparita con lui, e il claim resta come tombstone anonimo — cioe' nessuno
  # potra' impadronirsi di quell'acquisto, e il supporto sa che era di qualcuno.
  N_UTENTE=$(Q "select count(*) from auth.users where id='${U}';")
  N_B2C=$(Q "select count(*) from public.b2c_subscriptions where user_id='${U}';")
  ANON=$(Q "select coalesce((select (owner_user_id is null)::text
              from private.billing_purchase_claims
              where billing_source='apple_iap' and ownership_key='${K0}'), 'claim sparito');")
  if [ "$N_UTENTE" != "0" ] || [ "$N_B2C" != "0" ]; then
    fail "caso4a: la cancellazione GDPR non ha ripulito (utente=${N_UTENTE} b2c=${N_B2C}, esito=${ESITO_B})"
  elif [ "$ANON" != "true" ]; then
    fail "caso4a: il claim non e' un tombstone anonimo (owner is null => '${ANON}')"
  else
    echo "  utente e proiezione cancellati, claim anonimizzato"
    echo "CASO 4a: PASS"
  fi
fi

echo ""
echo "CASO 4b — claim in corsa con auth.admin.deleteUser() (una sola DELETE, due cascate)"
seed_utente
seed_acquisto_precedente
bg "${OUT}/caso4b-H.out" \
  "begin; select pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext('${U}')); select pg_sleep(6); commit;"

pid_h=$PID_BG
sleep 1
bg "${OUT}/caso4b-A.out" "$(claim_sql)"

pid_a=$PID_BG
sleep 1
bg "${OUT}/caso4b-B.out" "delete from auth.users where id='${U}';"

pid_b=$PID_BG
wait "$pid_h" >/dev/null 2>&1
wait "$pid_a" >/dev/null 2>&1
wait "$pid_b" >/dev/null 2>&1; ESITO_B=$?
MORTO=""
for s in H A B; do
  grep -qi 'deadlock detected' "${OUT}/caso4b-${s}.out" && MORTO="${MORTO}${s} "
done
if [ -n "$MORTO" ]; then
  fail "caso4b: DEADLOCK nelle sessioni ${MORTO}"
else
  N_UTENTE=$(Q "select count(*) from auth.users where id='${U}';")
  N_B2C=$(Q "select count(*) from public.b2c_subscriptions where user_id='${U}';")
  ANON=$(Q "select coalesce((select (owner_user_id is null)::text
              from private.billing_purchase_claims
              where billing_source='apple_iap' and ownership_key='${K0}'), 'claim sparito');")
  if [ "$N_UTENTE" != "0" ] || [ "$N_B2C" != "0" ]; then
    fail "caso4b: la cancellazione non ha ripulito (utente=${N_UTENTE} b2c=${N_B2C}, esito=${ESITO_B})"
  elif [ "$ANON" != "true" ]; then
    fail "caso4b: il claim non e' un tombstone anonimo (owner is null => '${ANON}')"
  else
    echo "  utente e proiezione cancellati, claim anonimizzato"
    echo "CASO 4b: PASS"
  fi
fi

echo ""
echo "CASO 4c — UPSERT letterale 189 in corsa con auth.admin.deleteUser()"
#
# La 189 non chiama nessuna RPC: scrive direttamente, e il suo unico contatto
# col registro passa dalla guardia. Se la cancellazione arriva mentre l'upsert
# e' a meta', il cliente cancellato non deve lasciarsi dietro ne' una riga di
# proiezione risorta ne' un claim intestato a un utente che non esiste piu'.
seed_utente
seed_acquisto_precedente
bg "${OUT}/caso4c-H.out" \
  "begin; select pg_catalog.pg_advisory_xact_lock(1, pg_catalog.hashtext('${U}')); select pg_sleep(6); commit;"
pid_h=$PID_BG
sleep 1
bg "${OUT}/caso4c-A.out" "$(claim_sql)"
pid_a=$PID_BG
sleep 1
bg "${OUT}/caso4c-B.out" "$(upsert_189)"
pid_b=$PID_BG
sleep 1
bg "${OUT}/caso4c-C.out" "delete from auth.users where id='${U}';"
pid_c=$PID_BG
wait "$pid_h" >/dev/null 2>&1
wait "$pid_a" >/dev/null 2>&1
wait "$pid_b" >/dev/null 2>&1
wait "$pid_c" >/dev/null 2>&1
MORTO=""
for s in H A B C; do
  grep -qi 'deadlock detected' "${OUT}/caso4c-${s}.out" && MORTO="${MORTO}${s} "
done
if [ -n "$MORTO" ]; then
  fail "caso4c: DEADLOCK nelle sessioni ${MORTO}"
else
  RESIDUO=$(Q "select count(*) from public.b2c_subscriptions t
               where not exists (select 1 from auth.users u where u.id = t.user_id);")
  ORFANI=$(Q "select count(*) from private.billing_purchase_claims c
              where c.owner_user_id is not null
                and not exists (select 1 from auth.users u where u.id = c.owner_user_id);")
  if [ "$RESIDUO" != "0" ]; then
    fail "caso4c: ${RESIDUO} righe di proiezione sopravvissute alla cancellazione dell'utente"
  elif [ "$ORFANI" != "0" ]; then
    fail "caso4c: ${ORFANI} claim intestati a un utente che non esiste piu'"
  else
    echo "  nessuna proiezione orfana, nessun claim intestato a un fantasma"
    echo "CASO 4c: PASS"
  fi
fi

echo ""
echo "=================================================="
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "ORDINE DEI LOCK: nessun deadlock, proiezione coerente"
  echo "=================================================="
  exit 0
fi
echo "ORDINE DEI LOCK: ${FAIL_COUNT} FALLIMENTI (output in ${OUT}/)"
echo "=================================================="
exit 1
