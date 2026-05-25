/**
 * /[locale]/admin/beta — Lista beta_signups con stato welcome email.
 *
 * Visibile solo agli utenti con role='admin' (gated dal layout admin).
 * Server Component: fetch diretto da Supabase con session SSR cookies.
 *
 * Mostra per ogni iscritto:
 *  - email, founder_number, status (pending/approved/activated/rejected/expired)
 *  - data iscrizione + data approval
 *  - welcome_sent_at (NULL = email mai partita)
 *  - device_brand dichiarato + reason + referral
 *
 * Sezione in cima: stats aggregate (totali, pending welcome, errori).
 */
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { locales, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Beta Signups",
  robots: { index: false, follow: false },
};

type BetaSignup = {
  id: string;
  email: string;
  google_email: string | null;
  founder_number: number | null;
  status: string;
  device_brand: string | null;
  reason: string | null;
  referral: string | null;
  created_at: string;
  approved_at: string | null;
  welcome_sent_at: string | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "approved":
      return { label: "Approved", cls: "bg-brand-green/15 text-brand-green border-brand-green/30" };
    case "activated":
      return { label: "Activated", cls: "bg-brand-aqua/15 text-brand-aqua border-brand-aqua/30" };
    case "pending":
      return { label: "Pending", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" };
    case "rejected":
      return { label: "Rejected", cls: "bg-error/15 text-error border-error/30" };
    case "expired":
      return { label: "Expired", cls: "bg-text-muted/15 text-text-muted border-text-muted/30" };
    default:
      return { label: status, cls: "bg-white/5 text-text-secondary border-white/10" };
  }
}

export default async function AdminBetaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "it";

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("beta_signups")
    .select(
      "id, email, google_email, founder_number, status, device_brand, reason, referral, created_at, approved_at, welcome_sent_at",
    )
    .order("founder_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Beta Signups</h1>
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error">
          Errore caricamento: {error.message}
        </div>
      </div>
    );
  }

  const all = (rows ?? []) as BetaSignup[];
  const total = all.length;
  const approved = all.filter((r) => r.status === "approved" || r.status === "activated").length;
  const pending = all.filter((r) => r.status === "pending").length;
  const welcomeSent = all.filter((r) => r.welcome_sent_at != null).length;
  const welcomePending = all.filter(
    (r) => (r.status === "approved" || r.status === "activated") && r.welcome_sent_at == null,
  ).length;

  void lc; // currently single-locale UI

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary">Beta Signups</h1>
        <p className="mt-2 text-text-secondary text-sm">
          Lista completa iscritti beta con stato welcome email.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <Stat label="Totali" value={total} />
        <Stat label="Approved" value={approved} accent="brand-green" />
        <Stat label="Pending" value={pending} accent="yellow" />
        <Stat label="Welcome inviate" value={welcomeSent} accent="brand-aqua" />
        <Stat
          label="Welcome da inviare"
          value={welcomePending}
          accent={welcomePending > 0 ? "error" : "brand-green"}
        />
      </section>

      {welcomePending > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 mb-6 text-sm text-yellow-200">
          <strong>{welcomePending}</strong> iscritti approved senza welcome email inviata.
          Verifica: <code className="text-xs bg-bg-elevated/40 px-1.5 py-0.5 rounded">RESEND_API_KEY</code>{" "}
          env settato + dominio <code className="text-xs bg-bg-elevated/40 px-1.5 py-0.5 rounded">fitmesh.fit</code> verificato
          su Resend + cron <code className="text-xs bg-bg-elevated/40 px-1.5 py-0.5 rounded">/api/cron/beta-welcome-emails</code> in esecuzione daily.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] border-b border-white/[0.06]">
            <tr className="text-left text-text-muted">
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">#</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Welcome</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Device</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Ref</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Iscritto</th>
              <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody>
            {all.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text-muted">
                  Nessun iscritto beta.
                </td>
              </tr>
            ) : (
              all.map((r) => {
                const badge = statusBadge(r.status);
                const welcomeSent = r.welcome_sent_at != null;
                const isFounder = r.founder_number != null;
                return (
                  <tr
                    key={r.id}
                    className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                      {r.founder_number ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary font-medium">{r.email}</div>
                      {r.google_email && r.google_email !== r.email && (
                        <div className="text-[11px] text-text-muted">
                          G: {r.google_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold uppercase tracking-wider border ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {welcomeSent ? (
                        <div className="text-brand-green text-xs">
                          ✓ {fmtDate(r.welcome_sent_at)}
                        </div>
                      ) : isFounder ? (
                        <span className="text-yellow-400 text-xs">— da inviare</span>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {r.device_brand ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {r.referral ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs max-w-xs">
                      {r.reason ? (
                        <span title={r.reason}>{r.reason.slice(0, 60)}{r.reason.length > 60 ? "…" : ""}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-text-muted">
        Suggerimento: per cancellare un signup, usa Supabase dashboard → Table editor → beta_signups.
        Per forzare invio welcome ad-hoc, chiama manualmente <code>GET /api/cron/beta-welcome-emails</code> con
        bearer token <code>CRON_SECRET</code>.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "text-secondary",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  const colorMap: Record<string, string> = {
    "brand-green": "text-brand-green",
    "brand-aqua": "text-brand-aqua",
    yellow: "text-yellow-400",
    error: "text-error",
    "text-secondary": "text-text-primary",
  };
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className={`font-display text-3xl font-bold ${colorMap[accent] ?? "text-text-primary"}`}>
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-text-muted font-semibold">
        {label}
      </div>
    </div>
  );
}
