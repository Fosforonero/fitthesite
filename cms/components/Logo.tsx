/**
 * Logo admin Payload (login + header) — monogramma FM + wordmark "FitMesh Sync".
 * Sostituisce il logo Payload di default.
 */
export const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/icon-square-128.png"
      alt="FitMesh Sync"
      width={48}
      height={48}
      style={{ borderRadius: 11, display: 'block' }}
    />
    <span
      style={{
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}
    >
      FitMesh Sync
    </span>
  </div>
);

export default Logo;
