/**
 * GET /api/v1/suunto/workouts — proxy verso Suunto Workout API v3.
 * Vedi lib/api/suunto-proxy.ts (subscription key server-side, gated su JWT).
 */
import { proxySuuntoGet } from "@/lib/api/suunto-proxy";

export async function GET(req: Request) {
  return proxySuuntoGet(req, "https://cloudapi.suunto.com/v3/workouts", [
    "since",
    "limit",
    "offset",
  ]);
}
