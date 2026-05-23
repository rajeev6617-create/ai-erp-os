export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number = 401,
    public readonly code: string = "AUTH_ERROR",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ForbiddenError extends Error {
  constructor(
    message: string,
    public readonly code: string = "FORBIDDEN",
  ) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource conflict", code = "CONFLICT") {
    super(message, 409, code);
    this.name = "ConflictError";
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
