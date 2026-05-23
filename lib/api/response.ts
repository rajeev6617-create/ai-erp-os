import { NextResponse } from "next/server";
import { ForbiddenError, isApiError, isAuthError } from "@/lib/api/errors";
import { ZodError } from "zod";

export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(
  message: string,
  status: number,
  code: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { message, code, details },
    },
    { status },
  );
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
  }
  if (isAuthError(error)) {
    return jsonError(error.message, error.status, error.code);
  }
  if (isApiError(error)) {
    return jsonError(error.message, error.status, error.code, error.details);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, 403, error.code);
  }
  console.error("[api]", error);
  return jsonError("Internal server error", 500, "INTERNAL_ERROR");
}
