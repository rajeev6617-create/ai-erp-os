import { jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ROLE_AI_AGENT,
  ROLE_AUDITOR,
  ROLE_CFO,
  ROLE_EMPLOYEE,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
  type SystemRoleSlug,
} from "@/lib/auth/constants";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie-names";

const PUBLIC_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
];

const DASHBOARD_ROLES = [
  ROLE_SUPER_ADMIN,
  ROLE_ORG_ADMIN,
  ROLE_MANAGER,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_AUDITOR,
  ROLE_EMPLOYEE,
  ROLE_AI_AGENT,
] as const satisfies readonly SystemRoleSlug[];

const DASHBOARD_ROUTE_ROLES: Array<{
  prefix: string;
  roles: readonly SystemRoleSlug[];
}> = [
  {
    prefix: "/dashboard/finance",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_FINANCE_MANAGER,
      ROLE_AUDITOR,
    ],
  },
  {
    prefix: "/dashboard/approvals",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_FINANCE_MANAGER,
      ROLE_AUDITOR,
      ROLE_EMPLOYEE,
    ],
  },
  {
    prefix: "/dashboard/compliance",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_AUDITOR,
    ],
  },
  {
    prefix: "/dashboard/ai",
    roles: [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN, ROLE_AI_AGENT],
  },
  {
    prefix: "/dashboard/people",
    roles: [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN, ROLE_MANAGER],
  },
  {
    prefix: "/dashboard/organization",
    roles: [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN],
  },
  {
    prefix: "/dashboard/integrations",
    roles: [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN],
  },
];

interface VerifiedAccessPayload extends JWTPayload {
  roles?: SystemRoleSlug[];
  type?: string;
}

function isPublicAuthRoute(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}

function getRequestAccessToken(request: NextRequest): string | null {
  return (
    getBearerToken(request.headers.get("authorization")) ??
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ??
    null
  );
}

async function verifyRequestAccessToken(
  request: NextRequest,
): Promise<VerifiedAccessPayload | null> {
  const token = getRequestAccessToken(request);
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.type !== "access") {
      return null;
    }
    return payload as VerifiedAccessPayload;
  } catch {
    return null;
  }
}

function hasAnyRole(
  actualRoles: readonly SystemRoleSlug[] | undefined,
  requiredRoles: readonly SystemRoleSlug[],
): boolean {
  if (!actualRoles?.length) return false;
  if (actualRoles.includes(ROLE_SUPER_ADMIN)) return true;
  return requiredRoles.some((role) => actualRoles.includes(role));
}

function requiredRolesForPath(pathname: string): readonly SystemRoleSlug[] {
  return (
    DASHBOARD_ROUTE_ROLES.find(({ prefix }) => pathname.startsWith(prefix))?.roles ??
    DASHBOARD_ROLES
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/dashboard") {
    url.searchParams.set("next", request.nextUrl.pathname);
  }
  return NextResponse.redirect(url);
}

function clearAccessCookie(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (isPublicAuthRoute(pathname)) {
      return NextResponse.next();
    }

    const payload = await verifyRequestAccessToken(request);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 },
      );
    }

    const response = NextResponse.next();
    response.headers.set("x-tenant-isolation", "strict");
    return response;
  }

  if (pathname === "/login") {
    const payload = await verifyRequestAccessToken(request);
    if (payload && hasAnyRole(payload.roles, DASHBOARD_ROLES)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (!payload && request.cookies.has(ACCESS_TOKEN_COOKIE)) {
      return clearAccessCookie(NextResponse.next());
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    const payload = await verifyRequestAccessToken(request);
    if (!payload) {
      return clearAccessCookie(redirectToLogin(request));
    }

    const requiredRoles = requiredRolesForPath(pathname);
    if (!hasAnyRole(payload.roles, requiredRoles)) {
      if (pathname === "/dashboard") {
        return redirectToLogin(request);
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/login"],
};
