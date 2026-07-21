#!/usr/bin/env python3
"""
FitMesh Labs — oracle Python indipendente per il calcolatore HRV (RMSSD).

Scritto da zero SENZA leggere/importare lib/labs/hrv/rmssd-math.ts: implementa
la stessa definizione matematica (Task Force ESC/NASPE 1996) partendo solo
dalla formula, non dal codice. Usato da tools/check-labs-math-oracle.ts (via
compare.py) per confrontare i risultati con l'implementazione TypeScript reale
su un set di vettori di test — non un confronto "a mano"/una tantum, ma uno
step eseguibile della catena di verifica P1.1 Fase 12.
"""
import math


def calculate_hrv_metrics(valid_intervals_ms):
    n = len(valid_intervals_ms)
    if n < 2:
        return None

    total_duration_ms = sum(valid_intervals_ms)
    mean_rr_ms = total_duration_ms / n
    derived_heart_rate_bpm = 60000 / mean_rr_ms

    sum_squared_successive_diffs = 0.0
    for i in range(n - 1):
        diff = valid_intervals_ms[i + 1] - valid_intervals_ms[i]
        sum_squared_successive_diffs += diff * diff
    rmssd_ms = math.sqrt(sum_squared_successive_diffs / (n - 1))
    ln_rmssd = math.log(rmssd_ms) if rmssd_ms > 0 else None

    sum_squared_deviations = sum((rr - mean_rr_ms) ** 2 for rr in valid_intervals_ms)
    std_dev_ms = math.sqrt(sum_squared_deviations / (n - 1))

    return {
        "validIntervalCount": n,
        "totalDurationMs": total_duration_ms,
        "meanRrMs": mean_rr_ms,
        "derivedHeartRateBpm": derived_heart_rate_bpm,
        "rmssdMs": rmssd_ms,
        "lnRmssd": ln_rmssd,
        "stdDevMs": std_dev_ms,
    }


if __name__ == "__main__":
    # Auto-test rapido (non l'oracle completo — vedi compare.py per il
    # confronto reale contro i vettori generati dal TypeScript).
    sample = [812, 828, 795, 840, 803, 822, 788, 831, 806, 819]
    print(calculate_hrv_metrics(sample))
