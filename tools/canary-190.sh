#!/usr/bin/env bash
# ============================================================================
# CANARY 190 — a livello di ROUTE, non di RPC
#
# Una `select` sulle RPC prova che la funzione esiste. Non prova che la route
# risponda, che l'autenticazione passi, che il payload venga instradato e che
# la migration sia VIVA e non solo registrata. Qui si fa HTTP vero, su un
# account canary dedicato.
#
# ── A. POST /api/v1/sync ───────────────────────────────────────────────────
# Snapshot sintetico con DUE sessioni disgiunte: un pisolino di 20 minuti che
# PRECEDE una notte di 8 ore. La notte e' la piu' ricca (tre segmenti contro
# uno). Poi si rilegge la riga scritta e si pretende:
#   1. HTTP 200
#   2. la riga esiste con entrambe le sessioni
#   3. sessionIdx 0 e' la sessione PIU' RICCA, non la cronologicamente prima
#      — e' esattamente cio' che 20260827120000 cambia: se la riga dicesse
#      sessionIdx 0 sul pisolino, la migration sarebbe registrata e morta
#   4. nessuna sessione finisce dopo collected_at_ms
#
# ── B. POST /api/v1/billing/validate-purchase ──────────────────────────────
# Token deliberatamente malformato. Deve tornare un rifiuto TIPIZZATO, e in
# particolare NON un 502 e NON un 21002: quelli sono la firma del percorso
# `verifyReceipt`, cioe' il P0 della 189. Prova che l'instradamento JWS e'
# vivo senza bisogno di un acquisto.
#
# ── COSA SCRIVE, E DOVE ────────────────────────────────────────────────────
# Il passo A scrive UNA riga di `fitness_metrics` sull'account canary, e prova
# a cancellarla in fondo. Se la cancellazione non passa (le policy RLS
# potrebbero non concedere DELETE all'utente), lo DICE: non finge.
#
# ── CREDENZIALI ────────────────────────────────────────────────────────────
# Solo dall'ambiente, mai da argv e mai su disco:
#   CANARY_EMAIL, CANARY_PASSWORD   account canary dedicato
#   CANARY_FINGERPRINT              impronta di un device gia' accoppiato a
#                                   quell'account (senza, /sync risponde 404)
#   SUPABASE_URL, SUPABASE_ANON_KEY per il login e la rilettura
#   BASE_URL                        default https://www.fitmesh.fit
# ============================================================================
set -uo pipefail
umask 077

BASE_URL="${BASE_URL:-https://www.fitmesh.fit}"
esito=0
ok()    { echo "  ok     $*"; }
rosso() { echo "  ROSSO  $*"; esito=1; }

manca() { echo "ROSSO: manca la variabile $1. Il canary non si esegue a meta'." >&2; exit 2; }
for v in CANARY_EMAIL CANARY_PASSWORD CANARY_FINGERPRINT SUPABASE_URL SUPABASE_ANON_KEY; do
  [ -n "${!v:-}" ] || manca "$v"
done

# curl -K -: la configurazione arriva da stdin, quindi il token non finisce
# mai in argv e non si vede in `ps`.
chiama() { # chiama <metodo> <url> <header-extra...> ; corpo su stdin
  local metodo="$1" url="$2"; shift 2
  local cfg="" h
  for h in "$@"; do cfg="${cfg}header = \"${h}\""$'\n'; done
  cfg="${cfg}header = \"content-type: application/json\""$'\n'
  printf '%s' "$cfg" | curl -sS -K - --max-time 30 -X "$metodo" "$url" \
    -d @- -w $'\n%{http_code}'
}

echo "############ CANARY 190 — $BASE_URL ############"
echo

# ── login ──────────────────────────────────────────────────────────────────
RISP=$(printf '{"email":%s,"password":%s}' \
        "$(printf '%s' "$CANARY_EMAIL"    | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
        "$(printf '%s' "$CANARY_PASSWORD" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
      | chiama POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
               "apikey: $SUPABASE_ANON_KEY")
COD=${RISP##*$'\n'}; CORPO=${RISP%$'\n'*}
case "$COD" in 2[0-9][0-9]) : ;; *) echo "ROSSO: login dell'account canary: HTTP $COD" >&2; exit 1 ;; esac
JWT=$(printf '%s' "$CORPO" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("access_token",""))')
UID_CANARY=$(printf '%s' "$CORPO" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("user",{}).get("id",""))')
[ -n "$JWT" ] && [ -n "$UID_CANARY" ] || { echo "ROSSO: login senza token." >&2; exit 1; }
unset CORPO
ok "login canary riuscito"

