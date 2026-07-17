"use client";

import { useId, useMemo, useState } from "react";
import {
  calculateHrvMetrics,
  isShortSample,
  parseRrInput,
  SAMPLE_RR_INTERVALS_MS,
  type RrUnit,
} from "@/lib/labs/hrv/rmssd-math";
import { lt, type LabsText } from "@/lib/labs/registry";
import type { HrvToolContent } from "@/lib/labs/hrv/content";

/**
 * Area interattiva del calcolatore HRV/RMSSD.
 *
 * GARANZIA DI PRIVACY (verificata via network inspection, vedi consegna
 * sprint): tutto il calcolo avviene in `parseRrInput`/`calculateHrvMetrics`
 * (funzioni pure, lib/labs/hrv/rmssd-math.ts), che non importano `fetch`,
 * `XMLHttpRequest`, `next/navigation` (niente scrittura sull'URL), cookie,
 * `localStorage`/`sessionStorage`, né alcun client analytics. Digitare o
 * calcolare non genera MAI una richiesta di rete: React ricalcola lo stato
 * locale a ogni keystroke, punto. "Copia risultati" e "Scarica CSV" agiscono
 * SOLO dopo un click esplicito dell'utente (clipboard/download locali, mai
 * upload). Nessun valore inserito o calcolato viene mai passato a un
 * parametro URL, un evento analytics, o persistito fra sessioni.
 */

type CalculatorLabelsSource = HrvToolContent["calculatorLabels"];

/** Risolve ogni campo `LabsText` della sorgente in una stringa per `locale`, una sola volta. */
function resolveLabels(
  source: CalculatorLabelsSource,
  locale: "it" | "en",
): Record<keyof CalculatorLabelsSource, string> {
  const out = {} as Record<keyof CalculatorLabelsSource, string>;
  for (const key of Object.keys(source) as (keyof CalculatorLabelsSource)[]) {
    out[key] = lt(source[key] as LabsText, locale);
  }
  return out;
}

