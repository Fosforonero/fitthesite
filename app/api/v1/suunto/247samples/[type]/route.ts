/**
 * GET /api/v1/suunto/247samples/{activity|sleep|recovery} — proxy verso la
 * Suunto 247 Data API. Vedi lib/api/suunto-proxy.ts.
 */
import { jsonError } from "@/lib/api/auth-helpers";
import { proxySuuntoGet } from "@/lib/api/suunto-proxy";

const ALLOWED = new Set(["activity", "sleep", "recovery"]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!ALLOWED.has(type)) return jsonError(404, "unknown_247_type");
  return proxySuuntoGet(
    req,
    `https://cloudapi.suunto.com/247samples/${type}`,
    ["from", "to"],
  );
}