# ── A. sync ────────────────────────────────────────────────────────────────
echo
echo "== A. POST /api/v1/sync — due sessioni disgiunte =="

# Ancorate a MEZZANOTTE UTC di ieri, cosi' il giorno locale e' stabile e le
# due sessioni cadono nello stesso giorno.
BASE_MS=$(python3 - <<'PY'
import datetime
g = datetime.datetime.now(datetime.timezone.utc).date() - datetime.timedelta(days=1)
print(int(datetime.datetime(g.year, g.month, g.day, tzinfo=datetime.timezone.utc).timestamp()*1000))
PY
)
PIS_I=$((BASE_MS + 39600000)); PIS_F=$((PIS_I + 1200000))          # pisolino 11:00, 20 min
NOT_I=$((BASE_MS + 79200000)); NOT_F=$((NOT_I + 28800000))         # notte 22:00, 8 ore
RACC=$((NOT_F + 60000))                                            # collected_at DOPO tutto

PAYLOAD=$(python3 - "$PIS_I" "$PIS_F" "$NOT_I" "$NOT_F" "$RACC" <<'PY'
import json, sys
pi, pf, ni, nf, racc = map(int, sys.argv[1:6])
terzo = ni + (nf - ni)//3
stadi = [
  {"sessionIdx": 0, "startMs": pi,          "endMs": pf,          "stage": "light"},
  {"sessionIdx": 1, "startMs": ni,          "endMs": terzo,       "stage": "light"},
  {"sessionIdx": 1, "startMs": terzo,       "endMs": terzo*2-ni,  "stage": "deep"},
  {"sessionIdx": 1, "startMs": terzo*2-ni,  "endMs": nf,          "stage": "rem"},
]
print(json.dumps({
  "schemaVersion": 1, "source": "canary_190",
  "windowStartMillis": pi, "windowEndMillis": nf, "collectedAtMillis": racc,
  "steps": 1234, "sleepMinutes": (nf-ni)//60000,
  "sleepStartMillis": ni, "sleepEndMillis": nf,
  "sleepStagesJson": json.dumps(stadi),
}))
PY
)

RISP=$(printf '%s' "$PAYLOAD" | chiama POST "$BASE_URL/api/v1/sync" \
        "authorization: Bearer $JWT" "x-device-fingerprint: $CANARY_FINGERPRINT")
COD=${RISP##*$'\n'}; CORPO=${RISP%$'\n'*}
if [ "$COD" = "200" ]; then ok "1. HTTP 200"
else
  rosso "1. HTTP $COD invece di 200"
  printf '%s\n' "$CORPO" | head -3 | sed 's/^/         /'
  case "$COD" in
    404) echo "         404 = device non accoppiato: CANARY_FINGERPRINT non corrisponde" >&2 ;;
  esac
fi

GIORNO=$(python3 -c "import datetime,sys; print(datetime.datetime.fromtimestamp(int(sys.argv[1])/1000, datetime.timezone.utc).date())" "$NOT_I")
RILETTA=$(printf '%s' "$CORPO" >/dev/null; curl -sS --max-time 30 \
  -H "apikey: $SUPABASE_ANON_KEY" -H "authorization: Bearer $JWT" \
  "$SUPABASE_URL/rest/v1/fitness_metrics?user_id=eq.$UID_CANARY&local_day_key=eq.$GIORNO&select=id,collected_at_ms,sleep_stages,sleep_start_ms,sleep_end_ms")

python3 - "$RILETTA" "$PIS_I" "$PIS_F" "$NOT_I" "$NOT_F" <<'PY'
import json, sys
righe = json.loads(sys.argv[1] or "[]")
pi, pf, ni, nf = map(int, sys.argv[2:6])
def ok(m):    print("  ok     " + m)
def rosso(m): print("  ROSSO  " + m); sys.exit(1)

if len(righe) != 1:
    rosso("2. attesa una riga riletta, trovate %d" % len(righe))
r = righe[0]
stadi = r.get("sleep_stages")
if isinstance(stadi, str): stadi = json.loads(stadi)
if not stadi: rosso("2. la riga esiste ma sleep_stages e' vuoto")

