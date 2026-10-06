#!/usr/bin/env bash
# Screenshot riproducibili del PROTOTIPO della dashboard web (dati sintetici).
#
# Serve un dev server con il flag acceso, ad esempio (dalla radice del repo):
#   docker run -d --name wd-ui-dev -p 3210:3210 -e WEB_DASHBOARD_PROTOTYPE=1 \
#     -v "$PARENT":"$PARENT" -w "$PARENT/fitthesite-web-dashboard-ui" node:22 \
#     ./node_modules/.bin/next dev -p 3210 -H 0.0.0.0
#
# Usa Chrome dell'host in modalita' headless (mai il browser dell'utente) e
# ImageMagick per ritagliare lo spazio vuoto. Chrome headless non scende sotto
# ~500 px di larghezza: il mobile e' una pagina in un iframe largo 390 px, cosi'
# le media query rispondono a 390 e non a 500.
#
#   tools/web-dashboard-shots.sh OUT_DIR "nome|/it/dashboard-preview/overview?chrome=0|desktop" ...
#   (terzo campo: desktop = 1440 px, mobile = 390 px)
set -uo pipefail
BASE="${WD_BASE:-http://localhost:3210}"
CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="${1:?uso: $0 OUT_DIR nome|percorso|desktop|mobile ...}"; shift
mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for spec in "$@"; do
  IFS='|' read -r name path kind <<<"$spec"
  if [ "$kind" = "mobile" ]; then
    cat > "$TMP/$name.html" <<HTML
<!doctype html><meta charset="utf-8"><body style="margin:0;background:#050816">
<iframe src="$BASE$path" style="width:390px;height:4200px;border:0;display:block"></iframe>
HTML
    "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
      --window-size=500,4200 --virtual-time-budget=4000 --screenshot="$TMP/$name.raw.png" "file://$TMP/$name.html" >/dev/null 2>&1
    convert "$TMP/$name.raw.png" -crop 780x+0+0 +repage -fuzz 1% -trim +repage "$OUT/$name.png"
  else
    "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
      --window-size=1440,3600 --virtual-time-budget=4000 --screenshot="$TMP/$name.raw.png" "$BASE$path" >/dev/null 2>&1
    convert "$TMP/$name.raw.png" -fuzz 1% -trim +repage "$OUT/$name.png"
  fi
  [ -s "$OUT/$name.png" ] && echo "ok  $name ($kind) $(identify -format '%wx%h' "$OUT/$name.png")" || echo "ERR $name"
done
