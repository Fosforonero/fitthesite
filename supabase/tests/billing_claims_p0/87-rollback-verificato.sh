#!/usr/bin/env bash
#
# UN ROLLBACK CHE NON E' STATO ESEGUITO NON E' UN ROLLBACK VERIFICATO.
#
# Il difetto che ha reso necessario questo file: il rollback della migration
# degli stati faceva
#
#     drop function if exists public.record_store_purchase_revocation(
#       text, text, text, text, timestamptz, text);
#
# cioe' la firma a SEI argomenti, mentre la funzione viva ne ha SETTE da quando
# 20260812093000 ha separato l'efficacia del rimborso dalla freschezza della
# fotografia. `drop function if exists` con la firma sbagliata non e' un errore
# rumoroso: non trova niente e passa in silenzio. Il rollback sembrava riuscito
# e lasciava in piedi una funzione che, dopo il `drop table` della riga
# successiva, puntava a una tabella inesistente.
#
# Un controllo statico — "ogni firma creata compare in qualche rollback" —
# avrebbe preso questo caso e non altri: le dipendenze fra oggetti, l'ordine dei
# drop, un trigger che impedisce di droppare la sua tabella. Quelli si vedono
# solo eseguendo.
#
# ── COME SI ESEGUE SENZA DISTRUGGERE NIENTE ────────────────────────────────
#
# Tutto dentro UNA transazione che finisce in `rollback`. In PostgreSQL il DDL
# e' transazionale: `drop function`, `drop trigger`, `drop table` e
# `alter table` si annullano come qualunque altra cosa. Alla fine il database
# e' identico a com'era, e nel frattempo abbiamo visto se i drop trovano
# davvero qualcosa e se l'ordine regge.
#
# I file di rollback contengono `begin;` e `commit;` propri: vanno tolti, o il
# commit renderebbe permanente cio' che stiamo solo provando. E' l'unica
# modifica applicata al loro contenuto, ed e' meccanica.
set -uo pipefail

# Nessun bersaglio predefinito: la guardia impone le due variabili, rifiuta il
# container condiviso, e pretende PG17 piu' la sentinella dell'ambiente isolato.
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/bersaglio.sh"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../rollback" && pwd)"
FAIL=0

# ── L'ELENCO NON PUO' PIU' INVECCHIARE IN SILENZIO ─────────────────────────
#
# Il difetto (3B-H07): l'elenco qui sotto e' cablato a mano, e per settimane e'
# rimasto fermo a `20260816120000` mentre in `supabase/rollback/` arrivavano
# file nuovi. Un rollback che nessuno esegue non e' un rollback verificato — che
# e' esattamente la frase in testa a questo file, applicata al file stesso.
#
# La guardia confronta nei DUE sensi l'insieme esercitato con quello presente su
# disco, meno le rollback che un ALTRO gate esercita: quelle non si esercitano
# qui, perche' appartengono alla catena forward-only del blocco 3B e vanno
# provate nelle due modalita' di transazione, che e' il mestiere del gate 18.
#
# Aggiungere una rollback e dimenticare di esercitarla ovunque e' un ROSSO.
#
# ── PERCHE' L'ESCLUSIONE NON E' PIU' UN ELENCO ────────────────────────────
#
# Fino al 01/09/2026 qui c'era una riga cablata:
#
#   PENDING_190="20260825130000 20260825130100 20260825130200 20260825130300 20260827120000"
#
# cioe' la stessa forma di difetto che questo blocco esiste per impedire, un
# piano piu' su: un elenco a mano che nessuno aggiorna. Quando il blocco 3B ha
# preso le tre migration dashboard, l'elenco e' rimasto a cinque e il gate e'
# diventato rosso — bene — ma la correzione ovvia (aggiungerne tre) avrebbe
# rimesso in piedi lo stesso invecchiamento.
#
# L'esclusione ora e' una RELAZIONE VERIFICABILE, non una dichiarazione:
# si CHIEDE al gate 18 quali file esercita, e lui lo deriva dal manifesto con
# lo stesso codice che poi li esegue. Il gate 18, dal canto suo, confronta in
# fondo l'insieme dichiarato con quello eseguito. Quindi:
#
#   escluso qui  <=>  dichiarato da 18  <=>  eseguito da 18
#
# Se 18 smette di esercitare un file, la sua dichiarazione si accorcia, quel
# file ricompare fra i MANCANTI di questo gate, e questo gate diventa rosso.
# Nessuna delle due parti puo' invecchiare da sola.
RUNNER_18="$(cd "$(dirname "${BASH_SOURCE[0]}")/../integrazione-190" && pwd)/18-rollback-due-modalita.sh"
if [ ! -x "$RUNNER_18" ] && [ ! -f "$RUNNER_18" ]; then
  echo "ROSSO: 18-rollback-due-modalita.sh non esiste: l'esclusione non e' verificabile."
  echo "       Senza di lui questo gate non sa quali rollback sono esercitati altrove."
  exit 1
