"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  COMPATIBILITY_PATHS,
  UNVERIFIED_COMBINATIONS_MAP,
  type CompatibilityPath,
  type DeviceFamily,
  type PhoneOs,
} from "@/lib/compatibility/matrix-data";
import type { SupportedMatrixLocale } from "@/lib/compatibility/glossary-data";
import { resolveGuideLink, resolveUnverifiedLink } from "@/lib/compatibility/matrix-links";

interface CompatibilityMatrixProps {
  locale: SupportedMatrixLocale;
}

type OsFilter = "all" | PhoneOs;
type FamilyFilter = "all" | DeviceFamily;

export interface MatrixUiCopy {
  title: string;
  subtitle: string;
  badge: string;
  filterOsLabel: string;
  filterFamilyLabel: string;
  allOs: string;
  allFamilies: string;
  stepALabel: string;
  stepBLabel: string;
  stepCLabel: string;
  stepDLabel: string;
  metricsLabel: string;
  requirementsLabel: string;
  limitationsLabel: string;
  officialSourceLabel: string;
  evidenceLabel: string;
  verifiedDateLabel: string;
  subpathsLabel: string;
  guideLinkLabel: string;
  resultsAnnounce: (count: number) => string;
  noResultsTitle: string;
  noResultsDesc: string;
  unverifiedBadge: string;
  learnMore: string;
  colDeviceOs: string;
  colStatus: string;
  colEvidence: string;
  colRouteData: string;
  colOfficialSource: string;
  subpathRequirements: string;
  subpathMetrics: string;
  subpathFallback: string;
  toggleDetailsOpen: string;
  toggleDetailsClosed: string;
  cardToggleOpen: string;
  cardToggleClosed: string;
  resetFilters: string;
}

