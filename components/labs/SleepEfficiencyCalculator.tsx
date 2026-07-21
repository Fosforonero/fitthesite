"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { SleepEfficiencyToolContent } from "@/lib/labs/sleep-efficiency/content";
import {
  calculateSleepEfficiency,
  formatMinutesAsHm,
  rawDurationToMinutes,
  rawTimeOfDayToMinutes,
  SAMPLE_ADVANCED_INPUT,
  SAMPLE_SIMPLE_INPUT,
  validateRawDurationField,
  validateRawTimeOfDayField,
  type SleepEfficiencyInput,
  type SleepEfficiencyValidationError,
  type SleepEfficiencyWarning,
} from "@/lib/labs/sleep-efficiency/math";

type Mode = "simple" | "advanced";

/** Stato del form: stringhe (input controllati), mai numeri - la conversione/validazione avviene solo al calcolo. */
interface FormState {
  mode: Mode;
  simpleTibH: string;
  simpleTibM: string;
  simpleTstH: string;
  simpleTstM: string;
  format24h: boolean;
  bedH: string;
  bedM: string;
  bedAmPm: "AM" | "PM";
  outH: string;
  outM: string;
  outAmPm: "AM" | "PM";
  latencyM: string;
  wasoM: string;
  finalWakeM: string;
}

const EMPTY_FORM: FormState = {
  mode: "simple",
  simpleTibH: "",
  simpleTibM: "",
  simpleTstH: "",
  simpleTstM: "",
  format24h: true,
  bedH: "",
  bedM: "",
  bedAmPm: "PM",
  outH: "",
  outM: "",
  outAmPm: "AM",
  latencyM: "",
  wasoM: "",
  finalWakeM: "",
};

function toNum(v: string): number | undefined {
  return v === "" ? undefined : Number(v);
}

type BuildResult =
  | { status: "empty" }
  | { status: "invalid"; errors: SleepEfficiencyValidationError[] }
  | { status: "ready"; input: SleepEfficiencyInput };

/**
 * P1.1B Fase 3: mai restituire silenziosamente "nessun input" per un valore
 * fuori range - solo per un form genuinamente vuoto. Ore/minuti fuori dai
 * limiti dichiarati (0-59 minuti, 0-23/1-12 ore) diventano un errore
 * bloccante esplicito qui, usando gli stessi validatori puri di math.ts
 * (testati e cross-verificati dall'oracle Python).
 */
function buildInput(f: FormState): BuildResult {
  if (f.mode === "simple") {
    const isEmpty = [f.simpleTibH, f.simpleTibM, f.simpleTstH, f.simpleTstM].every((v) => v === "");
    if (isEmpty) return { status: "empty" };

    const errors = [
      ...validateRawDurationField("timeInBed", toNum(f.simpleTibH), toNum(f.simpleTibM)),
      ...validateRawDurationField("totalSleepTime", toNum(f.simpleTstH), toNum(f.simpleTstM)),
    ];
    if (errors.length > 0) return { status: "invalid", errors };

    return {
      status: "ready",
      input: {
        mode: "simple",
        timeInBedMinutes: rawDurationToMinutes(toNum(f.simpleTibH), toNum(f.simpleTibM)),
        totalSleepTimeMinutes: rawDurationToMinutes(toNum(f.simpleTstH), toNum(f.simpleTstM)),
      },
    };
  }

  const isEmpty = [f.bedH, f.bedM, f.outH, f.outM, f.latencyM, f.wasoM, f.finalWakeM].every((v) => v === "");
  if (isEmpty) return { status: "empty" };

  const errors = [
    ...validateRawTimeOfDayField("bedtime", toNum(f.bedH), toNum(f.bedM), f.format24h),
    ...validateRawTimeOfDayField("outOfBed", toNum(f.outH), toNum(f.outM), f.format24h),
  ];

  const latencyN = f.latencyM === "" ? 0 : Number(f.latencyM);
  const wasoN = f.wasoM === "" ? 0 : Number(f.wasoM);
  const finalWakeN = f.finalWakeM === "" ? 0 : Number(f.finalWakeM);
  for (const [field, value, raw] of [
    ["latency", latencyN, f.latencyM],
    ["waso", wasoN, f.wasoM],
    ["finalWake", finalWakeN, f.finalWakeM],
  ] as const) {
    if (raw === "") continue;
    if (!Number.isFinite(value)) errors.push({ code: "NOT_A_NUMBER", field });
    else if (value < 0) errors.push({ code: "NEGATIVE_VALUE", field });
  }

  if (errors.length > 0) return { status: "invalid", errors };

  const bedH = toNum(f.bedH)!;
  const bedM = toNum(f.bedM) ?? 0;
  const outH = toNum(f.outH)!;
  const outM = toNum(f.outM) ?? 0;

  return {
    status: "ready",
    input: {
      mode: "advanced",
      bedMinutes: rawTimeOfDayToMinutes(bedH, bedM, f.bedAmPm, f.format24h),
      outOfBedMinutes: rawTimeOfDayToMinutes(outH, outM, f.outAmPm, f.format24h),
      sleepOnsetLatencyMinutes: latencyN,
      wakeAfterSleepOnsetMinutes: wasoN,
      finalWakeMinutes: finalWakeN,
    },
  };
}

