import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { authConfig } from "@/lib/auth/config";
import type {
  AccessTokenPayload,
  MfaChallengePayload,
  RefreshTokenPayload,
} from "@/lib/auth/types";

function secret(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function parseTtlToSeconds(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return amount * (multipliers[unit] ?? 60);
}

export const accessTokenExpiresInSeconds = parseTtlToSeconds(
  authConfig.accessTokenTtl,
);

async function sign(
  payload: JWTPayload,
  signingSecret: string,
  expiresIn: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret(signingSecret));
}

export async function createAccessToken(
  payload: Omit<AccessTokenPayload, "type">,
): Promise<string> {
  return sign(
    { ...payload, type: "access" },
    authConfig.accessTokenSecret,
    authConfig.accessTokenTtl,
  );
}

export async function createRefreshTokenJwt(
  payload: Omit<RefreshTokenPayload, "type">,
): Promise<string> {
  return sign(
    { ...payload, type: "refresh" },
    authConfig.refreshTokenSecret,
    authConfig.refreshTokenTtl,
  );
}

export async function createMfaChallengeToken(
  payload: Omit<MfaChallengePayload, "type">,
): Promise<string> {
  return sign(
    { ...payload, type: "mfa_challenge" },
    authConfig.mfaChallengeSecret,
    authConfig.mfaChallengeTtl,
  );
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret(authConfig.accessTokenSecret));
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshTokenJwt(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secret(authConfig.refreshTokenSecret));
  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return payload as unknown as RefreshTokenPayload;
}

export async function verifyMfaChallengeToken(
  token: string,
): Promise<MfaChallengePayload> {
  const { payload } = await jwtVerify(
    token,
    secret(authConfig.mfaChallengeSecret),
  );
  if (payload.type !== "mfa_challenge") {
    throw new Error("Invalid token type");
  }
  return payload as unknown as MfaChallengePayload;
}

export function refreshTokenExpiresAt(): Date {
  return new Date(
    Date.now() + parseTtlToSeconds(authConfig.refreshTokenTtl) * 1000,
  );
}

export function accessTokenExpiresAt(): Date {
  return new Date(
    Date.now() + accessTokenExpiresInSeconds * 1000,
  );
}
