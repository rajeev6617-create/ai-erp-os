import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection(timeoutMs = readDbHealthTimeoutMs()): Promise<{
  ok: boolean;
  latencyMs: number;
  checkedAt: string;
}> {
  const startedAt = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database health check timed out")), timeoutMs);
      }),
    ]);
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[db-health]", error);
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  }
}

function readDbHealthTimeoutMs(): number {
  const parsed = Number(process.env.DB_HEALTHCHECK_TIMEOUT_MS ?? 3000);
  return Number.isInteger(parsed) && parsed >= 500 && parsed <= 30_000 ? parsed : 3000;
}