fi
ESERCITATE_DA_18="$(bash "$RUNNER_18" --dichiara 2>&1)" || {
  echo "ROSSO: il gate 18 non sa dichiarare cosa esercita:"
  printf '%s\n' "$ESERCITATE_DA_18" | sed 's/^/       /'
  exit 1
}
[ -n "$ESERCITATE_DA_18" ] || { echo "ROSSO: il gate 18 dichiara un insieme vuoto."; exit 1; }
fail() { echo "  FAIL - $1"; FAIL=$((FAIL + 1)); }

docker exec "$CID" true >/dev/null 2>&1 || { echo "ROLLBACK: container non raggiungibile"; exit 1; }

echo "############### IL ROLLBACK, ESEGUITO PER DAVVERO ###############"

# ── L'inventario di cio' che deve sparire ──────────────────────────────────
#
# Non una lista scritta a mano: si interroga il catalogo. Una funzione nuova
# aggiunta domani e dimenticata nei rollback finisce qui dentro da sola.
INVENTARIO="
  select coalesce(string_agg(nome, E'\n' order by nome), '') from (
    select n.nspname || '.' || p.proname || '(' ||
           pg_catalog.pg_get_function_identity_arguments(p.oid) || ')' as nome
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'private' and p.proname like '%billing%')
       or (n.nspname = 'private' and p.proname like '%b2c%')
       or (n.nspname = 'public'  and p.proname in
             ('claim_store_purchase','record_store_purchase_revocation'))
    union all
    select 'trigger ' || t.tgname || ' su ' || t.tgrelid::regclass::text
    from pg_catalog.pg_trigger t
    where not t.tgisinternal
      and (t.tgname like '%billing%' or t.tgname like '%b2c%')
      -- Non e' roba di questo lavoro: esiste da 20260514120004, tiene
      -- aggiornato updated_at e nessun rollback del billing deve toglierlo.
      and t.tgname <> 'trg_b2c_subscriptions_updated_at'
    union all
    select 'tabella ' || c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private' and c.relkind = 'r' and c.relname like 'billing%'
  ) s;"

PRIMA=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA -c "$INVENTARIO")
N_PRIMA=$(printf '%s\n' "$PRIMA" | grep -c . || true)
echo "oggetti billing presenti prima: ${N_PRIMA}"
[ "$N_PRIMA" -gt 5 ] || { echo "ROLLBACK: FATAL - il database non ha le migration applicate (${N_PRIMA} oggetti)"; exit 1; }

# ── La prova ───────────────────────────────────────────────────────────────
#
# I tre rollback in ordine inverso di applicazione, piu' il controllo finale,
# tutto in una transazione sola che si annulla.
ESERCITATE="20260816120000_billing_consuma_pending_senza_ramo_irraggiungibile_rollback.sql
20260815120000_billing_autorita_unica_revoche_rollback.sql
20260814160000_billing_sandbox_scadenza_effettiva_rollback.sql
20260813150000_billing_gate_avversariale_rollback.sql
20260813103000_billing_sandbox_reviewers_rollback.sql
20260812093000_billing_p0_nove_punti_rollback.sql
20260810140000_b2c_projection_guard_rollback.sql
20260810120000_billing_purchase_states_rollback.sql
20260808211929_billing_purchase_claims_registry_rollback.sql"

# ── LA TERZA CATEGORIA, E PERCHE' ESISTE ───────────────────────────────────
#
# Questi due rollback NON sono eseguibili in questa catena, e lo dicono da se':
# alzano un'eccezione che dichiara la propria precondizione.
#
#   20260816200000 -> «ROLLBACK INCOMPLETO: il contratto punta ancora al nucleo,
#                      che questo file ha appena eliminato. get_entitlement_status()
#                      e' ROTTA finche' non esegui 20260729161245_…»
#   20260817090000 -> stessa forma, due `raise` propri
#
# Non sono rollback rotti: sono rollback con una precondizione, e vanno provati
# ciascuno nella propria sequenza, non incatenati agli altri dieci dentro
# un'unica transazione. Metterli nella catena la fa fallire — misurato, non
# supposto: e' il rosso che ha prodotto questa riga.
#
# Restano dichiarati qui, invece che semplicemente assenti, perche' l'assenza
# silenziosa e' esattamente il difetto che questa guardia esiste per impedire.
CON_PRECONDIZIONE="20260816200000_entitlement_una_sola_regola_rollback.sql
20260817090000_finestra_sonno_una_sola_regola_rollback.sql"

