"use client";

import React, { useState, useId } from "react";
import Link from "next/link";
import {
  resolveCompatibilityPath,
  SELECTOR_DEVICES,
  SELECTOR_METRICS,
  type SelectorPhoneOs,
  type SelectorDevice,
  type SelectorMetric,
  type SelectorStatus,
} from "@/lib/compatibility/selector-registry";

interface CompatibilitySelectorProps {
  locale: "it" | "en";
}

const UI_TEXT = {
  it: {
    heading: "Selettore di Compatibilità Dati",
    subheading:
      "Scopri il percorso di sincronizzazione dal tuo dispositivo a FitMesh. Nessuna compatibilità presunta: solo percorsi documentati e verificati.",
    osLabel: "1. Sistema Operativo Smartphone",
    deviceLabel: "2. Dispositivo o Piattaforma",
    metricLabel: "3. Metrica Desiderata",
    routeTitleActive: "Percorso di Sincronizzazione Documentato",
    routeTitleInactive: "Stato del Percorso Richiesto",
    step1: "1. Dispositivo Hardware",
    step2: "2. App Produttore",
    step3: "3. Archivio di Sistema",
    step4: "4. FitMesh Sync",
    unavailablePointLabel: "Punto di interruzione o stato verifica",
    unavailableStatusTitle: {
      unsupported: "Collegamento verso FitMesh Sync non disponibile per questa combinazione",
      unverified: "Collegamento end-to-end verso FitMesh Sync non verificato per questa combinazione",
    },
    explanationLabel: "Dettaglio Tecnico",
    limitationsLabel: "Limitazioni e Condizioni",
    evidenceLabel: "Fonte e Verifica",
    directBle: "Connessione diretta BLE (senza app intermedia)",
    recommendedAction: "Azione o approfondimento:",
    statusColors: {
      direct_verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      health_store: "bg-sky-500/10 text-sky-400 border-sky-500/30",
      conditional: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      unsupported: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      unverified: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
    } as Record<SelectorStatus, string>,
  },
  en: {
    heading: "Health Data Compatibility Selector",
    subheading:
      "Check the synchronization route from your wearable to FitMesh. No assumed compatibility: only documented, verified paths.",
    osLabel: "1. Smartphone Operating System",
    deviceLabel: "2. Wearable Device or Platform",
    metricLabel: "3. Desired Metric",
    routeTitleActive: "Documented Data Route",
    routeTitleInactive: "Requested Route Status",
    step1: "1. Hardware Device",
    step2: "2. Vendor Application",
    step3: "3. System Health Store",
    step4: "4. FitMesh Sync",
    unavailablePointLabel: "Interruption point or verification state",
    unavailableStatusTitle: {
      unsupported: "Connection to FitMesh Sync is not available for this combination",
      unverified: "End-to-end connection to FitMesh Sync is not verified for this combination",
    },
    explanationLabel: "Technical Details",
    limitationsLabel: "Limitations and Conditions",
    evidenceLabel: "Source and Verification",
    directBle: "Direct BLE connection (no intermediate app)",
    recommendedAction: "Recommended reference:",
    statusColors: {
      direct_verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      health_store: "bg-sky-500/10 text-sky-400 border-sky-500/30",
      conditional: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      unsupported: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      unverified: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
    } as Record<SelectorStatus, string>,
  },
};

