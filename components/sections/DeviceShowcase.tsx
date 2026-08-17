import type { ReactNode } from "react";
import Parallax from "@/components/motion/Parallax";

/**
 * Wrapper "premium" per i mockup device (telefoni): glow brand morbido dietro
 * + parallax misurato allo scroll. Valorizza gli SCREENSHOT REALI senza
 * sostituirli (vincolo BRAND.md). Riusabile su hero, showcase, provider page.
 *
 * Server component: compone Parallax (client island) + un layer glow statico.
 */
export default function DeviceShowcase({
  children,
  glow = "brand",
  parallax = 28,
  className,
}: {
  children: ReactNode;
  /** Colore del glow di profondità (token bg-glow-*) o false per nessuno. */
  glow?: "brand" | "soft" | "green" | false;
  /** Spostamento parallax in px, o false per statico. */
  parallax?: number | false;
  className?: string;
}) {
  const glowClass =
    glow === "brand"
      ? "bg-glow-brand"
      : glow === "soft"
        ? "bg-glow-soft"
        : glow === "green"
          ? "bg-glow-green"
          : "";

  const device =
    parallax === false ? (
      <>{children}</>
    ) : (
      <Parallax distance={parallax}>{children}</Parallax>
    );

  return (
    <div className={`relative ${className ?? ""}`}>
      {glow !== false && (
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-8 -z-10 ${glowClass} blur-2xl opacity-70`}
        />
      )}
      {device}
    </div>
  );
}
