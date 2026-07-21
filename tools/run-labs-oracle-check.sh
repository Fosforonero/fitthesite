#!/usr/bin/env bash
# P1.1 Fase 7/12 — genera i vettori di test dal TypeScript reale (node:22),
# poi li confronta con l'oracle Python indipendente (python:3.12). Due
# container Docker separati (nessun runtime sull'host, come da policy),
# collegati dal file .oracle-vectors.json montato nella stessa working dir.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1/2: genero i vettori di test dal TypeScript reale =="
docker run --rm -v "$PWD":/app -w /app node:22 npx tsx tools/gen-labs-oracle-vectors.ts

echo "== 2/2: confronto con l'oracle Python indipendente =="
docker run --rm -v "$PWD":/app -w /app python:3.12 python scripts/oracle/compare.py
