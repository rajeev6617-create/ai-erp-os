export {
  ACCESS_TOKEN_STORAGE_KEY,
  authenticatedFetch as apiFetch,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/client";
export type { ApiEnvelope, ApiErrorPayload } from "@/lib/auth/client";