export const UI_COPY: Record<SupportedMatrixLocale, MatrixUiCopy> = {
  it: {
    badge: "Matrice di Compatibilità Ufficiale",
    title: "Cosa legge FitMesh dal tuo dispositivo",
    subtitle:
      "Verifica in modo trasparente quali metriche arrivano nella dashboard FitMesh in base al tuo smartwatch o anello e al tuo telefono. Nessuna compatibilità universale promessa.",
    filterOsLabel: "Sistema Operativo Telefono",
    filterFamilyLabel: "Famiglia Dispositivo",
    allOs: "Tutti i telefoni",
    allFamilies: "Tutte le marche",
    stepALabel: "A · Misurazione Sensori Hardware",
    stepBLabel: "B · App del Produttore",
    stepCLabel: "C · Esportazione di Sistema (Health Connect / Apple Health / BLE)",
    stepDLabel: "D · Lettura Release Pubblica FitMesh (3.10.0+191)",
    metricsLabel: "Metriche Disponibili",
    requirementsLabel: "Requisiti Operativi",
    limitationsLabel: "Limitazioni e Note",
    officialSourceLabel: "Fonte Ufficiale Verificata",
    evidenceLabel: "Livello di Evidenza",
    verifiedDateLabel: "Data Verifica",
    subpathsLabel: "Sottopercorsi Distinti",
    guideLinkLabel: "Guida dettagliata",
    resultsAnnounce: (count) => `Mostrati ${count} percorsi di compatibilità.`,
    noResultsTitle: "Nessun percorso trovato per i filtri selezionati",
    noResultsDesc:
      "Prova a reimpostare i filtri su 'Tutti' per consultare l'elenco completo.",
    unverifiedBadge: "Percorso non censito in questa prima matrice",
    learnMore: "Approfondisci nella documentazione",
    colDeviceOs: "Dispositivo & OS",
    colStatus: "Stato",
    colEvidence: "Evidenza & Direzione",
    colRouteData: "Percorso & Dati (A → B → C → D)",
    colOfficialSource: "Fonte Ufficiale",
    subpathRequirements: "Requisiti",
    subpathMetrics: "Metriche",
    subpathFallback: "Fallback",
    toggleDetailsOpen: "▲ Nascondi dettaglio A-D",
    toggleDetailsClosed: "▼ Mostra dettaglio completo A-B-C-D",
    cardToggleOpen: "▲ Chiudi scheda dettagliata",
    cardToggleClosed: "▼ Apri scheda completa (A-D, requisiti, limiti)",
    resetFilters: "Reimposta filtri",
  },
  en: {
    badge: "Official Compatibility Matrix",
    title: "What FitMesh Reads from Your Device",
    subtitle:
      "Transparently check which metrics arrive on your FitMesh dashboard based on your wearable and phone. No false universal compatibility promises.",
    filterOsLabel: "Phone Operating System",
    filterFamilyLabel: "Device Family",
    allOs: "All phones",
    allFamilies: "All brands",
    stepALabel: "A · Hardware Sensor Measurement",
    stepBLabel: "B · Manufacturer Ecosystem App",
    stepCLabel: "C · System Export (Health Connect / Apple Health / BLE)",
    stepDLabel: "D · FitMesh Public Release Read (3.10.0+191)",
    metricsLabel: "Available Metrics",
    requirementsLabel: "Operational Requirements",
    limitationsLabel: "Limitations & Notes",
    officialSourceLabel: "Verified Official Source",
    evidenceLabel: "Evidence Level",
    verifiedDateLabel: "Verification Date",
    subpathsLabel: "Distinct Subpaths",
    guideLinkLabel: "Detailed guide",
    resultsAnnounce: (count) => `Displaying ${count} compatibility routes.`,
    noResultsTitle: "No route found for selected filters",
    noResultsDesc: "Try resetting filters to 'All' to view the complete catalog.",
    unverifiedBadge: "Route not mapped in this initial matrix",
    learnMore: "Learn more in documentation",
    colDeviceOs: "Device & OS",
    colStatus: "Status",
    colEvidence: "Evidence & Direction",
    colRouteData: "Route & Data (A → B → C → D)",
    colOfficialSource: "Official Source",
    subpathRequirements: "Requirements",
    subpathMetrics: "Metrics",
    subpathFallback: "Fallback",
    toggleDetailsOpen: "▲ Hide A-D details",
    toggleDetailsClosed: "▼ Show full A-B-C-D details",
    cardToggleOpen: "▲ Close detailed card",
    cardToggleClosed: "▼ Open full card (A-D, requirements, limits)",
    resetFilters: "Reset filters",
  },
  de: {
    badge: "Offizielle Kompatibilitätsmatrix",
    title: "Was FitMesh von deinem Gerät ausliest",
    subtitle:
      "Überprüfe transparent, welche Messwerte je nach Wearable und Smartphone in deinem FitMesh-Dashboard ankommen. Keine universellen Scheingarantien.",
    filterOsLabel: "Smartphone-Betriebssystem",
    filterFamilyLabel: "Gerätefamilie",
    allOs: "Alle Telefone",
    allFamilies: "Alle Marken",
    stepALabel: "A · Hardware-Sensormessung",
    stepBLabel: "B · Hersteller-App",
    stepCLabel: "C · Systemexport (Health Connect / Apple Health / BLE)",
    stepDLabel: "D · Auslesen im FitMesh-Release (3.10.0+191)",
    metricsLabel: "Verfügbare Metriken",
    requirementsLabel: "Voraussetzungen",
    limitationsLabel: "Einschränkungen & Hinweise",
    officialSourceLabel: "Offizielle verifizierte Quelle",
    evidenceLabel: "Evidenzstufe",
    verifiedDateLabel: "Prüfdatum",
    subpathsLabel: "Getrennte Teilpfade",
    guideLinkLabel: "Detaillierter Leitfaden",
    resultsAnnounce: (count) => `${count} Kompatibilitätspfade werden angezeigt.`,
    noResultsTitle: "Kein Pfad für die ausgewählten Filter gefunden",
    noResultsDesc:
      "Setze die Filter auf 'Alle' zurück, um den vollständigen Katalog zu sehen.",
    unverifiedBadge: "In dieser ersten Matrix nicht erfasster Pfad",
    learnMore: "In der Dokumentation nachlesen",
    colDeviceOs: "Gerät & OS",
    colStatus: "Status",
    colEvidence: "Evidenz & Richtung",
    colRouteData: "Pfad & Daten (A → B → C → D)",
    colOfficialSource: "Offizielle Quelle",
    subpathRequirements: "Voraussetzungen",
    subpathMetrics: "Metriken",
    subpathFallback: "Fallback",
    toggleDetailsOpen: "▲ Details A-D ausblenden",
    toggleDetailsClosed: "▼ Vollständige Details A-B-C-D anzeigen",
    cardToggleOpen: "▲ Detailansicht schließen",
    cardToggleClosed: "▼ Vollständige Karte öffnen (A-D, Voraussetzungen, Limits)",
    resetFilters: "Filter zurücksetzen",
  },
  fr: {
    badge: "Matrice de Compatibilité Officielle",
    title: "Ce que FitMesh lit depuis votre appareil",
    subtitle:
      "Vérifiez en toute transparence quelles métriques parviennent à votre tableau de bord selon votre montre ou bague et votre téléphone. Aucune promesse universelle infondée.",
    filterOsLabel: "Système d'exploitation du téléphone",
    filterFamilyLabel: "Famille d'appareil",
    allOs: "Tous les téléphones",
    allFamilies: "Toutes les marques",
    stepALabel: "A · Mesure des capteurs matériels",
    stepBLabel: "B · Application du fabricant",
    stepCLabel: "C · Export système (Health Connect / Apple Santé / BLE)",
    stepDLabel: "D · Lecture par la release publique FitMesh (3.10.0+191)",
    metricsLabel: "Métriques disponibles",
    requirementsLabel: "Prérequis opérationnels",
    limitationsLabel: "Limitations et notes",
    officialSourceLabel: "Source officielle vérifiée",
    evidenceLabel: "Niveau de preuve",
    verifiedDateLabel: "Date de vérification",
    subpathsLabel: "Sous-parcours distincts",
    guideLinkLabel: "Guide détaillé",
    resultsAnnounce: (count) => `${count} parcours de compatibilité affichés.`,
    noResultsTitle: "Aucun parcours trouvé pour les filtres sélectionnés",
    noResultsDesc:
      "Réinitialisez les filtres sur 'Tous' pour afficher le catalogue complet.",
    unverifiedBadge: "Parcours non répertorié dans cette première matrice",
    learnMore: "En savoir plus dans la documentation",
    colDeviceOs: "Appareil & OS",
    colStatus: "Statut",
    colEvidence: "Preuve & Direction",
    colRouteData: "Parcours & Données (A → B → C → D)",
    colOfficialSource: "Source officielle",
    subpathRequirements: "Prérequis",
    subpathMetrics: "Métriques",
    subpathFallback: "Secours",
    toggleDetailsOpen: "▲ Masquer le détail A-D",
    toggleDetailsClosed: "▼ Afficher le détail complet A-B-C-D",
    cardToggleOpen: "▲ Fermer la fiche détaillée",
    cardToggleClosed: "▼ Ouvrir la fiche complète (A-D, prérequis, limites)",
    resetFilters: "Réinitialiser les filtres",
  },
};

