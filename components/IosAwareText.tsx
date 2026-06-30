"use client";

/**
 * Mostra `live` (iOS disponibile) o `coming` (iOS in arrivo) in base alla geo
 * del visitatore. Default SSR = `coming` (caso sicuro, coerente con i 27 UE e
 * con i crawler); dopo il mount, se il paese è fuori UE, passa a `live`.
 * Così le pagine restano statiche e non c'è hydration mismatch.
 */
import { useState, useEffect } from "react";
import { IOS_ENABLED, EU27, countryFromCookie } from "@/lib/flags";

export function IosAwareText({ coming, live }: { coming: string; live: string }) {
  const [available, setAvailable] = useState(IOS_ENABLED);
  useEffect(() => {
    if (IOS_ENABLED) return;
    const c = countryFromCookie();
    if (c && !EU27.has(c)) setAvailable(true);
  }, []);
  return <>{available ? live : coming}</>;
}
