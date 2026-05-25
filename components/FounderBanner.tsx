/**
 * FounderBanner — fascia sotto l'hero con counter live dei posti founder
 * rimasti, cliccabile per portare alla pagina /[locale]/beta.
 *
 * Server Component: fetch diretto della RPC `get_beta_spots_taken()` con
 * client Supabase anon. ISR via `revalidate` per non picchiare il DB ad
 * ogni request (numero non deve essere realtime).
 *
 * Se la fetch fallisce, renderizza fallback statico "100 posti" cliccabile.
 */
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const TOTAL_SPOTS = 100;
// v104: revalidate=0 (live fresh ad ogni request). Sito beta a basso traffico,
// l'utente vuole vedere il counter aggiornarsi appena qualcuno si iscrive.
// Il costo Supabase e' trascurabile (1 RPC SECURITY DEFINER lightweight).
export const revalidate = 0;

async function fetchSpotsTaken(): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const sb = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await sb.rpc("get_beta_spots_taken");
    if (error || typeof data !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

export default async function FounderBanner({ locale }: { locale: string }) {
  const taken = (await fetchSpotsTaken()) ?? 0;
  const remaining = Math.max(0, TOTAL_SPOTS - taken);
  const full = remaining === 0;

  // Copy adattiva: se pieno, riposiziona come "lista d'attesa".
  const headline = full
    ? locale === "it"
      ? "Beta esaurita — entra in lista d'attesa"
      : "Beta sold out — join the waitlist"
    : locale === "it"
      ? `Restano ${remaining} dei ${TOTAL_SPOTS} posti founder · gratis per sempre`
      : `${remaining} of ${TOTAL_SPOTS} founder seats left · free forever`;

  const cta = locale === "it" ? "Richiedi il tuo posto" : "Claim your seat";

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
            {locale === "it" ? "posti founder gratis" : "free founder spots"}
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