ALTROVE=$(printf '%s\n' "$ESERCITATE_DA_18" | sed '/^$/d' | sort -u)
SU_DISCO=$(cd "$DIR" && ls *_rollback.sql 2>/dev/null | sort | grep -vxF -f <(printf '%s\n' "$ALTROVE"))
ATTESE=$(printf '%s\n%s\n' "$ESERCITATE" "$CON_PRECONDIZIONE" | sed '/^$/d' | sort)

# Un file non puo' essere esercitato in due catene diverse e dirsi provato in
# entrambe: o e' nella catena billing di questo gate, o e' nel blocco 3B del
# gate 18. Se comparisse in tutte e due, una delle due dichiarazioni mente.
DOPPI=$(comm -12 <(printf '%s\n' "$ALTROVE") <(printf '%s\n' "$ATTESE"))
if [ -n "$DOPPI" ]; then
  echo "ROSSO: rollback dichiarati sia qui sia dal gate 18:"
  printf '%s\n' "$DOPPI" | sed 's/^/  /'
  FAIL=1
fi

# L'esclusione dev'essere ANCORATA al disco: se il gate 18 nominasse file che
# qui non esistono, l'insieme escluso sarebbe fittizio e la relazione vuota.
FUORI_DISCO=$(comm -23 <(printf '%s\n' "$ALTROVE") <(cd "$DIR" && ls *_rollback.sql 2>/dev/null | sort))
if [ -n "$FUORI_DISCO" ]; then
  echo "ROSSO: il gate 18 dichiara rollback che non stanno in supabase/rollback/:"
  printf '%s\n' "$FUORI_DISCO" | sed 's/^/  /'
  FAIL=1
fi
echo "esercitati altrove (gate 18, derivati dal manifesto 3B): $(printf '%s\n' "$ALTROVE" | grep -c .) file"

MANCANTI=$(comm -23 <(echo "$SU_DISCO") <(echo "$ATTESE"))
FANTASMA=$(comm -13 <(echo "$SU_DISCO") <(echo "$ATTESE"))
if [ -n "$MANCANTI" ]; then
  echo "ROSSO: rollback presenti su disco e MAI esercitate da questo gate:"
  echo "$MANCANTI" | sed 's/^/  /'
  echo "  (esercitarle qui, oppure dichiararle nel MANIFESTO-3B.txt perche' le"
  echo "   eserciti il gate 18, oppure in CON_PRECONDIZIONE se il file dichiara"
  echo "   una precondizione propria)"
  FAIL=1
fi
if [ -n "$FANTASMA" ]; then
  echo "ROSSO: l'elenco esercitato nomina file che non esistono piu':"
  echo "$FANTASMA" | sed 's/^/  /'
  FAIL=1
fi
[ "$FAIL" -eq 0 ] && echo "elenco rollback allineato al disco: $(echo "$SU_DISCO" | wc -l | tr -d ' ') file ($(echo "$CON_PRECONDIZIONE" | wc -l | tr -d ' ') con precondizione, provati a parte)"

SENZA_TRANSAZIONE=$(
  for f in 20260816120000_billing_consuma_pending_senza_ramo_irraggiungibile_rollback.sql \
           20260815120000_billing_autorita_unica_revoche_rollback.sql \
           20260814160000_billing_sandbox_scadenza_effettiva_rollback.sql \
           20260813150000_billing_gate_avversariale_rollback.sql \
           20260813103000_billing_sandbox_reviewers_rollback.sql \
           20260812093000_billing_p0_nove_punti_rollback.sql \
           20260810140000_b2c_projection_guard_rollback.sql \
           20260810120000_billing_purchase_states_rollback.sql \
           20260808211929_billing_purchase_claims_registry_rollback.sql; do
    echo "\\echo '--- $f ---'"
    # Via `begin;`, `commit;` e le meta-direttive psql che non si possono
    # annidare. Il contenuto vero resta intatto.
    grep -v -E "^\s*(begin|commit)\s*;|^\\\\set ON_ERROR_STOP|^\\\\if|^\\\\else|^\\\\endif" "$DIR/$f"
  done
)

