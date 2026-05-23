import { prisma } from "@/lib/db/prisma";
import { generateSecureToken, hashToken } from "@/lib/auth/crypto";
import {
  accessTokenExpiresAt,
  accessTokenExpiresInSeconds,
  createAccessToken,
  refreshTokenExpiresAt,
} from "@/lib/auth/tokens";
import type { SystemRoleSlug } from "@/lib/auth/constants";
import type { TokenPair } from "@/lib/auth/types";

export interface CreateSessionParams {
  userId: string;
  organizationId: string;
  roles: SystemRoleSlug[];
  mfaVerified: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createSession(
  params: CreateSessionParams,
): Promise<{ sessionId: string; tokens: TokenPair; refreshToken: string }> {
  const refreshToken = generateSecureToken(48);
  const accessJti = generateSecureToken(16);

  const session = await prisma.userSession.create({
    data: {
      userId: params.userId,
      organizationId: params.organizationId,
      accessTokenHash: hashToken(accessJti),
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      mfaVerified: params.mfaVerified,
      expiresAt: accessTokenExpiresAt(),
      refreshExpiresAt: refreshTokenExpiresAt(),
    },
  });

  const accessToken = await createAccessToken({
    sub: params.userId,
    sid: session.id,
    org: params.organizationId,
    roles: params.roles,
    mfa: params.mfaVerified,
  });

  return {
    sessionId: session.id,
    refreshToken,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresInSeconds,
    },
  };
}

export async function getActiveSession(sessionId: string) {
  return prisma.userSession.findFirst({
    where: {
      id: sessionId,
      revokedAt: null,
      refreshExpiresAt: { gt: new Date() },
    },
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string,
): Promise<void> {
  await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

export async function validateRefreshToken(
  sessionId: string,
  refreshToken: string,
): Promise<boolean> {
  const session = await getActiveSession(sessionId);
  if (!session) return false;
  return session.refreshTokenHash === hashToken(refreshToken);
}

export async function touchSession(sessionId: string): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() },
  });
}

export async function rotateSessionTokens(params: {
  sessionId: string;
  userId: string;
  organizationId: string;
  roles: SystemRoleSlug[];
  mfaVerified: boolean;
}): Promise<{ tokens: TokenPair; refreshToken: string }> {
  const refreshToken = generateSecureToken(48);
  const accessJti = generateSecureToken(16);

  await prisma.userSession.update({
    where: { id: params.sessionId },
    data: {
      accessTokenHash: hashToken(accessJti),
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: accessTokenExpiresAt(),
      refreshExpiresAt: refreshTokenExpiresAt(),
      lastActivityAt: new Date(),
    },
  });

  const accessToken = await createAccessToken({
    sub: params.userId,
    sid: params.sessionId,
    org: params.organizationId,
    roles: params.roles,
    mfa: params.mfaVerified,
  });

  return {
    refreshToken,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresInSeconds,
    },
  };
}

export async function findSessionByRefreshToken(refreshToken: string) {
  return prisma.userSession.findFirst({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
      refreshExpiresAt: { gt: new Date() },
    },
  });
}
