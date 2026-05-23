import type { SystemRoleSlug } from "@/lib/auth/constants";

export const ACCESS_TOKEN_STORAGE_KEY = "ai_erp_access_token";

export interface ApiErrorPayload {
  message: string;
  code: string;
  details?: unknown;
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

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return {
      success: false,
      error: {
        message: "Unexpected response from authentication service",
        code: "INVALID_RESPONSE",
      },
    };
  }
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
  organizationSlug?: string;
  mfaCode?: string;
}): Promise<ApiEnvelope<LoginResponse>> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const envelope = await readEnvelope<LoginResponse>(response);

  if (envelope.success && envelope.data?.accessToken) {
    setAccessToken(envelope.data.accessToken);
  }

  return envelope;
}

export async function refreshAccessToken(): Promise<string | null> {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
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
  const headers = new Headers(options.headers);
  const hasFormBody = options.body instanceof FormData;
  if (!hasFormBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return authenticatedFetch<T>(path, options, false);
    }
  }

  return readEnvelope<T>(response);
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