sess = {}
for s in stadi: sess.setdefault(s.get("sessionIdx"), []).append(s)
if len(sess) < 2:
    rosso("2. attese due sessioni, trovate %d: le sessioni disgiunte non sono sopravvissute" % len(sess))
ok("2. la riga esiste con %d sessioni (%d segmenti)" % (len(sess), len(stadi)))

# 3. sessionIdx 0 e' la PIU' RICCA, non la cronologicamente prima
zero = sess.get(0, [])
piu_ricca = max(sess.values(), key=lambda v: (len(v), max(x["endMs"] for x in v) - min(x["startMs"] for x in v)))
prima_in_orologio = min(sess.values(), key=lambda v: min(x["startMs"] for x in v))
if zero is piu_ricca or (zero and piu_ricca and min(x["startMs"] for x in zero) == min(x["startMs"] for x in piu_ricca)):
    if len(sess) > 1 and min(x["startMs"] for x in prima_in_orologio) != min(x["startMs"] for x in zero):
        ok("3. sessionIdx 0 e' la sessione piu' ricca, NON la prima in orologio: 20260827120000 e' viva")
    else:
        rosso("3. la piu' ricca e la prima in orologio coincidono: il canary non distingue niente")
else:
    rosso("3. sessionIdx 0 NON e' la sessione piu' ricca. La migration 20260827120000 e' registrata ma morta")

# 4. nessuna sessione finisce dopo collected_at_ms
racc = r.get("collected_at_ms")
if racc is None: rosso("4. collected_at_ms assente nella riga")
oltre = [s for s in stadi if s["endMs"] > int(racc)]
if oltre: rosso("4. %d segmenti finiscono dopo collected_at_ms" % len(oltre))
ok("4. nessuna sessione finisce dopo collected_at_ms")
PY
[ $? -ne 0 ] && esito=1

# ── B. billing ─────────────────────────────────────────────────────────────
echo
echo "== B. POST /api/v1/billing/validate-purchase — token malformato =="
RISP=$(printf '{"platform":"ios","product_id":"fitmesh_pro_lifetime","purchase_token":"non-e-un-jws-ne-una-ricevuta","token_format":"sk2_jws","request_id":"canary-190"}' \
       | chiama POST "$BASE_URL/api/v1/billing/validate-purchase" "authorization: Bearer $JWT")
COD=${RISP##*$'\n'}; CORPO=${RISP%$'\n'*}
echo "         HTTP $COD"
printf '%s\n' "$CORPO" | head -3 | sed 's/^/         /'
if [ "$COD" = "502" ]; then
  rosso "502: e' la firma del percorso verifyReceipt, cioe' il P0 della 189"
elif printf '%s' "$CORPO" | grep -q '21002'; then
  rosso "21002 nel corpo: la route sta ancora passando da verifyReceipt"
elif [ "$COD" = "200" ]; then
  rosso "200 su un token deliberatamente malformato: non e' un rifiuto"
elif printf '%s' "$CORPO" | python3 -c 'import sys,json; d=json.load(sys.stdin); sys.exit(0 if isinstance(d,dict) and (d.get("error") or d.get("code") or d.get("reason")) else 1)' 2>/dev/null; then
  ok "rifiuto tipizzato, niente 502 e niente 21002: l'instradamento JWS e' vivo"
else
  rosso "rifiutato, ma senza un errore tipizzato nel corpo"
fi

# ── pulizia ────────────────────────────────────────────────────────────────
echo
echo "== pulizia della riga scritta =="
ID=$(printf '%s' "$RILETTA" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r[0]["id"] if r else "")' 2>/dev/null)
if [ -n "$ID" ]; then
  C=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 -X DELETE \
      -H "apikey: $SUPABASE_ANON_KEY" -H "authorization: Bearer $JWT" \
      "$SUPABASE_URL/rest/v1/fitness_metrics?id=eq.$ID")
  case "$C" in
    2[0-9][0-9]) ok "riga canary cancellata" ;;
    *) echo "  ATTENZIONE  la riga canary NON e' stata cancellata (HTTP $C)."
       echo "              Resta su $UID_CANARY, giorno $GIORNO. Va tolta a mano." ;;
  esac
else
  echo "  ATTENZIONE  nessun id da cancellare: la riga non e' stata riletta."
fi

echo
[ "$esito" -ne 0 ] && { echo "ROSSO: il canary non e' verde."; exit 1; }
echo "VERDE: le due route rispondono, la 20260827120000 e' viva, l'instradamento JWS non passa da verifyReceipt."
