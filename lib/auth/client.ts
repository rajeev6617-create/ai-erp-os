import type { SystemRoleSlug } from "@/lib/auth/constants";

export const ACCESS_TOKEN_STORAGE_KEY = "ai_erp_access_token";

export interface ApiErrorPayload {
  message: string;
  code: string;
  details?: unknown;
  status?: number;
  requestId?: string;
  retryAfter?: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
}

export interface ClientAuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface ClientAuthOrganization {
  id: string;
  slug: string;
  name: string;
}

export interface LoginResponse {
  requiresMfa: boolean;
  mfaChallengeToken?: string;
  accessToken?: string;
  expiresIn?: number;
  user?: ClientAuthUser;
  organization?: ClientAuthOrganization;
  roles?: SystemRoleSlug[];
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
  organizationId: string;
}

export interface CurrentUserResponse {
  user: ClientAuthUser & { mfaEnabled: boolean };
  organization: ClientAuthOrganization;
  roles: SystemRoleSlug[];
  permissions: string[];
  mfaVerified: boolean;
  isSuperAdmin: boolean;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: unknown,
    public readonly requestId?: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

function apiErrorEnvelope<T>(error: ApiErrorPayload): ApiEnvelope<T> {
  return {
    success: false,
    error,
  };
}

function networkErrorEnvelope<T>(error: unknown): ApiEnvelope<T> {
  if (error instanceof DOMException && error.name === "AbortError") {
    return apiErrorEnvelope<T>({
      message: "The request timed out. Please try again.",
      code: "REQUEST_ABORTED",
    });
  }

  return apiErrorEnvelope<T>({
    message: "Network request failed. Please check your connection.",
    code: "NETWORK_ERROR",
  });
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  try {
    const envelope = (await response.json()) as ApiEnvelope<T>;
    if (envelope.success) {
      return envelope;
    }

    return apiErrorEnvelope<T>({
      message:
        envelope.error?.message ??
        `Request failed with status ${response.status}`,
      code: envelope.error?.code ?? "REQUEST_FAILED",
      details: envelope.error?.details,
      status: response.status,
      requestId,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
    });
  } catch {
    return apiErrorEnvelope<T>({
      message: response.ok
        ? "Unexpected response from API service"
        : `Request failed with status ${response.status}`,
      code: response.ok ? "INVALID_RESPONSE" : "REQUEST_FAILED",
      status: response.status,
      requestId,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
    });
  }
}

function createHeaders(options: RequestInit = {}): Headers {
  const headers = new Headers(options.headers);
  const hasFormBody = options.body instanceof FormData;
  if (!hasFormBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<Response> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: createHeaders(options),
  });

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return fetchWithAuth(path, options, false);
    }
  }

  return response;
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
  organizationSlug?: string;
  mfaCode?: string;
}): Promise<ApiEnvelope<LoginResponse>> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (error) {
    return networkErrorEnvelope<LoginResponse>(error);
  }
  const envelope = await readEnvelope<LoginResponse>(response);

  if (envelope.success && envelope.data?.accessToken) {
    setAccessToken(envelope.data.accessToken);
  }

  return envelope;
}

export async function refreshAccessToken(): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch {
    clearAccessToken();
    return null;
  }
  const envelope = await readEnvelope<RefreshResponse>(response);

  if (!envelope.success || !envelope.data?.accessToken) {
    clearAccessToken();
    return null;
  }

  setAccessToken(envelope.data.accessToken);
  return envelope.data.accessToken;
}

export async function authenticatedFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<ApiEnvelope<T>> {
  let response: Response;
  try {
    response = await fetchWithAuth(path, options, retryOnUnauthorized);
  } catch (error) {
    return networkErrorEnvelope<T>(error);
  }

  return readEnvelope<T>(response);
}

export async function downloadAuthenticatedFile(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<{ blob: Blob; fileName: string }>> {
  let response: Response;
  try {
    response = await fetchWithAuth(path, options);
  } catch (error) {
    return networkErrorEnvelope<{ blob: Blob; fileName: string }>(error);
  }

  if (!response.ok) {
    return readEnvelope<{ blob: Blob; fileName: string }>(response);
  }

  return {
    success: true,
    data: {
      blob: await response.blob(),
      fileName:
        fileNameFromDisposition(response.headers.get("Content-Disposition")) ??
        "ai-erp-export",
    },
  };
}

export function getApiErrorMessage(
  envelope: ApiEnvelope<unknown>,
  fallback = "Something went wrong. Please try again.",
): string {
  if (envelope.success) return fallback;
  if (envelope.error?.code === "RATE_LIMITED" && envelope.error.retryAfter) {
    return `Too many requests. Try again in ${envelope.error.retryAfter} seconds.`;
  }
  return envelope.error?.message ?? fallback;
}

export function toApiClientError(
  envelope: ApiEnvelope<unknown>,
  fallback = "API request failed.",
): ApiClientError {
  const error = envelope.error;
  return new ApiClientError(
    error?.message ?? fallback,
    error?.code ?? "REQUEST_FAILED",
    error?.status,
    error?.details,
    error?.requestId,
    error?.retryAfter,
  );
}

export async function getCurrentUser(): Promise<ApiEnvelope<CurrentUserResponse>> {
  return authenticatedFetch<CurrentUserResponse>("/api/auth/me");
}

export async function logoutUser(): Promise<void> {
  try {
    await authenticatedFetch("/api/auth/logout", { method: "POST" }, false);
  } finally {
    clearAccessToken();
  }
}

function fileNameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = /filename="([^"]+)"/.exec(value);
  return match?.[1] ?? null;
}
