#!/usr/bin/env bash
# FASE 9 P1.8C — negative test reali: ogni scenario deve produrre FAIL sul
# guardrail pertinente, poi ripristino byte-identico (git diff --quiet vuoto)
# e PASS. Va eseguito da dentro il worktree, working tree pulito (lo script
# si rifiuta di partire altrimenti, per non confondere una modifica vera con
# l'iniezione di test).
#
# Uso (Docker, nessun runtime locale):
#   docker run --rm -v "$PWD":/app -w /app node:22 bash tools/verify-p18c-negative-tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Working tree non pulito: commit o stash prima di eseguire i negative test." >&2
  exit 1
fi

PASS=0
FAIL=0

run_case() {
  local name="$1" file="$2" inject_cmd="$3" check_cmd="$4"
  echo ""
  echo "── Negative test: $name ──"
  eval "$inject_cmd"
  if eval "$check_cmd" > /tmp/p18c_negtest_out.txt 2>&1; then
    echo "❌ ATTESO FAIL, ottenuto PASS — il guardrail NON intercetta questo scenario."
    cat /tmp/p18c_negtest_out.txt
    FAIL=$((FAIL+1))
  else
    echo "✅ FAIL corretto (il guardrail ha intercettato l'iniezione):"
    grep -m3 "^\s*\[" /tmp/p18c_negtest_out.txt || true
  fi
  git checkout -- "$file"
  if ! git diff --quiet -- "$file"; then
    echo "❌ Ripristino NON byte-identico per $file" >&2
    exit 1
  fi
  if eval "$check_cmd" > /tmp/p18c_negtest_out2.txt 2>&1; then
    echo "✅ PASS dopo ripristino byte-identico."
    PASS=$((PASS+1))
  else
    echo "❌ Il guardrail fallisce ANCHE dopo il ripristino — ripristino non pulito o falso positivo pre-esistente."
    cat /tmp/p18c_negtest_out2.txt
    FAIL=$((FAIL+1))
  fi
}

# 1. Contaminazione Galaxy Watch nella landing Pixel
run_case \
  "Galaxy Watch contamination nel blocco pixel-watch" \
  "lib/providers/data.ts" \
  'python3 -c "
import re
p = \"lib/providers/data.ts\"
s = open(p, encoding=\"utf-8\").read()
s = s.replace(chr(39)+chr(39), chr(39)+chr(39), 0)
idx = s.index(chr(34)+\"pixel-watch\"+chr(34))
inject = s[:idx] + \"GALAXY_WATCH_INJECTED_FOR_TEST \" + s[idx:]
open(p, \"w\", encoding=\"utf-8\").write(inject)
" && sed -i.bak "s/GALAXY_WATCH_INJECTED_FOR_TEST/Galaxy Watch/" lib/providers/data.ts && rm -f lib/providers/data.ts.bak' \
  "npx tsx tools/check-p18c-pixel-wear-os-truth.ts"

# 2. Stringa }}; / }};; (token corrotto) in un nuovo punto
run_case \
  "Token corrotto }};; iniettato in dati-pixel-watch-dashboard.ts" \
  "lib/blog/posts/dati-pixel-watch-dashboard.ts" \
  'printf "\n// TEST_INJECT: token corrotto \")};;\" \nconst __p18c_negtest_token = \"esempio }};;\";\n" >> lib/blog/posts/dati-pixel-watch-dashboard.ts' \
  "npx tsx tools/check-p18c-pixel-wear-os-truth.ts"

# 3. Claim "all data within seconds"
run_case \
  "Claim 'all your data within seconds' iniettato nell'articolo" \
  "lib/blog/posts/dati-pixel-watch-dashboard.ts" \
  'printf "\n// TEST_INJECT\nconst __p18c_negtest_overclaim = \"FitMesh shows all your data within seconds\";\n" >> lib/blog/posts/dati-pixel-watch-dashboard.ts' \
  "npx tsx tools/check-p18c-pixel-wear-os-truth.ts"

# 4. Cover con dimensione errata (guardrail P1.5C esistente)
run_case \
  "Cover con dimensione errata (mappa cover)" \
  "lib/blog/covers.ts" \
  'python3 -c "
p = \"lib/blog/covers.ts\"
s = open(p, encoding=\"utf-8\").read()
marker = chr(34)+\"pixel-watch-health-connect-sync.webp\"+chr(34)
idx = s.index(marker)
inject = s[:idx] + chr(34)+\"pixel-watch-WRONGSIZE-test.webp\"+chr(34) + s[idx+len(marker):]
open(p, \"w\", encoding=\"utf-8\").write(inject)
"' \
  "npx tsx tools/check-p15c-cover-map.ts"

# 5. CTA App Store su un blocco Android-only (rimuove iosDisabled dal mid-matrix CTA)
run_case \
  "CTA App Store mostrata su blocco Android-only (rimosso iosDisabled)" \
  "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx" \
  'sed -i.bak "s/iosDisabled={!platforms.includes(\"ios\")}/iosDisabled={false}/" "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx" && rm -f "app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx.bak"' \
  "npx tsx tools/check-p18c-pixel-wear-os-truth.ts"

# 6. hreflang verso variante noindex: NON e' un case bash-injection (primo
#    tentativo fallito — providerLanguages() filtra SEMPRE tramite
#    isProviderVariantIndexable() per costruzione, un'iniezione testuale a
#    valle non produce un FAIL osservabile). Il negative test reale e'
#    invece un test Vitest permanente con una fixture sintetica
#    deliberatamente incompleta: vedi lib/providers/indexability.test.ts
#    ("negative test reale: un provider con una FAQ incompleta per 'de'
#    viene escluso da providerLanguages"), che gira ad ogni `vitest run`
#    (FASE 10 gate), non solo qui.
echo ""
echo "── Negative test: hreflang verso variante noindex ──"
echo "ℹ️  Delegato a lib/providers/indexability.test.ts (fixture sintetica, non bash-injection)."
if npx vitest run lib/providers/indexability.test.ts > /tmp/p18c_negtest_out.txt 2>&1; then
  echo "✅ Il test Vitest (incluso il negative case sulla fixture incompleta) passa."
  PASS=$((PASS+1))
else
  echo "❌ Il test Vitest fallisce inaspettatamente:"
  cat /tmp/p18c_negtest_out.txt
  FAIL=$((FAIL+1))
fi

# 7. MICRO-GATE P1.8C-A: debito zero su amazfit-zepp/fitbit/colmi-ring dopo
#    il fix — un regresso del token corrotto su uno di questi 3 provider
#    (ora RIMOSSI dall'allowlist) deve tornare a fallire il guardrail,
#    non essere silenziosamente coperto da una vecchia esenzione.
run_case \
  "Regresso token corrotto su colmi-ring (rimosso dall'allowlist nel fix P1.8C-A)" \
  "lib/providers/data.ts" \
  'python3 -c "
p = \"lib/providers/data.ts\"
s = open(p, encoding=\"utf-8\").read()
old = \"FitMesh odczytuje z Colmi Ring kroki, tętno\"
new = \"FitMesh odczytuje z Colmi Ring kroki, \" + chr(125)+chr(125)+chr(59) + \" tętno\"
assert old in s, \"marker non trovato\"
open(p, \"w\", encoding=\"utf-8\").write(s.replace(old, new, 1))
"' \
  "npx tsx tools/check-p18c-pixel-wear-os-truth.ts"

echo ""
echo "════════════════════════════════════════"
echo "Negative test P1.8C: $PASS scenario(i) FAIL→ripristino→PASS corretti, $FAIL problemi."
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
