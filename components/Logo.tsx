/**
 * FitMesh Sync — Logo component.
 *
 * Variants:
 *   - "mark"        : FM monogram square (PNG from /public/icon-square.png)
 *   - "horizontal"  : monogramma + divider + wordmark — composto al runtime
 *                     per evitare deformazioni di un asset SVG/WebP statico
 *   - "wordmark"    : text-only "FitMesh Sync"
 *
 * La variante "horizontal" v2 (post-2026-05-16) NON usa più
 * `/logo-horizontal.webp` perché il file SVG sorgente aveva una "M"
 * deformata + spaziature errate. Ora compose: <img mark> + line divider +
 * text wordmark, garantendo coerenza visiva con l'app icon e responsive
 * scaling preciso a qualsiasi size.
 */

type Variant = "mark" | "horizontal" | "wordmark";

type Props = {
  variant?: Variant;
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function Logo({
  variant = "mark",
  size = 32,
  className = "",
  priority = false,
}: Props) {
  if (variant === "horizontal") {
    // Composite: monogramma (1:1) + divider verticale + wordmark a 2 righe.
    // Tutti i sizing sono in funzione di `size` per scalabilità precisa.
    return (
      <span
        className={`inline-flex items-center ${className}`}
        style={{ gap: `${size * 0.35}px`, height: `${size}px` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-square-128.png"
          alt="FitMesh Sync"
          width={size}
          height={size}
          style={{
            display: "block",
            width: `${size}px`,
            height: `${size}px`,
            flexShrink: 0,
          }}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: "1px",
            height: `${size * 0.7}px`,
            background: "rgba(183, 194, 216, 0.4)",
            flexShrink: 0,
          }}
        />
        <span
          className="inline-flex flex-col leading-none"
          style={{ flexShrink: 0 }}
        >
          <span
            className="font-display font-semibold tracking-tight text-text-primary"
            style={{ fontSize: `${size * 0.6}px`, lineHeight: 1 }}
          >
            FitMesh
          </span>
          <span
            className="font-display uppercase text-brand-aqua"
            style={{
              fontSize: `${size * 0.24}px`,
              letterSpacing: "0.32em",
              marginTop: `${size * 0.12}px`,
              fontWeight: 500,
            }}
          >
            Sync
          </span>
        </span>
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={`inline-flex flex-col leading-none ${className}`}
        style={{ fontSize: size * 0.6 }}
      >
        <span className="font-display font-semibold tracking-tight text-text-primary">
          FitMesh
        </span>
        <span
          className="text-text-muted uppercase mt-0.5"
          style={{
            fontSize: size * 0.22,
            letterSpacing: "0.3em",
          }}
        >
          Sync
        </span>
      </span>
    );
  }

  // ── "mark" variant: official square app icon (PNG asset) ──
  // Usa /public/icon-square.png (1254x1254 source). Coerente con app/icon.png
  // che Next.js usa per la favicon auto-generata.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon-square-128.png"
      alt="FitMesh Sync"
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        width: `${size}px`,
        height: `${size}px`,
      }}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
