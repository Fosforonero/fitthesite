#!/usr/bin/env python3
"""
FitMesh Labs — oracle Python indipendente per il calcolatore Efficienza del
Sonno. Scritto da zero SENZA leggere/importare lib/labs/sleep-efficiency/
math.ts: stessa definizione operativa (Sleep Efficiency % = TST / TIB * 100,
AASM/actigrafia), implementata solo dalla definizione. Vedi hrv_oracle.py per
il ragionamento generale su questo approccio.

Replica solo il CALCOLO (non la validazione — quella è già simmetrica tra i
due lati perché precede il confronto: compare.py invia solo vettori validi).
"""

MINUTES_PER_DAY = 1440


def calculate_simple(time_in_bed_minutes, total_sleep_time_minutes):
    total_time_awake_minutes = time_in_bed_minutes - total_sleep_time_minutes
    sleep_efficiency_percent = (total_sleep_time_minutes / time_in_bed_minutes) * 100
    return {
        "timeInBedMinutes": time_in_bed_minutes,
        "totalSleepTimeMinutes": total_sleep_time_minutes,
        "totalTimeAwakeMinutes": total_time_awake_minutes,
        "sleepEfficiencyPercent": sleep_efficiency_percent,
        "crossedMidnight": False,
    }


def calculate_advanced(
    bed_minutes,
    out_of_bed_minutes,
    sleep_onset_latency_minutes,
    wake_after_sleep_onset_minutes,
    final_wake_minutes,
):
    crossed_midnight = out_of_bed_minutes <= bed_minutes
    effective_out_of_bed = out_of_bed_minutes + MINUTES_PER_DAY if crossed_midnight else out_of_bed_minutes
    time_in_bed_minutes = effective_out_of_bed - bed_minutes

    total_time_awake_minutes = sleep_onset_latency_minutes + wake_after_sleep_onset_minutes + final_wake_minutes
    total_sleep_time_minutes = time_in_bed_minutes - total_time_awake_minutes
    sleep_efficiency_percent = (total_sleep_time_minutes / time_in_bed_minutes) * 100

    return {
        "timeInBedMinutes": time_in_bed_minutes,
        "totalSleepTimeMinutes": total_sleep_time_minutes,
        "totalTimeAwakeMinutes": total_time_awake_minutes,
        "sleepEfficiencyPercent": sleep_efficiency_percent,
        "crossedMidnight": crossed_midnight,
    }


def classify_expected_error(input_dict):
    """P1.1B Fase 3: classifica in modo indipendente (non letto da math.ts) se
    un input è fisiologicamente impossibile e quale codice d'errore ci si
    aspetta. Copre solo le due condizioni "impossibili" (non le validazioni
    di parsing/range dei singoli campi, già simmetriche perché precedono
    questo confronto): tempo dormito che supera il tempo a letto, e tempo di
    sonno derivato negativo. Restituisce None se l'input è valido."""
    if input_dict["mode"] == "simple":
        if input_dict["totalSleepTimeMinutes"] > input_dict["timeInBedMinutes"]:
            return "SLEEP_EXCEEDS_TIME_IN_BED"
        return None

    bed = input_dict["bedMinutes"]
    out = input_dict["outOfBedMinutes"]
    crossed_midnight = out <= bed
    effective_out = out + MINUTES_PER_DAY if crossed_midnight else out
    time_in_bed_minutes = effective_out - bed
    total_awake = (
        input_dict["sleepOnsetLatencyMinutes"]
        + input_dict["wakeAfterSleepOnsetMinutes"]
        + input_dict["finalWakeMinutes"]
    )
    if total_awake > time_in_bed_minutes:
        return "NEGATIVE_DERIVED_SLEEP_TIME"
    return None


if __name__ == "__main__":
    print(calculate_simple(480, 420))
    print(calculate_advanced(23 * 60 + 30, 7 * 60 + 15, 15, 20, 5))
