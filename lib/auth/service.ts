import { UserStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/auth/audit";
import { verifyPassword } from "@/lib/auth/password";
import { isLoginLocked, recordLoginAttempt } from "@/lib/auth/login-security";
import {
  assertOrganizationMembership,
  resolveUserRoles,
} from "@/lib/auth/rbac";
import {
  createSession,
  findSessionByRefreshToken,
  revokeSession,
  rotateSessionTokens,
} from "@/lib/auth/session";
import { createMfaChallengeToken } from "@/lib/auth/tokens";
import type { RequestMeta } from "@/lib/auth/login-security";
import type { AuthContext, TokenPair } from "@/lib/auth/types";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { AuthError } from "@/lib/api/errors";

export interface LoginInput {
  email: string;
  password: string;
  organizationId?: string;
  organizationSlug?: string;
  mfaCode?: string;
  meta?: RequestMeta;
}

export interface LoginResult {
  requiresMfa: boolean;
  mfaChallengeToken?: string;
  tokens?: TokenPair;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  organization?: { id: string; slug: string; name: string };
  roles?: string[];
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();

  const lock = await isLoginLocked({
    email,
    ipAddress: input.meta?.ipAddress,
  });
  if (lock.locked) {
    throw new AuthError(
      "Account temporarily locked due to failed login attempts",
      429,
      "ACCOUNT_LOCKED",
    );
  }

  const organization = await resolveOrganization(input);
  if (!organization) {
    await recordLoginAttempt({
      email,
      success: false,
      failureReason: "organization_not_found",
      meta: input.meta,
    });
    const scopedLogin = Boolean(input.organizationId || input.organizationSlug);
    throw new AuthError(
      scopedLogin ? "Organization not found" : "Invalid email or password",
      scopedLogin ? 404 : 401,
      scopedLogin ? "ORG_NOT_FOUND" : "INVALID_CREDENTIALS",
    );
  }

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (!user || !user.passwordHash) {
    await recordLoginAttempt({
      email,
      organizationId: organization.id,
      success: false,
      failureReason: "invalid_credentials",
      meta: input.meta,
    });
    throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.status !== UserStatus.ACTIVE) {
    await recordLoginAttempt({
      email,
      organizationId: organization.id,
      userId: user.id,
      success: false,
      failureReason: `user_${user.status.toLowerCase()}`,
      meta: input.meta,
    });
    throw new AuthError("Account is not active", 403, "ACCOUNT_INACTIVE");
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) {
    await recordLoginAttempt({
      email,
      organizationId: organization.id,
      userId: user.id,
      success: false,
      failureReason: "invalid_credentials",
      meta: input.meta,
    });
    throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isMember = await assertOrganizationMembership(user.id, organization.id);
  const roleCtx = await resolveUserRoles(user.id, organization.id);

  if (!isMember && !roleCtx.isSuperAdmin) {
    await recordLoginAttempt({
      email,
      organizationId: organization.id,
      userId: user.id,
      success: false,
      failureReason: "not_organization_member",
      meta: input.meta,
    });
    throw new AuthError("Not a member of this organization", 403, "FORBIDDEN");
  }

  if (user.mfaEnabled && !input.mfaCode) {
    const mfaChallengeToken = await createMfaChallengeToken({
      sub: user.id,
      org: organization.id,
    });
    return {
      requiresMfa: true,
      mfaChallengeToken,
    };
  }

  if (user.mfaEnabled && input.mfaCode) {
    // MFA-ready: verify against primary TOTP factor when configured
    const factor = await prisma.userMfaFactor.findFirst({
      where: {
        userId: user.id,
        isVerified: true,
        isPrimary: true,
        deletedAt: null,
      },
    });
    if (!factor) {
      throw new AuthError("MFA not configured", 400, "MFA_NOT_CONFIGURED");
    }
    // Production: validate TOTP via vault secret; placeholder for structure
    if (input.mfaCode.length < 6) {
      throw new AuthError("Invalid MFA code", 401, "INVALID_MFA");
    }
  }

  const { tokens, refreshToken } = await createSession({
    userId: user.id,
    organizationId: organization.id,
    roles: roleCtx.roles,
    mfaVerified: user.mfaEnabled ? Boolean(input.mfaCode) : true,
    ipAddress: input.meta?.ipAddress,
    userAgent: input.meta?.userAgent,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await recordLoginAttempt({
    email,
    organizationId: organization.id,
    userId: user.id,
    success: true,
    meta: input.meta,
  });

  await writeAuditLog({
    organizationId: organization.id,
    userId: user.id,
    action: "login",
    resource: "session",
    ipAddress: input.meta?.ipAddress,
    userAgent: input.meta?.userAgent,
    after: { method: "password" },
  });

  return {
    requiresMfa: false,
    tokens,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
    },
    roles: roleCtx.roles,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  meta?: RequestMeta,
): Promise<{ tokens: TokenPair; refreshToken: string; organizationId: string }> {
  const session = await findSessionByRefreshToken(refreshToken);
  if (!session?.organizationId) {
    throw new AuthError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  const roleCtx = await resolveUserRoles(session.userId, session.organizationId);

  const rotated = await rotateSessionTokens({
    sessionId: session.id,
    userId: session.userId,
    organizationId: session.organizationId,
    roles: roleCtx.roles,
    mfaVerified: session.mfaVerified,
  });

  await writeAuditLog({
    organizationId: session.organizationId,
    userId: session.userId,
    action: "token_refresh",
    resource: "session",
    resourceId: session.id,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return {
    ...rotated,
    organizationId: session.organizationId,
  };
}

export async function logout(
  sessionId: string,
  userId: string,
  organizationId: string,
  meta?: RequestMeta,
): Promise<void> {
  await revokeSession(sessionId);
  await writeAuditLog({
    organizationId,
    userId,
    action: "logout",
    resource: "session",
    resourceId: sessionId,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
}

export async function buildAuthContext(accessToken: string): Promise<AuthContext> {
  const payload = await verifyAccessToken(accessToken);

  const session = await prisma.userSession.findFirst({
    where: {
      id: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      refreshExpiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    throw new AuthError("Session expired or revoked", 401, "SESSION_INVALID");
  }

  if (session.organizationId !== payload.org) {
    throw new AuthError("Tenant mismatch", 403, "TENANT_MISMATCH");
  }

  const [user, organization, roleCtx] = await Promise.all([
    prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: UserStatus.ACTIVE },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mfaEnabled: true,
      },
    }),
    prisma.organization.findFirst({
      where: { id: payload.org, deletedAt: null },
      select: { id: true, slug: true, name: true },
    }),
    resolveUserRoles(payload.sub, payload.org),
  ]);

  if (!user || !organization) {
    throw new AuthError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (user.mfaEnabled && !session.mfaVerified) {
    throw new AuthError("MFA verification required", 403, "MFA_REQUIRED");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mfaEnabled: user.mfaEnabled,
    },
    organization,
    sessionId: session.id,
    roles: roleCtx.roles,
    permissions: roleCtx.permissions,
    mfaVerified: session.mfaVerified,
    isSuperAdmin: roleCtx.isSuperAdmin,
  };
}

async function resolveOrganization(input: LoginInput) {
  if (input.organizationId) {
    return prisma.organization.findFirst({
      where: { id: input.organizationId, deletedAt: null },
      select: { id: true, slug: true, name: true },
    });
  }
  if (input.organizationSlug) {
    return prisma.organization.findFirst({
      where: { slug: input.organizationSlug, deletedAt: null },
      select: { id: true, slug: true, name: true },
    });
  }

  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: {
      id: true,
      memberships: {
        where: {
          deletedAt: null,
          organization: { deletedAt: null },
        },
        orderBy: [
          { isPrimary: "desc" },
          { joinedAt: "asc" },
          { createdAt: "asc" },
        ],
        take: 1,
        select: {
          organization: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });

  const membershipOrg = user?.memberships[0]?.organization;
  if (membershipOrg) {
    return membershipOrg;
  }

  if (!user) {
    return null;
  }

  const roleAssignment = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      deletedAt: null,
      organization: { deletedAt: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      organization: {
        select: { id: true, slug: true, name: true },
      },
    },
  });

  return roleAssignment?.organization ?? null;
}
