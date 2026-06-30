"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Barra metadati orizzontale dell'articolo (categoria · data · tempo di
 * lettura · visualizzazioni · condivisioni · condividi), ispirata al layout
 * del blog Claude ma adattata al nostro design system scuro.
 *
 * Client component: gestisce la condivisione (link unico = URL del post, via
 * share nativo o copia negli appunti) e i contatori pubblici di
 * visualizzazioni/condivisioni letti da `/api/v1/posts/stats`. Nessun dato
 * personale: la view si conta una volta per browser ogni 24h (flag locale),
 * la condivisione una volta per apertura di pagina.
 */

type MetaItem = {
  icon: "category" | "date" | "clock";
  label: string;
  value: string;
};

function Icon({
  kind,
}: {
  kind: MetaItem["icon"] | "share" | "check" | "views" | "shares";
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
    case "views":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "shares":
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
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

/** Compatta i conteggi grandi (1.2K) mantenendo i piccoli per intero. */
function fmtCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}K`;
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: "views" | "shares";
  label: string;
  value: number;
}) {
  return (
    <div
      className="flex-none flex items-center gap-1.5"
      title={label}
      aria-label={`${label}: ${value}`}
    >
      <span className="text-text-muted">
        <Icon kind={icon} />
      </span>
      <span className="text-sm font-medium text-text-primary tabular-nums">
        {fmtCount(value)}
      </span>
    </div>
  );
}

export function ArticleMeta({
  items,
  shareLabel,
  copiedLabel,
  copyLabel,
  slug,
  viewsLabel,
  sharesLabel,
}: {
  items: MetaItem[];
  shareLabel: string;
  copiedLabel: string;
  copyLabel: string;
  slug: string;
  viewsLabel: string;
  sharesLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const [shares, setShares] = useState<number | null>(null);
  const sharedThisView = useRef(false);

  // Al mount: conta una visualizzazione (max 1 per browser ogni 24h) e carica
  // i contatori correnti. In caso di rete assente i contatori restano nascosti.
  useEffect(() => {
    let alive = true;
    const key = `fm_pv_${slug}`;
    const now = Date.now();
    let last = 0;
    try {
      last = Number(localStorage.getItem(key) ?? "0");
    } catch {
      /* storage non disponibile: tratta come prima visita */
    }
    const isNewView = now - last > 24 * 60 * 60 * 1000;

    async function run() {
      try {
        if (isNewView) {
          try {
            localStorage.setItem(key, String(now));
          } catch {
            /* ignore */
          }
          const r = await fetch("/api/v1/posts/stats", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ slug, kind: "view" }),
          });
          if (r.ok) {
            const d = (await r.json()) as { views: number; shares: number };
            if (alive) {
              setViews(d.views);
              setShares(d.shares);
            }
            return;
          }
        }
        const r = await fetch(
          `/api/v1/posts/stats?slug=${encodeURIComponent(slug)}`,
        );
        if (r.ok) {
          const d = (await r.json()) as { views: number; shares: number };
          if (alive) {
            setViews(d.views);
            setShares(d.shares);
          }
        }
      } catch {
        /* rete assente: lascia i contatori nascosti */
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [slug]);

  function countShare() {
    if (sharedThisView.current) return;
    sharedThisView.current = true;
    setShares((s) => (s == null ? s : s + 1)); // ottimistico
    fetch("/api/v1/posts/stats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, kind: "share" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setShares((d as { shares: number }).shares);
      })
      .catch(() => {
        /* ignore */
      });
  }

  async function share() {
    const url = window.location.href;
    // Share nativo su mobile (stesso URL per tutti); fallback: copia link.
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; url?: string }) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: document.title, url });
        countShare();
        return;
      } catch {
        // L'utente ha annullato lo sheet nativo: non contare, non copiare.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      countShare();
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
      {views !== null && (
        <StatChip icon="views" label={viewsLabel} value={views} />
      )}
      {shares !== null && (
        <StatChip icon="shares" label={sharesLabel} value={shares} />
      )}
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
