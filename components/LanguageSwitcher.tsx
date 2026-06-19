"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n";

/**
 * Selettore lingua a tendina (tutte le lingue in `locales`). Mostra la lingua corrente; al click
 * apre il menu con le altre. Chiude su click-fuori e su Esc.
 */
export default function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || `/${current}`;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Sostituisce il segmento lingua iniziale (qualsiasi locale supportato) con
  // la lingua target; se manca, lo inserisce. Usa l'elenco centrale `locales`
  // così resta valido aggiungendo nuove lingue (de/pt/fr/...).
  const pathFor = (target: Locale) => {
    const parts = pathname.split("/");
    if (locales.includes(parts[1] as Locale)) {
      parts[1] = target;
    } else {
      parts.splice(1, 0, target);
    }
    return parts.join("/") || `/${target}`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Lingua"
        className="inline-flex items-center gap-2 rounded-pill border border-divider bg-bg-card/70 px-3 py-2 text-[12px] font-semibold text-text-secondary transition hover:text-text-primary min-h-[36px]"
      >
        <span aria-hidden className="text-[14px] leading-none">{localeFlags[current]}</span>
        <span className="uppercase tracking-wider">{current}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[160px] max-h-[360px] overflow-y-auto overflow-x-hidden rounded-2xl border border-divider bg-bg-elevated shadow-lg"
        >
          {locales.map((l) => {
            const active = l === current;
            return (
              <li key={l} role="option" aria-selected={active}>
                <Link
                  href={pathFor(l)}
                  hrefLang={l}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition ${
                    active
                      ? "bg-bg-card text-text-primary font-semibold"
                      : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                  }`}
                >
                  <span aria-hidden className="text-[15px] leading-none">{localeFlags[l]}</span>
                  <span>{localeNames[l]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