function warningText(w: SleepEfficiencyWarning, labels: SleepEfficiencyToolContent["calculatorLabels"], lc: "it" | "en"): string {
  switch (w.code) {
    case "SHORT_TIME_IN_BED":
      return labels.warningShortTimeInBed[lc];
    case "UNUSUALLY_LONG_TIME_IN_BED":
      return labels.warningLongTimeInBed[lc];
  }
}

function errorText(e: SleepEfficiencyValidationError, labels: SleepEfficiencyToolContent["calculatorLabels"], lc: "it" | "en"): string {
  switch (e.code) {
    case "MISSING_FIELD":
      return `${labels.errorMissingField[lc]}: ${e.field}`;
    case "NOT_A_NUMBER":
      return `${labels.errorMissingField[lc]}: ${e.field}`;
    case "NEGATIVE_VALUE":
      return `${labels.errorNegativeValue[lc]}: ${e.field}`;
    case "TIME_OUT_OF_RANGE":
      return `${labels.errorTimeOutOfRange[lc]}: ${e.field}`;
    case "MINUTES_OUT_OF_RANGE":
      return `${labels.errorMinutesOutOfRange[lc]}: ${e.field}`;
    case "TIME_IN_BED_ZERO":
      return labels.errorTimeInBedZero[lc];
    case "SLEEP_EXCEEDS_TIME_IN_BED":
      return labels.errorSleepExceedsTimeInBed[lc];
    case "NEGATIVE_DERIVED_SLEEP_TIME":
      return labels.errorNegativeDerivedSleepTime[lc];
    case "EFFICIENCY_OUT_OF_RANGE":
      return labels.errorEfficiencyOutOfRange[lc];
  }
}

function fmtHm(totalMinutes: number, labels: SleepEfficiencyToolContent["calculatorLabels"], lc: "it" | "en"): string {
  const { hours, minutes } = formatMinutesAsHm(totalMinutes);
  return `${hours}${labels.hoursUnit[lc][0]} ${minutes}${labels.minutesUnit[lc][0]}`;
}

