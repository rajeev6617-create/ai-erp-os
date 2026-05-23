import { prisma } from "@/lib/db/prisma";
import { authConfig } from "@/lib/auth/config";

export interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordLoginAttempt(params: {
  email: string;
  organizationId?: string | null;
  userId?: string | null;
  success: boolean;
  failureReason?: string;
  meta?: RequestMeta;
}): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email: params.email.toLowerCase(),
      organizationId: params.organizationId ?? null,
      userId: params.userId ?? null,
      success: params.success,
      failureReason: params.failureReason ?? null,
      ipAddress: params.meta?.ipAddress ?? null,
      userAgent: params.meta?.userAgent ?? null,
    },
  });
}

export async function isLoginLocked(params: {
  email: string;
  ipAddress?: string | null;
}): Promise<{ locked: boolean; retryAfterMinutes?: number }> {
  const since = new Date(
    Date.now() - authConfig.lockoutWindowMinutes * 60 * 1000,
  );

  const [emailFailures, ipFailures] = await Promise.all([
    prisma.loginAttempt.count({
      where: {
        email: params.email.toLowerCase(),
        success: false,
        createdAt: { gte: since },
      },
    }),
    params.ipAddress
      ? prisma.loginAttempt.count({
          where: {
            ipAddress: params.ipAddress,
            success: false,
            createdAt: { gte: since },
          },
        })
      : Promise.resolve(0),
  ]);

  const failures = Math.max(emailFailures, ipFailures);
  if (failures >= authConfig.maxFailedLogins) {
    return { locked: true, retryAfterMinutes: authConfig.lockoutDurationMinutes };
  }
  return { locked: false };
}
