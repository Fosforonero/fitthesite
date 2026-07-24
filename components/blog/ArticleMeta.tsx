"use client";

import { useState } from "react";

/**
 * Barra metadati orizzontale dell'articolo (categoria · data · tempo di
 * lettura · condividi), ispirata al layout del blog Claude ma adattata al
 * nostro design system scuro.
 *
 * Client component: gestisce solo la condivisione (link unico = URL del
 * post, via share nativo o copia negli appunti). Nessuna chiamata di rete
 * automatica all'apertura della pagina.
 *
 * P0.9: rimossi i contatori pubblici di visualizzazioni/condivisioni (e la
 * relativa chiamata automatica a `/api/v1/posts/stats` a ogni apertura
 * articolo) — aggiungevano almeno una Function invocation per sessione
 * articolo e importavano l'intero dataset blog (`BLOG_SLUGS`, tutti i post)
 * nel bundle di quella singola API route, per un contatore che non è mai
 * stato mostrato in modo affidabile (rete assente = contatori nascosti).
 * `/api/v1/posts/stats` resta come tombstone deterministico (410), vedi
 * app/api/v1/posts/stats/route.ts — dati Supabase non cancellati in questo
 * sprint.
 */

type MetaItem = {
  icon: "category" | "date" | "clock";
  label: string;
  value: string;
};

function Icon({
  kind,
}: {
  kind: MetaItem["icon"] | "share" | "check";
}) {
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
  copyLabel,
}: {
  items: MetaItem[];
  shareLabel: string;
  copiedLabel: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    // Share nativo su mobile (stesso URL per tutti); fallback: copia link.
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; url?: string }) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: document.title, url });
        return;
      } catch {
        // L'utente ha annullato lo sheet nativo: no-op.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard non disponibile: no-op silenzioso */
    }
  }

  return (
    <div className="mt-6 flex items-center gap-x-5 sm:gap-x-6 border-y border-divider py-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((it, i) => (
        <div key={i} className="flex-none flex items-center gap-2 whitespace-nowrap">
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
        onClick={share}
        className="ml-auto flex-none flex items-center gap-2 whitespace-nowrap pl-2 text-text-muted hover:text-brand-aqua transition"
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
            {copied ? copiedLabel : copyLabel}
          </span>
        </div>
      </button>
    </div>
  );
}
