#!/usr/bin/env bash
#
# governance-selftest.sh - i test negativi di governance:check.
#
# Un cancello visto solo passare non e' un cancello. Qui ogni controllo viene
# provato rompendo di proposito cio' che dovrebbe intercettare, pretendendo il
# rosso, e poi ripristinando e pretendendo di nuovo il verde.
#
# Lavora su una copia in $TMPDIR, mai sull'albero di lavoro: il controllo legge
# la radice da GOVERNANCE_ROOT proprio per questo. Se questo script muore a
# meta', il checkout resta intatto.
#
# Uso: bash tools/governance-selftest.sh
#
set -uo pipefail

REPO="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK="$REPO/tools/check-governance.ts"
EM=$'—'

runner() {
  if command -v pnpm >/dev/null 2>&1 && [ -d "$REPO/node_modules/tsx" ]; then
    (cd "$REPO" && pnpm exec tsx "$@")
  elif [ -x "$REPO/node_modules/.bin/tsx" ]; then
    "$REPO/node_modules/.bin/tsx" "$@"
  else
    npx --yes tsx "$@"
  fi
}

PASS=0; FAIL=0
pass() { PASS=$((PASS + 1)); printf '  PASS  %s\n' "$*"; }
bad()  { FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$*"; }
head_() { printf '\n== %s\n' "$*"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
ROOT="$WORK/fixture"
mkdir -p "$ROOT/tools"

# --- una radice finta, con la struttura minima che il controllo si aspetta ---
if [ ! -d "$REPO/.fitmesh/governance" ]; then
  printf 'governance-selftest: manca .fitmesh/governance nel repository; esporta prima lo snapshot.\n' >&2
  exit 2
fi
mkdir -p "$ROOT/.fitmesh"
cp -R "$REPO/.fitmesh/governance" "$ROOT/.fitmesh/governance"
for f in AGENTS.md CLAUDE.md GEMINI.md; do
  [ -f "$REPO/$f" ] && cp "$REPO/$f" "$ROOT/$f"
done
mkdir -p "$ROOT/.agents/rules"
[ -f "$REPO/.agents/rules/fitmesh-editorial.md" ] && cp "$REPO/.agents/rules/fitmesh-editorial.md" "$ROOT/.agents/rules/fitmesh-editorial.md"

# Un perimetro minuscolo: quattro file, ognuno per un caso.
mkdir -p "$ROOT/lib/content" "$ROOT/lib/dictionaries" "$ROOT/lib/blog/posts" "$ROOT/test"
cat > "$ROOT/tools/governance-copy-scope.json" <<'JSON'
{
  "include": [
    { "dir": "lib/content", "extensions": [".ts"] },
    { "dir": "lib/blog/posts", "extensions": [".ts"] },
    { "dir": "lib/dictionaries", "extensions": [".json"] }
  ],
  "excludeDirs": ["node_modules", "test", "__fixtures__"],
  "excludeFileSuffixes": [".test.ts", ".d.ts"],
  "excludePathContains": ["/third-party/"],
  "allowMarker": "governance:allow-em-dash"
}
JSON

printf 'export const copy = {\n  intro: "Una frase pulita, senza trattini lunghi.",\n};\n' > "$ROOT/lib/content/copy.ts"
printf 'export const post = {\n  body: "Un corpo del testo normale.",\n};\n' > "$ROOT/lib/blog/posts/uno.ts"
printf '{\n  "titolo": "Un titolo normale",\n  "sottotitolo": "Niente trattini lunghi qui"\n}\n' > "$ROOT/lib/dictionaries/it.json"
printf 'export const fixture = "Un testo di prova con un trattino lungo %s dentro.";\n' "$EM" > "$ROOT/test/fixture.ts"

baseline_now() {
  (cd "$REPO" && GOVERNANCE_ROOT="$ROOT" runner "$CHECK" --update-baseline >/dev/null 2>&1)
}
check() {
  (cd "$REPO" && GOVERNANCE_ROOT="$ROOT" runner "$CHECK" > "$WORK/out.txt" 2>&1)
  printf '%s' "$?"
}

baseline_now

# ---------------------------------------------------------------------------
head_ "T1  una radice pulita passa"
if [ "$(check)" = "0" ]; then pass "il controllo accetta una radice integra"
else bad "il controllo ha rifiutato una radice integra"; sed 's/^/        /' "$WORK/out.txt"; fi

# ---------------------------------------------------------------------------
head_ "T2  un em dash NUOVO in una stringa pubblica fa rosso"
cp "$ROOT/lib/content/copy.ts" "$WORK/copy.bak"
printf 'export const copy = {\n  intro: "Una frase %s con un trattino lungo nuovo.",\n};\n' "$EM" > "$ROOT/lib/content/copy.ts"
if [ "$(check)" = "0" ]; then
  bad "un em dash nuovo nel copy pubblico e' passato"
else
  grep -q 'em-dash' "$WORK/out.txt" && grep -q 'lib/content/copy.ts' "$WORK/out.txt" \
    && pass "il controllo ha nominato file e riga del nuovo em dash" \
    || { bad "rosso, ma non per l'em dash"; sed 's/^/        /' "$WORK/out.txt"; }
fi
cp "$WORK/copy.bak" "$ROOT/lib/content/copy.ts"
[ "$(check)" = "0" ] && pass "ripristinato il file, torna verde" || bad "resta rosso dopo il ripristino"

# ---------------------------------------------------------------------------
head_ "T3  un em dash in una fixture esclusa NON e' un falso positivo"
# test/fixture.ts ne contiene uno dalla creazione e non e' mai stato in baseline.
grep -q "$EM" "$ROOT/test/fixture.ts" && pass "la fixture contiene davvero un em dash" || bad "la fixture non contiene l'em dash che dovrebbe"
[ "$(check)" = "0" ] \
  && pass "la fixture fuori perimetro non produce falso positivo" \
  || { bad "falso positivo su una fixture esclusa"; sed 's/^/        /' "$WORK/out.txt"; }

# ---------------------------------------------------------------------------
head_ "T4  un em dash in un commento NON e' un falso positivo"
printf '// Un commento con un trattino lungo %s dentro.\nexport const copy = {\n  intro: "Pulita.",\n};\n' "$EM" > "$ROOT/lib/content/copy.ts"
[ "$(check)" = "0" ] \
  && pass "un em dash in un commento non fa rosso" \
  || { bad "falso positivo su una riga di commento"; sed 's/^/        /' "$WORK/out.txt"; }

# ---------------------------------------------------------------------------
head_ "T5  il marcatore di citazione esonera, e niente altro"
printf 'export const copy = {\n  // governance:allow-em-dash (titolo ufficiale, non riscrivibile)\n  fonte: "Un Titolo Ufficiale %s Con Trattino",\n};\n' "$EM" > "$ROOT/lib/content/copy.ts"
[ "$(check)" = "0" ] \
  && pass "una citazione marcata e' esonerata" \
  || { bad "il marcatore di citazione non esonera"; sed 's/^/        /' "$WORK/out.txt"; }

printf 'export const copy = {\n  fonte: "Un Titolo Ufficiale %s Con Trattino",\n};\n' "$EM" > "$ROOT/lib/content/copy.ts"
[ "$(check)" = "0" ] \
  && bad "senza marcatore passa comunque: l'esonero non e' selettivo" \
  || pass "senza marcatore la stessa riga fa rosso"
cp "$WORK/copy.bak" "$ROOT/lib/content/copy.ts"

# ---------------------------------------------------------------------------
head_ "T6  il segnaposto «dato non disponibile» resta lecito"
printf 'export const cella = "%s";\nexport const riga = { valore: "%s" };\n' "$EM" "$EM" > "$ROOT/lib/blog/posts/uno.ts"
[ "$(check)" = "0" ] \
  && pass "un em dash isolato come segnaposto tabella non fa rosso" \
  || { bad "il segnaposto tabella e' stato rifiutato: contraddice la regola gia' in vigore"; sed 's/^/        /' "$WORK/out.txt"; }
printf 'export const post = {\n  body: "Un corpo del testo normale.",\n};\n' > "$ROOT/lib/blog/posts/uno.ts"

# ---------------------------------------------------------------------------
head_ "T7  nei JSON guarda i valori, non le chiavi"
printf '{\n  "chiave%scon%strattino": "valore pulito"\n}\n' "$EM" "$EM" > "$ROOT/lib/dictionaries/it.json"
[ "$(check)" = "0" ] \
  && pass "un em dash in una CHIAVE JSON non fa rosso" \
  || { bad "falso positivo su una chiave JSON"; sed 's/^/        /' "$WORK/out.txt"; }

printf '{\n  "chiave": "un valore %s con trattino"\n}\n' "$EM" > "$ROOT/lib/dictionaries/it.json"
[ "$(check)" = "0" ] \
  && bad "un em dash in un VALORE JSON e' passato" \
  || pass "un em dash in un VALORE JSON fa rosso"
printf '{\n  "titolo": "Un titolo normale",\n  "sottotitolo": "Niente trattini lunghi qui"\n}\n' > "$ROOT/lib/dictionaries/it.json"

# ---------------------------------------------------------------------------
head_ "T8  uno snapshot manomesso fa rosso"
DOC="$ROOT/.fitmesh/governance/standards/EDITORIAL-CORE.md"
cp "$DOC" "$WORK/core.bak"
printf '\nUna riga aggiunta a mano.\n' >> "$DOC"
if [ "$(check)" = "0" ]; then
  bad "un file distribuito modificato a mano e' passato"
else
  grep -q 'modificato a mano' "$WORK/out.txt" \
    && pass "il controllo ha nominato il file manomesso" \
    || { bad "rosso, ma non per la manomissione"; sed 's/^/        /' "$WORK/out.txt"; }
fi
cp "$WORK/core.bak" "$DOC"
[ "$(check)" = "0" ] && pass "ripristinato lo snapshot, torna verde" || bad "resta rosso dopo il ripristino"

# ---------------------------------------------------------------------------
head_ "T9  un adattatore che perde una regola inline fa rosso"
ADP="$ROOT/AGENTS.md"
if [ -f "$ADP" ]; then
  cp "$ADP" "$WORK/adp.bak"
  grep -v 'Do not use em dashes in FitMesh-authored user-facing copy.' "$WORK/adp.bak" > "$ADP"
  if [ "$(check)" = "0" ]; then
    bad "un adattatore senza una regola inline e' passato"
  else
    grep -qE 'regola inline|divergente' "$WORK/out.txt" \
      && pass "il controllo ha nominato la regola mancante" \
      || { bad "rosso, ma non per la regola mancante"; sed 's/^/        /' "$WORK/out.txt"; }
  fi
  cp "$WORK/adp.bak" "$ADP"
  [ "$(check)" = "0" ] && pass "ripristinato l'adattatore, torna verde" || bad "resta rosso dopo il ripristino"

  head_ "T10  un adattatore mancante fa rosso"
  mv "$ADP" "$WORK/adp.parked"
  [ "$(check)" = "0" ] && bad "un adattatore mancante e' passato" || pass "un adattatore mancante fa rosso"
  mv "$WORK/adp.parked" "$ADP"
else
  bad "AGENTS.md non e' nel checkout: l'export non e' stato eseguito"
fi

# ---------------------------------------------------------------------------
printf '\nRisultato  %d passati, %d falliti\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
