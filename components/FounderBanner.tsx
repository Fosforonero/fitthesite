/**
 * FounderBanner — fascia sotto l'hero con counter live dei posti founder
 * rimasti, cliccabile per portare alla pagina /[locale]/beta.
 *
 * Programma founder (dal lancio pubblico Android): i primi 1000 account
 * ricevono 1 anno di Pro gratis, auto-grantato alla registrazione dal
 * trigger Supabase `on_profile_created_founder`.
 *
 * Server Component: conta i grant `note='founder-launch'` via service role
 * (nessuna RPC anon esposta). Se la fetch fallisce, fallback statico.
 */
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const TOTAL_SPOTS = 1000;
// Live fresh ad ogni request: il counter deve muoversi appena qualcuno
// si registra. Costo trascurabile (1 count su tabella piccola).
export const revalidate = 0;

async function fetchSlotsTaken(): Promise<number | null> {
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("note", "founder-launch");
    if (error || typeof count !== "number") return null;
    return count;
  } catch {
    return null;
  }
}

export default async function FounderBanner({ locale }: { locale: string }) {
  const taken = (await fetchSlotsTaken()) ?? 0;
  const remaining = Math.max(0, TOTAL_SPOTS - taken);
  const full = remaining === 0;

  // Copy adattiva: se pieno, il programma founder è chiuso.
  const headline = full
    ? locale === "it"
      ? "Founder al completo — scarica l'app su Play Store"
      : "Founder program full — get the app on Play Store"
    : locale === "it"
      ? `Restano ${remaining} dei ${TOTAL_SPOTS} posti founder · 1 anno di Pro gratis`
      : `${remaining} of ${TOTAL_SPOTS} founder seats left · 1 year of Pro free`;

  const cta = locale === "it" ? "Diventa founder" : "Become a founder";

  return (
    <Link
      href={`/${locale}/beta`}
      className="group block border-y border-brand-aqua/30 bg-gradient-to-r from-brand-green/20 via-brand-aqua/30 to-brand-green/20 hover:via-brand-aqua/40 transition-colors shadow-[0_0_40px_-12px_rgba(33,230,193,0.35)]"
      aria-label={headline}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-center gap-3 text-sm sm:text-base">
        <span className="relative flex w-2.5 h-2.5 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${full ? "bg-text-muted" : "bg-brand-green animate-ping"}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${full ? "bg-text-muted" : "bg-brand-green"}`}
          />
        </span>
        <span className="text-text-primary font-medium">
          <span className="font-mono text-brand-aqua font-bold text-base sm:text-lg">{remaining}</span>
          <span className="mx-1.5 text-text-muted">/</span>
          <span className="font-mono text-text-secondary">{TOTAL_SPOTS}</span>
          <span className="ml-2 hidden sm:inline">{headline}</span>
          <span className="ml-2 sm:hidden">
            {locale === "it" ? "founder · 1 anno Pro gratis" : "founders · 1 year Pro free"}
          </span>
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-brand-aqua font-semibold transition-transform group-hover:translate-x-1">
          {cta}
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