export function SleepEfficiencyCalculator({
  labels,
  locale,
}: {
  labels: SleepEfficiencyToolContent["calculatorLabels"];
  locale: Locale;
}) {
  const lc: "it" | "en" = locale === "it" ? "it" : "en";
  const uid = useId();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [copied, setCopied] = useState(false);

  const built = useMemo(() => buildInput(form), [form]);
  const outcome = useMemo(
    () => (built.status === "ready" ? calculateSleepEfficiency(built.input) : null),
    [built],
  );
  // Errori grezzi (range ore/minuti) hanno la precedenza su quelli del motore
  // di calcolo: sono rilevati prima, sullo stesso input che il motore non
  // vedrebbe mai (non viene nemmeno costruito un SleepEfficiencyInput).
  const displayErrors: SleepEfficiencyValidationError[] | null =
    built.status === "invalid" ? built.errors : outcome && !outcome.ok ? outcome.errors : null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadSample = () => {
    if (form.mode === "simple") {
      setForm((prev) => ({
        ...prev,
        simpleTibH: String(Math.floor(SAMPLE_SIMPLE_INPUT.timeInBedMinutes / 60)),
        simpleTibM: String(SAMPLE_SIMPLE_INPUT.timeInBedMinutes % 60),
        simpleTstH: String(Math.floor(SAMPLE_SIMPLE_INPUT.totalSleepTimeMinutes / 60)),
        simpleTstM: String(SAMPLE_SIMPLE_INPUT.totalSleepTimeMinutes % 60),
      }));
    } else {
      const s = SAMPLE_ADVANCED_INPUT;
      setForm((prev) => ({
        ...prev,
        format24h: true,
        bedH: String(Math.floor(s.bedMinutes / 60)),
        bedM: String(s.bedMinutes % 60),
        outH: String(Math.floor(s.outOfBedMinutes / 60)),
        outM: String(s.outOfBedMinutes % 60),
        latencyM: String(s.sleepOnsetLatencyMinutes),
        wasoM: String(s.wakeAfterSleepOnsetMinutes),
        finalWakeM: String(s.finalWakeMinutes),
      }));
    }
  };

  const reset = () => setForm((prev) => ({ ...EMPTY_FORM, mode: prev.mode, format24h: prev.format24h }));

  const resultSummary = (): string => {
    if (!outcome || !outcome.ok) return "";
    const r = outcome.result;
    return [
      `${labels.resultEfficiency[lc]}: ${r.sleepEfficiencyPercent.toFixed(1)}%`,
      `${labels.resultTotalSleep[lc]}: ${fmtHm(r.totalSleepTimeMinutes, labels, lc)}`,
      `${labels.resultTimeInBed[lc]}: ${fmtHm(r.timeInBedMinutes, labels, lc)}`,
      `${labels.resultTotalAwake[lc]}: ${fmtHm(r.totalTimeAwakeMinutes, labels, lc)}`,
    ].join("\n");
  };

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(resultSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent: clipboard non disponibile, nessun dato da inviare comunque */
    }
  };

  const downloadCsv = () => {
    if (!outcome || !outcome.ok) return;
    const r = outcome.result;
    const rows = [
      ["metric", "value_minutes"],
      ["timeInBedMinutes", String(r.timeInBedMinutes)],
      ["totalSleepTimeMinutes", String(r.totalSleepTimeMinutes)],
      ["totalTimeAwakeMinutes", String(r.totalTimeAwakeMinutes)],
      ["sleepEfficiencyPercent", r.sleepEfficiencyPercent.toFixed(2)],
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sleep-efficiency.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const radioPillClass = (checked: boolean) =>
    `px-4 py-2 rounded-pill text-sm font-medium transition cursor-pointer focus-within:ring-2 focus-within:ring-brand-aqua focus-within:ring-offset-2 focus-within:ring-offset-bg-card ${
      checked ? "bg-brand-aqua text-bg" : "border border-divider text-text-secondary hover:text-text-primary"
    }`;

  const inputClass =
    "w-16 rounded-[8px] border border-divider bg-bg-elevated px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-brand-aqua";

  // id stabili e univoci per pagina (useId): niente collisioni se il
  // calcolatore comparisse due volte nella stessa pagina.
  const ids = {
    tibH: `${uid}-tib-h`,
    tibM: `${uid}-tib-m`,
    tstH: `${uid}-tst-h`,
    tstM: `${uid}-tst-m`,
    bedH: `${uid}-bed-h`,
    bedM: `${uid}-bed-m`,
    bedAmPm: `${uid}-bed-ampm`,
    outH: `${uid}-out-h`,
    outM: `${uid}-out-m`,
    outAmPm: `${uid}-out-ampm`,
    latency: `${uid}-latency`,
    waso: `${uid}-waso`,
    finalWake: `${uid}-final-wake`,
  };

  return (
    <div data-testid="sleep-efficiency-calculator" className="rounded-card border border-divider bg-bg-card/60 p-5 sm:p-6">
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1.5 block text-sm text-text-secondary">{labels.modeLabel[lc]}</legend>
        <div className="flex flex-wrap gap-2">
          <label className={radioPillClass(form.mode === "simple")}>
            <input
              type="radio"
              name={`${uid}-mode`}
              value="simple"
              checked={form.mode === "simple"}
              onChange={() => set("mode", "simple")}
              className="sr-only"
            />
            {labels.modeSimple[lc]}
          </label>
          <label className={radioPillClass(form.mode === "advanced")}>
            <input
              type="radio"
              name={`${uid}-mode`}
              value="advanced"
              checked={form.mode === "advanced"}
              onChange={() => set("mode", "advanced")}
              className="sr-only"
            />
            {labels.modeAdvanced[lc]}
          </label>
        </div>
      </fieldset>

      {form.mode === "simple" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-1.5 block text-sm text-text-secondary">{labels.simpleTimeInBedLabel[lc]}</legend>
            <div className="flex items-center gap-2">
              <label htmlFor={ids.tibH} className="sr-only">{labels.simpleTimeInBedHoursLabel[lc]}</label>
              <input id={ids.tibH} type="number" min={0} className={inputClass} value={form.simpleTibH} onChange={(e) => set("simpleTibH", e.target.value)} />
              <span aria-hidden="true" className="text-xs text-text-muted">{labels.hoursUnit[lc]}</span>
              <label htmlFor={ids.tibM} className="sr-only">{labels.simpleTimeInBedMinutesLabel[lc]}</label>
              <input id={ids.tibM} type="number" min={0} max={59} className={inputClass} value={form.simpleTibM} onChange={(e) => set("simpleTibM", e.target.value)} />
              <span aria-hidden="true" className="text-xs text-text-muted">{labels.minutesUnit[lc]}</span>
            </div>
          </fieldset>
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-1.5 block text-sm text-text-secondary">{labels.simpleTotalSleepLabel[lc]}</legend>
            <div className="flex items-center gap-2">
              <label htmlFor={ids.tstH} className="sr-only">{labels.simpleTotalSleepHoursLabel[lc]}</label>
              <input id={ids.tstH} type="number" min={0} className={inputClass} value={form.simpleTstH} onChange={(e) => set("simpleTstH", e.target.value)} />
              <span aria-hidden="true" className="text-xs text-text-muted">{labels.hoursUnit[lc]}</span>
              <label htmlFor={ids.tstM} className="sr-only">{labels.simpleTotalSleepMinutesLabel[lc]}</label>
              <input id={ids.tstM} type="number" min={0} max={59} className={inputClass} value={form.simpleTstM} onChange={(e) => set("simpleTstM", e.target.value)} />
              <span aria-hidden="true" className="text-xs text-text-muted">{labels.minutesUnit[lc]}</span>
            </div>
          </fieldset>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={form.format24h} onChange={(e) => set("format24h", e.target.checked)} />
            {labels.formatToggleLabel[lc]}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-1.5 block text-sm text-text-secondary">{labels.advancedBedTimeLabel[lc]}</legend>
              <div className="flex items-center gap-2">
                <label htmlFor={ids.bedH} className="sr-only">{labels.advancedBedHourLabel[lc]}</label>
                <input id={ids.bedH} type="number" min={form.format24h ? 0 : 1} max={form.format24h ? 23 : 12} className={inputClass} value={form.bedH} onChange={(e) => set("bedH", e.target.value)} />
                <span aria-hidden="true">:</span>
                <label htmlFor={ids.bedM} className="sr-only">{labels.advancedBedMinuteLabel[lc]}</label>
                <input id={ids.bedM} type="number" min={0} max={59} className={inputClass} value={form.bedM} onChange={(e) => set("bedM", e.target.value)} />
                {!form.format24h && (
                  <>
                    <label htmlFor={ids.bedAmPm} className="sr-only">{labels.advancedBedAmPmLabel[lc]}</label>
                    <select id={ids.bedAmPm} className={inputClass} value={form.bedAmPm} onChange={(e) => set("bedAmPm", e.target.value as "AM" | "PM")}>
                      <option value="AM">{labels.amLabel[lc]}</option>
                      <option value="PM">{labels.pmLabel[lc]}</option>
                    </select>
                  </>
                )}
              </div>
            </fieldset>
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-1.5 block text-sm text-text-secondary">{labels.advancedOutOfBedTimeLabel[lc]}</legend>
              <div className="flex items-center gap-2">
                <label htmlFor={ids.outH} className="sr-only">{labels.advancedOutHourLabel[lc]}</label>
                <input id={ids.outH} type="number" min={form.format24h ? 0 : 1} max={form.format24h ? 23 : 12} className={inputClass} value={form.outH} onChange={(e) => set("outH", e.target.value)} />
                <span aria-hidden="true">:</span>
                <label htmlFor={ids.outM} className="sr-only">{labels.advancedOutMinuteLabel[lc]}</label>
                <input id={ids.outM} type="number" min={0} max={59} className={inputClass} value={form.outM} onChange={(e) => set("outM", e.target.value)} />
                {!form.format24h && (
                  <>
                    <label htmlFor={ids.outAmPm} className="sr-only">{labels.advancedOutAmPmLabel[lc]}</label>
                    <select id={ids.outAmPm} className={inputClass} value={form.outAmPm} onChange={(e) => set("outAmPm", e.target.value as "AM" | "PM")}>
                      <option value="AM">{labels.amLabel[lc]}</option>
                      <option value="PM">{labels.pmLabel[lc]}</option>
                    </select>
                  </>
                )}
              </div>
            </fieldset>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor={ids.latency} className="mb-1.5 block text-sm text-text-secondary">{labels.advancedLatencyLabel[lc]}</label>
              <input id={ids.latency} type="number" min={0} className={`${inputClass} w-full`} value={form.latencyM} onChange={(e) => set("latencyM", e.target.value)} />
            </div>
            <div>
              <label htmlFor={ids.waso} className="mb-1.5 block text-sm text-text-secondary">{labels.advancedWasoLabel[lc]}</label>
              <input id={ids.waso} type="number" min={0} className={`${inputClass} w-full`} value={form.wasoM} onChange={(e) => set("wasoM", e.target.value)} />
            </div>
            <div>
              <label htmlFor={ids.finalWake} className="mb-1.5 block text-sm text-text-secondary">{labels.advancedFinalWakeLabel[lc]}</label>
              <input id={ids.finalWake} type="number" min={0} className={`${inputClass} w-full`} value={form.finalWakeM} onChange={(e) => set("finalWakeM", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={loadSample} className="px-4 py-2 rounded-pill border border-divider text-sm text-text-secondary hover:text-text-primary transition">
          {labels.sampleDataButton[lc]}
        </button>
        <button type="button" onClick={reset} className="px-4 py-2 rounded-pill border border-divider text-sm text-text-secondary hover:text-text-primary transition">
          {labels.resetButton[lc]}
        </button>
      </div>

      <div className="mt-6 border-t border-divider pt-5" aria-live="polite">
        <h3 className="font-display text-base font-semibold text-text-primary">{labels.resultsHeading[lc]}</h3>

        {built.status === "empty" && <p className="mt-2 text-sm text-text-muted">{labels.noResultsYet[lc]}</p>}

        {displayErrors && (
          <ul role="alert" className="mt-2 space-y-1 text-sm text-error">
            {displayErrors.map((e, i) => (
              <li key={i}>{errorText(e, labels, lc)}</li>
            ))}
          </ul>
        )}

        {outcome && outcome.ok && (
          <div data-testid="labs-calculation-results" className="mt-3 space-y-4">
            {outcome.result.warnings.length > 0 && (
              <ul role="alert" className="space-y-1 text-sm text-warning">
                {outcome.result.warnings.map((w, i) => (
                  <li key={i}>{warningText(w, labels, lc)}</li>
                ))}
              </ul>
            )}
            {outcome.result.crossedMidnight && (
              <p className="text-xs text-text-muted">{labels.crossedMidnightNote[lc]}</p>
            )}

            <p data-testid="labs-result-value" className="text-3xl font-display font-semibold text-text-primary">
              {outcome.result.sleepEfficiencyPercent.toFixed(1)}%
              <span className="ml-2 text-sm font-normal text-text-secondary">{labels.resultEfficiency[lc]}</span>
            </p>

            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">{labels.resultTotalSleep[lc]}</dt>
                <dd className="text-text-primary">{fmtHm(outcome.result.totalSleepTimeMinutes, labels, lc)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">{labels.resultTimeInBed[lc]}</dt>
                <dd className="text-text-primary">{fmtHm(outcome.result.timeInBedMinutes, labels, lc)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">{labels.resultTotalAwake[lc]}</dt>
                <dd className="text-text-primary">{fmtHm(outcome.result.totalTimeAwakeMinutes, labels, lc)}</dd>
              </div>
              {outcome.result.latencyMinutes !== null && (
                <div className="flex justify-between gap-2">
                  <dt className="text-text-secondary">{labels.resultLatency[lc]}</dt>
                  <dd className="text-text-primary">{fmtHm(outcome.result.latencyMinutes, labels, lc)}</dd>
                </div>
              )}
            </dl>

            {/* Scomposizione visuale della notte: barra proporzionale sonno vs sveglio,
                con equivalente testuale in tabella (mai affidata solo al colore/alla barra). */}
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted mb-1.5">{labels.nightBreakdownHeading[lc]}</p>
              <div className="flex h-3 w-full overflow-hidden rounded-pill border border-divider" role="img" aria-label={resultSummary()}>
                <div
                  className="bg-brand-aqua"
                  style={{
                    width: `${Math.max(0, Math.min(100, (outcome.result.totalSleepTimeMinutes / outcome.result.timeInBedMinutes) * 100))}%`,
                  }}
                />
                <div className="flex-1 bg-divider" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" onClick={copyResults} className="px-4 py-2 rounded-pill border border-divider text-sm text-text-secondary hover:text-text-primary transition">
                {copied ? labels.copiedButton[lc] : labels.copyResultsButton[lc]}
              </button>
              <button type="button" onClick={downloadCsv} className="px-4 py-2 rounded-pill border border-divider text-sm text-text-secondary hover:text-text-primary transition">
                {labels.downloadCsvButton[lc]}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