docker exec -i -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA \
  -v ON_ERROR_STOP=1 > /tmp/rollback-prova.out 2>&1 <<SQL
begin;
-- Le due variabili che i file si aspettano gia' impostate: qui si forza,
-- perche' provare il rollback su un database vuoto non proverebbe niente.
select set_config('claims.rollback_force', '1', false);
select set_config('states.rollback_force', '1', false);
\set states_rollback_force 1
\set claims_rollback_force 1
${SENZA_TRANSAZIONE}

-- ── Il controllo: non deve restare NIENTE ───────────────────────────────
do \$\$
declare v_resti text;
begin
  select coalesce(string_agg(nome, ', ' order by nome), '') into v_resti from (
    select n.nspname || '.' || p.proname || '/' || p.pronargs as nome
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where (n.nspname = 'private' and (p.proname like '%billing%' or p.proname like '%b2c%'))
       or (n.nspname = 'public' and p.proname in
             ('claim_store_purchase','record_store_purchase_revocation'))
    union all
    select 'trigger:' || t.tgname
    from pg_catalog.pg_trigger t
    where not t.tgisinternal and (t.tgname like '%billing%' or t.tgname like '%b2c%')
      and t.tgname <> 'trg_b2c_subscriptions_updated_at'
    union all
    select 'tabella:' || c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private' and c.relkind = 'r' and c.relname like 'billing%'
      -- Non tutto cio' che si chiama `billing%` appartiene a questo stack.
      -- Queste tre nascono altrove e DEVONO sopravvivere al rollback del
      -- registro degli acquisti:
      --   * `billing_tentativi_acquisto` e `billing_pagamenti_segnalati` sono
      --     del 16/08, vivono in produzione da prima, e non hanno niente a che
      --     fare con i claim;
      --   * `billing_store_notifications` e' delle notifiche degli store
      --     (F5), che hanno un rollback proprio.
      -- Il controllo cercava per prefisso del nome, ed e' lo stesso errore che
      -- in questo sprint ha gia' prodotto tre conclusioni sbagliate.
      and c.relname not in ('billing_tentativi_acquisto',
                            'billing_pagamenti_segnalati',
                            'billing_store_notifications')
  ) s;

  if v_resti <> '' then
    raise exception 'ROLLBACK INCOMPLETO, sopravvivono: %', v_resti;
  end if;
  raise notice 'ROLLBACK COMPLETO: nessun oggetto billing sopravvive';
end \$\$;

rollback;
SQL
ESITO=$?

if [ "$ESITO" -ne 0 ]; then
  fail "l'esecuzione dei rollback e' fallita"
  sed -n '1,40p' /tmp/rollback-prova.out | sed 's/^/    /'
elif grep -q 'ROLLBACK INCOMPLETO' /tmp/rollback-prova.out; then
  fail "$(grep -m1 'ROLLBACK INCOMPLETO' /tmp/rollback-prova.out)"
elif ! grep -q 'ROLLBACK COMPLETO' /tmp/rollback-prova.out; then
  fail "il controllo finale non e' stato raggiunto (vedi /tmp/rollback-prova.out)"
else
  echo "CASO 1: PASS (i rollback tolgono tutto cio' che le migration creano)"
fi

# ── E il database non si e' mosso ──────────────────────────────────────────
DOPO=$(docker exec -e PGPASSWORD=postgres "$CID" psql -U postgres -d "$DBN" -X -tA -c "$INVENTARIO")
if [ "$PRIMA" != "$DOPO" ]; then
  fail "la prova ha lasciato il database diverso da come lo ha trovato"
  diff <(printf '%s\n' "$PRIMA") <(printf '%s\n' "$DOPO") | head -20 | sed 's/^/    /'
else
  echo "CASO 2: PASS (la prova non ha modificato niente: ${N_PRIMA} oggetti, prima e dopo)"
fi

echo ""
echo "=================================================="
if [ "$FAIL" -eq 0 ]; then
  echo "ROLLBACK: verificato eseguendolo, non leggendolo"
  echo "=================================================="
  exit 0
fi
echo "ROLLBACK: ${FAIL} FALLIMENTI (output in /tmp/rollback-prova.out)"
echo "=================================================="
exit 1
