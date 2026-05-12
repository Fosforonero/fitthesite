"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || `/${current}`;

  // Replace the leading /it or /en segment with the target locale
  const pathFor = (target: Locale) => {
    const parts = pathname.split("/");
    if (parts[1] === "it" || parts[1] === "en") {
      parts[1] = target;
    } else {
      parts.splice(1, 0, target);
    }
    return parts.join("/") || `/${target}`;
  };

  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-pill border border-divider bg-bg-card/70"
      role="group"
      aria-label="Language switcher"
    >
      {locales.map((l) => {
        const active = l === current;
        return (
          <Link
            key={l}
            href={pathFor(l)}
            hrefLang={l}
            aria-current={active ? "true" : undefined}
            className={`
              px-2.5 py-1 rounded-pill text-[11px] font-semibold uppercase tracking-wider transition
              ${active
                ? "bg-bg-elevated text-text-primary"
                : "text-text-muted hover:text-text-secondary"
              }
            `}
            title={localeNames[l]}
          >
            {l}
          </Link>
        );
      })}
    </div>
  );
}
