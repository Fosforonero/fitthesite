/**
 * Google Play "Get it on" badge.
 * Vector replica of the official badge — black surface, 4-color play icon.
 * Supports a `disabled` / "Coming Soon" state for pre-launch landings.
 */

type Props = {
  href?: string;
  disabled?: boolean;
  comingSoonLabel?: string;
  smallLabel?: string;
  storeLabel?: string;
  className?: string;
};

export default function PlayStoreButton({
  href = "https://play.google.com/store/apps/details?id=com.fitmeshsync.app",
  disabled = false,
  comingSoonLabel = "Coming Soon",
  smallLabel = "GET IT ON",
  storeLabel = "Google Play",
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
      {/* 4-color play triangle */}
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 shrink-0"
        aria-hidden="true"
      >
        {/* Triangle composed by 4 overlapping shapes to fake the 4-color split. */}
        <defs>
          <linearGradient id="pl-r" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EA4335" />
            <stop offset="100%" stopColor="#C5221F" />
          </linearGradient>
          <linearGradient id="pl-y" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#FBBC05" />
            <stop offset="100%" stopColor="#F9AB00" />
          </linearGradient>
          <linearGradient id="pl-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34A853" />
            <stop offset="100%" stopColor="#1E8E3E" />
          </linearGradient>
          <linearGradient id="pl-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="100%" stopColor="#1A73E8" />
          </linearGradient>
        </defs>
        {/* Bottom-left quadrant — blue */}
        <path d="M5.5 4.5 16 16 5.5 27.5z" fill="url(#pl-b)" />
        {/* Top-left curve — green */}
        <path d="M5.5 4.5 22.5 14.2 16 16z" fill="url(#pl-g)" />
        {/* Right top — red */}
        <path d="M22.5 14.2 27.5 16.9 16 16z" fill="url(#pl-r)" />
        {/* Right bottom — yellow */}
        <path d="M27.5 16.9 22.5 17.8 16 16z" fill="url(#pl-y)" />
        {/* Tail re-using shapes for triangle effect */}
        <path d="M16 16 22.5 17.8 5.5 27.5z" fill="url(#pl-y)" opacity=".95" />
        <path d="M16 16 27.5 16.9 22.5 17.8z" fill="url(#pl-r)" />
      </svg>

      <div className="flex flex-col items-start leading-tight">
        <span className="text-[9px] uppercase tracking-[0.18em] text-white/80">
          {smallLabel}
        </span>
        <span className="text-base font-medium text-white">{storeLabel}</span>
      </div>

      {disabled && (
        <span
          className="absolute -top-2 right-0 px-2 py-0.5 rounded-pill
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
