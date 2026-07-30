#!/usr/bin/env python3
"""
FitMesh Labs — oracle Python indipendente per il calcolatore Zone di
Frequenza Cardiaca. Scritto da zero SENZA leggere/importare
lib/labs/heart-rate-zones/math.ts: stessa definizione operativa (Tanaka 2001
o "220-età" per la stima FC max, Karvonen 1957 per il metodo % riserva),
implementata solo dalla definizione. Vedi hrv_oracle.py per il ragionamento
generale.

P1.4B-A (hardening 2026-07-30): aggiunta la terza fonte di FC max ("220-età",
Fase 3) e classify_bpm_into_zone (Fase 5), a specchio del TypeScript.

Nota sull'arrotondamento: TypeScript usa Math.round (arrotonda sempre verso
l'alto sui .5, mai banker's rounding). Il round() nativo di Python usa
round-half-to-even, che su un valore .5 esatto (es. bpm frazionario 42.5)
darebbe un risultato DIVERSO da Math.round per circa metà dei casi - un falso
scostamento dell'oracle che non sarebbe un vero bug. `js_round` replica
esplicitamente la semantica di Math.round (floor(x + 0.5), valido per valori
non negativi, che è l'unico caso qui: età/bpm sono sempre >= 0).
"""

ZONE_BANDS = {
    "z1": (50, 60),
    "z2": (60, 70),
    "z3": (70, 80),
    "z4": (80, 90),
    "z5": (90, 100),
}
ZONE_KEYS = ["z1", "z2", "z3", "z4", "z5"]


def js_round(x):
    return int(x + 0.5) if x >= 0 else -int(-x + 0.5)


def estimate_max_hr_tanaka(age):
    return 208 - 0.7 * age


def estimate_max_hr_220_age(age):
    return 220 - age


def resolve_max_hr(max_hr_mode, age, measured_max_hr):
    if max_hr_mode == "tanaka":
        return estimate_max_hr_tanaka(age)
    if max_hr_mode == "age220":
        return estimate_max_hr_220_age(age)
    return measured_max_hr


def build_zones(reference_fn):
    zones = []
    for key in ZONE_KEYS:
        pct_low, pct_high = ZONE_BANDS[key]
        zones.append(
            {
                "key": key,
                "pctLow": pct_low,
                "pctHigh": pct_high,
                "bpmLow": js_round(reference_fn(pct_low / 100)),
                "bpmHigh": js_round(reference_fn(pct_high / 100)),
            }
        )
    return zones


def classify_bpm_into_zone(bpm, zones):
    """Specchio di classifyBpmIntoZone in math.ts: limite inferiore incluso,
    limite superiore escluso tranne per l'ultima zona (P1.4B-A Fase 5)."""
    for i, z in enumerate(zones):
        is_last = i == len(zones) - 1
        below_upper = bpm <= z["bpmHigh"] if is_last else bpm < z["bpmHigh"]
        if bpm >= z["bpmLow"] and below_upper:
            return z["key"]
    return None


def calculate_heart_rate_zones(max_hr_mode, age, measured_max_hr, resting_hr):
    max_hr = resolve_max_hr(max_hr_mode, age, measured_max_hr)
    heart_rate_reserve = max_hr - resting_hr

    return {
        "maxHr": js_round(max_hr * 10) / 10,
        "restingHr": resting_hr,
        "heartRateReserve": js_round(heart_rate_reserve * 10) / 10,
        "percentMaxHrZones": build_zones(lambda pct: max_hr * pct),
        "heartRateReserveZones": build_zones(lambda pct: resting_hr + heart_rate_reserve * pct),
    }


def classify_expected_error(input_dict):
    """Classifica in modo indipendente se un input è fisiologicamente
    impossibile (FC a riposo >= FC max). Non ricopre gli errori di
    range/parsing dei singoli campi, già simmetrici perché precedono questo
    confronto (compare.py invia solo vettori validi per il calcolo, e vettori
    deliberatamente impossibili solo per questo controllo)."""
    resting_hr = input_dict["restingHr"]
    max_hr = resolve_max_hr(
        input_dict["maxHrMode"], input_dict.get("age"), input_dict.get("measuredMaxHr")
    )
    if resting_hr >= max_hr:
        return "RESTING_HR_NOT_BELOW_MAX"
    return None


if __name__ == "__main__":
    print(calculate_heart_rate_zones("tanaka", 40, None, 60))
    print(calculate_heart_rate_zones("age220", 40, None, 60))
    print(calculate_heart_rate_zones("measured", None, 185, 52))