export function HrvRmssdCalculator({
  labels: labelsSource,
  locale,
}: {
  labels: CalculatorLabelsSource;
  locale: "it" | "en";
}) {
  const labels = useMemo(() => resolveLabels(labelsSource, locale), [labelsSource, locale]);
  const textareaId = useId();
  const unitLegendId = useId();
  const [rawInput, setRawInput] = useState("");
  const [unit, setUnit] = useState<RrUnit>("ms");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseRrInput(rawInput, unit), [rawInput, unit]);
  const metrics = useMemo(
    () => calculateHrvMetrics(parsed.validIntervalsMs),
    [parsed.validIntervalsMs],
  );

  function loadSampleData() {
    setUnit("ms");
    setRawInput(SAMPLE_RR_INTERVALS_MS.join(", "));
    setCopied(false);
  }

  function reset() {
    setRawInput("");
    setCopied(false);
  }

  function formatNumber(n: number, digits = 2): string {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function resultsAsText(): string {
    if (!metrics) return "";
    return [
      `${labels.resultValidCount}: ${metrics.validIntervalCount}`,
      `${labels.resultDuration}: ${formatNumber(metrics.totalDurationMs / 1000, 1)} s`,
      `${labels.resultMeanRr}: ${formatNumber(metrics.meanRrMs)} ms`,
      `${labels.resultDerivedHr}: ${formatNumber(metrics.derivedHeartRateBpm, 1)} bpm`,
      `${labels.resultRmssd}: ${formatNumber(metrics.rmssdMs)} ms`,
      `${labels.resultLnRmssd}: ${metrics.lnRmssd === null ? labels.resultLnRmssdUndefined : formatNumber(metrics.lnRmssd, 3)}`,
      `${labels.resultStdDev}: ${formatNumber(metrics.stdDevMs)} ms`,
    ].join("\n");
  }

  async function copyResults() {
    const text = resultsAsText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Nessun fallback di rete se il clipboard API non è disponibile.
    }
  }

  function downloadCsv() {
    if (!metrics) return;
    const rows = [
      ["metric", "value", "unit"],
      ["valid_interval_count", String(metrics.validIntervalCount), "count"],
      ["total_duration", formatNumber(metrics.totalDurationMs / 1000, 3), "s"],
      ["mean_rr", formatNumber(metrics.meanRrMs, 3), "ms"],
      ["derived_heart_rate", formatNumber(metrics.derivedHeartRateBpm, 2), "bpm"],
      ["rmssd", formatNumber(metrics.rmssdMs, 3), "ms"],
      [
        "ln_rmssd",
        metrics.lnRmssd === null ? "undefined" : formatNumber(metrics.lnRmssd, 4),
        "",
      ],
      ["stddev_intervals_n_minus_1", formatNumber(metrics.stdDevMs, 3), "ms"],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    // Blob locale, mai un upload: l'URL è object URL in-memory, mai inviato
    // altrove.
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fitmesh-labs-hrv-rmssd.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const showShortSampleWarning = metrics !== null && isShortSample(metrics.validIntervalCount);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
      <div className="rounded-card border border-divider bg-bg-card/60 p-5 sm:p-6">
        <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">
          {labels.textareaLabel}
        </label>
        <textarea
          id={textareaId}
          value={rawInput}
          onChange={(e) => {
            setRawInput(e.target.value);
            setCopied(false);
          }}
          placeholder={labels.textareaPlaceholder}
          rows={6}
          className="mt-2 w-full rounded-md border border-divider bg-bg px-3 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-aqua/50"
          spellCheck={false}
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <fieldset className="flex items-center gap-2">
            <legend id={unitLegendId} className="text-sm text-text-secondary mr-1">
              {labels.unitLabel}
            </legend>
            <div role="radiogroup" aria-labelledby={unitLegendId} className="flex gap-1 rounded-pill border border-divider p-0.5">
              {(["ms", "s"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={unit === u}
                  onClick={() => setUnit(u)}
                  className={`rounded-pill px-3 py-1 text-xs font-medium transition ${
                    unit === u
                      ? "bg-brand-gradient text-[#050816]"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {u === "ms" ? labels.unitMs : labels.unitS}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={loadSampleData}
            className="rounded-pill border border-divider px-4 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-aqua/40 hover:text-brand-aqua transition"
          >
            {labels.sampleDataButton}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-pill border border-divider px-4 py-1.5 text-xs font-medium text-text-secondary hover:border-white/20 hover:text-text-primary transition"
          >
            {labels.resetButton}
          </button>
        </div>

        {parsed.ambiguousTokens.length > 0 && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed"
          >
            <p className="font-medium">{labels.ambiguousWarningIntro}</p>
            <ul className="mt-1.5 space-y-1 list-disc list-inside">
              {parsed.ambiguousTokens.map((t, i) => (
                <li key={i}>{t.reason}</li>
              ))}
            </ul>
          </div>
        )}

        {parsed.rejectedTokens.length > 0 && (
          <div
            role="alert"
            className="mt-3 rounded-md border border-divider bg-bg p-3 text-xs text-text-muted leading-relaxed"
          >
            <p className="font-medium text-text-secondary">{labels.rejectedWarningIntro}</p>
            <ul className="mt-1.5 space-y-0.5">
              {parsed.rejectedTokens.map((t, i) => (
                <li key={i}>
                  &ldquo;{t.raw}&rdquo;:{" "}
                  {t.reason === "non-numeric"
                    ? labels.rejectedReasonNonNumeric
                    : t.reason === "zero"
                      ? labels.rejectedReasonZero
                      : labels.rejectedReasonNegative}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-xs text-text-muted leading-relaxed">
          {labels.artifactDisclaimer}
        </p>
      </div>

      {/* RISULTATI: aria-live cosicché screen reader annuncino gli aggiornamenti
          senza dover navigare manualmente ogni volta che l'utente digita. */}
      <div aria-live="polite" className="mt-6">
        {!metrics ? (
          <p className="text-sm text-text-muted">
            {parsed.validIntervalsMs.length === 1
              ? labels.minimumIntervalsNotice
              : labels.noResultsYet}
          </p>
        ) : (
          <div className="rounded-card border border-divider bg-bg-card/40 p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              {labels.resultsHeading}
            </h2>

            {showShortSampleWarning && (
              <div
                role="alert"
                className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
              >
                {labels.shortSampleWarning}
              </div>
            )}

            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ResultCell label={labels.resultValidCount} value={String(metrics.validIntervalCount)} />
              <ResultCell
                label={labels.resultDuration}
                value={`${formatNumber(metrics.totalDurationMs / 1000, 1)} s`}
              />
              <ResultCell
                label={labels.resultMeanRr}
                value={`${formatNumber(metrics.meanRrMs)} ${labels.unitsMs}`}
              />
              <ResultCell
                label={labels.resultDerivedHr}
                value={`${formatNumber(metrics.derivedHeartRateBpm, 1)} ${labels.unitsBpm}`}
              />
              <ResultCell
                label={labels.resultRmssd}
                value={`${formatNumber(metrics.rmssdMs)} ${labels.unitsMs}`}
                highlight
              />
              <ResultCell
                label={labels.resultLnRmssd}
                value={
                  metrics.lnRmssd === null
                    ? labels.resultLnRmssdUndefined
                    : formatNumber(metrics.lnRmssd, 3)
                }
              />
              <ResultCell
                label={labels.resultStdDev}
                value={`${formatNumber(metrics.stdDevMs)} ${labels.unitsMs}`}
              />
            </dl>
            <p className="mt-3 text-xs text-text-muted leading-relaxed">
              {labels.resultStdDevNote}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyResults}
                className="rounded-pill border border-divider px-4 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-aqua/40 hover:text-brand-aqua transition"
              >
                {copied ? labels.copiedButton : labels.copyResultsButton}
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded-pill border border-divider px-4 py-1.5 text-xs font-medium text-text-secondary hover:border-white/20 hover:text-text-primary transition"
              >
                {labels.downloadCsvButton}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-text-muted">{label}</dt>
      <dd
        className={`mt-1 font-mono text-lg ${highlight ? "text-brand-aqua font-semibold" : "text-text-primary"}`}
      >
        {value}
      </dd>
    </div>
  );
}
