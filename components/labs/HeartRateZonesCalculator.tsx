"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { HeartRateZonesToolContent } from "@/lib/labs/heart-rate-zones/content";
import {
  calculateHeartRateZones,
  SAMPLE_TANAKA_INPUT,
  SAMPLE_AGE220_INPUT,
  SAMPLE_MEASURED_INPUT,
  type HeartRateZonesInput,
  type HeartRateZonesValidationError,
  type HeartRateZonesWarning,
  type MaxHrMode,
  type ZoneRange,
} from "@/lib/labs/heart-rate-zones/math";

interface FormState {
  maxHrMode: MaxHrMode;
  age: string;
  measuredMaxHr: string;
  restingHr: string;
}

const EMPTY_FORM: FormState = {
  maxHrMode: "tanaka",
  age: "",
  measuredMaxHr: "",
  restingHr: "",
};

/** true per "tanaka" e "age220": entrambe usano il campo età. */
function usesAgeInput(mode: MaxHrMode): boolean {
  return mode === "tanaka" || mode === "age220";
}

/**
 * Notazione esplicita e coerente ovunque (UI, CSV, clipboard, articolo Zona
 * 2): limite inferiore incluso, limite superiore escluso - tranne l'ultima
 * zona (z5), che include anche il limite superiore (P1.4B-A Fase 5).
 * Separatore ";" (non ",") apposta: il valore finisce anche in una cella CSV
 * grezza (vedi downloadCsv) - una virgola lì spezzerebbe la riga in più colonne.
 */
function formatZoneRange(z: ZoneRange, isLast: boolean): string {
  return isLast ? `[${z.bpmLow}; ${z.bpmHigh}]` : `[${z.bpmLow}; ${z.bpmHigh})`;
}

function toNum(v: string): number | undefined {
  return v === "" ? undefined : Number(v);
}

function methodLabel(
  mode: MaxHrMode,
  labels: HeartRateZonesToolContent["calculatorLabels"],
  lc: "it" | "en",
): string {
  if (mode === "tanaka") return labels.maxHrModeTanaka[lc];
  if (mode === "age220") return labels.maxHrModeAge220[lc];
  return labels.maxHrModeMeasured[lc];
}

type BuildResult =
  | { status: "empty" }
  | { status: "invalid"; errors: HeartRateZonesValidationError[] }
  | { status: "ready"; input: HeartRateZonesInput };

function buildInput(f: FormState): BuildResult {
  const restingRaw = f.restingHr;
  const primaryRaw = usesAgeInput(f.maxHrMode) ? f.age : f.measuredMaxHr;
  if (restingRaw === "" && primaryRaw === "") return { status: "empty" };

  const input: HeartRateZonesInput = usesAgeInput(f.maxHrMode)
    ? { maxHrMode: f.maxHrMode, age: toNum(f.age), restingHr: toNum(f.restingHr) as number }
    : { maxHrMode: "measured", measuredMaxHr: toNum(f.measuredMaxHr), restingHr: toNum(f.restingHr) as number };

  return { status: "ready", input };
}

function errorText(
  e: HeartRateZonesValidationError,
  labels: HeartRateZonesToolContent["calculatorLabels"],
  lc: "it" | "en",
): string {
  switch (e.code) {
    case "MISSING_FIELD":
      return `${labels.errorMissingField[lc]}: ${e.field}`;
    case "NOT_A_NUMBER":
      return `${labels.errorMissingField[lc]}: ${e.field}`;
    case "NEGATIVE_VALUE":
      return `${labels.errorNegativeValue[lc]}: ${e.field}`;
    case "AGE_OUT_OF_RANGE":
      return labels.errorAgeOutOfRange[lc];
    case "MAX_HR_OUT_OF_RANGE":
      return labels.errorMaxHrOutOfRange[lc];
    case "RESTING_HR_OUT_OF_RANGE":
      return labels.errorRestingHrOutOfRange[lc];
    case "RESTING_HR_NOT_BELOW_MAX":
      return labels.errorRestingHrNotBelowMax[lc];
  }
}

function warningText(
  w: HeartRateZonesWarning,
  labels: HeartRateZonesToolContent["calculatorLabels"],
  lc: "it" | "en",
): string {
  switch (w.code) {
    case "UNUSUALLY_HIGH_RESTING_HR":
      return labels.warningHighRestingHr[lc];
    case "UNUSUALLY_LOW_RESTING_HR":
      return labels.warningLowRestingHr[lc];
    case "NARROW_HEART_RATE_RESERVE":
      return labels.warningNarrowReserve[lc];
  }
}

