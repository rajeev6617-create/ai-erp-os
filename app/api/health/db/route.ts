import { checkDatabaseConnection } from "@/lib/db/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkDatabaseConnection();

  if (!health.ok) {
    return jsonError("Database health check failed", 503, "DATABASE_UNAVAILABLE", {
      latencyMs: health.latencyMs,
    });
  }

  return jsonSuccess({
    status: "ok",
    database: "reachable",
    latencyMs: health.latencyMs,
    checkedAt: health.checkedAt,
  });
}
