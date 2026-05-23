import type { SystemRoleSlug } from "@/lib/auth/constants";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  mfaEnabled: boolean;
}

export interface AuthOrganization {
  id: string;
  slug: string;
  name: string;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  org: string;
  roles: SystemRoleSlug[];
  mfa: boolean;
  type: "access";
}

export interface MfaChallengePayload {
  sub: string;
  org: string;
  sid?: string;
  type: "mfa_challenge";
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  type: "refresh";
}

export interface AuthContext {
  user: AuthUser;
  organization: AuthOrganization;
  sessionId: string;
  roles: SystemRoleSlug[];
  permissions: string[];
  mfaVerified: boolean;
  isSuperAdmin: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
