"use client";

import { requestConsentReopen } from "@/lib/analytics/consent";

/** Riapre il banner dei cookie per cambiare o revocare la scelta. */
export default function ConsentPreferencesButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button type="button" data-consent-revoke onClick={requestConsentReopen} className={className}>
      {label}
    </button>
  );
}
