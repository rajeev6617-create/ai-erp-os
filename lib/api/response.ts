import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { ForbiddenError, isApiError, isAuthError } from "@/lib/api/errors";
import { ZodError } from "zod";

export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  const requestId = createRequestId();
  return NextResponse.json(
    { success: true, data },
    {
      status,
      headers: {
        "x-request-id": requestId,
      },
    },
  );
}

export function jsonError(
  message: string,
  status: number,
  code: string,
  details?: unknown,
  requestId = createRequestId(),
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { message, code, details, requestId },
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    },
  );
}

export function handleApiError(error: unknown): NextResponse {
  const requestId = createRequestId();
  if (error instanceof ZodError) {
    return jsonError(
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      error.flatten(),
      requestId,
    );
  }
  if (isJsonParseError(error)) {
    return jsonError("Invalid JSON request body", 400, "INVALID_JSON", undefined, requestId);
  }
  if (isAuthError(error)) {
    return jsonError(error.message, error.status, error.code, undefined, requestId);
  }
  if (isApiError(error)) {
    return jsonError(error.message, error.status, error.code, error.details, requestId);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, 403, error.code, undefined, requestId);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handleKnownPrismaError(error, requestId);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(`[api:${requestId}] database initialization error`, error);
    return jsonError(
      "Database connection is unavailable",
      503,
      "DATABASE_UNAVAILABLE",
      undefined,
      requestId,
    );
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.warn(`[api:${requestId}] prisma validation error`, error);
    return jsonError("Invalid database request", 400, "INVALID_DATABASE_REQUEST", undefined, requestId);
  }
  console.error(`[api:${requestId}]`, error);
  return jsonError("Internal server error", 500, "INTERNAL_ERROR", undefined, requestId);
}

function handleKnownPrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  requestId: string,
): NextResponse {
  if (error.code === "P2002") {
    return jsonError("A record with this value already exists", 409, "UNIQUE_CONSTRAINT", undefined, requestId);
  }
  if (error.code === "P2003") {
    return jsonError("Related record constraint failed", 409, "RELATION_CONSTRAINT", undefined, requestId);
  }
  if (error.code === "P2025") {
    return jsonError("Resource not found", 404, "NOT_FOUND", undefined, requestId);
  }

  console.error(`[api:${requestId}] prisma known error ${error.code}`, error);
  return jsonError("Database request failed", 500, "DATABASE_REQUEST_FAILED", undefined, requestId);
}

function isJsonParseError(error: unknown): boolean {
  return error instanceof SyntaxError && /json|unexpected/i.test(error.message);
}

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
