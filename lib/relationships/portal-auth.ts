import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { PortalAccountType } from "@/app/generated/prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";

export const PORTAL_SESSION_COOKIE = "astra_portal_session";
const PORTAL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export interface PortalAuthContext {
  account: {
    id: string;
    accountType: PortalAccountType;
    email: string;
    displayName: string;
    customerId: string | null;
    vendorId: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  sessionId: string;
}

export async function loginPortalAccount(params: {
  email: string;
  password: string;
  accountType: PortalAccountType;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ token: string; accountType: PortalAccountType }> {
  const email = params.email.trim().toLowerCase();
  const account = await prisma.portalAccount.findFirst({
    where: {
      email,
      accountType: params.accountType,
      status: "ACTIVE",
      deletedAt: null,
    },
    include: { organization: { select: { id: true } } },
  });

  if (!account || !(await verifyPassword(params.password, account.passwordHash))) {
    throw new Error("Invalid portal credentials");
  }

  const token = createPortalToken();
  const tokenHash = hashPortalToken(token);
  const expiresAt = new Date(Date.now() + PORTAL_SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.portalSession.create({
      data: {
        organizationId: account.organizationId,
        portalAccountId: account.id,
        tokenHash,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        expiresAt,
      },
    });
    await tx.portalAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });
    await writeAuditLog(
      {
        organizationId: account.organizationId,
        action: "portal.login",
        resource: "portal",
        resourceId: account.id,
        severity: "INFO",
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        after: { accountType: account.accountType, email: account.email },
        metadata: { source: "portal-auth" },
      },
      tx,
    );
  });

  return { token, accountType: account.accountType };
}

export async function getPortalAuth(
  requiredType?: PortalAccountType,
): Promise<PortalAuthContext | null> {
  const token = (await cookies()).get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.portalSession.findUnique({
    where: { tokenHash: hashPortalToken(token) },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      portalAccount: {
        select: {
          id: true,
          accountType: true,
          email: true,
          displayName: true,
          customerId: true,
          vendorId: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  if (session.portalAccount.status !== "ACTIVE" || session.portalAccount.deletedAt) return null;
  if (requiredType && session.portalAccount.accountType !== requiredType) return null;

  await prisma.portalSession.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return {
    account: {
      id: session.portalAccount.id,
      accountType: session.portalAccount.accountType,
      email: session.portalAccount.email,
      displayName: session.portalAccount.displayName,
      customerId: session.portalAccount.customerId,
      vendorId: session.portalAccount.vendorId,
    },
    organization: session.organization,
    sessionId: session.id,
  };
}

export async function requirePortalAuth(
  requiredType: PortalAccountType,
): Promise<PortalAuthContext> {
  const auth = await getPortalAuth(requiredType);
  if (auth) return auth;
  redirect(`/portal/${requiredType === "CUSTOMER" ? "customer" : "vendor"}/login`);
}

export async function revokePortalSession(params: {
  token: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  if (!params.token) return;
  const session = await prisma.portalSession.findUnique({
    where: { tokenHash: hashPortalToken(params.token) },
    include: { portalAccount: true },
  });
  if (!session || session.revokedAt) return;

  await prisma.$transaction(async (tx) => {
    await tx.portalSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    await writeAuditLog(
      {
        organizationId: session.organizationId,
        action: "portal.logout",
        resource: "portal",
        resourceId: session.portalAccountId,
        severity: "INFO",
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        after: { accountType: session.portalAccount.accountType },
        metadata: { source: "portal-auth" },
      },
      tx,
    );
  });
}

export function setPortalSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PORTAL_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearPortalSessionCookie(response: NextResponse) {
  response.cookies.set(PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function createPortalToken(): string {
  return `${randomBytes(32).toString("base64url")}.${randomUUID()}`;
}

function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