function ZoneTable({
  heading,
  zones,
  zoneNames,
  labels,
  lc,
}: {
  heading: string;
  zones: ZoneRange[];
  zoneNames: HeartRateZonesToolContent["zoneNames"];
  labels: HeartRateZonesToolContent["calculatorLabels"];
  lc: "it" | "en";
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-muted mb-1.5">{heading}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-muted">
            <th scope="col" className="font-normal pb-1">{labels.tableZoneColumn[lc]}</th>
            <th scope="col" className="font-normal pb-1 text-right">{labels.tableRangeColumn[lc]}</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z, i) => (
            <tr key={z.key} className="border-t border-divider">
              <td className="py-1.5 text-text-secondary">
                {zoneNames[z.key][lc]} <span className="text-text-muted">({z.pctLow}-{z.pctHigh}%)</span>
              </td>
              <td className="py-1.5 text-right text-text-primary font-medium">
                {formatZoneRange(z, i === zones.length - 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-xs text-text-muted">
        {lc === "it"
          ? "Limite superiore escluso (tranne l'ultima zona, che lo include)."
          : "Upper bound excluded (except the last zone, which includes it)."}
      </p>
    </div>
  );
}

export function HeartRateZonesCalculator({
  content,
  locale,
}: {
  content: HeartRateZonesToolContent;
  locale: Locale;
}) {
  const lc: "it" | "en" = locale === "it" ? "it" : "en";
  const labels = content.calculatorLabels;
  const uid = useId();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [copied, setCopied] = useState(false);

  const built = useMemo(() => buildInput(form), [form]);
  const outcome = useMemo(
    () => (built.status === "ready" ? calculateHeartRateZones(built.input) : null),
    [built],
  );
  const displayErrors: HeartRateZonesValidationError[] | null =
    built.status === "invalid" ? built.errors : outcome && !outcome.ok ? outcome.errors : null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadSample = () => {
    if (form.maxHrMode === "tanaka") {
      setForm({
        maxHrMode: "tanaka",
        age: String(SAMPLE_TANAKA_INPUT.age),
        measuredMaxHr: "",
        restingHr: String(SAMPLE_TANAKA_INPUT.restingHr),
      });
    } else if (form.maxHrMode === "age220") {
      setForm({
        maxHrMode: "age220",
        age: String(SAMPLE_AGE220_INPUT.age),
        measuredMaxHr: "",
        restingHr: String(SAMPLE_AGE220_INPUT.restingHr),
      });
    } else {
      setForm({
        maxHrMode: "measured",
        age: "",
        measuredMaxHr: String(SAMPLE_MEASURED_INPUT.measuredMaxHr),
        restingHr: String(SAMPLE_MEASURED_INPUT.restingHr),
      });
    }
  };

  const reset = () => setForm({ ...EMPTY_FORM, maxHrMode: form.maxHrMode });

  const resultSummary = (): string => {
    if (!outcome || !outcome.ok) return "";
    const r = outcome.result;
    const lines = [
      `${labels.resultMethodLabel[lc]}: ${methodLabel(r.maxHrSource, labels, lc)}`,
      `${labels.resultMaxHr[lc]}: ${r.maxHr} bpm`,
      `${labels.resultRestingHr[lc]}: ${r.restingHr} bpm`,
      `${labels.resultHrr[lc]}: ${r.heartRateReserve} bpm`,
      "",
      labels.percentMaxHrTableHeading[lc] + ":",
      ...r.percentMaxHrZones.map(
        (z, i) => `${content.zoneNames[z.key][lc]}: ${formatZoneRange(z, i === r.percentMaxHrZones.length - 1)} bpm`,
      ),
      "",
      labels.hrrTableHeading[lc] + ":",
      ...r.heartRateReserveZones.map(
        (z, i) => `${content.zoneNames[z.key][lc]}: ${formatZoneRange(z, i === r.heartRateReserveZones.length - 1)} bpm`,
      ),
    ];
    return lines.join("\n");
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
    const rows: string[][] = [["metric", "value_bpm_or_range"]];
    rows.push(["method", r.maxHrSource]);
    rows.push(["maxHr", String(r.maxHr)]);
    rows.push(["restingHr", String(r.restingHr)]);
    rows.push(["heartRateReserve", String(r.heartRateReserve)]);
    r.percentMaxHrZones.forEach((z, i) => {
      rows.push([`percentMaxHr_${z.key}`, formatZoneRange(z, i === r.percentMaxHrZones.length - 1)]);
    });
    r.heartRateReserveZones.forEach((z, i) => {
      rows.push([`karvonenHrr_${z.key}`, formatZoneRange(z, i === r.heartRateReserveZones.length - 1)]);
    });
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "heart-rate-zones.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const radioPillClass = (checked: boolean) =>
    `px-4 py-2 rounded-pill text-sm font-medium transition cursor-pointer focus-within:ring-2 focus-within:ring-brand-aqua focus-within:ring-offset-2 focus-within:ring-offset-bg-card ${
      checked ? "bg-brand-aqua text-bg" : "border border-divider text-text-secondary hover:text-text-primary"
    }`;

  const inputClass =
    "w-24 rounded-[8px] border border-divider bg-bg-elevated px-2 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-brand-aqua";

  const ids = {
    age: `${uid}-age`,
    measuredMaxHr: `${uid}-measured-max-hr`,
    restingHr: `${uid}-resting-hr`,
  };

  return (
    <div data-testid="heart-rate-zones-calculator" className="rounded-card border border-divider bg-bg-card/60 p-5 sm:p-6">
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1.5 block text-sm text-text-secondary">{labels.maxHrModeLabel[lc]}</legend>
        <div className="flex flex-wrap gap-2">
          <label className={radioPillClass(form.maxHrMode === "tanaka")} data-hr-zones-mode-select="tanaka">
            <input
              type="radio"
              name={`${uid}-max-hr-mode`}
              value="tanaka"
              checked={form.maxHrMode === "tanaka"}
              onChange={() => set("maxHrMode", "tanaka")}
              className="sr-only"
            />
            {labels.maxHrModeTanaka[lc]}
          </label>
          <label className={radioPillClass(form.maxHrMode === "age220")} data-hr-zones-mode-select="age220">
            <input
              type="radio"
              name={`${uid}-max-hr-mode`}
              value="age220"
              checked={form.maxHrMode === "age220"}
              onChange={() => set("maxHrMode", "age220")}
              className="sr-only"
            />
            {labels.maxHrModeAge220[lc]}
          </label>
          <label className={radioPillClass(form.maxHrMode === "measured")} data-hr-zones-mode-select="measured">
            <input
              type="radio"
              name={`${uid}-max-hr-mode`}
              value="measured"
              checked={form.maxHrMode === "measured"}
              onChange={() => set("maxHrMode", "measured")}
              className="sr-only"
            />
            {labels.maxHrModeMeasured[lc]}
          </label>
        </div>
        {form.maxHrMode === "age220" && (
          <p className="mt-1.5 text-xs text-text-muted">{labels.maxHrModeAge220Hint[lc]}</p>
        )}
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {usesAgeInput(form.maxHrMode) ? (
          <div>
            <label htmlFor={ids.age} className="mb-1.5 block text-sm text-text-secondary">
              {labels.ageLabel[lc]}
            </label>
            <input
              id={ids.age}
              type="number"
              min={0}
              className={`${inputClass} w-full`}
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label htmlFor={ids.measuredMaxHr} className="mb-1.5 block text-sm text-text-secondary">
              {labels.measuredMaxHrLabel[lc]}
            </label>
            <input
              id={ids.measuredMaxHr}
              type="number"
              min={0}
              className={`${inputClass} w-full`}
              value={form.measuredMaxHr}
              onChange={(e) => set("measuredMaxHr", e.target.value)}
            />
          </div>
        )}
        <div>
          <label htmlFor={ids.restingHr} className="mb-1.5 block text-sm text-text-secondary">
            {labels.restingHrLabel[lc]}
          </label>
          <input
            id={ids.restingHr}
            type="number"
            min={0}
            className={`${inputClass} w-full`}
            value={form.restingHr}
            onChange={(e) => set("restingHr", e.target.value)}
          />
        </div>
      </div>

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
          <div data-testid="labs-calculation-results" className="mt-3 space-y-5">
            {outcome.result.warnings.length > 0 && (
              <ul role="alert" className="space-y-1 text-sm text-warning">
                {outcome.result.warnings.map((w, i) => (
                  <li key={i}>{warningText(w, labels, lc)}</li>
                ))}
              </ul>
            )}

            <p data-testid="labs-result-value" className="text-3xl font-display font-semibold text-text-primary">
              {outcome.result.maxHr} <span className="text-lg font-normal text-text-secondary">bpm</span>
              <span className="ml-2 text-sm font-normal text-text-secondary">{labels.resultMaxHr[lc]}</span>
            </p>

            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">{labels.resultMethodLabel[lc]}</dt>
                <dd className="text-text-primary">{methodLabel(outcome.result.maxHrSource, labels, lc)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">{labels.resultRestingHr[lc]}</dt>
                <dd className="text-text-primary">{outcome.result.restingHr} bpm</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">{labels.resultHrr[lc]}</dt>
                <dd className="text-text-primary">{outcome.result.heartRateReserve} bpm</dd>
              </div>
            </dl>

            <div className="grid gap-5 sm:grid-cols-2">
              <ZoneTable
                heading={labels.percentMaxHrTableHeading[lc]}
                zones={outcome.result.percentMaxHrZones}
                zoneNames={content.zoneNames}
                labels={labels}
                lc={lc}
              />
              <ZoneTable
                heading={labels.hrrTableHeading[lc]}
                zones={outcome.result.heartRateReserveZones}
                zoneNames={content.zoneNames}
                labels={labels}
                lc={lc}
              />
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
