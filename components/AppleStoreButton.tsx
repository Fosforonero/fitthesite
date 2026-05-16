/**
 * Apple App Store "Download on the" badge.
 * Replica vectorial del badge ufficiale, in stile Coming Soon disabled.
 *
 * Versione disabled-only (per ora): iOS arriverà in v38, da Q4 2026.
 * Mantiene la stessa shape del PlayStoreButton per allinearsi visivamente.
 */

type Props = {
  href?: string;
  disabled?: boolean;
  comingSoonLabel?: string;
  smallLabel?: string;
  storeLabel?: string;
  className?: string;
};

export default function AppleStoreButton({
  href = "https://apps.apple.com/app/fitmesh-sync/id000000000",
  disabled = true, // Default: Apple Store ancora non disponibile
  comingSoonLabel = "Coming Soon",
  smallLabel = "Download on the",
  storeLabel = "App Store",
  className = "",
}: Props) {
  const sharedClass = `
    relative inline-flex items-center gap-3 px-5 py-3
    rounded-[12px] bg-black border border-white/15
    shadow-card
    ${disabled
      ? "opacity-55 grayscale-[0.4] cursor-not-allowed select-none"
      : "hover:bg-[#101010] hover:border-white/25 transition"
    }
    ${className}
  `;

  const inner = (
    <>
      {/* Apple logo glyph (Apple Inc. logomark). */}
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7 shrink-0 fill-white"
        aria-hidden="true"
      >
        <path d="M17.05 12.04c-.03-3.04 2.49-4.5 2.6-4.57-1.42-2.07-3.62-2.36-4.4-2.39-1.86-.19-3.65 1.1-4.6 1.1-.97 0-2.42-1.08-3.99-1.05-2.05.03-3.95 1.19-5 3.03-2.15 3.72-.55 9.2 1.52 12.21 1.04 1.47 2.26 3.12 3.84 3.06 1.55-.06 2.13-.99 4-.99 1.86 0 2.39.99 4.02.96 1.66-.03 2.71-1.49 3.72-2.97 1.18-1.7 1.66-3.35 1.69-3.43-.04-.02-3.24-1.24-3.27-4.96zM14.05 3.43C14.91 2.42 15.49 1 15.33-.4c-1.2.05-2.66.8-3.55 1.81-.8.9-1.5 2.34-1.31 3.71 1.34.1 2.71-.68 3.58-1.69z" />
      </svg>

      <div className="flex flex-col items-start leading-tight">
        <span className="text-[9px] uppercase tracking-[0.18em] text-white/80">
          {smallLabel}
        </span>
        <span className="text-base font-medium text-white">{storeLabel}</span>
      </div>

      {disabled && (
        <span
          className="absolute -top-2 -right-2 px-2 py-0.5 rounded-pill
                     bg-brand-aqua text-[10px] font-semibold uppercase tracking-wider
                     text-[#03121f] shadow-card"
        >
          {comingSoonLabel}
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={`${storeLabel} — ${comingSoonLabel}`}
        className={sharedClass}
      >
        {inner}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={sharedClass}
      aria-label={`${smallLabel} ${storeLabel}`}
    >
      {inner}
    </a>
  );
}
