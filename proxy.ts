import { jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ROLE_SUPER_ADMIN,
  type SystemRoleSlug,
} from "@/lib/auth/constants";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import {
  DASHBOARD_ACCESS_ROLES,
  requiredRolesForDashboardPath,
} from "@/lib/auth/route-protection";

const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/health/db",
];

const REQUEST_ID_HEADER = "x-request-id";

const globalForRateLimit = globalThis as unknown as {
  aiErpRateLimitBuckets?: Map<string, RateLimitBucket>;
};

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RequestContext {
  requestId: string;
  startedAt: number;
}

interface VerifiedAccessPayload extends JWTPayload {
  roles?: SystemRoleSlug[];
  type?: string;
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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

function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID(),
    startedAt: Date.now(),
  };
}

function nextWithRequestId(
  request: NextRequest,
  context: RequestContext,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, context.requestId);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function finalizeResponse(
  request: NextRequest,
  response: NextResponse,
  context: RequestContext,
): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, context.requestId);
  response.headers.set("x-content-type-options", "nosniff");
  logRequest(request, response, context);
  return response;
}

function logRequest(
  request: NextRequest,
  response: NextResponse,
  context: RequestContext,
) {
  const durationMs = Date.now() - context.startedAt;
  const pathname = request.nextUrl.pathname;
  const status = response.status || 200;
  const ipAddress = getClientIp(request);

  console.info(
    JSON.stringify({
      event: "http_request",
      requestId: context.requestId,
      method: request.method,
      path: pathname,
      status,
      durationMs,
      ipAddress,
      userAgent: request.headers.get("user-agent"),
    }),
  );
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimitConfig(request: NextRequest): {
  limit: number;
  windowMs: number;
  scope: string;
} | null {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) return null;

  const windowMs = 60_000;
  if (pathname.startsWith("/api/auth/")) {
    return {
      limit: readPositiveIntEnv("API_RATE_LIMIT_AUTH_PER_MINUTE", 20),
      windowMs,
      scope: "auth",
    };
  }

  if (request.method === "GET" || request.method === "HEAD") {
    return {
      limit: readPositiveIntEnv("API_RATE_LIMIT_READS_PER_MINUTE", 300),
      windowMs,
      scope: "read",
    };
  }

  return {
    limit: readPositiveIntEnv("API_RATE_LIMIT_WRITES_PER_MINUTE", 120),
    windowMs,
    scope: "write",
  };
}

function applyRateLimit(request: NextRequest): {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
} | null {
  const config = getRateLimitConfig(request);
  if (!config) return null;

  const buckets = globalForRateLimit.aiErpRateLimitBuckets ?? new Map();
  globalForRateLimit.aiErpRateLimitBuckets = buckets;

  const now = Date.now();
  if (Math.random() < 0.01) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const key = [
    config.scope,
    getClientIp(request),
    request.nextUrl.pathname,
  ].join(":");
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      retryAfterSeconds: 0,
      resetAt: now + config.windowMs,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, config.limit - bucket.count);
  return {
    allowed: bucket.count <= config.limit,
    limit: config.limit,
    remaining,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    resetAt: bucket.resetAt,
  };
}

function rateLimitResponse(result: NonNullable<ReturnType<typeof applyRateLimit>>) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: "Too many requests",
        code: "RATE_LIMITED",
        details: {
          limit: result.limit,
          resetAt: new Date(result.resetAt).toISOString(),
        },
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}

function attachRateLimitHeaders(
  response: NextResponse,
  result: NonNullable<ReturnType<typeof applyRateLimit>> | null,
): NextResponse {
  if (!result) return response;
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return response;
}

function readPositiveIntEnv(key: string, fallback: number): number {
  const parsed = Number(process.env[key]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const context = createRequestContext(request);
  const rateLimit = applyRateLimit(request);

  if (rateLimit && !rateLimit.allowed) {
    return finalizeResponse(
      request,
      rateLimitResponse(rateLimit),
      context,
    );
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApiRoute(pathname)) {
      return finalizeResponse(
        request,
        attachRateLimitHeaders(nextWithRequestId(request, context), rateLimit),
        context,
      );
    }

    const payload = await verifyRequestAccessToken(request);
    if (!payload) {
      return finalizeResponse(
        request,
        attachRateLimitHeaders(
          NextResponse.json(
            {
              success: false,
              error: {
                message: "Unauthorized",
                code: "UNAUTHORIZED",
              },
            },
            { status: 401 },
          ),
          rateLimit,
        ),
        context,
      );
    }

    const response = attachRateLimitHeaders(
      nextWithRequestId(request, context),
      rateLimit,
    );
    response.headers.set("x-tenant-isolation", "strict");
    return finalizeResponse(request, response, context);
  }

  if (pathname === "/login") {
    const payload = await verifyRequestAccessToken(request);
    if (payload && hasAnyRole(payload.roles, DASHBOARD_ACCESS_ROLES)) {
      return finalizeResponse(
        request,
        NextResponse.redirect(new URL("/dashboard", request.url)),
        context,
      );
    }
    if (!payload && request.cookies.has(ACCESS_TOKEN_COOKIE)) {
      return finalizeResponse(
        request,
        clearAccessCookie(nextWithRequestId(request, context)),
        context,
      );
    }
    return finalizeResponse(request, nextWithRequestId(request, context), context);
  }

  if (pathname.startsWith("/dashboard")) {
    const payload = await verifyRequestAccessToken(request);
    if (!payload) {
      return finalizeResponse(
        request,
        clearAccessCookie(redirectToLogin(request)),
        context,
      );
    }

    const requiredRoles = requiredRolesForDashboardPath(pathname);
    if (!hasAnyRole(payload.roles, requiredRoles)) {
      if (pathname === "/dashboard") {
        return finalizeResponse(request, redirectToLogin(request), context);
      }
      return finalizeResponse(
        request,
        NextResponse.redirect(new URL("/dashboard", request.url)),
        context,
      );
    }
  }

  return finalizeResponse(request, nextWithRequestId(request, context), context);
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/login"],
};