export function CompatibilitySelector({ locale }: CompatibilitySelectorProps) {
  const [os, setOs] = useState<SelectorPhoneOs>("android");
  const [device, setDevice] = useState<SelectorDevice>("garmin");
  const [metric, setMetric] = useState<SelectorMetric>("steps");

  const osLegendId = useId();
  const deviceId = useId();
  const metricId = useId();

  const t = UI_TEXT[locale];
  const result = resolveCompatibilityPath(os, device, metric);
  const isRouteActive =
    result.status === "direct_verified" ||
    result.status === "health_store" ||
    result.status === "conditional";

  const handleOsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setOs((prev) => (prev === "android" ? "ios" : "android"));
    }
  };

  const localizedHref = result.cta.href ? result.cta.href[locale] : undefined;

  return (
    <div
      className="w-full max-w-4xl mx-auto rounded-2xl bg-surface/80 border border-divider p-4 sm:p-8 backdrop-blur-sm shadow-xl"
      aria-label={t.heading}
    >
      <div className="border-b border-divider pb-5 mb-6">
        <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          {t.heading}
        </h3>
        <p className="mt-2 text-sm sm:text-base text-text-secondary leading-relaxed">
          {t.subheading}
        </p>
      </div>

      {/* Selectors grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* OS Selector: accessible fieldset + radiogroup */}
        <fieldset className="min-w-0">
          <legend
            id={osLegendId}
            className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2"
          >
            {t.osLabel}
          </legend>
          <div
            role="radiogroup"
            aria-labelledby={osLegendId}
            onKeyDown={handleOsKeyDown}
            className="flex rounded-xl bg-surface-raised border border-divider p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={os === "android"}
              tabIndex={os === "android" ? 0 : -1}
              onClick={() => setOs("android")}
              className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition ${
                os === "android"
                  ? "bg-brand-aqua text-[#03121f] font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Android
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={os === "ios"}
              tabIndex={os === "ios" ? 0 : -1}
              onClick={() => setOs("ios")}
              className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition ${
                os === "ios"
                  ? "bg-brand-aqua text-[#03121f] font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              iPhone (iOS)
            </button>
          </div>
        </fieldset>

        {/* Device Selector */}
        <div className="min-w-0">
          <label
            htmlFor={deviceId}
            className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2"
          >
            {t.deviceLabel}
          </label>
          <select
            id={deviceId}
            value={device}
            onChange={(e) => setDevice(e.target.value as SelectorDevice)}
            className="w-full py-2.5 px-3 rounded-xl bg-surface-raised border border-divider text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-aqua"
          >
            {SELECTOR_DEVICES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label[locale]}
              </option>
            ))}
          </select>
        </div>

        {/* Metric Selector */}
        <div className="min-w-0">
          <label
            htmlFor={metricId}
            className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2"
          >
            {t.metricLabel}
          </label>
          <select
            id={metricId}
            value={metric}
            onChange={(e) => setMetric(e.target.value as SelectorMetric)}
            className="w-full py-2.5 px-3 rounded-xl bg-surface-raised border border-divider text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-aqua"
          >
            {SELECTOR_METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label[locale]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Card */}
      <div
        className="rounded-xl bg-surface-raised/70 border border-divider p-4 sm:p-6 transition-all"
        aria-live="polite"
      >
        {/* Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider/60 pb-4 mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {isRouteActive ? t.routeTitleActive : t.routeTitleInactive}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
              t.statusColors[result.status]
            }`}
          >
            {result.statusBadge[locale]}
          </span>
        </div>

        {/* Visual Route Flow: only render the 4-step chain to FitMesh Sync when the route is active */}
        {isRouteActive ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6" data-testid="active-route-chain">
            {/* Step 1 */}
            <div className="p-3 rounded-lg bg-surface/50 border border-divider/40 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">
                {t.step1}
              </span>
              <span className="text-xs font-semibold text-text-primary block">
                {result.route.device[locale]}
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-lg bg-surface/50 border border-divider/40 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">
                {t.step2}
              </span>
              <span className="text-xs font-medium text-text-secondary block">
                {result.route.sourceApp[locale]}
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-lg bg-surface/50 border border-divider/40 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">
                {t.step3}
              </span>
              <span className="text-xs font-medium text-text-secondary block">
                {result.route.healthStore ? result.route.healthStore[locale] : t.directBle}
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-lg bg-surface/50 border border-divider/40 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-aqua block mb-1">
                {t.step4}
              </span>
              <span className="text-xs font-semibold text-brand-aqua block">
                {result.route.fitmeshApp[locale]}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg bg-surface/60 border border-divider/60 p-4 mb-6"
            data-testid="inactive-route-notice"
          >
            <p className="text-xs font-semibold text-text-primary mb-2">
              {result.status === "unsupported"
                ? t.unavailableStatusTitle.unsupported
                : t.unavailableStatusTitle.unverified}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-surface-raised/60 border border-divider/40">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-0.5">
                  {t.step1} / {t.step2}
                </span>
                <span className="text-text-secondary font-medium">
                  {result.route.device[locale]} ({result.route.sourceApp[locale]})
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface-raised/60 border border-divider/40">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-0.5">
                  {t.unavailablePointLabel}
                </span>
                <span className="text-text-secondary font-medium">
                  {result.route.healthStore
                    ? `${result.route.healthStore[locale]}: ${result.route.fitmeshApp[locale]}`
                    : result.route.fitmeshApp[locale]}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Explanation & Limitations */}
        <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
              {t.explanationLabel}
            </h4>
            <p>{result.explanation[locale]}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
              {t.limitationsLabel}
            </h4>
            <p className="text-text-muted">{result.limitations[locale]}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
              {t.evidenceLabel}
            </h4>
            <p className="text-xs text-text-muted italic">{result.evidence[locale]}</p>
          </div>
        </div>

        {/* Contextual CTA */}
        {result.cta.type !== "none" && localizedHref && (
          <div className="mt-6 pt-4 border-t border-divider/60 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-text-muted">{t.recommendedAction}</span>
            <Link
              href={localizedHref}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-aqua text-[#03121f] text-xs font-semibold hover:bg-brand-green transition shadow-sm"
            >
              {result.cta.label[locale]} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