const FAMILY_OPTIONS: readonly { id: FamilyFilter; label: Record<SupportedMatrixLocale, string> }[] = [
  {
    id: "all",
    label: { it: "Tutte le marche", en: "All brands", de: "Alle Marken", fr: "Toutes les marques" },
  },
  {
    id: "garmin",
    label: { it: "Garmin", en: "Garmin", de: "Garmin", fr: "Garmin" },
  },
  {
    id: "fitbit",
    label: { it: "Fitbit", en: "Fitbit", de: "Fitbit", fr: "Fitbit" },
  },
  {
    id: "galaxy-watch",
    label: { it: "Galaxy Watch", en: "Galaxy Watch", de: "Galaxy Watch", fr: "Galaxy Watch" },
  },
  {
    id: "pixel-watch",
    label: { it: "Pixel Watch", en: "Pixel Watch", de: "Pixel Watch", fr: "Pixel Watch" },
  },
  {
    id: "oura-ring",
    label: { it: "Oura Ring", en: "Oura Ring", de: "Oura Ring", fr: "Bague Oura" },
  },
  {
    id: "colmi-ring",
    label: { it: "Colmi Ring", en: "Colmi Ring", de: "Colmi Ring", fr: "Bague Colmi" },
  },
];

const OS_OPTIONS: readonly { id: OsFilter; label: Record<SupportedMatrixLocale, string> }[] = [
  {
    id: "all",
    label: { it: "Tutti i telefoni", en: "All phones", de: "Alle Telefone", fr: "Tous les téléphones" },
  },
  {
    id: "android",
    label: { it: "Android", en: "Android", de: "Android", fr: "Android" },
  },
  {
    id: "ios",
    label: { it: "iPhone (iOS)", en: "iPhone (iOS)", de: "iPhone (iOS)", fr: "iPhone (iOS)" },
  },
];

