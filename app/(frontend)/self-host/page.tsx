import { SelfHostStatusView } from "@/components/SelfHostStatusView";
import { getDictionary } from "@/lib/i18n";

/**
 * Vedi layout.tsx per il razionale completo. Questa route esiste SOLO
 * perché la stringa letterale `https://www.fitmesh.fit/self-host` è già
 * compilata nelle app pubblicate: deve rispondere 200 sempre, senza
 * redirect, indipendentemente da Accept-Language/cookie.
 */
export default async function SelfHostBarePage() {
  const [en, it] = await Promise.all([getDictionary("en"), getDictionary("it")]);
  return <SelfHostStatusView consentLabels={{ en: en.cookie_banner.preferences, it: it.cookie_banner.preferences }} />;
}
