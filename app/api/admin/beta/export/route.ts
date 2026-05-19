/**
 * GET /api/admin/beta/export — export CSV signup beta (admin-only).
 *
 * Autenticazione: cookie sessione Supabase + RPC `is_admin()`.
 *
 * Query params:
 *   - `format=csv` (default): CSV completo email,google_email,status,referral,device_brand,created_at
 *   - `format=play_console`: solo email (priorità google_email se presente),
 *     una per riga, pronta per Play Console Closed Testing tester list
 *   - `source=signups` (default) | `waitlist`: quale tabella esportare
 *   - `status=pending|approved|activated|...`: filtra per status (solo signups)
 *
 * Risposte:
 *   200 text/csv (con Content-Disposition attachment)
 *   401 unauthorized (no sessione)
 *   403 forbidden (sessione ma non admin)
 *   500 server_error
 */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SignupRow = {
  email: string;
  google_email: string | null;
  status: string | null;
  referral: string | null;
  device_brand: string | null;
  founder_number: number | null;
  created_at: string;
};

type WaitlistRow = {
  email: string;
  locale: string;
  referral: string | null;
  created_at: string;
};

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  // 1. Auth: utente loggato?
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Auth: utente è admin?
  const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin");
  if (adminErr) {
    return new Response(
      JSON.stringify({ error: "admin_check_failed", detail: adminErr.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Parse query
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";
  const source = url.searchParams.get("source") ?? "signups";
  const statusFilter = url.searchParams.get("status");

  const admin = createAdminClient();

  // 4. Branch per tabella
  if (source === "waitlist") {
    const { data, error } = await admin
      .from("beta_waitlist")
      .select("email,locale,referral,created_at")
      .order("created_at", { ascending: true })
      .returns<WaitlistRow[]>();
    if (error) {
      return new Response(
        JSON.stringify({ error: "query_failed", detail: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    if (format === "play_console") {
      const body = (data ?? []).map((r) => r.email).join("\n");
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="fitmesh-waitlist-${todayStamp()}.txt"`,
        },
      });
    }
    const header = "email,locale,referral,created_at";
    const rows = (data ?? []).map((r) =>
      [r.email, r.locale, r.referral, r.created_at]
        .map(csvEscape)
        .join(","),
    );
    const body = [header, ...rows].join("\n");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fitmesh-waitlist-${todayStamp()}.csv"`,
      },
    });
  }

  // source === "signups"
  let query = admin
    .from("beta_signups")
    .select("email,google_email,status,referral,device_brand,founder_number,created_at")
    .order("created_at", { ascending: true });
  if (statusFilter) {
    type BetaStatus = "pending" | "approved" | "activated" | "rejected" | "expired";
    const validStatuses: BetaStatus[] = ["pending", "approved", "activated", "rejected", "expired"];
    if (validStatuses.includes(statusFilter as BetaStatus)) {
      query = query.eq("status", statusFilter as BetaStatus);
    }
  }
  const { data, error } = await query.returns<SignupRow[]>();
  if (error) {
    return new Response(
      JSON.stringify({ error: "query_failed", detail: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (format === "play_console") {
    // Play Console Closed Testing accetta una email per riga.
    // Preferiamo google_email (è quella che useranno sul device) se presente,
    // fallback a email principale. Max 100 per list per Closed Testing.
    const emails = (data ?? [])
      .map((r) => (r.google_email && r.google_email.length > 0 ? r.google_email : r.email))
      .filter((e) => e && e.includes("@"));
    const body = emails.join("\n");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="fitmesh-play-tester-list-${todayStamp()}.txt"`,
      },
    });
  }

  const header = "email,google_email,status,referral,device_brand,founder_number,created_at";
  const rows = (data ?? []).map((r) =>
    [
      r.email,
      r.google_email,
      r.status,
      r.referral,
      r.device_brand,
      r.founder_number,
      r.created_at,
    ]
      .map(csvEscape)
      .join(","),
  );
  const body = [header, ...rows].join("\n");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fitmesh-beta-signups-${todayStamp()}.csv"`,
    },
  });
}
