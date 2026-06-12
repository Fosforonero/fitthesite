"use client";

import { useState } from "react";

/**
 * Barra metadati orizzontale dell'articolo (categoria · data · tempo di
 * lettura · condividi), ispirata al layout del blog Claude ma adattata al
 * nostro design system scuro e disposta in orizzontale.
 *
 * Client component perché "Copia link" usa navigator.clipboard. Il resto è
 * statico ma vive qui per tenere un solo blocco coeso.
 */

type MetaItem = {
  icon: "category" | "date" | "clock";
  label: string;
  value: string;
};

function Icon({ kind }: { kind: MetaItem["icon"] | "share" | "check" }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "category":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3z" />
        </svg>
      );
    case "date":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2M9 2h6" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M16 6l-4-4-4 4M12 2v14" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
  }
}

export function ArticleMeta({
  items,
  shareLabel,
  copiedLabel,
}: {
  items: MetaItem[];
  shareLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard non disponibile: no-op silenzioso */
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-divider py-4">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-text-muted">
            <Icon kind={it.icon} />
          </span>
          <div className="leading-tight">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-text-muted">
              {it.label}
            </span>
            <span className="block text-sm font-medium text-text-primary">
              {it.value}
            </span>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="ml-auto flex items-center gap-2 text-text-muted hover:text-brand-aqua transition"
      >
        <span className={copied ? "text-brand-green" : ""}>
          <Icon kind={copied ? "check" : "share"} />
        </span>
        <div className="leading-tight text-left">
          <span className="block text-[10px] uppercase tracking-[0.16em]">
            {shareLabel}
          </span>
          <span
            className={`block text-sm font-medium underline-offset-2 ${
              copied ? "text-brand-green" : "text-text-primary"
            }`}
          >
            {copied ? copiedLabel : "Copia link"}
          </span>
        </div>
      </button>
    </div>
  );
}
