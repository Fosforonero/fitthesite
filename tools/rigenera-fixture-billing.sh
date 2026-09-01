#!/usr/bin/env bash
#
# Rigenera le copie congelate di validate-purchase/route.ts dai commit
# dichiarati in test/billing-route-fixtures/manifesto.json.
#
# Perche' esiste: una copia incollata a mano e' una copia di cui nessuno sa
# piu' da dove viene. Qui la provenienza e' dichiarata, la copia e' derivata, e
# lo script RIFIUTA di scrivere se l'impronta prodotta non e' quella registrata
# nel manifesto. Il manifesto resta l'autorita'; questo script e' solo la mano.
#
# L'intestazione di ogni fixture (tutto cio' che sta sopra il marcatore) e'
# scritta a mano e viene PRESERVATA: si riscrive solo la copia sotto.
set -euo pipefail

RADICE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR="$RADICE/test/billing-route-fixtures"
MANIFESTO="$DIR/manifesto.json"

leggi() { python3 -c "import json,sys;print(json.load(open(sys.argv[1]))$2)" "$MANIFESTO"; }

PERCORSO="$(leggi "$MANIFESTO" "['percorso_origine']")"
MARCATORE="$(leggi "$MANIFESTO" "['marcatore']")"
QUANTE="$(leggi "$MANIFESTO" "['fixture'].__len__()")"

esito=0
for ((i = 0; i < QUANTE; i++)); do
  file="$(leggi "$MANIFESTO" "['fixture'][$i]['file']")"
  commit="$(leggi "$MANIFESTO" "['fixture'][$i]['commit']")"
  atteso="$(leggi "$MANIFESTO" "['fixture'][$i]['sha256']")"
  dest="$DIR/$file"

  if [[ ! -f "$dest" ]]; then
    echo "ROSSO  $file: manca. L'intestazione si scrive a mano, questo script non la inventa." >&2
    esito=1
    continue
  fi
  if ! git -C "$RADICE" cat-file -e "${commit}^{commit}" 2>/dev/null; then
    echo "ROSSO  $file: il commit $commit non e' nell'archivio locale." >&2
    esito=1
    continue
  fi

  # L'intestazione e' tutto fino al marcatore compreso: si conserva.
  riga_marcatore="$(grep -n -F -m1 "$MARCATORE" "$dest" | cut -d: -f1 || true)"
  if [[ -z "$riga_marcatore" ]]; then
    echo "ROSSO  $file: marcatore «$MARCATORE» assente." >&2
    esito=1
    continue
  fi

  tmp="$(mktemp)"
  head -n "$riga_marcatore" "$dest" >"$tmp"
  git -C "$RADICE" show "${commit}:${PERCORSO}" >>"$tmp"

  prodotto="$(tail -n +"$((riga_marcatore + 1))" "$tmp" | shasum -a 256 | cut -d' ' -f1)"
  if [[ "$prodotto" != "$atteso" ]]; then
    echo "ROSSO  $file: impronta prodotta $prodotto, manifesto $atteso. Non scrivo." >&2
    rm -f "$tmp"
    esito=1
    continue
  fi

  mv "$tmp" "$dest"
  echo "ok     $file  <- $commit  ($prodotto)"
done

exit "$esito"
