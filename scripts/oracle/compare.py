#!/usr/bin/env python3
"""
FitMesh Labs - confronto oracle Python vs implementazione TypeScript reale.

Legge .oracle-vectors.json (generato da tools/gen-labs-oracle-vectors.ts a
partire dalle funzioni TypeScript REALI dell'app), ricalcola ogni vettore con
gli oracle Python indipendenti (hrv_oracle.py, sleep_efficiency_oracle.py - scritti da zero, mai importando/leggendo il codice TypeScript), e confronta
entro un epsilon numerico. Fallisce (exit 1) su qualunque scostamento oltre
la tolleranza o su qualunque campo mancante.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hrv_oracle import calculate_hrv_metrics
from sleep_efficiency_oracle import calculate_advanced, calculate_simple, classify_expected_error

EPSILON = 1e-6
VECTORS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".oracle-vectors.json")

errors = []


def close(a, b, label, field):
    if a is None and b is None:
        return
    if a is None or b is None:
        errors.append(f"{label}.{field}: uno dei due è None (ts={a}, py={b})")
        return
    if not math.isclose(a, b, rel_tol=EPSILON, abs_tol=EPSILON):
        errors.append(f"{label}.{field}: ts={a} py={b} (diff={abs(a - b)})")


def check_hrv(vectors):
    for v in vectors:
        label = v["label"]
        ts = v["tsResult"]
        py = calculate_hrv_metrics(v["input"]["intervalsMs"])
        if ts is None and py is None:
            continue
        if ts is None or py is None:
            errors.append(f"{label}: uno dei due lati è None (n<2?) ts={ts} py={py}")
            continue
        close(ts["meanRrMs"], py["meanRrMs"], label, "meanRrMs")
        close(ts["derivedHeartRateBpm"], py["derivedHeartRateBpm"], label, "derivedHeartRateBpm")
        close(ts["rmssdMs"], py["rmssdMs"], label, "rmssdMs")
        close(ts["lnRmssd"], py["lnRmssd"], label, "lnRmssd")
        close(ts["stdDevMs"], py["stdDevMs"], label, "stdDevMs")


def check_sleep_efficiency(vectors):
    for v in vectors:
        label = v["label"]
        ts = v["tsResult"]
        inp = v["input"]
        if inp["mode"] == "simple":
            py = calculate_simple(inp["timeInBedMinutes"], inp["totalSleepTimeMinutes"])
        else:
            py = calculate_advanced(
                inp["bedMinutes"],
                inp["outOfBedMinutes"],
                inp["sleepOnsetLatencyMinutes"],
                inp["wakeAfterSleepOnsetMinutes"],
                inp["finalWakeMinutes"],
            )
        close(ts["timeInBedMinutes"], py["timeInBedMinutes"], label, "timeInBedMinutes")
        close(ts["totalSleepTimeMinutes"], py["totalSleepTimeMinutes"], label, "totalSleepTimeMinutes")
        close(ts["totalTimeAwakeMinutes"], py["totalTimeAwakeMinutes"], label, "totalTimeAwakeMinutes")
        close(ts["sleepEfficiencyPercent"], py["sleepEfficiencyPercent"], label, "sleepEfficiencyPercent")
        if ts["crossedMidnight"] != py["crossedMidnight"]:
            errors.append(f"{label}.crossedMidnight: ts={ts['crossedMidnight']} py={py['crossedMidnight']}")


def check_sleep_efficiency_errors(vectors):
    """P1.1B Fase 3: vettori deliberatamente impossibili - verifica che la
    classificazione Python indipendente (classify_expected_error) concordi
    con il codice d'errore realmente riportato da TypeScript, non solo che
    entrambi i lati "falliscano" genericamente."""
    for v in vectors:
        label = v["label"]
        expected = classify_expected_error(v["input"])
        actual = v["expectedErrorCode"]
        if expected != actual:
            errors.append(f"{label}: TS ha bloccato con {actual!r}, la classificazione Python indipendente si aspetta {expected!r}")


def main():
    if not os.path.exists(VECTORS_PATH):
        print(f"❌ Oracle compare: {VECTORS_PATH} non trovato - esegui prima tools/gen-labs-oracle-vectors.ts")
        sys.exit(1)

    with open(VECTORS_PATH) as f:
        data = json.load(f)

    check_hrv(data["hrv"])
    check_sleep_efficiency(data["sleepEfficiency"])
    sleep_efficiency_errors = data.get("sleepEfficiencyErrors", [])
    check_sleep_efficiency_errors(sleep_efficiency_errors)

    if errors:
        print(f"❌ Oracle compare: {len(errors)} scostamento/i fra TypeScript e Python\n")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print(
        f"✅ Oracle compare: {len(data['hrv'])} vettori HRV + {len(data['sleepEfficiency'])} vettori "
        f"Sleep Efficiency (risultati validi) + {len(sleep_efficiency_errors)} vettori Sleep Efficiency "
        f"(errori attesi, classificazione indipendente), TypeScript e Python indipendenti concordano "
        f"entro {EPSILON}."
    )


if __name__ == "__main__":
    main()