export function CompatibilityMatrix({ locale }: CompatibilityMatrixProps) {
  const copy = UI_COPY[locale] || UI_COPY.en;
  const [selectedOs, setSelectedOs] = useState<OsFilter>("all");
  const [selectedFamily, setSelectedFamily] = useState<FamilyFilter>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredPaths = useMemo(() => {
    return COMPATIBILITY_PATHS.filter((path) => {
      const matchOs = selectedOs === "all" || path.phoneOs === selectedOs;
      const matchFamily = selectedFamily === "all" || path.deviceFamily === selectedFamily;
      return matchOs && matchFamily;
    });
  }, [selectedOs, selectedFamily]);

  // Check if current filter points to a known unverified combination
  const unverifiedInfo = useMemo(() => {
    if (selectedFamily !== "all" && selectedOs !== "all") {
      const key = `${selectedFamily}-${selectedOs}`;
      return UNVERIFIED_COMBINATIONS_MAP[key] || null;
    }
    return null;
  }, [selectedFamily, selectedOs]);

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-block text-[10px] uppercase tracking-[0.24em] font-semibold text-brand-green bg-brand-green/10 px-3 py-1 rounded-full border border-brand-green/20 mb-3">
          {copy.badge}
        </span>
        <h2
          id="matrix-heading"
          className="font-display text-3xl sm:text-4xl font-semibold tracking-tightest text-text-primary text-balance"
        >
          {copy.title}
        </h2>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          {copy.subtitle}
        </p>
      </div>

      {/* Interactive Progressive Enhancement Filters */}
      <div className="bg-surface/50 border border-border-subtle rounded-2xl p-4 sm:p-6 mb-8 space-y-4 shadow-sm">
        {/* Phone OS Filter */}
        <div role="group" aria-labelledby="filter-os-label" className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span id="filter-os-label" className="text-xs font-semibold uppercase tracking-wider text-text-muted shrink-0 sm:w-44">
            {copy.filterOsLabel}:
          </span>
          <div className="flex flex-wrap gap-2">
            {OS_OPTIONS.map((opt) => {
              const active = selectedOs === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedOs(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition min-h-[38px] flex items-center ${
                    active
                      ? "bg-brand-aqua text-bg-primary font-semibold shadow-sm"
                      : "bg-surface-elevated/70 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-border-subtle/60"
                  }`}
                >
                  {opt.label[locale] || opt.label.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Device Family Filter */}
        <div role="group" aria-labelledby="filter-family-label" className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-2 border-t border-border-subtle/50">
          <span id="filter-family-label" className="text-xs font-semibold uppercase tracking-wider text-text-muted shrink-0 sm:w-44">
            {copy.filterFamilyLabel}:
          </span>
          <div className="flex flex-wrap gap-2">
            {FAMILY_OPTIONS.map((opt) => {
              const active = selectedFamily === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedFamily(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition min-h-[38px] flex items-center ${
                    active
                      ? "bg-brand-green text-bg-primary font-semibold shadow-sm"
                      : "bg-surface-elevated/70 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-border-subtle/60"
                  }`}
                >
                  {opt.label[locale] || opt.label.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live status announcement */}
        <div className="sr-only" aria-live="polite">
          {copy.resultsAnnounce(filteredPaths.length)}
        </div>
      </div>

      {/* Unverified Combination Notice (when applicable) */}
      {unverifiedInfo && filteredPaths.length === 0 && (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 mb-8 max-w-2xl mx-auto text-center animate-fade-in">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-3">
            {copy.unverifiedBadge}
          </span>
          <h3 className="font-display text-lg font-semibold text-text-primary">
            {unverifiedInfo.title[locale] || unverifiedInfo.title.en}
          </h3>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-xl mx-auto">
            {unverifiedInfo.description[locale] || unverifiedInfo.description.en}
          </p>
          {(() => {
            const unverifiedLink = resolveUnverifiedLink(unverifiedInfo.providerSlug, locale);
            if (!unverifiedLink) return null;
            return (
              <div className="mt-4 flex justify-center">
                <Link
                  href={unverifiedLink.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-aqua hover:underline"
                >
                  {copy.learnMore}
                  {unverifiedLink.isFallbackEn && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-surface border border-border-subtle rounded text-text-muted font-normal">
                      (EN)
                    </span>
                  )}
                  {" "}→
                </Link>
              </div>
            );
          })()}
        </div>
      )}

      {/* Empty result if neither mapped nor in unverified map */}
      {!unverifiedInfo && filteredPaths.length === 0 && (
        <div className="p-8 rounded-2xl border border-border-subtle bg-surface/40 text-center max-w-lg mx-auto mb-8">
          <h3 className="font-display text-base font-semibold text-text-primary">
            {copy.noResultsTitle}
          </h3>
          <p className="mt-2 text-xs text-text-secondary">
            {copy.noResultsDesc}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedOs("all");
              setSelectedFamily("all");
            }}
            className="mt-4 px-4 py-2 rounded-pill bg-surface-elevated text-xs font-semibold text-text-primary hover:bg-surface-elevated/80 border border-border-subtle transition"
          >
            {copy.resetFilters}
          </button>
        </div>
      )}

      {/* Desktop & Tablet Table View (Progressively Enhanced HTML Table) */}
      <div className="hidden lg:block overflow-hidden rounded-2xl border border-border-subtle bg-surface/40 shadow-sm">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              {copy.title}
            </caption>
            <thead>
              <tr className="bg-surface-elevated/80 border-b border-border-subtle text-text-muted uppercase tracking-wider text-[11px]">
                <th scope="col" className="p-4 font-semibold w-52">{copy.colDeviceOs}</th>
                <th scope="col" className="p-4 font-semibold w-32">{copy.colStatus}</th>
                <th scope="col" className="p-4 font-semibold w-56">{copy.colEvidence}</th>
                <th scope="col" className="p-4 font-semibold">{copy.colRouteData}</th>
                <th scope="col" className="p-4 font-semibold w-40">{copy.colOfficialSource}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {filteredPaths.map((p) => {
                const isExpanded = expandedRow === p.id;
                const guideLink = resolveGuideLink(p, locale);
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-elevated/40 transition-colors group"
                  >
                    <td className="p-4 align-top">
                      <div className="font-display font-semibold text-text-primary text-sm">
                        {p.deviceFamilyLabel[locale] || p.deviceFamilyLabel.en}
                      </div>
                      <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-mono text-text-secondary bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle/50">
                        {p.phoneOsLabel[locale] || p.phoneOsLabel.en}
                      </div>
                      {guideLink && (
                        <div className="mt-2">
                          <Link
                            href={guideLink.href}
                            className="text-[11px] text-brand-aqua hover:underline inline-flex items-center gap-1"
                          >
                            {copy.guideLinkLabel}
                            {guideLink.isFallbackEn && (
                              <span className="text-[9px] px-1 py-0.2 bg-surface border border-border-subtle rounded text-text-muted">
                                (EN)
                              </span>
                            )}
                            {" "}→
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          p.status === "supported"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : p.status === "conditional"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {p.statusLabel[locale] || p.statusLabel.en}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-text-primary font-medium">
                        {p.evidence.label[locale] || p.evidence.label.en}
                      </div>
                      <div className="mt-1 text-[11px] text-text-muted">
                        {p.directionLabel[locale] || p.directionLabel.en}
                      </div>
                    </td>
                    <td className="p-4 align-top space-y-2">
                      <div className="text-text-primary font-medium leading-relaxed">
                        <strong className="text-text-muted font-normal block text-[10px] uppercase tracking-wider">{copy.metricsLabel}:</strong>
                        {p.metricsSummary[locale] || p.metricsSummary.en}
                      </div>

                      {/* Samsung Subpaths Distinction */}
                      {p.subpaths && p.subpaths.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-surface-elevated/80 border border-brand-green/20 space-y-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-green">
                            {copy.subpathsLabel}:
                          </div>
                          {p.subpaths.map((sub) => (
                            <div key={sub.id} className="text-[11px] space-y-1 pt-1.5 first:pt-0 border-t first:border-t-0 border-border-subtle/50">
                              <div className="font-semibold text-text-primary">{sub.title[locale] || sub.title.en}</div>
                              <div className="text-text-secondary font-mono text-[10px]">{sub.route[locale] || sub.route.en}</div>
                              <div className="text-text-secondary"><span className="text-text-muted">{copy.subpathRequirements}:</span> {sub.requirements[locale] || sub.requirements.en}</div>
                              <div className="text-text-secondary"><span className="text-text-muted">{copy.subpathMetrics}:</span> {sub.metricsRead[locale] || sub.metricsRead.en}</div>
                              <div className="text-text-secondary"><span className="text-text-muted">{copy.subpathFallback}:</span> {sub.fallback[locale] || sub.fallback.en}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Detailed Steps Preview / Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleRow(p.id)}
                        className="text-[11px] font-medium text-brand-aqua hover:underline inline-flex items-center gap-1 mt-1"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? copy.toggleDetailsOpen : copy.toggleDetailsClosed}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-xl bg-surface-elevated/60 border border-border-subtle space-y-2 text-[11px] leading-relaxed">
                          <div>
                            <span className="font-semibold text-text-primary">{copy.stepALabel}:</span>{" "}
                            <span className="text-text-secondary">{p.steps.stepA[locale] || p.steps.stepA.en}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary">{copy.stepBLabel}:</span>{" "}
                            <span className="text-text-secondary">{p.steps.stepB[locale] || p.steps.stepB.en}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary">{copy.stepCLabel}:</span>{" "}
                            <span className="text-text-secondary">{p.steps.stepC[locale] || p.steps.stepC.en}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary">{copy.stepDLabel}:</span>{" "}
                            <span className="text-text-secondary">{p.steps.stepD[locale] || p.steps.stepD.en}</span>
                          </div>
                          <div className="pt-2 border-t border-border-subtle/50 text-[10px] text-text-muted">
                            <div><strong className="text-text-secondary">{copy.requirementsLabel}:</strong> {p.requirements[locale] || p.requirements.en}</div>
                            <div className="mt-1"><strong className="text-text-secondary">{copy.limitationsLabel}:</strong> {p.limitations[locale] || p.limitations.en}</div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top text-[11px]">
                      <a
                        href={p.officialSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-aqua hover:underline block leading-snug"
                      >
                        {p.officialSource.title[locale] || p.officialSource.title.en} ↗
                      </a>
                      <div className="text-[10px] text-text-muted mt-1">
                        {copy.verifiedDateLabel}: {p.officialSource.verifiedDate}
                      </div>
                      <div className="mt-1.5 text-[10px] text-text-secondary leading-snug italic">
                        &quot;{p.officialSource.supportedClaim[locale] || p.officialSource.supportedClaim.en}&quot;
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Small Screen Card View */}
      <div className="lg:hidden space-y-4">
        {filteredPaths.map((p) => {
          const isExpanded = expandedRow === p.id;
          const guideLink = resolveGuideLink(p, locale);
          return (
            <article
              key={p.id}
              className="p-5 rounded-2xl bg-surface/60 border border-border-subtle space-y-3.5 shadow-sm"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary">
                    {p.deviceFamilyLabel[locale] || p.deviceFamilyLabel.en}
                  </h3>
                  <span className="inline-block mt-1 font-mono text-[11px] text-text-secondary bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle/60">
                    {p.phoneOsLabel[locale] || p.phoneOsLabel.en}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${
                    p.status === "supported"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : p.status === "conditional"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}
                >
                  {p.statusLabel[locale] || p.statusLabel.en}
                </span>
              </div>

              {/* Evidence Level & Direction */}
              <div className="p-3 rounded-xl bg-surface-elevated/60 border border-border-subtle/60 text-xs space-y-1">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-aqua shrink-0" aria-hidden="true" />
                  {p.evidence.label[locale] || p.evidence.label.en}
                </div>
                <div className="text-[11px] text-text-muted">
                  {p.directionLabel[locale] || p.directionLabel.en}
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
                  {copy.metricsLabel}:
                </span>
                <p className="text-text-primary font-medium leading-relaxed">
                  {p.metricsSummary[locale] || p.metricsSummary.en}
                </p>
              </div>

              {/* Samsung Subpaths Distinction */}
              {p.subpaths && p.subpaths.length > 0 && (
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-brand-green/30 space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-green">
                    {copy.subpathsLabel}:
                  </div>
                  {p.subpaths.map((sub) => (
                    <div key={sub.id} className="text-xs space-y-1 pt-2 first:pt-0 border-t first:border-t-0 border-border-subtle/60">
                      <div className="font-semibold text-text-primary">{sub.title[locale] || sub.title.en}</div>
                      <div className="text-text-secondary font-mono text-[10px]">{sub.route[locale] || sub.route.en}</div>
                      <div className="text-[11px] text-text-secondary"><strong className="text-text-muted">{copy.subpathRequirements}:</strong> {sub.requirements[locale] || sub.requirements.en}</div>
                      <div className="text-[11px] text-text-secondary"><strong className="text-text-muted">{copy.subpathMetrics}:</strong> {sub.metricsRead[locale] || sub.metricsRead.en}</div>
                      <div className="text-[11px] text-text-secondary"><strong className="text-text-muted">{copy.subpathFallback}:</strong> {sub.fallback[locale] || sub.fallback.en}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle Detail Button */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleRow(p.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-semibold text-brand-aqua text-center transition"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? copy.cardToggleOpen : copy.cardToggleClosed}
                </button>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="p-4 rounded-xl bg-surface-elevated/80 border border-border-subtle space-y-3 text-xs leading-relaxed animate-fade-in">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">{copy.stepALabel}</h4>
                    <p className="text-text-secondary text-[11px]">{p.steps.stepA[locale] || p.steps.stepA.en}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">{copy.stepBLabel}</h4>
                    <p className="text-text-secondary text-[11px]">{p.steps.stepB[locale] || p.steps.stepB.en}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">{copy.stepCLabel}</h4>
                    <p className="text-text-secondary text-[11px]">{p.steps.stepC[locale] || p.steps.stepC.en}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-1">{copy.stepDLabel}</h4>
                    <p className="text-text-secondary text-[11px]">{p.steps.stepD[locale] || p.steps.stepD.en}</p>
                  </div>
                  <div className="pt-3 border-t border-border-subtle/60 text-[11px] space-y-2">
                    <div>
                      <strong className="text-text-primary">{copy.requirementsLabel}:</strong>
                      <p className="text-text-secondary mt-0.5">{p.requirements[locale] || p.requirements.en}</p>
                    </div>
                    <div>
                      <strong className="text-text-primary">{copy.limitationsLabel}:</strong>
                      <p className="text-text-secondary mt-0.5">{p.limitations[locale] || p.limitations.en}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Official Source & Verification Footer */}
              <div className="pt-2 border-t border-border-subtle/50 flex flex-col gap-1.5 text-xs">
                <a
                  href={p.officialSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-aqua hover:underline inline-flex items-center gap-1"
                >
                  {p.officialSource.title[locale] || p.officialSource.title.en} ↗
                </a>
                <div className="text-[10px] text-text-muted">
                  {copy.verifiedDateLabel}: {p.officialSource.verifiedDate}
                </div>
                <p className="text-[10px] text-text-secondary italic">
                  &quot;{p.officialSource.supportedClaim[locale] || p.officialSource.supportedClaim.en}&quot;
                </p>
                {guideLink && (
                  <div className="mt-1 pt-1 border-t border-border-subtle/40">
                    <Link
                      href={guideLink.href}
                      className="text-xs font-semibold text-brand-green hover:underline inline-flex items-center gap-1"
                    >
                      {copy.guideLinkLabel}
                      {guideLink.isFallbackEn && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-surface border border-border-subtle rounded text-text-muted font-normal">
                          (EN)
                        </span>
                      )}
                      {" "}→
                    </Link>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
