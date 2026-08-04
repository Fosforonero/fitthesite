import { SelfHostStatusView } from "@/components/SelfHostStatusView";

/**
 * Vedi layout.tsx per il razionale completo. Questa route esiste SOLO
 * perché la stringa letterale `https://www.fitmesh.fit/self-host` è già
 * compilata nelle app pubblicate: deve rispondere 200 sempre, senza
 * redirect, indipendentemente da Accept-Language/cookie.
 */
export default function SelfHostBarePage() {
  return <SelfHostStatusView />;
}
